"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="api-security">
      <L
        ar={<>
          <Section title="لماذا أمن الـ API هو سطح الهجوم الأهم اليوم؟">
            <Analogy>الموقع التقليدي مثل بنك بشبّاك واحد يخدم الزبائن. الـ API الحديث مثل بنك بألف باب خلفي للموظفين، الموبايل، الشركاء، الشركات الأخرى. نسيت إغلاق باب واحد = مصيبة. أكثر من 70% من حركة الويب الآن APIs.</Analogy>
          </Section>

          <Section title="OWASP API Security Top 10 (2023)">
            <ol>
              <li><b>API1 — BOLA (Broken Object Level Auth)</b>: نسخة الـ IDOR على API. أكثر الثغرات شيوعاً.</li>
              <li><b>API2 — Broken Authentication</b>: ضعف JWT، تخمين tokens.</li>
              <li><b>API3 — Broken Object Property Level Auth</b>: مستخدم يعدّل حقولاً ليس مسموحاً له بها (mass assignment).</li>
              <li><b>API4 — Unrestricted Resource Consumption</b>: لا rate limit → DoS أو brute force.</li>
              <li><b>API5 — Broken Function Level Auth</b>: المستخدم العادي يصل لـ <code>/admin/*</code>.</li>
              <li><b>API6 — Unrestricted Access to Sensitive Business Flows</b>: شراء آلاف العناصر بسعر تخفيض.</li>
              <li><b>API7 — Server Side Request Forgery (SSRF)</b>.</li>
              <li><b>API8 — Security Misconfiguration</b>: CORS مفتوح، debug endpoints.</li>
              <li><b>API9 — Improper Inventory Management</b>: APIs قديمة (v1) منسية و مستخدمة.</li>
              <li><b>API10 — Unsafe Consumption of 3rd-party APIs</b>.</li>
            </ol>
          </Section>

          <Section title="BOLA — أكثر الثغرات شيوعاً">
            <Code lang="HTTP">{`# طلب شرعي
GET /api/v1/users/1042/orders
Authorization: Bearer eyJ...

# تغيير المعرّف فقط
GET /api/v1/users/1043/orders
Authorization: Bearer eyJ...   ← نفس التوكن
# لو نجح: BOLA — السيرفر لم يفحص الملكية`}</Code>
            <Callout kind="good" title="الدفاع">
              في كل endpoint يجب أن يكون: <code>WHERE owner_id = current_user.id</code>.
              لا تعتمد فقط على الـ ID في الـ URL. استخدم UUIDs لتقليل التخمين.
            </Callout>
          </Section>

          <Section title="GraphQL — سطح هجوم خاص">
            <ul>
              <li><b>Introspection</b> — كشف كل الـ schema (عطّله في الإنتاج).</li>
              <li><b>Query depth attacks</b> — query عميق يستهلك الـ CPU.</li>
              <li><b>Field duplication / aliasing</b> — لاختراق rate limits.</li>
              <li><b>Batching attacks</b> — تجربة كل كلمات السر في طلب واحد.</li>
              <li><b>SQL/NoSQL injection</b> داخل الـ resolvers.</li>
            </ul>
            <Code lang="graphql attack">{`# Introspection للكشف
{ __schema { types { name fields { name } } } }

# Batching brute-force
[
  { "query": "mutation { login(u: \\"admin\\", p: \\"a\\") }" },
  { "query": "mutation { login(u: \\"admin\\", p: \\"b\\") }" },
  ...
]`}</Code>
            <p>أدوات: <b>graphql-cop, InQL, clairvoyance, GraphQLmap</b>.</p>
          </Section>

          <Section title="OAuth 2.0 / OIDC — الأخطاء الشائعة">
            <ul>
              <li><b>Implicit flow</b> — مهجور، لا تستخدمه.</li>
              <li><b>Missing PKCE</b> في الموبايل و SPAs.</li>
              <li><b>redirect_uri</b> غير محدد بدقة → سرقة code.</li>
              <li><b>State parameter</b> مفقود → CSRF.</li>
              <li>قبول tokens من أي issuer.</li>
              <li>عدم التحقق من <code>aud</code> داخل الـ JWT.</li>
            </ul>
            <Callout kind="info" title="الأمان الحديث">
              استخدم <b>Authorization Code + PKCE</b> دائماً، حتى للـ SPAs. خزّن tokens في <b>HttpOnly cookies</b>،
              لا في localStorage.
            </Callout>
          </Section>

          <Section title="Rate Limiting و DoS">
            <ul>
              <li>على مستوى الـ user, IP, و endpoint منفصلين.</li>
              <li>استخدم <b>token bucket</b> أو <b>sliding window</b>.</li>
              <li>أبطئ الـ login بعد 3 محاولات (exponential backoff).</li>
              <li>راقب <b>API spike anomalies</b> في الـ SIEM.</li>
              <li>أدوات: <b>Cloudflare Rate Limiting, AWS WAF rate-based rules, Redis-cell, envoy ratelimit</b>.</li>
            </ul>
          </Section>

          <Section title="API Discovery و Inventory">
            <p>لا يمكنك حماية ما لا تعرفه. الـ <b>shadow APIs</b> و <b>zombie APIs</b> أكبر مخاطر اليوم.</p>
            <ul>
              <li><b>Salt Security, Noname, 42Crunch, Akamai API Security</b>.</li>
              <li>توليد <b>OpenAPI specs</b> تلقائياً من الـ traffic.</li>
              <li>مراجعة دورية للـ deprecated endpoints.</li>
            </ul>
          </Section>

          <Section title="اختبار الـ APIs">
            <Code lang="tools">{`# Discovery
kiterunner scan https://api.target.com -A=apiroutes-241121
arjun -u https://api.target.com/users -m GET   # parameter discovery

# Fuzzing
ffuf -u "https://api.target.com/v1/FUZZ" -w api-wordlist.txt -mc 200,401,403
postman / Insomnia / Hoppscotch

# Authn / Authz testing
ZAP API scanner
mindmap-style: Burp + Autorize plugin
graphw00f                 # GraphQL fingerprinting
clairvoyance              # GraphQL schema recovery without introspection

# Continuous
Schemathesis (property-based)
Stoplight + Spectral (lint OpenAPI)`}</Code>
          </Section>

          <Section title="مبادئ تصميم آمن">
            <ol>
              <li><b>Never trust the client</b> — فحص كل شيء على السيرفر.</li>
              <li>صلاحيات على مستوى <b>كل field</b>، لا فقط الـ object.</li>
              <li>استخدم <b>scopes</b> ضيقة و <b>short-lived tokens</b>.</li>
              <li>إصدار (versioning) واضح + خطة hijack للـ deprecation.</li>
              <li>كل response يحوي <b>Content-Type</b> صحيح + headers أمنية.</li>
              <li>سجّل كل authn/authz failures في الـ SIEM.</li>
              <li><b>Pagination</b> بحدود قصوى لمنع dump كامل.</li>
            </ol>
          </Section>
        </>}
        en={<>
          <Section title="Why is API security THE attack surface today?">
            <Analogy>A traditional website is a bank with one teller window. A modern API is a bank with a thousand back doors for staff, mobile, partners, and other companies. Forget to lock one and disaster strikes. Over 70% of web traffic is now APIs.</Analogy>
          </Section>

          <Section title="OWASP API Security Top 10 (2023)">
            <ol>
              <li><b>API1 — BOLA (Broken Object Level Auth)</b>: API's version of IDOR. The most common flaw.</li>
              <li><b>API2 — Broken Authentication</b>: weak JWT, guessable tokens.</li>
              <li><b>API3 — Broken Object Property Level Auth</b>: a user modifies fields they shouldn't (mass assignment).</li>
              <li><b>API4 — Unrestricted Resource Consumption</b>: no rate limit → DoS or brute force.</li>
              <li><b>API5 — Broken Function Level Auth</b>: a regular user reaches <code>/admin/*</code>.</li>
              <li><b>API6 — Unrestricted Access to Sensitive Business Flows</b>: buying thousands of items at sale price.</li>
              <li><b>API7 — Server Side Request Forgery (SSRF)</b>.</li>
              <li><b>API8 — Security Misconfiguration</b>: open CORS, debug endpoints.</li>
              <li><b>API9 — Improper Inventory Management</b>: forgotten old APIs (v1) still in use.</li>
              <li><b>API10 — Unsafe Consumption of 3rd-party APIs</b>.</li>
            </ol>
          </Section>

          <Section title="BOLA — the most common flaw">
            <Code lang="HTTP">{`# Legitimate request
GET /api/v1/users/1042/orders
Authorization: Bearer eyJ...

# Just change the ID
GET /api/v1/users/1043/orders
Authorization: Bearer eyJ...   ← same token
# If it works: BOLA — the server didn't check ownership`}</Code>
            <Callout kind="good" title="Defense">
              Every endpoint must include: <code>WHERE owner_id = current_user.id</code>.
              Never rely solely on the ID in the URL. Use UUIDs to limit guessability.
            </Callout>
          </Section>

          <Section title="GraphQL — its own attack surface">
            <ul>
              <li><b>Introspection</b> — exposes the entire schema (disable in production).</li>
              <li><b>Query depth attacks</b> — deep queries that burn CPU.</li>
              <li><b>Field duplication / aliasing</b> — to bypass rate limits.</li>
              <li><b>Batching attacks</b> — try every password in one request.</li>
              <li><b>SQL/NoSQL injection</b> inside resolvers.</li>
            </ul>
            <Code lang="graphql attack">{`# Introspection probing
{ __schema { types { name fields { name } } } }

# Batching brute-force
[
  { "query": "mutation { login(u: \\"admin\\", p: \\"a\\") }" },
  { "query": "mutation { login(u: \\"admin\\", p: \\"b\\") }" },
  ...
]`}</Code>
            <p>Tools: <b>graphql-cop, InQL, clairvoyance, GraphQLmap</b>.</p>
          </Section>

          <Section title="OAuth 2.0 / OIDC — common mistakes">
            <ul>
              <li><b>Implicit flow</b> — deprecated, don't use.</li>
              <li><b>Missing PKCE</b> in mobile and SPA clients.</li>
              <li><b>redirect_uri</b> not strictly defined → code theft.</li>
              <li><b>State parameter</b> missing → CSRF.</li>
              <li>Accepting tokens from any issuer.</li>
              <li>Not validating <code>aud</code> in the JWT.</li>
            </ul>
            <Callout kind="info" title="Modern security">
              Always use <b>Authorization Code + PKCE</b>, even for SPAs. Store tokens in <b>HttpOnly cookies</b>,
              never localStorage.
            </Callout>
          </Section>

          <Section title="Rate limiting and DoS">
            <ul>
              <li>Per-user, per-IP, and per-endpoint, separately.</li>
              <li>Use a <b>token bucket</b> or <b>sliding window</b>.</li>
              <li>Slow login after 3 failures (exponential backoff).</li>
              <li>Watch for <b>API spike anomalies</b> in the SIEM.</li>
              <li>Tools: <b>Cloudflare Rate Limiting, AWS WAF rate-based rules, Redis-cell, envoy ratelimit</b>.</li>
            </ul>
          </Section>

          <Section title="API discovery and inventory">
            <p>You can't protect what you don't know. <b>Shadow APIs</b> and <b>zombie APIs</b> are today's biggest risks.</p>
            <ul>
              <li><b>Salt Security, Noname, 42Crunch, Akamai API Security</b>.</li>
              <li>Auto-generate <b>OpenAPI specs</b> from live traffic.</li>
              <li>Regular reviews of deprecated endpoints.</li>
            </ul>
          </Section>

          <Section title="Testing APIs">
            <Code lang="tools">{`# Discovery
kiterunner scan https://api.target.com -A=apiroutes-241121
arjun -u https://api.target.com/users -m GET   # parameter discovery

# Fuzzing
ffuf -u "https://api.target.com/v1/FUZZ" -w api-wordlist.txt -mc 200,401,403
postman / Insomnia / Hoppscotch

# Authn / Authz testing
ZAP API scanner
Burp + Autorize plugin
graphw00f                 # GraphQL fingerprinting
clairvoyance              # GraphQL schema recovery without introspection

# Continuous
Schemathesis (property-based)
Stoplight + Spectral (lint OpenAPI)`}</Code>
          </Section>

          <Section title="Secure-design principles">
            <ol>
              <li><b>Never trust the client</b> — validate everything server-side.</li>
              <li>Authorization at the <b>field level</b>, not just the object.</li>
              <li>Use narrow <b>scopes</b> and <b>short-lived tokens</b>.</li>
              <li>Clear API versioning + a deprecation plan.</li>
              <li>Every response with proper <b>Content-Type</b> + security headers.</li>
              <li>Log all authn/authz failures to the SIEM.</li>
              <li><b>Pagination</b> with hard maximums to prevent full dumps.</li>
            </ol>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
