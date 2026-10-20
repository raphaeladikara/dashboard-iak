import { Wheat } from "lucide-react";
import { ShaderBg } from "@/components/shader-bg";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Masuk · Dashboard Padi 2025" };

const ANGKA = [
  ["5", "dataset"],
  ["3", "format file"],
  ["38", "provinsi"],
];

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[#03120e] text-white">
      <ShaderBg />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#03120e]/60 via-[#03120e]/30 to-[#03120e]/70 lg:bg-gradient-to-r lg:from-[#03120e]/80 lg:via-[#03120e]/35 lg:to-[#03120e]/55" />

      {/* Satu container terpusat supaya teks dan kartu login tidak terpisah jauh di layar lebar. */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-6 sm:px-10 sm:py-8">
        <header className="flex items-center gap-3">
          <span className="grid size-10 place-content-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <Wheat className="size-5 text-[#f4ffc7]" />
          </span>
          <span className="text-sm font-semibold text-white/85">Dashboard Padi 2025</span>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20">
          <section>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#7ce577]">
              Tugas 2 · Enterprise Application Integration
            </p>
            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
              Produksi dan konsumsi beras di 38 provinsi.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">
              Data BPS dan Bapanas tahun 2025 dari file CSV, XLSX, dan JSON, digabung lewat ETL Pentaho ke PostgreSQL (Supabase).
            </p>

            <div className="mt-10 hidden max-w-md grid-cols-3 gap-6 border-t border-white/15 pt-6 sm:grid">
              {ANGKA.map(([v, l]) => (
                <div key={l}>
                  <p className="text-3xl font-bold text-[#f4ffc7]">{v}</p>
                  <p className="text-xs text-white/65">{l}</p>
                </div>
              ))}
            </div>
          </section>

          <LoginForm />
        </div>

        <footer className="text-xs text-white/50">Teknologi Sains Data, Universitas Airlangga</footer>
      </div>
    </main>
  );
}
