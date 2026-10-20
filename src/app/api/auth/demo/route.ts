import { NextResponse, type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { audit, clientIp, withSessionCookie } from "@/lib/auth";

// Login demo tanpa password, supaya penguji bisa langsung membuka dashboard.
// Akun `demo` punya hash dari string acak, jadi tidak bisa dibuka lewat form
// login. Login demo mati otomatis kalau baris akun `demo` dihapus dari tabel users.
export async function POST(request: NextRequest) {
  const [user] = await sql<{ id: number; nama: string }[]>`
    SELECT id, nama FROM users WHERE username = 'demo' LIMIT 1`;
  if (!user) {
    return NextResponse.json({ error: "Akun demo sedang tidak tersedia" }, { status: 404 });
  }

  await audit("demo", true, clientIp(request), "demo");
  await sql`UPDATE users SET last_login_at = now() WHERE id = ${user.id}`;

  const res = NextResponse.json({ ok: true, nama: user.nama });
  return withSessionCookie(res, { uid: user.id, username: "demo", nama: user.nama });
}
