"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="purple-team">
      <L
        ar={<>
          <Section title="ما هو Purple Team — لماذا ليس مجرد دمج فريقين">
            <p>Red Team يثبت أن الاختراق ممكن. Blue Team يبني الكشف و الاستجابة. <b>Purple Team</b> يقيس <b>كم تقنية يكتشفها فعلاً نظامك الحالي</b> — لا في تقرير سنوي، بل قياس مستمر مرتبط بـ ATT&CK.</p>
            <Analogy>الفرق بين Pentest و Purple Team هو الفرق بين فحص طبي شامل مرة واحدة، و جهاز قياس ضغط دم متصل دائماً. الأول يخبرك "هل أنت مريض الآن؟"، الثاني يخبرك "كيف يتغيّر صحتك مع كل قرار تتخذه".</Analogy>
            <Callout kind="info" title="الفكرة الجوهرية">
              لا تختبر كل شيء — اختبر <b>التقنيات التي يستخدمها خصومك الفعليون</b> (CTI-driven). ثم قِس التغطية و طوّر الكشف عملياً.
            </Callout>
          </Section>

          <Section title="ATT&CK Navigator — خريطة المعركة">
            <p><span className="eng">attack.mitre.org/matrices/enterprise</span> تحوي ~14 تكتيكاً و &gt;200 تقنية. الـ Navigator (مفتوح المصدر) يلوّن الخريطة حسب:</p>
            <TwoCol>
              <Card title="Threat Layer" color="red">
                التقنيات التي تستخدمها مجموعات تستهدف قطاعك. مأخوذة من تقارير CTI (Mandiant, CrowdStrike, MITRE Groups).
              </Card>
              <Card title="Coverage Layer" color="blue">
                ما يكتشفه نظامك الحالي. مأخوذ من Sigma rules, SIEM detections, EDR.
              </Card>
              <Card title="Gap Layer" color="amber">
                Threat − Coverage = الفجوات. هذه هي قائمة العمل الحقيقية.
              </Card>
              <Card title="Validation Layer" color="green">
                ما اختبرته فعلياً عبر Atomic / CALDERA. أخضر = اكتُشف، أحمر = لم يُكتشف.
              </Card>
            </TwoCol>
            <Callout kind="good" title="قاعدة">
              لا توجد فرصة للتغطية &gt; 100%. الواقعي: 50–60% من التقنيات الأكثر استخداماً، تختبر شهرياً.
            </Callout>
          </Section>

          <Section title="Atomic Red Team — اختبار فردي لكل تقنية">
            <p>Atomic = مكتبة من Red Canary فيها &gt;1500 اختبار صغير، كل واحد يطابق تقنية ATT&CK محددة. ينفّذ على endpoint واحد، يتحقق من الكشف، ينظّف.</p>
            <Terminal lines={[
              { p: "# تثبيت على Windows" },
              { p: "IEX (IWR 'https://raw.githubusercontent.com/redcanaryco/invoke-atomicredteam/master/install-atomicredteam.ps1' -UseBasicParsing)" },
              { p: "Install-AtomicRedTeam -getAtomics" },
              { p: "" },
              { p: "# ابحث عن اختبارات لتقنية T1059.001 (PowerShell)" },
              { p: "Invoke-AtomicTest T1059.001 -ShowDetailsBrief" },
              { o: "T1059.001-1 Mimikatz\nT1059.001-2 Run BloodHound\nT1059.001-7 Powershell Invoke Known Malicious Cmdlets" },
              { p: "" },
              { p: "# نفّذ اختباراً واحداً ثم نظّف" },
              { p: "Invoke-AtomicTest T1059.001-1 -PromptForInputArgs" },
              { p: "Invoke-AtomicTest T1059.001-1 -Cleanup" },
            ]} />
            <Callout kind="info" title="نموذج تشغيل">
              قسّم فريقك إلى زوج: المنفّذ يطلق Atomic، المراقب يفتح Splunk/Sentinel و يبحث في الوقت الحقيقي. النتيجة: "هل ظهر؟ في كم ثانية؟ في أي قاعدة؟". وثّق على ATT&CK Navigator.
            </Callout>
          </Section>

          <Section title="CALDERA — محاكاة مسلسل كامل">
            <p>Atomic = اختبار واحد. <b>CALDERA</b> (من MITRE) = سلسلة عمليات كاملة. Agent على endpoint يتلقى أوامر، يبني attack chain، يتعلّم من النتائج.</p>
            <Code lang="bash">{`# تشغيل CALDERA server
git clone https://github.com/mitre/caldera.git --recursive
cd caldera && pip install -r requirements.txt
python server.py --insecure

# الواجهة على :8888
# 1) Plugins: Stockpile (TTPs), Atomic, Sandcat (agent)
# 2) Deploy agent: واحد سطر PowerShell من Adversaries → Deploy
# 3) شغّل Adversary: e.g., "Hunter" (UAC bypass + Mimikatz + lateral movement)`}</Code>
            <ul>
              <li><b>Adversary profile</b> — تجميعة TTPs تحاكي مجموعة (e.g., APT29).</li>
              <li><b>Operation</b> — تنفيذ Adversary على Agents مع قواعد (autonomous / human-in-the-loop).</li>
              <li><b>Fact base</b> — معلومات يجمعها Agent (usernames, hashes, networks) ثم يستخدمها في خطوات لاحقة.</li>
            </ul>
          </Section>

          <Section title="أدوات أخرى مفيدة">
            <TwoCol>
              <Card title="Atomic Red Team" color="red">PowerShell + cross-platform tests, granular per-technique. لا يحتاج C2.</Card>
              <Card title="CALDERA" color="red">Operations كاملة, agent-based, autonomy options.</Card>
              <Card title="Stratus Red Team" color="amber">DataDog — تركيز على cloud (AWS, Azure, GCP) attack TTPs.</Card>
              <Card title="Pacu" color="amber">AWS-specific exploitation framework. مفيد لتدريب Detection Engineering على cloud telemetry.</Card>
              <Card title="Vectr" color="blue">منصة لتسجيل و تتبع نتائج عمليات Purple. أصبحت معياراً.</Card>
              <Card title="DeTT&CT" color="blue">قياس جودة data sources الخاصة بك. تكمّل ATT&CK Navigator.</Card>
            </TwoCol>
          </Section>

          <Section title="دورة عمل أسبوعية مقترحة">
            <ol>
              <li><b>الإثنين — Threat selection.</b> راجع آخر تقارير CTI تخص قطاعك. اختر 5 تقنيات.</li>
              <li><b>الثلاثاء — Detection design.</b> اكتب Sigma/KQL rules لها. ضعها في staging.</li>
              <li><b>الأربعاء — Execution.</b> Atomic/CALDERA على lab + endpoint اختبار في بيئة الإنتاج (مع موافقة).</li>
              <li><b>الخميس — Tuning.</b> True positive? رفّعها. False positive؟ عدّل threshold/whitelist. لم تظهر؟ افحص data source.</li>
              <li><b>الجمعة — Document.</b> Vectr + ATT&CK Navigator. تقرير قصير: "تحت/فوق التغطية، التحديات".</li>
            </ol>
            <Callout kind="good" title="مقاييس النضج">
              <ul>
                <li><b>MTTD</b> (Mean Time To Detect) — هدف &lt; 1 ساعة لتقنيات حرجة.</li>
                <li><b>Coverage %</b> على ATT&CK Top 20 لخصومك.</li>
                <li><b>Detection-as-Code</b> — كل قاعدة في git مع unit test (شغّل Atomic ↦ rule fires).</li>
                <li><b>Repeatability</b> — قياس شهري بنفس المجموعة. هل تحسّنت؟</li>
              </ul>
            </Callout>
          </Section>

          <Section title="فخاخ شائعة">
            <ul>
              <li><b>Cherry-picking.</b> اختبار التقنيات التي تعرف أنها مكتشفة فقط = وهم تغطية.</li>
              <li><b>Lab-only testing.</b> Lab ≠ Production. اختبر (بحذر) على telemetry الفعلي.</li>
              <li><b>تجاهل التنظيف.</b> Atomic ينشئ ملفات/registry — Cleanup إجباري في كل تشغيل.</li>
              <li><b>إنذارات بدون playbook.</b> الكشف بلا استجابة = ضوضاء. كل rule يجب أن تربط بـ runbook.</li>
              <li><b>Vendor-driven.</b> "EDR يقول إنه يكشف X" ≠ يكشف X في بيئتك. اختبر دائماً بنفسك.</li>
            </ul>
          </Section>

          <Section title="التكامل مع ATT&CK Flow و Threat Informed Defense">
            <p><b>ATT&CK Flow</b> (مشروع MITRE) يصف سلسلة هجوم كاملة في format قياسي (JSON/STIX). يمكنك استيراد flows جاهزة (e.g., CONTI ransomware) إلى CALDERA و تشغيلها كاملة.</p>
            <Code lang="bash">{`# مثال Flow بسيط
# 1) T1566.001 (Spearphishing Attachment)
# 2) T1059.005 (Visual Basic)
# 3) T1055 (Process Injection)
# 4) T1003.001 (LSASS Memory)
# 5) T1021.002 (SMB Lateral)

# CALDERA يأخذ flow ثم ينفّذها على agents مع تكيّف`}</Code>
            <Callout kind="info" title="الخلاصة">
              Purple Team ليس حدثاً سنوياً. إنه <b>ممارسة مستمرة</b> تربط CTI ↔ Detection ↔ Validation. الفرق الناضجة لديها لوحة "% coverage" تُحدّث كل أسبوع.
            </Callout>
          </Section>
        </>}
        en={<>
          <Section title="What Purple Team is — not just merging two teams">
            <p>Red Team proves compromise is possible. Blue Team builds detection & response. <b>Purple Team</b> measures <b>how much of what attackers do is actually caught by what you have</b> — not in an annual report, but as continuous, ATT&CK-anchored measurement.</p>
            <Analogy>Pentest vs Purple Team is like a one-off physical exam vs a continuous blood-pressure monitor. The first tells you "are you sick now?", the second tells you "how does your health change with every decision you make?".</Analogy>
            <Callout kind="info" title="Core idea">
              Don't test everything — test <b>what your actual adversaries use</b> (CTI-driven). Then measure coverage and improve detection iteratively.
            </Callout>
          </Section>

          <Section title="ATT&CK Navigator — the battle map">
            <p><span className="eng">attack.mitre.org/matrices/enterprise</span> covers ~14 tactics and &gt;200 techniques. Navigator (open source) colors the matrix by:</p>
            <TwoCol>
              <Card title="Threat Layer" color="red">
                Techniques used by groups targeting your sector. Pulled from CTI reports (Mandiant, CrowdStrike, MITRE Groups).
              </Card>
              <Card title="Coverage Layer" color="blue">
                What your stack currently detects. Pulled from Sigma rules, SIEM detections, EDR.
              </Card>
              <Card title="Gap Layer" color="amber">
                Threat − Coverage = the gaps. This is the real backlog.
              </Card>
              <Card title="Validation Layer" color="green">
                What you actually exercised via Atomic / CALDERA. Green = caught, red = missed.
              </Card>
            </TwoCol>
            <Callout kind="good" title="Reality check">
              No team reaches 100% coverage. Realistic target: 50–60% of the most-used techniques, validated monthly.
            </Callout>
          </Section>

          <Section title="Atomic Red Team — one test per technique">
            <p>Atomic is a Red Canary library of &gt;1500 small tests, each mapped to a specific ATT&CK technique. Runs on a single endpoint, you check detection, then clean up.</p>
            <Terminal lines={[
              { p: "# Install on Windows" },
              { p: "IEX (IWR 'https://raw.githubusercontent.com/redcanaryco/invoke-atomicredteam/master/install-atomicredteam.ps1' -UseBasicParsing)" },
              { p: "Install-AtomicRedTeam -getAtomics" },
              { p: "" },
              { p: "# List tests for T1059.001 (PowerShell)" },
              { p: "Invoke-AtomicTest T1059.001 -ShowDetailsBrief" },
              { o: "T1059.001-1 Mimikatz\nT1059.001-2 Run BloodHound\nT1059.001-7 Powershell Invoke Known Malicious Cmdlets" },
              { p: "" },
              { p: "# Run a single test, then clean up" },
              { p: "Invoke-AtomicTest T1059.001-1 -PromptForInputArgs" },
              { p: "Invoke-AtomicTest T1059.001-1 -Cleanup" },
            ]} />
            <Callout kind="info" title="Operating model">
              Pair up: executor fires Atomic, observer watches Splunk/Sentinel in real time. Outcome per test: "Did it fire? In how many seconds? Which rule?". Track on ATT&CK Navigator.
            </Callout>
          </Section>

          <Section title="CALDERA — full-chain emulation">
            <p>Atomic = single test. <b>CALDERA</b> (MITRE) = whole operation. Agents on endpoints receive instructions, build attack chains, learn from results.</p>
            <Code lang="bash">{`# Run CALDERA server
git clone https://github.com/mitre/caldera.git --recursive
cd caldera && pip install -r requirements.txt
python server.py --insecure

# UI on :8888
# 1) Plugins: Stockpile (TTPs), Atomic, Sandcat (agent)
# 2) Deploy agent: one-line PowerShell from Adversaries → Deploy
# 3) Run an Adversary: e.g., "Hunter" (UAC bypass + Mimikatz + lateral movement)`}</Code>
            <ul>
              <li><b>Adversary profile</b> — bundle of TTPs that emulates a group (e.g., APT29).</li>
              <li><b>Operation</b> — runs the Adversary against agents under rules (autonomous / human-in-the-loop).</li>
              <li><b>Fact base</b> — data the agents collect (usernames, hashes, networks) and feed into subsequent steps.</li>
            </ul>
          </Section>

          <Section title="Other useful tools">
            <TwoCol>
              <Card title="Atomic Red Team" color="red">PowerShell + cross-platform, granular per-technique. No C2 needed.</Card>
              <Card title="CALDERA" color="red">Full operations, agent-based, autonomy options.</Card>
              <Card title="Stratus Red Team" color="amber">DataDog — cloud-focused (AWS, Azure, GCP) TTPs.</Card>
              <Card title="Pacu" color="amber">AWS exploitation framework. Useful for training detection engineering on cloud telemetry.</Card>
              <Card title="Vectr" color="blue">Platform for tracking purple-team campaigns. Becoming standard.</Card>
              <Card title="DeTT&CT" color="blue">Quality scoring of your data sources. Complements ATT&CK Navigator.</Card>
            </TwoCol>
          </Section>

          <Section title="Suggested weekly cadence">
            <ol>
              <li><b>Monday — Threat selection.</b> Read latest CTI relevant to your sector. Pick 5 techniques.</li>
              <li><b>Tuesday — Detection design.</b> Author Sigma/KQL rules. Stage them.</li>
              <li><b>Wednesday — Execution.</b> Atomic/CALDERA on the lab + an approved test endpoint in prod.</li>
              <li><b>Thursday — Tuning.</b> True positive? Promote. False positive? Adjust threshold/whitelist. No fire? Check the data source.</li>
              <li><b>Friday — Document.</b> Vectr + ATT&CK Navigator. Short report: "what's covered, what isn't, blockers".</li>
            </ol>
            <Callout kind="good" title="Maturity metrics">
              <ul>
                <li><b>MTTD</b> (Mean Time To Detect) — target &lt; 1h on critical techniques.</li>
                <li><b>Coverage %</b> on ATT&CK Top-20 for your adversaries.</li>
                <li><b>Detection-as-Code</b> — every rule in git with a unit test (Atomic test ↦ rule fires).</li>
                <li><b>Repeatability</b> — monthly re-run of the same set. Are you improving?</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Common traps">
            <ul>
              <li><b>Cherry-picking.</b> Only testing what you know fires = coverage illusion.</li>
              <li><b>Lab-only.</b> Lab ≠ production. Carefully test on real telemetry too.</li>
              <li><b>Forgetting cleanup.</b> Atomic creates files / registry keys — always run -Cleanup.</li>
              <li><b>Alerts without playbooks.</b> Detection without response is noise. Every rule ↔ runbook.</li>
              <li><b>Vendor-driven.</b> "EDR claims it detects X" ≠ it detects X in your environment. Always verify.</li>
            </ul>
          </Section>

          <Section title="Integrating ATT&CK Flow & Threat-Informed Defense">
            <p><b>ATT&CK Flow</b> (MITRE project) describes a full attack chain in a standard format (JSON/STIX). You can import flows (e.g., CONTI ransomware) into CALDERA and execute them end-to-end.</p>
            <Code lang="bash">{`# Example flow
# 1) T1566.001 (Spearphishing Attachment)
# 2) T1059.005 (Visual Basic)
# 3) T1055 (Process Injection)
# 4) T1003.001 (LSASS Memory)
# 5) T1021.002 (SMB Lateral)

# CALDERA ingests the flow and runs it adaptively against agents`}</Code>
            <Callout kind="info" title="Bottom line">
              Purple Team is not an annual event. It's a <b>continuous practice</b> linking CTI ↔ Detection ↔ Validation. Mature teams have a coverage dashboard updated weekly.
            </Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
