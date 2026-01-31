import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const protectedRoutes = ["/dashboard", "/documents", "/reports", "/audit", "/admin"];
const apiAllowList = ["/api/auth/login", "/api/auth/logout", "/api/auth/me"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isApi = pathname.startsWith("/api");
  const isApiAllowed = apiAllowList.some((route) => pathname.startsWith(route));

  if (token) {
    try {
      await verifyToken(token);
      if (pathname.startsWith("/login")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (isApi && isApiAllowed) {
        return NextResponse.next();
      }
      return NextResponse.next();
    } catch {
      const response = NextResponse.next();
      response.cookies.set("access_token", "", { path: "/", maxAge: 0 });
      if (isProtected || (isApi && !isApiAllowed)) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return response;
    }
  }

  if (isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isApi && !isApiAllowed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/documents/:path*",
    "/reports/:path*",
    "/audit/:path*",
    "/admin/:path*",
    "/login",
    "/api/:path*",
  ],
};
