import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// We define which routes require the user to be logged in.
// (.*) means "/dashboard" and anything inside it, like "/dashboard/projects"
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    // If the user tries to access a protected route, the Bouncer forces them to sign in
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files (images, css, etc.)
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run the Bouncer for API and tRPC routes
        '/(api|trpc)(.*)',
    ],
};