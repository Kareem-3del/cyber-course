"use client";
import { LessonShell, Section, Callout, Code, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="social-engineering">
      <L
        ar={<>
          <Section title="ليه "الإنسان" هو أضعف حلقة دايماً؟">
            <Analogy>ممكن تبني جدران 10 متر سمك. بس لو الحارس على الباب فتح لأي حد قاله "أنا من الصيانة"، الجدران كلها مفيهاش لازمة. أكتر من 80% من الاختراقات بتبدأ بغلطة بشرية. مش ثغرة في النظام — ثغرة في الإنسان.</Analogy>
          </Section>
          <Section title="مبادئ الإقناع — Cialdini">
            <ul>
              <li><b>Authority — السلطة</b> — "أنا من الـ IT". الناس بتطيع الزي الرسمي.</li>
              <li><b>Urgency — الاستعجال</b> — "حسابك هيتقفل خلال ساعة". العقل بيتعطل تحت الضغط.</li>
              <li><b>Scarcity — الندرة</b> — "10 أماكن بس". الخوف من إنه يفوتك.</li>
              <li><b>Social Proof — الإجماع</b> — "كل زمايلك خلصوا التحديث". مفيش حد عايز يبقى لوحده.</li>
              <li><b>Liking — الإعجاب</b> — انتحال شخصية صاحب أو زميل.</li>
              <li><b>Reciprocity — المعاملة بالمثل</b> — هدية صغيرة قبل ما تطلب.</li>
              <li><b>Commitment — الالتزام</b> — اطلب "نعم" صغيرة الأول، الكبيرة بتيجي ورا.</li>
            </ul>
          </Section>
          <Section title="أنواع الهجمات — اعرف اللي ضدك">
            <TwoCol>
              <Card title="Phishing عام">إيميل جماعي بطعم بسيط (تحديث، فاتورة). شبكة واسعة.</Card>
              <Card title="Spear Phishing">موجه لشخص واحد بعد OSINT دقيق — نسبة النجاح أعلى 30 ضعف.</Card>
              <Card title="Whaling">بيستهدف الـ C-level بالظبط. صيد كبير.</Card>
              <Card title="Vishing">بالصوت على التليفون، بينتحل غالباً شخصية الـ IT.</Card>
              <Card title="Smishing">SMS — "في طرد بيستناك، دوس الرابط".</Card>
              <Card title="BEC (Business Email Compromise)">انتحال شخصية الـ CEO عشان يطلع أمر تحويل عاجل — أكبر خسائر مالية على الإطلاق.</Card>
              <Card title="Baiting">USB مرمي في الباركينج، و فيه دايماً حد بيركبه.</Card>
              <Card title="Tailgating">دخول فعلي ورا موظف من غير بطاقة. "اتفضل الباب يا فندم".</Card>
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
          <Section title="MFA Bypass عن طريق Adversary-in-the-Middle">
            <p>أدوات زي <b>evilginx2</b> بتشتغل reverse proxy بين الضحية و الموقع الحقيقي. الضحية بتدخل اليوزرنيم و الباسورد و كود الـ MFA — كل حاجة بتعدي طبيعي. بس المهاجم بيمسك الـ session cookie النهائي. مفيش حد حس بحاجة.</p>
            <Callout kind="danger" title="النتيجة">حتى الـ MFA الكلاسيكي (TOTP, SMS) مش بيحميك من ده. <b>FIDO2 / WebAuthn / Passkeys</b> هي بس اللي محصّنة، لأنها مربوطة بالدومين الأصلي تشفيراً.</Callout>
          </Section>
          <Section title="الدفاع — المستوى التقني">
            <ol>
              <li><b>SPF/DKIM/DMARC</b> بسياسة <code>p=reject</code>. أي حاجة أقل من كده عك.</li>
              <li>Anti-spoofing على الإيميل الداخل (Microsoft Defender for Office, Proofpoint, Mimecast).</li>
              <li>Sandbox للمرفقات + URL rewriting + click-time scanning.</li>
              <li><b>FIDO2 / Passkeys</b> بدل TOTP/SMS — بيقتل الـ AiTM phishing من جذوره.</li>
              <li>Conditional Access — امنع الدخول من بلاد أو IPs مش معتادة.</li>
              <li>Browser isolation للفرق الحساسة.</li>
              <li>كشف الدومينات الشبيهة اللي اتسجلت حديثاً (DomainTools / urlscan.io watchlists).</li>
            </ol>
          </Section>
          <Section title="الدفاع — المستوى البشري (الأهم)">
            <ul>
              <li>تدريب قصير و دوري (15 دقيقة كل شهر أحسن بكتير من ساعتين كل سنة).</li>
              <li>محاكاة phishing داخلية: اللي بيدوس بيتدرّب، مش بيتعاقب.</li>
              <li>زرار "Report Phish" في mail client بيبعت الرسالة على طول للـ SOC.</li>
              <li>قاعدة <b>Out-of-Band verification</b> لأي طلب مالي: كلّمه على الرقم الموثق، مش الرقم اللي في الإيميل.</li>
              <li>ثقافة "مفيش لوم" للإبلاغ المبكر — ده أهم بكتير من أي عقاب.</li>
            </ul>
            <Callout kind="good" title="مقياس النجاح">المؤسسات الناضجة بيبقى عندها معدل البلاغات أعلى من معدل النقر — و بيكافئوا اللي بيبلّغ.</Callout>
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
