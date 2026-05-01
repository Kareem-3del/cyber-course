"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="networking-basics">
      <L
        ar={<>
          <Section title="إيه الفرق بين اللي بيركّب راوتر واللي بيحلّل pcap؟">
            <p>سؤال جدّي.</p>
            <p>إيه الفرق بين الشخص اللي بيركّب راوتر في البيت، والشخص اللي بيفتح pcap حجمه 2 جيجا في Wireshark ويعرف يطلّع منه الإبرة؟</p>
            <p>الفرق مش في الـ tool.</p>
            <p>الراوتر زرار، Wireshark زرار، nmap زرار. الناس كلها بتعرف تدوس على الزراير.</p>
            <p>الفرق إن واحد بيشوف &quot;الإنترنت اشتغل&quot;، والتاني بيشوف <b>3-way handshake، ثم TLS Client Hello، ثم HTTP/2 frame، ثم redirect لـ CDN</b>. وبيعرف فين بالظبط الحاجة الغريبة لو فيه حاجة غريبة.</p>
            <p>الدرس ده هو اللي بيحوّلك من الأول للتاني. من غيره، Wireshark هيروغليفية، وnmap حفظ صم.</p>
            <p>اعتراف: أول مرة شفت ARP spoofing في الحقيقة، أنا اللي اتسرقت. كنت في كافيه عامل لاب اشتغال على HackTheBox، الراجل اللي قاعد جنبي كان معاه bettercap، ولفّ كل ترافيكي. نعم. الواقع مش كتب.</p>
          </Section>

          <Section title="نموذج OSI — 7 طبقات">
            <Code lang="text">{`الطبقة 7  Application      HTTP, DNS, SSH, FTP, SMTP
الطبقة 6  Presentation     TLS, تشفير، تنسيق
الطبقة 5  Session          إدارة الجلسات
الطبقة 4  Transport        TCP, UDP            ← منافذ (ports)
الطبقة 3  Network          IP, ICMP, routing   ← عناوين IP
الطبقة 2  Data Link        Ethernet, ARP       ← MAC addresses
الطبقة 1  Physical         كابل، WiFi`}</Code>
            <p>القاعدة: <b>كل طبقة بتلفّ داتا الطبقة اللي فوقها وبتضيف header بتاعها</b>.</p>
            <p>تشبيه البريد المصري على ايامنا: الجواب جوّه ظرف، الظرف جوّه شنطة البوسطجي، الشنطة جوّه عربية البوسطة، العربية ماشية في الشارع. كل مرحلة معاها &quot;header&quot; خاص بيها (عنوان البيت، اسم الفرع، رقم العربية).</p>
            <p>طب أمنياً، إيه قيمة الكلام ده؟</p>
            <p>كل طبقة فيها هجوم مشهور. لو ما عرفتش الطبقات، مش هتعرف الهجوم بيحصل فين فعلياً:</p>
            <ul>
              <li><b>L2 — ARP Spoofing</b>. إنت في كافيه أو شركة، المهاجم بيقول للراوتر &quot;أنا فلان&quot; وبيقول لفلان &quot;أنا الراوتر&quot;. كل ترافيك بيمر عليه. الـ Defense: 802.1X و Dynamic ARP Inspection على الـ switch.</li>
              <li><b>L3 — IP Spoofing</b>. تزييف الـ source IP. أساس DDoS reflection (DNS amplification, NTP amp). الـ Defense: BCP38 / uRPF على حدود الـ ISP — وللأسف أغلب الـ ISPs مش مفعّلاها.</li>
              <li><b>L4 — TCP RST Injection / SYN Flood</b>. تبعت RST لطرفي اتصال فيقفل. الصينيين بيستخدموها كـ Great Firewall. الـ SYN Flood بياكل موارد الـ server بـ half-open connections.</li>
              <li><b>L7 — HTTP Request Smuggling, SQLi, XSS, SSRF</b>. كل هجمات الويب اللي إنت سامع عنها. الطبقة 7 هي اللي فيها الفلوس النهارده.</li>
            </ul>
            <p>الواقع vs المفروض: المفروض كل طبقة عندها defense. الواقع، أغلب الشبكات مكشوفة على L2 لإن محدش فعّل 802.1X — &quot;الموضوع معقّد&quot;.</p>
          </Section>

          <Section title="TCP/IP — النموذج العملي">
            <p>OSI نظري بحت. الإنترنت بيشتغل بـ TCP/IP، 4 طبقات بس:</p>
            <Code lang="text">{`Application   HTTP, DNS, SSH, …    (= OSI 5-7)
Transport     TCP, UDP             (= OSI 4)
Internet      IP, ICMP             (= OSI 3)
Link          Ethernet, WiFi       (= OSI 1-2)`}</Code>
          </Section>

          <Section title="عناوين IP — الجوهر">
            <p>كل جهاز على الشبكة ليه IP فريد. IPv4 = 4 أرقام (0-255): <span className="eng">192.168.1.5</span>.</p>
            <ul>
              <li><b>Public IPs</b> — موصول ليها من الإنترنت.</li>
              <li><b>Private IPs</b> (RFC 1918) — للشبكات الداخلية: <span className="eng">10.0.0.0/8، 172.16.0.0/12، 192.168.0.0/16</span>.</li>
              <li><b>Loopback</b>: <span className="eng">127.0.0.1</span> = الجهاز نفسه.</li>
              <li><b>Subnet mask</b> بيحدّد &quot;شبكتي&quot; إيه. <span className="eng">/24</span> = 254 جهاز.</li>
            </ul>
            <Code lang="text">{`192.168.1.0/24
        │     │
        │     └── prefix length — أول 24 bit للشبكة
        └────── شبكة = 192.168.1.0
                نطاق المضيفين = 192.168.1.1 - 192.168.1.254
                bcast = 192.168.1.255`}</Code>
          </Section>

          <Section title="TCP vs UDP">
            <TwoCol>
              <Card title="TCP — مكالمة محترمة" color="blue">
                <ul>
                  <li>Three-way handshake (SYN → SYN-ACK → ACK).</li>
                  <li>بيضمن الترتيب وعدم الفقد.</li>
                  <li>بيعيد الإرسال لو حاجة ضاعت.</li>
                  <li>بيستخدم في: HTTP, HTTPS, SSH, SMB, RDP.</li>
                </ul>
              </Card>
              <Card title="UDP — سريع وملوش ضمانات" color="amber">
                <ul>
                  <li>ابعت وانسى (fire-and-forget).</li>
                  <li>مفيش handshake.</li>
                  <li>ممكن يضيع، ممكن يوصل مش بالترتيب.</li>
                  <li>بيستخدم مع: DNS, NTP, VoIP, VPN.</li>
                </ul>
              </Card>
            </TwoCol>
            <Callout kind="info" title="ليه ده مهم أمنياً">
              فحص TCP بيدّيك دقة (open/closed/filtered). فحص UDP أبطأ وأقل دقة، لإن مفيش ACK افتراضي.
            </Callout>

            <h4 className="font-bold mt-6 mb-2">الـ Three-Way Handshake = مكالمة بين اتنين متربيين</h4>
            <p>تخيل اتنين بيتكلموا في التليفون لأول مرة:</p>
            <ul>
              <li><b>Client → Server: SYN</b> — &quot;أهلاً، أنا عايز أكلّمك. التسلسل بتاعي بيبدأ من رقم 1000، تمام؟&quot;</li>
              <li><b>Server → Client: SYN-ACK</b> — &quot;أهلاً وسهلاً. سامعك. وصلني رقمك 1000، التالي بقى 1001 من عندك. وبالمناسبة، أنا تسلسلي من 5000، خلّي بالك.&quot;</li>
              <li><b>Client → Server: ACK</b> — &quot;تمام، وصلني 5000، هبعتك ACK = 5001 ونبدأ.&quot;</li>
            </ul>
            <p>كده الاتنين متفقين على نقطة بداية. أي packet هييجي بعد كده، الطرف التاني عارف يرتّبه.</p>
            <p>طب لو المهاجم اعترض المكالمة وبعت RST في النص؟ الاتصال بيقفل. ده هجوم <b>TCP Reset Injection</b> — قديم بس فعّال على شبكات بدون TLS.</p>
            <p>وفي <b>SYN Flood</b>: المهاجم بيبعت SYN بس ما بيردش بـ ACK. السيرفر فاضل مستني، وكل واحد ماخد مكان في الذاكرة. مع آلاف الـ SYNs، السيرفر بياكل نفسه. الـ Defense: SYN cookies في الـ kernel.</p>
          </Section>

          <Section title="المنافذ المهمة (Well-known)">
            <Code lang="text">{`20/21    FTP            (نقل ملفات — قديم، نص واضح)
22       SSH            (أهم بروتوكول إدارة)
23       Telnet         (نص واضح — يجب أن يُمنع)
25       SMTP           (إرسال بريد)
53       DNS            (UDP عادة، TCP أحياناً)
80       HTTP
110      POP3
135      RPC            (Windows)
139, 445 SMB            (Windows file share — هدف ثمين)
143      IMAP
389      LDAP           (AD directory)
443      HTTPS
445      SMB
465/587  SMTP+TLS
587      SMTP submission
636      LDAPS
993      IMAPS
995      POP3S
1433     MSSQL
3306     MySQL
3389     RDP            (Remote Desktop)
5985/5986 WinRM         (PowerShell remote)
8080     HTTP-alt (proxy)
8443     HTTPS-alt`}</Code>
            <p>تحفظ القايمة دي = ضمنت نص شغل nmap. Port 445 مفتوح = SMB = يمكن EternalBlue.</p>
          </Section>

          <Section title="DNS — كيف يصبح اسم IP">
            <Step n={1} title="بتكتب example.com في المتصفح">
              <p>الجهاز بيسأل: &quot;إيه الـ IP بتاع example.com؟&quot;</p>
            </Step>
            <Step n={2} title="بيدوّر محلياً الأول">
              <p>بيبص في <span className="eng">/etc/hosts</span> (أو <span className="eng">C:\\Windows\\System32\\drivers\\etc\\hosts</span>)، وبعدين الـ cache.</p>
            </Step>
            <Step n={3} title="ملقاش، يسأل DNS resolver">
              <p>غالباً الـ ISP، أو 8.8.8.8 (Google)، أو 1.1.1.1 (Cloudflare).</p>
            </Step>
            <Step n={4} title="الـ resolver بيمشي سلسلة">
              <p>Root → TLD (.com) → authoritative server لـ example.com → الرد: <span className="eng">93.184.216.34</span>.</p>
            </Step>
            <Terminal lines={[
              { p: "dig example.com               # استعلام DNS كامل" },
              { p: "dig example.com MX            # خوادم البريد" },
              { p: "dig example.com TXT           # سجلات نصية (SPF, DKIM)" },
              { p: "dig @8.8.8.8 example.com      # اسأل خادم محدد" },
              { p: "dig -x 93.184.216.34          # عكسي (PTR)" },
            ]} />
            <Callout kind="info" title="أهم أنواع DNS records">
              <span className="eng">A</span> = IPv4، <span className="eng">AAAA</span> = IPv6، <span className="eng">CNAME</span> = اسم بديل، <span className="eng">MX</span> = خادم بريد، <span className="eng">NS</span> = خادم أسماء، <span className="eng">TXT</span> = نصوص (SPF/DKIM/DMARC مهمة لأمن البريد).
            </Callout>

            <h4 className="font-bold mt-6 mb-2">DNS Tunneling — السكة اللي محدش بيقفلها</h4>
            <p>تعالى أحكيلك حاجة عبيطة — اوي.</p>
            <p>أغلب الشبكات الـ enterprise بتقفل كل بورت إلا 53 (DNS). الـ firewall رأيه: &quot;DNS؟ ده عادي. سيبه يعدي.&quot;</p>
            <p>المهاجم: &quot;كده؟ تمام.&quot;</p>
            <p>الفكرة بسيطة: الـ DNS بيقبل أسماء طويلة (lookup). الـ malware على الجهاز المخترق بيشفّر الـ data بتاعه ويحطها في اسم الدومين:</p>
            <Code lang="text">{`dGhpc2lzc2VjcmV0ZGF0YQ.attacker.com   →   DNS query

السيرفر بتاع المهاجم بيستقبل الاسم، يفكّ الـ base64، يشوف الـ data.
بيرد بـ TXT record فيه الأمر التالي مشفّر.`}</Code>
            <p>ده مش tutorial. ده <b>DNSCAT2</b> و<b>iodine</b> و<b>dnscat2-powershell</b> — أدوات موجودة من 2010.</p>
            <p>قصة حقيقية: مجموعة <b>OilRig (APT34)</b> — منسوبة لإيران — استخدمت DNS tunneling في حملات على دول الخليج. الـ malware اسمه <span className="eng">DNSpionage</span>. السبب الوحيد إنه نجح: الـ defense ما كانش بيبص على DNS أصلاً.</p>
            <p><b>الحماية:</b> راقب DNS query length و entropy. أي domain طويل غريب الشكل بيتسأل عليه كل دقيقة = علامة استفهام كبيرة. <span className="eng">Zeek (Bro)</span> + <span className="eng">passive DNS</span> = اللي بياكل عيش في الموضوع ده.</p>
          </Section>

          <Section title="HTTP — لغة الويب">
            <p>كل صفحة ويب = HTTP request + response. الـ request:</p>
            <Code lang="http">{`GET /index.html HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: text/html
Cookie: session=abc123

`}</Code>
            <p>الـ response:</p>
            <Code lang="http">{`HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1256
Set-Cookie: session=xyz789
Server: nginx/1.24

<html>...</html>`}</Code>
            <ul>
              <li><b>Status codes:</b> 2xx نجاح، 3xx redirect، 4xx خطأ من الـ client (404, 401, 403)، 5xx خطأ سيرفر (500, 502).</li>
              <li><b>Methods:</b> GET (قراءة)، POST (إرسال)، PUT/PATCH (تحديث)، DELETE.</li>
              <li><b>Headers مهمة أمنياً:</b> <span className="eng">Cookie, Authorization, X-Forwarded-For, Host, Origin, Referer, Content-Security-Policy</span>.</li>
            </ul>
          </Section>

          <Section title="ARP — كيف تتحدث الأجهزة فيزيائياً">
            <p>على الـ LAN، الأجهزة بتتكلم بـ MAC addresses مش بـ IPs. ARP هو اللي بيربط بينهم.</p>
            <Terminal lines={[
              { p: "# جدول ARP الحالي:" },
              { p: "arp -a                    # كل من تكلمت معه" },
              { p: "" },
              { p: "# مثال:" },
              { o: "10.10.10.5  at  08:00:27:ab:cd:ef  on eth0" },
            ]} />
            <Callout kind="info" title="ARP poisoning">
              المهاجم بيرد على ARP queries بالـ MAC بتاعه. بيبقى man-in-the-middle على كل ترافيك ما بين الضحية والـ gateway. أسلوب قديم، بس لسه شغّال على شبكات من غير 802.1X.
            </Callout>
          </Section>

          <Section title="Wireshark — إزاي تلاقي الإبرة في الكوم">
            <p>Wireshark = أداة التقاط وتحليل packets.</p>
            <p>بُص.</p>
            <p>أول مرة تفتح pcap كبير، هتلاقي 50 ألف packet قدامك. الناس العاديين بيقفلوا الأداة. الناس الشاطرة بتعرف <b>تـ filter</b>.</p>
            <p>الـ filtering هو الموضوع كله. كل دقيقة في Wireshark = filter. ولو مش حافظ شوية فلاتر بظهر قلب، إنت في كل مرة بتبدأ من الصفر.</p>
            <Code lang="text">{`فلاتر مفيدة:
ip.addr == 10.10.10.5         الحزم من/إلى IP
tcp.port == 443                منفذ محدد
http                           HTTP فقط
http.request.method == "POST"  POST requests
dns                            DNS
tcp.flags.syn == 1 && tcp.flags.ack == 0   SYN فقط (port scan)
tls.handshake.type == 1        TLS Client Hello (يكشف SNI)`}</Code>
            <Terminal lines={[
              { p: "# على Linux من سطر الأوامر:" },
              { p: "sudo tshark -i eth0 -f 'port 80' -Y 'http.request' -T fields -e http.request.method -e http.host -e http.request.uri" },
            ]} />
            <Callout kind="info" title="منهج عملي للقراءة">
              <p>لما تفتح pcap لأول مرة، اتبع الخطوات دي بالترتيب:</p>
              <ol className="list-decimal ms-6">
                <li><b>Statistics → Conversations</b> — مين بيتكلم مع مين أكتر؟ أكتر IPs ترافيكاً غالباً هي القصة.</li>
                <li><b>Statistics → Protocol Hierarchy</b> — هل في DNS بنسبة 60%؟ ده مش طبيعي = tunneling مشكوك فيه.</li>
                <li><b>filter:</b> <span className="eng">tcp.flags.syn==1 &amp;&amp; tcp.flags.ack==0</span> — لو لاقيت IP واحد بيبعت SYN لـ 1000 host، ده port scan.</li>
                <li><b>Follow → TCP Stream</b> على أي اتصال — بتشوف الـ payload الخام كأنه نص.</li>
                <li><b>filter:</b> <span className="eng">http.request</span> — كل HTTP requests في مكان واحد.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="NAT و Firewalls و Segmentation — بسرعة">
            <ul>
              <li><b>NAT:</b> راوتر البيت بيحوّل العنوان الداخلي (192.168.1.10) لعنوان عام (203.x.x.x). كل أجهزة البيت من برّه بتبان IP واحد.</li>
              <li><b>Firewall:</b> قواعد &quot;اسمح/امنع&quot; على البورتات والـ IPs والبروتوكولات.</li>
              <li><b>Stateful firewall:</b> فاكر الـ sessions. أنت فتحت اتصال للخارج، الرد بيرجعلك تلقائي.</li>
              <li><b>Egress filtering:</b> تحدّد إيه اللي بيخرج من شبكتك. شركات كتير بتنسى ده — وعشان كده C2 على بورت 443 بيشتغل ببلاش.</li>
              <li><b>Network Segmentation:</b> تقسيم الشبكة لـ VLANs/zones. المفروض جهاز الـ HR ما يقدرش يكلّم الـ Domain Controller مباشرة. الواقع: شبكة مسطحة، أي جهاز يكلّم أي جهاز، والـ ransomware بيلف الشركة كلها في 4 ساعات.</li>
              <li><b>NetFlow/sFlow:</b> ملخّص ميتاداتا لكل اتصال (مين، فين، إمتى، كام بايت). أرخص بكتير من full packet capture، وكافي لـ 80% من الـ detection. لو الـ SOC عندك مش بيشغّل NetFlow analysis، ده gap.</li>
            </ul>
            <p>الواقع المصري/العربي: في كتير من الجهات، الـ segmentation موجود &quot;على الـ slide&quot;. الواقع switch واحد flat، عشان &quot;الموضوع كده أسهل في الإدارة&quot;. ولما الـ incident يحصل، بيكتشفوا إن مفيش حدود يقفوا عندها.</p>
          </Section>

          <Section title="ممارسة">
            <ol>
              <li>افتح Wireshark على Kali، التقط 30 ثانية، وحاول تفهم اللي قدامك.</li>
              <li>افتح موقع HTTP عادي، التقط، اعمل Follow TCP Stream، اقرا الـ raw HTTP.</li>
              <li>اعمل <span className="eng">dig</span> على 5 دومينات مختلفة، شوف فرق الـ records.</li>
              <li>درّب نفسك على الـ subnetting:</li>
            </ol>
            <Code lang="bash">{`ipcalc 192.168.1.0/24
# Network:    192.168.1.0
# Hosts:      192.168.1.1 - 192.168.1.254
# Broadcast:  192.168.1.255`}</Code>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>الشبكات مش حفظ بورتات.</p>
            <p>الشبكات إنك تشوف الـ packet وتعرف هي عند أي طبقة، ومين كاتبها، وليه.</p>
            <p>اكتبها على ظهر إيدك:</p>
            <p>الـ 7 طبقات + TCP handshake + DNS chain + HTTP request = إنت قدرت تقرا الإنترنت.</p>
            <p>والباقي tools.</p>
            <p>الـ tools بتتغيّر كل سنة. الأساسيات دي من 1981 ولسة شغّالة. اوعى تستهتر بيها.</p>
          </Section>
        </>}
        en={<>
          <Section title="Why networking before any recon">
            <p>Every attack needs networking fluency. Without TCP/IP, DNS, and HTTP, Wireshark looks like hieroglyphics and nmap is just memorized commands. This lesson builds the bridge.</p>
          </Section>

          <Section title="The OSI model — 7 layers">
            <Code lang="text">{`Layer 7  Application      HTTP, DNS, SSH, FTP, SMTP
Layer 6  Presentation     TLS, encryption, formatting
Layer 5  Session          session management
Layer 4  Transport        TCP, UDP            ← ports
Layer 3  Network          IP, ICMP, routing   ← IP addresses
Layer 2  Data Link        Ethernet, ARP       ← MAC addresses
Layer 1  Physical         cable, WiFi`}</Code>
            <p>Rule: <b>each layer wraps the layer above and adds its own header</b>. Like a letter inside an envelope inside a box.</p>
            <p>Security angle: hackers attack every layer. Layer 2 = ARP poisoning. Layer 3 = IP spoofing. Layer 4 = SYN flood. Layer 7 = SQLi/XSS.</p>
          </Section>

          <Section title="TCP/IP — the practical model">
            <p>OSI is theoretical. The internet runs on a 4-layer TCP/IP model:</p>
            <Code lang="text">{`Application   HTTP, DNS, SSH, …    (= OSI 5-7)
Transport     TCP, UDP             (= OSI 4)
Internet      IP, ICMP             (= OSI 3)
Link          Ethernet, WiFi       (= OSI 1-2)`}</Code>
          </Section>

          <Section title="IP addresses — the core">
            <p>Every host on a network has a unique IP. IPv4 = four 0-255 numbers: <span className="eng">192.168.1.5</span>.</p>
            <ul>
              <li><b>Public IPs</b> — reachable from the internet.</li>
              <li><b>Private IPs</b> (RFC 1918) — internal: <span className="eng">10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16</span>.</li>
              <li><b>Loopback</b>: <span className="eng">127.0.0.1</span> = the host itself.</li>
              <li><b>Subnet mask</b> defines &quot;my network&quot;. <span className="eng">/24</span> = 254 hosts.</li>
            </ul>
            <Code lang="text">{`192.168.1.0/24
        │     │
        │     └── prefix length — first 24 bits identify the network
        └────── network = 192.168.1.0
                host range = 192.168.1.1 - 192.168.1.254
                bcast = 192.168.1.255`}</Code>
          </Section>

          <Section title="TCP vs UDP">
            <TwoCol>
              <Card title="TCP — reliable" color="blue">
                <ul>
                  <li>Three-way handshake (SYN → SYN-ACK → ACK).</li>
                  <li>Guarantees ordering and delivery.</li>
                  <li>Retransmits if a packet is lost.</li>
                  <li>Used by: HTTP, HTTPS, SSH, SMB, RDP.</li>
                </ul>
              </Card>
              <Card title="UDP — fast, no guarantees" color="amber">
                <ul>
                  <li>Fire-and-forget.</li>
                  <li>No handshake.</li>
                  <li>Packets may drop, may reorder.</li>
                  <li>Used by: DNS, NTP, VoIP, VPN.</li>
                </ul>
              </Card>
            </TwoCol>
            <Callout kind="info" title="Why this matters in security">
              TCP scans are precise (open / closed / filtered). UDP scans are slower and less reliable because there&apos;s no default ACK.
            </Callout>
          </Section>

          <Section title="Important ports (well-known)">
            <Code lang="text">{`20/21    FTP            (file transfer — old, cleartext)
22       SSH            (key management protocol)
23       Telnet         (cleartext — should be banned)
25       SMTP           (mail submission)
53       DNS            (UDP usually, TCP sometimes)
80       HTTP
110      POP3
135      RPC            (Windows)
139, 445 SMB            (Windows file share — high-value target)
143      IMAP
389      LDAP           (AD directory)
443      HTTPS
445      SMB
465/587  SMTP+TLS
587      SMTP submission
636      LDAPS
993      IMAPS
995      POP3S
1433     MSSQL
3306     MySQL
3389     RDP            (Remote Desktop)
5985/5986 WinRM         (PowerShell remote)
8080     HTTP-alt (proxy)
8443     HTTPS-alt`}</Code>
            <p>Memorizing this is half of nmap. Port 445 open = SMB = maybe EternalBlue.</p>
          </Section>

          <Section title="DNS — how a name becomes an IP">
            <Step n={1} title="You type example.com">
              <p>The host asks: &quot;what is the IP for example.com?&quot;</p>
            </Step>
            <Step n={2} title="Local lookup first">
              <p>Checks <span className="eng">/etc/hosts</span> (or <span className="eng">C:\\Windows\\System32\\drivers\\etc\\hosts</span>), then cache.</p>
            </Step>
            <Step n={3} title="If absent, ask a DNS resolver">
              <p>Usually the ISP, or 8.8.8.8 (Google), or 1.1.1.1 (Cloudflare).</p>
            </Step>
            <Step n={4} title="The resolver walks a chain">
              <p>Root → TLD (.com) → authoritative server for example.com → answer: <span className="eng">93.184.216.34</span>.</p>
            </Step>
            <Terminal lines={[
              { p: "dig example.com               # full DNS query" },
              { p: "dig example.com MX            # mail servers" },
              { p: "dig example.com TXT           # text records (SPF, DKIM)" },
              { p: "dig @8.8.8.8 example.com      # ask a specific server" },
              { p: "dig -x 93.184.216.34          # reverse lookup (PTR)" },
            ]} />
            <Callout kind="info" title="Important DNS record types">
              <span className="eng">A</span> = IPv4, <span className="eng">AAAA</span> = IPv6, <span className="eng">CNAME</span> = alias, <span className="eng">MX</span> = mail, <span className="eng">NS</span> = nameserver, <span className="eng">TXT</span> = text (SPF/DKIM/DMARC matter for email security).
            </Callout>
          </Section>

          <Section title="HTTP — the language of the web">
            <p>Every web page = an HTTP request + response. Request:</p>
            <Code lang="http">{`GET /index.html HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: text/html
Cookie: session=abc123

`}</Code>
            <p>Response:</p>
            <Code lang="http">{`HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1256
Set-Cookie: session=xyz789
Server: nginx/1.24

<html>...</html>`}</Code>
            <ul>
              <li><b>Status codes:</b> 2xx success, 3xx redirect, 4xx client error (404, 401, 403), 5xx server error (500, 502).</li>
              <li><b>Methods:</b> GET (read), POST (submit), PUT/PATCH (update), DELETE.</li>
              <li><b>Security-relevant headers:</b> <span className="eng">Cookie, Authorization, X-Forwarded-For, Host, Origin, Referer, Content-Security-Policy</span>.</li>
            </ul>
          </Section>

          <Section title="ARP — how machines actually talk on a LAN">
            <p>On a local network, hosts identify each other by MAC, not IP. ARP maps one to the other.</p>
            <Terminal lines={[
              { p: "# current ARP table:" },
              { p: "arp -a                    # everyone you've talked to" },
              { p: "" },
              { p: "# example:" },
              { o: "10.10.10.5  at  08:00:27:ab:cd:ef  on eth0" },
            ]} />
            <Callout kind="info" title="ARP poisoning">
              The attacker answers ARP queries with their own MAC. They become a man-in-the-middle for all traffic between victim and gateway. Old technique — still works on networks without 802.1X.
            </Callout>
          </Section>

          <Section title="Wireshark — reading packets">
            <p>Wireshark = the tool to capture and analyze packets. Without it, you&apos;re neither a serious defender nor a literate attacker.</p>
            <Code lang="text">{`Useful filters:
ip.addr == 10.10.10.5         packets to/from an IP
tcp.port == 443                specific port
http                           HTTP only
http.request.method == "POST"  POST requests
dns                            DNS
tcp.flags.syn == 1 && tcp.flags.ack == 0   SYN-only (port scan)
tls.handshake.type == 1        TLS Client Hello (reveals SNI)`}</Code>
            <Terminal lines={[
              { p: "# Linux CLI:" },
              { p: "sudo tshark -i eth0 -f 'port 80' -Y 'http.request' -T fields -e http.request.method -e http.host -e http.request.uri" },
            ]} />
          </Section>

          <Section title="NAT and firewalls — quick">
            <ul>
              <li><b>NAT:</b> your home router rewrites internal addresses (192.168.1.10) to a public address (203.x.x.x). Every device looks like one IP from the internet.</li>
              <li><b>Firewall:</b> allow/deny rules on ports, IPs, protocols.</li>
              <li><b>Stateful firewall:</b> remembers sessions. If you opened a connection outbound, the reply is allowed back.</li>
              <li><b>Egress filtering:</b> restricting what leaves your network. Many enterprises forget this — which is why C2 over port 443 just works.</li>
            </ul>
          </Section>

          <Section title="Practice">
            <ol>
              <li>Open Wireshark on Kali, capture for 30 seconds, understand what you see.</li>
              <li>Visit a plain-HTTP site, capture, follow TCP stream, read the raw HTTP.</li>
              <li><span className="eng">dig</span> 5 different domains and look at the record differences.</li>
              <li>Practice subnetting:</li>
            </ol>
            <Code lang="bash">{`ipcalc 192.168.1.0/24
# Network:    192.168.1.0
# Hosts:      192.168.1.1 - 192.168.1.254
# Broadcast:  192.168.1.255`}</Code>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
