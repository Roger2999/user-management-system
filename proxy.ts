import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const publicRoutes = ["/signin", "/"];

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
  // `/api/reports/import` queda fuera a propósito: el proxy clona el cuerpo
  // para que el middleware pueda leerlo y lo corta en 10 MB por defecto
  // (`experimental.proxyClientMaxBodySize`). Un `access.log` real pesa cientos
  // de MB, y el corte cae en un chunk distinto en cada subida, así que el
  // SHA-256 cambia y la idempotencia falla. La ruta ya valida sesión y rol.
  matcher: [
    "/((?!api/auth|api/reports/import|_next/static|_next/image|.*\\.png$).*)",
  ],
};
