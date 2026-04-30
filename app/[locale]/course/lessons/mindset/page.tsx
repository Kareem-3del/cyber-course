"use client";
import { LessonShell, Section, Callout, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="mindset">
      <L
        ar={<>
          <Section title="إيه اللي بيفرّق الـ Hacker الحقيقي عن غيره؟">
            <p>قبل ما نتعلّم أي أداة، لازم تفهم إن الاختراق مش "كتابة أوامر"، ده <b>طريقة تفكير</b>. الـ Hacker المحترف ما بيدوّرش على باب يفتحه، ده بيدرس البيت كله — الشبابيك، ماسورة الغاز، عامل النضافة، ساعي البريد — لحد ما يلاقي السكة اللي عليها أقل حراسة.</p>
            <Analogy>تخيّل عندك خزنة كبيرة في البيت. الحرامي الذكي مش بيحاول يكسر الباب الحديد، ده بيدوّر: تركت المفتاح تحت السجادة؟ ابن الجيران عارف الرقم؟ الشباك الخلفي مفتوح؟ <b>سطح الهجوم الأكبر = فرصة النجاح الأكبر</b>.</Analogy>
          </Section>

          <Section title="أنواع القبعات (Hats)">
            <TwoCol>
              <Card title="🟥 Red Hat / Black Hat" color="red">مهاجمون. الأسود يهاجم لأهداف إجرامية أو سياسية، و الأحمر مهاجم عدواني يلاحق المهاجمين الآخرين بأساليب هجومية.</Card>
              <Card title="🟦 White Hat / Blue Team" color="blue">مدافعون و مختبرو اختراق بإذن قانوني. هدفهم اكتشاف الثغرات قبل الأشرار، و بناء طبقات الدفاع، و الاستجابة للحوادث.</Card>
              <Card title="🟨 Gray Hat" color="amber">بين الاثنين — يكتشف ثغرات بدون إذن لكنه يبلّغ عنها. قانونياً يبقى عمله مخالفاً في معظم الدول.</Card>
              <Card title="🟩 Purple Team" color="green">دمج الفريقين في تمارين مشتركة لتحسين الدفاع بناءً على هجوم حقيقي محاكى.</Card>
            </TwoCol>
          </Section>

          <Section title="سلسلة الهجوم — Cyber Kill Chain">
            <p>طوّرت Lockheed Martin هذا النموذج لوصف مراحل أي هجوم متقدم (APT):</p>
            <ol>
              <li><b>الاستطلاع</b> — Reconnaissance — جمع كل ما يخص الهدف.</li>
              <li><b>التسليح</b> — Weaponization — إعداد البرمجية الخبيثة.</li>
              <li><b>التوصيل</b> — Delivery — إيصالها (بريد، USB، رابط).</li>
              <li><b>الاستغلال</b> — Exploitation — تشغيل الثغرة.</li>
              <li><b>التثبيت</b> — Installation — تثبيت باب خلفي.</li>
              <li><b>القيادة و التحكم</b> — C2 — قناة بين المهاجم و الجهاز.</li>
              <li><b>الفعل على الهدف</b> — Actions on Objectives — سرقة، تشفير، تخريب.</li>
            </ol>
            <Callout kind="info" title="السلسلة دي مهمة ليه؟">علشان كسر أي حلقة فيها = الهجوم كله طار. الدفاع الذكي بيحط طبقة في كل مرحلة، مش بس على الباب الأول.</Callout>
          </Section>

          <Section title="MITRE ATT&CK — اللغة المشتركة">
            <p>MITRE ATT&amp;CK هو موسوعة عملية لكل Tactics, Techniques & Procedures (TTPs) المشاهدة في الواقع. يستخدمه فريق الهجوم لتخطيط، و فريق الدفاع لكشف.</p>
            <ul>
              <li><b>Tactic</b> = الهدف (مثلاً Persistence).</li>
              <li><b>Technique</b> = الأسلوب (مثلاً Scheduled Task / cron).</li>
              <li><b>Procedure</b> = التطبيق الفعلي لمجموعة معينة (APT29).</li>
            </ul>
          </Section>

          <Section title="بناء معمل التدريب — Lab Setup">
            <p>لا تُجرّب أي شيء إلا في بيئة معزولة. الإعداد الموصى به:</p>
            <Step n={1} title="نظام المهاجم">Kali Linux أو Parrot OS داخل VirtualBox / VMware على شبكة Host-Only.</Step>
            <Step n={2} title="أنظمة الضحية">Metasploitable 2/3، DVWA، OWASP Juice Shop، VulnHub، و سيرفر Ubuntu نظيف للتجارب الخاصة.</Step>
            <Step n={3} title="بيئة سحابية معزولة">حساب AWS منفصل عن الإنتاج للتدرّب على CloudGoat و flaws.cloud.</Step>
            <Step n={4} title="مخابر مجانية على الإنترنت">HackTheBox، TryHackMe، RangeForce، PortSwigger Web Academy.</Step>
            <Terminal lines={[
              { p: "sudo apt install -y nmap nuclei ffuf gobuster sqlmap" },
              { p: "docker run -d -p 80:80 vulnerables/web-dvwa" },
              { o: "DVWA up on http://127.0.0.1 — login: admin/password" },
            ]} />
          </Section>

          <Section title="الأخلاقيات و القانون">
            <Callout kind="danger" title="القاعدة الذهبية — مفيش استثناء">ما تختبرش هدف ما تملكش عليه <b>إذن مكتوب</b>. اختراق نظام من غير تفويض جريمة في كل الدول، والعقوبة بتوصل لسنين سجن. اللي مش معاه ورق، ما يلمسش.</Callout>
            <ul>
              <li>كل اختبار اختراق يبدأ بـ Rules of Engagement (RoE).</li>
              <li>وثيقة Scope تحدد بالضبط ما يُختبر و ما يُستثنى.</li>
              <li>كل أداة و كل فعل يُسجّل في Engagement Log.</li>
            </ul>
          </Section>
        </>}
        en={<>
          <Section title="What separates a real Hacker from everyone else?">
            <p>Before learning any tool, understand that hacking isn't "typing commands" — it's a <b>way of thinking</b>. A professional hacker doesn't look for a door to open; they study the entire house — windows, gas line, the cleaner, the mailman — until they find the path with the least guard.</p>
            <Analogy>Imagine you have a heavy safe at home. A clever thief doesn't try to break the steel door. They check: did you leave a key under the mat? Does the neighbor's kid know the PIN? Is the back window unlocked? <b>Wider attack surface = bigger chance of success</b>.</Analogy>
          </Section>

          <Section title="Types of Hats">
            <TwoCol>
              <Card title="🟥 Red Hat / Black Hat" color="red">Attackers. Black hats target for criminal or political ends; red hats are aggressive operators who hunt other attackers offensively.</Card>
              <Card title="🟦 White Hat / Blue Team" color="blue">Defenders and authorized pentesters. They find vulnerabilities before the bad guys, build defenses, and respond to incidents.</Card>
              <Card title="🟨 Gray Hat" color="amber">Between the two — finds vulnerabilities without permission but discloses them. Still illegal in most jurisdictions.</Card>
              <Card title="🟩 Purple Team" color="green">Both teams collaborating in joint exercises to improve defense based on simulated real-world attacks.</Card>
            </TwoCol>
          </Section>

          <Section title="Cyber Kill Chain">
            <p>Lockheed Martin developed this model to describe the phases of any advanced (APT) intrusion:</p>
            <ol>
              <li><b>Reconnaissance</b> — gathering everything about the target.</li>
              <li><b>Weaponization</b> — preparing the malicious payload.</li>
              <li><b>Delivery</b> — getting it to the target (email, USB, link).</li>
              <li><b>Exploitation</b> — triggering the vulnerability.</li>
              <li><b>Installation</b> — planting a backdoor.</li>
              <li><b>Command &amp; Control (C2)</b> — channel between attacker and host.</li>
              <li><b>Actions on Objectives</b> — theft, encryption, sabotage.</li>
            </ol>
            <Callout kind="info" title="Why does this chain matter?">Because breaking any single link = the entire attack fails. Smart defense puts a layer at every phase.</Callout>
          </Section>

          <Section title="MITRE ATT&CK — the shared language">
            <p>MITRE ATT&amp;CK is a practical encyclopedia of every Tactic, Technique &amp; Procedure (TTP) observed in the wild. Red teams use it for planning, blue teams for detection.</p>
            <ul>
              <li><b>Tactic</b> = the goal (e.g., Persistence).</li>
              <li><b>Technique</b> = the method (e.g., Scheduled Task / cron).</li>
              <li><b>Procedure</b> = a specific group's implementation (e.g., APT29).</li>
            </ul>
          </Section>

          <Section title="Building your training lab">
            <p>Never test anything outside an isolated environment. Recommended setup:</p>
            <Step n={1} title="Attacker box">Kali Linux or Parrot OS in VirtualBox / VMware on a Host-Only network.</Step>
            <Step n={2} title="Victim systems">Metasploitable 2/3, DVWA, OWASP Juice Shop, VulnHub, and a clean Ubuntu server for custom experiments.</Step>
            <Step n={3} title="Isolated cloud environment">Separate AWS account (not production) for CloudGoat and flaws.cloud practice.</Step>
            <Step n={4} title="Free online ranges">HackTheBox, TryHackMe, RangeForce, PortSwigger Web Academy.</Step>
            <Terminal lines={[
              { p: "sudo apt install -y nmap nuclei ffuf gobuster sqlmap" },
              { p: "docker run -d -p 80:80 vulnerables/web-dvwa" },
              { o: "DVWA up on http://127.0.0.1 — login: admin/password" },
            ]} />
          </Section>

          <Section title="Ethics and the law">
            <Callout kind="danger" title="The golden rule">Never test a target you don't have <b>written authorization</b> for. Unauthorized intrusion is a crime in every country and penalties reach years of prison.</Callout>
            <ul>
              <li>Every engagement starts with Rules of Engagement (RoE).</li>
              <li>A Scope document specifies exactly what's in and what's out.</li>
              <li>Every tool and action is recorded in an Engagement Log.</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
