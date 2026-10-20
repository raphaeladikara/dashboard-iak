"use client";

import { useEffect, useState } from "react";
import {
  ChevronsRight,
  Database,
  Gauge,
  Lightbulb,
  LogOut,
  Map,
  Scale,
  Wheat,
  X,
  type LucideIcon,
} from "lucide-react";

// Diadaptasi dari komponen 21st.dev "Dashboard with collapsible sidebar":
// menu jadi anchor ke tiap bagian dashboard, item aktif mengikuti posisi scroll.
export const SECTIONS: { id: string; title: string; Icon: LucideIcon }[] = [
  { id: "ringkasan", title: "Ringkasan", Icon: Gauge },
  { id: "produksi", title: "Produksi", Icon: Wheat },
  { id: "konsumsi", title: "Produksi vs Konsumsi", Icon: Scale },
  { id: "geografis", title: "Faktor Geografis", Icon: Map },
  { id: "insight", title: "Insight", Icon: Lightbulb },
  { id: "sumber", title: "Sumber & ETL", Icon: Database },
];

function useActiveSection() {
  const [active, setActive] = useState(SECTIONS[0].id);
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-90px 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

export function Sidebar({
  nama,
  mobileOpen,
  onMobileClose,
  onLogout,
}: {
  nama: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(true);
  const active = useActiveSection();
  const expanded = open || mobileOpen;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onMobileClose} aria-hidden />
      )}
      <nav
        aria-label="Navigasi dashboard"
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-line bg-card p-2 transition-[width,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)] lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          expanded ? "w-64" : "w-[68px]"
        } ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
      >
        <div className="mb-4 flex items-center gap-3 border-b border-line px-2 pb-4 pt-2">
          <div className="grid size-10 shrink-0 place-content-center rounded-xl bg-gradient-to-br from-[#0e7c5a] to-[#03120e] shadow-sm ring-1 ring-black/5">
            <Wheat className="size-5 text-[#f4ffc7]" />
          </div>
          {expanded && (
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink">Dashboard Padi</span>
              <span className="block text-xs text-muted">Indonesia · 2025</span>
            </div>
          )}
          {mobileOpen && (
            <button onClick={onMobileClose} className="grid size-8 place-content-center rounded-lg text-muted hover:bg-card-soft lg:hidden" aria-label="Tutup menu">
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          {SECTIONS.map(({ id, title, Icon }) => {
            const on = active === id;
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={onMobileClose}
                title={expanded ? undefined : title}
                aria-current={on ? "true" : undefined}
                className={`relative flex h-11 items-center rounded-xl text-sm font-medium transition-colors ${
                  on ? "bg-brand-soft text-brand-strong" : "text-muted hover:bg-card-soft hover:text-ink"
                }`}
              >
                {on && <span className="absolute left-0 top-2.5 h-6 w-[3px] rounded-r-full bg-brand" />}
                <span className="grid h-full w-[52px] shrink-0 place-content-center">
                  <Icon className="size-[18px]" />
                </span>
                {expanded && <span className="truncate">{title}</span>}
              </a>
            );
          })}
        </div>

        <div className="mt-auto space-y-1 border-t border-line pt-3">
          {expanded && (
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <span className="grid size-9 shrink-0 place-content-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">
                {nama.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{nama}</span>
                <span className="block text-xs text-muted">Sesi aktif</span>
              </span>
            </div>
          )}
          <button
            onClick={onLogout}
            title={expanded ? undefined : "Keluar"}
            className="flex h-11 w-full items-center rounded-xl text-sm font-medium text-muted transition-colors hover:bg-neg-soft hover:text-neg"
          >
            <span className="grid h-full w-[52px] shrink-0 place-content-center">
              <LogOut className="size-[18px]" />
            </span>
            {expanded && "Keluar"}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="hidden h-11 w-full items-center rounded-xl text-sm font-medium text-muted transition-colors hover:bg-card-soft hover:text-ink lg:flex"
            aria-label={open ? "Ciutkan sidebar" : "Lebarkan sidebar"}
          >
            <span className="grid h-full w-[52px] shrink-0 place-content-center">
              <ChevronsRight className={`size-[18px] transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
            </span>
            {open && "Ciutkan"}
          </button>
        </div>
      </nav>
    </>
  );
}
