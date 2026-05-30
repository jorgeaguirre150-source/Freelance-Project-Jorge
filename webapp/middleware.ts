import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  const isAuthRoute = p.startsWith("/login") || p.startsWith("/api/login");
  const authed = req.cookies.get("fh_auth")?.value === "ok";
  if (!authed && !isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
