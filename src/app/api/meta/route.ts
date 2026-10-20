import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { tableMeta } from "@/lib/data";

// Asal-usul data: lima file sumber, format, dan langkah ETL yang dilakukan
// Pentaho sebelum data masuk ke tabel fakta (data-level EAI).
const SUMBER = [
  {
    id: "D1",
    format: "CSV",
    nama: "Luas Panen, Produktivitas, dan Produksi Padi Menurut Provinsi, 2025",
    penerbit: "BPS",
    kolom: ["luas_panen_ha", "produktivitas_ku_ha", "produksi_padi_ton"],
    etl: "CSV file input → filter baris total/keterangan → sort",
  },
  {
    id: "D2",
    format: "XLSX",
    nama: "Produksi Padi dan Beras Menurut Provinsi, 2025",
    penerbit: "BPS",
    kolom: ["produksi_beras_ton"],
    etl: "Excel input → filter → select values → sort",
  },
  {
    id: "D3",
    format: "XLSX",
    nama: "Luas Daerah dan Jumlah Pulau Menurut Provinsi, 2025",
    penerbit: "BPS",
    kolom: ["luas_wilayah_km2"],
    etl: "Excel input → filter → replace 'Papua Barat Daya1' → teks ke angka",
  },
  {
    id: "D4",
    format: "JSON",
    nama: "Data Penduduk Menurut Provinsi, 2025",
    penerbit: "BPS (dikonversi ke JSON)",
    kolom: ["jumlah_penduduk_ribu"],
    etl: "JSON input → sort",
  },
  {
    id: "D5",
    format: "XLSX",
    nama: "Konsumsi Pangan Menurut Provinsi (2018–2025)",
    penerbit: "Bapanas",
    kolom: ["konsumsi_beras_per_kapita"],
    etl: "Excel input → filter Tahun = 2025 & Komoditas = Beras → trim nama provinsi",
  },
];

export async function GET() {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;
  return NextResponse.json({
    sumber: SUMBER,
    gabung: "Merge join ×4 dengan kunci nama provinsi → Calculator (estimasi konsumsi, selisih) → Table output",
    ...(await tableMeta()),
  });
}
