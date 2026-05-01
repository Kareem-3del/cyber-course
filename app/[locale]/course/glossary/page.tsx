"use client";
import { useMemo, useState } from "react";
import { Link } from "@/components/L";
import { Search, X } from "lucide-react";
import { GLOSSARY, CATEGORIES, type Term } from "@/lib/glossary";
import { useI18n, T } from "@/lib/i18n";

type CatKey = keyof typeof CATEGORIES;

export default function GlossaryPage() {
  const { lang } = useI18n();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | CatKey>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GLOSSARY.filter((t: Term) => {
      if (cat !== "all" && t.category !== cat) return false;
      if (!needle) return true;
      return (
        t.term.toLowerCase().includes(needle) ||
        t.definition.ar.toLowerCase().includes(needle) ||
        t.definition.en.toLowerCase().includes(needle)
      );
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [q, cat]);

  const cats: ("all" | CatKey)[] = ["all", "attack", "defense", "web", "crypto", "ad", "cloud", "general"];

  return (
    <div>
      <div className="mb-6 text-[11px] font-bold uppercase tracking-[0.16em] flex items-center gap-2">
        <Link href="/" className="hover:underline"><T ar="الرئيسية" en="Home" /></Link>
        <span>/</span>
        <span className="opacity-60"><T ar="المعجم" en="Glossary" /></span>
      </div>

      <header className="border-[5px] border-black p-6 md:p-10 mb-8 bg-white">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// Reference / A–Z</div>
        <h1 className="font-display text-[clamp(40px,6vw,80px)] leading-[0.95] tracking-tighter mb-4">
          <T ar="المعجم." en="GLOSSARY." />
        </h1>
        <p className="max-w-2xl">
          <T
            ar="مرجع سريع لكل المصطلحات التقنية المستخدمة في الدورة. ابحث بالعربية أو الإنجليزية."
            en="Quick reference for every technical term used in the course. Search in Arabic or English."
          />
        </p>
      </header>

      <div className="mb-4 relative max-w-2xl">
        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" strokeWidth={3} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={lang === "ar" ? "البحث في قاموس المصطلحات..." : "SEARCH GLOSSARY..."}
          className="w-full ps-10 pe-9 py-2.5 border-[3px] border-black bg-sunken text-sm font-mono uppercase placeholder:text-black/40 focus:outline-none focus:border-[5px] focus:py-[7px]"
        />
        {q && (
          <button onClick={() => setQ("")} className="absolute top-1/2 -translate-y-1/2 end-2 p-1 hover:bg-black hover:text-white">
            <X className="w-3.5 h-3.5" strokeWidth={3} />
          </button>
        )}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {cats.map((c) => {
          const active = cat === c;
          const label = c === "all" ? { ar: "الكل", en: "All" } : CATEGORIES[c as CatKey];
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`chip ${active ? "chip-active" : ""}`}
            >
              {label[lang]}
            </button>
          );
        })}
      </div>

      <div className="font-mono text-[11px] uppercase tracking-[0.16em] mb-4">
        [{String(filtered.length).padStart(2, "0")} / {String(GLOSSARY.length).padStart(2, "0")}] TERMS
      </div>

      <div className="grid md:grid-cols-2 border-[3px] border-black">
        {filtered.map((t) => {
          const cc = CATEGORIES[t.category as CatKey];
          return (
            <div key={t.term} className="p-5 border-e-[3px] border-b-[3px] border-black bg-white">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display text-xl uppercase eng tracking-tight">{t.term}</h3>
                <span className={cc.chip}>{cc[lang]}</span>
              </div>
              <p className="text-sm leading-relaxed">{t.definition[lang]}</p>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="border-[3px] border-black p-10 text-center font-display uppercase tracking-[0.16em]">
          <T ar="لا نتائج" en="No Results" />
        </div>
      )}
    </div>
  );
}
