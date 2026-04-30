"use client";
import { Link } from "@/components/L";
import { LESSONS } from "@/lib/lessons";
import { Swords, ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n, T } from "@/lib/i18n";

export default function Page() {
  const { lang } = useI18n();
  const items = LESSONS.filter((l) => l.track === "red");
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  return (
    <div>
      <div className="text-sm text-mute mb-4">
        <Link href="/" className="hover:text-ink"><T ar="الرئيسية" en="Home" /></Link> / <T ar="مسار Red Team" en="Red Team Track" />
      </div>
      <header className="rounded-2xl border border-red/30 bg-gradient-to-br from-red/10 to-panel p-8 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-red/15 border border-red/40 flex items-center justify-center">
            <Swords className="w-6 h-6 text-red" />
          </div>
          <div>
            <div className="chip chip-red"><T ar="Red Team — مسار الهجوم" en="Red Team — Offensive Track" /></div>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-2">
              <T ar="عقلية المهاجم: من الاستطلاع إلى التحرك الجانبي"
                 en="The attacker mindset: from reconnaissance to lateral movement" />
            </h1>
          </div>
        </div>
        <p className="text-mute leading-relaxed max-w-3xl">
          <T
            ar="المسار ده بياخدك خطوة خطوة في دورة هجوم كاملة (Cyber Kill Chain) — من جمع المعلومات، للـ scanning، لاستغلال الويب و السيرفرات و الـ Cloud، لحد ما بعد الاختراق. الفكرة مش «إزاي أهاجم» — الفكرة إنك تفهم عقلية المهاجم عشان تقدر تحط له فخ في كل مرحلة لما تبقى Blue Team."
            en="This track walks you step by step through an advanced attack lifecycle (Cyber Kill Chain) — from information gathering through scanning, web/server/cloud exploitation, and post-exploitation. The goal is not 'learning to attack' but building deep understanding so defenders can place traps at every stage."
          />
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {items.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.slug} href={`/course/lessons/${l.slug}`} className="rounded-2xl border border-line bg-panel p-5 card-hover">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red/10 border border-red/30 flex items-center justify-center"><Icon className="w-5 h-5 text-red" /></div>
                <div className="flex-1">
                  <div className="text-xs text-mute eng">Lesson {l.number} · {l.duration}</div>
                  <div className="font-bold mt-0.5">{l.title[lang]}</div>
                  <div className="text-sm text-mute eng">{l.subtitle[lang]}</div>
                </div>
                <Arrow className="w-4 h-4 text-mute" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
