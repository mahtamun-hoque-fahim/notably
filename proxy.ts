import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/api/auth", "/demo"];
const PUBLIC_EXACT = ["/"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  const sessionToken =
    req.cookies.get("better-auth.session_token")?.value ??
    req.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
