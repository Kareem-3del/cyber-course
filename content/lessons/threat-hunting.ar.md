# التقصي النشط عن التهديدات — استعلامات تطبيقية

تعتمد قواعد الكشف التقليدية على انتظار نمط معروف مسبقاً، أما التقصي (Hunting) فيبدأ من **فرضية** ذكية ويبحث عن أدلة تثبتها ضمن بيانات القياس عن بُعد (Telemetry) المتوفرة لديك. يقدم هذا الدرس نماذج استعلامية واقعية بلغات KQL (Microsoft Sentinel / Defender) و Splunk SPL و Sigma — كل منها مرتبط بفرضية أمنية يمكنك اختبارها اليوم.

> [!info] كيف تعمل دورة التقصي؟
> صياغة الفرضية ← تحديد مصادر البيانات ← تشغيل الاستعلام ← فرز النتائج (Triage) ← إغلاق الحالة أو تحويلها إلى قاعدة كشف دائمة. كل عملية تقصي ناجحة إما أن تكشف تهديداً مستتراً أو تعزز قدراتك الدفاعية.

## التقصي 1 — إساءة استخدام أدوات النظام (LOLBAS)

**الفرضية:** قيام عملية غير تابعة لحزمة Office باستدعاء أدوات مثل `mshta.exe` أو `rundll32` أو `regsvr32` مع تمرير رابط URL أو وسم `javascript:` — وهذا مؤشر قوي على محاولة تصيد أو تحميل برمجيات خبيثة عبر أدوات النظام الموثوقة.

```kql
DeviceProcessEvents
| where FileName in~ ("mshta.exe","rundll32.exe","regsvr32.exe","installutil.exe")
| where ProcessCommandLine has_any ("http://","https://","javascript:","scrobj")
| where InitiatingProcessFileName !in~ ("explorer.exe","WINWORD.EXE","EXCEL.EXE")
| project Timestamp, DeviceName, AccountName, FileName,
          ProcessCommandLine, InitiatingProcessFileName
```

```spl
index=sysmon EventCode=1 (Image="*\\mshta.exe" OR Image="*\\rundll32.exe" OR Image="*\\regsvr32.exe")
| where match(CommandLine,"http(s)?://|javascript:|scrobj")
| where ParentImage!="*\\WINWORD.EXE" AND ParentImage!="*\\EXCEL.EXE"
| stats values(CommandLine) as cmds count by Computer, User, Image, ParentImage
```

## التقصي 2 — الاستمرارية الخفية — المهام المجدولة عبر WMI

**الفرضية:** محاولة المهاجم إنشاء مهام مجدولة باستخدام الأداة `wmic` للالتفاف على الرقابة المباشرة التي تُفرض عادة على أداة `schtasks.exe`.

```kql
DeviceProcessEvents
| where FileName =~ "schtasks.exe" and ProcessCommandLine has "/create"
| where InitiatingProcessFileName in~ ("wmic.exe","mshta.exe","powershell.exe","wmiprvse.exe")
| project Timestamp, DeviceName, AccountName, ProcessCommandLine,
          InitiatingProcessCommandLine, InitiatingProcessFileName
```

## التقصي 3 — الوصول المشبوه لعملية LSASS

**الفرضية:** أي محاولة لقراءة ذاكرة عملية LSASS من قِبل برامج خارج نطاق مضاد الفيروسات (AV) أو حلول الاستجابة (EDR) تُعد محاولة صريحة لسرقة اعتمادات الدخول.

```kql
DeviceProcessEvents
| where Timestamp > ago(7d)
| where FileName =~ "rundll32.exe" and ProcessCommandLine has_all ("comsvcs.dll","MiniDump")
| project Timestamp, DeviceName, AccountName, ProcessCommandLine
```

```sigma
title: LSASS Memory Dump via comsvcs.dll
logsource: { product: windows, category: process_creation }
detection:
  selection:
    Image|endswith: '\rundll32.exe'
    CommandLine|contains|all:
      - 'comsvcs.dll'
      - 'MiniDump'
  condition: selection
level: high
```

## التقصي 4 — شذوذ تذاكر Kerberos TGT

**الفرضية:** تذاكر "Golden Tickets" غالباً ما تُمنح بصلاحية تمتد لـ 10 سنوات افتراضياً، وهو ما يخالف معظم السياسات الأمنية. كما يُشتبه في طلبات TGS التي تستخدم تشفيراً ضعيفاً (RC4).

```kql
SecurityEvent
| where EventID == 4769  // إصدار تذكرة TGS
| where TicketEncryptionType in ("0x17","0x18")  // تشفير RC4 — علامة على Kerberoast
| where ServiceName !endswith "$"  // استثناء حسابات الأجهزة
| summarize Count=count() by TargetUserName, ServiceName, Computer
| where Count > 5
```

```kql
// الاشتباه في مدة صلاحية التذكرة (مؤشر Golden Ticket)
SecurityEvent
| where EventID == 4624 and LogonType == 3
| where AuthenticationPackageName == "Kerberos"
| extend TGTLife = todatetime(TicketLifetime)
| where TGTLife > 24h  // السياسة المعتادة تكون حوالي 10 ساعات فقط
```

## التقصي 5 — السحاب — منح صلاحيات OAuth مريبة

**الفرضية:** تطبيق مؤسسي جديد حصل على صلاحيات واسعة مثل `Mail.ReadWrite` بناءً على موافقة مستخدم واحد فقط — وهو تكتيك كلاسيكي في تصيد تطبيقات OAuth.

```kql
AuditLogs
| where OperationName == "Consent to application"
| extend AppName = tostring(TargetResources[0].displayName)
| extend ScopeAdded = tostring(parse_json(tostring(ModifiedProperties[0].newValue))[0].ConsentType)
| extend Scopes = tostring(parse_json(tostring(ModifiedProperties[1].newValue)))
| where Scopes has_any ("Mail.ReadWrite","Files.ReadWrite.All","User.Read.All",
                       "Directory.ReadWrite.All","offline_access")
| project TimeGenerated, InitiatedBy, AppName, Scopes
```

## التقصي 6 — تغير في المنافذ المتاحة على الإنترنت

**الفرضية:** قيام المهاجم بفتح منفذ جديد (مثل 4444 أو 8080) على الخادم بعد اختراقه لاستخدامه في الاتصال بمركز التحكم (C2) أو للتحرك الجانبي.

```spl
index=netflow_baseline earliest=-30d@d latest=-1d@d
| stats values(dest_port) as baseline_ports by src_ip
| join src_ip [
    search index=netflow earliest=-1d
    | stats values(dest_port) as today_ports by src_ip
  ]
| eval new_ports=mvfilter(NOT(today_ports IN(baseline_ports)))
| where mvcount(new_ports)>0
```

## التقصي 7 — مؤشرات زرع قشرة الويب (Web Shell)

**الفرضية:** إنشاء ملف بامتداد قابل للتنفيذ (مثل .php أو .aspx) داخل مجلدات خادم الويب من قِبل عملية الخادم نفسها — وهو ما يمثل تقريباً 100% حالة اختراق وزرع Webshell.

```kql
DeviceFileEvents
| where Timestamp > ago(7d)
| where FileName matches regex @"(?i)\.(asp|aspx|ashx|jsp|jspx|php)$"
| where FolderPath has_any ("\\inetpub\\","\\xampp\\htdocs\\","\\tomcat\\","\\jboss\\","\\wwwroot\\")
| where InitiatingProcessFileName in~ ("w3wp.exe","httpd.exe","tomcat.exe","java.exe","php-cgi.exe","nginx.exe")
| project Timestamp, DeviceName, FolderPath, FileName, InitiatingProcessFileName
```

## التقصي 8 — نفق بيانات DNS (DNS Tunneling)

**الفرضية:** جهاز مضيف يقوم بالاستعلام عن عدد هائل وغير معتاد من النطاقات الفرعية (Subdomains) تحت نطاق أصل واحد خلال فترة زمنية قصيرة.

```spl
index=dns
| eval parent=mvindex(split(query,"."), -2) . "." . mvindex(split(query,"."), -1)
| stats dc(query) as unique_subs values(query) as samples by src_ip parent
| where unique_subs > 200
| sort -unique_subs
```

## التقصي 9 — استكشاف مكثف لعلاقات الثقة وصلاحيات الإدمن

**الفرضية:** نشاط استطلاعي مكثف فور الحصول على موطئ قدم (Foothold)، مثل تشغيل أوامر `nltest` و `net group` لمعرفة مدراء النطاق، كل ذلك في غضون ثوانٍ معدودة.

```kql
let recon_cmds = dynamic(["nltest","net group","net user","quser","whoami /all","systeminfo","ipconfig /all"]);
DeviceProcessEvents
| where Timestamp > ago(7d)
| where ProcessCommandLine has_any (recon_cmds)
| summarize Cmds=make_set(ProcessCommandLine), Count=dcount(FileName)
            by DeviceName, AccountName, bin(Timestamp,5m)
| where Count >= 5  // تنفيذ 5 أوامر استطلاع مختلفة على الأقل خلال 5 دقائق
```

## التقصي 10 — إنشاء خدمات للتحرك الجانبي

**الفرضية:** استخدام أدوات مثل PsExec أو Impacket لزرع ملف خدمة باسم عشوائي داخل مجلد `ADMIN$` لتنفيذ أوامر برمجية.

```kql
DeviceFileEvents
| where Timestamp > ago(7d)
| where FolderPath has "C:\\Windows\\" and FileName endswith ".exe"
| where FileName matches regex @"^[A-Z]{4,8}\.exe$"  // النمط المميز لأداة Impacket
| where InitiatingProcessFileName in~ ("services.exe","System")
| project Timestamp, DeviceName, FolderPath, FileName, SHA256
```

## دورية عمليات التقصي

| الدورية | النشاط المطلوب |
| :--- | :--- |
| **يومياً (آلي)** | تشغيل كافة استعلامات التقصي أعلاه كمهام مجدولة مع ضبط عتبات التنبيه. |
| **أسبوعياً** | مراجعة يدوية للنتائج التي كانت "مثيرة للاهتمام" ولكنها لم تصل لحد التنبيه. |
| **شهرياً** | اختبار فرضية **جديدة** بناءً على أحدث تقارير استخبارات التهديدات (Threat Intel). |
| **ربع سنوي** | مراجعة فعالية الاستعلامات السابقة؛ وإلغاء الاستعلامات التي لا تعطي نتائج بعد الضبط. |

> [!tip] من التقصي إلى الكشف الدائم
> التقصي هو جهد مؤقت لمحاولة كشف المستور، أما الكشف (Detection) فهو أصل دفاعي دائم. كل عملية تقصي تنجح في إيجاد تهديد حقيقي يجب تحويلها فوراً إلى قاعدة كشف دائمة (Sigma Rule) ضمن دورة العمل.

## قائمة مراجعة البيانات (Telemetry)
*بدون هذه البيانات، لن تتمكن من تشغيل معظم الاستعلامات أعلاه:*

*   **Sysmon:** (إنشاء العمليات، إنشاء الملفات، نشاط الشبكة).
*   **سجلات استعلامات DNS.**
*   **سجلات أمن ويندوز:** وخاصة الأحداث 4624، 4688، 4769.
*   **حلول EDR:** مثل Microsoft Defender for Endpoint.
*   **سجلات الهوية:** Entra ID Sign-in و Audit Logs.
*   **سجلات السحاب:** مثل CloudTrail أو Activity Logs.
