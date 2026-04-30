"use client";
import { useState } from "react";
import { Link } from "@/components/L";
import { useI18n, T, L } from "@/lib/i18n";
import { ENTITY } from "@/lib/legal";
import {
  Home, ChevronLeft, ChevronRight, Mail, Github, ShieldCheck, ScrollText,
  Send, Copy, Check, Clock, Globe2, MapPin,
} from "lucide-react";

const NAME = "Kareem Adel";
const HANDLE = "kareem-3del";
const GITHUB = "https://github.com/kareem-3del";

const TOPICS: { v: string; ar: string; en: string; mailto: string }[] = [
  { v: "general",   ar: "استفسار عام",            en: "General question",          mailto: "[General] " },
  { v: "feedback",  ar: "ملاحظة على درس",         en: "Lesson feedback",           mailto: "[Feedback] " },
  { v: "bug",       ar: "خطأ في الموقع",          en: "Site bug",                  mailto: "[Bug] " },
  { v: "security",  ar: "إبلاغ عن ثغرة",          en: "Vulnerability disclosure",  mailto: "[Security] " },
  { v: "collab",    ar: "تعاون أو إسهام",         en: "Collaboration",             mailto: "[Collab] " },
  { v: "press",     ar: "صحافة / مقابلة",        en: "Press / interview",         mailto: "[Press] " },
];

export default function ContactPage() {
  const { lang } = useI18n();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;

  const [topic, setTopic] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const t = TOPICS.find((x) => x.v === topic)!;
  const composedSubject = `${t.mailto}${subject || (lang === "ar" ? t.ar : t.en)}`;
  const composedBody = (message || "").trim();
  const mailtoHref = `mailto:${ENTITY.contactEmail}?subject=${encodeURIComponent(composedSubject)}${composedBody ? `&body=${encodeURIComponent(composedBody)}` : ""}`;

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(ENTITY.contactEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-10 py-8 md:py-12">
      {/* Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-[12px]">
        <Link href="/" className="inline-flex items-center gap-2 px-3 py-2 border-[3px] border-black bg-white hover:bg-black hover:text-white font-bold uppercase tracking-[0.12em] text-[11px]">
          <Home className="w-3.5 h-3.5" strokeWidth={3} />
          <T ar="الرئيسية" en="Home" />
        </Link>
        <Chevron className="w-3.5 h-3.5 opacity-50" strokeWidth={3} />
        <span className="px-3 py-2 border-[3px] border-black bg-black text-white font-bold uppercase tracking-[0.12em] text-[11px]">
          <T ar="تواصل" en="Contact" />
        </span>
      </div>

      {/* Hero */}
      <section className="border-[5px] border-black p-6 md:p-10 mb-10 grid md:grid-cols-[1.2fr_1fr] gap-8 items-start bg-white">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3 flex items-center gap-3">
            <span className="w-8 h-[3px] bg-black" />
            <T ar="// تواصل" en="// Contact" />
          </div>
          <h1 className="font-display text-[clamp(40px,7vw,88px)] leading-[0.95] tracking-tighter mb-4">
            <T ar="تواصل معي." en="GET IN TOUCH." />
          </h1>
          <p className="text-[15px] leading-relaxed max-w-xl mb-6">
            <T
              ar={`أنا ${NAME} — مشغّل الأكاديمية ومن يكتب كل درس فيها. أردتَ تصحيح خطأ في درس؟ تبليغ ثغرة؟ اقتراح تعاون؟ راسلني مباشرة.`}
              en={`I'm ${NAME} — the maintainer of the Academy and the author of every lesson in it. Found an error? Reporting a vulnerability? Want to collaborate? Reach out directly.`}
            />
          </p>
          <div className="flex flex-wrap gap-2 text-[12px]">
            <Pill icon={<Clock className="w-3.5 h-3.5" strokeWidth={3} />} label={{ ar: "رد خلال 48 ساعة", en: "Reply within 48h" }} />
            <Pill icon={<Globe2 className="w-3.5 h-3.5" strokeWidth={3} />} label={{ ar: "AR · EN", en: "AR · EN" }} />
            <Pill icon={<MapPin className="w-3.5 h-3.5" strokeWidth={3} />} label={{ ar: "GMT+2", en: "GMT+2" }} />
          </div>
        </div>

        {/* Identity card */}
        <aside className="border-[3px] border-black p-5 bg-[var(--rb-sunken,#F0F0F0)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/60 mb-3">// IDENTITY</div>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 border-[3px] border-black bg-white flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <div className="font-display text-[20px] leading-none tracking-tight">{NAME}</div>
              <div className="text-[12px] mt-1 eng">@{HANDLE}</div>
            </div>
          </div>
          <dl className="space-y-2 text-[13px]">
            <Row k={{ ar: "البريد", en: "Email" }} v={ENTITY.contactEmail} mono />
            <Row k={{ ar: "GitHub", en: "GitHub" }} v={`github.com/${HANDLE}`} mono />
            <Row k={{ ar: "موقع", en: "Site" }} v={ENTITY.website.replace(/^https?:\/\//, "")} mono />
            <Row k={{ ar: "الدور", en: "Role" }} v={lang === "ar" ? "مشغّل ومحرّر" : "Maintainer & Editor"} />
          </dl>
        </aside>
      </section>

      {/* Channels */}
      <section className="mb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// 01 — Channels</div>
        <h2 className="font-display text-[clamp(28px,4vw,44px)] tracking-tighter mb-6">
          <T ar="القنوات المباشرة" en="Direct channels" />
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-[3px] border-black">
          <Channel
            icon={<Mail className="w-6 h-6" strokeWidth={3} />}
            title={{ ar: "البريد الإلكتروني", en: "Email" }}
            valueEng={ENTITY.contactEmail}
            href={`mailto:${ENTITY.contactEmail}`}
            note={{ ar: "الأسرع لكل شيء", en: "Fastest for everything" }}
            border="b-r"
          />
          <Channel
            icon={<Github className="w-6 h-6" strokeWidth={3} />}
            title={{ ar: "GitHub", en: "GitHub" }}
            valueEng={`@${HANDLE}`}
            href={GITHUB}
            external
            note={{ ar: "إصدارات، Issues، PRs", en: "Releases, issues, PRs" }}
            border="b-r"
          />
          <Channel
            icon={<ShieldCheck className="w-6 h-6" strokeWidth={3} />}
            title={{ ar: "إبلاغ ثغرة", en: "Vulnerability disclosure" }}
            valueEng={ENTITY.abuseEmail}
            href={`mailto:${ENTITY.abuseEmail}?subject=${encodeURIComponent("[Security]")}`}
            note={{ ar: "PGP عند الطلب", en: "PGP on request" }}
            border="b"
          />
          <Channel
            icon={<ScrollText className="w-6 h-6" strokeWidth={3} />}
            title={{ ar: "الخصوصية والبيانات", en: "Privacy / data requests" }}
            valueEng={ENTITY.privacyEmail}
            href={`mailto:${ENTITY.privacyEmail}?subject=${encodeURIComponent("[Privacy] Data request")}`}
            note={{ ar: "GDPR / CCPA", en: "GDPR / CCPA" }}
            border="r"
          />
          <Channel
            icon={<ScrollText className="w-6 h-6" strokeWidth={3} />}
            title={{ ar: "الشروط القانونية", en: "Terms inquiries" }}
            valueEng={ENTITY.contactEmail}
            href={`mailto:${ENTITY.contactEmail}?subject=${encodeURIComponent("[Legal]")}`}
            note={{ ar: "ترخيص، استخدام", en: "Licensing, usage" }}
            border="r"
          />
          <Channel
            icon={<Send className="w-6 h-6" strokeWidth={3} />}
            title={{ ar: "النموذج أدناه", en: "Form below" }}
            valueEng={lang === "ar" ? "↓ مرّر للأسفل" : "↓ Scroll down"}
            href="#form"
            note={{ ar: "يفتح بريدك بصيغة جاهزة", en: "Opens your mail client pre-filled" }}
            border=""
          />
        </div>
      </section>

      {/* Form */}
      <section id="form" className="mb-12 scroll-mt-20">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// 02 — Compose</div>
        <h2 className="font-display text-[clamp(28px,4vw,44px)] tracking-tighter mb-3">
          <T ar="اكتب لي رسالة" en="Write me a message" />
        </h2>
        <p className="text-[14px] text-black/70 mb-6 max-w-2xl">
          <T
            ar="هذا النموذج يفتح برنامج البريد لديك برسالة جاهزة. لا يخزّن شيئاً ولا يرسل عبر خادم — يصل إليّ مباشرة."
            en="This form opens your mail client with a pre-filled message. Nothing is stored, nothing is sent via a server — it goes straight to my inbox."
          />
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = mailtoHref;
          }}
          className="border-[3px] border-black bg-white p-5 md:p-7 grid md:grid-cols-2 gap-5"
        >
          {/* Topic */}
          <div className="md:col-span-2">
            <div className="rb-label">
              <T ar="الموضوع" en="Topic" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setTopic(opt.v)}
                  className={`px-3 py-1.5 border-[3px] text-[12px] font-bold uppercase tracking-[0.08em] ${
                    topic === opt.v ? "bg-black text-white border-black" : "bg-white text-black border-black hover:bg-black hover:text-white"
                  }`}
                >
                  <L ar={<>{opt.ar}</>} en={<>{opt.en}</>} />
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="rb-label" htmlFor="subj">
              <T ar="عنوان الرسالة" en="Subject" />
            </label>
            <input
              id="subj"
              className="rb-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={lang === "ar" ? "مختصر و واضح" : "Short and specific"}
              maxLength={140}
            />
          </div>

          {/* Reply-to (informational) */}
          <div>
            <div className="rb-label">
              <T ar="إلى" en="To" />
            </div>
            <div className="border-[3px] border-black bg-[var(--rb-sunken,#F0F0F0)] px-3 py-[10px] text-[14px] eng flex items-center justify-between gap-3">
              <span>{ENTITY.contactEmail}</span>
              <button
                type="button"
                onClick={copyEmail}
                className="border-[3px] border-black bg-white px-2 py-1 text-[10px] uppercase tracking-[0.12em] font-bold hover:bg-black hover:text-white inline-flex items-center gap-1"
                aria-label={lang === "ar" ? "نسخ البريد" : "Copy email"}
              >
                {copied ? <Check className="w-3 h-3" strokeWidth={3} /> : <Copy className="w-3 h-3" strokeWidth={3} />}
                {copied ? <T ar="نُسخ" en="Copied" /> : <T ar="نسخ" en="Copy" />}
              </button>
            </div>
          </div>

          {/* Message */}
          <div className="md:col-span-2">
            <label className="rb-label" htmlFor="msg">
              <T ar="الرسالة" en="Message" />
            </label>
            <textarea
              id="msg"
              rows={8}
              className="rb-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={lang === "ar" ? "اكتب التفاصيل هنا. لو كنت تبلّغ عن ثغرة، رجاءً أرفق خطوات إعادة الإنتاج." : "Type details here. For vuln reports, please include reproduction steps."}
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-[12px] text-black/60">
              <T
                ar="بإرسالك، أنت توافق على معالجة بريدك للرد فقط."
                en="By sending, you agree to your email being processed solely to reply."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="reset" onClick={() => { setSubject(""); setMessage(""); }} className="btn btn-secondary">
                <T ar="مسح" en="Clear" />
              </button>
              <button type="submit" className="btn">
                <Send className="w-4 h-4" strokeWidth={3} />
                <T ar="افتح في البريد" en="Open in mail" />
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Disclosure note */}
      <section className="mb-16">
        <div className="border-[3px] border-black p-5 bg-[var(--rb-sunken,#F0F0F0)]">
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-2">
            <T ar="// ملاحظة" en="// Note" />
          </div>
          <p className="text-[14px] leading-relaxed">
            <T
              ar={`للإبلاغ المسؤول عن الثغرات: راسل ${ENTITY.abuseEmail} مع الموضوع [Security]. أتعهّد بالرد خلال 48 ساعة. الإفصاح المنسّق مرحَّب به — لن أرفع قضية ضد باحث يلتزم بالحدود المعقولة. لا تختبر أنظمتي بأدوات مدمّرة دون إذن مسبق.`}
              en={`For responsible disclosure: email ${ENTITY.abuseEmail} with subject [Security]. I commit to a reply within 48 hours. Coordinated disclosure is welcomed — I will not pursue legal action against a researcher who stays within reasonable bounds. Please don't test my systems with destructive tools without prior consent.`}
            />
          </p>
        </div>
      </section>
    </div>
  );
}

/* ---------- sub components ---------- */

function Pill({ icon, label }: { icon: React.ReactNode; label: { ar: string; en: string } }) {
  const { lang } = useI18n();
  return (
    <span className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1.5 font-bold uppercase tracking-[0.08em] text-[11px]">
      {icon}
      {label[lang]}
    </span>
  );
}

function Row({ k, v, mono }: { k: { ar: string; en: string }; v: string; mono?: boolean }) {
  const { lang } = useI18n();
  return (
    <div className="grid grid-cols-[80px_1fr] gap-2 items-baseline">
      <dt className="text-[10px] uppercase tracking-[0.18em] text-black/60 font-bold">{k[lang]}</dt>
      <dd className={`${mono ? "eng" : ""} font-bold break-all`}>{v}</dd>
    </div>
  );
}

function Channel({ icon, title, valueEng, href, note, external, border }: {
  icon: React.ReactNode;
  title: { ar: string; en: string };
  valueEng: string;
  href: string;
  note: { ar: string; en: string };
  external?: boolean;
  border: string;
}) {
  const { lang } = useI18n();
  // Build border-* classes deliberately so Tailwind can detect them.
  const cls = [
    "p-5 bg-white hover:bg-black hover:text-white group transition-colors block",
    border.includes("r") ? "md:border-e-[3px] border-black" : "",
    border.includes("b") ? "border-b-[3px] border-black" : "",
  ].join(" ");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cls}
    >
      <div className="mb-3">{icon}</div>
      <div className="font-display text-[18px] tracking-tight leading-tight mb-1">{title[lang]}</div>
      <div className="text-[12px] eng break-all mb-3">{valueEng}</div>
      <div className="text-[11px] uppercase tracking-[0.12em] font-bold opacity-70 group-hover:opacity-100">
        {note[lang]}
      </div>
    </a>
  );
}
