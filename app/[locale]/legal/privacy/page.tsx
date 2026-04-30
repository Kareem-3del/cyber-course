"use client";
import { L } from "@/components/LessonShell";
import { LegalShell, LSection } from "@/components/LegalShell";
import { LEGAL, ENTITY } from "@/lib/legal";

export default function PrivacyPage() {
  const doc = LEGAL.privacy;
  return (
    <LegalShell
      doc={doc}
      title={{ ar: "سياسة الخصوصية", en: "Privacy Policy" }}
      intro={{
        ar: "تشرح هذه السياسة كيف يجمع المشغّل بياناتك الشخصية، وما يفعله بها، وحقوقك بصددها بموجب اللوائح السارية بما فيها اللائحة العامة لحماية البيانات (GDPR) وقانون كاليفورنيا لخصوصية المستهلك (CCPA). نحن نطبّق مبدأ &quot;البيانات الأقل&quot;: لا نجمع إلا ما هو ضروري لتشغيل الأكاديمية.",
        en: "This Policy explains how the Operator collects your personal data, what is done with it, and the rights you have under applicable regulations — including the GDPR and the CCPA. We follow a data-minimization principle: we collect only what is necessary to operate the Academy.",
      }}
    >
      <L
        ar={<>
          <LSection n="1" title={{ ar: "المتحكم في البيانات", en: "Data Controller" }}>
            <p>المتحكم في البيانات لأغراض هذه السياسة هو {ENTITY.legalName.ar}، الكيان المسجّل في {ENTITY.jurisdiction.ar}. يمكن التواصل بشأن أي مسألة خصوصية عبر {ENTITY.privacyEmail}.</p>
          </LSection>

          <LSection n="2" title={{ ar: "البيانات التي نجمعها", en: "Data We Collect" }}>
            <p>نحرص على تقليل ما نجمعه. الفئات التي قد نتعامل معها:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li><b>بيانات تشغيلية تلقائية</b>: عنوان IP (يُجزّأ لأقرب /24)، نوع المتصفح، نظام التشغيل، اللغة، الصفحة المُحالة، الطابع الزمني للزيارة. نحتفظ بها لمدة لا تتجاوز 30 يوماً لأغراض الأمن وتشخيص الأعطال.</li>
              <li><b>بيانات التقدم التعليمي</b>: حالة إكمال الدروس واللغة المفضلة. تُخزَّن <b>محلياً في متصفحك (localStorage)</b> ولا تُرسَل إلى خوادمنا. أنت تتحكم فيها بالكامل ويمكنك حذفها بزرّ &quot;إعادة الضبط&quot; داخل الأكاديمية.</li>
              <li><b>بيانات الاتصال الطوعية</b>: إذا راسلتنا عبر البريد، نحفظ رسالتك وعنوانك للرد.</li>
              <li><b>بيانات الإبلاغ عن الثغرات</b>: عند تقديم تقرير عن ثغرة، قد نطلب معرّف اتصال إضافي للمتابعة.</li>
            </ul>
            <p className="mt-2">لا نجمع: بيانات بطاقات بنكية (الأكاديمية مجانية)، أرقام هواتف، تتبّعاً عبر المواقع، أو بيانات بيومترية.</p>
          </LSection>

          <LSection n="3" title={{ ar: "الأساس القانوني للمعالجة", en: "Lawful Bases for Processing" }}>
            <p>نعتمد على الأسس التالية بموجب المادة 6 من GDPR:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li><b>المصلحة المشروعة</b> (Article 6(1)(f)) — لتأمين البنية التحتية وتشخيص الأعطال.</li>
              <li><b>تنفيذ العقد</b> (Article 6(1)(b)) — لتقديم خدمة الأكاديمية.</li>
              <li><b>الموافقة</b> (Article 6(1)(a)) — حيثما طُلبت موافقة صريحة (مثل الاشتراك في تنبيهات البريد المستقبلية إن وُجدت).</li>
              <li><b>الالتزام القانوني</b> (Article 6(1)(c)) — للاستجابة لطلبات إنفاذ القانون السارية.</li>
            </ul>
          </LSection>

          <LSection n="4" title={{ ar: "كيف نستخدم البيانات", en: "How We Use the Data" }}>
            <ul className="list-disc ps-6 space-y-1">
              <li>تشغيل الأكاديمية وعرض المحتوى بلغتك المفضلة.</li>
              <li>اكتشاف الإساءة والاحتيال وحماية المستخدمين الآخرين.</li>
              <li>تحسين المحتوى عبر تحليلات إجمالية مجهولة الهوية.</li>
              <li>الرد على استفساراتك أو طلبات حقوقك.</li>
              <li>الامتثال للالتزامات القانونية.</li>
            </ul>
          </LSection>

          <LSection n="5" title={{ ar: "ملفات تعريف الارتباط والتخزين المحلي", en: "Cookies & Local Storage" }}>
            <p>لا نستخدم ملفات تعريف ارتباط لأغراض إعلانية أو تتبّع عبر المواقع. ما قد نستخدمه:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li><b>ضرورية</b>: تخزين اللغة المختارة والتفضيلات الأساسية في localStorage. لا تُرسَل لأي خادم.</li>
              <li><b>تشغيلية</b>: قد يحفظ مزوّد الاستضافة (مثل Vercel) ملف ارتباط لموازنة الأحمال. لا نتحكم في محتواه ولا يحوي معلومات شخصية.</li>
            </ul>
            <p>يمكنك حذف هذه البيانات في أي وقت من إعدادات متصفحك.</p>
          </LSection>

          <LSection n="6" title={{ ar: "أطراف ثالثة", en: "Third Parties" }}>
            <p>قد نستخدم مقدّمي الخدمات التاليين، كل منهم ملزَم تعاقدياً بمعايير حماية بيانات لا تقلّ عن GDPR:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li><b>مزوّد الاستضافة</b> (مثل Vercel أو Cloudflare) — لتشغيل الموقع وحمايته من DDoS.</li>
              <li><b>مزوّد الخطوط</b> (Google Fonts) — قد يجمع IP لتقديم الخطوط؛ يخضع لسياسة خصوصية Google.</li>
            </ul>
            <p>لا نبيع بياناتك. لا نشاركها لأغراض تسويقية. لن نحوّلها لأي طرف إلا بأمر قضائي ساري أو لمنع ضرر وشيك.</p>
          </LSection>

          <LSection n="7" title={{ ar: "حقوقك", en: "Your Rights" }}>
            <p>بموجب GDPR، CCPA، وتشريعات مماثلة، تتمتع بالحقوق التالية:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li><b>الوصول</b> — الحصول على نسخة من بياناتك التي بحوزتنا.</li>
              <li><b>التصحيح</b> — تصحيح أي بيانات غير دقيقة.</li>
              <li><b>الحذف (&quot;الحق في النسيان&quot;)</b> — طلب حذف بياناتك حيثما كان ذلك ممكناً قانونياً.</li>
              <li><b>تقييد المعالجة</b> — طلب وقف معالجة معيّنة.</li>
              <li><b>قابلية النقل</b> — استلام بياناتك بصيغة منظّمة.</li>
              <li><b>الاعتراض</b> — على معالجة قائمة على المصلحة المشروعة.</li>
              <li><b>سحب الموافقة</b> — في أي وقت دون أثر رجعي.</li>
              <li><b>تقديم شكوى</b> لدى سلطة حماية البيانات في بلدك.</li>
            </ul>
            <p>لممارسة هذه الحقوق، راسل {ENTITY.privacyEmail}. سنرد خلال 30 يوماً كحدّ أقصى.</p>
          </LSection>

          <LSection n="8" title={{ ar: "أمن البيانات", en: "Data Security" }}>
            <p>نطبّق ضوابط تقنية وتنظيمية مناسبة، تشمل: TLS 1.3 لكل النقل، تشفير القرص للبيانات الساكنة، مبدأ الحدّ الأدنى للصلاحيات للموظفين، وسجلات تدقيق. ومع ذلك لا توجد طريقة تخزين أو نقل آمنة 100%.</p>
            <p>عند اكتشاف خرق بيانات، نُبلّغ السلطات المختصة والمستخدمين المتأثرين خلال 72 ساعة كما تشترط GDPR.</p>
          </LSection>

          <LSection n="9" title={{ ar: "نقل البيانات الدولي", en: "International Data Transfers" }}>
            <p>قد تُعالج بياناتك خارج بلد إقامتك، بما في ذلك في الولايات المتحدة. عند نقل بيانات من المنطقة الاقتصادية الأوروبية، نعتمد على البنود التعاقدية القياسية (SCCs) للمفوضية الأوروبية أو على آليات نقل أخرى مُعتمدة.</p>
          </LSection>

          <LSection n="10" title={{ ar: "خصوصية الأطفال", en: "Children's Privacy" }}>
            <p>الأكاديمية ليست موجّهة للأطفال دون السن المحدد في &quot;الأهلية&quot; (18 سنة أو سن الرشد). لا نجمع عمداً بيانات من أشخاص تحت هذا السن. إذا اكتشفنا ذلك، نحذف البيانات فوراً. الآباء/الأوصياء الذين يعتقدون أن طفلهم قدّم بيانات يمكنهم مراسلتنا للحذف.</p>
          </LSection>

          <LSection n="11" title={{ ar: "مدد الاحتفاظ", en: "Retention Periods" }}>
            <ul className="list-disc ps-6 space-y-1">
              <li>سجلات الخوادم: حتى 30 يوماً.</li>
              <li>مراسلات الدعم: حتى 24 شهراً بعد آخر تواصل.</li>
              <li>تقارير الثغرات: حتى الإصلاح + 12 شهراً للتدقيق.</li>
              <li>بيانات localStorage: تخضع لسيطرتك بالكامل.</li>
            </ul>
          </LSection>

          <LSection n="12" title={{ ar: "&quot;لا تتبّعوني&quot; وإشارات GPC", en: "Do-Not-Track & GPC Signals" }}>
            <p>نحترم إشارة Global Privacy Control (GPC). عند تفعيلها، نتعامل معها كطلب لعدم بيع/مشاركة البيانات وفق CCPA. حالياً لا نبيع البيانات أصلاً، لكن GPC يُسجَّل في سجلاتنا للالتزام المستقبلي.</p>
          </LSection>

          <LSection n="13" title={{ ar: "تحديث هذه السياسة", en: "Updates to This Policy" }}>
            <p>قد نُحدِّث هذه السياسة من حين لآخر. عند تغيير جوهري — كإضافة أطراف ثالثة جديدة، أو تغيير في أسس المعالجة، أو توسيع لأنواع البيانات المجمَّعة — سننشر الإصدار الجديد في الأكاديمية ونعرض إشعاراً ظاهراً قبل {doc.noticePeriodDays} يوماً على الأقل من تاريخ السريان. الإصدار الحالي ورقمه وتاريخه مذكوران أعلى هذه الصفحة، وسجل التحديثات الكامل في &quot;سجل التحديثات&quot; أدناه.</p>
          </LSection>

          <LSection n="14" title={{ ar: "كيف تتواصل معنا", en: "How to Contact Us" }}>
            <p>لأي طلب يخص بياناتك أو لتقديم شكوى:</p>
            <ul className="list-disc ps-6 space-y-1 eng">
              <li>{ENTITY.privacyEmail}</li>
              <li>{ENTITY.legalName.ar}</li>
              <li>{ENTITY.website}</li>
            </ul>
            <p>يمكنك أيضاً تقديم شكوى إلى سلطة حماية البيانات في بلدك إذا كنت غير راضٍ عن طريقة معالجتنا.</p>
          </LSection>
        </>}

        en={<>
          <LSection n="1" title={{ ar: "المتحكم في البيانات", en: "Data Controller" }}>
            <p>The data controller for the purposes of this Policy is {ENTITY.legalName.en}, registered in {ENTITY.jurisdiction.en}. Privacy inquiries: {ENTITY.privacyEmail}.</p>
          </LSection>

          <LSection n="2" title={{ ar: "البيانات التي نجمعها", en: "Data We Collect" }}>
            <p>We minimize what we collect. Categories that may be processed:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li><b>Automatic operational data</b>: IP address (truncated to /24), browser type, OS, language, referring page, request timestamp. Retained for no more than 30 days for security and debugging.</li>
              <li><b>Educational progress</b>: lesson completion status and language preference. Stored <b>locally in your browser (localStorage)</b>; not sent to our servers. You control it fully and can clear it via the &quot;Reset&quot; button in the Academy.</li>
              <li><b>Voluntary contact data</b>: if you email us, we keep your message and address to respond.</li>
              <li><b>Vulnerability reports</b>: we may request a contact handle to follow up on a security report.</li>
            </ul>
            <p className="mt-2">We do not collect: payment-card data (the Academy is free), phone numbers, cross-site tracking, or biometric data.</p>
          </LSection>

          <LSection n="3" title={{ ar: "الأساس القانوني للمعالجة", en: "Lawful Bases for Processing" }}>
            <p>We rely on the following bases under Article 6 GDPR:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li><b>Legitimate interest</b> (Article 6(1)(f)) — securing infrastructure and debugging.</li>
              <li><b>Performance of a contract</b> (Article 6(1)(b)) — providing the Academy service.</li>
              <li><b>Consent</b> (Article 6(1)(a)) — where explicit consent is requested (e.g. opt-in to future email notices, if any).</li>
              <li><b>Legal obligation</b> (Article 6(1)(c)) — to respond to lawful law-enforcement requests.</li>
            </ul>
          </LSection>

          <LSection n="4" title={{ ar: "كيف نستخدم البيانات", en: "How We Use the Data" }}>
            <ul className="list-disc ps-6 space-y-1">
              <li>Operating the Academy and serving content in your preferred language.</li>
              <li>Detecting abuse or fraud and protecting other users.</li>
              <li>Improving content via aggregate, anonymized analytics.</li>
              <li>Responding to your inquiries or rights requests.</li>
              <li>Complying with legal obligations.</li>
            </ul>
          </LSection>

          <LSection n="5" title={{ ar: "ملفات تعريف الارتباط والتخزين المحلي", en: "Cookies & Local Storage" }}>
            <p>We do not use cookies for advertising or cross-site tracking. What we may use:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li><b>Strictly necessary</b>: storing language and basic preferences in localStorage. Never sent to any server.</li>
              <li><b>Operational</b>: our hosting provider (e.g. Vercel) may set a load-balancing cookie. We do not control its content; it does not contain personal data.</li>
            </ul>
            <p>You may delete this data at any time from your browser settings.</p>
          </LSection>

          <LSection n="6" title={{ ar: "أطراف ثالثة", en: "Third Parties" }}>
            <p>We may use the following service providers, each contractually bound to data-protection standards no lower than the GDPR&apos;s:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li><b>Hosting provider</b> (e.g. Vercel or Cloudflare) — to serve and DDoS-protect the site.</li>
              <li><b>Font provider</b> (Google Fonts) — may collect IP to serve fonts; subject to Google&apos;s privacy policy.</li>
            </ul>
            <p>We do not sell your data. We do not share it for marketing purposes. We will not transfer it to any party except under a valid court order or to prevent imminent harm.</p>
          </LSection>

          <LSection n="7" title={{ ar: "حقوقك", en: "Your Rights" }}>
            <p>Under the GDPR, CCPA, and similar laws, you have the following rights:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li><b>Access</b> — obtain a copy of the data we hold about you.</li>
              <li><b>Rectification</b> — correct inaccurate data.</li>
              <li><b>Erasure (&quot;right to be forgotten&quot;)</b> — request deletion where legally possible.</li>
              <li><b>Restriction of processing</b> — pause specific processing.</li>
              <li><b>Portability</b> — receive your data in a structured format.</li>
              <li><b>Objection</b> — to processing based on legitimate interest.</li>
              <li><b>Withdraw consent</b> — at any time, without retroactive effect.</li>
              <li><b>Lodge a complaint</b> with your national data-protection authority.</li>
            </ul>
            <p>To exercise these rights, email {ENTITY.privacyEmail}. We respond within 30 days at most.</p>
          </LSection>

          <LSection n="8" title={{ ar: "أمن البيانات", en: "Data Security" }}>
            <p>We apply appropriate technical and organizational controls, including: TLS 1.3 for all transport, disk encryption at rest, least-privilege access for staff, and audit logs. No method of storage or transmission, however, is 100% secure.</p>
            <p>If we detect a data breach, we notify the competent authorities and affected users within 72 hours as required by the GDPR.</p>
          </LSection>

          <LSection n="9" title={{ ar: "نقل البيانات الدولي", en: "International Data Transfers" }}>
            <p>Your data may be processed outside your country of residence, including in the United States. For transfers from the European Economic Area we rely on the European Commission&apos;s Standard Contractual Clauses (SCCs) or other approved transfer mechanisms.</p>
          </LSection>

          <LSection n="10" title={{ ar: "خصوصية الأطفال", en: "Children's Privacy" }}>
            <p>The Academy is not directed at children under the age set in the Eligibility section (18 or local age of majority). We do not knowingly collect data from anyone below that age. If we discover that we have, we delete the data promptly. A parent or guardian who believes their child has provided data may email us for deletion.</p>
          </LSection>

          <LSection n="11" title={{ ar: "مدد الاحتفاظ", en: "Retention Periods" }}>
            <ul className="list-disc ps-6 space-y-1">
              <li>Server logs: up to 30 days.</li>
              <li>Support correspondence: up to 24 months after last contact.</li>
              <li>Vulnerability reports: until fixed plus 12 months for audit.</li>
              <li>localStorage data: fully under your control.</li>
            </ul>
          </LSection>

          <LSection n="12" title={{ ar: "&quot;لا تتبّعوني&quot; وإشارات GPC", en: "Do-Not-Track & GPC Signals" }}>
            <p>We honor the Global Privacy Control (GPC) signal. When set, we treat it as a request not to sell or share data under the CCPA. We do not currently sell data; GPC is logged for forward-looking compliance.</p>
          </LSection>

          <LSection n="13" title={{ ar: "تحديث هذه السياسة", en: "Updates to This Policy" }}>
            <p>We may update this Policy from time to time. For a material change — such as adding new third parties, changing legal bases, or expanding the categories of data collected — the new version will be published in the Academy with a prominent notice at least {doc.noticePeriodDays} days before the effective date. The current version, its number, and date appear at the top of this page; the full update history appears in the Changelog below.</p>
          </LSection>

          <LSection n="14" title={{ ar: "كيف تتواصل معنا", en: "How to Contact Us" }}>
            <p>For any data request or complaint:</p>
            <ul className="list-disc ps-6 space-y-1 eng">
              <li>{ENTITY.privacyEmail}</li>
              <li>{ENTITY.legalName.en}</li>
              <li>{ENTITY.website}</li>
            </ul>
            <p>You may also lodge a complaint with the data-protection authority in your country if you are dissatisfied with how we handle your data.</p>
          </LSection>
        </>}
      />
    </LegalShell>
  );
}
