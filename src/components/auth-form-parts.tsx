"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CirclePlay, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { BottomGradient, BoxReveal, Input, Label } from "@/components/ui/animated-auth";

// Bagian form yang dipakai bersama oleh halaman login dan registrasi.

// Tujuan setelah masuk diambil dari ?next=, hanya path internal yang diterima.
export function tujuanAman() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

type Balasan = { ok: boolean; body: { error?: string; fields?: Record<string, string> } };

export async function kirim(path: string, data: unknown): Promise<Balasan> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    return { ok: res.ok, body: await res.json().catch(() => ({})) };
  } catch {
    return { ok: false, body: { error: "Server tidak merespons. Cek koneksi internet atau coba lagi sebentar." } };
  }
}

export function Judul({ judul, sub }: { judul: string; sub: string }) {
  return (
    <div className="mb-7 space-y-2">
      <BoxReveal>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">{judul}</h1>
      </BoxReveal>
      <BoxReveal delay={0.05}>
        <p className="text-sm text-muted">{sub}</p>
      </BoxReveal>
    </div>
  );
}

// Tombol login demo: penguji bisa membuka dashboard tanpa daftar atau hafal password.
export function DemoButton({ disabled, onError }: { disabled?: boolean; onError: (msg: string) => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function masuk() {
    setLoading(true);
    const { ok, body } = await kirim("/api/auth/demo", {});
    if (!ok) {
      onError(body.error ?? "Login demo gagal. Coba lagi.");
      setLoading(false);
      return;
    }
    router.replace(tujuanAman());
    router.refresh();
  }

  return (
    <>
      <BoxReveal width="100%" overflow="visible" delay={0.1}>
        <button
          type="button"
          onClick={masuk}
          disabled={disabled || loading}
          className="group/btn relative flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-card text-sm font-semibold text-ink transition hover:border-brand/50 hover:bg-brand-soft disabled:opacity-60"
        >
          {loading ? <LoaderCircle className="size-4 animate-spin text-brand" /> : <CirclePlay className="size-4 text-brand" />}
          {loading ? "Membuka dashboard…" : "Masuk sebagai akun demo"}
          <BottomGradient />
        </button>
      </BoxReveal>
      <BoxReveal width="100%" delay={0.12}>
        <p className="mt-2 text-center text-xs text-muted">Tanpa daftar. Akses lihat-saja ke semua data dan grafik.</p>
      </BoxReveal>
      <BoxReveal width="100%" delay={0.15}>
        <div className="my-6 flex items-center gap-4 text-xs text-muted">
          <hr className="flex-1 border-dashed border-line" />
          atau pakai akun sendiri
          <hr className="flex-1 border-dashed border-line" />
        </div>
      </BoxReveal>
    </>
  );
}

type FieldProps = {
  id: string;
  label: string;
  delay: number;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Field({ id, label, delay, error, hint, type, ...props }: FieldProps) {
  const [lihat, setLihat] = useState(false);
  const isPassword = type === "password";
  const pesan = error ?? hint;
  return (
    <div className="space-y-1.5">
      <BoxReveal delay={delay}>
        <Label htmlFor={id}>{label}</Label>
      </BoxReveal>
      <BoxReveal width="100%" delay={delay + 0.03}>
        <div className="relative">
          <Input
            id={id}
            name={id}
            type={isPassword && lihat ? "text" : type}
            aria-invalid={error ? true : undefined}
            aria-describedby={pesan ? `${id}-pesan` : undefined}
            className={isPassword ? "pr-11" : undefined}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setLihat((v) => !v)}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-content-center rounded-lg text-muted transition hover:bg-line/60 hover:text-ink"
              aria-label={lihat ? "Sembunyikan password" : "Tampilkan password"}
            >
              {lihat ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          )}
        </div>
        <p id={`${id}-pesan`} className={`min-h-4 pt-1 text-xs ${error ? "text-neg" : "text-muted"}`}>
          {pesan}
        </p>
      </BoxReveal>
    </div>
  );
}

export function SubmitButton({ loading, label, loadingLabel, delay }: {
  loading: boolean;
  label: string;
  loadingLabel: string;
  delay: number;
}) {
  return (
    <BoxReveal width="100%" overflow="visible" delay={delay}>
      <button
        type="submit"
        disabled={loading}
        className="group/btn relative mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-strong active:scale-[0.98] disabled:opacity-70 dark:text-[#03120e]"
      >
        {loading && <LoaderCircle className="size-4 animate-spin" />}
        {loading ? loadingLabel : label}
        {!loading && <ArrowRight className="size-4 transition group-hover/btn:translate-x-0.5" />}
        <BottomGradient />
      </button>
    </BoxReveal>
  );
}

export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mb-4 rounded-xl bg-neg-soft px-3.5 py-2.5 text-sm font-medium text-neg">
      {children}
    </p>
  );
}
