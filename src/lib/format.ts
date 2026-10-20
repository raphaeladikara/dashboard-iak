// Format angka gaya Indonesia (titik ribuan, koma desimal).
const nf = (d: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: d, minimumFractionDigits: 0 });

export const fmtAngka = (v: number, d = 0) => nf(d).format(v);

export function fmtTon(v: number) {
  const a = Math.abs(v);
  if (a >= 1e6) return `${nf(2).format(v / 1e6)} juta ton`;
  if (a >= 1e3) return `${nf(1).format(v / 1e3)} ribu ton`;
  return `${nf(0).format(v)} ton`;
}

export function fmtPersen(v: number, d = 1) {
  if (v !== 0 && Math.abs(v) < 0.01) return "<0,01%";
  return `${nf(Math.abs(v) < 1 ? 2 : d).format(v)}%`;
}

// Label ringkas untuk sumbu grafik.
export function fmtRingkas(v: number) {
  const a = Math.abs(v);
  if (a >= 1e6) return `${nf(1).format(v / 1e6)} jt`;
  if (a >= 1e3) return `${nf(0).format(v / 1e3)} rb`;
  return nf(0).format(v);
}
