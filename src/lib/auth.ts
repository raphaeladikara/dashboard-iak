import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, readSessionToken, type Session } from "./session";
import { sql } from "./db";

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
}

// Dipanggil di setiap route API: proxy.ts sudah memfilter, tapi pengecekan
// diulang di sini supaya data tidak pernah keluar tanpa session yang valid.
export async function requireSession(): Promise<Session | NextResponse> {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  return s;
}

// Cookie session yang sama untuk login, registrasi, dan login demo.
export async function withSessionCookie(res: NextResponse, s: Session) {
  res.cookies.set(SESSION_COOKIE, await createSessionToken(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

// IP pengirim (Vercel mengisi x-forwarded-for), dipotong sesuai kolom login_audit.
export function clientIp(request: Request) {
  return (request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local").slice(0, 64);
}

// Jejak audit: login, daftar, atau demo. Audit gagal tidak boleh menggagalkan request.
export async function audit(username: string, berhasil: boolean, ip: string, jenis: "login" | "daftar" | "demo") {
  try {
    await sql`INSERT INTO login_audit (username, berhasil, ip, jenis)
              VALUES (${username.slice(0, 50)}, ${berhasil}, ${ip}, ${jenis})`;
  } catch {}
}
