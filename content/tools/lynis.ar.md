# Lynis — الدليل الكامل للتدقيق الأمني

تُعد أداة `Lynis` (من تطوير CISOfy) من أبرز الأدوات المستخدمة في التدقيق الأمني (Security Auditing) لأنظمة Linux و Unix و macOS و BSD. تتميز الأداة بكونها نصاً برمجياً (Shell Script) بسيطاً لا يتطلب تثبيت أي عملاء (Agents) على النظام، حيث تقوم بقراءة إعدادات النظام، وإجراء مئات الفحوصات الأمنية، وتوليد نتيجة نهائية تعبر عن مستوى التحصين (Hardening Score) مع تقديم توصيات مخصصة لكل فحص.

## التثبيت (Install)

```terminal
apt install lynis
brew install lynis
git clone https://github.com/CISOfy/lynis && cd lynis && sudo ./lynis audit system
```

تتوفر نسخة مجتمعية مفتوحة المصدر، بينما توفر نسخة **Lynis Enterprise** التجارية ميزات إضافية مثل التقارير المركزية وأطر الامتثال (Compliance Frameworks).

## أنماط التشغيل (Modes)

```terminal
lynis audit system                    # تدقيق كامل للنظام المحلي
lynis audit system --quick            # تخطي الاختبارات البطيئة
lynis audit dockerfile <path>          # تدقيق ملف Dockerfile
lynis audit application apache /etc/apache2/    # تدقيق تطبيق معين (Apache)
lynis audit system remote <host>      # التدقيق عن بُعد عبر SSH
lynis show plugins                     # عرض الإضافات المفعلة
```

## الخيارات الشائعة (Common flags)

| الخيار | الغرض منه |
|------|---------|
| `--quick / -Q` | النمط السريع (يتخطى الاختبارات التي تستغرق وقتاً طويلاً) |
| `--cronjob` | مخصص للمهام المجدولة (Cron): يقلل المخرجات، ويعكس كود الخروج النتائج المكتشفة |
| `--no-colors` | مخرجات بدون ألوان (مناسب لأنظمة CI) |
| `--no-log` | تخطي كتابة ملف السجل (Log) |
| `--profile <file>` | استخدام ملف تعريف مخصص (لتخطي أو تضمين اختبارات محددة) |
| `--tests <ids>` | تشغيل اختبارات محددة فقط عبر معرفاتها |
| `--tests-from-category <name>` | تشغيل فئة واحدة (مثل: `firewalls`, `ssh`, `kernel`, `auth`) |
| `--tests-from-group <name>` | تشغيل مجموعة معينة (مثل: `compliance`, `security`, `performance`) |
| `--auditor "Name"` | إضافة اسم المدقق إلى بيانات التقرير الوصفية |
| `--report-file <path>` | حفظ التقرير في مسار محدد |
| `--upload` | رفع التقرير إلى منصة Lynis Enterprise (مدفوع) |
| `--pentest` | إجراء تدقيق غير متميز (Anonymous/Non-privileged) |
| `--developer` | إظهار معلومات داخلية؛ مفيد لمطوري الإضافات |

## مجالات الفحص (Categories)

| الفئة | أمثلة على الفحوصات |
|----------|---------|
| **الإقلاع والنواة (Boot / Kernel)** | كلمة مرور GRUB، تحصين النواة، إعدادات sysctls |
| **المصادقة (Authentication)** | PAM، SSH، sudo، سياسة كلمات المرور |
| **أنظمة الملفات (Filesystems)** | خيارات التركيب (Mount options) مثل `nodev/noexec/nosuid` ، وأجهزة USB |
| **الشبكات (Networking)** | الجدران النار (Firewalls)، الخدمات المستمعة، بروتوكول IPv6 |
| **الخدمات (Services)** | مراجعة وحدات xinetd و systemd |
| **البرمجيات (Software)** | الحزم التي تحتوي على ثغرات أمنية (Vulnerable packages) |
| **التحصين والملفات (Hardening / Files)** | أذونات ملفات الإعداد الشائعة |
| **الحاويات (Containers)** | محرك Docker، بيئة التشغيل |
| **التشفير (Cryptography)** | خوارزميات التشفير المستخدمة في TLS / SSH |
| **التسجيل (Logging)** | إعدادات rsyslog و journald |
| **الامتثال (Compliance)** | معايير CIS، HIPAA، ISO27001 (تتطلب باقة مدفوعة) |

الإجمالي: حوالي 300 فحص في كل عملية تشغيل.

## التقرير الناتج (Report)

```
[+] Hardening index : 73 [###############     ]
[+] Tests performed : 244
[+] Plugins enabled : 1

[+] Result: WARNING
   Warnings (5):
   - SSH-7408: Consider hardening SSH configuration [authentication-1]
   - PKGS-7390: Vulnerable package found: openssl-1.1.1n
   - HRDN-7222: Compiler installed (gcc) — restrict to root
   - LOGG-2154: Auditd is not running
   - KRNL-5820: Disable IPv6 if unused
```

كل معرف (ID) يرتبط بإرشادات للإصلاح: `lynis show details PKGS-7390`.

## سير العمل (Workflows)

### التحصين قبل النشر (Pre-deployment hardening)

```terminal
sudo lynis audit system --auditor "ops" --report-file /var/log/lynis-report.dat
```

بعد ذلك، يتم العمل بشكل تكراري: إصلاح الملاحظات، إعادة التشغيل، ومراقبة ارتفاع مؤشر التحصين (Hardening Index).

### بوابات فحص الصور الذهبية (CI / Golden-image gate)

```terminal
sudo lynis audit system --cronjob -Q
echo $?    # كود الخروج يعكس وجود تحذيرات (1) أو مخاطر حرجة (2)
```

### مطابقة الامتثال (Compliance mapping)

`lynis audit system --tests-from-group compliance` (مع الإضافة المناسبة) ← يربط النتائج بالضوابط الأمنية (مثل معايير CIS Distribution Independent Linux Benchmark).

## المشاكل الشائعة وحلولها (Bad output / fixes)

| العرض | الحل |
|---------|-----|
| تخطي الاختبارات دون تشغيلها | تأكد من التشغيل بصلاحيات root أو باستخدام sudo |
| فشل اختبار `tcp_wrappers` في الأنظمة الحديثة | نتيجة إيجابية خاطئة (False positive)؛ تقنية tcp_wrappers لم تعد مستخدمة |
| اقتراح: تثبيت `tcp_wrappers` | الأنظمة الحديثة لا تحتاجه؛ يمكن كتم هذا التنبيه في ملف التعريف (Profile) |
| بطء في التدقيق عن بُعد | غالباً بسبب زمن انتقال SSH؛ يفضل التشغيل محلياً قدر الإمكان |
| الإصدار الجديد لا يتعرف على نظام التشغيل | قم بتحديث Lynis؛ العديد من التوزيعات توفر إصدارات قديمة |

## منظور المدافع الأمني (Defender Perspective)

يجب أن تكون أداة Lynis **أول أداة** يتم تشغيلها على أي خادم Linux جديد. تعامل مع التقرير كقائمة مهام؛ وقم بإصلاح كل تحذير (WARNING). يمكن دمجها مع:

- **OpenSCAP** لإجراء مسوحات الامتثال.
- **CIS-CAT** (مدفوع) للحصول على تقييمات معيارية كاملة.
- سيناريوهات **AuditPolicy** (مثل Cracken أو debops) لتطبيق الإصلاحات آلياً.

## أمن العمليات (OPSEC)

- تحتوي التقارير على جرد تفصيلي للنظام (System Inventory) — لذا يجب تقييد الوصول إليها.
- تجنب الرفع التلقائي إلى Lynis Enterprise دون وضوح اتفاقيات التعامل مع البيانات.

## الأدوات ذات الصلة (Related tools)

| الأداة | التخصص |
|------|-------|
| **OpenSCAP** | مسح الامتثال لمعايير DISA/CIS |
| **CIS-CAT** | الماسح الرسمي لمعايير CIS |
| **Bastille Linux** | أداة تحصين تفاعلية قديمة |
| **debian-goodies / yum-utils** | تدقيق الحزم الخاص بتوزيعات معينة |
| **Inspec / Chef Compliance** | تدقيق البنية التحتية ككود (Infrastructure-as-code) |
