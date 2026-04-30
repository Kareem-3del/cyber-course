# Volatility 3 — الدليل الكامل

تُعد Volatility الإطار البرمجي الأبرز مفتوح المصدر للتحليل الجنائي للذاكرة (Memory Forensics). تقوم الأداة بقراءة صور الذاكرة (RAM dumps) وإعادة بناء حالة نظام التشغيل — بما يشمل العمليات (Processes)، والاتصالات الشبكية، ونماذج النواة (Kernel Modules)، وخلايا السجل (Registry Hives)، ومؤشرات البرمجيات الخبيثة (Malware Indicators). إصدار Volatility 3 هو إعادة كتابة كاملة للمشروع بلغة Python 3 وهو الإصدار المعتمد حالياً.

## التثبيت (Install)

```terminal
pipx install volatility3
git clone https://github.com/volatilityfoundation/volatility3 && cd volatility3 && pip install -e .
```

قد تتطلب ملفات الرموز (Symbol files) لأنظمة Linux / macOS إعداداً إضافياً في المسار: `volatility3/symbols/`.

## الاستحواذ على الذاكرة (Memory Acquisition)

| نظام التشغيل | الأداة المقترحة |
|----|------|
| Windows | `WinPmem`, `Magnet RAM Capture`, `DumpIt`, `Belkasoft Live RAM Capturer` |
| Linux | `LiME`, `avml`, `Microsoft AVML` |
| macOS | `osxpmem` |
| Hypervisor | VM snapshot (`.vmem`, `.vmsn`), Hyper-V `.vmrs` |

```terminal
# مثال لنظام Linux
sudo avml /tmp/host.mem
# لنظام Windows
.\winpmem-3.3.exe -o image.raw
```

## التشغيل الأساسي (Basic Invocation)

```terminal
vol -f image.raw windows.info
vol -f image.raw windows.pslist
vol -f image.raw -r jsonl windows.pslist > pslist.jsonl
```

يسمح الخيار `-r` باختيار صيغة المخرجات (Renderer): `quick`, `pretty`, `csv`, `jsonl`, `json`, `none`.

## الأعلام العامة (Universal Flags)

| العلم (Flag) | الغرض |
|------|---------|
| `-f <file>` | مسار صورة الذاكرة |
| `-q` | الوضع الصامت (Quiet) |
| `-v` / `-vv` | وضع التفصيل (Verbose) |
| `-r <renderer>` | صيغة المخرجات |
| `-o <dir>` | دليل العمل / المخرجات |
| `--save-config` | حفظ إعدادات الإضافة في ملف تكوين |
| `--write` | كتابة الآثار المستخرجة (Artifacts) على القرص |
| `--cache-path` | تخزين التحليل مؤقتاً لتسريع عمليات التشغيل اللاحقة |

## إضافات Windows (أدوات العمل الأساسية)

| الإضافة (Plugin) | الوظيفة |
|--------|--------------|
| `windows.info` | معلومات النظام، الإصدار (Build)، والملف التعريفي (Profile) |
| `windows.pslist` | العمليات الجارية (التسلسل الهرمي: أب/أبناء) |
| `windows.psscan` | العمليات المخفية (مسح الذاكرة مقابل تتبع القائمة المرتبطة) |
| `windows.pstree` | عرض العمليات كشجرة ASCII |
| `windows.cmdline` | أوامر التشغيل (Command Lines) |
| `windows.netscan` | الاتصالات النشطة + منافذ الاستماع |
| `windows.netstat` | نفس البيانات السابقة بأسلوب تتبع مختلف |
| `windows.dlllist --pid 1234` | مكتبات DLL المحملة في عملية معينة |
| `windows.handles --pid 1234` | المقابض المفتوحة (الملفات، مفاتيح السجل، Mutexes) |
| `windows.malfind` | البحث عن الشيفرات المحقونة (مناطق الذاكرة الخاصة RWX) |
| `windows.ldrmodules` | تحديد DLLs غير الموجودة في قوائم المحمل الثلاث (مؤشر حقن) |
| `windows.svcscan` | الخدمات (Services) |
| `windows.driverscan` / `windows.modules` | نماذج النواة (Kernel Modules) والتعريفات |
| `windows.callbacks` | استدعاءات إشعارات النواة (كشف الـ Rootkits) |
| `windows.hashdump` | استخراج قيم الـ NT hashes المحلية من ملف SAM |
| `windows.lsadump` | أسرار LSA |
| `windows.cachedump` | بيانات الاعتماد المخزنة للنطاق (Domain Creds) |
| `windows.registry.printkey --key '...'` | قراءة مفتاح سجل معين |
| `windows.registry.userassist` | سجل تشغيل البرامج للمستخدم (UserAssist) |
| `windows.registry.shellbags` | تاريخ الوصول إلى المجلدات (Shellbags) |
| `windows.filescan` | البحث عن الملفات الموجودة في الذاكرة |
| `windows.dumpfiles --pid 1234 --dump-dir out/` | استخراج الملفات من الذاكرة |
| `windows.memmap --pid 1234 --dump` | تفريغ ذاكرة عملية كاملة |

## إضافات Linux

| الإضافة | الغرض |
|--------|---------|
| `linux.bash` | استعادة تاريخ الأوامر من ذاكرة Bash |
| `linux.psaux` / `linux.pslist` | العمليات |
| `linux.proc.Maps` | خرائط الذاكرة لكل عملية |
| `linux.elfs` | ملفات ELF المحملة (صيد الـ Rootkits) |
| `linux.lsmod` | نماذج النواة |
| `linux.tty_check` | كشف الـ Rootkits التي تعترض المحطات الطرفية (TTY) |
| `linux.malfind` | الذاكرة المحقونة |
| `linux.check_syscall` / `linux.check_idt` | فحص اعتراض نداءات النظام (Syscalls) أو المقاطعات (Interrupts) |

## إضافات Mac

| الإضافة | الغرض |
|--------|---------|
| `mac.pslist` / `mac.pstree` | العمليات |
| `mac.bash` | تاريخ الأوامر |
| `mac.netstat` | الاتصالات الشبكية |
| `mac.list_files` | مقابض الملفات المفتوحة |

## سير العمل (Workflows)

### تدفق عملية الفرز الأولي (Triage flow)

```terminal
vol -f mem.raw windows.info > info.txt
vol -f mem.raw windows.pslist > pslist.txt
vol -f mem.raw windows.pstree > pstree.txt
vol -f mem.raw windows.cmdline > cmdline.txt
vol -f mem.raw windows.netscan > netscan.txt
vol -f mem.raw windows.svcscan > svcscan.txt
vol -f mem.raw windows.malfind > malfind.txt
```

مقارنة مخرجات `pslist` مع `psscan` — أي عمليات تظهر في psscan فقط هي غالباً عمليات مخفية.

### استخراج ملف برمجية خبيثة مشتبه به

```terminal
vol -f mem.raw windows.dlllist --pid 4444 > dll-4444.txt
vol -f mem.raw windows.dumpfiles --pid 4444 --dump-dir out/
file out/file.4444.*
```

### استعادة هاشات NT وأسرار LSA

```terminal
vol -f mem.raw windows.hashdump
vol -f mem.raw windows.lsadump
vol -f mem.raw windows.cachedump
```

يمكن استخدام الهاشات المستخرجة لهجمات (Pass-the-Hash) أو كسرها باستخدام `hashcat -m 1000`.

### استعادة تاريخ Bash (نظام Linux)

```terminal
vol -f mem.lime linux.bash | head -200
```

غالباً ما تظهر الأوامر التي نفذها المهاجم في جلسة تفاعلية، حتى لو تم مسح ملف `~/.bash_history`.

## مشاكل المخرجات وحلولها

| العرض | الحل |
|---------|-----|
| `Unsatisfied requirement primary.layer_name.WindowsRegistry` | الصورة خاطئة أو تالفة؛ تحقق من الهاش؛ استخدم `windows.info` أولاً |
| Linux: `Symbol file not found` | قم ببناء ملف الرموز باستخدام `dwarf2json` من حزمة تصحيح النواة (Kernel debug pkg) |
| `windows.netscan` فارغ | تم التقاط الذاكرة قبل بدء الشبكة، أو أن البيانات تم ترحيلها (Paged out) |
| الإضافة بطيئة جداً | استخدم `--cache-path` لإعادة استخدام نتائج التحليل السابقة |
| الأداة تقول "image is shifted" | حجم الصفحة خاطئ أو الذاكرة مشفرة — جرب إضافات بديلة |

## منظور المدافع (Defender's perspective)

التحليل الجنائي للذاكرة هو **الكلمة الفصل** فيما كان يحدث فعلياً على النظام. تحاول أساليب المهاجمين الحديثة تجنب ترك آثار على القرص الصلب، لذا تظل الذاكرة هي المصدر الوحيد للحقيقة المطلقة (Ground Truth).

أنماط للبحث عنها:
- نتائج `windows.malfind` في ملفات غير موقعة (Unsigned) تشير بوضوح إلى عملية حقن.
- عملية بدون عملية أب في `pstree` (Orphan) تُعد مشبوهة ما لم تكن عملية نظام معروفة (مثل wininit).
- تحميل `comsvcs.dll` داخل rundll32 مع مقبض نشط لـ LSASS — يشير إلى محاولة استخراج كلمات مرور (Mimikatz-style).
- اتصالات بنطاقات تم تسجيلها حديثاً (Recently-registered domains) في `netscan`.

## الأمن العملياتي (OPSEC)

- يتم تشغيل Volatility على جهاز المحلل، لذا لا يوجد خطر من اكتشافه في جهة الهدف.
- صور الذاكرة تحتوي على **كل شيء** سري كان موجوداً في الذاكرة وقت الالتقاط — يجب تشفيرها عند التخزين ومعاملتها كبيانات عالية السرية.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **MemProcFS** | تركيب الذاكرة كنظام ملفات؛ وتتكامل مع Vol3 |
| **Rekall** | نسخة مشتقة من Volatility (أقل نشاطاً حالياً) |
| **PowerForensics / KAPE** | أدوات مكملة للتحليل من جهة القرص الصلب |
| **Bulk Extractor** | استخراج الأنماط (بطاقات الائتمان، الإيميلات) من الذاكرة |
| **Yara on memory** | استخدام قواعد `yara` على `memory.raw` للبحث عن مؤشرات الاختراق (IOCs) |
