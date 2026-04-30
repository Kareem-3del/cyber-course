# Pacu — الدليل الكامل

تُعد أداة `Pacu` إطار عمل متخصصاً في استغلال ثغرات بيئات AWS. ويمكن وصفها بأنها "Metasploit" المخصصة لمنصة AWS، حيث توفر وحدات نمطية (Modules) لاستطلاع الهويات والصلاحيات (IAM Enumeration)، وتصعيد الصلاحيات (Privilege Escalation)، وضمان البقاء (Persistence)، والتحرك الجانبي (Lateral Movement)، واستخراج البيانات. تتولى شركة Rhino Security Labs صيانة هذا المشروع بشكل أساسي.

## التثبيت (Install)

```terminal
pipx install pacu
pacu
```

أو عبر Docker: `docker run --rm -it rhinosecuritylabs/pacu`.

## الجلسات والمفاتيح (Sessions / Keys)

```
Pacu > set_keys
> Key alias: target-prod
> Access key ID: AKIA...
> Secret access key: ...
> Session token (optional): 
```

تستمر الجلسات بين فترات التشغيل. يمكنك عرض الجلسات عبر `list_sessions` والتبديل بينها عبر `swap_session <id>`.

## الوحدات النمطية (Modules)

| الوحدة | الغرض |
|--------|---------|
| `iam__enum_permissions` | ما هي الصلاحيات المتاحة لهذا المفتاح؟ |
| `iam__enum_users_roles_policies_groups` | جرد كامل للهويات في الحساب |
| `iam__privesc_scan` | محاولة حوالي 30 مساراً موثقاً لتصعيد الصلاحيات |
| `iam__backdoor_users_keys` | إضافة مفتاح وصول لمستخدمين حقيقيين (كباب خلفي) |
| `iam__backdoor_users_password` | إعادة تعيين ملفات تعريف الدخول |
| `iam__backdoor_assume_role` | إضافة نفسك لسياسات AssumeRole |
| `s3__bucket_finder` | اكتشاف واختبار أذونات حاويات S3 |
| `s3__download_bucket` | مزامنة محتويات الحاويات محلياً |
| `ec2__enum` | جرد كامل لـ EC2 و AMIs واللقطات والشبكات |
| `ec2__startup_shell_script` | استبدال UserData لحقن كود برمجي عند الإقلاع القادم |
| `ec2__download_userdata` | سحب بيانات UserData (غالباً ما تحتوي على أسرار) |
| `lambda__download` | تحميل الكود البرمجي لوظائف Lambda |
| `lambda__backdoor_new_role` | إنشاء وظيفة Lambda كباب خلفي |
| `cloudtrail__download_event_history` | سحب سجلات الأحداث قبل تعطيلها |
| `cloudtrail__csv_injection` | حقن حمولات CSV في سجلات الأحداث |
| `detection__disruption` | تعطيل GuardDuty / CloudTrail / Config (عملية صاخبة!) |
| `vpc__enum` | جرد شبكات الـ VPC ومجموعات الأمان |
| `cognito__enum` | استطلاع أحواض مستخدمي Cognito (ناقل تسريب شائع) |

يمكنك عرض كافة الوحدات (أكثر من 50 وحدة) عبر `list modules` والبحث باستخدام `search <keyword>`.

## سير العمل (Workflow)

### 1. الاستطلاع (Enumerate)

```
Pacu > run iam__enum_permissions
Pacu > run iam__enum_users_roles_policies_groups
```

يتم تخزين النتائج في قاعدة بيانات الجلسة؛ استكشفها عبر `data IAM` أو `data EC2`.

### 2. فحص تصعيد الصلاحيات (Privesc Scan)

```
Pacu > run iam__privesc_scan
```

المخرجات: قائمة بمسارات تصعيد الصلاحيات الممكنة. **تأكد** قبل التنفيذ:

```
Pacu > run iam__privesc_scan --offline   # تخطيط فقط (بدون تنفيذ)
Pacu > run iam__privesc_scan             # محاولة التنفيذ الفعلي
```

### 3. استغلال خدمات محددة

```
Pacu > run s3__bucket_finder
Pacu > run ec2__download_userdata
Pacu > run lambda__download
Pacu > run cognito__enum
```

### 4. ضمان البقاء (Persistence)

```
Pacu > run iam__backdoor_users_keys --usernames admin1,admin2
```

تضيف هذه الخطوة مفتاح وصول (تتحكم به أنت) لهؤلاء المستخدمين، مما يضمن الوصول حتى بعد تغيير كلمات المرور.

### 5. التغطية (عملية صاخبة — تتطلب إذناً صريحاً)

```
Pacu > run detection__disruption
```

تقوم بتعطيل GuardDuty وإيقاف CloudTrail. تولد هذه العملية نداءات API مثل `StopLogging` وهي واضحة جداً لمن يراقب حساب الإدارة.

## تحليل المخرجات (Output)

```
running module iam__privesc_scan...
[+] Confirmed Permissions: iam:CreatePolicyVersion, iam:SetDefaultPolicyVersion
[+] Privilege Escalation Vector: CreateNewPolicyVersion → ATTACK PATH
[+] Updating attached policy 'AdminLite' with admin permissions...
[+] You are now effective administrator. Re-run iam__enum_permissions to verify.
```

## استكشاف الأخطاء وإصلاحها (Troubleshooting)

| العرض | السبب المحتمل | الحل |
|---------|-------|-----|
| `AccessDenied: not authorized to perform sts:GetCallerIdentity` | مفاتيح خاطئة | أعد ضبط المفاتيح؛ تحقق من المنطقة (Region) |
| فشل الوحدة في منطقة واحدة | نقص في ضبط المناطق | استخدم `set_regions us-east-1 ...` |
| بطء `iam__privesc_scan` | تحاول تجربة كل المسارات تسلسلياً | استخدم `--offline` أولاً للتخطيط |
| فشل مستمر في وضع الباب الخلفي | تفعيل CloudFormation drift detection | قم بإيقاف فحص الانحراف لفترة قصيرة |

## منظور المدافع (Defender's Perspective)

تولد أداة Pacu **ضجيجاً هائلاً في سجلات CloudTrail**:

- وحدة `iam__enum_permissions` تحاكي نداءات `IAMSimulatePrincipalPolicy` — وهو نمط مميز جداً.
- أحداث `*PolicyVersion` نادرة في الحسابات المستقرة ← يجب اعتبارها حرجة.
- استدعاء عدد كبير من الـ APIs في ثوانٍ معدودة من مستخدم واحد هو مؤشر اختراق واضح.
- عمليات `StopLogging` / `DeleteTrail` / `UpdateGuardDutyDetector(Enable=false)` يجب أن تطلق إنذاراً فورياً (ALARM).

مثال لاستعلام (CloudWatch / Athena) لرصد هذا النشاط:

```sql
SELECT eventName, COUNT(*) FROM cloudtrail
WHERE userIdentity.arn = 'arn:aws:iam::123:user/dev-bot'
  AND eventTime > now() - interval '1' hour
GROUP BY eventName HAVING COUNT(*) > 50;
```

## أمن العمليات (OPSEC)

- **وسم كل فعل (Tagging)** باسم جلسة واضح في CloudTrail؛ يساعد ذلك في عملية التنظيف بعد انتهاء المهمة.
- قم بتعطيل الوحدات الصاخبة في المناطق (`--regions`) التي لا تحتاج لاستطلاعها.
- لا تقم بتشغيل `detection__disruption` في المهام الرسمية دون إذن كتابي صريح بتعطيل الأدوات الأمنية.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **CloudFox** | استطلاع سلبي (Passive) سريع، بدون استغلال |
| **Prowler** | تدقيق الوضع الأمني للمدافعين |
| **ScoutSuite** | تقارير HTML أمنية للمدافعين |
| **leonidas** / **stratus-red-team** | مكتبة محاكاة الهجمات في السحابة |
| **enumerate-iam** | أداة خفيفة لاستطلاع صلاحيات IAM |
| **aws-vault** | تخزين آمن لمفاتيح الوصول للمشغلين |
