import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/org-selection(.*)",
    "/join(.*)",
    "/staff-login(.*)",
    "/api/join-codes/validate(.*)",
    "/api/staff(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // Check for staff session cookie first
    const staffToken = req.cookies.get("staff-session")?.value;
    if (staffToken) {
        // Staff has a session cookie — let them through
        return NextResponse.next();
    }

    // Otherwise require Clerk auth (admin)
    try {
        await auth.protect();
    } catch {
        // Not authenticated — redirect to sign-in
        const signIn = new URL("/sign-in", req.url);
        return NextResponse.redirect(signIn);
    }

    const { orgId } = await auth();

    // If user has no active org and is not on the org-selection page, redirect them
    if (!orgId && !req.nextUrl.pathname.startsWith("/org-selection")) {
        const orgSelection = new URL("/org-selection", req.url);
        return NextResponse.redirect(orgSelection);
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
