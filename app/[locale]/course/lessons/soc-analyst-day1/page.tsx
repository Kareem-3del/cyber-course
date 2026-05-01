"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="soc-analyst-day1">
      <L
        ar={<>
          <Section title="إيه اللي بيعمله محلل الـ SOC فعلاً؟">
            <p>الـ SOC شغال 24/7. خد بالك..</p>
            <p>- طب أنا أول يوم في الشغل، هوقف الهاكرز يعني؟؟</p>
            <p>يا نجم الجيل.. متوقّع كالعادة.
            شغلتك أول يوم مش "أوقف الهاكرز".
            مش "كل alert تجيب الفريق كله".
            ولا "تكتب detections جديدة".
            شغلتك تفرز.
            ده حقيقي ولا لأ؟
            شفناه قبل كده؟
            يستاهل إن Tier-2 يصحى من نومه الساعة 3 الصبح؟
            وبعدها توثّق اللي شفته و إزاي.</p>
            <Analogy>طوارئ المستشفى. الممرض على الباب مش بيعمل عمليات — بيقرر مين يدخل دلوقتي، مين يستنى، ومين يتحوّل لمستشفى تاني. ده بالظبط Tier-1.</Analogy>
            <Callout kind="info" title="Target 2013 — قصة بتتدرّس">
              FireEye طبّ Target بـ alert في 30 نوفمبر 2013 إن في malware اسمه "trojan.POSRAM" بيشتغل على point-of-sale terminals. الـ analyst بصّ على الـ alert.. وقفله. بعد 19 يوم اتسرّبت بيانات 40 مليون كارت. الـ alert اللي اتقفل بكسل = 200 مليون دولار خسائر مباشرة + الـ CEO اتفصل. الـ alert كان صح. اللي قفله ما عملش الـ 5W+H. نقطة.
            </Callout>
          </Section>

          <Section title="هرم الأدوار في الـ SOC">
            <TwoCol>
              <Card title="Tier-1 — Triage" color="blue">
                بيستقبل الـ alerts من SIEM/EDR. بيقرر: false positive, benign, escalate. متوسط 5-15 دقيقة لكل تذكرة. ممكن 50-200 تذكرة في المناوبة. شغل وش.
              </Card>
              <Card title="Tier-2 — Investigation" color="amber">
                بياخد اللي رفعه Tier-1 و يدخل في التفاصيل: قراءة logs، شجرة العمليات، رسم timeline. هو اللي بيقول "حادث ولا لأ".
              </Card>
              <Card title="Tier-3 — IR / Hunt" color="red">
                Incident Response و Threat Hunting. بيقود الحوادث الحقيقية، يكتب detections جديدة، و يشتغل مع CTI و forensics.
              </Card>
              <Card title="SOC Manager + Engineers" color="green">
                الـ Engineers بيبنوا الـ detections و بيضبطوا الأدوات. الـ Manager ماسك الـ SLAs، تقارير الإدارة، و التعامل مع باقي الفرق (Legal, IT, Product).
              </Card>
            </TwoCol>
          </Section>

          <Section title="المناوبة — أول 8 ساعات شغل">
            <Callout kind="good" title="نموذج تشغيل محترم">
              <ol>
                <li><b>15 دقيقة قبل ما تبدأ</b> — اقرا الـ handoff من المناوبة اللي قبلك. إيه المفتوح؟ إيه اللي محتاج متابعة؟</li>
                <li><b>بص على الـ dashboards</b> — صحة المصادر (SIEM ingestion، EDR coverage)، الـ alerts المفتوحة، أي Major Incident شغال.</li>
                <li><b>راجع الـ threat intel اليومي</b> — فيه حملة جديدة بتضرب القطاع بتاعك؟ IOCs جديدة؟</li>
                <li><b>اشتغل في الـ queue</b> — مرتب بالأولوية. متختارش الأسهل عشان تخلص بدري.</li>
                <li><b>وثّق كل حاجة</b> — كل query، كل ملاحظة، كل قرار. القاعدة: لو مشيت دلوقتي، زميلك يقدر يكمّل ولا لأ؟</li>
                <li><b>قبل ما تخلص</b> — اكتب handoff واضح: قفلت إيه، فاضل إيه، إيه محتاج متابعة.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="منهجية الفرز — 5W+H قبل أي قرار">
            <p>أي alert لازم يرد على الأسئلة دي قبل ما تقرر تقفله أو ترفعه:</p>
            <ul>
              <li><b>What</b> — أنهي rule طنّت؟ معناها إيه؟</li>
              <li><b>Who</b> — أنهي يوزر/جهاز/IP؟ ده طبيعي منه ولا غريب؟</li>
              <li><b>When</b> — التوقيت بالظبط. في ساعات الشغل؟ النمط ده شفناه قبل كده؟</li>
              <li><b>Where</b> — أنهي شبكة، أنهي نظام، أنهي subnet؟</li>
              <li><b>Why</b> — فيه سبب مشروع؟ change ticket؟ نشاط يوزر معروف؟</li>
              <li><b>How</b> — المؤشر وصل ازاي؟ السلسلة بدأت منين؟</li>
            </ul>
            <Callout kind="info" title="قاعدة دهبية">
              "<b>True positive لحد ما يثبت العكس</b>" أحسن بكتير من "false positive لحد ما يثبت العكس". متقفلش تذكرة من الكسل — اقفلها بدليل بس.
            </Callout>
          </Section>

          <Section title="SIEM Queries بتستخدمها كل يوم — ابدأ بدول">
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

          <Section title="EDR — إزاي تقرا الـ Process Tree">
            <p>الـ EDR (CrowdStrike, Defender, SentinelOne) بيديك شجرة العمليات. اقراها من <b>الجذر</b> مش من تحت:</p>
            <Code lang="text">{`explorer.exe (PID 4321)                    ← parent شرعي
  └─ outlook.exe (PID 5678)                ← شرعي
      └─ winword.exe (PID 6789)            ← فتح مرفق Word
          └─ cmd.exe (PID 7890)            ← !! Word لا يجب أن يفتح cmd !!
              └─ powershell.exe -enc ...   ← !!! base64 → تنفيذ`}</Code>
            <Callout kind="info" title="علامات حمرا كلاسيكية">
              <ul>
                <li>Office app بيفتح cmd/powershell/wscript. ده مش طبيعي خالص.</li>
                <li>svchost.exe من مكان غير <span className="eng">C:\Windows\System32</span>.</li>
                <li>rundll32.exe من غير arguments، أو DLL من AppData/Temp.</li>
                <li>PowerShell بـ <span className="eng">-EncodedCommand</span>، <span className="eng">-WindowStyle Hidden</span>، أو <span className="eng">DownloadString</span>.</li>
                <li>schtasks.exe بيعمل مهمة بأسماء عشوائية.</li>
                <li>net.exe بيضيف يوزر لـ Administrators.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="التذاكر — قواعد التوثيق">
            <p>التذكرة الكويسة بتتقرى بعد سنة و فاهم منها كل حاجة. الهيكل القياسي:</p>
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

          <Section title="Escalation — تصعّد إمتى و إزاي">
            <Callout kind="good" title="صعّد على طول لو">
              <ul>
                <li>Domain admin أو حساب مهم متورط.</li>
                <li>أكتر من host واحد متضرب.</li>
                <li>فيه دليل على exfiltration (داتا بتطلع برة).</li>
                <li>Ransomware (تشفير ملفات، ransom notes).</li>
                <li>Persistence اتكشف (scheduled task جديد، service جديد).</li>
                <li>إنت لسه مش متأكد بعد 30 دقيقة شغل جد.</li>
              </ul>
            </Callout>
            <p>صيغة التصعيد المثالية: <b>"شفت X. شكله Y. محتاج Z."</b> متخليش Tier-2 يخمّن — ده بيوحرق وقت الكل.</p>
          </Section>

          <Section title="مهارات لازم تتقنها من أول أسبوع">
            <ul>
              <li><b>Splunk SPL</b> أو <b>KQL</b> — حسب اللي شركتك بتستخدمه. ذاكر top-10 commands في أسبوع.</li>
              <li><b>regex</b> أساسي — كل yara/sigma/grep قايم عليه.</li>
              <li><b>JSON parsing</b> — اللوجز الحديثة كلها JSON. اتعلم jq.</li>
              <li><b>VirusTotal Intelligence</b> — البحث المتقدم، مش بس رفع ملف.</li>
              <li><b>MITRE ATT&CK Navigator</b> — اربط كل observation بـ technique.</li>
              <li><b>Markdown</b> للتوثيق السريع.</li>
            </ul>
          </Section>

          <Section title="فخاخ Tier-1 — اوعى تقع فيها من أول يوم">
            <ul>
              <li><b>اوعى تقفل من غير توثيق.</b> تذكرة من غير evidence ملهاش لازمة في الـ audit.</li>
              <li><b>اوعى تماطل في التصعيد.</b> "هنشوفها كده" بتبقى ساعتين. عند الشك، صعّد بعد 30 دقيقة. خلاص.</li>
              <li><b>اوعى تشغل أوامر على الـ endpoint.</b> متشغّلش حاجة على جهاز ضحية من غير إذن Tier-2/IR. ممكن تحرق الـ evidence.</li>
              <li><b>اوعى تنشر تفاصيل حادث في chat عام.</b> استخدم القناة المخصصة. الحوادث حساسة.</li>
              <li><b>اوعى تعتمد على Google بس.</b> اسأل زميلك. سؤال واحد بيوفر ساعات.</li>
            </ul>
            <Callout kind="info" title="ثقافة الفريق">
              الـ SOC الكويس مش بيعاقب على false positive — بيعاقب على false negative <b>مش متوثق</b>. وثّق قرارك و الدليل بتاعه دايماً.
            </Callout>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>الـ Tier-1 الكويس مش اللي بيقفل أكتر تذاكر. اللي بيوثّق أحسن ويصعّد في الوقت المناسب.</p>
            <p>الـ alert اللي اتقفل غلط = breach. نقطة.</p>
            <p>الـ alert اللي اتصعّد بدليل واضح = الفرق ضحّى ساعة، بس وفّر الشركة.</p>
            <p>اكتبها على ظهر إيدك أول يوم: <b>"شفت X. شكله Y. محتاج Z."</b> الـ tier اللي فوقك مش بيقرا أفكار. خلاص.</p>
          </Section>

          <Section title="معجم لازم تكون عارفه">
            <ul>
              <li><b>IOC</b> — Indicator of Compromise (hash, IP, domain).</li>
              <li><b>TTP</b> — Tactics, Techniques, Procedures (مستوى أعلى من الـ IOC).</li>
              <li><b>MTTD / MTTR</b> — Mean Time To Detect / Respond.</li>
              <li><b>SLA</b> — اتفاقية مستوى الخدمة (مثلاً Tier-1 يرد في 15 دقيقة).</li>
              <li><b>Runbook / Playbook</b> — خطوات قياسية لحالة معينة.</li>
              <li><b>Triage</b> — الفرز.</li>
              <li><b>EDR / XDR</b> — Endpoint / Extended Detection & Response.</li>
              <li><b>SOAR</b> — Orchestration & Automated Response (أتمتة الـ playbook).</li>
              <li><b>UEBA</b> — User & Entity Behavior Analytics.</li>
              <li><b>HVA</b> — High-Value Asset (الكنوز اللي بتتحرس).</li>
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
