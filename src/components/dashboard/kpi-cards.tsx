"use client";

import { Gauge, Scale, ShoppingBasket, Sprout, Wheat, type LucideIcon } from "lucide-react";
import { fmtAngka, fmtPersen } from "@/lib/format";

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
export type KpiResp = {
  cakupan: string;
  data: Kpi;
  nasional: Kpi;
  peringkat?: { produksi_padi_ton: number; produksi_beras_ton: number; produktivitas_ku_ha: number };
};

// Angka besar dipecah jadi nilai + satuan supaya kartu tetap terbaca di layar kecil.
function besar(ton: number): [string, string] {
  if (ton >= 1e6) return [fmtAngka(ton / 1e6, 2), "juta ton"];
  if (ton >= 1e3) return [fmtAngka(ton / 1e3, 1), "ribu ton"];
  return [fmtAngka(ton), "ton"];
}

function Card({
  Icon,
  label,
  value,
  unit,
  sub,
  tone = "brand",
  children,
  delay,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  sub: React.ReactNode;
  tone?: "brand" | "konsumsi" | "neg";
  children?: React.ReactNode;
  delay: number;
}) {
  const chip = {
    brand: "bg-brand-soft text-brand-strong",
    konsumsi: "bg-konsumsi-soft text-konsumsi",
    neg: "bg-neg-soft text-neg",
  }[tone];
  return (
    <div
      className="rise group flex flex-col rounded-2xl border border-line bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2.5">
        <span className={`grid size-9 place-content-center rounded-xl ${chip}`}>
          <Icon className="size-[18px]" />
        </span>
        <h3 className="text-[13px] font-semibold leading-tight text-muted">{label}</h3>
      </div>
      <p className="num mt-4 flex items-baseline gap-1.5">
        <span className="text-[1.75rem] font-extrabold leading-none tracking-tight text-ink">{value}</span>
        <span className="text-sm font-medium text-muted">{unit}</span>
      </p>
      <div className="mt-2 text-xs leading-relaxed text-muted">{sub}</div>
      {children}
    </div>
  );
}

const Rank = ({ n }: { n?: number }) =>
  n ? <span className="rounded-md bg-card-soft px-1.5 py-0.5 font-semibold text-ink ring-1 ring-line">#{n} dari 38</span> : null;

export function KpiCards({ kpi }: { kpi: KpiResp | null }) {
  if (!kpi) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-[150px] rounded-2xl" />
        ))}
      </div>
    );
  }
  const { data: d, nasional: n, peringkat: r } = kpi;
  const prov = kpi.cakupan !== "nasional";
  const share = (a: number, b: number) => fmtPersen((100 * a) / b);
  const [padiV, padiU] = besar(d.produksi_padi_ton);
  const [berasV, berasU] = besar(d.produksi_beras_ton);
  const [konsV, konsU] = besar(d.estimasi_konsumsi_ton);
  const bedaProd = (100 * (d.produktivitas_ku_ha - n.produktivitas_ku_ha)) / n.produktivitas_ku_ha;
  const surplus = d.rasio_persen >= 100;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Card
        delay={0}
        Icon={Wheat}
        label="Total produksi padi"
        value={padiV}
        unit={padiU}
        sub={
          prov ? (
            <span className="flex flex-wrap items-center gap-1.5">
              <Rank n={r?.produksi_padi_ton} /> {share(d.produksi_padi_ton, n.produksi_padi_ton)} nasional
            </span>
          ) : (
            <>Gabah kering giling, {d.jumlah_provinsi} provinsi</>
          )
        }
      />
      <Card
        delay={50}
        Icon={ShoppingBasket}
        label="Total produksi beras"
        value={berasV}
        unit={berasU}
        sub={
          prov ? (
            <span className="flex flex-wrap items-center gap-1.5">
              <Rank n={r?.produksi_beras_ton} /> {fmtAngka(d.beras_per_kapita_kg, 1)} kg/jiwa
            </span>
          ) : (
            <>Setara {fmtAngka(d.beras_per_kapita_kg, 1)} kg per penduduk</>
          )
        }
      />
      <Card
        delay={100}
        Icon={Gauge}
        label="Produktivitas padi"
        value={fmtAngka(d.produktivitas_ku_ha, 2)}
        unit="ku/ha"
        tone={prov && bedaProd < 0 ? "konsumsi" : "brand"}
        sub={
          prov ? (
            <span className="flex flex-wrap items-center gap-1.5">
              <Rank n={r?.produktivitas_ku_ha} />
              <span className={bedaProd >= 0 ? "font-semibold text-brand" : "font-semibold text-konsumsi"}>
                {bedaProd >= 0 ? "▲" : "▼"} {fmtPersen(Math.abs(bedaProd))}
              </span>
              vs nasional
            </span>
          ) : (
            <>Rata-rata tertimbang: 10 × Σpadi ÷ Σluas panen</>
          )
        }
      />
      <Card
        delay={150}
        Icon={Sprout}
        label="Estimasi konsumsi beras"
        value={konsV}
        unit={konsU}
        tone="konsumsi"
        sub={
          <>
            {fmtAngka(d.penduduk_ribu >= 1000 ? d.penduduk_ribu / 1000 : d.penduduk_ribu, 1)}{" "}
            {d.penduduk_ribu >= 1000 ? "juta" : "ribu"} jiwa × konsumsi per kapita
          </>
        }
      />
      <Card
        delay={200}
        Icon={Scale}
        label="Rasio produksi / konsumsi"
        value={fmtAngka(d.rasio_persen, 1)}
        unit="%"
        tone={surplus ? "brand" : "neg"}
        sub={
          prov ? (
            <>{surplus ? "Produksi melebihi estimasi konsumsi" : "Produksi di bawah estimasi konsumsi"}</>
          ) : (
            <>
              {d.provinsi_selisih_positif} dari {d.jumlah_provinsi} provinsi di atas 100%
            </>
          )
        }
      >
        <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-card-soft ring-1 ring-line">
          <div
            className={`h-full rounded-full ${surplus ? "bg-brand" : "bg-neg"} transition-[width] duration-700`}
            style={{ width: `${Math.min(d.rasio_persen, 200) / 2}%` }}
          />
          <span className="absolute inset-y-0 left-1/2 w-px bg-ink/50" title="100%" />
        </div>
      </Card>
    </div>
  );
}
