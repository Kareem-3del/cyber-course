"use client";
import { L } from "@/components/LessonShell";
import { LegalShell, LSection, LDef } from "@/components/LegalShell";
import { LEGAL, ENTITY } from "@/lib/legal";

export default function TermsPage() {
  const doc = LEGAL.terms;
  return (
    <LegalShell
      doc={doc}
      title={{ ar: "شروط الاستخدام", en: "Terms of Service" }}
      intro={{
        ar: "تحدّد هذه الشروط القواعد القانونية الملزِمة لوصولك إلى الأكاديمية واستخدامك لموادها. يُعدّ استخدامك للأكاديمية قبولاً صريحاً وتاماً لهذه الشروط. إن لم توافق على أي بند منها، يلزمك التوقف فوراً عن الاستخدام.",
        en: "These Terms set out the binding legal rules for your access to and use of the Academy and its materials. Your use of the Academy constitutes an express and complete acceptance of these Terms. If you do not agree to any provision, you must immediately stop using the Academy.",
      }}
    >
      <L
        ar={<>
          <LSection n="1" title={{ ar: "تعريفات", en: "Definitions" }}>
            <LDef term={{ ar: "&quot;الأكاديمية&quot;", en: "&quot;Academy&quot;" }}>
              تشير إلى منصة المحتوى التعليمي المنشورة على {ENTITY.website}، بما في ذلك جميع الدروس والأكواد والوثائق والأدوات المرجعية المرتبطة بها.
            </LDef>
            <LDef term={{ ar: "&quot;المشغّل&quot;", en: "&quot;Operator&quot;" }}>
              يشير إلى {ENTITY.legalName.ar}، الكيان القانوني الذي يقدّم الأكاديمية ويتحمل التزاماتها بموجب هذه الشروط.
            </LDef>
            <LDef term={{ ar: "&quot;المستخدم&quot;", en: "&quot;User&quot;" }}>
              يشير إلى أي شخص طبيعي أو اعتباري يصل إلى الأكاديمية أو يستخدم محتواها بأي وسيلة.
            </LDef>
            <LDef term={{ ar: "&quot;المحتوى&quot;", en: "&quot;Content&quot;" }}>
              يشمل النصوص والصور والشيفرات البرمجية والوثائق والأمثلة العملية وأي مادة أخرى منشورة في الأكاديمية.
            </LDef>
            <LDef term={{ ar: "&quot;الاختبار المُصرّح به&quot;", en: "&quot;Authorized Testing&quot;" }}>
              يقصد به تنفيذ تقنيات الأمن السيبراني <b>فقط</b> على أنظمة يمتلكها المستخدم، أو ضمن نطاق عقد اختبار اختراق موقّع، أو ضمن برنامج Bug Bounty صريح، أو بموجب تفويض حكومي مكتوب وفقاً للقوانين السارية.
            </LDef>
          </LSection>

          <LSection n="2" title={{ ar: "قبول الشروط", en: "Acceptance of Terms" }}>
            <p>بمجرد دخولك إلى الأكاديمية أو استخدامك لأي جزء من المحتوى، فإنك تُقرّ بأنك قرأت هذه الشروط وفهمتها ووافقت على الالتزام بها قانونياً. إذا كنت تستخدم الأكاديمية نيابة عن جهة اعتبارية، فإنك تُقرّ بأنك مفوّض قانونياً لإلزام تلك الجهة.</p>
          </LSection>

          <LSection n="3" title={{ ar: "الأهلية", en: "Eligibility" }}>
            <p>يُسمح باستخدام الأكاديمية فقط للأشخاص الذين تنطبق عليهم جميع الشروط الآتية:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li>بلغوا الثامنة عشرة (18) من العمر، أو سن الرشد القانوني في ولايتهم القضائية، أيهما أكبر.</li>
              <li>يملكون الأهلية القانونية الكاملة للدخول في عقد ملزم.</li>
              <li>لا تخضع منطقتهم الجغرافية لعقوبات أو حظر يحول دون الوصول إلى محتوى أمن سيبراني.</li>
              <li>يستخدمون المحتوى لأغراض تعليمية أو لاختبار مُصرّح به فقط.</li>
            </ul>
          </LSection>

          <LSection n="4" title={{ ar: "طبيعة المحتوى — تعليمي بحت", en: "Nature of Content — Strictly Educational" }}>
            <p>الأكاديمية مخصصة للتدريب والتعليم في مجال الأمن السيبراني الدفاعي والهجومي المُصرّح به. كل التقنيات والأدوات والأمثلة الواردة فيها تُقدَّم لأغراض الفهم والمحاكاة في بيئات معزولة. <b>لا شيء فيها يُعتبر تحريضاً أو دعماً لأي نشاط غير قانوني، ولا توصية بمهاجمة أي نظام لا يملك المستخدم تفويضاً صريحاً للوصول إليه.</b></p>
          </LSection>

          <LSection n="5" title={{ ar: "الترخيص الممنوح", en: "License Granted" }}>
            <p>يمنح المشغّل المستخدم ترخيصاً غير حصري، غير قابل للتحويل، قابلاً للإلغاء، محدوداً بالأغراض التعليمية الشخصية أو المهنية المُصرّح بها، للوصول إلى المحتوى وعرضه. لا يجوز:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li>إعادة بيع المحتوى أو إعادة نشره مقابل مقابل مالي.</li>
              <li>إزالة إشعارات حقوق الملكية الفكرية أو إخلاءات المسؤولية.</li>
              <li>استخدام المحتوى لتدريب نماذج الذكاء الاصطناعي بشكل تجاري دون إذن مكتوب مسبق.</li>
              <li>إنشاء مشتقّات تجارية تُنافس الأكاديمية مباشرةً.</li>
            </ul>
          </LSection>

          <LSection n="6" title={{ ar: "القيود — الاستخدام المحظور", en: "Restrictions — Prohibited Use" }}>
            <p>يُحظر على المستخدم، حظراً تاماً، استخدام المحتوى أو أي جزء منه في:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li>اختبار أو مهاجمة أي نظام دون تفويض مكتوب صريح من مالكه.</li>
              <li>أي نشاط يُعدّ جريمة بموجب قانون الاحتيال وإساءة استخدام الحاسوب الأمريكي (CFAA, 18 U.S.C. § 1030)، أو أي قانون مماثل في الولاية القضائية للمستخدم.</li>
              <li>تطوير أو نشر برامج فدية، برامج خبيثة دائرة في البرّية، أو أدوات هجوم جاهزة للاستخدام ضد أهداف غير مُصرّح بها.</li>
              <li>انتهاك حقوق الخصوصية، أو سرقة بيانات شخصية، أو استهداف الأطفال.</li>
              <li>استخدام المحتوى لخدمة أنشطة إرهابية أو لجهات مدرجة في قوائم العقوبات الدولية.</li>
              <li>تجاوز أنظمة التحكم في الوصول للأكاديمية أو محاولة استخراج الكود المصدري لأغراض غير مرخّصة.</li>
            </ul>
            <p>يُقرّ المستخدم بأن أي مخالفة لهذا البند قد تُعرّضه للمسؤولية الجنائية والمدنية الكاملة، ويوافق على أن المشغّل يحق له التعاون مع جهات إنفاذ القانون.</p>
          </LSection>

          <LSection n="7" title={{ ar: "مسؤوليات المستخدم", en: "User Responsibilities" }}>
            <p>يُقرّ المستخدم ويتعهد بما يلي:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li>الالتزام بجميع القوانين السارية في ولايته القضائية وفي الولايات القضائية للأنظمة التي يتفاعل معها.</li>
              <li>الحصول على تفويض مكتوب قبل أي اختبار اختراق على نظام لا يملكه.</li>
              <li>عدم نشر بيانات اعتماد، مفاتيح، أو أسرار أنظمة سواء كانت داخل المختبر أو خارجه دون إذن.</li>
              <li>إبلاغ المشغّل فوراً عن أي ثغرة أمنية يكتشفها في الأكاديمية نفسها عبر {ENTITY.contactEmail}.</li>
              <li>تحمّل المسؤولية الكاملة عن جميع الإجراءات التي تتم باستخدام حسابه أو من جهازه.</li>
            </ul>
          </LSection>

          <LSection n="8" title={{ ar: "الملكية الفكرية", en: "Intellectual Property" }}>
            <p>جميع حقوق الملكية الفكرية في الأكاديمية، بما في ذلك على سبيل المثال لا الحصر النصوص، الشيفرات، الشعارات، التصميم، البنية، والوثائق، تعود للمشغّل أو لمرخّصيه ومحمية بموجب قوانين حقوق المؤلف والعلامات التجارية الدولية. لا يمنح هذا الترخيص المستخدم أي حقوق ملكية، بل حق الوصول والاستخدام فقط ضمن الحدود المُبيّنة في القسم 5.</p>
          </LSection>

          <LSection n="9" title={{ ar: "محتوى المستخدم وسلوكه", en: "User Content & Conduct" }}>
            <p>إذا قدّم المستخدم تعليقات، اقتراحات، أو إسهامات تقنية للأكاديمية، فإنه يمنح المشغّل ترخيصاً عالمياً، مجانياً، دائماً، غير حصري، قابلاً للتنازل، لاستخدام تلك المساهمات لتطوير الأكاديمية. يضمن المستخدم أن تلك المساهمات لا تنتهك أي حق للغير.</p>
          </LSection>

          <LSection n="10" title={{ ar: "إخلاء الضمانات", en: "Disclaimer of Warranties" }}>
            <p className="font-bold uppercase tracking-wide">يُقدَّم المحتوى &quot;كما هو&quot; و&quot;بحسب توافره&quot; دون أي ضمان من أي نوع، صريح أو ضمني.</p>
            <p>لا يضمن المشغّل دقة المحتوى أو خلوّه من الأخطاء أو ملاءمته لغرض معيّن. تُعدّ الإشارات إلى ثغرات CVE وتقنيات معروفة معلومات تاريخية للتدريب، وقد لا تعكس الواقع الراهن لأي منتج. لا يقدّم المشغّل ضماناً بأن استخدام المحتوى سيؤدي إلى نتائج محددة في أي اختبار أو شهادة.</p>
          </LSection>

          <LSection n="11" title={{ ar: "تحديد المسؤولية", en: "Limitation of Liability" }}>
            <p>إلى أقصى حد يسمح به القانون الواجب التطبيق، لن يكون المشغّل مسؤولاً عن أي أضرار غير مباشرة، عرضية، تبعية، خاصة، أو عقابية، بما في ذلك على سبيل المثال لا الحصر فقدان الأرباح، فقدان البيانات، أو تعطّل الأعمال، الناتجة عن أو المتعلقة بالأكاديمية، حتى لو أُعلِم المشغّل بإمكانية حدوث تلك الأضرار.</p>
            <p>إجمالي مسؤولية المشغّل عن أي مطالبة تنشأ عن هذه الشروط لن يتجاوز المبلغ الذي دفعه المستخدم للأكاديمية خلال الاثني عشر (12) شهراً السابقة لنشوء المطالبة، أو خمسين دولاراً أمريكياً (50 USD)، أيهما أكبر.</p>
          </LSection>

          <LSection n="12" title={{ ar: "التعويض", en: "Indemnification" }}>
            <p>يوافق المستخدم على تعويض المشغّل، ومسؤوليه، وموظفيه، ووكلائه، وحمايتهم من أي مطالبة، خسارة، التزام، نفقة (بما فيها أتعاب المحاماة المعقولة) تنشأ عن: (أ) انتهاك المستخدم لهذه الشروط، (ب) سوء استخدامه للمحتوى، (ج) انتهاكه لحقوق الغير أو لأي قانون.</p>
          </LSection>

          <LSection n="13" title={{ ar: "الامتثال للقوانين", en: "Compliance with Laws" }}>
            <p>يُقرّ المستخدم بأنه يتحمّل المسؤولية الكاملة عن الامتثال لجميع القوانين السارية، بما فيها:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li>قوانين الأمن السيبراني المحلية، بما فيها CFAA و ECPA و DMCA في الولايات المتحدة، أو ما يقابلها.</li>
              <li>قوانين حماية البيانات: GDPR، CCPA، LGPD، وما شابهها.</li>
              <li>أنظمة التصدير والعقوبات (OFAC، EAR) المتعلقة بأدوات الأمن السيبراني المزدوجة الاستخدام.</li>
              <li>قوانين مكافحة الإرهاب وغسل الأموال.</li>
            </ul>
          </LSection>

          <LSection n="14" title={{ ar: "الإنهاء", en: "Termination" }}>
            <p>يحق للمشغّل، وفق تقديره المنفرد، إنهاء أو تعليق وصول المستخدم إلى الأكاديمية فوراً، بإشعار أو بدونه، إذا انتهك هذه الشروط. تبقى الأقسام المتعلقة بالملكية الفكرية، إخلاء الضمانات، تحديد المسؤولية، التعويض، والقانون الواجب التطبيق سارية بعد الإنهاء.</p>
          </LSection>

          <LSection n="15" title={{ ar: "تعديل هذه الشروط", en: "Modification of These Terms" }}>
            <p>يحتفظ المشغّل بحق تعديل هذه الشروط في أي وقت. عند إجراء تغيير جوهري، سينشر الإصدار الجديد في الأكاديمية ويعرض إشعاراً ظاهراً قبل {doc.noticePeriodDays} يوماً على الأقل من تاريخ السريان. يُعدّ استمرار الاستخدام بعد تاريخ السريان قبولاً للتعديلات. كل إصدار يُؤرشف برقم وتاريخ في &quot;سجل التحديثات&quot; أدناه لضمان الشفافية.</p>
          </LSection>

          <LSection n="16" title={{ ar: "القوة القاهرة", en: "Force Majeure" }}>
            <p>لا يكون أي طرف مسؤولاً عن أي إخفاق أو تأخير في أداء التزاماته بموجب هذه الشروط نتيجة لأسباب خارجة عن سيطرته المعقولة، بما في ذلك الكوارث الطبيعية، الحرب، الإرهاب، تعطّل البنية التحتية للإنترنت، أو الإجراءات الحكومية.</p>
          </LSection>

          <LSection n="17" title={{ ar: "الانفصال والتنازل", en: "Severability & Waiver" }}>
            <p>إذا اعتُبر أي بند من هذه الشروط غير قابل للتنفيذ، تظل بقية البنود نافذة. عدم ممارسة المشغّل لأي حق لا يُعدّ تنازلاً عنه.</p>
          </LSection>

          <LSection n="18" title={{ ar: "القانون الواجب التطبيق وحل النزاعات", en: "Governing Law & Dispute Resolution" }}>
            <p>تخضع هذه الشروط وتُفسَّر وفقاً لـ {ENTITY.governingLaw.ar}، دون النظر إلى مبادئ تنازع القوانين. يوافق الطرفان على أن أي نزاع ينشأ عن هذه الشروط يُحال أولاً إلى مفاوضات بحسن نية لمدة ثلاثين (30) يوماً، ثم إلى تحكيم ملزم وفق قواعد [مركز التحكيم] في {ENTITY.jurisdiction.ar}، ما لم يُسمح للمشغّل قانوناً بالتقاضي في محاكم تلك الولاية.</p>
          </LSection>

          <LSection n="19" title={{ ar: "الاتفاق الكامل", en: "Entire Agreement" }}>
            <p>تشكّل هذه الشروط، إلى جانب سياسة الخصوصية المُشار إليها، الاتفاق الكامل بين المستخدم والمشغّل بشأن استخدام الأكاديمية، وتلغي أي اتفاقيات أو مفاهمات سابقة.</p>
          </LSection>
        </>}

        en={<>
          <LSection n="1" title={{ ar: "تعريفات", en: "Definitions" }}>
            <LDef term={{ ar: "&quot;الأكاديمية&quot;", en: "&quot;Academy&quot;" }}>
              the educational platform published at {ENTITY.website}, including all lessons, code, documentation, and reference tooling associated with it.
            </LDef>
            <LDef term={{ ar: "&quot;المشغّل&quot;", en: "&quot;Operator&quot;" }}>
              {ENTITY.legalName.en}, the legal entity that publishes the Academy and assumes the obligations under these Terms.
            </LDef>
            <LDef term={{ ar: "&quot;المستخدم&quot;", en: "&quot;User&quot;" }}>
              any natural or legal person who accesses the Academy or uses its Content by any means.
            </LDef>
            <LDef term={{ ar: "&quot;المحتوى&quot;", en: "&quot;Content&quot;" }}>
              all text, images, source code, documentation, hands-on examples, and any other materials published in the Academy.
            </LDef>
            <LDef term={{ ar: "&quot;الاختبار المُصرّح به&quot;", en: "&quot;Authorized Testing&quot;" }}>
              the execution of cybersecurity techniques <b>only</b> on systems the User owns, within the scope of a signed penetration-testing engagement, an explicit Bug Bounty program, or under written government authorization in accordance with applicable law.
            </LDef>
          </LSection>

          <LSection n="2" title={{ ar: "قبول الشروط", en: "Acceptance of Terms" }}>
            <p>By accessing the Academy or using any portion of the Content, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms. If you act on behalf of an entity, you represent that you are duly authorized to bind that entity.</p>
          </LSection>

          <LSection n="3" title={{ ar: "الأهلية", en: "Eligibility" }}>
            <p>You may use the Academy only if all of the following are true:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li>You are at least eighteen (18) years old or the legal age of majority in your jurisdiction, whichever is greater.</li>
              <li>You have full legal capacity to enter into a binding contract.</li>
              <li>Your jurisdiction is not subject to sanctions or restrictions that prohibit access to cybersecurity content.</li>
              <li>You will use the Content solely for educational purposes or Authorized Testing.</li>
            </ul>
          </LSection>

          <LSection n="4" title={{ ar: "طبيعة المحتوى — تعليمي بحت", en: "Nature of Content — Strictly Educational" }}>
            <p>The Academy is intended for training and education in defensive and authorized offensive cybersecurity. All techniques, tools, and examples are presented for understanding and simulation in isolated environments. <b>Nothing in the Academy constitutes an inducement to or endorsement of unlawful activity, nor a recommendation to attack any system the User is not expressly authorized to access.</b></p>
          </LSection>

          <LSection n="5" title={{ ar: "الترخيص الممنوح", en: "License Granted" }}>
            <p>The Operator grants the User a non-exclusive, non-transferable, revocable, limited license — for personal or authorized professional educational purposes only — to access and view the Content. The User may not:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li>Resell or redistribute the Content for monetary consideration.</li>
              <li>Remove notices of intellectual property or disclaimers.</li>
              <li>Use the Content to commercially train AI models without prior written permission.</li>
              <li>Create commercial derivatives that directly compete with the Academy.</li>
            </ul>
          </LSection>

          <LSection n="6" title={{ ar: "القيود — الاستخدام المحظور", en: "Restrictions — Prohibited Use" }}>
            <p>The User is strictly prohibited from using the Content, in whole or in part, for:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li>Testing or attacking any system without express written authorization from its owner.</li>
              <li>Any activity that constitutes a crime under the United States Computer Fraud and Abuse Act (CFAA, 18 U.S.C. § 1030) or equivalent law in the User&apos;s jurisdiction.</li>
              <li>Developing or deploying ransomware, in-the-wild malware, or turnkey offensive tooling against unauthorized targets.</li>
              <li>Violating privacy rights, exfiltrating personal data, or targeting children.</li>
              <li>Supporting terrorism or activities of entities listed on international sanctions lists.</li>
              <li>Bypassing the Academy&apos;s access controls or extracting source code for unauthorized purposes.</li>
            </ul>
            <p>The User acknowledges that any breach of this Section may expose them to full criminal and civil liability, and agrees that the Operator may cooperate with law enforcement.</p>
          </LSection>

          <LSection n="7" title={{ ar: "مسؤوليات المستخدم", en: "User Responsibilities" }}>
            <p>The User represents and warrants that they will:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li>Comply with all applicable laws in their jurisdiction and in the jurisdictions of any systems they interact with.</li>
              <li>Obtain written authorization before any penetration test on systems they do not own.</li>
              <li>Not publish credentials, keys, or system secrets — whether obtained inside or outside the lab — without permission.</li>
              <li>Promptly report any vulnerability they discover in the Academy itself to {ENTITY.contactEmail}.</li>
              <li>Take full responsibility for any action performed using their account or from their device.</li>
            </ul>
          </LSection>

          <LSection n="8" title={{ ar: "الملكية الفكرية", en: "Intellectual Property" }}>
            <p>All intellectual property rights in the Academy — including but not limited to text, code, logos, design, structure, and documentation — belong to the Operator or its licensors and are protected by international copyright and trademark law. This license grants the User no ownership rights, only the access and use rights described in Section 5.</p>
          </LSection>

          <LSection n="9" title={{ ar: "محتوى المستخدم وسلوكه", en: "User Content & Conduct" }}>
            <p>If the User submits feedback, suggestions, or technical contributions to the Academy, the User grants the Operator a worldwide, royalty-free, perpetual, non-exclusive, sublicensable license to use those contributions to develop the Academy. The User warrants that such contributions do not infringe any third-party right.</p>
          </LSection>

          <LSection n="10" title={{ ar: "إخلاء الضمانات", en: "Disclaimer of Warranties" }}>
            <p className="font-bold uppercase tracking-wide">The Content is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranty of any kind, express or implied.</p>
            <p>The Operator does not warrant the accuracy of the Content, that it is error-free, or that it is fit for any particular purpose. References to CVEs and known techniques are historical training information and may not reflect the current state of any product. The Operator does not warrant that use of the Content will produce any specific outcome on any test or certification.</p>
          </LSection>

          <LSection n="11" title={{ ar: "تحديد المسؤولية", en: "Limitation of Liability" }}>
            <p>To the maximum extent permitted by applicable law, the Operator shall not be liable for any indirect, incidental, consequential, special, or punitive damages — including without limitation lost profits, lost data, or business interruption — arising out of or relating to the Academy, even if the Operator has been advised of the possibility of such damages.</p>
            <p>The Operator&apos;s total liability for any claim arising under these Terms shall not exceed the amount paid by the User to the Academy during the twelve (12) months preceding the claim, or fifty US dollars (USD 50), whichever is greater.</p>
          </LSection>

          <LSection n="12" title={{ ar: "التعويض", en: "Indemnification" }}>
            <p>The User agrees to indemnify, defend, and hold harmless the Operator and its officers, employees, and agents from any claim, loss, liability, or expense (including reasonable attorneys&apos; fees) arising from: (a) the User&apos;s breach of these Terms, (b) the User&apos;s misuse of the Content, or (c) the User&apos;s violation of any third-party right or law.</p>
          </LSection>

          <LSection n="13" title={{ ar: "الامتثال للقوانين", en: "Compliance with Laws" }}>
            <p>The User acknowledges full responsibility for compliance with all applicable laws, including:</p>
            <ul className="list-disc ps-6 space-y-1">
              <li>Local cybersecurity statutes — including CFAA, ECPA, DMCA in the United States, and equivalents elsewhere.</li>
              <li>Data protection laws — GDPR, CCPA, LGPD, and the like.</li>
              <li>Export-control and sanctions regimes (OFAC, EAR) governing dual-use cybersecurity tools.</li>
              <li>Anti-terrorism and anti-money-laundering laws.</li>
            </ul>
          </LSection>

          <LSection n="14" title={{ ar: "الإنهاء", en: "Termination" }}>
            <p>The Operator may, in its sole discretion, terminate or suspend the User&apos;s access to the Academy immediately, with or without notice, if the User breaches these Terms. The provisions on intellectual property, disclaimer of warranties, limitation of liability, indemnification, and governing law survive termination.</p>
          </LSection>

          <LSection n="15" title={{ ar: "تعديل هذه الشروط", en: "Modification of These Terms" }}>
            <p>The Operator reserves the right to modify these Terms at any time. Where a material change is made, the new version will be published in the Academy with a prominent notice at least {doc.noticePeriodDays} days before the effective date. Continued use after the effective date constitutes acceptance of the modifications. Every version is archived with a number and date in the Changelog below for transparency.</p>
          </LSection>

          <LSection n="16" title={{ ar: "القوة القاهرة", en: "Force Majeure" }}>
            <p>Neither party is liable for any failure or delay in performance under these Terms caused by events beyond its reasonable control, including natural disasters, war, terrorism, internet infrastructure failure, or government actions.</p>
          </LSection>

          <LSection n="17" title={{ ar: "الانفصال والتنازل", en: "Severability & Waiver" }}>
            <p>If any provision of these Terms is held unenforceable, the remaining provisions shall remain in effect. The Operator&apos;s failure to exercise any right is not a waiver of that right.</p>
          </LSection>

          <LSection n="18" title={{ ar: "القانون الواجب التطبيق وحل النزاعات", en: "Governing Law & Dispute Resolution" }}>
            <p>These Terms are governed by and construed in accordance with {ENTITY.governingLaw.en}, without regard to its conflict-of-laws principles. The parties agree that any dispute arising from these Terms shall first be referred to good-faith negotiation for thirty (30) days, then to binding arbitration under the rules of [arbitration center] in {ENTITY.jurisdiction.en}, except where the Operator is permitted by law to litigate in the courts of that jurisdiction.</p>
          </LSection>

          <LSection n="19" title={{ ar: "الاتفاق الكامل", en: "Entire Agreement" }}>
            <p>These Terms, together with the referenced Privacy Policy, constitute the entire agreement between the User and the Operator concerning use of the Academy and supersede any prior agreements or understandings.</p>
          </LSection>
        </>}
      />
    </LegalShell>
  );
}
