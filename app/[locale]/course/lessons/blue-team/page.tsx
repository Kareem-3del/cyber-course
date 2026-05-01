"use client";
import { Link } from "@/components/L";
import { LESSONS } from "@/lib/lessons";
import { Shield, ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n, T } from "@/lib/i18n";

export default function Page() {
  const { lang } = useI18n();
  const items = LESSONS.filter((l) => l.track === "blue");
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  return (
    <div>
      <div className="text-sm text-mute mb-4">
        <Link href="/" className="hover:text-ink"><T ar="الرئيسية" en="Home" /></Link> / <T ar="مسار Blue Team" en="Blue Team Track" />
      </div>
      <header className="rounded-2xl border border-blue/30 bg-gradient-to-br from-blue/10 to-panel p-8 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-blue/15 border border-blue/40 flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue" />
          </div>
          <div>
            <div className="chip chip-blue"><T ar="Blue Team — مسار الحماية" en="Blue Team — Defensive Track" /></div>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-2">
              <T ar="ابني حصن متعدد الطبقات يكشف ويرد بسرعة"
                 en="Build a layered fortress that detects and responds fast" />
            </h1>
          </div>
        </div>
        <p className="text-mute leading-relaxed max-w-3xl">
          <T
            ar="بُص. المدافع الشاطر بيفترض إنه متخرق من أول يوم. فبيبني طبقات الكشف والرد قبل ما يحتاجها. المسار ده بيغطي الـ hardening، الكشف بـ SIEM/EDR، ودورة الـ Incident Response كاملة على معيار NIST. اوعى تستنى الحادثة عشان تتعلم — اتعلم قبلها."
            en="A successful defender assumes breach from day one and builds detection and response layers before they're needed. This track covers hardening, SIEM/EDR detection engineering, and the full NIST incident response lifecycle."
          />
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {items.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.slug} href={`/course/lessons/${l.slug}`} className="rounded-2xl border border-line bg-panel p-5 card-hover">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue/10 border border-blue/30 flex items-center justify-center"><Icon className="w-5 h-5 text-blue" /></div>
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
