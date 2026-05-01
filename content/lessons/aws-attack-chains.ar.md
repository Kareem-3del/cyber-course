# سلاسل هجوم AWS: إزاي مفتاح مسرّب واحد يضيع الشركة كلها في السحاب؟

- يا حضرتك، AWS آمنة صح؟ أمازون شايلة الموضوع.

يا مستجد. طب Capital One اتخرقت إزاي بقى؟
وUber؟ وCodecov؟ وImperva؟

السحاب مش مجرد "كمبيوتر بتاع حد تاني" — السحاب عبارة عن Giant API. في AWS، إنت مش بتتعامل مع هاردوير، إنت بتتعامل مع IAM. لو المهاجم لقى Access Key واحد مسرّب على GitHub أو منسي في `.env`.. مبروك.

هو كده مش بس دخل جهاز. هو معاه ريموت كنترول لكل حاجة في الحساب، وممكن يمسح الشركة كلها بـ command واحد.

في حادثة Imperva في 2019، API key واحد مسرّب من بيئة development أدى لتسرّب بيانات 19 ألف عميل من بيئة الإنتاج. ليه؟ علشان نفس الـ key كان معاه read access على RDS snapshot في prod. غلطة configuration واحدة، شركة كاملة في الجرائد.

> [!danger] تنبيه
> الكلام ده للتطبيق في بيئات الاختبار ومعاك إذن رسمي. أي كليك بتعمله على الـ AWS API بيتسجل في CloudTrail. لو حذرتك، فده مش علشان أنا مثالي — ده علشان شفت ناس راحت بيها فعلاً.

## غلطات الـ junior في AWS

- يحط access keys في الـ git repo "علشان أجرّب بسرعة". GitHub scanner بيلاقيهم في 30 ثانية. الـ bots بتشتغل أسرع منك.
- يدّي IAM user صلاحية AdministratorAccess "مؤقتاً". ينسى. تفضل مؤقتة لـ 3 سنين.
- يفعّل CloudTrail في region واحدة. باقي الـ regions blind. المهاجم بيشتغل في eu-west-3 وإنت بتراقب us-east-1.
- يفتكر إن "حذف الـ access key" يحل المشكلة بعد التسريب. الـ session token اللي اتولد قبل الحذف لسة شغّال.

## 1. البداية دايماً من الخروم (Initial Access)

المهاجمين مابيتعبوش نفسهم. بيدوّروا على اللي إنت رميته أو نسيته:

- **GitHub**: البحث عن مفاتيح تبدأ بـ `AKIA`. شغّال 24/7 من bots متخصصة.
- **S3 Buckets**: السطول المفتوحة للعامة وبالغلط فيها backup أو `credentials.csv`.
- **AMIs المنشورة**: عملت صورة للسيرفر بتاعك وسبتها public وهي فيها الـ keys.
- **Postman / public API docs**: عاملين share في collection فيها bearer token حقيقي.

## 2. أنا مين؟ وأقدر أعمل إيه؟ (Enumeration)

أول ما المهاجم بيمسك مفتاح، بيسأل: "أنا مين في المنظومة دي؟"

```terminal
# معرفة الهوية الحالية - ليه: أول حاجة قبل أي تحرك
aws sts get-caller-identity

# عدّ الصلاحيات - ليه: علشان تعرف تروح فين
aws iam list-attached-user-policies --user-name LEAKED
aws iam simulate-principal-policy --policy-source-arn ... --action-names "*"

# Pacu - الـ framework اللي بيعمل ده كله أوتوماتيك
pacu
```

الموضوع مش بالبركة. في أكتر من 30 طريق رسمي في AWS يخليك تصعد صلاحياتك لو الأدمن مش فاهم هو بيعمل إيه.

## 3. تصعيد الصلاحيات: فن الخداع في الـ IAM

تخيّل إنك موظف بوفيه ومعاك صلاحية تغيير مفاتيح الأبواب. هتعمل إيه؟ أكيد هتعمل مفتاح لنفسك وتدخل أوضة المدير.

في AWS كده بالظبط:

- **CreateAccessKey**: معاك صلاحية تعمل key ليوزر تاني؟ هتعمل key للأدمن وتدخل بيه.
- **PassRole + RunInstances**: تبعت صلاحية أدمن لسيرفر EC2 إنت اللي بتتحكم فيه، وتنفّذ الكود اللي إنت عايزه بصلاحيات الأدمن.
- **AttachUserPolicy**: تربط AdministratorAccess على نفسك. غلطة في wildcard كافية.
- **UpdateFunctionCode على Lambda**: لو الـ Lambda معاها role أعلى منك، عدّل الكود وخلاصة.

## 4. فخ الـ Metadata (الكنز المخفي)

أي سيرفر EC2 شغّال، جواه خدمة اسمها Metadata Service. وظيفتها تدي معلومات للسيرفر، بس المهاجم بيستغلها يسحب منها temporary credentials.

لو وصلت للسيرفر ده عن طريق SSRF، فإنت حرفياً سحبت "مفاتيح الشقة" من جوه الأسانسير. ده اللي حصل بالظبط في Capital One.

```terminal
# سحب مفاتيح الصلاحية - ليه: IMDSv1 ما بيطلبش token
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# IMDSv2 بيتطلب PUT للحصول على token الأول - ليه: علشان يقفل SSRF الكلاسيكي
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

في 2026 لسة في شركات على IMDSv1. مش علشان مش عارفين، علشان "السيرفر شغّال من 2019 وما اتلمسش".

## 5. السيطرة الكاملة (Cross-account & Organizations)

أكبر غلطة بتقع فيها الشركات الكبيرة: الثقة العمياء بين الحسابات.

المهاجم لو دخل حساب التطوير (Dev)، بيدوّر على أي trust relationship يوديه لحساب الإنتاج. لو الحسابات كلها جوه AWS Organization واحدة، المهاجم ممكن يتقمّص دور في أي حساب تابع ويسيطر على الشركة كلها.

```terminal
# تفقّد الـ trust relationships - ليه: الـ AssumeRole هو الجسر
aws iam list-roles --query 'Roles[?AssumeRolePolicyDocument]'

# الانتقال لحساب تاني - ليه: لو الـ trust policy فيها * أو account ID مش متوقّع
aws sts assume-role --role-arn arn:aws:iam::PROD-ACCOUNT:role/CrossAccountAdmin --role-session-name pwn
```

## نصيحة للمدافعين: بلاش "عبث" في الصلاحيات

لو عايز تحمي السحاب بتاعك، لازم تفهم إن الأمان بيبدأ من "أقل صلاحية ممكنة":

1. **امسح المفاتيح الدائمة**: استخدم SSO و roles المؤقتة. مفيش حاجة اسمها `AKIA` تعيش للأبد. السكة دي قفلتها فوراً.
2. **اقفل IMDSv1**: اجبر السيرفرات تستخدم V2. الـ flag اسمه HttpTokens=required. سطر واحد، 100 مليون عميل ما اتسربوش.
3. **فعّل GuardDuty + CloudTrail في كل region**: ده الرادار بتاعك. لو في region مش مفعّل فيها، يبقى إنت أعمى.
4. **راقب الـ S3**: مفيش bucket public إلا للضرورة القصوى. Block Public Access على مستوى الحساب كله.
5. **SCPs**: على مستوى الـ Organization، امنع الأفعال الخطرة (إيقاف CloudTrail، حذف KMS keys) حتى من الـ root.

## الخلاصة الناشفة

السحاب لعبة صلاحيات.
لو المهاجم لقى خرم في الـ IAM، فكل الـ firewalls والـ encryption اللي إنت عاملهم مالهمش لازمة.

الفرق بين الشركة اللي بتتخترق واللي محمية: الانضباط في توزيع المفاتيح، ومراقبة مين بيستخدمها وفين.

الـ junior بيدوّر على CVE في AWS. مفيش CVE.
الـ pro بيدوّر على policy فيها `Resource: "*"` كاتبها حد متعجّل في 2021.

اكتبها على الـ terminal بتاعك:

**اوعى تسيب مفتاح `AKIA` يعيش للأبد. وأوعى تثق في trust policy فيها `*`. الباب اللي مفتوح من 2021 هو اللي هيتدخل منه.**
