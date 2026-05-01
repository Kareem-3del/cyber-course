"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="osint-fundamentals">
      <L
        ar={<>
          <Section title="هو OSINT ده إيه أصلاً؟">
            <p>اللي إنت بتعمله ع Google ولا حاجة جدّية؟</p>
            <p>اللي بتعمله Bellingcat لما بيكشفوا قاتل في سوريا من صورة ظل، ده نفس اللي إنت بتعمله لما بتدوّر على إيميل صاحبتك القديمة؟</p>
            <p>الـ FBI analyst اللي قاعد يحلّل APT operator، شغله في Maltego ده "بحث على Google" برضه؟</p>
            <p>بُص. الإجابة: لا، آه، وآه. الفرق مش في الأدوات — الفرق في العقلية.</p>
            <Analogy>
              OSINT مش جاسوس بكاميرا في فيلم.
              OSINT هو المخبر القديم اللي قاعد على القهوة. عينه على كل اللي بيعدي. بياخد باله من اللافتة، من الإعلان، من الكلمة اللي اتقالت بصوت عالي.
              مش بيكسر باب. مش بيطلب أوراق. بس آخر اليوم، عارف كل اللي محتاج يعرفه.
              الفرق بينه وبينك إنه بيشك في كل حاجة، وبيدوّن كل حاجة، وبيربط الحاجات ببعض.
            </Analogy>
            <p>OSINT (Open-Source Intelligence) = جمع منظّم لمعلومات متاحة للعامة: مواقع، شبكات اجتماعية، سجلات شركات، DNS، صور أقمار صناعية، تسريبات بيانات منشورة.</p>
            <p>أي Red Team بيعمل recon، أي threat intel analyst شغّال على incident، أي محقق فيدرالي بيتابع actor — بيبدأ من هنا. مفيش غنى عنه.</p>
          </Section>

          <Section title="السيناريو: APT operator سرّب إيميل، اعمل إيه؟">
            <p>تعالى نمشي على حالة. وصلك إيميل تسريب: <code>shadow_op_42@protonmail.com</code>. التسريب بيقول إن صاحب الإيميل ده عنصر في مجموعة بتستهدف بنية تحتية حكومية. مفيش حاجة تانية. ابدأ منين؟</p>
            <p>ما تيجيش تفتح Google وتكتب الإيميل وتضغط Enter. ده شغل عيال صغيرة. اشتغل بعقلية المخبر.</p>
          </Section>

          <Section title="دورة حياة OSINT — خمس مراحل">
            <p>الأكاديميين عاملين ليها أسامي رنانة. أنا هقولهالك بالبلدي.</p>
            <Step n={1} title="Direction — إنت بتدوّر على إيه؟">
              ابدأ بسؤال محدّد. "اعرف كل حاجة عن الـ operator" سؤال عك.
              "إيه الـ aliases التانية اللي بيستخدمها shadow_op_42؟ في أي forums؟ من امتى؟" — ده سؤال شاطر.
              لو السؤال مش محدّد، الإجابة هتبقى ضوضا.
            </Step>
            <Step n={2} title="Collection — اجمع الـ raw">
              Sherlock بيدوّر الـ username عبر 400+ موقع. Hunter.io بيشوف الإيميل اتنشر فين. Dehashed بيقولك التسريبات اللي فيها الإيميل ده. Wayback بيوريك حسابات قديمة اتشالت.
              اجمع كل حاجة. ما تفلتر هنا — هتفلتر بعدين.
            </Step>
            <Step n={3} title="Processing — نضّف الزبالة">
              صورة LinkedIn مش دليل. اسم متشابه مش نفس الشخص. اتأكد من المصدر، من التاريخ، من السياق.
              فلترة الضوضا أهم من إنك تكتر منها. الـ junior بيجمع 5000 حاجة، الـ senior بيرمي 4900 ويبقى فاضل عنده 100 موثوقة.
            </Step>
            <Step n={4} title="Analysis — اربط القطع">
              shadow_op_42 بيستخدم نفس الـ username على XSS forum من 2019. هناك بيتكلم روسي. بس في commit واحد على GitHub قديم بيستخدم نفس الإيميل، فيه typo بيقول "habibi" — مش راجل من موسكو يا حبيبي.
              كده إنت بتبني صورة.
            </Step>
            <Step n={5} title="Dissemination — وصّلها لمين بيحتاجها">
              التقرير اللي ما حدش قراه = ما اتكتبش. اعرف عميلك. الـ SOC analyst عايز IOCs. الـ executive عايز bullet points. الـ prosecutor عايز chain of custody.
            </Step>
          </Section>

          <Section title="تصنيف المصادر — INTs الخمسة">
            <p>الناس بتسمع الكلمات دي وتجري. بُص، الموضوع بسيط:</p>
            <ul>
              <li><b>HUMINT</b> (Human Intelligence) — معلومات من بشر. مقابلات، forums، قنوات Telegram. مثال: تحليل بوستات Conti اللي اتسرّبت من العضو المتخاصم في 2022 — كله HUMINT من leaked chats.</li>
              <li><b>SIGINT</b> (Signals Intelligence) — اعتراض اتصالات. في الـ open source: passive DNS، BGP feeds، شهادات TLS من crt.sh.</li>
              <li><b>IMINT</b> (Imagery Intelligence) — صور أقمار صناعية. مثال: Bellingcat استخدمت Sentinel-2 و Maxar عشان يثبتوا تحرّكات روسية في 2022 قبل ما الحرب تبدأ.</li>
              <li><b>SOCMINT</b> (Social Media Intelligence) — Twitter, LinkedIn, Telegram, Discord. الـ APT operators بيعملوا OPSEC ممتاز في الـ malware، وبيكتبوا اسمهم الحقيقي على Twitter. حقيقة.</li>
              <li><b>GEOINT</b> (Geospatial Intelligence) — موقع جغرافي. EXIF في الصور، سحاب في الخلفية، ظل عمارة، لافتة شارع. الـ Bellingcat geolocation challenges أحسن مدرسة.</li>
            </ul>
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

          <Section title="الأدوات — متى تستخدم كل واحدة">
            <p>الواقع vs المفروض: المفروض إنك تعرف كل أداة. الواقع، إنت محتاج تعرف امتى تستخدم كل واحدة. الفرق كبير.</p>
            <ul>
              <li><b>Maltego</b> — لما الـ entities كتير وعايز ترسم الـ graph. ممتاز للـ attribution. مش ممتاز للسرعة.</li>
              <li><b>Spiderfoot</b> — automation كامل. بتدّيله target، بيرجعلك تقرير. كويس للـ scoping السريع، ضعيف في الـ depth.</li>
              <li><b>Sherlock</b> — username عبر 400 موقع. أداتك الأولى لما يبقى عندك alias.</li>
              <li><b>Hunter.io</b> — لما عايز إيميلات موظفي شركة. بدون ما تحرق نفسك.</li>
              <li><b>dehashed</b> / <b>HIBP</b> — التسريبات. بس انتبه — في دول استخدامها مش قانوني من غير warrant.</li>
              <li><b>Shodan</b> — أي حاجة فيها IP. الـ banner بيقولك حاجات الـ vendor نفسه نسي يخفيها.</li>
              <li><b>theHarvester</b> — جمع سريع لإيميلات و subdomains من passive sources. كويس كنقطة بداية.</li>
            </ul>
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
            <p>لما بتشرّح حملة هجومية، الـ OSINT هو اللي بيحوّل "هاكر مجهول" لـ "مجموعة في منطقة زمنية معيّنة، مستخدمة نفس الـ infrastructure من حملة سابقة، واسمها ظهر في commit على GitHub".</p>
            <p>وده أصعب شغل في الـ field كله.</p>
            <Card title="مؤشرات إسناد قوية" color="green">
              <ul>
                <li>إعادة استخدام الـ infrastructure (نفس IP، نفس registrar، نفس SSL fingerprint)</li>
                <li>غلطات OPSEC — نسي يفتح VPN، فظهر IP حقيقي في log واحد</li>
                <li>أنماط لغوية في الـ malware (تعليقات، أخطاء إملائية، توقيت الـ compile)</li>
                <li>إعادة استخدام usernames أو email aliases عبر خدمات مختلفة</li>
              </ul>
            </Card>
          </Section>

          <Callout kind="warn" title="الإسناد بيحرق ناس كتير — اوعى تكون منهم">
            <p>قصة حقيقية. في 2017 حصل هجوم على Olympic Destroyer (PyeongChang Olympics). كل المؤشرات في أول يوم كانت بتقول روسيا. lazarus كمان دخلت في القايمة. كل التحليلات الأولية ربطت الموضوع بـ Fancy Bear.</p>
            <p>طلع المهاجمين كانوا حاطين false flags عن قصد. عاملين الكود كأنه شغل لازاروس الكوري. الـ timestamps متظبّطة على Pyongyang. الـ comments بكوري.</p>
            <p>كل اللي اتسرّع وقال "روسيا" أو "كوريا الشمالية" في أول يوم، اتحرق.</p>
            <p>الـ junior بيشوف IP روسي، يقول "روسيا". الـ senior بيقول "ممكن، بس ليه IP روسي مكشوف؟ ده شغل junior ولا false flag؟"</p>
            <p>غلطة الـ attribution ممكن تجيب حرب. بُص. ما تستعجلش.</p>
          </Callout>

          <Section title="القانون — للـ federal analyst تحديداً">
            <p>إنت داخل على الـ federal SOC. قبل ما تكتب أمر واحد، اعرف:</p>
            <ul>
              <li><b>الـ OSINT في حد ذاته قانوني</b> — قراية مواقع عامة، WHOIS، Shodan، crt.sh، LinkedIn — كل ده مفيش فيه مشكلة.</li>
              <li><b>تعدية access controls</b> = جريمة تحت <span className="eng">18 U.S.C. § 1030</span> (CFAA). حتى لو الـ login form ضعيف. حتى لو الباسورد "admin/admin". إنت لو دخلت من غير authorization، إنت مخالف.</li>
              <li><b>Breach corpora</b> (HIBP, DeHashed, COMB) — استخدامها للأبحاث الـ defensive عادي. بس الـ federal analyst محتاج warrant أو exigent circumstances قبل ما يستخدم credentials منها لـ pivot على حساب فعلي.</li>
              <li><b>Sock puppets في جروبات مقفولة</b> — لو الجروب فيه expectation of privacy، إنت محتاج warrant. الـ Fourth Amendment مش بيختفي لأنك على Telegram.</li>
              <li><b>الـ FISA Section 702</b> بيحكم كل اللي بيتجمع على non-US persons. والـ Section 215 بيحكم metadata. اعرف الفرق قبل ما تجمع حاجة.</li>
            </ul>
            <Callout kind="danger" title="القاعدة الذهبية">
              لو في شك، اتكلم مع الـ legal counsel بتاع الوكالة قبل ما تجمع. مش بعد. الـ evidence اللي اتجمعت غلط بترميها المحكمة، والقضية بتطير. الـ prosecutor مش هيرحمك.
            </Callout>
          </Section>

          <Callout kind="good" title="الحماية — قلّل بصمتك في OSINT">
            <ul>
              <li>راقب اللي بيطلع عن مؤسستك على crt.sh و Shodan أسبوعياً (digital footprint monitoring)</li>
              <li>شيل metadata من الصور و PDF قبل النشر</li>
              <li>سياسة GitHub: كل repo يتسكن بـ TruffleHog قبل ما يبقى public</li>
              <li>درّب الموظفين على اللي ما يتحطش على LinkedIn (الـ stack الداخلي مثلاً)</li>
            </ul>
          </Callout>

          <Section title="الخلاصة الناشفة">
            <p>OSINT مش كلمة مفتاح في Google.</p>
            <p>هي عقلية شك منظّمة.</p>
            <p>اللي بيشتغل بيها صح، بيشوف اللي مش شايفه التانيين. اللي بيستعجل، بيغلط في الـ attribution، وبيوقّع نفسه في مشاكل قانونية، وبيحرق القضية.</p>
            <p>اوعى تستعجل على الإسناد. اشتغل بهدوء. شك في كل حاجة. وثّق كل خطوة.</p>
          </Section>

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
