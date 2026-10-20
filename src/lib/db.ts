import "server-only";
import postgres from "postgres";

// Satu pool koneksi ke Postgres Supabase (connection pooling, lapisan data
// pada arsitektur three-tier). Disimpan di globalThis supaya hot reload saat
// `next dev` tidak membuka pool baru terus-menerus.
//
// DATABASE_URL memakai Supavisor mode transaction (port 6543), cocok untuk
// fungsi serverless Vercel. Mode itu tidak mendukung prepared statement,
// jadi `prepare: false`.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL ?? "", {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 1 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
