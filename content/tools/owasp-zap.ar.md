# OWASP ZAP — دليل الاستخدام الشامل

تُعد أداة ZAP (Zed Attack Proxy) البديل المفتوح المصدر الأقوى لـ Burp Suite، وهي مدعومة رسمياً من منظمة OWASP. تتميز الأداة بقدرات تكامل عالية مع خطوط الإنتاج البرمجية (CI/CD)، وقابلية التوسعة عبر البرمجة (Scriptable)، وهي مجانية بالكامل دون قيود على السرعة. نسخة عام 2024 "ZAProxy" هي النسخة التي يديرها المجتمع حالياً.

## التثبيت

```terminal
brew install --cask owasp-zap
docker run -u zap -p 8090:8090 -p 8080:8080 ghcr.io/zaproxy/zaproxy:stable zap.sh -daemon -host 0.0.0.0 -port 8080
```

أوضاع التشغيل: واجهة رسومية (GUI)، وضع الخادم (Daemon) عبر API فقط، أو عبر Docker للدمج في عمليات الـ CI.

## أوضاع التشغيل (القائمة المنسدلة في الأعلى)

| الوضع | السلوك |
|------|---------|
| Safe (آمن) | فحص سلبي (Passive) فقط — لا يوجد فحص نشط أو Fuzzing |
| Protected (محمي) | فحص سلبي + نشط فقط على المواقع المحددة داخل نطاق العمل (In-scope) |
| Standard (قياسي) | فحص أي شيء تتفاعل معه؛ **يجب تحديد النطاق (Scope) قبل البدء بالفحص النشط** |
| ATTACK (هجوم) | هجوم تلقائي على أي رابط يمر عبر الوكيل — يستخدم فقط في بيئات المختبرات الخاصة بـ ZAP |

يُنصح دائماً باستخدام وضع **Protected** أو الاعتماد على فلاتر النطاق (Scope).

## منهجية العمل (Workflow)

1. إعداد الوكيل (Proxy) في المتصفح: 127.0.0.1:8080.
2. تصفح الموقع المستهدف عبر الوكيل لملء شجرة المواقع (Sites tree).
3. انقر بزر الفأرة الأيمن على جذر الموقع ← Include in context.
4. انقر بزر الفأرة الأيمن ← Attack ← Spider (لاكتشاف الروابط).
5. انقر بزر الفأرة الأيمن ← Attack ← AJAX Spider (للمواقع التي تعتمد بكثافة على JavaScript).
6. انقر بزر الفأرة الأيمن ← Attack ← Active Scan مع اختيار السياسة المناسبة.
7. مراجعة تبويب التنبيهات (Alerts)؛ تحليل النتائج وتصنيفها وإعادة الفحص إذا لزم الأمر.

## الإعدادات والمعاملات الرئيسية

| الإعداد | الغرض |
|---------|-------|
| Tools → Options → Network → Connection | ربط الأداة بوكيل خارجي (Upstream proxy) |
| Tools → Options → API | تفعيل واجهة البرمجة ومفتاح الوصول لاستخدام `zap-cli` |
| Tools → Options → Active Scan | التحكم في عدد العمليات (Threads)، قوة الهجوم، وعتبة التنبيهات |
| Tools → Options → Spider | تحديد أقصى عمق للزحف، والتعامل مع Robot.txt وطلبات POST |
| Tools → Options → Connection → User-Agent | تدوير معرف المتصفح (User-Agent) |
| Sites tree → Context → Include / Exclude regex | تحديد نطاق العمل بدقة باستخدام التعبيرات النمطية |
| Authentication script | سكربت لتسجيل الدخول وإعادة استخدامه أثناء الفحص |
| Forced User mode | تنفيذ جميع الطلبات كملف تعريف مستخدم معين (مصدق) |

## التكامل مع CI (الميزة القاتلة)

```terminal
docker run -u zap -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://target.com -r baseline.html
docker run -u zap -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t https://target.com -r full.html
docker run -u zap -t ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py -t https://target.com/openapi.json -f openapi -r api.html
```

- `zap-baseline.py`: سريع وآمن (سلبي فقط) — مثالي لخطوط الإنتاج البرمجية.
- `zap-full-scan.py`: يقوم بفحص نشط كامل؛ يستخدم فقط ضد بيئات الاختبار (Staging).
- `zap-api-scan.py`: متخصص في فحص واجهات البرمجيات (OpenAPI/Swagger/SOAP).

## البرمجة والتوسعة (Scripting)

يدعم ZAP السكربتات بلغات JS و Python و Groovy و Kotlin:

| نوع السكربت | وقت التنفيذ |
|------------|--------------|
| Active rules | إضافة وحدات هجومية جديدة |
| Passive rules | فحص كل استجابة (Response) قادمة |
| Authentication | تخصيص عملية تسجيل الدخول المعقدة |
| Session management | منطق تحديث رموز الجلسة (Tokens) |
| Targeted | مساعد لمرة واحدة لمهمة محددة |
| HTTP Sender | تعديل كل طلب صادر (Outgoing request) |

مثال لسكربت تعديل الطلبات (JS):

```javascript
function sendingRequest(msg, initiator, helper) {
  msg.getRequestHeader().setHeader("X-Tenant", "evil-tenant");
}
```

## تحليل المخرجات (Good output)

تُصنف التنبيهات حسب الخطورة (عالية/متوسطة/منخفضة/معلومات)، وتتضمن: الاسم، الرابط، المعامل المتأثر، ناقل الهجوم (Attack vector)، الدليل (Evidence)، والربط مع تصنيفات CWE/OWASP، بالإضافة إلى طرق الإصلاح. التقارير بصيغة HTML المستخرجة من عمليات الـ CI قابلة للمراجعة الفورية.

## المشكلات الشائعة والحلول

| العرض | السبب المحتمل | الحل |
|---------|-------|-----|
| الزاحف (Spider) لا يجد روابط | الموقع تطبيق صفحة واحدة (SPA) | استخدم AJAX Spider؛ فهو يعتمد على متصفح Firefox حقيقي |
| الفحص النشط يعيد 403 دائماً | انتهاء الجلسة أو رموز الجلسة غير مرتبطة | قم بإعداد سياق المصادقة (Authentication context) وتفعيل وضع Forced User |
| الكثير من الإنذارات الكاذبة (False Positives) لـ XSS | قواعد الاكتشاف الافتراضية حساسة جداً | عدل سياسة الفحص النشط؛ ارفع عتبة التنبيه إلى "Medium" |
| الفحص بطيء جداً | الإعدادات الافتراضية (5 عمليات + قوة 100%) | ارفع عدد العمليات؛ قلل القوة إلى Medium في المرحلة الأولى |
| استهلاك عالي للذاكرة | تراكم بيانات الجلسات | Tools → Options → Database → Cleanup؛ أو أعد تشغيل الأداة |

## منظور المدافع (Defender's perspective)

سلوك ZAP يشبه Burp والمفحوصات الآلية الأخرى: تعديلات متكررة على المعاملات، بصمات حمولات (Payloads) معروفة، ومحاولات اكتشاف مسارات مكثفة. الـ User-Agent الافتراضي يحاكي المتصفحات الحديثة، لكن بعض الإضافات تترك وسوم `OWASP ZAP` في الطلبات بشكل صريح، مما يسهل حظرها عبر الـ WAF.

## العمليات الأمنية (OPSEC)

- عطل تعليقات HTTP الخاصة بـ `OWASP ZAP` لتجنب كشف هويتك بسهولة.
- استخدم وكيل تمرير (Upstream proxy) مع عنوان IP خارجي مخصص لكل عملية (Engagement) لضمان الفصل.

## أدوات ذات صلة

- **Burp Suite Pro** — البديل المدفوع؛ تجربة مستخدم أفضل في Intruder و Repeater.
- **Caido** — وكيل حديث مبني بلغة Rust.
- **Nikto** — فحص الخوادم القديم؛ مكمل للنتائج الحديثة.
- **nuclei** — فحص يعتمد على القوالب، أسرع في اكتشاف الثغرات المعروفة.
