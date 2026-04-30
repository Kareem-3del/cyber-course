# Microsoft Sentinel — الدليل الشامل للمحللين الأمنيين

يُعد `Microsoft Sentinel` نظاماً سحابياً أصيلاً (Cloud-native) لإدارة المعلومات والأحداث الأمنية (SIEM) والاستجابة الآلية (SOAR)، مبنياً على منصة Azure Log Analytics. يعتمد النظام بشكل أساسي على لغة الاستعلام كوستو (KQL)، ويتكامل بسلاسة مع Defender XDR وEntra ID وM365، بالإضافة إلى منظومة متنامية من الموصلات (Connectors) التي تدعم أكثر من 90 مصدراً للبيانات. تعتمد تكلفة النظام على حجم البيانات المستهلكة (Ingestion) لكل جيجابايت.

## الإعداد الأولي (Setup)

1. عبر بوابة Azure ← قم بإنشاء مساحة عمل Log Analytics.
2. تفعيل Sentinel ← ربطه بمساحة العمل التي تم إنشاؤها.
3. داخل Sentinel ← الموصلات (Data connectors) ← تفعيل المصادر الحيوية: Defender XDR, Entra ID, AAD Sign-ins, Office 365, Azure Activity وغيرها — معظمها يتم تفعيله بنقرة واحدة.

## الموصلات الحيوية (Connectors that matter)

| المصدر | نوع البيانات |
|--------|------|
| Defender XDR | أحداث النقاط الطرفية (Endpoints) |
| Entra ID Sign-ins / Audit Logs | أحداث الهوية والولوج |
| Office 365 | سجلات البريد، Teams، وSharePoint |
| Azure Activity | عمليات مستوى الإدارة (Management plane) |
| AWS CloudTrail | عبر موصل S3-pull |
| GCP Logging | عبر Pub/Sub |
| Threat Intelligence (TIP / TAXII) | تدفقات مؤشرات الاختراق (IOCs) |
| Syslog / CEF | عبر موصل Linux Forwarder |
| Custom (Logstash / DCR / Logs Ingestion API) | أي بيانات عبر REST-API |

## لغة الاستعلام — KQL

```kql
SecurityEvent
| where TimeGenerated > ago(7d)
| where EventID == 4625 and FailureReason has "0xc000006d"
| summarize Failures = count() by Account, IpAddress, bin(TimeGenerated,1h)
| where Failures > 50
| order by Failures desc
```

تُستخدم لغة KQL أيضاً في Defender Advanced Hunting وAzure Resource Graph وApplication Insights؛ مما يجعلها مهارة أساسية وشاملة للمحلل.

## قواعد التحليل (Analytics rules)

| النوع | الاستخدام |
|------|-----------|
| **مجدولة (Scheduled)** | تشغيل استعلام KQL كل N دقيقة، والتنبيه بناءً على النتائج |
| **في الوقت الحقيقي (NRT)** | نطاق ضيق جداً؛ زمن استجابة منخفض جداً |
| **Microsoft Security** | تمرير التنبيهات القادمة من Microsoft Defender |
| **الاندماج (Fusion)** | ارتباط ذكاء اصطناعي مدمج عبر مصادر متعددة |
| **سلوكية (ML Behavioral)** | تحليل سلوك المستخدمين (UEBA) مدرب بواسطة مايكروسوفت |
| **ذكاء التهديدات** | مطابقة السجلات تلقائياً مع جداول مؤشرات الاختراق (IOCs) |
| **الشذوذ (Anomaly)** | قواعد قائمة بذاتها لتحليل السلوك الشاذ |

```kql
// قاعدة مجدولة: اشتباه في منح صلاحيات OAuth
let priviligedScopes = dynamic([
    "Mail.ReadWrite","Files.ReadWrite.All","Directory.ReadWrite.All"]);
AuditLogs
| where OperationName =~ "Consent to application"
| extend scopes = tostring(parse_json(tostring(ModifiedProperties[1].newValue)))
| where scopes has_any (priviligedScopes)
| project TimeGenerated, InitiatedBy, scopes, TargetResources
```

الإعدادات الموصى بها: مستوى الخطورة "عالية" (High)، تصنيف MITRE: الوصول الأولي (Initial Access - T1566.002)، التجميع حسب `InitiatedBy` مع كتم التكرارات لمدة ساعة.

## كتب العمل (Workbooks)

توفر لوحات تحكم تفاعلية مدمجة (رؤى الكيانات، صحة الهوية، اكتشاف الشبكة). يمكن إنشاء كتب عمل مخصصة باستخدام استعلامات Kusto ومحرر التصورات المرئية.

## الحوادث الأمنية (Incidents)

يتم تجميع التنبيهات المرتبطة تلقائياً في "حوادث". يحتوي كل حادث على:
- الكيانات (Entities): مستخدمون، أجهزة، عناوين IP.
- تسلسل التنبيهات والجدول الزمني.
- التعليقات والتحليلات.
- استعلامات استقصائية مقترحة.
- مشغلات لسيناريوهات الاستجابة (Playbooks).

## سيناريوهات الاستجابة الآلية (Playbooks / Logic Apps)

يتم تشغيل `Playbook` (عبر Logic App) عند إنشاء حادث. الإجراءات الشائعة تشمل:
- تعطيل حساب مستخدم (إجراء Entra ID).
- عزل جهاز (إجراء Defender for Endpoint).
- حظر عنوان IP (إجراء Azure Firewall).
- إرسال إشعار عبر Slack أو Microsoft Teams.
- فتح تذكرة في ServiceNow.
- انتظار موافقة المحلل قبل اتخاذ الإجراء التالي.

## تحليل سلوك المستخدمين والكيانات (UEBA)

يتعلم Sentinel الأنماط الأساسية لكل مستخدم؛ وتوفر جداول `IdentityInfo` و`BehaviorAnalytics` بيانات حول:
- درجة مخاطر تسجيل الدخول (Sign-in score).
- درجة أولوية التحقيق (Investigation Priority Score).
- الأنشطة المرتبطة بالكيان عبر الزمن.

```kql
BehaviorAnalytics
| where InvestigationPriority > 5
| order by InvestigationPriority desc
```

## قوائم المراقبة (Watchlists)

قوائم ثابتة أو ديناميكية للكيانات (VIPs، عناوين IP خطرة، موظفون مستقيلون) تُستخدم في الكشف:

```kql
SigninLogs
| where UserPrincipalName in (_GetWatchlist('VIPs'))
| where ResultType != 0
```

## معالجة الأخطاء (Bad output / fixes)

| العرض | الحل |
|---------|-----|
| فجوة في استهلاك البيانات | التحقق من تدوير مفاتيح مساحة العمل؛ فحص جدول `Heartbeat` |
| قاعدة الكشف لا تعمل أبداً | التحقق من الجدول الزمني ونافذة البحث (lookback)؛ غالباً ما يكون هناك تأخير 5 دقائق |
| خطأ KQL `'Foo' not bound` | اسم الحقل يختلف بين المصادر؛ استخدم `getschema` لمعرفة هيكل الجدول |
| ارتفاع مفاجئ في التكلفة | تدقيق الاستهلاك عبر استعلام `Usage`؛ تقليص المصادر ذات الضجيج العالي |
| بطء في الاستعلامات | أضف فلتر زمني صريح؛ استخدم `summarize` مبكراً؛ استخدم `parallel` لتقسيم المعالجة |

## منظور المدافع (Defender perspective)

الميزة الكبرى لـ Sentinel هي **التكامل العميق مع Defender XDR** — حيث تتدفق بيانات النقاط الطرفية والهويات والبريد والتطبيقات السحابية مترابطة مسبقاً. للمؤسسات التي تعتمد بشكل كبير على تقنيات مايكروسوفت، يوفر هذا النظام أشهراً من أعمال التكامل.

نصيحة تقنية: جداول `SecurityEvent` و`WindowsEvent` قد تتضخم سريعاً. استخدم **قواعد جمع البيانات (DCR)** لفلترة البيانات عند الاستهلاك، وتوجيه البيانات ذات القيمة المنخفضة إلى طبقات التخزين الأساسية (Basic/Auxiliary) لتقليل التكاليف.

## الأمن العملياتي للمدافع (OPSEC)

- يتم التحكم في الوصول عبر Azure RBAC؛ يجب التمييز بدقة بين صلاحيات القارئ (Reader) والمساهم (Contributor).
- يتم تسجيل استعلامات KQL في سجل التدقيق (Audit Log)؛ مما يجعل نشاط المحللين قابلاً للتدقيق.
- للاستخدام الخاص، قم بربط النظام بنقطة نهاية خاصة (Private Endpoint) داخل VNet لتجنب نقاط الاستهلاك العامة.

## أدوات ذات صلة

| الأداة | الفرق الجوهري |
|------|-----------|
| **Splunk** | نظام SIEM مدفوع، يدعم الاستضافة الذاتية أو السحابية |
| **Elastic Security** | صديق للمشاريع مفتوحة المصدر (OSS) |
| **Microsoft Defender XDR** | الجانب التشغيلي (نقاط طرفية/هوية) الذي يغذي Sentinel بالبيانات |
| **Azure Monitor** | المنصة الأساسية للسجلات التي يعتمد عليها Sentinel |
| **Sigma** | تحويل قواعد Sigma إلى KQL عبر أداة `sigmac` |
