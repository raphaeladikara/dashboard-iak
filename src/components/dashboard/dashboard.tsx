"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Menu, Moon, RefreshCw, RotateCcw, Sun } from "lucide-react";
import { useApi } from "./use-api";
import { Sidebar } from "./sidebar";
import { ProvinceSelect } from "./province-select";
import { KpiCards, type KpiResp } from "./kpi-cards";
import { ChartCard, InsightPanel, Section, Segmented, SumberPanel, type Insight, type Meta } from "./panels";
import { EChart } from "./echart";
import {
  PAL_GELAP,
  PAL_TERANG,
  optProduksiKonsumsi,
  optProduktivitas,
  optScatter,
  optSelisih,
  optTopProduksi,
  type Pal,
} from "./charts";

type Rows = { data: (Record<string, number | string | boolean> & { provinsi: string })[] };

// Mode gelap dibaca dari class <html> (dipasang skrip di layout sebelum render).
function subscribeTheme(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

function useTheme() {
  const dark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("tema", next ? "gelap" : "terang");
    } catch {}
  };
  return { dark, toggle };
}

export function Dashboard({ nama, awal }: { nama: string; awal: string | null }) {
  const [provinsi, setProvinsi] = useState<string | null>(awal);
  const [urutProd, setUrutProd] = useState<"desc" | "asc">("desc");
  const [skala, setSkala] = useState<"log" | "linear">("log");
  const [menu, setMenu] = useState(false);
  // Naik setiap tombol "Ambil ulang" ditekan; ikut dikirim ke API supaya semua data diminta lagi dari database.
  const [versi, setVersi] = useState(0);
  const { dark, toggle } = useTheme();
  const router = useRouter();

  // Simpan filter di URL supaya tampilan bisa dibagikan / di-refresh.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (provinsi) url.searchParams.set("provinsi", provinsi);
    else url.searchParams.delete("provinsi");
    window.history.replaceState(null, "", url);
  }, [provinsi]);

  const v = versi ? String(versi) : null;
  const prov = { provinsi, v };
  const daftar = useApi<{ data: string[] }>("/api/provinsi", { v });
  const kpi = useApi<KpiResp>("/api/kpi", prov);
  const top = useApi<Rows>("/api/chart/top-produksi", prov);
  const prodv = useApi<Rows>("/api/chart/produktivitas", { ...prov, urut: urutProd });
  const pk = useApi<Rows>("/api/chart/produksi-konsumsi", { ...prov, limit: "15" });
  const sel = useApi<Rows>("/api/chart/selisih", { v });
  const sc = useApi<Rows>("/api/chart/scatter-panen", { v });
  const insight = useApi<{ data: Insight[] }>("/api/insight", prov);
  const meta = useApi<Meta>("/api/meta", { v });

  // Opsi grafik hanya dibangun di browser (setelah data datang), jadi aman membaca font dari DOM.
  const pal: Pal = useMemo(
    () => ({
      ...(dark ? PAL_GELAP : PAL_TERANG),
      font: typeof document === "undefined" ? "sans-serif" : getComputedStyle(document.body).fontFamily,
    }),
    [dark],
  );
  const rank = kpi.data?.peringkat;
  const nasProd = kpi.data?.nasional.produktivitas_ku_ha ?? 0;
  // Peringkat produktivitas dari bawah, untuk label saat mode Bottom 10.
  const rankProd = rank && urutProd === "asc" ? 39 - rank.produktivitas_ku_ha : rank?.produktivitas_ku_ha;

  const o1 = useMemo(() => top.data && optTopProduksi(top.data.data, provinsi, rank?.produksi_padi_ton, pal), [top.data, provinsi, rank, pal]);
  const o2 = useMemo(
    () => prodv.data && nasProd > 0 && optProduktivitas(prodv.data.data, provinsi, nasProd, rankProd, pal),
    [prodv.data, provinsi, nasProd, rankProd, pal],
  );
  const o3 = useMemo(() => pk.data && optProduksiKonsumsi(pk.data.data, provinsi, rank?.produksi_beras_ton, pal), [pk.data, provinsi, rank, pal]);
  const o4 = useMemo(() => sel.data && optSelisih(sel.data.data, provinsi, pal), [sel.data, provinsi, pal]);
  const o5 = useMemo(
    () =>
      sc.data &&
      optScatter(
        sc.data.data,
        provinsi,
        { x: "luas_panen_ha", y: "produksi_padi_ton", xLabel: "Luas panen", yLabel: "Produksi padi", xUnit: "ha", yUnit: "ton", log: skala === "log", color: pal.brand },
        pal,
      ),
    [sc.data, provinsi, skala, pal],
  );
  const o6 = useMemo(
    () =>
      sc.data &&
      optScatter(
        sc.data.data,
        provinsi,
        { x: "luas_wilayah_km2", y: "luas_panen_ha", xLabel: "Luas wilayah", yLabel: "Luas panen", xUnit: "km²", yUnit: "ha", log: skala === "log", color: pal.konsumsi },
        pal,
      ),
    [sc.data, provinsi, skala, pal],
  );

  const semua = [daftar, kpi, top, prodv, pk, sel, sc, insight, meta];
  const errors = semua.map((x) => x.error).filter(Boolean);
  const memuat = semua.some((x) => x.loading);
  const diperbarui = meta.data?.diperbarui
    ? new Date(meta.data.diperbarui).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
    : null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const skeleton = (h: number) => <div className="skeleton rounded-xl" style={{ height: h }} />;

  return (
    <div className="flex min-h-dvh">
      <Sidebar nama={nama} mobileOpen={menu} onMobileClose={() => setMenu(false)} onLogout={logout} />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              onClick={() => setMenu(true)}
              className="grid size-10 place-content-center rounded-xl border border-line bg-card text-muted lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-extrabold tracking-tight text-ink sm:text-xl">
                Produksi & Konsumsi Beras Indonesia
              </h1>
              <p className="truncate text-xs text-muted">
                38 provinsi · 2025
                {diperbarui && <> · data Supabase {diperbarui}</>}
                {provinsi && <span className="font-semibold text-brand"> · fokus: {provinsi}</span>}
              </p>
            </div>
            <div className="order-last flex w-full items-center gap-2 sm:order-none sm:w-auto">
              <ProvinceSelect options={daftar.data?.data ?? []} value={provinsi} onChange={setProvinsi} />
              <button
                onClick={() => setProvinsi(null)}
                disabled={!provinsi}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-card px-3 text-sm font-medium text-muted transition hover:text-ink disabled:opacity-40"
              >
                <RotateCcw className="size-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
            <button
              onClick={() => setVersi((x) => x + 1)}
              disabled={memuat}
              title="Ambil ulang data dari database"
              className="grid size-10 shrink-0 place-content-center rounded-xl border border-line bg-card text-muted transition hover:text-ink"
              aria-label="Ambil ulang data dari database"
            >
              <RefreshCw className={`size-[18px] ${memuat ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={toggle}
              className="grid size-10 shrink-0 place-content-center rounded-xl border border-line bg-card text-muted transition hover:text-ink"
              aria-label={dark ? "Mode terang" : "Mode gelap"}
            >
              {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] space-y-12 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {errors.length > 0 && (
            <div role="alert" className="rounded-2xl border border-neg/30 bg-neg-soft p-4 text-sm text-neg">
              <b>Sebagian data gagal dimuat.</b> {errors[0]}. Pastikan DATABASE_URL benar dan project Supabase aktif.
            </div>
          )}

          <Section
            id="ringkasan"
            eyebrow="Ringkasan"
            title={provinsi ? `Indikator utama ${provinsi}` : "Indikator utama nasional"}
            desc={
              provinsi
                ? "Semua KPI dihitung ulang untuk provinsi terpilih dan dibandingkan dengan nasional."
                : "Total dari 38 provinsi (baris agregat Indonesia tidak ikut dijumlahkan)."
            }
          >
            <KpiCards kpi={kpi.data} />
          </Section>

          <Section id="produksi" eyebrow="Produksi" title="Di mana padi diproduksi?" desc="Provinsi yang dipilih di filter diberi warna penuh. Kalau tidak masuk 10 besar, provinsi itu muncul di baris terakhir dengan nomor peringkatnya.">
            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard no={1} title="10 provinsi produksi padi tertinggi" question="Wilayah mana produsen padi utama?" loading={top.loading}
                note="Satuan ton gabah kering giling (GKG), sumber D1 (CSV).">
                {o1 ? <EChart option={o1} height={400} label="Bar horizontal produksi padi 10 provinsi tertinggi" /> : skeleton(400)}
              </ChartCard>
              <ChartCard
                no={2}
                title={`Produktivitas padi: ${urutProd === "desc" ? "10 tertinggi" : "10 terendah"}`}
                question="Di mana hasil panen per hektare paling tinggi dan paling rendah?"
                loading={prodv.loading}
                note="Garis putus-putus adalah rata-rata tertimbang nasional. Batang hijau di atas rata-rata, kuning di bawahnya."
                action={
                  <Segmented label="Urutan produktivitas" value={urutProd} onChange={setUrutProd}
                    options={[{ v: "desc", l: "Top 10" }, { v: "asc", l: "Bottom 10" }]} />
                }
              >
                {o2 ? <EChart option={o2} height={400} label="Bar horizontal produktivitas padi per provinsi" /> : skeleton(400)}
              </ChartCard>
            </div>
          </Section>

          <Section id="konsumsi" eyebrow="Produksi vs konsumsi" title="Apakah produksi beras cukup untuk penduduknya?" desc="Estimasi konsumsi = konsumsi beras per kapita (Bapanas) × jumlah penduduk. Ini perbandingan kasar, bukan neraca pangan resmi.">
            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard no={3} title="Produksi beras vs estimasi konsumsi" question="Di 15 provinsi penghasil beras terbesar, seberapa jauh produksi dibanding kebutuhan penduduknya?" loading={pk.loading}
                note="Data gabungan D2 (XLSX), D4 (JSON), dan D5 (XLSX).">
                {o3 ? <EChart option={o3} height={760} label="Grouped bar produksi beras dan estimasi konsumsi" /> : skeleton(760)}
              </ChartCard>
              <ChartCard no={4} title="Selisih produksi − estimasi konsumsi" question="Provinsi mana yang selisihnya paling besar, positif maupun negatif?" loading={sel.loading}
                note="Hijau: produksi melebihi estimasi konsumsi. Merah: di bawahnya. Selisih tidak memperhitungkan perdagangan antarprovinsi dan stok.">
                {o4 ? <EChart option={o4} height={760} label="Diverging bar selisih produksi dan konsumsi 38 provinsi" /> : skeleton(760)}
              </ChartCard>
            </div>
          </Section>

          <Section
            id="geografis"
            eyebrow="Faktor geografis"
            title="Apakah lahan yang luas berarti produksi besar?"
            desc="Angkanya berkisar dari ratusan sampai jutaan, jadi sumbu memakai skala log. Pilih Linear untuk melihat jarak aslinya."
            action={
              <Segmented label="Skala sumbu" value={skala} onChange={setSkala}
                options={[{ v: "log", l: "Skala log" }, { v: "linear", l: "Linear" }]} />
            }
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard no={5} title="Luas panen vs produksi padi" question="Apakah panen yang lebih luas selalu menghasilkan padi lebih banyak?" loading={sc.loading}
                note="Hubungannya sebagian bersifat matematis: produksi = luas panen × produktivitas.">
                {o5 ? <EChart option={o5} height={400} label="Scatter luas panen terhadap produksi padi" /> : skeleton(400)}
              </ChartCard>
              <ChartCard no={6} title="Luas wilayah vs luas panen" question="Apakah wilayah yang luas selalu punya luas panen besar?" loading={sc.loading}
                note="Luas wilayah dari D3 (XLSX) mencakup seluruh daratan, bukan hanya lahan pertanian.">
                {o6 ? <EChart option={o6} height={400} label="Scatter luas wilayah terhadap luas panen" /> : skeleton(400)}
              </ChartCard>
            </div>
          </Section>

          <Section id="insight" eyebrow="Insight" title={provinsi ? `Temuan untuk ${provinsi}` : "Temuan utama"} desc="Angka di setiap kalimat dihitung dari database dan ikut berubah saat filter diganti.">
            <InsightPanel items={insight.data?.data ?? null} />
          </Section>

          <Section id="sumber" eyebrow="Sumber data & ETL" title="Asal data dan proses ETL" desc="Integrasi data-level: data diekstrak dari 3 format, ditransformasi oleh Pentaho, lalu dimuat ke PostgreSQL (Supabase). Dashboard membacanya lewat REST API.">
            <SumberPanel meta={meta.data} />
          </Section>

          <footer className="border-t border-line pt-6 pb-4 text-xs text-muted">
            Tugas 2 Enterprise Application Integration · Teknologi Sains Data, Universitas Airlangga · Sumber: BPS & Badan Pangan Nasional
          </footer>
        </main>
      </div>
    </div>
  );
}
