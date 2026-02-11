import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { joinCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0, O, 1, I to avoid confusion
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// GET — fetch active join codes for current org
export async function GET() {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const codes = await db
        .select()
        .from(joinCodes)
        .where(and(eq(joinCodes.orgId, orgId), eq(joinCodes.isActive, true)));

    return NextResponse.json({ codes });
}

// POST — generate a new join code
export async function POST(req: Request) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the actual org name from Clerk
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({ organizationId: orgId });
    const orgName = org.name || "Store";

    const body = await req.json();
    const role = body.role === "org:admin" ? "org:admin" : "org:member";

    // Deactivate any existing codes for this org with the same role
    await db
        .update(joinCodes)
        .set({ isActive: false })
        .where(and(eq(joinCodes.orgId, orgId), eq(joinCodes.role, role)));

    const code = generateCode();

    const [newCode] = await db.insert(joinCodes).values({
        orgId,
        orgName,
        code,
        role,
        createdBy: userId,
    }).returning();

    return NextResponse.json({ code: newCode });
}

// DELETE — deactivate a join code
export async function DELETE(req: Request) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const codeId = searchParams.get("id");
    if (!codeId) {
        return NextResponse.json({ error: "Missing code ID" }, { status: 400 });
    }

    await db
        .update(joinCodes)
        .set({ isActive: false })
        .where(and(eq(joinCodes.id, codeId), eq(joinCodes.orgId, orgId)));

    return NextResponse.json({ success: true });
}
