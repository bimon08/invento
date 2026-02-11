import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "staff-session";
const SECRET = new TextEncoder().encode(
    process.env.STAFF_SESSION_SECRET || "invento-staff-secret-key-change-in-prod"
);

interface StaffSession {
    staffId: string;
    orgId: string;
    username: string;
}

/** Create a staff session cookie */
export async function createStaffSession(data: StaffSession) {
    const token = await new SignJWT(data as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(SECRET);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    });
}

/** Read the current staff session from the cookie */
export async function getStaffSession(): Promise<StaffSession | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;
        if (!token) return null;

        const { payload } = await jwtVerify(token, SECRET);
        return {
            staffId: payload.staffId as string,
            orgId: payload.orgId as string,
            username: payload.username as string,
        };
    } catch {
        return null;
    }
}

/** Clear the staff session cookie */
export async function clearStaffSession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}
