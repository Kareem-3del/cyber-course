# دليل أداة ScoutSuite الشامل

تُعد أداة `ScoutSuite` (المطورة من قبل NCC Group) أداة تدقيق أمني متعددة المنصات السحابية (Multi-cloud Security Auditor). تقوم الأداة بإنشاء لوحة تحكم متطورة بصيغة HTML تعرض كافة الأخطاء في الإعدادات (Misconfigurations) عبر منصات AWS و Azure و GCP و AliCloud و OCI. تتميز الأداة بكونها تعمل بوضعية القراءة فقط (Read-only)، مما يجعل تشغيلها في بيئات الإنتاج (Production) آمناً تماماً.

## التثبيت (Install)

```terminal
pipx install scoutsuite
# أو التثبيت من المصدر
git clone https://github.com/nccgroup/ScoutSuite && cd ScoutSuite && pip install -e .
```

## التشغيل (Run)

```terminal
# التدقيق على AWS عبر ملف تعريف (Profile)
scout aws --profile target

# التدقيق على AWS عبر انتحال دور (Assumed Role)
scout aws --profile baseuser --assume-role arn:aws:iam::123:role/audit \
          --external-id <id>

# التدقيق على Azure
scout azure --cli   # يستخدم تسجيل الدخول عبر azure-cli
scout azure --service-principal --tenant <id> --client-id <id> --client-secret <key>

# التدقيق على GCP
scout gcp --service-account creds.json
```

## خيارات التشغيل المفيدة (Useful flags)

| الخيار | الغرض |
|------|---------|
| `--report-dir <path>` | تحديد مسار مخرجات التقرير |
| `--report-name <name>` | بادئة اسم ملف التقرير |
| `--regions us-east-1` | حصر النطاق الجغرافي للتدقيق |
| `--services iam,ec2,s3` | حصر التدقيق في خدمات معينة |
| `--skip-services rds` | استثناء خدمات معينة من التدقيق |
| `--no-browser` | عدم فتح التقرير تلقائياً في المتصفح |
| `--ruleset <file>` | استخدام مجموعة قواعد مخصصة |
| `--exceptions <file>` | ملف الاستثناءات (القائمة البيضاء) |
| `--list-services` | عرض كافة الخدمات المتاحة لكل مزود سحابي |
| `--debug` | تفعيل وضع التصحيح (المخرجات التفصيلية) |
| `--max-rate <n>` | تحديد سقف معدل طلبات الواجهة البرمجية (API Throttle) |

## منهجية العمل (Workflow)

### التدقيق السريع

```terminal
scout aws -p target --report-dir reports/2026-04-30
# النتيجة ← تقرير تفاعلي في المسار reports/2026-04-30/scoutsuite-report/aws-target.html
```

### التدقيق على حسابات متعددة

أتمتة التدقيق عبر كافة ملفات التعريف في إعدادات AWS:

```terminal
for prof in $(grep -E '^\[profile' ~/.aws/config | sed 's/\[profile \(.*\)\]/\1/'); do
  scout aws -p "$prof" --report-dir "reports/$prof" --no-browser
done
```

### القواعد المخصصة

```terminal
cp -r providers/aws/rules custom-rules/
# قم بتعديل ملفات JSON؛ مع الرجوع إلى الحقول البرمجية مثل ec2.regions.id.security_groups...
scout aws -p target --ruleset custom-rules/
```

## تحليل النتائج (Good output)

تقوم لوحة تحكم HTML بتجميع الثغرات المكتشفة حسب الخدمة. يظهر كل اكتشاف (Finding) المعلومات التالية:

- العنوان + لون يحدد الخطورة (خطر Danger / تحذير Warning / ملاحظة Notice).
- الوصف + خطوات المعالجة (Remediation).
- الموارد المتأثرة (قابلة للنقر لعرض التفاصيل).
- المراجع الأكاديمية والتقنية (مثل CIS و NIST وتوثيق المزود).

في أعلى الصفحة، يظهر ملخص إجمالي لعدد المخاطر؛ هذا الملخص مخصص للإدارة التنفيذية، بينما التفاصيل موجهة للمهندسين.

## استكشاف الأخطاء وإصلاحها

| العرض | الحل المقترح |
|---------|-----|
| خطأ `AccessDenied` في خدمة معينة | الهوية المستخدمة للتدقيق تحتاج لصلاحيات `SecurityAudit` و `ViewOnlyAccess`. |
| التقرير ضخم جداً أو بطيء في التحميل | استخدم `--services` لحصر النطاق، أو قم بالتدقيق لكل منطقة (Region) بشكل منفصل. |
| سياق الحساب خاطئ | تحقق من ملف التعريف النشط عبر `aws sts get-caller-identity --profile target`. |
| الفحوصات قديمة | قم بتحديث الأداة عبر `pip install -U scoutsuite`. |

## منظور المدافع (Defender's perspective)

تترك الأداة بصمة تقنية (Telemetry fingerprint) مشابهة لأدوات Prowler و CloudFox، وهي عبارة عن تدفق مكثف لطلبات القراءة من الواجهة البرمجية (Read-only API bursts). ينصح بوضع وسوم (Tags) على "الدور" (Role) المستخدم للتدقيق؛ لتجنب إطلاق إنذارات خاطئة عند رصد أنماط API تدقيقية غير مسموح بها.

## اعتبارات العمليات الأمنية (OPSEC)

- تحتوي التقارير على معرفات الحسابات وأسماء الموارد، وهي معلومات حساسة للغاية. يجب التعامل مع المخرجات كوثائق سرية: تشفير التخزين، وضع علامات مائية، ومشاركتها فقط تحت اتفاقية عدم إفصاح (NDA).
- سُجلت حالات تسريب بيانات العملاء عند تشغيل الأداة في بيئات متعددة المستأجرين (Multi-tenant) بسبب رفع التقارير بالخطأ إلى حاويات S3 عامة. تجنب هذا الخطأ تماماً.

## أدوات ذات صلة

- **Prowler:** منافس قوي، أكثر توافقاً مع واجهة السطر الأوامر (CLI) ويدعم أطر امتثال (Compliance) أكثر.
- **CloudFox:** يركز أكثر على العمليات الهجومية (Red-teaming).
- **AWS Security Hub:** الحل الأصلي المدمج من أمازون.
- **Steampipe:** للتدقيق عبر استعلامات شبيهة بلغة SQL.
