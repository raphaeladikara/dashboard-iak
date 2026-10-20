// Cek keamanan database Supabase (read-only): role yang dipakai aplikasi,
// RLS, policy, dan grant ke role publik Supabase. Jalankan: npm run cek
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

// Cek koneksi dulu: kalau password salah, berhenti di sini. Supabase memblokir
// sementara koneksi baru setelah beberapa kali gagal autentikasi.
try {
  await sql`SELECT 1`;
} catch (e) {
  console.error("Gagal konek ke database:", e.message);
  await sql.end();
  process.exit(1);
}

const q = async (label, s) => {
  console.log(`\n## ${label}`);
  try {
    console.table(await sql.unsafe(s));
  } catch (e) {
    console.log("error:", e.message);
  }
};

await q("Role koneksi aplikasi", "SELECT current_user, session_user");
await q(
  "Tabel public + RLS",
  `SELECT c.relname AS tabel, c.relrowsecurity AS rls
   FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 1`,
);
await q("Policy", "SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY 1, 2");
await q(
  "Grant ke anon / authenticated / iak_dashboard",
  `SELECT table_name, grantee, string_agg(privilege_type, ',' ORDER BY privilege_type) AS hak
   FROM information_schema.role_table_grants
   WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'iak_dashboard')
   GROUP BY 1, 2 ORDER BY 1, 2`,
);
await q(
  "Grant kolom ke iak_dashboard",
  `SELECT table_name, privilege_type, string_agg(column_name, ',') AS kolom
   FROM information_schema.column_privileges
   WHERE table_schema = 'public' AND grantee = 'iak_dashboard'
   GROUP BY 1, 2 ORDER BY 1, 2`,
);
await q("Role", "SELECT rolname, rolcanlogin, rolbypassrls, rolsuper FROM pg_roles WHERE rolname IN ('iak_dashboard', 'postgres')");
await q(
  "Isi tabel",
  `SELECT (SELECT COUNT(*) FROM fakta_produksi_konsumsi_2025) AS fakta,
          (SELECT COUNT(*) FROM users) AS users,
          (SELECT COUNT(*) FROM login_audit) AS audit,
          (SELECT string_agg(username || ' (' || left(password_hash, 4) || ')', ', ') FROM users) AS akun`,
);
await sql.end();
