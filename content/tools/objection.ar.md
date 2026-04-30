# دليل Objection الشامل

تُعد `objection` مجموعة أدوات لاستكشاف تطبيقات الجوال أثناء التشغيل (Runtime)، وهي مبنية فوق محرك Frida الشهير. توفر الأداة واجهة تفاعلية سهلة لتنفيذ مهام اختبار الاختراق الأكثر شيوعاً: مثل تخطي ربط شهادات SSL (SSL-pinning bypass)، وتخطي اكتشاف كسر الحماية (Root / Jailbreak bypass)، وفحص مخازن المفاتيح (Keystore)، وتصفح نظام الملفات، واعتراض الفئات (Class hooking) — كل ذلك دون الحاجة لكتابة سطر واحد من أكواد Frida.

## التثبيت (Install)

```terminal
pip install objection
```

تتطلب الأداة وجود `frida-server` قيد التشغيل على الجهاز (للأندرويد: جهاز بصلاحيات Root أو محاكي؛ وللـ iOS: جهاز مكسور الحماية "Jailbroken"، أو استخدام خيار `objection patchapk` للأجهزة العادية).

## أوضاع التشغيل

### 1. التشغيل ضد تطبيق نشط

```terminal
objection -g com.target.app explore
```

### 2. حقن تطبيق (APK / IPA) بمكتبة Frida-gadget (بدون Root)

```terminal
objection patchapk -s app.apk
adb install app.objection.apk
# تشغيل التطبيق؛ سيتصل objection تلقائياً عبر المكتبة المحقونة
objection -g com.target.app explore
```

## بيئة الأوامر التفاعلية (explore REPL) — الأوامر الشائعة

```
android> help
android> env                                # عرض المسارات والمجلدات
android> sslpinning disable                 # تخطي شامل لربط الشهادات (~30 نمطاً)
android> root disable                       # تخطي اكتشاف صلاحيات الجذر
android> ui screenshot screen.png           # التقاط صورة للشاشة
android> hooking list classes               # عرض كافة الفئات (Classes) المحملة
android> hooking list class_methods com.target.app.MainActivity
android> hooking watch class_method com.target.app.Crypto.encrypt --dump-args --dump-return
android> heap search instances com.target.app.User
android> heap evaluate <id> 'this.email'    # استدعاء دالة على كائن موجود في الذاكرة
android> keystore list                      # عرض إدخالات Android Keystore
android> file download /data/data/com.target.app/databases/local.db
android> activity list                      # عرض الأنشطة (Activities)
android> intent launch_activity com.target.app/.SomeActivity --extra k=v
```

بالنسبة لنظام iOS، تبدأ الأوامر بكلمة `ios`:

```
ios> sslpinning disable
ios> keychain dump                          # استخراج كافة بيانات الـ Keychain
ios> nsuserdefaults get                     # عرض إعدادات المستخدم المخزنة
ios> jailbreak disable                      # تخطي اكتشاف الـ Jailbreak
ios> hooking watch method '-[Crypto encrypt:]' --dump-args
```

## سيناريوهات العمل (Workflows)

### تحليل حركة الشبكة (MITM) في 30 ثانية

```terminal
adb push frida-server /data/local/tmp && adb shell "/data/local/tmp/frida-server &"
objection -g com.target.app explore
android> sslpinning disable
# الآن قم بتوجيه حركة مرور الجوال عبر Burp Suite؛ ستظهر اتصالات HTTPS بوضوح
```

### سحب قواعد بيانات SQLite من بيئة عزل التطبيق (Sandbox)

```
android> file download /data/data/com.target.app/databases/db.sqlite
sqlite3 db.sqlite '.tables'
```

### مراقبة كافة دوال فئة معينة لتتبع المنطق الداخلي

```
android> hooking watch class com.target.app.Crypto --dump-args --dump-return
```

عند استخدام التطبيق، سيتم تسجيل كل استدعاء لدوال `Crypto.*` مع عرض المدخلات (Arguments) والقيم المسترجعة (Return values).

### تخطي واجهة المصادقة الحيوية (Biometric Prompt)

```
ios> ui biometrics_bypass
android> hooking watch class_method androidx.biometric.BiometricPrompt$AuthenticationCallback.onAuthenticationSucceeded
```

يمكنك حينها استخدام الأداة لاستدعاء دالة النجاح (onAuthenticationSucceeded) بشكل مباشر وتخطي البصمة.

### استخراج مخزن المفاتيح (Keychain / Keystore)

```
ios>     keychain dump --json keychain.json
android> keystore list
```

يعد استخراج iOS Keychain كنزاً للمحللين، حيث غالباً ما تحتوي على رموز المصادقة (Auth tokens) ومفاتيح التشفير.

## المشكلات الشائعة والحلول

| العرض | الحل |
|---------|-----|
| `Frida server is not running` | تأكد من تشغيل frida-server عبر adb وصلاحيات root |
| `sslpinning disable` لا يعمل | التطبيق يستخدم طريقة ربط مخصصة؛ استخدم `hooking watch class` لتحديدها واعتراضها يدوياً |
| فشل `objection patchapk` | تأكد من وجود apksigner و zipalign في متغيرات البيئة (PATH) |
| انهيار التطبيق بعد الحقن | التطبيق يكتشف وجود Frida؛ حاول إعادة تسمية مكتبة gadget في خيارات الحقن |
| `keychain dump` فارغ | التطبيق يستخدم حماية `kSecAttrAccessibleWhenUnlocked` والجهاز مغلق ← افتح القفل وأعد المحاولة |

## منظور المدافع (Defender Perspective)

- يجب أن تكتشف التطبيقات وجود Frida عبر فحص المنافذ (TCP/27042) أو أسماء الخيوط (Threads) مثل `gum-js-loop` أو وجود مكتبة `frida-gadget` في خرائط الذاكرة.
- التطبيقات الحساسة (مالية، صحية) يجب أن تستخدم تقنيات Play Integrity (Android) أو DeviceCheck (iOS) مع **التحقق من جهة الخادم (Server-side)** لضمان سلامة الجهاز.
- تخزين البيانات الحساسة في الـ Keychain/Keystore مقبول فقط إذا تم التأكد من دعمها بواسطة المعقل الآمن (Secure Enclave) أو بيئة التنفيذ الموثوقة (TEE).

## أمن العمليات (OPSEC) للمختبرين

- عملية `patchapk` تعيد توقيع التطبيق بشهادة تصحيح (Debug keystore)، مما يجعل التطبيق المحقون قابلاً للتحديد بسهولة.
- بعض التطبيقات ترفض التشغيل إذا تغير توقيع المثبت (Installer signature).
- في المهمات طويلة الأمد، يُفضل استخدام جهاز اختبار مخصص يطابق ملف MDM الخاص بالهدف مع تعطيل الحمايات المطلوبة فقط.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **Frida** | المحرك الأساسي الذي تعتمد عليه objection |
| **MobSF** | تحليل سكوني وديناميكي شامل |
| **r2frida / radare2** | التحليل الحي للملفات الثنائية (Binary analysis) |
| **APKLeaks** | مسح سكوني سريع للبحث عن مفاتيح وروابط داخل APK |
| **Reflutter** | إعادة هندسة تطبيقات Flutter (Dart-AOT) |
