import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Visit /logout in the browser to clear a stuck session (e.g. when /login keeps redirecting to a broken page).
export function GET(request) {
  const res = NextResponse.redirect(new URL("/login", request.url));
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
