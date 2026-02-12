import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { joinCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET — validate a join code (public route, no auth needed)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.toUpperCase();

    if (!code) {
        return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const [joinCode] = await db
        .select()
        .from(joinCodes)
        .where(and(eq(joinCodes.code, code), eq(joinCodes.isActive, true)))
        .limit(1);

    if (!joinCode) {
        return NextResponse.json({ error: "Invalid or expired invite code" }, { status: 404 });
    }

    // Check expiry if set
    if (joinCode.expiresAt && new Date(joinCode.expiresAt) < new Date()) {
        return NextResponse.json({ error: "This invite code has expired" }, { status: 410 });
    }

    // Fetch fresh org name from Clerk (the stored one may be stale/slug)
    let orgName = joinCode.orgName;
    try {
        const client = await clerkClient();
        const org = await client.organizations.getOrganization({ organizationId: joinCode.orgId });
        if (org.name) {
            orgName = org.name;
        }
    } catch {
        // Fall back to stored name
    }

    return NextResponse.json({
        orgId: joinCode.orgId,
        orgName,
        role: joinCode.role,
        code: joinCode.code,
    });
}

