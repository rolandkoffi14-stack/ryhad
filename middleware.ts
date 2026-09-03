import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // Protection des routes API privées du CRM (/api/crm/*)
  if (pathname.startsWith("/api/crm")) {
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, message: "Accès refusé : session authentifiée requise." },
        { status: 401 }
      );
    }
  }

  // Protection des pages d'interface CRM (/crm/*)
  if (pathname.startsWith("/crm")) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/crm/:path*", "/api/crm/:path*"],
};
