"use client";
import { LessonShell, Section, Callout, Code, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="ransomware-supply-chain">
      <L
        ar={<>
          <Section title="ليه ندرس Ransomware و Supply Chain سوا؟">
            <p>طب الموضوعين دول علاقتهم ببعض إيه؟</p>
            <p>المهاجم بيشوفهم سكة واحدة.</p>
            <p>هو مش هيدخل شركتك مباشرة لو الجدار عالي. هو هيخترق المورّد بتاعك، ويوصّلك ransomware <b>عبر update موقّع</b>. أنت اللي تنزّله بإيدك. والـ EDR بتاعك هيوافق لأن التوقيع الرقمي صح.</p>
            <p>ده اللي حصل في Kaseya. ده اللي حصل في 3CX. ده اللي حصل في SolarWinds (لوحدها بشكل مختلف).</p>
            <p>الـ ransomware النهاردة مش phishing لموظف عبيط. هو هندسة سلاسل توريد كاملة، وفلوس، وعصابات منظمة.</p>
            <Analogy>الدكتور مش هيعالج مرض من غير ما يفهم بيشتغل إزاي. الدرس ده بيفكّك بنية أخطر فئتين هجمات على الجهات الحكومية والشركات الكبيرة. <b>الهدف وعي دفاعي بحت</b>.</Analogy>
            <Callout kind="danger" title="حدود واضحة">مفيش هنا كود ransomware جاهز، ولا طرق تأذية لبنية حقيقية. إحنا بنوصف <i>الفكرة</i> على مستوى الـ architecture عشان نبني دفاع مضاد.</Callout>
            <Callout kind="warn" title="غلطات الـ junior في الحماية">
              <ul>
                <li>عنده backup، بس على نفس الشبكة. أول حاجة الـ ransomware بيعملها = يمسح الـ backup.</li>
                <li>عنده &quot;3-2-1 backup&quot; بس مش بيختبر الاسترجاع. يوم الكارثة يكتشف إن الـ backup فاضي.</li>
                <li>بيدفع الفدية وبيظن إن خلصت. 40% من اللي بيدفعوا بيتضربوا تاني خلال سنة.</li>
                <li>مش بيختبر IR plan. أول كارثة بيكتشف إن مفيش حد عارف يكلم مين.</li>
                <li>سايب RDP مكشوف للإنترنت. RDP + password ضعيف = 90% من ransomware initial access.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="قصة من الواقع — Colonial Pipeline 2021">
            <p>7 مايو 2021. Colonial Pipeline (45% من بنزين الساحل الشرقي الأمريكي) اتشفّرت. السكة:</p>
            <ul>
              <li>VPN account قديم. مفيش MFA.</li>
              <li>Password اتسرّب في breach قديم وفضل شغّال.</li>
              <li>DarkSide (روسية) دخلت. شفّرت الأنظمة الإدارية.</li>
              <li>Colonial اضطرت تقفل خط الأنابيب نفسه (مش لأن الـ malware وصله، لأن نظام الفوترة وقع).</li>
            </ul>
            <p>5 ولايات أعلنت حالة طوارئ. طوابير في محطات البنزين. الرئيس بايدن خرج بتصريح قومي.</p>
            <p>الفدية: 4.4 مليون دولار. اتدفعت. الـ FBI رجّع منها 2.3 مليون لاحقاً.</p>

            <p>- بس استنى.. كل ده من حساب VPN واحد؟؟</p>

            <p>بالظبط يا مستجد. مش zero-day. مش APT خرافي. password ضعيف + عدم MFA.</p>
            <p>أرخى نقطة في المنظومة بتقفل البلد كلها.</p>
          </Section>
          <Section title="تشريح هجوم Ransomware حديث">
            <Step n={1} title="الدخول الأولي — Initial Access">
              غالباً عن طريق:
              <ul>
                <li>Phishing بمرفق ISO/LNK/HTML smuggling.</li>
                <li>VPN/RDP مكشوف بباسوردات مسرّبة (Initial Access Brokers بيبيعوها).</li>
                <li>ثغرة في edge device (Fortinet, Citrix, Ivanti, F5).</li>
                <li>سلسلة توريد عبر MSP أو RMM.</li>
              </ul>
            </Step>
            <Step n={2} title="التثبيت — Foothold">loader صغير (QakBot, IcedID, Bumblebee, Latrodectus) بيجيبلهم Cobalt Strike / Sliver beacon.</Step>
            <Step n={3} title="الاستطلاع الداخلي">AdFind, BloodHound, NetScan. بيدوّروا على: DC, backups, hypervisors (ESXi), file shares.</Step>
            <Step n={4} title="رفع الصلاحيات لـ Domain Admin">عادة خلال 24 ساعة من الدخول الأولي.</Step>
            <Step n={5} title="مسح الـ backups الأول">
              <i>أخطر خطوة في الموضوع كله</i>. بيستهدفوا: Veeam, Commvault, Rubrik, ESXi snapshots, S3 versioned buckets, shadow copies.
              <Code lang="examples (defensive awareness)">{`vssadmin delete shadows /all /quiet
wbadmin delete catalog -quiet
bcdedit /set {default} recoveryenabled No
esxcli vm process kill -t force -w <wid>`}</Code>
            </Step>
            <Step n={6} title="ابتزاز مزدوج/تلاتي">قبل التشفير: بيهرّبوا البيانات. وبعدين بيشفّروا. وبعدين بيهدّدوا بالنشر. أحياناً DDoS كضغط رابع.</Step>
            <Step n={7} title="تشفير جماعي">خوارزميات هجينة: ChaCha20/AES + RSA/Curve25519. الهجمات الحديثة بتشفّر جزء من كل ملف (intermittent encryption) عشان السرعة.</Step>
          </Section>
          <Section title="عائلات Ransomware الكبرى">
            <TwoCol>
              <Card title="LockBit (3.0/Black/Green)" color="red">الأكتر نشاطاً. RaaS، StealBit للتهريب، intermittent encryption.</Card>
              <Card title="ALPHV / BlackCat" color="red">مكتوب بـ Rust، بيستهدف ESXi/Linux كمان.</Card>
              <Card title="Royal / BlackSuit" color="red">ورثة Conti، بيستهدفوا الصحة والحكومات.</Card>
              <Card title="Akira / Play / Rhysida" color="red">موجات حديثة بتركّز على VPN و SonicWall/Cisco.</Card>
            </TwoCol>
          </Section>
          <Section title="هجمات سلسلة التوريد — Supply Chain">
            <p>بدل ما المهاجم يخترق هدفه على طول، بيخترق <b>اللي الهدف بيثق فيه</b>:</p>
            <h3>1) اختراق المورّد البرمجي</h3>
            <ul>
              <li><b>SolarWinds (2020)</b> — update موقّع رسمياً وفيه SUNBURST.</li>
              <li><b>3CX (2023)</b> — تطبيق desktop موقّع وفيه SmoothOperator.</li>
              <li><b>XZ Utils (2024)</b> — backdoor اتزرع بالتدريج عبر مساهم مزوّر في open source.</li>
            </ul>
            <h3>2) اختراق MSP</h3>
            <p>Kaseya (2021) — ثغرة في VSA وصّلت REvil لآلاف العملاء.</p>
            <h3>3) Dependency Attacks</h3>
            <ul>
              <li><b>Typosquatting</b> — حزمة باسم قريب (colorrs بدل colors).</li>
              <li><b>Dependency Confusion</b> — تنشر حزمة عامة بنفس اسم حزمة داخلية.</li>
              <li><b>Account takeover</b> لمشرف حزمة، وبعدين نشر إصدار خبيث.</li>
            </ul>
            <h3>4) Build System Compromise</h3>
            <ul>
              <li>اختراق CI/CD (Jenkins, GitHub Actions, GitLab Runners).</li>
              <li>سرقة code signing keys.</li>
              <li>زرع باب خلفي في الـ build artifact بس (مش في الكود المصدر).</li>
            </ul>
          </Section>
          <Section title="Wipers — الأخطر من Ransomware">
            <p>الـ wiper شكله ransomware، بس بيدمّر البيانات بلا رجعة (مفيش مفتاح فك تشفير من الأساس). أمثلة: NotPetya, HermeticWiper, AcidRain, CaddyWiper. الدافع سياسي، مش مالي.</p>
          </Section>
          <Section title="الحماية — خطة شاملة ضد Ransomware">
            <ol>
              <li><b>3-2-1-1-0 Backup</b>: 3 نسخ، 2 وسايط، 1 برّه الموقع، 1 offline/air-gapped/immutable، 0 أخطاء في الاختبار.</li>
              <li><b>Immutable backups</b>: S3 Object Lock, Veeam Hardened Repository, Wasabi immutability.</li>
              <li><b>تجارب استرجاع</b> دورية وموثّقة. مفيش "افترضنا الـ backup شغّال".</li>
              <li><b>تقسيم شبكة</b> — DC / backups / hypervisors في VLANs منفصلة.</li>
              <li><b>MFA على كل حاجة</b>، خصوصاً VPN, RDP, hypervisors, backup admin consoles.</li>
              <li><b>اقفل SMBv1 و LLMNR و NTLMv1</b>.</li>
              <li><b>تصليح ESXi</b> (إقفال SSH، execInstalledOnly=TRUE، lockdown mode).</li>
              <li><b>كشف مبكر</b>: قواعد Sigma على vssadmin delete, wbadmin delete, bcdedit, esxcli vm process kill.</li>
              <li><b>Canary files</b> في كل share: ملفات وهمية بتطلق إنذار أول ما حد يحاول يشفّرها.</li>
              <li><b>خطة استجابة معتمدة</b> + قناة اتصال برّا الشبكة (Signal).</li>
            </ol>
          </Section>
          <Section title="الحماية — ضد Supply Chain">
            <ul>
              <li><b>SBOM</b> لكل asset برمجي.</li>
              <li><b>SLSA</b> كهدف نضج.</li>
              <li><b>Sigstore / cosign</b> لتوقيع الـ artifacts.</li>
              <li><b>Pin dependencies</b> بالـ hash، مش بالاسم بس.</li>
              <li><b>عزل CI/CD</b> — ephemeral runners، OIDC بدل long-lived secrets.</li>
              <li><b>Vendor risk management</b> — استبيان أمني سنوي وحق audit.</li>
              <li>راقب behavioral baselines للبرامج المثبّتة، حتى الموقّعة.</li>
              <li>Network egress allow-list صارم.</li>
            </ul>
            <Callout kind="info" title="اكتبها على الحيطة">توقيع رقمي شرعي ≠ ملف آمن. أي برنامج، حتى لو موقّع، لازم يبقى تحت مراقبة سلوكية.</Callout>
          </Section>
          <Section title="عند الإصابة — هل تدفع الفدية؟">
            <Callout kind="danger" title="الموقف الرسمي">
              FBI / CISA / Europol / NCSC بينصحوا <b>بعدم الدفع</b>:
              <ul>
                <li>مفيش ضمان إنك هترجّع البيانات (40% بس من اللي بيدفعوا بيرجّعوا كل حاجة).</li>
                <li>أنت بتموّل عمليات إجرامية تانية.</li>
                <li>ممكن تخالف عقوبات (OFAC) لو الفاعل روسي/كوري شمالي/إيراني.</li>
                <li>40% من الضحايا بيتضربوا تاني خلال سنة.</li>
              </ul>
            </Callout>
            <p>القرار لازم يتاخد مع: legal، executive، insurance، law enforcement، DFIR retainer. مش لوحدك في غرفة.</p>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>الـ ransomware مش مشكلة malware. هي مشكلة <b>backups</b> + <b>identity</b> + <b>segmentation</b>.</p>
            <p>لو ما عندكش immutable backups، أنت دافع الفدية قبل ما الكارثة تحصل.</p>
            <p>لو MFA مش على كل VPN/RDP، أنت بس بتستنى الدور.</p>
            <p>لو الـ backups على نفس domain اللي عليه الـ DC، الـ backup مش backup — هو ملف بحجم كبير.</p>
            <p>اوعى تقول "عندنا backup" من غير ما تختبر الاسترجاع. ده مش backup، ده ملف بتفترض إنه شغّال.</p>
            <p>ده مش technical لجنة IT. ده business continuity. والـ board لازم يفهم. لو ما فهمش، أنت اللي هتشرحلهم بعد الكارثة. وهو وقت غالي.</p>
          </Section>
        </>}
        en={<>
          <Section title="Why study Ransomware and Supply Chain?">
            <Analogy>A doctor can't treat a disease without knowing how it works. This lesson dissects the architecture of the two most dangerous attack classes against governments and large enterprises. <b>Goal: defensive awareness only</b>.</Analogy>
            <Callout kind="danger" title="Hard limits">No ready-to-use ransomware code, no methods to harm real infrastructure. We describe <i>how</i> at the architecture level so countermeasures can be built.</Callout>
          </Section>
          <Section title="Anatomy of a modern ransomware attack">
            <Step n={1} title="Initial Access">
              Typically via:
              <ul>
                <li>Phishing with ISO/LNK/HTML smuggling attachments.</li>
                <li>Exposed VPN/RDP with leaked passwords (sold by Initial Access Brokers).</li>
                <li>Edge device CVE (Fortinet, Citrix, Ivanti, F5).</li>
                <li>Supply chain via an MSP or RMM.</li>
              </ul>
            </Step>
            <Step n={2} title="Foothold">A small loader (QakBot, IcedID, Bumblebee, Latrodectus) drops a Cobalt Strike / Sliver beacon.</Step>
            <Step n={3} title="Internal recon">AdFind, BloodHound, NetScan. They look for: DC, backups, hypervisors (ESXi), file shares.</Step>
            <Step n={4} title="Privilege escalation to Domain Admin">Usually within 24 hours of initial access.</Step>
            <Step n={5} title="Destroy backups first">
              The single most dangerous step. Targets: Veeam, Commvault, Rubrik, ESXi snapshots, versioned S3 buckets, shadow copies.
              <Code lang="examples (defensive awareness)">{`vssadmin delete shadows /all /quiet
wbadmin delete catalog -quiet
bcdedit /set {default} recoveryenabled No
esxcli vm process kill -t force -w <wid>`}</Code>
            </Step>
            <Step n={6} title="Double / triple extortion">Before encryption: exfil the data. Then encrypt. Then threaten to publish. Sometimes DDoS as a fourth pressure.</Step>
            <Step n={7} title="Mass encryption">Hybrid algorithms: ChaCha20/AES + RSA/Curve25519. Modern variants encrypt only part of each file (intermittent encryption) to speed up.</Step>
          </Section>
          <Section title="Major ransomware families">
            <TwoCol>
              <Card title="LockBit (3.0/Black/Green)" color="red">Most prolific. RaaS, StealBit for exfil, intermittent encryption.</Card>
              <Card title="ALPHV / BlackCat" color="red">Written in Rust; targets ESXi/Linux too.</Card>
              <Card title="Royal / BlackSuit" color="red">Conti successors; healthcare and government focus.</Card>
              <Card title="Akira / Play / Rhysida" color="red">Recent waves heavily abusing VPN and SonicWall/Cisco devices.</Card>
            </TwoCol>
          </Section>
          <Section title="Supply Chain attacks">
            <p>Instead of breaching the target, the attacker breaches <b>someone the target trusts</b>:</p>
            <h3>1) Software vendor compromise</h3>
            <ul>
              <li><b>SolarWinds (2020)</b> — a legitimately signed update carrying SUNBURST.</li>
              <li><b>3CX (2023)</b> — a signed desktop app with SmoothOperator inside.</li>
              <li><b>XZ Utils (2024)</b> — backdoor planted gradually by a malicious open-source maintainer.</li>
            </ul>
            <h3>2) MSP compromise</h3>
            <p>Kaseya (2021) — a VSA flaw delivered REvil to thousands of downstream customers.</p>
            <h3>3) Dependency attacks</h3>
            <ul>
              <li><b>Typosquatting</b> — a package with a near-identical name (colorrs vs colors).</li>
              <li><b>Dependency confusion</b> — publish a public package matching an internal name.</li>
              <li><b>Account takeover</b> of a maintainer, then publish a malicious version.</li>
            </ul>
            <h3>4) Build system compromise</h3>
            <ul>
              <li>CI/CD breach (Jenkins, GitHub Actions, GitLab Runners).</li>
              <li>Code signing key theft.</li>
              <li>Backdoor planted only in the build artifact (not the source).</li>
            </ul>
          </Section>
          <Section title="Wipers — worse than ransomware">
            <p>A wiper looks like ransomware but destroys data irreversibly (no decryption key exists). Examples: NotPetya, HermeticWiper, AcidRain, CaddyWiper. The motive is political, not financial.</p>
          </Section>
          <Section title="Defense — comprehensive ransomware plan">
            <ol>
              <li><b>3-2-1-1-0 Backup</b>: 3 copies, 2 media, 1 offsite, 1 offline/air-gapped/immutable, 0 errors on test.</li>
              <li><b>Immutable backups</b>: S3 Object Lock, Veeam Hardened Repository, Wasabi immutability.</li>
              <li><b>Restore drills</b>, regular and documented.</li>
              <li><b>Network segmentation</b> — DC / backups / hypervisors in separate VLANs.</li>
              <li><b>MFA everywhere</b>, especially VPN, RDP, hypervisors, backup admin consoles.</li>
              <li><b>Disable SMBv1, LLMNR, NTLMv1</b>.</li>
              <li><b>Harden ESXi</b> (disable SSH, execInstalledOnly=TRUE, lockdown mode).</li>
              <li><b>Early detection</b>: Sigma rules for vssadmin delete, wbadmin delete, bcdedit, esxcli vm process kill.</li>
              <li><b>Canary files</b> on every share: fake files that fire on first encryption attempt.</li>
              <li><b>Approved IR plan</b> + an out-of-band channel (Signal).</li>
            </ol>
          </Section>
          <Section title="Defense — supply chain">
            <ul>
              <li><b>SBOM</b> for every software asset.</li>
              <li><b>SLSA</b> as a maturity target.</li>
              <li><b>Sigstore / cosign</b> for artifact signing.</li>
              <li><b>Pin dependencies</b> by hash, not name only.</li>
              <li><b>Isolate CI/CD</b> — ephemeral runners; OIDC instead of long-lived secrets.</li>
              <li><b>Vendor risk management</b> — annual security questionnaire and audit rights.</li>
              <li>Behavioral baselines for installed products, even signed ones.</li>
              <li>Strict network egress allow-listing.</li>
            </ul>
            <Callout kind="info" title="The SolarWinds lesson">A valid digital signature ≠ a safe file. Every program — even signed — must be subject to behavioral monitoring.</Callout>
          </Section>
          <Section title="If you're hit — do you pay?">
            <Callout kind="danger" title="Official position">
              FBI / CISA / Europol / NCSC strongly advise <b>NOT to pay</b>:
              <ul>
                <li>No guarantee of recovery (only ~40% of payers get everything back).</li>
                <li>Funds future criminal operations.</li>
                <li>May violate sanctions (OFAC) when the actor is Russian/N. Korean/Iranian.</li>
                <li>40% of victims are hit a second time within a year.</li>
              </ul>
            </Callout>
            <p>The decision must involve: legal, executive, insurance, law enforcement, DFIR retainer.</p>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
