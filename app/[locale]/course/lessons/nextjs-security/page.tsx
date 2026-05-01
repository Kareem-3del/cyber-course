"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="nextjs-security">
      <L
        ar={<>
          <Section title="ليه Next.js بيضاعف الأبواب اللي قدامه؟">
            <p>Next.js مش framework واحد. ده 7 frameworks في صندوق واحد.</p>
            <p>React frontend + Node backend + Edge middleware + RSC + Server Actions + Image Optimizer + ISR cache.</p>

            <p>- بس استنى يا حضرتك.. أنا فاكره React بس!</p>

            <p>متوقّع كالعادة يا مستجد. ده اللي بيخدع الكل. كل واحد من الـ 7 دول جبهة مستقلة بذاتها. وكل deployment فيه واحد منهم متفعّل بشكل غريب.</p>
            <Analogy>
              تخيّل مبنى بـ 7 أدوار وفيه 7 أسانسيرات مختلفة (App Router، Pages، API، Edge، Server Actions، Image، ISR).
              مش كل أسانسير بيوصل كل دور.
              ولا كل أبوابه بتقفل بنفس الطريقة.
              المهاجم برسم خريطة الأسانسيرات (المصاعد) الأول، وبعدين بيختار سكته.
              إنت كـ developer شايف الـ feature بتاعتك. هو شايف 7 مداخل.
            </Analogy>
            <Callout kind="info" title="حكاية: CVE-2025-29927 — أكبر breach في تاريخ Next">
              في مارس 2025، اتنشرت ثغرة في Next.js middleware.
              header اسمه <span className="eng">x-middleware-subrequest</span> كان موجود لمنع loops داخلية.
              المشكلة؟ مفيش validation إنه جاي من جوّه.
              attacker بيبعت <code>{`curl -H "x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware"`}</code> على /admin.
              اللي بيحصل فعلياً: الـ middleware كله بـ bypass — auth، rate limit، redirect، كله.
              آلاف التطبيقات اللي معتمدة على middleware للـ authorization اتفتحت في يوم واحد.
              الدرس: ما تعتمدش على middleware وحده. كل route يفحص الـ session بنفسه.
            </Callout>
            <Callout kind="danger" title="تذكير قانوني">
              الأمثلة دي لاختبار تطبيقاتك إنت. ما تستخدمهاش على مواقع برّه من غير إذن.
            </Callout>
          </Section>

          <Section title="CVE-2025-29927 — Middleware Authorization Bypass">
            <p>أكبر CVE في تاريخ Next.js (مارس 2025). header داخلي اسمه <span className="eng">x-middleware-subrequest</span> اتستخدم لتعدية الـ middleware authorization كله.</p>
            <Code lang="text">{`# Vulnerable: Next.js < 14.2.25 / < 15.2.3 يفحص هذا header
# لمنع loops لكن لم يعقّمه من external requests

curl -H "x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware" \\
  https://target.com/admin

# النتيجة: middleware يُتخطّى بالكامل
# auth checks في middleware.ts → bypassed
# rewrite/redirect → bypassed
# rate limit → bypassed`}</Code>
            <Callout kind="info" title="مين اتأثّر">
              أي تطبيق Next.js بيستخدم middleware للـ authorization. لو إصدارك &lt; 14.2.25 أو &lt; 15.2.3، رقّع <b>دلوقتي</b>. التحديث هو الحل الوحيد. WAF rules مجرد إسعافات أولية.
            </Callout>
            <Code lang="javascript">{`// الحماية المعمّق — لا تعتمد على middleware وحده للـ authz
// كل route يفحص في handler:
export async function GET(req) {
  const session = await getSession(req);
  if (!session?.user?.isAdmin) return new Response('forbidden', { status: 403 });
  // ...
}`}</Code>
          </Section>

          <Section title="Server Actions — باب جديد قدامه كلياً">
            <p>Server Actions = دوال بتتنادى من الـ client عن طريق POST مشفّر. بس:</p>
            <ul>
              <li><b>كل Server Action endpoint مفتوح للعامة</b> — حتى لو مفيش UI بينديها. المهاجم بيعدّ الـ actions من الـ bundle ويناديهم مباشرة.</li>
              <li><b>الـ Authentication مش بتحصل تلقائي</b> — لازم تفحصها يدوي في كل action.</li>
              <li><b>Action IDs ثابتة عبر الـ deploys</b> (لو ما اتشفّروش). المهاجم بيحفظ الـ ID ويعيد استخدامه.</li>
              <li><b>FormData parsing</b> — أنواع مش متوقعة (Files بتيجي كـ string).</li>
            </ul>
            <Code lang="javascript">{`// خطر — Server Action بدون auth
'use server';
export async function deleteUser(id: string) {
  await db.user.delete({ where: { id } });
}

// أي مستخدم يستطيع استدعاءها (POST مع action ID)
// curl -X POST https://target.com/page \\
//   -H "Next-Action: 7f8a..." \\
//   -d '["userid"]'

// آمن
'use server';
export async function deleteUser(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) throw new Error('unauthorized');
  if (!validateId(id)) throw new Error('bad id');
  await db.user.delete({ where: { id } });
}

// في next.config.js — تشفير action IDs
experimental: {
  serverActions: { allowedOrigins: ['app.target.gov'] }
}`}</Code>
            <Callout kind="info" title="Action ID enumeration">
              في dev mode، الـ action IDs قابلة للتعداد من الـ bundle. في prod، Next بيشفّرها بـ encryption key. <b>ظبّط <span className="eng">NEXT_SERVER_ACTIONS_ENCRYPTION_KEY</span></b> بنفسك، وإلا كل deploy بيولّد key جديد ويكسر الـ clients اللي شغّالة من فترة.
            </Callout>
          </Section>

          <Section title="React Server Components (RSC) — Data Leaks">
            <Code lang="tsx">{`// خطر — تمرير user object كامل إلى client component
// app/profile/page.tsx (Server Component)
export default async function Page() {
  const user = await db.user.findUnique({ where: { id }, include: { ... } });
  return <ProfileCard user={user} />;   // user يحوي passwordHash, email...
}

// كل props إلى Client Component تُسلسل و تُرسل إلى المتصفح
// المهاجم يفتح DevTools → ينظر إلى __NEXT_DATA__ أو RSC payload و يقرأ كل شيء

// آمن — مرّر فقط ما يحتاج
return <ProfileCard
  name={user.name}
  avatar={user.avatar}
  // لا passwordHash, mfaSecret, internal flags
/>;

// أو DTO صريح
const dto = pick(user, ['id', 'name', 'avatar']);
return <ProfileCard user={dto} />;`}</Code>
            <Callout kind="danger" title="مهم">
              "use server" و "use client" حدود فعلية بين العالمين. اللي بيفضل على السيرفر هو <b>بس</b> اللي ما بتمررهوش لـ client component ولا بتـ return من server action. السرّيات تبقى في server-only files (مثلاً package <span className="eng">server-only</span>).
            </Callout>
          </Section>

          <Section title="API Routes / Route Handlers">
            <Code lang="typescript">{`// app/api/user/[id]/route.ts
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // خطر بدون auth
  return Response.json(await db.user.findUnique({ where: { id: params.id } }));
}

// IDOR: GET /api/user/123 ← أي user يقرأ أي user
// + DTO leak

// آمن
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('unauthorized', { status: 401 });

  // ownership
  if (params.id !== session.user.id && !session.user.isAdmin) {
    return new Response('forbidden', { status: 403 });
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true }   // explicit fields
  });
  return Response.json(user);
}`}</Code>
          </Section>

          <Section title="ISR / Cache Poisoning">
            <p>Next.js بيـ cache صفحات وAPI responses بالـ URL. المهاجم يقدر يسمّم الـ cache بطلب هو متحكّم فيه.</p>
            <Code lang="text">{`# في app/products/[slug]/page.tsx
# revalidate = 3600

# المهاجم يستخدم header غير عادي يصل إلى logic:
GET /products/widget HTTP/1.1
X-Forwarded-Host: evil.com

# داخل الصفحة:
const url = headers().get('x-forwarded-host');   ← يستخدمه في canonical link

# النتيجة: cached version لـ /products/widget يحوي canonical = evil.com
# كل user لاحق يصل لنفس الصفحة المسمومة`}</Code>
            <Callout kind="good" title="الحماية">
              <ul>
                <li>متعتمدش على request headers وأنت بترسم cached pages.</li>
                <li>عرّف <span className="eng">cache key</span> بصراحة — متخليش Next يستنتج لوحده.</li>
                <li>اضبط الـ <span className="eng">trust proxy</span> headers.</li>
                <li><span className="eng">revalidateTag</span> و <span className="eng">revalidatePath</span> لازم يطلبوا auth أو secret.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Image Optimizer SSRF">
            <p>Next عنده endpoint اسمه <span className="eng">/_next/image</span> بيـ fetch أي URL عشان يحسّنه. لو الـ <span className="eng">remotePatterns</span> مفتوحة، الـ endpoint ده بيبقى SSRF proxy على طبق.</p>
            <Code lang="javascript">{`// next.config.js — خطر
images: {
  domains: ['*'],     // أو dangerouslyAllowSVG: true
  remotePatterns: [{ protocol: 'https', hostname: '**' }]
}

// PoC — قراءة AWS metadata من خلف الخادم
GET /_next/image?url=http://169.254.169.254/latest/meta-data/&w=128&q=75

// SVG-based XSS لو dangerouslyAllowSVG: true بدون CSP
// (افتح SVG فيه <script>)

// آمن
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'cdn.target.gov' },
    { protocol: 'https', hostname: 'images.target.gov' }
  ],
  // dangerouslyAllowSVG: false (افتراضي)
  contentSecurityPolicy: "default-src 'self'; script-src 'none';"
}`}</Code>
          </Section>

          <Section title="Open Redirect عبر next/router">
            <Code lang="javascript">{`// خطر
const router = useRouter();
router.push(searchParams.get('next'));   // المهاجم يعيد توجيه

// PoC: /login?next=//evil.com → بعد login يذهب لـ evil.com
// أو next=javascript:alert(1)

// آمن
function safeNext(n: string) {
  if (!n) return '/';
  if (!n.startsWith('/') || n.startsWith('//')) return '/';
  return n;
}
router.push(safeNext(searchParams.get('next')));`}</Code>
          </Section>

          <Section title="Environment variables — تسرّبات شائعة">
            <ul>
              <li><b>NEXT_PUBLIC_*</b> بتتحقن في bundle الـ client. <b>متحطش</b> secrets فيها أبداً.</li>
              <li><b>process.env في Server Component</b> آمن، بس لو مرّرته لـ Client Component، خلاص اتنشر.</li>
              <li><b>.env.local في git</b> — حطّه في .gitignore. استخدم secret manager في prod (Vercel env, AWS Secrets Manager).</li>
              <li><b>Build-time vs runtime</b> — السرّ في NEXT_PUBLIC بيتحط وقت البناء، مش هيتغيّر من غير rebuild.</li>
            </ul>
            <Code lang="javascript">{`// server-only — Next مكتبة تمنع الاستيراد من client component
// app/lib/secret.ts
import 'server-only';
export const apiKey = process.env.API_KEY;

// لو client component استورد هذا، build يفشل. حماية compile-time.`}</Code>
          </Section>

          <Section title="Authentication — Auth.js / Clerk pitfalls">
            <Code lang="typescript">{`// next-auth (Auth.js) — أخطاء شائعة
export const authOptions = {
  providers: [...],
  // خطر — لم يضبط secret
  // secret: process.env.NEXTAUTH_SECRET,   ← مطلوب في prod

  // خطر — JWT بدون encryption
  jwt: { encryption: false },              ← قبل v4 default خطر

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;     // مدخل الـ role في JWT
      return token;
    },
    async session({ session, token }) {
      // خطر — تمرير token كاملاً للـ client
      session.user = token;                  // يشمل internal flags
      // آمن
      session.user = { id: token.sub, role: token.role, name: token.name };
      return session;
    }
  }
};

// تأكد أن middleware يفحص session لكل route محمي
export { default } from 'next-auth/middleware';
export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };`}</Code>
          </Section>

          <Section title="Edge Runtime vs Node Runtime">
            <ul>
              <li>Edge runtime بيشتغل على V8 isolates، مش Node كامل. بعض المكتبات (crypto, fs) مش هتشتغل.</li>
              <li>Edge أسرع، بس <b>أقل قوة</b> — مفيش DB queries طويلة.</li>
              <li>middleware بيشتغل على Edge افتراضياً. لو نقلته لـ Node، تأكد إن الـ routes لسه متطابقة.</li>
              <li>السرّيات في Edge runtime موجودة في كل region — التوزيع الجغرافي ممكن يخالف data residency rules عندك.</li>
            </ul>
          </Section>

          <Section title="Headers و CSP في Next">
            <Code lang="javascript">{`// next.config.js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

// CSP مع nonce (متاح عبر middleware)
// middleware.ts
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export function middleware(req) {
  const nonce = randomBytes(16).toString('base64');
  const csp = \`
    default-src 'self';
    script-src 'self' 'nonce-\${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-\${nonce}';
    object-src 'none';
    base-uri 'self';
    frame-ancestors 'none';
  \`.replace(/\\s{2,}/g, ' ').trim();

  const res = NextResponse.next();
  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('x-nonce', nonce);
  return res;
}`}</Code>
          </Section>

          <Section title="checklist مراجعة Next.js app">
            <ol>
              <li>الإصدار &gt;= 14.2.25 / 15.2.3 (CVE-2025-29927).</li>
              <li>الـ Middleware <b>مش</b> طبقة الـ authz الوحيدة — كل route يعيد الفحص.</li>
              <li>كل Server Action بيفحص session + input.</li>
              <li>RSC: ما تمررش entities كاملة لـ client component.</li>
              <li>API Routes: ownership check + select صريح.</li>
              <li>Image: <span className="eng">remotePatterns</span> صارمة.</li>
              <li>NEXT_SERVER_ACTIONS_ENCRYPTION_KEY مضبوط.</li>
              <li>Headers: HSTS, CSP, Permissions-Policy.</li>
              <li>NEXT_PUBLIC_* مفيهاش secrets.</li>
              <li>package server-only على ملفات السرّيات.</li>
              <li>Auth.js: secret + algorithms مضبوطين.</li>
              <li>open redirect filter في كل router.push بياخد user input.</li>
            </ol>
            <Callout kind="info" title="أدوات">
              <span className="eng">next-secure-headers</span>, Snyk, Semgrep <span className="eng">p/nextjs</span>, Vercel Firewall، وقواعد Cloudflare WAF للأنماط الخاصة بـ Next.
            </Callout>
          </Section>

          <Section title="غلطات الـ junior في Next">
            <Callout kind="danger" title="اللي بيحصل لما الـ junior يكتب Next">
              <ul>
                <li><b>auth في middleware بس</b> — CVE-2025-29927 خرّب اللعبة دي. كل route لازم يفحص بنفسه.</li>
                <li><b>NEXT_PUBLIC_API_KEY</b> — أي حاجة بـ NEXT_PUBLIC بتطلع في bundle الـ client. السر اللي حطّيته بقى public بمعنى الكلمة.</li>
                <li><b>Server Action من غير revalidation</b> — الـ user يضغط Submit مرتين بسرعة، يطلع double charge. لازم idempotency.</li>
                <li><b>Server Action بياخد ID من client من غير ownership check</b> — "هو الـ user مش هيغيرها" — هيغيّرها يا نجم. هيغيّرها بـ Burp.</li>
                <li><b>RSC بترجع entity كامل</b> — السيرفر بيـ pass الـ user object للـ client component، فيه password_hash. الـ user بيـ inspect element.</li>
                <li><b>Image Optimizer مفتوح</b> — <span className="eng">remotePatterns: '**'</span> = SSRF عبر <code>/_next/image?url=http://169.254.169.254</code>.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>Next مش "framework" — Next "platform". وكل platform بيدّيك سرعة بسعر معقّد.</p>
            <p>السرعة في الـ DX. التعقيد في الحماية: 7 طبقات، كل واحدة لازم تتأمّن لوحدها.</p>
            <p>اكتبها على ظهر إيدك:</p>
            <p>كل route، كل Action، كل API. اوعى تثق في middleware. اوعى تثق في الـ client. ولا حتى في الـ session token من غير ما تتأكد منه على السيرفر.</p>
          </Section>
        </>}
        en={<>
          <Section title="Why Next.js multiplies the attack surface">
            <p>Next.js is a stack: <b>React frontend + Node backend + Edge middleware + RSC + Server Actions + Image Optimizer + ISR cache</b>. Each is its own protocol. Skilled attackers separate the layers and hit the weakest one.</p>
            <Analogy>A multi-floor building with several elevators (App Router, Pages, API, Edge). Not every elevator reaches every floor, and the locks differ. The attacker maps the elevators before choosing a path.</Analogy>
            <Callout kind="danger" title="Legal reminder">
              Examples are for testing your own apps. Don't use them against external sites without authorization.
            </Callout>
          </Section>

          <Section title="CVE-2025-29927 — Middleware Authorization Bypass">
            <p>The biggest Next.js CVE on record (March 2025). Use of an internal header <span className="eng">x-middleware-subrequest</span> bypassed middleware authorization.</p>
            <Code lang="text">{`# Vulnerable: Next.js < 14.2.25 / < 15.2.3 honored this header
# (intended to prevent middleware loops) without sanitizing it externally

curl -H "x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware" \\
  https://target.com/admin

# Result: middleware skipped entirely
# auth checks in middleware.ts → bypassed
# rewrite/redirect → bypassed
# rate limit → bypassed`}</Code>
            <Callout kind="info" title="Who's affected">
              Every Next.js app using middleware for authorization. If you're &lt; 14.2.25 or &lt; 15.2.3, patch <b>now</b>. Upgrade is the fix. WAF rules are stopgaps.
            </Callout>
            <Code lang="javascript">{`// Defense in depth — never let middleware be the only authz layer
// Each route re-checks in its handler:
export async function GET(req) {
  const session = await getSession(req);
  if (!session?.user?.isAdmin) return new Response('forbidden', { status: 403 });
  // ...
}`}</Code>
          </Section>

          <Section title="Server Actions — a brand-new attack surface">
            <p>Server Actions are functions called from the client over an encoded POST. But:</p>
            <ul>
              <li><b>Every Server Action endpoint is public</b> — even if no UI calls it. Attackers enumerate actions from the bundle and call them directly.</li>
              <li><b>Auth is not automatic</b> — must be checked in every action.</li>
              <li><b>Action IDs are stable across deploys</b> (unless encrypted). Attackers archive an ID and replay against another version.</li>
              <li><b>FormData parsing</b> — unexpected types (files arriving as strings).</li>
            </ul>
            <Code lang="javascript">{`// Vulnerable — Server Action with no auth
'use server';
export async function deleteUser(id: string) {
  await db.user.delete({ where: { id } });
}

// Any visitor can invoke it (POST with action ID)
// curl -X POST https://target.com/page \\
//   -H "Next-Action: 7f8a..." \\
//   -d '["userid"]'

// Safe
'use server';
export async function deleteUser(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) throw new Error('unauthorized');
  if (!validateId(id)) throw new Error('bad id');
  await db.user.delete({ where: { id } });
}

// In next.config.js — encrypt action IDs
experimental: {
  serverActions: { allowedOrigins: ['app.target.gov'] }
}`}</Code>
            <Callout kind="info" title="Action ID enumeration">
              In dev mode, action IDs are enumerable from the bundle. In prod, Next encrypts them with a server key. <b>Set <span className="eng">NEXT_SERVER_ACTIONS_ENCRYPTION_KEY</span></b> explicitly — otherwise every deploy regenerates the key and breaks long-lived clients.
            </Callout>
          </Section>

          <Section title="React Server Components (RSC) — data leaks">
            <Code lang="tsx">{`// Vulnerable — passing the full user to a client component
// app/profile/page.tsx (Server Component)
export default async function Page() {
  const user = await db.user.findUnique({ where: { id }, include: { ... } });
  return <ProfileCard user={user} />;   // user contains passwordHash, email...
}

// Every prop into a Client Component is serialized and sent to the browser
// Attacker opens DevTools → reads __NEXT_DATA__ or the RSC payload

// Safe — pass only what's needed
return <ProfileCard
  name={user.name}
  avatar={user.avatar}
  // no passwordHash, mfaSecret, internal flags
/>;

// Or an explicit DTO
const dto = pick(user, ['id', 'name', 'avatar']);
return <ProfileCard user={dto} />;`}</Code>
            <Callout kind="danger" title="Important">
              "use server" and "use client" are thread boundaries. Anything you don't pass into a client component or return from a server action stays on the server. Keep secrets in server-only files (e.g., the <span className="eng">server-only</span> package).
            </Callout>
          </Section>

          <Section title="API routes / route handlers">
            <Code lang="typescript">{`// app/api/user/[id]/route.ts
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Vulnerable: no auth
  return Response.json(await db.user.findUnique({ where: { id: params.id } }));
}

// IDOR: GET /api/user/123 ← any user reads any user
// + DTO leak

// Safe
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('unauthorized', { status: 401 });

  // ownership
  if (params.id !== session.user.id && !session.user.isAdmin) {
    return new Response('forbidden', { status: 403 });
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true }   // explicit fields
  });
  return Response.json(user);
}`}</Code>
          </Section>

          <Section title="ISR / cache poisoning">
            <p>Next caches pages and API responses by URL. An attacker can poison the cache with a controlled request.</p>
            <Code lang="text">{`# In app/products/[slug]/page.tsx
# revalidate = 3600

# Attacker sends an unusual header that the page consumes:
GET /products/widget HTTP/1.1
X-Forwarded-Host: evil.com

# Inside the page:
const url = headers().get('x-forwarded-host');   ← used in canonical link

# Result: cached version of /products/widget has canonical = evil.com
# Every later visitor receives the poisoned page`}</Code>
            <Callout kind="good" title="Defense">
              <ul>
                <li>Don't render cached pages from request headers.</li>
                <li>Define the <span className="eng">cache key</span> explicitly — don't let Next infer.</li>
                <li>Set and validate <span className="eng">trust proxy</span> headers.</li>
                <li><span className="eng">revalidateTag</span> / <span className="eng">revalidatePath</span> mutations require auth or a secret.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Image optimizer SSRF">
            <p>Next ships <span className="eng">/_next/image</span>, which fetches arbitrary URLs to resize them. A loose <span className="eng">remotePatterns</span> turns it into an SSRF proxy.</p>
            <Code lang="javascript">{`// next.config.js — dangerous
images: {
  domains: ['*'],     // or dangerouslyAllowSVG: true
  remotePatterns: [{ protocol: 'https', hostname: '**' }]
}

// PoC — read AWS metadata behind the server
GET /_next/image?url=http://169.254.169.254/latest/meta-data/&w=128&q=75

// SVG-based XSS if dangerouslyAllowSVG: true without CSP
// (open an SVG that contains <script>)

// Safe
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'cdn.target.gov' },
    { protocol: 'https', hostname: 'images.target.gov' }
  ],
  // dangerouslyAllowSVG: false (default)
  contentSecurityPolicy: "default-src 'self'; script-src 'none';"
}`}</Code>
          </Section>

          <Section title="Open redirect via next/router">
            <Code lang="javascript">{`// Vulnerable
const router = useRouter();
router.push(searchParams.get('next'));   // attacker chooses the destination

// PoC: /login?next=//evil.com → after login, lands on evil.com
// Or next=javascript:alert(1)

// Safe
function safeNext(n: string) {
  if (!n) return '/';
  if (!n.startsWith('/') || n.startsWith('//')) return '/';
  return n;
}
router.push(safeNext(searchParams.get('next')));`}</Code>
          </Section>

          <Section title="Environment variables — typical leaks">
            <ul>
              <li><b>NEXT_PUBLIC_*</b> are inlined into the client bundle. <b>Never</b> put secrets there.</li>
              <li><b>process.env in Server Components</b> is fine, but if you pass it into a Client Component, it ships.</li>
              <li><b>.env.local in git</b> — add to .gitignore. Use a secret manager in prod (Vercel env, AWS Secrets Manager).</li>
              <li><b>Build-time vs runtime</b> — secrets in NEXT_PUBLIC are baked at build; they don't change without rebuilding.</li>
            </ul>
            <Code lang="javascript">{`// server-only — Next package that prevents importing from a client component
// app/lib/secret.ts
import 'server-only';
export const apiKey = process.env.API_KEY;

// If a client component imports this, the build fails. Compile-time guard.`}</Code>
          </Section>

          <Section title="Authentication — Auth.js / Clerk pitfalls">
            <Code lang="typescript">{`// next-auth (Auth.js) — common mistakes
export const authOptions = {
  providers: [...],
  // Bad — no secret set
  // secret: process.env.NEXTAUTH_SECRET,   ← required in prod

  // Bad — JWT without encryption
  jwt: { encryption: false },              ← pre-v4 default was risky

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;     // role into JWT
      return token;
    },
    async session({ session, token }) {
      // Bad — passing the full token to the client
      session.user = token;                  // includes internal flags
      // Good
      session.user = { id: token.sub, role: token.role, name: token.name };
      return session;
    }
  }
};

// Make sure middleware checks session for every protected route
export { default } from 'next-auth/middleware';
export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };`}</Code>
          </Section>

          <Section title="Edge runtime vs Node runtime">
            <ul>
              <li>Edge runtime runs on V8 isolates — not full Node. Some libs (crypto, fs) don't work.</li>
              <li>Edge is faster but <b>less powerful</b> — no long DB queries.</li>
              <li>middleware runs on Edge by default. If you switch to Node, ensure routes still match correctly.</li>
              <li>Secrets in Edge runtime exist in every region — geographic distribution may collide with data residency rules.</li>
            </ul>
          </Section>

          <Section title="Headers and CSP in Next">
            <Code lang="javascript">{`// next.config.js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

// CSP with nonce (via middleware)
// middleware.ts
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export function middleware(req) {
  const nonce = randomBytes(16).toString('base64');
  const csp = \`
    default-src 'self';
    script-src 'self' 'nonce-\${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-\${nonce}';
    object-src 'none';
    base-uri 'self';
    frame-ancestors 'none';
  \`.replace(/\\s{2,}/g, ' ').trim();

  const res = NextResponse.next();
  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('x-nonce', nonce);
  return res;
}`}</Code>
          </Section>

          <Section title="Next.js review checklist">
            <ol>
              <li>Version &gt;= 14.2.25 / 15.2.3 (CVE-2025-29927).</li>
              <li>Middleware is <b>not</b> the only authz layer — every route re-checks.</li>
              <li>Every Server Action validates session + input.</li>
              <li>RSC: don't pass full entities into client components.</li>
              <li>API routes: ownership check + explicit select.</li>
              <li>Image: strict <span className="eng">remotePatterns</span>.</li>
              <li>NEXT_SERVER_ACTIONS_ENCRYPTION_KEY set.</li>
              <li>Headers: HSTS, CSP, Permissions-Policy.</li>
              <li>NEXT_PUBLIC_* contains no secrets.</li>
              <li>server-only package on secret modules.</li>
              <li>Auth.js: secret + algorithms locked.</li>
              <li>Open-redirect filter on every <span className="eng">router.push</span> from user input.</li>
            </ol>
            <Callout kind="info" title="Tooling">
              <span className="eng">next-secure-headers</span>, Snyk, Semgrep <span className="eng">p/nextjs</span>, Vercel Firewall, Cloudflare WAF rules for Next-specific patterns.
            </Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
