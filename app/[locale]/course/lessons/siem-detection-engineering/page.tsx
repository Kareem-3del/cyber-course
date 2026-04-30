"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="siem-detection-engineering">
      <L
        ar={<>
          <Section title="ما الذي يميز detection engineer عن SOC analyst؟">
            <Analogy>
              المحلل (analyst) هو الحارس الذي يستجيب للإنذارات. مهندس الكشف هو الذي يصمم نظام الإنذارات نفسه:
              يقرر متى يطن الجرس، ومتى يصمت، وأي فناء يحتاج كاميرا أكثر. السؤال الأهم لمهندس الكشف ليس "هل
              المهاجم هنا؟" بل "لو دخل، هل سأراه؟"
            </Analogy>
            <p>
              Detection Engineering = كتابة قواعد كشف، اختبارها، قياس تغطيتها على ATT&CK، وضبطها لتقليل false
              positives دون فقدان true positives. هذا هو فرق الـ blue team الناضج عن SOC رد الفعل.
            </p>
          </Section>

          <Section title="دورة حياة قاعدة كشف">
            <Step n={1} title="Hypothesis">
              "المهاجم يفرّغ LSASS عبر comsvcs.dll" — افتراض محدد، مرتبط بـ ATT&CK technique (T1003.001).
            </Step>
            <Step n={2} title="Data source">
              ما اللوغ الذي سيكشف هذا؟ Sysmon Event ID 10 (Process Access). تأكد أنه فعلاً مفعل ويتدفق إلى الـ SIEM.
            </Step>
            <Step n={3} title="Detection logic">
              صياغة باستعلام SIEM. ابدأ بسيطاً، شدّد حسب الـ noise.
            </Step>
            <Step n={4} title="Validation">
              اختبر مع Atomic Red Team أو CALDERA. قاعدة لا تطلق على هجوم حقيقي = قاعدة ميتة.
            </Step>
            <Step n={5} title="Tuning">
              راقب FP rate لمدة أسبوع. إذا فاق 5/يوم، شدّد فلتر السياق.
            </Step>
            <Step n={6} title="Documentation">
              سجل الـ ATT&CK ID، assumption، known FPs، playbook للاستجابة. القاعدة بدون runbook لا قيمة لها.
            </Step>
          </Section>

          <Section title="Sigma — معيار قواعد الكشف">
            <p>
              Sigma هو YAML format محايد عن SIEM. اكتب القاعدة مرة، ترجمها إلى Splunk SPL أو KQL أو Elasticsearch
              عبر sigmac.
            </p>
            <Code lang="yaml">{`title: LSASS Memory Dump via comsvcs.dll
id: a8e2d456-1234-5678-9abc-def012345678
status: stable
description: Detects MiniDump of LSASS using rundll32 and comsvcs.dll
references:
  - https://attack.mitre.org/techniques/T1003/001/
author: Detection Eng Team
date: 2026/01/15
tags:
  - attack.credential_access
  - attack.t1003.001
logsource:
  product: windows
  service: sysmon
detection:
  selection_proc:
    EventID: 10
    TargetImage|endswith: '\\lsass.exe'
  selection_caller:
    SourceImage|endswith: '\\rundll32.exe'
    CallTrace|contains: 'comsvcs.dll'
  condition: selection_proc and selection_caller
falsepositives:
  - Microsoft tools that legitimately call MiniDumpWriteDump (rare)
level: high`}</Code>
          </Section>

          <Section title="KQL — Microsoft Defender / Sentinel">
            <Code lang="kusto">{`// Same hypothesis in KQL against DeviceProcessEvents
DeviceProcessEvents
| where Timestamp > ago(7d)
| where FileName == "rundll32.exe"
| where ProcessCommandLine has_all ("comsvcs.dll", "MiniDump")
| where ProcessCommandLine has "lsass" or ProcessCommandLine matches regex @"\\b\\d{3,5}\\b"
| project Timestamp, DeviceName, AccountName, ProcessCommandLine, InitiatingProcessFileName
| sort by Timestamp desc

// Pivot: who logged on to that host before the dump?
DeviceLogonEvents
| where DeviceName == "WS-EXEC-04"
| where Timestamp between ((ago(2h)) .. (now()))
| project Timestamp, AccountName, LogonType, RemoteIP`}</Code>
          </Section>

          <Section title="Splunk SPL">
            <Code lang="spl">{`index=sysmon EventCode=10 TargetImage="*\\\\lsass.exe"
| where match(SourceImage,"rundll32\\.exe")
| where match(CallTrace,"comsvcs\\.dll")
| stats count by host, SourceImage, GrantedAccess, _time
| where count > 0

// Hunting variant: any process that accessed LSASS with high rights
index=sysmon EventCode=10 TargetImage="*lsass.exe" GrantedAccess IN (0x1010, 0x1410, 0x1438)
| stats values(SourceImage) as accessors, count by host
| where count > 5`}</Code>
          </Section>

          <Section title="تقليل False Positives">
            <p>
              ثلاث تقنيات أساسية:
            </p>
            <TwoCol>
              <Card title="السياق Process Lineage" color="blue">
                هل rundll32 أُطلق من cmd مرتبط بـ session تفاعلي؟ هذا أكثر إثارة للقلق من خدمة تشغّل rundll32.
              </Card>
              <Card title="Allow-list معروف" color="green">
                EDR vendor قد يحقن أداة legitimate تقرأ LSASS. ضعها في الـ allow list مع توقيع الناشر.
              </Card>
            </TwoCol>
            <Card title="Threshold و time-window" color="amber">
              لو تكنولوجيا تقوم بدفعة admin، ستطلق 50 alert في دقيقة. اجمعها في incident واحد.
            </Card>
          </Section>

          <Section title="قياس التغطية — ATT&CK Navigator">
            <p>
              لوّن مصفوفة ATT&CK بحسب ما تكشفه قواعدك. النتيجة = خريطة "ما تراه" مقابل "ما يفعله المهاجم".
              فجوة تكشف الأولوية التالية.
            </p>
            <Terminal lines={[
              { p: "# تصدير coverage matrix إلى ATT&CK Navigator JSON" },
              { p: "python attack-navigator-export.py --rules /detections/*.yml -o coverage.json" },
              { o: "Coverage report:\n  TA0001 Initial Access:        17/22 techniques  (77%)\n  TA0003 Persistence:           14/19 techniques  (73%)\n  TA0006 Credential Access:      9/16 techniques  (56%)  <-- weak\n  TA0011 Command & Control:     11/16 techniques  (68%)" },
            ]} />
          </Section>

          <Callout kind="good" title="مبادئ مهندس الكشف">
            <ul>
              <li><strong>True Positive Rate &gt; Coverage</strong>: قاعدة واحدة تعمل أفضل من 100 قاعدة بـ 95% FP</li>
              <li><strong>Detect by behavior, not by IoC</strong>: signature لـ hash يموت في يوم؛ سلوك LSASS access يبقى</li>
              <li><strong>Test كل قاعدة</strong>: Atomic Red Team أو CALDERA يومياً</li>
              <li><strong>Versioning</strong>: قواعدك في git، code review، تاريخ تعديل</li>
              <li><strong>كل alert = runbook</strong>: ماذا يفعل المحلل في أول 5 دقائق؟</li>
            </ul>
          </Callout>

          <Section title="مصادر">
            <ul>
              <li>Sigma Project — <span className="eng">github.com/SigmaHQ/sigma</span></li>
              <li>Atomic Red Team — Red Canary</li>
              <li>The DFIR Report — حالات حقيقية + queries</li>
              <li>SpecterOps — Detection Engineering Methodology</li>
              <li>Florian Roth blog — Sigma و detection engineering</li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="What separates a detection engineer from a SOC analyst?">
            <Analogy>
              The analyst is the guard who responds to alarms. The detection engineer designs the alarm system itself:
              decides when the bell rings, when it stays silent, which courtyard needs more cameras. The defining
              question isn't "is the attacker here?" but "if they were, would I see them?"
            </Analogy>
            <p>
              Detection engineering = writing detection rules, testing them, measuring ATT&CK coverage, and tuning to
              cut false positives without losing true positives. The mark of a mature blue team versus a reactive SOC.
            </p>
          </Section>

          <Section title="Detection rule lifecycle">
            <Step n={1} title="Hypothesis">
              "Attacker dumps LSASS via comsvcs.dll" — specific, mapped to an ATT&CK technique (T1003.001).
            </Step>
            <Step n={2} title="Data source">
              Which log surfaces this? Sysmon Event 10 (Process Access). Confirm it's enabled and reaching the SIEM.
            </Step>
            <Step n={3} title="Detection logic">
              Author the SIEM query. Start broad, tighten by noise.
            </Step>
            <Step n={4} title="Validation">
              Test with Atomic Red Team or CALDERA. A rule that doesn't fire on a real test is a dead rule.
            </Step>
            <Step n={5} title="Tuning">
              Watch FP rate for a week. Above 5/day = tighten context.
            </Step>
            <Step n={6} title="Documentation">
              Record the ATT&CK ID, assumptions, known FPs, and a response playbook. A rule without a runbook has no
              value.
            </Step>
          </Section>

          <Section title="Sigma — the detection rule standard">
            <p>
              Sigma is a SIEM-neutral YAML format. Author once, translate to Splunk SPL, KQL, or Elasticsearch via
              sigmac.
            </p>
            <Code lang="yaml">{`title: LSASS Memory Dump via comsvcs.dll
id: a8e2d456-1234-5678-9abc-def012345678
status: stable
description: Detects MiniDump of LSASS using rundll32 and comsvcs.dll
references:
  - https://attack.mitre.org/techniques/T1003/001/
author: Detection Eng Team
date: 2026/01/15
tags:
  - attack.credential_access
  - attack.t1003.001
logsource:
  product: windows
  service: sysmon
detection:
  selection_proc:
    EventID: 10
    TargetImage|endswith: '\\lsass.exe'
  selection_caller:
    SourceImage|endswith: '\\rundll32.exe'
    CallTrace|contains: 'comsvcs.dll'
  condition: selection_proc and selection_caller
falsepositives:
  - Microsoft tools that legitimately call MiniDumpWriteDump (rare)
level: high`}</Code>
          </Section>

          <Section title="KQL — Microsoft Defender / Sentinel">
            <Code lang="kusto">{`// Same hypothesis in KQL against DeviceProcessEvents
DeviceProcessEvents
| where Timestamp > ago(7d)
| where FileName == "rundll32.exe"
| where ProcessCommandLine has_all ("comsvcs.dll", "MiniDump")
| where ProcessCommandLine has "lsass" or ProcessCommandLine matches regex @"\\b\\d{3,5}\\b"
| project Timestamp, DeviceName, AccountName, ProcessCommandLine, InitiatingProcessFileName
| sort by Timestamp desc

// Pivot: who logged on to the host before the dump?
DeviceLogonEvents
| where DeviceName == "WS-EXEC-04"
| where Timestamp between ((ago(2h)) .. (now()))
| project Timestamp, AccountName, LogonType, RemoteIP`}</Code>
          </Section>

          <Section title="Splunk SPL">
            <Code lang="spl">{`index=sysmon EventCode=10 TargetImage="*\\\\lsass.exe"
| where match(SourceImage,"rundll32\\.exe")
| where match(CallTrace,"comsvcs\\.dll")
| stats count by host, SourceImage, GrantedAccess, _time
| where count > 0

// Hunting variant: anything that accessed LSASS with high rights
index=sysmon EventCode=10 TargetImage="*lsass.exe" GrantedAccess IN (0x1010, 0x1410, 0x1438)
| stats values(SourceImage) as accessors, count by host
| where count > 5`}</Code>
          </Section>

          <Section title="Reducing false positives">
            <p>Three core techniques:</p>
            <TwoCol>
              <Card title="Process lineage context" color="blue">
                Was rundll32 launched from cmd in an interactive session? More worrying than a service spawning rundll32.
              </Card>
              <Card title="Known allow-list" color="green">
                An EDR vendor may inject a legitimate tool that reads LSASS. Allow-list it with the publisher signature.
              </Card>
            </TwoCol>
            <Card title="Threshold and time window" color="amber">
              An admin tool may fire 50 alerts in a minute. Aggregate them into one incident.
            </Card>
          </Section>

          <Section title="Coverage measurement — ATT&CK Navigator">
            <p>
              Color the ATT&CK matrix by what your rules cover. The result is a "what we see" vs "what attackers do"
              map. Gaps reveal the next priority.
            </p>
            <Terminal lines={[
              { p: "# Export coverage matrix to ATT&CK Navigator JSON" },
              { p: "python attack-navigator-export.py --rules /detections/*.yml -o coverage.json" },
              { o: "Coverage report:\n  TA0001 Initial Access:        17/22 techniques  (77%)\n  TA0003 Persistence:           14/19 techniques  (73%)\n  TA0006 Credential Access:      9/16 techniques  (56%)  <-- weak\n  TA0011 Command & Control:     11/16 techniques  (68%)" },
            ]} />
          </Section>

          <Callout kind="good" titleEn="Detection engineer's principles">
            <ul>
              <li><strong>True positive rate &gt; coverage</strong>: one rule that works beats 100 rules with 95% FP</li>
              <li><strong>Detect behavior, not IoCs</strong>: a hash signature dies in a day; LSASS-access behavior endures</li>
              <li><strong>Test every rule</strong>: Atomic Red Team or CALDERA, daily</li>
              <li><strong>Versioning</strong>: rules in git, code review, change history</li>
              <li><strong>Every alert = a runbook</strong>: what does the analyst do in the first 5 minutes?</li>
            </ul>
          </Callout>

          <Section title="References">
            <ul>
              <li>Sigma Project — <span className="eng">github.com/SigmaHQ/sigma</span></li>
              <li>Atomic Red Team — Red Canary</li>
              <li>The DFIR Report — real cases plus queries</li>
              <li>SpecterOps — Detection Engineering Methodology</li>
              <li>Florian Roth blog — Sigma and detection engineering</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
