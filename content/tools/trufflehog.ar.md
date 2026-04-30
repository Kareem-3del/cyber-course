# دليل trufflehog الشامل

تُعد أداة `trufflehog` من أقوى الأدوات المخصصة للكشف عن الأسرار المسربة (مثل مفاتيح واجهة البرمجة API keys، والرموز Tokens، والمفاتيح الخاصة) في مستودعات Git، والحاويات السحابية (Cloud buckets)، وصور الحاويات (Container images)، وأنظمة الملفات، ومنظمات GitHub، و Docker Hub، و Postman، وغيرها. ما يميز هذه الأداة هو قدرتها على التحقق من صحة النتائج (Verification) عبر التواصل مع المزود الحقيقي للخدمة، مما يقلل بشكل كبير من النتائج الخاطئة (False Positives) مقارنة بالأدوات التي تعتمد على التعابير النمطية (Regex) فقط.

## التثبيت (Install)

```terminal
go install github.com/trufflesecurity/trufflehog/v3@latest
brew install trufflehog
docker run --rm -v "$(pwd):/work" trufflesecurity/trufflehog filesystem /work
```

## المصادر (Sources)

| المصدر | الاستخدام |
|--------|-----------|
| `git` | المستودعات المحلية أو العناوين البعيدة — يمسح السجل الكامل |
| `github` | المنظمات، المستخدمين، أو مستودع منفرد عبر واجهة البرمجة |
| `gitlab` | مستودعات GitLab |
| `filesystem` | فحص دليل ملفات محلي |
| `s3` | حاويات S3 من AWS |
| `gcs` | التخزين السحابي من Google (GCS) |
| `docker` | طبقات صور Docker |
| `postman` | مساحات عمل Postman |
| `huggingface` | منظمات أو نماذج HF |
| `circleci` | ملفات الـ Artifacts في CircleCI |
| `elasticsearch` | فهارس ES |
| `stdin` | تمرير نصوص برمجية للفحص المباشر |

## المعاملات الشائعة (Common Parameters)

| الوسم (Flag) | الغرض |
|--------------|-------|
| `--only-verified` | طباعة النتائج التي تم التأكد من فعاليتها فقط (يقتل النتائج الخاطئة) |
| `--results=verified,unknown` | فلترة النتائج حسب تصنيفها |
| `--no-update` | عدم تحديث قائمة الكواشف (Detectors) تلقائيًا |
| `--concurrency <n>` | عدد العمليات المتوازية |
| `--json` | المخرجات بصيغة JSONL |
| `--fail` | الخروج بكود خطأ عند العثور على أي سر (يستخدم في خطوط الإنتاج CI) |
| `--include-paths` / `--exclude-paths` | تحديد أو استثناء مسارات ملفات معينة |
| `--since-commit <sha>` | حصر الفحص في الالتزامات (Commits) التي تلت SHA معين |
| `--branch <name>` | فحص فرع (Branch) واحد فقط |

## مسارات العمل (Workflows)

### فحص السجل الكامل لمستودع

```terminal
trufflehog git https://github.com/target/website --only-verified
```

### فحص منظمة كاملة (يتطلب مفتاح GitHub بصلاحية `read:org`)

```terminal
GITHUB_TOKEN=ghp_xxx trufflehog github --org=target-corp --only-verified --json | tee findings.jsonl
```

### بوابة ما قبل الالتزام (Pre-commit gate)

```terminal
trufflehog git file:///$PWD --since-commit HEAD --branch HEAD --only-verified --fail
```

### فحص حاوية S3

```terminal
trufflehog s3 --bucket=target-backups --only-verified
```

### فحص صورة حاوية (Container image)

```terminal
trufflehog docker --image=registry.target/private/image:v1
```

## تحليل المخرجات

```
✗ Found verified result 🐷🔑
Detector Type: AWS
Decoder Type: PLAIN
Raw result: AKIAEXAMPLEKEY...
File: src/config/aws.js
Commit: 5ad2a01b
Email: alice@target.gov
```

ظهور كلمة "verified" هو المعيار الذهبي هنا؛ فهذا يعني أن trufflehog قام بالفعل بالتواصل مع خدمات مثل AWS أو GitHub أو Twilio وأكد أن المفتاح فعال وشغال. يجب التعامل مع هذه النتائج كخطر حرج وفوري.

أما النتائج المصنفة كـ `unknown` فتعني أن الصيغة مطابقة للسر ولكن لم يتم التحقق من فعاليتها (ربما لأن الكاشف يعمل أوفلاين)؛ لذا يجب فحصها يدويًا.

## المشاكل الشائعة والحلول

| العرض | الحل |
|-------|------|
| كثرة النتائج غير المؤكدة | فعل خيار `--only-verified` لتقليل الضجيج |
| ظهور "PrivateKey" بكثرة | استبعد مجلدات الاختبارات عبر `--exclude-paths 'tests/|fixtures/'` |
| بطء في المستودعات الضخمة | حدد الفحص عبر `--since-commit` أو استخدم المعالجة المتوازية |
| فقدان مفاتيح واضحة | تأكد من تحديث قائمة الكواشف عبر `trufflehog --no-update=false` |
| حظر من GitHub (Rate-limit) | استخدم Token خاص (PAT) أو صغر نطاق البحث |

## منظور المدافعين (Defender's Perspective)

العثور على سر عبر trufflehog يعني أن هذا السر قد تم كشفه في *نقطة زمنية ما*؛ ولا يهم كم كانت المدة قصيرة. يجب التعامل مع النتائج المؤكدة (Verified) على أنها **مخترقة بالفعل**؛ حيث إن المهاجمين يمسحون GitHub العام باستمرار وبشكل آلي.

الإجراءات المتبعة عند اكتشاف تسريب:

1. **تغيير (Rotate)** السر فورًا.
2. مراجعة سجلات الوصول (Cloud/SaaS access logs) للرجوع إلى تاريخ الالتزام (Commit) للبحث عن أي استخدام غير مشروع.
3. تذكر أن مسح السجل أو استخدام "Force-push" **لا يحذف** التسريب تمامًا (بسبب وجود النسخ المنشقة Forks، أو الـ Caches). التغيير الفوري للسر هو الحل الوحيد المعتمد.
4. إضافة فحص trufflehog كخطوة أساسية في الـ CI/CD مستقبلاً.

## ملاحظات أمن العمليات (OPSEC)

- فحص منظمة GitHub الخاصة بك أمر طبيعي، أما فحص منظمة هدف بدون إذن قد يعتبر وصولاً غير مصرح به في بعض التشريعات.
- قد تحتوي المخرجات على اعتمادات فعالة؛ لذا احفظها في قرص مشفر ولا تضعها أبدًا في تعليقات التذاكر (Tickets) بشكل واضح.

## أدوات ذات صلة

| الأداة | التخصص |
|--------|---------|
| `gitleaks` | أسرع، يعتمد على Regex، وأخف في فحص السجلات |
| `noseyparker` | ممتاز للمستودعات الضخمة جدًا وحاويات S3 |
| `secretlint` | أداة تدقيق (Linter) مخصصة لخطوط الإنتاج |
| `detect-secrets` | يعتمد على المقارنة المرجعية (Baseline) |
| `gh secret-scanning` | أداة GitHub الأصلية، الأفضل للمستودعات المستضافة لديهم |
