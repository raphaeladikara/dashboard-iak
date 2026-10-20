import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { allRows, ranked, validProvinsi } from "@/lib/data";

// Satu endpoint per grafik (sesuai rancangan indikator):
//   /api/chart/top-produksi            grafik 1, bar horizontal Top 10 produksi padi
//   /api/chart/produktivitas?urut=asc  grafik 2, Top/Bottom 10 produktivitas
//   /api/chart/produksi-konsumsi       grafik 3, grouped bar produksi beras vs estimasi konsumsi
//   /api/chart/selisih                 grafik 4, diverging bar 38 provinsi
//   /api/chart/scatter-panen           grafik 5, luas panen vs produksi padi
//   /api/chart/scatter-wilayah         grafik 6, luas wilayah vs luas panen
export async function GET(request: NextRequest, { params }: { params: Promise<{ nama: string }> }) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;

  const { nama } = await params;
  const q = request.nextUrl.searchParams;
  const raw = q.get("provinsi");
  const provinsi = await validProvinsi(raw);
  if (raw && !provinsi) return NextResponse.json({ error: "Provinsi tidak dikenal" }, { status: 400 });
  const limit = Math.min(Math.max(Number(q.get("limit") ?? 10) || 10, 3), 38);

  switch (nama) {
    case "top-produksi":
      return NextResponse.json({
        data: await ranked("produksi_padi_ton", "desc", limit, provinsi, ["produksi_padi_ton", "luas_panen_ha"]),
      });
    case "produktivitas": {
      const urut = q.get("urut") === "asc" ? "asc" : "desc";
      return NextResponse.json({
        urut,
        data: await ranked("produktivitas_ku_ha", urut, limit, provinsi, ["produktivitas_ku_ha"]),
      });
    }
    case "produksi-konsumsi":
      return NextResponse.json({
        data: await ranked("produksi_beras_ton", "desc", limit, provinsi, [
          "produksi_beras_ton",
          "estimasi_konsumsi_beras_ton",
          "jumlah_penduduk_ribu",
        ]),
      });
    case "selisih": {
      const rows = await allRows();
      return NextResponse.json({
        data: rows
          .map((r) => ({
            provinsi: r.provinsi,
            selisih_produksi_konsumsi_ton: r.selisih_produksi_konsumsi_ton,
            rasio_persen: (100 * r.produksi_beras_ton) / r.estimasi_konsumsi_beras_ton,
          }))
          .sort((a, b) => a.selisih_produksi_konsumsi_ton - b.selisih_produksi_konsumsi_ton),
      });
    }
    case "scatter-panen":
    case "scatter-wilayah": {
      const rows = await allRows();
      return NextResponse.json({
        data: rows.map((r) => ({
          provinsi: r.provinsi,
          luas_panen_ha: r.luas_panen_ha,
          produksi_padi_ton: r.produksi_padi_ton,
          produktivitas_ku_ha: r.produktivitas_ku_ha,
          luas_wilayah_km2: r.luas_wilayah_km2,
        })),
      });
    }
    default:
      return NextResponse.json({ error: "Grafik tidak dikenal" }, { status: 404 });
  }
}
