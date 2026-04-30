"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="recon">
      <L
        ar={<>
          <Section title="ما هو الاستطلاع و لماذا 70% من نجاح الهجوم يعتمد عليه؟">
            <p>الاستطلاع (Reconnaissance) هو مرحلة جمع المعلومات قبل أي محاولة اختراق. كلما عرفت أكثر عن الهدف، كلما زادت احتمالية نجاحك دون أن يلاحظك أحد.</p>
            <Analogy>تخيل لصاً ذكياً يريد سرقة بنك. لن يدخل في اليوم الأول. سيجلس في المقهى المقابل أسبوعاً كاملاً يراقب: متى يأتي الموظفون؟ من يحمل المفاتيح؟ متى تأتي شاحنة النقود؟ هذه بالضبط مهمة الاستطلاع.</Analogy>
          </Section>
          <Section title="نوعا الاستطلاع">
            <TwoCol>
              <Card title="استطلاع سلبي — Passive" color="amber">بدون لمس الهدف مباشرة. تستخدم محركات بحث، أرشيفات، و قواعد بيانات عامة. الهدف لا يرى أي طلب منك. <b>الأكثر خفاءً</b>.</Card>
              <Card title="استطلاع نشط — Active" color="red">ترسل طلبات مباشرة للهدف (DNS, HTTP, ports). أسرع و أدقّ، لكن قد يظهر في سجلات الهدف.</Card>
            </TwoCol>
          </Section>
          <Section title="OSINT — الاستخبارات من المصادر المفتوحة">
            <h3>1. معلومات المؤسسة</h3>
            <ul>
              <li><b>WHOIS</b> — مالك الدومين، تاريخ التسجيل، إيميل المسؤول.</li>
              <li><b>crt.sh</b> — كل الشهادات SSL الصادرة → كشف الـ subdomains.</li>
              <li><b>Shodan / Censys / FOFA</b> — محركات بحث لكل جهاز متصل بالإنترنت.</li>
              <li><b>Wayback Machine</b> — نسخ قديمة من الموقع تكشف endpoints محذوفة.</li>
            </ul>
            <Terminal lines={[
              { p: "whois target.gov" },
              { p: "curl -s 'https://crt.sh/?q=%25.target.gov&output=json' | jq -r '.[].name_value' | sort -u" },
              { o: "api.target.gov\nmail.target.gov\nstaging.target.gov\nvpn.target.gov" },
            ]} />
            <h3>2. معلومات الموظفين</h3>
            <ul>
              <li>LinkedIn — هيكل الشركة، أسماء، تقنيات يستخدمونها.</li>
              <li>Hunter.io / EmailRep — إيميلات الموظفين.</li>
              <li>GitHub / GitLab — كود مسرّب، مفاتيح API، أسرار في الـ commits.</li>
              <li>HaveIBeenPwned / Dehashed — تسريبات سابقة لكلمات مرور الموظفين.</li>
            </ul>
            <Code lang="GitHub Dorks">{`# ابحث عن أسرار مسرّبة في GitHub
"target.gov" password
"target.gov" filename:.env
"target.gov" AKIA  # AWS keys
org:target-gov filename:config.yml`}</Code>
          </Section>
          <Section title="تعداد الـ Subdomains — قلب الاستطلاع للويب">
            <p>كل subdomain = سطح هجوم جديد. غالباً ما يكون الـ staging.target.com أو old.target.com أضعف من الموقع الرئيسي.</p>
            <Terminal lines={[
              { p: "subfinder -d target.gov -all -silent | tee subs.txt" },
              { p: "amass enum -passive -d target.gov >> subs.txt" },
              { p: "assetfinder --subs-only target.gov >> subs.txt" },
              { p: "sort -u subs.txt | httpx -silent -title -tech-detect -status-code" },
              { o: "https://api.target.gov [200] [API Gateway] [nginx]\nhttps://staging.target.gov [403] [WordPress 5.8]\nhttps://vpn.target.gov [200] [Fortinet SSL VPN]" },
            ]} />
            <Callout kind="info" title="لماذا تستخدم عدة أدوات؟">كل أداة تستخدم مصادر مختلفة. الجمع بينها يكشف 30-50% أكثر من الـ subdomains.</Callout>
          </Section>
          <Section title="تتبع التقنيات — Tech Fingerprinting">
            <ul>
              <li><b>Wappalyzer</b> / <b>WhatWeb</b> — يحدد إطار العمل، الإصدار، الـ CDN.</li>
              <li><b>BuiltWith</b> — يبيّن مزود الاستضافة و البريد.</li>
              <li><b>favicon hash</b> — بصمة فريدة قد تكشف منتجات داخلية شائعة.</li>
            </ul>
            <Terminal lines={[
              { p: "whatweb https://target.gov" },
              { o: "nginx[1.24], WordPress[6.2], jQuery[3.6], PHP[8.1]" },
            ]} />
          </Section>
          <Section title="الدفاع: كيف تجعل الاستطلاع صعباً عليه؟">
            <ul>
              <li>أخفِ الـ subdomains الداخلية خلف Cloudflare / WAF و امنع DNS zone transfer.</li>
              <li>راقب crt.sh لشهادات جديدة تُصدر باسمك (مؤشر استطلاع).</li>
              <li>افحص GitHub دورياً بـ truffleHog / gitleaks لمنع تسريب الأسرار.</li>
              <li>درّب الموظفين: لا تنشر تفاصيل التقنيات في LinkedIn / Stack Overflow.</li>
              <li>راقب User-Agents لأدوات الاستطلاع المعروفة (httpx, nuclei) و سجّلها في SIEM.</li>
            </ul>
            <Callout kind="good" title="معلومة">Canary tokens في الـ DNS تعطيك إنذاراً مبكراً عند بدء الاستطلاع.</Callout>
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
