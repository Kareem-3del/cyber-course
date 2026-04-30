"use client";
import { Link } from "@/components/L";
import { LESSONS } from "@/lib/lessons";
import { useI18n, T } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { Check, Square } from "lucide-react";

type TierKey = "foundations" | "core" | "advanced" | "expert";

interface DomainGroup { title: { ar: string; en: string }; slugs: string[]; }
interface Tier {
  key: TierKey;
  number: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  level: { ar: string; en: string };
  duration: { ar: string; en: string };
  status: "success" | "info" | "warning" | "error";
  groups: DomainGroup[];
}

const ROADMAP: Tier[] = [
  {
    key: "foundations", number: "I",
    title: { ar: "الأساسيات", en: "Foundations" },
    description: { ar: "قبل أي هجوم أو دفاع، اعرف الأرضية: مختبرك، Linux، Windows، الشبكات، وعقلية المهاجم.", en: "Before any offense or defense, know the ground: your lab, Linux, Windows, networking, and the attacker mindset." },
    level: { ar: "مبتدئ", en: "Beginner" },
    duration: { ar: "≈ 5 ساعات", en: "≈ 5 hours" },
    status: "success",
    groups: [{ title: { ar: "المبادئ الجوهرية", en: "Core principles" }, slugs: ["lab-setup", "linux-fundamentals", "windows-fundamentals", "networking-basics", "mindset"] }],
  },
  {
    key: "core", number: "II",
    title: { ar: "العمليات الأساسية", en: "Core Operations" },
    description: { ar: "المهارات اليومية لكل من يعمل في الأمن: استطلاع، فحص، أدوات، أساسيات الدفاع، والقانون.", en: "Day-to-day skills every security professional needs: recon, scanning, tools, baseline defense, and law." },
    level: { ar: "متوسط", en: "Intermediate" },
    duration: { ar: "≈ 18 ساعة", en: "≈ 18 hours" },
    status: "info",
    groups: [
      { title: { ar: "هجوم — الأساسيات", en: "Offense — basics" }, slugs: ["recon", "scanning", "social-engineering", "wireless", "burp-mastery", "exploit-handbook", "cve-hunting", "toolkit"] },
      { title: { ar: "دفاع — الأساسيات", en: "Defense — basics" }, slugs: ["hardening", "crypto", "compliance", "soc-analyst-day1", "email-phishing-analysis", "evidence-chain-of-custody"] },
      { title: { ar: "العمليات والاستخبارات", en: "Operations & Intel" }, slugs: ["threat-intel-fundamentals", "cyber-law-authorities"] },
    ],
  },
  {
    key: "advanced", number: "III",
    title: { ar: "العمليات المتقدمة", en: "Advanced Operations" },
    description: { ar: "تخصص حقيقي في كل مجال: الويب، الشبكة، AD، السحابة، نقاط النهاية، IoT، وكشف التهديدات.", en: "Real specialization across web, network, AD, cloud, endpoints, IoT, and threat detection." },
    level: { ar: "متقدم", en: "Advanced" },
    duration: { ar: "≈ 35 ساعة", en: "≈ 35 hours" },
    status: "warning",
    groups: [
      { title: { ar: "الويب وAPI", en: "Web & API" }, slugs: ["web-attacks", "api-security", "advanced-web"] },
      { title: { ar: "الشبكة واللاسلكي", en: "Network & wireless" }, slugs: ["network-attacks", "wifi-deep"] },
      { title: { ar: "Active Directory", en: "Active Directory" }, slugs: ["advanced-ad", "adcs-attacks", "bloodhound-mastery"] },
      { title: { ar: "السحابة", en: "Cloud" }, slugs: ["cloud", "aws-attack-chains", "azure-attacks", "m365-entra-attacks"] },
      { title: { ar: "نقاط النهاية وما بعد الاستغلال", en: "Endpoints & post-exploitation" }, slugs: ["server-attacks", "post-exploitation", "evasion", "initial-access", "opsec-offensive", "full-attack-scenario"] },
      { title: { ar: "IoT والأجهزة المادية", en: "IoT & physical" }, slugs: ["mobile-iot", "usb-network-implants", "usb-attack-lab"] },
      { title: { ar: "الفريق الأزرق المتقدم", en: "Advanced Blue Team" }, slugs: ["detection", "incident-response", "malware-analysis", "threat-hunting", "dfir-triage", "windows-forensics", "network-forensics"] },
    ],
  },
  {
    key: "expert", number: "IV",
    title: { ar: "الخبراء والتراث المتقدم", en: "Expert & Tradecraft" },
    description: { ar: "أبحاث الثغرات، تطوير الـ exploits، تكتيكات الدول، البنية التحتية الحرجة، والسلاسل الكاملة.", en: "Vulnerability research, exploit development, nation-state tradecraft, critical infrastructure, full chains." },
    level: { ar: "خبير", en: "Expert" },
    duration: { ar: "≈ 40 ساعة", en: "≈ 40 hours" },
    status: "error",
    groups: [
      { title: { ar: "أبحاث الثغرات وتطوير الـ exploits", en: "Vuln research & exploit dev" }, slugs: ["web-redteam-deep", "web-vuln-research", "binary-exploitation", "linux-kernel-lpe", "zero-days"] },
      { title: { ar: "البنية التحتية الحديثة", en: "Modern infrastructure" }, slugs: ["kubernetes-attacks", "container-escapes", "cicd-attacks", "redteam-infra", "supply-chain-deep"] },
      { title: { ar: "خصومة متقدمة", en: "Advanced adversary" }, slugs: ["dns-covert-channels", "ai-llm-security", "ransomware-supply-chain", "university-attack-chain"] },
      { title: { ar: "تكتيكات الدول والاستخبارات", en: "Nation-state & intelligence" }, slugs: ["state-actor-tradecraft", "critical-infrastructure", "attribution", "target-selection", "mobile-spyware"] },
      { title: { ar: "العمليات وقواعد المعرفة", en: "Operations & knowledge bases" }, slugs: ["cve-catalog", "purple-team"] },
    ],
  },
];

const STATUS_COLOR: Record<Tier["status"], string> = {
  success: "var(--rb-success)",
  info: "var(--rb-link)",
  warning: "var(--rb-warning)",
  error: "var(--rb-error)",
};

function findLesson(slug: string) { return LESSONS.find((l) => l.slug === slug); }

export default function RoadmapPage() {
  const { lang } = useI18n();
  const { isDone, completed } = useProgress();
  const total = LESSONS.length;
  const done = LESSONS.filter((l) => completed.has(l.slug)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <header className="border-[5px] border-black p-6 md:p-10 mb-10 bg-white">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// Curriculum / Roadmap</div>
        <h1 className="font-display text-[clamp(40px,7vw,96px)] leading-[0.92] tracking-tighter mb-4">
          <T ar="خريطة الطريق." en="THE ROADMAP." />
        </h1>
        <p className="text-base md:text-lg max-w-3xl mb-6 leading-relaxed">
          <T
            ar="هذا المسار يأخذك من بناء أول مختبر منزلي حتى تكتيكات الدول والبنى التحتية الحرجة. كل مرحلة تبني على ما قبلها — لا تتجاوزها."
            en="This path takes you from building your first home lab all the way to nation-state tradecraft and critical infrastructure. Each tier builds on the last — don't skip."
          />
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 border-[3px] border-black">
          {ROADMAP.map((t) => {
            const tierLessons = t.groups.flatMap((g) => g.slugs);
            const tierDone = tierLessons.filter((s) => isDone(s)).length;
            const tierPct = tierLessons.length ? Math.round((tierDone / tierLessons.length) * 100) : 0;
            const c = STATUS_COLOR[t.status];
            return (
              <a
                key={t.key}
                href={`#tier-${t.key}`}
                className="group relative p-4 border-e-[3px] border-b-[3px] last:border-e-0 border-black hover:bg-black hover:text-white transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-3xl" style={{ color: c }}>T{t.number}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em]">{tierDone}/{tierLessons.length}</span>
                </div>
                <div className="font-display text-base uppercase">{t.title[lang]}</div>
                <div className="text-[11px] mt-1 uppercase tracking-[0.12em] font-bold">{t.level[lang]} · {t.duration[lang]}</div>
                <div className="h-1.5 mt-3 border-[2px] border-black overflow-hidden">
                  <div className="h-full" style={{ width: `${tierPct}%`, background: c }} />
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-5 font-mono text-[12px] uppercase tracking-[0.16em] font-bold flex items-center gap-3">
          <span>{done}/{total}</span>
          <span>·</span>
          <span>{pct}%</span>
          <span className="opacity-60"><T ar="من إجمالي المنهج" en="of full curriculum" /></span>
        </div>
      </header>

      {ROADMAP.map((tier, idx) => {
        const c = STATUS_COLOR[tier.status];
        return (
          <section key={tier.key} id={`tier-${tier.key}`} className="mb-16 scroll-mt-24">
            <div className="border-[5px] border-black bg-white p-6 mb-6 flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-5">
                <div className="font-display text-[clamp(56px,9vw,128px)] leading-none" style={{ color: c }}>
                  T{tier.number}
                </div>
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] font-bold mb-1" style={{ color: c }}>
                    Tier {tier.number} · {tier.level[lang]}
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl uppercase leading-[1.0] tracking-tight mb-2">{tier.title[lang]}</h2>
                  <p className="max-w-2xl text-sm leading-relaxed">{tier.description[lang]}</p>
                </div>
              </div>
              <div className="font-mono text-[12px] uppercase tracking-[0.16em] font-bold">{tier.duration[lang]}</div>
            </div>

            <div className="space-y-8">
              {tier.groups.map((g) => (
                <div key={g.title.en}>
                  <h3 className="font-display text-xl uppercase tracking-tight mb-3 pb-2 border-b-[3px] border-black flex items-center gap-3">
                    <span className="w-3 h-3 inline-block" style={{ background: c }} />
                    {g.title[lang]}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 border-[3px] border-black">
                    {g.slugs.map((slug) => {
                      const l = findLesson(slug);
                      if (!l) return null;
                      const d = isDone(slug);
                      return (
                        <Link
                          key={slug}
                          href={`/course/lessons/${slug}`}
                          className="p-4 border-e-[3px] border-b-[3px] border-black hover:bg-black hover:text-white transition-colors bg-white"
                        >
                          <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-[0.14em] font-bold">
                            {d ? <Check className="w-3 h-3" strokeWidth={3} /> : <Square className="w-3 h-3 opacity-40" strokeWidth={3} />}
                            <span>L{String(l.number).padStart(2, "0")}</span>
                            <span>·</span>
                            <span>{l.duration}</span>
                          </div>
                          <div className="font-display text-base uppercase tracking-tight leading-tight">{l.title[lang]}</div>
                          <div className="text-xs mt-1 line-clamp-2">{l.subtitle[lang]}</div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {idx < ROADMAP.length - 1 && (
              <div className="flex items-center gap-4 my-10">
                <div className="flex-1 h-[3px] bg-black" />
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] font-bold">↓ Next Tier</div>
                <div className="flex-1 h-[3px] bg-black" />
              </div>
            )}
          </section>
        );
      })}

      <section className="border-[5px] border-black p-6 md:p-10 mb-12 bg-sunken">
        <div className="font-display text-2xl uppercase tracking-tight mb-3">
          <T ar="نصيحة في التطبيق" en="A Note On Practice" />
        </div>
        <p className="max-w-3xl leading-relaxed">
          <T
            ar="القراءة وحدها لا تصنع مختصاً. كل درس يفترض أنك ستجرّب ما فيه داخل مختبرك. خصص ساعة عمليّة على الأقل بعد كل ساعة قراءة. هذا الفرق بين شخص يعرف و شخص يستطيع."
            en="Reading alone doesn't make a professional. Every lesson assumes you will try it in your lab. Spend at least one hands-on hour for every reading hour. That's the difference between someone who knows and someone who can."
          />
        </p>
      </section>
    </div>
  );
}
