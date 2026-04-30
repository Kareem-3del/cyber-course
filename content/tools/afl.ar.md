# دليل AFL++ — الدليل الكامل للمختصين

يُعد `AFL++` (American Fuzzy Lop, plus-plus fork) المعيار الذهبي في أدوات التقصي النشط الموجه بالتغطية (coverage-guided fuzzer). تعمل الأداة على توليد مدخلات متحورة (Mutated inputs)، وتشغيل الهدف، ومراقبة تغطية الفروع (branch coverage) عبر التجهيز البرمجي (instrumentation)، مع الاحتفاظ بالمدخلات التي تكتشف مسارات برمجية جديدة. وقد ساهمت هذه الأداة في اكتشاف المئات من الثغرات الأمنية المصنفة (CVEs).

## التثبيت (Install)

```terminal
# توزيعات Ubuntu / Debian
git clone https://github.com/AFLplusplus/AFLplusplus
cd AFLplusplus
make distrib
sudo make install
afl-fuzz -h
```

أو عبر `brew install afl-fuzz` لمستخدمي نظام macOS (نسخة أقدم قليلاً).

## المفاهيم الأساسية (Concepts)

- **التجهيز البرمجي (Instrumentation)** — عند كل فرع شرطي في الكود، يقوم الهدف بالكتابة في خارطة التغطية (coverage bitmap).
- **المُحوّر (Mutator)** — يقوم بعمليات قلب البتات (bit-flips)، أو البايتات، أو دمج المدخلات من الطابور، أو استخدام القواميس، سواء بشكل حتمي أو عشوائي (havoc).
- **خادم التفرع (Fork-server)** — تنفيذ عملية `fork()` مرة واحدة بعد تهيئة الهدف؛ لتعيد المدخلات اللاحقة استخدام العملية "الدافئة" توفيراً للموارد.
- **الوضع المستمر (Persistent mode)** — تكرار تشغيل المشغل (harness) داخل حلقة؛ مما يوفر سرعة تفوق خادم التفرع بمراحل.

## بناء هدف مجهز برمجياً (Building an instrumented target)

```terminal
# ملفات ثنائية C / C++
CC=afl-cc CXX=afl-c++ ./configure
make

# طريقة سريعة ومباشرة
afl-cc -O2 -o vuln vuln.c

# توليد بناء مجهز بالمصححات (Sanitizer-instrumented)
AFL_USE_ASAN=1 afl-cc -o vuln_asan vuln.c
```

يقوم `afl-cc` باختيار أفضل واجهة خلفية للتجهيز (LTO, GCC-plugin, classic) تلقائياً. بالنسبة للملفات الثنائية مغلقة المصدر، استخدم **وضع QEMU**:

```terminal
afl-fuzz -Q -i in -o out -- ./closed_binary @@
```

أو **وضع Frida** للتقصي النشط عبر المنصات المختلفة للملفات الثنائية.

## المشغل (Harness)

للتقصي النشط للمكتبات، يجب كتابة مشغل بسيط:

```c
// مشغل بأسلوب libfuzzer؛ يدعم AFL++ نفس نقطة الدخول
int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    parse_input(data, size);
    return 0;
}
```

البناء:

```terminal
afl-clang-fast -fsanitize=address -o harness harness.c -lyourlib
```

## التشغيل (Run)

```terminal
mkdir corpus
echo "AAA" > corpus/seed1
afl-fuzz -i corpus -o findings -- ./vuln @@
```

يتم استبدال `@@` بمسار ملف المدخلات (أو `-` للمدخلات القياسية stdin).

## شرح شاشة الحالة (Status screen meaning)

```
process timing                              overall results
  run time: 0 days, 0 hrs, 12 min, 4 sec    cycles done: 1
  last new path: 0 days, 0 hrs, 0 min, 23 sec    total paths: 412
  last uniq crash: 0 days, 0 hrs, 11 min, 1 sec    uniq crashes: 3
  last uniq hang: none seen yet             uniq hangs: 0

cycle progress                              map coverage
  now processing: 19 (4.61%)                  map density: 1.84% / 7.36%
                                            count coverage: 1.83 bits/tuple

stage progress                              findings in depth
  now trying: havoc                          favored paths: 102 (24.76%)
  stage execs: 36/256 (14.06%)               new edges on: 84 (20.39%)
                                            total crashes: 3 (3 unique)
```

مؤشرات يجب مراقبتها:
- عداد **المسارات (paths)**: تزايده يعني أن عملية الاستكشاف نشطة.
- **الانهيارات الفريدة (uniq crashes)** > 0: تتطلب التحليل والفرز (Triage).
- **الاستقرار (stability)**: بالنسبة للأهداف غير الحتمية، يشير انخفاض الاستقرار إلى مشاكل في التزامن (concurrency).

## تحليل الانهيارات (Triage — what to do with crashes)

`out/default/crashes/id:000000,sig:11,...` — يمثل كل ملف حالة انهيار. لإعادة التشغيل:

```terminal
./vuln_asan crashes/id:000000,*
```

مخرجات ASAN تحدد سطر الكود المسبب للثغرة. بعد ذلك، قم بتقليص حجم المدخلات:

```terminal
afl-tmin -i crash.bin -o crash.min -- ./vuln @@
```

أداة `afl-tmin` تقوم بتقليص المدخلات مع الحفاظ على نفس بصمة الانهيار.

## التوازي (Parallelization)

```terminal
afl-fuzz -i in -o sync -M master -- ./vuln @@ &
for i in {1..7}; do afl-fuzz -i in -o sync -S secondary$i -- ./vuln @@ & done
afl-whatsup sync/
afl-plot sync/master/ plot/
```

تقوم النسخة الأساسية (Master) والنسخ الثانوية (Secondaries) بمشاركة الاكتشافات عبر مجلد `sync/`. استخدم خيارات `-l 23 -L 0` لتطبيق استراتيجيات جدولة الطاقة على النسخ الثانوية.

## القواميس (Dictionaries)

```terminal
afl-fuzz -x dict.txt -i in -o out -- ./vuln @@
```

زوّد الأداة بالرموز (tokens) الخاصة بتنسيق معين (مثل `http_methods.dict` أو `xml.dict`) — سيفضل AFL++ عمليات التحور التي تتضمن هذه الرموز.

## المحورات المخصصة (Custom mutators)

للبروتوكولات أو تنسيقات الملفات المعقدة، يمكن كتابة محورات بلغة Python أو Rust (`AFL_CUSTOM_MUTATOR_LIBRARY`). تتوفر أمثلة في المستودع لتنسيقات PNG وMP4 وغيرها.

## معالجة الأخطاء (Bad output / fixes)

| العرض | الحل |
|---------|-----|
| أخطاء `Spurious /tmp/.afl_*` | `sudo sysctl kernel.core_pattern=core` |
| وجود Pipe في بداية '@@' | استخدم `<` أو `cat` للمدخلات القياسية بدلاً من `@@` |
| التغطية عالقة عند أقل من 1% | بذور (seeds) سيئة؛ استخدم `afl-cmin` للتقليص أو استخدم مدخلات حقيقية |
| الانهيارات مكررة لبعضها البعض | استخدم `afl-cmin -C` للتصنيف حسب البصمة |
| انهيارات وضع QEMU | قم بالبناء باستخدام `qemu-imager`؛ بعض التعليمات الجديدة غير مدعومة |

## منظور المدافع (Defender perspective)

يتم تشغيل AFL++ على الكود الخاص بك (أو كود المورد في حالة وجود تصريح). حالات الاستخدام:

- التقصي النشط قبل الدمج (Pre-merge fuzzing) في بيئات CI للمحللات (parsers) وبروتوكولات الشبكة.
- التقصي النشط المستمر في مشاريع مثل OSS-Fuzz / ClusterFuzzLite.
- طابور تحليل الثغرات (Triage queue) ← إصلاح سريع ← إعادة التقصي.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **libFuzzer** | تقصي نشط داخل العملية في LLVM (أسرع في الربط) |
| **honggfuzz** | بديل من Google؛ يعتمد استراتيجيات متعددة |
| **syzkaller** | مخصص لتقصي نواة Linux (Kernel) |
| **boofuzz** | مخصص لبروتوكولات الشبكة |
| **OSS-Fuzz / ClusterFuzzLite** | منصات مستضافة للتقصي النشط للمشاريع مفتوحة المصدر |
| **Jazzer** | للتقصي النشط في بيئة Java |
| **Atheris** | للتقصي النشط في بيئة Python |
| **cargo-fuzz** | للتقصي النشط في بيئة Rust |
