"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="linux-fundamentals">
      <L
        ar={<>
          <Section title="ليه Linux الأول قبل أي حاجة؟">
            <p>كل أداة هجومية ودفاعية مهمة بتشتغل على Linux. Kali، Parrot، سيرفرات الإنترنت، معظم ICS، الـ containers، وحتى Android تحته Linux. ما تقدرش تبقى محترف أمن من غير ما تبقى مرتاح في الـ command line.</p>
            <Callout kind="info" title="الهدف من الدرس">
              بعد ما تخلّصه هتفهم: الـ filesystem، الصلاحيات، العمليات، الشبكة، والأوامر اللي هتكتبها كل يوم في أي pentest.
            </Callout>
          </Section>

          <Section title="نظام الملفات — الخريطة">
            <Code lang="text">{`/           ← الجذر
├── bin/    ← أوامر أساسية للجميع (ls, cp, mv)
├── sbin/   ← أوامر للـ root (fdisk, iptables)
├── etc/    ← ملفات الإعدادات (passwd, shadow, hosts)
├── home/   ← مجلدات المستخدمين
├── root/   ← مجلد المستخدم root
├── var/    ← متغير: logs, mail, web (/var/www)
├── tmp/    ← مؤقت — يُمسح عند إعادة التشغيل
├── usr/    ← برامج المستخدم (usr/local/bin)
├── proc/   ← افتراضي — معلومات العمليات والنواة
├── sys/    ← افتراضي — أجهزة وkernel
└── opt/    ← برامج طرف ثالث`}</Code>
            <p>المهم في الأمن: <span className="eng">/etc/passwd, /etc/shadow, /etc/sudoers, /var/log/, /home/*/.ssh/, /proc/*/environ</span>.</p>
          </Section>

          <Section title="أوامر التنقل والملفات">
            <Terminal lines={[
              { p: "pwd                      # المسار الحالي" },
              { p: "ls -la                   # كل الملفات (حتى المخفية) مع التفاصيل" },
              { p: "cd /var/log              # ذهاب" },
              { p: "find / -name 'config*' 2>/dev/null    # ابحث في كامل النظام" },
              { p: "grep -r 'password' /etc/ 2>/dev/null  # ابحث عن نص" },
              { p: "cat /etc/passwd          # اعرض ملف" },
              { p: "less /var/log/syslog     # تصفّح ملف كبير (q للخروج)" },
              { p: "head -20 file            # أول 20 سطر" },
              { p: "tail -f /var/log/auth.log    # تابع ملف لحظياً" },
            ]} />
          </Section>

          <Section title="الصلاحيات — أهم مفهوم تفهمه">
            <p>كل ملف ليه تلات مجموعات صلاحيات: المالك، الجروب، باقي الناس. وكل مجموعة ليها تلات حروف: <span className="eng">r</span> قراءة، <span className="eng">w</span> كتابة، <span className="eng">x</span> تنفيذ. بسيطة لما تستوعبها، خطيرة لما تتجاهلها.</p>
            <Code lang="text">{`-rwxr-xr--  1 alice  staff  120 Apr 30 10:15 script.sh
 │└┬┘└┬┘└┬┘
 │ │  │  └── الجميع: قراءة فقط
 │ │  └───── المجموعة: قراءة + تنفيذ
 │ └──────── المالك: كل شيء
 └────────── - = ملف عادي ('d' = مجلد، 'l' = symlink)`}</Code>
            <Terminal lines={[
              { p: "chmod 755 file        # rwxr-xr-x — الأكثر شيوعاً للسكربتات" },
              { p: "chmod +x script.sh    # أضف تنفيذ" },
              { p: "chown alice:staff f   # غيّر المالك والمجموعة" },
              { p: "" },
              { p: "# في الأمن: ابحث عن SUID — ملفات تعمل بصلاحيات مالكها:" },
              { p: "find / -perm -4000 -type f 2>/dev/null" },
              { p: "# هذه قائمة هامة جداً لـ privilege escalation — راجع GTFOBins" },
            ]} />
          </Section>

          <Section title="المستخدمون والـ root">
            <ul>
              <li><span className="eng">/etc/passwd</span> — قائمة المستخدمين (مقروء للجميع).</li>
              <li><span className="eng">/etc/shadow</span> — كلمات السر مهشّمة (root فقط).</li>
              <li><span className="eng">/etc/sudoers</span> — من يحق له <span className="eng">sudo</span>.</li>
            </ul>
            <Terminal lines={[
              { p: "id                  # هويتي و مجموعاتي" },
              { p: "whoami              # اسم المستخدم" },
              { p: "sudo -l             # أوامر مسموحة لي بـ sudo (مهم للـ priv esc)" },
              { p: "su -                # تحول لـ root" },
              { p: "passwd              # غيّر كلمة سرك" },
            ]} />
          </Section>

          <Section title="العمليات">
            <Terminal lines={[
              { p: "ps aux              # كل العمليات" },
              { p: "ps -ef --forest     # عرض شجري" },
              { p: "top                 # حي + متفاعل (q للخروج)" },
              { p: "htop                # أجمل من top" },
              { p: "kill -9 1234        # اقتل عملية بـ PID 1234" },
              { p: "pgrep nginx         # ابحث عن PID لاسم" },
              { p: "" },
              { p: "# ابحث عن أوامر مشبوهة في الذاكرة:" },
              { p: "ps aux | grep -E 'nc|wget|curl|python -c'" },
            ]} />
          </Section>

          <Section title="الشبكة — أوامر يومية">
            <Terminal lines={[
              { p: "ip a                 # كل الواجهات و IPs" },
              { p: "ip r                 # جدول التوجيه (gateway افتراضي)" },
              { p: "ss -tulpn            # كل المنافذ المفتوحة + العملية المالكة (بديل netstat)" },
              { p: "curl -I https://example.com    # رؤوس HTTP فقط" },
              { p: "dig example.com      # استعلام DNS" },
              { p: "nslookup example.com" },
              { p: "tcpdump -i eth0 -nn port 80    # التقط حزم port 80" },
              { p: "traceroute 8.8.8.8   # مسار الحزم" },
            ]} />
          </Section>

          <Section title="إعادة التوجيه والـ pipes">
            <Terminal lines={[
              { p: "command > out.txt           # أعد STDOUT إلى ملف (يكتب فوقه)" },
              { p: "command >> out.txt          # أضف للملف" },
              { p: "command 2> err.txt          # STDERR منفصل" },
              { p: "command > out.txt 2>&1      # كل شيء لملف واحد" },
              { p: "command1 | command2         # اربط — مخرج الأول يصبح مدخل الثاني" },
              { p: "" },
              { p: "# مثال أمني — ابحث عن IPs غير ناجحة في log:" },
              { p: "grep 'Failed password' /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head" },
            ]} />
          </Section>

          <Section title="أوامر مفيدة جداً للأمن">
            <Code lang="bash">{`# تجميع info كامل عن مستخدم:
id alice && groups alice && lastlog -u alice

# اعرض كل cron jobs على النظام:
for u in $(cut -f1 -d: /etc/passwd); do crontab -u $u -l 2>/dev/null; done

# ابحث عن ملفات حديثة التعديل (ربما تركها مهاجم):
find /tmp /var/tmp /dev/shm -type f -mmin -60 2>/dev/null

# اعرض حزم منصبة (للبحث عن أداة قديمة بثغرة):
dpkg -l | grep -i openssh    # Debian/Ubuntu
rpm -qa | grep -i openssh    # RHEL/CentOS

# تشيك تكامل ملف:
sha256sum important.bin

# تشفير سريع:
echo "hello" | base64
echo "aGVsbG8K" | base64 -d`}</Code>
          </Section>

          <Section title="أهم ملفات تنظر إليها كمدافع/مهاجم">
            <TwoCol>
              <Card title="ملفات اعتماد ومفاتيح" color="red">
                <span className="eng">~/.ssh/, ~/.aws/credentials, ~/.docker/config.json, /var/lib/jenkins/secrets/</span>
              </Card>
              <Card title="سجلات" color="blue">
                <span className="eng">/var/log/auth.log, /var/log/syslog, /var/log/audit/audit.log, ~/.bash_history</span>
              </Card>
              <Card title="إعدادات حساسة" color="amber">
                <span className="eng">/etc/sudoers, /etc/ssh/sshd_config, /etc/passwd, /etc/shadow, /etc/cron.d/</span>
              </Card>
              <Card title="البقاء (Persistence)" color="red">
                <span className="eng">~/.bashrc, ~/.profile, /etc/rc.local, systemd units, cron, at jobs</span>
              </Card>
            </TwoCol>
          </Section>

          <Section title="ممارسة">
            <ol>
              <li>ادخل لـ Kali VM، نفّذ كل أوامر هذا الدرس.</li>
              <li>أنشئ مستخدمين، اضبط صلاحيات ملفات، اقرأ <span className="eng">/etc/shadow</span> كـ root و كـ مستخدم عادي — افهم الفرق.</li>
              <li>ابحث عن SUID binaries على Kali، قارن بـ <span className="eng">gtfobins.github.io</span>.</li>
              <li>اقرأ <span className="eng">man bash</span> — لو مرة واحدة.</li>
            </ol>
          </Section>
        </>}
        en={<>
          <Section title="Why Linux first">
            <p>Every important offensive and defensive tool runs on Linux. Kali, Parrot, internet servers, much of ICS, containers, Android underneath everything. You cannot be a security professional without fluency in the Linux command line.</p>
            <Callout kind="info" title="Goal">
              By the end you&apos;ll understand the filesystem, permissions, processes, networking, and the daily commands you&apos;ll use in any pentest.
            </Callout>
          </Section>

          <Section title="The filesystem — the map">
            <Code lang="text">{`/           ← root
├── bin/    ← essential commands (ls, cp, mv)
├── sbin/   ← root-only commands (fdisk, iptables)
├── etc/    ← configuration (passwd, shadow, hosts)
├── home/   ← user home dirs
├── root/   ← root user's home
├── var/    ← variable: logs, mail, web (/var/www)
├── tmp/    ← temporary — wiped on reboot
├── usr/    ← user programs (usr/local/bin)
├── proc/   ← virtual — process and kernel info
├── sys/    ← virtual — devices and kernel
└── opt/    ← third-party software`}</Code>
            <p>Security-relevant: <span className="eng">/etc/passwd, /etc/shadow, /etc/sudoers, /var/log/, /home/*/.ssh/, /proc/*/environ</span>.</p>
          </Section>

          <Section title="Navigation and files">
            <Terminal lines={[
              { p: "pwd                      # current path" },
              { p: "ls -la                   # all files (incl. hidden) with details" },
              { p: "cd /var/log              # change directory" },
              { p: "find / -name 'config*' 2>/dev/null    # search the whole tree" },
              { p: "grep -r 'password' /etc/ 2>/dev/null  # text search" },
              { p: "cat /etc/passwd          # show file" },
              { p: "less /var/log/syslog     # paginate large files (q to quit)" },
              { p: "head -20 file            # first 20 lines" },
              { p: "tail -f /var/log/auth.log    # follow file live" },
            ]} />
          </Section>

          <Section title="Permissions — the most important concept">
            <p>Every file has three permission groups: owner, group, other. Each group has three flags: <span className="eng">r</span> read, <span className="eng">w</span> write, <span className="eng">x</span> execute.</p>
            <Code lang="text">{`-rwxr-xr--  1 alice  staff  120 Apr 30 10:15 script.sh
 │└┬┘└┬┘└┬┘
 │ │  │  └── other: read only
 │ │  └───── group: read + execute
 │ └──────── owner: everything
 └────────── - = regular file ('d' = dir, 'l' = symlink)`}</Code>
            <Terminal lines={[
              { p: "chmod 755 file        # rwxr-xr-x — most common for scripts" },
              { p: "chmod +x script.sh    # add execute" },
              { p: "chown alice:staff f   # change owner and group" },
              { p: "" },
              { p: "# Security: hunt SUID — files that run with the owner's perms:" },
              { p: "find / -perm -4000 -type f 2>/dev/null" },
              { p: "# This is a critical privilege-escalation list — see GTFOBins" },
            ]} />
          </Section>

          <Section title="Users and root">
            <ul>
              <li><span className="eng">/etc/passwd</span> — user list (world-readable).</li>
              <li><span className="eng">/etc/shadow</span> — hashed passwords (root only).</li>
              <li><span className="eng">/etc/sudoers</span> — who can <span className="eng">sudo</span>.</li>
            </ul>
            <Terminal lines={[
              { p: "id                  # my identity and groups" },
              { p: "whoami              # username" },
              { p: "sudo -l             # what I can sudo (key for priv esc)" },
              { p: "su -                # become root" },
              { p: "passwd              # change my password" },
            ]} />
          </Section>

          <Section title="Processes">
            <Terminal lines={[
              { p: "ps aux              # all processes" },
              { p: "ps -ef --forest     # tree view" },
              { p: "top                 # live + interactive (q to quit)" },
              { p: "htop                # nicer top" },
              { p: "kill -9 1234        # kill PID 1234" },
              { p: "pgrep nginx         # find PID by name" },
              { p: "" },
              { p: "# hunt for suspicious commands in memory:" },
              { p: "ps aux | grep -E 'nc|wget|curl|python -c'" },
            ]} />
          </Section>

          <Section title="Networking — daily commands">
            <Terminal lines={[
              { p: "ip a                 # interfaces and IPs" },
              { p: "ip r                 # routing table (default gateway)" },
              { p: "ss -tulpn            # open ports + owning process (replaces netstat)" },
              { p: "curl -I https://example.com    # HTTP headers only" },
              { p: "dig example.com      # DNS query" },
              { p: "nslookup example.com" },
              { p: "tcpdump -i eth0 -nn port 80    # capture port-80 packets" },
              { p: "traceroute 8.8.8.8   # packet path" },
            ]} />
          </Section>

          <Section title="Redirection and pipes">
            <Terminal lines={[
              { p: "command > out.txt           # STDOUT to file (overwrite)" },
              { p: "command >> out.txt          # append" },
              { p: "command 2> err.txt          # STDERR separate" },
              { p: "command > out.txt 2>&1      # both to one file" },
              { p: "command1 | command2         # pipe — output of first feeds second" },
              { p: "" },
              { p: "# security example — top failed-login source IPs:" },
              { p: "grep 'Failed password' /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head" },
            ]} />
          </Section>

          <Section title="Useful security commands">
            <Code lang="bash">{`# full info on a user:
id alice && groups alice && lastlog -u alice

# every cron job on the system:
for u in $(cut -f1 -d: /etc/passwd); do crontab -u $u -l 2>/dev/null; done

# recently modified files (an attacker might have left them):
find /tmp /var/tmp /dev/shm -type f -mmin -60 2>/dev/null

# installed packages (look for vulnerable older tools):
dpkg -l | grep -i openssh    # Debian/Ubuntu
rpm -qa | grep -i openssh    # RHEL/CentOS

# integrity check:
sha256sum important.bin

# quick encoding:
echo "hello" | base64
echo "aGVsbG8K" | base64 -d`}</Code>
          </Section>

          <Section title="Files you watch as defender / attacker">
            <TwoCol>
              <Card title="Credentials and keys" color="red">
                <span className="eng">~/.ssh/, ~/.aws/credentials, ~/.docker/config.json, /var/lib/jenkins/secrets/</span>
              </Card>
              <Card title="Logs" color="blue">
                <span className="eng">/var/log/auth.log, /var/log/syslog, /var/log/audit/audit.log, ~/.bash_history</span>
              </Card>
              <Card title="Sensitive config" color="amber">
                <span className="eng">/etc/sudoers, /etc/ssh/sshd_config, /etc/passwd, /etc/shadow, /etc/cron.d/</span>
              </Card>
              <Card title="Persistence" color="red">
                <span className="eng">~/.bashrc, ~/.profile, /etc/rc.local, systemd units, cron, at jobs</span>
              </Card>
            </TwoCol>
          </Section>

          <Section title="Practice">
            <ol>
              <li>Boot Kali VM and run every command in this lesson.</li>
              <li>Create users, set permissions on files, read <span className="eng">/etc/shadow</span> as root and as a normal user — feel the difference.</li>
              <li>Find SUID binaries on Kali and check them against <span className="eng">gtfobins.github.io</span>.</li>
              <li>Skim <span className="eng">man bash</span> at least once.</li>
            </ol>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
