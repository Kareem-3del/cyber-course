"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="email-phishing-analysis">
      <L
        ar={<>
          <Section title="ليه تحليل الإيميل أساسي لكل محقق">
            <p>حوالي 90% من اختراقات الشركات بتبدأ بإيميل. صدّقني..</p>
            <p>كمحلل SOC أو IR، هتفتح phishing من user reports 5 لـ 20 مرة في اليوم.
            ده مش حاجة هتأجلها.
            مش هتبقى محلل وأنت ما تعرفش تقرا headers.
            مش هتبقى IR وأنت ما تعرفش تفرّق بين BEC وphishing عادي.
            ولا تتمنى.</p>
            <Analogy>
              الإيميل زي ظرف بريد رسمي.
              عليه ختم البريد (SMTP servers)..
              طوابع (DKIM signatures)..
              عنوان مرسل ظاهر (From)..
              وعنوان فعلي للرد (Return-Path).
              المحلل الشاطر بيقرا الظرف الأول، قبل ما يفتح الجواب.
            </Analogy>
            <Callout kind="info" title="Ubiquiti 2015 — درس BEC بـ 46 مليون دولار">
              مهاجمين انتحلوا إيميل executive في Ubiquiti (شركة networking كبيرة). بعتوا للـ finance team طلب wire transfer "سرّي" لاستحواذ. الـ team نفّذوا. 46.7 مليون دولار راحوا. مفيش malware. مفيش zero-day. إيميل + ضغط وقت + هيبة منصب. وبس. Ubiquiti لحقت ترجّع 8 مليون بس. الباقي طار.
            </Callout>
          </Section>

          <Section title="بنية الـ Email — ما يهمّ فعلاً">
            <TwoCol>
              <Card title="Envelope (SMTP)" color="blue">
                MAIL FROM, RCPT TO — ما يراه السيرفر فقط. المستخدم لا يراه.
              </Card>
              <Card title="Headers" color="amber">
                From, To, Subject, Date — ما يراه المستخدم. <b>قابلة للتزوير بسهولة</b> ما لم يحم DMARC.
              </Card>
              <Card title="Received: chain" color="red">
                سجلّ كل خادم مرّ به الإيميل. اقرأ من الأسفل للأعلى. هذا يكشف أصل الإرسال الحقيقي.
              </Card>
              <Card title="Authentication-Results" color="green">
                نتائج SPF/DKIM/DMARC من mail server المستلم. أهم سطر للمحقّق.
              </Card>
              <Card title="Body" color="amber">
                النص + HTML + روابط + مرفقات. المرفقات في base64 داخل MIME parts.
              </Card>
              <Card title="X-Headers" color="green">
                Custom headers من mail providers (X-Mailer, X-Spam-Score, X-Originating-IP). كنز معلومات.
              </Card>
            </TwoCol>
          </Section>

          <Section title="SPF / DKIM / DMARC — الحراس الثلاثة">
            <ul>
              <li><b>SPF (Sender Policy Framework)</b> — DNS TXT يحدد أي IPs مسموح لها إرسال إيميل لهذا النطاق. يفحص <span className="eng">Return-Path</span>.</li>
              <li><b>DKIM (DomainKeys Identified Mail)</b> — توقيع cryptographic على parts من الإيميل. مفتاح public في DNS.</li>
              <li><b>DMARC</b> — سياسة تحدد ماذا يحدث لو فشل SPF و DKIM (none/quarantine/reject)، و تطلب alignment بين <span className="eng">From:</span> و الـ authenticated domain.</li>
            </ul>
            <Code lang="text">{`# سجلات DNS مثال
# SPF
target.gov. TXT "v=spf1 include:_spf.google.com ip4:1.2.3.4 -all"

# DKIM (selector "google")
google._domainkey.target.gov. TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb..."

# DMARC
_dmarc.target.gov. TXT "v=DMARC1; p=reject; rua=mailto:dmarc@target.gov; pct=100; aspf=s; adkim=s"`}</Code>
            <Callout kind="info" title="القراءة السريعة">
              في Headers ابحث عن <span className="eng">Authentication-Results:</span>:
              <br /><span className="eng">spf=pass smtp.mailfrom=...</span>
              <br /><span className="eng">dkim=pass header.d=...</span>
              <br /><span className="eng">dmarc=pass action=none header.from=...</span>
              <br />ثلاثة pass = الإيميل authentic. أي fail = افحص بعمق.
            </Callout>
          </Section>

          <Section title="حيل الـ phishing اللي لازم تعرفها">
            <ol>
              <li><b>Display name spoofing</b> — <span className="eng">"CEO Name" &lt;random@gmail.com&gt;</span>. الـ From الظاهر صحيح، الفعلي مزيّف. SPF/DMARC لا يفحصان display name.</li>
              <li><b>Lookalike domains (typosquatting)</b> — <span className="eng">microsoft-support.com</span>, <span className="eng">paypa1.com</span>, <span className="eng">target-gov.com</span>. حروف Cyrillic مشابهة لـ Latin (homoglyph).</li>
              <li><b>Punycode</b> — <span className="eng">xn--target-2sa.com</span> يظهر كـ <span className="eng">tárget.com</span>.</li>
              <li><b>Compromised legitimate domain</b> — مهاجم اخترق mail server شركة أخرى و يرسل من نطاقها (DMARC pass!).</li>
              <li><b>Reply-to manipulation</b> — From شرعي، Reply-To مختلف. الرد يذهب للمهاجم.</li>
              <li><b>HTML smuggling</b> — مرفق HTML يحوي JavaScript يبني payload في الـ browser محلياً. لا download مرئي.</li>
              <li><b>Link rewriting bypass</b> — استخدام redirector شرعي (Google, t.co, bit.ly، أو حتى موقع Microsoft نفسه عبر safelinks).</li>
              <li><b>QR codes (quishing)</b> — صورة QR تتجاوز URL scanners. المستخدم يمسحها بهاتف خارج الحماية.</li>
            </ol>
          </Section>

          <Section title="منهجية تحليل — خطوة بخطوة">
            <ol>
              <li><b>اطلب الإيميل بـ headers كاملة (.eml أو .msg)</b>. لا تكتفِ بـ screenshot.</li>
              <li><b>افحص Authentication-Results أولاً.</b> SPF/DKIM/DMARC؟</li>
              <li><b>اقرأ Received chain من الأسفل للأعلى.</b> ما أول mail server؟ هل من نطاق المرسِل المُدّعى؟</li>
              <li><b>قارن From, Reply-To, Return-Path.</b> هل تتطابق؟</li>
              <li><b>افتح في sandbox فقط.</b> لا تشغّل المرفق على workstation.</li>
              <li><b>استخرج IOCs:</b> sender IP, sender domain, URLs (defang!), attachment hashes.</li>
              <li><b>افحص URLs على VirusTotal / urlscan.io.</b> لكن لا تفتح الـ URL مباشرة على شبكة الشركة.</li>
              <li><b>افحص hashes على VT.</b> ابحث في threat intel الداخلي عن مرات سابقة.</li>
              <li><b>وثّق و حدّد scope.</b> كم مستخدم استلم؟ كم نقر؟ هل أحد دخل credentials؟</li>
              <li><b>Containment:</b> حذف من mailboxes (Microsoft 365: <span className="eng">Search-Mailbox</span> أو ContentSearch + PurgeAction)، block sender domain، أضف URL لـ blocklist.</li>
            </ol>
            <Callout kind="info" title="Defanging — قاعدة أساسية">
              عند مشاركة IOCs، عطّل الروابط: <span className="eng">https://evil.com</span> → <span className="eng">hxxps://evil[.]com</span>. بدلاً من <span className="eng">@</span> اكتب <span className="eng">[at]</span>. هذا يمنع clicks بالخطأ في reports و chats.
            </Callout>
          </Section>

          <Section title="أدوات التحليل">
            <Code lang="bash">{`# تحليل headers سريع
# https://mha.azurewebsites.net (Microsoft Header Analyzer)
# https://mailheader.org/

# على CLI
cat phish.eml | grep -E "^(From|To|Subject|Reply-To|Return-Path|Received|Authentication-Results):"

# استخراج URLs
cat phish.eml | grep -oE 'https?://[^[:space:]"<>]+' | sort -u

# استخراج المرفقات
ripmime -i phish.eml -d ./attachments
# أو
munpack phish.eml

# hash المرفق
sha256sum ./attachments/*

# اطّلع على مرفق Office دون فتحه
oletools/olevba.py malicious.docm           # macros
oletools/oleobj.py malicious.docm           # embedded objects
oletools/oleid.py malicious.docm

# إيميل بـ HTML smuggling
grep -E 'window.atob|FileSaver|saveAs' attached.html

# URLs و screenshots بأمان
urlscan.io        # screenshot + DOM + IOCs
any.run           # interactive sandbox للـ malware

# Blue team — Microsoft Defender for Office 365
# Threat Explorer → URL/file/sender filters
# Submissions: report ↔ admin review`}</Code>
          </Section>

          <Section title="Business Email Compromise (BEC) — لا تشبه phishing">
            <p>BEC لا يحوي malware عادةً. مهاجم يخترق أو ينتحل حساباً تنفيذياً ثم يطلب <b>تحويل أموال</b>، تغيير معلومات بنكية لمورّد، أو تسريب W-2 forms. الضرر السنوي عالمياً &gt; $50 مليار حسب FBI IC3.</p>
            <Callout kind="good" title="مؤشرات BEC">
              <ul>
                <li>إيميل من CEO/CFO يطلب تحويلاً عاجلاً، خارج القناة المعتادة.</li>
                <li>طلب سرّية مفرط ("don't tell anyone, this is confidential").</li>
                <li>ضغط زمني ("must be done before market close").</li>
                <li>تغيير معلومات بنكية لمورد قائم — حتى لو الإيميل يبدو من المورد.</li>
                <li>Reply-To يختلف عن From.</li>
                <li>قواعد inbox تُنشأ تلقائياً (mail forwarding rules) — عادة بعد credential phishing.</li>
              </ul>
            </Callout>
            <p>إجراءات: <b>callback verification</b> برقم معروف مسبقاً (لا الرقم في الإيميل). فعّل MFA على كل executive accounts. راقب Inbox Rules غير المعتادة (Microsoft 365 audit log).</p>
          </Section>

          <Section title="Federal context — IC3 و reporting">
            <Callout kind="info" title="ما يجب أن يعرفه محلل فيدرالي">
              <ul>
                <li><b>IC3</b> (Internet Crime Complaint Center) — <span className="eng">ic3.gov</span>. كل BEC و wire fraud يُبلَّغ هنا. الـ FBI يستطيع طلب recall للتحويل البنكي إذا أُبلِغ خلال 72 ساعة (Financial Fraud Kill Chain).</li>
                <li><b>CISA</b> — للحوادث في البنية التحتية الحرجة (CIRCIA reporting).</li>
                <li><b>US-CERT</b> — للمؤسسات الفيدرالية.</li>
                <li><b>NCFTA</b> — National Cyber-Forensics & Training Alliance — شراكة public/private.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="الحماية — الطبقات اللي لازم تتبني">
            <ol>
              <li><b>Email gateway</b> (Proofpoint, Mimecast, Microsoft Defender for Office 365) — sandboxing، URL rewriting، attachment detonation.</li>
              <li><b>DMARC على p=reject</b> لكل النطاقات — حتى parked ones.</li>
              <li><b>External email banner</b> — "هذا الإيميل من خارج المؤسسة" — يقلل clicks بنسبة كبيرة.</li>
              <li><b>MFA على كل user</b> — phishing الذي يسرق password وحده يفشل.</li>
              <li><b>Conditional Access</b> — login من device غير معتاد يطلب re-MFA.</li>
              <li><b>User reporting button</b> ("Report Phishing") مدمج في Outlook/Gmail.</li>
              <li><b>Tabletop training</b> — ليس phishing simulation فقط؛ تدريب CFO على verification protocols.</li>
              <li><b>Detection على inbox rules</b> الجديدة (forward-to-external، delete-on-receive).</li>
            </ol>
            <Callout kind="info" title="MITRE ATT&CK">
              T1566.001 (Spearphishing Attachment) · T1566.002 (Spearphishing Link) · T1566.003 (Spearphishing via Service) · T1534 (Internal Spearphishing) · T1114 (Email Collection).
            </Callout>
          </Section>

          <Section title="غلطات الـ junior — اللي بتحرق التحقيق">
            <Callout kind="warn" title="لو فات عليك ده، يبقى مش بتراقب">
              <ul>
                <li>بياخد screenshot من الإيميل بدل الـ .eml. الـ headers ضاعت. الـ analysis ما بقاش analysis.</li>
                <li>بيدوس على الـ link "علشان يشوف يروح فين". من جوّه شبكة الشركة. الـ malware delivery حصل والـ analyst نفسه بقى patient zero.</li>
                <li>بيشارك الـ URL في Slack من غير defang. الـ link preview بيتحمّل تلقائي. كل الفريق اتعرّض.</li>
                <li>بيقفل الـ ticket "false positive" بدون ما يفحص الـ Authentication-Results. الـ user كان بلّغ عن BEC حقيقي. اتسرّقت 200 ألف بعد 3 أيام.</li>
                <li>بيعمل purge من mailboxes بدون ما يحتفظ بنسخة forensic. الـ IR بعدين ما لقاش الـ evidence.</li>
              </ul>
              <p>الخلاصة: الـ phishing analysis مش "بصة سريعة". هي forensics مصغّرة. خد الـ .eml، اشتغل في sandbox، وثّق كل خطوة.</p>
            </Callout>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>الـ user اللي بلّغ عن phishing = ميزة. اللي ما بلّغش = خطر.</p>
            <p>الـ analyst اللي بيقفل من غير ما يفحص = البيت التاني للـ attacker.</p>
            <p>اكتبها على ظهر إيدك: <b>Always read the headers. Always.</b> مفيش shortcut.</p>
          </Section>
        </>}
        en={<>
          <Section title="Why email analysis is core for every investigator">
            <p>~90% of corporate breaches start with email. As a SOC analyst or IR responder, you'll open user-reported phish 5–20 times a day. This skill is non-negotiable.</p>
            <Analogy>Email is like a postal envelope. The envelope has the post-office stamp (SMTP servers), the cancellation marks (DKIM signatures), the visible sender name (From), and the actual return address (Return-Path). A skilled analyst reads the envelope before opening the letter.</Analogy>
          </Section>

          <Section title="Email anatomy — what actually matters">
            <TwoCol>
              <Card title="Envelope (SMTP)" color="blue">
                MAIL FROM, RCPT TO — only the server sees these. The user never does.
              </Card>
              <Card title="Headers" color="amber">
                From, To, Subject, Date — what the user sees. <b>Trivial to forge</b> unless DMARC protects.
              </Card>
              <Card title="Received: chain" color="red">
                Log of every server the message hit. Read bottom-up. Reveals the actual origin.
              </Card>
              <Card title="Authentication-Results" color="green">
                SPF/DKIM/DMARC results from the receiving server. The single most important header for an investigator.
              </Card>
              <Card title="Body" color="amber">
                Text + HTML + links + attachments. Attachments are base64 inside MIME parts.
              </Card>
              <Card title="X-Headers" color="green">
                Provider-custom (X-Mailer, X-Spam-Score, X-Originating-IP). Treasure trove.
              </Card>
            </TwoCol>
          </Section>

          <Section title="SPF / DKIM / DMARC — the three guards">
            <ul>
              <li><b>SPF (Sender Policy Framework)</b> — DNS TXT specifying which IPs may send for the domain. Checks the <span className="eng">Return-Path</span>.</li>
              <li><b>DKIM (DomainKeys Identified Mail)</b> — cryptographic signature over parts of the message. Public key in DNS.</li>
              <li><b>DMARC</b> — policy for what to do if SPF/DKIM fail (none/quarantine/reject), and requires alignment between the visible <span className="eng">From:</span> and the authenticated domain.</li>
            </ul>
            <Code lang="text">{`# Example DNS records
# SPF
target.gov. TXT "v=spf1 include:_spf.google.com ip4:1.2.3.4 -all"

# DKIM (selector "google")
google._domainkey.target.gov. TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb..."

# DMARC
_dmarc.target.gov. TXT "v=DMARC1; p=reject; rua=mailto:dmarc@target.gov; pct=100; aspf=s; adkim=s"`}</Code>
            <Callout kind="info" title="Quick read">
              In headers, find <span className="eng">Authentication-Results:</span>:
              <br /><span className="eng">spf=pass smtp.mailfrom=...</span>
              <br /><span className="eng">dkim=pass header.d=...</span>
              <br /><span className="eng">dmarc=pass action=none header.from=...</span>
              <br />Three passes = authentic. Any fail = dig deeper.
            </Callout>
          </Section>

          <Section title="Phishing tricks you must recognize">
            <ol>
              <li><b>Display-name spoofing</b> — <span className="eng">"CEO Name" &lt;random@gmail.com&gt;</span>. Visible From looks right, the actual one doesn't. SPF/DMARC don't check display names.</li>
              <li><b>Lookalike domains (typosquatting)</b> — <span className="eng">microsoft-support.com</span>, <span className="eng">paypa1.com</span>, <span className="eng">target-gov.com</span>. Cyrillic chars that look like Latin (homoglyphs).</li>
              <li><b>Punycode</b> — <span className="eng">xn--target-2sa.com</span> renders as <span className="eng">tárget.com</span>.</li>
              <li><b>Compromised legitimate domain</b> — attacker pwned a partner's mail server and sends from their real domain (DMARC pass!).</li>
              <li><b>Reply-to manipulation</b> — legit-looking From, different Reply-To. Replies go to the attacker.</li>
              <li><b>HTML smuggling</b> — HTML attachment with embedded JS that builds the payload locally in the browser. No visible download.</li>
              <li><b>Link-rewriting bypass</b> — abuse a trusted redirector (Google, t.co, bit.ly, even Microsoft Safe Links).</li>
              <li><b>QR codes (quishing)</b> — image bypasses URL scanners. User scans on a phone outside the org's protections.</li>
            </ol>
          </Section>

          <Section title="Analysis methodology — step by step">
            <ol>
              <li><b>Get the email with full headers (.eml or .msg).</b> Don't settle for a screenshot.</li>
              <li><b>Read Authentication-Results first.</b> SPF/DKIM/DMARC?</li>
              <li><b>Read Received chain bottom-up.</b> What was the first hop? Does it match the claimed sender domain?</li>
              <li><b>Compare From, Reply-To, Return-Path.</b> Do they align?</li>
              <li><b>Open in a sandbox only.</b> Never run attachments on your workstation.</li>
              <li><b>Extract IOCs:</b> sender IP, sender domain, URLs (defang!), attachment hashes.</li>
              <li><b>Check URLs on VirusTotal / urlscan.io.</b> Don't visit the URL on your corp network.</li>
              <li><b>Hash lookup.</b> Search internal CTI for prior sightings.</li>
              <li><b>Document and scope.</b> How many users received it? How many clicked? Did anyone enter creds?</li>
              <li><b>Containment:</b> purge from mailboxes (Microsoft 365: <span className="eng">Search-Mailbox</span> or ContentSearch + PurgeAction), block sender domain, add URL to blocklist.</li>
            </ol>
            <Callout kind="info" title="Defanging — house rule">
              When sharing IOCs, neutralize them: <span className="eng">https://evil.com</span> → <span className="eng">hxxps://evil[.]com</span>. Replace <span className="eng">@</span> with <span className="eng">[at]</span>. Prevents accidental clicks in reports and chats.
            </Callout>
          </Section>

          <Section title="Tooling">
            <Code lang="bash">{`# Fast header analysis
# https://mha.azurewebsites.net (Microsoft Header Analyzer)
# https://mailheader.org/

# On CLI
cat phish.eml | grep -E "^(From|To|Subject|Reply-To|Return-Path|Received|Authentication-Results):"

# Extract URLs
cat phish.eml | grep -oE 'https?://[^[:space:]"<>]+' | sort -u

# Extract attachments
ripmime -i phish.eml -d ./attachments
# or
munpack phish.eml

# Hash the attachment
sha256sum ./attachments/*

# Inspect Office attachment without opening
oletools/olevba.py malicious.docm           # macros
oletools/oleobj.py malicious.docm           # embedded objects
oletools/oleid.py malicious.docm

# HTML smuggling indicators
grep -E 'window.atob|FileSaver|saveAs' attached.html

# Safe URL & screenshot tools
urlscan.io        # screenshot + DOM + IOCs
any.run           # interactive malware sandbox

# Blue team — Microsoft Defender for Office 365
# Threat Explorer → URL/file/sender filters
# Submissions: report ↔ admin review`}</Code>
          </Section>

          <Section title="Business Email Compromise (BEC) — not phishing as you know it">
            <p>BEC usually carries no malware. The attacker compromises or impersonates an executive and asks for a <b>wire transfer</b>, vendor banking change, or W-2 disclosure. Reported global losses &gt; $50B/yr per FBI IC3.</p>
            <Callout kind="good" title="BEC indicators">
              <ul>
                <li>CEO/CFO email asking for an urgent wire outside normal channels.</li>
                <li>Excess secrecy ("don't tell anyone, this is confidential").</li>
                <li>Time pressure ("must be done before market close").</li>
                <li>Banking-info change for an existing vendor — even if email looks like the vendor.</li>
                <li>Reply-To different from From.</li>
                <li>Auto-created inbox forwarding rules — typically follow credential phishing.</li>
              </ul>
            </Callout>
            <p>Action: <b>callback verification</b> using a previously-known number (not the one in the email). Enforce MFA on every executive account. Audit unusual inbox rules (Microsoft 365 audit log).</p>
          </Section>

          <Section title="Federal context — IC3 and reporting">
            <Callout kind="info" title="What a fed analyst should know">
              <ul>
                <li><b>IC3</b> (Internet Crime Complaint Center) — <span className="eng">ic3.gov</span>. All BEC / wire fraud reported here. The FBI can request a wire recall if reported within 72 hours (Financial Fraud Kill Chain).</li>
                <li><b>CISA</b> — for incidents touching critical infrastructure (CIRCIA reporting).</li>
                <li><b>US-CERT</b> — for federal civilian agencies.</li>
                <li><b>NCFTA</b> — National Cyber-Forensics & Training Alliance — public/private partnership.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Defense — the layers that must be there">
            <ol>
              <li><b>Email gateway</b> (Proofpoint, Mimecast, Microsoft Defender for Office 365) — sandboxing, URL rewriting, attachment detonation.</li>
              <li><b>DMARC at p=reject</b> on every domain — including parked ones.</li>
              <li><b>External email banner</b> — "this email is from outside the org" — meaningfully reduces clicks.</li>
              <li><b>MFA for every user</b> — password-only phishing fails.</li>
              <li><b>Conditional Access</b> — unfamiliar device → re-MFA.</li>
              <li><b>User report button</b> ("Report Phishing") in Outlook/Gmail.</li>
              <li><b>Tabletop drills</b> — not just sim phishes; train CFOs on verification protocols.</li>
              <li><b>Inbox-rule detection</b> for new forward-to-external or delete-on-receive rules.</li>
            </ol>
            <Callout kind="info" title="MITRE ATT&CK">
              T1566.001 (Spearphishing Attachment) · T1566.002 (Spearphishing Link) · T1566.003 (Spearphishing via Service) · T1534 (Internal Spearphishing) · T1114 (Email Collection).
            </Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
