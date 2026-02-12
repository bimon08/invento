/**
 * Cross-tab auth synchronization using BroadcastChannel.
 * Works across all browser tabs AND standalone PWA windows (same origin).
 */

const CHANNEL_NAME = "invento-auth-sync";

export type AuthEvent = {
    type: "login" | "logout";
    timestamp: number;
};

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
    if (typeof window === "undefined") return null;
    if (!("BroadcastChannel" in window)) return null;

    if (!channel) {
        channel = new BroadcastChannel(CHANNEL_NAME);
    }
    return channel;
}

/** Broadcast that the user just logged in (staff or admin) */
export function broadcastLogin() {
    const ch = getChannel();
    if (ch) {
        const event: AuthEvent = { type: "login", timestamp: Date.now() };
        ch.postMessage(event);
    }
}

/** Broadcast that the user just logged out */
export function broadcastLogout() {
    const ch = getChannel();
    if (ch) {
        const event: AuthEvent = { type: "logout", timestamp: Date.now() };
        ch.postMessage(event);
    }
}

/** Listen for auth events from other tabs/PWA windows */
export function onAuthEvent(callback: (event: AuthEvent) => void): () => void {
    const ch = getChannel();
    if (!ch) return () => { };

    const handler = (e: MessageEvent<AuthEvent>) => {
        callback(e.data);
    };

    ch.addEventListener("message", handler);

    return () => {
        ch.removeEventListener("message", handler);
    };
}
