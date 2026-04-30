"use client";
import { Link } from "@/components/L";
import { useState, useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LESSONS, Track } from "@/lib/lessons";
import { useI18n, T } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { Search, X, Check, Square, ChevronDown } from "lucide-react";

const GROUPS: { key: Track; ar: string; en: string }[] = [
  { key: "intro", ar: "الأساسيات",          en: "Foundations" },
  { key: "red",   ar: "Red — الهجوم",       en: "Red — Offense" },
  { key: "blue",  ar: "Blue — الدفاع",      en: "Blue — Defense" },
  { key: "ops",   ar: "العمليات والتقصي",   en: "Ops & Hunting" },
];

interface Props { open: boolean; onClose: () => void; }

function stripLocale(p: string) {
  return p.replace(/^\/(ar|en)(\/|$)/, "/").replace(/\/$/, "") || "/";
}

export function Sidebar({ open, onClose }: Props) {
  const { lang } = useI18n();
  const { isDone, completed } = useProgress();
  const pathname = stripLocale(usePathname() || "/");
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => { onClose(); /* eslint-disable-next-line */ }, [pathname]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return LESSONS;
    return LESSONS.filter((l) =>
      l.title.ar.toLowerCase().includes(needle) ||
      l.title.en.toLowerCase().includes(needle) ||
      l.slug.includes(needle) ||
      l.tags.some((t) => t.toLowerCase().includes(needle))
    );
  }, [q]);

  const total = LESSONS.length;
  const done = LESSONS.filter((l) => completed.has(l.slug)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed md:sticky top-0 md:top-[72px] z-50 md:z-30 h-screen md:h-[calc(100vh-72px)] w-[300px] shrink-0 bg-white border-e-[5px] border-black flex flex-col transition-transform md:!translate-x-0 ${
          open ? "translate-x-0" : "rtl:translate-x-full ltr:-translate-x-full"
        }`}
      >
        <div className="md:hidden flex items-center justify-between px-4 h-14 border-b-[3px] border-black">
          <span className="font-display uppercase text-sm tracking-[0.12em]"><T ar="الدروس" en="Lessons" /></span>
          <button onClick={onClose} className="p-1.5 border-[3px] border-black"><X className="w-4 h-4" /></button>
        </div>

        {/* Sidebar header — title + progress */}
        <div className="p-4 border-b-[3px] border-black">
          <div className="font-display text-[14px] uppercase tracking-[0.14em] mb-3">
            <T ar="مسار الدروس" en="Lesson Path" />
          </div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] font-bold mb-2">
            <span><T ar="التقدم" en="Progress" /></span>
            <span className="eng">{done}/{total} · {pct}%</span>
          </div>
          <div className="h-2 bg-white border-[3px] border-black overflow-hidden">
            <div className="h-full bg-black" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b-[3px] border-black">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-black absolute top-1/2 -translate-y-1/2 start-3" strokeWidth={3} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "ar" ? "ابحث..." : "SEARCH..."}
              className="w-full text-[13px] font-mono bg-sunken text-black border-[3px] border-black ps-9 pe-3 py-2 outline-none focus:border-[5px] focus:py-[6px] uppercase placeholder:text-black/40"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto pb-6">
          {GROUPS.map(({ key, ar, en }) => {
            const items = filtered.filter((l) => l.track === key);
            if (!items.length) return null;
            const isCollapsed = collapsed[key];
            return (
              <div key={key} className="border-b-[3px] border-black">
                <button
                  onClick={() => setCollapsed((p) => ({ ...p, [key]: !p[key] }))}
                  className="w-full flex items-center gap-2 px-3 py-3 font-display text-[12px] uppercase tracking-[0.14em] hover:bg-black hover:text-white"
                >
                  <span className="flex-1 text-start">{lang === "ar" ? ar : en}</span>
                  <span className="eng text-[10px] opacity-70">[{items.length}]</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} strokeWidth={3} />
                </button>
                {!isCollapsed && (
                  <div className="border-t-[3px] border-black">
                    {items.map((l) => {
                      const active = pathname === `/course/lessons/${l.slug}`;
                      const d = isDone(l.slug);
                      return (
                        <Link
                          key={l.slug}
                          href={`/course/lessons/${l.slug}`}
                          className={`flex items-center gap-2 px-3 py-2 text-[13px] leading-tight border-b-[1px] border-black/20 last:border-b-0 ${
                            active ? "bg-black text-white" : "hover:underline"
                          }`}
                        >
                          {d
                            ? <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
                            : <Square className="w-3.5 h-3.5 shrink-0 opacity-40" strokeWidth={3} />}
                          <span className="truncate flex-1">{l.title[lang]}</span>
                          <span className="eng text-[10px] opacity-60">{String(l.number).padStart(2, "0")}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {q && filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-[12px] uppercase tracking-[0.14em] font-bold">
              <T ar="لا نتائج" en="No Results" />
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
