import { SignJWT, jwtVerify } from "jose";

// Session disimpan sebagai JWT bertanda tangan di cookie httpOnly.
// File ini dipakai oleh proxy.ts dan route handler, jadi tanpa import server-only.
export const SESSION_COOKIE = "padi_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 jam

export type Session = { uid: number; username: string; nama: string };

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET belum diisi (minimal 32 karakter) di .env.local");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(s: Session) {
  return new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

export async function readSessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.uid !== "number" || typeof payload.username !== "string") return null;
    return { uid: payload.uid, username: payload.username, nama: String(payload.nama ?? payload.username) };
  } catch {
    return null;
  }
}
