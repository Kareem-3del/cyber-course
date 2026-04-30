"use client";
import { LessonShell, Section, Callout, Code, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="attribution">
      <L
        ar={<>
          <Section title="مَن المهاجم؟ — فن نسب الهجمات">
            <Analogy>المحقق في مسرح الجريمة لا يبحث عن البصمة فقط، بل عن أسلوب الجريمة، نوع السلاح، ساعة الوقوع، حتى رائحة المعطف. هكذا نتتبع المهاجم: ليس IP واحد بل <b>نمط كامل</b>.</Analogy>
            <Callout kind="warn" title="تحذير مهم">الـ attribution صعب و كثيراً ما يكون <i>احتمالياً</i> لا قاطعاً. المهاجمون المحترفون يستخدمون false flags لتوجيه التهمة لجهة أخرى. لا تبني قراراً قانونياً على دليل واحد.</Callout>
          </Section>
          <Section title="هرم الأدلة و TTPs">
            <p>نسعى لجمع المؤشرات (IOCs) و سلوكيات (TTPs) و مقارنتها بمكتبة الـ threat actors المعروفة (APT28, APT29, Lazarus, Conti...).</p>
            <ul>
              <li><b>Diamond Model</b> — Adversary, Capability, Infrastructure, Victim.</li>
              <li><b>MITRE ATT&amp;CK Mapping</b> — مطابقة كل خطوة بتقنية.</li>
              <li><b>Cyber Kill Chain</b> — أين كانت الفجوات.</li>
            </ul>
          </Section>
          <Section title="جمع المعلومات عن المهاجم خلال الهجوم">
            <h3>1. على مستوى الشبكة</h3>
            <ul>
              <li>عناوين IP و ASN — هل هو VPS, Tor, residential proxy؟</li>
              <li>بصمات JA3 / JA4 للـ TLS client — تكشف الأداة المستخدمة.</li>
              <li>بصمات User-Agent و ترتيب الـ HTTP headers.</li>
              <li>توقيت الطلبات (timezone analysis) — متى يكون نشطاً غالباً؟</li>
            </ul>
            <h3>2. على مستوى الأدوات</h3>
            <ul>
              <li>هاش الـ payload + قارن في VirusTotal, MalwareBazaar, ANY.RUN.</li>
              <li>ميتاداتا في الـ implant (PDB path, compile timestamp, language pack).</li>
              <li>إعادة استخدام C2 domains — راجع RiskIQ / DomainTools / Censys.</li>
              <li>أنماط الكود — خوارزمية تشفير فريدة، أخطاء إملائية ثابتة.</li>
            </ul>
            <h3>3. على مستوى السلوك</h3>
            <ul>
              <li>وقت العمل (مثلاً 9-5 بتوقيت موسكو يشير لـ APT28/29).</li>
              <li>أسلوب الـ post-exploitation (هل يستخدم PsExec أم WMIexec؟).</li>
              <li>اختيار الأهداف داخل الشبكة (DC, mail server, backup؟).</li>
            </ul>
          </Section>
          <Section title="Honeytokens & Beacons — جذب المهاجم لكشف نفسه">
            <p>أعظم أدوات تتبع المهاجم — تجعله يخبرك بنفسه أنه دخل، و من أين، و ماذا يفعل.</p>
            <TwoCol>
              <Card title="Web Bugs" color="amber">رابط مخفي في صفحة لا يظهر للمستخدم العادي. أي spider يفتحه = إنذار.</Card>
              <Card title="DNS Tokens" color="amber">دومين فريد لكل ضحية. أول DNS lookup له = هويتك مكشوفة.</Card>
              <Card title="AWS Token" color="amber">مفتاح AWS مزيف في ملف .env. استخدامه يولّد إنذاراً مع IP المهاجم.</Card>
              <Card title="Office Document Tokens" color="amber">ملف .docx يحوي صورة ترتبط بـ URL مراقَب — يكشف من فتحه.</Card>
            </TwoCol>
            <h3>تتبع الـ exfiltration</h3>
            <ul>
              <li>ضع ملفات «طُعم» تحتوي tracking pixels.</li>
              <li>استخدم watermarking — كل نسخة من الملف تحوي معرّفاً مخفياً يكشف مصدر التسرب.</li>
            </ul>
          </Section>
          <Section title="OSINT المعكوس — تحقيق على المهاجم">
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
            <Step n={2} title="من ملف خبيث">ارفعه في ANY.RUN, Joe Sandbox, Tria.ge, Hatching Triage. ابحث عن: مسارات PDB، تعليقات لغة، خوادم C2، مفاتيح mutex.</Step>
            <Step n={3} title="من العملة المشفرة (لو فدية)">Chainalysis, TRM Labs, blockchain.info — تتبع المحفظة. كل mixer يضعف الإخفاء قليلاً.</Step>
            <Step n={4} title="من نشاط على المنتديات">مراقبة BreachForums, XSS, Exploit.in, Telegram channels لاستخدامهم نفس الـ handles, PGP fingerprints, jabber IDs عبر سنوات.</Step>
          </Section>
          <Section title="مشاركة و استهلاك Threat Intelligence">
            <ul>
              <li><b>MISP</b> — منصة مفتوحة لمشاركة IOCs/TTPs.</li>
              <li><b>STIX/TAXII</b> — معايير صيغة و نقل.</li>
              <li><b>المصادر</b>: AlienVault OTX, Mandiant Advantage, Recorded Future, MS Threat Intel, CISA AIS.</li>
              <li>جدول CISA KEV — ثغرات تُستغل فعلياً، رتّب الترقيع بحسبه.</li>
            </ul>
          </Section>
          <Section title="ماذا تستطيع و ماذا لا تستطيع كـ White Hat">
            <Callout kind="danger" title="ما يُمنع قانونياً">
              <ul>
                <li>اختراق سيرفر المهاجم (hack-back) — مخالف للقانون في معظم الدول.</li>
                <li>تنفيذ DoS على بنيته.</li>
                <li>التظاهر بشخصيته.</li>
              </ul>
            </Callout>
            <Callout kind="good" title="ما يُسمح به">
              <ul>
                <li>جمع كل المعلومات من OSINT و سجلاتك.</li>
                <li>التواصل مع CERT الوطني و جهات إنفاذ القانون.</li>
                <li>طلب إنزال البنية التحتية للمهاجم عبر registrars / hosting providers (abuse@ + spamhaus / shadowserver).</li>
                <li>مشاركة IOCs مع المجتمع لمنع ضحايا آخرين.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="إن استطعت الوصول لبنية المهاجم بإذن قانوني">
            <p>تحت أمر قضائي / تنسيق مع CERT وطني، قد تتمكن جهة إنفاذ القانون من الاستيلاء على سيرفر C2. عند ذلك يجب:</p>
            <ol>
              <li>الحفاظ على سلسلة الحفظ (chain of custody) — كل لمسة موثقة.</li>
              <li>عمل forensic image كاملة قبل أي شيء.</li>
              <li>تحليل قاعدة الضحايا، استرجاع البيانات المسروقة، إخطار المتأثرين.</li>
              <li>تحويل الـ C2 إلى sinkhole لتجميع المؤشرات (مع تنسيق دولي).</li>
            </ol>
          </Section>
          <Section title="مثال تطبيقي مختصر">
            <ol>
              <li><b>الهجوم</b>: phishing → macro → Cobalt Strike beacon → privesc → domain admin → exfil عبر MEGA.</li>
              <li><b>الكشف</b>: Sysmon رصد winword.exe → powershell.exe -enc؛ تنبيه Sentinel.</li>
              <li><b>الاحتواء</b>: عزل الجهاز عبر Defender؛ إبطال tokens؛ حظر دومين الـ C2.</li>
              <li><b>التتبع</b>: بصمة JA3 + ميتاداتا الـ payload طابقت FIN7.</li>
              <li><b>التتبع الموسع</b>: Canarytoken داخل ملف وهمي تم تنزيله — أعطى IP حقيقياً قبل دخوله الـ VPN.</li>
              <li><b>التقرير</b>: مشاركة الـ IOCs في MISP مع CERT.</li>
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
