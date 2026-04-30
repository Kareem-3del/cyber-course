"use client";
import { LessonShell, Section, Callout, Code, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="social-engineering">
      <L
        ar={<>
          <Section title="لماذا «الإنسان» هو أضعف حلقة؟">
            <Analogy>تستطيع أن تبني جدراناً بسماكة 10 أمتار، لكن لو وقف الحارس عند الباب و فتحه لأي شخص يقول «أنا من الصيانة»، فلا قيمة لكل الجدران. أكثر من 80% من الاختراقات تبدأ بخطأ بشري.</Analogy>
          </Section>
          <Section title="مبادئ الإقناع — Cialdini">
            <ul>
              <li><b>السلطة</b> (Authority) — «أنا من تكنولوجيا المعلومات».</li>
              <li><b>الإلحاح</b> (Urgency) — «حسابك سيُقفل خلال ساعة».</li>
              <li><b>الندرة</b> (Scarcity) — «10 أماكن فقط».</li>
              <li><b>الإجماع</b> (Social Proof) — «كل زملائك أكملوا التحديث».</li>
              <li><b>الإعجاب</b> (Liking) — انتحال شخصية صديق.</li>
              <li><b>المعاملة بالمثل</b> (Reciprocity) — هدية صغيرة قبل الطلب.</li>
              <li><b>الالتزام</b> (Commitment) — اطلب «نعم» صغيرة قبل الكبيرة.</li>
            </ul>
          </Section>
          <Section title="أنواع الهجمات">
            <TwoCol>
              <Card title="Phishing عام">رسالة بريد جماعية بطعم بسيط (تحديث، فاتورة).</Card>
              <Card title="Spear Phishing">مستهدفة لشخص بعد OSINT — نسبة نجاحها 30 ضعف.</Card>
              <Card title="Whaling">تستهدف المدراء التنفيذيين تحديداً.</Card>
              <Card title="Vishing">صوتي عبر الهاتف، غالباً لانتحال صفة الـ IT.</Card>
              <Card title="Smishing">SMS — «طرد ينتظر، اضغط الرابط».</Card>
              <Card title="BEC (Business Email Compromise)">انتحال CEO لإصدار أمر تحويل عاجل — أكبر خسائر مالية على الإطلاق.</Card>
              <Card title="Baiting">USB مرمي في موقف السيارات.</Card>
              <Card title="Tailgating">الدخول الفعلي خلف موظف بدون بطاقة.</Card>
            </TwoCol>
          </Section>
          <Section title="بناء حملة phishing احترافية (تمرين مصرّح)">
            <Step n={1} title="OSINT">جمع أسماء، إيميلات، تقنيات، أنماط داخلية.</Step>
            <Step n={2} title="اختيار البيع — Pretext">«تذكرة جديدة في Jira» / «إعادة تعيين كلمة المرور» / «بريد خارج المكتب من المدير».</Step>
            <Step n={3} title="بناء الـ landing page">
              <Code lang="tools">{`evilginx2 -p phishlets/  # MFA bypass via reverse proxy
gophish + chameleon       # كامل: حملة + تتبع
modlishka                # 2FA-bypassing reverse proxy
goPhish                  # حملات تدريبية</Code>`}</Code>
            </Step>
            <Step n={4} title="تسجيل دومين مشابه — Typosquatting">
              <Code lang="bash">{`dnstwist target.gov         # توليد دومينات متشابهة
# ت𝖺rget.gov, target-gov.com, target.g0v, t4rget.gov`}</Code>
            </Step>
            <Step n={5} title="إعداد البريد بشكل شرعي">
              SPF + DKIM + DMARC على دومين الإرسال، مع تسخين IP لتجنب فلاتر السبام.
            </Step>
            <Step n={6} title="تحليل النتائج">معدل الفتح، معدل الضغط، معدل تسليم الـ creds، الـ MFA bypass.</Step>
          </Section>
          <Section title="MFA Bypass عبر Adversary-in-the-Middle">
            <p>أدوات مثل <b>evilginx2</b> تعمل كوكيل عكسي بين الضحية و الموقع الحقيقي. الضحية تدخل اسمها و كلمتها و رمز MFA — كل شيء يمر بشكل طبيعي، لكن المهاجم يلتقط الـ session cookie النهائي.</p>
            <Callout kind="danger" title="نتيجة">حتى MFA الكلاسيكي (TOTP, SMS) لا يحمي من هذا الهجوم. فقط <b>FIDO2 / WebAuthn / Passkeys</b> محصّنة لأنها مرتبطة بالدومين الأصلي.</Callout>
          </Section>
          <Section title="الدفاع — المستوى التقني">
            <ol>
              <li><b>SPF/DKIM/DMARC</b> بسياسة <code>p=reject</code>.</li>
              <li>ABnti-spoofing داخل الـ inbound mail (Microsoft Defender for Office, Proofpoint, Mimecast).</li>
              <li>Sandbox للمرفقات + URL rewriting + click-time scanning.</li>
              <li><b>FIDO2 / Passkeys</b> بدلاً من TOTP/SMS — يمنع AiTM phishing تماماً.</li>
              <li>Conditional access — منع الدخول من بلدان أو IPs غير معتادة.</li>
              <li>Browser isolation للأقسام الحساسة.</li>
              <li>كشف الدومينات المتشابهة المُنشأة حديثاً (DomainTools / urlscan.io watchlists).</li>
            </ol>
          </Section>
          <Section title="الدفاع — المستوى البشري">
            <ul>
              <li>تدريب دوري قصير (15 دقيقة شهرياً أفضل من ساعتين سنوياً).</li>
              <li>محاكاة phishing داخلية: من تنقر، تتدرب — لا تُعاقب.</li>
              <li>زر «Report Phish» في الـ mail client يوصل الرسالة فوراً للـ SOC.</li>
              <li>قاعدة الـ <b>Out-of-Band verification</b> لأي طلب مالي: اتصال هاتفي بالرقم الموثق، لا بالرقم في الإيميل.</li>
              <li>ثقافة «لا توبيخ» للإبلاغ المبكر — أهم بكثير من العقوبة.</li>
            </ul>
            <Callout kind="good" title="مؤشر نجاح">المؤسسات الناجحة معدل الإبلاغ فيها أعلى من معدل النقر — تُكافأ على ذلك.</Callout>
          </Section>
        </>}
        en={<>
          <Section title="Why is the human the weakest link?">
            <Analogy>You can build 10-meter walls, but if the guard at the door opens it for anyone who says "I'm from maintenance," none of them matter. Over 80% of breaches start with human error.</Analogy>
          </Section>
          <Section title="Persuasion principles — Cialdini">
            <ul>
              <li><b>Authority</b> — "I'm from IT."</li>
              <li><b>Urgency</b> — "Your account will be locked within an hour."</li>
              <li><b>Scarcity</b> — "Only 10 spots left."</li>
              <li><b>Social Proof</b> — "All your colleagues completed the update."</li>
              <li><b>Liking</b> — impersonating a friend.</li>
              <li><b>Reciprocity</b> — a small gift before the request.</li>
              <li><b>Commitment</b> — get a small "yes" before the big one.</li>
            </ul>
          </Section>
          <Section title="Attack types">
            <TwoCol>
              <Card title="Phishing">Mass-mailed bait (update, invoice).</Card>
              <Card title="Spear Phishing">Targeted to a person after OSINT — 30× higher hit rate.</Card>
              <Card title="Whaling">Specifically targets C-level executives.</Card>
              <Card title="Vishing">Voice via phone, often impersonating IT.</Card>
              <Card title="Smishing">SMS — "Package waiting, click the link."</Card>
              <Card title="BEC (Business Email Compromise)">Impersonating the CEO to authorize an urgent wire — the biggest financial losses overall.</Card>
              <Card title="Baiting">USB drop in the parking lot.</Card>
              <Card title="Tailgating">Physical entry behind a badge-holder.</Card>
            </TwoCol>
          </Section>
          <Section title="Building a professional phishing campaign (authorized exercise)">
            <Step n={1} title="OSINT">Gather names, emails, tech stack, internal patterns.</Step>
            <Step n={2} title="Pick a pretext">"New Jira ticket" / "Password reset" / "Out-of-office note from your manager."</Step>
            <Step n={3} title="Build the landing page">
              <Code lang="tools">{`evilginx2 -p phishlets/  # MFA bypass via reverse proxy
gophish + chameleon       # full campaign + tracking
modlishka                 # 2FA-bypassing reverse proxy
goPhish                   # training campaigns`}</Code>
            </Step>
            <Step n={4} title="Register a typosquat domain">
              <Code lang="bash">{`dnstwist target.gov         # generate look-alike domains
# t𝖺rget.gov, target-gov.com, target.g0v, t4rget.gov`}</Code>
            </Step>
            <Step n={5} title="Set up email like a legitimate sender">
              SPF + DKIM + DMARC on the sending domain, with proper IP warm-up to avoid spam filters.
            </Step>
            <Step n={6} title="Analyze the results">Open rate, click rate, credential-submit rate, MFA bypass count.</Step>
          </Section>
          <Section title="MFA Bypass via Adversary-in-the-Middle">
            <p>Tools like <b>evilginx2</b> sit as a reverse proxy between victim and the real site. The victim enters their username, password, and MFA code — everything passes through normally — but the attacker captures the final session cookie.</p>
            <Callout kind="danger" title="Implication">Even classic MFA (TOTP, SMS) doesn't protect against this. Only <b>FIDO2 / WebAuthn / Passkeys</b> are immune because they're cryptographically bound to the original domain.</Callout>
          </Section>
          <Section title="Defense — technical layer">
            <ol>
              <li><b>SPF/DKIM/DMARC</b> with <code>p=reject</code>.</li>
              <li>Inbound anti-spoofing (Microsoft Defender for Office, Proofpoint, Mimecast).</li>
              <li>Attachment sandboxing + URL rewriting + click-time scanning.</li>
              <li><b>FIDO2 / Passkeys</b> instead of TOTP/SMS — kills AiTM phishing entirely.</li>
              <li>Conditional access — block unusual countries / IPs.</li>
              <li>Browser isolation for sensitive teams.</li>
              <li>Detection for newly-registered look-alike domains (DomainTools / urlscan.io watchlists).</li>
            </ol>
          </Section>
          <Section title="Defense — human layer">
            <ul>
              <li>Short, regular training (15 min monthly beats 2 hours annually).</li>
              <li>Internal phishing simulations: those who click get trained, not punished.</li>
              <li>A "Report Phish" button in the mail client that forwards directly to the SOC.</li>
              <li>The <b>out-of-band verification</b> rule for any financial request: call back via the trusted phone number, not the one in the email.</li>
              <li>A no-blame culture for early reports — far more valuable than any punishment.</li>
            </ul>
            <Callout kind="good" title="Success metric">In mature orgs, the report rate exceeds the click rate — and reporters are rewarded.</Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
