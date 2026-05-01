"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="siem-detection-engineering">
      <L
        ar={<>
          <Section title="Detection Engineer vs SOC Analyst — مين بيشتغل ايه؟">
            <Analogy>
              الـ Analyst هو الحارس اللي بيرد على الجرس.
              الـ Detection Engineer هو اللي بيصمّم نظام الإنذار نفسه: الجرس بيطن إمتى، بيفضل ساكت إمتى، أنهي حتة محتاجة كاميرا زيادة.
              <br/><br/>
              - طب يا حضرتك، أنا analyst كويس، يعني أنا detection engineer برضو؟؟
              <br/><br/>
              لأ يا مستجد. كنت متوقّع كالعادة في السؤال ده.
              السؤال عند الـ engineer مش "المهاجم جوّه؟". السؤال "لو دخل النهارده، هشوفه؟".
              الفرق دقيق بس بيفرّق بين blue team محترم وبين dashboard شغّال.
            </Analogy>
            <p>
              طب لو الـ Analyst بس عندك، انت مش بتراقب — انت بتـ react.
              الـ adversary لو عرف انت بتراقب ايه (وده سهل يعرفه)، هيدخل من اللي مش بتراقبه.
              الـ Detection Engineering بتقفل السكة دي: تكتب rules، تختبرها بـ Atomic Red Team، تقيس coverage على ATT&amp;CK، وتـ tune عشان تقلّل الـ FP من غير ما تفقد الـ TP.
              ده الفرق بين blue team محترم وبين SOC شغّال على alerts الـ vendor الافتراضية.
            </p>
          </Section>

          <Section title="دورة حياة قاعدة الكشف — من الفكرة لحد الـ runbook">
            <Step n={1} title="Hypothesis — افتراض محدد">
              "المهاجم بيفرّغ LSASS عن طريق comsvcs.dll" — جملة واضحة و مربوطة بـ ATT&CK technique (T1003.001).
            </Step>
            <Step n={2} title="Data Source — مصدر البيانات">
              أنهي log هيكشف ده؟ Sysmon Event ID 10 (Process Access). أكّد إنه مفعّل فعلاً و بيوصل للـ SIEM. مفيش data = مفيش detection.
            </Step>
            <Step n={3} title="Detection Logic — منطق الكشف">
              اكتب الـ query في الـ SIEM. ابدأ واسع، و ضيّق حسب الـ noise.
            </Step>
            <Step n={4} title="Validation — اختبار حقيقي">
              جرّب بـ Atomic Red Team أو CALDERA. قاعدة مش بتطن على هجوم فعلي = قاعدة ميتة.
            </Step>
            <Step n={5} title="Tuning — التهدئة">
              راقب الـ FP rate أسبوع. لو عدّت 5/اليوم، ضيّق الـ context filter.
            </Step>
            <Step n={6} title="Documentation — توثيق">
              سجّل ATT&CK ID، الافتراضات، الـ FPs المعروفة، و runbook للرد. قاعدة من غير runbook = ملهاش لازمة.
            </Step>
          </Section>

          <Section title="Sigma — لغة قواعد الكشف الموحدة">
            <p>
              Sigma هو YAML format مش مرتبط بأي SIEM. اكتب القاعدة مرة، و ترجمها لـ Splunk SPL أو KQL أو Elasticsearch
              عن طريق sigmac. توفير وقت و عقل.
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

          <Section title="تقليل الـ False Positives — مفيش حد بيسمع جرس بيطن طول الليل">
            <p>
              تلات تقنيات أساسية بتفرق:
            </p>
            <TwoCol>
              <Card title="Process Lineage — السياق" color="blue">
                rundll32 اتفتح من cmd في session تفاعلي؟ ده مقلق. لأ، اتفتح من service؟ أهدى بكتير. الفرق في النسب.
              </Card>
              <Card title="Allow-list معروف" color="green">
                ساعات الـ EDR نفسه بيحقن أداة legitimate بتقرا LSASS. حطها في allow-list مع توقيع الناشر. عشان متطنش عبثاً.
              </Card>
            </TwoCol>
            <Card title="Threshold و time-window" color="amber">
              أداة admin بتشتغل دفعة بتطلع 50 alert في دقيقة. اجمعهم في incident واحد بدل ما المحلل يتحرق.
            </Card>
          </Section>

          <Section title="قياس التغطية — ATT&CK Navigator">
            <p>
              لوّن مصفوفة ATT&CK حسب اللي قواعدك بتكشفه. الناتج = خريطة "أنا شايف إيه" قصاد "المهاجم بيعمل إيه".
              الفجوة دي بتقولك الأولوية الجاية.
            </p>
            <Terminal lines={[
              { p: "# تصدير coverage matrix إلى ATT&CK Navigator JSON" },
              { p: "python attack-navigator-export.py --rules /detections/*.yml -o coverage.json" },
              { o: "Coverage report:\n  TA0001 Initial Access:        17/22 techniques  (77%)\n  TA0003 Persistence:           14/19 techniques  (73%)\n  TA0006 Credential Access:      9/16 techniques  (56%)  <-- weak\n  TA0011 Command & Control:     11/16 techniques  (68%)" },
            ]} />
          </Section>

          <Callout kind="good" title="مبادئ مهندس الكشف — ناشفة">
            <ul>
              <li><strong>True Positive Rate أهم من Coverage</strong>: قاعدة واحدة شغّالة أحسن من 100 قاعدة بـ 95% FP. الـ analyst اللي بيقفل alerts من تعب = ما عندكش detection.</li>
              <li><strong>اكشف بالسلوك مش بالـ IoC</strong>: الـ hash بيموت في يوم. السلوك بيفضل عايش لأن الـ adversary مش هيغيّر TTP بسهولة.</li>
              <li><strong>اختبر كل قاعدة</strong>: Atomic Red Team أو CALDERA. مش مرة. كل يوم. لو القاعدة وقفت، انت ما عندكش detection للـ technique دي.</li>
              <li><strong>Versioning في git</strong>: قواعدك code. PR review، history، diffs. Detection-as-code.</li>
              <li><strong>كل alert عنده runbook</strong>: الـ analyst بيعمل ايه في أول 5 دقايق؟ لو ما يعرفش، الـ alert راح. SOAR هنا بياخد الـ playbook ويـ enrich automatically.</li>
            </ul>
          </Callout>

          <Callout kind="warn" title="غلطات الـ junior detection engineer">
            <ul>
              <li>بيكتب rule على string match بسيط من blog post. أول obfuscation بسيطة بتكسرها.</li>
              <li>بيـ deploy للـ production بدون testing. الـ rule بتولّد 10000 FP في يوم. الـ SOC بيـ disable-ها. القاعدة ماتت.</li>
              <li>ما بيـ document-ش الـ false positives المعروفة. الـ analyst التاني بيـ investigate نفس الـ FP عشر مرات.</li>
              <li>بيركّز على coverage. "أنا غطّيت 95% من ATT&amp;CK". 95% من القواعد عنده بـ noise. الـ 5% الباقية بس بتشتغل.</li>
            </ul>
          </Callout>

          <Section title="الخلاصة الناشفة">
            <p>
              Detection engineering مش "كتابة rules". ده engineering discipline كامل. data sources -&gt; hypothesis -&gt; query -&gt; test -&gt; tune -&gt; runbook -&gt; metrics.
            </p>
            <p>
              لو ما عندكش CI/CD للـ detections، انت ما عندكش detection engineering. عندك "list of queries". الفرق كبير.
            </p>
            <p>
              ولو الـ analyst بيـ disable rules بدل ما يـ tune-هم، انت ما عندكش SOC. عندك dashboard.
            </p>
            <p>اكتبها على الحيطة اللي قصاد شاشتك: <b>قاعدة من غير runbook = قاعدة ميتة. وقاعدة بـ 95% FP = قاعدة بتعلّم الـ analyst يقفل عينه.</b></p>
          </Section>

          <Section title="مصادر للتعمق">
            <ul>
              <li>Sigma Project — <span className="eng">github.com/SigmaHQ/sigma</span></li>
              <li>Atomic Red Team — Red Canary</li>
              <li>The DFIR Report — حالات حقيقية + queries جاهزة</li>
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
