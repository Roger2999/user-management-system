import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const publicRoutes = ["/signin", "/signup", "/"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = path.startsWith("/dashboard");
  const isPublicRoute = publicRoutes.includes(path);

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/signin", req.nextUrl));
  }

  if (
    isPublicRoute &&
    session &&
    !req.nextUrl.pathname.startsWith("/dashboard")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|.*\\.png$).*)"],
};
