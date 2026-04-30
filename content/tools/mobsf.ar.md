# دليل MobSF الشامل

يُعد `MobSF` (Mobile Security Framework) الإطار الأكثر استخدامًا لإجراء الفحص الساكن (Static)، والديناميكي (Dynamic)، وفحص البرمجيات الخبيثة لتطبيقات الهواتف الذكية. توفر الأداة واجهة ويب ذاتية الاستضافة؛ حيث يمكنك رفع ملفات APK أو IPA أو AAB والحصول على تقرير مفصل بصيغة HTML خلال دقائق. تعتبر هذه الأداة الخطوة الأولى المثالية قبل البدء في التحليل اليدوي المعمق باستخدام Frida أو objection.

## التثبيت (Install)

```terminal
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest
# المتصفح ← http://localhost:8000 — الحساب الافتراضي: mobsf / mobsf
```

التثبيت المباشر (Linux / macOS):

```terminal
git clone https://github.com/MobSF/Mobile-Security-Framework-MobSF
cd Mobile-Security-Framework-MobSF && ./setup.sh && ./run.sh 0.0.0.0:8000
```

## التحليل الساكن (Static Analysis)

يمكنك الرفع عبر الواجهة (Drag-and-drop) أو باستخدام واجهة البرمجة `POST /api/v1/upload`.

يغطي التقرير الساكن ما يلي:

- توقيع التطبيق، والشهادات الرقمية، وقائمة الصلاحيات، والمكونات المكشوفة (Exported activities/receivers/services/providers).
- الأسرار المكتوبة في الكود (Hardcoded secrets) مثل العناوين (URLs) والمفاتيح، والشهادات المدمجة، ومشاكل AndroidManifest.
- المكتبات الخارجية (Third-party libraries) التي تحتوي على ثغرات CVE معروفة.
- مراجعة إعدادات أمن الشبكة (Network Security Config / ATS لـ iOS).
- مشاكل ملف الـ Manifest (مثل debuggable=true أو allowBackup=true).
- جودة الكود (التشفير غير الآمن، الهاشات الضعيفة، العشوائية الضعيفة).
- مطابقة النتائج مع معايير MASVS / OWASP MASTG.

```terminal
# المسح عبر واجهة السطر البرمجي (CLI)
curl -F 'file=@app.apk' http://localhost:8000/api/v1/upload \
    -H "Authorization: <API_KEY>" | jq
# تعيد الأداة هاش للملف ← ثم جلب التقرير:
curl -X POST http://localhost:8000/api/v1/report_json -d "hash=<hash>" \
    -H "Authorization: <API_KEY>" > report.json
```

## التحليل الديناميكي (Dynamic Analysis - للأندرويد فقط)

المتطلبات:
- نسخة **MobSF VM** (أندرويد 9+) تعمل على VirtualBox / Genymotion أو Android Studio AVD مع وجود Frida وصلاحيات Root مسبقًا.
- أو ربط جهاز حقيقي به صلاحيات Root عبر ADB مع تشغيل frida-server.

توفر لوحة التحكم الديناميكية:

- مراقبة حية لطلبات واجهة البرمجة (Live API monitoring) عبر تتبع Frida.
- اعتراض حركة مرور TLS عبر توجيه تلقائي لـ Burp أو بروكسي HTTPS مدمج.
- استكشاف المكونات (Activity / fragment exploration) بضغطة زر.
- التقاط لقطات شاشة (Screenshots).
- تفريغ الذاكرة (Memory dump).
- لقطات لنظام الملفات (File-system snapshots) قبل وبعد التشغيل.
- أداة "Exported activity launcher" لاختبار المكونات المكشوفة (Fuzzing).

بالنسبة لنظام iOS، يدعم MobSF التكامل مع Corellium؛ أما دعم الأجهزة الحقيقية (Jailbroken) فمحدود.

## اكتشافات سريعة عبر التحليل الساكن

يشير التقرير الساكن إلى:

- **تخزين البيانات غير الآمن** — استخدام SharedPreferences بمفاتيح حساسة؛ قواعد بيانات SQLite بنص صريح.
- **الاتصالات غير الآمنة** — السماح بـ `cleartextTrafficPermitted`؛ استخدام `HostnameVerifier` يسمح للكل؛ غياب تثبيت الشهادات (Pinning).
- **التشفير غير الآمن** — استخدام خوارزميات مثل DES/MD5/SHA1؛ نمط ECB؛ أو مفاتيح IV ثابتة.
- **التلاعب بالكود** — تفعيل وضع التنقيح (Debuggable)، غياب التمويه (Obfuscation)، وفقدان آليات اكتشاف الـ Root.
- **خلل في المصادقة** — عدم ربط القياسات الحيوية (Biometric) بمفتاح الـ Keystore؛ تخزين الرموز (Tokens) بنص صريح.
- **نقاط النهاية (API Endpoints)** — استخراج كافة العناوين المكتوبة في الكود لتسهيل عملية الـ OSINT.

## مسارات العمل (Workflows)

### الفرز الروتيني (Triage)

1. ارفع ملف الـ APK.
2. مراجعة التقرير الساكن عبر تبويب "Findings".
3. فحص تبويب النصوص (Strings) والبحث عن `aws_access_key` أو `BEGIN PRIVATE KEY` أو `firebase`.
4. مراجعة تبويبات الـ URL/Email/IP لتغذية ملاحظات الاستطلاع (Recon).
5. تشغيل التحليل الديناميكي عبر الـ VM لاعتراض حركة المرور.

### التكامل مع CI/CD

```terminal
# مسح دوري آلي؛ إيقاف خط الإنتاج عند وجود ثغرات عالية الخطورة
curl -F 'file=@build/app.apk' http://mobsf/api/v1/upload -H "Authorization: $KEY"
HASH=$(...)
curl http://mobsf/api/v1/scan?hash=$HASH -H "Authorization: $KEY"
curl http://mobsf/api/v1/report_pdf?hash=$HASH -H "Authorization: $KEY" -o report.pdf
```

## تحليل المخرجات

الجزء العلوي من التقرير الساكن يعرض:

```
App Score: 35 / 100
Trackers : 4 (ad networks)
Permissions: 45 (8 dangerous)
Hardcoded Secrets: 2
URLs found: 78
```

تعرض اللوحات التفصيلية أجزاء الكود مع أرقام الأسطر وتلوين حسب الخطورة.

## المشاكل الشائعة والحلول

| العرض | الحل |
|-------|------|
| فشل الرفع | الملف كبير جدًا؛ ارفع قيمة `MAX_REQUEST_SIZE` في الإعدادات |
| توقف الـ VM الديناميكي | معمارية الـ AVD غير متوافقة؛ استخدم نسخة MobSF VM الرسمية |
| الكثير من النتائج الخاطئة (False Positives) | قم بتعديل قيم `MOBSF_API_PATTERNS_REGEX` |
| التقرير يفتقد لأجزاء معينة | قد يفشل التحليل الساكن في حال وجود تمويه شديد (DexGuard)؛ استخدم `jadx` يدويًا أولاً |
| رسالة "JADX failed" | نقص في الذاكرة؛ ارفع ذاكرة JADX في الإعدادات |

## منظور المدافعين (Defender's Perspective)

استخدم MobSF كبوابة عبور للإصدارات (Release-gate):

- منع الإصدار إذا كان تقييم التطبيق "App Score < 70".
- منع الإصدار عند وجود أي ثغرة "Critical".
- تتبع نقاط التقييم لكل تطبيق مع مرور الوقت؛ أي تراجع هو مؤشر خطر.

## أمن العمليات (OPSEC)

- يقوم MobSF بتخزين التطبيقات المرفوعة في قاعدة بياناته؛ لذا يجب تأمين نسختك خلف جدار حماية ومصادقة و HTTPS.
- لا تجعل واجهة MobSF مفتوحة للعامة؛ فقد تعرضت سابقًا لثغرات RCE (مثل CVE-2022-2856).
- تحتوي التقارير غالبًا على مقتطفات من الكود المصدري؛ تعامل معها كبيانات سرية.

## أدوات ذات صلة

| الأداة | التخصص |
|--------|---------|
| **APKLeaks** | استخراج سريع للمفاتيح من واجهة السطر البرمجي |
| **objection / Frida** | للتحليل الديناميكي اليدوي والمعمق |
| **AppSweep** | تحليل تجاري معمق لـ DexGuard |
| **Mariana Trench** | أداة Meta لتحليل تدفق البيانات (Static taint analyzer) |
| **reFlutter** | مخصص لتطبيقات Flutter |
| **iSecurity Suite** | أداة تجارية متخصصة في iOS |
