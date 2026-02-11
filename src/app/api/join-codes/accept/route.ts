import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { joinCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST — accept an invite code and join the org
export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    const body = await req.json();
    const code = body.code?.toUpperCase();

    if (!code) {
        return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    // Validate the code
    const [joinCode] = await db
        .select()
        .from(joinCodes)
        .where(and(eq(joinCodes.code, code), eq(joinCodes.isActive, true)))
        .limit(1);

    if (!joinCode) {
        return NextResponse.json({ error: "Invalid or expired invite code" }, { status: 404 });
    }

    if (joinCode.expiresAt && new Date(joinCode.expiresAt) < new Date()) {
        return NextResponse.json({ error: "This invite code has expired" }, { status: 410 });
    }

    try {
        const clerk = await clerkClient();

        // Check if user is already a member
        const memberships = await clerk.organizations.getOrganizationMembershipList({
            organizationId: joinCode.orgId,
        });

        const alreadyMember = memberships.data.some(
            (m) => m.publicUserData?.userId === userId
        );

        if (alreadyMember) {
            return NextResponse.json({
                success: true,
                orgId: joinCode.orgId,
                message: "You're already a member of this store",
            });
        }

        // Add user to the organization
        await clerk.organizations.createOrganizationMembership({
            organizationId: joinCode.orgId,
            userId,
            role: joinCode.role,
        });

        return NextResponse.json({
            success: true,
            orgId: joinCode.orgId,
            message: `You've joined ${joinCode.orgName}!`,
        });
    } catch (err: unknown) {
        console.error("Failed to add member:", err);
        return NextResponse.json(
            { error: "Failed to join store. Please try again." },
            { status: 500 }
        );
    }
}
