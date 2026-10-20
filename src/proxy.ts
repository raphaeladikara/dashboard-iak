import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";

// Gerbang akses (controlled interface): semua halaman dan API selain login
// hanya bisa dibuka dengan session yang valid.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = pathname === "/login";
  const isAuthApi = pathname.startsWith("/api/auth/");

  if (session && isLogin) return NextResponse.redirect(new URL("/", request.url));
  if (session || isLogin || isAuthApi) return NextResponse.next();

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const url = new URL("/login", request.url);
  if (pathname !== "/") url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico|webp)$).*)"],
};
