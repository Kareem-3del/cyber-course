"use client";
import { useMemo, useState } from "react";
import { Link } from "@/components/L";
import { Search, Terminal as TermIcon, X, ExternalLink, BookOpen } from "lucide-react";
import { TOOLS, TOOL_CATEGORIES, toolSlug, type Tool, type ToolCategory } from "@/lib/tools";
import { useI18n, T } from "@/lib/i18n";

type CatKey = ToolCategory | "all";
type Side = "all" | "red" | "blue" | "both";

export default function ToolsPage() {
  const { lang } = useI18n();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CatKey>("all");
  const [side, setSide] = useState<Side>("all");
  const [ossOnly, setOssOnly] = useState(false);
  const [active, setActive] = useState<Tool | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (cat !== "all" && t.category !== cat) return false;
      if (side !== "all" && t.side !== side && t.side !== "both") return false;
      if (ossOnly && !t.oss) return false;
      if (!needle) return true;
      return (
        t.name.toLowerCase().includes(needle) ||
        t.blurb.ar.toLowerCase().includes(needle) ||
        t.blurb.en.toLowerCase().includes(needle) ||
        t.category.toLowerCase().includes(needle)
      );
    });
  }, [q, cat, side, ossOnly]);

  const cats = Object.entries(TOOL_CATEGORIES) as [ToolCategory, { ar: string; en: string }][];
  const totalByCat = (key: ToolCategory) => TOOLS.filter((t) => t.category === key).length;

  return (
    <div>
      <div className="mb-6 text-[11px] font-bold uppercase tracking-[0.16em] flex items-center gap-2">
        <Link href="/" className="hover:underline"><T ar="الرئيسية" en="Home" /></Link>
        <span>/</span>
        <span className="opacity-60"><T ar="الأدوات" en="Tools" /></span>
      </div>

      <header className="border-[5px] border-black p-6 md:p-10 mb-8 bg-white">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// Toolkit / {String(TOOLS.length).padStart(3, "0")}</div>
        <h1 className="font-display text-[clamp(40px,6vw,80px)] leading-[0.95] tracking-tighter mb-4">
          <T ar="الأدوات." en="TOOLKIT." />
        </h1>
        <p className="max-w-2xl">
          <T
            ar={`${TOOLS.length}+ أداة عملية للـ Red Team و Blue Team. اضغط على أي أداة لعرض الوصف الكامل و أمثلة الاستخدام.`}
            en={`${TOOLS.length}+ practical tools for Red and Blue teams. Click any tool for full description and usage examples.`}
          />
        </p>
      </header>

      <div className="mb-4 relative max-w-2xl">
        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" strokeWidth={3} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={lang === "ar" ? "ابحث عن أداة..." : "SEARCH A TOOL..."}
          className="w-full ps-10 pe-9 py-2.5 border-[3px] border-black bg-sunken text-sm font-mono uppercase placeholder:text-black/40 focus:outline-none focus:border-[5px] focus:py-[7px]"
        />
        {q && <button onClick={() => setQ("")} className="absolute top-1/2 -translate-y-1/2 end-2 p-1 hover:bg-black hover:text-white"><X className="w-3.5 h-3.5" strokeWidth={3} /></button>}
      </div>

      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] me-1">Side:</span>
        {(["all", "red", "blue", "both"] as Side[]).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`chip ${side === s ? "chip-active" : ""}`}
          >
            {s === "all" ? (lang === "ar" ? "الكل" : "All")
              : s === "red" ? "RED"
              : s === "blue" ? "BLUE"
              : (lang === "ar" ? "كلاهما" : "BOTH")}
          </button>
        ))}
        <button
          onClick={() => setOssOnly((v) => !v)}
          className={`chip ${ossOnly ? "chip-active" : "chip-green"}`}
        >
          <T ar="مفتوح المصدر فقط" en="OSS Only" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] me-1">Cat:</span>
        <button onClick={() => setCat("all")} className={`chip ${cat === "all" ? "chip-active" : ""}`}>
          <T ar="كافة الأدوات" en="All Tools" /> [{TOOLS.length}]
        </button>
        {cats.map(([key, label]) => (
          <button key={key} onClick={() => setCat(key)} className={`chip ${cat === key ? "chip-active" : ""}`}>
            {label[lang]} [{totalByCat(key)}]
          </button>
        ))}
      </div>

      <div className="font-mono text-[11px] uppercase tracking-[0.16em] mb-4">
        [{String(filtered.length).padStart(3, "0")} / {String(TOOLS.length).padStart(3, "0")}] RESULTS
      </div>

      <div className="grid md:grid-cols-2 border-[3px] border-black">
        {filtered.map((t) => (
          <button
            key={t.name}
            onClick={() => setActive(t)}
            className="text-start p-5 border-e-[3px] border-b-[3px] border-black bg-white hover:bg-black hover:text-white transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-display text-xl uppercase eng tracking-tight">{t.name}</h3>
              <div className="flex flex-wrap gap-1 shrink-0">
                <span className={`chip ${t.side === "red" ? "chip-red" : t.side === "blue" ? "chip-blue" : ""}`}>
                  {t.side === "red" ? "RED" : t.side === "blue" ? "BLUE" : "BOTH"}
                </span>
                {t.oss && <span className="chip chip-green">OSS</span>}
              </div>
            </div>
            <div className="mb-3"><span className="chip">{TOOL_CATEGORIES[t.category][lang]}</span></div>
            <p className="text-sm leading-relaxed">{t.blurb[lang]}</p>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="border-[3px] border-black p-10 text-center font-display uppercase tracking-[0.16em]">
          <T ar="لا نتائج" en="No Results" />
        </div>
      )}

      {active && <ToolModal tool={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function ToolModal({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  const { lang } = useI18n();
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border-[5px] border-black max-w-2xl w-full max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b-[3px] border-black p-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl eng tracking-tight">{tool.name}</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="chip">{TOOL_CATEGORIES[tool.category][lang]}</span>
              <span className={`chip ${tool.side === "red" ? "chip-red" : tool.side === "blue" ? "chip-blue" : ""}`}>
                {tool.side === "red" ? "RED TEAM" : tool.side === "blue" ? "BLUE TEAM" : "BOTH"}
              </span>
              {tool.oss && <span className="chip chip-green">OPEN SOURCE</span>}
              {tool.os.map((o) => <span key={o} className="chip eng">{o.toUpperCase()}</span>)}
            </div>
          </div>
          <button onClick={onClose} className="p-2 border-[3px] border-black hover:bg-black hover:text-white shrink-0">
            <X className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="font-display text-[12px] uppercase tracking-[0.16em] mb-2">
              <T ar="الوصف" en="Description" />
            </div>
            <p className="leading-relaxed">{tool.blurb[lang]}</p>
          </div>

          <div>
            <div className="font-display text-[12px] uppercase tracking-[0.16em] mb-2">
              <T ar="متى تستخدمها" en="When To Use" />
            </div>
            <p className="leading-relaxed">{tool.whenToUse[lang]}</p>
          </div>

          {tool.install && (
            <div>
              <div className="font-display text-[12px] uppercase tracking-[0.16em] mb-2">
                <T ar="التثبيت" en="Install" />
              </div>
              <pre className="text-xs"><code>{tool.install}</code></pre>
            </div>
          )}

          {tool.examples && tool.examples.length > 0 && (
            <div>
              <div className="font-display text-[12px] uppercase tracking-[0.16em] mb-2 flex items-center gap-1.5">
                <TermIcon className="w-3 h-3" strokeWidth={3} />
                <T ar="أمثلة استخدام" en="Usage Examples" />
              </div>
              <pre className="text-xs"><code>{tool.examples.join("\n")}</code></pre>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/course/tools/${toolSlug(tool.name)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white border-[3px] border-black font-bold text-[12px] uppercase tracking-[0.12em] hover:bg-white hover:text-black"
            >
              <BookOpen className="w-4 h-4" strokeWidth={3} />
              <T ar="الشرح الكامل" en="Full Tutorial" />
            </Link>
            {tool.url && (
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-[3px] border-black font-bold text-[12px] uppercase tracking-[0.12em] hover:bg-black hover:text-white"
              >
                <ExternalLink className="w-4 h-4" strokeWidth={3} />
                <T ar="الموقع الرسمي" en="Official Site" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
