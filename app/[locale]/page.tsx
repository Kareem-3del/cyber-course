"use client";
import { Link } from "@/components/L";
import { LESSONS } from "@/lib/lessons";
import {
  Swords, Cloud, Lock, Crosshair, ArrowLeft, ArrowRight, AlertTriangle,
  Map as MapIcon, BookOpenText, Building2, Brain, Cpu, Network, Layers,
  Shield, Eye, Plus, Minus,
} from "lucide-react";
import { useState } from "react";
import { useI18n, T } from "@/lib/i18n";
import { PublicShell } from "@/components/SiteChrome";

export default function Landing() {
  const { lang } = useI18n();
  const total = LESSONS.length;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <PublicShell>
      <div className="max-w-[1400px] mx-auto">
        {/* ============== HERO ============== */}
        <section className="px-4 md:px-10 border-b-[5px] border-black">
          <div className="grid lg:grid-cols-[1fr_1.05fr] gap-10 py-12 lg:py-20 items-start">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-6 flex items-center gap-3">
                <span className="w-8 h-[3px] bg-black" />
                <T ar="منهج عملياتي" en="Operational Curriculum" />
                <span>·</span>
                <span className="eng">v.04 / 2026</span>
              </div>
              <h1 className="anim-fade-up font-display leading-[0.95] text-[clamp(48px,9vw,128px)] mb-6 tracking-tighter">
                <T ar="عمليات" en="CYBER" />
                <br />
                <span className="rb-invert px-3 -mx-1 inline-block">
                  <T ar="سيبرانية" en="OPERATIONS" />
                </span>
                <br />
                <T ar="متقدمة." en="ACADEMY." />
              </h1>
              <p className="text-lg leading-relaxed max-w-xl mb-8">
                <T
                  ar="بُص. انت فاكر إنك هتتعلم سيبراني إزاي؟ من فيديو على يوتيوب طوله 10 ساعات؟ من بوت كامب بـ 13 ألف دولار؟ من شهادة بتتجدد كل سنة؟ كله عك. ده مسار شغل. من أول VM في أوضتك، لحد ما تبقى فاهم إزاي دولة بتطبخ حملة على بنية تحتية حساسة. سكة واحدة. أربع مراحل. سبعين درس. خلاص."
                  en="A complete operational curriculum from your first home lab to nation-state tradecraft and critical infrastructure. One path. Four tiers. Seventy lessons."
                />
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/course" className="px-6 py-4 bg-black text-white border-[3px] border-black font-bold uppercase tracking-[0.14em] text-sm flex items-center gap-2 hover:bg-white hover:text-black">
                  <T ar="ادخل الدورة" en="Enter Course" />
                  <Arrow className="w-4 h-4" strokeWidth={3} />
                </Link>
                <Link href="/course/roadmap" className="px-6 py-4 bg-white text-black border-[3px] border-black font-bold uppercase tracking-[0.14em] text-sm flex items-center gap-2 hover:bg-black hover:text-white">
                  <MapIcon className="w-4 h-4" strokeWidth={3} />
                  <T ar="خريطة الطريق" en="Roadmap" />
                </Link>
                <a href="#what" className="px-6 py-4 underline underline-offset-[5px] text-sm font-bold uppercase tracking-[0.14em]">
                  <T ar="ما هي هذه الدورة؟" en="What Is This?" />
                </a>
              </div>

              <div className="grid grid-cols-3 border-[3px] border-black max-w-xl">
                <Stat n={String(total)} k={{ ar: "درساً", en: "Lessons" }} />
                <Stat n="04" k={{ ar: "مراحل", en: "Tiers" }} bordered />
                <Stat n="100+" k={{ ar: "أداة", en: "Tools" }} bordered />
              </div>
            </div>

            <div className="anim-fade-up mt-2 lg:mt-0 lg:-mt-2">
              <div className="terminal">
                <div className="terminal-bar" />
                <div className="terminal-body text-[12.5px] sm:text-[14px] md:text-[15px] min-h-[360px] md:min-h-[480px] lg:min-h-[560px] px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-5 leading-[1.75] md:leading-[1.85]">
                  <div><span className="prompt">red@kali</span>:~$ nmap -sV -p- target.gov</div>
                  <div className="out">PORT      STATE  SERVICE   VERSION</div>
                  <div className="out">22/tcp    open   ssh       OpenSSH 8.9</div>
                  <div className="out">80/tcp    open   http      nginx 1.24</div>
                  <div className="out">443/tcp   open   ssl/http  nginx 1.24</div>
                  <div className="out">445/tcp   open   smb       Samba 4.17</div>
                  <div className="out">3389/tcp  open   rdp       Microsoft</div>
                  <div className="out">5985/tcp  open   wsmans    Microsoft</div>
                  <div style={{ marginTop: 14 }}><span className="prompt">red@kali</span>:~$ nuclei -u https://target.gov</div>
                  <div className="out">[CRITICAL] CVE-2024-XXXX  detected</div>
                  <div className="out">[HIGH]     misconfig: open S3 bucket</div>
                  <div className="out">[MEDIUM]   exposed .git  directory</div>
                  <div style={{ marginTop: 14 }}><span className="prompt">blue@soc</span>:~$ sigma-detect --rule t1190</div>
                  <div className="out">[+] alert raised · host isolated</div>
                  <div className="out">[+] case CASE-2026-0481 opened</div>
                  <div style={{ marginTop: 14 }}>
                    <span className="prompt">red@kali</span>:~${" "}
                    <span className="rb-caret inline-block w-2.5 h-4 bg-white align-middle" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============== TICKER ============== */}
        <section className="border-b-[5px] border-black overflow-hidden bg-black text-white">
          <div className="rb-marquee flex gap-10 whitespace-nowrap py-4 eng font-mono text-[13px] uppercase tracking-[0.16em]">
            {[...Array(2)].flatMap((_, j) =>
              ["nmap", "Burp Suite", "BloodHound", "Wireshark", "Metasploit", "CrowdStrike", "Splunk", "MITRE ATT&CK", "Volatility", "ghidra", "Sliver C2", "Cobalt Strike", "Sigma", "Suricata", "Zeek", "OWASP Top 10"].map((tool) => (
                <span key={`${j}-${tool}`} className="flex items-center gap-3">
                  <span>///</span>{tool}
                </span>
              ))
            )}
          </div>
        </section>

        {/* ============== PRICE / FREE ============== */}
        <section className="px-4 md:px-10 py-10 md:py-14 border-b-[5px] border-black">
          <div className="grid md:grid-cols-[1.2fr_1fr_1.2fr] items-stretch border-[3px] border-black">
            {/* market price (struck through) */}
            <div className="px-6 py-8 md:py-10 border-b-[3px] md:border-b-0 md:border-e-[3px] border-black bg-[var(--rb-sunken,#F0F0F0)]">
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3 text-black/60">
                <T ar="عند المنافسين" en="Elsewhere" />
              </div>
              <div className="font-display text-[clamp(36px,5vw,56px)] leading-none tracking-tighter text-black/55 line-through decoration-[3px] decoration-[var(--rb-error,#FF0000)]">
                <span className="eng">$13,400</span>
              </div>
              <div className="text-[13px] mt-3 text-black/60 leading-snug">
                <T
                  ar="SANS، OSCP، وكل اللي على شاكلتهم. رسوم سنوية. مقاعد ربع سنوية. paywall على كل تفصيلة. ادفع 13 ألف دولار وكل حاجة هتتحل؟ ده بزنس يا نجم. مش تعليم."
                  en="A SANS bootcamp, OSCP track, or equivalent — paywalls, annual fees, quarterly seats."
                />
              </div>
            </div>

            {/* arrow / connector */}
            <div className="hidden md:flex items-center justify-center bg-white border-e-[3px] border-black">
              <div className="font-display text-[clamp(40px,6vw,72px)] leading-none rtl:rotate-180">→</div>
            </div>

            {/* FREE block (inverted) */}
            <div className="px-6 py-8 md:py-10 rb-invert relative overflow-hidden">
              <div aria-hidden className="absolute -top-1 -end-1 px-2 py-1 bg-[var(--rb-warning,#FFA500)] text-black font-display text-[11px] uppercase tracking-[0.18em] border-[3px] border-black">
                <T ar="مجاني" en="100% Free" />
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3 text-white/70">
                <T ar="هنا" en="Here" />
              </div>
              <div className="flex items-baseline gap-3">
                <div className="font-display text-[clamp(56px,9vw,112px)] leading-none tracking-tighter">
                  <span className="eng">$0</span>
                </div>
                <div className="font-display text-[clamp(18px,2.4vw,28px)] leading-none tracking-tighter">
                  <T ar="/ للأبد" en="/ FOREVER" />
                </div>
              </div>
              <div className="text-[13px] mt-3 text-white/85 leading-snug max-w-sm">
                <T
                  ar="نفس العمق. نفس الشغل. من غير اشتراك. من غير شهادة. من غير paywall. سبعين درس. أربع مراحل. الباب مفتوح من أول يوم. خلاص."
                  en="Same operational depth. No subscription, no paywall, no paid cert. Seventy lessons, four tiers, full access from day one."
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============== WHAT IS THIS ============== */}
        <section id="what" className="px-4 md:px-10 py-16 border-b-[5px] border-black scroll-mt-20">
          <div className="grid md:grid-cols-[1fr_2fr] gap-10">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// 01 — Introduction</div>
              <h2 className="font-display text-[clamp(36px,5vw,72px)] leading-[0.95] tracking-tighter">
                <T ar="ما هي هذه الدورة؟" en="WHAT IS THIS?" />
              </h2>
            </div>
            <div className="space-y-5">
              <p className="text-lg leading-relaxed">
                <T
                  ar="دي مش playlist على يوتيوب. مش قائمة قراءة. مش كورس مرصوص بفلوس. جربنا الكورسات اللي بتباع بآلاف الدولارات — معظمها سلايدات وحماس فاضي. ده منهج عمليات سيبرانية كامل، مبني بنفس طريقة برامج التدريب الفيدرالية. سكة واحدة متصلة. بتبدأ من تنصيب Linux على VM، وبتنتهي وانت فاهم إزاي دولة بتطبخ حملة طويلة الأمد على بنية تحتية حساسة."
                  en="This isn't a YouTube playlist. It isn't a reading list. It's a complete cyber-operations curriculum, structured the way federal training programs are structured: one continuous path, starting from installing Linux in a virtual machine and ending at understanding how a nation-state plans a long-haul campaign against critical infrastructure."
                />
              </p>
              <p className="leading-relaxed">
                <T
                  ar="كل درس ماشي على رجلين: هجوم ودفاع. لو قادر تشغّل التقنية، يبقى قادر تشوفها وتقفلها. الفرق بين المهاجم المحترف والـ threat hunter المحترف؟ مفيش فرق في التدريب. اللي بيتغيّر الكرسي اللي قاعد عليه. بس."
                  en="Every lesson pairs offense with defense: if you can run the technique, you can detect and stop it. That's the difference between a real attacker and a real threat hunter — the same training."
                />
              </p>
              <div className="grid md:grid-cols-3 gap-0 border-[3px] border-black mt-6">
                <Bullet
                  n="01"
                  title={{ ar: "بالعربية والإنجليزية", en: "Bilingual AR/EN" }}
                  desc={{ ar: "كل درس بكامله في اللغتين — مفيش ترجمة ناقصة", en: "Every lesson, full content in both languages" }}
                />
                <Bullet
                  n="02"
                  title={{ ar: "هجوم + دفاع", en: "Offense + Defense" }}
                  desc={{ ar: "كل تقنية معاها طريقة كشفها — مفيش هجوم بدون رد", en: "Every technique paired with detection" }}
                  bordered
                />
                <Bullet
                  n="03"
                  title={{ ar: "مختبر شخصي", en: "Personal Lab" }}
                  desc={{ ar: "بتشتغل على بيئتك إنت. مفيش target حقيقي. ما حدش بيتأذى", en: "Practice in your own lab — no real targets" }}
                  bordered
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============== PATH / TIERS ============== */}
        <section id="path" className="px-4 md:px-10 py-16 border-b-[5px] border-black bg-sunken scroll-mt-20">
          <div className="mb-10 flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// 02 — The Path</div>
              <h2 className="font-display text-[clamp(36px,5vw,72px)] leading-[0.95] tracking-tighter">
                <T ar="أربع مراحل." en="FOUR TIERS." />
                <br />
                <T ar="مبتدئ إلى خبير." en="BEGINNER TO EXPERT." />
              </h2>
            </div>
            <p className="max-w-md">
              <T
                ar="كل مرحلة بتقف على اللي قبلها. مفيش قفزات. مفيش خرم في المعرفة. سكة واحدة من الأساسيات لحد تكتيكات الدول. اللي يقفز يقع."
                en="Each tier builds on the last. No leaps, no gaps. A solid path from fundamentals to nation-state tradecraft."
              />
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 border-[3px] border-black bg-white">
            <TierCard tier="1" status="success" title={{ ar: "الأساسيات", en: "Foundations" }} desc={{ ar: "المعمل، Linux، Windows، الشبكات. اللي ميعرفهمش ميكمّلش.", en: "Lab, Linux, Windows, networking" }} count="05" duration="≈ 5h" />
            <TierCard tier="2" status="info"    title={{ ar: "شغل العمليات", en: "Core Ops" }}    desc={{ ar: "استطلاع، أدوات، دفاع على الأرض. شغل بإيدك مش سلايدات.",    en: "Recon, tooling, baseline defense" }} count="16" duration="≈ 18h" />
            <TierCard tier="3" status="warning" title={{ ar: "العمليات المتقدمة", en: "Advanced Ops" }} desc={{ ar: "ويب، AD، سحابة، IoT، Blue. هنا بيبان مين فاهم فعلاً.",        en: "Web, AD, cloud, IoT, blue team" }} count="29" duration="≈ 35h" />
            <TierCard tier="4" status="error"   title={{ ar: "الخبراء", en: "Expert" }}                desc={{ ar: "أبحاث، تكتيكات دول، 0-days. مش لكل الناس.", en: "Research, nation-state, 0-days" }} count="20" duration="≈ 40h" />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/course/roadmap" className="inline-flex items-center gap-2 px-5 py-3 border-[3px] border-black bg-white font-bold uppercase tracking-[0.12em] text-sm hover:bg-black hover:text-white">
              <T ar="الخريطة الكاملة" en="See Full Roadmap" />
              <Arrow className="w-3.5 h-3.5" strokeWidth={3} />
            </Link>
            <Link href="/course/lessons" className="inline-flex items-center gap-2 px-5 py-3 border-[3px] border-black bg-white font-bold uppercase tracking-[0.12em] text-sm hover:bg-black hover:text-white">
              <BookOpenText className="w-3.5 h-3.5" strokeWidth={3} />
              <T ar="كل الدروس" en="All Lessons" />
            </Link>
          </div>
        </section>

        {/* ============== DISCIPLINES ============== */}
        <section className="px-4 md:px-10 py-16 border-b-[5px] border-black">
          <div className="mb-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// 03 — Disciplines</div>
            <h2 className="font-display text-[clamp(36px,5vw,72px)] leading-[0.95] tracking-tighter">
              <T ar="ثلاث جبهات. منهج واحد." en="THREE FRONTS. ONE PATH." />
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-0 border-[3px] border-black">
            <Pillar
              kind="red"
              tag="Red Team"
              title={{ ar: "تفكير اللي قصادك", en: "Adversary Mindset" }}
              desc={{ ar: "من الاستطلاع الصامت لحد كتابة الـ exploit وأبحاث الثغرات الجديدة.", en: "From passive recon through exploit dev and 0-day research." }}
              items={["Reconnaissance", "Web Exploitation", "AD / Cloud", "Exploit Dev", "Long-Haul C2"]}
              icon={<Swords className="w-6 h-6" strokeWidth={2.5} />}
            />
            <Pillar
              kind="blue"
              tag="Blue Team"
              title={{ ar: "دفاع بطبقات", en: "Defense In Depth" }}
              desc={{ ar: "هندسة الكشف، الاستجابة وقت الحادثة، التحقيق الجنائي بعدها.", en: "Detection engineering, incident response, forensics." }}
              items={["Detection (SIEM/EDR)", "Threat Hunting", "Malware Analysis", "DFIR", "Hardening"]}
              icon={<Shield className="w-6 h-6" strokeWidth={2.5} />}
            />
            <Pillar
              kind="amber"
              tag="Threat Intel"
              title={{ ar: "تتبّع وإسناد", en: "Ops & Attribution" }}
              desc={{ ar: "تتبّع اللي قصادك، توصيل الحملة لصاحبها، تكتيكات APT والدول.", en: "Adversary tracking, campaign attribution, APT tradecraft." }}
              items={["MITRE ATT&CK", "Attribution", "State-Actor Tradecraft", "VEP / OPSEC", "Federal Law"]}
              icon={<Crosshair className="w-6 h-6" strokeWidth={2.5} />}
            />
          </div>
        </section>

        {/* ============== HIGHLIGHTS ============== */}
        <section className="px-4 md:px-10 py-16 border-b-[5px] border-black bg-sunken">
          <div className="mb-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// 04 — Inside</div>
            <h2 className="font-display text-[clamp(36px,5vw,72px)] leading-[0.95] tracking-tighter">
              <T ar="ما ستتقنه فعلياً." en="WHAT YOU MASTER." />
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-[3px] border-black bg-white">
            <Highlight icon={<Network className="w-4 h-4" strokeWidth={3} />} title={{ ar: "Kill Chain كامل", en: "Full Kill Chains" }} desc={{ ar: "من recon لحد Domain Admin", en: "From recon to Domain Admin" }} />
            <Highlight icon={<Cloud className="w-4 h-4" strokeWidth={3} />} title={{ ar: "هجمات السحابة", en: "Cloud Attacks" }} desc={{ ar: "AWS، Azure، M365، K8s", en: "AWS, Azure, M365, K8s" }} />
            <Highlight icon={<Cpu className="w-4 h-4" strokeWidth={3} />} title={{ ar: "BadUSB / IoT", en: "BadUSB / IoT" }} desc={{ ar: "من DuckyScript لحد pivot جوّه الشبكة", en: "DuckyScript to pivots" }} />
            <Highlight icon={<Lock className="w-4 h-4" strokeWidth={3} />} title={{ ar: "Exploit Dev", en: "Exploit Dev" }} desc={{ ar: "binary، kernel LPE، 0-days", en: "Binary, kernel LPE, 0-days" }} />
            <Highlight icon={<Eye className="w-4 h-4" strokeWidth={3} />} title={{ ar: "هندسة الكشف", en: "Detection Eng" }} desc={{ ar: "Sigma، EDR، SIEM، threat hunting", en: "Sigma, EDR, SIEM, hunting" }} />
            <Highlight icon={<Layers className="w-4 h-4" strokeWidth={3} />} title={{ ar: "DFIR", en: "DFIR" }} desc={{ ar: "ذاكرة، قرص، شبكة", en: "Memory, disk, network" }} />
            <Highlight icon={<Building2 className="w-4 h-4" strokeWidth={3} />} title={{ ar: "Active Directory", en: "Active Directory" }} desc={{ ar: "ADCS، BloodHound، DCSync", en: "ADCS, BloodHound, DCSync" }} />
            <Highlight icon={<Crosshair className="w-4 h-4" strokeWidth={3} />} title={{ ar: "تكتيكات الدول", en: "Nation-State" }} desc={{ ar: "long-haul، dormancy، OPSEC على أعلى مستوى", en: "Long-haul, dormancy, OPSEC" }} />
            <Highlight icon={<Brain className="w-4 h-4" strokeWidth={3} />} title={{ ar: "أمن AI / LLM", en: "AI / LLM Security" }} desc={{ ar: "prompt injection، RAG، التسميم", en: "Prompt injection, RAG" }} />
          </div>
        </section>

        {/* ============== AUDIENCE ============== */}
        <section id="audience" className="px-4 md:px-10 py-16 border-b-[5px] border-black scroll-mt-20">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// 05 — Built For</div>
              <h2 className="font-display text-[clamp(36px,5vw,72px)] leading-[0.95] tracking-tighter mb-4">
                <T ar="من بُنيت من أجلهم." en="WHO THIS IS FOR." />
              </h2>
              <p className="leading-relaxed">
                <T
                  ar="بُص. دي مش دورة للمبتدئين. أنا فارض إنك بتعرف تفتح terminal. فاهم الفرق بين TCP و UDP. وقادر تقعد ساعتين تجرّب حاجة قبل ما تيجي تسأل. لو لسه مش هناك، ابدأ بالأساسيات الأول. مفيش عيب. العيب إنك تخش متقدم وانت لسه متلخبط في الأساسيات."
                  en="This isn't a beginner course. It assumes you can use a command line, you know the difference between TCP and UDP, and you can spend two hours trying something before asking for help. Otherwise, finish the foundations first."
                />
              </p>
            </div>
            <ul className="rb-list border-y-[3px] border-black self-start w-full">
              <li><AudienceItem label={{ ar: "فرق فيدرالية وحكومية", en: "Federal / government teams" }} /></li>
              <li><AudienceItem label={{ ar: "Red Team بشغل حقيقي", en: "Pro Red teams" }} /></li>
              <li><AudienceItem label={{ ar: "Blue Team / SOC / IR", en: "Blue teams / SOC / IR" }} /></li>
              <li><AudienceItem label={{ ar: "باحثين ثغرات", en: "Vulnerability researchers" }} /></li>
              <li><AudienceItem label={{ ar: "Pentesters محترفين", en: "Professional pentesters" }} /></li>
              <li><AudienceItem label={{ ar: "صيادين تهديدات", en: "Threat hunters" }} /></li>
            </ul>
          </div>
        </section>

        {/* ============== HOW IT WORKS ============== */}
        <section className="px-4 md:px-10 py-16 border-b-[5px] border-black bg-sunken">
          <div className="mb-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// 06 — How It Works</div>
            <h2 className="font-display text-[clamp(36px,5vw,72px)] leading-[0.95] tracking-tighter">
              <T ar="كيف تتعلّم." en="HOW YOU LEARN." />
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border-[3px] border-black bg-white">
            <HowStep n="01" title={{ ar: "امشي على السكة", en: "Follow The Path" }} desc={{ ar: "ابدأ من الأساسيات. ما تقفزش لحاجة متقدمة قبل ما اللي قبلها يبقى راكب. اللي يقفز يقع.", en: "Start at the foundations. Don't jump to advanced tiers before finishing what comes first." }} />
            <HowStep n="02" title={{ ar: "اقرا الدرس بهدوء", en: "Read The Lesson" }} desc={{ ar: "كل درس بيفكّك الفكرة، يمشيك على الهجوم خطوة خطوة، وبعدين يوريك إزاي بتكشفه. مفيش حشو.", en: "Each lesson explains the concept, walks the attack, then ties the defensive detection." }} bordered />
            <HowStep n="03" title={{ ar: "طبّق في معملك", en: "Apply In Your Lab" }} desc={{ ar: "ساعة قراية = ساعة شغل بإيدك. القراية لوحدها مالهاش لازمة. لازم تلمس الكيبورد.", en: "One reading hour equals one hands-on hour. Don't read without trying." }} bordered />
            <HowStep n="04" title={{ ar: "علّم اللي خلصته", en: "Mark Progress" }} desc={{ ar: "علّم الدرس وكمّل اللي بعده. خلّيك عارف انت فين على السكة، مش تايه.", en: "Mark the lesson complete and move on. Track your progress." }} bordered />
          </div>
        </section>

        {/* ============== FAQ ============== */}
        <section id="faq" className="px-4 md:px-10 py-16 border-b-[5px] border-black scroll-mt-20">
          <div className="mb-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-3">// 07 — FAQ</div>
            <h2 className="font-display text-[clamp(36px,5vw,72px)] leading-[0.95] tracking-tighter">
              <T ar="أسئلة شائعة." en="QUESTIONS." />
            </h2>
          </div>

          <div className="border-[3px] border-black">
            <FAQ q={{ ar: "محتاج خبرة قبل ما ابدأ؟", en: "Do I need prior experience?" }}
                 a={{ ar: "أيوه. لازم تعرف terminal، فاهم شبكات على الأقل بالحد الأدنى، ومرتاح في Linux و Windows. لو لسه مش هناك، خلّص الـ Foundations الأول. ما تكسرش رجلك في أول خطوة.",
                      en: "Yes. The course assumes baseline familiarity with the command line, networking, and both Linux and Windows. If not, start with the Foundations tier first." }} />
            <FAQ q={{ ar: "الكلام ده قانوني؟", en: "Is the content legal?" }}
                 a={{ ar: "كل تقنية في الكورس مكانها معملك المعزول، أو نظام ماسك بإيدك ورق إذن مكتوب بتجربته. غير كده؟ التبعات عليك. مفيش محامي هيدافع عنك بحجة \"أنا اتعلمت من كورس مجاني\". الورقة دي مش هتسند في محكمة.",
                      en: "Every technique is meant for execution in your own isolated lab, or on systems you have explicit written authorization to test. Running it anywhere else is on you." }} />
            <FAQ q={{ ar: "الكورس بياخد قد ايه؟", en: "How long does it take?" }}
                 a={{ ar: "حوالي 100 ساعة قراءة. ومثلهم على الأقل شغل بإيدك. الأساسيات معظم الناس بتخلصها في أسبوع. المراحل المتقدمة بتاخد من 3 لـ 6 شهور لو ماشي بإيقاع ثابت. اللي يقولك \"اتعلم سيبراني في 30 يوم\" بيكدب عليك.",
                      en: "About 100 hours of reading, plus an equivalent amount of hands-on time. Most people finish foundations in a week and the advanced tiers in 3–6 months at a steady pace." }} />
            <FAQ q={{ ar: "ببلاش فعلاً؟", en: "Is the course free?" }}
                 a={{ ar: "أيوه. ببلاش. مادة تدريبية مفتوحة للجهات المصرّح لها. مفيش تسجيل. مفيش اشتراك. مفيش حساب. مفيش رسالة بعد 7 أيام تقولك \"ادفع 9.99$ علشان تكمّل\". خلاص. ادخل اقرا.",
                      en: "Yes. This is open training material for authorized parties. No signup, no subscription, no account." }} />
            <FAQ q={{ ar: "في شهادة في الآخر؟", en: "Is there a certificate?" }}
                 a={{ ar: "لا. ده منهج تعليمي، مش بزنس شهادات. التقدم بيتسجّل في المتصفح بتاعك علشان تعرف انت وصلت فين. والشغل اللي في دماغك وعلى كيبوردك هو شهادتك. الورقة بتعلّق على الحيطة، الشغل بيدخل الميدان.",
                      en: "No. This is an educational curriculum, not a certification program. Progress is saved locally in your browser for personal tracking." }} />
            <FAQ q={{ ar: "ايه اللي بيميّزه عن غيره؟", en: "What makes it different?" }}
                 a={{ ar: "الكثافة. والترتيب. كل درس مكتوب بنفس الشكل، بيربط الهجوم بالدفاع طول الوقت، وما بيقفزش لحاجة قبل ما يبني اللي قبلها. مفيش حشو. مفيش فيديوهات تسويقية. مفيش \"اشترك زي الأبطال\". مفيش مدرّب بيلبس بدلة ويصرخ في الكاميرا. شغل وبس.",
                      en: "Density and sequence. Every lesson is written in the same shape, ties offense to defense directly, and doesn't skip ahead without building what comes before. No fluff, no marketing videos." }} />
          </div>
        </section>

        {/* ============== CTA ============== */}
        <section className="px-4 md:px-10 py-20 border-b-[5px] border-black rb-invert">
          <div className="max-w-4xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-4 flex items-center gap-3">
              <span className="w-8 h-[3px] bg-white" />
              <T ar="ابدأ الآن" en="Start Now" />
            </div>
            <h2 className="font-display text-[clamp(40px,7vw,96px)] leading-[0.92] tracking-tighter mb-6">
              <T ar="ادخل الدورة." en="ENTER THE COURSE." />
            </h2>
            <p className="max-w-xl leading-relaxed mb-8">
              <T
                ar="بطّل تتفرّق على 12 منصة. بطّل تجمّع PDFs مش هتقراها. بطّل تشتري كورسات بتنام في الـ wishlist. سكة واحدة. مبنية من شغل حقيقي. مش من سلايدات. ادخل."
                en="Stop juggling 12 platforms. Follow one path built from real operational experience."
              />
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/course" className="px-6 py-4 bg-white text-black border-[3px] border-white font-bold uppercase tracking-[0.14em] text-sm flex items-center gap-2 hover:bg-black hover:text-white">
                <T ar="ادخل الدورة" en="Enter Course" />
                <Arrow className="w-4 h-4" strokeWidth={3} />
              </Link>
              <Link href="/course/lessons/lab-setup" className="px-6 py-4 bg-transparent text-white border-[3px] border-white font-bold uppercase tracking-[0.14em] text-sm flex items-center gap-2 hover:bg-white hover:text-black">
                <T ar="ابدأ من الدرس الأول" en="Start With Lesson One" />
              </Link>
            </div>
          </div>
        </section>

        {/* ============== LEGAL ============== */}
        <section className="px-4 md:px-10 py-10">
          <div className="border-[3px] border-black p-5 flex gap-3 bg-white">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={3} />
            <div>
              <div className="font-display text-[12px] uppercase tracking-[0.16em] mb-2">
                <T ar="إخلاء مسؤولية قانوني" en="Legal Notice" />
              </div>
              <T
                ar="المحتوى ده للمحترفين والجهات اللي معاها تفويض قانوني تشتغل اختبار اختراق ودفاع سيبراني. كل تقنية بتتنفّذ في بيئة معزولة، أو على نظام معاك ورق صريح بتجربته. أي استخدام تاني؟ التبعات على اللي بينفّذ. ما حدش هيتشال عنه."
                en="This material is intended for professionals and parties legally authorized to perform penetration testing and cyber-defense work. Every technique is to be executed in an isolated lab or on systems you have written authorization to test. Any other use is the user's responsibility."
              />
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}

/* ===================== sub components ===================== */

function Stat({ n, k, bordered = false }: { n: string | number; k: { ar: string; en: string }; bordered?: boolean }) {
  const { lang } = useI18n();
  return (
    <div className={`p-5 ${bordered ? "border-s-[3px] border-black" : ""}`}>
      <div className="font-display text-4xl md:text-5xl leading-none">{n}</div>
      <div className="text-[11px] uppercase tracking-[0.16em] font-bold mt-2">{k[lang]}</div>
    </div>
  );
}

function Bullet({
  n, title, desc, bordered = false,
}: { n: string; title: { ar: string; en: string }; desc: { ar: string; en: string }; bordered?: boolean }) {
  const { lang } = useI18n();
  return (
    <div className={`p-5 ${bordered ? "border-s-[3px] border-black" : ""}`}>
      <div className="font-display text-2xl mb-2">{n}</div>
      <div className="font-display text-base uppercase tracking-tight mb-1">{title[lang]}</div>
      <div className="text-sm">{desc[lang]}</div>
    </div>
  );
}

function TierCard({
  tier, status, title, desc, count, duration,
}: {
  tier: string;
  status: "success" | "info" | "warning" | "error";
  title: { ar: string; en: string };
  desc: { ar: string; en: string };
  count: string;
  duration: string;
}) {
  const { lang } = useI18n();
  const colorVar = {
    success: "var(--rb-success)",
    info: "var(--rb-link)",
    warning: "var(--rb-warning)",
    error: "var(--rb-error)",
  }[status];
  return (
    <Link
      href="/course/roadmap"
      className="group relative p-6 border-r-[3px] border-b-[3px] last:border-r-0 border-black hover:bg-black hover:text-white transition-colors"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="font-display text-6xl leading-none" style={{ color: colorVar }}>{tier.padStart(2, "0")}</div>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] px-2 py-1 border-[2px]" style={{ borderColor: colorVar, color: colorVar }}>
          T{tier}
        </span>
      </div>
      <div className="font-display text-xl mb-2 leading-tight">{title[lang]}</div>
      <div className="text-sm mb-6 min-h-[2.5em]">{desc[lang]}</div>
      <div className="flex items-center justify-between text-[11px] eng uppercase tracking-[0.14em] font-bold">
        <span>{count} lessons</span>
        <span>{duration}</span>
      </div>
    </Link>
  );
}

function Pillar({
  kind, tag, title, desc, items, icon,
}: {
  kind: "red" | "blue" | "amber";
  tag: string;
  title: { ar: string; en: string };
  desc: { ar: string; en: string };
  items: string[];
  icon: React.ReactNode;
}) {
  const { lang } = useI18n();
  const color = { red: "var(--rb-error)", blue: "var(--rb-link)", amber: "var(--rb-warning)" }[kind];
  return (
    <div className="p-6 border-e-[3px] last:border-e-0 border-black bg-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 border-[3px] border-black flex items-center justify-center" style={{ background: color, color: "#fff" }}>
          {icon}
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] font-bold">{tag}</div>
      </div>
      <div className="font-display text-2xl mb-3 leading-tight">{title[lang]}</div>
      <p className="text-sm leading-relaxed mb-5">{desc[lang]}</p>
      <ul className="border-t-[3px] border-black">
        {items.map((it) => (
          <li key={it} className="border-b-[1px] border-black/30 last:border-b-0 py-2 text-sm eng flex items-center gap-2">
            <span className="w-2 h-2 inline-block" style={{ background: color }} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AudienceItem({ label }: { label: { ar: string; en: string } }) {
  const { lang } = useI18n();
  return <span className="font-display text-xl uppercase tracking-tight">{label[lang]}</span>;
}

function Highlight({ icon, title, desc }: { icon: React.ReactNode; title: { ar: string; en: string }; desc: { ar: string; en: string } }) {
  const { lang } = useI18n();
  return (
    <div className="p-5 border-e-[3px] border-b-[3px] border-black last:border-e-0 hover:bg-black hover:text-white transition-colors">
      <div className="flex items-center gap-2 mb-2 font-display text-base uppercase tracking-tight">
        {icon}{title[lang]}
      </div>
      <div className="text-sm">{desc[lang]}</div>
    </div>
  );
}

function HowStep({
  n, title, desc, bordered = false,
}: { n: string; title: { ar: string; en: string }; desc: { ar: string; en: string }; bordered?: boolean }) {
  const { lang } = useI18n();
  return (
    <div className={`p-6 ${bordered ? "border-s-[3px] border-black" : ""}`}>
      <div className="font-display text-5xl leading-none mb-4">{n}</div>
      <div className="font-display text-lg uppercase tracking-tight mb-2">{title[lang]}</div>
      <div className="text-sm">{desc[lang]}</div>
    </div>
  );
}

function FAQ({ q, a }: { q: { ar: string; en: string }; a: { ar: string; en: string } }) {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b-[3px] border-black last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-4 px-5 py-4 text-start font-display text-lg md:text-xl uppercase tracking-tight ${
          open ? "bg-black text-white" : "hover:bg-black hover:text-white"
        }`}
      >
        <span>{q[lang]}</span>
        {open ? <Minus className="w-5 h-5 shrink-0" strokeWidth={3} /> : <Plus className="w-5 h-5 shrink-0" strokeWidth={3} />}
      </button>
      {open && (
        <div className="px-5 py-5 leading-relaxed">{a[lang]}</div>
      )}
    </div>
  );
}
