"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="recon">
      <L
        ar={<>
          <Section title="هو إحنا بنعمل Recon ليه أصلاً؟ و ليه 70% من نجاح الهجوم بيتقرر هنا؟">
            <p>الـ Reconnaissance ببساطة هو إنك تعرف خصمك قبل ما تلمسه. كل ما تجمع معلومات أكتر، كل ما فرصتك تخش من غير ما حد يحس بيك بتزيد. أي حد بيقفز على المرحلة دي بيحرق نفسه.</p>
            <Analogy>تخيل حرامي محترم بيخطط لسرقة بنك. مش هيدخل أول يوم — هيقعد على القهوة اللي قصاده أسبوع كامل يراقب: الموظفين بييجوا إمتى؟ مين اللي ماسك المفاتيح؟ عربية الفلوس بتنزل الساعة كام؟ ده بالظبط شغلنا في الـ Recon.</Analogy>
          </Section>
          <Section title="نوعين Recon — اعرف الفرق قبل ما تتحرك">
            <TwoCol>
              <Card title="Passive — استطلاع سلبي" color="amber">من غير ما تلمس الهدف خالص. بتعتمد على محركات بحث و أرشيفات و قواعد بيانات مفتوحة. الهدف مش شايف أي request منك. <b>دي أهدى سكة</b>.</Card>
              <Card title="Active — استطلاع نشط" color="red">بتبعت requests مباشرة للهدف (DNS, HTTP, ports). أسرع و أدق، بس ممكن يظهر في الـ logs بتاعته.</Card>
            </TwoCol>
          </Section>
          <Section title="OSINT — الذهب اللي مرمي في الشارع">
            <h3>1. معلومات المؤسسة</h3>
            <ul>
              <li><b>WHOIS</b> — صاحب الدومين، تاريخ التسجيل، إيميل المسؤول.</li>
              <li><b>crt.sh</b> — كل شهادة SSL اتطلعت باسم الشركة → بتفضح الـ subdomains.</li>
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
          <Section title="Subdomain Enumeration — قلب الـ Web Recon">
            <p>كل subdomain = سطح هجوم جديد. غالباً الـ staging.target.com أو old.target.com بيكون أضعف بكتير من الموقع الرئيسي — اللي محدش فاكره هو اللي بيتحرق.</p>
            <Terminal lines={[
              { p: "subfinder -d target.gov -all -silent | tee subs.txt" },
              { p: "amass enum -passive -d target.gov >> subs.txt" },
              { p: "assetfinder --subs-only target.gov >> subs.txt" },
              { p: "sort -u subs.txt | httpx -silent -title -tech-detect -status-code" },
              { o: "https://api.target.gov [200] [API Gateway] [nginx]\nhttps://staging.target.gov [403] [WordPress 5.8]\nhttps://vpn.target.gov [200] [Fortinet SSL VPN]" },
            ]} />
            <Callout kind="info" title="ليه أكتر من أداة؟">كل أداة بتسحب من مصادر مختلفة. لما تجمعهم بتكشف 30-50% subdomains زيادة. اللي بيكتفي بأداة واحدة بيسيب نص الهدف ورا ضهره.</Callout>
          </Section>
          <Section title="Tech Fingerprinting — اعرف الخصم بيلبس إيه">
            <ul>
              <li><b>Wappalyzer</b> / <b>WhatWeb</b> — بيحدد الـ framework و الإصدار و الـ CDN.</li>
              <li><b>BuiltWith</b> — بيقولك الاستضافة و مزود الإيميل.</li>
              <li><b>favicon hash</b> — بصمة فريدة بتفضح منتجات داخلية معروفة.</li>
            </ul>
            <Terminal lines={[
              { p: "whatweb https://target.gov" },
              { o: "nginx[1.24], WordPress[6.2], jQuery[3.6], PHP[8.1]" },
            ]} />
          </Section>
          <Section title="الدفاع: خلي الـ Recon يبقى صداع للمهاجم">
            <ul>
              <li>اخفي الـ subdomains الداخلية ورا Cloudflare / WAF و اقفل الـ DNS zone transfer.</li>
              <li>راقب crt.sh لو شهادة جديدة طلعت باسمك — ده مؤشر إن حد بيتفرج عليك.</li>
              <li>اعمل scan دوري على GitHub بـ truffleHog / gitleaks قبل ما الأسرار تتسرب.</li>
              <li>درّب الناس: بلاش تفاصيل الـ stack تتنشر على LinkedIn و Stack Overflow.</li>
              <li>راقب User-Agents لأدوات الـ Recon المشهورة (httpx, nuclei) و سجلها في الـ SIEM.</li>
            </ul>
            <Callout kind="good" title="نصيحة ناشفة">حط Canary tokens في الـ DNS — هتعرف إن حد بدأ يتلصص عليك من أول لحظة.</Callout>
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
