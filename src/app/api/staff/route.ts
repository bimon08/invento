import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { joinCodes, staffMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createStaffSession, clearStaffSession } from "@/lib/staff-session";

// GET /api/staff/members?code=CODE — list staff for a store code
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.toUpperCase();

    if (!code) {
        return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    // Validate code
    const [joinCode] = await db
        .select()
        .from(joinCodes)
        .where(and(eq(joinCodes.code, code), eq(joinCodes.isActive, true)))
        .limit(1);

    if (!joinCode) {
        return NextResponse.json({ error: "Invalid store code" }, { status: 404 });
    }

    // Check expiry
    if (joinCode.expiresAt && new Date(joinCode.expiresAt) < new Date()) {
        return NextResponse.json({ error: "This code has expired" }, { status: 410 });
    }

    // Get all staff members for this org
    const members = await db
        .select()
        .from(staffMembers)
        .where(eq(staffMembers.orgId, joinCode.orgId));

    // Fetch fresh org name from Clerk
    let orgName = joinCode.orgName;
    try {
        const client = await clerkClient();
        const org = await client.organizations.getOrganization({ organizationId: joinCode.orgId });
        if (org.name) orgName = org.name;
    } catch {
        // Fall back to stored name
    }

    return NextResponse.json({
        orgId: joinCode.orgId,
        orgName,
        members: members.map((m) => ({ id: m.id, username: m.username })),
    });
}

// POST /api/staff/login — login as existing staff or create + login
export async function POST(req: Request) {
    const body = await req.json();
    const { code, staffId, username } = body;

    if (!code) {
        return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    // Validate code
    const codeUpper = code.toUpperCase();
    const [joinCode] = await db
        .select()
        .from(joinCodes)
        .where(and(eq(joinCodes.code, codeUpper), eq(joinCodes.isActive, true)))
        .limit(1);

    if (!joinCode) {
        return NextResponse.json({ error: "Invalid store code" }, { status: 404 });
    }

    if (joinCode.expiresAt && new Date(joinCode.expiresAt) < new Date()) {
        return NextResponse.json({ error: "This code has expired" }, { status: 410 });
    }

    // Case 1: Existing staff member login
    if (staffId) {
        const [member] = await db
            .select()
            .from(staffMembers)
            .where(and(eq(staffMembers.id, staffId), eq(staffMembers.orgId, joinCode.orgId)))
            .limit(1);

        if (!member) {
            return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
        }

        await createStaffSession({
            staffId: member.id,
            orgId: member.orgId,
            username: member.username,
        });

        return NextResponse.json({ success: true, username: member.username, orgName: joinCode.orgName });
    }

    // Case 2: Create new staff member
    if (username) {
        const trimmedName = username.trim();
        if (!trimmedName || trimmedName.length < 2) {
            return NextResponse.json({ error: "Username must be at least 2 characters" }, { status: 400 });
        }

        // Check if username already exists in this org
        const [existing] = await db
            .select()
            .from(staffMembers)
            .where(and(eq(staffMembers.orgId, joinCode.orgId), eq(staffMembers.username, trimmedName)))
            .limit(1);

        if (existing) {
            return NextResponse.json({ error: "This username already exists in this store" }, { status: 409 });
        }

        // Create new staff member
        const [newMember] = await db
            .insert(staffMembers)
            .values({
                orgId: joinCode.orgId,
                username: trimmedName,
            })
            .returning();

        await createStaffSession({
            staffId: newMember.id,
            orgId: newMember.orgId,
            username: newMember.username,
        });

        return NextResponse.json({ success: true, username: newMember.username, orgName: joinCode.orgName });
    }

    return NextResponse.json({ error: "Provide staffId or username" }, { status: 400 });
}

// DELETE /api/staff/login — logout
export async function DELETE() {
    await clearStaffSession();
    return NextResponse.json({ success: true });
}
