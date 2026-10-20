import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken, type Session } from "./session";

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
