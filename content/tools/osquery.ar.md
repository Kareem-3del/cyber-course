# osquery — الدليل الكامل

تقوم أداة `osquery` بتمثيل نظام التشغيل كقاعدة بيانات SQL علائقية (Relational Database). يتيح لك ذلك الاستعلام عن العمليات الجارية، ونماذج النواة (Kernel Modules)، ومقابس الشبكة (Network Sockets)، والمهام المجدولة، وإضافات المتصفح، وأجهزة USB — كل ذلك عبر عبارات SELECT القياسية. تُعد الأداة خياراً ممتازاً لعمليات التدقيق الشاملة للأنظمة (Fleet-wide audits) وكعنصر أساسي في بناء أنظمة EDR مخصصة.

## التثبيت (Install)

```terminal
brew install osquery
apt install osquery
choco install osquery
```

تعمل الأداة بثلاثة أنماط أساسية:
- `osqueryi` — واجهة تفاعلية (Interactive REPL) لا تتطلب تشغيل خلفية برمجية.
- `osqueryd` — خلفية برمجية (Daemon) تعمل بشكل مستمر لتنفيذ الاستعلامات المجدولة.
- `osqueryctl` — أداة تحكم لإدارة الخدمة.

## الجداول — نموذج البيانات (The Data Model)

توفر osquery مئات الجداول. لاستعراضها:

```terminal
osqueryi
osquery> .tables
osquery> .schema processes
osquery> SELECT name, version FROM osquery_info;
```

| الجدول | الوصف |
|-------|------|
| `processes` | العمليات الجارية حالياً |
| `process_open_sockets` | خريطة الربط بين العمليات والمقابس الشبكية |
| `process_open_files` | الملفات المفتوحة بواسطة كل عملية |
| `users / groups / logged_in_users` | بيانات الهوية والمستخدمين |
| `etc_hosts / etc_passwd / shell_history` | ملفات النظام (خاص بـ Linux) |
| `routes / interface_addresses / arp_cache` | بيانات الشبكة والتوجيه |
| `listening_ports` | المنافذ المفتوحة للاستماع |
| `kernel_modules` | نماذج النواة (Linux) |
| `usb_devices` | الأجهزة المتصلة عبر USB |
| `chrome_extensions / firefox_addons / safari_extensions` | إضافات المتصفحات |
| `crontab / launchd / systemd_units / scheduled_tasks` | آليات البقاء والديمومة (Persistence) |
| `file` (مع استخدام `WHERE path = ...`) | البيانات الوصفية للملفات |
| `hash` (مع استخدام `WHERE path = ...`) | حساب قيم الهاش للملفات |
| `mounts / disk_encryption / iptables / dns_resolvers` | إعدادات النظام وتشفير الأقراص |
| `certificates` | مخزن الشهادات في نظام التشغيل |
| `windows_security_products` | اكتشاف برامج مكافحة الفيروسات و EDR |
| `windows_optional_features` | مميزات ويندوز الاختيارية (Telnet, IIS, إلخ) |

## استعلامات شائعة (Common queries)

```sql
-- الديمومة: المهام المجدولة التي تم إنشاؤها في آخر 7 أيام
SELECT name, action, last_run_time, hidden, enabled
FROM scheduled_tasks
WHERE last_modified_time > (strftime('%s','now') - 86400*7);

-- منافذ الاستماع المشبوهة
SELECT pid, name, port, address
FROM listening_ports lp JOIN processes p USING(pid)
WHERE port NOT IN (22, 80, 443, 53);

-- نماذج النواة المحملة غير الموقعة (للبحث عن Linux rootkits)
SELECT * FROM kernel_modules WHERE state != 'live';

-- مراجعة إضافات المتصفح
SELECT name, version, identifier, install_time, path
FROM chrome_extensions WHERE persistent = 1;

-- ملفات تنفيذية مشبوهة تعمل من مجلد Temp (Windows)
SELECT p.pid, p.name, p.path, p.cmdline, p.start_time, h.sha256
FROM processes p
JOIN hash h ON p.path = h.path
WHERE p.path LIKE 'C:\\Users\\%AppData\\Local\\Temp\\%';
```

## الاستعلامات المجدولة (osqueryd)

ملف التكوين في `/etc/osquery/osquery.conf`:

```json
{
  "schedule": {
    "running_processes": {
      "query": "SELECT pid, name, path, cmdline FROM processes;",
      "interval": 600,
      "removed": false
    },
    "listening_ports": {
      "query": "SELECT * FROM listening_ports;",
      "interval": 300
    },
    "etc_hosts_changes": {
      "query": "SELECT * FROM etc_hosts;",
      "interval": 60,
      "removed": true
    }
  },
  "options": {
    "logger_plugin": "filesystem",
    "logger_path": "/var/log/osquery/"
  }
}
```

الخيار `removed: false` يعني إرسال الفروقات فقط (Differential results)، وهو مثالي لإرسال البيانات إلى أنظمة SIEM.

## إدارة الأسطول (Fleet — central management)

لا تحتوي osquery على واجهة إدارة مركزية افتراضية. أشهر الأدوات المستخدمة للإدارة:

| الأداة | ملاحظات |
|------|-------|
| **Fleet** (FleetDM) | واجهة كاملة، استعلامات فورية، وإدارة موزعة |
| **Kolide K2** | جمع بيانات النقاط الطرفية وتفاعل المستخدمين |
| **Doorman** | مدير مفتوح المصدر (إصدار قديم) |
| **Custom TLS API** | بناء واجهة برمجية خاصة باستخدام إضافة `tls` |

```terminal
docker run -p 1337:1337 fleetdm/fleet
# يتم إضافة الأجهزة عبر الواجهة ← ستعطيك "enroll secret" الخاص بـ osquery
```

## سير العمل (Workflows)

### البحث المباشر (Live Hunt) عبر الأجهزة

من خلال واجهة Fleet: استعلام جديد ← لصق SQL ← تشغيل مباشر ← تتدفق النتائج من كل جهاز في نفس اللحظة.

### لقطات الفروقات (Differential snapshots) إلى SIEM

قم بتكوين `osqueryd` لإخراج ملفات JSON؛ استخدم Filebeat لنقلها إلى ElasticSearch؛ ثم اعرضها في لوحات Kibana.

### الكشف عن أول تشغيل لملف تنفيذي

```sql
SELECT path, sha256
FROM file
JOIN hash USING(path)
WHERE path = '/tmp/.evil'
```

بالاقتران مع ميزة "first seen" في FleetDM، يمكن التنبيه عند ظهور ملفات جديدة تماماً في الشبكة.

## مشاكل وحلول تقنية

| العرض | الحل |
|---------|-----|
| الاستعلام يستغرق وقتاً طويلاً | بعض الجداول (مثل `file` و `hash`) تقوم بمسح شامل؛ استخدم دائماً `WHERE path = ...` |
| أخطاء في الصلاحيات | قم بالتشغيل بصلاحيات root أو Administrator |
| جداول مفقودة في macOS | بسبب قيود SIP — قم بتثبيت حزمة `osquery.pkg` الرسمية ومنح "Full Disk Access" |
| استهلاك عالٍ للمعالج في Daemon | الفواصل الزمنية (Intervals) قصيرة جداً؛ قم بزيادتها |
| ضجيج في مخرجات الفروقات | نمط Diff حساس؛ استخدم نمط "snapshot" للجداول المستقرة |

## منظور المدافع (Defender perspective)

تعتبر osquery حجر الأساس لبناء **نظام EDR خاص بك**. حالات الاستخدام تشمل:
- الامتثال (Compliance): تدقيق مستمر وفق معايير CIS.
- البحث (Hunting): البحث الشامل في كامل الأجهزة عن أي تطابق لنمط معين.
- الاستجابة للحوادث (IR): استعلامات في الوقت الفعلي أثناء وقوع حادث أمني.

يُنصح بربطها مع Sysmon في بيئات Windows للحصول على تفاصيل إنشاء العمليات وتحميل DLLs التي لا تغطيها osquery وحدها.

## الأمن العملياتي (OPSEC)

- الـ "enroll secret" هو مفتاح الثقة؛ يجب تدويره (rotate) بانتظام.
- الاستعلامات قد تكون مرئية لمن يملك حق الوصول للمدير؛ صمم استعلاماتك بناءً على مبدأ "الحاجة للمعرفة" (need-to-know).

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **Velociraptor** | شبيهة بـ osquery ولكنها أكثر تركيزاً على التحليل الجنائي (DFIR) |
| **GRR Rapid Response** | أداة من جوجل للتحليل والاستجابة |
| **EDR-X / Wazuh** | حزم SIEM كاملة مع عملاء (Agents) |
| **Auditbeat** | بديل خفيف لنظام Linux لبعض الجداول |
