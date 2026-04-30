# CloudFox — الدليل الشامل

أداة `CloudFox` هي إحدى الأدوات المتخصصة في عمليات الاستطلاع (Reconnaissance) داخل البيئات السحابية، من تطوير فريق Bishop Fox. تتميز الأداة بالسرعة، وهي مصممة للعمل بوضع القراءة فقط (Read-only) بشكل افتراضي. تم تصميم سير العمل (Workflow) الخاص بها للإجابة على التساؤل الشهير: "لقد حصلت للتو على مفتاح AWS، فما هي الإجراءات التي يمكنني القيام بها؟". تقوم الأداة بإخراج تقارير بصيغ متعددة مثل LaTeX و HTML بالإضافة إلى تنسيقات سهلة القراءة للبشر.

## التثبيت (Install)

```terminal
brew install cloudfox
go install github.com/BishopFox/cloudfox@latest
```

تعتمد الأداة على بيانات الاعتماد (Credentials) القياسية لكل من AWS و GCP و Azure (عن طريق متغيرات البيئة، أو ملفات التعريف Profile، أو بيانات التعريف الخاصة بالخدمة Instance Metadata).

## المزودون الأساسيون (Top-level providers)

```
cloudfox aws        ...
cloudfox azure      ...
cloudfox gcp        ...
cloudfox k8s        ...
```

## أوامر AWS (الأكثر استخداماً)

| الأمر | الغرض |
|---------|---------|
| `all-checks` | تشغيل كافة وحدات التدقيق (Audit modules) واستخراج تقرير شامل |
| `inventory` | جرد الهويات (Identities)، المناطق (Regions)، والخدمات |
| `permissions` | تحديد الصلاحيات الفعلية للهوية الحالية (باستخدام Simulation API) |
| `instances` | فحص مثيلات EC2 وعناوين IP العامة، وحالة خدمة IMDS |
| `eks` | فحص مجموعات EKS وإمكانية الوصول إليها |
| `lambda` | فحص كافة الدوال (Functions) ومتغيرات البيئة الخاصة بها |
| `secrets` | فحص Secrets Manager و SSM Parameter Store |
| `route53` | فحص سجلات DNS (غالباً ما تكشف عن أسماء استضافة داخلية) |
| `endpoints` | فحص نقاط النهاية العامة في API GW / ELB وغيرها |
| `network-ports` | فحص قواعد مجموعات الأمان (Security Groups) المفتوحة للمصادر العامة |
| `outbound-assumed-roles` | فحص الأدوار (Roles) الموثوقة من حسابات خارجية |
| `principals` | فحص كافة مستخدمي IAM، والأدوار، وعمليات الاتحاد (Federation) |
| `role-trusts` | فحص سياسات الثقة (Trust policies) — لاكتشاف الثقة الخارجية الضعيفة |
| `access-keys` | فحص مفاتيح الوصول النشطة، عمرها، وتاريخ آخر استخدام |

```terminal
cloudfox aws all-checks --profile target -v
cloudfox aws permissions --profile target
cloudfox aws role-trusts --profile target
cloudfox aws secrets --profile target -o json | jq
```

## الأعلام الرئيسية (Key flags)

| العلم | الغرض |
|------|---------|
| `--profile / -p` | تحديد ملف تعريف AWS (AWS named profile) |
| `--regions / -r` | تقييد الفحص بمناطق معينة |
| `--all-regions` | الفحص في كافة المناطق (الوضع الافتراضي) |
| `-o <fmt>` | صيغة المخرجات: `csv`, `json`, `markdown`, `html` |
| `-v` | الوضع التفصيلي (Verbose) |
| `--out-dir` | تحديد مجلد المخرجات |
| `--no-cache` | عدم إعادة استخدام النتائج المخزنة مؤقتاً |

يتم حفظ النتائج في المسار `cloudfox-output/aws/<account>/...` على هيئة جداول Markdown، ملفات CSV، وفهرس HTML رئيسي.

## سير العمل (Workflow)

### فرز وتقييم مفتاح AWS مكتشف حديثاً (Triage)

```terminal
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
cloudfox aws all-checks
```

بعد ذلك، قم بمراجعة ملف `loot.txt` الذي يحتوي على أبرز المكتشفات، بالإضافة إلى تقارير Markdown في مجلد المخرجات.

### البحث عن الإعدادات الخطرة (Risky configurations)

```terminal
cloudfox aws role-trusts --profile target | grep -E '(\\*|External|Anyone)'
cloudfox aws network-ports --profile target | grep '0\\.0\\.0\\.0/0'
cloudfox aws secrets --profile target | grep -i password
```

### استخراج تقرير HTML قابل للمشاركة

```terminal
cloudfox aws all-checks -o html
firefox cloudfox-output/aws/<acct>/index.html
```

## نموذج للمخرجات (Good output)

```
═══════════ CloudFox AWS — instances ═══════════
ACCOUNT     REGION      INSTANCE_ID     PUBLIC_IP      PRIVATE_IP   IMDS
123456789   us-east-1   i-0a1b2...      54.10.20.30    10.0.1.5     v1+v2
123456789   us-east-1   i-0c3d4...      —              10.0.1.6     v2-only
[+] Wrote 24 instances to instances.csv
```

تشير `v1+v2` إلى أن المثيل يسمح باستخدام IMDSv1 (مما يجعله عرضة لهجمات SSRF). بينما تشير `v2-only` إلى أن IMDSv1 محظور.

## المشاكل الشائعة والحلول

| العرض | الحل |
|---------|-----|
| `unable to resolve credentials` | ملف تعريف خاطئ أو انتهاء صلاحية SSO؛ تأكد عبر `aws configure list` |
| بطء في الحسابات الضخمة | قم بتقييد الفحص باستخدام `-r us-east-1` |
| تجاوز حدود طلبات API (Throttling) | الأداة تدعم التراجع التلقائي (Backoff)؛ انتظر أو قسم الفحص حسب المناطق |
| مخرجات `permissions` تظهر فقط `iam:GetUser` | الهوية تفتقر لصلاحيات القراءة للخدمات الأخرى؛ هذا أمر شائع ومتوقع |

## منظور المدافع (Defender's perspective)

تعمل CloudFox بوضع **القراءة فقط** افتراضياً، لذا لن يرى المدافعون استخداماً لواجهات برمجة تطبيقات تدميرية. ومع ذلك، يمكن رصد الأداة من خلال:

- انفجار في طلبات ListBucket / ListSecrets / GetCallerIdentity من هوية واحدة خلال ثوانٍ.
- استدعاءات `Iam:SimulatePrincipalPolicy` (وهي نادرة في أعباء العمل العادية).
- أنماط `IAMReadOnly` من هوية كانت تاريخياً تستخدم خدمة واحدة فقط.

البحث في CloudWatch:

```sql
SELECT userIdentity.arn, eventName, COUNT(*) cnt
FROM cloudtrail WHERE eventTime > now() - interval '1' hour
GROUP BY 1,2 HAVING COUNT(*) > 100 ORDER BY cnt DESC
```

## أمن العمليات (OPSEC)

- وضع القراءة فقط يقلل من مخاطر كشف الهوية أو نسب الهجوم (Attribution).
- كافة استدعاءات API تسجل تحت اسم الهوية المستخدمة. يفضل استخدام دور (Role) مخصص لكل مهمة لسهولة الإلغاء لاحقاً.
- تجنب استخدام `--all-regions` إذا كان النطاق منطقة واحدة فقط، لتوفير الموارد وتقليل الضجيج (Noise).

## أدوات ذات صلة

- **Pacu** — للاستغلال النشط وتعديل الحالة في البيئة السحابية.
- **Prowler** — ماسح للامتثال (Compliance) من منظور المدافعين.
- **ScoutSuite** — لاستخراج تقارير HTML دفاعية.
- **rotate-iam** — أداة دفاعية لتدوير المفاتيح المكشوفة.
- **aws-recon** — بديل لفحص البيئة بوضع القراءة فقط.
