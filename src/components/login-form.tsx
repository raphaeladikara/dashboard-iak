"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BoxReveal } from "@/components/ui/animated-auth";
import { Alert, DemoButton, Field, Judul, SubmitButton, kirim, tujuanAman } from "@/components/auth-form-parts";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setLoading(true);
    const { ok, body } = await kirim("/api/auth/login", { username, password });
    if (!ok) {
      setError(body.error ?? "Gagal masuk. Coba lagi.");
      setLoading(false);
      return;
    }
    router.replace(tujuanAman());
    router.refresh();
  }

  return (
    <>
      <Judul judul="Selamat datang" sub="Masuk untuk membuka dashboard produksi dan konsumsi beras 2025." />
      <DemoButton disabled={loading} onError={setError} />

      <form onSubmit={submit} noValidate>
        {error && <Alert>{error}</Alert>}
        <div className="space-y-3">
          <Field
            id="username"
            label="Username"
            delay={0.18}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username kamu"
          />
          <Field
            id="password"
            label="Password"
            type="password"
            delay={0.22}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            hint="Salah 5 kali, login dikunci 10 menit."
          />
        </div>
        <SubmitButton loading={loading} label="Masuk ke dashboard" loadingLabel="Memeriksa…" delay={0.26} />
      </form>

      <BoxReveal width="100%" delay={0.3}>
        <p className="mt-6 text-center text-sm text-muted">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-brand hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </BoxReveal>
    </>
  );
}
