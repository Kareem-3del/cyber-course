# FLARE-VM — الدليل الكامل

تُعد `FLARE-VM` التوزيعة المعتمدة من شركة Mandiant لتحليل البرمجيات الخبيثة على نظام Windows. هي عبارة عن أداة تثبيت تعمل عبر PowerShell تقوم بتحويل نسخة Windows 10/11 حديثة إلى محطة عمل كاملة للهندسة العكسية (RE) — تتضمن أدوات مثل IDA Free، x64dbg، Ghidra، dnSpy، Process Monitor، FakeNet-NG، YARA، capa، Frida، وعشرات الأدوات الأخرى.

## التثبيت (Install)

1. قم بإنشاء جهاز افتراضي (VM) جديد بنظام Windows 10/11 (باستخدام VMware أو VirtualBox).
2. قم بتعطيل Windows Defender والتحديثات التلقائية.
3. خذ لقطة فورية (Snapshot) للجهاز وهو في حالته النظيفة.
4. قم بتشغيل PowerShell كمسؤول (Admin):

```powershell
Set-ExecutionPolicy Unrestricted -Force
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
(New-Object Net.WebClient).DownloadFile('https://raw.githubusercontent.com/mandiant/flare-vm/main/install.ps1','install.ps1')
.\install.ps1
```

سيطلب منك برنامج التثبيت اختيار ملف تعريف (Profile)؛ يقوم الملف الافتراضي بتثبيت حوالي 80 حزمة برمجية. سيعاد تشغيل الجهاز عدة مرات أثناء التثبيت.

## ملفات التعريف (Profiles)

- **Default** — الحزمة الكاملة للهندسة العكسية وتحليل البرمجيات الخبيثة.
- **Basic** — مجموعة أدوات أساسية ومحدودة.
- **Custom** — تتيح لك اختيار حزم محددة من ملف إعدادات JSON.

## تصنيفات الأدوات المثبتة (Categories of installed tools)

| التصنيف | أمثلة |
|----------|----------|
| التفكيك وإعادة البناء (Disassembly / decompilation) | IDA Free, Ghidra, Cutter, dnSpyEx, jadx, dex2jar |
| المنقحات (Debuggers) | x64dbg, x32dbg, WinDbg, OllyDbg |
| التحليل الديناميكي (Dynamic analysis) | Process Hacker, Process Monitor, Process Explorer, API Monitor, FakeNet-NG, INetSim |
| الأدوات الإحصائية (Static utilities) | YARA, capa, FLOSS, PE-bear, PEStudio, BinText, CFF Explorer, ExeInfoPE |
| التحقيق الجنائي الرقمي (Forensics) | Volatility 3, Plaso, KAPE |
| الشبكات (Networking) | Wireshark, Burp Free, mitmproxy, Fiddler |
| المكتبيات والبرمجة (Office / scripting) | oledump, olevba, py2exe, dnlib, Python 3 |
| فحص النصوص والبيانات (Hex / strings / parsers) | HxD, 010 Editor (trial), strings.exe, FLOSS |
| تجاوز الحماية من التنقيح (Anti-anti-debug) | ScyllaHide, TitanHide, x64dbg plugins |
| أدوات YARA | yarGen, yaraify, yara-validator |
| جلب العينات (Sample retrieval) | DC3-MWCP, MalwareBazaar tooling |

## استراتيجية اللقطات الفورية (Snapshot Strategy)

- **اللقطة 1 (Snapshot 1)** — نظام Windows نظيف ومثبت حديثاً.
- **اللقطة 2 (Snapshot 2)** — بعد تثبيت FLARE-VM (حالة "الاستعداد" الخاصة بك).
- **اللقطة 3 (Snapshot 3)** — عند تحليل عينة معينة؛ يتم العودة إلى اللقطة 2 بين كل عينة وأخرى.

## خيارات الشبكة (Networking choices)

| الوضع | الاستخدام |
|------|-----|
| Host-only | لا يوجد اتصال بالإنترنت؛ يستخدم مع FakeNet-NG |
| تشغيل FakeNet-NG | يتم اعتراض كل حركة المرور، مع ردود وهمية لخدمات DNS / HTTP / SSL |
| INetSim | جهاز افتراضي Linux في نفس الشبكة لمحاكاة SMTP, DNS, HTTP، إلخ |
| NAT (إنترنت حقيقي) | **خطير** — يستخدم فقط للعينات التي تم التأكد من سلامتها |

```
[ FLARE-VM (شبكة معزولة Host-only) ]
        ↕
[ Linux REMnux VM (INetSim, FakeDNS, mitmproxy) ]
```

يعد نظام REMnux مكملاً لـ FLARE-VM من جانب نظام Linux.

## سير العمل لتحليل عينة (Malware Workflow)

1. العودة إلى اللقطة 2 (Snapshot 2).
2. تشغيل الجهاز مع إيقاف الإنترنت.
3. تشغيل FakeNet-NG: لمحاكاة استجابات الشبكة والتقاط حركة المرور.
4. وضع العينة في الجهاز ← تشغيلها.
5. مراقبة Process Hacker لمتابعة العمليات التي تم إنشاؤها واتصالات الشبكة.
6. استخدام فلاتر Procmon مثل `Process Name is sample.exe` لمراقبة النشاط.
7. استخدام Strings و PEStudio لاستخراج مؤشرات الاختراق (IOCs) الإحصائية.
8. بعد 5-15 دقيقة من التحليل التفاعلي ← خذ لقطة للتوثيق والأدلة.
9. البدء في التحليل العميق باستخدام IDA أو Ghidra.

## تشخيص المشاكل (Bad output / Fixes)

| العرض | الحل |
|---------|-----|
| فشل برنامج التثبيت | فشل `boxstarter` في منتصف العملية — أعد التشغيل؛ معظم الحزم ستتخطى التثبيت إذا كانت موجودة |
| Defender يعيد تفعيل نفسه | عبر Group Policy: قم بتعطيل الحماية الفورية (Real-time protection) |
| فقدان بعض الحزم | تأكد من ملف تعريف التثبيت؛ أو ثبتها يدوياً باستخدام `cup <pkg>` (Chocolatey) |
| بطء في الأداء | خصص 8 جيجابايت RAM على الأقل و 4 معالجات؛ وعطل التثبيت التلقائي لتعريفات VMware |

## منظور المدافع والمحلل (RE Perspective)

تعتبر FLARE-VM البيئة المعيارية للمختبرات. بدمجها مع REMnux، تحصل على مختبر متكامل لتحليل البرمجيات الخبيثة في لقطتين فوريتين فقط.

للاستخدام المؤسسي:
- اعزل شبكة التحليل (Air-gap) عن الشبكة المؤسسية.
- قيد الوصول الخارجي إلى `update.flare-vm.com` فقط أثناء التثبيت.
- امسح العينات بعد التحليل أو احتفظ بها في وحدات تخزين مشفرة لكل قضية.

## الأمن العملياتي (OPSEC)

- **يجب ألا** تلمس آلة FLARE-VM هويتك المؤسسية. استخدم حساباً محلياً جديداً؛ ولا تسجل الدخول أبداً إلى Microsoft / OneDrive / Office.
- خذ لقطة فورية قبل كل تشغيل؛ واستعدها بعد الانتهاء — افترض دائماً أن العينة تعبث بكل شيء في النظام.
- العينات الحساسة ← لا ترفعها أبداً إلى الخدمات العامة من داخل FLARE-VM.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **REMnux** | توزيعة Linux لتحليل البرمجيات الخبيثة (مكملة) |
| **CommandoVM** | توزيعة Mandiant لنظام Windows الموجهة لاختبار الاختراق |
| **SIFT Workstation** | توزيعة Linux موجهة للتحقيق الجنائي الرقمي |
| **WinFE** | بيئة Windows قابلة للإقلاع للتحقيق الجنائي |
| **DetectionLab** | مختبر **لاختبار** أنظمة الكشف وليس لتحليل العينات |
