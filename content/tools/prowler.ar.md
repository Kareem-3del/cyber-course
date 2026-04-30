# Prowler — الدليل الكامل

تُعد `Prowler` أداة مفتوحة المصدر رائدة في مجال تدقيق أمن السحابة وفحص الامتثال (Compliance). توفر الأداة أكثر من 500 فحص لمنصات AWS و Azure و GCP و M365 و Kubernetes — موزعة وفق معايير عالمية مثل CIS و NIST و ISO27001 و PCI-DSS و FedRAMP و MITRE ATT&CK.

## التثبيت (Install)

```terminal
pipx install prowler
brew install prowler
docker run -ti toniblyx/prowler:latest aws
```

## أوامر مزودي الخدمة (Provider commands)

```terminal
prowler aws ...
prowler azure ...
prowler gcp ...
prowler kubernetes ...
prowler m365 ...
```

## الأعلام والمعاملات الشائعة (Common flags)

| العلم (Flag) | الغرض |
|------|---------|
| `-p / --profile` | تحديد ملف تعريف AWS (Profile) |
| `-r / --region` | تحديد مناطق جغرافية معينة للفحص |
| `-c / --checks` | تشغيل فحوصات محددة فقط |
| `--severity` | تصفية النتائج حسب الخطورة (`critical`, `high`, `medium`, `low`) |
| `-f / --output-formats` | صيغ المخرجات: `csv`, `json`, `json-asff`, `html` |
| `-o / --output-directory` | مسار مخرجات التقرير |
| `--compliance` | الفحص وفق معيار محدد (مثل `cis_3.0_aws`, `nist_csf_1.1`) |
| `--slack` | إرسال النتائج إلى Slack عبر Webhook |
| `-q / --quiet` | إظهار الإخفاقات (Failures) فقط |

## سير العمل (Workflows)

### التدقيق الأولي السريع (Quick first audit)

```terminal
prowler aws --severity critical high -q -f html
firefox output/prowler-output-*.html
```

### تقرير الامتثال لمعيار معين (Compliance-mapped report)

```terminal
prowler aws --compliance cis_3.0_aws --output-formats html json
```

### فحص حسابات متعددة عبر "AWS Organizations"

```terminal
prowler aws --organizations-role OrganizationAccountAccessRole \
  --compliance cis_3.0_aws -f csv html
```

### إرسال النتائج إلى AWS Security Hub

```terminal
prowler aws --security-hub
```

## فهم المخرجات (Output)

جدول النتائج في الطرفية (Console):

```
PASS   ACCOUNT      REGION       CHECK_ID                                    SEVERITY
PASS   123456789    us-east-1    iam_no_root_access_key                      CRITICAL
FAIL   123456789    us-east-1    s3_bucket_default_encryption                MEDIUM
FAIL   123456789    eu-west-1    cloudtrail_logs_s3_bucket_is_not_publicly  CRITICAL
…
══════════════════════════════════════════════════════════════
Total findings: 247  PASS: 198  FAIL: 49
```

يوفر تقرير HTML إمكانية تصفية النتائج حسب مستوى الخطورة، الخدمة، والحالة، مع روابط تشرح كيفية معالجة الثغرات (Remediation).

## مشاكل وحلول تقنية

| العرض | الحل |
|---------|-----|
| رسائل `WARN: required permission missing` كثيرة | تأكد من إرفاق سياسات `SecurityAudit` و `ViewOnlyAccess` للهوية المستخدمة |
| الأداة بطيئة جداً في الحسابات الضخمة | استخدم العلم `-c` لتحديد تصنيفات معينة أو `-r` لتحديد مناطق جغرافية أقل |
| وجود نتائج خاطئة (False Positives) | استخدم قائمة السماح عبر ملف `--allowlist-file allowlist.yaml` |

## منظور المدافع (Defender's perspective)

تقوم Prowler بإجراء نداءات واجهة برمجة تطبيقات (API calls) للقراءة فقط. تتبع الأداة نفس نمط أداة CloudFox: العديد من عمليات `Describe*` و `Get*` و `List*` من هوية واحدة. هذا النشاط متوقع من دور (Role) مخصص للتدقيق الأمني.

## الأمن العملياتي (OPSEC)

- كأداة دفاعية، صُممت Prowler لتكون **شفافة**. لا توجد مخاوف أمنية من تشغيلها داخل المؤسسة.
- يُنصح دائماً باستخدام دور IAM مخصص (مثل `prowler-audit`) مع سياسة `SecurityAudit` بدلاً من استخدام بيانات مستخدم شخصي.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **CloudFox** | استطلاع سحابي يركز على مسارات الهجوم |
| **ScoutSuite** | أداة تدقيق بديلة بنطاق مشابه |
| **AWS Trusted Advisor** | الأداة الأصلية من أمازون لتقديم النصائح الأمنية |
| **Steampipe** | استخدام SQL للاستعلام والتدقيق السحابي الفوري |
| **Kubescape** | تدقيق أمني متخصص لمنصات Kubernetes |
