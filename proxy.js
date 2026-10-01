import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// First gate only: redirects anonymous visitors and keeps students out of /admin.
// Every page and API route re-checks the user against the database.
const STUDENT_PATHS = ["/dashboard", "/roadmap", "/courses", "/lessons", "/tasks", "/achievements", "/assistant", "/notifications", "/profile", "/announcements"];

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL(session.role === "ADMIN" ? "/admin" : "/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isStudentPath = STUDENT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if ((isAdminPath || isStudentPath) && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (isAdminPath && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/dashboard/:path*",
    "/roadmap/:path*",
    "/courses/:path*",
    "/lessons/:path*",
    "/tasks/:path*",
    "/achievements/:path*",
    "/assistant/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/announcements/:path*",
  ],
};
