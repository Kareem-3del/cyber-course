# جيدرا (Ghidra) — الدليل الشامل للهندسة العكسية

تُعد منصة `Ghidra` أداة مفتوحة المصدر للهندسة العكسية للبرمجيات (SRE)، أطلقتها وكالة الأمن القومي الأمريكية (NSA). توفر الأداة محللاً للأكواد (Disassembler) ومسترجعاً للكود المصدري (Decompiler) يدعم معالجات x86/x64 و ARM و MIPS و RISC-V و PowerPC و SPARC وغيرها الكثير، مع واجهة رسومية تعتمد على Java. وتعتبر البديل المجاني الأبرز لبرنامج IDA Pro.

## التثبيت (Install)

```terminal
# تتطلب جافا الإصدار 17 فما فوق
java --version
wget https://github.com/NationalSecurityAgency/ghidra/releases/latest/download/ghidra_*_PUBLIC_*.zip
unzip ghidra_*.zip
./ghidraRun
```

أو عبر أمر `brew install ghidra` لمستخدمي نظام macOS.

## التشغيل الأول

1. **File ← New Project** ← اختيار Non-Shared (لمستخدم واحد).
2. سحب الملف الثنائي (Binary) إلى نافذة المشروع ← استيراد (Import) ← استخدام الإعدادات الافتراضية.
3. النقر المزدوج على الملف ← يفتح واجهة CodeBrowser.
4. الموافقة على التحليل التلقائي (Auto-analysis) ← اضغط Analyze.

## تخطيط CodeBrowser

| اللوحة | الغرض |
|-------|---------|
| Listing | عرض كود التجميع (Disassembly) |
| Decompiler | إعادة بناء الكود بلغة شبيهة بـ C (جهة اليمين) |
| Functions | شجرة الدوال (Functions) |
| Symbol Tree | الواردات (Imports)، الصادرات (Exports)، والعلامات (Labels) |
| Defined Strings | جميع النصوص المستخرجة من الملف |
| Bookmarks | الإشارات المرجعية للمستخدم |
| Bytes | العرض الست عشري (Hex view) |
| Memory Map | أقسام الذاكرة وصلاحياتها |
| Comments | الملاحظات والتعليقات البرمجية |

## اختصارات لوحة المفاتيح الأساسية

| المفتاح | الإجراء |
|-----|--------|
| `G` | الانتقال إلى عنوان أو رمز محدد |
| `L` | إعادة تسمية علامة أو متغير |
| `;` | إضافة تعليق عند عنوان معين |
| `T` | تحديد نوع البيانات (Data type) |
| `F` | تحديث قسري لمسترجع الكود (Decompiler) |
| `H` | البحث عن المراجع (References) |
| `Ctrl+Shift+G` | انتقال متقدم لعنوان |
| `Ctrl+Shift+E` | تصدير الجزء المحدد |
| `Ctrl+B` | إضافة إشارة مرجعية |
| `Ctrl+M` | خريطة الذاكرة |
| `Ctrl+Alt+S` | مراجع الرموز (Symbol references) |
| `Ctrl+Shift+F` | الرسم البياني لاستدعاءات الدوال |
| `Ctrl+E` | تحرير توقيع الدالة (Signature) |
| `S` | تحديد عضو في هيكل بيانات (Struct member) |

## سير العمل على عينة برمجية خبيثة (Malware)

1. تحديد الواردات (Imports) ← ابحث عن وظائف مثل `WinHttp*` و `CreateRemoteThread` و `VirtualAllocEx` و `WriteProcessMemory` — وهي مؤشرات أساسية لعمل أدوات الوصول عن بُعد (RAT).
2. النصوص (Strings) ← ابحث عن نصوص مثيرة للاهتمام مثل (`http://` ، `Mozilla/5.0` ، مسارات الملفات) وأضفها كتعليقات.
3. ابحث عن نقطة الدخول `main` أو `WinMain` أو `DllMain` وابدأ التحليل منها للخارج.
4. أعد تسمية الدوال فور اتضاح سلوكها (استخدم `L` للتسمية).
5. طبق أنواع الهياكل البرمجية (Structs) عند ملاحظة إزاحات (Offsets) ثابتة.
6. استخدم لوحة **Decompiler** كخريطة أساسية، ولوحة **Listing** للتحقق الدقيق.

## البرمجيات النصية المضمنة (Script Manager)

| النص البرمجي | الغرض |
|--------|-----|
| `ImportSymbolsScript.java` | تحميل الرموز بكميات كبيرة من ملف CSV |
| `FindSymbolsScript.java` | البحث عن أنماط (Patterns) معروفة |
| `FunctionGraph` | رسم بياني مرئي للاستدعاءات |
| `ExportToDocumentation` | تصدير النتائج بتنسيق Markdown أو HTML |

يمكنك كتابة سكربتات بلغة Java أو Python (عبر Jython / Ghidrathon) من خلال: `Window ← Script Manager ← New Script`.

```python
# مثال: استخراج كافة الدوال التي تزيد عن 100 تعليمة إلى ملف
fm = currentProgram.getFunctionManager()
with open("/tmp/fns.txt", "w") as f:
    for fn in fm.getFunctions(True):
        if fn.getBody().getNumAddresses() > 100:
            f.write(f"{fn.getName()}\t{fn.getEntryPoint()}\n")
```

## الإضافات المفيدة (Extensions)

- **Ghidrathon**: لدعم لغة Python 3 بدلاً من Jython.
- **GhidraEmu**: لمحاكاة تشغيل الدوال.
- **GhidraPAL / pcode-tools**: للعمل مع لغة Ghidra الوسيطة (IR).
- **ret-sync**: لمزامنة مؤشر Ghidra مع برامج التصحيح (مثل x64dbg أو gdb).

## وضع الخادم / المشاركة (Shared mode)

```terminal
./ghidraSvr install
./ghidraSvr start
```

يسمح هذا الوضع لمستخدمين متعددين بالعمل على نفس الملف الثنائي في مشروع مشترك، مع إمكانية قفل الدوال أثناء العمل عليها.

## المشكلات الشائعة وحلولها

| العرض | الحل |
|---------|-------|
| المسترجع (Decompiler) لا يظهر شيئاً | خطأ في اتفاقية الاستدعاء (Calling convention) أو لم يتم التعرف على الدالة — استخدم `D` لتحديد بداية الدالة |
| عرض Hex يظهر علامات استفهام `??` | القسم (Section) غير محمل — اذهب لـ Memory Map وأضف شريحة (Segment) |
| تعليق التحليل التلقائي | وجود استدعاءات غير مباشرة كثيرة — عطل بعض المحللات وأعد التشغيل |
| تعطل المشروع | استرجع من النسخ الاحتياطية في مسار `~/ghidra_*_USER/_temp` |
| بطء مع الملفات الكبيرة | زد مساحة ذاكرة JVM عبر تعديل `-Xmx8G` في ملف `support/launch.properties` |
| رموز غير محلولة | طبق أرشيف أنواع البيانات: `Window ← Data Type Manager ← Apply Function Data Types` |

## منظور المدافع ومحلل الهندسة العكسية

تعد Ghidra سلاحاً أساسياً للمدافعين. بمجرد الحصول على ملف مشبوه (من KAPE أو EDR أو MalwareBazaar)، قم بفتحه لـ:

1. تتبع دالة `main` لفهم السلوك.
2. تحديد نصوص خوادم التحكم (C2) والمفاتيح المشفرة برمجياً.
3. كتابة قواعد Yara لتسلسلات العمليات (Opcodes) الفريدة.
4. توثيق مؤشرات الاختراق (IOCs) لمشاركتها مع فرق الاستجابة.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **IDA Pro** | تجاري؛ يتفوق في بعض حالات استرجاع الكود وتكامل المصحح (Debugger) |
| **Binary Ninja** | أحدث، يدعم البرمجة النصية بسهولة، منحنى تعلم أقصر |
| **radare2 / Cutter** | أدوات مفتوحة المصدر (واجهة نصية ورسومية)؛ أخف وزناً |
| **objdump / Capstone** | أدوات سطر أوامر لغرض محدد |
| **Hopper** | مخصص لنظام macOS |
