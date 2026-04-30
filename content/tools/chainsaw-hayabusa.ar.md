# تشينسو وهايابوسا (Chainsaw / Hayabusa) — الدليل الشامل لصيد التهديدات

تعد أداتا `Chainsaw` (من تطوير F-Secure / WithSecure) و `Hayabusa` (من تطوير Yamato Security) من أسرع الأدوات المكتوبة بلغة Rust لصيد التهديدات (Hunting) في سجلات أحداث ويندوز (EVTX). بمجرد تزويدهما بمجلد يحتوي على ملفات `.evtx` ومجموعة قواعد سيجما (Sigma ruleset)، تقومان باستخراج النتائج بتنسيقات CSV أو JSON أو HTML في غضون ثوانٍ. وهي الخطوة الأولى لمحلل الاستجابة للحوادث (IR Analyst) فور الحصول على السجلات.

## التثبيت (Install)

```terminal
# Chainsaw
brew install chainsaw         # أو قم بتحميل الإصدار من GitHub
chainsaw --version

# Hayabusa
wget https://github.com/Yamato-Security/hayabusa/releases/latest/download/hayabusa-X.X.X-linux-gnu.zip
```

تأتي الأداتان بإعدادات مسبقة الضبط (Mapping configs) تفهم سجلات Sysmon، وسجلات ويندوز الأصلية، و AMSI، و PowerShell، وغيرها.

## استخدام Chainsaw

### أمر `hunt` (باستخدام قواعد Sigma)

```terminal
chainsaw hunt -s sigma/ -r mappings/sigma-event-logs-all.yml ./evtx-folder/ \
  --output hits.csv --csv
chainsaw hunt -s sigma/ -r mappings/... ./evtx/ --output hits.json --json
```

| الخيار (Flag) | الغرض |
|------|---------|
| `-s <dir>` | مجلد قواعد Sigma |
| `-r <file>` | ملف ربط الحقول (Field mapping) |
| `--csv / --json / --jsonl` | تنسيق المخرجات |
| `-o <file>` | ملف المخرجات |
| `--from / --to` | تصفية حسب النطاق الزمني |
| `--full` | تضمين بيانات JSON الكاملة للحدث المطابق |
| `--rule <yml>` | تشغيل قاعدة محددة فقط |
| `--level critical,high` | تحديد الحد الأدنى لخطورة التنبيه |
| `-q` | الوضع الصامت (بدون شعار الأداة) |
| `--metadata` | تضمين البيانات الوصفية للقاعدة في المخرجات |

### أمر `search` (البحث السريع عبر Regex أو EID)

```terminal
chainsaw search -t "Event.System.EventID: =4624" ./evtx/
chainsaw search -e 'cmd.exe' ./evtx/
```

### أمر `analyse`

```terminal
chainsaw analyse shimcache    # تحليل ShimCache من سجلات النظام (Registry)
chainsaw analyse srum         # تحليل قاعدة بيانات SRUM
```

## استخدام Hayabusa

```terminal
# تحديث القواعد
hayabusa update-rules

# تشغيل عملية صيد ضد مجلد محدد
hayabusa csv-timeline -d ./evtx -o timeline.csv -p super-verbose
hayabusa json-timeline -d ./evtx -o timeline.json
hayabusa html-summary -d ./evtx -o summary.html

# التحليل المباشر (لجهاز واحد)
hayabusa logon-summary  # ملخص إحصائيات تسجيل الدخول من Security.evtx
hayabusa metrics
hayabusa search -k 'powershell -ec' -d ./evtx
```

| الأمر الفرعي | الغرض |
|-----------|---------|
| `csv-timeline / json-timeline` | تشغيل الكشف وإنشاء الجدول الزمني |
| `html-summary` | ملخص تنفيذي جذاب بصرياً |
| `logon-summary` | تحليل وضع المصادقة (Auth posture) |
| `metrics` | إحصائيات حجم الأحداث |
| `search` | بحث سريع باستخدام Regex |
| `pivot-keywords` | جداول محورية للكلمات المفتاحية |
| `update-rules` | جلب أحدث قواعد Sigma وقواعد Hayabusa الخاصة |

تأتي Hayabusa مع حزمة قواعد خاصة بها بالإضافة إلى قواعد Sigma — وهي مضبوطة بدقة لسجلات Sysmon و Defender ATP و AMSI و PowerShell.

## سير العمل (Workflows)

### بعد جمع السجلات عبر أداة KAPE

```terminal
# لنفترض أن KAPE وضعت السجلات في هذا المسار
# E:\IR\HOST\C\Windows\System32\winevt\Logs

# استخدام Chainsaw
chainsaw hunt -s ~/sigma/rules/windows -r ~/chainsaw/mappings/sigma-event-logs-all.yml \
              E:/IR/HOST/C/Windows/System32/winevt/Logs --csv -o hits.csv

# استخدام Hayabusa
hayabusa csv-timeline -d E:/IR/HOST/C/Windows/System32/winevt/Logs -o timeline.csv
hayabusa html-summary -d E:/IR/HOST/C/Windows/System32/winevt/Logs -o summary.html
```

افتح `summary.html` للحصول على نظرة عامة تنفيذية، و `hits.csv` للتحليل التقني المتعمق.

### تضييق نطاق البحث

```terminal
chainsaw hunt -s sigma/rules/windows/process_creation \
  --rule sigma/.../proc_creation_win_susp_ntdsutil.yml ./evtx/
```

### التصفية حسب التاريخ للفترات الطويلة

```terminal
chainsaw hunt --from 2026-04-25 --to 2026-04-30 ...
```

## المخرجات المتوقعة

أعمدة CSV في Chainsaw تشمل: الطابع الزمني، اسم القاعدة، المستوى، المصدر، القناة، معرف الحدث (EID)، اسم الحاسوب، المستخدم، العملية، سطر الأوامر، وعناوين IP المصدر والوجهة — مما يسهل تحليلها في Excel أو Splunk.

يوفر ملخص HTML في Hayabusa:
- أعلى عمليات الكشف حسب العدد.
- مخطط بياني لعمليات الكشف عبر الزمن.
- تحليل الخطورة لكل قاعدة.
- تجمعات الأحداث الهامة (Event clusters).

## المشكلات الشائعة وحلولها

| العرض | الحل |
|---------|-------|
| عدم ظهور نتائج `0 hits` رغم وجود اختراق مؤكد | ملف الربط (Mapping) خاطئ؛ تأكد من استخدام الملف الصحيح وحقق من أسماء الحقول |
| كثرة النتائج الإيجابية الخاطئة (False Positives) | ارفع مستوى التنبيه إلى `--level high` فقط، أو خصص قواعد Sigma |
| بطء الأداة في التعامل مع السجلات الضخمة | الأداتان سريعتان جداً؛ إذا شعرت ببطء فالمشكلة غالباً في سرعة القراءة من القرص (Disk I/O) |
| اختلاف النتائج بين الأداتين | اجمعهما معاً — يوفر كل من Chainsaw و Hayabusa تغطية مكملة للآخر |

## منظور المدافع والاستجابة للحوادث

تعتبر هاتان الأداتان **الخطوة الأولى** في أي حادث أمني يتوفر فيه سجلات EVTX:

1. الجمع عبر KAPE أو Velociraptor.
2. الكشف عبر Chainsaw أو Hayabusa.
3. إنشاء جدول زمني شامل عبر Plaso.
4. التحليل اليدوي المركز على النتائج عالية الدقة.

ملخص تسجيل الدخول (logon-summary) في Hayabusa هو وسيلة سريعة لرصد التحركات الجانبية (Lateral Movement) بعد الاختراق (مثلاً: حساب نادر الاستخدام يظهر فجأة على العديد من الأجهزة).

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **EvtxECmd** (Eric Zimmerman) | محول سجلات EVTX إلى CSV فقط |
| **Sigma CLI** | أداة عامة لتشغيل قواعد Sigma عبر منصات مختلفة |
| **Aurora** (Nextron) | وكيل يعمل في الوقت الفعلي يعتمد على قواعد Sigma |
| **DeepBlueCLI** | أداة قديمة تعتمد على PowerShell لصيد التهديدات في السجلات |
