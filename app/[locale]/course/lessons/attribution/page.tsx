"use client";
import { LessonShell, Section, Callout, Code, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="attribution">
      <L
        ar={<>
          <Section title="مين المهاجم؟ — فن الـ Attribution">
            <Analogy>المحقق في مسرح الجريمة مش بيدور على البصمة بس، هو بيدور على أسلوب الجريمة، نوع السلاح، ميعاد التنفيذ، وحتى ريحة المعطف. كدة بنتبع المهاجم: مش IP واحد، إحنا بندور على <b>باترن كامل</b>.</Analogy>
            <Callout kind="warn" title="تنبيه مهم">الـ attribution صعب وفي أغلب الأوقات بيكون <i>احتمالي</i> مش قاطع. المحترفين بيستخدموا false flags عشان يوجهوا التهمة لجهة تانية. متبنيش قرار قانوني على دليل واحد لوحده.</Callout>
          </Section>
          <Section title="هرم الأدلة والـ TTPs">
            <p>إحنا بنلم المؤشرات (IOCs) والسلوكيات (TTPs) ونقارنهم بمكتبة الـ threat actors المعروفين (APT28, APT29, Lazarus, Conti...).</p>
            <ul>
              <li><b>Diamond Model</b> — Adversary, Capability, Infrastructure, Victim.</li>
              <li><b>MITRE ATT&amp;CK Mapping</b> — مطابقة كل خطوة بتقنية.</li>
              <li><b>Cyber Kill Chain</b> — أين كانت الفجوات.</li>
            </ul>
          </Section>
          <Section title="جمع معلومات عن المهاجم وهو شغال">
            <h3>1. على مستوى الشبكة</h3>
            <ul>
              <li>عناوين IP والـ ASN — هل هو VPS ولا Tor ولا residential proxy؟</li>
              <li>بصمات JA3 / JA4 للـ TLS client — بتكشف الأداة المستخدمة.</li>
              <li>بصمات الـ User-Agent وترتيب الـ HTTP headers.</li>
              <li>توقيت الـ requests (timezone analysis) — هو بيشتغل امتى؟</li>
            </ul>
            <h3>2. على مستوى الأدوات</h3>
            <ul>
              <li>هاش الـ payload وقارنه في VirusTotal, MalwareBazaar, ANY.RUN.</li>
              <li>الميتاداتا جوه الـ implant (PDB path, compile timestamp, language pack).</li>
              <li>إعادة استخدام C2 domains — راجع RiskIQ / DomainTools / Censys.</li>
              <li>أنماط الكود — خوارزمية تشفير فريدة، أخطاء إملائية بتتكرر.</li>
            </ul>
            <h3>3. على مستوى السلوك</h3>
            <ul>
              <li>ساعات الشغل (لو 9-5 بتوقيت موسكو، ده باترن APT28/29).</li>
              <li>أسلوب الـ post-exploitation (بيستخدم PsExec ولا WMIexec؟).</li>
              <li>اختيار الأهداف جوه الشبكة (DC ولا mail server ولا backup؟).</li>
            </ul>
          </Section>
          <Section title="Honeytokens & Beacons — خلي المهاجم يكشف نفسه">
            <p>دي أعظم أدوات تتبع. خليه هو اللي يقولك بنفسه إنه دخل، ومن فين، وبيعمل إيه.</p>
            <TwoCol>
              <Card title="Web Bugs" color="amber">رابط مخفي في الصفحة، اليوزر العادي مش هيوصله. أي spider بيفتحه = إنذار.</Card>
              <Card title="DNS Tokens" color="amber">دومين فريد لكل ضحية. أول DNS lookup له، إنت كشفته.</Card>
              <Card title="AWS Tokens" color="amber">مفتاح AWS مزيف جوه ملف .env. أول مرة يستخدمه، الإنذار بيوصل ومعاه IP المهاجم.</Card>
              <Card title="Office Document Tokens" color="amber">ملف .docx فيه صورة بتجيب من URL مراقَب — بيكشف لك مين فتح الملف.</Card>
            </TwoCol>
            <h3>تتبع الـ exfiltration</h3>
            <ul>
              <li>حط ملفات "طعم" فيها tracking pixels.</li>
              <li>استخدم watermarking — كل نسخة من الملف فيها معرف مخفي يكشف مصدر التسريب.</li>
            </ul>
          </Section>
          <Section title="OSINT معكوس — تحقيق على المهاجم نفسه">
            <Step n={1} title="من الـ IP / Domain / Wallet">
              <Code lang="recon on attacker">{`# WHOIS history
whoisxml.com / domaintools.com
# Same IP hosted what?
shodan host 1.2.3.4
viewdns.info reverseip
# Passive DNS
mnemonic.no / circl.lu / VirusTotal Graph
# Linked to a known APT?
malpedia.caad.fkie.fraunhofer.de
mitre.org/groups`}</Code>
            </Step>
            <Step n={2} title="من ملف خبيث">ارفعه على ANY.RUN, Joe Sandbox, Tria.ge, Hatching Triage. دور على: مسارات PDB، تعليقات بلغة معينة، C2 servers، أسماء الـ mutex.</Step>
            <Step n={3} title="من العملة المشفرة (لو فدية)">Chainalysis, TRM Labs, blockchain.info — اتبع المحفظة. كل mixer بيضعّف الإخفاء شوية، بس مش بيلغيه.</Step>
            <Step n={4} title="من نشاط على المنتديات">راقب BreachForums, XSS, Exploit.in, Telegram channels — هما بيستخدموا نفس الـ handles ونفس PGP fingerprints وjabber IDs على مدار سنين.</Step>
          </Section>
          <Section title="مشاركة واستهلاك الـ Threat Intelligence">
            <ul>
              <li><b>MISP</b> — منصة مفتوحة لمشاركة IOCs/TTPs.</li>
              <li><b>STIX/TAXII</b> — معايير الصيغة والنقل.</li>
              <li><b>المصادر</b>: AlienVault OTX, Mandiant Advantage, Recorded Future, MS Threat Intel, CISA AIS.</li>
              <li>جدول CISA KEV — ثغرات بتتستغل فعلياً، رتب أولويات الترقيع منه.</li>
            </ul>
          </Section>
          <Section title="إنت كـ White Hat تقدر تعمل إيه ومتقدرش تعمل إيه">
            <Callout kind="danger" title="ممنوع قانونياً">
              <ul>
                <li>تخترق سيرفر المهاجم (hack-back) — مخالف للقانون في أغلب الدول.</li>
                <li>تعمل DoS على بنيته التحتية.</li>
                <li>تتنكر بشخصيته.</li>
              </ul>
            </Callout>
            <Callout kind="good" title="مسموح">
              <ul>
                <li>تجمع كل المعلومات من OSINT ومن السجلات بتاعتك.</li>
                <li>تتواصل مع CERT الوطني وجهات إنفاذ القانون.</li>
                <li>تطلب إنزال البنية التحتية للمهاجم عن طريق الـ registrars / hosting providers (abuse@ + spamhaus / shadowserver).</li>
                <li>تشارك IOCs مع المجتمع عشان تحمي ضحايا تانيين.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="لو وصلت لبنية المهاجم بإذن قانوني">
            <p>تحت أمر قضائي أو بتنسيق مع CERT وطني، جهة إنفاذ القانون ممكن تستولي على سيرفر C2. ساعتها لازم:</p>
            <ol>
              <li>تحافظ على سلسلة الحفظ (chain of custody) — كل لمسة موثقة.</li>
              <li>تاخد forensic image كاملة قبل أي حاجة.</li>
              <li>تحلل قاعدة الضحايا، تسترجع البيانات المسروقة، تبلغ المتأثرين.</li>
              <li>تحول الـ C2 لـ sinkhole عشان تجمع المؤشرات (بتنسيق دولي).</li>
            </ol>
          </Section>
          <Section title="مثال تطبيقي مختصر">
            <ol>
              <li><b>الهجوم</b>: phishing → macro → Cobalt Strike beacon → privesc → domain admin → exfil على MEGA.</li>
              <li><b>الكشف</b>: Sysmon شاف winword.exe → powershell.exe -enc؛ Sentinel رفع تنبيه.</li>
              <li><b>الاحتواء</b>: عزل الجهاز عبر Defender؛ إلغاء الـ tokens؛ بلوك دومين الـ C2.</li>
              <li><b>التتبع</b>: بصمة JA3 + ميتاداتا الـ payload طابقت FIN7.</li>
              <li><b>تتبع موسع</b>: Canarytoken جوه ملف وهمي اتنزل — كشف الـ IP الحقيقي قبل ما المهاجم يدخل VPN.</li>
              <li><b>التقرير</b>: شاركنا الـ IOCs في MISP مع الـ CERT.</li>
            </ol>
          </Section>
        </>}
        en={<>
          <Section title="Who's the attacker? — the art of attribution">
            <Analogy>An investigator at a crime scene doesn't just look at fingerprints — they study the method, the weapon, the time, even the smell of the coat. We track attackers the same way: not via a single IP, but a <b>full pattern</b>.</Analogy>
            <Callout kind="warn" title="Important caveat">Attribution is hard and often <i>probabilistic</i>, not definitive. Pros use false flags to misdirect blame. Never base a legal decision on a single artifact.</Callout>
          </Section>
          <Section title="Pyramid of evidence and TTPs">
            <p>We collect indicators (IOCs) and behaviors (TTPs) and compare them against the library of known threat actors (APT28, APT29, Lazarus, Conti...).</p>
            <ul>
              <li><b>Diamond Model</b> — Adversary, Capability, Infrastructure, Victim.</li>
              <li><b>MITRE ATT&amp;CK mapping</b> — match each step to a technique.</li>
              <li><b>Cyber Kill Chain</b> — where the gaps were.</li>
            </ul>
          </Section>
          <Section title="Gathering info on the attacker during the attack">
            <h3>1. Network level</h3>
            <ul>
              <li>IPs and ASN — VPS, Tor, residential proxy?</li>
              <li>JA3 / JA4 TLS client fingerprints reveal the tool used.</li>
              <li>User-Agent fingerprints and HTTP header order.</li>
              <li>Request timing (timezone analysis) — when are they active?</li>
            </ul>
            <h3>2. Tool level</h3>
            <ul>
              <li>Payload hashes — check VirusTotal, MalwareBazaar, ANY.RUN.</li>
              <li>Implant metadata (PDB path, compile timestamp, language pack).</li>
              <li>C2 domain reuse — query RiskIQ / DomainTools / Censys.</li>
              <li>Code patterns — unique crypto, recurring typos.</li>
            </ul>
            <h3>3. Behavior level</h3>
            <ul>
              <li>Working hours (e.g., 9–5 Moscow time suggests APT28/29).</li>
              <li>Post-exploitation style (PsExec vs WMIexec?).</li>
              <li>Target selection inside the network (DC, mail server, backups?).</li>
            </ul>
          </Section>
          <Section title="Honeytokens & beacons — make the attacker reveal themselves">
            <p>The single most valuable hunting tool — the attacker tells you they're in, where from, and what they're doing.</p>
            <TwoCol>
              <Card title="Web Bugs" color="amber">A hidden link on a page that normal users never click. Any spider that fetches it = alert.</Card>
              <Card title="DNS Tokens" color="amber">A unique domain per victim. The first DNS lookup gives you the attacker's IP.</Card>
              <Card title="AWS Tokens" color="amber">Fake AWS keys in a .env file. Their use raises an alarm with the attacker's IP.</Card>
              <Card title="Office Document Tokens" color="amber">A .docx with a remote image tied to a monitored URL — reveals who opened it.</Card>
            </TwoCol>
            <h3>Tracking exfiltration</h3>
            <ul>
              <li>Place "bait" files containing tracking pixels.</li>
              <li>Use watermarking — every copy carries a hidden identifier so you can trace the leak.</li>
            </ul>
          </Section>
          <Section title="Reverse OSINT — investigating the attacker">
            <Step n={1} title="From IP / Domain / Wallet">
              <Code lang="recon on attacker">{`# WHOIS history
whoisxml.com / domaintools.com
# Same IP hosted what?
shodan host 1.2.3.4
viewdns.info reverseip
# Passive DNS
mnemonic.no / circl.lu / VirusTotal Graph
# Linked to a known APT?
malpedia.caad.fkie.fraunhofer.de
mitre.org/groups`}</Code>
            </Step>
            <Step n={2} title="From a malicious file">Submit to ANY.RUN, Joe Sandbox, Tria.ge, Hatching Triage. Look for: PDB paths, language artifacts, C2 servers, mutex names.</Step>
            <Step n={3} title="From cryptocurrency (if ransomware)">Chainalysis, TRM Labs, blockchain.info — trace the wallet. Each mixer slightly weakens anonymity.</Step>
            <Step n={4} title="From forum activity">Watch BreachForums, XSS, Exploit.in, Telegram channels — handles, PGP fingerprints, and jabber IDs are reused for years.</Step>
          </Section>
          <Section title="Sharing and consuming Threat Intelligence">
            <ul>
              <li><b>MISP</b> — open platform for sharing IOCs/TTPs.</li>
              <li><b>STIX/TAXII</b> — format and transport standards.</li>
              <li><b>Sources</b>: AlienVault OTX, Mandiant Advantage, Recorded Future, MS Threat Intel, CISA AIS.</li>
              <li>The CISA KEV catalog — vulns actively exploited; prioritize patching by it.</li>
            </ul>
          </Section>
          <Section title="What you can and can't do as a White Hat">
            <Callout kind="danger" title="Legally forbidden">
              <ul>
                <li>Hacking back the attacker's server — illegal in most jurisdictions.</li>
                <li>DoS-ing their infrastructure.</li>
                <li>Impersonating them.</li>
              </ul>
            </Callout>
            <Callout kind="good" title="Allowed">
              <ul>
                <li>Collect everything via OSINT and your own logs.</li>
                <li>Engage your national CERT and law enforcement.</li>
                <li>Request takedowns via registrars / hosting providers (abuse@ + spamhaus / shadowserver).</li>
                <li>Share IOCs with the community to protect future victims.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="If law enforcement reaches the attacker's infra (with authority)">
            <p>Under a court order or coordinated CERT operation, law enforcement may seize a C2 server. When that happens:</p>
            <ol>
              <li>Maintain chain of custody — every action documented.</li>
              <li>Take a full forensic image before anything else.</li>
              <li>Analyze the victim list, recover stolen data, notify those affected.</li>
              <li>Convert the C2 into a sinkhole to gather indicators (with international coordination).</li>
            </ol>
          </Section>
          <Section title="Worked example">
            <ol>
              <li><b>Attack</b>: phishing → macro → Cobalt Strike beacon → privesc → domain admin → exfil via MEGA.</li>
              <li><b>Detection</b>: Sysmon flagged winword.exe → powershell.exe -enc; Sentinel alert.</li>
              <li><b>Containment</b>: host isolated via Defender; tokens revoked; C2 domain blocked.</li>
              <li><b>Tracking</b>: JA3 fingerprint + payload metadata matched FIN7.</li>
              <li><b>Extended tracking</b>: a Canarytoken inside a fake file was downloaded — leaked the attacker's true IP before VPN.</li>
              <li><b>Reporting</b>: shared IOCs in MISP with CERT.</li>
            </ol>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
