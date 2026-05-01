"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="purple-team">
      <L
        ar={<>
          <Section title="إيه الـ Purple Team؟ — مش مجرد دمج فريقين">
            <p>طب الـ Red Team بيكتشفوا إيه؟ &quot;الاختراق ممكن&quot;.</p>
            <p>طيب الـ Blue Team بيعملوا إيه؟ &quot;detection rules&quot;.</p>
            <p>طب مين بيقيس إن الـ rules دي فعلاً بتمسك اللي الـ Red Team بيعمله؟</p>
            <p>محدش.</p>
            <p>الـ Pentest بيخلص بتقرير. الـ Detection Engineering بيخلص بـ rule في git. ومحدش بيقعد يربط الاتنين.</p>
            <p>ده هو المكان اللي الـ Purple Team بتشغل فيه. مش &quot;دمج&quot; للفريقين. هي <b>قياس مستمر</b> لكام تقنية من اللي خصومك بيستخدموها فعلاً، بيمسكها نظامك دلوقتي.</p>
            <Analogy>الفرق بين Pentest و Purple Team زي الفرق بين فحص طبي شامل مرة في السنة، وجهاز ضغط متوصّل بيك على طول. الأول بيقولك &quot;أنت عيّان دلوقتي؟&quot;. التاني بيقولك &quot;صحتك بتتغيّر إزاي مع كل قرار بتاخده&quot;.</Analogy>
            <Callout kind="info" title="الفكرة الجوهرية">
              ما تختبرش كل حاجة — اختبر <b>اللي خصومك الحقيقيين بيستخدموه</b> (CTI-driven). وبعدين قِس التغطية وطوّر الكشف عملياً.
            </Callout>
            <Callout kind="warn" title="غلطات الـ junior في Purple Team">
              <ul>
                <li>بيختبر بس اللي عارف إنه هيظهر. المؤشّرات تتحسّن في dashboard، الواقع ما اتغيّرش.</li>
                <li>بيعمل الاختبار في lab بس ومش بيـ extrapolate للـ production. الـ lab مفيهاش الـ noise اللي في البيئة الحقيقية.</li>
                <li>بينسى الـ cleanup بعد Atomic Red Team — وفجأة الـ rules بتطلق على artifacts قديمة من اختبار قديم.</li>
                <li>بيكتب rule بدون runbook. الـ alert بيطلق ومحدش عارف يعمل إيه. كده الـ rule = noise مش defense.</li>
                <li>بيصدّق &quot;EDR vendor قال إنه بيمسك X&quot;. اختبر بنفسك. الـ vendor عنده مصلحة يقول كده.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="قصة من الواقع — لما الـ EDR ادّعى وما مسكش">
            <p>2022. Mandiant طلعوا تقرير لافت: في 70% من الـ breaches اللي ردّوا عليها، الضحية كان عنده EDR من &quot;Top 5 vendors&quot;. والـ EDR ماكانش بيمسك التقنية الفعلية اللي اخترقتهم.</p>
            <p>طب ليه؟</p>

            <p>- علشان الـ EDR وحش يا حضرتك؟</p>

            <p>لأ يا مستجد. الـ EDR كويس. المشكلة:</p>
            <ul>
              <li>الـ EDR متضبط بـ policy الـ default. مش متظبط على بيئة الشركة.</li>
              <li>تنبيهات الـ medium severity مقفولة عشان &quot;noise&quot;.</li>
              <li>الـ exclusions اللي اتحطت &quot;مؤقتاً&quot; للـ developers بقت دائمة.</li>
              <li>والـ Red Team ماـ tested ده. الـ Pentest السنوي حلقة كانت آخر مرة من 11 شهر، وكانت في scope محدود.</li>
            </ul>
            <p>الـ Red Canary نشروا متوسط: 60% من الـ techniques في ATT&CK ماـ tested في معظم الشركات. والـ &quot;Coverage&quot; اللي الـ vendor بيقولها = نظري. مش فعلي في بيئتك أنت.</p>
            <p>الـ Purple Team بيحلّ ده. شهرياً، Atomic Red Team على endpoint اختبار. لو الـ rule ماشتغلتش، تتظبّط. لو الـ data source غير موجود، يتفتح. القياس مستمر.</p>
          </Section>

          <Section title="ATT&CK Navigator — خريطة المعركة">
            <p><span className="eng">attack.mitre.org/matrices/enterprise</span> فيها ~14 تكتيك و &gt;200 تقنية. الـ Navigator (مفتوح المصدر) بيلوّن الخريطة على حسب:</p>
            <TwoCol>
              <Card title="Threat Layer" color="red">
                التقنيات اللي مجموعات بتستهدف قطاعك بتستخدمها. جايّة من تقارير CTI (Mandiant, CrowdStrike, MITRE Groups).
              </Card>
              <Card title="Coverage Layer" color="blue">
                اللي نظامك بيمسكه دلوقتي. مأخوذ من Sigma rules, SIEM detections, EDR.
              </Card>
              <Card title="Gap Layer" color="amber">
                Threat − Coverage = الفجوات. دي قايمة شغلك الحقيقية.
              </Card>
              <Card title="Validation Layer" color="green">
                اللي أنت اختبرته فعلاً بـ Atomic / CALDERA. أخضر = اتمسك، أحمر = ما اتمسكش.
              </Card>
            </TwoCol>
            <Callout kind="good" title="قاعدة">
              مفيش حاجة اسمها 100% تغطية. الواقعي: 50–60% من التقنيات الأكتر استخداماً، تختبرها شهرياً.
            </Callout>
          </Section>

          <Section title="Atomic Red Team — اختبار فردي لكل تقنية">
            <p>Atomic = مكتبة من Red Canary فيها أكتر من 1500 اختبار صغير، كل واحد متطابق مع تقنية ATT&CK معيّنة. بيشتغل على endpoint واحد، أنت بتتأكد إنه اتمسك، وبعدين تنضّف وراك.</p>
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
              قسّم فريقك جوز: المنفّذ بيشغّل Atomic، والراصد بيفتح Splunk/Sentinel ويراقب لحظياً. النتيجة لكل اختبار: "ظهر؟ في كام ثانية؟ في أي قاعدة؟". ووثّقها على ATT&CK Navigator.
            </Callout>
          </Section>

          <Section title="CALDERA — محاكاة مسلسل كامل">
            <p>Atomic = اختبار واحد. <b>CALDERA</b> (من MITRE) = عملية كاملة. Agent على الـ endpoint بيستقبل أوامر، يبني attack chain، ويتعلّم من النتايج.</p>
            <Code lang="bash">{`# تشغيل CALDERA server
git clone https://github.com/mitre/caldera.git --recursive
cd caldera && pip install -r requirements.txt
python server.py --insecure

# الواجهة على :8888
# 1) Plugins: Stockpile (TTPs), Atomic, Sandcat (agent)
# 2) Deploy agent: واحد سطر PowerShell من Adversaries → Deploy
# 3) شغّل Adversary: e.g., "Hunter" (UAC bypass + Mimikatz + lateral movement)`}</Code>
            <ul>
              <li><b>Adversary profile</b> — مجموعة TTPs بتحاكي جروب معيّن (مثلاً APT29).</li>
              <li><b>Operation</b> — تشغيل Adversary على الـ Agents بقواعد محدّدة (autonomous / human-in-the-loop).</li>
              <li><b>Fact base</b> — معلومات الـ Agent بيجمعها (usernames, hashes, networks) ويستخدمها في الخطوات اللي بعدها.</li>
            </ul>
          </Section>

          <Section title="أدوات أخرى مفيدة">
            <TwoCol>
              <Card title="Atomic Red Team" color="red">PowerShell + اختبارات cross-platform، granular لكل تقنية. مش محتاج C2.</Card>
              <Card title="CALDERA" color="red">Operations كاملة، agent-based، فيها autonomy options.</Card>
              <Card title="Stratus Red Team" color="amber">من DataDog — تركيز على cloud (AWS, Azure, GCP) TTPs.</Card>
              <Card title="Pacu" color="amber">AWS exploitation framework. مفيد لتدريب Detection Engineering على cloud telemetry.</Card>
              <Card title="Vectr" color="blue">منصة لتتبع حملات Purple Team. بقت معيار صناعي.</Card>
              <Card title="DeTT&CT" color="blue">بيقيس جودة الـ data sources عندك. بيكمّل ATT&CK Navigator.</Card>
            </TwoCol>
          </Section>

          <Section title="دورة عمل أسبوعية مقترحة">
            <ol>
              <li><b>الإتنين — Threat selection.</b> راجع آخر تقارير CTI اللي بتخص قطاعك. اختر 5 تقنيات.</li>
              <li><b>التلات — Detection design.</b> اكتب Sigma/KQL rules ليها. حطها في staging.</li>
              <li><b>الأربع — Execution.</b> Atomic/CALDERA على الـ lab + endpoint اختبار في الإنتاج (بموافقة).</li>
              <li><b>الخميس — Tuning.</b> True positive؟ رفّعها. False positive؟ عدّل threshold/whitelist. ما ظهرتش أصلاً؟ شوف الـ data source.</li>
              <li><b>الجمعة — Document.</b> Vectr + ATT&CK Navigator. تقرير قصير: "اتغطّى إيه، فاضل إيه، عندي blockers إيه".</li>
            </ol>
            <Callout kind="good" title="مقاييس النضج">
              <ul>
                <li><b>MTTD</b> (Mean Time To Detect) — الهدف &lt; ساعة على التقنيات الحرجة.</li>
                <li><b>Coverage %</b> على ATT&CK Top 20 لخصومك.</li>
                <li><b>Detection-as-Code</b> — كل قاعدة في git ومعاها unit test (تشغّل Atomic ↦ القاعدة بتطلق).</li>
                <li><b>Repeatability</b> — قياس شهري لنفس المجموعة. أنت متحسّن ولا لأ؟</li>
              </ul>
            </Callout>
          </Section>

          <Section title="فخاخ شائعة">
            <ul>
              <li><b>Cherry-picking.</b> تختبر بس اللي عارف إنه هيظهر = وهم تغطية.</li>
              <li><b>Lab-only.</b> الـ Lab مش زي الـ Production. اختبر (بحذر) على telemetry حقيقي.</li>
              <li><b>تنسى التنضيف.</b> Atomic بيعمل ملفات/registry — اعمل -Cleanup كل مرة.</li>
              <li><b>إنذارات من غير playbook.</b> كشف من غير استجابة = ضوضا. كل rule لازم متربوطة بـ runbook.</li>
              <li><b>Vendor-driven.</b> "الـ EDR بيقول إنه بيمسك X" ≠ بيمسك X في بيئتك. اختبر بنفسك دايماً.</li>
            </ul>
          </Section>

          <Section title="التكامل مع ATT&CK Flow و Threat Informed Defense">
            <p><b>ATT&CK Flow</b> (مشروع MITRE) بيوصف سلسلة هجوم كاملة في format قياسي (JSON/STIX). تقدر تجيب flows جاهزة (مثلاً CONTI ransomware) وتاخدها على CALDERA وتشغّلها end-to-end.</p>
            <Code lang="bash">{`# مثال Flow بسيط
# 1) T1566.001 (Spearphishing Attachment)
# 2) T1059.005 (Visual Basic)
# 3) T1055 (Process Injection)
# 4) T1003.001 (LSASS Memory)
# 5) T1021.002 (SMB Lateral)

# CALDERA يأخذ flow ثم ينفّذها على agents مع تكيّف`}</Code>
            <Callout kind="info" title="الخلاصة الناشفة">
              <p>Purple Team مش &quot;event&quot; سنوي. مش &quot;workshop&quot; ربع سنوي.</p>
              <p>هي <b>ممارسة مستمرة</b> بتربط CTI ↔ Detection ↔ Validation.</p>
              <p>كل اللي عندك من EDR و SIEM و SOAR، الـ Purple Team هي اللي بتقيس قيمتها الفعلية. من غيرها، أنت بتدفع فلوس لـ tools ومش عارف بتشتغل ولا لأ.</p>
              <p>الفرق الناضجة عندها dashboard &quot;% coverage على ATT&CK Top 20 لخصومنا&quot;، بيتحدّث كل أسبوع. لو ما عندكش رقم، أنت ما بتقيسش. ولو ما بتقيسش، أنت ما بتحميش.</p>
              <p>أنت بتأمّل وبس.</p>
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
