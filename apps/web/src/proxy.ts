import { NextRequest, NextResponse } from "next/server";

// Must NOT import anything that uses Node.js modules (fs, crypto, etc.)
// Edge runtime only supports Web APIs.
const SESSION_COOKIE = "tlk_session";
const PUBLIC_PATHS = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE)?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // No session → redirect to /login (unless already on public page)
  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Has session → redirect away from login/register
  if (session && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect all routes except Next.js internals and static files
    "/((?!api|_next/static|_next/image|favicon.ico|logotlk\\.png).*)",
  ],
};
