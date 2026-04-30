"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="api-security">
      <L
        ar={<>
          <Section title="ليه أمن الـ API هو سطح الهجوم رقم واحد دلوقتي؟">
            <Analogy>الموقع القديم زي بنك فيه شباك واحد للزباين. الـ API الحديث زي بنك فيه ألف باب خلفي: للموبايل، للموظفين، للشركاء، لشركات تانية. تنسى تقفل باب واحد = الكارثة. أكتر من 70% من ترافيك الويب دلوقتي بقا APIs.</Analogy>
          </Section>

          <Section title="OWASP API Security Top 10 (2023)">
            <ol>
              <li><b>API1 — BOLA (Broken Object Level Auth)</b>: نسخة الـ IDOR للـ API. الأكثر شيوعاً وبفارق كبير.</li>
              <li><b>API2 — Broken Authentication</b>: JWT ضعيف، tokens تتخمن.</li>
              <li><b>API3 — Broken Object Property Level Auth</b>: اليوزر بيعدل في حقول مش مسموح له بيها (mass assignment).</li>
              <li><b>API4 — Unrestricted Resource Consumption</b>: مفيش rate limit → DoS أو brute force.</li>
              <li><b>API5 — Broken Function Level Auth</b>: يوزر عادي بيوصل لـ <code>/admin/*</code>.</li>
              <li><b>API6 — Unrestricted Access to Sensitive Business Flows</b>: شراء آلاف القطع بسعر التخفيض.</li>
              <li><b>API7 — Server Side Request Forgery (SSRF)</b>.</li>
              <li><b>API8 — Security Misconfiguration</b>: CORS مفتوح على الآخر، debug endpoints سايبة.</li>
              <li><b>API9 — Improper Inventory Management</b>: APIs قديمة (v1) منسية ولسة شغالة.</li>
              <li><b>API10 — Unsafe Consumption of 3rd-party APIs</b>.</li>
            </ol>
          </Section>

          <Section title="BOLA — الثغرة الأكثر شيوعاً وأرخصها في الاكتشاف">
            <Code lang="HTTP">{`# طلب شرعي
GET /api/v1/users/1042/orders
Authorization: Bearer eyJ...

# تغيير المعرّف فقط
GET /api/v1/users/1043/orders
Authorization: Bearer eyJ...   ← نفس التوكن
# لو نجح: BOLA — السيرفر لم يفحص الملكية`}</Code>
            <Callout kind="good" title="الدفاع">
              في كل endpoint لازم يكون: <code>WHERE owner_id = current_user.id</code>.
              متعتمدش على الـ ID في الـ URL لوحده. استخدم UUIDs عشان تقلل التخمين.
            </Callout>
          </Section>

          <Section title="GraphQL — له سطح هجوم خاص بيه">
            <ul>
              <li><b>Introspection</b> — بيكشف الـ schema كاملة (اقفله في الإنتاج).</li>
              <li><b>Query depth attacks</b> — استعلامات عميقة بتاكل الـ CPU.</li>
              <li><b>Field duplication / aliasing</b> — عشان تتخطى rate limits.</li>
              <li><b>Batching attacks</b> — تجرب كل الباسوردات في request واحد.</li>
              <li><b>SQL/NoSQL injection</b> جوه الـ resolvers نفسهم.</li>
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

          <Section title="OAuth 2.0 / OIDC — الغلطات اللي بتتكرر">
            <ul>
              <li><b>Implicit flow</b> — مهجور خلاص، متستخدمهوش.</li>
              <li><b>Missing PKCE</b> في الموبايل والـ SPAs.</li>
              <li><b>redirect_uri</b> مش محدد بدقة → سرقة الـ code.</li>
              <li><b>State parameter</b> ناقص → CSRF.</li>
              <li>قبول tokens من أي issuer.</li>
              <li>مفيش فحص لـ <code>aud</code> جوه الـ JWT.</li>
            </ul>
            <Callout kind="info" title="الأمان الحديث">
              استخدم <b>Authorization Code + PKCE</b> دايماً، حتى للـ SPAs. خزّن الـ tokens في <b>HttpOnly cookies</b>،
              مش في localStorage.
            </Callout>
          </Section>

          <Section title="Rate Limiting وDoS">
            <ul>
              <li>على مستوى الـ user والـ IP والـ endpoint كل واحد لوحده.</li>
              <li>استخدم <b>token bucket</b> أو <b>sliding window</b>.</li>
              <li>بطّئ الـ login بعد 3 محاولات (exponential backoff).</li>
              <li>راقب <b>API spike anomalies</b> في الـ SIEM.</li>
              <li>الأدوات: <b>Cloudflare Rate Limiting, AWS WAF rate-based rules, Redis-cell, envoy ratelimit</b>.</li>
            </ul>
          </Section>

          <Section title="API Discovery و Inventory">
            <p>متقدرش تحمي حاجة معرفش بوجودها. الـ <b>shadow APIs</b> والـ <b>zombie APIs</b> هما أكبر خطر دلوقتي.</p>
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

          <Section title="مبادئ تصميم آمن — الناشف">
            <ol>
              <li><b>Never trust the client</b> — افحص كل حاجة على السيرفر، مفيش استثناء.</li>
              <li>صلاحيات على مستوى <b>كل field</b>، مش بس الـ object.</li>
              <li>استخدم <b>scopes</b> ضيقة و<b>short-lived tokens</b>.</li>
              <li>versioning واضح + خطة deprecation معلنة.</li>
              <li>كل response معاه <b>Content-Type</b> صح + security headers.</li>
              <li>سجّل كل authn/authz failures في الـ SIEM. ده اللي هيكشف لك الهجوم.</li>
              <li><b>Pagination</b> بحدود قصوى عشان متسمحش بـ dump كامل.</li>
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
