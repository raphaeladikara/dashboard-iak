import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";

// Katalog layanan API dashboard. Pembagiannya mengikuti materi Application
// Interface-level: business service (logika/perhitungan), data service (akses
// data), dan tipe interface "controlled" (wajib login, hanya baca).
const LAYANAN = [
  { method: "POST", path: "/api/auth/login", jenis: "business service", fungsi: "Memeriksa username dan password, lalu membuat session" },
  { method: "POST", path: "/api/auth/logout", jenis: "business service", fungsi: "Menghapus session" },
  { method: "GET", path: "/api/provinsi", jenis: "data service", fungsi: "Daftar 38 provinsi untuk filter" },
  { method: "GET", path: "/api/kpi?provinsi=", jenis: "business service", fungsi: "Menghitung 5 KPI, pembanding nasional, dan peringkat" },
  { method: "GET", path: "/api/chart/top-produksi", jenis: "data service", fungsi: "Data grafik 1" },
  { method: "GET", path: "/api/chart/produktivitas?urut=desc|asc", jenis: "data service", fungsi: "Data grafik 2" },
  { method: "GET", path: "/api/chart/produksi-konsumsi", jenis: "data service", fungsi: "Data grafik 3" },
  { method: "GET", path: "/api/chart/selisih", jenis: "data service", fungsi: "Data grafik 4" },
  { method: "GET", path: "/api/chart/scatter-panen", jenis: "data service", fungsi: "Data grafik 5 dan 6" },
  { method: "GET", path: "/api/insight?provinsi=", jenis: "business service", fungsi: "Menyusun kalimat insight dari data" },
  { method: "GET", path: "/api/meta", jenis: "data service", fungsi: "Sumber data, langkah ETL, dan validasi tabel" },
];

export async function GET() {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;
  return NextResponse.json({
    nama: "API Dashboard Padi 2025",
    arsitektur: "three-tier: UI (Next.js) → API (route handler) → data (PostgreSQL Supabase)",
    tipe_interface: "controlled: semua layanan selain login wajib session, dan hanya bisa membaca data",
    format: "JSON",
    layanan: LAYANAN,
  });
}
