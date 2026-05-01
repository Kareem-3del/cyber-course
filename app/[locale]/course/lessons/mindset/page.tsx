"use client";
import { LessonShell, Section, Callout, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="mindset">
      <L
        ar={<>
          <Section title="ايه اللي بيفرّق الـ Hacker الحقيقي عن أي حد تاني؟">
            <p>تعالى نتفاهم من الأول.</p>
            <p>هو الـ hacker بيكتب أوامر؟<br/>ولا بيحفظ payloads؟<br/>ولا بيشغّل Metasploit ويستنى الميركل تحصل؟</p>
            <p>لا. ولا واحدة من دول.</p>
            <p>الـ hacker الحقيقي بيفكّر بطريقة مختلفة. ده <b>mindset</b>، مش toolset. الأدوات بتتغيّر كل ست شهور. التفكير بيفضل.</p>
            <p>أنا عملت الغلط ده لما كنت بادي. قعدت أسبوعين أحفظ أوامر nmap. وبعدين دخلت أول engagement حقيقي ولقيت نفسي مش عارف من أنهي ناحية أبدأ. الأوامر معايا. التفكير لأ.</p>
            <Analogy>بُص. تخيّل في خزنة كبيرة في بيتك. الحرامي العبيط بيحاول يكسر باب الحديد بشاكوش. الحرامي الشاطر بيدوّر:<br/>المفتاح تحت السجادة؟<br/>ابن الجيران عارف الرقم لأن جدتك بتقوله قدامه؟<br/>شباك الحمام الخلفي مفتوح؟<br/>الـ alarm بطاريته خلصت من سنة؟<br/><b>أكبر بقعة مكشوفة = أكبر فرصة نجاح</b>. والباب الحديد؟ ده آخر حاجة بيبص فيها.</Analogy>
          </Section>

          <Section title="الواقع vs المفروض">
            <p>في فرق كبير بين الواقع وبين المفروض، ولازم تفهم ده من اليوم الأول.</p>
            <p><b>المفروض</b>: المهاجم يدوّر على الـ exploit الجديد، يطلّع zero-day، يكسر الـ firewall.</p>
            <p><b>الواقع</b>: المهاجم بيدوّر على واحد كاتب password "Welcome123!" على account فيه domain admin، ومش ملغيه من سنتين.</p>
            <p>المدافع المبتدئ بيقعد يفكّر إزاي يقفل APT بحزام نووي.<br/>المدافع الشاطر بيسأل: مين فاتح RDP على الإنترنت من غير MFA؟</p>
            <p>الهجمات الحقيقية مش أفلام. اللي بيدخل الشركات في 2026 — وفي 2024، و2020، وعلى أيامنا — هو نفسه: <span className="eng">phishing</span>، credentials مسرّبة، patch فايت من سنة، ومسؤول كسلان حاطط الـ backup على نفس الـ domain.</p>
            <Callout kind="info" title="الخلاصة الناشفة">المهاجم بيدوّر على أرخى نقطة في المنظومة. مش على الباب الحديد.
              لو إنت كمدافع بتحط فلوسك كلها على الـ EDR وسايب Active Directory وحش، يبقى انت بتلعب الشطرنج وعينك على بيدق واحد بس.
              اكتبها على الحيطة اللي قصاد مكتبك: الـ adversary بيحب أرخى نقطة، مش أصعب نقطة.</Callout>
          </Section>

          <Section title="أنواع القبعات — مين بيلبس ايه؟">
            <p>الناس بتحب تحط الـ hackers في خانات. وكل خانة لها لون.</p>
            <p>بُص الأنواع، بس ما تاخدهاش حرفياً قوي — الواقع أعقد من ده.</p>
            <TwoCol>
              <Card title="Red Hat / Black Hat" color="red">المهاجمين. الأسود بيهاجم لفلوس أو لسياسة أو لانتقام. الأحمر مهاجم عدواني، بيلاحق مهاجمين تانيين بأساليب هجومية. الاتنين خارج القانون لو مش معاهم تفويض.</Card>
              <Card title="White Hat / Blue Team" color="blue">المدافعين، والـ pentesters اللي معاهم ورق. شغلهم يلاقوا الثغرة قبل الوحشين، يبنوا طبقات دفاع، ويردوا لما حادثة تحصل. ده اللي إنت رايح ليه.</Card>
              <Card title="Gray Hat" color="amber">في النص. بيكتشف ثغرة من غير إذن، بس بيبلّغ عنها. النية كويسة؟ ممكن. القانون شايفه مخالف؟ في 90% من الدول، أيوه. ما تلعبش في المنطقة دي من غير ما تفهم بلدك.</Card>
              <Card title="Purple Team" color="green">الاتنين بيشتغلوا مع بعض. الـ Red بيهاجم، الـ Blue بيكشف، وبعدين بيقعدوا يراجعوا. ده اللي بيخلّي الحماية بيتطوّر فعلاً، مش بس على ورق.</Card>
            </TwoCol>
          </Section>

          <Section title="سلسلة الهجوم — Cyber Kill Chain">
            <p>طلعت Lockheed Martin النموذج ده علشان توصف مراحل أي هجوم متقدم (APT). والكلام ده مش نظري — ده اللي بيحصل في كل حادثة كبيرة بتقراها في الأخبار.</p>
            <ol>
              <li><b>الاستطلاع</b> — Reconnaissance — جمع أي حاجة عن الهدف.</li>
              <li><b>التسليح</b> — Weaponization — تجهيز الـ payload.</li>
              <li><b>التوصيل</b> — Delivery — توصيله (بريد، USB، لينك، supply chain).</li>
              <li><b>الاستغلال</b> — Exploitation — تشغيل الثغرة.</li>
              <li><b>التثبيت</b> — Installation — backdoor يثبت في النظام.</li>
              <li><b>القيادة والتحكم</b> — C2 — قناة بين المهاجم والجهاز المخترق.</li>
              <li><b>الفعل على الهدف</b> — Actions on Objectives — سرقة، تشفير، تخريب، تجسس.</li>
            </ol>
            <Callout kind="info" title="السلسلة دي مهمة ليه؟">علشان كسر أي حلقة فيها = الهجوم كله طار. الحماية الشاطر بيحط طبقة كشف في كل مرحلة، مش بس على الباب الأول. لو فات عليك Recon، الـ Delivery لسه عندك فرصة. لو فات الـ Delivery، الـ Exploitation لسه فيها. وهكذا.</Callout>
          </Section>

          <Section title="القصة الحقيقية — SolarWinds وKill Chain على الأرض">
            <p>تعالى نمشي على حادثة حقيقية، حلقة حلقة. SolarWinds، 2020. اللي عملوا APT29 (Cozy Bear، اللي بيتنسبوا للاستخبارات الروسية SVR).</p>
            <Step n={1} title="Recon">قعدوا شهور يدرسوا SolarWinds. ايه نظام الـ build؟ مين الـ developers؟ ايه الـ pipelines؟ ايه أكتر منتج بيتنزّل عند العملاء؟ الإجابة: Orion. منتج إدارة شبكات بيتركّب عند 18,000 جهة، فيهم وزارات أمريكية وشركات Fortune 500.</Step>
            <Step n={2} title="Weaponization">طلّعوا malware اسمه SUNBURST. مكتوب بـ .NET، مدمّج جوّه DLL أصلية اسمها <span className="eng">SolarWinds.Orion.Core.BusinessLayer.dll</span>. الـ malware بيستنى 12-14 يوم بعد التركيب قبل ما يتحرّك. ليه؟ علشان يعدّي على الـ sandboxes اللي بتفحص الكود لمدة قصيرة.</Step>
            <Step n={3} title="Delivery">دخلوا على build server بتاع SolarWinds (إزاي؟ لسه الـ industry بتتناقش). وحقنوا الـ malware في الـ build pipeline نفسه. النتيجة: الـ DLL طلعت موقّعة بشهادة SolarWinds الأصلية. وكل عميل عمل update، نزّل الـ backdoor كأنه software شرعي.</Step>
            <Step n={4} title="Exploitation">مفيش exploit بالمعنى الكلاسيكي. الـ exploit هنا هو الثقة. عميلك بيثق فيك، فبتسربه الكود اللي عاوزه. هجمات Supply Chain أخطر حاجة في الـ industry دلوقتي.</Step>
            <Step n={5} title="Installation">SUNBURST اتثبّت في 18,000 شبكة. منهم 100 شركة كبيرة و9 وزارات أمريكية اتمّ الاختراق فيهم بشكل كامل. التركيب كان "شرعي" — التوقيع الرقمي صحيح، الـ EDR ما اشتكاش.</Step>
            <Step n={6} title="C2">الـ malware بيكلّم domains زي <span className="eng">avsvmcloud.com</span>، subdomains مولّدة بـ DGA (Domain Generation Algorithm) علشان كل ضحية يبقى ليها subdomain مختلف. الـ traffic بيبان طبيعي. ومحدش بيشك.</Step>
            <Step n={7} title="Actions on Objectives">سرقوا emails من Microsoft، وزارة الخزانة، وزارة التجارة، DHS. وسرقوا أدوات FireEye الهجومية. كله من غير ما حد يحس لمدة 9 شهور.</Step>
            <Callout kind="danger" title="اللي بيحصل فعلياً">9 شهور. مفيش EDR شافهم. مفيش SIEM لقّطهم. مفيش antivirus حسّ. اللي كشفهم في الآخر؟ FireEye، لما لقوا واحد سجّل جهاز جديد على MFA باسم موظف موجود فعلاً. كشفوا الباب الخلفي بسؤال بسيط: "ليه فيه device جديد؟". <br/>دي الـ truth الموجعة: الـ APT بيختفي جوّه الـ traffic الطبيعي. الكشف بيجي من شذوذ صغير — مش من alert كبير أحمر.</Callout>
            <Callout kind="good" title="الحماية — الدرس من SolarWinds">- مراجعة الـ supply chain: ما تثقش في DLL لمجرد إنها موقّعة.<br/>- مراقبة الـ build infrastructure نفسها كأنها production.<br/>- شذوذ الـ DNS: subdomains جديدة، DGA، traffic لـ domains ما اتشافتش قبل كده — ده signal.<br/>- MFA بـ device attestation، مش بـ TOTP بس.<br/>- Zero Trust على شغل الـ vendors: كل tool بيتنزّل، يفترض إنه عدو لحد ما يثبت العكس.</Callout>
          </Section>

          <Section title="MITRE ATT&CK — اللغة اللي بيتكلّمها كله">
            <p>تخيّل إن المهاجمين والمدافعين بيتكلّموا لغتين مختلفتين.</p>
            <p>المهاجم بيقول: "عملت persistence بـ scheduled task".<br/>المدافع بيقول: "شفت process مش طبيعي بيتشغّل في الساعة 3 صباحاً".</p>
            <p>الاتنين بيتكلّموا عن نفس الحاجة. بس مفيش مفردات مشتركة. النتيجة؟ سوء فهم، تقارير ما بتتفهمش، وفرق Red وBlue بتقعد تتخانق على لا حاجة.</p>
            <p>MITRE ATT&amp;CK هو القاموس المشترك. موسوعة عملية لكل Tactics, Techniques &amp; Procedures (TTPs) المشاهدة في الواقع، مرتّبة، ومسمّاة بأسماء ثابتة. الـ Red بيستخدمه يخطّط. الـ Blue بيستخدمه يكشف. الاتنين بيتكلّموا بنفس اللغة.</p>
            <ul>
              <li><b>Tactic</b> = الهدف. ليه المهاجم بيعمل اللي بيعمله؟ (مثلاً TA0003 — Persistence).</li>
              <li><b>Technique</b> = الأسلوب. إزاي بيحقّق الهدف ده؟ (مثلاً T1053 — Scheduled Task/Job).</li>
              <li><b>Sub-technique</b> = التفصيل. أي variant بالظبط؟ (T1053.005 — Scheduled Task على Windows).</li>
              <li><b>Procedure</b> = التنفيذ الفعلي لمجموعة معيّنة. APT29 بتعملها كده، Lazarus بتعملها كده.</li>
            </ul>
          </Section>

          <Section title="سيناريو ATT&CK كامل — هجوم Conti على Costa Rica">
            <p>تعالى نمشي على حادثة تانية، بس بعدسة MITRE.</p>
            <p>أبريل 2022. عصابة Conti شنّت هجوم ransomware على حكومة Costa Rica. الرئيس أعلن حالة طوارئ وطنية. أوّل مرة في التاريخ دولة تعلن طوارئ بسبب هجوم سيبراني.</p>
            <p>إزاي حصل ده؟ خلّينا نمشي بـ ATT&amp;CK:</p>
            <ul>
              <li><b>Initial Access (TA0001)</b> — T1078: Valid Accounts. credentials مسرّبة من employee في وزارة المالية. مفيش zero-day. مفيش phishing فاخم. حساب وكلمة سر.</li>
              <li><b>Execution (TA0002)</b> — T1059.001: PowerShell. شغّلوا scripts على المحطة الأولى.</li>
              <li><b>Persistence (TA0003)</b> — T1547: Boot or Logon Autostart Execution. ضمنوا إن الـ access يعيش بعد reboot.</li>
              <li><b>Privilege Escalation (TA0004)</b> — T1068: Exploitation for Privilege Escalation. ثغرة في Windows مش متّعمل لها patch.</li>
              <li><b>Defense Evasion (TA0005)</b> — T1562: Impair Defenses. قفلوا الـ Windows Defender. مفيش ادارة مركزية للـ security policies. كل سيرفر شغل لوحده.</li>
              <li><b>Credential Access (TA0006)</b> — T1003: OS Credential Dumping. شغّلوا Mimikatz، طلّعوا hashes من LSASS.</li>
              <li><b>Discovery (TA0007)</b> — T1018: Remote System Discovery. مسحوا الشبكة الداخلية، لقوا 800+ سيرفر.</li>
              <li><b>Lateral Movement (TA0008)</b> — T1021: Remote Services. SMB، RDP، WinRM. الشبكة flat — لو دخلت محطة، انت دخلت كله.</li>
              <li><b>Collection (TA0009)</b> — T1560: Archive Collected Data. لمّوا 672 GB بيانات في ملفات مضغوطة.</li>
              <li><b>Exfiltration (TA0010)</b> — T1567: Exfiltration Over Web Service. سحبوا الداتا قبل ما يشفّروا. ابتزاز مزدوج.</li>
              <li><b>Impact (TA0040)</b> — T1486: Data Encrypted for Impact. شغّلوا الـ ransomware على كل السيرفرات في يوم واحد.</li>
            </ul>
            <Callout kind="warn" title="بُص الفكرة">كل تكتيك من دول كان فيه فرصة كشف. كل واحد. لكن الجهة كانت بتراقب نقطة واحدة بس — الـ perimeter. لما المهاجم عدّى الـ perimeter (بحساب مسرّب)، كل الباقي مش بيتراقب.<br/>ده تمثيل defense، مش defense. الـ ATT&amp;CK بيوريك إنك محتاج كشف على كل تكتيك، مش على واحد بس.</Callout>
          </Section>

          <Section title="بناء معمل التدريب — Lab Setup">
            <p>قاعدة مفيش حد بيسمعها كفاية: <b>ما تجرّبش حاجة برّه معملك</b>.</p>
            <p>مفيش "هجرّبه على شبكة المكتب علشان أتأكد". مفيش "السيرفر بتاع صحبي وافق". الكلام ده آخره مشاكل قانونية، ومشاكل شغل، ومشاكل سُمعة.</p>
            <p>الإعداد اللي ينفعك:</p>
            <Step n={1} title="نظام المهاجم">Kali Linux أو Parrot OS جوّه VirtualBox أو VMware. على شبكة Host-Only علشان يبقى معزول عن النت بتاعك.</Step>
            <Step n={2} title="أنظمة الضحية">Metasploitable 2/3 (Linux مكسور بنية)، DVWA و OWASP Juice Shop (تطبيقات ويب فيها ثغرات)، VulnHub (صور VMs جاهزة)، وسيرفر Ubuntu نضيف للتجارب اللي إنت بتطبخها.</Step>
            <Step n={3} title="بيئة سحابية معزولة">حساب AWS منفصل تماماً عن الإنتاج. ولا حتى نفس الـ billing root. CloudGoat و flaws.cloud بتدّيك سيناريوهات هجوم سحابة في بيئة قانونية.</Step>
            <Step n={4} title="مخابر مجانية على النت">HackTheBox، TryHackMe، RangeForce، PortSwigger Web Academy. ده شغل قانوني 100% — البيئة بتاعتهم، الإذن جاهز.</Step>
            <Terminal lines={[
              { p: "sudo apt install -y nmap nuclei ffuf gobuster sqlmap" },
              { p: "docker run -d -p 80:80 vulnerables/web-dvwa" },
              { o: "DVWA up on http://127.0.0.1 — login: admin/password" },
            ]} />
          </Section>

          <Section title="الأخلاقيات والقانون — اللي مش معاه ورق، ما يلمسش">
            <p>- بس يا حضرتك أنا كنت بحاول أساعدهم؟؟</p>
            <p>يا نجم الجيل.. لأ. مفيش قاضي هيقبلها.</p>
            <p>هل ينفع تختبر سيرفر شركة من غير إذن؟<br/>لا.<br/>لا ما ينفعش.</p>
            <p>أنا شفت بنفسي ناس راحت سجن أسابيع علشان "كانت بتجرّب". مفيش حد ساعدهم. لا الكورس اللي اتعلموا منه، ولا الجروب اللي بيشجعهم.</p>
            <Callout kind="danger" title="القاعدة الذهبية — مفيش استثناء">ما تختبرش هدف ما معاكش عليه <b>إذن مكتوب</b>. اختراق نظام من غير تفويض جريمة في كل الدول. العقوبة بتوصل لسنين سجن وغرامات بالملايين. اللي مش معاه ورق، ما يلمسش. خلاص.</Callout>
            <ul>
              <li>كل engagement بيبتدي بـ Rules of Engagement (RoE) موقّعة من الجهة.</li>
              <li>وثيقة Scope بتحدّد بالظبط ايه اللي بيتختبر، ايه اللي ممنوع، والـ time window.</li>
              <li>كل أداة وكل أمر بتشغّله، بيتسجّل في Engagement Log. علشان لو حصل أي مشكلة، انت معاك dossier كامل.</li>
              <li>لو الجهة طلبت تجربة على نظام إنتاج: غيّر الـ engagement letter. مفيش "بكلمة بيني وبينك".</li>
            </ul>
            <p>الـ professional pentester مش اللي بيلاقي ثغرات أكتر.<br/>ده اللي ما بيتسببش في مشكلة قانونية لشركته ولا لعميله.<br/>الفرق ده هو اللي بيخلّيك تشتغل في المجال 20 سنة، مش 6 شهور.</p>
            <p>اوعى تلمس هدف من غير ورق. اوعى تصدّق "صاحبي وافق". اوعى. أنت ونصيبك لو غلطت.</p>
          </Section>
        </>}
        en={<>
          <Section title="What separates a real Hacker from everyone else?">
            <p>Before learning any tool, understand that hacking isn't "typing commands" — it's a <b>way of thinking</b>. A professional hacker doesn't look for a door to open; they study the entire house — windows, gas line, the cleaner, the mailman — until they find the path with the least guard.</p>
            <Analogy>Imagine you have a heavy safe at home. A clever thief doesn't try to break the steel door. They check: did you leave a key under the mat? Does the neighbor's kid know the PIN? Is the back window unlocked? <b>Wider attack surface = bigger chance of success</b>.</Analogy>
          </Section>

          <Section title="Types of Hats">
            <TwoCol>
              <Card title="🟥 Red Hat / Black Hat" color="red">Attackers. Black hats target for criminal or political ends; red hats are aggressive operators who hunt other attackers offensively.</Card>
              <Card title="🟦 White Hat / Blue Team" color="blue">Defenders and authorized pentesters. They find vulnerabilities before the bad guys, build defenses, and respond to incidents.</Card>
              <Card title="🟨 Gray Hat" color="amber">Between the two — finds vulnerabilities without permission but discloses them. Still illegal in most jurisdictions.</Card>
              <Card title="🟩 Purple Team" color="green">Both teams collaborating in joint exercises to improve defense based on simulated real-world attacks.</Card>
            </TwoCol>
          </Section>

          <Section title="Cyber Kill Chain">
            <p>Lockheed Martin developed this model to describe the phases of any advanced (APT) intrusion:</p>
            <ol>
              <li><b>Reconnaissance</b> — gathering everything about the target.</li>
              <li><b>Weaponization</b> — preparing the malicious payload.</li>
              <li><b>Delivery</b> — getting it to the target (email, USB, link).</li>
              <li><b>Exploitation</b> — triggering the vulnerability.</li>
              <li><b>Installation</b> — planting a backdoor.</li>
              <li><b>Command &amp; Control (C2)</b> — channel between attacker and host.</li>
              <li><b>Actions on Objectives</b> — theft, encryption, sabotage.</li>
            </ol>
            <Callout kind="info" title="Why does this chain matter?">Because breaking any single link = the entire attack fails. Smart defense puts a layer at every phase.</Callout>
          </Section>

          <Section title="MITRE ATT&CK — the shared language">
            <p>MITRE ATT&amp;CK is a practical encyclopedia of every Tactic, Technique &amp; Procedure (TTP) observed in the wild. Red teams use it for planning, blue teams for detection.</p>
            <ul>
              <li><b>Tactic</b> = the goal (e.g., Persistence).</li>
              <li><b>Technique</b> = the method (e.g., Scheduled Task / cron).</li>
              <li><b>Procedure</b> = a specific group's implementation (e.g., APT29).</li>
            </ul>
          </Section>

          <Section title="Building your training lab">
            <p>Never test anything outside an isolated environment. Recommended setup:</p>
            <Step n={1} title="Attacker box">Kali Linux or Parrot OS in VirtualBox / VMware on a Host-Only network.</Step>
            <Step n={2} title="Victim systems">Metasploitable 2/3, DVWA, OWASP Juice Shop, VulnHub, and a clean Ubuntu server for custom experiments.</Step>
            <Step n={3} title="Isolated cloud environment">Separate AWS account (not production) for CloudGoat and flaws.cloud practice.</Step>
            <Step n={4} title="Free online ranges">HackTheBox, TryHackMe, RangeForce, PortSwigger Web Academy.</Step>
            <Terminal lines={[
              { p: "sudo apt install -y nmap nuclei ffuf gobuster sqlmap" },
              { p: "docker run -d -p 80:80 vulnerables/web-dvwa" },
              { o: "DVWA up on http://127.0.0.1 — login: admin/password" },
            ]} />
          </Section>

          <Section title="Ethics and the law">
            <Callout kind="danger" title="The golden rule">Never test a target you don't have <b>written authorization</b> for. Unauthorized intrusion is a crime in every country and penalties reach years of prison.</Callout>
            <ul>
              <li>Every engagement starts with Rules of Engagement (RoE).</li>
              <li>A Scope document specifies exactly what's in and what's out.</li>
              <li>Every tool and action is recorded in an Engagement Log.</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
