"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="angular-security">
      <L
        ar={<>
          <Section title="Angular مختلف بنيوياً">
            <p>Angular يفرض <b>contextual sanitization</b>: كل قيمة تدخل DOM يحدّد لها Angular السياق (HTML, URL, Style, Script, Resource URL) و يعقّمها وفقاً له. هذا أقوى من React بشكل افتراضي. لكن Angular يعطيك أيضاً أبواباً للتجاوز: <span className="eng">bypassSecurityTrust*</span>، <span className="eng">[innerHTML]</span>، <span className="eng">[srcdoc]</span>، JIT eval، Server-Side Rendering مع Angular Universal.</p>
            <Analogy>كقفل ذكي يميّز المفاتيح. يرفض كل مفتاح غير المفاتيح المسجّلة. لكن صاحب البيت يستطيع أن يضع علامة "trust" على أي مفتاح. يوم يضع العلامة على مفتاح غريب، انتهت الحماية.</Analogy>
            <Callout kind="danger" title="تذكير قانوني">
              الأمثلة لتعليم XSS و bypasses في تطبيقاتك. لا تطبّقها على تطبيقات لا تملكها.
            </Callout>
          </Section>

          <Section title="الـ DomSanitizer — كيف يعمل و كيف يُتجاوز">
            <p>Angular يصنّف القيم في 5 سياقات:</p>
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
              كل <span className="eng">bypassSecurityTrust*</span> هو <b>code smell</b>. كل instance يحتاج: justification + sanitization منفصلة + code review.
            </Callout>
          </Section>

          <Section title="Template Injection — Angular-specific">
            <p>Angular template = expression language. لو تستخرج template من user input ثم compile، فأنت تنفّذ كود.</p>
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

          <Section title="bypassSecurityTrustResourceUrl — الفخ الأعلى خطورة">
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

          <Section title="Server-Side Rendering — Angular Universal">
            <p>Angular Universal يُشغّل الكود على Node.js للـ SSR. كل ثغرة Node تنطبق + ثغرات خاصة بالـ rendering:</p>
            <ul>
              <li><b>Hydration mismatch</b> — كـ React، يكشف server-side state.</li>
              <li><b>SSR XSS</b> — لو يستخدم <span className="eng">document.write</span> أو manipulate DOM في server context، النتيجة قد تشمل user input بدون escape.</li>
              <li><b>Resource leaks</b> — كل request ينشئ Angular module جديد. استدعاء CPU-heavy على demand قد يُسقط الخادم.</li>
              <li><b>Secrets exposure</b> — initial state يُطبع في HTML (<span className="eng">TransferState</span>). أي شيء fetch قبل client يصل = visible في source.</li>
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

          <Section title="Trusted Types — تفعيل قوي في Angular">
            <p>Angular 16+ يدعم Trusted Types بسهولة. مع CSP <span className="eng">require-trusted-types-for 'script'</span>، أي bypass يُحظر بالـ browser.</p>
            <Code lang="typescript">{`// app.module.ts أو main.ts
import { TrustedTypesModule } from '@angular/platform-browser';

// CSP header
// Content-Security-Policy: require-trusted-types-for 'script'; trusted-types angular angular#unsafe-bypass;

// لو حاول كود في bundle أن يضع innerHTML بـ string عادي → throw
// فقط Angular sanitizer (الذي ينتج TrustedHTML) يعمل`}</Code>
            <Callout kind="good" title="ميزة Angular">
              عكس React، Angular مُصمَّم حول Trusted Types — التفعيل سهل و الفائدة فورية. <b>يجب</b> أن يكون default في كل deploy إنتاجي جديد.
            </Callout>
          </Section>

          <Section title="Routing — Open Redirect و Route Guards">
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

          <Section title="HttpClient — XSRF & Interceptors">
            <p>Angular يحوي حماية CSRF مدمجة عبر <span className="eng">HttpClientXsrfModule</span>. تقرأ cookie <span className="eng">XSRF-TOKEN</span> و تضيفها في header <span className="eng">X-XSRF-TOKEN</span>.</p>
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

          <Section title="Forms — Validation وReactive Forms">
            <ul>
              <li><b>Validation سيرفر-جانب إجباري</b> — Angular validators تجميلي فقط، يمكن تجاوزه ببساطة في DevTools.</li>
              <li><b>FormControl values</b> — أي one-way binding من user input إلى model، احفظ نسخة DTO مفلترة.</li>
              <li><b>Custom validators async</b> — لا تستخدم <span className="eng">eval</span> أو ديناميكي يأتي من API.</li>
              <li><b>File upload</b> — كما في React/Express، فحص MIME + حجم + extension + scan.</li>
            </ul>
          </Section>

          <Section title="JIT vs AOT — لماذا AOT حماية">
            <ul>
              <li><b>JIT</b> — templates تُجمع وقت runtime في المتصفح. أبطأ + يعرّض لكثير من ثغرات template injection.</li>
              <li><b>AOT</b> — templates تُجمع وقت البناء. أسرع + يكتشف أخطاء template في build، و templates ديناميكية تصبح مستحيلة.</li>
              <li>منذ Angular 9 (Ivy)، AOT افتراضي. تأكد أن <span className="eng">ng build --configuration=production</span> يستخدم AOT (هو كذلك).</li>
              <li>تجنّب <span className="eng">@Component({`{ jit: true }`})</span> أو <span className="eng">JitCompilerFactory</span> في prod.</li>
            </ul>
          </Section>

          <Section title="Supply chain — Angular ecosystem">
            <ul>
              <li><b>npm + @angular/* mirror</b> — حدّث Angular بانتظام. إصدار جديد كل 6 أشهر، LTS سنة.</li>
              <li><b>schematics من شركة ثالثة</b> — <span className="eng">ng add</span> ينفّذ كود. تحقّق من المصدر.</li>
              <li><b>Material / PrimeNG / NG-Zorro</b> — مكوّنات UI كبيرة، تاريخ CVEs (XSS في tooltip, popover). حدّث بانتظام.</li>
              <li><b>SystemJS / esm.sh</b> في dev — لا تستخدمها في prod.</li>
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
              إذا استخدمت <span className="eng">DomSanitizer.bypassSecurityTrustStyle</span>، قد تحتاج <span className="eng">'unsafe-inline'</span> في style-src. حاول استخدام classes مسبقة بدلاً من inline style.
            </Callout>
          </Section>

          <Section title="checklist مراجعة Angular app">
            <ol>
              <li>كل <span className="eng">bypassSecurityTrust*</span> له justification + DOMPurify.</li>
              <li>كل <span className="eng">[innerHTML]</span> يأتي من مصدر موثوق أو يمر عبر sanitization.</li>
              <li>AOT في prod (افحص <span className="eng">angular.json</span>).</li>
              <li>HttpClientXsrfModule مفعّل + الخادم يحقّق X-XSRF-TOKEN.</li>
              <li>كل route admin/protected له CanActivate و CanActivateChild.</li>
              <li>Trusted Types CSP مفعّل.</li>
              <li>لا tokens في localStorage — httpOnly cookies.</li>
              <li>TransferState لا يحوي PII أو internal flags.</li>
              <li>SSR (Universal): timeouts على HTTP، لا synchronous heavy work.</li>
              <li>Open redirect filter في كل <span className="eng">navigateByUrl</span> من user input.</li>
              <li>Forms: server-side validation كاملة، لا تثق في Angular validators.</li>
              <li>Material/PrimeNG محدّث، CVEs محلولة.</li>
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
