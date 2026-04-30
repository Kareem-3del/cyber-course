# ffuf — الدليل الشامل للاحتراف

تُعد أداة `ffuf` (اختصار لـ Fuzz Faster U Fool) من أسرع أدوات فحص الويب (HTTP Fuzzing) المكتوبة بلغة Go. تعتمد فكرتها على استبدال كلمة مفتاحية (Keyword) بقائمة كلمات (Wordlist) في أي جزء من طلب HTTP — سواء في الرابط (URL)، الترويسات (Headers)، جسم الطلب (Body)، أو المعاملات (Parameters). تُستخدم الأداة بشكل أساسي لاكتشاف المجلدات، المعاملات المخفية، تعداد المضيفات الافتراضية (V-Host Enumeration)، وهجمات القوة الغاشمة (Brute-force).

## التثبيت (Install)

```terminal
go install github.com/ffuf/ffuf/v2@latest
brew install ffuf
```

## نموذج الاستبدال (Substitution model)

تستخدم الأداة الكلمة المفتاحية `FUZZ` كنقطة استبدال. يمكن استخدام نقاط متعددة وتسميتها مثل `W1`, `W2` وغيرها، ويتم ربط كل قائمة كلمات بمفتاحها عبر المعامل `-w`.

```terminal
# فحص مسار في الرابط (One-place fuzz)
ffuf -u https://target.com/FUZZ -w wordlist.txt

# فحص متعدد (اسم مستخدم وكلمة مرور)
ffuf -u https://target.com/login \
  -X POST -d 'user=W1&pass=W2' \
  -w users.txt:W1 -w pwds.txt:W2 \
  -mode clusterbomb
```

## المعاملات الأساسية (Core parameters)

### المدخلات (Inputs)

| الوسم | الغرض |
|------|---------|
| `-u <url>` | الرابط المستهدف مع مكان `FUZZ` |
| `-w <file>:<KEYWORD>` | مسار قائمة الكلمات مع الكلمة المفتاحية |
| `-X <method>` | طريقة طلب HTTP (مثل POST, PUT) |
| `-d <body>` | محتوى جسم الطلب |
| `-H <header>` | إضافة ترويسة (`-H "Cookie: x=y"`) |
| `-b <cookie>` | اختصار لإضافة الكوكيز |
| `-mode <m>` | نمط الهجوم: `clusterbomb` (افتراضي), `pitchfork`, `sniper` |
| `-request <file>` | استخدام طلب خام محفوظ (مثلاً من Burp Suite) |

### المطابقة والتصفية (Filtering / matching)

| الوسم | المطابقة (Match) | التصفية (Filter) |
|------|-------|---------------|
| `-mc <codes>` | رموز الحالة (Status codes) | `-fc` |
| `-ml <int>` | عدد الأسطر | `-fl` |
| `-mw <int>` | عدد الكلمات | `-fw` |
| `-ms <int>` | الحجم بالبايت | `-fs` |
| `-mr <regex>` | تعبير نمطي في الاستجابة | `-fr` |
| `-ac` | المعايرة التلقائية (Auto-calibrate) لتصفية الضجيج | — |

تُعد ميزة `-ac` من أقوى ميزات الأداة؛ حيث ترسل `ffuf` طلبات وهمية (مثل `random123`) لتعلم شكل الاستجابة الافتراضية للصفحات غير الموجودة، ثم تقوم بتصفية النتائج المشابهة تلقائياً.

### السرعة والأداء (Speed)

| الوسم | الغرض |
|------|---------|
| `-t <int>` | عدد الخيوط (Threads) (الافتراضي 40) |
| `-rate <int>` | تحديد عدد الطلبات في الثانية (RPS) |
| `-p <delay>` | تأخير عشوائي بين الطلبات (`-p 0.1-2.0`) |
| `-recursion` | الفحص المتداخل للمجلدات المكتشفة |
| `-recursion-depth <n>` | أقصى عمق للفحص المتداخل |

### المخرجات (Output)

| الوسم | الغرض |
|------|---------|
| `-o <file>` | مسار ملف المخرجات |
| `-of <fmt>` | تنسيق الملف: `json`, `csv`, `html`, `md` |
| `-s` | الوضع الصامت (عرض النتائج المطابقة فقط) |
| `-v` | الوضع التفصيلي (Verbose) |
| `-c` | تفعيل الألوان في السطر البرمجي |

## سيناريوهات العمل (Workflows)

### اكتشاف المجلدات (Directory busting)

```terminal
ffuf -u https://target.com/FUZZ \
  -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -mc 200,204,301,302,307,401,403 -ac -recursion -recursion-depth 2 \
  -o dirs.json -of json
```

### البحث عن الملفات الحساسة (`.env`, `.git/config`)

```terminal
ffuf -u https://target.com/FUZZ \
  -w /usr/share/seclists/Discovery/Web-Content/raft-large-files.txt \
  -mc 200 -ac -t 50
```

### تعداد المضيفات الافتراضية (Virtual host enumeration)

```terminal
ffuf -u https://target.com/ -H "Host: FUZZ.target.com" \
  -w subs.txt -ac
# نستخدم -ac لتجاهل الاستجابات الافتراضية للخادم
```

### اكتشاف معاملات GET (Parameter discovery)

```terminal
ffuf -u "https://target.com/api?FUZZ=test" \
  -w params.txt -ac -mc all
```

### هجوم القوة الغاشمة على تسجيل الدخول (Login brute)

```terminal
ffuf -u https://target.com/login \
  -X POST -d 'username=admin&password=FUZZ' \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -w rockyou.txt -fr "Invalid credentials" -t 20 -p 0.05-0.2
```

## تحليل المخرجات والأخطاء

| العرض | السبب | الحل |
|---------|-------|-----|
| كل الكلمات تعطي "200 OK" | الخادم يعيد استجابة موحدة (Wildcard) | استخدم `-ac` للمعايرة التلقائية |
| الأداة بطيئة جداً | بطء الخادم أو استخدام `-p` مرتفع | اضبط `-rate` و `-t`؛ تأكد من القرب الجغرافي من الهدف |
| الخادم بدأ بحظر الطلبات | وجود WAF أو تحديد معدل الطلبات | قلل السرعة `-rate 30` واستخدم بروكسي لتدوير العناوين |
| استجابات 502/503 متكررة | لقد تسببت بحجب الخدمة (DoS) للهدف | قلل عدد الخيوط `-t` إلى 5-10 فوراً |

## منظور المدافع (Defender's perspective)

سيظهر نشاط `ffuf` في سجلات الوصول (Access Logs) كالتالي:
- عنوان IP واحد يرسل مئات أو آلاف الطلبات في الثانية.
- طلبات متتالية لمسارات عشوائية أو غير منطقية.
- ترويسة User-Agent الافتراضية: `Fuzz Faster U Fool v2.x.y`.

**إجراءات الحد من المخاطر:**
- إعداد قواعد WAF لحظر الـ User-Agent الخاص بالأداة.
- تفعيل تحديد معدل الطلبات (Rate-limiting) لكل IP.
- زراعة مسارات وهمية (Honeytokens) مثل `/.aws/credentials`؛ أي وصول لها يعتبر مؤشراً قطعياً على نشاط خبيث.

## ملاحظات أمن العمليات (OPSEC)

- قم بتغيير الـ User-Agent دائماً: `-H "User-Agent: Mozilla/5.0 ..."`.
- استخدم `-rate` للبقاء تحت عتبة كشف أنظمة الحماية (WAF).
- في هجمات القوة الغاشمة: انتبه لسياسة قفل الحسابات (Account lockout)؛ استخدم `-mode pitchfork` مع أزواج بيانات مسربة معروفة بدلاً من `clusterbomb` لتجنب قفل حسابات المستخدمين الحقيقيين.

## أدوات ذات صلة

| الأداة | الاستخدام |
|------|-----|
| `gobuster` / `feroxbuster` | بدائل قوية لاكتشاف المسارات بخصائص مختلفة |
| `Burp Intruder` | واجهة رسومية، أكثر دقة ولكن أبطأ بكثير |
| `arjun` | تخصص اكتشاف معاملات HTTP باستخدام خوارزميات ذكية |
| `kiterunner` | فحص مسارات الـ API بناءً على ملفات Swagger/OpenAPI |
