import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { audit, clientIp, withSessionCookie } from "@/lib/auth";

// Registrasi akun baru. Setelah berhasil, pengguna langsung masuk.
// Batas: 3 akun baru per IP per jam supaya tabel users tidak dibanjiri bot.
const MAX_DAFTAR_PER_JAM = 3;
const USERNAME = /^[a-z0-9_.]{3,30}$/;

export async function POST(request: NextRequest) {
  let body: { nama?: unknown; username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid" }, { status: 400 });
  }
  const nama = typeof body.nama === "string" ? body.nama.trim().replace(/\s+/g, " ") : "";
  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const salah: Record<string, string> = {};
  if (nama.length < 2 || nama.length > 100) salah.nama = "Nama 2–100 karakter";
  if (!USERNAME.test(username)) salah.username = "3–30 karakter: huruf kecil, angka, titik, atau garis bawah";
  if (password.length < 8 || password.length > 200) salah.password = "Password minimal 8 karakter";
  else if (password.toLowerCase().includes(username)) salah.password = "Password jangan memuat username";
  if (Object.keys(salah).length) {
    return NextResponse.json({ error: "Periksa lagi isian formulir", fields: salah }, { status: 400 });
  }

  const ip = clientIp(request);
  const [r] = await sql<{ n: string }[]>`
    SELECT COUNT(*) AS n FROM login_audit
    WHERE jenis = 'daftar' AND berhasil AND ip = ${ip} AND waktu > now() - interval '1 hour'`;
  if (Number(r?.n ?? 0) >= MAX_DAFTAR_PER_JAM) {
    return NextResponse.json({ error: "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti." }, { status: 429 });
  }

  const hash = await bcrypt.hash(password, 12);
  const [user] = await sql<{ id: number }[]>`
    INSERT INTO users (username, nama, password_hash) VALUES (${username}, ${nama}, ${hash})
    ON CONFLICT DO NOTHING
    RETURNING id`;
  if (!user) {
    await audit(username, false, ip, "daftar");
    return NextResponse.json(
      { error: "Username sudah dipakai", fields: { username: "Username sudah dipakai, coba yang lain" } },
      { status: 409 },
    );
  }

  await audit(username, true, ip, "daftar");
  const res = NextResponse.json({ ok: true, nama }, { status: 201 });
  return withSessionCookie(res, { uid: user.id, username, nama });
}
