import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Development bypass with access authorization key

  console.log("authHeader", req.headers.get("authorization"));
  console.log("accessKey", req.headers.get("x-access-key"));
  console.log(
    "process.env.ACCESS_AUTHORIZATION_KEY",
    process.env.ACCESS_AUTHORIZATION_KEY
  );
  console.log("process.env.NODE_ENV", process.env.NODE_ENV);

  if (
    process.env.NODE_ENV === "development" &&
    process.env.ACCESS_AUTHORIZATION_KEY
  ) {
    const authHeader = req.headers.get("authorization");
    const accessKey = req.headers.get("x-access-key");

    // Check if the request has the development access key
    if (
      authHeader === `Bearer ${process.env.ACCESS_AUTHORIZATION_KEY}` ||
      accessKey === process.env.ACCESS_AUTHORIZATION_KEY
    ) {
      return; // Allow the request to pass through without Clerk auth
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
