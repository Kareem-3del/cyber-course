"use client";
import { LessonShell, Section, Callout, Code, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="social-engineering">
      <L
        ar={<>
          <Section title="ليه الإنسان هو أرخى نقطة في المنظومة؟">
          <Analogy>
            بُص.
            بنيت سور سمكه 10 متر..
            حطّيت EDR على كل جهاز..
            صرفت مليون دولار على SIEM..
            وجاء البواب فتح الباب لراجل قاله "أنا من الصيانة".
            انتهت اللعبة.
            <br/><br/>
            - طب ده مش حصل معايا.. أنا موظفيني واعيين يا حضرتك.
            <br/><br/>
            ها ها ها.. يا نجم الجيل. متوقّع كالعادة.
            فوق 80% من الاختراقات بتبدأ بغلطة موظف. مش ثغرة في كود — قرار بشري اتاخد في 3 ثواني. وبنسبة 99%، اللي بيدوس على اللينك هو نفس اللي حضر training السنة اللي فاتت وقالك "أنا فاهم".
          </Analogy>
          <Callout kind="info" title="واقعة Twitter 2020">
            مهاجمين عيال صغيرة (أحدهم كان عنده 17 سنة) كلموا موظفين دعم في تويتر، قالوا "إحنا من الـ IT الداخلي وفي مشكلة في VPN". اخدوا access لأدوات admin داخلية، خطفوا حسابات Obama و Bezos و Musk، وعملوا scam بـ Bitcoin سرقوا بيه أكتر من 100 ألف دولار. ما استخدموش zero-day. استخدموا تليفون.
          </Callout>
        </Section>
        <Section title="مبادئ الإقناع — Cialdini">
          <ul>
            <li><b>Authority — هيبة المنصب</b> — "أنا من الـ IT". الناس بتنفّذ للزي الرسمي من غير ما تسأل.</li>
            <li><b>Urgency — ضغط الوقت</b> — "حسابك هيتقفل خلال ساعة". لما العقل يتحط تحت ضغط، بيختصر التفكير.</li>
            <li><b>Scarcity — الفرصة الأخيرة</b> — "فاضل 10 أماكن بس". الخوف إن الحاجة تفوتك بيغلب الحساب الهادي.</li>
            <li><b>Social Proof — ضغط الجماعة</b> — "كل زمايلك خلصوا التحديث". محدش حابب يبقى الشاذ في القاعدة.</li>
            <li><b>Liking — الألفة</b> — يكلّمك بصيغة صاحب أو زميل قديم. بترخّي حذرك تلقائي.</li>
            <li><b>Reciprocity — رد الجميل</b> — يقدم لك حاجة صغيرة الأول، فبتحس إنك مدين له بطلبه.</li>
            <li><b>Commitment — التورّط التدريجي</b> — يخليك توافق على حاجة صغيرة، فالكبيرة بتعدّي ورا الأولى من غير مقاومة.</li>
          </ul>
        </Section>
        <Section title="أنواع الهجمات — اعرف اللي قصادك">
          <TwoCol>
            <Card title="Phishing عام">إيميل جماعي بطعم عمومي (تحديث، فاتورة). شبكة واسعة، نسبة الإصابة منخفضة بس العدد بيعوّض.</Card>
            <Card title="Spear Phishing">موجّه لشخص بعينه بعد OSINT دقيق — نسبة النجاح بتفرق 30 ضعف عن الـ Phishing العام.</Card>
            <Card title="Whaling">صيد الكبار: المدير المالي والـ C-level. الرسالة بتبقى على مقاس الشخص نفسه.</Card>
            <Card title="Vishing">هجوم بالصوت على التليفون، الغالب بينتحل صفة الـ IT أو البنك.</Card>
            <Card title="Smishing">SMS — "في طرد بيستناك، ادوس الرابط دلوقتي".</Card>
            <Card title="BEC (Business Email Compromise)">انتحال صفة الـ CEO عشان يصدر أمر تحويل عاجل — أكبر بند خسائر مالية في الإحصائيات الرسمية.</Card>
            <Card title="Baiting">يسيب USB في الباركينج، ودايماً بيلاقي حد فضولي يركّبه.</Card>
            <Card title="Tailgating">دخول فعلي ورا موظف من غير بطاقة. "اتفضل يا فندم، الباب لسه مفتوح".</Card>
          </TwoCol>
        </Section>
        <Section title="بناء حملة Phishing احترافية (تمرين مصرّح به)">
          <Step n={1} title="OSINT">جمع أسامي، إيميلات، الـ stack التقني، الأنماط الداخلية.</Step>
          <Step n={2} title="اختيار الـ Pretext — السبب">"تذكرة جديدة في Jira" / "إعادة تعيين password" / "رسالة خارج المكتب من المدير".</Step>
          <Step n={3} title="بناء الـ Landing Page">
            <Code lang="tools">{`evilginx2 -p phishlets/  # MFA bypass via reverse proxy
gophish + chameleon       # كامل: حملة + تتبع
modlishka                # 2FA-bypassing reverse proxy
goPhish                  # حملات تدريبية</Code>`}</Code>
          </Step>
          <Step n={4} title="Typosquatting — دومين شبيه">
            <Code lang="bash">{`dnstwist target.gov         # توليد دومينات متشابهة
# ت𝖺rget.gov, target-gov.com, target.g0v, t4rget.gov`}</Code>
          </Step>
          <Step n={5} title="ضبط الإيميل بشكل شرعي">
            SPF + DKIM + DMARC على دومين الإرسال، مع تسخين الـ IP عشان تعدي فلاتر السبام.
          </Step>
          <Step n={6} title="تحليل النتائج">معدل الفتح، معدل الضغط، الـ creds اللي وصلت، حالات الـ MFA bypass.</Step>
        </Section>
        <Section title="تخطّي الـ MFA باستخدام Adversary-in-the-Middle">
          <p>أدوات زي <b>evilginx2</b> بتقعد <i>reverse proxy</i> بين الضحية والموقع الحقيقي. الضحية بتدخّل اليوزر والباسورد وكود الـ MFA — كل حاجة بتعدّي طبيعي للسيرفر الأصلي — بس المهاجم في النص بيلتقط الـ <b>session cookie</b> النهائي. الضحية مش حاسّة بأي عَرض، والـ login نجح فعلاً من جهتها.</p>
          <Callout kind="danger" title="اللي بيحصل فعلياً">حتى الـ MFA الكلاسيكي (TOTP, SMS) ما بيحميش من السيناريو ده. <b>FIDO2 / WebAuthn / Passkeys</b> هي الوحيدة المتحصّنة، لأنها مربوطة بالدومين الأصلي تشفيرياً — لو الدومين اختلف، المفتاح ما بيردّش.</Callout>
        </Section>
        <Section title="الحماية — الطبقة التقنية">
          <ol>
            <li><b>SPF / DKIM / DMARC</b> بسياسة <code>p=reject</code>. أي حاجة أقل من كده ضعف صريح.</li>
            <li>Anti-spoofing على الإيميل الوارد (Microsoft Defender for Office, Proofpoint, Mimecast).</li>
            <li>Sandbox للمرفقات + URL rewriting + click-time scanning.</li>
            <li><b>FIDO2 / Passkeys</b> بدل TOTP/SMS — بيقفل سكة الـ AiTM phishing من أصلها.</li>
            <li>Conditional Access — امنع الدخول من دول أو IPs مش معتادة للحساب.</li>
            <li>Browser isolation للفرق الحساسة (مالية، إدارية، تنفيذية).</li>
            <li>رصد الدومينات الشبيهة اللي اتسجّلت حديثاً عبر DomainTools / urlscan.io watchlists.</li>
          </ol>
        </Section>
        <Section title="الحماية — الطبقة البشرية (الأهم)">
          <ul>
            <li>تدريب قصير ومنتظم (15 دقيقة كل شهر أنفع بكتير من ساعتين كل سنة).</li>
            <li>محاكاة phishing داخلية: اللي بيدوس بيتدرّب، ما بيتعاقبش. العقاب بيخلّي الناس تخبّي غلطاتها.</li>
            <li>زرار <b>Report Phish</b> في الـ mail client يوصّل الرسالة فوراً للـ SOC.</li>
            <li>قاعدة <b>Out-of-Band Verification</b> لأي طلب مالي: ارجع للشخص على الرقم الموثّق عندك، مش الرقم المكتوب في الإيميل.</li>
            <li>ثقافة "ما فيش لوم" على البلاغ المبكر — بتفرق أكتر من أي عقاب.</li>
          </ul>
          <Callout kind="good" title="مقياس النضج">المؤسسات الناضجة معدّل البلاغات عندها أعلى من معدّل النقر — وبتكافئ اللي بيبلّغ بدل ما بتلوم اللي بيغلط.</Callout>
        </Section>
        <Section title="غلطات الـ junior — الـ Blue Team جنبه تتفصل">
          <Callout kind="warn" title="لو فات عليك ده، يبقى مش بتراقب">
            <ul>
              <li>الموظف يبلّغ عن إيميل phishing الساعة 9 الصبح — والـ analyst يفتحها الساعة 4 العصر. في الـ 7 ساعات دول 200 موظف تاني وصلتهم نفس الرسالة.</li>
              <li>الـ awareness training بقى فيديو من 2018 الناس بتدوس Next عليه من غير ما تشوفه.</li>
              <li>الـ DMARC على <code>p=none</code> "علشان ما نكسرش حاجة". معناها: أي حد في الدنيا بيقدر ينتحل دومينك.</li>
              <li>الـ "Report Phish" button مش موجود — الموظف بيـ forward الإيميل لـ IT شخصياً، وبيبوّظ الـ headers.</li>
              <li>الفريق بيكافئ موظفين على إنهم "ما دوسوش" — ومحدش بيكافئ اللي بلّغ. النتيجة: الناس بتسكت لما تغلط.</li>
            </ul>
            <p>الخلاصة: الـ phishing ما بتتحلش بـ tool. بتتحل بثقافة + سرعة رد + قرار إداري إن المكافأة على البلاغ مش على عدم الغلط.</p>
          </Callout>
        </Section>
        <Section title="الخلاصة الناشفة">
          <p>لو شركتك بتركّز على الـ firewall أكتر من الموظفين — أنت بتأمّن المكان الغلط.</p>
          <p>الـ attacker بيكلم البشر، مش الـ servers. ابدأ من هناك.</p>
          <p>اكتبها على الحيطة اللي قصاد مكتب الـ CISO: <b>اوعى تكافئ "اللي ما دوسش". كافئ "اللي بلّغ". الفرق بين الاتنين هو الفرق بين breach اتقفل في 5 دقايق و breach اكتشفته من tweet.</b></p>
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
