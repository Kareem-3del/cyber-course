"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="windows-forensics">
      <L
        ar={<>
          <Section title="فن قراءة ويندوز — البيانات تتكلّم">
            <p>كل عملية، كل تسجيل دخول، كل اتصال شبكة، كل ما تفتح ملف — بيسيب أثر في مكان معروف. الفرق بين محقق محترف ومبتدئ مش في الأدوات — لأ، الفرق في إنه عارف <b>يبص فين وبأي ترتيب</b>. ويندوز فيه حوالي 40 مصدر artifact، 6 منهم بيكفوك في 80% من القضايا.</p>
            <Analogy>ويندوز زي بيت فيه آلاف العدادات. عداد الكهرباء العام بيقولك على الاستهلاك الكلي، لكن لو عرفت إن العداد الفرعي للمطبخ علا فجأة الساعة 3 الفجر، تعرف مين كان صاحي وكان بيعمل إيه.</Analogy>
          </Section>

          <Section title="الخريطة — أين تبحث عن ماذا">
            <TwoCol>
              <Card title="من سجّل دخول؟" color="blue">
                Security Event Log: <span className="eng">4624</span> (logon), <span className="eng">4625</span> (failed), <span className="eng">4634</span> (logoff), <span className="eng">4672</span> (special privileges).
              </Card>
              <Card title="ماذا شغّل؟" color="red">
                Sysmon Event 1, Security 4688 (process creation), Prefetch (<span className="eng">C:\Windows\Prefetch</span>), Amcache, ShimCache.
              </Card>
              <Card title="هل أُنشئت خدمة؟" color="amber">
                System log: <span className="eng">7045</span> (service installed), <span className="eng">7036</span> (start/stop). Sysmon Event 6 (driver loaded).
              </Card>
              <Card title="هل تم تنفيذ PowerShell؟" color="red">
                Microsoft-Windows-PowerShell/Operational: <span className="eng">4103/4104</span> (script block, command), <span className="eng">600/400</span> in old logs.
              </Card>
              <Card title="هل تم اتصال شبكة؟" color="amber">
                Sysmon Event 3 (network connect). إذا غاب: NetFlow / Zeek / firewall logs.
              </Card>
              <Card title="هل عُدّل ملف؟" color="green">
                MFT (<span className="eng">$MFT</span>) — كل ملف على NTFS. USN Journal (<span className="eng">$UsnJrnl</span>) لتسلسل التغييرات.
              </Card>
            </TwoCol>
          </Section>

          <Section title="Sysmon — الـ EDR المجاني الذي يجب أن يكون على كل host">
            <p>Sysmon من Sysinternals بيضيف أكتر من 20 نوع event مهم ويندوز ما بيسجّلهومش افتراضياً. مع config محترم (SwiftOnSecurity أو Olaf Hartong) بيبقى أقوى من EDRs تجارية في الكشف. كل ده ببلاش.</p>
            <Code lang="bash">{`# تثبيت
sysmon64.exe -accepteula -i sysmonconfig.xml

# تحديث config دون إعادة تثبيت
sysmon64.exe -c sysmonconfig.xml

# إلغاء التثبيت
sysmon64.exe -u`}</Code>
            <p>أهم Event IDs:</p>
            <ul>
              <li><b>1</b> Process Create — مع CommandLine, ParentImage, Hashes (MD5/SHA256/IMPHASH).</li>
              <li><b>3</b> Network Connection — مع process المسبّب.</li>
              <li><b>7</b> Image Loaded — DLLs المحمّلة (مفيد لكشف DLL hijacking).</li>
              <li><b>8</b> CreateRemoteThread — كشف process injection.</li>
              <li><b>10</b> ProcessAccess — من فتح handle لـ LSASS؟ (Mimikatz).</li>
              <li><b>11</b> FileCreate — كتابة ملفات.</li>
              <li><b>12/13/14</b> Registry create/set/rename.</li>
              <li><b>22</b> DNS Query — مع process.</li>
              <li><b>25</b> ProcessTampering — كشف Process Hollowing/Doppelganging.</li>
            </ul>
            <Callout kind="info" title="config جاهز">
              ابدأ من <span className="eng">github.com/SwiftOnSecurity/sysmon-config</span> ثم طبّق <span className="eng">github.com/olafhartong/sysmon-modular</span> لتعديل modular.
            </Callout>
          </Section>

          <Section title="Event Log Analysis — استعلامات حرجة">
            <h3>Lateral Movement عبر RDP / SMB</h3>
            <Code lang="powershell">{`# 4624 Logon Type 3 (Network) أو 10 (RDP) — من IP خارجي
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624} -MaxEvents 1000 |
  Where-Object { $_.Properties[8].Value -in 3,10 -and $_.Properties[18].Value -notmatch '^10\\.' } |
  Select-Object TimeCreated, @{n='User';e={$_.Properties[5].Value}}, @{n='SrcIP';e={$_.Properties[18].Value}}`}</Code>

            <h3>إنشاء خدمة جديدة (مؤشّر persistence)</h3>
            <Code lang="powershell">{`Get-WinEvent -FilterHashtable @{LogName='System'; Id=7045} -MaxEvents 50 |
  Format-Table TimeCreated,
    @{n='Service';e={$_.Properties[0].Value}},
    @{n='Path';e={$_.Properties[1].Value}},
    @{n='StartType';e={$_.Properties[3].Value}}`}</Code>

            <h3>PowerShell scriptblock logging</h3>
            <Code lang="kql">{`// Microsoft Sentinel KQL
Event
| where Source == "Microsoft-Windows-PowerShell" and EventID == 4104
| extend ScriptBlock = tostring(EventData["ScriptBlockText"])
| where ScriptBlock matches regex @"(?i)Invoke-Mimikatz|Invoke-Expression|DownloadString|FromBase64String"
| project TimeGenerated, Computer, ScriptBlock`}</Code>
          </Section>

          <Section title="Registry — مخبأ الـ persistence">
            <p>Hives الأكثر فحصاً: <span className="eng">SYSTEM, SOFTWARE, NTUSER.DAT, UsrClass.dat</span>.</p>
            <TwoCol>
              <Card title="Run Keys" color="red">
                <span className="eng">HKLM\Software\Microsoft\Windows\CurrentVersion\Run</span><br />
                <span className="eng">HKCU\Software\Microsoft\Windows\CurrentVersion\Run</span><br />
                + <span className="eng">RunOnce, RunOnceEx, RunServices</span>.
              </Card>
              <Card title="Services" color="red">
                <span className="eng">HKLM\System\CurrentControlSet\Services</span> — كل خدمة + binPath.
              </Card>
              <Card title="UserAssist" color="amber">
                <span className="eng">HKCU\...\UserAssist</span> — برامج شغّلها المستخدم (ROT13 encoded).
              </Card>
              <Card title="ShimCache (AppCompat)" color="amber">
                <span className="eng">HKLM\System\CurrentControlSet\Control\Session Manager\AppCompatCache</span> — أسماء ملفات نُفّذت أو فُحصت (آخر 1024).
              </Card>
              <Card title="Amcache" color="amber">
                <span className="eng">C:\Windows\AppCompat\Programs\Amcache.hve</span> — معلومات أكثر: SHA1, publisher, last modified.
              </Card>
              <Card title="ASEPs الغريبة" color="red">
                AppInit_DLLs, Image File Execution Options (IFEO), Winlogon Shell, COM hijacking, WMI subscriptions.
              </Card>
            </TwoCol>
          </Section>

          <Section title="MFT و Timeline — الترتيب يحلّ القضية">
            <p>كل ملف على NTFS له MFT record (1024 byte) فيه: created, modified, accessed, MFT-modified (4 timestamps × 2 attributes = 8 timestamps). هذا يكشف <b>timestomping</b> (Mimikatz, Cobalt Strike).</p>
            <Code lang="bash">{`# على Linux — تحليل image
mmls disk.img                                   # partitions
fls -r -m C: -o 2048 disk.img > body.txt        # body file
mactime -d -b body.txt 2026-04-25 > timeline.csv

# Plaso (log2timeline) — الأقوى للـ super-timeline
log2timeline.py timeline.plaso /mnt/evidence
psort.py -o l2tcsv timeline.plaso > super.csv

# أو Eric Zimmerman's Tools (سريعة جداً)
MFTECmd.exe -f $MFT --csv .
KAPE.exe --tsource C: --tdest C:\\triage --target KapeTriage`}</Code>
          </Section>

          <Section title="Prefetch — ما الذي شُغّل و متى">
            <p>Windows ينشئ ملف <span className="eng">.pf</span> في <span className="eng">C:\Windows\Prefetch</span> لأول 128 برنامج. يحتوي:</p>
            <ul>
              <li>اسم البرنامج + hash من path الكامل (يكشف لو نُسخ من مسار غريب).</li>
              <li>آخر 8 مرات تنفيذ (timestamps).</li>
              <li>قائمة DLLs و ملفات قرأها.</li>
              <li>عدد التنفيذات الكلي.</li>
            </ul>
            <Code lang="powershell">{`# تحليل Prefetch
PECmd.exe -d C:\\Windows\\Prefetch --csv .

# بحث: ملفات شُغّلت من %TEMP% (مؤشّر مشبوه)
Import-Csv .\\PECmd_Output.csv | Where-Object { $_.ExecutablePath -match 'TEMP|AppData' }`}</Code>
            <Callout kind="info" title="ملاحظة">
              Prefetch معطّل افتراضياً على Windows Server. على workstations نشط.
            </Callout>
          </Section>

          <Section title="فرز سريع باستخدام KAPE و Velociraptor">
            <p>في حادث live: لا تنسخ كل القرص (300GB). انسخ فقط ما يهمّ — ~3GB من artifacts.</p>
            <Code lang="bash">{`# KAPE — جمع artifacts فقط
KAPE.exe --tsource C: --tdest C:\\triage --target !BasicCollection --vhdx triage

# ثم تشغيل modules للتحليل
KAPE.exe --msource C:\\triage --mdest C:\\out --module !EZParser

# Velociraptor — جمع عن بعد لـ thousands of hosts
velociraptor.exe artifact collect Windows.KapeFiles.Targets \\
  --args Device=C: --args _Triage=Y`}</Code>
          </Section>

          <Section title="Memory Forensics — الذاكرة لا تكذب">
            <Code lang="bash">{`# جمع الذاكرة (live)
winpmem.exe -o memory.raw

# أو DumpIt.exe (single click)

# تحليل بـ Volatility 3
vol -f memory.raw windows.pslist
vol -f memory.raw windows.netscan
vol -f memory.raw windows.malfind            # injected code
vol -f memory.raw windows.cmdline
vol -f memory.raw windows.dlllist --pid 1234
vol -f memory.raw windows.hashdump           # SAM hashes
vol -f memory.raw windows.lsadump            # secrets cached`}</Code>
            <Callout kind="info" title="ترتيب التطايُر (Order of Volatility)">
              CPU regs → cache → RAM → network state → disk → logs offsite. اجمع بهذا الترتيب — لا تطفئ الجهاز قبل الـ memory!
            </Callout>
          </Section>

          <Section title="Anti-forensics و كيف تغلبه">
            <ul>
              <li><b>Timestomping</b> — يغيّر MFT $STANDARD_INFORMATION لكن غالباً ينسى $FILE_NAME. قارنهما.</li>
              <li><b>Log clearing</b> — Event ID 1102 يُسجّل عند مسح Security log. أيضاً افحص USN Journal لـ <span className="eng">.evtx</span> deletes.</li>
              <li><b>Alternate Data Streams</b> — <span className="eng">file.txt:hidden.exe</span>. اكتشفها بـ <span className="eng">dir /R</span> أو <span className="eng">streams.exe</span>.</li>
              <li><b>WMI persistence</b> — لا يظهر في autoruns عادية. استخدم <span className="eng">Get-WmiObject -Namespace root\\subscription -Class __EventFilter</span>.</li>
              <li><b>Wiping with cipher /w</b> — يكتب صفر/واحد على free space. يبقى MFT records و metadata.</li>
            </ul>
          </Section>

          <Section title="منهجية أول 60 دقيقة">
            <Callout kind="good" title="Triage playbook">
              <ol>
                <li>Memory dump أولاً (قبل أي تغيير).</li>
                <li>KAPE Triage على القرص.</li>
                <li>Sysmon + Security + System logs (آخر 30 يوماً).</li>
                <li>Autoruns full scan (<span className="eng">autorunsc.exe -accepteula -a * -h -s -m -nobanner -c</span>).</li>
                <li>Run keys, Services, Scheduled Tasks، WMI subscriptions.</li>
                <li>Process tree الحالي + network connections.</li>
                <li>Recent file modifications (last 24h).</li>
              </ol>
            </Callout>
            <Callout kind="info" title="أدوات أساسية">
              KAPE, Velociraptor, Eric Zimmerman tools (MFTECmd, PECmd, RECmd, EvtxECmd, AmcacheParser), Volatility 3, Plaso, Hayabusa (sigma لـ EVTX), Chainsaw.
            </Callout>
          </Section>
        </>}
        en={<>
          <Section title="The art of reading Windows — the data is talking">
            <p>Every process, logon, network connection, file open — leaves a trace in a known place. The difference between an experienced investigator and a novice isn't tools — it's <b>where they look and in what order</b>. Windows has ~40 artifact sources; six of them cover 80% of cases.</p>
            <Analogy>Windows is a house with thousands of meters. The main meter shows total usage — but if the kitchen sub-meter spikes at 3 AM, you know who was awake and what they were doing.</Analogy>
          </Section>

          <Section title="The map — where to look for what">
            <TwoCol>
              <Card title="Who logged in?" color="blue">
                Security Event Log: <span className="eng">4624</span> (logon), <span className="eng">4625</span> (failed), <span className="eng">4634</span> (logoff), <span className="eng">4672</span> (special privileges).
              </Card>
              <Card title="What ran?" color="red">
                Sysmon Event 1, Security 4688 (process creation), Prefetch (<span className="eng">C:\Windows\Prefetch</span>), Amcache, ShimCache.
              </Card>
              <Card title="Was a service installed?" color="amber">
                System log: <span className="eng">7045</span> (service installed), <span className="eng">7036</span> (start/stop). Sysmon Event 6 (driver loaded).
              </Card>
              <Card title="Was PowerShell run?" color="red">
                Microsoft-Windows-PowerShell/Operational: <span className="eng">4103/4104</span> (script block, command), <span className="eng">600/400</span> in legacy logs.
              </Card>
              <Card title="Was a network connection made?" color="amber">
                Sysmon Event 3. Without it: NetFlow / Zeek / firewall logs.
              </Card>
              <Card title="Was a file modified?" color="green">
                MFT (<span className="eng">$MFT</span>) — every NTFS file. USN Journal (<span className="eng">$UsnJrnl</span>) for change sequence.
              </Card>
            </TwoCol>
          </Section>

          <Section title="Sysmon — the free EDR every host should run">
            <p>Sysinternals Sysmon adds &gt;20 event types Windows doesn't log by default. With a good config (SwiftOnSecurity or Olaf Hartong) it outperforms many commercial EDRs for detection.</p>
            <Code lang="bash">{`# Install
sysmon64.exe -accepteula -i sysmonconfig.xml

# Reconfigure live
sysmon64.exe -c sysmonconfig.xml

# Uninstall
sysmon64.exe -u`}</Code>
            <p>Key Event IDs:</p>
            <ul>
              <li><b>1</b> Process Create — with CommandLine, ParentImage, Hashes (MD5/SHA256/IMPHASH).</li>
              <li><b>3</b> Network Connection — with originating process.</li>
              <li><b>7</b> Image Loaded — loaded DLLs (DLL hijacking signal).</li>
              <li><b>8</b> CreateRemoteThread — process injection signal.</li>
              <li><b>10</b> ProcessAccess — who handle-opened LSASS? (Mimikatz).</li>
              <li><b>11</b> FileCreate — file writes.</li>
              <li><b>12/13/14</b> Registry create/set/rename.</li>
              <li><b>22</b> DNS Query — with process.</li>
              <li><b>25</b> ProcessTampering — Process Hollowing / Doppelganging.</li>
            </ul>
            <Callout kind="info" title="Ready-made configs">
              Start with <span className="eng">github.com/SwiftOnSecurity/sysmon-config</span>, then layer <span className="eng">github.com/olafhartong/sysmon-modular</span> for modular tweaks.
            </Callout>
          </Section>

          <Section title="Event Log analysis — critical queries">
            <h3>Lateral movement via RDP / SMB</h3>
            <Code lang="powershell">{`# 4624 Logon Type 3 (Network) or 10 (RDP) from non-internal IP
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624} -MaxEvents 1000 |
  Where-Object { $_.Properties[8].Value -in 3,10 -and $_.Properties[18].Value -notmatch '^10\\.' } |
  Select-Object TimeCreated, @{n='User';e={$_.Properties[5].Value}}, @{n='SrcIP';e={$_.Properties[18].Value}}`}</Code>

            <h3>New service install (persistence indicator)</h3>
            <Code lang="powershell">{`Get-WinEvent -FilterHashtable @{LogName='System'; Id=7045} -MaxEvents 50 |
  Format-Table TimeCreated,
    @{n='Service';e={$_.Properties[0].Value}},
    @{n='Path';e={$_.Properties[1].Value}},
    @{n='StartType';e={$_.Properties[3].Value}}`}</Code>

            <h3>PowerShell scriptblock logging</h3>
            <Code lang="kql">{`// Microsoft Sentinel KQL
Event
| where Source == "Microsoft-Windows-PowerShell" and EventID == 4104
| extend ScriptBlock = tostring(EventData["ScriptBlockText"])
| where ScriptBlock matches regex @"(?i)Invoke-Mimikatz|Invoke-Expression|DownloadString|FromBase64String"
| project TimeGenerated, Computer, ScriptBlock`}</Code>
          </Section>

          <Section title="Registry — persistence's hideout">
            <p>Most-examined hives: <span className="eng">SYSTEM, SOFTWARE, NTUSER.DAT, UsrClass.dat</span>.</p>
            <TwoCol>
              <Card title="Run Keys" color="red">
                <span className="eng">HKLM\Software\Microsoft\Windows\CurrentVersion\Run</span><br />
                <span className="eng">HKCU\Software\Microsoft\Windows\CurrentVersion\Run</span><br />
                + <span className="eng">RunOnce, RunOnceEx, RunServices</span>.
              </Card>
              <Card title="Services" color="red">
                <span className="eng">HKLM\System\CurrentControlSet\Services</span> — service binPath each.
              </Card>
              <Card title="UserAssist" color="amber">
                <span className="eng">HKCU\...\UserAssist</span> — programs the user ran (ROT13).
              </Card>
              <Card title="ShimCache (AppCompat)" color="amber">
                <span className="eng">HKLM\System\CurrentControlSet\Control\Session Manager\AppCompatCache</span> — file names that ran or were checked (last 1024).
              </Card>
              <Card title="Amcache" color="amber">
                <span className="eng">C:\Windows\AppCompat\Programs\Amcache.hve</span> — richer: SHA1, publisher, last modified.
              </Card>
              <Card title="Unusual ASEPs" color="red">
                AppInit_DLLs, Image File Execution Options (IFEO), Winlogon Shell, COM hijacking, WMI subscriptions.
              </Card>
            </TwoCol>
          </Section>

          <Section title="MFT & timelines — order solves the case">
            <p>Every NTFS file owns an MFT record (1024 bytes) with: created, modified, accessed, MFT-modified — 4 timestamps × 2 attributes = 8 in total. Lets you spot <b>timestomping</b> (Mimikatz, Cobalt Strike).</p>
            <Code lang="bash">{`# On Linux — image analysis
mmls disk.img                                   # partitions
fls -r -m C: -o 2048 disk.img > body.txt        # body file
mactime -d -b body.txt 2026-04-25 > timeline.csv

# Plaso (log2timeline) — strongest super-timeline
log2timeline.py timeline.plaso /mnt/evidence
psort.py -o l2tcsv timeline.plaso > super.csv

# Or Eric Zimmerman's tools (very fast)
MFTECmd.exe -f $MFT --csv .
KAPE.exe --tsource C: --tdest C:\\triage --target KapeTriage`}</Code>
          </Section>

          <Section title="Prefetch — what ran, when">
            <p>Windows writes <span className="eng">.pf</span> files in <span className="eng">C:\Windows\Prefetch</span> for the first 128 programs. Contains:</p>
            <ul>
              <li>Program name + hash of full path (reveals if copied from an unusual location).</li>
              <li>Last 8 execution timestamps.</li>
              <li>List of DLLs and files it touched.</li>
              <li>Total run count.</li>
            </ul>
            <Code lang="powershell">{`# Parse Prefetch
PECmd.exe -d C:\\Windows\\Prefetch --csv .

# Hunt: programs that ran from %TEMP% (suspicious)
Import-Csv .\\PECmd_Output.csv | Where-Object { $_.ExecutablePath -match 'TEMP|AppData' }`}</Code>
            <Callout kind="info" title="Note">
              Prefetch is disabled by default on Windows Server, enabled on workstations.
            </Callout>
          </Section>

          <Section title="Fast triage with KAPE & Velociraptor">
            <p>In a live incident: don't image the whole 300GB disk. Pull only what matters — ~3GB of artifacts.</p>
            <Code lang="bash">{`# KAPE — collect artifacts only
KAPE.exe --tsource C: --tdest C:\\triage --target !BasicCollection --vhdx triage

# Then run modules to parse
KAPE.exe --msource C:\\triage --mdest C:\\out --module !EZParser

# Velociraptor — remote collect across thousands of hosts
velociraptor.exe artifact collect Windows.KapeFiles.Targets \\
  --args Device=C: --args _Triage=Y`}</Code>
          </Section>

          <Section title="Memory forensics — RAM doesn't lie">
            <Code lang="bash">{`# Live capture
winpmem.exe -o memory.raw

# Or DumpIt.exe (single click)

# Analyze with Volatility 3
vol -f memory.raw windows.pslist
vol -f memory.raw windows.netscan
vol -f memory.raw windows.malfind            # injected code
vol -f memory.raw windows.cmdline
vol -f memory.raw windows.dlllist --pid 1234
vol -f memory.raw windows.hashdump           # SAM hashes
vol -f memory.raw windows.lsadump            # cached secrets`}</Code>
            <Callout kind="info" title="Order of volatility">
              CPU regs → cache → RAM → network state → disk → off-site logs. Collect in this order — never power off before memory!
            </Callout>
          </Section>

          <Section title="Anti-forensics — and how to beat it">
            <ul>
              <li><b>Timestomping</b> — alters MFT $STANDARD_INFORMATION but usually misses $FILE_NAME. Compare the two.</li>
              <li><b>Log clearing</b> — Event ID 1102 fires on Security log clear. Also check USN Journal for <span className="eng">.evtx</span> deletes.</li>
              <li><b>Alternate Data Streams</b> — <span className="eng">file.txt:hidden.exe</span>. Find with <span className="eng">dir /R</span> or <span className="eng">streams.exe</span>.</li>
              <li><b>WMI persistence</b> — invisible to plain autoruns. Use <span className="eng">Get-WmiObject -Namespace root\\subscription -Class __EventFilter</span>.</li>
              <li><b>Wiping with cipher /w</b> — overwrites free space. MFT records and metadata still survive.</li>
            </ul>
          </Section>

          <Section title="First 60 minutes methodology">
            <Callout kind="good" title="Triage playbook">
              <ol>
                <li>Memory dump first (before any change).</li>
                <li>KAPE triage of the disk.</li>
                <li>Sysmon + Security + System logs (last 30 days).</li>
                <li>Full Autoruns scan (<span className="eng">autorunsc.exe -accepteula -a * -h -s -m -nobanner -c</span>).</li>
                <li>Run keys, Services, Scheduled Tasks, WMI subscriptions.</li>
                <li>Live process tree + network connections.</li>
                <li>Files modified in the last 24h.</li>
              </ol>
            </Callout>
            <Callout kind="info" title="Essential toolkit">
              KAPE, Velociraptor, Eric Zimmerman tools (MFTECmd, PECmd, RECmd, EvtxECmd, AmcacheParser), Volatility 3, Plaso, Hayabusa (Sigma for EVTX), Chainsaw.
            </Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
