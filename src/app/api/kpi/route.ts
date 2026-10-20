import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { kpi, rankOf, validProvinsi } from "@/lib/data";

// GET /api/kpi?provinsi=Jawa%20Timur
// Mengembalikan KPI untuk provinsi terpilih + KPI nasional sebagai pembanding.
export async function GET(request: NextRequest) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const raw = request.nextUrl.searchParams.get("provinsi");
  const provinsi = await validProvinsi(raw);
  if (raw && !provinsi) return NextResponse.json({ error: "Provinsi tidak dikenal" }, { status: 400 });

  const nasional = await kpi(null);
  if (!provinsi) return NextResponse.json({ cakupan: "nasional", data: nasional, nasional });

  const [data, rankPadi, rankBeras, rankProd] = await Promise.all([
    kpi(provinsi),
    rankOf(provinsi, "produksi_padi_ton"),
    rankOf(provinsi, "produksi_beras_ton"),
    rankOf(provinsi, "produktivitas_ku_ha"),
  ]);
  return NextResponse.json({
    cakupan: provinsi,
    data,
    nasional,
    peringkat: { produksi_padi_ton: rankPadi, produksi_beras_ton: rankBeras, produktivitas_ku_ha: rankProd },
  });
}
