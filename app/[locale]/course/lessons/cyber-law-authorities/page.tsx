"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="cyber-law-authorities">
      <L
        ar={<>
          <Section title="لماذا يحتاج المحلّل التقني فقه القانون">
            <p>التحقيقات السيبرانية في بيئة فيدرالية لا تجري في فراغ. كل قرار — جمع log، الوصول لـ mailbox، إعادة بناء جلسة شبكة، التواصل مع جهة خاصة — له <b>إطار قانوني</b>. التجاوز يُسقط القضية و يعرّضك شخصياً للمسؤولية.</p>
            <Analogy>كجرّاح يعرف كيف يقطع، لكن لا يعرف متى يحتاج موافقة المريض. التقنية بدون السلطة القانونية = مخاطرة شخصية و مهنية.</Analogy>
            <Callout kind="danger" title="إخلاء مسؤولية">
              هذا الدرس <b>تمهيدي</b>. يقدّم خريطة عامة فقط. القرارات الحقيقية تتطلب OGC (Office of General Counsel) و AUSA (Assistant US Attorney). <b>لا تستند على هذا الدرس وحده في قرار قانوني فعلي</b>.
            </Callout>
          </Section>

          <Section title="هرم السلطة القانونية الأمريكية">
            <ol>
              <li><b>Constitution</b> — التعديل الرابع (4th Amendment): حماية من unreasonable searches/seizures. الأساس لكل warrant.</li>
              <li><b>Statutes</b> (Acts of Congress) — CFAA, ECPA, FISA.</li>
              <li><b>Executive Orders</b> — EO 12333 (Intelligence Community).</li>
              <li><b>Regulations</b> — DOJ guidelines, AG Guidelines for Domestic FBI Operations.</li>
              <li><b>Case Law</b> — Supreme Court & Circuit decisions تفسّر القوانين (Carpenter v. US, Riley v. California, etc.).</li>
            </ol>
          </Section>

          <Section title="CFAA — Computer Fraud and Abuse Act (18 USC 1030)">
            <p>القانون الجنائي الرئيسي للجرائم السيبرانية. يعاقب <b>الوصول غير المصرّح به</b> أو "تجاوز الوصول المصرّح به" لحاسوب محمي.</p>
            <TwoCol>
              <Card title="ما يجرّم" color="red">
                <ul>
                  <li>اقتحام حاسوب لسرقة معلومات (1030(a)(2)).</li>
                  <li>نقل برمجية ضارة تسبب ضرراً (1030(a)(5)).</li>
                  <li>الاتجار بكلمات مرور (1030(a)(6)).</li>
                  <li>الابتزاز (1030(a)(7)).</li>
                </ul>
              </Card>
              <Card title="ما يعنيه للمحلّل" color="blue">
                <ul>
                  <li>اعتمادك على authorization صريح في كل مهمة pentest.</li>
                  <li>"Active Defense" المهاجِم محظور — لا "hack back".</li>
                  <li>قراءة honeypot data شرعية، لكن إغراء المهاجم لـ system خاص به ≠ مسموح.</li>
                </ul>
              </Card>
            </TwoCol>
            <Callout kind="info" title="Van Buren v. United States (2021)">
              المحكمة العليا قيّدت "exceeds authorized access" — لا تشمل misuse للمعلومات التي يحق للموظف الوصول إليها. مهم لقضايا insider threat.
            </Callout>
          </Section>

          <Section title="ECPA — Electronic Communications Privacy Act (1986)">
            <p>ينظم وصول الحكومة إلى الاتصالات الإلكترونية. ثلاثة أجزاء:</p>
            <TwoCol>
              <Card title="Title I — Wiretap Act (Title III)" color="red">
                <b>محتوى</b> اتصالات real-time. يحتاج "super warrant" (Title III order). معايير عالية: probable cause + exhaustion of alternatives + minimization.
              </Card>
              <Card title="Title II — Stored Communications Act (SCA)" color="amber">
                <b>المحتوى المُخزَّن</b> (إيميل قديم، ملفات سحابية). معايير حسب العمر: ≤180 يوم تحتاج warrant، &gt;180 يوم قد تكفي subpoena. (تغيّر بعد <i>Carpenter</i>؛ معظم providers يطلبون warrant الآن).
              </Card>
              <Card title="Title III — Pen/Trap" color="blue">
                <b>Metadata</b> (dialed numbers, IP addresses, headers). معيار أدنى: court order، ليس probable cause.
              </Card>
            </TwoCol>
            <Callout kind="danger" title="نقطة جوهرية">
              التقاط traffic على شبكة المؤسسة يحتاج consent (banner) أو "provider exception". لا تفترض consent — اقرأ banner المؤسسة و سجل acceptable-use الموقّعة.
            </Callout>
          </Section>

          <Section title="Title III — Wiretap Act (18 USC 2510 et seq.)">
            <p>أعلى حماية في القانون الأمريكي. content interception real-time = wiretap.</p>
            <ul>
              <li>يحتاج <b>Title III order</b> من قاضٍ فيدرالي.</li>
              <li>إذن من DAG / Associate AG / AAG (وزارة العدل).</li>
              <li>أقصى 30 يوم، قابل للتجديد.</li>
              <li><b>Minimization</b> — إيقاف الـ capture عند الاتصال غير ذي الصلة.</li>
              <li><b>Exhaustion</b> — يجب إثبات أن طرق التحقيق الأخرى فشلت أو ستفشل.</li>
            </ul>
            <Callout kind="info" title="استثناءات">
              <ul>
                <li><b>Consent of one party</b> — إذا طرف من المحادثة يوافق (banner = consent).</li>
                <li><b>Provider exception</b> — للمزوّد للحماية الأساسية لخدمته.</li>
                <li><b>Computer trespasser</b> — مع موافقة صاحب النظام، الحكومة قد تلتقط traffic المهاجم.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="FISA — Foreign Intelligence Surveillance Act (1978)">
            <p>قناة موازية لـ Title III، لكن لـ <b>foreign intelligence</b>، ليس law enforcement.</p>
            <ul>
              <li><b>FISA Court (FISC)</b> — قضاة مختصون، إجراءات سرية.</li>
              <li><b>Section 702</b> — مراقبة non-US persons خارج الولايات. مثيرة للجدل.</li>
              <li><b>Section 215</b> (سابقاً) — business records bulk collection. أُلغيت / عُدّلت بعد Snowden.</li>
              <li><b>Title I FISA</b> — مراقبة "agents of foreign powers" داخل الولايات.</li>
            </ul>
            <Callout kind="danger" title="جدار فاصل">
              FISA و Title III لا يمتزجان بسهولة. محقّق criminal لا يستطيع استخدام FISA. محلّل intelligence لا يستطيع تحويل intel لـ criminal evidence دون خطوات قانونية محدّدة. الفصل بين <b>Title 50</b> (intel) و <b>Title 18</b> (LE) أساس عمل الـ FBI.
            </Callout>
          </Section>

          <Section title="EO 12333 — Intelligence Community Charter">
            <p>الأمر التنفيذي الأم للـ USIC. يحدّد:</p>
            <ul>
              <li>المهام و الصلاحيات لكل وكالة (CIA, NSA, DIA, FBI Intelligence Branch, etc.).</li>
              <li>معايير جمع intel على US persons (محظور إلا عبر procedures معتمدة).</li>
              <li>"Minimization procedures" لحماية خصوصية الأمريكيين.</li>
              <li>Oversight — Inspector General, Privacy and Civil Liberties Oversight Board (PCLOB).</li>
            </ul>
            <p>كل وكالة لديها AG-approved procedures (e.g., NSA's USSID-18، CIA's AR 2-2). محلّل في الـ FBI Cyber Division يخضع لـ DIOG (Domestic Investigations and Operations Guide).</p>
          </Section>

          <Section title="ميكانيكا الأدوات القانونية">
            <Code lang="text">{`المستوى            ما يصلح له                    معيار قانوني
──────────────────────────────────────────────────────────────
Subpoena           Subscriber info, basic records  Reasonable
                                                   relevance
2703(d) Order      Transactional records,          Specific and
                   non-content                     articulable facts
Warrant            Stored content (email body,    Probable cause
                   files); search & seizure
Pen/Trap           Real-time metadata              Court order
                                                   (relevant)
Title III Order    Real-time content (wiretap)     Probable cause
                                                   + exhaustion +
                                                   minimization
NSL                Subscriber info / metadata      FBI sole authority
(National Security                                 + threat to
 Letter)                                           national security
FISA Order         Foreign intel surveillance      FISC approval`}</Code>
          </Section>

          <Section title="حالات Supreme Court يجب أن تعرفها">
            <TwoCol>
              <Card title="Carpenter v. US (2018)" color="blue">
                Cell-site location records (CSLI) تتطلب warrant. أنهى third-party doctrine للـ digital location data. تأثيره يمتد لكثير من البيانات الرقمية.
              </Card>
              <Card title="Riley v. California (2014)" color="blue">
                تفتيش الهاتف عند الاعتقال يحتاج warrant — حتى للهاتف نفسه.
              </Card>
              <Card title="US v. Jones (2012)" color="blue">
                وضع GPS tracker على سيارة = search تحت 4th Amendment. مهم لـ continuous digital tracking.
              </Card>
              <Card title="Van Buren v. US (2021)" color="amber">
                ضيّق CFAA — "exceeds authorized access" لا يشمل misuse للوصول المصرّح.
              </Card>
            </TwoCol>
          </Section>

          <Section title="Information Sharing — DSHEA, CISA 2015">
            <ul>
              <li><b>Cybersecurity Information Sharing Act (CISA 2015)</b> — يوفّر liability protection للقطاع الخاص حين يشارك Cyber Threat Indicators مع الحكومة عبر AIS (Automated Indicator Sharing).</li>
              <li><b>InfraGard</b> — partnership FBI ↔ private sector في 16 sectors.</li>
              <li><b>JCDC</b> (Joint Cyber Defense Collaborative — CISA) — public/private operational collaboration.</li>
              <li>عند الشك في classification: <b>TLP</b> + اسأل OGC.</li>
            </ul>
          </Section>

          <Section title="Privacy & Civil Liberties — قواعد ملزمة">
            <Callout kind="info" title="ركائز يجب احترامها">
              <ul>
                <li><b>Privacy Act (1974)</b> — كيفية تخزين معلومات US persons. نظام قواعد للـ "system of records".</li>
                <li><b>Attorney General Guidelines</b> — قيود على predicated investigations vs assessments.</li>
                <li><b>USPER protections</b> — جمع/استبقاء معلومات US persons يخضع لقواعد إضافية حتى في intel context.</li>
                <li><b>Whistleblower channels</b> — IG و PCLOB. لا تتجاوزها.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="لماذا تحتاج مكتب OGC في حياتك اليومية">
            <ul>
              <li>قبل أي capture جديد، أي أداة جديدة، أي data sharing جديد.</li>
              <li>قبل التواصل مع private sector عن حادث.</li>
              <li>قبل تقديم intel لـ AUSA لـ criminal prosecution.</li>
              <li>عند الشك: اسأل و وثّق السؤال و الإجابة. هذا يحميك.</li>
            </ul>
            <Callout kind="good" title="قواعد عملية">
              <ol>
                <li>اقرأ DIOG و SOP الخاصة بفرقتك.</li>
                <li>احفظ contact OGC و AUSA المخصّصة.</li>
                <li>وثّق predication لكل investigation.</li>
                <li>افهم الفرق بين Assessment و Preliminary Investigation و Full Investigation.</li>
                <li>التزم بـ minimization — لا تجمع أكثر مما تحتاج.</li>
                <li>لا تخلط Title 50 و Title 18 work.</li>
                <li>كل قرار قابل للمراجعة — وثّق reasoning.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="موارد للقراءة الذاتية">
            <ul>
              <li><b>DOJ "Searching and Seizing Computers" Manual</b> — الكتاب المعياري.</li>
              <li><b>NIST SP 800-86</b> — Forensic integration in IR.</li>
              <li><b>EFF Surveillance Self-Defense</b> — نظرة perspective civil liberties.</li>
              <li><b>Lawfare blog</b> — تحليل قانوني لقضايا cyber الراهنة.</li>
              <li><b>JustSecurity.org</b> — كذلك.</li>
              <li><b>Marshall, "The Lawyer's Cyber Security Handbook"</b>.</li>
              <li><b>FBI's DIOG (Public Version)</b> — الإطار الإجرائي للمحقق.</li>
            </ul>
          </Section>
        </>}
        en={<>
          <Section title="Why a technical analyst needs legal literacy">
            <p>Federal cyber investigations don't operate in a vacuum. Every decision — pulling logs, accessing a mailbox, reconstructing a session, contacting a private party — has a <b>legal frame</b>. Step over it and the case fails, and you may be personally liable.</p>
            <Analogy>A surgeon who knows how to cut but not when to obtain consent. Technique without legal authority = personal and professional risk.</Analogy>
            <Callout kind="danger" title="Disclaimer">
              This lesson is <b>introductory</b>. It maps the terrain. Real decisions require OGC (Office of General Counsel) and AUSA (Assistant US Attorney). <b>Do not rely on this lesson alone for any real legal call.</b>
            </Callout>
          </Section>

          <Section title="The US legal hierarchy">
            <ol>
              <li><b>Constitution</b> — 4th Amendment: protection against unreasonable searches/seizures. Foundation of every warrant.</li>
              <li><b>Statutes</b> (Acts of Congress) — CFAA, ECPA, FISA.</li>
              <li><b>Executive Orders</b> — EO 12333 (Intelligence Community).</li>
              <li><b>Regulations</b> — DOJ guidelines, AG Guidelines for Domestic FBI Operations.</li>
              <li><b>Case Law</b> — Supreme Court and Circuit decisions interpreting statutes (Carpenter v. US, Riley v. California, etc.).</li>
            </ol>
          </Section>

          <Section title="CFAA — Computer Fraud and Abuse Act (18 USC 1030)">
            <p>Primary criminal statute for cybercrime. Punishes <b>unauthorized access</b> or "exceeding authorized access" to a protected computer.</p>
            <TwoCol>
              <Card title="What it criminalizes" color="red">
                <ul>
                  <li>Breaking into a computer to steal info (1030(a)(2)).</li>
                  <li>Transmitting damaging code (1030(a)(5)).</li>
                  <li>Trafficking in passwords (1030(a)(6)).</li>
                  <li>Extortion (1030(a)(7)).</li>
                </ul>
              </Card>
              <Card title="What it means for an analyst" color="blue">
                <ul>
                  <li>Explicit authorization is mandatory for every pentest engagement.</li>
                  <li>Attacker "active defense" / "hack back" is generally prohibited.</li>
                  <li>Reading honeypot data is fine, but luring an attacker into the attacker's own system ≠ allowed.</li>
                </ul>
              </Card>
            </TwoCol>
            <Callout kind="info" title="Van Buren v. United States (2021)">
              The Supreme Court narrowed "exceeds authorized access" — it doesn't reach misuse of information the employee was permitted to access. Important for insider-threat cases.
            </Callout>
          </Section>

          <Section title="ECPA — Electronic Communications Privacy Act (1986)">
            <p>Governs government access to electronic communications. Three pieces:</p>
            <TwoCol>
              <Card title="Title I — Wiretap Act (Title III)" color="red">
                Real-time <b>content</b>. Requires a "super warrant" (Title III order). High bar: probable cause + exhaustion of alternatives + minimization.
              </Card>
              <Card title="Title II — Stored Communications Act (SCA)" color="amber">
                <b>Stored content</b> (old email, cloud files). Standard varies by age: ≤180 days needs warrant; &gt;180 days historically allowed subpoena (post-<i>Carpenter</i>, most providers now require warrant).
              </Card>
              <Card title="Title III — Pen/Trap" color="blue">
                <b>Metadata</b> (dialed numbers, IPs, headers). Lower standard: court order on relevance, not probable cause.
              </Card>
            </TwoCol>
            <Callout kind="danger" title="Critical point">
              Capturing traffic on a corporate network requires consent (banner) or the "provider exception". Never assume consent — read the org's banner and signed acceptable-use.
            </Callout>
          </Section>

          <Section title="Title III — Wiretap Act (18 USC 2510 et seq.)">
            <p>The highest protection in US law. Real-time content interception = wiretap.</p>
            <ul>
              <li>Requires a <b>Title III order</b> from a federal judge.</li>
              <li>Authorization from DAG / Associate AG / AAG (DOJ).</li>
              <li>30-day max, renewable.</li>
              <li><b>Minimization</b> — stop capture for non-pertinent communications.</li>
              <li><b>Exhaustion</b> — must show other techniques have failed or are unlikely to succeed.</li>
            </ul>
            <Callout kind="info" title="Exceptions">
              <ul>
                <li><b>One-party consent</b> — if a party to the communication consents (banner = consent).</li>
                <li><b>Provider exception</b> — for the provider's own protection of its service.</li>
                <li><b>Computer trespasser</b> — with the system owner's consent, the government may capture the attacker's traffic.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="FISA — Foreign Intelligence Surveillance Act (1978)">
            <p>Parallel track to Title III, but for <b>foreign intelligence</b>, not law enforcement.</p>
            <ul>
              <li><b>FISA Court (FISC)</b> — specialized judges, classified proceedings.</li>
              <li><b>Section 702</b> — surveillance of non-US persons abroad. Controversial.</li>
              <li><b>Section 215</b> (formerly) — business-records bulk collection. Curtailed/amended post-Snowden.</li>
              <li><b>Title I FISA</b> — surveillance of "agents of foreign powers" inside the US.</li>
            </ul>
            <Callout kind="danger" title="The wall">
              FISA and Title III don't mix freely. A criminal investigator can't use FISA. An intelligence analyst can't convert intel into criminal evidence without specific legal steps. The <b>Title 50</b> (intel) vs <b>Title 18</b> (LE) split is foundational to FBI work.
            </Callout>
          </Section>

          <Section title="EO 12333 — Intelligence Community Charter">
            <p>The parent executive order for the USIC. It defines:</p>
            <ul>
              <li>Mission and authorities of each agency (CIA, NSA, DIA, FBI Intelligence Branch, etc.).</li>
              <li>Standards for collecting intel on US persons (broadly prohibited absent approved procedures).</li>
              <li>"Minimization procedures" to protect Americans' privacy.</li>
              <li>Oversight — Inspectors General, Privacy and Civil Liberties Oversight Board (PCLOB).</li>
            </ul>
            <p>Each agency has AG-approved procedures (e.g., NSA's USSID-18, CIA's AR 2-2). An analyst in FBI Cyber Division operates under DIOG (Domestic Investigations and Operations Guide).</p>
          </Section>

          <Section title="The legal-tool toolbox">
            <Code lang="text">{`Tool                What it gets                  Standard
──────────────────────────────────────────────────────────────
Subpoena            Subscriber info, basic records Reasonable
                                                  relevance
2703(d) Order       Transactional records,         Specific and
                    non-content                    articulable facts
Warrant             Stored content (email body,    Probable cause
                    files); search & seizure
Pen/Trap            Real-time metadata             Court order
                                                  (relevance)
Title III Order     Real-time content (wiretap)    Probable cause
                                                  + exhaustion +
                                                  minimization
NSL                 Subscriber info / metadata     FBI authority +
(National Security                                 nat'l security
 Letter)                                           threat
FISA Order          Foreign-intel surveillance     FISC approval`}</Code>
          </Section>

          <Section title="Supreme Court cases you must know">
            <TwoCol>
              <Card title="Carpenter v. US (2018)" color="blue">
                Cell-site location records (CSLI) require a warrant. Ended the third-party doctrine for digital location data. Ripples through much of digital evidence law.
              </Card>
              <Card title="Riley v. California (2014)" color="blue">
                Searching a phone incident to arrest needs a warrant — even of the phone itself.
              </Card>
              <Card title="US v. Jones (2012)" color="blue">
                Attaching a GPS tracker to a vehicle = search under the 4th Amendment. Important for continuous digital tracking.
              </Card>
              <Card title="Van Buren v. US (2021)" color="amber">
                Narrowed CFAA — "exceeds authorized access" doesn't capture misuse of permitted access.
              </Card>
            </TwoCol>
          </Section>

          <Section title="Information sharing — CISA 2015 and friends">
            <ul>
              <li><b>Cybersecurity Information Sharing Act (CISA 2015)</b> — provides private-sector liability protection when sharing Cyber Threat Indicators with the government via AIS (Automated Indicator Sharing).</li>
              <li><b>InfraGard</b> — FBI ↔ private-sector partnership across 16 sectors.</li>
              <li><b>JCDC</b> (Joint Cyber Defense Collaborative — CISA) — public/private operational collaboration.</li>
              <li>When in doubt about classification: <b>TLP</b> + ask OGC.</li>
            </ul>
          </Section>

          <Section title="Privacy & civil liberties — binding rules">
            <Callout kind="info" title="Pillars to respect">
              <ul>
                <li><b>Privacy Act (1974)</b> — how to store info on US persons. Rules around "system of records".</li>
                <li><b>Attorney General Guidelines</b> — boundaries between predicated investigations and assessments.</li>
                <li><b>USPER protections</b> — collection/retention of US-person info has additional rules even in intel contexts.</li>
                <li><b>Whistleblower channels</b> — IG and PCLOB. Don't bypass them.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Why OGC belongs in your daily life">
            <ul>
              <li>Before any new capture, new tool, new data-sharing arrangement.</li>
              <li>Before contacting the private sector about an incident.</li>
              <li>Before handing intel to an AUSA for criminal prosecution.</li>
              <li>When in doubt: ask, then document the question and answer. That documentation protects you.</li>
            </ul>
            <Callout kind="good" title="Practical rules">
              <ol>
                <li>Read the DIOG and your unit's SOPs.</li>
                <li>Keep your OGC and assigned AUSA contacts handy.</li>
                <li>Document predication for every investigation.</li>
                <li>Know the difference between Assessment, Preliminary Investigation, and Full Investigation.</li>
                <li>Practice minimization — collect no more than you need.</li>
                <li>Don't blend Title 50 and Title 18 work.</li>
                <li>Every decision is reviewable — record your reasoning.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="Self-study resources">
            <ul>
              <li><b>DOJ "Searching and Seizing Computers" Manual</b> — the standard reference.</li>
              <li><b>NIST SP 800-86</b> — forensic integration in IR.</li>
              <li><b>EFF Surveillance Self-Defense</b> — civil-liberties perspective.</li>
              <li><b>Lawfare blog</b> — current cyber-legal analysis.</li>
              <li><b>JustSecurity.org</b> — same.</li>
              <li><b>"The Lawyer's Cybersecurity Handbook"</b>.</li>
              <li><b>FBI DIOG (public version)</b> — the procedural framework for investigators.</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
