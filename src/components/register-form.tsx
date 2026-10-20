"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BoxReveal } from "@/components/ui/animated-auth";
import { Alert, DemoButton, Field, Judul, SubmitButton, kirim } from "@/components/auth-form-parts";

type Isian = { nama: string; username: string; password: string; ulang: string };

// Validasi yang sama dengan server (route /api/auth/register), supaya pesan
// salah muncul sebelum dikirim. Server tetap memeriksa ulang.
function periksa(v: Isian) {
  const e: Partial<Record<keyof Isian, string>> = {};
  const nama = v.nama.trim();
  const username = v.username.trim().toLowerCase();
  if (nama.length < 2) e.nama = "Isi nama lengkap, minimal 2 karakter";
  if (!/^[a-z0-9_.]{3,30}$/.test(username)) e.username = "3–30 karakter: huruf kecil, angka, titik, atau garis bawah";
  if (v.password.length < 8) e.password = "Password minimal 8 karakter";
  else if (username && v.password.toLowerCase().includes(username)) e.password = "Password jangan memuat username";
  if (!e.password && v.ulang !== v.password) e.ulang = "Password tidak sama";
  return e;
}

export function RegisterForm() {
  const router = useRouter();
  const [v, setV] = useState<Isian>({ nama: "", username: "", password: "", ulang: "" });
  const [salah, setSalah] = useState<Partial<Record<keyof Isian, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ubah = (k: keyof Isian) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    if (salah[k]) setSalah((s) => ({ ...s, [k]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cek = periksa(v);
    setSalah(cek);
    if (Object.keys(cek).length) return;

    setLoading(true);
    const { ok, body } = await kirim("/api/auth/register", {
      nama: v.nama,
      username: v.username,
      password: v.password,
    });
    if (!ok) {
      setSalah(body.fields ?? {});
      setError(body.fields ? null : (body.error ?? "Pendaftaran gagal. Coba lagi."));
      setLoading(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <Judul judul="Buat akun" sub="Daftar sekali, lalu masuk ke dashboard kapan saja." />
      <DemoButton disabled={loading} onError={setError} />

      <form onSubmit={submit} noValidate>
        {error && <Alert>{error}</Alert>}
        <div className="space-y-3">
          <Field
            id="nama"
            label="Nama lengkap"
            delay={0.18}
            autoComplete="name"
            value={v.nama}
            onChange={ubah("nama")}
            placeholder="Nama kamu"
            error={salah.nama}
            maxLength={100}
          />
          <Field
            id="username"
            label="Username"
            delay={0.21}
            autoComplete="username"
            value={v.username}
            onChange={ubah("username")}
            placeholder="mis. raphael.a"
            error={salah.username}
            hint="Dipakai untuk login. Huruf kecil, angka, titik, garis bawah."
            maxLength={30}
            autoCapitalize="none"
            spellCheck={false}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            delay={0.24}
            autoComplete="new-password"
            value={v.password}
            onChange={ubah("password")}
            placeholder="Minimal 8 karakter"
            error={salah.password}
          />
          <Field
            id="ulang"
            label="Ulangi password"
            type="password"
            delay={0.27}
            autoComplete="new-password"
            value={v.ulang}
            onChange={ubah("ulang")}
            placeholder="Ketik ulang password"
            error={salah.ulang}
          />
        </div>
        <SubmitButton loading={loading} label="Daftar dan masuk" loadingLabel="Membuat akun…" delay={0.3} />
      </form>

      <BoxReveal width="100%" delay={0.34}>
        <p className="mt-6 text-center text-sm text-muted">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Masuk
          </Link>
        </p>
      </BoxReveal>
    </>
  );
}
