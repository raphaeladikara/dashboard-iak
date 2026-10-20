import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/session";

// Hash palsu: dipakai saat username tidak ada supaya waktu respons tetap mirip
// dan penyerang tidak bisa menebak username mana yang terdaftar.
const DUMMY_HASH = bcrypt.hashSync("hash-pengganti-tidak-dipakai", 12);

// Batas percobaan gagal: 5 kali per 10 menit untuk kombinasi IP + username.
// Dihitung dari tabel login_audit (bukan memori) karena di Vercel setiap
// request bisa dilayani instance serverless yang berbeda.
const WINDOW_MENIT = 10;
const MAX_FAIL = 5;

async function recentFailures(username: string, ip: string) {
  const [r] = await sql<{ n: string }[]>`
    SELECT COUNT(*) AS n FROM login_audit
    WHERE username = ${username} AND ip = ${ip} AND NOT berhasil
      AND waktu > now() - make_interval(mins => ${WINDOW_MENIT})
      AND waktu > COALESCE((SELECT MAX(waktu) FROM login_audit
                            WHERE username = ${username} AND ip = ${ip} AND berhasil), '-infinity')`;
  return Number(r?.n ?? 0);
}

async function audit(username: string, berhasil: boolean, ip: string) {
  try {
    await sql`INSERT INTO login_audit (username, berhasil, ip) VALUES (${username}, ${berhasil}, ${ip})`;
  } catch {
    // Audit gagal tidak boleh menggagalkan login.
  }
}

export async function POST(request: NextRequest) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid" }, { status: 400 });
  }
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password || username.length > 50 || password.length > 200) {
    return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
  }

  const ip = (request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local").slice(0, 64);
  const auditUser = username.toLowerCase();
  if ((await recentFailures(auditUser, ip)) >= MAX_FAIL) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan gagal. Coba lagi dalam 10 menit." },
      { status: 429 },
    );
  }

  const rows = await sql<{ id: number; nama: string; password_hash: string }[]>`
    SELECT id, nama, password_hash FROM users WHERE username = ${username} LIMIT 1`;
  const user = rows[0];
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !ok) {
    await audit(auditUser, false, ip);
    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  }

  await audit(auditUser, true, ip);
  await sql`UPDATE users SET last_login_at = now() WHERE id = ${user.id}`;

  const token = await createSessionToken({ uid: user.id, username, nama: user.nama });
  const res = NextResponse.json({ ok: true, nama: user.nama });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
