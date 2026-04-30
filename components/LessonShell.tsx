"use client";
import { Link } from "@/components/L";
import { ChevronLeft, ChevronRight, Clock, Tag, Check, Square } from "lucide-react";
import { lessonBySlug, nextLesson, prevLesson, TRACKS } from "@/lib/lessons";
import { useI18n, T, L } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";

export function LessonShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { lang } = useI18n();
  const { isDone, toggle } = useProgress();
  const meta = lessonBySlug(slug)!;
  const nx = nextLesson(slug);
  const pv = prevLesson(slug);
  const Icon = meta.icon;
  const track = TRACKS[meta.track];
  const done = isDone(slug);

  const arrowToNext = lang === "ar" ? <ChevronLeft className="w-3 h-3" strokeWidth={3} /> : <ChevronRight className="w-3 h-3" strokeWidth={3} />;
  const arrowToPrev = lang === "ar" ? <ChevronRight className="w-3 h-3" strokeWidth={3} /> : <ChevronLeft className="w-3 h-3" strokeWidth={3} />;

  return (
    <article>
      {/* Breadcrumb */}
      <div className="mb-6 text-[11px] font-bold uppercase tracking-[0.16em] flex items-center gap-2">
        <Link href="/" className="hover:underline"><T ar="الرئيسية" en="Home" /></Link>
        <span>/</span>
        <Link href="/course/lessons" className="hover:underline"><T ar="الدروس" en="Lessons" /></Link>
        <span>/</span>
        <span className="eng opacity-60">L{String(meta.number).padStart(2, "0")}</span>
      </div>

      {/* Header */}
      <header className="border-[5px] border-black bg-white p-6 md:p-8 mb-10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={track.chip}>{track.label[lang]}</span>
          <span className="chip"><Tag className="w-3 h-3" />{meta.level[lang]}</span>
          <span className="chip"><Clock className="w-3 h-3" />{meta.duration}</span>
          <span className="chip eng">L{String(meta.number).padStart(2, "0")}</span>
        </div>
        <div className="flex items-start gap-5">
          <div className="hidden md:flex w-16 h-16 border-[3px] border-black items-center justify-center shrink-0">
            <Icon className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl md:text-5xl leading-[1.0] mb-3">{meta.title[lang]}</h1>
            <p className="text-base md:text-lg eng">{meta.subtitle[lang]}</p>
            {meta.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {meta.tags.map((t) => <span key={t} className="chip eng">#{t}</span>)}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="prose-ar max-w-none">{children}</div>

      {/* Mark complete */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={() => toggle(slug)}
          className={`flex items-center gap-2 px-6 py-3 border-[3px] border-black font-bold uppercase tracking-[0.12em] text-sm ${
            done ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"
          }`}
        >
          {done ? <Check className="w-4 h-4" strokeWidth={3} /> : <Square className="w-4 h-4" strokeWidth={3} />}
          {done
            ? <T ar="تم إكمال الدرس" en="Lesson Complete" />
            : <T ar="ضع علامة كمكتمل" en="Mark As Complete" />}
        </button>
      </div>

      {/* Prev / Next */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-0 border-[3px] border-black">
        {pv ? (
          <Link href={`/course/lessons/${pv.slug}`} className="p-5 border-e-0 md:border-e-[3px] border-b-[3px] md:border-b-0 border-black hover:bg-black hover:text-white">
            <div className="text-[10px] uppercase tracking-[0.16em] font-bold mb-1 flex items-center gap-1">{arrowToPrev}<T ar="السابق" en="Previous" /></div>
            <div className="font-display text-lg leading-tight">{pv.title[lang]}</div>
          </Link>
        ) : <div className="p-5 bg-sunken" />}
        {nx ? (
          <Link href={`/course/lessons/${nx.slug}`} className="p-5 hover:bg-black hover:text-white text-end">
            <div className="text-[10px] uppercase tracking-[0.16em] font-bold mb-1 flex items-center gap-1 justify-end"><T ar="الوحدة التالية" en="Next Unit" />{arrowToNext}</div>
            <div className="font-display text-lg leading-tight">{nx.title[lang]}</div>
          </Link>
        ) : <div className="p-5 bg-sunken" />}
      </div>
    </article>
  );
}

export function Section({ id, title, titleEn, children }: { id?: string; title: string; titleEn?: string; children: React.ReactNode }) {
  const { lang } = useI18n();
  return (
    <section id={id} className="scroll-mt-24">
      <h2>{lang === "en" && titleEn ? titleEn : title}</h2>
      {children}
    </section>
  );
}

export function Callout({
  kind = "info", title, titleEn, children,
}: { kind?: "info" | "warn" | "danger" | "good"; title?: string; titleEn?: string; children: React.ReactNode }) {
  const { lang } = useI18n();
  const map = {
    info:   { color: "var(--rb-link)",    label: "INFO" },
    warn:   { color: "var(--rb-warning)", label: "WARNING" },
    danger: { color: "var(--rb-error)",   label: "DANGER" },
    good:   { color: "var(--rb-success)", label: "DEFENSE" },
  } as const;
  const c = map[kind];
  const t = lang === "en" && titleEn ? titleEn : title;
  return (
    <div className="my-5 border-[3px] bg-white" style={{ borderColor: c.color }}>
      <div
        className="px-4 py-2 font-display text-[12px] uppercase tracking-[0.16em] border-b-[3px]"
        style={{ background: c.color, color: "#fff", borderColor: c.color }}
      >
        {t || c.label}
      </div>
      <div className="p-4 text-black">{children}</div>
    </div>
  );
}

export function Code({ children, lang }: { children: string; lang?: string }) {
  return (
    <div className="my-5">
      {lang && (
        <div className="text-[11px] eng uppercase tracking-[0.16em] font-bold border-[3px] border-black border-b-0 inline-block px-2 py-1 bg-black text-white">
          {lang}
        </div>
      )}
      <pre><code>{children}</code></pre>
    </div>
  );
}

export function Terminal({ lines }: { lines: { p?: string; o?: string }[] }) {
  return (
    <div className="terminal my-5">
      <div className="terminal-bar" />
      <div className="terminal-body">
        {lines.map((l, i) => (
          <div key={i}>
            {l.p && <div><span className="prompt">$</span> {l.p}</div>}
            {l.o && <div className="out whitespace-pre-wrap">{l.o}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Step({ n, title, titleEn, children }: { n: number; title: string; titleEn?: string; children: React.ReactNode }) {
  const { lang } = useI18n();
  return (
    <div className="my-5 border-[3px] border-black bg-white p-5 flex gap-5">
      <div className="w-12 h-12 bg-black text-white font-display flex items-center justify-center shrink-0 text-xl">
        {String(n).padStart(2, "0")}
      </div>
      <div className="flex-1">
        <div className="font-display text-lg uppercase tracking-tight mb-1">{lang === "en" && titleEn ? titleEn : title}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-5 my-5">{children}</div>;
}

export function Card({
  title, titleEn, color = "ink", children,
}: { title: string; titleEn?: string; color?: "ink" | "red" | "blue" | "amber" | "green"; children: React.ReactNode }) {
  const { lang } = useI18n();
  const map = {
    ink:   "var(--rb-black)",
    red:   "var(--rb-error)",
    blue:  "var(--rb-link)",
    amber: "var(--rb-warning)",
    green: "var(--rb-success)",
  } as const;
  const border = map[color];
  return (
    <div className="border-[3px] bg-white" style={{ borderColor: border }}>
      <div
        className="px-4 py-2 font-display text-[12px] uppercase tracking-[0.16em] border-b-[3px]"
        style={{ borderColor: border, color: border }}
      >
        {lang === "en" && titleEn ? titleEn : title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Analogy({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-5 bg-sunken border-[3px] border-black p-5">
      <div className="font-display text-[12px] uppercase tracking-[0.18em] mb-2">
        <T ar="تشبيه — شرح مبسط" en="Analogy — Plain English" />
      </div>
      <div>{children}</div>
    </div>
  );
}

export { L, T };
;
