"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="network-forensics">
      <L
        ar={<>
          <Section title="لماذا الـ Network Forensics لا غنى عنه">
            <p>المهاجم يقدر يمسح logs الـ endpoint، يشيل ملفات، يقفل EDR. بس الشبكة لو <b>بتسجّل اللي بيمر</b>، مش هيقدر يلغي اللي قاله في السلك. <b>The network never lies</b>.</p>
            <Analogy>زي الـ ECG في غرفة العمليات — بيسجّل كل دقة قلب لحظة بلحظة. الجراح ممكن ينسى، الممرض ممكن يغلط، الشريط مش بيكدب.</Analogy>
            <Callout kind="info" title="القاعدة">
              في أي حادث جدّي: اسأل الأول "إيه الـ traffic data المتاح؟" قبل ما تبص للـ host خالص.
            </Callout>
          </Section>

          <Section title="مصادر البيانات — متى تستخدم ماذا">
            <TwoCol>
              <Card title="Full Packet Capture (PCAP)" color="red">
                كل byte. أعلى دقة. حجم ضخم (TB/يوم). عادة بيتخزّن 7–30 يوم على المحيط.
              </Card>
              <Card title="Zeek logs (Bro)" color="blue">
                Metadata غنية: connection logs, DNS, HTTP, SSL, files. ~1% من حجم PCAP. تحفة في الـ hunting الطويل.
              </Card>
              <Card title="NetFlow / IPFIX / sFlow" color="amber">
                Source/Dest IP, Port, Bytes, Packets. مفيش content. أصغر بكتير. الأحسن للـ baselining الطويل.
              </Card>
              <Card title="Suricata / Snort alerts" color="red">
                IDS — تنبيهات على signatures معروفة. بيكمّل PCAP، مش بيحلّ محله.
              </Card>
              <Card title="Firewall logs" color="green">
                Allow/Deny. موجود دايماً، أساسي للـ audit.
              </Card>
              <Card title="DNS / DHCP / Proxy logs" color="green">
                ماتقللش من قيمتها. DNS + DHCP lease بيقولوك مين كان IP X الساعة كذا.
              </Card>
            </TwoCol>
          </Section>

          <Section title="Wireshark — أساسيات حقيقية">
            <p>افتح الـ pcap. أول حاجة هتعملها:</p>
            <ol>
              <li><b>Statistics → Conversations</b> — مين اتكلّم مع مين، وكام بايت؟</li>
              <li><b>Statistics → Protocol Hierarchy</b> — توزيع البروتوكولات. فيه حاجة شاذة؟</li>
              <li><b>Statistics → Endpoints</b> — قايمة كل الأجهزة الموجودة.</li>
              <li><b>File → Export Objects</b> — طلّع الملفات من HTTP/SMB/FTP.</li>
            </ol>
            <Code lang="text">{`# أهم display filters في Wireshark
ip.addr == 192.168.1.10                  # كل ما يخص IP
tcp.port == 445                          # SMB
http.request                             # طلبات HTTP فقط
http contains "password"                 # نص في HTTP
dns.qry.name contains "evil"             # DNS lookups
tls.handshake.extensions_server_name      # SNI
frame.time >= "2026-04-30 14:00:00"      # نطاق زمني
tcp.analysis.flags                       # مؤشرات شذوذ TCP
tcp.stream eq 5                          # كل packets في session معينة
ip.geoip.country != "US"                 # خارج الولايات (يحتاج GeoIP plugin)`}</Code>
          </Section>

          <Section title="استعادة محادثة TCP — أهم تقنية">
            <p>كل اتصال TCP ليه stream برقم. في Wireshark: <b>Right-click → Follow → TCP Stream</b>. هتشوف المحادثة كلها كنص.</p>
            <Callout kind="info" title="إيه اللي هتدور عليه">
              <ul>
                <li><b>HTTP غير مشفّر</b> — باسوردات، session cookies، مرفقات.</li>
                <li><b>FTP</b> — USER/PASS صريحين. حدّد الملفات اللي اتنقلت.</li>
                <li><b>SMTP</b> — رسايل ومرفقات base64، تقدر تطلّعهم.</li>
                <li><b>Telnet</b> — كل keystroke. لو لقيته، ادور في كل pcap على أوامر مكتوبة.</li>
                <li><b>SMB</b> — الملفات المنقولة (Wireshark بيطلّعهالك).</li>
              </ul>
            </Callout>
          </Section>

          <Section title="tshark — Wireshark على سطر الأوامر">
            <Terminal lines={[
              { p: "# قائمة كل HTTP requests" },
              { p: "tshark -r capture.pcap -Y 'http.request' -T fields -e ip.src -e http.host -e http.request.uri" },
              { p: "" },
              { p: "# استخراج كل DNS queries" },
              { p: "tshark -r capture.pcap -Y 'dns.qry.name' -T fields -e dns.qry.name | sort -u" },
              { p: "" },
              { p: "# جميع SNI من TLS" },
              { p: "tshark -r capture.pcap -Y 'tls.handshake.type==1' -T fields -e tls.handshake.extensions_server_name" },
              { p: "" },
              { p: "# top talkers" },
              { p: "tshark -r capture.pcap -q -z conv,ip | head -20" },
              { p: "" },
              { p: "# استخراج files من HTTP" },
              { p: "tshark -r capture.pcap --export-objects http,/tmp/extract" },
              { p: "ls /tmp/extract/" },
            ]} />
          </Section>

          <Section title="Zeek — أداة المحقّقين الجدّية">
            <p>Zeek بيحوّل الـ traffic لـ logs منظمة. ملفات tab-separated، سهلة جداً مع grep.</p>
            <Code lang="bash">{`# تشغيل Zeek على pcap
zeek -r capture.pcap

# يولّد: conn.log, dns.log, http.log, ssl.log, files.log, weird.log, notice.log

# zeek-cut يفلتر الأعمدة
cat conn.log | zeek-cut id.orig_h id.resp_h id.resp_p service duration orig_bytes resp_bytes
cat dns.log | zeek-cut id.orig_h query qtype_name answers | sort -u
cat http.log | zeek-cut id.orig_h host uri user_agent

# files.log — كل ملف عبر الشبكة مع hash
cat files.log | zeek-cut tx_hosts rx_hosts mime_type filename md5 sha1

# weird.log — شذوذات بروتوكولية
cat weird.log | zeek-cut id.orig_h name`}</Code>
            <Callout kind="info" title="نصيحة">
              للـ hunting الطويل، شحن Zeek logs على Splunk/ELK. وبعدين استعلم بـ SPL/KQL — تجمع عمق Zeek مع سرعة الـ SIEM.
            </Callout>
          </Section>

          <Section title="Suricata — IDS/IPS قوي مفتوح المصدر">
            <p>Suricata بيطبّق rules على ترافيك حي ويطلّع تنبيهات. صيغة القواعد قريبة جداً من Snort.</p>
            <Code lang="text">{`# مثال قاعدة — كشف Cobalt Strike default certificate
alert tls any any -> any any (msg:"Cobalt Strike default cert"; \\
  tls.cert_subject; content:"CN=major"; \\
  classtype:trojan-activity; sid:2030001; rev:1;)

# قاعدة كشف DNS query لـ TLD مشبوه
alert dns any any -> any any (msg:"DNS query to .top TLD"; \\
  dns.query; content:".top"; endswith; \\
  classtype:bad-unknown; sid:2030002; rev:1;)`}</Code>
            <p>قواعد جاهزة: <b>Emerging Threats Open</b> (مجاني)، <b>ETPro</b> (مدفوع)، <b>SELKS</b> (Suricata + ELK في باكدج واحد).</p>
          </Section>

          <Section title="مؤشّرات شائعة في pcap حادث">
            <Callout kind="good" title="دور على الحاجات دي">
              <ol>
                <li><b>Beaconing منتظم</b> — connection كل 60s لنفس الـ domain. ده C2 كلاسيك.</li>
                <li><b>User-Agent غريب</b> — <span className="eng">curl/8.4</span> من workstation، أو <span className="eng">python-requests</span>.</li>
                <li><b>JA3/JA3S hashes</b> — بصمة TLS handshake. أغلب malware ليها JA3 ثابت يفضحها.</li>
                <li><b>HTTPS Direct-to-IP</b> — اتصال TLS من غير ما يحصل DNS lookup قبله = مشبوه.</li>
                <li><b>SMB من workstation لـ workstation</b> — lateral movement.</li>
                <li><b>TXT records طويلة</b> — DNS tunneling.</li>
                <li><b>Burst exfil</b> — 5GB upload في 10 دقايق من host ما عملش كده قبل كده.</li>
                <li><b>RDP بره ساعات الشغل</b> — أو من IP خارجي على طول.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="JA3 / JA3S — بصمة TLS">
            <p>JA3 = MD5 لترتيب TLS Client Hello extensions. JA3S = نفس الفكرة بس على الـ Server Hello. كل client/server ليه بصمة، والـ malware عادة بصمته ثابتة.</p>
            <Code lang="bash">{`# tshark استخراج JA3 (يحتاج plugin)
tshark -r capture.pcap -T fields -e tls.handshake.ja3 -e tls.handshake.ja3_full \\
  -Y 'tls.handshake.type==1' | sort -u

# أو من Zeek مع plugin ja3
cat ssl.log | zeek-cut id.orig_h server_name ja3 ja3s

# ابحث عن JA3 في abuse.ch SSL Blacklist
curl -s "https://sslbl.abuse.ch/api/v1/?ja3_hash=72a589da586844d7f0818ce684948eea"`}</Code>
          </Section>

          <Section title="RITA — كشف beaconing تلقائياً">
            <p>RITA (من Black Hills Infosec، مفتوح المصدر) بياخد Zeek logs ويحلّل الـ frequency والـ jitter ليطلّع الـ beacons.</p>
            <Code lang="bash">{`# استيراد Zeek logs
rita import /opt/zeek/logs/* mydataset

# عرض قائمة beacons
rita show-beacons mydataset

# Output:
# Score    Source IP        Destination IP    Connections    Avg Bytes    Intvl
# 0.978    10.0.0.5         185.x.x.x         286            612          60s
# 0.945    10.0.0.12        evil.com          179            512          120s

# طويل وفعّال جداً ضد Cobalt Strike, Sliver, custom C2`}</Code>
          </Section>

          <Section title="Federal context — اعتبارات قانونية">
            <Callout kind="danger" title="حدود الـ Network capture">
              التقاط الترافيك في بيئة فيدرالية بيقع تحت <b>Title III</b> (Wiretap Act) و<b>ECPA</b>. القاعدة العامة:
              <ul>
                <li><b>Banner / acceptable-use policy</b> ضروري — بيقول للمستخدم إن الشبكة مراقبة. ده "consent" قانوني.</li>
                <li>أي capture بره الـ consent ده محتاج <b>court order / Pen Register / Trap-and-Trace</b> أو wiretap warrant كامل.</li>
                <li>Metadata (NetFlow, headers) قواعدها مختلفة عن content (PCAP body).</li>
                <li>وقت الشك — <b>اسأل OGC أو الـ Legal team قبل الـ capture</b>. ومتناقشش قرارات قانونية في chat أبداً.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="ممارسات أفضل">
            <ol>
              <li>سجّل JA3/JA3S على كل egress.</li>
              <li>Zeek على mirror port من core switch ← Splunk/ELK.</li>
              <li>RITA يومي على آخر 24 ساعة.</li>
              <li>Suricata بـ ETPro rules + قواعد خاصة بالمؤسسة.</li>
              <li>Full PCAP على الـ edge مع rotation 7–14 يوم (على حسب الـ storage عندك).</li>
              <li>NetFlow طويل المدى (90+ يوم) للـ retroactive hunts.</li>
              <li>وقّف TLS inspection لو القانون مش سامح، بس سجّل Metadata + JA3.</li>
            </ol>
          </Section>
        </>}
        en={<>
          <Section title="Why network forensics is non-negotiable">
            <p>Attackers can wipe endpoint logs, delete files, disable EDR. But if the network is <b>recording the wire</b>, they can't unsay what they said on it. <b>The network never lies.</b></p>
            <Analogy>An OR's ECG records every heartbeat continuously. The surgeon may forget, the nurse may misremember — the trace doesn't lie.</Analogy>
            <Callout kind="info" title="Rule">
              On every serious incident: ask "what traffic data do we have?" before you look at the host.
            </Callout>
          </Section>

          <Section title="Data sources — when to use which">
            <TwoCol>
              <Card title="Full packet capture (PCAP)" color="red">
                Every byte. Maximum fidelity. Big (TB/day). Typically retained 7–30 days at the perimeter.
              </Card>
              <Card title="Zeek logs (Bro)" color="blue">
                Rich metadata: conn, DNS, HTTP, SSL, files. ~1% of PCAP size. Excellent for long-window hunts.
              </Card>
              <Card title="NetFlow / IPFIX / sFlow" color="amber">
                Source/dest IP, port, bytes, packets. No content. Tiny. Best for long-term baselining.
              </Card>
              <Card title="Suricata / Snort alerts" color="red">
                Signature-based IDS hits. Complements, doesn't replace PCAP.
              </Card>
              <Card title="Firewall logs" color="green">
                Allow/deny records. Always available, audit foundation.
              </Card>
              <Card title="DNS / DHCP / Proxy logs" color="green">
                Don't underestimate them. DNS + DHCP lease = "who was IP X at time Y?".
              </Card>
            </TwoCol>
          </Section>

          <Section title="Wireshark — real fundamentals">
            <p>Open a pcap. First moves:</p>
            <ol>
              <li><b>Statistics → Conversations</b> — which IPs talked the most, how many bytes?</li>
              <li><b>Statistics → Protocol Hierarchy</b> — protocol distribution. Anything unusual?</li>
              <li><b>Statistics → Endpoints</b> — every host on the wire.</li>
              <li><b>File → Export Objects</b> — extract files from HTTP/SMB/FTP.</li>
            </ol>
            <Code lang="text">{`# Top Wireshark display filters
ip.addr == 192.168.1.10                  # everything for one IP
tcp.port == 445                          # SMB
http.request                             # HTTP requests only
http contains "password"                 # text inside HTTP
dns.qry.name contains "evil"             # DNS lookups
tls.handshake.extensions_server_name      # SNI
frame.time >= "2026-04-30 14:00:00"      # time window
tcp.analysis.flags                       # TCP anomalies
tcp.stream eq 5                          # one full session
ip.geoip.country != "US"                 # foreign (needs GeoIP plugin)`}</Code>
          </Section>

          <Section title="Reconstructing TCP conversations — the headline skill">
            <p>Every TCP connection has a stream number. In Wireshark: <b>Right-click → Follow → TCP Stream</b>. The conversation reads as text.</p>
            <Callout kind="info" title="What to look for">
              <ul>
                <li><b>Cleartext HTTP</b> — passwords, session cookies, attachments.</li>
                <li><b>FTP</b> — USER/PASS in plaintext. Identify transferred files.</li>
                <li><b>SMTP</b> — messages, base64 attachments — extractable.</li>
                <li><b>Telnet</b> — every keystroke. If present, scan all pcaps for typed commands.</li>
                <li><b>SMB</b> — list transferred files (Wireshark exports them).</li>
              </ul>
            </Callout>
          </Section>

          <Section title="tshark — Wireshark on the command line">
            <Terminal lines={[
              { p: "# All HTTP requests" },
              { p: "tshark -r capture.pcap -Y 'http.request' -T fields -e ip.src -e http.host -e http.request.uri" },
              { p: "" },
              { p: "# Every DNS query" },
              { p: "tshark -r capture.pcap -Y 'dns.qry.name' -T fields -e dns.qry.name | sort -u" },
              { p: "" },
              { p: "# All SNI from TLS" },
              { p: "tshark -r capture.pcap -Y 'tls.handshake.type==1' -T fields -e tls.handshake.extensions_server_name" },
              { p: "" },
              { p: "# Top talkers" },
              { p: "tshark -r capture.pcap -q -z conv,ip | head -20" },
              { p: "" },
              { p: "# Export HTTP files" },
              { p: "tshark -r capture.pcap --export-objects http,/tmp/extract" },
              { p: "ls /tmp/extract/" },
            ]} />
          </Section>

          <Section title="Zeek — the serious investigator's tool">
            <p>Zeek converts traffic into structured logs. Tab-separated text, easy to grep.</p>
            <Code lang="bash">{`# Run Zeek on a pcap
zeek -r capture.pcap

# Generates: conn.log, dns.log, http.log, ssl.log, files.log, weird.log, notice.log

# zeek-cut filters columns
cat conn.log | zeek-cut id.orig_h id.resp_h id.resp_p service duration orig_bytes resp_bytes
cat dns.log | zeek-cut id.orig_h query qtype_name answers | sort -u
cat http.log | zeek-cut id.orig_h host uri user_agent

# files.log — every file across the wire with hashes
cat files.log | zeek-cut tx_hosts rx_hosts mime_type filename md5 sha1

# weird.log — protocol anomalies
cat weird.log | zeek-cut id.orig_h name`}</Code>
            <Callout kind="info" title="Tip">
              For long-term hunting, ship Zeek logs into Splunk/ELK. Then query with SPL/KQL — combines Zeek's depth with SIEM speed.
            </Callout>
          </Section>

          <Section title="Suricata — strong open-source IDS/IPS">
            <p>Suricata applies rules to live traffic and emits alerts. Rule syntax is largely Snort-compatible.</p>
            <Code lang="text">{`# Example rule — Cobalt Strike default cert
alert tls any any -> any any (msg:"Cobalt Strike default cert"; \\
  tls.cert_subject; content:"CN=major"; \\
  classtype:trojan-activity; sid:2030001; rev:1;)

# DNS query to suspicious TLD
alert dns any any -> any any (msg:"DNS query to .top TLD"; \\
  dns.query; content:".top"; endswith; \\
  classtype:bad-unknown; sid:2030002; rev:1;)`}</Code>
            <p>Rule sources: <b>Emerging Threats Open</b> (free), <b>ETPro</b> (paid), <b>SELKS</b> (Suricata + ELK bundle).</p>
          </Section>

          <Section title="Common indicators in incident pcaps">
            <Callout kind="good" title="Hunt for these">
              <ol>
                <li><b>Regular beaconing</b> — connection every 60s to the same domain. Classic C2.</li>
                <li><b>Unusual User-Agent</b> — <span className="eng">curl/8.4</span> from a workstation, <span className="eng">python-requests</span>.</li>
                <li><b>JA3/JA3S hashes</b> — TLS handshake fingerprint. Malware often has a stable JA3.</li>
                <li><b>HTTPS direct-to-IP</b> — TLS connection without prior DNS lookup = suspicious.</li>
                <li><b>Workstation-to-workstation SMB</b> — lateral movement.</li>
                <li><b>Long TXT records</b> — DNS tunneling.</li>
                <li><b>Burst exfil</b> — 5GB upload in 10 minutes from a host that never did that before.</li>
                <li><b>RDP outside business hours</b> — or directly from a foreign IP.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="JA3 / JA3S — TLS fingerprint">
            <p>JA3 = MD5 of the TLS Client Hello extension order. JA3S = same idea for the Server Hello. Each client/server has a unique fingerprint; malware often has a stable JA3.</p>
            <Code lang="bash">{`# tshark — extract JA3 (plugin needed)
tshark -r capture.pcap -T fields -e tls.handshake.ja3 -e tls.handshake.ja3_full \\
  -Y 'tls.handshake.type==1' | sort -u

# Or via Zeek with the ja3 plugin
cat ssl.log | zeek-cut id.orig_h server_name ja3 ja3s

# Lookup against abuse.ch SSL Blacklist
curl -s "https://sslbl.abuse.ch/api/v1/?ja3_hash=72a589da586844d7f0818ce684948eea"`}</Code>
          </Section>

          <Section title="RITA — automated beacon hunting">
            <p>RITA (Black Hills Infosec, open source) ingests Zeek logs and analyzes frequency and jitter to surface beacons.</p>
            <Code lang="bash">{`# Import Zeek logs
rita import /opt/zeek/logs/* mydataset

# Show beacons
rita show-beacons mydataset

# Output:
# Score    Source IP        Destination IP    Connections    Avg Bytes    Intvl
# 0.978    10.0.0.5         185.x.x.x         286            612          60s
# 0.945    10.0.0.12        evil.com          179            512          120s

# Highly effective against Cobalt Strike, Sliver, custom C2`}</Code>
          </Section>

          <Section title="Federal context — legal considerations">
            <Callout kind="danger" title="Limits on network capture">
              Capturing traffic in a federal environment falls under <b>Title III</b> (Wiretap Act) and <b>ECPA</b>. General rules:
              <ul>
                <li><b>Banner / acceptable-use policy</b> is essential — informs users the network is monitored. That's legal "consent".</li>
                <li>Capture outside that consent typically requires a <b>court order, Pen Register / Trap-and-Trace</b>, or a full wiretap warrant.</li>
                <li>Metadata (NetFlow, headers) lives under different rules than content (PCAP body).</li>
                <li>When in doubt — <b>ask OGC or your legal team before capture</b>. Never debate legal questions in chat.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Best practices">
            <ol>
              <li>Log JA3/JA3S on every egress.</li>
              <li>Zeek on a mirror port off the core switch → Splunk/ELK.</li>
              <li>RITA daily over the last 24h.</li>
              <li>Suricata with ETPro rules + custom org rules.</li>
              <li>Full PCAP at the edge with 7–14 day rotation (depending on storage).</li>
              <li>Long-term NetFlow (90+ days) for retroactive hunts.</li>
              <li>Skip TLS inspection where law forbids it but capture metadata + JA3.</li>
            </ol>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
