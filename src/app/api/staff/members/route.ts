import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { staffMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/staff/members — list all staff members for the current org
export async function GET() {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const members = await db
        .select()
        .from(staffMembers)
        .where(eq(staffMembers.orgId, orgId))
        .orderBy(staffMembers.createdAt);

    return NextResponse.json({
        members: members.map((m) => ({
            id: m.id,
            username: m.username,
            createdAt: m.createdAt,
        })),
    });
}

// DELETE /api/staff/members?id=STAFF_ID — remove a staff member
export async function DELETE(req: Request) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("id");
    if (!staffId) {
        return NextResponse.json({ error: "Missing staff member ID" }, { status: 400 });
    }

    // Only allow deleting staff from current org
    const deleted = await db
        .delete(staffMembers)
        .where(and(eq(staffMembers.id, staffId), eq(staffMembers.orgId, orgId)))
        .returning();

    if (deleted.length === 0) {
        return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
