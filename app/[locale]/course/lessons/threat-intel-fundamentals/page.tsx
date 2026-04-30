"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="threat-intel-fundamentals">
      <L
        ar={<>
          <Section title="ما هي Threat Intelligence">
            <p>الـ CTI (Cyber Threat Intelligence) ليس قائمة IPs. هو <b>معرفة قابلة للتنفيذ</b> تجيب: من يستهدفنا؟ كيف؟ ماذا نفعل؟ تحوّل البيانات الخام إلى قرارات.</p>
            <Analogy>الـ CTI كقسم استخبارات في جيش. الأقمار الصناعية تجمع بيانات (raw)، المحلّلون يحوّلونها لـ "خصمك يحرّك دبّابتين على الجبهة الشمالية" (intel). القائد يقرّر: نعزّز الجبهة الشمالية أم نتجاهل؟</Analogy>
          </Section>

          <Section title="مستويات الـ Intel">
            <TwoCol>
              <Card title="Strategic" color="blue">
                للقيادة. لا تقني. "هل ينبغي أن نقلق من APT41 هذا الربع؟". مدى زمني: شهور–سنوات.
              </Card>
              <Card title="Operational" color="amber">
                للمدراء و leads الـ SOC. "حملة جديدة من Volt Typhoon تستهدف الطاقة بـ TTPs X و Y". مدى: أسابيع–شهور.
              </Card>
              <Card title="Tactical" color="red">
                للمحلّلين. "FIN12 يستخدم Cobalt Strike مع SMB beacon على :445". مدى: أيام–أسابيع.
              </Card>
              <Card title="Technical" color="green">
                للأدوات. "هذه الـ hashes/IPs/domains. ابلوكها". مدى: ساعات–أيام (تتقادم بسرعة).
              </Card>
            </TwoCol>
          </Section>

          <Section title="The Pyramid of Pain — لماذا ليست كل IOCs متساوية">
            <p>من David Bianco. ترتّب IOCs بمدى صعوبة تغييرها على المهاجم:</p>
            <Code lang="text">{`            ┌─────────────┐
            │   TTPs      │  ← تغييرها يكلّف المهاجم أسابيع و إعادة بناء
            ├─────────────┤
            │   Tools     │  ← أيام–أسابيع
            ├─────────────┤
            │ Network/Host│  ← ساعات
            │  Artifacts  │
            ├─────────────┤
            │ Domain Names│  ← دقائق
            ├─────────────┤
            │ IP Addresses│  ← دقائق
            ├─────────────┤
            │ Hash Values │  ← ثواني (يغيّر byte واحد)
            └─────────────┘`}</Code>
            <Callout kind="info" title="الدرس">
              لا تطارد hashes فقط. الكشف الأقوى على <b>TTPs</b>: "process tree حيث Word يولّد PowerShell" أكثر قيمة من "block hash X".
            </Callout>
          </Section>

          <Section title="Diamond Model — كيف تنظّم تحليل حادث">
            <p>كل حادث يُحلّل عبر 4 رؤوس Diamond:</p>
            <Code lang="text">{`              [Adversary]
                  |
                  |
   [Capability]──┼──[Infrastructure]
                  |
                  |
               [Victim]`}</Code>
            <ul>
              <li><b>Adversary</b> — من؟ (APT29 / Lazarus / criminal group / unknown).</li>
              <li><b>Capability</b> — ماذا؟ (malware, exploits, social engineering).</li>
              <li><b>Infrastructure</b> — من أين؟ (C2 servers, phishing domains).</li>
              <li><b>Victim</b> — على من؟ (sectors, geographies, specific orgs).</li>
            </ul>
            <p>أي حادث ابدأ بثلاثة معروفة و pivot للرابعة. مثال: لديك Capability (mimikatz) + Infrastructure (C2 IP) + Victim (your org). Pivot للـ Adversary عبر CTI feeds.</p>
          </Section>

          <Section title="STIX & TAXII — اللغة الموحدة">
            <ul>
              <li><b>STIX 2.1</b> — JSON schema لتمثيل intel: indicators, malware, threat actors, attack patterns. أصبح المعيار.</li>
              <li><b>TAXII 2.1</b> — protocol لنقل STIX بين أنظمة. RESTful API.</li>
            </ul>
            <Code lang="json">{`{
  "type": "indicator",
  "spec_version": "2.1",
  "id": "indicator--d81f86b9-975b-4c0b-875e-810c5ad45a4f",
  "created": "2026-04-30T14:00:00Z",
  "name": "APT29 C2 domain",
  "indicator_types": ["malicious-activity"],
  "pattern": "[domain-name:value = 'evil-c2.com']",
  "pattern_type": "stix",
  "valid_from": "2026-04-30T00:00:00Z",
  "labels": ["apt29", "cobalt-strike"]
}`}</Code>
          </Section>

          <Section title="MISP — منصة CTI مفتوحة المصدر">
            <p>MISP (Malware Information Sharing Platform) أكثر منصة CTI انتشاراً. يستخدمها CERT-EU و CIRCL و كثير من الـ ISACs.</p>
            <Code lang="bash">{`# pyMISP — استعلام برمجي
from pymisp import PyMISP
misp = PyMISP('https://misp.target.gov', api_key, ssl=True)

# ابحث عن hash
result = misp.search(controller='attributes', value='aabbccdd...')

# pivoting — events شاركت هذا الـ IP
result = misp.search(controller='events', value='1.2.3.4')

# tags بشكل آلي — Galaxy clusters (mitre-attack-pattern, threat-actor)`}</Code>
            <Callout kind="info" title="بدائل / مكمّلات">
              <span className="eng">OpenCTI</span> (واجهة أحدث، graph-based)، <span className="eng">ThreatConnect</span> (تجاري)، <span className="eng">Anomali ThreatStream</span>، <span className="eng">Mandiant Advantage</span>، <span className="eng">CrowdStrike Falcon Intelligence</span>.
            </Callout>
          </Section>

          <Section title="IOC Pivoting — فن السلسلة">
            <p>تنطلق من IOC واحد، تعرف اثنين، ثلاثة، عشرة. هذه المهارة الأهم في CTI.</p>
            <Code lang="text">{`بداية: phishing email
  ↓ extract
sender IP: 185.x.x.x
  ↓ VirusTotal passive DNS
hosted domains: evil-c2.com, evil-phish.org, drop-zone.xyz
  ↓ urlscan.io
SSL cert SHA1: ab12... (also seen on 5 other IPs)
  ↓ CT logs (crt.sh) — same cert subject pattern
6 more domains registered same day
  ↓ WHOIS — same registrant email (anonymous)
  ↓ reverse WHOIS — that email registered 23 domains in 6 months
  ↓ malware hash hosted on one of these
  ↓ VirusTotal — sandbox shows beacon to evil-c2.com (cycle detected)
  ↓ ATT&CK — beacon pattern matches APT-X profile

نتيجة: من email واحد → 30+ IOCs + attribution + TTPs`}</Code>
            <Callout kind="good" title="مصادر pivoting أساسية">
              <ul>
                <li><b>VirusTotal Intelligence</b> — passive DNS, file behavior, related samples.</li>
                <li><b>urlscan.io</b> — DOM, screenshots, related submissions.</li>
                <li><b>Shodan / Censys</b> — internet-wide scans, banner search.</li>
                <li><b>crt.sh</b> — Certificate Transparency logs.</li>
                <li><b>SecurityTrails / DomainTools</b> — historical DNS, WHOIS.</li>
                <li><b>Hunter.io / Skymem</b> — emails by domain.</li>
                <li><b>GreyNoise</b> — تصنيف الـ scanners (benign vs malicious).</li>
                <li><b>AbuseIPDB</b> — sightings community.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="OSINT للمحقق — Maltego">
            <p>Maltego يحوّل pivoting من نشاط يدوي لـ graph visual. كل عنصر "Entity"، كل عملية pivoting "Transform". Transforms من VirusTotal, Shodan, PassiveTotal، DomainTools.</p>
            <ul>
              <li>Maltego Community Edition مجاني (محدود).</li>
              <li>Maltego CaseFile للتحقيقات الكبيرة.</li>
              <li>أمثلة: ابدأ بـ domain → اكتشف email registrant → اكتشف flickr/twitter ذات الإيميل → اكتشف صور geolocated.</li>
            </ul>
          </Section>

          <Section title="Threat Actor Profiling — كيف تقرأ تقرير CTI">
            <Callout kind="good" title="أسئلة تحدد قيمة التقرير">
              <ol>
                <li><b>من Adversary؟</b> هل هناك attribution مع confidence (high/medium/low)؟</li>
                <li><b>ما TTPs؟</b> مرتبطة بـ MITRE ATT&CK؟</li>
                <li><b>ما IOCs؟</b> hashes, IPs, domains, YARA rules — في format machine-readable.</li>
                <li><b>ما Detection?</b> Sigma rules, KQL queries جاهزة؟</li>
                <li><b>ما Recommendations؟</b> mitigations محددة؟</li>
                <li><b>ما الـ Confidence؟</b> ما الذي تعرفه عيناً، ما الذي تستنتجه؟</li>
              </ol>
            </Callout>
            <p>أفضل مصادر تقارير:</p>
            <ul>
              <li><b>Mandiant / Google TAG</b> — APT focus.</li>
              <li><b>CrowdStrike Global Threat Report</b> — سنوي مفصّل.</li>
              <li><b>Microsoft Threat Intelligence</b> — قوي على هويات و cloud.</li>
              <li><b>CISA Advisories</b> — رسمي، مع IOCs و mitigations.</li>
              <li><b>FBI FLASH / PIN reports</b> — عبر InfraGard للقطاع الخاص.</li>
              <li><b>ISACs</b> (FS-ISAC, MS-ISAC) — قطاعية، sharing community.</li>
              <li><b>Recorded Future, Flashpoint</b> — تجارية، underground sources.</li>
            </ul>
          </Section>

          <Section title="بناء برنامج CTI — من الصفر">
            <ol>
              <li><b>عرّف PIRs</b> (Priority Intelligence Requirements). أمثلة: "أي مجموعة تستهدف قطاعنا؟"، "أي ثغرة جديدة في الأنظمة التي نشغّلها؟". لا تجمع ما لا تستطيع استخدامه.</li>
              <li><b>اختر مصادرك.</b> 2–3 free + 1–2 paid feeds. ليس كل feed مفيد.</li>
              <li><b>طبّق tooling.</b> MISP/OpenCTI كـ central platform. اربطها بـ SIEM لـ matching.</li>
              <li><b>اكتب reports أسبوعية</b> للقيادة (1 صفحة) و SOC (technical).</li>
              <li><b>قِس قيمة intel</b>: كم تنبيه نتج عن feed X؟ كم منها true positive؟ كم detections جديدة بناءً على intel؟</li>
            </ol>
          </Section>

          <Section title="Federal context">
            <Callout kind="info" title="بيئة خاصة">
              <ul>
                <li><b>USIC</b> (US Intelligence Community) و التعاون مع الـ FBI Cyber Division و NSA و CISA. الفصل بين Title 50 (intel) و Title 18 (law enforcement) جوهري.</li>
                <li><b>CTIIC</b> (Cyber Threat Intelligence Integration Center) — مركز تكامل tactical/operational/strategic.</li>
                <li><b>InfraGard</b> — partnership مع private sector. للمحقق طريقة لتلقي/مشاركة intel مع 16 sector.</li>
                <li><b>Classification</b> — تعلّم نظام (UNCLASSIFIED, FOUO, CUI, CONFIDENTIAL, SECRET, TS, TS/SCI). لا تشارك intel مصنّف خارج clearance.</li>
                <li><b>TLP</b> (Traffic Light Protocol) — معيار civilian لمشاركة intel: RED, AMBER, GREEN, CLEAR. تعلّمه قبل أن تُشارك أي تقرير.</li>
              </ul>
            </Callout>
          </Section>
        </>}
        en={<>
          <Section title="What threat intelligence is">
            <p>CTI is not a list of IPs. It's <b>actionable knowledge</b> answering: who's targeting us? how? what do we do? It turns raw data into decisions.</p>
            <Analogy>CTI is a military intel section. Satellites collect raw data; analysts turn it into "the adversary moved two tanks to the northern front" (intel). The commander decides: reinforce the north, or ignore?</Analogy>
          </Section>

          <Section title="Levels of intel">
            <TwoCol>
              <Card title="Strategic" color="blue">
                For leadership. Non-technical. "Should we worry about APT41 this quarter?". Horizon: months–years.
              </Card>
              <Card title="Operational" color="amber">
                For managers and SOC leads. "New Volt Typhoon campaign hits energy with TTPs X and Y". Horizon: weeks–months.
              </Card>
              <Card title="Tactical" color="red">
                For analysts. "FIN12 uses Cobalt Strike with SMB beacon on :445". Horizon: days–weeks.
              </Card>
              <Card title="Technical" color="green">
                For tools. "These hashes/IPs/domains. Block them". Horizon: hours–days (decays fast).
              </Card>
            </TwoCol>
          </Section>

          <Section title="The Pyramid of Pain — not all IOCs are equal">
            <p>From David Bianco. Ranks IOCs by how hard it is for the attacker to change them:</p>
            <Code lang="text">{`            ┌─────────────┐
            │   TTPs      │  ← changing them costs the attacker weeks + rebuilding
            ├─────────────┤
            │   Tools     │  ← days–weeks
            ├─────────────┤
            │ Network/Host│  ← hours
            │  Artifacts  │
            ├─────────────┤
            │ Domain Names│  ← minutes
            ├─────────────┤
            │ IP Addresses│  ← minutes
            ├─────────────┤
            │ Hash Values │  ← seconds (flip a byte)
            └─────────────┘`}</Code>
            <Callout kind="info" title="Lesson">
              Don't just chase hashes. The strongest detections target <b>TTPs</b>: "process tree where Word spawns PowerShell" beats "block hash X".
            </Callout>
          </Section>

          <Section title="Diamond Model — how to structure incident analysis">
            <p>Every incident is decomposed across 4 vertices:</p>
            <Code lang="text">{`              [Adversary]
                  |
                  |
   [Capability]──┼──[Infrastructure]
                  |
                  |
               [Victim]`}</Code>
            <ul>
              <li><b>Adversary</b> — who? (APT29 / Lazarus / criminal group / unknown).</li>
              <li><b>Capability</b> — what? (malware, exploits, social engineering).</li>
              <li><b>Infrastructure</b> — from where? (C2 servers, phishing domains).</li>
              <li><b>Victim</b> — against whom? (sectors, geographies, specific orgs).</li>
            </ul>
            <p>Start an investigation with three known vertices and pivot to the fourth. Example: you know Capability (mimikatz) + Infrastructure (C2 IP) + Victim (your org). Pivot to Adversary via CTI feeds.</p>
          </Section>

          <Section title="STIX & TAXII — the lingua franca">
            <ul>
              <li><b>STIX 2.1</b> — JSON schema for representing intel: indicators, malware, threat actors, attack patterns. The de-facto standard.</li>
              <li><b>TAXII 2.1</b> — protocol for transporting STIX between systems. RESTful API.</li>
            </ul>
            <Code lang="json">{`{
  "type": "indicator",
  "spec_version": "2.1",
  "id": "indicator--d81f86b9-975b-4c0b-875e-810c5ad45a4f",
  "created": "2026-04-30T14:00:00Z",
  "name": "APT29 C2 domain",
  "indicator_types": ["malicious-activity"],
  "pattern": "[domain-name:value = 'evil-c2.com']",
  "pattern_type": "stix",
  "valid_from": "2026-04-30T00:00:00Z",
  "labels": ["apt29", "cobalt-strike"]
}`}</Code>
          </Section>

          <Section title="MISP — open-source CTI platform">
            <p>MISP (Malware Information Sharing Platform) is the most widely deployed CTI platform. CERT-EU, CIRCL, and many ISACs run it.</p>
            <Code lang="bash">{`# pyMISP — programmatic queries
from pymisp import PyMISP
misp = PyMISP('https://misp.target.gov', api_key, ssl=True)

# Search by hash
result = misp.search(controller='attributes', value='aabbccdd...')

# Pivot — events that shared this IP
result = misp.search(controller='events', value='1.2.3.4')

# Auto-tagging — Galaxy clusters (mitre-attack-pattern, threat-actor)`}</Code>
            <Callout kind="info" title="Alternatives / complements">
              <span className="eng">OpenCTI</span> (newer UI, graph-based), <span className="eng">ThreatConnect</span> (commercial), <span className="eng">Anomali ThreatStream</span>, <span className="eng">Mandiant Advantage</span>, <span className="eng">CrowdStrike Falcon Intelligence</span>.
            </Callout>
          </Section>

          <Section title="IOC pivoting — the art of the chain">
            <p>You start with one IOC and learn two, three, ten. The single most important CTI skill.</p>
            <Code lang="text">{`Start: phishing email
  ↓ extract
sender IP: 185.x.x.x
  ↓ VirusTotal passive DNS
hosted domains: evil-c2.com, evil-phish.org, drop-zone.xyz
  ↓ urlscan.io
SSL cert SHA1: ab12... (also seen on 5 other IPs)
  ↓ CT logs (crt.sh) — same cert subject pattern
6 more domains registered same day
  ↓ WHOIS — same registrant email (anonymous)
  ↓ reverse WHOIS — that email registered 23 domains in 6 months
  ↓ a malware hash hosted on one of them
  ↓ VirusTotal — sandbox shows beacon to evil-c2.com (cycle detected)
  ↓ ATT&CK — beacon pattern matches APT-X profile

Result: one email → 30+ IOCs + attribution + TTPs`}</Code>
            <Callout kind="good" title="Core pivoting sources">
              <ul>
                <li><b>VirusTotal Intelligence</b> — passive DNS, file behavior, related samples.</li>
                <li><b>urlscan.io</b> — DOM, screenshots, related submissions.</li>
                <li><b>Shodan / Censys</b> — internet-wide scans, banner search.</li>
                <li><b>crt.sh</b> — Certificate Transparency logs.</li>
                <li><b>SecurityTrails / DomainTools</b> — historical DNS, WHOIS.</li>
                <li><b>Hunter.io / Skymem</b> — emails by domain.</li>
                <li><b>GreyNoise</b> — categorize internet scanners (benign vs malicious).</li>
                <li><b>AbuseIPDB</b> — community sightings.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="OSINT for the investigator — Maltego">
            <p>Maltego turns pivoting from manual work into a visual graph. Each item is an "Entity", each pivot a "Transform". Transforms exist for VirusTotal, Shodan, PassiveTotal, DomainTools.</p>
            <ul>
              <li>Maltego Community Edition is free (limited).</li>
              <li>Maltego CaseFile for big investigations.</li>
              <li>Examples: start with a domain → registrant email → flickr/twitter for that email → geolocated photos.</li>
            </ul>
          </Section>

          <Section title="Threat-actor profiling — how to read a CTI report">
            <Callout kind="good" title="Questions that judge a report's value">
              <ol>
                <li><b>Who's the adversary?</b> Attribution with confidence (high/medium/low)?</li>
                <li><b>What TTPs?</b> Mapped to MITRE ATT&CK?</li>
                <li><b>What IOCs?</b> Hashes, IPs, domains, YARA — machine-readable.</li>
                <li><b>What detections?</b> Ready-to-use Sigma rules, KQL queries?</li>
                <li><b>What recommendations?</b> Concrete mitigations?</li>
                <li><b>What's the confidence level?</b> What's seen vs inferred?</li>
              </ol>
            </Callout>
            <p>Best report sources:</p>
            <ul>
              <li><b>Mandiant / Google TAG</b> — APT focus.</li>
              <li><b>CrowdStrike Global Threat Report</b> — annual, deep.</li>
              <li><b>Microsoft Threat Intelligence</b> — strong on identity and cloud.</li>
              <li><b>CISA Advisories</b> — official, with IOCs and mitigations.</li>
              <li><b>FBI FLASH / PIN reports</b> — via InfraGard for the private sector.</li>
              <li><b>ISACs</b> (FS-ISAC, MS-ISAC) — sector-specific sharing.</li>
              <li><b>Recorded Future, Flashpoint</b> — commercial, underground sources.</li>
            </ul>
          </Section>

          <Section title="Building a CTI program — from zero">
            <ol>
              <li><b>Define PIRs</b> (Priority Intelligence Requirements). Examples: "Which groups target our sector?", "Any new vuln in software we run?". Don't collect what you can't act on.</li>
              <li><b>Pick sources.</b> 2–3 free + 1–2 paid feeds. Not every feed adds value.</li>
              <li><b>Stand up tooling.</b> MISP/OpenCTI as the central platform. Wire it to the SIEM for matching.</li>
              <li><b>Ship weekly reports</b> for leadership (1-pager) and SOC (technical).</li>
              <li><b>Measure intel value</b>: how many alerts came from feed X? how many true positives? how many new detections informed by intel?</li>
            </ol>
          </Section>

          <Section title="Federal context">
            <Callout kind="info" title="Specific environment">
              <ul>
                <li><b>USIC</b> (US Intelligence Community) and coordination with FBI Cyber Division, NSA, CISA. The Title 50 (intel) vs Title 18 (law enforcement) split is fundamental.</li>
                <li><b>CTIIC</b> (Cyber Threat Intelligence Integration Center) — integration hub for tactical/operational/strategic intel.</li>
                <li><b>InfraGard</b> — public/private partnership. Lets investigators share/receive intel with 16 sectors.</li>
                <li><b>Classification</b> — learn the system (UNCLASSIFIED, FOUO, CUI, CONFIDENTIAL, SECRET, TS, TS/SCI). Never share classified intel beyond your clearance.</li>
                <li><b>TLP</b> (Traffic Light Protocol) — civilian standard for sharing: RED, AMBER, GREEN, CLEAR. Learn it before forwarding any report.</li>
              </ul>
            </Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
