"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="windows-fundamentals">
      <L
        ar={<>
          <Section title="لماذا Windows لمختصي الأمن">
            <p>Windows يشغّل ~75% من حواسيب المؤسسات و معظم الـ Active Directory في العالم. كل APT تقريباً تستهدف Windows في مرحلة من الهجوم. فهم Windows من الداخل = نصف معركة الـ red و blue team.</p>
            <Callout kind="info" title="الهدف">
              فهم: Registry، PowerShell كأداة قوية، الخدمات والعمليات، أحداث الـ logs، و فكرة Active Directory المبدئية.
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

          <Section title="PowerShell — الأداة الأقوى على Windows">
            <p>PowerShell ليس &quot;cmd أحدث&quot;. هو لغة برمجة كاملة مع وصول لـ .NET. كل أداة pentest تقريباً على Windows مكتوبة بـ PowerShell.</p>
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

          <Section title="Registry — قاعدة بيانات الإعدادات">
            <p>Registry هو حيث Windows يخزّن كل إعداد. مفهومه:</p>
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
            <Callout kind="info" title="لماذا Run keys مهمة">
              أكثر مكان يضع فيه malware نفسه ليعمل عند بدء التشغيل. <span className="eng">Sysinternals Autoruns</span> أداة الذهب لاستعراض كل أماكن الاستمرار دفعة واحدة.
            </Callout>
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

          <Section title="السجلات (Event Logs)">
            <p>Windows يسجل كل شيء في Event Viewer. كل event له ID — حفظ بعض IDs المهمة يفرّق المهاجم عن المدافع الجاد:</p>
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
              <li>حمّل Sysinternals Suite، شغّل Autoruns، انظر كم مكان يبدأ منه شيء.</li>
              <li>في Event Viewer، ابحث عن آخر event 4624 — ستراك أنت.</li>
              <li>ادرس <span className="eng">Get-Help</span> — مكافئ <span className="eng">man</span>: <span className="eng">Get-Help Get-Process -Examples</span>.</li>
            </ol>
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
