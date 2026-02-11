import { NextResponse } from "next/server";
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

    return NextResponse.json({
        orgId: joinCode.orgId,
        orgName: joinCode.orgName,
        role: joinCode.role,
        code: joinCode.code,
    });
}
