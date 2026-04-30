"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="soc-analyst-day1">
      <L
        ar={<>
          <Section title="ماذا يفعل محلل SOC فعلياً">
            <p>SOC (Security Operations Center) يعمل 24/7. وظيفتك الأولى ليست "إيقاف الهاكرز" — بل <b>فرز التنبيهات</b>: هل هذا حقيقي؟ هل سبق و رأيناه؟ هل يستحق إيقاظ Tier-2؟ ثم توثيق ما رأيت و كيف.</p>
            <Analogy>تخيّل غرفة طوارئ في مستشفى. الممرض الذي يستقبلك في البوابة (Triage Nurse) لا يجري عمليات — يقرر من يدخل فوراً، من ينتظر، و من يُحوَّل لمستشفى آخر. هذا هو محلل SOC من المستوى الأول (Tier-1).</Analogy>
          </Section>

          <Section title="هرم الأدوار في SOC">
            <TwoCol>
              <Card title="Tier-1 — Triage" color="blue">
                يستقبل التنبيهات من SIEM/EDR. يحدد: false positive, benign, escalate. متوسط زمن لكل تذكرة 5–15 دقيقة. غالباً 50–200 تذكرة في المناوبة.
              </Card>
              <Card title="Tier-2 — Investigation" color="amber">
                يأخذ ما رفعه Tier-1. يبحث عمقاً: قراءة logs، تتبع process tree، رسم timeline. يقرّر: حادث أم لا.
              </Card>
              <Card title="Tier-3 — IR / Hunt" color="red">
                Incident Response و Threat Hunting. يقود التعامل مع الحوادث الحقيقية. يكتب detections جديدة. يعمل مع CTI و forensics.
              </Card>
              <Card title="SOC Manager + Engineers" color="green">
                Engineers يبنون detections و يضبطون الأدوات. Manager يتعامل مع SLAs، تقارير الإدارة، و التعاون مع فرق أخرى (Legal, IT, Product).
              </Card>
            </TwoCol>
          </Section>

          <Section title="دورة المناوبة — أول 8 ساعات">
            <Callout kind="good" title="نموذج تشغيل احترافي">
              <ol>
                <li><b>15 دقيقة قبل البداية</b> — اقرأ shift handoff من المناوبة السابقة. ما المفتوح؟ ما الذي يحتاج متابعة؟</li>
                <li><b>اطّلع على dashboards</b> — حالة المصادر (SIEM ingestion، EDR coverage)، تنبيهات مفتوحة، حالات Major Incident.</li>
                <li><b>راجع threat intel daily</b> — هل هناك حملة جديدة تستهدف القطاع؟ مؤشرات جديدة (IOCs)؟</li>
                <li><b>ابدأ بالـ queue</b> — التنبيهات مرتّبة بأولوية. لا تختار الأسهل.</li>
                <li><b>وثّق كل شيء</b> — كل query، كل ملاحظة، كل قرار. القاعدة: لو غادرت الآن هل يستطيع زميلك إكمال العمل؟</li>
                <li><b>قبل النهاية</b> — اكتب handoff واضح: ما أُغلق، ما المفتوح، ما يحتاج المتابعة.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="منهجية فرز التنبيه — السؤال 5W+H">
            <p>أي تنبيه يجب أن يجيب على هذه الأسئلة قبل أن تتخذ قراراً:</p>
            <ul>
              <li><b>What</b> — ما القاعدة (rule) التي أطلقت التنبيه؟ ماذا تعني؟</li>
              <li><b>Who</b> — أي مستخدم/جهاز/IP؟ هل من المعتاد أن يفعل ذلك؟</li>
              <li><b>When</b> — الوقت الدقيق. هل في ساعات العمل؟ هل سبق نمط مماثل؟</li>
              <li><b>Where</b> — أي شبكة، أي نظام، أي subnet؟</li>
              <li><b>Why</b> — هل هناك سبب مشروع؟ تذاكر change، نشاط مستخدم معروف؟</li>
              <li><b>How</b> — كيف وصل المؤشر؟ من أين بدأت السلسلة؟</li>
            </ul>
            <Callout kind="info" title="قاعدة ذهبية">
              "<b>True positive حتى يثبت العكس</b>" أفضل من "false positive حتى يثبت العكس". لا تغلق تنبيهاً بسبب الكسل — اغلقه فقط بدليل.
            </Callout>
          </Section>

          <Section title="استعلامات SIEM شائعة — ابدأ بهذه">
            <h3>Splunk SPL</h3>
            <Code lang="splunk">{`# تسجيل دخول فاشل متكرر ثم ناجح من نفس IP (brute force ناجح)
index=windows EventCode=4625 OR EventCode=4624
| transaction src_ip startswith="EventCode=4625" endswith="EventCode=4624" maxspan=10m
| where eventcount > 5
| table _time src_ip user host

# تنفيذ PowerShell مع تشفير base64
index=sysmon EventCode=1 CommandLine="*-EncodedCommand*" OR CommandLine="*-enc *"
| eval decoded=tostring(base64decode(replace(CommandLine, ".*-[Ee]nc(?:odedCommand)?\\s+(\\S+).*", "\\1")))
| table _time host user CommandLine decoded`}</Code>

            <h3>Microsoft Sentinel KQL</h3>
            <Code lang="kql">{`// تواصل مع IP في threat intel feed
let badIPs = externaldata(IP:string) [@"https://feed.example.com/bad-ips.txt"];
DeviceNetworkEvents
| where TimeGenerated > ago(24h)
| where RemoteIP in (badIPs)
| project TimeGenerated, DeviceName, InitiatingProcessFileName, RemoteIP, RemotePort

// تسجيل دخول مستحيل (impossible travel)
SigninLogs
| where ResultType == 0
| summarize Locations = make_set(LocationDetails.countryOrRegion), Count=count() by UserPrincipalName, bin(TimeGenerated, 1h)
| where array_length(Locations) > 1`}</Code>
          </Section>

          <Section title="EDR — كيف تقرأ process tree">
            <p>الـ EDR (CrowdStrike, Defender, SentinelOne) يعطيك شجرة العمليات. اقرأها من <b>الجذر</b>:</p>
            <Code lang="text">{`explorer.exe (PID 4321)                    ← parent شرعي
  └─ outlook.exe (PID 5678)                ← شرعي
      └─ winword.exe (PID 6789)            ← فتح مرفق Word
          └─ cmd.exe (PID 7890)            ← !! Word لا يجب أن يفتح cmd !!
              └─ powershell.exe -enc ...   ← !!! base64 → تنفيذ`}</Code>
            <Callout kind="info" title="إشارات حمراء كلاسيكية">
              <ul>
                <li>Office app يُولّد cmd/powershell/wscript.</li>
                <li>svchost.exe من path غير <span className="eng">C:\Windows\System32</span>.</li>
                <li>rundll32.exe بدون arguments أو مع DLL في AppData/Temp.</li>
                <li>PowerShell بـ <span className="eng">-EncodedCommand</span>, <span className="eng">-WindowStyle Hidden</span>, <span className="eng">DownloadString</span>.</li>
                <li>schtasks.exe ينشئ مهمة بأسماء عشوائية.</li>
                <li>net.exe يضيف مستخدماً لـ Administrators.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="نظام التذاكر — قواعد التوثيق">
            <p>التذكرة الجيدة قابلة للقراءة بعد سنة. هيكل قياسي:</p>
            <Code lang="markdown">{`## Summary
[سطر واحد] What happened, who, where, when

## Timeline (UTC)
- 14:23 Alert fired: [rule name]
- 14:25 Began investigation
- 14:31 Identified [process X] on [host Y]
- 14:42 Checked [user Z] activity — confirmed/denied legitimate
- 14:55 Closed as [True Positive | False Positive | Benign]

## Evidence
- Splunk query: [paste]
- Process tree: [screenshot/paste]
- IOCs extracted: hash=..., ip=..., domain=...

## Decision
[Closed/Escalated] because [reason]. If escalated: assigned to [Tier-2 name].

## Follow-up
- [ ] Add IOC to block list
- [ ] Open detection-engineering ticket if rule needs tuning`}</Code>
          </Section>

          <Section title="التصعيد — متى و كيف">
            <Callout kind="good" title="صعّد فوراً إذا">
              <ul>
                <li>Domain admin أو high-value account متورط.</li>
                <li>أكثر من host واحد مصاب.</li>
                <li>دليل على exfiltration (نقل بيانات للخارج).</li>
                <li>Ransomware (تشفير ملفات، ransom notes).</li>
                <li>Persistence مكتشف (scheduled task جديد، service جديد).</li>
                <li>عدم اليقين بعد 30 دقيقة بحث جدّي.</li>
              </ul>
            </Callout>
            <p>صيغة التصعيد المثالية: <b>"رأيت X. يبدو Y. أحتاج Z."</b> لا تترك Tier-2 يخمّن.</p>
          </Section>

          <Section title="معدّات شخصية تحتاج إتقانها فوراً">
            <ul>
              <li><b>Splunk SPL</b> أو <b>KQL</b> — أيهما تستخدمه شركتك. تعلّم top-10 commands خلال أسبوع.</li>
              <li><b>regex</b> أساسي — كل yara/sigma/grep يستخدمه.</li>
              <li><b>JSON parsing</b> — السجلات الحديثة كلها JSON. تعلّم jq.</li>
              <li><b>VirusTotal Intelligence</b> — البحث المتقدم (أكثر من رفع ملف). أساسي.</li>
              <li><b>MITRE ATT&CK Navigator</b> — اربط كل نشاط بتقنية.</li>
              <li><b>Markdown</b> للتوثيق السريع.</li>
            </ul>
          </Section>

          <Section title="فخاخ Tier-1 — تجنّبها من اليوم الأول">
            <ul>
              <li><b>الإغلاق دون توثيق.</b> التذكرة بدون evidence لا تساوي شيئاً في المراجعة.</li>
              <li><b>المماطلة في التصعيد.</b> "سأنتهي منها" قد تتحول لساعتين. عند الشك صعّد بعد 30 دقيقة.</li>
              <li><b>تنفيذ command على الـ endpoint.</b> لا تشغّل أي شيء على جهاز ضحية بدون موافقة Tier-2/IR. قد تدمّر أدلة.</li>
              <li><b>مشاركة معلومات حادث في chat عام.</b> استخدم القناة المخصّصة. الحوادث حسّاسة.</li>
              <li><b>الاعتماد على Google فقط.</b> اسأل زميلك. السؤال يوفّر ساعات.</li>
            </ul>
            <Callout kind="info" title="ثقافة">
              SOC الجيد لا يعاقب على false positive — يعاقب على false negative <b>غير الموثّق</b>. وثّق دائماً قرارك و دليلك.
            </Callout>
          </Section>

          <Section title="معجم لا غنى عنه">
            <ul>
              <li><b>IOC</b> — Indicator of Compromise (hash, IP, domain).</li>
              <li><b>TTP</b> — Tactics, Techniques, Procedures (مستوى أعلى من IOC).</li>
              <li><b>MTTD / MTTR</b> — Mean Time To Detect / Respond.</li>
              <li><b>SLA</b> — اتفاقية مستوى الخدمة (مثلاً Tier-1 يستجيب خلال 15 دقيقة).</li>
              <li><b>Runbook / Playbook</b> — خطوات قياسية لمعالجة حالة معينة.</li>
              <li><b>Triage</b> — الفرز.</li>
              <li><b>EDR / XDR</b> — Endpoint Detection / Extended Detection & Response.</li>
              <li><b>SOAR</b> — Orchestration & Automated Response (أتمتة الـ playbook).</li>
              <li><b>UEBA</b> — User & Entity Behavior Analytics.</li>
              <li><b>HVA</b> — High-Value Asset (بنك أهداف يحتاج حماية أعلى).</li>
            </ul>
          </Section>
        </>}
        en={<>
          <Section title="What a SOC analyst actually does">
            <p>The SOC runs 24/7. Your job on day one isn't "stop the hackers" — it's <b>triage alerts</b>: is this real? have we seen it before? does it warrant waking Tier-2? Then document what you saw and how.</p>
            <Analogy>Hospital ER. The triage nurse at the door doesn't perform surgeries — they decide who comes in now, who waits, who gets transferred. That's the Tier-1 SOC analyst.</Analogy>
          </Section>

          <Section title="The SOC tier pyramid">
            <TwoCol>
              <Card title="Tier-1 — Triage" color="blue">
                Receives alerts from SIEM/EDR. Decides: false positive, benign, escalate. Avg 5–15 min per ticket. 50–200 tickets per shift is normal.
              </Card>
              <Card title="Tier-2 — Investigation" color="amber">
                Picks up Tier-1 escalations. Goes deep: log review, process tree, timeline reconstruction. Decides: incident or not.
              </Card>
              <Card title="Tier-3 — IR / Hunt" color="red">
                Incident Response & Threat Hunting. Drives real incidents end-to-end. Authors new detections. Works with CTI and forensics.
              </Card>
              <Card title="SOC Manager + Engineers" color="green">
                Engineers build detections and tune tools. Manager owns SLAs, exec reporting, and cross-team coordination (Legal, IT, Product).
              </Card>
            </TwoCol>
          </Section>

          <Section title="Shift cycle — your first 8 hours">
            <Callout kind="good" title="Professional operating model">
              <ol>
                <li><b>15 min before start</b> — read the previous shift's handoff. What's open? What needs follow-up?</li>
                <li><b>Check dashboards</b> — feed health (SIEM ingestion, EDR coverage), open alerts, any active major incidents.</li>
                <li><b>Read the daily threat intel</b> — any new campaign hitting your sector? new IOCs?</li>
                <li><b>Work the queue</b> — sorted by priority. Don't cherry-pick easy ones.</li>
                <li><b>Document everything</b> — every query, every observation, every decision. Rule: if you walked away now, could a teammate continue?</li>
                <li><b>Before end-of-shift</b> — write a clear handoff: closed, open, follow-ups.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="Triage methodology — the 5W+H">
            <p>Every alert needs to answer these before you decide:</p>
            <ul>
              <li><b>What</b> — which rule fired? what does it mean?</li>
              <li><b>Who</b> — which user / host / IP? is this normal for them?</li>
              <li><b>When</b> — exact timestamp. business hours? matches a prior pattern?</li>
              <li><b>Where</b> — which network, system, subnet?</li>
              <li><b>Why</b> — any legitimate reason? change ticket, known user activity?</li>
              <li><b>How</b> — how did the indicator get here? where does the chain start?</li>
            </ul>
            <Callout kind="info" title="Golden rule">
              "<b>True positive until proven otherwise</b>" beats "false positive until proven otherwise". Never close out of laziness — close only with evidence.
            </Callout>
          </Section>

          <Section title="Common SIEM queries — start here">
            <h3>Splunk SPL</h3>
            <Code lang="splunk">{`# Multiple failed logons followed by success from same IP (successful brute force)
index=windows EventCode=4625 OR EventCode=4624
| transaction src_ip startswith="EventCode=4625" endswith="EventCode=4624" maxspan=10m
| where eventcount > 5
| table _time src_ip user host

# PowerShell with base64-encoded command
index=sysmon EventCode=1 CommandLine="*-EncodedCommand*" OR CommandLine="*-enc *"
| eval decoded=tostring(base64decode(replace(CommandLine, ".*-[Ee]nc(?:odedCommand)?\\s+(\\S+).*", "\\1")))
| table _time host user CommandLine decoded`}</Code>

            <h3>Microsoft Sentinel KQL</h3>
            <Code lang="kql">{`// Connection to IP in threat-intel feed
let badIPs = externaldata(IP:string) [@"https://feed.example.com/bad-ips.txt"];
DeviceNetworkEvents
| where TimeGenerated > ago(24h)
| where RemoteIP in (badIPs)
| project TimeGenerated, DeviceName, InitiatingProcessFileName, RemoteIP, RemotePort

// Impossible travel
SigninLogs
| where ResultType == 0
| summarize Locations = make_set(LocationDetails.countryOrRegion), Count=count() by UserPrincipalName, bin(TimeGenerated, 1h)
| where array_length(Locations) > 1`}</Code>
          </Section>

          <Section title="EDR — how to read a process tree">
            <p>Your EDR (CrowdStrike, Defender, SentinelOne) gives you process trees. Read from the <b>root</b>:</p>
            <Code lang="text">{`explorer.exe (PID 4321)                    ← legitimate parent
  └─ outlook.exe (PID 5678)                ← legitimate
      └─ winword.exe (PID 6789)            ← user opened a Word attachment
          └─ cmd.exe (PID 7890)            ← !! Word should not spawn cmd !!
              └─ powershell.exe -enc ...   ← !!! base64 → execution`}</Code>
            <Callout kind="info" title="Classic red flags">
              <ul>
                <li>Office app spawning cmd/powershell/wscript.</li>
                <li>svchost.exe from a path other than <span className="eng">C:\Windows\System32</span>.</li>
                <li>rundll32.exe with no args, or DLL from AppData/Temp.</li>
                <li>PowerShell with <span className="eng">-EncodedCommand</span>, <span className="eng">-WindowStyle Hidden</span>, <span className="eng">DownloadString</span>.</li>
                <li>schtasks.exe creating tasks with random names.</li>
                <li>net.exe adding a user to Administrators.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Ticketing — documentation rules">
            <p>A good ticket reads correctly a year later. Standard structure:</p>
            <Code lang="markdown">{`## Summary
[one line] What happened, who, where, when

## Timeline (UTC)
- 14:23 Alert fired: [rule name]
- 14:25 Began investigation
- 14:31 Identified [process X] on [host Y]
- 14:42 Checked [user Z] activity — confirmed/denied legitimate
- 14:55 Closed as [True Positive | False Positive | Benign]

## Evidence
- Splunk query: [paste]
- Process tree: [screenshot/paste]
- IOCs extracted: hash=..., ip=..., domain=...

## Decision
[Closed/Escalated] because [reason]. If escalated: assigned to [Tier-2 name].

## Follow-up
- [ ] Add IOC to block list
- [ ] Open detection-engineering ticket if rule needs tuning`}</Code>
          </Section>

          <Section title="Escalation — when and how">
            <Callout kind="good" title="Escalate immediately if">
              <ul>
                <li>Domain admin or high-value account is involved.</li>
                <li>More than one host affected.</li>
                <li>Evidence of exfiltration (data leaving the network).</li>
                <li>Ransomware (file encryption, ransom notes).</li>
                <li>Persistence detected (new scheduled task, new service).</li>
                <li>You're still uncertain after 30 minutes of serious work.</li>
              </ul>
            </Callout>
            <p>Ideal escalation: <b>"I saw X. It looks like Y. I need Z."</b> Don't make Tier-2 guess.</p>
          </Section>

          <Section title="Skills to drill on day one">
            <ul>
              <li><b>Splunk SPL</b> or <b>KQL</b> — whichever your shop uses. Top-10 commands within a week.</li>
              <li><b>Basic regex</b> — every YARA / Sigma / grep needs it.</li>
              <li><b>JSON parsing</b> — modern logs are all JSON. Learn jq.</li>
              <li><b>VirusTotal Intelligence</b> — advanced search (not just upload). Essential.</li>
              <li><b>MITRE ATT&CK Navigator</b> — map every observation to a technique.</li>
              <li><b>Markdown</b> for fast documentation.</li>
            </ul>
          </Section>

          <Section title="Tier-1 traps — avoid from day one">
            <ul>
              <li><b>Closing without documentation.</b> A ticket without evidence is worthless under audit.</li>
              <li><b>Stalling on escalation.</b> "I'll finish it" turns into two hours. Escalate at 30 minutes when in doubt.</li>
              <li><b>Running commands on the endpoint.</b> Do not execute anything on a victim machine without Tier-2/IR approval. You can destroy evidence.</li>
              <li><b>Sharing incident details in public chats.</b> Use the dedicated channel. Incidents are sensitive.</li>
              <li><b>Google-only research.</b> Ask a teammate. One question saves hours.</li>
            </ul>
            <Callout kind="info" title="Culture">
              Good SOCs don't punish false positives — they punish <b>undocumented</b> false negatives. Always record your decision and the evidence.
            </Callout>
          </Section>

          <Section title="Indispensable glossary">
            <ul>
              <li><b>IOC</b> — Indicator of Compromise (hash, IP, domain).</li>
              <li><b>TTP</b> — Tactics, Techniques, Procedures (level above IOC).</li>
              <li><b>MTTD / MTTR</b> — Mean Time To Detect / Respond.</li>
              <li><b>SLA</b> — Service-level agreement (e.g., Tier-1 acks within 15 min).</li>
              <li><b>Runbook / Playbook</b> — standardized steps for a given case.</li>
              <li><b>Triage</b> — initial sort.</li>
              <li><b>EDR / XDR</b> — Endpoint / Extended Detection & Response.</li>
              <li><b>SOAR</b> — Orchestration & Automated Response (playbook automation).</li>
              <li><b>UEBA</b> — User & Entity Behavior Analytics.</li>
              <li><b>HVA</b> — High-Value Asset (the crown jewels).</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
