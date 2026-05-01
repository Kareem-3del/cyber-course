"use client";
import { LessonShell, Section, Callout, TwoCol, Card, Analogy, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="toolkit">
      <L
        ar={<>
          <Section title="قبل ما تفتح أي أداة">
            <p>أي pentester بيفتح لاب جديد، أول 10 دقايق بيركّب نفس الـ stack. ليه؟</p>
            <p>لأن الأدوات دي مش "اختيارات".</p>
            <p>هي عضلات الذراع.</p>
            <p>- طب يا حضرتك، ما أركّب Black Arch كله أحسن وأبقى مغطّي؟</p>
            <p>كنت مستنيك تسأل السؤال ده يا مستجد. متوقّع كالعادة.</p>
            <p>طب فيه ناس بتركّب 200 أداة وعمرها ما هتفتح نص الموجود. وفيه ناس عندها 8 أدوات بس ومخرّبة كل CTF. الفرق بينهم في السكة فين بالظبط؟</p>
            <p>الفرق مش في العدد. اللي عنده 8 بيتقنهم. اللي عنده 200 بيستعرض. بس.</p>
            <Analogy>
              صندوق العدّة بتاع الميكانيكي القديم في الورشة — مش هتلاقي فيه 50 مفتاح. هتلاقي 8 أو 10 صدئت من كتر الشغل، عارف كل واحد فيهم بيعمل ايه، وعارف الـ trick بتاعته. الميكانيكي الجديد هو اللي كل أسبوع يشتري طقم جديد من الصين، ويرميه بعد شهر.
              <br/>الـ toolkit بتاعك نفس الفكرة.
            </Analogy>
            <Callout kind="info" title="اعتراف شخصي">
              أنا فضّلت سنين بدور على "أحسن" أداة لكل خطوة. نسخة Burp جديدة، fork من sqlmap، wrapper لـ nmap، script على GitHub فيه 12 ستار.
              <br/>اكتشفت إن المشكلة فيا. مش في الأدوات. الـ workflow بتاعي كان مهلهل، فبدّلت الأداة وأنا اللازم أبدّل الدماغ.
            </Callout>
            <Callout kind="warn" title="غلطات الـ junior toolkit">
              <ul>
                <li>تركيب 200 أداة من Black Arch أو Kali full — 90% منها مش هتستخدمه، و10% هيتعارضوا مع بعض.</li>
                <li>مفيش tracking لإصدار كل أداة — Burp 2023.10 شغّال جنب Burp 2024.6 جنب OWASP ZAP، ومحدش عارف اللي بيعمل request.</li>
                <li>استخدام Kali default ISO على engagement حقيقي. الـ IP بتاعك معروف، الـ User-Agent بتاع كل أداة معروف، والـ EDR عند العميل بيقفلك في تالت دقيقة.</li>
                <li>الاعتماد على GUI tools في كل حاجة. الـ CLI أسرع وقابل للأتمتة، وانت في engagement فيه ضغط وقت.</li>
                <li>استخدام أدوات مكسورة من telegram channels — جايبلك payload جوّاها تخلّيك إنت الـ target مش الـ operator.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="صندوق أدوات Red Team">
            <p>اللي جاي مش "كل أدوات الـ red team". ده اللي هتشتغل بيه فعلاً في 95% من الـ engagements. لو لقيت أداة مش هنا، اسأل نفسك: محتاجها فعلاً ولا بتجمّع؟</p>
            <TwoCol>
              <Card title="استطلاع — Reconnaissance" color="red">
                <ul className="text-sm">
                  <li>subfinder, amass, assetfinder, findomain</li>
                  <li>httpx, naabu, dnsx, tlsx</li>
                  <li>Shodan, Censys, FOFA, ZoomEye</li>
                  <li>crt.sh, GoBuster, gau, waybackurls, katana</li>
                  <li>trufflehog, gitleaks, GitHound</li>
                </ul>
              </Card>
              <Card title="مسح — Scanning" color="red">
                <ul className="text-sm">
                  <li>nmap + NSE, masscan, rustscan</li>
                  <li>nuclei, nikto, OpenVAS, Nessus</li>
                  <li>ffuf, feroxbuster, dirsearch</li>
                  <li>whatweb, wappalyzer, retire.js</li>
                </ul>
              </Card>
              <Card title="استغلال ويب" color="red">
                <ul className="text-sm">
                  <li>Burp Suite Pro, Caido, OWASP ZAP</li>
                  <li>sqlmap, NoSQLMap, dalfox, kxss</li>
                  <li>wpscan, joomscan, droopescan</li>
                  <li>XSStrike, commix, tplmap</li>
                </ul>
              </Card>
              <Card title="استغلال شبكة و سيرفر" color="red">
                <ul className="text-sm">
                  <li>Metasploit Framework, exploit-db</li>
                  <li>CrackMapExec / NetExec, Impacket suite</li>
                  <li>responder, mitm6, ntlmrelayx</li>
                  <li>BloodHound, SharpHound, PowerView</li>
                  <li>Mimikatz, Rubeus, Certify, Certipy</li>
                </ul>
              </Card>
              <Card title="C2 و post-exploitation" color="red">
                <ul className="text-sm">
                  <li>Cobalt Strike, Sliver, Mythic, Havoc</li>
                  <li>Empire, Covenant, Brute Ratel</li>
                  <li>Chisel, ligolo-ng, sshuttle, proxychains</li>
                  <li>LinPEAS, WinPEAS, PEASS-ng, PrivescCheck</li>
                </ul>
              </Card>
              <Card title="السحابة و الحاويات" color="red">
                <ul className="text-sm">
                  <li>Pacu, CloudFox, ScoutSuite, Prowler</li>
                  <li>enumerate-iam, weirdAAL, AWSGoat, CloudGoat</li>
                  <li>peirates, kube-hunter, kubeletctl</li>
                  <li>trivy, grype, dockle</li>
                  <li>ROADtools, AADInternals, MicroBurst</li>
                </ul>
              </Card>
            </TwoCol>
          </Section>
          <Section title="صندوق أدوات Blue Team">
            <p>الـ red team بيلعب بأدوات. الـ blue team بيشتغل بـ منصات. الفرق؟ الأداة بتفتحها وتقفلها. المنصة بتشتغل 24/7 وبتولّد alerts إنت لازم ترد عليها.</p>
            <p>لو SOC analyst جديد، اعرف الـ stack بتاع شركتك الأول، وبعدين زوّد. مفيش لازمة تتعلم Splunk وانت في شركة شغّالة Sentinel.</p>
            <TwoCol>
              <Card title="SIEM / Log management" color="blue">
                <ul className="text-sm">
                  <li>Splunk, Microsoft Sentinel, Chronicle, QRadar</li>
                  <li>ELK / OpenSearch, Wazuh, Graylog, Security Onion</li>
                </ul>
              </Card>
              <Card title="EDR / Host" color="blue">
                <ul className="text-sm">
                  <li>CrowdStrike, SentinelOne, Defender for Endpoint</li>
                  <li>Wazuh agent + Sysmon, osquery, Velociraptor</li>
                  <li>Falco, Tracee (eBPF)</li>
                </ul>
              </Card>
              <Card title="NDR / IDS" color="blue">
                <ul className="text-sm">
                  <li>Suricata, Snort, Zeek, Arkime (Moloch)</li>
                  <li>RITA, JA3/JA4 fingerprinting</li>
                </ul>
              </Card>
              <Card title="Threat Intelligence" color="blue">
                <ul className="text-sm">
                  <li>MISP, OpenCTI, TheHive + Cortex</li>
                  <li>VirusTotal, ANY.RUN, Joe Sandbox, Hatching Triage</li>
                  <li>CISA KEV, AlienVault OTX, Abuse.ch</li>
                </ul>
              </Card>
              <Card title="Forensics / DFIR" color="blue">
                <ul className="text-sm">
                  <li>Volatility 3, Rekall, FTK Imager</li>
                  <li>Autopsy, plaso/log2timeline, KAPE, UAC</li>
                  <li>Chainsaw, Hayabusa, EVTX-ATTACK-SAMPLES</li>
                </ul>
              </Card>
              <Card title="Hardening / Audit" color="blue">
                <ul className="text-sm">
                  <li>Lynis, OpenSCAP, CIS-CAT, kube-bench</li>
                  <li>Wazuh SCA, Tenable Nessus / Qualys</li>
                  <li>Wiz, Prisma Cloud, AWS Security Hub</li>
                </ul>
              </Card>
              <Card title="Honeypots & Deception" color="blue">
                <ul className="text-sm">
                  <li>Canarytokens.org, Thinkst Canary</li>
                  <li>cowrie, dionaea, t-pot</li>
                  <li>honeyd, opencanary</li>
                </ul>
              </Card>
              <Card title="Detection Content" color="blue">
                <ul className="text-sm">
                  <li>Sigma + sigmac/uncoder, Atomic Red Team</li>
                  <li>Elastic detection-rules, Splunk security-content</li>
                  <li>MITRE D3FEND, ATT&CK Navigator</li>
                </ul>
              </Card>
            </TwoCol>
          </Section>
          <Section title="سيناريوهات شغل حقيقية — الأدوات في سياقها">
            <p>الـ tools list فوق ميتة من غير context. خليني أوريك إزاي بتشتغل في الـ workflow الحقيقي:</p>
            <ul>
              <li><b>External recon (يوم 1):</b> subfinder + amass عشان الـ subdomains، dnsx للـ resolution، httpx للـ live hosts، nuclei templates للـ low-hanging fruit. كل ده pipe واحد، نتيجته ملف JSON بتدخّله الخطوة اللي بعديها.</li>
              <li><b>Web app testing (الأسبوع الأول):</b> Burp Pro فاتح ع الـ workspace، ffuf شغّال في tab تاني للـ content discovery، sqlmap في tab تالت لو لقيت parameter مشكوك فيه. مش 4 أدوات ويب مع بعض — أداتين نظيفين بتشتغل بيهم بسرعة.</li>
              <li><b>AD pentest (داخل الشبكة):</b> NetExec يعمل initial sweep، responder/mitm6 بيلتقط hashes في الخلفية، BloodHound بيرسم الـ graph، Certipy/Rubeus بيسحبوا التذاكر. الترتيب ده مش عشوائي — كل خطوة بتطعّم اللي بعدها.</li>
              <li><b>Blue side — alert triage:</b> alert في Sentinel، بتفتح Velociraptor عشان timeline على الـ host، بتعدّي الـ hash على VirusTotal و ANY.RUN، بتلاقي C2 IP، بتدخّله TheHive كـ IOC. الأدوات بتاكل في بعض، مش جزر منفصلة.</li>
              <li><b>DFIR — incident حقيقي:</b> KAPE بيشيل الـ artifacts من الـ host، plaso/log2timeline بيبني الـ super-timeline، Chainsaw بيسحب الـ Sigma matches من الـ EVTX، Volatility 3 بيقرا الـ memory dump. ده مش "أدوات" — ده pipeline.</li>
            </ul>
          </Section>
          <Section title="أدوات مش محتاجها (وحد قالك العكس)">
            <p>كل سنة بيظهر تنين أدوات جديدة في تويتر. كل واحد بيعمل thread "the only X you need in 2024". بعد سنة؟ ماحدش فاكر اسمها.</p>
            <p>اللي بيستحمل هو اللي مش بيكسرك — مش اللي مكتوب عنه أكتر.</p>
            <ul>
              <li><b>كل wrapper جديد لـ nmap.</b> nmap نفسه شغّال من 1997. الـ wrapper بتاعك بيضيف emoji في الـ output — وبس.</li>
              <li><b>الـ "all-in-one" frameworks اللي بتظهر فجأة على GitHub.</b> 12 ستار، README فيه gif، وبعد 6 شهور الـ repo archived. ابعد.</li>
              <li><b>أدوات الـ telegram/discord الـ "leaked".</b> دي مش أدوات، دي backdoors بتشتغل ضدك. اوعى تنزّل "Cobalt Strike cracked". أنا شفت ناس infected من اللعبة دي أكتر مما شفت ضحايا حقيقيين.</li>
              <li><b>الـ AI-powered scanners اللي بتعد لك الفلوس.</b> 90% منها wrapper حوالين nuclei + GPT API. ادفع لـ nuclei مباشرة، ووفّر فلوسك.</li>
              <li><b>Kali tools اللي ما فتحتهاش من سنة.</b> لو ما استخدمتهاش، احذفها. الـ disk بتاعك مش متحف.</li>
            </ul>
            <Callout kind="warn" title="آخرة الـ tool hype ايه؟">
              في tools كل سنتين بيتقال عنها "بتقتل EDR". في النص بتلاقي إنها كانت working على Windows 10 1909 وبس، أو كانت محتاجة admin من الأصل (يعني انت اتخرقت فعلاً)، أو الـ vendor عمل signature ليها في 3 أيام. الـ hype مش معيار. الـ track record هو المعيار.
            </Callout>
          </Section>
          <Section title="مسارات تعلّم موصى بها">
            <p>الأدوات من غير مسار = لعب. المسار من غير أدوات = فلسفة. الاتنين مع بعض = شغل.</p>
            <ul>
              <li><b>Web</b>: PortSwigger Web Academy (مجاناً) — مفيش أحسن منه. لو خلّصته كله، انت فعلاً في top 10% web pentesters.</li>
              <li><b>Pentest</b>: HackTheBox Academy, TryHackMe, OSCP. الـ OSCP مش "شهادة"، ده اختبار صبر.</li>
              <li><b>AD / Red Team</b>: CRTO, CRTP, OSEP. لو شغلك federal/government، الـ AD knowledge مش رفاهية.</li>
              <li><b>Cloud</b>: flaws.cloud, CloudGoat, AWSGoat, AzureGoat. ابدأ بـ flaws.cloud — مجاني وبيعلّمك إزاي تفكر cloud.</li>
              <li><b>Blue Team</b>: BTL1/BTL2, SOC-200, SANS GIAC (GCIA, GCFA). لو هتشتغل SOC حقيقي، GCIA + GCFA كفاية لـ 5 سنين.</li>
              <li><b>DFIR</b>: 13Cubed, DFIR.training, SANS FOR-508. 13Cubed مجاني وأحسن من كورسات بـ 5 آلاف دولار.</li>
            </ul>
            <Callout kind="info" title="الخلاصة الناشفة">
              الـ toolkit مش معرض.
              <br/>هو extension لطريقة تفكيرك.
              <br/>لو دماغك مش منظّمة، 200 أداة هتزوّد العك. لو دماغك صافية، 8 أدوات تكفّيك تختم engagement كامل.
              <br/>السيبر سباق ماراثون مش 100 متر. ساعة في اليوم — قراية + تطبيق فعلي على lab — وخلال سنة هتلاقي نفسك ضمن أحسن 5% في المجال.
              <br/>اللي بيحرق المراحل بيقع في النص. واللي بيجمّع أدوات بدل ما يتقن، بيقع كمان.
            </Callout>
          </Section>
        </>}
        en={<>
          <Section title="Red Team toolkit">
            <TwoCol>
              <Card title="Reconnaissance" color="red">
                <ul className="text-sm">
                  <li>subfinder, amass, assetfinder, findomain</li>
                  <li>httpx, naabu, dnsx, tlsx</li>
                  <li>Shodan, Censys, FOFA, ZoomEye</li>
                  <li>crt.sh, GoBuster, gau, waybackurls, katana</li>
                  <li>trufflehog, gitleaks, GitHound</li>
                </ul>
              </Card>
              <Card title="Scanning" color="red">
                <ul className="text-sm">
                  <li>nmap + NSE, masscan, rustscan</li>
                  <li>nuclei, nikto, OpenVAS, Nessus</li>
                  <li>ffuf, feroxbuster, dirsearch</li>
                  <li>whatweb, wappalyzer, retire.js</li>
                </ul>
              </Card>
              <Card title="Web exploitation" color="red">
                <ul className="text-sm">
                  <li>Burp Suite Pro, Caido, OWASP ZAP</li>
                  <li>sqlmap, NoSQLMap, dalfox, kxss</li>
                  <li>wpscan, joomscan, droopescan</li>
                  <li>XSStrike, commix, tplmap</li>
                </ul>
              </Card>
              <Card title="Network & server exploitation" color="red">
                <ul className="text-sm">
                  <li>Metasploit Framework, exploit-db</li>
                  <li>CrackMapExec / NetExec, Impacket suite</li>
                  <li>responder, mitm6, ntlmrelayx</li>
                  <li>BloodHound, SharpHound, PowerView</li>
                  <li>Mimikatz, Rubeus, Certify, Certipy</li>
                </ul>
              </Card>
              <Card title="C2 & post-exploitation" color="red">
                <ul className="text-sm">
                  <li>Cobalt Strike, Sliver, Mythic, Havoc</li>
                  <li>Empire, Covenant, Brute Ratel</li>
                  <li>Chisel, ligolo-ng, sshuttle, proxychains</li>
                  <li>LinPEAS, WinPEAS, PEASS-ng, PrivescCheck</li>
                </ul>
              </Card>
              <Card title="Cloud & containers" color="red">
                <ul className="text-sm">
                  <li>Pacu, CloudFox, ScoutSuite, Prowler</li>
                  <li>enumerate-iam, weirdAAL, AWSGoat, CloudGoat</li>
                  <li>peirates, kube-hunter, kubeletctl</li>
                  <li>trivy, grype, dockle</li>
                  <li>ROADtools, AADInternals, MicroBurst</li>
                </ul>
              </Card>
            </TwoCol>
          </Section>
          <Section title="Blue Team toolkit">
            <TwoCol>
              <Card title="SIEM / Log management" color="blue">
                <ul className="text-sm">
                  <li>Splunk, Microsoft Sentinel, Chronicle, QRadar</li>
                  <li>ELK / OpenSearch, Wazuh, Graylog, Security Onion</li>
                </ul>
              </Card>
              <Card title="EDR / Host" color="blue">
                <ul className="text-sm">
                  <li>CrowdStrike, SentinelOne, Defender for Endpoint</li>
                  <li>Wazuh agent + Sysmon, osquery, Velociraptor</li>
                  <li>Falco, Tracee (eBPF)</li>
                </ul>
              </Card>
              <Card title="NDR / IDS" color="blue">
                <ul className="text-sm">
                  <li>Suricata, Snort, Zeek, Arkime (Moloch)</li>
                  <li>RITA, JA3/JA4 fingerprinting</li>
                </ul>
              </Card>
              <Card title="Threat Intelligence" color="blue">
                <ul className="text-sm">
                  <li>MISP, OpenCTI, TheHive + Cortex</li>
                  <li>VirusTotal, ANY.RUN, Joe Sandbox, Hatching Triage</li>
                  <li>CISA KEV, AlienVault OTX, Abuse.ch</li>
                </ul>
              </Card>
              <Card title="Forensics / DFIR" color="blue">
                <ul className="text-sm">
                  <li>Volatility 3, Rekall, FTK Imager</li>
                  <li>Autopsy, plaso/log2timeline, KAPE, UAC</li>
                  <li>Chainsaw, Hayabusa, EVTX-ATTACK-SAMPLES</li>
                </ul>
              </Card>
              <Card title="Hardening / Audit" color="blue">
                <ul className="text-sm">
                  <li>Lynis, OpenSCAP, CIS-CAT, kube-bench</li>
                  <li>Wazuh SCA, Tenable Nessus / Qualys</li>
                  <li>Wiz, Prisma Cloud, AWS Security Hub</li>
                </ul>
              </Card>
              <Card title="Honeypots & Deception" color="blue">
                <ul className="text-sm">
                  <li>Canarytokens.org, Thinkst Canary</li>
                  <li>cowrie, dionaea, t-pot</li>
                  <li>honeyd, opencanary</li>
                </ul>
              </Card>
              <Card title="Detection Content" color="blue">
                <ul className="text-sm">
                  <li>Sigma + sigmac/uncoder, Atomic Red Team</li>
                  <li>Elastic detection-rules, Splunk security-content</li>
                  <li>MITRE D3FEND, ATT&CK Navigator</li>
                </ul>
              </Card>
            </TwoCol>
          </Section>
          <Section title="Recommended learning paths">
            <ul>
              <li><b>Web</b>: PortSwigger Web Academy (free) — nothing better.</li>
              <li><b>Pentest</b>: HackTheBox Academy, TryHackMe, OSCP.</li>
              <li><b>AD / Red Team</b>: CRTO, CRTP, OSEP.</li>
              <li><b>Cloud</b>: flaws.cloud, CloudGoat, AWSGoat, AzureGoat.</li>
              <li><b>Blue Team</b>: BTL1/BTL2, SOC-200, SANS GIAC (GCIA, GCFA).</li>
              <li><b>DFIR</b>: 13Cubed, DFIR.training, SANS FOR-508.</li>
            </ul>
            <Callout kind="info" title="Final advice">Cybersecurity is a marathon, not a sprint. Spend an hour daily reading and practicing — within a year you'll be in the top 5% of your peers.</Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
