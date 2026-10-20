"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LockKeyhole, User } from "lucide-react";

// Tujuan setelah login diambil dari ?next=, hanya path internal yang diterima.
function tujuanAman() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Gagal masuk. Coba lagi.");
        setLoading(false);
        return;
      }
      router.replace(tujuanAman());
      router.refresh();
    } catch {
      setError("Server tidak merespons. Cek koneksi internet atau coba lagi sebentar.");
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-xl border border-line bg-card-soft py-3 pl-11 pr-4 text-sm text-ink placeholder:text-muted/70 transition focus:border-brand focus:bg-card focus:outline-none focus:ring-4 focus:ring-[var(--ring)]";

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-[400px] rounded-3xl border border-white/40 bg-card/95 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8 dark:border-white/10"
    >
      <h2 className="text-2xl font-bold tracking-tight text-ink">Masuk</h2>
      <p className="mt-1 text-sm text-muted">Pakai akun yang sudah didaftarkan admin.</p>

      <div className="mt-7 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Username</span>
          <span className="relative block">
            <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              className={field}
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Password</span>
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              className={`${field} pr-11`}
              type={lihat ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setLihat((v) => !v)}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-content-center rounded-lg text-muted hover:bg-line/60 hover:text-ink"
              aria-label={lihat ? "Sembunyikan password" : "Tampilkan password"}
            >
              {lihat ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-neg-soft px-3.5 py-2.5 text-sm font-medium text-neg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-strong active:scale-[0.98] disabled:opacity-70 dark:text-[#03120e]"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? "Memeriksa…" : "Masuk ke dashboard"}
      </button>

      <p className="mt-5 text-center text-xs text-muted">Salah password 5 kali, login dikunci 10 menit.</p>
    </form>
  );
}
