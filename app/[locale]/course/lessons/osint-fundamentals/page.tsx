"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="osint-fundamentals">
      <L
        ar={<>
          <Section title="ما هو OSINT ولماذا يهم محقق فيدرالي؟">
            <Analogy>
              تخيل أنك تبحث عن شخص في مدينة كبيرة. لا تستطيع كسر الأبواب أو طلب وثائق، لكن يمكنك أن تقرأ لافتاته،
              تتابع نشاطه على لوحة الإعلانات، وتجمع كل ما يقوله بصوت عالٍ في مكان عام. هذا هو OSINT — جمع المعلومات
              من مصادر مفتوحة بشكل قانوني، ثم تحويل القطع المتفرقة إلى صورة قابلة للاستخدام في تحقيق.
            </Analogy>
            <p>
              OSINT (Open-Source Intelligence) هو الجمع المنظم للمعلومات المتاحة علناً: مواقع، شبكات اجتماعية،
              سجلات الشركات، نطاقات DNS، صور الأقمار الصناعية، تسريبات بيانات منشورة. كل ما يفعله محقق Red Team أو محلل
              تهديدات في مرحلة الاستطلاع يبدأ من هنا.
            </p>
          </Section>

          <Section title="دورة حياة OSINT — أربع مراحل">
            <Step n={1} title="التخطيط (Planning)">
              ابدأ بسؤال محدد. "اعرف كل شيء عن الشركة" سؤال سيئ. "ما هي عناوين IP العامة لـ target.gov ومن يدير DNS؟" سؤال جيد.
            </Step>
            <Step n={2} title="الجمع (Collection)">
              اجمع البيانات الخام: subdomains، WHOIS، شهادات TLS، حسابات اجتماعية، صور EXIF، سجلات GitHub.
            </Step>
            <Step n={3} title="المعالجة والتحقق (Processing)">
              نظف البيانات، تأكد من المصدر. صورة شخصية على LinkedIn ≠ دليل. فلترة الضوضاء أهم من جمعها.
            </Step>
            <Step n={4} title="التحليل والإسناد (Analysis)">
              اربط القطع. شخص A يستخدم نفس username في 4 مواقع، يعمل في الشركة X، ظهر في صورة EXIF موقعها بمدينة Y.
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
                  <li>Wayback Machine — نسخ الصفحات القديمة</li>
                </ul>
              </Card>
              <Card title="OSINT بشري (HUMINT)" color="amber">
                <ul>
                  <li>LinkedIn — هيكل الشركة، التقنيات</li>
                  <li>GitHub — كود مسرّب، asecrets، أسماء المطورين</li>
                  <li>Telegram / Discord — قنوات مغلقة</li>
                  <li>صور EXIF — موقع، كاميرا، وقت</li>
                  <li>سجلات تسريبات (HIBP, DeHashed) — كلمات مرور قديمة</li>
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
              عند تحليل حملة هجومية، OSINT هو ما يحول "هاكر مجهول" إلى "مجموعة في منطقة زمنية محددة، تستخدم نفس
              البنية التحتية في حملة سابقة، يكتب اسمها في commits على GitHub". هذا أصعب جزء.
            </p>
            <Card title="مؤشرات إسناد قوية" color="green">
              <ul>
                <li>إعادة استخدام الـ infrastructure (نفس IP، نفس registrar، نفس SSL fingerprint)</li>
                <li>أخطاء OPSEC (نسي VPN، ظهر IP حقيقي في log واحد)</li>
                <li>أنماط لغوية في المالوير (تعليقات، أخطاء إملائية، توقيت compile)</li>
                <li>إعادة استخدام usernames أو email aliases</li>
              </ul>
            </Card>
          </Section>

          <Callout kind="danger" title="حدود قانونية">
            OSINT قانوني، لكن خطوات مثل تجاوز حواجز الدخول، إنشاء حسابات مزيفة لاختراق مجموعات خاصة، أو الوصول إلى
            بيانات مسرّبة قد لا تكون قانونية في كل ولاية. اعمل دائماً ضمن authorization مكتوب وراجع
            <span className="eng"> 18 U.S.C. § 1030</span> ومراسيم الوكالة قبل أي اختبار.
          </Callout>

          <Callout kind="good" title="الدفاع — تقليل بصمة OSINT">
            <ul>
              <li>راقب ما يظهر عن منظمتك في crt.sh و Shodan أسبوعياً (digital footprint monitoring)</li>
              <li>منع تسريب metadata في الصور و PDF قبل النشر</li>
              <li>سياسة GitHub: scan كل repo بـ TruffleHog قبل الجعل public</li>
              <li>درّب الموظفين على ما لا يجب نشره على LinkedIn (مكدس تقنيات داخلي مثلاً)</li>
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
