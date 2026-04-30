"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="angular-security">
      <L
        ar={<>
          <Section title="Angular مختلف من جذره">
            <p>Angular بيفرض <b>contextual sanitization</b>: أي قيمة بتدخل الـ DOM، Angular بيحدد ليها السياق (HTML, URL, Style, Script, Resource URL) وبيعقمها على الأساس ده. الكلام ده أقوى من React بشكل افتراضي. بس Angular في نفس الوقت بيديك أبواب جانبية للتجاوز: <span className="eng">bypassSecurityTrust*</span>، <span className="eng">[innerHTML]</span>، <span className="eng">[srcdoc]</span>، JIT eval، والـ SSR في Angular Universal.</p>
            <Analogy>قفل ذكي بيميز المفاتيح المسجلة عنده، وبيرفض أي مفتاح تاني. بس صاحب البيت بإيده يقدر يحط علامة "trust" على أي مفتاح. اليوم اللي يحط فيه العلامة على مفتاح غريب، الحماية انتهت.</Analogy>
            <Callout kind="danger" title="تذكير قانوني">
              الأمثلة دي لتعليم XSS والـ bypasses جوه تطبيقاتك إنت. متطبقهاش على تطبيق مش بتاعك.
            </Callout>
          </Section>

          <Section title="الـ DomSanitizer — بيشتغل إزاي وبيتخطى إزاي">
            <p>Angular بيصنف القيم لـ 5 سياقات:</p>
            <TwoCol>
              <Card title="HTML" color="amber">
                المحتوى داخل element. مثال: <span className="eng">[innerHTML]</span>.
              </Card>
              <Card title="STYLE" color="blue">
                قيمة CSS. مثال: <span className="eng">[style.background]</span>. يحظر <span className="eng">expression()</span>, <span className="eng">javascript:</span>.
              </Card>
              <Card title="URL" color="amber">
                الروابط. مثال: <span className="eng">[href]</span>. يحظر <span className="eng">javascript:</span>, <span className="eng">data:</span>.
              </Card>
              <Card title="RESOURCE_URL" color="red">
                Scripts, iframes. مثال: <span className="eng">[src]</span> لـ iframe. الأشد صرامة.
              </Card>
              <Card title="SCRIPT" color="red">
                <span className="eng">script.text</span>. يحظر بالكامل.
              </Card>
            </TwoCol>
            <Code lang="typescript">{`// خطر — bypass كامل
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  template: \`<div [innerHTML]="content"></div>\`
})
export class CmpComponent {
  content: SafeHtml;
  constructor(private sanitizer: DomSanitizer) {}
  load(userInput: string) {
    this.content = this.sanitizer.bypassSecurityTrustHtml(userInput);
    // !! لا توجد حماية إطلاقاً !!
  }
}

// PoC: userInput = "<img src=x onerror=alert(document.cookie)>"

// الإصلاح
load(userInput: string) {
  // إما تستخدم interpolation {{ userInput }} (يهرّب تلقائياً)
  // أو DOMPurify مع SafeHtml
  this.content = this.sanitizer.bypassSecurityTrustHtml(
    DOMPurify.sanitize(userInput)
  );
  // أو تتجنب innerHTML تماماً
}`}</Code>
            <Callout kind="info" title="القاعدة الذهبية">
              كل <span className="eng">bypassSecurityTrust*</span> هو <b>code smell</b>. كل سطر منهم لازم له: مبرر مكتوب + sanitization منفصلة + code review.
            </Callout>
          </Section>

          <Section title="Template Injection — خاصة بـ Angular">
            <p>الـ Angular template هو expression language. لو خدت template من إنت user input وعملت له compile، إنت كدة بتنفذ كود مباشرة.</p>
            <Code lang="typescript">{`// خطر — Server-Side Template Injection
// تطبيق يولّد components من DB (CMS-like)
@Component({
  template: \`\${userInputFromCMS}\`,   // !! template أحياناً يحوي JS expressions
})

// PoC في Angular template:
{{constructor.constructor('alert(1)')()}}
// أو
{{$any(1).constructor.constructor('return process')()}}    // SSR escape

// JIT compilation runtime (التطبيق غير AOT)
@Component({
  selector: 'dynamic',
  template: this.userTemplate,    // ← compile + run user code
})

// دفاع — استخدم AOT compilation فقط (default في prod من Angular 9+)
// ng build --aot
// JIT compilation معطّل في prod`}</Code>
          </Section>

          <Section title="bypassSecurityTrustResourceUrl — أخطر فخ في Angular">
            <Code lang="typescript">{`// خطر — iframe يأخذ URL من user
@Component({
  template: \`<iframe [src]="vidUrl"></iframe>\`
})
export class VideoCmp {
  vidUrl: SafeResourceUrl;
  constructor(private s: DomSanitizer) {}

  setVideo(url: string) {
    this.vidUrl = this.s.bypassSecurityTrustResourceUrl(url);
  }
}

// PoC: setVideo("javascript:alert(document.cookie)")
// أو data:text/html,<script>...

// الإصلاح
setVideo(url: string) {
  // allowlist صارمة
  const u = new URL(url);
  if (u.hostname !== 'youtube.com' || !/^\\/embed\\//.test(u.pathname)) {
    return;
  }
  this.vidUrl = this.s.bypassSecurityTrustResourceUrl(u.toString());
}`}</Code>
          </Section>

          <Section title="SSR — Angular Universal">
            <p>Angular Universal بيشغل الكود على Node.js عشان الـ SSR. كل ثغرات Node بتنطبق هنا، وبتيجي معاها ثغرات خاصة بالـ rendering:</p>
            <ul>
              <li><b>Hydration mismatch</b> — زي React، بيكشف الـ server-side state.</li>
              <li><b>SSR XSS</b> — لو الكود بيستخدم <span className="eng">document.write</span> أو بيلعب في الـ DOM في context السيرفر، الـ user input ممكن يدخل من غير escape.</li>
              <li><b>Resource leaks</b> — كل request بينشئ Angular module جديد. شغل CPU ثقيل على demand = السيرفر بيقع.</li>
              <li><b>Secrets exposure</b> — الـ initial state بينطبع جوه الـ HTML (<span className="eng">TransferState</span>). أي حاجة fetched قبل ما الـ client يستلم = ظاهرة في الـ source.</li>
            </ul>
            <Code lang="typescript">{`// خطر — TransferState يحوي بيانات حسّاسة
constructor(
  private state: TransferState,
  private http: HttpClient
) {
  const KEY = makeStateKey<User>('user-data');
  this.user = this.state.get(KEY, null);
  if (!this.user) {
    this.http.get<User>('/api/me').subscribe(u => {
      this.state.set(KEY, u);   // !! يُطبع في HTML
    });
  }
}

// User يحوي email, internalRoles, ...
// كل visitor يقرأ HTML source يرى البيانات

// آمن — DTO فقط للـ TransferState، لا entities كاملة
const safeUser = { id: u.id, name: u.name };
this.state.set(KEY, safeUser);`}</Code>
          </Section>

          <Section title="Trusted Types — Angular بيدعمها بقوة">
            <p>Angular 16+ بيدعم Trusted Types ببساطة. مع CSP <span className="eng">require-trusted-types-for 'script'</span>، أي bypass بيتلغي على مستوى المتصفح نفسه.</p>
            <Code lang="typescript">{`// app.module.ts أو main.ts
import { TrustedTypesModule } from '@angular/platform-browser';

// CSP header
// Content-Security-Policy: require-trusted-types-for 'script'; trusted-types angular angular#unsafe-bypass;

// لو حاول كود في bundle أن يضع innerHTML بـ string عادي → throw
// فقط Angular sanitizer (الذي ينتج TrustedHTML) يعمل`}</Code>
            <Callout kind="good" title="ميزة Angular">
              على عكس React، Angular مصمم حوالين Trusted Types — التفعيل سهل والفايدة فورية. <b>لازم</b> يكون default في أي deploy إنتاجي جديد، مفيش كلام.
            </Callout>
          </Section>

          <Section title="Routing — Open Redirect وRoute Guards">
            <Code lang="typescript">{`// خطر — redirect بعد login
loginCmp() {
  this.auth.login(...).subscribe(() => {
    const next = this.route.snapshot.queryParams['returnUrl'];
    this.router.navigateByUrl(next);   // attacker controls
  });
}

// PoC: /login?returnUrl=//evil.com

// آمن
loginCmp() {
  this.auth.login(...).subscribe(() => {
    let next = this.route.snapshot.queryParams['returnUrl'] || '/';
    if (!next.startsWith('/') || next.startsWith('//')) next = '/';
    this.router.navigateByUrl(next);
  });
}

// Route Guards — احرص على CanActivate و CanActivateChild
const routes: Routes = [
  {
    path: 'admin',
    canActivate: [AdminGuard],
    canActivateChild: [AdminGuard],   // ← لا تنسَ children!
    children: [...]
  }
];

// AdminGuard يعتمد على service موثوق، ليس localStorage مباشرة
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean {
    if (!this.auth.isAdmin()) {
      this.router.navigate(['/forbidden']);
      return false;
    }
    return true;
  }
}`}</Code>
          </Section>

          <Section title="HttpClient — XSRF والـ Interceptors">
            <p>Angular معاه حماية CSRF مدمجة عن طريق <span className="eng">HttpClientXsrfModule</span>. بيقرا الـ cookie اسمه <span className="eng">XSRF-TOKEN</span> ويبعته في header <span className="eng">X-XSRF-TOKEN</span>.</p>
            <Code lang="typescript">{`@NgModule({
  imports: [
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    })
  ]
})

// الخادم يضبط cookie XSRF-TOKEN عند login
// يرفض كل non-GET بدون header X-XSRF-TOKEN

// خطر شائع — Interceptor يضيف Authorization من localStorage
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('token');   // XSS = سرقة
    return next.handle(req.clone({
      setHeaders: { Authorization: \`Bearer \${token}\` }
    }));
  }
}

// أفضل: cookie httpOnly + إعادة الـ XSRF token في كل non-GET`}</Code>
          </Section>

          <Section title="Forms — الـ Validation والـ Reactive Forms">
            <ul>
              <li><b>Server-side validation إجباري</b> — Angular validators ديكور بس، أي حد بيتخطاهم بـ DevTools في ثواني.</li>
              <li><b>FormControl values</b> — أي one-way binding من user input للـ model، احتفظ بنسخة DTO مفلترة.</li>
              <li><b>Custom async validators</b> — متستخدمش <span className="eng">eval</span> ولا كود ديناميكي جاي من API.</li>
              <li><b>File upload</b> — زي React/Express: افحص MIME + الحجم + الـ extension + اعمل scan.</li>
            </ul>
          </Section>

          <Section title="JIT vs AOT — ليه الـ AOT حماية؟">
            <ul>
              <li><b>JIT</b> — الـ templates بتتجمع runtime في المتصفح. أبطأ + بتفتح باب لـ template injection.</li>
              <li><b>AOT</b> — الـ templates بتتجمع وقت الـ build. أسرع + بتمسك أخطاء الـ template بدري، والـ templates الديناميكية بتبقى مستحيلة.</li>
              <li>من Angular 9 (Ivy)، الـ AOT default. اتأكد إن <span className="eng">ng build --configuration=production</span> بيستخدم AOT (وهو فعلاً بيستخدمه).</li>
              <li>ابعد عن <span className="eng">@Component({`{ jit: true }`})</span> و<span className="eng">JitCompilerFactory</span> في prod.</li>
            </ul>
          </Section>

          <Section title="Supply chain — منظومة Angular">
            <ul>
              <li><b>npm + @angular/*</b> — حدّث Angular بانتظام. إصدار major كل 6 شهور، LTS سنة كاملة.</li>
              <li><b>Schematics من طرف تالت</b> — <span className="eng">ng add</span> بينفذ كود. اتأكد من المصدر قبل أي حاجة.</li>
              <li><b>Material / PrimeNG / NG-Zorro</b> — مكتبات UI ضخمة وعندها تاريخ CVEs (XSS في tooltip وpopover). حدّث.</li>
              <li><b>SystemJS / esm.sh</b> في الـ dev — متشغلهاش في prod أبداً.</li>
            </ul>
          </Section>

          <Section title="CSP صارم لـ Angular">
            <Code lang="text">{`Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{rand}';   ← Angular لا يحتاج unsafe-inline في AOT
  style-src 'self' 'unsafe-inline';   ← ngStyle يستخدم inline
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.target.gov;
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none';
  require-trusted-types-for 'script';
  trusted-types angular;`}</Code>
            <Callout kind="info" title="ملاحظة CSP">
              لو استخدمت <span className="eng">DomSanitizer.bypassSecurityTrustStyle</span>، يمكن تحتاج <span className="eng">'unsafe-inline'</span> في style-src. حاول تستخدم classes جاهزة بدل inline style أصلاً.
            </Callout>
          </Section>

          <Section title="Checklist مراجعة Angular app">
            <ol>
              <li>كل <span className="eng">bypassSecurityTrust*</span> معاه justification + DOMPurify.</li>
              <li>كل <span className="eng">[innerHTML]</span> جاي من مصدر موثوق أو ماشي عبر sanitization.</li>
              <li>AOT في prod (افحص <span className="eng">angular.json</span>).</li>
              <li>HttpClientXsrfModule مفعل + السيرفر بيتحقق من X-XSRF-TOKEN.</li>
              <li>كل route admin/protected معاه CanActivate وCanActivateChild.</li>
              <li>Trusted Types CSP مفعل.</li>
              <li>مفيش tokens في localStorage — httpOnly cookies بس.</li>
              <li>TransferState مفيهوش PII ولا internal flags.</li>
              <li>SSR (Universal): timeouts على الـ HTTP، مفيش synchronous heavy work.</li>
              <li>Open redirect filter على كل <span className="eng">navigateByUrl</span> جاي من user input.</li>
              <li>Forms: server-side validation كاملة، متثقش في Angular validators أبداً.</li>
              <li>Material/PrimeNG محدّث، الـ CVEs متحلولة.</li>
            </ol>
            <Callout kind="info" title="أدوات">
              <span className="eng">@angular-eslint</span>, <span className="eng">eslint-plugin-security</span>, Snyk, Semgrep <span className="eng">p/angular</span>, Sonarqube مع Angular ruleset.
            </Callout>
          </Section>
        </>}
        en={<>
          <Section title="Angular is structurally different">
            <p>Angular enforces <b>contextual sanitization</b>: every value flowing into the DOM has a context (HTML, URL, Style, Script, Resource URL), and Angular sanitizes accordingly. That's stronger than React by default. But Angular hands you bypass doors too: <span className="eng">bypassSecurityTrust*</span>, <span className="eng">[innerHTML]</span>, <span className="eng">[srcdoc]</span>, JIT eval, server-side rendering with Angular Universal.</p>
            <Analogy>A smart lock that recognizes registered keys. It rejects anything else — but the homeowner can mark a key as "trusted". The day they trust the wrong key, protection ends.</Analogy>
            <Callout kind="danger" title="Legal reminder">
              Examples teach XSS and bypasses inside your own apps. Don't run them against apps you don't own.
            </Callout>
          </Section>

          <Section title="DomSanitizer — how it works and how it's bypassed">
            <p>Angular classifies values into 5 contexts:</p>
            <TwoCol>
              <Card title="HTML" color="amber">
                Inside an element. e.g. <span className="eng">[innerHTML]</span>.
              </Card>
              <Card title="STYLE" color="blue">
                CSS values. e.g. <span className="eng">[style.background]</span>. Blocks <span className="eng">expression()</span>, <span className="eng">javascript:</span>.
              </Card>
              <Card title="URL" color="amber">
                Links. e.g. <span className="eng">[href]</span>. Blocks <span className="eng">javascript:</span>, <span className="eng">data:</span>.
              </Card>
              <Card title="RESOURCE_URL" color="red">
                Scripts, iframes. e.g. <span className="eng">[src]</span> on iframe. Strictest.
              </Card>
              <Card title="SCRIPT" color="red">
                <span className="eng">script.text</span>. Blocks entirely.
              </Card>
            </TwoCol>
            <Code lang="typescript">{`// Vulnerable — full bypass
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  template: \`<div [innerHTML]="content"></div>\`
})
export class CmpComponent {
  content: SafeHtml;
  constructor(private sanitizer: DomSanitizer) {}
  load(userInput: string) {
    this.content = this.sanitizer.bypassSecurityTrustHtml(userInput);
    // !! zero protection !!
  }
}

// PoC: userInput = "<img src=x onerror=alert(document.cookie)>"

// Fix
load(userInput: string) {
  // Either use interpolation {{ userInput }} (auto-escaped)
  // Or DOMPurify before SafeHtml
  this.content = this.sanitizer.bypassSecurityTrustHtml(
    DOMPurify.sanitize(userInput)
  );
  // Or avoid innerHTML entirely
}`}</Code>
            <Callout kind="info" title="Golden rule">
              Every <span className="eng">bypassSecurityTrust*</span> is a <b>code smell</b>. Each instance needs justification + separate sanitization + code review.
            </Callout>
          </Section>

          <Section title="Template injection — Angular-specific">
            <p>Angular templates are an expression language. If you take a template from user input and compile it, you're executing code.</p>
            <Code lang="typescript">{`// Vulnerable — server-side template injection
// App generates components from CMS DB
@Component({
  template: \`\${userInputFromCMS}\`,   // !! sometimes contains JS expressions
})

// Angular-template PoCs:
{{constructor.constructor('alert(1)')()}}
// or
{{$any(1).constructor.constructor('return process')()}}    // SSR escape

// Runtime JIT compilation (non-AOT app)
@Component({
  selector: 'dynamic',
  template: this.userTemplate,    // ← compile + run user code
})

// Defense — AOT compilation only (default in prod since Angular 9)
// ng build --aot
// JIT disabled in prod`}</Code>
          </Section>

          <Section title="bypassSecurityTrustResourceUrl — the most dangerous bypass">
            <Code lang="typescript">{`// Vulnerable — iframe pulls URL from user
@Component({
  template: \`<iframe [src]="vidUrl"></iframe>\`
})
export class VideoCmp {
  vidUrl: SafeResourceUrl;
  constructor(private s: DomSanitizer) {}

  setVideo(url: string) {
    this.vidUrl = this.s.bypassSecurityTrustResourceUrl(url);
  }
}

// PoC: setVideo("javascript:alert(document.cookie)")
// or data:text/html,<script>...

// Fix
setVideo(url: string) {
  // strict allowlist
  const u = new URL(url);
  if (u.hostname !== 'youtube.com' || !/^\\/embed\\//.test(u.pathname)) {
    return;
  }
  this.vidUrl = this.s.bypassSecurityTrustResourceUrl(u.toString());
}`}</Code>
          </Section>

          <Section title="Server-side rendering — Angular Universal">
            <p>Angular Universal runs the app on Node.js for SSR. All Node-side vulns apply, plus rendering-specific issues:</p>
            <ul>
              <li><b>Hydration mismatch</b> — like React, leaks server-side state.</li>
              <li><b>SSR XSS</b> — code that uses <span className="eng">document.write</span> or DOM manipulation in server context can incorporate user input without escape.</li>
              <li><b>Resource leaks</b> — every request creates a fresh Angular module. CPU-heavy on demand can crash the server.</li>
              <li><b>Secret exposure</b> — initial state inlined in HTML via <span className="eng">TransferState</span>. Anything fetched before the client takes over is visible in source.</li>
            </ul>
            <Code lang="typescript">{`// Vulnerable — TransferState carries sensitive data
constructor(
  private state: TransferState,
  private http: HttpClient
) {
  const KEY = makeStateKey<User>('user-data');
  this.user = this.state.get(KEY, null);
  if (!this.user) {
    this.http.get<User>('/api/me').subscribe(u => {
      this.state.set(KEY, u);   // !! inlined into HTML
    });
  }
}

// User contains email, internalRoles, ...
// Anyone reading HTML source sees them

// Safe — DTO only for TransferState, not full entities
const safeUser = { id: u.id, name: u.name };
this.state.set(KEY, safeUser);`}</Code>
          </Section>

          <Section title="Trusted Types — first-class enablement in Angular">
            <p>Angular 16+ supports Trusted Types easily. With CSP <span className="eng">require-trusted-types-for 'script'</span>, any bypass is blocked by the browser.</p>
            <Code lang="typescript">{`// app.module.ts or main.ts
import { TrustedTypesModule } from '@angular/platform-browser';

// CSP header
// Content-Security-Policy: require-trusted-types-for 'script'; trusted-types angular angular#unsafe-bypass;

// If anything tries to set innerHTML to a plain string → throw
// Only Angular's sanitizer (which produces TrustedHTML) works`}</Code>
            <Callout kind="good" title="Angular's edge">
              Unlike React, Angular is designed around Trusted Types — easy to enable, immediate benefit. <b>Should</b> be the default on every new production deployment.
            </Callout>
          </Section>

          <Section title="Routing — open redirect & route guards">
            <Code lang="typescript">{`// Vulnerable — post-login redirect
loginCmp() {
  this.auth.login(...).subscribe(() => {
    const next = this.route.snapshot.queryParams['returnUrl'];
    this.router.navigateByUrl(next);   // attacker chooses
  });
}

// PoC: /login?returnUrl=//evil.com

// Safe
loginCmp() {
  this.auth.login(...).subscribe(() => {
    let next = this.route.snapshot.queryParams['returnUrl'] || '/';
    if (!next.startsWith('/') || next.startsWith('//')) next = '/';
    this.router.navigateByUrl(next);
  });
}

// Route Guards — apply CanActivate + CanActivateChild
const routes: Routes = [
  {
    path: 'admin',
    canActivate: [AdminGuard],
    canActivateChild: [AdminGuard],   // ← don't forget children!
    children: [...]
  }
];

// AdminGuard relies on a trusted service, not direct localStorage
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean {
    if (!this.auth.isAdmin()) {
      this.router.navigate(['/forbidden']);
      return false;
    }
    return true;
  }
}`}</Code>
          </Section>

          <Section title="HttpClient — XSRF & interceptors">
            <p>Angular ships built-in CSRF via <span className="eng">HttpClientXsrfModule</span>. It reads the <span className="eng">XSRF-TOKEN</span> cookie and adds an <span className="eng">X-XSRF-TOKEN</span> header.</p>
            <Code lang="typescript">{`@NgModule({
  imports: [
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    })
  ]
})

// Server sets the XSRF-TOKEN cookie on login
// Rejects every non-GET without the X-XSRF-TOKEN header

// Common danger — interceptor adds Authorization from localStorage
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('token');   // XSS = stolen
    return next.handle(req.clone({
      setHeaders: { Authorization: \`Bearer \${token}\` }
    }));
  }
}

// Better: httpOnly cookie + XSRF token on every non-GET`}</Code>
          </Section>

          <Section title="Forms — validation & Reactive Forms">
            <ul>
              <li><b>Server-side validation is mandatory</b> — Angular validators are cosmetic; trivially bypassed in DevTools.</li>
              <li><b>FormControl values</b> — for any one-way binding from user input to model, hold a filtered DTO copy.</li>
              <li><b>Custom async validators</b> — never use <span className="eng">eval</span> or dynamic code from an API.</li>
              <li><b>File upload</b> — same as React/Express: MIME, size, extension, scan.</li>
            </ul>
          </Section>

          <Section title="JIT vs AOT — why AOT is protection">
            <ul>
              <li><b>JIT</b> — templates compiled at runtime in the browser. Slower + exposes many template-injection paths.</li>
              <li><b>AOT</b> — templates compiled at build time. Faster + catches template errors at build, and dynamic templates become impossible.</li>
              <li>Since Angular 9 (Ivy), AOT is default. Confirm <span className="eng">ng build --configuration=production</span> uses AOT (it does).</li>
              <li>Avoid <span className="eng">@Component({`{ jit: true }`})</span> or <span className="eng">JitCompilerFactory</span> in prod.</li>
            </ul>
          </Section>

          <Section title="Supply chain — Angular ecosystem">
            <ul>
              <li><b>npm + @angular/* mirror</b> — update Angular regularly. New major every 6 months, LTS for a year.</li>
              <li><b>Third-party schematics</b> — <span className="eng">ng add</span> runs code. Verify the source.</li>
              <li><b>Material / PrimeNG / NG-Zorro</b> — large UI suites with a CVE history (tooltip / popover XSS). Update.</li>
              <li><b>SystemJS / esm.sh</b> in dev — never in prod.</li>
            </ul>
          </Section>

          <Section title="Strict CSP for Angular">
            <Code lang="text">{`Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{rand}';   ← Angular doesn't need unsafe-inline in AOT
  style-src 'self' 'unsafe-inline';   ← ngStyle uses inline
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.target.gov;
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none';
  require-trusted-types-for 'script';
  trusted-types angular;`}</Code>
            <Callout kind="info" title="CSP note">
              If you use <span className="eng">DomSanitizer.bypassSecurityTrustStyle</span>, you may need <span className="eng">'unsafe-inline'</span> in style-src. Prefer pre-defined classes over inline styles.
            </Callout>
          </Section>

          <Section title="Angular review checklist">
            <ol>
              <li>Every <span className="eng">bypassSecurityTrust*</span> has justification + DOMPurify.</li>
              <li>Every <span className="eng">[innerHTML]</span> originates from a trusted source or is sanitized.</li>
              <li>AOT in prod (verify <span className="eng">angular.json</span>).</li>
              <li>HttpClientXsrfModule enabled + server validates X-XSRF-TOKEN.</li>
              <li>Every protected route uses CanActivate and CanActivateChild.</li>
              <li>Trusted Types CSP enabled.</li>
              <li>No tokens in localStorage — httpOnly cookies.</li>
              <li>TransferState contains no PII or internal flags.</li>
              <li>SSR (Universal): timeouts on HTTP, no synchronous heavy work.</li>
              <li>Open-redirect filter on every <span className="eng">navigateByUrl</span> from user input.</li>
              <li>Forms: full server-side validation; Angular validators are advisory only.</li>
              <li>Material/PrimeNG up to date, CVEs resolved.</li>
            </ol>
            <Callout kind="info" title="Tooling">
              <span className="eng">@angular-eslint</span>, <span className="eng">eslint-plugin-security</span>, Snyk, Semgrep <span className="eng">p/angular</span>, SonarQube with the Angular ruleset.
            </Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
