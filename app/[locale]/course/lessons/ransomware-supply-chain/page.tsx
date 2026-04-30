"use client";
import { LessonShell, Section, Callout, Code, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="ransomware-supply-chain">
      <L
        ar={<>
          <Section title="لماذا ندرس Ransomware و Supply Chain؟">
            <Analogy>الطبيب لا يستطيع علاج المرض إن لم يعرف كيف يعمل. هذا الدرس يفكّك بنية أخطر هجمتين على الجهات الحكومية و الشركات الكبرى. <b>الهدف وعي دفاعي بحت</b>.</Analogy>
            <Callout kind="danger" title="حدود واضحة">لا يحوي هذا الدرس كود ransomware جاهز، ولا أساليب لإيذاء بنية حقيقية. نوضّح <i>الكيفية</i> على مستوى المعمارية ليُبنى الدفاع المضاد.</Callout>
          </Section>
          <Section title="تشريح هجوم Ransomware حديث">
            <Step n={1} title="الدخول الأولي — Initial Access">
              غالباً عبر:
              <ul>
                <li>Phishing بمرفق ISO/LNK/HTML smuggling.</li>
                <li>VPN/RDP مكشوف بكلمات سُرّبت (Initial Access Brokers).</li>
                <li>ثغرة في edge device (Fortinet, Citrix, Ivanti, F5).</li>
                <li>سلسلة توريد عبر MSP أو RMM.</li>
              </ul>
            </Step>
            <Step n={2} title="التثبيت — Foothold">loader صغير (QakBot, IcedID, Bumblebee, Latrodectus) يجلب Cobalt Strike / Sliver beacon.</Step>
            <Step n={3} title="الاستطلاع الداخلي">AdFind, BloodHound, NetScan. يبحثون عن: DC, backups, hypervisors (ESXi), file shares.</Step>
            <Step n={4} title="رفع الصلاحيات إلى Domain Admin">عادةً خلال 24 ساعة من الدخول الأولي.</Step>
            <Step n={5} title="حذف النسخ الاحتياطية أولاً">
              هذه <i>الخطوة الأخطر</i>. يستهدفون: Veeam, Commvault, Rubrik, ESXi snapshots, S3 versioned buckets, shadow copies.
              <Code lang="examples (defensive awareness)">{`vssadmin delete shadows /all /quiet
wbadmin delete catalog -quiet
bcdedit /set {default} recoveryenabled No
esxcli vm process kill -t force -w <wid>`}</Code>
            </Step>
            <Step n={6} title="الابتزاز المزدوج/الثلاثي">قبل التشفير: تهريب البيانات. ثم التشفير. ثم تهديد بنشر البيانات. أحياناً DDoS كضغط رابع.</Step>
            <Step n={7} title="التشفير الجماعي">خوارزميات هجينة: ChaCha20/AES + RSA/Curve25519. الهجمات الحديثة تشفّر جزءاً من كل ملف (intermittent encryption).</Step>
          </Section>
          <Section title="عائلات Ransomware الكبرى">
            <TwoCol>
              <Card title="LockBit (3.0/Black/Green)" color="red">الأكثر نشاطاً. RaaS، StealBit للتهريب، intermittent encryption.</Card>
              <Card title="ALPHV / BlackCat" color="red">مكتوب بـ Rust، يستهدف ESXi/Linux أيضاً.</Card>
              <Card title="Royal / BlackSuit" color="red">خلفاء Conti، يستهدف القطاع الصحي و الحكومي.</Card>
              <Card title="Akira / Play / Rhysida" color="red">موجات حديثة تركز على VPN و SonicWall/Cisco.</Card>
            </TwoCol>
          </Section>
          <Section title="هجمات سلسلة التوريد — Supply Chain">
            <p>بدلاً من اختراق الهدف، يخترق المهاجم <b>من يثق به الهدف</b>:</p>
            <h3>1) اختراق المورّد البرمجي</h3>
            <ul>
              <li><b>SolarWinds (2020)</b> — تحديث موقّع شرعياً يحوي SUNBURST.</li>
              <li><b>3CX (2023)</b> — تطبيق سطح مكتب موقّع يحوي SmoothOperator.</li>
              <li><b>XZ Utils (2024)</b> — backdoor زُرع تدريجياً عبر مساهم مزوّر في الـ open source.</li>
            </ul>
            <h3>2) اختراق مزود الخدمة المُدارة (MSP)</h3>
            <p>Kaseya (2021) — ثغرة VSA أوصلت REvil إلى آلاف العملاء النهائيين.</p>
            <h3>3) Dependency Attacks</h3>
            <ul>
              <li><b>Typosquatting</b> — حزمة باسم قريب (colorrs بدل colors).</li>
              <li><b>Dependency Confusion</b> — رفع حزمة عامة بنفس اسم حزمة داخلية.</li>
              <li><b>Account takeover</b> لمشرف حزمة ثم نشر إصدار خبيث.</li>
            </ul>
            <h3>4) Build System Compromise</h3>
            <ul>
              <li>اختراق CI/CD (Jenkins, GitHub Actions, GitLab Runners).</li>
              <li>سرقة code signing keys.</li>
              <li>زرع باب خلفي في build artifact فقط (لا في الكود المصدر).</li>
            </ul>
          </Section>
          <Section title="Wipers — الأخطر من Ransomware">
            <p>الـ wiper يبدو ransomware لكنه يدمّر البيانات بلا رجعة. أمثلة: NotPetya, HermeticWiper, AcidRain, CaddyWiper. هدفها سياسي لا مالي.</p>
          </Section>
          <Section title="الدفاع — خطة شاملة ضد Ransomware">
            <ol>
              <li><b>3-2-1-1-0 Backup</b>: 3 نسخ، 2 وسائط، 1 خارج الموقع، 1 offline/air-gapped/immutable، 0 أخطاء في الاختبار.</li>
              <li><b>Immutable backups</b>: S3 Object Lock, Veeam Hardened Repository, Wasabi immutability.</li>
              <li><b>تجارب استرجاع</b> دورية موثقة.</li>
              <li><b>تقسيم الشبكة</b> — DC / backups / hypervisors في VLANs منفصلة.</li>
              <li><b>MFA على كل شيء</b>، خاصة VPN, RDP, hypervisors, backup admin.</li>
              <li><b>تعطيل SMBv1، LLMNR، NTLMv1</b>.</li>
              <li><b>تصلب ESXi</b> (تعطيل SSH، execInstalledOnly=TRUE، lockdown mode).</li>
              <li><b>كشف مبكر</b>: قواعد Sigma على vssadmin delete, wbadmin delete, bcdedit, esxcli vm process kill.</li>
              <li><b>Canary files</b> في كل share: ملفات وهمية ترصد أول محاولة تشفير.</li>
              <li><b>خطة استجابة معتمدة</b> + اتصال خارج النطاق (Signal).</li>
            </ol>
          </Section>
          <Section title="الدفاع — ضد Supply Chain">
            <ul>
              <li><b>SBOM</b> لكل أصل برمجي.</li>
              <li><b>SLSA</b> كهدف نضج.</li>
              <li><b>Sigstore / cosign</b> لتوقيع artifacts.</li>
              <li><b>Pin dependencies</b> بالـ hash، لا بالاسم فقط.</li>
              <li><b>عزل CI/CD</b> — ephemeral runners، OIDC بدل long-lived secrets.</li>
              <li><b>Vendor risk management</b> — استبيان أمني سنوي.</li>
              <li>مراقبة behavioral baselines للمنتجات المثبّتة، حتى الموقّعة.</li>
              <li>Network egress allow-list صارم.</li>
            </ul>
            <Callout kind="info" title="الدرس من SolarWinds">توقيع رقمي شرعي ≠ ملف آمن. كل برنامج، حتى الموقّع، يجب أن يخضع لمراقبة سلوكية.</Callout>
          </Section>
          <Section title="عند الإصابة — هل تدفع الفدية؟">
            <Callout kind="danger" title="الموقف الرسمي">
              FBI / CISA / Europol / NCSC ينصحون <b>بعدم الدفع</b>:
              <ul>
                <li>لا ضمان لاسترجاع البيانات (40% فقط من الدافعين يستردون كل شيء).</li>
                <li>تموّل عمليات إجرامية لاحقة.</li>
                <li>قد تكون مخالفة لعقوبات (OFAC).</li>
                <li>40% من الضحايا يُهاجمون مرة ثانية خلال سنة.</li>
              </ul>
            </Callout>
            <p>القرار يجب أن يُتخذ مع: legal, executive, insurance, law enforcement, DFIR retainer.</p>
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
