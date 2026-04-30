"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="usb-network-implants">
      <L
        ar={<>
          <Section title="لماذا USB ما زال السلاح الأخطر في 2026">
            <p>الـ <span className="eng">air gap</span> — فصل النظام تماماً عن الإنترنت — هو أعلى مستوى دفاع البنى التحتية الحرجة بتعمله (محطات طاقة، منشآت نووية، شبكات تصنيع). الـ USB هو الجسر الوحيد اللي بيعدّي الفجوة دي. علشان كده من Stuxnet في 2010 لحد عمليات <span className="eng">Volt Typhoon</span> الأخيرة، الـ USB لسه ناقل العدوى رقم 1 للأهداف &quot;المعزولة&quot;. السلاح ده عمره 16 سنة ولسه شغال.</p>
            <Analogy>تخيل الـ air gap حيطة قلعة. الإنترنت بوابة عليها حراسة. الـ USB؟ ده ظرف بريد بيحطه موظف في جيبه ويعدّي الحيطة من غير ما حد يفتشه. علشان كده أي خصم جاد بيستثمر في سؤال واحد: &quot;إزاي ندخل عن طريق جيب موظف؟&quot;</Analogy>
            <Callout kind="danger" title="تحذير قانوني — اقراه قبل ما تكمل">
              إنك توصل USB بنظام مش بتاعك (حتى محطة شحن في مطار) ممكن يتحسب &quot;وصول غير مصرّح&quot; تحت CFAA §1030. الدرس ده ينفع فقط في: (1) المعامل الخاصة بيك، (2) عمليات red team بعقد، (3) تقييمات بتفويض حكومي مكتوب. خرجت عن الحدود دي = جناية.
            </Callout>
          </Section>

          <Section title="عائلات هجمات USB — اعرف الفرق">
            <TwoCol>
              <Card title="1) USB كقرص ملوث" color="amber">
                ملف خبيث + <span className="eng">autorun.inf</span> أو اسم مغري زي (<span className="eng">salaries.xlsx.lnk</span>). بيعتمد على إن المستخدم يضغط. أبسط شكل في اللعبة — ولسه شغال على البيئات اللي وعيها ضعيف.
              </Card>
              <Card title="2) BadUSB — انتحال فئة الجهاز" color="red">
                الـ firmware في شريحة الـ USB قابل لإعادة البرمجة. الجهاز بيقول &quot;أنا HID (كيبورد)&quot; وبيكتب أوامر بسرعة 1000 wpm. <b>مش محتاج autorun</b> — الـ OS بيثق في أي كيبورد على طول.
              </Card>
              <Card title="3) Rubber Ducky / Bash Bunny" color="red">
                منتجات تجارية من Hak5 بتنفذ BadUSB بلغة سكربت. <span className="eng">DuckyScript</span> بيحوّل سلسلة ضربات الكيبورد لملف .bin، تنزله على &quot;USB&quot; وهو بيكتب نفسه على الهدف في ثواني.</Card>
              <Card title="4) USB كمحوّل شبكي (LAN Turtle)" color="red">
                الجهاز بيقدم نفسه كـ <span className="eng">USB Ethernet adapter</span>. Windows بيفضّله تلقائياً على الـ LAN/WiFi → كل DNS وHTTP بيعدي من خلاله → MITM فوري ومن غير ضجة.
              </Card>
              <Card title="5) USB لاسلكي (O.MG cable)" color="red">
                شكله كبل شحن iPhone عادي. جواه شريحة WiFi + microcontroller. المهاجم بيتصل بيه من 100 متر، بينفّذ أوامر، بيسرّب. الضحية معرفش إن &quot;الكبل&quot; بقى قناة C2.
              </Card>
              <Card title="6) USBKill / تخريب فيزيائي" color="red">
                مكثفات بتتشحن من خط الـ 5V وبعدين بتطلق ~200V على خطوط الـ USB. بتحرق الـ motherboard في نص ثانية. مش &quot;اختراق&quot; بالمعنى المفهوم لكنه جزء من طيف الـ USB في عمليات التخريب.
              </Card>
            </TwoCol>
          </Section>

          <Section title="كيف يُنشر USB ملوث في العالم الحقيقي">
            <Step n={1} title="الإسقاط — Drop Attack">
              <p>دراسة جامعة إلينوي 2016 الكلاسيكية: 297 USB اترموا في حرم الجامعة. <b>98% اتاخدوا، 45% اتوصّلوا بكمبيوتر</b>. النسبة بترتفع لو الـ USB عليه ملصق (&quot;سري&quot;، &quot;رواتب 2026&quot;، شعار الجامعة). في العمليات الحقيقية على بيئات حكومية، المكان مش عشوائي — مواقف السيارات، المصاعد، الكافيتريا. الفضول البشري ثغرة مفتوحة دايماً.</p>
            </Step>
            <Step n={2} title="الهدية المؤتمر / الترويج">
              <p>فلاشات &quot;مجانية&quot; بتتوزّع في مؤتمر صناعي. حصلت في 2018 في مؤتمر شركة طاقة أمريكية كبيرة — العدوى انتشرت في 14 مرفق طاقة قبل ما الحملة تتكشف. الموزّع نفسه ممكن يكون بريء — شركة طباعة الكروت اخترقت في سلسلة الإمداد.</p>
            </Step>
            <Step n={3} title="الموظف الداخلي / المُتعاقد">
              <p>المسار اللي اتاستخدم في Stuxnet (2010). إيران كانت معزولة عن الإنترنت في منشأة نطنز. التحليلات بتقول إن مقاول (روسي على الأرجح) دخّل USB ملوث على محطة هندسية. الباقي تاريخ معروف.</p>
            </Step>
            <Step n={4} title="محطات الشحن العامة (Juice Jacking)">
              <p>محطة شحن في مطار أو فندق معدّلة. اللحظة اللي بتوصل فيها التليفون بالـ USB، الجهاز بيتفاوض على وضع البيانات، بيقرا الصور، بيدفع تطبيق. FBI Denver طلع تحذير رسمي بيها سنة 2023.</p>
            </Step>
            <Step n={5} title="سلسلة الإمداد">
              <p>دي الأخطر بكتير. الـ USB بيوصل ملوّث من المصنع نفسه. حصل على شحنات مسجلات أمنية صينية في 2022، وعلى motherboards من Asus (LiveUpdate) في 2019. صعب جداً تكتشفه طول ما الـ digital signature سليم. اللعبة هنا في غاية الخطورة.</p>
            </Step>
          </Section>

          <Section title="كيف يعدي USB الـ &quot;Air-Gap&quot; — قصة Stuxnet مختصرة">
            <p>Stuxnet هو الـ benchmark. أي عملية USB جت بعده اتعلمت منه. شوف خطواته بالظبط:</p>
            <ol>
              <li><b>الإسقاط الأولي</b> — USB ملوث وصل إلى حواسيب مقاولين متصلين بالإنترنت أولاً.</li>
              <li><b>الانتشار</b> — كل USB يوصل بحاسوب مصاب يُنسخ إليه الحمولة. ينتشر تلقائياً.</li>
              <li><b>عبور الفجوة</b> — مهندس وصل USB ملوث بمحطة عمل داخل نطنز.</li>
              <li><b>الانتقال داخلياً</b> — استخدم 4 ثغرات 0-day في Windows + ثغرة في WinCC SCADA.</li>
              <li><b>الحمولة النهائية</b> — برنامج PLC مُعدّل، يخرّب طرّادات اليورانيوم بأنماط دوّار، بينما يُظهر للمشغّلين قراءات طبيعية.</li>
              <li><b>التغطية</b> — توقيع رقمي مسروق من Realtek وJMicron جعل Windows يثق بالـ drivers.</li>
            </ol>
            <Callout kind="info" title="الخلاصة الناشفة">
              نظام معزول مش معناه نظام آمن. معناه إن ناقل العدوى لازم يكون فيزيائي — وده قيد بشري مش تقني. والقيود البشرية بتنكسر، دايماً.
            </Callout>
          </Section>

          <Section title="BadUSB من الداخل — كيف يكتب أوامر دون نقر">
            <p>هو بيشتغل ليه أصلاً؟ بسيطة: بروتوكول الـ USB بيسمح لأي جهاز إنه يقول &quot;أنا فئة كذا&quot;. الـ firmware بيتعدّل ليقول &quot;أنا كيبورد Logitech&quot;. النظام بيضيفه على طول من غير ما يسأل المستخدم. ثقة عمياء.</p>
            <Code lang="DuckyScript">{`REM === تعليمي بحت — تنفيذه على نظام بدون إذن جريمة ===
DELAY 1000
GUI r              REM فتح Run في Windows
DELAY 200
STRING powershell -w hidden -nop
ENTER
DELAY 1500
REM هنا في عملية حقيقية يُكتب one-liner C2،
REM لكن العرض التعليمي يتوقف عند Run فقط
STRING Write-Host "Educational PoC - red team training"
ENTER`}</Code>
            <p>الزمن من إن الـ USB يدخل لحد ما الأمر يتنفّذ: <b>3-7 ثواني</b>. أسرع من أي تنبيه EDR تقليدي. مفيش وقت للسؤال.</p>
            <Callout kind="good" title="الدفاع">
              <ul>
                <li><b>USB device control:</b> سياسة GPO تمنع HID جديد إلا بعد موافقة (Windows: <span className="eng">Device Installation Restrictions</span>).</li>
                <li><b>USBGuard على Linux:</b> whitelist بـ vendor/product/serial. أي keyboard جديد يُحظر افتراضياً.</li>
                <li><b>Port physical lockdown</b> في بيئات OT/ICS — أغطية USB مقفلة، مفاتيح مادية للتفعيل.</li>
                <li><b>اكتشاف &quot;keyboard يكتب 1000 wpm&quot;:</b> EDR متقدم يربط ضربات المفاتيح بمعدل بشري معقول.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="الـ USB يصبح شبكة — LAN Turtle و O.MG كأمثلة">
            <p>هنا الجواب على سؤال &quot;إزاي الفيروس بيدخل الشبكة من USB؟&quot;. الفكرة بسيطة: الـ USB مش بيحقن &quot;فيروس&quot; في الشبكة مباشرة. هو بيحوّل الجهاز المضيف نفسه لنقطة دخول للمهاجم على الشبكة. الـ USB هو الباب، الشبكة هي البيت، المهاجم هو الضيف.</p>
            <TwoCol>
              <Card title="السيناريو 1 — USB Ethernet Adapter خبيث" color="red">
                LAN Turtle يعرّف نفسه كـ network adapter. Windows/Mac يضيفه تلقائياً ويفضّل route عبره أحياناً. النتيجة: كل DNS, HTTP, SMB يمر بالجهاز. ينفذ المهاجم: DNS spoofing, NTLM relay, captive portal مزيف، أو استخراج hash الـ NetNTLMv2 خلال ثوان.
              </Card>
              <Card title="السيناريو 2 — كبل O.MG كـ implant مستقل" color="red">
                الكبل يحتوي WiFi access point. المهاجم يتصل به من سيارته في الموقف، ينفّذ أوامر، يستخرج. الجهاز نفسه لا يحتاج اتصال إنترنت — الكبل هو القناة.
              </Card>
              <Card title="السيناريو 3 — USB يفتح reverse shell ثم يبدأ الـ pivot" color="red">
                BadUSB ينفّذ payload صغير → اتصال خارجي بـ C2 → المهاجم يصل إلى الجهاز → يبدأ من هناك يستكشف الشبكة الداخلية بأدوات native (لا تتطلب رفع شيء).
              </Card>
              <Card title="السيناريو 4 — ARP poisoning من المضيف المخترَق" color="red">
                بعد دخول جهاز، المهاجم يستخدمه ليسمم ARP cache على الـ subnet. كل traffic بين الأجهزة المجاورة والـ gateway يمر به. يصبح man-in-the-middle لـ subnet كامل.
              </Card>
            </TwoCol>
            <Terminal lines={[
              { p: "# هذه أوامر تشخيصية لمختبر تملكه — تفهم ما يحدث، لا تشغّلها على شبكة غريبة" },
              { p: "# 1) رؤية كل الأجهزة في subnet 192.168.1.0/24:" },
              { p: "nmap -sn 192.168.1.0/24" },
              { o: "Nmap scan report for 192.168.1.10\nMAC Address: 00:0C:29:AB:CD:EF (VMware)\nNmap scan report for 192.168.1.42\nMAC Address: B8:27:EB:11:22:33 (Raspberry Pi)" },
              { p: "" },
              { p: "# 2) معرفة منافذ مفتوحة على هدف داخل المختبر:" },
              { p: "nmap -sV -p 1-1000 192.168.1.42" },
              { p: "" },
              { p: "# 3) الأجهزة في ARP table المحلية (من سرّى لمن):" },
              { p: "ip neigh show" },
            ]} />
          </Section>

          <Section title="بعد الاتصال بالشبكة — كيف يصل المهاجم إلى الأجهزة الأخرى">
            <p>دلوقتي السؤال المهم: &quot;طب لو اتصلت بالشبكة، أوصل لباقي الأجهزة إزاي؟&quot;. الإجابة بتيجي على مراحل منهجية، مش بالعشوائية:</p>
            <Step n={1} title="رسم خريطة الشبكة">
              <p>قبل أي حاجة، اعرف اللي قدامك. أدوات مش محتاج ترفعها — كلها موجودة على النظام: <span className="eng">nmap, arp, netstat, ip route, nslookup</span>. هدفك: تعرف الـ subnets والـ gateway والـ DHCP والـ DNS والـ servers (DC, DB, Print, File).</p>
              <Terminal lines={[
                { p: "# خريطة سريعة للشبكة المباشرة:" },
                { p: "ip route                          # gateways و subnets المعروفة" },
                { p: "arp -a                            # كل من تكلمت معه مؤخراً" },
                { p: "nmap -sn 10.0.0.0/24              # أجهزة حية" },
                { p: "nmap -sV --top-ports 100 10.0.0.5 # خدمات على هدف" },
              ]} />
            </Step>
            <Step n={2} title="جمع المعلومات السلبي — listen قبل أن تتكلم">
              <p>كل subnet مليان broadcasts بتطفح: ARP, mDNS, LLMNR, NBT-NS, DHCP, SSDP, NetBIOS. <span className="eng">Responder</span> و<span className="eng">Wireshark</span> هيقولوا لك أسماء الأجهزة، المستخدمين، وأحياناً hashes كاملة قبل ما تبعت ولا packet واحد.</p>
              <p><b>الخطوة دي مهمة ليه؟</b> لأن السلبي = صعب يتكشف. ساعة سماع بتكشفلك أكتر من ساعة فحص نشط، ومش بتطلّع IDS. بصمتك = ضعفك للمدافع.</p>
            </Step>
            <Step n={3} title="LLMNR/NBT-NS Poisoning — أول طريق سهل لـ hashes">
              <p>لما جهاز Windows بيدور على اسم مش موجود في الـ DNS، بيصرخ على الـ LAN: &quot;مين اسمه X؟&quot;. الـ Responder بيرد &quot;أنا!&quot;، فالضحية بيبعت NTLMv2 hash. تكسره offline أو ترحّله (relay) لخدمة تانية.</p>
              <Code lang="bash">{`# في مختبر تملكه:
sudo responder -I eth0 -wd
# انتظر hashes → cracking offline بـ hashcat:
hashcat -m 5600 hashes.txt rockyou.txt`}</Code>
            </Step>
            <Step n={4} title="NTLM Relay — لا تكسر، استخدم">
              <p>أقوى من الـ cracking بكتير. بدل ما تكسر الـ hash، ارمي بيه على خدمة تانية بتثق في نفس الـ domain (LDAP, SMB, MSSQL, ADCS). أداة <span className="eng">impacket-ntlmrelayx</span>. الشرط الوحيد: SMB signing مش مفعّل على الهدف — وده افتراضياً معطّل في معظم البيئات. هدية مجانية.</p>
            </Step>
            <Step n={5} title="استغلال SMB / RCE معروفة">
              <p>على أي شبكة مؤسسية مش محدّثة، هتلاقي دايماً جهاز واحد على الأقل ضعيف قدام <span className="eng">EternalBlue (CVE-2017-0144)</span>، <span className="eng">PrintNightmare (CVE-2021-34527)</span>، <span className="eng">PetitPotam</span>، أو <span className="eng">ZeroLogon (CVE-2020-1472)</span>. كلها بتتحول لـ RCE/Domain Admin بأدوات عامة. مفيش شطارة.</p>
            </Step>
            <Step n={6} title="الحركة الجانبية — Lateral Movement">
              <p>بعد ما تجيب باسورد أو hash واحد، تنقّل بين الأجهزة بـ:</p>
              <ul>
                <li><b>PsExec / wmiexec / smbexec</b> (impacket) — تنفيذ أوامر remote عن طريق SMB.</li>
                <li><b>WinRM</b> (HTTPS port 5986) — أكتر شرعية في الشكل، بيبان إداري عادي.</li>
                <li><b>Pass-the-Hash / Pass-the-Ticket</b> — مش محتاج تعرف الباسورد النصي أصلاً.</li>
                <li><b>RDP</b> — مباشر لو مفتوح. صوته عالي شوية بس مفيد على الـ workstations.</li>
              </ul>
            </Step>
            <Step n={7} title="الوصول للـ Domain Controller — &quot;crown jewel&quot;">
              <p>الـ Active Directory هو الهدف في 95% من الشبكات المؤسسية. لما تطلع Domain Admin مرة واحدة: <span className="eng">DCSync</span> بيسحبلك كل hashes الـ domain، تعمل golden tickets، والوصول بقى دايم مهما غيّروا باسوردات.</p>
            </Step>
            <Callout kind="info" title="ملاحظة مهنية مهمة جداً">
              الخطوات دي مش حاجة بتقفز فيها فلاشة لوحدها أوتوماتيكياً. دي خطوات <b>يدوية</b> بينفذها المشغّل (operator) بعد ما الـ USB بيفتحله shell على جهاز داخلي. الـ malware مش بياخد مكان المهاجم — هو بيقعّده على الكرسي بس. الباقي شغل بشري.
            </Callout>
          </Section>

          <Section title="الدفاع الكامل — كيف تُغلق هذه السلسلة">
            <Callout kind="good" title="ضد USB">
              <ul>
                <li><b>سياسة device control</b> صارمة — Windows GPO أو CrowdStrike/SentinelOne تمنع أي جهاز USB غير مسجل.</li>
                <li><b>USB data diodes</b> في بيئات OT — قراءة فقط، لا كتابة.</li>
                <li><b>محطات تنظيف USB</b> (Olea Kiosk, OPSWAT) — كل USB يدخل المنشأة يمر بفحص محايد أولاً.</li>
                <li><b>تعطيل autorun</b> منذ 2010 (افتراضي على Windows الحديث) — لكن تأكد بـ GPO.</li>
                <li><b>USBGuard / udev rules</b> على Linux تحدّد بدقة ما يُقبل.</li>
                <li><b>تدريب المستخدمين</b> — &quot;USB وجدته&quot; = &quot;سلّمه للأمن، لا تُوصله&quot;. Drop tests منتظمة.</li>
              </ul>
            </Callout>
            <Callout kind="good" title="ضد التحرك الجانبي">
              <ul>
                <li><b>تعطيل LLMNR و NBT-NS</b> عبر GPO — يقتل أرخص هجمات Responder.</li>
                <li><b>تشغيل SMB signing</b> إلزامياً — يقتل NTLM relay.</li>
                <li><b>عزل الشبكة (segmentation)</b> — workstation لا تتكلم مع workstation. حركة الـ east-west تمر عبر firewall.</li>
                <li><b>Tier 0/1/2 model</b> لـ Active Directory — حسابات admin النطاق لا تُسجل أبداً على workstations.</li>
                <li><b>LAPS</b> — كلمة سر admin محلية فريدة لكل جهاز، تُدوّر تلقائياً.</li>
                <li><b>EDR متقدم</b> يصطاد سلوك impacket: <span className="eng">PsExec service creation, suspicious WMI, lsass access</span>.</li>
                <li><b>Honeypots داخلية:</b> SMB share &quot;Finance_Backups&quot; يبدو مغرياً، أي وصول له = تنبيه فوري.</li>
                <li><b>Network access control (NAC):</b> 802.1X — أي جهاز جديد على المنفذ يجب أن يصادق قبل وصوله للشبكة.</li>
              </ul>
            </Callout>
            <Callout kind="info" title="MITRE ATT&CK">
              <span className="eng">T1091 (Replication Through Removable Media), T1200 (Hardware Additions), T1557 (AiTM), T1110.001 (Brute Force), T1557.001 (LLMNR/NBT-NS Poisoning), T1021 (Remote Services), T1003.006 (DCSync), T1550.002 (Pass-the-Hash), T1078 (Valid Accounts)</span>.
            </Callout>
          </Section>

          <Section title="حالات دراسية موثّقة">
            <ul>
              <li><b>Stuxnet (2010)</b> — USB → Windows 0-days → WinCC → PLCs نطنز. أول عملية USB cyber-physical موثّقة.</li>
              <li><b>Agent.btz (2008)</b> — USB في موقف سيارات قاعدة عسكرية أمريكية في الشرق الأوسط، أصاب SIPRNet. أدى لإنشاء USCYBERCOM.</li>
              <li><b>Raspberry Robin (2021–)</b> — دودة تنتشر عبر USB، تقود إلى ransomware. آلاف المؤسسات.</li>
              <li><b>USB Ninja Cable (2019)</b> — كبل شحن مزور بمتحكم BLE، شُوهد في عمليات تجسس صناعي.</li>
              <li><b>FIN7 BadUSB campaign (2022)</b> — USB يُرسل بريدياً مع رسائل تبدو من <span className="eng">HHS</span> أو Amazon. FBI أصدر تحذيراً رسمياً.</li>
            </ul>
          </Section>

          <Section title="مراجع للتعمق">
            <ul>
              <li><span className="eng">&quot;Countdown to Zero Day&quot; — Kim Zetter</span> — تشريح Stuxnet كاملاً</li>
              <li><span className="eng">CISA Defending Against Software Supply Chain Attacks</span></li>
              <li><span className="eng">NIST SP 800-114 r1</span> — guidelines for personal storage devices</li>
              <li><span className="eng">Hak5 documentation</span> — لفهم Bash Bunny / O.MG كأدوات تعليمية</li>
              <li><span className="eng">SANS ICS515</span> — defending industrial control systems</li>
              <li><span className="eng">FBI PSA on Juice Jacking (2023)</span></li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="Why USB is still the most dangerous vector in 2026">
            <p>The air gap — fully disconnecting a system from the internet — is the highest defensive posture deployed in critical infrastructure (power plants, nuclear facilities, manufacturing networks). USB is the one bridge that crosses that gap. From Stuxnet (2010) to recent <span className="eng">Volt Typhoon</span> activity, USB remains the primary infection vector against &quot;isolated&quot; targets.</p>
            <Analogy>An air gap is a castle wall. The internet is a guarded gate. USB is a piece of mail an employee slips into a pocket and walks across the wall with, no inspection. So every serious adversary against critical infrastructure invests in &quot;how do we ride in inside an employee&apos;s pocket?&quot;.</Analogy>
            <Callout kind="danger" title="Legal warning">
              Plugging a USB into a system you don&apos;t own (even an airport charging port-tester) can be &quot;unauthorized access&quot; under CFAA §1030. This lesson applies to: (1) your own lab, (2) contracted red-team engagements, (3) assessments under written government authorization.
            </Callout>
          </Section>

          <Section title="USB attack families — know the difference">
            <TwoCol>
              <Card title="1) USB as infected disk" color="amber">
                Malicious file + <span className="eng">autorun.inf</span> or a tempting name (<span className="eng">salaries.xlsx.lnk</span>). Relies on the user clicking. Simplest form — still works against weak-awareness environments.
              </Card>
              <Card title="2) BadUSB — class spoofing" color="red">
                The firmware in the USB chip is reprogrammable. The device claims to be a HID (keyboard) and types at 1000 wpm. <b>No autorun needed</b> — the OS trusts any keyboard.
              </Card>
              <Card title="3) Rubber Ducky / Bash Bunny" color="red">
                Commercial Hak5 products implementing BadUSB with a script language. <span className="eng">DuckyScript</span> turns keystroke sequences into a .bin file, dropped onto a &quot;USB&quot;, then types itself onto the target in seconds.
              </Card>
              <Card title="4) USB as network adapter (LAN Turtle)" color="red">
                The device presents itself as a <span className="eng">USB Ethernet adapter</span>. Windows often auto-prefers it over LAN/WiFi → all DNS and HTTP routes through it → instant MITM.
              </Card>
              <Card title="5) Wireless USB (O.MG cable)" color="red">
                Looks like an iPhone charger. Inside: WiFi chip + microcontroller. Attacker connects from 100m, runs commands, exfils. Victim never knows the &quot;cable&quot; became C2.
              </Card>
              <Card title="6) USBKill / physical sabotage" color="red">
                Capacitors charge from the 5V line, then dump ~200V back into the USB pins. Fries the motherboard in 0.5s. Not &quot;hacking&quot; but part of the USB-attack spectrum in sabotage ops.
              </Card>
            </TwoCol>
          </Section>

          <Section title="How a malicious USB actually gets deployed">
            <Step n={1} title="The drop attack">
              <p>Classic 2016 University of Illinois study: 297 USB sticks dropped on campus. <b>98% picked up, 45% plugged into a computer.</b> Success rate climbs if the stick is labeled (&quot;Confidential&quot;, &quot;Salaries 2026&quot;, school logo). In real ops on government environments, drop locations are chosen: parking lots, elevators, cafeterias.</p>
            </Step>
            <Step n={2} title="The conference giveaway / promo">
              <p>&quot;Free&quot; USB sticks at industry conferences. In 2018 a major US energy conference handed out infected sticks; infection spread across 14 facilities before discovery. The vendor itself can be innocent — the print-house was supply-chain compromised.</p>
            </Step>
            <Step n={3} title="The insider / contractor">
              <p>Stuxnet&apos;s path (2010). Iran&apos;s Natanz facility was internet-isolated. Analyses point to a contractor (likely Russian) introducing an infected USB at an engineering workstation. The rest is history.</p>
            </Step>
            <Step n={4} title="Public charging stations (juice jacking)">
              <p>A modified airport/hotel charging port. The moment your phone connects, the port negotiates data mode, reads photos, drops apps. FBI Denver issued a formal advisory in 2023.</p>
            </Step>
            <Step n={5} title="Supply chain">
              <p>The most dangerous. USB arrives infected from the factory. Seen in Chinese security recorder shipments (2022) and Asus motherboards (LiveUpdate, 2019). Very hard to detect when the digital signature is valid.</p>
            </Step>
          </Section>

          <Section title="How USB jumps an air gap — Stuxnet condensed">
            <p>Stuxnet is the benchmark. Every USB op since has studied it:</p>
            <ol>
              <li><b>Initial seeding</b> — infected USB reached internet-connected contractor laptops first.</li>
              <li><b>Propagation</b> — every USB plugged into an infected host gets the payload copied. Spreads silently.</li>
              <li><b>Air-gap crossing</b> — an engineer plugged a contaminated USB into a Natanz engineering workstation.</li>
              <li><b>Internal pivot</b> — used 4 Windows 0-days + a WinCC SCADA bug.</li>
              <li><b>Final payload</b> — modified PLC code; sabotaged uranium centrifuges in a rotating pattern while showing operators normal readings.</li>
              <li><b>Cover</b> — stolen Realtek and JMicron certificates made Windows trust the drivers.</li>
            </ol>
            <Callout kind="info" title="The lesson">
              An isolated system is not a safe system. It just means the infection vector must be physical — and that&apos;s a human constraint, not a technical one.
            </Callout>
          </Section>

          <Section title="BadUSB internals — typing without a click">
            <p>BadUSB exploits the fact that the USB protocol lets a device declare any &quot;class&quot;. The firmware is modified to say &quot;I am a Logitech keyboard&quot;. The OS adds it instantly with no user prompt.</p>
            <Code lang="DuckyScript">{`REM === Educational only — running on a system without authorization is a crime ===
DELAY 1000
GUI r              REM open Windows Run
DELAY 200
STRING powershell -w hidden -nop
ENTER
DELAY 1500
REM In a real op a C2 one-liner would go here;
REM the educational PoC stops at Run only.
STRING Write-Host "Educational PoC - red team training"
ENTER`}</Code>
            <p>Time from plug-in to executed command: <b>3–7 seconds</b>. Faster than most legacy EDR alerts.</p>
            <Callout kind="good" title="Defense">
              <ul>
                <li><b>USB device control:</b> GPO that blocks new HID devices unless approved (Windows: <span className="eng">Device Installation Restrictions</span>).</li>
                <li><b>USBGuard on Linux:</b> whitelist by vendor/product/serial. Any unknown keyboard rejected by default.</li>
                <li><b>Physical port lockdown</b> in OT/ICS — locked port covers, hardware enable keys.</li>
                <li><b>&quot;1000-wpm keyboard&quot; detection:</b> modern EDR correlates keystroke rate against human-realistic bounds.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="USB becoming the network — LAN Turtle and O.MG examples">
            <p>This is where the answer to &quot;how does a virus get onto the network from a USB?&quot; starts. The USB doesn&apos;t inject a &quot;virus&quot; into the network directly — it turns the host into the attacker&apos;s entry point on the network.</p>
            <TwoCol>
              <Card title="Scenario 1 — malicious USB Ethernet adapter" color="red">
                LAN Turtle declares as a network adapter. Windows/Mac auto-add it and sometimes prefer the route via it. All DNS, HTTP, SMB now flows through. Attacker runs DNS spoofing, NTLM relay, fake captive portal, or grabs NetNTLMv2 hashes within seconds.
              </Card>
              <Card title="Scenario 2 — O.MG cable as standalone implant" color="red">
                The cable hosts a WiFi access point. Attacker connects from the parking lot, runs commands, exfils. The host doesn&apos;t need any internet — the cable is the channel.
              </Card>
              <Card title="Scenario 3 — BadUSB → reverse shell → pivot" color="red">
                BadUSB executes a small payload → outbound C2 → operator on box → starts mapping the internal network with native tools (no extra binaries needed).
              </Card>
              <Card title="Scenario 4 — ARP poisoning from the compromised host" color="red">
                Once on a host, the attacker poisons ARP on the local subnet. Traffic between neighboring hosts and the gateway flows through them. Instant subnet-wide MITM.
              </Card>
            </TwoCol>
            <Terminal lines={[
              { p: "# diagnostic commands for a lab you own — understand what they do, don't run them on a foreign network" },
              { p: "# 1) see every host in 192.168.1.0/24:" },
              { p: "nmap -sn 192.168.1.0/24" },
              { o: "Nmap scan report for 192.168.1.10\nMAC Address: 00:0C:29:AB:CD:EF (VMware)\nNmap scan report for 192.168.1.42\nMAC Address: B8:27:EB:11:22:33 (Raspberry Pi)" },
              { p: "" },
              { p: "# 2) open ports on a lab target:" },
              { p: "nmap -sV -p 1-1000 192.168.1.42" },
              { p: "" },
              { p: "# 3) hosts in your local ARP table (who you've talked to):" },
              { p: "ip neigh show" },
            ]} />
          </Section>

          <Section title="Once you&apos;re on the network — how to reach other devices">
            <p>This is the part you asked about: &quot;if I&apos;m on the network, how do I reach the devices?&quot;. Methodically:</p>
            <Step n={1} title="Map the network">
              <p>Discover what exists before doing anything else. Native tools, no uploads needed: <span className="eng">nmap, arp, netstat, ip route, nslookup</span>. Goal: subnets, gateway, DHCP, DNS, key servers (DC, DB, print, file).</p>
              <Terminal lines={[
                { p: "# fast local map:" },
                { p: "ip route                          # known gateways and subnets" },
                { p: "arp -a                            # everyone you've recently talked to" },
                { p: "nmap -sn 10.0.0.0/24              # live hosts" },
                { p: "nmap -sV --top-ports 100 10.0.0.5 # services on a target" },
              ]} />
            </Step>
            <Step n={2} title="Passive collection — listen before you speak">
              <p>Every subnet leaks broadcasts: ARP, mDNS, LLMNR, NBT-NS, DHCP, SSDP, NetBIOS. <span className="eng">Responder</span> and <span className="eng">Wireshark</span> reveal hostnames, usernames, sometimes full hashes — without you sending a single packet.</p>
              <p><b>Why it matters:</b> passive = hard to detect. An hour of listening reveals more than an hour of active scanning, and never trips an IDS.</p>
            </Step>
            <Step n={3} title="LLMNR/NBT-NS poisoning — the easy hash road">
              <p>When a Windows host asks for a name not in DNS, it broadcasts &quot;who is X?&quot; on the LAN. Responder replies &quot;me!&quot;, and the victim sends a NetNTLMv2 hash. You crack or relay it.</p>
              <Code lang="bash">{`# in a lab you own:
sudo responder -I eth0 -wd
# wait for hashes → offline cracking with hashcat:
hashcat -m 5600 hashes.txt rockyou.txt`}</Code>
            </Step>
            <Step n={4} title="NTLM relay — don&apos;t crack, use">
              <p>Stronger than cracking. Instead of breaking the hash, relay it directly to another service that trusts the same domain (LDAP, SMB, MSSQL, ADCS). Tool: <span className="eng">impacket-ntlmrelayx</span>. Requirement: SMB signing not enforced (still common by default).</p>
            </Step>
            <Step n={5} title="Known SMB / RCE exploitation">
              <p>On any unpatched enterprise network you find at least one host vulnerable to <span className="eng">EternalBlue (CVE-2017-0144)</span>, <span className="eng">PrintNightmare (CVE-2021-34527)</span>, <span className="eng">PetitPotam</span>, or <span className="eng">ZeroLogon (CVE-2020-1472)</span>. All become RCE/Domain Admin via public tooling.</p>
            </Step>
            <Step n={6} title="Lateral movement">
              <p>After one password/hash, you traverse hosts via:</p>
              <ul>
                <li><b>PsExec / wmiexec / smbexec</b> (impacket) — remote command execution over SMB.</li>
                <li><b>WinRM</b> (HTTPS/5986) — more legitimate-looking, blends with admin traffic.</li>
                <li><b>Pass-the-hash / pass-the-ticket</b> — no plaintext password needed.</li>
                <li><b>RDP</b> — direct if exposed. Noisier but useful on workstations.</li>
              </ul>
            </Step>
            <Step n={7} title="Reach the Domain Controller — the crown jewel">
              <p>Active Directory is the goal in 95% of enterprises. Once you have Domain Admin: <span className="eng">DCSync</span> dumps every domain hash, golden tickets give you persistent access regardless of password resets.</p>
            </Step>
            <Callout kind="info" title="Professional caveat">
              These are not &quot;steps a USB virus auto-jumps through&quot;. They are <b>manual</b> steps an operator runs after USB drops them a shell on an internal host. The malware doesn&apos;t replace the attacker — it puts the attacker in the chair.
            </Callout>
          </Section>

          <Section title="Full defense — closing the chain">
            <Callout kind="good" title="Against USB">
              <ul>
                <li><b>Strict device-control policy</b> — Windows GPO or CrowdStrike/SentinelOne blocks any unknown USB device.</li>
                <li><b>USB data diodes</b> in OT environments — read-only, never write.</li>
                <li><b>USB sanitization kiosks</b> (Olea, OPSWAT) — every USB entering the facility passes a neutral scan first.</li>
                <li><b>Disable autorun</b> (default on modern Windows since 2010, but verify via GPO).</li>
                <li><b>USBGuard / udev rules</b> on Linux to whitelist precisely.</li>
                <li><b>User training</b> — &quot;found USB&quot; = &quot;hand to security, never plug&quot;. Periodic drop-tests.</li>
              </ul>
            </Callout>
            <Callout kind="good" title="Against lateral movement">
              <ul>
                <li><b>Disable LLMNR and NBT-NS</b> via GPO — kills the cheapest Responder attacks.</li>
                <li><b>Enforce SMB signing</b> — kills NTLM relay.</li>
                <li><b>Network segmentation</b> — workstation cannot talk to workstation. East-west traffic transits a firewall.</li>
                <li><b>AD Tier 0/1/2 model</b> — domain admins never log on to workstations.</li>
                <li><b>LAPS</b> — unique, auto-rotated local-admin password per host.</li>
                <li><b>Modern EDR</b> hunts impacket-style behavior: PsExec service creation, suspicious WMI, lsass access.</li>
                <li><b>Internal honeypots:</b> a tempting <span className="eng">\\fileserver\Finance_Backups</span> share — any access = instant alert.</li>
                <li><b>Network access control (NAC):</b> 802.1X — any new device on a port must authenticate before getting any access.</li>
              </ul>
            </Callout>
            <Callout kind="info" title="MITRE ATT&CK">
              <span className="eng">T1091 (Replication Through Removable Media), T1200 (Hardware Additions), T1557 (AiTM), T1110.001 (Brute Force), T1557.001 (LLMNR/NBT-NS Poisoning), T1021 (Remote Services), T1003.006 (DCSync), T1550.002 (Pass-the-Hash), T1078 (Valid Accounts)</span>.
            </Callout>
          </Section>

          <Section title="Documented case studies">
            <ul>
              <li><b>Stuxnet (2010)</b> — USB → Windows 0-days → WinCC → Natanz PLCs. First documented USB cyber-physical operation.</li>
              <li><b>Agent.btz (2008)</b> — USB in a Middle East US base parking lot infected SIPRNet. Led directly to USCYBERCOM&apos;s creation.</li>
              <li><b>Raspberry Robin (2021–)</b> — USB-spreading worm that hands off to ransomware. Thousands of organizations.</li>
              <li><b>USB Ninja Cable (2019)</b> — fake charging cable with BLE microcontroller, observed in industrial-espionage ops.</li>
              <li><b>FIN7 BadUSB campaign (2022)</b> — USBs mailed in packages spoofing HHS or Amazon. FBI issued an official PIN.</li>
            </ul>
          </Section>

          <Section title="Further reading">
            <ul>
              <li><span className="eng">&quot;Countdown to Zero Day&quot; — Kim Zetter</span> — full Stuxnet anatomy</li>
              <li><span className="eng">CISA: Defending Against Software Supply Chain Attacks</span></li>
              <li><span className="eng">NIST SP 800-114 r1</span> — guidelines for personal storage devices</li>
              <li><span className="eng">Hak5 documentation</span> — to study Bash Bunny / O.MG as educational tools</li>
              <li><span className="eng">SANS ICS515</span> — defending industrial control systems</li>
              <li><span className="eng">FBI PSA on juice jacking (2023)</span></li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
