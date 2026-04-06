import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Logged-in users visiting login/register → game
    if (token && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/game", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        // Public routes — always allow
        if (["/login", "/register"].includes(pathname)) return true;
        // Multiplayer join is public (page handles its own auth inline)
        if (pathname.startsWith("/multiplayer/join/")) return true;
        // Everything else requires a valid session
        return !!token;
      },
    },
  },
);

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
