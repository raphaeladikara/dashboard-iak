"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Dashboard (lapisan UI) hanya mengambil data lewat REST API; tidak ada query
// database di browser. Kalau session habis (401), kembali ke halaman login.
export function useApi<T>(path: string, params: Record<string, string | null | undefined> = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const url = qs.size ? `${path}?${qs}` : path;

  const router = useRouter();
  const [state, setState] = useState<{ url: string; data: T | null; error: string | null }>({
    url: "",
    data: null,
    error: null,
  });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `Gagal memuat ${path}`);
        setState({ url, data: body as T, error: null });
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState((s) => ({ ...s, url, error: e.message }));
      });
    return () => ctrl.abort();
  }, [url, path, router]);

  // Data lama tetap ditampilkan selama data baru dimuat, supaya tidak berkedip.
  return { data: state.data, error: state.error, loading: state.url !== url };
}
