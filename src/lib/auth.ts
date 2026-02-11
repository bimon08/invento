import { auth } from "@clerk/nextjs/server";
import { getStaffSession } from "./staff-session";

export interface AppSession {
    orgId: string;
    isAdmin: boolean;
    // Clerk user
    userId?: string;
    // Staff member
    staffId?: string;
    staffUsername?: string;
}

/** 
 * Get the current session — checks Clerk (admin) first, then staff cookie.
 * Returns null if not authenticated.
 */
export async function getAppSession(): Promise<AppSession | null> {
    // 1. Check Clerk auth (admin)
    try {
        const { userId, orgId } = await auth();
        if (userId && orgId) {
            return { orgId, isAdmin: true, userId };
        }
    } catch {
        // Clerk not available, check staff session
    }

    // 2. Check staff session (cookie)
    const staff = await getStaffSession();
    if (staff) {
        return {
            orgId: staff.orgId,
            isAdmin: false,
            staffId: staff.staffId,
            staffUsername: staff.username,
        };
    }

    return null;
}
