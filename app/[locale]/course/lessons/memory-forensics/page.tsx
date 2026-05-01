"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="memory-forensics">
      <L
        ar={<>
          <Section title="ليه الذاكرة أصعب وأهم من الـ Disk؟">
            <Analogy>
              انت محقق في جريمة في فندق. تبدأ منين؟
              تفتح دفتر تسجيل النزلاء؟
              ده الـ Disk — بيقولك مين حجز ومين خرج. بس مش هيقولك مين كان في الردهة لحظة الجريمة.
              الذاكرة (RAM) هي الردهة نفسها لحظة الحادثة: مين كان بيتكلم، أنهي عمليات شغّالة، أنهي اتصالات شبكة مفتوحة.
              ده اللي المالوير ما يقدرش يخبّيه عن الذاكرة.

              - طب يا حضرتك ما الـ EDR بياخد كل ده؟؟

              يا نجم الجيل.. الـ EDR بيشوف ظاهر الكلام بس. الـ rootkit الجاد بيلعب مع الـ kernel نفسه فبيعمي عين الـ EDR. اللي بيكشفه؟ snapshot للذاكرة بيتقرأ offline. بس.
            </Analogy>
            <p>
              في 2025، أكتر من 70% من الـ malware المتطوّر بقى fileless — ما بيكتبش على الـ Disk خالص، عايش كله في الذاكرة. Cobalt Strike beacons، Sliver implants، PowerShell Empire، Meterpreter — كلهم في RAM بس.
              لو انت بتبصّ على الـ Disk بس، انت بتتفرّج على نص الفيلم.
            </p>
            <p>
              الدرس ده عن Volatility 3، الإطار المعياري لتحليل dump الذاكرة على Windows / Linux / macOS. مش لأنه &quot;الأحدث&quot; — لأنه شغل Aaron Walters و13 سنة من البحث. مفيش بديل.
            </p>
            <Callout kind="danger" title="غلطات الـ junior في memory forensics">
              <ul>
                <li>بيعمل reboot قبل dump — كل حاجة راحت. مفيش undo.</li>
                <li>بيدوّر على process مشبوه بـ <code>pslist</code> بس وينسى <code>psscan</code> — الـ DKOM rootkits بتتخفى في الـ list ومش بتختفي من الـ scan.</li>
                <li>بيلاقي injection بـ <code>malfind</code> ويفرح، وينسى يعمل <code>dumpfiles</code> للـ payload — كده ضيّع العيّنة الوحيدة.</li>
                <li>بيشغّل Volatility على عيّنة من غير ما يحسب SHA256 الأول — chain of custody اتكسرت.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="التقاط الذاكرة (Acquisition)">
            <Step n={1} title="Windows">
              <Code lang="powershell">{`# WinPmem (مفتوح المصدر، Velociraptor الآن)
.\\winpmem.exe -o C:\\evidence\\memory.raw

# Magnet RAM Capture (تجاري، GUI، صفر آثار)
# DumpIt — أبسط، single command

# Hyper-V / VMware: snapshot ثم vmss → vmem
# vmss2core أو vol3 يقرأ vmem مباشرة`}</Code>
            </Step>
            <Step n={2} title="Linux">
              <Code lang="bash">{`# AVML — Microsoft، يعمل بدون kernel module
sudo ./avml memory.lime

# LiME (Linux Memory Extractor)
sudo insmod lime.ko "path=/evidence/mem.lime format=lime"

# /proc/kcore — حذر: قد يكون متاحاً للقراءة، يحتاج dwarf للقراءة`}</Code>
            </Step>
            <Step n={3} title="السلسلة الجنائية (Chain of Custody)">
              SHA256 فوراً بعد الالتقاط. وقّع رقمياً. سجّل من، متى، وأي أداة. الذاكرة لا يمكن إعادة التقاطها — اللحظة فات.
            </Step>
          </Section>

          <Section title="Volatility 3 — الـ plugins الأساسية">
            <Code lang="bash">{`# تحديد البروفايل (Vol3 يفعل ذلك تلقائياً غالباً)
vol -f mem.raw windows.info

# 1. العمليات الجارية
vol -f mem.raw windows.pslist
vol -f mem.raw windows.pstree    # هرمي
vol -f mem.raw windows.psscan    # يكشف العمليات المخفية

# 2. الاتصالات الشبكية (مفتاح اكتشاف C2)
vol -f mem.raw windows.netscan
vol -f mem.raw windows.netstat

# 3. مكتبات DLL لكل عملية
vol -f mem.raw windows.dlllist --pid 1234

# 4. خيوط (Threads) و callstacks
vol -f mem.raw windows.threads --pid 1234

# 5. Registry hive scan
vol -f mem.raw windows.registry.hivelist
vol -f mem.raw windows.registry.printkey --key "Software\\Microsoft\\Windows\\CurrentVersion\\Run"`}</Code>
          </Section>

          <Section title="اكتشاف Process Injection">
            <p>
              الـ injection (T1055) هو حقن code في عملية شرعية لإخفاء النشاط. Volatility يكشفه عبر تحليل memory regions.
            </p>
            <Step n={1} title="malfind — السلاح الأول">
              <Code lang="bash">{`vol -f mem.raw windows.malfind
# يكشف صفحات RWX غير مرتبطة بملف على القرص — عَلَم أحمر`}</Code>
              <Terminal lines={[
                { p: "vol -f compromise.raw windows.malfind" },
                { o: "Process: explorer.exe  PID: 4532\nVAD: 0x7ff5d0000000-0x7ff5d000ffff\nProtection: PAGE_EXECUTE_READWRITE\nNotes: Hexdump shows MZ header — DLL injected without LoadLibrary\n[!] Injection detected" },
              ]} />
            </Step>
            <Step n={2} title="hollowfind">
              يكشف Process Hollowing (إفراغ عملية شرعية وملؤها بـ payload).
              <Code lang="bash">{`vol -f mem.raw windows.hollowfind`}</Code>
            </Step>
            <Step n={3} title="استخرج الـ payload">
              <Code lang="bash">{`vol -f mem.raw windows.dumpfiles --pid 4532 --virtaddr 0x7ff5d0000000
# تستطيع تحليله بـ binwalk / ghidra لاحقاً`}</Code>
            </Step>
          </Section>

          <Section title="استخراج الاعتمادات">
            <Code lang="bash">{`# hashes من LSASS dump
vol -f mem.raw windows.hashdump
vol -f mem.raw windows.lsadump
vol -f mem.raw windows.cachedump

# Mimikatz inside memory analysis
vol -f mem.raw windows.mimikatz`}</Code>
          </Section>

          <Section title="حالة عملية: تحليل rootkit">
            <Step n={1} title="مؤشر أولي">
              EDR رصد عملية باسم svchost.exe لكن من user context غير اعتيادي. dump الذاكرة فوراً.
            </Step>
            <Step n={2} title="فحص psscan vs pslist">
              <Code lang="bash">{`vol -f mem.raw windows.pslist > pslist.txt
vol -f mem.raw windows.psscan > psscan.txt
diff pslist.txt psscan.txt
# عمليات في psscan وليست في pslist = مخفية بـ DKOM rootkit`}</Code>
            </Step>
            <Step n={3} title="فحص ssdt و callbacks">
              <Code lang="bash">{`vol -f mem.raw windows.ssdt        # System Service Descriptor Table — kernel hooks
vol -f mem.raw windows.callbacks   # kernel callbacks — مكان شائع لـ rootkits
vol -f mem.raw windows.modules     # المكتبات النواة المحمّلة
vol -f mem.raw windows.modscan     # عبر pool tag scan — يكشف modules مخفية`}</Code>
            </Step>
          </Section>

          <Callout kind="danger" title="الذاكرة بتطير — مفيش مرة تانية">
            بمجرد ما الجهاز يعمل restart، كل حاجة ضاعت.
            مفيش undo.
            مفيش &quot;خليني أحاول تاني&quot;.
            قاعدة IR صارمة: dump الذاكرة قبل أي تفاعل مع الجهاز، حتى قبل ما المحقق يعمل login. كل خطوة بتغيّر الذاكرة، فاللحظة الأولى هي الأذكى.
            لو فات عليك الـ window ده، انت كتبت &quot;سيب الـ adversary يفلت&quot; في تقرير الحادثة.
          </Callout>
          <Callout kind="info" title="الخلاصة الناشفة">
            الذاكرة هي المكان الوحيد اللي المهاجم ما يقدرش يكدب فيه.
            لو سيطر على الـ Disk، يقدر يمسح.
            لو سيطر على الـ logs، يقدر يعدّل.
            الـ RAM لحظة الـ snapshot هي الحقيقة الناشفة.
            اكتبها على الحيطة اللي قصاد مكتب الـ IR: خد الـ snapshot قبل أي حاجة. التحليل بعدين. مفيش "هخش login بس وأشوف" — لو خشيت، الذاكرة اتلوّثت وأنت ونصيبك.
          </Callout>

          <Callout kind="good" title="الحماية — لتسهيل التحليل لاحقاً">
            <ul>
              <li>فعّل Sysmon Event 1, 7, 10 (process creation, image load, lsass access)</li>
              <li>EDR ينبغي أن يدعم triage automatic memory capture</li>
              <li>نشر Velociraptor — يجمع memory artifacts من آلاف الأجهزة</li>
              <li>سياسة Memory Integrity (Hypervisor-protected Code Integrity) لتقليل rootkits</li>
              <li>اختبر playbook الـ IR شهرياً مع dump حقيقي من lab</li>
            </ul>
          </Callout>

          <Section title="مصادر">
            <ul>
              <li>Volatility 3 documentation — <span className="eng">volatility3.readthedocs.io</span></li>
              <li>The Art of Memory Forensics — Ligh, Case, Levy, Walters</li>
              <li>SANS FOR508 — Advanced Incident Response, Threat Hunting</li>
              <li>13Cubed YouTube — Volatility walkthroughs</li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="Why memory is harder and more important than disk">
            <Analogy>
              Investigating a hotel crime. Disk is the guest registry — it tells you who checked in, but not who was
              in the lobby at the moment of the incident. RAM is the lobby itself: who was speaking, which processes
              were running, which network connections were live. This is what malware can't hide from memory.
            </Analogy>
            <p>
              Modern advanced malware is fileless — it never touches disk and lives entirely in memory. This lesson
              covers Volatility 3, the de-facto framework for memory dumps on Windows / Linux / macOS.
            </p>
          </Section>

          <Section title="Acquisition">
            <Step n={1} title="Windows">
              <Code lang="powershell">{`# WinPmem (now part of Velociraptor)
.\\winpmem.exe -o C:\\evidence\\memory.raw

# Magnet RAM Capture (commercial, GUI, near-zero footprint)
# DumpIt — single command

# Hyper-V / VMware: snapshot, then vmss → vmem
# vmss2core or vol3 reads vmem directly`}</Code>
            </Step>
            <Step n={2} title="Linux">
              <Code lang="bash">{`# AVML — Microsoft, no kernel module
sudo ./avml memory.lime

# LiME (Linux Memory Extractor)
sudo insmod lime.ko "path=/evidence/mem.lime format=lime"

# /proc/kcore — careful: may be readable, needs dwarf to parse`}</Code>
            </Step>
            <Step n={3} title="Chain of custody">
              SHA256 immediately after capture. Sign digitally. Log who, when, and which tool. Memory cannot be
              re-acquired — the moment is gone.
            </Step>
          </Section>

          <Section title="Volatility 3 — core plugins">
            <Code lang="bash">{`# Profile detection (Vol3 mostly auto)
vol -f mem.raw windows.info

# 1. Running processes
vol -f mem.raw windows.pslist
vol -f mem.raw windows.pstree    # hierarchical
vol -f mem.raw windows.psscan    # finds hidden processes

# 2. Network connections (key to spotting C2)
vol -f mem.raw windows.netscan
vol -f mem.raw windows.netstat

# 3. DLLs per process
vol -f mem.raw windows.dlllist --pid 1234

# 4. Threads and call stacks
vol -f mem.raw windows.threads --pid 1234

# 5. Registry hive scan
vol -f mem.raw windows.registry.hivelist
vol -f mem.raw windows.registry.printkey --key "Software\\Microsoft\\Windows\\CurrentVersion\\Run"`}</Code>
          </Section>

          <Section title="Detecting process injection">
            <p>
              Injection (T1055) hides activity inside a legitimate process. Volatility detects it by analyzing memory
              regions.
            </p>
            <Step n={1} title="malfind — primary weapon">
              <Code lang="bash">{`vol -f mem.raw windows.malfind
# Surfaces RWX pages not backed by a disk file — red flag`}</Code>
              <Terminal lines={[
                { p: "vol -f compromise.raw windows.malfind" },
                { o: "Process: explorer.exe  PID: 4532\nVAD: 0x7ff5d0000000-0x7ff5d000ffff\nProtection: PAGE_EXECUTE_READWRITE\nNotes: Hexdump shows MZ header — DLL injected without LoadLibrary\n[!] Injection detected" },
              ]} />
            </Step>
            <Step n={2} title="hollowfind">
              Detects Process Hollowing (legit process emptied and refilled with payload).
              <Code lang="bash">{`vol -f mem.raw windows.hollowfind`}</Code>
            </Step>
            <Step n={3} title="Extract the payload">
              <Code lang="bash">{`vol -f mem.raw windows.dumpfiles --pid 4532 --virtaddr 0x7ff5d0000000
# Then analyze with binwalk / ghidra`}</Code>
            </Step>
          </Section>

          <Section title="Credential extraction">
            <Code lang="bash">{`# Hashes from a captured LSASS in memory
vol -f mem.raw windows.hashdump
vol -f mem.raw windows.lsadump
vol -f mem.raw windows.cachedump

# Mimikatz-style extraction
vol -f mem.raw windows.mimikatz`}</Code>
          </Section>

          <Section title="Hands-on: rootkit triage">
            <Step n={1} title="First indicator">
              EDR alerts on a svchost.exe in unusual user context. Dump memory immediately.
            </Step>
            <Step n={2} title="psscan vs pslist diff">
              <Code lang="bash">{`vol -f mem.raw windows.pslist > pslist.txt
vol -f mem.raw windows.psscan > psscan.txt
diff pslist.txt psscan.txt
# Processes in psscan but not pslist = hidden by DKOM rootkit`}</Code>
            </Step>
            <Step n={3} title="SSDT and callback inspection">
              <Code lang="bash">{`vol -f mem.raw windows.ssdt        # System Service Descriptor Table — kernel hooks
vol -f mem.raw windows.callbacks   # kernel callbacks — common rootkit anchor
vol -f mem.raw windows.modules     # loaded kernel modules
vol -f mem.raw windows.modscan     # via pool-tag scan — finds hidden modules`}</Code>
            </Step>
          </Section>

          <Callout kind="danger" titleEn="Memory is volatile">
            Reboot the host and everything is gone. Strict IR rule: capture memory before any interaction with the
            host, even before an analyst's interactive logon. Every action mutates memory.
          </Callout>

          <Callout kind="good" titleEn="Defense — make later analysis easier">
            <ul>
              <li>Enable Sysmon Events 1, 7, 10 (process creation, image load, lsass access)</li>
              <li>EDR should support automated triage memory capture</li>
              <li>Deploy Velociraptor — collects memory artifacts across thousands of hosts</li>
              <li>Memory Integrity / Hypervisor-protected Code Integrity to reduce rootkit surface</li>
              <li>Tabletop the IR playbook monthly with a real lab dump</li>
            </ul>
          </Callout>

          <Section title="References">
            <ul>
              <li>Volatility 3 documentation — <span className="eng">volatility3.readthedocs.io</span></li>
              <li>The Art of Memory Forensics — Ligh, Case, Levy, Walters</li>
              <li>SANS FOR508 — Advanced Incident Response, Threat Hunting</li>
              <li>13Cubed YouTube — Volatility walkthroughs</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
