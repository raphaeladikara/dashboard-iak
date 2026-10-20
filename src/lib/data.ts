import "server-only";
import { sql } from "./db";

// Lapisan business logic: semua indikator dihitung di sini dari tabel fakta
// hasil ETL Pentaho. Dashboard hanya menerima JSON lewat route /api/*.
export const TABLE = "fakta_produksi_konsumsi_2025";
const T = sql(TABLE);

export type Provinsi = {
  provinsi: string;
  luas_panen_ha: number;
  produktivitas_ku_ha: number;
  produksi_padi_ton: number;
  produksi_beras_ton: number;
  luas_wilayah_km2: number;
  jumlah_penduduk_ribu: number;
  konsumsi_beras_per_kapita: number;
  estimasi_konsumsi_beras_ton: number;
  selisih_produksi_konsumsi_ton: number;
};

export async function listProvinsi(): Promise<string[]> {
  const rows = await sql<{ provinsi: string }[]>`SELECT provinsi FROM ${T} ORDER BY provinsi`;
  return rows.map((r) => r.provinsi);
}

// Nama provinsi dari query string hanya diterima kalau ada di tabel.
export async function validProvinsi(input: string | null): Promise<string | null> {
  if (!input) return null;
  const all = await listProvinsi();
  return all.includes(input) ? input : null;
}

export async function allRows(): Promise<Provinsi[]> {
  return sql<Provinsi[]>`SELECT * FROM ${T} ORDER BY provinsi`;
}

export type Kpi = {
  produksi_padi_ton: number;
  produksi_beras_ton: number;
  produktivitas_ku_ha: number;
  estimasi_konsumsi_ton: number;
  rasio_persen: number;
  luas_panen_ha: number;
  penduduk_ribu: number;
  beras_per_kapita_kg: number;
  jumlah_provinsi: number;
  provinsi_selisih_positif: number;
};

export async function kpi(provinsi: string | null): Promise<Kpi> {
  const [r] = await sql<Record<string, number | string | null>[]>`
    SELECT
      SUM(produksi_padi_ton)                                   AS padi,
      SUM(produksi_beras_ton)                                  AS beras,
      10 * SUM(produksi_padi_ton) / SUM(luas_panen_ha)         AS produktivitas,
      SUM(estimasi_konsumsi_beras_ton)                         AS konsumsi,
      100 * SUM(produksi_beras_ton) / SUM(estimasi_konsumsi_beras_ton) AS rasio,
      SUM(luas_panen_ha)                                       AS luas_panen,
      SUM(jumlah_penduduk_ribu)                                AS penduduk,
      SUM(produksi_beras_ton) / SUM(jumlah_penduduk_ribu)      AS beras_per_kapita,
      COUNT(*)                                                 AS n,
      COUNT(*) FILTER (WHERE selisih_produksi_konsumsi_ton > 0) AS n_positif
    FROM ${T}
    WHERE (${provinsi}::text IS NULL OR provinsi = ${provinsi})`;
  const n = (v: unknown) => Number(v ?? 0);
  return {
    produksi_padi_ton: n(r.padi),
    produksi_beras_ton: n(r.beras),
    produktivitas_ku_ha: n(r.produktivitas),
    estimasi_konsumsi_ton: n(r.konsumsi),
    rasio_persen: n(r.rasio),
    luas_panen_ha: n(r.luas_panen),
    penduduk_ribu: n(r.penduduk),
    beras_per_kapita_kg: n(r.beras_per_kapita),
    jumlah_provinsi: n(r.n),
    provinsi_selisih_positif: n(r.n_positif),
  };
}

const RANKABLE = {
  produksi_padi_ton: "produksi_padi_ton",
  produksi_beras_ton: "produksi_beras_ton",
  produktivitas_ku_ha: "produktivitas_ku_ha",
  selisih_produksi_konsumsi_ton: "selisih_produksi_konsumsi_ton",
} as const;
export type RankKey = keyof typeof RANKABLE;

// Peringkat 1..38 untuk provinsi terpilih (dipakai KPI & insight).
export async function rankOf(provinsi: string, key: RankKey): Promise<number> {
  const col = sql(RANKABLE[key]);
  const [r] = await sql<{ peringkat: number }[]>`
    SELECT 1 + COUNT(*) AS peringkat FROM ${T}
    WHERE ${col} > (SELECT ${col} FROM ${T} WHERE provinsi = ${provinsi})`;
  return Number(r.peringkat);
}

// Top/bottom N menurut satu kolom. Provinsi terpilih yang tidak masuk N
// tetap ikut dikirim (ditandai) supaya bisa di-highlight di grafik.
export async function ranked(
  key: RankKey,
  order: "desc" | "asc",
  limit: number,
  provinsi: string | null,
  columns: (keyof Provinsi)[],
) {
  const col = sql(RANKABLE[key]);
  const cols = sql(["provinsi", ...columns.filter((c) => c !== "provinsi")]);
  const dir = order === "asc" ? sql`ASC` : sql`DESC`;
  const rows = await sql<Partial<Provinsi>[]>`
    SELECT ${cols} FROM ${T} ORDER BY ${col} ${dir} LIMIT ${limit}`;
  const out = rows.map((r) => ({ ...r, di_luar_peringkat: false }));
  if (provinsi && !out.some((r) => r.provinsi === provinsi)) {
    const [extra] = await sql<Partial<Provinsi>[]>`SELECT ${cols} FROM ${T} WHERE provinsi = ${provinsi}`;
    if (extra) out.push({ ...extra, di_luar_peringkat: true });
  }
  return out;
}

export async function tableMeta() {
  const [t] = await sql<{ dibuat: Date | null; diperbarui: Date | null }[]>`
    SELECT dibuat, diperbarui FROM meta_tabel WHERE nama = ${TABLE}`;
  const [v] = await sql<Record<string, number | string>[]>`
    SELECT COUNT(*) AS n,
           COUNT(DISTINCT provinsi) AS unik,
           COUNT(*) FILTER (WHERE produksi_padi_ton IS NULL OR produksi_beras_ton IS NULL
               OR luas_panen_ha IS NULL OR jumlah_penduduk_ribu IS NULL
               OR konsumsi_beras_per_kapita IS NULL) AS baris_kosong,
           MAX(ABS(produksi_padi_ton - luas_panen_ha * produktivitas_ku_ha / 10) / produksi_padi_ton) * 100 AS deviasi_maks
    FROM ${T}`;
  return {
    tabel: TABLE,
    dibuat: t?.dibuat ?? null,
    diperbarui: t?.diperbarui ?? t?.dibuat ?? null,
    validasi: {
      jumlah_baris: Number(v.n),
      provinsi_unik: Number(v.unik),
      baris_kosong: Number(v.baris_kosong),
      deviasi_padi_persen: Number(v.deviasi_maks),
    },
  };
}
