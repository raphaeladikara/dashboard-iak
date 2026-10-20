// Menyiapkan database Supabase untuk dashboard (alternatif dari menempel
// supabase/schema.sql + seed-admin.sql di SQL Editor):
// 1. membuat tabel fakta + mengisi 38 provinsi hasil ETL,
// 2. membuat tabel users, login_audit, meta_tabel, dan mengaktifkan RLS,
// 3. membuat role Postgres khusus aplikasi dengan hak akses minimum,
// 4. membuat akun admin awal (password di-hash bcrypt).
//
// Butuh DATABASE_URL_ADMIN: connection string role `postgres` (Session pooler
// port 5432 atau Direct connection), bukan role aplikasi.
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import bcrypt from "bcryptjs";

const env = process.env;
const need = ["DATABASE_URL_ADMIN", "APP_DB_PASSWORD", "SEED_ADMIN_USER", "SEED_ADMIN_PASSWORD"];
for (const k of need) {
  if (!env[k]) throw new Error(`Variabel ${k} belum diisi di .env.local`);
}

const sql = postgres(env.DATABASE_URL_ADMIN, { prepare: false, max: 1, onnotice: () => {} });

const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const appPassword = env.APP_DB_PASSWORD.replaceAll("'", "''");
await sql.unsafe(schema.replaceAll("GANTI_PASSWORD_ROLE_APLIKASI", appPassword));
console.log("✓ Tabel fakta, users, login_audit, meta_tabel siap (RLS aktif)");
console.log("✓ Role Postgres 'iak_dashboard' dibuat (SELECT fakta, login saja)");

const hash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12);
await sql`
  INSERT INTO users (username, nama, password_hash) VALUES (${env.SEED_ADMIN_USER}, 'Administrator', ${hash})
  ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`;
console.log(`✓ Akun login '${env.SEED_ADMIN_USER}' siap (password ada di .env.local)`);

const [cek] = await sql`
  SELECT COUNT(*) AS n, COUNT(*) FILTER (WHERE produksi_padi_ton IS NULL) AS kosong
  FROM fakta_produksi_konsumsi_2025`;
console.log(`✓ Validasi: ${cek.n} provinsi, ${cek.kosong} baris produksi padi kosong`);
await sql.end();
