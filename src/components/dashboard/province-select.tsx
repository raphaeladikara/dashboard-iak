"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";

// Combobox filter provinsi: bisa diketik untuk mencari, dan dipakai dengan keyboard.
export function ProvinceSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const items = useMemo(() => {
    const all: (string | null)[] = [null, ...options];
    const s = q.trim().toLowerCase();
    return s ? all.filter((o) => o && o.toLowerCase().includes(s)) : all;
  }, [options, q]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  function openMenu() {
    setQ("");
    setHi(Math.max(0, [null, ...options].indexOf(value)));
    setOpen(true);
    requestAnimationFrame(() => input.current?.focus());
  }

  function pick(v: string | null) {
    onChange(v);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[hi] !== undefined) pick(items[hi]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrap} className="relative w-full sm:w-72">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-11 w-full items-center gap-2.5 rounded-xl border bg-card px-3.5 text-left text-sm transition hover:border-brand/50 ${
          value ? "border-brand/60 ring-4 ring-[var(--ring)]/40" : "border-line"
        }`}
      >
        <MapPin className={`size-4 shrink-0 ${value ? "text-brand" : "text-muted"}`} />
        <span className={`flex-1 truncate ${value ? "font-semibold text-ink" : "text-muted"}`}>
          {value ?? "Semua provinsi (nasional)"}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="rise absolute right-0 z-30 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-card shadow-2xl shadow-black/15">
          <div className="flex items-center gap-2 border-b border-line px-3.5">
            <Search className="size-4 text-muted" />
            <input
              ref={input}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setHi(0);
              }}
              onKeyDown={onKey}
              placeholder="Cari provinsi…"
              className="h-11 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
              role="combobox"
              aria-expanded
              aria-controls="daftar-provinsi"
            />
          </div>
          <ul ref={list} id="daftar-provinsi" role="listbox" className="max-h-80 overflow-y-auto p-1.5">
            {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Tidak ada provinsi yang cocok</li>}
            {items.map((o, i) => (
              <li
                key={o ?? "__semua"}
                data-i={i}
                role="option"
                aria-selected={o === value}
                onMouseEnter={() => setHi(i)}
                onClick={() => pick(o)}
                className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  i === hi ? "bg-card-soft text-ink" : "text-ink/85"
                } ${o === null ? "font-semibold" : ""}`}
              >
                {o ?? "Semua provinsi (nasional)"}
                {o === value && <Check className="size-4 text-brand" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
