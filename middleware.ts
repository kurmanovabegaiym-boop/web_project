import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    // auth check only — no extra logic
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /login
     * - /api/auth  (NextAuth callbacks)
     * - /api/socket (Socket.io — WebSocket upgrade must pass through unmodified)
     * - /api/       (all other APIs — they do their own auth)
     * - _next static/image
     * - favicon
     */
    "/((?!login|api|_next/static|_next/image|favicon.ico).*)",
  ],
};