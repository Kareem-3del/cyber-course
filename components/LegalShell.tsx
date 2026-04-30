"use client";
import { Link } from "@/components/L";
import { useI18n, T } from "@/lib/i18n";
import { LEGAL, ENTITY, type LegalDoc } from "@/lib/legal";
import { ArrowLeft, ArrowRight, FileText, ShieldCheck, Home, ChevronLeft, ChevronRight } from "lucide-react";

export function LegalShell({ doc, title, intro, children }: {
  doc: LegalDoc;
  title: { ar: string; en: string };
  intro: { ar: string; en: string };
  children: React.ReactNode;
}) {
  const { lang } = useI18n();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const otherSlug = doc.slug === "terms" ? "privacy" : "terms";
  const otherDoc = LEGAL[otherSlug];

  return (
    <div className="max-w-[960px] mx-auto px-4 md:px-10 py-8 md:py-12">
      {/* Back-to-home strip */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-[12px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 border-[3px] border-black bg-white hover:bg-black hover:text-white font-bold uppercase tracking-[0.12em] text-[11px]"
        >
          <Home className="w-3.5 h-3.5" strokeWidth={3} />
          <T ar="الرئيسية" en="Home" />
        </Link>
        <Chevron className="w-3.5 h-3.5 opacity-50" strokeWidth={3} />
        <Link
          href="/legal"
          className="inline-flex items-center gap-2 px-3 py-2 border-[3px] border-black bg-white hover:bg-black hover:text-white font-bold uppercase tracking-[0.12em] text-[11px]"
        >
          <T ar="القانوني" en="Legal" />
        </Link>
        <Chevron className="w-3.5 h-3.5 opacity-50" strokeWidth={3} />
        <span className="px-3 py-2 border-[3px] border-black bg-black text-white font-bold uppercase tracking-[0.12em] text-[11px]">
          <T ar={title.ar} en={title.en} />
        </span>
      </div>

      {/* header */}
      <div className="border-[5px] border-black p-6 md:p-8 mb-10 bg-white">
        <div className="flex items-center gap-3 mb-3">
          {doc.slug === "terms" ? <FileText className="w-5 h-5" strokeWidth={3} /> : <ShieldCheck className="w-5 h-5" strokeWidth={3} />}
          <span className="font-mono text-[11px] uppercase tracking-[0.24em]">
            {doc.slug === "terms" ? <T ar="وثيقة شروط الاستخدام" en="Terms of Service" /> : <T ar="سياسة الخصوصية" en="Privacy Policy" />}
          </span>
        </div>
        <h1 className="font-display text-[clamp(36px,5vw,64px)] leading-[0.95] tracking-tighter mb-4">
          {title[lang]}
        </h1>
        <p className="text-[15px] leading-relaxed text-black/80 max-w-2xl">{intro[lang]}</p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-0 border-[3px] border-black">
          <Meta k={{ ar: "الإصدار", en: "Version" }} v={doc.version} mono />
          <Meta k={{ ar: "تاريخ السريان", en: "Effective" }} v={doc.effectiveDate} mono bordered />
          <Meta k={{ ar: "اللغات", en: "Languages" }} v="AR / EN" mono bordered />
          <Meta k={{ ar: "الإشعار قبل التحديث", en: "Update Notice" }} v={`${doc.noticePeriodDays}d`} mono bordered />
        </div>
      </div>

      {/* body */}
      <article className="legal-body space-y-8">{children}</article>

      {/* changelog */}
      <section className="mt-14 border-t-[3px] border-black pt-8">
        <h2 className="font-display text-[clamp(22px,2.6vw,32px)] tracking-tighter mb-4">
          <T ar="سجل التحديثات" en="Changelog" />
        </h2>
        <ul className="space-y-2">
          {doc.changelog.map((c, i) => (
            <li key={i} className="flex gap-4 text-[14px]">
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] shrink-0 min-w-[100px]">{c.date}</span>
              <span>{c.note[lang]}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* contact */}
      <section className="mt-12 border-[3px] border-black p-6 bg-[var(--rb-sunken,#F0F0F0)]">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">
          <T ar="للتواصل القانوني" en="Legal Contact" />
        </div>
        <p className="text-[14px] leading-relaxed mb-3">
          <T
            ar={`أي استفسار يخص هذه الوثيقة، أو ممارسة حقوقك القانونية، يُوجَّه إلى:`}
            en={`For any inquiry concerning this document or to exercise your legal rights, contact:`}
          />
        </p>
        <ul className="text-[14px] space-y-1 eng">
          <li><b>{ENTITY.legalName[lang]}</b></li>
          <li>{doc.slug === "privacy" ? ENTITY.privacyEmail : ENTITY.contactEmail}</li>
          <li>{ENTITY.website}</li>
        </ul>
      </section>

      {/* cross-link */}
      <div className="mt-10 flex flex-wrap gap-3 items-center">
        <Link
          href={`/legal/${otherSlug}`}
          className="px-5 py-3 bg-white text-black border-[3px] border-black font-bold uppercase tracking-[0.14em] text-[12px] flex items-center gap-2 hover:bg-black hover:text-white"
        >
          {otherSlug === "terms" ? <T ar="اقرأ شروط الاستخدام" en="Read the Terms" /> : <T ar="اقرأ سياسة الخصوصية" en="Read the Privacy Policy" />}
          <span className="font-mono opacity-60">v{otherDoc.version}</span>
          <Arrow className="w-3.5 h-3.5" strokeWidth={3} />
        </Link>
      </div>
    </div>
  );
}

function Meta({ k, v, mono, bordered }: { k: { ar: string; en: string }; v: string; mono?: boolean; bordered?: boolean }) {
  const { lang } = useI18n();
  return (
    <div className={`px-3 py-3 ${bordered ? "border-s-[3px] border-black" : ""}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/60 mb-1">{k[lang]}</div>
      <div className={`font-bold text-[15px] ${mono ? "eng" : ""}`}>{v}</div>
    </div>
  );
}

/* ---------- shared building blocks for legal copy ---------- */

export function LSection({ id, n, title, children }: { id?: string; n: string; title: { ar: string; en: string }; children: React.ReactNode }) {
  const { lang } = useI18n();
  return (
    <section id={id} className="scroll-mt-24">
      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-black/60 mb-2">// {n}</div>
      <h2 className="font-display text-[clamp(22px,2.6vw,32px)] tracking-tighter mb-3 leading-[1.15]">
        {title[lang]}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-black/85">{children}</div>
    </section>
  );
}

export function LDef({ term, children }: { term: { ar: string; en: string }; children: React.ReactNode }) {
  const { lang } = useI18n();
  return (
    <p>
      <b>{term[lang]}</b> — {children}
    </p>
  );
}
