import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/org-selection(.*)",
    "/join(.*)",
    "/api/join-codes/validate(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
        await auth.protect();

        const { orgId } = await auth();

        // If user has no active org and is not on the org-selection page, redirect them
        if (!orgId && !req.nextUrl.pathname.startsWith("/org-selection")) {
            const orgSelection = new URL("/org-selection", req.url);
            return NextResponse.redirect(orgSelection);
        }
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
