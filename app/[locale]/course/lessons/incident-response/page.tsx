"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="incident-response">
      <L
        ar={<>
          <Section title="حصل اختراق — تعمل إيه؟ — NIST IR Lifecycle">
            <Analogy>
              التليفون رنّ الساعة 3 الفجر. الـ SOC بيقولك &quot;فيه حاجة بتحصل&quot;.
            </Analogy>
            <p>- طب يا حضرتك.. أعمل reboot للسيرفر بسرعة؟ أقفل الإنترنت كله؟ أصحّى المدير؟</p>
            <p>يا مستجد.. كنت مستنيك تقول ده. متوقّع.</p>
            <p>كل واحدة من اللي قلتهم هتحرقلك أدلة ما تتعوّضش. الـ IR هو خطة الإطفاء اللي اتكتبت <b>قبل</b> ما الحريق يبتدي — عشان وقت الحريق مفيش مجال تفكّر.</p>
            <p>هو إحنا بنعمل ست مراحل ليه؟ علشان كل مرحلة قرار مختلف. اللي بيخلط بين &quot;افهم&quot; و&quot;اتصرف&quot; بيخرب القضية بإيده.</p>
            <p>الفرق بين فريق محترم وفريق &quot;بيعك&quot; مش في الأدوات. الفرق في إنه عارف يقف 3 ثواني قبل ما يلمس حاجة.</p>
            <ol>
              <li><b>Preparation</b> — جهّز قبل الكارثة، مش وقتها.</li>
              <li><b>Detection &amp; Analysis</b> — أكّد إن فيه حادثة فعلاً، وحدد نطاقها.</li>
              <li><b>Containment</b> — احتواء قصير الأجل، وبعدين طويل.</li>
              <li><b>Eradication</b> — اقلع الجذور، مش بس قص الورق.</li>
              <li><b>Recovery</b> — رجّع الخدمة وانت واثق.</li>
              <li><b>Lessons Learned</b> — تمنع التكرار، مش تلوم حد.</li>
            </ol>
            <Callout kind="danger" title="غلطات الـ junior في أول 10 دقائق">
              <ul>
                <li>عمل reboot &quot;عشان يجرب&quot; → الذاكرة راحت، الـ malware اللي كان fileless ضاع، والـ C2 connections قُفلت. مبروك، حرقت القضية.</li>
                <li>شغّل antivirus scan &quot;ينضّف الجهاز&quot; → الـ AV مسح العيّنة قبل ما حد ياخد منها نسخة للتحليل.</li>
                <li>قطع الكابل من الـ switch → المهاجم حسّ، فعّل الـ ransomware كـ kill-switch، وانت كنت ممكن تراقبه ساعتين كمان.</li>
                <li>قعد يكتب في group chat &quot;فيه اختراق ولا إيه؟&quot; → لو الـ chat نفسه مخترق، انت بتديله live updates مجاناً.</li>
              </ul>
            </Callout>
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
            <p>الفرق بين containment محترم وcontainment عبيط: التوقيت. لو قطعت بدري، حرقت العملية. لو قطعت متأخر، خسرت بيانات. القرار ده هيبة المنصب لمدير الـ IR — مش هندسي.</p>
            <TwoCol>
              <Card title="قصير المدى (دقائق)" color="amber">عزل الجهاز عن الشبكة (EDR isolate)، تعطيل الحساب، إبطال tokens / sessions، حظر IOCs.</Card>
              <Card title="طويل المدى (أيام)" color="blue">إعادة بناء الأنظمة من image نظيفة، تدوير كل الأسرار، تعديل القواعد لمنع الوصول الأولي مجدداً.</Card>
            </TwoCol>
            <Callout kind="warn" title="ما تحرقش العملية">
              لو قطعت كل حاجة فجأة، المهاجم هيحس. هيعمل إيه؟ هيفعّل الـ ransomware كـ kill-switch، أو يمسح كل آثاره، أو يقفز لـ host تاني انت لسه ما اكتشفتوش.
              أحياناً المراقبة الصامتة لساعات علشان تجمع TTPs أحكم بكتير من الانقضاض السريع. APT29 في SolarWinds قعدوا 9 شهور جوه — اللي اكتشفهم كان فريق فهم إن &quot;اقطع كل حاجة دلوقتي&quot; مش الحل.
            </Callout>
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
              <li>Root cause + الفجوات اللي سمحت بالهجوم.</li>
              <li>قائمة إجراءات وقائية مع مالك وموعد لكل بند.</li>
              <li>تحديث الـ playbooks وقواعد الكشف.</li>
            </ul>
            <Callout kind="info" title="اكتبها على ظهر إيدك">
              ما تلومش الناس، لُم العملية. الفريق لازم يحس إنه آمن علشان يبلّغ بدري عن غلطاته.
              اللوم بيخلّي الناس تخبّي.
              واللي بتخبّيه النهارده هيطلعلك Incident أكبر بعد 6 شهور.
              بُص: انت كده كده هتغلط في شغلك، سواء قاصد أو غصب عنك. أهم حاجة: تتعلم وتبقى عارف إنه غلط.
            </Callout>
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
