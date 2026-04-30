"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="compliance">
      <L
        ar={<>
          <Section title="من التهديد إلى الامتثال">
            <Analogy>قبل ما المهندس يبني بيت، بيسأل نفسه: «إيه اللي ممكن يهد البيت ده؟ زلزال؟ فيضان؟ حرامي؟» وبعدين يصمّم على الأساس ده. هذه هي فلسفة <b>Threat Modeling</b>: فكّر زي المهاجم قبل ما تكتب أول سطر كود. لو ما عملتش كدة، إنت بتبني على رمل.</Analogy>
          </Section>

          <Section title="STRIDE — أبسط نموذج تهديد">
            <p>طورته Microsoft. كل حرف = فئة تهديد:</p>
            <TwoCol>
              <Card title="S — Spoofing">انتحال هوية. الدفاع: مصادقة قوية (MFA, mTLS).</Card>
              <Card title="T — Tampering">العبث بالبيانات. الدفاع: integrity checks (HMAC, signing).</Card>
              <Card title="R — Repudiation">إنكار الفعل. الدفاع: logging موثوق + توقيع.</Card>
              <Card title="I — Information Disclosure">تسريب بيانات. الدفاع: تشفير + ACLs.</Card>
              <Card title="D — Denial of Service">إيقاف الخدمة. الدفاع: rate limiting + redundancy.</Card>
              <Card title="E — Elevation of Privilege">رفع صلاحيات. الدفاع: least privilege + separation of duties.</Card>
            </TwoCol>
          </Section>

          <Section title="منهجية الـ Threat Modeling">
            <ol>
              <li><b>ارسم النظام</b> — Data Flow Diagram (DFD) مع الـ trust boundaries.</li>
              <li><b>طبّق STRIDE</b> على كل عنصر و كل تدفق.</li>
              <li><b>قيّم الخطر</b> — DREAD أو CVSS.</li>
              <li><b>صمّم mitigations</b> لكل تهديد ذي خطر متوسط فأعلى.</li>
              <li><b>وثّق و راجع</b> دورياً (مع كل تغيير معماري).</li>
            </ol>
            <p>أدوات: <b>Microsoft Threat Modeling Tool, OWASP Threat Dragon, IriusRisk, pytm</b>.</p>
          </Section>

          <Section title="نماذج بديلة">
            <ul>
              <li><b>PASTA</b> (7 خطوات) — أعمق من STRIDE، يربط التهديد بالأعمال.</li>
              <li><b>OCTAVE</b> — يركّز على الأصول المؤسسية.</li>
              <li><b>VAST</b> — Visual, Agile, Simple Threat — يدمج DevOps.</li>
              <li><b>LINDDUN</b> — متخصص في الخصوصية (GDPR).</li>
              <li><b>Attack Trees</b> — تفصيل سيناريوهات هجوم محددة.</li>
            </ul>
          </Section>

          <Section title="NIST Cybersecurity Framework (CSF 2.0)">
            <p>إطار رسمي مرن. ست وظائف:</p>
            <ol>
              <li><b>Govern</b> — استراتيجية و سياسات و إدارة مخاطر (جديد في 2.0).</li>
              <li><b>Identify</b> — جرد الأصول و المخاطر.</li>
              <li><b>Protect</b> — إجراءات وقائية.</li>
              <li><b>Detect</b> — كشف الحوادث.</li>
              <li><b>Respond</b> — احتواء.</li>
              <li><b>Recover</b> — استعادة الخدمة و الدروس.</li>
            </ol>
            <Callout kind="info" title="نصيحة عملية">
              ابدأ بـ <b>NIST 800-53</b> (Controls Catalog) كقائمة شغّالة على الأرض، واستخدم CSF فوقه كطبقة استراتيجية.
              لو المؤسسة صغيرة: <b>CIS Controls v8</b> أبسط وعملي جداً (18 control area) — هتلاقيه يكفّيك.
            </Callout>
          </Section>

          <Section title="ISO/IEC 27001:2022 — معيار عالمي">
            <ul>
              <li><b>ISMS</b> — نظام إدارة أمن المعلومات.</li>
              <li>يتطلّب <b>Statement of Applicability</b> ضد <b>Annex A</b> (93 control).</li>
              <li>دورة <b>Plan-Do-Check-Act (PDCA)</b>.</li>
              <li>تدقيق خارجي كل 3 سنوات + مراقبة سنوية.</li>
              <li>ISO 27002:2022 يقدم guidance لتطبيق controls الـ Annex A.</li>
            </ul>
          </Section>

          <Section title="GDPR و حماية البيانات">
            <h3>المفاهيم الأساسية</h3>
            <ul>
              <li><b>Data Subject</b> — الشخص الذي تخصّه البيانات.</li>
              <li><b>Controller</b> — من يقرر الـ processing (شركتك).</li>
              <li><b>Processor</b> — من ينفّذ نيابة (مثل AWS).</li>
              <li><b>Data Protection Officer (DPO)</b> — مطلوب في حالات معينة.</li>
            </ul>
            <h3>الحقوق</h3>
            <ul>
              <li>الوصول (Article 15)، التصحيح (16)، النسيان (17)، النقل (20).</li>
              <li>الإبلاغ عن الخروقات خلال <b>72 ساعة</b> (Article 33).</li>
            </ul>
            <h3>الغرامات</h3>
            <p>حتى <b>4% من الإيرادات السنوية العالمية</b> أو 20 مليون يورو، أيهما أعلى.</p>
            <Callout kind="warn" title="تجنّب الأخطاء">
              <ul>
                <li><b>Data minimization</b>: لا تجمع ما لا تحتاج.</li>
                <li><b>Purpose limitation</b>: لا تعد استخدام البيانات لغرض جديد بدون موافقة.</li>
                <li><b>Cross-border transfers</b>: تحتاج SCCs أو Adequacy Decision.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="معايير قطاعية">
            <TwoCol>
              <Card title="PCI DSS v4.0" color="amber">المدفوعات. 12 متطلب رئيسي. تدقيق سنوي (QSA) للشركات الكبرى.</Card>
              <Card title="HIPAA" color="amber">الرعاية الصحية في الولايات المتحدة. PHI = Protected Health Information.</Card>
              <Card title="SOC 2" color="amber">للـ SaaS — Trust Services Criteria (Security, Availability, Confidentiality...).</Card>
              <Card title="FedRAMP" color="amber">للـ cloud services التي تخدم الحكومة الأمريكية.</Card>
              <Card title="NIS2 / DORA" color="amber">الاتحاد الأوروبي — البنية الحيوية و القطاع المالي.</Card>
              <Card title="السايبر السعودي (NCA)" color="amber">ECC (Essential Cybersecurity Controls) و CCC للسحابة.</Card>
            </TwoCol>
          </Section>

          <Section title="من «الورق» إلى التطبيق الفعلي">
            <ol>
              <li><b>GRC platforms</b>: Vanta, Drata, Tugboat Logic, Hyperproof — أتمتة الأدلة.</li>
              <li><b>Continuous compliance</b>: ربط الـ controls بـ telemetry حية (logs, configs).</li>
              <li><b>Policy as Code</b>: Open Policy Agent (OPA), Conftest, Cloud Custodian.</li>
              <li><b>Compliance is a floor, not a ceiling</b> — الامتثال أرضية، مش سقف. كونك Compliant ما يعنيش إنك Secure.</li>
            </ol>
          </Section>

          <Section title="مقاييس الأمن — KPIs/KRIs">
            <ul>
              <li><b>MTTD</b> (Mean Time To Detect).</li>
              <li><b>MTTR</b> (Mean Time To Respond).</li>
              <li>نسبة <b>patch SLA compliance</b>.</li>
              <li>نسبة phishing click rate vs report rate.</li>
              <li>عدد الـ critical findings المفتوحة و عمرها.</li>
              <li>تغطية الـ MFA على الحسابات الـ privileged.</li>
              <li>نتائج تمارين IR (red/purple team) كل ربع.</li>
            </ul>
            <Callout kind="good" title="القاعدة الذهبية للقياس">
              قيس اللي بيحرّك القرار. أي رقم ما بيغيّرش سلوك = ضوضاء، ارميه. الـ Dashboard المليان أرقام ما حدش بيتصرف بناءً عليها = عك.
            </Callout>
          </Section>
        </>}
        en={<>
          <Section title="From threats to compliance">
            <Analogy>Before building a house, the engineer asks: "What could destroy it? Earthquake? Flood? Burglar?" Then designs accordingly. That's <b>threat modeling</b>: think like the attacker before writing line one of code.</Analogy>
          </Section>

          <Section title="STRIDE — the simplest threat model">
            <p>Created at Microsoft. Each letter = a threat category:</p>
            <TwoCol>
              <Card title="S — Spoofing">Identity impersonation. Defense: strong auth (MFA, mTLS).</Card>
              <Card title="T — Tampering">Data tampering. Defense: integrity checks (HMAC, signing).</Card>
              <Card title="R — Repudiation">Denying an action. Defense: trustworthy logging + signing.</Card>
              <Card title="I — Information Disclosure">Data leakage. Defense: encryption + ACLs.</Card>
              <Card title="D — Denial of Service">Service interruption. Defense: rate limiting + redundancy.</Card>
              <Card title="E — Elevation of Privilege">Privilege escalation. Defense: least privilege + separation of duties.</Card>
            </TwoCol>
          </Section>

          <Section title="Threat-modeling methodology">
            <ol>
              <li><b>Diagram the system</b> — Data Flow Diagram (DFD) with trust boundaries.</li>
              <li><b>Apply STRIDE</b> to each element and each flow.</li>
              <li><b>Score the risk</b> — DREAD or CVSS.</li>
              <li><b>Design mitigations</b> for every medium-or-higher threat.</li>
              <li><b>Document and review</b> regularly (with every architectural change).</li>
            </ol>
            <p>Tools: <b>Microsoft Threat Modeling Tool, OWASP Threat Dragon, IriusRisk, pytm</b>.</p>
          </Section>

          <Section title="Alternative models">
            <ul>
              <li><b>PASTA</b> (7 stages) — deeper than STRIDE; ties threats to business.</li>
              <li><b>OCTAVE</b> — focused on enterprise assets.</li>
              <li><b>VAST</b> — Visual, Agile, Simple Threat — DevOps-friendly.</li>
              <li><b>LINDDUN</b> — privacy-specific (GDPR).</li>
              <li><b>Attack Trees</b> — to detail specific attack scenarios.</li>
            </ul>
          </Section>

          <Section title="NIST Cybersecurity Framework (CSF 2.0)">
            <p>A flexible official framework. Six functions:</p>
            <ol>
              <li><b>Govern</b> — strategy, policies, risk management (new in 2.0).</li>
              <li><b>Identify</b> — asset and risk inventory.</li>
              <li><b>Protect</b> — safeguards.</li>
              <li><b>Detect</b> — incident detection.</li>
              <li><b>Respond</b> — containment.</li>
              <li><b>Recover</b> — service restoration and lessons learned.</li>
            </ol>
            <Callout kind="info" title="Practical advice">
              Start with <b>NIST 800-53</b> (Controls Catalog) as the executable list, and use CSF as a strategic overlay.
              For smaller orgs: <b>CIS Controls v8</b> is simpler and very practical (18 control areas).
            </Callout>
          </Section>

          <Section title="ISO/IEC 27001:2022 — global standard">
            <ul>
              <li><b>ISMS</b> — Information Security Management System.</li>
              <li>Requires a <b>Statement of Applicability</b> against <b>Annex A</b> (93 controls).</li>
              <li><b>Plan-Do-Check-Act (PDCA)</b> cycle.</li>
              <li>External audit every 3 years + annual surveillance.</li>
              <li>ISO 27002:2022 provides guidance for implementing the Annex A controls.</li>
            </ul>
          </Section>

          <Section title="GDPR and data protection">
            <h3>Core concepts</h3>
            <ul>
              <li><b>Data Subject</b> — the individual the data describes.</li>
              <li><b>Controller</b> — who decides processing (your company).</li>
              <li><b>Processor</b> — who acts on the controller's behalf (e.g., AWS).</li>
              <li><b>Data Protection Officer (DPO)</b> — required in some cases.</li>
            </ul>
            <h3>Rights</h3>
            <ul>
              <li>Access (Art. 15), rectification (16), erasure (17), portability (20).</li>
              <li>Breach notification within <b>72 hours</b> (Art. 33).</li>
            </ul>
            <h3>Fines</h3>
            <p>Up to <b>4% of global annual revenue</b> or €20M, whichever is higher.</p>
            <Callout kind="warn" title="Avoid the pitfalls">
              <ul>
                <li><b>Data minimization</b>: don't collect what you don't need.</li>
                <li><b>Purpose limitation</b>: don't repurpose data without consent.</li>
                <li><b>Cross-border transfers</b>: need SCCs or an Adequacy Decision.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Sector-specific standards">
            <TwoCol>
              <Card title="PCI DSS v4.0" color="amber">Card payments. 12 core requirements. Annual QSA audit for large orgs.</Card>
              <Card title="HIPAA" color="amber">US healthcare. PHI = Protected Health Information.</Card>
              <Card title="SOC 2" color="amber">SaaS — Trust Services Criteria (Security, Availability, Confidentiality...).</Card>
              <Card title="FedRAMP" color="amber">Cloud services serving the US government.</Card>
              <Card title="NIS2 / DORA" color="amber">EU — critical infrastructure and financial sector.</Card>
              <Card title="Saudi NCA" color="amber">ECC (Essential Cybersecurity Controls) and CCC for cloud.</Card>
            </TwoCol>
          </Section>

          <Section title="From paper to practice">
            <ol>
              <li><b>GRC platforms</b>: Vanta, Drata, Tugboat Logic, Hyperproof — automate evidence collection.</li>
              <li><b>Continuous compliance</b>: tie controls to live telemetry (logs, configs).</li>
              <li><b>Policy as Code</b>: Open Policy Agent (OPA), Conftest, Cloud Custodian.</li>
              <li><b>Compliance is a floor, not a ceiling</b> — being compliant ≠ being secure.</li>
            </ol>
          </Section>

          <Section title="Security metrics — KPIs/KRIs">
            <ul>
              <li><b>MTTD</b> (Mean Time To Detect).</li>
              <li><b>MTTR</b> (Mean Time To Respond).</li>
              <li><b>Patch SLA compliance</b> rate.</li>
              <li>Phishing click rate vs report rate.</li>
              <li>Open critical findings count and age.</li>
              <li>MFA coverage on privileged accounts.</li>
              <li>Quarterly IR exercise results (red/purple team).</li>
            </ul>
            <Callout kind="good" title="Golden rule">
              Measure what changes a decision. Numbers that don't drive behavior = noise.
            </Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
