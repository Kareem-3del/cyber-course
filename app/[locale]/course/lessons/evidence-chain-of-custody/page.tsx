"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="evidence-chain-of-custody">
      <L
        ar={<>
          <Section title="ليه سلسلة الحفظ مش بيروقراطية فاضية">
            <p>بُص.</p>
            <p>أي تحقيق فيدرالي ممكن يطلع في محكمة.
            الدليل اللي ما تقدرش تثبت سلامته — مصدره، مين لمسه، إمتى، اتخزّن إزاي — هيترفض.
            القضية تتهدّ رغم إن الدليل التقني قوي.</p>
            <Analogy>
              عيّنة دم في معمل جنائي.
              في التلاجة الصحيحة..
              كل واحد استلمها وقّع..
              فيها رقم تسلسل واضح..
              القاضي بيقبلها.
              ناقص توقيع واحد بس؟ ترفض.
              التقنية ما بتنقذش سوء التوثيق.
            </Analogy>
            <Callout kind="danger" title="اكتبها على ظهر إيدك">
              عامل كل دليل كأنه هيتقدّم قدّام محلّفين — حتى لو فاكر إن الحادث "بسيط". قرار التحوّل للمسار الجنائي بييجي بعدين، والدليل اللي اتلوّث ما يرجعش.
            </Callout>
            <Callout kind="info" title="واقعة OJ Simpson — درس CoC الكلاسيكي">
              في 1995، الدم اللي ربط OJ بالجريمة كان دليل قوي. بس الـ chain of custody كانت فيها فجوات: vial دم اختفى لمدة ساعات، detective حط الدم في جيبه ساعتين بدون توثيق، الـ analyst قال "ممكن يكون فيه contamination". الـ defense طلعت من ده "reasonable doubt" والـ verdict "not guilty". الدليل التقني كان موجود. الـ paperwork كان مش موجود. خلاص. الدرس نفسه على digital evidence — لو الـ chain فيها فجوة 4 ساعات، القاضي ممكن يرميها.
            </Callout>
          </Section>

          <Section title="ركائز الحفاظ على الدليل">
            <TwoCol>
              <Card title="Authenticity" color="blue">
                إثبات أن الدليل هو ما يُدّعى أنه — لم يُستبدل، لم يُتلاعب به.
              </Card>
              <Card title="Integrity" color="amber">
                إثبات أن الدليل لم يتغيّر منذ جمعه. عبر hashing.
              </Card>
              <Card title="Reliability" color="red">
                الأدوات و الإجراءات تنتج نتائج reproducible. منهجية معتمدة.
              </Card>
              <Card title="Best Evidence Rule" color="green">
                FRE 1001–1008 — الأصل مفضّل. النسخة المنطقية للدليل الرقمي = bit-by-bit image.
              </Card>
            </TwoCol>
          </Section>

          <Section title="الجمع — قواعد الميدان">
            <Callout kind="good" title="قبل أن تلمس أي شيء">
              <ol>
                <li><b>صوّر المكان</b> — صور photos + video للنظام و البيئة قبل التغيير.</li>
                <li><b>وثّق حالة الجهاز</b>: شاشة (هل مفتوحة؟ ما المعروض؟)، LEDs، الأسلاك، الـ ports.</li>
                <li><b>اسأل عن credentials</b> من المسؤول قبل الإطفاء.</li>
                <li><b>قرّر: live أم dead?</b> — الذاكرة طيارة (RAM)، إن أطفأت ضاعت.</li>
                <li><b>ارتدِ قفازات</b> إن كان هناك بُعد جنائي (DNA / بصمات).</li>
              </ol>
            </Callout>
          </Section>

          <Section title="ترتيب التطايُر (Order of Volatility) — RFC 3227">
            <Code lang="text">{`اجمع بهذا الترتيب — الأكثر تطايراً أولاً:

1. Registers, Cache (CPU)              — يضيع في ms
2. Routing tables, ARP cache, kernel   — يضيع عند reboot
   stats, memory contents
3. Temporary file systems              — يضيع عند reboot
4. Disk                                — يبقى
5. Remote logging & monitoring data    — يبقى لكن قد يُمحى
6. Physical configuration, network     — ثابت
7. Archival media                      — ثابت`}</Code>
          </Section>

          <Section title="Imaging — كيف تأخذ نسخة قانونية">
            <h3>1) Hardware Write-Blocker إجباري</h3>
            <p>قبل توصيل أي قرص بحاسوب التحقيق، ضع write-blocker (Tableau, WiebeTech, CRU). يمنع أي كتابة. بدونه، nawigation عادي للقرص قد يحدث 100+ تعديل.</p>

            <h3>2) أدوات Imaging</h3>
            <Code lang="bash">{`# dc3dd (تطوير من dd للـ forensics)
dc3dd if=/dev/sdb of=evidence.dd \\
  hash=sha256 hash=md5 \\
  log=evidence.log \\
  hashlog=hash.txt \\
  bs=1M

# FTK Imager — GUI الأشهر
# - يُولّد E01 (Expert Witness Format) مع compression و metadata
# - يحسب MD5 + SHA1 + SHA256 تلقائياً

# dcfldd
dcfldd if=/dev/sdb hash=sha256 of=evidence.dd 2>log.txt

# للذاكرة (Windows)
winpmem.exe -o memory.aff4

# للذاكرة (Linux)
LiME (Linux Memory Extractor) → /tmp/mem.lime
sudo insmod lime.ko "path=/tmp/mem.lime format=lime"

# للذاكرة (Mac)
Volexity Surge Collect — تجاري لكن المعتمد عملياً`}</Code>

            <h3>3) صيغ standard</h3>
            <ul>
              <li><b>raw / dd</b> — bit-by-bit. كبير، بسيط، universal.</li>
              <li><b>E01 (EnCase)</b> — مع metadata, compression, hash verification مدمج.</li>
              <li><b>AFF / AFF4</b> — open standard. مفضّل للمشاريع الحديثة.</li>
              <li><b>VMDK / VHD</b> — مفيد لـ VMs، يفتح في Hypervisors.</li>
            </ul>
          </Section>

          <Section title="Hashing — قلب Integrity">
            <p>- طب يا حضرتك ليه hash قبل وبعد؟ أنا عامل image تمام..</p>
            <p>يا مستجد، الـ image ده محتاج إثبات. احسب hash <b>قبل</b> الجمع (إن أمكن — على القرص الأصلي عبر write-blocker) و <b>بعد</b>. تطابق = سليم. اختلاف؟ يبقى في حاجة اتكتبت. خلاص.</p>
            <Terminal lines={[
              { p: "# قبل الـ image" },
              { p: "sha256sum /dev/sdb > before.txt" },
              { o: "9f3a... /dev/sdb" },
              { p: "" },
              { p: "# بعد الـ image" },
              { p: "sha256sum evidence.dd > after.txt" },
              { o: "9f3a... evidence.dd" },
              { p: "" },
              { p: "# تحقق دوري — كل مرة يُسلَّم الدليل" },
              { p: "sha256sum -c hashes.txt" },
            ]} />
            <Callout kind="info" title="MD5 + SHA256 معاً">
              MD5 مكسور cryptographically لكن لا يزال مقبولاً قانونياً للـ integrity (احتمال collision عرضي ≈ 0). أضف SHA256 دائماً لأن المحاكم الحديثة تتوقعه.
            </Callout>
          </Section>

          <Section title="Chain of Custody Form — التوثيق الكلاسيكي">
            <p>كل قطعة دليل تحمل نموذج. كل تسليم مسجّل. أي فجوة في التسلسل = اختراق محتمل = دليل قد يُرفض.</p>
            <Code lang="markdown">{`# CHAIN OF CUSTODY — Evidence Item

Case #: 2026-CR-0457
Item #: 001
Description: Dell Latitude 7420 laptop, S/N: ABC123XYZ
Source: Conference Room B, Building 4
Collected by: SA John Smith, Badge 4523
Collection date/time: 2026-04-30 14:32 EDT
Condition: Powered on, locked screen
SHA256 (post-image): 9f3a...

## Transfer log
| Date/Time         | From               | To                  | Reason          | Signature |
|-------------------|--------------------|---------------------|-----------------|-----------|
| 2026-04-30 14:32  | Scene              | SA Smith            | Initial seizure | [sig]     |
| 2026-04-30 18:00  | SA Smith           | Evidence Locker A12 | Storage         | [sig]/[sig] |
| 2026-05-01 09:15  | Evidence Locker    | SA Davis (Forensics)| Imaging         | [sig]/[sig] |
| 2026-05-01 16:30  | SA Davis           | Evidence Locker A12 | Return          | [sig]/[sig] |`}</Code>
          </Section>

          <Section title="التخزين و النقل">
            <ul>
              <li><b>Faraday bag</b> لـ phones / IoT / wireless devices — يمنع remote wipe.</li>
              <li><b>Anti-static bag</b> للـ HDDs.</li>
              <li><b>Tamper-evident seals</b> — أي فتح يترك أثراً واضحاً. مع توقيع و رقم seal.</li>
              <li><b>Evidence locker</b> — مقفّل، مسجّل، access controlled. ليس مكتبك.</li>
              <li><b>عند النقل</b> — لا تترك الدليل في سيارة دون رقابة. لا تُسجّل صور CoC على هاتفك الشخصي.</li>
              <li><b>تصنيف الحرارة و الرطوبة</b> — HDDs حسّاسة (هذا في polices رسمية).</li>
            </ul>
          </Section>

          <Section title="Live forensics — الحالات الخاصة">
            <p>أحياناً لا يمكن إطفاء النظام (production, encryption keys في RAM, evidence في memory). قواعد:</p>
            <ol>
              <li>وثّق <b>كل أمر تنفّذه</b> مع timestamp.</li>
              <li>اكتب أوامرك من media خارجي (USB موثوق، lab-prepared) — ليس من القرص محل التحقيق.</li>
              <li>أرسل output خارج النظام (netcat لـ analyst host)، لا تكتب على القرص محل التحقيق.</li>
              <li>اجمع memory أولاً ثم disk.</li>
              <li>اعلم: live collection يعدّل النظام بدرجة ما — وثّق هذا التعديل بالاسم.</li>
            </ol>
            <Code lang="bash">{`# على المحقق
nc -lvp 4444 > collected.bin

# على النظام محل التحقيق (من media موثوق)
F:\\tools\\winpmem.exe - | F:\\tools\\nc.exe analyst-host 4444`}</Code>
          </Section>

          <Section title="Encryption — التحديات الواقعية">
            <Callout kind="info" title="ماذا تفعل عند BitLocker / FileVault / LUKS">
              <ol>
                <li><b>إن النظام يعمل</b> — استخرج المفتاح من RAM فوراً (Volatility plugin, Rekall). إن أطفأت، يضيع.</li>
                <li><b>افحص TPM</b> — في Windows مع BitLocker، Recovery Key قد يكون مخزّن في AD (TPM-only أو BitLocker recovery).</li>
                <li><b>iCloud / Microsoft account</b> — قد يحتفظ بـ recovery keys. يحتاج legal process.</li>
                <li><b>FileVault keys</b> — في keychain, قد تستخرج من memory.</li>
                <li><b>Cold Boot Attack</b> — endpoint قديم لكن للأنظمة الحساسة قابل للتطبيق (DDR3 يحتفظ بالبيانات لثوان بعد الإطفاء).</li>
              </ol>
            </Callout>
          </Section>

          <Section title="Federal context — قواعد رسمية">
            <Callout kind="danger" title="ما يجب أن تعرفه">
              <ul>
                <li><b>FRE 901</b> (Federal Rules of Evidence) — Authentication. أنت كـ analyst قد تكون الـ "witness" الذي يثبت أن الدليل authentic.</li>
                <li><b>FRE 902(13–14)</b> — Self-authentication للسجلات الرقمية مع certification (hash + chain of custody).</li>
                <li><b>FRE 803(6)</b> — Business Records Exception. logs المؤسسة قد تُقبل دون شاهد إذا certified.</li>
                <li><b>NIST SP 800-86</b> — "Guide to Integrating Forensic Techniques into Incident Response" — مرجعي للمؤسسات الفيدرالية.</li>
                <li><b>DoD 5220.22-M</b> — معايير sanitization عند disposal.</li>
                <li><b>SWGDE</b> (Scientific Working Group on Digital Evidence) — guidelines معتمدة من المحاكم.</li>
              </ul>
            </Callout>
            <p>عند الشك: <b>اتصل بـ FBI Cyber Action Team (CAT)</b> أو فريق legal الخاص بك قبل اتخاذ قرار يؤثر على الدليل. لا توجد جائزة على السرعة لكن هناك عقوبات على إفساد الدليل.</p>
          </Section>

          <Section title="أخطاء قاتلة — اوعى تعملها">
            <ul>
              <li><b>تشغّل النظام «علشان تشوف بيحصل إيه».</b> كل ثانية شغّال = آلاف التغييرات على القرص. حرقت الدليل بإيدك.</li>
              <li><b>توصّل القرص الأصلي على لابتوبك.</b> الـ OS بيعدّل timestamps فوراً. يا write-blocker، يا متوصلش أصلاً.</li>
              <li><b>تخزّن الدليل على شبكة المؤسسة العادية.</b> استخدم evidence-only storage مع ACLs صارمة.</li>
              <li><b>تشغّل antivirus على الـ image.</b> الـ AV ممكن «ينضّف» الـ malware — وده يعني هو دمّر الدليل بإيده.</li>
              <li><b>ما توثّقش ساعة النظام.</b> اقرا BIOS clock وقارنه بـ UTC الحالي. أي انحراف بيهدّ الـ timeline كله.</li>
              <li><b>تتكلم في chat عام.</b> أي كلام عن الدليل لازم يبقى في قناة رسمية وموثّق.</li>
              <li><b>تأجّل كتابة الـ notes.</b> اكتب الـ field notes في اللحظة. الذاكرة بتروح والتوقيتات بتختلط.</li>
            </ul>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>الـ digital forensics 70% توثيق، 30% تقنية.</p>
            <p>الـ analyst اللي عنده تقنية ممتازة وتوثيق ضعيف = شغله بيتحرق في المحكمة.</p>
            <p>اللي عنده توثيق ممتاز وتقنية متوسطة = شغله بيكسب القضية.</p>
            <p>اختار صفك من قبل ما تلمس evidence.</p>
          </Section>
        </>}
        en={<>
          <Section title="Why chain of custody isn't bureaucracy">
            <p>Any federal investigation may end in court. Evidence whose integrity you can't prove — origin, who handled it, when, how stored — is <b>inadmissible</b>. The case collapses regardless of how strong the technical evidence is.</p>
            <Analogy>Like a forensic blood sample. If kept in the right fridge, with every transfer signed, with a clear serial number — the judge accepts it. Miss one signature, it's rejected. Technique can't save bad documentation.</Analogy>
            <Callout kind="danger" title="Golden rule">
              <b>Treat every artifact as if it will be presented to a jury</b> — even if you think the case is "minor". The decision to convert to a criminal track happens later, and tainted evidence can't be recovered.
            </Callout>
          </Section>

          <Section title="Pillars of evidence preservation">
            <TwoCol>
              <Card title="Authenticity" color="blue">
                Proof the evidence is what it's claimed to be — not substituted, not tampered.
              </Card>
              <Card title="Integrity" color="amber">
                Proof it hasn't changed since collection. Via hashing.
              </Card>
              <Card title="Reliability" color="red">
                Tools and procedures produce reproducible results. Recognized methodology.
              </Card>
              <Card title="Best Evidence Rule" color="green">
                FRE 1001–1008 — original preferred. The "logical" original of digital evidence = bit-by-bit image.
              </Card>
            </TwoCol>
          </Section>

          <Section title="Collection — field rules">
            <Callout kind="good" title="Before you touch anything">
              <ol>
                <li><b>Document the scene</b> — photos + video of the system and surroundings before any change.</li>
                <li><b>Document machine state</b>: screen (locked? what's shown?), LEDs, cabling, ports.</li>
                <li><b>Ask for credentials</b> from the owner before powering down.</li>
                <li><b>Decide: live vs dead?</b> — RAM is volatile; powering down loses it.</li>
                <li><b>Wear gloves</b> if there's a forensic dimension (DNA / prints).</li>
              </ol>
            </Callout>
          </Section>

          <Section title="Order of volatility — RFC 3227">
            <Code lang="text">{`Collect in this order — most volatile first:

1. Registers, CPU cache                — gone in ms
2. Routing tables, ARP cache, kernel   — gone on reboot
   stats, memory contents
3. Temporary file systems              — gone on reboot
4. Disk                                — persists
5. Remote logging & monitoring data    — persists but can be wiped
6. Physical configuration, network     — stable
7. Archival media                      — stable`}</Code>
          </Section>

          <Section title="Imaging — taking a forensic copy">
            <h3>1) Hardware write-blocker is mandatory</h3>
            <p>Before connecting any disk to your investigator workstation, attach a write-blocker (Tableau, WiebeTech, CRU). It blocks writes. Without one, normal navigation triggers 100+ modifications.</p>

            <h3>2) Imaging tools</h3>
            <Code lang="bash">{`# dc3dd (forensics fork of dd)
dc3dd if=/dev/sdb of=evidence.dd \\
  hash=sha256 hash=md5 \\
  log=evidence.log \\
  hashlog=hash.txt \\
  bs=1M

# FTK Imager — most-used GUI
# - emits E01 (Expert Witness Format) with compression + metadata
# - computes MD5 + SHA1 + SHA256 automatically

# dcfldd
dcfldd if=/dev/sdb hash=sha256 of=evidence.dd 2>log.txt

# RAM (Windows)
winpmem.exe -o memory.aff4

# RAM (Linux)
LiME (Linux Memory Extractor) → /tmp/mem.lime
sudo insmod lime.ko "path=/tmp/mem.lime format=lime"

# RAM (Mac)
Volexity Surge Collect — commercial but the practical standard`}</Code>

            <h3>3) Standard formats</h3>
            <ul>
              <li><b>raw / dd</b> — bit-by-bit. Big, simple, universal.</li>
              <li><b>E01 (EnCase)</b> — bundled metadata, compression, hash verification.</li>
              <li><b>AFF / AFF4</b> — open standard. Preferred for new projects.</li>
              <li><b>VMDK / VHD</b> — useful for VMs, opens in hypervisors.</li>
            </ul>
          </Section>

          <Section title="Hashing — the heart of integrity">
            <p>Hash <b>before</b> collection (when possible — on the source via write-blocker) and <b>after</b>. Match = intact. Mismatch = something was written.</p>
            <Terminal lines={[
              { p: "# Pre-image" },
              { p: "sha256sum /dev/sdb > before.txt" },
              { o: "9f3a... /dev/sdb" },
              { p: "" },
              { p: "# Post-image" },
              { p: "sha256sum evidence.dd > after.txt" },
              { o: "9f3a... evidence.dd" },
              { p: "" },
              { p: "# Verify on every transfer" },
              { p: "sha256sum -c hashes.txt" },
            ]} />
            <Callout kind="info" title="MD5 + SHA256 together">
              MD5 is cryptographically broken but still legally accepted for integrity (accidental collision odds ≈ 0). Always add SHA256 — modern courts expect it.
            </Callout>
          </Section>

          <Section title="Chain of custody form — the classic doc">
            <p>Each item carries a form. Every transfer is logged. Any gap in the chain = potential tampering = evidence may be excluded.</p>
            <Code lang="markdown">{`# CHAIN OF CUSTODY — Evidence Item

Case #: 2026-CR-0457
Item #: 001
Description: Dell Latitude 7420 laptop, S/N: ABC123XYZ
Source: Conference Room B, Building 4
Collected by: SA John Smith, Badge 4523
Collection date/time: 2026-04-30 14:32 EDT
Condition: Powered on, locked screen
SHA256 (post-image): 9f3a...

## Transfer log
| Date/Time         | From               | To                  | Reason          | Signature |
|-------------------|--------------------|---------------------|-----------------|-----------|
| 2026-04-30 14:32  | Scene              | SA Smith            | Initial seizure | [sig]     |
| 2026-04-30 18:00  | SA Smith           | Evidence Locker A12 | Storage         | [sig]/[sig] |
| 2026-05-01 09:15  | Evidence Locker    | SA Davis (Forensics)| Imaging         | [sig]/[sig] |
| 2026-05-01 16:30  | SA Davis           | Evidence Locker A12 | Return          | [sig]/[sig] |`}</Code>
          </Section>

          <Section title="Storage and transport">
            <ul>
              <li><b>Faraday bag</b> for phones / IoT / wireless devices — blocks remote wipe.</li>
              <li><b>Anti-static bag</b> for HDDs.</li>
              <li><b>Tamper-evident seals</b> — opening leaves a clear trace. With signatures and a seal number.</li>
              <li><b>Evidence locker</b> — locked, logged, access-controlled. Not your desk.</li>
              <li><b>In transit</b> — never leave evidence in an unattended vehicle. Don't photograph CoC docs on your personal phone.</li>
              <li><b>Temperature/humidity</b> ratings — HDDs are sensitive (in formal SOPs).</li>
            </ul>
          </Section>

          <Section title="Live forensics — special cases">
            <p>Sometimes you can't power down (production, encryption keys in RAM, evidence in memory). Rules:</p>
            <ol>
              <li>Document <b>every command you run</b> with timestamp.</li>
              <li>Run commands from external trusted media (lab-prepared USB) — not the disk under investigation.</li>
              <li>Send output off-system (netcat to analyst host); never write to the suspect disk.</li>
              <li>Memory first, disk after.</li>
              <li>Acknowledge: live collection modifies the system somewhat — explicitly document the modifications.</li>
            </ol>
            <Code lang="bash">{`# On the investigator host
nc -lvp 4444 > collected.bin

# On the suspect host (from trusted media)
F:\\tools\\winpmem.exe - | F:\\tools\\nc.exe analyst-host 4444`}</Code>
          </Section>

          <Section title="Encryption — real-world challenges">
            <Callout kind="info" title="What to do with BitLocker / FileVault / LUKS">
              <ol>
                <li><b>If the system is running</b> — extract the key from RAM immediately (Volatility plugin, Rekall). Power off and it's gone.</li>
                <li><b>Check TPM</b> — on Windows BitLocker, recovery keys may be escrowed in AD (TPM-only or BitLocker recovery key).</li>
                <li><b>iCloud / Microsoft account</b> — may hold recovery keys. Requires legal process.</li>
                <li><b>FileVault keys</b> — in keychain, often pullable from memory.</li>
                <li><b>Cold-boot attacks</b> — niche but viable for high-stakes cases (DDR3 retains data for seconds after power-off).</li>
              </ol>
            </Callout>
          </Section>

          <Section title="Federal context — formal rules">
            <Callout kind="danger" title="What you must know">
              <ul>
                <li><b>FRE 901</b> (Federal Rules of Evidence) — Authentication. As an analyst, you may be the "witness" who proves authenticity.</li>
                <li><b>FRE 902(13–14)</b> — Self-authentication for digital records with certification (hash + chain of custody).</li>
                <li><b>FRE 803(6)</b> — Business Records Exception. Org logs may come in without a witness if certified.</li>
                <li><b>NIST SP 800-86</b> — "Guide to Integrating Forensic Techniques into Incident Response" — the federal reference.</li>
                <li><b>DoD 5220.22-M</b> — sanitization standards on disposal.</li>
                <li><b>SWGDE</b> (Scientific Working Group on Digital Evidence) — guidelines courts recognize.</li>
              </ul>
            </Callout>
            <p>When in doubt: <b>call the FBI Cyber Action Team (CAT)</b> or your legal team before taking an action that affects evidence. There's no prize for speed, but real penalties for spoliation.</p>
          </Section>

          <Section title="Fatal mistakes — don't">
            <ul>
              <li><b>Power up the system to "see what happens".</b> Every second running = thousands of disk modifications.</li>
              <li><b>Plug the suspect disk into your machine.</b> The OS updates timestamps instantly. Write-blocker, or don't connect.</li>
              <li><b>Store evidence on the regular corporate share.</b> Use evidence-only storage with strict ACLs.</li>
              <li><b>Run AV against the image.</b> AV may quarantine "malware" — destroying evidence.</li>
              <li><b>Skip documenting the system clock.</b> Read BIOS clock vs UTC. Skew breaks every timeline.</li>
              <li><b>Talk in public chats.</b> All evidence comms go on the official channel, documented.</li>
              <li><b>Delay note-taking.</b> Field notes go in immediately. Memory fades, timelines blur.</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
