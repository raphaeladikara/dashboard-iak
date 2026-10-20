import "server-only";
import type { Provinsi } from "./data";
import { fmtPersen, fmtTon, fmtAngka } from "./format";

export type Insight = { judul: string; teks: string; nada: "positif" | "negatif" | "netral" };

const JAWA = ["DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Banten"];

const sum = (rows: Provinsi[], k: keyof Provinsi) => rows.reduce((a, r) => a + Number(r[k]), 0);
const by = (rows: Provinsi[], k: keyof Provinsi, dir = -1) =>
  [...rows].sort((a, b) => dir * (Number(a[k]) - Number(b[k])));

// Kalimat insight dihitung ulang dari data setiap kali filter berubah,
// jadi angkanya selalu sama dengan yang tampil di KPI dan grafik.
export function buildInsight(rows: Provinsi[], provinsi: string | null): Insight[] {
  const totalPadi = sum(rows, "produksi_padi_ton");
  const totalBeras = sum(rows, "produksi_beras_ton");
  const totalKonsumsi = sum(rows, "estimasi_konsumsi_beras_ton");
  const prodNas = (10 * totalPadi) / sum(rows, "luas_panen_ha");

  if (!provinsi) {
    const top = by(rows, "produksi_padi_ton");
    const top3 = top.slice(0, 3);
    const top3Share = (100 * sum(top3, "produksi_padi_ton")) / totalPadi;
    const jawaShare = (100 * sum(rows.filter((r) => JAWA.includes(r.provinsi)), "produksi_padi_ton")) / totalPadi;
    const prod = by(rows, "produktivitas_ku_ha");
    const sel = by(rows, "selisih_produksi_konsumsi_ton");
    const positif = rows.filter((r) => r.selisih_produksi_konsumsi_ton > 0).length;
    const luasWil = by(rows, "luas_wilayah_km2");
    const panenTerluas = by(rows, "luas_panen_ha")[0];
    return [
      {
        judul: "Produksi terpusat",
        teks: `${top3.map((r) => r.provinsi).join(", ")} menyumbang ${fmtPersen(top3Share)} produksi padi nasional. Enam provinsi di Pulau Jawa saja menyumbang ${fmtPersen(jawaShare)}.`,
        nada: "netral",
      },
      {
        judul: "Kesenjangan produktivitas",
        teks: `Produktivitas tertinggi ada di ${prod[0].provinsi} (${fmtAngka(prod[0].produktivitas_ku_ha, 2)} ku/ha), terendah di ${prod.at(-1)!.provinsi} (${fmtAngka(prod.at(-1)!.produktivitas_ku_ha, 2)} ku/ha). Rata-rata tertimbang nasional ${fmtAngka(prodNas, 2)} ku/ha.`,
        nada: "netral",
      },
      {
        judul: "Produksi vs konsumsi",
        teks: `Secara agregat, produksi beras setara ${fmtPersen((100 * totalBeras) / totalKonsumsi)} dari estimasi konsumsi penduduk. Tapi hanya ${positif} dari ${rows.length} provinsi yang produksinya melebihi estimasi konsumsinya sendiri.`,
        nada: positif >= rows.length / 2 ? "positif" : "negatif",
      },
      {
        judul: "Selisih terbesar",
        teks: `${sel[0].provinsi} punya selisih positif terbesar (+${fmtTon(sel[0].selisih_produksi_konsumsi_ton)}), sedangkan ${sel.at(-1)!.provinsi} selisih negatif terbesar (${fmtTon(sel.at(-1)!.selisih_produksi_konsumsi_ton)})${sel.at(-1)!.provinsi === "DKI Jakarta" ? ", wajar untuk wilayah perkotaan yang bergantung pada pasokan provinsi lain" : ""}. Selisih ini bukan neraca pangan resmi.`,
        nada: "netral",
      },
      {
        judul: "Luas wilayah dan luas panen",
        teks: `${luasWil[0].provinsi} adalah provinsi terluas (${fmtAngka(luasWil[0].luas_wilayah_km2)} km²), tapi luas panen padinya hanya ${fmtAngka(luasWil[0].luas_panen_ha)} ha. Bandingkan dengan ${panenTerluas.provinsi}: wilayahnya ${fmtAngka(panenTerluas.luas_wilayah_km2)} km², tapi luas panennya ${fmtAngka(panenTerluas.luas_panen_ha)} ha, terbesar di Indonesia.`,
        nada: "netral",
      },
    ];
  }

  const p = rows.find((r) => r.provinsi === provinsi)!;
  const rank = (k: keyof Provinsi) => by(rows, k).findIndex((r) => r.provinsi === provinsi) + 1;
  const rasio = (100 * p.produksi_beras_ton) / p.estimasi_konsumsi_beras_ton;
  const bedaProd = (100 * (p.produktivitas_ku_ha - prodNas)) / prodNas;
  const berasPerKapita = p.produksi_beras_ton / p.jumlah_penduduk_ribu;
  const intensitas = (100 * p.luas_panen_ha) / (p.luas_wilayah_km2 * 100);
  return [
    {
      judul: "Posisi produksi",
      teks: `${p.provinsi} berada di peringkat ${rank("produksi_padi_ton")} dari ${rows.length} provinsi untuk produksi padi (${fmtTon(p.produksi_padi_ton)}), atau ${fmtPersen((100 * p.produksi_padi_ton) / totalPadi)} dari total nasional.`,
      nada: "netral",
    },
    {
      judul: "Produktivitas",
      teks: `Produktivitas ${fmtAngka(p.produktivitas_ku_ha, 2)} ku/ha, ${bedaProd >= 0 ? "di atas" : "di bawah"} rata-rata nasional sebesar ${fmtPersen(Math.abs(bedaProd))} (peringkat ${rank("produktivitas_ku_ha")}).`,
      nada: bedaProd >= 0 ? "positif" : "negatif",
    },
    {
      judul: "Produksi vs konsumsi",
      teks: `Produksi beras setara ${fmtPersen(rasio)} dari estimasi konsumsi penduduknya, selisih ${p.selisih_produksi_konsumsi_ton >= 0 ? "+" : ""}${fmtTon(p.selisih_produksi_konsumsi_ton)}.`,
      nada: rasio >= 100 ? "positif" : "negatif",
    },
    {
      judul: "Per kapita",
      teks: `Produksi beras per penduduk ${fmtAngka(berasPerKapita, 1)} kg/jiwa/tahun, dibanding konsumsi ${fmtAngka(p.konsumsi_beras_per_kapita, 1)} kg/kapita/tahun.`,
      nada: berasPerKapita >= p.konsumsi_beras_per_kapita ? "positif" : "negatif",
    },
    {
      judul: "Intensitas lahan panen",
      teks: `Luas panen setara ${fmtPersen(intensitas)} dari luas wilayah provinsi (${fmtAngka(p.luas_panen_ha)} ha dari ${fmtAngka(p.luas_wilayah_km2)} km²).`,
      nada: "netral",
    },
  ];
}
