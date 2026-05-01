"use client";
import { useState, useMemo } from "react";
import { Link } from "@/components/L";
import { LESSONS, TRACKS, type Track } from "@/lib/lessons";
import { useI18n, T } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { Search, Check, RotateCcw, Map as MapIcon, X } from "lucide-react";

const LEVEL_LABEL: Record<string, { ar: string; en: string; key: string }> = {
  "Beginner": { ar: "أساسي", en: "Beginner", key: "basic" },
  "Advanced": { ar: "متقدم", en: "Advanced", key: "adv" },
  "Expert":   { ar: "خبير",  en: "Expert",   key: "expert" },
};

export default function LessonsCatalog() {
  const { lang } = useI18n();
  const { isDone, completed, reset } = useProgress();
  const [q, setQ] = useState("");
  const [track, setTrack] = useState<Track | "all">("all");
  const [level, setLevel] = useState<"all" | "basic" | "adv" | "expert">("all");

  const total = LESSONS.length;
  const doneCount = LESSONS.filter((l) => completed.has(l.slug)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return LESSONS.filter((l) => {
      if (track !== "all" && l.track !== track) return false;
      if (level !== "all") {
        const lk = LEVEL_LABEL[l.level.en]?.key;
        if (lk !== level) return false;
      }
      if (!term) return true;
      return (
        l.slug.toLowerCase().includes(term) ||
        l.title.ar.toLowerCase().includes(term) ||
        l.title.en.toLowerCase().includes(term) ||
        l.subtitle.ar.toLowerCase().includes(term) ||
        l.subtitle.en.toLowerCase().includes(term) ||
        l.tags.some((t) => t.toLowerCase().includes(term))
      );
    });
  }, [q, track, level]);

  const groups = [
    { key: "intro" as Track, title: { ar: "الأساسيات والمبادئ", en: "Foundations & Principles" } },
    { key: "red"   as Track, title: { ar: "الفرق الحمراء — العمليات الهجومية", en: "Red Team — Offensive Operations" } },
    { key: "blue"  as Track, title: { ar: "الفرق الزرقاء — الحماية والتحقيق", en: "Blue Team — Defense & Forensics" } },
    { key: "ops"   as Track, title: { ar: "العمليات والاستخبارات", en: "Operations & Intel" } },
  ];

  const trackPills: { v: Track | "all"; label: { ar: string; en: string } }[] = [
    { v: "all",   label: { ar: "الكل",  en: "All" } },
    { v: "intro", label: { ar: "أساسيات", en: "Foundations" } },
    { v: "red",   label: { ar: "أحمر",   en: "Red" } },
    { v: "blue",  label: { ar: "أزرق",   en: "Blue" } },
    { v: "ops",   label: { ar: "عمليات",  en: "Ops" } },
  ];
  const levelPills: { v: typeof level; label: { ar: string; en: string } }[] = [
    { v: "all",    label: { ar: "كل المستويات", en: "All Levels" } },
    { v: "basic",  label: { ar: "أساسي", en: "Beginner" } },
    { v: "adv",    label: { ar: "متقدم", en: "Advanced" } },
    { v: "expert", label: { ar: "خبير",  en: "Expert" } },
  ];

  return (
    <div>
      {/* header */}
      <header className="border-[5px] border-black p-6 md:p-10 mb-8 bg-white">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// Curriculum / Catalog</div>
        <h1 className="font-display text-[clamp(40px,6vw,80px)] leading-[0.95] tracking-tighter mb-4">
          <T ar="مكتبة الدروس." en="LESSON CATALOG." />
        </h1>
        <p className="max-w-2xl mb-6">
          <T
            ar="كل الدروس في مكان واحد — قابلة للبحث والتصفية. لو أردت مساراً مرتباً، انتقل إلى خريطة الطريق."
            en="Every lesson in one place — searchable and filterable. For an ordered path, switch to the roadmap."
          />
        </p>
        <div className="flex items-center flex-wrap gap-3">
          <Link href="/course/roadmap" className="px-5 py-2.5 border-[3px] border-black bg-white font-bold uppercase tracking-[0.12em] text-sm flex items-center gap-2 hover:bg-black hover:text-white">
            <MapIcon className="w-4 h-4" strokeWidth={3} />
            <T ar="خريطة الطريق المرتّبة" en="Ordered Roadmap" />
          </Link>
          <div className="ms-auto flex items-center gap-3 text-[12px] uppercase tracking-[0.14em] font-bold">
            <span className="eng">{doneCount}/{total} · {pct}%</span>
            <div className="w-32 h-2 border-[3px] border-black overflow-hidden">
              <div className="h-full bg-black" style={{ width: `${pct}%` }} />
            </div>
            {doneCount > 0 && (
              <button
                onClick={() => { if (confirm(lang === "ar" ? "إعادة ضبط مستوى التقدم؟" : "Reset progress?")) reset(); }}
                className="text-[11px] uppercase tracking-[0.14em] underline underline-offset-[3px] flex items-center gap-1 hover:text-link"
              >
                <RotateCcw className="w-3 h-3" strokeWidth={3} />
                <T ar="إعادة ضبط" en="Reset" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* filters */}
      <section className="sticky top-[72px] z-30 mb-8 bg-white py-4 -mx-4 md:-mx-10 px-4 md:px-10 border-y-[5px] border-black">
        <div className="flex flex-col gap-3">
          <div className="relative max-w-2xl">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" strokeWidth={3} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "ar" ? "ابحث: SSRF، BloodHound، Kerberos…" : "SEARCH: SSRF, BLOODHOUND, KERBEROS…"}
              className="w-full ps-10 pe-9 py-2.5 border-[3px] border-black bg-sunken text-sm font-mono uppercase placeholder:text-black/40 focus:outline-none focus:border-[5px] focus:py-[7px]"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute top-1/2 -translate-y-1/2 end-2 p-1 hover:bg-black hover:text-white">
                <X className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] me-1">Track:</span>
            {trackPills.map((p) => (
              <button
                key={p.v}
                onClick={() => setTrack(p.v)}
                className={`chip ${track === p.v ? "chip-active" : ""}`}
              >
                {p.label[lang]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] me-1">Level:</span>
            {levelPills.map((p) => (
              <button
                key={p.v}
                onClick={() => setLevel(p.v)}
                className={`chip ${level === p.v ? "chip-active" : ""}`}
              >
                {p.label[lang]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* results */}
      {filtered.length === 0 ? (
        <div className="border-[3px] border-black p-10 text-center font-display uppercase tracking-[0.16em]">
          <T ar="لا نتائج" en="No Results" />
        </div>
      ) : (
        groups.map((g) => {
          const items = filtered.filter((l) => l.track === g.key);
          if (!items.length) return null;
          return (
            <div key={g.key} className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className={TRACKS[g.key].chip}>{TRACKS[g.key].label[lang]}</span>
                <h2 className="font-display text-2xl uppercase">{g.title[lang]}</h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em]">[{String(items.length).padStart(2, "0")}]</span>
                <div className="flex-1 h-[3px] bg-black" />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-[3px] border-black">
                {items.map((l, i) => {
                  const done = isDone(l.slug);
                  // build cell border classes
                  return (
                    <Link
                      key={l.slug}
                      href={`/course/lessons/${l.slug}`}
                      className={`relative p-5 border-e-[3px] border-b-[3px] border-black hover:bg-black hover:text-white group transition-colors ${
                        done ? "bg-sunken" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="font-display text-3xl leading-none">{String(l.number).padStart(2, "0")}</span>
                        {done
                          ? <Check className="w-5 h-5" strokeWidth={3} />
                          : <span className="font-mono text-[10px] uppercase tracking-[0.16em]">{l.duration}</span>}
                      </div>
                      <div className="font-display text-lg uppercase leading-tight tracking-tight mb-2">{l.title[lang]}</div>
                      <div className="text-sm mb-3 line-clamp-2">{l.subtitle[lang]}</div>
                      <div className="flex flex-wrap gap-1">
                        {l.tags.slice(0, 4).map((t) => <span key={t} className="chip eng">#{t}</span>)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
