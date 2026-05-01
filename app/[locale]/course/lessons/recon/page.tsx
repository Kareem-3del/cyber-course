"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="recon">
      <L
        ar={<>
          <Section title="Recon هو 80% من الـ engagement">
            <p>Recon هو 80% من الـ engagement. مش الـ exploitation. وأي حد بيقولك العكس، يا إما لسه عيّل، يا إما بيبيعك كورس.</p>
            <p>تيجي تسأل ليه؟ بُص.</p>
            <p>الـ exploit بيتكتب مرة. الـ payload بيتنزل من الإنترنت. الـ shell بيفتح في ثواني.</p>
            <p>بس اللي بياخد أسابيع، اللي بيقرر إنت هتنجح ولا هتترمي بره من أول يوم — هو إنك تعرف اللي قصادك. مين هو، شغّال إيه، فاتح إيه، نسي إيه.</p>
            <Analogy>
              تخيل حرامي بنك محترم. هو هيدخل أول يوم؟
              لا.
              هيقعد على القهوة اللي قصاد البنك أسبوعين كاملين. يراقب. الموظفين بييجوا الساعة كام؟ مين اللي ماسك المفاتيح؟ عربية الفلوس بتنزل امتى؟ في كاميرا في الزاوية ولا لأ؟ البواب بينام بعد العصر؟
              ده شغلنا. مش أكتر، ومش أقل.
            </Analogy>
            <p>اللي بيستعجل على المرحلة دي بيحرق نفسه. وبيحرق العميل. وبيحرق الـ engagement كله.</p>
          </Section>
          <Section title="نوعين Recon — اعرف الفرق قبل ما تتحرك">
            <p>قبل ما تكتب أي أمر، اسأل نفسك سؤال واحد: الهدف هيشوفني ولا لأ؟</p>
            <TwoCol>
              <Card title="Passive — من بعيد لبعيد" color="amber">إنت ما بتلمسش الهدف. خالص. بتقرا في WHOIS، بتفتش في crt.sh، بتشوف Shodan، بتقلب في Wayback. الـ packets بتاعتك مش بتوصله. هو مش حاسس بيك. <b>دي السكة الصامتة</b>.</Card>
              <Card title="Active — إنت بتدق الباب" color="red">بتبعت DNS queries، بتعمل HTTP requests، بتفتح ports. أسرع وأدق، بس بتسيب أثر في الـ logs بتاعته. لو الـ blue team عندهم نص دماغ، هيشوفوك.</Card>
            </TwoCol>
            <Callout kind="warn" title="الغلطة اللي بيقع فيها 90% من اللي بيبدأوا">
              ولد جديد، اتحمّس، فتح nuclei من الـ IP بتاع البيت، ضرب target.gov بـ 5000 request في 3 دقايق.
              النتيجة؟
              الـ IP بتاعه اتحرق في أول ساعة. الـ engagement اتفضح. العميل اتصل غضبان.
              لو هتعمل Active، يبقى من VPS منفصل، بـ rate-limit محترم، وبـ rotating proxies لو الهدف حساس. مش من شبكة WE اللي في البيت، يا نجم.
            </Callout>
          </Section>
          <Section title="السيناريو: target.gov من الصفر">
            <p>تعالى نمشي خطوة خطوة. الهدف افتراضي اسمه target.gov. مفيش أي معلومة عندك غير الدومين ده. ابدأ منين؟</p>
            <h3>المرحلة الأولى: Passive — قبل ما تلمسه</h3>
            <p>أول حاجة: WHOIS. مين مسجّل الدومين؟ امتى؟ إيميل المسؤول إيه؟</p>
            <p>تاني حاجة: crt.sh. كل شهادة SSL اتطلعت على نطاقه = subdomain مكشوف. الناس بتنسى إن الـ Certificate Transparency logs مفتوحة للعالم كله. هتلاقي vpn.target.gov و dev-internal.target.gov و staging-old.target.gov بتطلع زي الفجل.</p>
            <p>تالت حاجة: Shodan. حط الدومين أو الـ ASN، شوف كل جهاز ليه IP عام. RDP مفتوح؟ Jenkins من غير auth؟ Elasticsearch على 9200 من غير password؟ كله هنا.</p>
            <p>رابع حاجة: Wayback Machine. الموقع بتاعهم من 2018 كان شكله إيه؟ في endpoints قديمة لسه شغّالة في الباكند ومحدش فاكرها؟ غالباً آه.</p>
          </Section>
          <Section title="OSINT — الذهب اللي مرمي في الشارع">
            <p>الناس بتفتكر إن المعلومات الحساسة بتيجي من اختراقات. لا يا سيدي. الناس بنفسها بتنشرها. على LinkedIn، على GitHub، على Stack Overflow، في الـ EXIF بتاع الصور.</p>
            <h3>1. معلومات المؤسسة</h3>
            <ul>
              <li><b>WHOIS</b> — صاحب الدومين، تاريخ التسجيل، إيميل المسؤول.</li>
              <li><b>crt.sh</b> — كل شهادة SSL اتطلعت باسم الشركة، بتفضح الـ subdomains.</li>
              <li><b>Shodan / Censys / FOFA</b> — محركات بحث لأي جهاز متصل بالنت.</li>
              <li><b>Wayback Machine</b> — نسخ قديمة من الموقع بتكشف endpoints اتشالت.</li>
            </ul>
            <Terminal lines={[
              { p: "whois target.gov" },
              { p: "curl -s 'https://crt.sh/?q=%25.target.gov&output=json' | jq -r '.[].name_value' | sort -u" },
              { o: "api.target.gov\nmail.target.gov\nstaging.target.gov\nvpn.target.gov" },
            ]} />
            <h3>2. معلومات الموظفين</h3>
            <ul>
              <li>LinkedIn — هيكل الشركة، أسامي، التكنولوجيا اللي شغالين بيها.</li>
              <li>Hunter.io / EmailRep — إيميلات الموظفين.</li>
              <li>GitHub / GitLab — كود متسرب، مفاتيح API، أسرار نسيها حد في الـ commits.</li>
              <li>HaveIBeenPwned / Dehashed — تسريبات passwords قديمة لموظفين الشركة.</li>
            </ul>
            <Code lang="GitHub Dorks">{`# دور على أسرار متسربة في GitHub
"target.gov" password
"target.gov" filename:.env
"target.gov" AKIA  # AWS keys
org:target-gov filename:config.yml`}</Code>
          </Section>
          <Section title="المرحلة التانية: Active — subfinder + httpx + nuclei">
            <p>خلصت Passive؟ عندك ليستة subdomains، عندك IPs، عندك فكرة عن الـ stack. كويس. دلوقتي تيجي تتحرك.</p>
            <p>بس مش من الـ IP بتاعك. من VPS منفصل. وبـ rate-limit. وبـ User-Agent مش بيقول "أنا nuclei".</p>
            <Terminal lines={[
              { p: "subfinder -d target.gov -all -silent | tee subs.txt" },
              { p: "amass enum -passive -d target.gov >> subs.txt" },
              { p: "assetfinder --subs-only target.gov >> subs.txt" },
              { p: "sort -u subs.txt | httpx -silent -title -tech-detect -status-code -rate-limit 10" },
              { o: "https://api.target.gov [200] [API Gateway] [nginx]\nhttps://staging.target.gov [403] [WordPress 5.8]\nhttps://vpn.target.gov [200] [Fortinet SSL VPN]" },
              { p: "nuclei -l live.txt -severity high,critical -rate-limit 20" },
              { o: "[CVE-2023-XXXX] [http] [critical] https://staging.target.gov" },
            ]} />
            <Callout kind="info" title="ليه أكتر من أداة في الـ subdomain enum؟">كل أداة بتسحب من مصادر مختلفة — passive DNS، CT logs، scrapers. لما تجمعهم بتكشف 30-50% subdomains زيادة. اللي بيكتفي بأداة واحدة بيسيب نص الهدف ورا ضهره.</Callout>
            <Callout kind="warn" title="بُص: الـ rate-limit مش زينة">
              nuclei بيضرب templates بالآلاف. لو سيبته على الـ default، إنت بتعمل DDoS صغير على الهدف. الـ WAF بتاعهم هيقفل الـ IP بتاعك في 30 ثانية، والـ engagement بتاعك خلص.
              حط <code>-rate-limit</code> دايماً. وحط <code>-bulk-size</code> صغير. ما تستعجلش.
            </Callout>
          </Section>
          <Section title="Tech Fingerprinting — اعرف الخصم بيلبس إيه">
            <ul>
              <li><b>Wappalyzer</b> / <b>WhatWeb</b> — بيحدد الـ framework والإصدار والـ CDN.</li>
              <li><b>BuiltWith</b> — بيقولك الاستضافة ومزود الإيميل.</li>
              <li><b>favicon hash</b> — بصمة فريدة بتفضح منتجات داخلية معروفة.</li>
            </ul>
            <Terminal lines={[
              { p: "whatweb https://target.gov" },
              { o: "nginx[1.24], WordPress[6.2], jQuery[3.6], PHP[8.1]" },
            ]} />
          </Section>
          <Section title="قصة حقيقية: Capital One — كله بدأ من recon">
            <p>2019. Capital One. 100 مليون عميل اتسرّبت بياناتهم.</p>
            <p>الناس فاكرة إن الموضوع كان zero-day معقد. لا.</p>
            <p>المهاجمة (Paige Thompson) عملت recon بسيط جداً على infrastructure الشركة على AWS. لقت WAF متعرّف غلط (misconfigured)، فيه ثغرة SSRF. ضربت الـ metadata service بتاع EC2 على <code>169.254.169.254</code>، طلّعت IAM credentials، ومن هناك خدت كل الـ S3 buckets.</p>
            <p>الـ exploitation كان 5 دقايق. الـ recon — اللي شافت بيه إن الـ WAF بتاعهم متظبّط غلط — ده اللي خد الأسابيع.</p>
            <p>الدرس؟ الـ recon مش بيكشفلك بس "إيه فاتح". بيكشفلك "إيه متظبّط غلط". وده أهم بكتير.</p>
          </Section>
          <Section title="الحماية: الـ SOC بيشوف الـ recon إزاي؟">
            <p>لو إنت في الـ blue team، اسأل نفسك: لو حد عمل recon عليّا دلوقتي، هشوفه؟</p>
            <p>الإجابة الصادقة: غالباً لأ. وده اللي لازم يتغيّر.</p>
            <ul>
              <li><b>DNS spike على subdomains مش موجودة</b> — لو فجأة في 5000 query على <code>random.target.gov</code> و<code>test123.target.gov</code>، ده DNS bruteforce. سجّله في الـ SIEM.</li>
              <li><b>Certificate Transparency monitoring</b> — اشترك في feed بتاع crt.sh لكل شهادة بتتطلع باسم نطاقك. لو حد طلّع شهادة على subdomain إنت ما طلبتهاش، يبقى في حد بيلعب.</li>
              <li><b>User-Agent fingerprinting</b> — httpx، nuclei، nikto، gobuster — كلهم بيسيبوا signatures معروفة. اعمل rules في الـ WAF.</li>
              <li><b>اخفي الـ subdomains الداخلية</b> ورا Cloudflare/WAF واقفل الـ DNS zone transfer.</li>
              <li><b>scan على GitHub</b> بـ truffleHog / gitleaks قبل ما الأسرار تتسرب.</li>
              <li><b>درّب الناس</b>: تفاصيل الـ stack ما تتنشرش على LinkedIn ولا Stack Overflow.</li>
            </ul>
            <Callout kind="good" title="الخلاصة الحمائية">
              حط Canary tokens في الـ DNS وفي الـ S3 buckets الوهمية. أول ما حد يلمسهم، إنت بتعرف إن في recon شغّال — قبل ما الـ exploitation تبدأ بأسابيع.
            </Callout>
          </Section>
          <Section title="الخلاصة الناشفة">
            <p>اكتبها على ظهر إيدك:</p>
            <p>Recon هو الفرق بين الـ engagement اللي بيخلص في يومين والـ engagement اللي بيوقف عند الـ scoping.</p>
            <p>اللي بيستعجل، بيحرق نفسه. اللي بيقعد يبص أسبوع، بيلاقي الباب مفتوح من الأصل.</p>
            <p>اوعى تكسر قبل ما تشوف. اشتغل صح من الأول.</p>
          </Section>
        </>}
        en={<>
          <Section title="What is reconnaissance, and why does 70% of attack success depend on it?">
            <p>Reconnaissance is the information-gathering phase before any intrusion attempt. The more you know about the target, the higher your chance of success without being noticed.</p>
            <Analogy>Imagine a clever thief targeting a bank. They don't break in on day one — they sit in the cafe across the street for a week and watch: when do staff arrive? Who carries the keys? When does the cash truck come? That's exactly what recon is.</Analogy>
          </Section>
          <Section title="Two kinds of recon">
            <TwoCol>
              <Card title="Passive" color="amber">Without touching the target directly. You use search engines, archives, and public databases. The target sees no traffic from you. <b>The stealthiest mode</b>.</Card>
              <Card title="Active" color="red">Direct probes against the target (DNS, HTTP, ports). Faster and more accurate, but may show up in the target's logs.</Card>
            </TwoCol>
          </Section>
          <Section title="OSINT — Open Source Intelligence">
            <h3>1. Organizational info</h3>
            <ul>
              <li><b>WHOIS</b> — domain owner, registration date, admin email.</li>
              <li><b>crt.sh</b> — every issued SSL certificate → exposes subdomains.</li>
              <li><b>Shodan / Censys / FOFA</b> — search engines for every internet-connected device.</li>
              <li><b>Wayback Machine</b> — old snapshots that reveal removed endpoints.</li>
            </ul>
            <Terminal lines={[
              { p: "whois target.gov" },
              { p: "curl -s 'https://crt.sh/?q=%25.target.gov&output=json' | jq -r '.[].name_value' | sort -u" },
              { o: "api.target.gov\nmail.target.gov\nstaging.target.gov\nvpn.target.gov" },
            ]} />
            <h3>2. Employee info</h3>
            <ul>
              <li>LinkedIn — org structure, names, technologies in use.</li>
              <li>Hunter.io / EmailRep — employee email addresses.</li>
              <li>GitHub / GitLab — leaked code, API keys, secrets in commits.</li>
              <li>HaveIBeenPwned / Dehashed — previous password breaches affecting staff.</li>
            </ul>
            <Code lang="GitHub Dorks">{`# Hunting for leaked secrets on GitHub
"target.gov" password
"target.gov" filename:.env
"target.gov" AKIA  # AWS keys
org:target-gov filename:config.yml`}</Code>
          </Section>
          <Section title="Subdomain enumeration — the heart of web recon">
            <p>Every subdomain = a new attack surface. Often staging.target.com or old.target.com is much weaker than the main site.</p>
            <Terminal lines={[
              { p: "subfinder -d target.gov -all -silent | tee subs.txt" },
              { p: "amass enum -passive -d target.gov >> subs.txt" },
              { p: "assetfinder --subs-only target.gov >> subs.txt" },
              { p: "sort -u subs.txt | httpx -silent -title -tech-detect -status-code" },
              { o: "https://api.target.gov [200] [API Gateway] [nginx]\nhttps://staging.target.gov [403] [WordPress 5.8]\nhttps://vpn.target.gov [200] [Fortinet SSL VPN]" },
            ]} />
            <Callout kind="info" title="Why use multiple tools?">Each pulls from different sources. Combined, they reveal 30–50% more subdomains.</Callout>
          </Section>
          <Section title="Tech fingerprinting">
            <ul>
              <li><b>Wappalyzer</b> / <b>WhatWeb</b> — identify framework, version, CDN.</li>
              <li><b>BuiltWith</b> — shows hosting and email providers.</li>
              <li><b>favicon hash</b> — a unique fingerprint that can reveal internal products.</li>
            </ul>
            <Terminal lines={[
              { p: "whatweb https://target.gov" },
              { o: "nginx[1.24], WordPress[6.2], jQuery[3.6], PHP[8.1]" },
            ]} />
          </Section>
          <Section title="Defense: making recon harder">
            <ul>
              <li>Hide internal subdomains behind Cloudflare / WAF and block DNS zone transfer.</li>
              <li>Monitor crt.sh for new certificates issued under your name (early recon signal).</li>
              <li>Continuously scan GitHub with truffleHog / gitleaks to prevent secret leakage.</li>
              <li>Train staff: don't post tech-stack details on LinkedIn / Stack Overflow.</li>
              <li>Track User-Agents of known recon tools (httpx, nuclei) and log them in your SIEM.</li>
            </ul>
            <Callout kind="good" title="Tip">DNS Canary tokens give you an early warning the moment recon starts.</Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
