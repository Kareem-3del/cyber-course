"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="incident-response">
      <L
        ar={<>
          <Section title="ماذا تفعل عند الحادثة؟ — NIST IR Lifecycle">
            <Analogy>مثل حريق في مبنى: لا تفعل أشياء عشوائية. هناك خطوات ثابتة و من ينفذها بهدوء يخسر أقل. الـ IR هو خطة الإطفاء قبل أن يبدأ الحريق.</Analogy>
            <ol>
              <li><b>Preparation</b> — تجهيز الأدوات و الأدوار.</li>
              <li><b>Detection &amp; Analysis</b> — تأكيد الحادثة و تحديد نطاقها.</li>
              <li><b>Containment</b> — احتواء قصير ثم طويل.</li>
              <li><b>Eradication</b> — إزالة الجذور.</li>
              <li><b>Recovery</b> — إعادة الخدمة بثقة.</li>
              <li><b>Lessons Learned</b> — نمنع التكرار.</li>
            </ol>
          </Section>
          <Section title="Preparation — قبل أن يحدث شيء">
            <ul>
              <li>فريق CSIRT معروف الأدوار + قائمة اتصال خارج النطاق.</li>
              <li>Runbooks لكل سيناريو (ransomware, account takeover, data leak).</li>
              <li>صناديق jump kits: لابتوب نظيف، write blockers، FTK Imager.</li>
              <li>اتفاقيات مع جهات خارجية (DFIR retainer, legal, PR).</li>
              <li>تمارين tabletop كل ربع.</li>
            </ul>
          </Section>
          <Section title="Detection & Analysis — تأكيد الحادثة">
            <Step n={1} title="فرز التنبيه — Triage">هل هذا تنبيه حقيقي؟ ما المضيف؟ ما المستخدم؟ ما المؤشرات؟</Step>
            <Step n={2} title="بناء خط زمني — Timeline">استخدم SIEM لجمع كل الأحداث المرتبطة بالـ IP / user / host.</Step>
            <Step n={3} title="جمع الأدلة قبل اللمس">
              <Terminal lines={[
                { p: "# نسخة من الذاكرة قبل أي شيء" },
                { p: "sudo /opt/avml memory.lime    # على Linux" },
                { p: "winpmem.exe memory.raw        # على Windows" },
                { p: "dd if=/dev/sda of=/mnt/usb/disk.img bs=4M status=progress conv=noerror,sync" },
                { p: "kape.exe --target !SANS_Triage  # Windows" },
                { p: "uac -a ir_triage.yaml          # Linux/Mac/AIX" },
              ]} />
            </Step>
          </Section>
          <Section title="Containment — احتواء">
            <TwoCol>
              <Card title="قصير المدى (دقائق)" color="amber">عزل الجهاز عن الشبكة (EDR isolate)، تعطيل الحساب، إبطال tokens / sessions، حظر IOCs.</Card>
              <Card title="طويل المدى (أيام)" color="blue">إعادة بناء الأنظمة من image نظيفة، تدوير كل الأسرار، تعديل القواعد لمنع الوصول الأولي مجدداً.</Card>
            </TwoCol>
            <Callout kind="warn" title="حذار من الـ Burning">إن أوقفت كل شيء فجأة قد يلاحظ المهاجم و يطلق ransomware. أحياناً المراقبة الصامتة لساعات لجمع الـ TTPs أفضل.</Callout>
          </Section>
          <Section title="Forensics — التحليل الجنائي">
            <h3>الذاكرة — Memory</h3>
            <Code lang="volatility3">{`vol -f memory.raw windows.pslist
vol -f memory.raw windows.netscan
vol -f memory.raw windows.malfind
vol -f memory.raw windows.cmdline
vol -f memory.raw windows.dlllist | grep -i suspicious.dll`}</Code>
            <h3>القرص — Disk</h3>
            <ul>
              <li>Autopsy / The Sleuth Kit لاستعراض النظام.</li>
              <li>plaso/log2timeline لبناء خط زمني فائق التفصيل.</li>
              <li>EVTXtract / Chainsaw / Hayabusa لتحليل سجلات Windows.</li>
            </ul>
            <h3>السحابة</h3>
            <ul>
              <li>CloudTrail + Athena لاستعلامات سريعة.</li>
              <li>أداة aws_ir / cloudgrep / Cado.</li>
            </ul>
          </Section>
          <Section title="Eradication & Recovery">
            <ol>
              <li>إعادة بناء الأنظمة من golden image — لا تكتفِ بـ cleanup.</li>
              <li>تدوير كل: كلمات المرور، SSH keys, API tokens, Kerberos krbtgt (مرتين).</li>
              <li>سدّ ثغرة الدخول الأصلية.</li>
              <li>راقب لـ 30-90 يوم لرصد عودة المهاجم.</li>
            </ol>
          </Section>
          <Section title="Lessons Learned — التقرير النهائي">
            <ul>
              <li>خط زمني واضح للهجوم.</li>
              <li>Root cause + الفجوات التي سمحت بالهجوم.</li>
              <li>قائمة إجراءات وقائية مع مالك و موعد لكل بند.</li>
              <li>تحديث الـ playbooks و قواعد الكشف.</li>
            </ul>
            <Callout kind="info" title="نصيحة">لا تَلُم الأشخاص بل العمليات. الفريق يجب أن يحس بالأمان كي يبلّغ مبكراً عن أخطائه.</Callout>
          </Section>
        </>}
        en={<>
          <Section title="What do you do during an incident? NIST IR lifecycle">
            <Analogy>Like a building fire: don't improvise. There's a fixed sequence, and whoever runs it calmly loses the least. IR is the fire plan written before the fire starts.</Analogy>
            <ol>
              <li><b>Preparation</b> — tools and roles ready.</li>
              <li><b>Detection &amp; Analysis</b> — confirm and scope.</li>
              <li><b>Containment</b> — short-term then long-term.</li>
              <li><b>Eradication</b> — remove the root cause.</li>
              <li><b>Recovery</b> — restore service with confidence.</li>
              <li><b>Lessons Learned</b> — prevent recurrence.</li>
            </ol>
          </Section>
          <Section title="Preparation — before anything happens">
            <ul>
              <li>A CSIRT with clear roles + an out-of-band contact list.</li>
              <li>Runbooks per scenario (ransomware, account takeover, data leak).</li>
              <li>Jump kits: a clean laptop, write blockers, FTK Imager.</li>
              <li>Pre-signed agreements with externals (DFIR retainer, legal, PR).</li>
              <li>Quarterly tabletop exercises.</li>
            </ul>
          </Section>
          <Section title="Detection & Analysis — confirm the incident">
            <Step n={1} title="Triage">Is this real? Which host? Which user? What indicators?</Step>
            <Step n={2} title="Build a timeline">Use the SIEM to assemble all events tied to the IP / user / host.</Step>
            <Step n={3} title="Collect evidence before you touch anything">
              <Terminal lines={[
                { p: "# Image memory first, always" },
                { p: "sudo /opt/avml memory.lime    # Linux" },
                { p: "winpmem.exe memory.raw        # Windows" },
                { p: "dd if=/dev/sda of=/mnt/usb/disk.img bs=4M status=progress conv=noerror,sync" },
                { p: "kape.exe --target !SANS_Triage  # Windows" },
                { p: "uac -a ir_triage.yaml          # Linux/Mac/AIX" },
              ]} />
            </Step>
          </Section>
          <Section title="Containment">
            <TwoCol>
              <Card title="Short-term (minutes)" color="amber">Network-isolate the host (EDR isolate), disable the account, revoke tokens/sessions, block IOCs.</Card>
              <Card title="Long-term (days)" color="blue">Rebuild systems from a clean image, rotate every secret, update rules to prevent re-entry.</Card>
            </TwoCol>
            <Callout kind="warn" title="Beware of burning the operation">Cutting everything off suddenly may tip the attacker and trigger ransomware. Sometimes silent monitoring for hours to collect TTPs is wiser.</Callout>
          </Section>
          <Section title="Forensics">
            <h3>Memory</h3>
            <Code lang="volatility3">{`vol -f memory.raw windows.pslist
vol -f memory.raw windows.netscan
vol -f memory.raw windows.malfind
vol -f memory.raw windows.cmdline
vol -f memory.raw windows.dlllist | grep -i suspicious.dll`}</Code>
            <h3>Disk</h3>
            <ul>
              <li>Autopsy / The Sleuth Kit for filesystem review.</li>
              <li>plaso/log2timeline for ultra-detailed timelines.</li>
              <li>EVTXtract / Chainsaw / Hayabusa for Windows event log analysis.</li>
            </ul>
            <h3>Cloud</h3>
            <ul>
              <li>CloudTrail + Athena for fast queries.</li>
              <li>aws_ir / cloudgrep / Cado.</li>
            </ul>
          </Section>
          <Section title="Eradication & Recovery">
            <ol>
              <li>Rebuild from a golden image — don't merely "clean up".</li>
              <li>Rotate everything: passwords, SSH keys, API tokens, Kerberos krbtgt (twice).</li>
              <li>Close the original entry vector.</li>
              <li>Monitor 30–90 days for the attacker's return.</li>
            </ol>
          </Section>
          <Section title="Lessons Learned — the final report">
            <ul>
              <li>A clear attack timeline.</li>
              <li>Root cause + the gaps that allowed the attack.</li>
              <li>List of preventive actions, each with an owner and a deadline.</li>
              <li>Update playbooks and detection rules.</li>
            </ul>
            <Callout kind="info" title="Advice">Blame the process, not the people. The team must feel safe enough to flag their own mistakes early.</Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
