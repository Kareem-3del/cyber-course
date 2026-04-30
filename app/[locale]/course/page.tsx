"use client";
import { Link } from "@/components/L";
import { LESSONS, TRACKS, type Track } from "@/lib/lessons";
import { TOOLS } from "@/lib/tools";
import { GLOSSARY } from "@/lib/glossary";
import { useI18n, T } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import {
  Map as MapIcon, BookOpenText, Wrench, Library,
  ArrowLeft, ArrowRight, PlayCircle, Sparkles,
} from "lucide-react";

export default function CourseOverview() {
  const { lang } = useI18n();
  const { isDone, completed } = useProgress();
  const total = LESSONS.length;
  const done = LESSONS.filter((l) => completed.has(l.slug)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  // Resume = first non-completed lesson; Next-up = next 4 after that
  const firstUndone = LESSONS.find((l) => !isDone(l.slug)) ?? LESSONS[0];
  const queue = LESSONS.filter((l) => !isDone(l.slug)).slice(0, 4);

  // Track summary
  const trackKeys: Track[] = ["intro", "red", "blue", "ops"];
  const trackStats = trackKeys.map((k) => {
    const items = LESSONS.filter((l) => l.track === k);
    const d = items.filter((l) => isDone(l.slug)).length;
    return { key: k, total: items.length, done: d, pct: items.length ? Math.round((d / items.length) * 100) : 0 };
  });

  return (
    <div>
      {/* ============== HEADER ============== */}
      <header className="border-[5px] border-black bg-white p-6 md:p-10 mb-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3 flex items-center gap-3">
          <span className="w-8 h-[3px] bg-black" />
          <T ar="نظرة عامة على الدورة" en="Course Overview" />
        </div>
        <h1 className="font-display text-[clamp(40px,7vw,96px)] leading-[0.92] tracking-tighter mb-5">
          {pct === 0
            ? <T ar="ابدأ مسارك." en="START YOUR PATH." />
            : pct === 100
              ? <T ar="أنهيت كل شيء." en="YOU FINISHED EVERYTHING." />
              : <T ar="تابع من حيث توقفت." en="PICK UP WHERE YOU LEFT OFF." />}
        </h1>
        <p className="max-w-2xl text-base md:text-lg leading-relaxed mb-8">
          <T
            ar="هذه نظرة عامة على الدورة. كل المحتوى مرتب في أربع مراحل، تبدأ بالأساسيات وتنتهي بتكتيكات الدول. استخدم القائمة الجانبية للوصول لأي درس، أو اتبع المسار من البداية."
            en="This is your course dashboard. All content is organized in four tiers, beginning with foundations and ending at nation-state tradecraft. Use the sidebar to jump to any lesson, or follow the path from the start."
          />
        </p>

        {/* progress + CTA */}
        <div className="grid md:grid-cols-[2fr_1fr] gap-0 border-[3px] border-black">
          <div className="p-5 border-e-[3px] border-black">
            <div className="font-display text-[12px] uppercase tracking-[0.16em] mb-3">
              <T ar="تقدمك" en="Your Progress" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="font-display text-5xl">{pct}%</div>
              <div className="font-mono text-[12px] uppercase tracking-[0.14em] font-bold">
                {done}/{total} <T ar="درساً" en="lessons" />
              </div>
            </div>
            <div className="h-3 border-[3px] border-black overflow-hidden">
              <div className="h-full bg-black" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="p-5 flex flex-col gap-3 justify-center">
            <Link
              href={`/course/lessons/${firstUndone.slug}`}
              className="inline-flex items-center justify-between gap-2 px-4 py-3 bg-black text-white border-[3px] border-black font-bold text-[12px] uppercase tracking-[0.12em] hover:bg-white hover:text-black"
            >
              <span className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4" strokeWidth={3} />
                {pct === 0 ? <T ar="ابدأ" en="Start" /> : <T ar="استأنف" en="Resume" />}
              </span>
              <Arrow className="w-3.5 h-3.5" strokeWidth={3} />
            </Link>
            <Link
              href="/course/roadmap"
              className="inline-flex items-center justify-between gap-2 px-4 py-3 bg-white border-[3px] border-black font-bold text-[12px] uppercase tracking-[0.12em] hover:bg-black hover:text-white"
            >
              <span className="flex items-center gap-2">
                <MapIcon className="w-4 h-4" strokeWidth={3} />
                <T ar="الخريطة" en="Roadmap" />
              </span>
              <Arrow className="w-3.5 h-3.5" strokeWidth={3} />
            </Link>
          </div>
        </div>
      </header>

      {/* ============== SECTIONS NAV (cards) ============== */}
      <section className="mb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-4">// Sections</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 border-[3px] border-black">
          <SectionCard
            href="/course/roadmap"
            n="01"
            icon={<MapIcon className="w-5 h-5" strokeWidth={2.5} />}
            title={{ ar: "خريطة الطريق", en: "Roadmap" }}
            desc={{ ar: "المسار المرتب في أربع مراحل", en: "The ordered four-tier path" }}
            stat={{ ar: "4 مراحل", en: "4 tiers" }}
          />
          <SectionCard
            href="/course/lessons"
            n="02"
            icon={<BookOpenText className="w-5 h-5" strokeWidth={2.5} />}
            title={{ ar: "الدروس", en: "Lessons" }}
            desc={{ ar: "كل دروس المنهج، قابلة للبحث والتصفية", en: "Every lesson, searchable and filterable" }}
            stat={{ ar: `${total} درساً`, en: `${total} lessons` }}
            bordered
          />
          <SectionCard
            href="/course/glossary"
            n="03"
            icon={<Library className="w-5 h-5" strokeWidth={2.5} />}
            title={{ ar: "المعجم", en: "Glossary" }}
            desc={{ ar: "كل المصطلحات التقنية المستخدمة في الدورة", en: "Every technical term used in the course" }}
            stat={{ ar: `${GLOSSARY.length} مصطلحاً`, en: `${GLOSSARY.length} terms` }}
            bordered
          />
          <SectionCard
            href="/course/tools"
            n="04"
            icon={<Wrench className="w-5 h-5" strokeWidth={2.5} />}
            title={{ ar: "الأدوات", en: "Tools" }}
            desc={{ ar: "كل الأدوات العملية مع التشغيل والأمثلة", en: "All practical tools with setup and examples" }}
            stat={{ ar: `${TOOLS.length}+ أداة`, en: `${TOOLS.length}+ tools` }}
            bordered
          />
        </div>
      </section>

      {/* ============== TRACK PROGRESS ============== */}
      <section className="mb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-4">// Tracks</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 border-[3px] border-black">
          {trackStats.map((t, i) => (
            <Link
              key={t.key}
              href={`/course/lessons?track=${t.key}`}
              className={`p-5 border-b-[3px] md:border-b-0 ${i < 3 ? "md:border-e-[3px]" : ""} border-black hover:bg-black hover:text-white group transition-colors`}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold mb-2">{TRACKS[t.key].label[lang]}</div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-display text-4xl leading-none">{t.done}</span>
                <span className="font-mono text-sm">/ {t.total}</span>
              </div>
              <div className="h-1.5 border-[2px] border-black group-hover:border-white overflow-hidden">
                <div className="h-full bg-black group-hover:bg-white" style={{ width: `${t.pct}%` }} />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2 font-bold">{t.pct}%</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============== UP NEXT ============== */}
      {queue.length > 0 && (
        <section className="mb-12">
          <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em]">// Up Next</div>
            <Link href="/course/lessons" className="font-mono text-[11px] uppercase tracking-[0.14em] font-bold underline underline-offset-[3px] hover:text-link">
              <T ar="عرض الكل" en="See all" /> →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 border-[3px] border-black">
            {queue.map((l, i) => (
              <Link
                key={l.slug}
                href={`/course/lessons/${l.slug}`}
                className={`p-5 hover:bg-black hover:text-white transition-colors ${
                  i % 2 === 0 ? "md:border-e-[3px]" : ""
                } ${i < queue.length - 2 ? "border-b-[3px]" : i === queue.length - 2 && queue.length % 2 === 0 ? "border-b-[3px] md:border-b-0" : ""} border-black`}
              >
                <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-[0.14em] font-bold">
                  <span>L{String(l.number).padStart(2, "0")}</span>
                  <span>·</span>
                  <span>{l.duration}</span>
                  <span>·</span>
                  <span>{l.level[lang]}</span>
                </div>
                <div className="font-display text-lg uppercase tracking-tight mb-1 leading-tight">{l.title[lang]}</div>
                <div className="text-sm line-clamp-2">{l.subtitle[lang]}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============== TIP ============== */}
      <section className="border-[5px] border-black p-6 bg-sunken flex gap-4 mb-4">
        <Sparkles className="w-6 h-6 shrink-0 mt-1" strokeWidth={3} />
        <div>
          <div className="font-display text-lg uppercase tracking-tight mb-2">
            <T ar="نصيحة" en="One Rule" />
          </div>
          <p className="leading-relaxed">
            <T
              ar="القراءة وحدها لا تصنع مختصاً. كل درس يفترض أنك ستجرّب ما فيه داخل مختبرك. خصص ساعة عملية على الأقل بعد كل ساعة قراءة."
              en="Reading alone doesn't make a professional. Every lesson assumes you'll try it in your lab. Spend at least one hands-on hour for every reading hour."
            />
          </p>
        </div>
      </section>
    </div>
  );
}

function SectionCard({
  href, n, icon, title, desc, stat, bordered = false,
}: {
  href: string;
  n: string;
  icon: React.ReactNode;
  title: { ar: string; en: string };
  desc: { ar: string; en: string };
  stat: { ar: string; en: string };
  bordered?: boolean;
}) {
  const { lang } = useI18n();
  return (
    <Link
      href={href}
      className={`p-6 hover:bg-black hover:text-white transition-colors group ${bordered ? "border-s-[3px] border-black" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="font-display text-3xl leading-none">{n}</div>
        <div className="w-10 h-10 border-[3px] border-black group-hover:border-white flex items-center justify-center">{icon}</div>
      </div>
      <div className="font-display text-xl uppercase tracking-tight mb-2 leading-tight">{title[lang]}</div>
      <div className="text-sm mb-4 min-h-[2.5em]">{desc[lang]}</div>
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] font-bold">{stat[lang]} →</div>
    </Link>
  );
}
