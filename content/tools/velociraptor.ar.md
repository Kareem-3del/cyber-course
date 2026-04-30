# Velociraptor — الدليل الكامل للتحقيق الجنائي الرقمي والاستجابة للحوادث (DFIR)

تُعد منصة `Velociraptor` الأداة المفتوحة المصدر الأبرز في مجال التحقيق الجنائي الرقمي، البحث عن التهديدات (Threat Hunting)، والاستجابة للحوادث، وهي مدعومة من Rapid7 / Velocidex. تعتمد الأداة على ملف تنفيذي واحد بلغة Go يعمل كـ **خادم** (واجهة ويب، وإدارة مهام) وكـ **عميل** (عميل يتم نشره على الأجهزة). تتيح لك الأداة البحث عبر آلاف النقاط الطرفية (Endpoints) باستخدام استعلامات VQL، وجمع الأدلة الجنائية بأسلوب KAPE عند الطلب، وتنفيذ عمليات الفحص الجنائي الحي.

## التثبيت

```terminal
curl -L https://github.com/Velocidex/velociraptor/releases/latest/download/velociraptor-linux-amd64 -o vr
chmod +x vr

# إعداد الخادم وإنشاء حساب المدير الأول
./vr config generate -i  # وضع تفاعلي
./vr --config server.config.yaml frontend
```

## بنية النظام (Architecture)

```
[ عملاء Velociraptor على الأجهزة ]   ↔   [ الواجهة الأمامية / الخادم ]   ↔   [ واجهة الإدارة / API ]
```

يبلغ حجم العميل حوالي 10 ميجابايت فقط، ويعمل في وضع عدم الاتصال (Queue)، ويستخدم بروتوكول mTLS للتواصل مع الخادم لضمان أمن الاتصال. الخادم ملف تنفيذي واحد أيضاً.

## نشر العملاء (Deploying agents)

```terminal
# حزم إعدادات العميل الخاصة بالمؤسسة في ملف MSI
./vr --config server.config.yaml package --msi /tmp/vr-client.msi
# النشر عبر GPO / Intune / SCCM

# أو النشر حسب المنصة:
./vr --config client.config.yaml client
# (Linux/macOS: التثبيت كخدمة System Service)
```

## لغة استعلام Velociraptor (VQL)

لغة VQL هي لغة استعلام تشبه SQL، مخصصة لمصادر بيانات التحقيق الجنائي الرقمي (DFIR). كل أداة جمع أدلة (Artifact) في المنصة هي في الحقيقة استعلام VQL.

```vql
SELECT Name, Pid, Ppid, CommandLine
FROM pslist()
WHERE Name =~ "powershell|cmd|wscript"
  AND CommandLine =~ "(http|FromBase64String|IEX)"
```

```vql
LET parents = SELECT Name, Pid FROM pslist() WHERE Name =~ "explorer.exe"
SELECT * FROM pslist()
WHERE Ppid IN parents.Pid AND Name =~ "(powershell|wmic|cscript)"
```

```vql
-- فحص الملفات باستخدام قاعدة Yara
SELECT * FROM Artifact.Generic.Detection.Yara.Process(YaraRule="rule m { strings: $a = \"AAA\" condition: $a }")
```

## أدوات جمع الأدلة المدمجة (Built-in artifacts)

تضم المنصة حوالي 250 أداة جاهزة، منها:

| الأداة (Artifact) | الوظيفة |
|----------|--------------|
| `Generic.Forensic.Timeline` | إنشاء خط زمني جنائي بأسلوب Plaso |
| `Windows.Sys.Programs` | حصر البرامج المثبتة (عبر السجل Registry و Amcache) |
| `Windows.Forensics.Prefetch` | تحليل ملفات Prefetch لتتبع تشغيل البرامج |
| `Windows.EventLogs.Suspicious` | فحص سجلات الأحداث (EVTX) ومطابقتها مع قواعد Sigma |
| `Windows.KapeFiles.Targets` | تشغيل قوائم استهداف KAPE لجمع أدلة محددة |
| `Windows.System.Pslist` | عرض العمليات الجارية حالياً |
| `Windows.NTFS.MFT` | تحليل جدول الملفات الرئيسي (MFT) بشكل حي |
| `Linux.Sys.SUID` | حصر جميع ملفات SUID على القرص |
| `Linux.Network.NetstatEnriched` | عرض الاتصالات الشبكية الحية مع بيانات الـ /proc |
| `Generic.Detection.Yara.Glob` | تنفيذ فحص Yara على مسارات محددة |
| `Server.Utils.CreateOfflineCollector` | إنشاء جامع أدلة ذاتي التشغيل للعمل دون اتصال |

## منهجية العمل (Workflow)

### البحث الموسع (Hunt) — استعلام عبر الشبكة بالكامل

واجهة الويب ← Hunt Manager ← **New Hunt** ← اختر الأداة (`Windows.System.Pslist`) ← حدد النطاق (Label / OS / hostname regex) ← Submit.

خلال دقائق، تظهر النتائج في جدول قابل للاستعلام لكل جهاز يتصل بالشبكة.

### التحقيق الحي على جهاز واحد (Live triage)

واجهة الويب ← Clients ← ابحث عن اسم الجهاز ← Collected ← New Collection ← اختر الأدوات ← تنفيذ.

يمكن تحميل النتائج بصيغة CSV أو JSON أو كملف مضغوط Zip.

### جامع الأدلة دون اتصال (Offline collector)

للأجهزة التي لا يمكن ربطها بالمنصة مباشرة:

واجهة الويب ← Server Artifacts ← `Server.Utils.CreateOfflineCollector` ← اختر ما تريد جمعه ← حمل ملف `vr-collector.exe`. شغله على الجهاز الضحية. المخرج سيكون ملف `Collection-<host>-<time>.zip`؛ ارفعه على الخادم للتحليل.

### إنشاء أداة مخصصة (Custom artifact)

```yaml
name: Custom.Windows.SuspiciousChildOfWord
description: Flag any process spawned by Word/Excel that's not Office
type: CLIENT
parameters: []

sources:
  - query: |
      SELECT * FROM watch_evtx(filename='''C:\\Windows\\System32\\winevt\\Logs\\Microsoft-Windows-Sysmon%4Operational.evtx''')
      WHERE EventID = 1
        AND ParentImage =~ "(WINWORD|EXCEL|POWERPNT)\\.exe$"
        AND Image !=~ "(splwow64|MicrosoftEdgeUpdate)"
```

احفظه كملف YAML ← ارفعه عبر الواجهة ← ابدأ التنفيذ.

## المفكرات (Notebooks)

تبويب **Notebooks** يوفر بيئة تشبه Jupyter للتعامل مع VQL. تتيح لك حفظ التحليلات التحقيقية، مشاركتها مع الفريق، واستخدام خلايا Markdown لشرح الاستنتاجات بجانب نتائج VQL.

## المشكلات الشائعة والحلول

| العرض | الحل |
|---------|-----|
| العميل لا يتصل بالخادم | جدار الحماية يحظر منفذ 8000؛ تحقق من الشهادات الأمنية وعنوان الـ SAN |
| البحث (Hunt) ينتهي بنسبة 0% | الأجهزة مصنفة بتسميات (Labels) مختلفة — تحقق من نطاق التسمية |
| نفاد الذاكرة (OOM) أثناء الجمع الكبير | زد ذاكرة الخادم؛ قسم عمليات البحث إلى أجزاء أصغر |
| فشل تشغيل الخدمة بعد نشر MSI | إعدادات خاطئة في ملف الإعدادات — أعد الحزم وتأكد من صلاحيات SYSTEM |
| نتائج VQL غير مفهومة | استخدام أداة غير مخصصة لنظام التشغيل الحالي — استخدم خاصية النطاق `OS:Windows` أو `Linux` |

## منظور الدفاع والاستجابة للحوادث (IR)

يُعتبر Velociraptor المعادل المفتوح المصدر لأنظمة EDR المتخصصة في الاستجابة للحوادث. حالات الاستخدام تشمل:

- المراقبة المستمرة عبر أدوات مخصصة تعمل كعمليات بحث مجدولة.
- مسح شامل للشبكة أثناء الحوادث الحرجة ("أي الأجهزة تحتوي على ملف بالبصمة X؟").
- جمع الأدلة الجنائية — أداة `Server.Forensics.SQLiteHunter` لرصد التلاعب في قواعد بيانات SQLite.

## العمليات الأمنية (OPSEC)

- ملف إعدادات الخادم يحتوي على المفتاح الخاص للـ CA — يجب حمايته بشدة.
- نظام التشفير (PKI) فريد لكل عملية نشر؛ يجب تدوير المفاتيح عند تغير أفراد الفريق.
- سجل العمليات (Audit log) يسجل كل عملية بحث وكل تحميل للبيانات — ضروري للتحقيقات القانونية ومنع إساءة الاستخدام الداخلي.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **Osquery** | استعلامات SQL حية، ولكن بدون عمق جنائي (DFIR) |
| **GRR Rapid Response** | مشروع قديم من جوجل، فكرة مشابهة |
| **Limacharlie** | حل تجاري يعتمد على نفس نموذج النشر الواسع |
| **KAPE** | جامع أدلة جنائية متخصص للجهاز الواحد |
| **Yara on fleet** | يقوم Velociraptor بتغليف Yara كأداة جمع أدلة (Artifact) |
