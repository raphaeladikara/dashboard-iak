import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Wheat } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard/dashboard";

// Session dibaca saat request, jadi dibungkus Suspense (aturan Cache Components Next 16).
async function Gate({ searchParams }: { searchParams: Promise<{ provinsi?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { provinsi } = await searchParams;
  return <Dashboard nama={session.nama} awal={provinsi ?? null} />;
}

function Memuat() {
  return (
    <div className="grid min-h-dvh place-content-center justify-items-center gap-3 text-muted">
      <Wheat className="size-8 animate-pulse text-brand" />
      <p className="text-sm">Memuat dashboard…</p>
    </div>
  );
}

export default function Home({ searchParams }: { searchParams: Promise<{ provinsi?: string }> }) {
  return (
    <Suspense fallback={<Memuat />}>
      <Gate searchParams={searchParams} />
    </Suspense>
  );
}
