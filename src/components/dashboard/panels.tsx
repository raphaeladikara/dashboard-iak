"use client";

import { ArrowRight, CheckCircle2, CircleAlert, FileJson, FileSpreadsheet, FileText, Server, Workflow } from "lucide-react";
import { fmtAngka } from "@/lib/format";

export function Section({
  id,
  eyebrow,
  title,
  desc,
  action,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">{title}</h2>
          {desc && <p className="mt-1 max-w-2xl text-sm text-muted">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ChartCard({
  no,
  title,
  question,
  note,
  action,
  loading,
  children,
}: {
  no: number;
  title: string;
  question: string;
  note?: string;
  action?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-line bg-card p-5 shadow-sm">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink">
            <span className="grid size-6 shrink-0 place-content-center rounded-md bg-brand-soft text-[11px] font-bold text-brand-strong">
              {no}
            </span>
            {title}
          </h3>
          <p className="mt-1 text-[13px] text-muted">{question}</p>
        </div>
        {action}
      </header>
      <div className={`relative flex-1 transition-opacity ${loading ? "opacity-60" : ""}`}>{children}</div>
      {note && <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">{note}</p>}
    </article>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { v: T; l: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 rounded-lg bg-card-soft p-0.5 ring-1 ring-line">
      {options.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
            value === o.v ? "bg-card text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export type Insight = { judul: string; teks: string; nada: "positif" | "negatif" | "netral" };

export function InsightPanel({ items }: { items: Insight[] | null }) {
  if (!items) return <div className="skeleton h-48 rounded-2xl" />;
  const dot = { positif: "bg-brand", negatif: "bg-neg", netral: "bg-konsumsi" };
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((it, i) => (
        <div key={it.judul} className="rise rounded-2xl border border-line bg-card p-5 shadow-sm" style={{ animationDelay: `${i * 50}ms` }}>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <span className={`size-2 rounded-full ${dot[it.nada]}`} />
            {it.judul}
          </p>
          <p className="mt-2.5 text-sm leading-relaxed text-ink">{it.teks}</p>
        </div>
      ))}
    </div>
  );
}

export type Meta = {
  sumber: { id: string; format: string; nama: string; penerbit: string; kolom: string[]; etl: string }[];
  gabung: string;
  tabel: string;
  diperbarui: string | null;
  validasi: { jumlah_baris: number; provinsi_unik: number; baris_kosong: number; deviasi_padi_persen: number };
};

const FORMAT_STYLE: Record<string, { cls: string; Icon: typeof FileText }> = {
  CSV: { cls: "bg-[#e3f3ea] text-[#0a5e44] dark:bg-[#123528] dark:text-[#7ce577]", Icon: FileText },
  XLSX: { cls: "bg-[#e4efe0] text-[#2f6b1f] dark:bg-[#1d3317] dark:text-[#a6e08f]", Icon: FileSpreadsheet },
  JSON: { cls: "bg-[#fbf0d9] text-[#8a5a00] dark:bg-[#33280f] dark:text-[#e8b04a]", Icon: FileJson },
};

export function SumberPanel({ meta }: { meta: Meta | null }) {
  if (!meta) return <div className="skeleton h-72 rounded-2xl" />;
  const v = meta.validasi;
  const checks = [
    { ok: v.jumlah_baris === 38, t: `${v.jumlah_baris} baris provinsi (target 38)` },
    { ok: v.provinsi_unik === v.jumlah_baris, t: `${v.provinsi_unik} nama provinsi unik, tanpa duplikasi kunci` },
    { ok: v.baris_kosong === 0, t: `${v.baris_kosong} baris dengan variabel wajib kosong` },
    { ok: v.deviasi_padi_persen < 1, t: `Produksi padi ≈ luas panen × produktivitas (selisih maks ${fmtAngka(v.deviasi_padi_persen, 2)}%)` },
  ];
  const formats = [...new Set(meta.sumber.map((s) => s.format))];

  return (
    <div className="space-y-4">
      {/* Alur integrasi data-level: sumber → ETL → database → API → dashboard */}
      <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
        <ol className="flex flex-col items-stretch gap-2 text-sm xl:flex-row xl:items-center">
          {[
            { Icon: FileSpreadsheet, t: "5 file sumber", s: formats.join(" · ") },
            { Icon: Workflow, t: "ETL Pentaho", s: "filter, cleaning, merge join, calculator" },
            { Icon: Server, t: "PostgreSQL (Supabase)", s: meta.tabel },
            { Icon: Server, t: "REST API", s: "/api/kpi, /api/chart/*, /api/insight" },
            { Icon: CheckCircle2, t: "Dashboard", s: "login + visualisasi" },
          ].map((s, i, arr) => (
            <li key={s.t} className="flex min-w-0 items-center gap-2 xl:flex-1">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-card-soft px-3.5 py-3 ring-1 ring-line">
                <s.Icon className="size-4 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{s.t}</p>
                  <p className="truncate text-xs text-muted" title={s.s}>
                    {s.s}
                  </p>
                </div>
              </div>
              {i < arr.length - 1 && <ArrowRight className="hidden size-4 shrink-0 text-muted xl:block" />}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
          {meta.sumber.map((s) => {
            const f = FORMAT_STYLE[s.format] ?? FORMAT_STYLE.CSV;
            return (
              <div key={s.id} className="rounded-2xl border border-line bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted">{s.id}</span>
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${f.cls}`}>
                    <f.Icon className="size-3" />
                    {s.format}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-snug text-ink">{s.nama}</p>
                <p className="mt-1 text-xs text-muted">{s.penerbit}</p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  <span className="font-semibold text-ink/80">ETL:</span> {s.etl}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.kolom.map((k) => (
                    <code key={k} className="rounded bg-card-soft px-1.5 py-0.5 text-[11px] text-ink/80 ring-1 ring-line">
                      {k}
                    </code>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
            <h3 className="text-sm font-bold text-ink">Validasi hasil ETL</h3>
            <p className="mt-0.5 text-xs text-muted">Dicek langsung ke database setiap halaman dimuat</p>
            <ul className="mt-4 space-y-2.5">
              {checks.map((c) => (
                <li key={c.t} className="flex gap-2.5 text-sm text-ink">
                  {c.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                  ) : (
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-neg" />
                  )}
                  {c.t}
                </li>
              ))}
            </ul>
            {meta.diperbarui && (
              <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
                Tabel terakhir dimuat:{" "}
                {new Date(meta.diperbarui).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-line bg-card-soft p-5 text-xs leading-relaxed text-muted">
            <h3 className="mb-2 text-sm font-bold text-ink">Batasan analisis</h3>
            <ul className="list-disc space-y-1.5 pl-4">
              <li>Data satu tahun (2025): perbandingan antarprovinsi, bukan tren.</li>
              <li>Estimasi konsumsi = konsumsi per kapita × penduduk; bukan neraca pangan resmi.</li>
              <li>Selisih tidak memperhitungkan perdagangan antarprovinsi, stok, dan susut.</li>
              <li>Scatter menunjukkan hubungan, bukan sebab-akibat.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
