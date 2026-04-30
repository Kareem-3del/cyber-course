# دليل YARA الكامل — الفحص والتعرف على الأنماط

تُعد لغة `YARA` المعيار العالمي لمحللي البرمجيات الخبيثة (Malware Analysts) في مطابقة الأنماط (Pattern Matching). تتيح القواعد كتابة وصف دقيق لما تبدو عليه العينة (سلاسل نصية، تسلسل تعليمات برمجية "Opcodes"، أو ترويسات "Headers")؛ ثم يقوم محرك YARA بمطابقتها مع الملفات، العمليات قيد التشغيل (Processes)، أو لقطات الذاكرة (Memory Dumps).

## التثبيت (Install)

```terminal
apt install yara
brew install yara
pip install yara-python    # مكتبة بايثون للتعامل مع YARA
```

## هيكلية القواعد — الحد الأدنى المطلوب (Syntax)

```yara
rule example {
    meta:
        description = "تحديد حمولة برمجية خبيثة محددة"
        author      = "المحلل المحترف"
        date        = "2026-04-30"
        hash        = "5e5a04..."
    strings:
        $a = "evilpattern"
        $b = { 6A 40 68 00 30 00 00 6A ?? 8B }    // تمثيل هيكسي (Hex) مع رموز بديلة (Wildcards)
        $c = /https:\/\/evil\d+\.example\.com/   // تعبير نمطي (Regex)
    condition:
        any of them
}
```

## معاملات الشروط (Condition Operators)

| المعامل | المعنى |
|----|---------|
| `$a` | صحيح إذا تمت مطابقة السلسلة `$a` |
| `any of them` / `all of them` | عمليات منطقية (Logical) |
| `2 of ($a, $b, $c)` | مطابقة N من السلاسل على الأقل |
| `for any i in (0..pe.number_of_sections)` | الحلقات التكرارية (Loops) |
| `filesize` | حجم الملف بالبايت |
| `entrypoint` | العنوان الافتراضي لنقطة الدخول (EP) في ملفات PE |
| `uint16(0)` | قراءة بايت عند إزاحة محددة (Offset) |
| `pe.imports("kernel32.dll", "VirtualAlloc")` | وظيفة من وحدة PE (تتطلب `import "pe"`) |
| `math.entropy(0, filesize)` | وحدة الرياضيات — حساب درجة العشوائية (Entropy) |
| `hash.sha256(0, filesize)` | وحدة التجزئة — حساب Hash |

## الوحدات البرمجية (Modules)

```yara
import "pe"
import "elf"
import "math"
import "hash"
import "magic"
import "cuckoo"          // مخرجات التحليل الديناميكي
import "vt"              // إضافات قواعد VirusTotal
```

```yara
import "pe"
rule packed_pe {
    condition:
        pe.is_pe and
        for any i in (0..pe.number_of_sections - 1):
            (math.entropy(pe.sections[i].raw_data_offset, pe.sections[i].raw_data_size) > 7.5)
}
```

## استخدام واجهة السطر البرمجي (CLI)

```terminal
yara rule.yar suspect.exe
yara -r rules/ /path/to/scan      # فحص المجلدات بشكل تكراري (Recursive)
yara -p 8 rule.yar samples/       # استخدام 8 خيوط معالجة (Threads)
yara -m rule.yar f                # طباعة البيانات الوصفية (Meta) للقاعدة
yara -s rule.yar f                # طباعة السلاسل المتطابقة مع الإزاحات (Offsets)
yara -i CVE-2024- rule.yar f      # تصفية أسماء القواعد بناءً على نص معين
yara -t high rule.yar f           # تشغيل القواعد المصنفة بـ 'high' فقط
yara -d 'filesize=1024' rule.yar f  # تعريف متغيرات خارجية
yara -P 12345 rule.yar             # فحص ذاكرة عملية محددة عبر PID
```

## سير العمل (Workflows)

### البحث عبر الشبكة (بواسطة Velociraptor)

```vql
SELECT * FROM Artifact.Generic.Detection.Yara.Glob(YaraRule="rule x { strings: $a = \"AAA\" condition: $a }",
                                                    Glob="C:\\Users\\*\\AppData\\**\\*.exe")
```

### تأليف قاعدة لعائلة برمجيات خبيثة محددة

```yara
rule emotet_v25 {
    meta:
        family = "Emotet"
        version = "v2.5"
        author = "your_team"
        sample_hash = "5e5a04..."
    strings:
        $cfg1 = { 81 ?? ?? ?? 00 00 8B C8 81 ?? ?? ?? 00 00 03 C1 }
        $url  = "/wp-includes/" wide ascii
        $reg  = "Software\\Microsoft\\Windows\\CurrentVersion\\Run\\OneDriveUpdater" wide
    condition:
        uint16(0) == 0x5A4D and 2 of them and filesize < 5MB
}
```

### التوليد التلقائي للقواعد (Rule Auto-generation)

```terminal
# أداة yarGen — تستخرج أنماط السلاسل وتمنحها درجات تقييم
python3 yarGen.py -m samples/ -o autorule.yar --score-rule
```

تنتج أداة `yarGen` مسودة أولية جيدة؛ يجب بعدها تنقية السلاسل المسببة للضوضاء (مثل كود Microsoft القياسي).

### استخدام Yara على الذاكرة

```terminal
# باستخدام Volatility 3
vol -f mem.raw yarascan.yarascan --yara-rules /opt/rules/

# فحص عملية نشطة مباشرة
yara -P 1234 rule.yar
```

## تحليل المخرجات (Output)

### مخرجات ناجحة (Good Output)
```
emotet_v25 suspect.bin
[meta:family="Emotet"]
0x10a4:$url: /wp-includes/
0x12d8:$cfg1: 81 04 06 00 00 8B C8 81 04 06 00 00 03 C1
```
استخدام خيار `-s` مع الإزاحات يتيح لك التحقق من كل مطابقة داخل المحرر الهيكسي (Hex Viewer).

### معالجة المشاكل (Bad Output / Fixes)

| العرض | الحل |
|---------|-----|
| `0 matches` على عينة معروفة | السلاسل قد تكون مشفرة؛ أضف معدلات `wide ascii xor` |
| معدل تنبيهات خاطئة (False-Positives) عالٍ | السلاسل عامة جداً؛ أضف شروطاً هيكلية (`pe.imports`, entropy) |
| خطأ `wrong section` | فقدان استيراد الوحدة — مثل `import "pe"` |
| بطء عند فحص كمية ضخمة من البيانات | استخدم `-p N` للتعددية؛ أو انتقل لمحرك yara-x الأسرع بـ 5-10 مرات |

## yara-x — الجيل القادم

```terminal
brew install yara-x
yr scan rules.yar samples/
```
أسرع بـ 5-10 مرات، رسائل خطأ أوضح، وقواعد عصرية (متوافقة غالباً مع الإصدار القديم). يتزايد تبنيها في 2025-2026.

## منظور الدفاع والاستجابة (Defender / IR)

تعتبر YARA هي **اللغة المشتركة** (Lingua Franca) لتبادل مؤشرات الاختراق (IOCs) للبرمجيات الخبيثة:

- **MalwareBazaar / VirusTotal** — تقبل كلاهما قواعد YARA وتفعلها عند رفع العينات.
- **MISP** — يتم إرفاق القواعد مع أحداث التهديدات (Threat Events).
- **CrowdStrike / SentinelOne / Defender** — تدعم دمج قواعد مخصصة.
- **Loki** / **Thor-Lite** — ماسحات YARA تعتمد على المضيف (Host-based).

الضبط الدقيق (Tuning) هو كل شيء؛ القاعدة التي ترصد أثر اختراق APT حقيقي مرة واحدة في السنة لا تقدر بثمن، بينما القاعدة التي تطلق تنبيهات مستمرة على البرامج الشرعية هي مجرد ضوضاء.

## نصائح عملياتية للأمان (OPSEC) والتأليف

- حدد نطاق الفحص عبر حجم الملف (`filesize > 50KB and filesize < 4MB`) لتجنب فحص كل الملفات النصية غير الضرورية.
- استخدم فحص نقطة الدخول `pe.entry_point` لتجاوز الوثائق والصور.
- للقواعد المشتركة، أضف تصنيف `tlp:white|green|amber|red` في البيانات الوصفية لتحديد نطاق المشاركة المسموح به.
- احتفظ بمجموعة اختبار تضم عينات "يجب أن تطابق" وأخرى "لا يجب أن تطابق" — وأعد تشغيل الاختبار عند كل تعديل للقاعدة.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **yara-x** | إعادة تنفيذ حديثة ومطورة للمحرك |
| **ClamAV** | برنامج مكافحة فيروسات يدعم YARA |
| **Yara Hunter** | واجهة رسومية لتأليف القواعد |
| **capa** | قواعد لتحديد قدرات البرمجيات (تستخدم بناءً مختلفاً) |
| **Sigma** | المكافئ لـ YARA ولكن لفحص السجلات (Logs) |
| **MISP** | منصة معلومات التهديدات التي تستضيف القواعد |
