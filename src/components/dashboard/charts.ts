import type { EChartsCoreOption } from "echarts/core";
import { fmtAngka, fmtPersen, fmtRingkas, fmtTon } from "@/lib/format";

// Builder opsi ECharts untuk enam grafik di rancangan indikator.
// Warna mengikuti token tema (terang/gelap) supaya grafik ikut berganti mode.
export type Pal = {
  font: string;
  ink: string;
  muted: string;
  line: string;
  card: string;
  brand: string;
  konsumsi: string;
  neg: string;
  lime: string;
};

export const PAL_TERANG: Omit<Pal, "font"> = {
  ink: "#0b1f18",
  muted: "#5b6b63",
  line: "#e2e6dc",
  card: "#ffffff",
  brand: "#0e7c5a",
  konsumsi: "#c98a12",
  neg: "#c2462b",
  lime: "#5cc957",
};
export const PAL_GELAP: Omit<Pal, "font"> = {
  ink: "#e8f2ec",
  muted: "#8fa69a",
  line: "#1c3329",
  card: "#0c1d17",
  brand: "#34b37f",
  konsumsi: "#e8b04a",
  neg: "#f0805f",
  lime: "#7ce577",
};

type Row = Record<string, number | string | boolean> & { provinsi: string; di_luar_peringkat?: boolean };

const fade = (hex: string, on: boolean) => (on ? hex : `${hex}55`);

function base(p: Pal): EChartsCoreOption {
  return {
    textStyle: { fontFamily: p.font, color: p.muted },
    tooltip: {
      backgroundColor: p.card,
      borderColor: p.line,
      borderWidth: 1,
      padding: [10, 12],
      textStyle: { color: p.ink, fontFamily: p.font, fontSize: 12 },
      extraCssText: "border-radius:12px;box-shadow:0 12px 32px -12px rgba(0,0,0,.25);",
    },
  };
}

const valueAxis = (p: Pal, extra: object = {}) => ({
  type: "value",
  axisLabel: { color: p.muted, formatter: (v: number) => fmtRingkas(v) },
  splitLine: { lineStyle: { color: p.line, type: "dashed" } },
  axisLine: { show: false },
  ...extra,
});

const catAxis = (p: Pal, data: string[], sel: string | null) => ({
  type: "category",
  inverse: true,
  data,
  axisTick: { show: false },
  axisLine: { lineStyle: { color: p.line } },
  axisLabel: {
    color: p.ink,
    fontSize: 11.5,
    width: 130,
    overflow: "truncate",
    formatter: (v: string) => (v === sel ? `{sel|${v}}` : v),
    rich: { sel: { fontWeight: 700, color: p.brand, fontSize: 11.5 } },
  },
});

const nameOf = (r: Row, rank?: number) => (r.di_luar_peringkat && rank ? `#${rank} ${r.provinsi}` : r.provinsi);

// Grafik 1: Top 10 produksi padi.
export function optTopProduksi(rows: Row[], sel: string | null, rank: number | undefined, p: Pal): EChartsCoreOption {
  const names = rows.map((r) => nameOf(r, rank));
  return {
    ...base(p),
    grid: { left: 8, right: 64, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      ...(base(p).tooltip as object),
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (ps: { dataIndex: number }[]) => {
        const r = rows[ps[0].dataIndex];
        return `<b>${r.provinsi}</b><br/>Produksi padi: <b>${fmtTon(Number(r.produksi_padi_ton))}</b><br/>Luas panen: ${fmtAngka(Number(r.luas_panen_ha))} ha`;
      },
    },
    xAxis: valueAxis(p),
    yAxis: catAxis(p, names, sel ? nameOf(rows.find((r) => r.provinsi === sel) ?? rows[0], rank) : null),
    series: [
      {
        type: "bar",
        barMaxWidth: 18,
        data: rows.map((r) => ({
          value: r.produksi_padi_ton,
          itemStyle: { color: fade(p.brand, !sel || r.provinsi === sel), borderRadius: [0, 6, 6, 0] },
        })),
        label: { show: true, position: "right", color: p.muted, fontSize: 11, formatter: (x: { value: number }) => fmtRingkas(x.value) },
      },
    ],
  };
}

// Grafik 2: produktivitas Top/Bottom 10, garis = rata-rata tertimbang nasional.
export function optProduktivitas(
  rows: Row[],
  sel: string | null,
  nasional: number,
  rank: number | undefined,
  p: Pal,
): EChartsCoreOption {
  const names = rows.map((r) => nameOf(r, rank));
  return {
    ...base(p),
    grid: { left: 8, right: 48, top: 24, bottom: 8, containLabel: true },
    tooltip: {
      ...(base(p).tooltip as object),
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (ps: { dataIndex: number }[]) => {
        const r = rows[ps[0].dataIndex];
        const v = Number(r.produktivitas_ku_ha);
        const d = (100 * (v - nasional)) / nasional;
        return `<b>${r.provinsi}</b><br/>Produktivitas: <b>${fmtAngka(v, 2)} ku/ha</b><br/>${d >= 0 ? "+" : ""}${fmtPersen(d)} vs nasional`;
      },
    },
    xAxis: valueAxis(p, { axisLabel: { color: p.muted }, min: 0 }),
    yAxis: catAxis(p, names, sel ? nameOf(rows.find((r) => r.provinsi === sel) ?? rows[0], rank) : null),
    series: [
      {
        type: "bar",
        barMaxWidth: 18,
        data: rows.map((r) => ({
          value: r.produktivitas_ku_ha,
          itemStyle: {
            color: fade(Number(r.produktivitas_ku_ha) >= nasional ? p.brand : p.konsumsi, !sel || r.provinsi === sel),
            borderRadius: [0, 6, 6, 0],
          },
        })),
        label: { show: true, position: "right", color: p.muted, fontSize: 11, formatter: (x: { value: number }) => fmtAngka(x.value, 1) },
        markLine: {
          symbol: "none",
          silent: true,
          lineStyle: { color: p.ink, type: "dashed", width: 1.2, opacity: 0.6 },
          label: { formatter: `Nasional ${fmtAngka(nasional, 2)}`, color: p.ink, fontSize: 11, position: "start", distance: 6 },
          data: [{ xAxis: nasional }],
        },
      },
    ],
  };
}

// Grafik 3: produksi beras vs estimasi konsumsi (grouped bar).
export function optProduksiKonsumsi(rows: Row[], sel: string | null, rank: number | undefined, p: Pal): EChartsCoreOption {
  const names = rows.map((r) => nameOf(r, rank));
  const on = (r: Row) => !sel || r.provinsi === sel;
  return {
    ...base(p),
    legend: { top: 0, left: 0, icon: "roundRect", itemWidth: 12, itemHeight: 12, textStyle: { color: p.ink, fontSize: 12 } },
    grid: { left: 8, right: 56, top: 36, bottom: 8, containLabel: true },
    tooltip: {
      ...(base(p).tooltip as object),
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (ps: { dataIndex: number }[]) => {
        const r = rows[ps[0].dataIndex];
        const b = Number(r.produksi_beras_ton);
        const k = Number(r.estimasi_konsumsi_beras_ton);
        return `<b>${r.provinsi}</b><br/>Produksi beras: <b>${fmtTon(b)}</b><br/>Estimasi konsumsi: <b>${fmtTon(k)}</b><br/>Rasio: ${fmtPersen((100 * b) / k)}`;
      },
    },
    xAxis: valueAxis(p),
    yAxis: catAxis(p, names, sel ? nameOf(rows.find((r) => r.provinsi === sel) ?? rows[0], rank) : null),
    series: [
      {
        name: "Produksi beras",
        type: "bar",
        barMaxWidth: 12,
        barGap: "20%",
        itemStyle: { color: p.brand },
        data: rows.map((r) => ({ value: r.produksi_beras_ton, itemStyle: { color: fade(p.brand, on(r)), borderRadius: [0, 4, 4, 0] } })),
      },
      {
        name: "Estimasi konsumsi",
        type: "bar",
        barMaxWidth: 12,
        itemStyle: { color: p.konsumsi },
        data: rows.map((r) => ({
          value: r.estimasi_konsumsi_beras_ton,
          itemStyle: { color: fade(p.konsumsi, on(r)), borderRadius: [0, 4, 4, 0] },
        })),
      },
    ],
  };
}

// Grafik 4: diverging bar selisih produksi − estimasi konsumsi, 38 provinsi.
export function optSelisih(rows: Row[], sel: string | null, p: Pal): EChartsCoreOption {
  const sorted = [...rows].sort((a, b) => Number(b.selisih_produksi_konsumsi_ton) - Number(a.selisih_produksi_konsumsi_ton));
  return {
    ...base(p),
    grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      ...(base(p).tooltip as object),
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (ps: { dataIndex: number }[]) => {
        const r = sorted[ps[0].dataIndex];
        const v = Number(r.selisih_produksi_konsumsi_ton);
        return `<b>${r.provinsi}</b><br/>Selisih: <b style="color:${v >= 0 ? p.brand : p.neg}">${v >= 0 ? "+" : ""}${fmtTon(v)}</b><br/>Produksi = ${fmtPersen(Number(r.rasio_persen))} dari estimasi konsumsi`;
      },
    },
    xAxis: valueAxis(p),
    yAxis: { ...catAxis(p, sorted.map((r) => r.provinsi), sel), axisLabel: { ...catAxis(p, [], sel).axisLabel, fontSize: 11 } },
    series: [
      {
        type: "bar",
        barMaxWidth: 14,
        data: sorted.map((r) => {
          const v = Number(r.selisih_produksi_konsumsi_ton);
          return {
            value: v,
            itemStyle: {
              color: fade(v >= 0 ? p.brand : p.neg, !sel || r.provinsi === sel),
              borderRadius: v >= 0 ? [0, 5, 5, 0] : [5, 0, 0, 5],
            },
          };
        }),
        markLine: { symbol: "none", silent: true, lineStyle: { color: p.ink, opacity: 0.5 }, label: { show: false }, data: [{ xAxis: 0 }] },
      },
    ],
  };
}

// Grafik 5 & 6: scatter dengan opsi skala log (rentang data sangat lebar).
export function optScatter(
  rows: Row[],
  sel: string | null,
  cfg: { x: string; y: string; xLabel: string; yLabel: string; xUnit: string; yUnit: string; log: boolean; color: string },
  p: Pal,
): EChartsCoreOption {
  const topY = new Set(
    [...rows].sort((a, b) => Number(b[cfg.y]) - Number(a[cfg.y])).slice(0, 4).map((r) => r.provinsi),
  );
  const topX = new Set(
    [...rows].sort((a, b) => Number(b[cfg.x]) - Number(a[cfg.x])).slice(0, 3).map((r) => r.provinsi),
  );
  const axis = (name: string) => ({
    type: cfg.log ? "log" : "value",
    name,
    nameLocation: "middle",
    nameGap: 32,
    nameTextStyle: { color: p.muted, fontSize: 11.5 },
    axisLabel: { color: p.muted, formatter: (v: number) => fmtRingkas(v) },
    splitLine: { lineStyle: { color: p.line, type: "dashed" } },
    axisLine: { lineStyle: { color: p.line } },
  });
  return {
    ...base(p),
    grid: { left: 16, right: 24, top: 16, bottom: 40, containLabel: true },
    tooltip: {
      ...(base(p).tooltip as object),
      trigger: "item",
      formatter: (x: { dataIndex: number }) => {
        const r = rows[x.dataIndex];
        return `<b>${r.provinsi}</b><br/>${cfg.xLabel}: <b>${fmtAngka(Number(r[cfg.x]))} ${cfg.xUnit}</b><br/>${cfg.yLabel}: <b>${fmtAngka(Number(r[cfg.y]))} ${cfg.yUnit}</b>`;
      },
    },
    xAxis: axis(`${cfg.xLabel} (${cfg.xUnit})`),
    yAxis: { ...axis(`${cfg.yLabel} (${cfg.yUnit})`), nameLocation: "end", nameGap: 12, nameTextStyle: { color: p.muted, fontSize: 11.5, align: "left" } },
    series: [
      {
        type: "scatter",
        data: rows.map((r) => {
          const isSel = r.provinsi === sel;
          const showLabel = isSel || (!sel && (topY.has(r.provinsi) || topX.has(r.provinsi)));
          return {
            value: [r[cfg.x], r[cfg.y]],
            symbolSize: isSel ? 18 : 10,
            itemStyle: {
              color: fade(cfg.color, !sel || isSel),
              borderColor: isSel ? p.ink : p.card,
              borderWidth: isSel ? 2 : 1,
            },
            label: {
              show: showLabel,
              formatter: r.provinsi,
              position: "right",
              color: isSel ? p.ink : p.muted,
              fontSize: 11,
              fontWeight: isSel ? 700 : 500,
            },
            z: isSel ? 10 : 2,
          };
        }),
        emphasis: { scale: 1.5, label: { show: true, formatter: (x: { dataIndex: number }) => rows[x.dataIndex].provinsi } },
        labelLayout: { hideOverlap: true, moveOverlap: "shiftY" },
      },
    ],
  };
}
