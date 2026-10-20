// Pengujian black-box untuk login, hak akses, dan API dashboard.
// Jalankan saat `npm run dev` menyala:  npm run uji
// Hasilnya dicetak ke terminal dan disimpan di docs/hasil-uji.md untuk laporan BAB IV.
import { mkdir, writeFile } from "node:fs/promises";
import postgres from "postgres";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const env = process.env;
const hasil = [];

async function uji(kelompok, nama, harapan, fn) {
  try {
    const { ok, aktual } = await fn();
    hasil.push({ kelompok, nama, harapan, aktual, ok });
  } catch (e) {
    hasil.push({ kelompok, nama, harapan, aktual: `error: ${e.message}`, ok: false });
  }
}

const post = (path, body, cookie) =>
  fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
    redirect: "manual",
  });
const get = (path, cookie) => fetch(BASE + path, { headers: cookie ? { cookie } : {}, redirect: "manual" });

// --- Keamanan dan hak akses (Anggota 3) ---
await uji("Akses", "Buka API tanpa login", "401", async () => {
  const r = await get("/api/kpi");
  return { ok: r.status === 401, aktual: String(r.status) };
});
await uji("Akses", "Buka dashboard tanpa login", "redirect ke /login", async () => {
  const r = await get("/");
  const loc = r.headers.get("location") ?? "";
  return { ok: r.status >= 300 && r.status < 400 && loc.includes("/login"), aktual: `${r.status} → ${loc}` };
});
await uji("Login", "Password salah", "401, pesan generik", async () => {
  const r = await post("/api/auth/login", { username: env.SEED_ADMIN_USER, password: "salah-total" });
  const b = await r.json();
  return { ok: r.status === 401 && b.error === "Username atau password salah", aktual: `${r.status} "${b.error}"` };
});
await uji("Login", "Username tidak terdaftar", "401, pesan sama dengan password salah", async () => {
  const r = await post("/api/auth/login", { username: "tidak-ada", password: "apa-saja" });
  const b = await r.json();
  return { ok: r.status === 401 && b.error === "Username atau password salah", aktual: `${r.status} "${b.error}"` };
});
await uji("Login", "SQL injection di username", "401 (tidak bisa masuk)", async () => {
  const r = await post("/api/auth/login", { username: "admin' OR '1'='1", password: "x' OR '1'='1" });
  return { ok: r.status === 401, aktual: String(r.status) };
});
await uji("Login", "Form kosong", "400", async () => {
  const r = await post("/api/auth/login", { username: "", password: "" });
  return { ok: r.status === 400, aktual: String(r.status) };
});
await uji("Login", "6× salah untuk satu username", "percobaan ke-6 diblokir (429)", async () => {
  const user = `uji-${Date.now()}`;
  let last = 0;
  for (let i = 0; i < 6; i++) last = (await post("/api/auth/login", { username: user, password: "salah" })).status;
  return { ok: last === 429, aktual: String(last) };
});
await uji("Akses", "Cookie session palsu", "401", async () => {
  const r = await get("/api/kpi", "padi_session=eyJhbGciOiJIUzI1NiJ9.e30.palsu");
  return { ok: r.status === 401, aktual: String(r.status) };
});

let cookie = "";
await uji("Login", "Login dengan akun benar", "200 + cookie httpOnly", async () => {
  const r = await post("/api/auth/login", { username: env.SEED_ADMIN_USER, password: env.SEED_ADMIN_PASSWORD });
  const set = r.headers.get("set-cookie") ?? "";
  cookie = set.split(";")[0];
  return { ok: r.status === 200 && /httponly/i.test(set), aktual: `${r.status}, httpOnly=${/httponly/i.test(set)}` };
});

// --- Fungsi dashboard (Anggota 4) ---
const endpoints = [
  "/api",
  "/api/provinsi",
  "/api/kpi",
  "/api/kpi?provinsi=Jawa%20Timur",
  "/api/chart/top-produksi",
  "/api/chart/produktivitas?urut=asc",
  "/api/chart/produksi-konsumsi?limit=15",
  "/api/chart/selisih",
  "/api/chart/scatter-panen",
  "/api/insight",
  "/api/meta",
];
for (const p of endpoints) {
  await uji("API", `GET ${decodeURIComponent(p)}`, "200 JSON", async () => {
    const r = await get(p, cookie);
    await r.json();
    return { ok: r.status === 200, aktual: String(r.status) };
  });
}
await uji("API", "Filter provinsi tidak dikenal", "400", async () => {
  const r = await get("/api/kpi?provinsi=Atlantis", cookie);
  return { ok: r.status === 400, aktual: String(r.status) };
});
await uji("Data", "Daftar provinsi", "38 provinsi", async () => {
  const b = await (await get("/api/provinsi", cookie)).json();
  return { ok: b.data.length === 38, aktual: `${b.data.length}` };
});
await uji("Data", "Grafik 4 memuat semua provinsi", "38 baris", async () => {
  const b = await (await get("/api/chart/selisih", cookie)).json();
  return { ok: b.data.length === 38, aktual: `${b.data.length}` };
});
await uji("Data", "Filter Bali di grafik 1", "Bali ikut dikirim walau di luar 10 besar", async () => {
  const b = await (await get("/api/chart/top-produksi?provinsi=Bali", cookie)).json();
  const bali = b.data.find((r) => r.provinsi === "Bali");
  return { ok: b.data.length === 11 && bali?.di_luar_peringkat === true, aktual: `${b.data.length} baris, Bali di_luar_peringkat=${bali?.di_luar_peringkat}` };
});

// KPI dari API dibandingkan dengan query langsung ke Postgres (Supabase).
const db = postgres(env.DATABASE_URL, { prepare: false, max: 1 });
const [d] = await db`
  SELECT SUM(produksi_padi_ton) padi, SUM(produksi_beras_ton) beras,
         10*SUM(produksi_padi_ton)/SUM(luas_panen_ha) prod,
         100*SUM(produksi_beras_ton)/SUM(estimasi_konsumsi_beras_ton) rasio
  FROM fakta_produksi_konsumsi_2025`;
await db.end();
const kpi = (await (await get("/api/kpi", cookie)).json()).data;
const sama = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-6 * Math.max(1, Math.abs(Number(b)));
for (const [nama, api, sql] of [
  ["Total produksi padi", kpi.produksi_padi_ton, d.padi],
  ["Total produksi beras", kpi.produksi_beras_ton, d.beras],
  ["Produktivitas nasional", kpi.produktivitas_ku_ha, d.prod],
  ["Rasio produksi/konsumsi", kpi.rasio_persen, d.rasio],
]) {
  await uji("Data", `KPI ${nama} = query SQL langsung`, "sama", async () => ({
    ok: sama(api, sql),
    aktual: `API ${Number(api).toFixed(2)} | SQL ${Number(sql).toFixed(2)}`,
  }));
}

await uji("Akses", "Logout lalu buka API", "401", async () => {
  const r = await post("/api/auth/logout", {}, cookie);
  const cleared = r.headers.get("set-cookie") ?? "";
  // Browser menghapus cookie karena Max-Age=0; di sini dicek tanpa cookie.
  const r2 = await get("/api/kpi");
  return { ok: /max-age=0/i.test(cleared) && r2.status === 401, aktual: `logout ${r.status}, lalu ${r2.status}` };
});

// --- Laporan ---
const lulus = hasil.filter((h) => h.ok).length;
const baris = hasil.map(
  (h, i) => `| ${i + 1} | ${h.kelompok} | ${h.nama} | ${h.harapan} | ${h.aktual} | ${h.ok ? "Lulus" : "**Gagal**"} |`,
);
const md = [
  "# Hasil pengujian black-box",
  "",
  `Dijalankan ${new Date().toLocaleString("id-ID")} terhadap ${BASE}. ${lulus} dari ${hasil.length} skenario lulus.`,
  "",
  "| No | Kelompok | Skenario | Hasil yang diharapkan | Hasil aktual | Status |",
  "|---|---|---|---|---|---|",
  ...baris,
  "",
].join("\n");
await mkdir(new URL("../docs/", import.meta.url), { recursive: true });
await writeFile(new URL("../docs/hasil-uji.md", import.meta.url), md);

for (const h of hasil) console.log(`${h.ok ? "✓" : "✗"} [${h.kelompok}] ${h.nama}: ${h.aktual}`);
console.log(`\n${lulus}/${hasil.length} lulus. Tabel lengkap: docs/hasil-uji.md`);
process.exit(lulus === hasil.length ? 0 : 1);
