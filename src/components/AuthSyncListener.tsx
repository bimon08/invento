"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthEvent } from "@/lib/auth-sync";

/**
 * Listens for login/logout events from other tabs or PWA windows.
 * On login  → refreshes the current page (server components re-run, pick up the new cookie).
 * On logout → navigates to /sign-in.
 */
export function AuthSyncListener() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthEvent((event) => {
            if (event.type === "login") {
                // Another tab logged in — reload so server components pick up the session cookie
                window.location.reload();
            } else if (event.type === "logout") {
                // Another tab logged out — send to sign-in
                window.location.href = "/sign-in";
            }
        });

        return unsubscribe;
    }, [router]);

    return null;
}
