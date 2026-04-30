"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="network-attacks">
      <L
        ar={<>
          <Section title="بروتوكولات الإنترنت بُنيت على الثقة">
            <Analogy>الإنترنت اتبنى سنة 1969 على فرضية: «كل اللي على الشبكة دي موثوقين». BGP، DNS، ARP، NTP — كلهم اتصمموا قبل ما المهاجمين يكونوا موجودين أصلاً. النهارده إحنا بنركّب طبقات ثقة (TLS, BGPsec, DNSSEC, RPKI) فوق الأساس الهش ده. الدرس ده بيكشفلك الطبقة اللي تحت.</Analogy>
            <Callout kind="danger" title="مخاطر عالية">
              الهجمات دي بتأثر على بنية تحتية مشتركة. أي اختبار برّه معمل معزول ممكن يضر أطراف تالتة بشكل جدّي،
              ويتحسب جريمة قانونياً. تركيزنا هنا: <b>إزاي تكتشفها وتتحصّن ضدها كجهة حكومية</b>.
            </Callout>
          </Section>

          <Section title="BGP Hijacking — اختطاف الإنترنت">
            <p>BGP هو «نظام المرور» على الإنترنت. كل ASN بيعلن الـ IP ranges اللي يملكها، والـ routers بتختار أقصر سكة. حد أعلن كذب إنه صاحب range مش بتاعه؟ الترافيك هيمشي عنده.</p>
            <h3>أنواع الهجوم</h3>
            <ul>
              <li><b>Prefix Hijack</b> — أعلن /24 بتاع Google. الـ ASNs القريبة منك هتوجّه الترافيك ليك.</li>
              <li><b>Sub-prefix hijack</b> — /25 أكتر تحديداً بيكسب على الـ /24 الأصلي (BGP بيفضّل الأطول).</li>
              <li><b>Route Leak</b> — مزود بينشر مسارات customer لـ peers بالغلط (Pakistan Telecom / YouTube 2008).</li>
              <li><b>BGP for DDoS amplification</b>.</li>
            </ul>
            <h3>حوادث مشهورة</h3>
            <ul>
              <li><b>2008 Pakistan → YouTube</b> — YouTube غاب عن العالم ساعتين.</li>
              <li><b>2017 Rostelecom</b> — خطف ترافيك Google, Apple, Facebook لدقائق.</li>
              <li><b>2018 Amazon Route 53</b> — استهدف MyEtherWallet، سرقوا $150K.</li>
              <li><b>2022 KlaySwap</b> — BGP hijack جاب $1.9M.</li>
            </ul>
            <Callout kind="good" title="الدفاع">
              <ol>
                <li><b>RPKI (Resource Public Key Infrastructure)</b> — توقيع تشفيري للملكية. الـ ASNs بترفض الإعلانات غير الموقّعة.</li>
                <li><b>BGPsec</b> — توقيع المسار كله مش الملكية بس.</li>
                <li>مبادرة <b>MANRS</b> — أحسن الممارسات.</li>
                <li>اشترك في خدمة مراقبة (BGPStream, ThousandEyes, Kentik) عشان تيجيلك تنبيهات على طول.</li>
                <li>راقب إعلانات الـ prefix بتاعك من <b>RIPE RIS, RouteViews</b>.</li>
                <li>اطلب من upstream ISPs يطبّقوا <b>strict prefix filtering</b>.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="DNS Attacks">
            <h3>1) DNS Cache Poisoning (Kaminsky)</h3>
            <p>الردود على DNS بتيجي بـ ID طوله 16-bit بس. المهاجم لو خمّن الـ ID قبل ما الرد الأصلي يوصل، رده المزيف بيدخل الـ cache.</p>
            <p>سنة 2008 ثغرة Kaminsky خلّت الهجوم ده يحصل في ثواني. الحل: <b>port randomization + DNSSEC</b>.</p>
            <h3>2) DNS Tunneling</h3>
            <Code lang="payload">{`# قنوات سرية عبر DNS — يصعب حجبها
iodine, dnscat2, DNSStager
# بيانات السرقة في NULL/TXT records
# C2 كامل عبر DNS فقط`}</Code>
            <h3>3) DNS Rebinding</h3>
            <p>المهاجم متحكّم في DNS server. أول lookup بيرجّع IP عام، التاني بيرجّع 127.0.0.1. وأنت كده وقعت من غير ما تحس.</p>
            <Code lang="attack flow">{`1. الضحية يفتح evil.com (في المتصفح)
2. evil.com يرجع 1.2.3.4 → JS يحمّل
3. JS ينام دقيقة، DNS TTL = 0
4. JS يطلب evil.com مرة أخرى → الآن يرجع 192.168.1.1
5. JS الآن يصل router الضحية، router admin panel، أي شيء داخلي
   كل ذلك بنفس الـ origin، فلا CORS يمنعه`}</Code>
            <Callout kind="good" title="الدفاع">
              <ul>
                <li><b>Host header validation</b> على كل خدمة داخلية، حتى لو افتكرت إنها مش متشافة.</li>
                <li>اطلب authentication دايماً. «هي شبكة داخلية» مش مبرّر.</li>
                <li>في المتصفح: التطبيقات المهمة تستخدم WebAuthn / origin-bound tokens.</li>
                <li>حدّد <b>min DNS TTL</b> في الـ resolver للـ private IPs.</li>
              </ul>
            </Callout>
            <h3>4) DNSSEC وحالة المعركة</h3>
            <ul>
              <li>DNSSEC بيوقّع كل records — يقفل الـ poisoning بشكل نهائي.</li>
              <li>التطبيق محدود (~30% عالمياً)، يعني المعركة لسه شغّالة.</li>
              <li>هجمات NSEC walking بتكشفلك كل subdomain موجود في الـ zone.</li>
            </ul>
          </Section>

          <Section title="ARP Spoofing — ملك الشبكات المحلية">
            <p>ARP مفيهوش authentication. أي جهاز على الشبكة يقدر يقول «أنا 192.168.1.1» والكل بيصدّق.</p>
            <Code lang="bash">{`# inside a lab network only
sudo arpspoof -i eth0 -t VICTIM_IP GATEWAY_IP
sudo arpspoof -i eth0 -t GATEWAY_IP VICTIM_IP
echo 1 > /proc/sys/net/ipv4/ip_forward

# أو أداة شاملة
ettercap -T -M arp:remote /VICTIM// /GATEWAY//
bettercap -iface eth0`}</Code>
            <h3>تأثيرات</h3>
            <ul>
              <li>MITM على كل ترافيك الضحية.</li>
              <li>SSL stripping لو الموقع مش مفعّل HSTS.</li>
              <li>حقن JavaScript في الـ HTTP responses.</li>
              <li>DNS spoofing داخل الـ session نفسها.</li>
            </ul>
            <Callout kind="good" title="الدفاع">
              <ul>
                <li><b>DAI (Dynamic ARP Inspection)</b> على الـ switches.</li>
                <li>DHCP snooping + IP source guard.</li>
                <li>802.1X — يمنع أي جهاز مش متصرّح يدخل الشبكة من الأول.</li>
                <li>HSTS preload + certificate pinning بيقفلوا SSL stripping.</li>
                <li>راقب جدول ARP لأي تغيير مفاجئ (arpwatch).</li>
              </ul>
            </Callout>
          </Section>

          <Section title="DHCP Attacks">
            <ul>
              <li><b>DHCP Starvation</b> — تستهلك كل الـ pool بطلبات وهمية.</li>
              <li><b>Rogue DHCP</b> — ترد على الطلبات أسرع من السيرفر الأصلي → DNS بتاعك، gateway بتاعك.</li>
              <li><b>DHCPv6</b> + <b>mitm6</b> — هجوم شائع جداً على Active Directory (شفناه في درس Advanced AD).</li>
            </ul>
            <p>الدفاع: <b>DHCP Snooping</b> على الـ switches، وحدّد trusted ports بس.</p>
          </Section>

          <Section title="NTP — الزمن سلاح">
            <ul>
              <li><b>NTP Amplification</b>: طلب <code>monlist</code> بيرجّع رد ~200x — استُخدم في DDoS بـ 400 Gbps.</li>
              <li><b>NTP Time Manipulation</b>: تحرّك ساعة الضحية = تكسر شهادات TLS وKerberos وTOTP.</li>
              <li>الدفاع: <b>NTS (Network Time Security)</b>، و<b>chrony</b> بدل <code>ntpd</code> القديم.</li>
            </ul>
          </Section>

          <Section title="DDoS — تحت المجهر">
            <h3>طبقات الهجوم</h3>
            <TwoCol>
              <Card title="L3/L4 — Volumetric" color="red">
                SYN flood, UDP flood, NTP/DNS/Memcached amplification. بتقاس بـ Gbps أو Mpps.
              </Card>
              <Card title="L7 — Application" color="red">
                HTTP flood, Slowloris, slow POST. بيستهدف الموارد مش الخط نفسه. أصعب واحد في الكشف.
              </Card>
              <Card title="Protocol" color="red">
                Smurf, Ping of Death (تاريخي)، TCP state exhaustion.
              </Card>
              <Card title="Reflection / Amplification" color="red">
                طلب صغير → رد ضخم → بـ IP مزوّر للضحية. NTP, DNS, Memcached, CLDAP, SNMP.
              </Card>
            </TwoCol>
            <h3>الدفاع الحقيقي</h3>
            <ol>
              <li>مزود <b>scrubbing</b>: Cloudflare, Akamai Prolexic, AWS Shield Advanced, Imperva.</li>
              <li><b>Anycast</b> يوزّع الحمل جغرافياً.</li>
              <li>قلّل سطح UDP (متفتحش خدمات قابلة للـ amplification علناً).</li>
              <li>BCP38 (anti-spoofing) عند الـ ISP.</li>
              <li>تخطيط سعة + اتفاقيات DDoS-protection جاهزة قبل ما الكارثة تيجي.</li>
              <li>على مستوى التطبيق: rate limit + caching + CAPTCHA + bot management.</li>
            </ol>
          </Section>

          <Section title="TLS Attacks الكلاسيكية">
            <ul>
              <li><b>SSL Strip</b> — يخفض الاتصال لـ HTTP — يقفله HSTS + preload.</li>
              <li><b>Heartbleed (CVE-2014-0160)</b> — يسرّب 64KB من ذاكرة OpenSSL لكل طلب.</li>
              <li><b>POODLE, BEAST, CRIME, BREACH, DROWN, ROBOT</b> — كلها على إصدارات/ciphers قديمة.</li>
              <li><b>TLS 1.3</b> بيقضي على أغلب الكلام ده.</li>
              <li><b>Lucky 13</b> — timing على CBC-MAC.</li>
              <li>SNI spoofing لتعدية الـ filtering.</li>
            </ul>
          </Section>

          <Section title="ICMP و IPv6 — أبواب منسية">
            <ul>
              <li><b>ICMP redirect</b> — إعادة توجيه ترافيك (نادر النهارده، بس لسه شغّال على شبكات قديمة).</li>
              <li><b>SLAAC attack</b> — تعلن عن نفسك كـ IPv6 router افتراضي على شبكة ما عندهاش IPv6 — كل الترافيك بيعدّي عليك.</li>
              <li><b>RA Guard bypass</b>.</li>
              <li>الدفاع: <b>RA Guard, DHCPv6 guard, ND inspection</b> على الـ switches.</li>
            </ul>
          </Section>

          <Section title="مراقبة الشبكة كجهة حكومية">
            <ol>
              <li><b>Full PCAP retention</b> على المحيط (zeek + arkime).</li>
              <li>NetFlow/sFlow على كل aggregation switches.</li>
              <li>JA3/JA4 fingerprinting عشان تصطاد الأدوات المعروفة.</li>
              <li>Threat intel feeds مدمجة في الـ NDR (Spamhaus, Shadowserver, CERT الوطني).</li>
              <li>BGP route monitoring + DNS DDoS monitoring.</li>
              <li>تدريبات هجوم/دفاع كل ربع سنة، فيها سيناريوهات شبكية.</li>
            </ol>
          </Section>
        </>}
        en={<>
          <Section title="Internet protocols were built on trust">
            <Analogy>The internet was built in 1969 on the assumption "everyone on the network is trusted." BGP, DNS, ARP, NTP — all designed before adversaries existed. Today we layer trust (TLS, BGPsec, DNSSEC, RPKI) on top of that fragile foundation. This lesson exposes the layer underneath.</Analogy>
            <Callout kind="danger" title="High-impact territory">
              These attacks affect shared infrastructure. Any test outside an isolated lab can severely harm third parties
              and is a crime. Focus here: <b>how, as a government body, you detect and harden against them</b>.
            </Callout>
          </Section>

          <Section title="BGP Hijacking — hijacking the internet">
            <p>BGP is the "internet's traffic system." Each ASN announces the IP ranges it owns; routers pick the shortest path. If someone falsely announces a range they don't own, traffic flows to them.</p>
            <h3>Attack types</h3>
            <ul>
              <li><b>Prefix Hijack</b> — announce a /24 belonging to Google. Nearby ASNs route to you.</li>
              <li><b>Sub-prefix hijack</b> — a more specific /25 wins over the legitimate /24 (BGP prefers longer).</li>
              <li><b>Route Leak</b> — a provider mistakenly propagates customer routes to peers (Pakistan Telecom / YouTube 2008).</li>
              <li><b>BGP for DDoS amplification</b>.</li>
            </ul>
            <h3>Famous incidents</h3>
            <ul>
              <li><b>2008 Pakistan → YouTube</b> — global outage for two hours.</li>
              <li><b>2017 Rostelecom</b> — hijacked traffic for Google, Apple, Facebook for minutes.</li>
              <li><b>2018 Amazon Route 53</b> — targeted MyEtherWallet, $150K stolen.</li>
              <li><b>2022 KlaySwap</b> — BGP hijack leading to a $1.9M theft.</li>
            </ul>
            <Callout kind="good" title="Defense">
              <ol>
                <li><b>RPKI (Resource Public Key Infrastructure)</b> — cryptographically signed ownership. ASNs reject unsigned announcements.</li>
                <li><b>BGPsec</b> — sign the entire path.</li>
                <li>The <b>MANRS</b> initiative — best practices.</li>
                <li>Subscribe to monitoring (BGPStream, ThousandEyes, Kentik) for instant alerts.</li>
                <li>Watch your prefix announcements via <b>RIPE RIS, RouteViews</b>.</li>
                <li>Require upstream ISPs to apply <b>strict prefix filtering</b>.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="DNS attacks">
            <h3>1) DNS cache poisoning (Kaminsky)</h3>
            <p>DNS responses use a 16-bit ID. If the attacker guesses it before the real reply arrives, their forged answer enters the cache. The 2008 Kaminsky bug made it practical within seconds. Fix: <b>port randomization + DNSSEC</b>.</p>
            <h3>2) DNS tunneling</h3>
            <Code lang="payload">{`# Covert channels over DNS — hard to block
iodine, dnscat2, DNSStager
# Stolen data inside NULL/TXT records
# Full C2 over DNS only`}</Code>
            <h3>3) DNS rebinding</h3>
            <p>The attacker controls a DNS server. The first lookup returns a public IP; the second returns 127.0.0.1.</p>
            <Code lang="attack flow">{`1. Victim opens evil.com (browser)
2. evil.com returns 1.2.3.4 → JS loads
3. JS sleeps for a minute; DNS TTL = 0
4. JS requests evil.com again → now returns 192.168.1.1
5. JS now reaches the victim's router admin panel, internal services, anything
   All under the same origin — CORS doesn't block it`}</Code>
            <Callout kind="good" title="Defense">
              <ul>
                <li><b>Host header validation</b> on every internal service.</li>
                <li>Always require authentication (don't trust "internal network").</li>
                <li>Browser: critical apps use WebAuthn / origin-bound tokens.</li>
                <li>Set <b>min DNS TTL</b> for private IPs at the resolver.</li>
              </ul>
            </Callout>
            <h3>4) DNSSEC and the state of play</h3>
            <ul>
              <li>DNSSEC signs every record — kills poisoning.</li>
              <li>Adoption is limited (~30% globally).</li>
              <li>NSEC-walking attacks can reveal every subdomain.</li>
            </ul>
          </Section>

          <Section title="ARP spoofing — king of LAN attacks">
            <p>ARP has no authentication. Any device can claim "I am 192.168.1.1" and everyone believes it.</p>
            <Code lang="bash">{`# inside a lab network only
sudo arpspoof -i eth0 -t VICTIM_IP GATEWAY_IP
sudo arpspoof -i eth0 -t GATEWAY_IP VICTIM_IP
echo 1 > /proc/sys/net/ipv4/ip_forward

# Or full-featured tools
ettercap -T -M arp:remote /VICTIM// /GATEWAY//
bettercap -iface eth0`}</Code>
            <h3>Impacts</h3>
            <ul>
              <li>MITM on all victim traffic.</li>
              <li>SSL stripping (when sites lack HSTS).</li>
              <li>Inject JavaScript into HTTP responses.</li>
              <li>DNS spoofing within the session.</li>
            </ul>
            <Callout kind="good" title="Defense">
              <ul>
                <li><b>DAI (Dynamic ARP Inspection)</b> on switches.</li>
                <li>DHCP snooping + IP source guard.</li>
                <li>802.1X to keep unauthorized devices off the network entirely.</li>
                <li>HSTS preload + certificate pinning to defeat SSL stripping.</li>
                <li>Watch the ARP table for sudden changes (arpwatch).</li>
              </ul>
            </Callout>
          </Section>

          <Section title="DHCP attacks">
            <ul>
              <li><b>DHCP Starvation</b> — exhaust the pool with fake requests.</li>
              <li><b>Rogue DHCP</b> — answer requests faster than the real server → attacker DNS, attacker gateway.</li>
              <li><b>DHCPv6</b> + <b>mitm6</b> — common Active Directory attack (covered in Advanced AD).</li>
            </ul>
            <p>Defense: <b>DHCP Snooping</b> on switches; only trusted ports.</p>
          </Section>

          <Section title="NTP — time as a weapon">
            <ul>
              <li><b>NTP Amplification</b>: a <code>monlist</code> request returns ~200× — fueled 400 Gbps DDoS.</li>
              <li><b>NTP Time Manipulation</b>: shifting a victim's clock breaks TLS, Kerberos, TOTP.</li>
              <li>Defense: <b>NTS (Network Time Security)</b>, <b>chrony</b> instead of legacy <code>ntpd</code>.</li>
            </ul>
          </Section>

          <Section title="DDoS — under the microscope">
            <h3>Attack layers</h3>
            <TwoCol>
              <Card title="L3/L4 — Volumetric" color="red">
                SYN flood, UDP flood, NTP/DNS/Memcached amplification. Measured in Gbps or Mpps.
              </Card>
              <Card title="L7 — Application" color="red">
                HTTP flood, Slowloris, slow POST. Targets resources, not the pipe. Hardest to detect.
              </Card>
              <Card title="Protocol" color="red">
                Smurf, Ping of Death (historical), TCP state exhaustion.
              </Card>
              <Card title="Reflection / Amplification" color="red">
                Tiny request → huge reply → with spoofed source IP. NTP, DNS, Memcached, CLDAP, SNMP.
              </Card>
            </TwoCol>
            <h3>Real defenses</h3>
            <ol>
              <li><b>Scrubbing</b> providers: Cloudflare, Akamai Prolexic, AWS Shield Advanced, Imperva.</li>
              <li><b>Anycast</b> for geographic load distribution.</li>
              <li>Reduce UDP attack surface (don't expose amplifiable services publicly).</li>
              <li>BCP38 (anti-spoofing) at the ISP.</li>
              <li>Capacity planning + pre-arranged DDoS-protection contracts.</li>
              <li>Application: rate limiting + caching + CAPTCHA + bot management.</li>
            </ol>
          </Section>

          <Section title="Classic TLS attacks">
            <ul>
              <li><b>SSL Strip</b> — downgrade to HTTP — defeated by HSTS + preload.</li>
              <li><b>Heartbleed (CVE-2014-0160)</b> — leaks 64KB of OpenSSL memory per request.</li>
              <li><b>POODLE, BEAST, CRIME, BREACH, DROWN, ROBOT</b> — all against legacy versions/ciphers.</li>
              <li><b>TLS 1.3</b> eliminates most of the above.</li>
              <li><b>Lucky 13</b> — timing against CBC-MAC.</li>
              <li>SNI spoofing to bypass filtering.</li>
            </ul>
          </Section>

          <Section title="ICMP and IPv6 — forgotten doors">
            <ul>
              <li><b>ICMP redirect</b> — traffic redirection (rare today but still works on legacy networks).</li>
              <li><b>SLAAC attack</b> — advertise yourself as the default IPv6 router on a network without IPv6 — all traffic flows through you.</li>
              <li><b>RA Guard bypass</b>.</li>
              <li>Defense: <b>RA Guard, DHCPv6 guard, ND inspection</b> on switches.</li>
            </ul>
          </Section>

          <Section title="Network monitoring as a government entity">
            <ol>
              <li><b>Full PCAP retention</b> at the perimeter (zeek + arkime).</li>
              <li>NetFlow/sFlow on every aggregation switch.</li>
              <li>JA3/JA4 fingerprinting to detect known toolkits.</li>
              <li>Threat-intel feeds integrated into NDR (Spamhaus, Shadowserver, the national CERT).</li>
              <li>BGP route monitoring + DNS DDoS monitoring.</li>
              <li>Quarterly red/blue exercises that include network scenarios.</li>
            </ol>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
