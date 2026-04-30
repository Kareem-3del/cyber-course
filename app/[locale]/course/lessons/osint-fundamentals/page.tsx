"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="osint-fundamentals">
      <L
        ar={<>
          <Section title="ما هو OSINT ولماذا يهم محقق فيدرالي؟">
            <Analogy>
              تخيل إنك بتدوّر على واحد في مدينة كبيرة. مينفعش تكسر باب ولا تطلب أوراق، بس تقدر تقرا لافتاته،
              تتابع إعلاناته، وتسمع أي حاجة هو بنفسه قالها بصوت عالي في الشارع. ده الـ OSINT — جمع معلومات
              من مصادر مفتوحة وبشكل قانوني، وبعدين تحوّل القطع المبعثرة لصورة تنفع تحقيق فعلي.
            </Analogy>
            <p>
              OSINT (Open-Source Intelligence) = جمع منظّم لمعلومات متاحة للعامة: مواقع، شبكات اجتماعية،
              سجلات شركات، DNS، صور أقمار صناعية، تسريبات بيانات منشورة. أي Red Team بيعمل recon أو محلل tehdid
              بيشتغل في incident — بيبدأ من هنا.
            </p>
          </Section>

          <Section title="دورة حياة OSINT — أربع مراحل">
            <Step n={1} title="التخطيط (Planning)">
              ابدأ بسؤال محدّد. "اعرف كل حاجة عن الشركة" سؤال عك. "إيه الـ public IPs لـ target.gov ومين بيدير الـ DNS؟" سؤال شاطر.
            </Step>
            <Step n={2} title="الجمع (Collection)">
              اجمع الـ raw data: subdomains، WHOIS، TLS certs، حسابات اجتماعية، EXIF، GitHub.
            </Step>
            <Step n={3} title="المعالجة والتحقق (Processing)">
              نضّف الـ data وتأكد من المصدر. صورة LinkedIn مش دليل. فلترة الضوضا أهم من إنك تكتر منها.
            </Step>
            <Step n={4} title="التحليل والإسناد (Analysis)">
              اربط القطع. واحد بيستخدم نفس الـ username في 4 مواقع، شغّال في شركة X، وفي صورة EXIF موقعها مدينة Y. كده أنت بتـ build a picture.
            </Step>
          </Section>

          <Section title="فئات المصادر الأساسية">
            <TwoCol>
              <Card title="بصمة البنية التحتية" color="blue">
                <ul>
                  <li>WHOIS / RDAP — مالك النطاق</li>
                  <li>crt.sh — شهادات TLS و subdomains</li>
                  <li>Shodan / Censys — أجهزة وخدمات مكشوفة</li>
                  <li>SecurityTrails / DNSdumpster — تاريخ DNS</li>
                  <li>Wayback Machine — نسخ صفحات قديمة</li>
                </ul>
              </Card>
              <Card title="OSINT بشري (HUMINT)" color="amber">
                <ul>
                  <li>LinkedIn — الهيكل التنظيمي والتقنيات</li>
                  <li>GitHub — كود مسرّب، secrets، أسامي المطوّرين</li>
                  <li>Telegram / Discord — قنوات مقفولة</li>
                  <li>EXIF في الصور — موقع وكاميرا ووقت</li>
                  <li>قواعد التسريبات (HIBP, DeHashed) — باسوردات قديمة</li>
                </ul>
              </Card>
            </TwoCol>
          </Section>

          <Section title="أدوات يومية">
            <Code lang="bash">{`# اكتشاف subdomains
subfinder -d target.gov -all -silent | tee subs.txt
amass enum -passive -d target.gov

# شهادات TLS من crt.sh
curl -s "https://crt.sh/?q=target.gov&output=json" | jq -r '.[].name_value' | sort -u

# WHOIS و reverse-IP
whois target.gov
curl -s "https://api.hackertarget.com/reverseiplookup/?q=$(dig +short target.gov | head -1)"

# Wayback URLs
curl -s "https://web.archive.org/cdx/search/cdx?url=target.gov/*&output=text&fl=original&collapse=urlkey"`}</Code>
            <Terminal lines={[
              { p: "subfinder -d target.gov -silent" },
              { o: "api.target.gov\nmail.target.gov\nportal.target.gov\ndev.target.gov\nold-staging.target.gov" },
              { p: "shodan host 198.51.100.42" },
              { o: "Hostnames: portal.target.gov\nPorts: 22, 80, 443, 8080\nServices: OpenSSH 7.6, nginx 1.18\nVulns: CVE-2023-XXXX (medium)" },
            ]} />
          </Section>

          <Section title="OSINT للإسناد — من فعل ماذا؟">
            <p>
              لما بتشرّح حملة هجومية، الـ OSINT هو اللي بيحوّل "هاكر مجهول" لـ "مجموعة في منطقة زمنية معيّنة،
              مستخدمة نفس الـ infrastructure من حملة سابقة، واسمها ظهر في commit على GitHub". وده أصعب شغل.
            </p>
            <Card title="مؤشرات إسناد قوية" color="green">
              <ul>
                <li>إعادة استخدام الـ infrastructure (نفس IP، نفس registrar، نفس SSL fingerprint)</li>
                <li>غلطات OPSEC — نسي يفتح VPN، فظهر IP حقيقي في log واحد</li>
                <li>أنماط لغوية في الـ malware (تعليقات، أخطاء إملائية، توقيت الـ compile)</li>
                <li>إعادة استخدام usernames أو email aliases عبر خدمات مختلفة</li>
              </ul>
            </Card>
          </Section>

          <Callout kind="danger" title="حدود قانونية">
            الـ OSINT في حد ذاته قانوني، بس حاجات زي تعدية access controls، أو عمل sock puppets عشان تخش جروبات خاصة،
            أو استخدام breach corpora — مش قانونية في كل دولة. اشتغل دايماً تحت authorization مكتوب، وراجع
            <span className="eng"> 18 U.S.C. § 1030</span> وتعليمات الوكالة قبل أي اختبار.
          </Callout>

          <Callout kind="good" title="الدفاع — قلّل بصمتك في OSINT">
            <ul>
              <li>راقب اللي بيطلع عن مؤسستك على crt.sh و Shodan أسبوعياً (digital footprint monitoring)</li>
              <li>شيل metadata من الصور و PDF قبل النشر</li>
              <li>سياسة GitHub: كل repo يتسكن بـ TruffleHog قبل ما يبقى public</li>
              <li>درّب الموظفين على اللي ما يتحطش على LinkedIn (الـ stack الداخلي مثلاً)</li>
            </ul>
          </Callout>

          <Section title="مصادر">
            <ul>
              <li>OSINT Framework — <span className="eng">osintframework.com</span></li>
              <li>Bellingcat Online Investigation Toolkit</li>
              <li>SANS SEC487 / SEC587 — OSINT analysis</li>
              <li>MITRE ATT&CK — Reconnaissance (TA0043)</li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="What is OSINT and why does it matter?">
            <Analogy>
              Imagine looking for a person in a large city. You can't break doors or demand papers, but you can read
              signage, follow public bulletins, and listen to anything they say out loud in public. That's OSINT —
              legally collecting open-source information and turning fragments into something an investigation can use.
            </Analogy>
            <p>
              OSINT is the structured collection of publicly available information: websites, social platforms,
              corporate filings, DNS records, satellite imagery, leaked breach data. Every Red Team recon phase and
              every threat-intel analyst engagement starts here.
            </p>
          </Section>

          <Section title="The OSINT cycle — four phases">
            <Step n={1} title="Planning">
              Start with a sharp question. "Know everything about the company" is bad. "What public IPs does target.gov
              own and who runs their DNS?" is good.
            </Step>
            <Step n={2} title="Collection">
              Gather raw data: subdomains, WHOIS, TLS certs, social handles, EXIF, GitHub repos.
            </Step>
            <Step n={3} title="Processing & verification">
              Clean and corroborate. A LinkedIn profile photo is not evidence. Filtering noise matters more than
              collecting more of it.
            </Step>
            <Step n={4} title="Analysis & attribution">
              Connect the dots. Person A reuses a username across 4 sites, works at company X, posted a photo whose
              EXIF places them in city Y.
            </Step>
          </Section>

          <Section title="Core source categories">
            <TwoCol>
              <Card title="Infrastructure footprint" titleEn="Infrastructure footprint" color="blue">
                <ul>
                  <li>WHOIS / RDAP — domain ownership</li>
                  <li>crt.sh — TLS certs & subdomains</li>
                  <li>Shodan / Censys — exposed devices and services</li>
                  <li>SecurityTrails / DNSdumpster — DNS history</li>
                  <li>Wayback Machine — historical page captures</li>
                </ul>
              </Card>
              <Card title="Human OSINT (HUMINT)" titleEn="Human OSINT (HUMINT)" color="amber">
                <ul>
                  <li>LinkedIn — org chart, tech stack</li>
                  <li>GitHub — leaked code, secrets, dev names</li>
                  <li>Telegram / Discord — closed channels</li>
                  <li>EXIF — geolocation, camera, timestamp</li>
                  <li>Breach corpora (HIBP, DeHashed) — old credentials</li>
                </ul>
              </Card>
            </TwoCol>
          </Section>

          <Section title="Daily tools">
            <Code lang="bash">{`# Subdomain discovery
subfinder -d target.gov -all -silent | tee subs.txt
amass enum -passive -d target.gov

# TLS certs via crt.sh
curl -s "https://crt.sh/?q=target.gov&output=json" | jq -r '.[].name_value' | sort -u

# WHOIS and reverse-IP
whois target.gov
curl -s "https://api.hackertarget.com/reverseiplookup/?q=$(dig +short target.gov | head -1)"

# Wayback URLs
curl -s "https://web.archive.org/cdx/search/cdx?url=target.gov/*&output=text&fl=original&collapse=urlkey"`}</Code>
            <Terminal lines={[
              { p: "subfinder -d target.gov -silent" },
              { o: "api.target.gov\nmail.target.gov\nportal.target.gov\ndev.target.gov\nold-staging.target.gov" },
              { p: "shodan host 198.51.100.42" },
              { o: "Hostnames: portal.target.gov\nPorts: 22, 80, 443, 8080\nServices: OpenSSH 7.6, nginx 1.18\nVulns: CVE-2023-XXXX (medium)" },
            ]} />
          </Section>

          <Section title="OSINT for attribution — who did what?">
            <p>
              When dissecting a campaign, OSINT is what turns "unknown actor" into "a group operating in a specific
              time zone, reusing infrastructure from a prior campaign, whose handle appears in a GitHub commit." This
              is the hardest part.
            </p>
            <Card title="Strong attribution signals" color="green">
              <ul>
                <li>Infrastructure reuse (same IP, registrar, TLS fingerprint)</li>
                <li>OPSEC slips (forgot the VPN once, real IP shows in one log)</li>
                <li>Linguistic patterns in malware (comments, typos, build timestamps)</li>
                <li>Reused usernames or email aliases across services</li>
              </ul>
            </Card>
          </Section>

          <Callout kind="danger" titleEn="Legal limits">
            OSINT itself is legal, but bypassing access controls, creating sock puppets to infiltrate private groups,
            or accessing breach corpora may not be in every jurisdiction. Always operate under written authorization
            and review <span className="eng">18 U.S.C. § 1030</span> plus your agency's directives before any test.
          </Callout>

          <Callout kind="good" titleEn="Defense — shrink your OSINT footprint">
            <ul>
              <li>Monitor what surfaces about your org on crt.sh and Shodan weekly (digital footprint monitoring)</li>
              <li>Strip metadata from images and PDFs before publishing</li>
              <li>GitHub policy: every repo scanned with TruffleHog before going public</li>
              <li>Train staff on what should not appear on LinkedIn (e.g. internal tech stack)</li>
            </ul>
          </Callout>

          <Section title="References">
            <ul>
              <li>OSINT Framework — <span className="eng">osintframework.com</span></li>
              <li>Bellingcat Online Investigation Toolkit</li>
              <li>SANS SEC487 / SEC587 — OSINT analysis</li>
              <li>MITRE ATT&CK — Reconnaissance (TA0043)</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
