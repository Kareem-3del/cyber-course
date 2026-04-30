# Frida — الدليل الكامل

تُعد `Frida` مجموعة أدوات متطورة لفحص البرمجيات الحية (Dynamic Instrumentation). تتيح لك الأداة حقن شيفرات JavaScript داخل العمليات الجارية — سواء على أنظمة Android أو iOS أو Windows أو macOS أو Linux أو QNX — لاعتراض الدوال (Hooking)، وفحص المعاملات (Arguments)، وتعديل القيم المسترجعة، وتتبع تنفيذ الأوامر. تعتبر الأداة المعيارية الأولى في مجال الهندسة العكسية لتطبيقات الهاتف المحمول.

## التثبيت (Install)

```terminal
pip install frida-tools
```

لنظام **Android**: قم بنقل ملف `frida-server` المتوافق مع معمارية جهازك إلى المسار `/data/local/tmp/` على جهاز يحتوي على صلاحيات root أو محاكي (Emulator)، ثم قم بتشغيله بصلاحيات root.

لنظام **iOS**: قم بتثبيت أداة Frida من مستودع BigBoss على جهاز يحتوي على Jailbreak، أو استخدم أدوات مثل `frida-ios-dump`.

## المكونات (Components)

| المكون | الغرض |
|-----------|---------|
| `frida` | واجهة تفاعلية (REPL) أو تنفيذ أوامر سريعة |
| `frida-trace` | توليد تلقائي لقوالب الاعتراض (Hook stubs) للدوال المطابقة |
| `frida-ps` | استعراض العمليات الجارية |
| `frida-ls-devices` | استعراض الأجهزة المتصلة (USB أو عن بعد) |
| `frida-discover` | اكتشاف الرموز (Symbols) داخل الملف التنفيذي |
| `frida-server` | الخلفية البرمجية (Daemon) التي تعمل على الجهاز الهدف |
| `frida-gadget` | للحقن داخل التطبيقات بدون صلاحيات root (إعادة حزم APK) |

## الاستخدام الأساسي (Basic usage)

```terminal
# استعراض الأجهزة
frida-ls-devices

# استعراض العمليات على جهاز أندرويد متصل عبر USB
frida-ps -U

# تشغيل تطبيق وحقن الشيفرة مباشرة
frida -U -f com.target.app -l hook.js --no-pause

# الارتباط بعملية قيد التشغيل بالفعل
frida -U -n com.target.app -l hook.js
```

أهم الأعلام (Flags):
- `-U`: لجهاز متصل عبر USB.
- `-R`: لجهاز بعيد (Remote) يمكن الوصول إليه عبر الشبكة.
- `-f <package>`: لتشغيل التطبيق من البداية.
- `-l <file>`: لتحميل ملف JavaScript يحتوي على منطق الاعتراض.
- `--no-pause`: استئناف تشغيل التطبيق فوراً بعد الحقن.

## سيناريوهات الاعتراض — أساسيات (Hook script)

```javascript
// اعتراض دوال Java (Android)
Java.perform(function () {
    var Activity = Java.use('android.app.Activity');
    Activity.onCreate.implementation = function (bundle) {
        console.log('[+] onCreate called');
        return this.onCreate(bundle);
    };

    var Cipher = Java.use('javax.crypto.Cipher');
    Cipher.doFinal.overload('[B').implementation = function (b) {
        console.log('[+] doFinal: ' + Java.use('android.util.Base64').encodeToString(b, 0));
        return this.doFinal(b);
    };
});

// اعتراض الدوال الأصلية (Native-side hook)
var addr = Module.findExportByName('libssl.so', 'SSL_write');
Interceptor.attach(addr, {
    onEnter: function (args) {
        console.log('SSL_write payload: ' + Memory.readUtf8String(args[1], 200));
    }
});
```

## أنماط Frida الشائعة

### تجاوز تثبيت شهادات SSL (SSL Pinning Bypass)
بدلاً من كتابة سكربت معقد، يفضل استخدام أداة **objection**:

```terminal
objection -g com.target.app explore
... (objection) android sslpinning disable
```

### استخراج معاملات الدالة (Dump function arguments)

```terminal
frida-trace -U -i 'open' -n com.target.app
# سيتم إنشاء ملفات في مجلد __handlers__ — قم بتعديلها لطباعة المعاملات
```

### تعديل القيم المسترجعة (Set return value)

```javascript
Interceptor.attach(addr, {
    onLeave: function (retval) {
        console.log('original ret: ' + retval);
        retval.replace(0);     // إجبار الدالة على إرجاع قيمة النجاح
    }
});
```

## الحقن بدون صلاحيات Root
يتم استخدام `frida-gadget` وهو عبارة عن مكتبة `.so` يتم دمجها داخل ملف APK (إعادة حزم). أداة `objection patchapk` تسهل هذه العملية:

```terminal
objection patchapk -s app.apk
adb install app.objection.apk
frida -U -n com.target.app -l hook.js
```
*ملاحظة: التطبيقات المعاد حزمها قد تفشل في اختبارات Google Play Integrity أو SafetyNet.*

## مشاكل وحلول تقنية

| العرض | الحل |
|---------|-----|
| `Failed to spawn: unable to access process` | تأكد من تشغيل `frida-server` بصلاحيات root وتوافق المعمارية |
| التطبيق يتوقف عند الحقن (Crash) | كشف وجود Frida (Anti-debug)؛ استخدم وحدات Magisk للإخفاء أو إعادة بناء Gadget باسم مختلف |
| الاعتراض لا يعطي نتائج (Logs) | توقيع الدالة (Overload signature) غير دقيق؛ استخدم `Java.choose` للفحص |
| فشل تجاوز SSL Pinning في أندرويد | التطبيق يستخدم طرق تثبيت مخصصة؛ جرب ميزة `android sslpinning disable` في objection |

## منظور المدافع (Defender's perspective)

تحمي التطبيقات المحمولة نفسها عبر:
- **كشف Frida**: البحث عن سلاسل نصية مثل `frida-gum` أو منافذ مفتوحة لـ `frida-server`.
- **تثبيت TLS (TLS Pinning)**: على مستوى Java والمستويات الأصلية (Native).
- **كشف كسر الحماية (Root/Jailbreak)**: مؤشرات متعددة لوجود صلاحيات فائقة.
- **تمويه الشيفرة (Code Obfuscation)**: باستخدام أدوات مثل DexGuard أو LLVM-OB.

للمهاجمين: يتم استخدام `frida-magisk` لإخفاء وجود Frida، أو انتحال نتائج اختبارات السلامة (Attestation).

## الأمن العملياتي (OPSEC)

- تشغيل Frida يظهر كنشاط على جهاز المحلل، وليس على الخادم المستهدف.
- تطبيقات APK المعاد حزمها تترك أثراً وعلامة مائية؛ كما أن شهادة التوقيع ستكون خاصة بك.
- في اختبارات الصندوق الأسود (Black-box)، يفضل العمل على أجهزة مختبر معزولة.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **objection** | غلاف لـ Frida يوفر واجهة سهلة لأغلب المهام الشائعة |
| **r2frida** | جسر يربط بين Radare2 و Frida للتحليل الحي للملفات الثنائية |
| **MobSF** | فاحص شامل (ثابت وديناميكي) لتطبيقات الهاتف |
| **Xposed / LSPosed** | إطار عمل للاعتراض خاص بنظام أندرويد |
| **Reflutter** | لإعادة فحص وحقن تطبيقات Flutter |
