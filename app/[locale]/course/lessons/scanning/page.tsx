"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="scanning">
      <L
        ar={<>
          <Section title="ليه إنت بتعمل nmap -A على /16 ومستغرب الـ SOC شافك؟">
            <Analogy>
              بُص.
              الـ Recon = إنت قاعد على القهوة قصاد البنك بتتفرّج. محدش حاسس بيك.
              الـ Scanning = إنت قمت من على القهوة، عدّيت الشارع، دخلت اللوبي، وبتلكز كل باب.
              من اللحظة دي إنت بتلمس الهدف.
              <br/><br/>
              - طب يعني الـ SOC هيشوفني بمجرد ما أبعت أول SYN؟؟
              <br/><br/>
              يا نجم الجيل.. السؤال مش "هيشوفني ولا لأ". ده سؤال مستجد.
              السؤال الصح: "هيشوفني إمتى، وعارف يحدد إنت مين، وعنده logs لـ كام يوم وراك؟".
              لو الهدف عنده SOC نص نايم نص صاحي، إنت هتظهر له على شاشة. أنت ونصيبك في الـ tier-1 اللي قاعد قدامها.
            </Analogy>
            <Callout kind="danger" title="قبل ما تكتب nmap -A">
              <p>nmap -A على /16 من IP واحد بتاعك = إنت بتقول للـ SOC "أنا هنا، اتفضلوا".</p>
              <p>الـ -A بيشغّل OS detection + version + scripts + traceroute في طلقة واحدة. صوتها عالي.</p>
              <p>قبل أي scan، اسأل نفسك:</p>
              <ul>
                <li>الـ engagement عليه rules of engagement مكتوبة؟</li>
                <li>الـ scope محدد بـ subnets ولا بـ hostnames؟</li>
                <li>عندك source IP متفق عليه (jump host) ولا بتطلع من لابتوبك؟</li>
                <li>الـ blue team عارفة إنك شغّال ولا الـ engagement مفروض يبان كأنه حقيقي؟</li>
              </ul>
              <p>لو الإجابة "مش متأكد" على أي واحدة فيهم — قفل الـ terminal، ارجع للـ PM، اتكلم. الـ scan مش هيهرب.</p>
            </Callout>
          </Section>

          <Section title="نظرية الـ TCP Scanning — ليه فيه scan أنواع أصلاً؟">
            <p>قبل ما تحفظ flags، افهم آلية الـ TCP handshake نفسها:</p>
            <ol className="list-decimal pe-6 space-y-1">
              <li>إنت بتبعت SYN.</li>
              <li>السيرفر يرد SYN/ACK لو الـ port مفتوح، أو RST لو مقفول.</li>
              <li>إنت تبعت ACK يكمّل الـ handshake.</li>
            </ol>

            <h3>SYN scan (-sS) — half-open</h3>
            <p>إنت بتبعت SYN، السيرفر يرد SYN/ACK، إنت تبعت RST بدل ACK.</p>
            <p>الـ connection ما اكتملش، فالـ application layer ما شافش حاجة. الـ web server logs فاضية.</p>
            <p>المشكلة: محتاج root/raw sockets. والـ IDS بتعرف توقيع SYN-without-ACK من بعيد.</p>

            <h3>Connect scan (-sT) — full handshake</h3>
            <p>بتكمّل الـ handshake عادي زي أي client. ما يحتاجش root.</p>
            <p>الـ ميزة: شكله طبيعي — connection عادي بدأ وقفل.</p>
            <p>الـ عيب: السيرفر بيسجّله في الـ logs. الـ web server بيشوف connection اتقفل من غير request — ده بصمته الواضحة.</p>

            <h3>إمتى تستخدم إيه؟</h3>
            <ul>
              <li>عندك root وعايز تبعد عن الـ application logs؟ -sS.</li>
              <li>شغّال من جوه الشبكة بـ user عادي (post-exploitation)؟ -sT، ما عندكش خيار.</li>
              <li>الهدف خلف load balancer بيعمل log للـ half-open كـ anomaly؟ -sT بيبان أعدل.</li>
            </ul>
            <p>المعلمين اللي بيقولوا "-sS دايماً أحسن" مش شايفين الصورة كاملة. الـ choice مرتبط بـ context.</p>
          </Section>

          <Section title="سيناريو حقيقي — هدف عليه WAF و IDS و rate limiting">
            <p>إنت ع engagement. الـ scope: <code>app.target.gov</code>. عند العميل WAF (Cloudflare أو F5)، Suricata في الـ DMZ، و rate limit على الـ edge: 100 طلب في الدقيقة لكل IP.</p>
            <p>تعمل إيه؟</p>

            <h3>اللي ما تعملوش</h3>
            <Code lang="bash">{`# الفلاحة المعتادة:
nmap -A -T4 -p- app.target.gov

# اللي بيحصل:
# - الـ WAF بيـ block IP بتاعك بعد 30 ثانية
# - الـ SOC ticket مفتوحة وفيها اسمك (لو الـ engagement مش authorized بالشكل ده)
# - الـ engagement اتحرق قبل ما يبدأ`}</Code>

            <h3>اللي بيتعمل فعلياً</h3>
            <Step n={1} title="passive recon الأول — مفيش packet للهدف">
              <p>قبل ما تبعت SYN واحد، اعمل passive: <code>crt.sh</code>، <code>shodan</code>، <code>censys</code>، <code>archive.org</code>. خد الصورة من بره.</p>
            </Step>
            <Step n={2} title="حدد الـ ports اللي تهمك — مش -p-">
              <p>الـ /16 على كل البورتات = 65k port × آلاف IPs. إنت بتفصّل وقت السيرفر علشان إيه؟</p>
              <p>ابدأ بـ top-100 من nmap (<code>--top-ports 100</code>). البورتات النادرة بعدها لو في سبب.</p>
            </Step>
            <Step n={3} title="استخدم -T2 على الأقل — الـ -T4 صرخة">
              <Code lang="bash">{`nmap -sS -T2 --max-rate 50 --top-ports 100 \\
  --scan-delay 1s -Pn -n \\
  -oA recon-slow target.gov`}</Code>
              <p>الـ <code>--scan-delay 1s</code> بيخلّي كل packet بعد التاني بثانية. بطيء جداً؟ آه. بيعدّي من تحت rate limit؟ آه برضو.</p>
            </Step>
            <Step n={4} title="وزّع المصدر لو ممكن">
              <p>لو عندك authorization، اطلع من 5-10 jump hosts مختلفة. كل واحد ياخد جزء من الـ scope. الـ rate limit per-IP، يبقى الحل manual: distribute the source.</p>
            </Step>

            <Callout kind="warn" title="الواقع vs المفروض">
              <p>المفروض إنت تخلّص scan في ساعتين. الواقع: scan محترم على هدف عنده detection بياخد يوم أو اتنين. لو الـ PM عايزها في ساعة، يبقى إنت إما هتحرق نفسك، أو هتكدب في التقرير.</p>
            </Callout>
          </Section>

          <Section title="Port Scanning بـ Nmap — الأوامر العملية">
            <p>الـ port هو "الباب" بتاع الخدمة. nmap هي أم الأدوات. اللي مش متقنها مش هيوصل لحاجة.</p>
            <h3>المراحل بالترتيب</h3>
            <Step n={1} title="مسح سريع — اللي مفتوح فين">
              <Terminal lines={[
                { p: "nmap -sS -p- --min-rate=2000 -T4 target.gov -oA quick" },
                { o: "PORT      STATE    SERVICE\n22/tcp    open     ssh\n80/tcp    open     http\n443/tcp   open     https\n3306/tcp  open     mysql\n8080/tcp  open     http-proxy" },
              ]} />
            </Step>
            <Step n={2} title="مسح عميق — على البورتات المفتوحة بس">
              <Terminal lines={[
                { p: "nmap -sV -sC -p22,80,443,3306,8080 -oA deep target.gov" },
                { o: "22/tcp   ssh   OpenSSH 7.4  (CVE-2018-15473 user enum)\n80/tcp   http  Apache 2.4.29\n3306/tcp mysql MySQL 5.7.20 — auth-bypass possible" },
              ]} />
            </Step>
            <Step n={3} title="NSE scripts — خلي nmap يفحص لك">
              <Code lang="bash">{`# سكربتات الكشف عن الثغرات
nmap --script vuln target.gov

# سكربتات HTTP المفيدة
nmap -p80,443 --script "http-enum,http-title,http-headers" target.gov

# اختبار SSL/TLS
nmap -p443 --script ssl-enum-ciphers,ssl-cert target.gov`}</Code>
            </Step>
          </Section>

          <Section title="أعلى 10 NSE scripts فعلاً بتنفع — مش حشو الـ docs">
            <p>الـ NSE فيه آلاف scripts. 95% منهم نادراً ما تستخدمهم. دي اللي بتشتغل في كل engagement تقريباً:</p>

            <h3>discovery — قبل ما تخترق، اعرف</h3>
            <ol className="list-decimal pe-6 space-y-2">
              <li><b>http-enum</b> — بيدور على paths معروفة (<code>/admin</code>، <code>/.git</code>، <code>/phpmyadmin</code>).
                <Code lang="bash">{`nmap -p80,443 --script http-enum --script-args http-enum.basepath=/ target.gov`}</Code>
              </li>
              <li><b>http-title</b> — Title bتاع كل web service. سريع وبيكشف admin panels.</li>
              <li><b>http-headers</b> — بيطلع كل الـ headers. الـ <code>Server</code>, <code>X-Powered-By</code>, <code>Set-Cookie</code> بيقولوا قصص.</li>
              <li><b>dns-brute</b> — subdomain enumeration من غير ما تخرج من nmap.</li>
              <li><b>smb-os-discovery</b> + <b>smb-enum-shares</b> + <b>smb-enum-users</b> — Windows targets، نص شغل الـ AD recon هنا.</li>
            </ol>

            <h3>safe — مش هيكسرحاجة</h3>
            <ol className="list-decimal pe-6 space-y-2" start={6}>
              <li><b>ssl-enum-ciphers</b> — كشف TLS misconfig، expired certs، weak ciphers. بيدّيك grade زي SSL Labs بس offline.
                <Code lang="bash">{`nmap -p443 --script ssl-enum-ciphers,ssl-cert,ssl-heartbleed target.gov`}</Code>
              </li>
              <li><b>banner</b> — أبسط script. بياخد أول 1KB من كل service. بيكشف version في ثواني.</li>
            </ol>

            <h3>vuln — استخدمه بحذر</h3>
            <ol className="list-decimal pe-6 space-y-2" start={8}>
              <li><b>smb-vuln-ms17-010</b> — EternalBlue. لسة بنلاقيه في 2026 على هدف "غريب". المرة الأخيرة لقيته في وزارة، السيرفر اللي شغّال من 2018 ومحدش لمسه.</li>
              <li><b>http-shellshock</b> — CVE-2014-6271. القديم بيرجع.</li>
              <li><b>vulners</b> — بياخد الـ banner اللي طلع من -sV ويربطه بـ CVE database. أسرع طريقة لـ "إيه CVEs المعروفة على الإصدار ده".
                <Code lang="bash">{`nmap -sV --script vulners --script-args mincvss=7.0 target.gov`}</Code>
              </li>
            </ol>

            <Callout kind="info" title="الفرق بين safe و vuln">
              <p><code>--script safe</code> = scripts ما بتعملش حاجة destructive.</p>
              <p><code>--script vuln</code> = ممكن يبعت payloads فعلية. على إنتاج بدون authorization مكتوبة، ده ممكن يخرّب.</p>
              <p>على engagement حقيقي، اقرا الـ script الأول: <code>nmap --script-help &lt;name&gt;</code>. لو الـ description فيها "may crash" — قف.</p>
            </Callout>
          </Section>

          <Section title="Evasion — والحقيقة الناشفة">
            <Callout kind="danger" title="evasion ضد الـ detection الحديث">
              <p>الـ flags اللي كل ما حد يكتب blog عن evasion يحطها:</p>
              <ul>
                <li><code>-f</code> — fragmentation. بيقسم الـ packets على fragments صغيرة. الـ stateful firewalls من 2010 ممكن تتبهدل. الـ NGFW الحديث بيـ reassemble قبل الـ inspection.</li>
                <li><code>--source-port 53</code> — بيخلّيك تطلع من port 53 كأنك DNS. بيعدّي من firewalls عبيطة. الـ EDR الحديث بيبص على الـ payload مش الـ port.</li>
                <li><code>-D RND:10</code> — decoys. بيبعت الـ scan من 10 IPs ملفّقين معاك. الـ IDS بيشوف 11 scanner. بس لو الـ blue team عندها NetFlow على الـ edge، هتعرف اللي رد فعل الـ TCP الكامل عليه (إنت)، والباقي noise.</li>
                <li><code>-T0</code>/<code>-T1</code> — sneaky/paranoid. الـ T0 = packet كل 5 دقايق. على /24 = أسبوع.</li>
              </ul>

              <p><b>الحقيقة:</b> ضد EDR محترم (CrowdStrike، SentinelOne، Defender for Endpoint) و NDR شغّال (Darktrace، Vectra، ExtraHop) — الـ fragmentation و decoys دلوقتي بصمة لذاتها. الـ ML بيشوف الـ pattern: "ده nmap بيحاول يـ evade".</p>

              <p><b>الـ evasion الوحيد اللي لسة شغّال:</b> الوقت.</p>
              <p>بطّء الـ scan لدرجة إنه يبان كـ noise طبيعي. واحد scan في الساعة من IPs مختلفة على ports مختلفة. الـ SIEM لازم يربطهم. ولو الـ rules ضعيفة، هيدخلوا تحت threshold الـ alert.</p>
              <p>سلو هو الـ stealth الحقيقي. الباقي تمثيل stealth.</p>
            </Callout>
          </Section>
          <Section title="Vulnerability Scanning — أنت ع engagement، الزبون عنده 50 سيرفر، تشغّل إيه؟">
            <p>تخيل السيناريو ده: PM دخل عليك، قالك "العميل عنده 50 سيرفر، عاوزين تقرير ثغرات الأسبوع الجاي". تشغّل إيه؟</p>

            <h3>الإجابة الكسولة</h3>
            <p>"Nessus على الكل". الـ Nessus هياخد يوم، يطلع 800 finding، 600 منهم false positive، و 5 critical حقيقية ضايعة في الزحمة.</p>

            <h3>الإجابة المهنية — اخلط</h3>
            <ol className="list-decimal pe-6 space-y-2">
              <li><b>Nuclei الأول</b> على كل الـ web services. سريع (دقايق مش ساعات)، false positive قليل، الـ templates مكتوبة بصيغة موضّحة فبتعرف ليه finding ظهر.
                <Code lang="bash">{`nuclei -l targets.txt -severity critical,high \\
  -tags cve,exposure,oast -rl 50 -c 25`}</Code>
              </li>
              <li><b>Nessus / OpenVAS</b> على الـ infrastructure (SSH، SMB، DB، RDP). قوته الحقيقية في الـ network protocols مش في الـ web. خليه يشتغل overnight.</li>
              <li><b>Nmap NSE vulners</b> كـ second opinion. بيلاقي حاجات الـ commercial scanners بتفوّتها لأنها بتعتمد على banner مباشر مش على signature.</li>
              <li><b>يدوي</b> — كل ما الـ scanners تطلعه، إنت اللي بتأكد. Nessus يقولك "outdated OpenSSL"، إنت بتجيب exploit حقيقي وتجرب.</li>
            </ol>

            <h3>Nessus vs OpenVAS vs Nuclei — الفرق العملي</h3>
            <TwoCol>
              <Card title="Nuclei" color="red">
                <p>OSS، YAML templates، سريع، الـ community بيكتب template للـ CVE في يوم اللي تطلع فيه.</p>
                <p><b>قوته:</b> web layer، misconfig، exposure.</p>
                <p><b>ضعفه:</b> ما بيعملش deep auth scanning ولا compliance checks.</p>
              </Card>
              <Card title="Nessus" color="amber">
                <p>Tenable، تجاري، بـ ~$3500 في السنة.</p>
                <p><b>قوته:</b> credentialed scanning، compliance (PCI، HIPAA)، تغطية واسعة.</p>
                <p><b>ضعفه:</b> false positives كتير، التقرير لازم تنضّفه قبل ما تدّيه للعميل.</p>
              </Card>
              <Card title="OpenVAS / Greenbone" color="green">
                <p>OSS، الجد التجاري لـ Nessus قبل ما تتقفل.</p>
                <p><b>قوته:</b> مجاني، بيغطي كتير من اللي Nessus بيغطّيه.</p>
                <p><b>ضعفه:</b> الـ feed بيتأخّر أيام-أسابيع وراء Nessus، الـ UI بطيئة.</p>
              </Card>
              <Card title="Nikto" color="amber">
                <p>قديم بس لسة شغّال. سريع لـ web server misconfig.</p>
                <p><b>قوته:</b> 6000+ checks، صفر setup.</p>
                <p><b>ضعفه:</b> صوته عالي جداً. الـ User-Agent بيقول "Nikto" بصراحة. WAF بيقفله في ثواني.</p>
              </Card>
            </TwoCol>

            <Terminal lines={[
              { p: "nuclei -u https://target.gov -severity critical,high -tags cve,exposure,oast" },
              { o: "[critical] CVE-2024-3094 — XZ backdoor in OpenSSH\n[high] CVE-2023-23397 — Outlook NTLM leak\n[high] exposed .env file at /backup/.env" },
            ]} />

            <Callout kind="warn" title="نصيحة من شغل حقيقي">
              <p>متشغّلش <b>كل</b> templates Nuclei. عندك آلاف، وكتير منهم على tech ما عندكش. حدّد <code>-tags</code> أو <code>-templates</code> حسب الـ stack اللي شفته في الـ recon.</p>
              <p>وقبل ما تبعت التقرير: راجع كل critical يدوياً. لو nuclei قال "critical" وإنت ما تأكدتش، التقرير بتاعك = صدفة.</p>
            </Callout>
          </Section>
          <Section title="Directory Bruteforcing — اللي مش لينك في الموقع">
            <p>كتير من الـ endpoints الحساسة مش بتبقى ظاهرة في الـ UI. الـ bruteforcing هو اللي بيفضحها — و هنا بتلاقي الذهب.</p>
            <Terminal lines={[
              { p: "ffuf -u https://target.gov/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-large-words.txt -mc 200,301,403 -fs 0" },
              { o: "/admin              [301]\n/.git/config        [200]\n/api/v1/users       [200]\n/backup.zip         [200]\n/phpinfo.php        [200]" },
            ]} />
            <Callout kind="info" title="نصيحة">استخدم SecLists — أكبر مجموعة wordlists في المجال. اللي مش عنده SecLists بيشتغل بنص أدواته.</Callout>
          </Section>
          <Section title="تعداد الخدمات الشائعة — اللي بيفضح الشبكة">
            <h3>SMB (Windows)</h3>
            <Code lang="bash">{`enum4linux-ng -A target
crackmapexec smb target -u '' -p '' --shares
nxc smb target --users --groups`}</Code>
            <h3>SNMP</h3>
            <Code lang="bash">{`snmpwalk -v2c -c public target
onesixtyone -c community.txt target`}</Code>
            <h3>LDAP / Active Directory</h3>
            <Code lang="bash">{`ldapsearch -x -H ldap://target -b "DC=corp,DC=local"
bloodhound-python -d corp.local -u user -p pass -c All -ns target`}</Code>
          </Section>
          <Section title="الحماية — إزاي EDR/SIEM بيكشف scan فعلاً">
            <p>لو إنت في blue team، الـ scan مش "لحظة ظهور". هو سلسلة من الـ events لازم تربطها.</p>

            <h3>على مستوى الـ network</h3>
            <Callout kind="good" title="Suricata signatures عملية">
              <p>الـ ET-OPEN ruleset فيها قواعد جاهزة لـ nmap، nuclei، ffuf، gobuster. شغّلهم.</p>
              <Code lang="Suricata rule">{`alert tcp $EXTERNAL_NET any -> $HOME_NET any \\
  (msg:"NMAP NSE Script Scan"; flow:to_server; \\
  content:"|55 73 65 72 2d 41 67 65 6e 74 3a 20 4e 6d 61 70|"; \\
  sid:9000001; rev:1;)

alert http any any -> $HOME_NET any \\
  (msg:"Nuclei scanner User-Agent"; flow:to_server; \\
  http.user_agent; content:"Nuclei"; nocase; \\
  sid:9000002; rev:1;)`}</Code>
              <p>بس الـ signatures دي بتعمل match على defaults. اللي بيغيّر User-Agent بيعدّي. فالـ signatures مش الحل الكامل.</p>
            </Callout>

            <h3>على مستوى الـ behavior</h3>
            <ul>
              <li><b>scan-rate threshold:</b> أكتر من X SYN لـ Y destinations في Z ثواني = scan. الـ القيم بتعتمد على شبكتك. ابدأ بـ 100 dest في 60s، عدّل من الـ baseline.</li>
              <li><b>connections without payload:</b> SYN + RST من غير ما يتبعت data. الـ web server ما بيشوفش request، بس الـ flow logs شايفة.</li>
              <li><b>distributed scan detection:</b> هنا اللعبة الحقيقية. لو 50 IP مختلفة بتبعت SYN على 5 ports مختلفة لكل سيرفر — كل واحد لوحده تحت threshold، بس الـ aggregate scan كامل. الـ SIEM لازم يـ correlate على destination مش على source.</li>
              <li><b>rare-port to known asset:</b> سيرفر ما حدش بيكلّمه على port 8443 من سنة، فجأة 3 IPs بتجرّب. ده مش normal.</li>
            </ul>

            <h3>على مستوى الـ host (EDR)</h3>
            <ul>
              <li>الـ EDR بيشوف الـ TCP SYN/RST من kernel level. CrowdStrike وSentinelOne عندهم detection للـ "incoming scan" كـ behavior.</li>
              <li>الـ honeypots على ports زي 4444، 31337 — الـ EDR لو شاف connection attempt عليهم، alert فوراً.</li>
            </ul>

            <h3>الـ controls اللي بتقفل السكة</h3>
            <ul>
              <li>Deny-by-default في الـ firewall. متفتحش غير اللي محتاجه فعلاً.</li>
              <li>Rate limiting + SYN cookies في وش الـ SYN scan.</li>
              <li>Honeypots — بورتات مفتوحة بنية بتسجل كل واحد بيقرّب.</li>
              <li>Banner masking — لخبط بصمة الإصدار. مش حل بذاته بس بيضيع وقت المهاجم.</li>
              <li>Geofencing على الـ admin endpoints. لو الـ engineering team كلها في القاهرة، ليه الـ SSH مفتوح من Ohio؟</li>
            </ul>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>Scanning مش زر "علشان نشوف ايه فيه".</p>
            <p>هو قرار.</p>
            <p>قرار بيحدد:</p>
            <ul>
              <li>الـ engagement هيتم ولا الـ blue team هتقفلك في أول 5 دقايق.</li>
              <li>الـ تقرير هيبقى فيه findings حقيقية ولا حشو من scanner ما حدش راجعه.</li>
              <li>إنت محترم في شغلك ولا "بيـ run nmap -A وبيستنى".</li>
            </ul>
            <p>اكتبها على ظهر إيدك قبل ما تفتح الـ terminal: scope، authorization، timing، source IP، هدف من الـ scan ده.</p>
            <p>اوعى تشغّل scan وإنت مش عارف الإجابات الخمسة دي.</p>
            <p>اللي بيعمل كده مش بيعمل engagement — بيعمل عك. والعك ده بيظهر في التقرير، وبيظهر قدام العميل، وبيظهر في الـ reputation.</p>
            <p>الـ scan الناجح هو اللي العميل ما حسّش بيه — ولا فيه finding واحد ضاع.</p>
          </Section>
        </>}
        en={<>
          <Section title="Recon vs scanning">
            <Analogy>Recon = sitting in the cafe across from the bank, watching. Scanning = walking into the lobby and trying every door to see which is unlocked. You're now interacting with the target directly.</Analogy>
          </Section>
          <Section title="Port scanning with Nmap">
            <p>A port is the "door" of a service. Every service listens on a port number. nmap is the foundational scanner.</p>
            <h3>Scanning phases, in order</h3>
            <Step n={1} title="Quick sweep to find open doors">
              <Terminal lines={[
                { p: "nmap -sS -p- --min-rate=2000 -T4 target.gov -oA quick" },
                { o: "PORT      STATE    SERVICE\n22/tcp    open     ssh\n80/tcp    open     http\n443/tcp   open     https\n3306/tcp  open     mysql\n8080/tcp  open     http-proxy" },
              ]} />
            </Step>
            <Step n={2} title="Deep scan only on the open ports">
              <Terminal lines={[
                { p: "nmap -sV -sC -p22,80,443,3306,8080 -oA deep target.gov" },
                { o: "22/tcp   ssh   OpenSSH 7.4  (CVE-2018-15473 user enum)\n80/tcp   http  Apache 2.4.29\n3306/tcp mysql MySQL 5.7.20 — auth-bypass possible" },
              ]} />
            </Step>
            <Step n={3} title="Use NSE scripts">
              <Code lang="bash">{`# Vulnerability scripts
nmap --script vuln target.gov

# Useful HTTP scripts
nmap -p80,443 --script "http-enum,http-title,http-headers" target.gov

# Test SSL/TLS
nmap -p443 --script ssl-enum-ciphers,ssl-cert target.gov`}</Code>
            </Step>
            <Callout kind="warn" title="Evading detection">
              <ul>
                <li>-T2 is slower but stealthier.</li>
                <li>-f to fragment packets.</li>
                <li>--source-port 53 to pass some firewalls.</li>
                <li>-D RND:10 to spoof decoy addresses.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="Vulnerability scanning">
            <TwoCol>
              <Card title="Nuclei" color="red">Open source, with thousands of templates for known CVEs.</Card>
              <Card title="Nikto / OpenVAS / Nessus" color="amber">Traditional scanners covering thousands of web and infrastructure checks.</Card>
            </TwoCol>
            <Terminal lines={[
              { p: "nuclei -u https://target.gov -severity critical,high -tags cve,exposure,oast" },
              { o: "[critical] CVE-2024-3094 — XZ backdoor in OpenSSH\n[high] CVE-2023-23397 — Outlook NTLM leak\n[high] exposed .env file at /backup/.env" },
            ]} />
          </Section>
          <Section title="Directory and file brute-forcing">
            <p>Many sensitive endpoints aren't linked from the UI. Brute-forcing surfaces them.</p>
            <Terminal lines={[
              { p: "ffuf -u https://target.gov/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-large-words.txt -mc 200,301,403 -fs 0" },
              { o: "/admin              [301]\n/.git/config        [200]\n/api/v1/users       [200]\n/backup.zip         [200]\n/phpinfo.php        [200]" },
            ]} />
            <Callout kind="info" title="Tip">Use SecLists — the largest collection of wordlists in cybersecurity.</Callout>
          </Section>
          <Section title="Common service enumeration">
            <h3>SMB (Windows)</h3>
            <Code lang="bash">{`enum4linux-ng -A target
crackmapexec smb target -u '' -p '' --shares
nxc smb target --users --groups`}</Code>
            <h3>SNMP</h3>
            <Code lang="bash">{`snmpwalk -v2c -c public target
onesixtyone -c community.txt target`}</Code>
            <h3>LDAP / Active Directory</h3>
            <Code lang="bash">{`ldapsearch -x -H ldap://target -b "DC=corp,DC=local"
bloodhound-python -d corp.local -u user -p pass -c All -ns target`}</Code>
          </Section>
          <Section title="Defense against scanning">
            <ul>
              <li>Deny-by-default firewall — only open what's required.</li>
              <li>Rate limiting + SYN cookies against SYN scans.</li>
              <li>IDS / Suricata / Snort with ET-OPEN rules to detect signatures of nmap, nuclei, ffuf.</li>
              <li>Honeypots — intentionally open ports that log everyone who probes.</li>
              <li>Banner masking to obscure version fingerprints.</li>
            </ul>
            <Code lang="Suricata rule">{`alert tcp $EXTERNAL_NET any -> $HOME_NET any \\
  (msg:"NMAP NSE Script Scan"; flow:to_server; \\
  content:"|55 73 65 72 2d 41 67 65 6e 74 3a 20 4e 6d 61 70|"; \\
  sid:9000001; rev:1;)`}</Code>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
