# Elastic Security (ELK) — الدليل الكامل

تُعد منظومة `Elastic Security` (المعروفة سابقاً بتطبيق SIEM ضمن حزمة ELK) تطويراً مبنياً على Elasticsearch و Kibana للبحث في السجلات، وبناء لوحات البيانات (Dashboards)، وقواعد الاكتشاف (Detection Rules). تجمع المنظومة بين أدوات Logstash و Beats و Fleet ووكيل الحماية (Endpoint Security agent) في منصة واحدة متكاملة. تتوفر المنظمة بنسخ مجانية ومدفوعة (Platinum / Enterprise).

## مكونات الحزمة (Stack Components)

```
[ Beats / Elastic Agent / Fleet / Logstash ]  →  [ Elasticsearch ]  →  [ Kibana ]
                  │
                  └── Endpoint Security (EDR)
```

| المكون | الغرض |
|-----------|---------|
| **Elasticsearch** | محرك التخزين والبحث |
| **Kibana** | واجهة المستخدم / لوحات البيانات / قواعد الاكتشاف |
| **Beats / Elastic Agent** | أدوات خفيفة لنقل البيانات (Filebeat, Winlogbeat, Auditbeat, Packetbeat) |
| **Fleet** | الإدارة المركزية للوكلاء (Agents) |
| **Endpoint Security** | مكون الـ EDR (مدمج مع وكيل Elastic) |
| **Logstash** | أنبوب معالجة وتحويل البيانات (اختياري) |

## التثبيت (مختبر أحادي العقدة - Single-node Lab)

```terminal
# استخدام Docker compose للحزمة الكاملة
git clone https://github.com/elkninja/elastic-stack-docker-part-one
cd elastic-stack-docker-part-one
docker compose up -d
# واجهة Kibana على http://localhost:5601 ؛ Elasticsearch على منفذ 9200
```

بالنسبة لبيئات الإنتاج: يتم التثبيت عبر مدير الحزم أو Helm، ويستخدم Fleet لإدارة الوكلاء.

## استيعاب السجلات (Onboarding Logs)

هناك مساران رئيسيان:

1. **Elastic Agent + Fleet** (الموصى به): وكيل واحد مع تفعيل التكاملات (Integrations) عبر واجهة Fleet. كل تكامل يتضمن أنابيب معالجة مسبقة.
2. **Beats**: الطريقة التقليدية. أخف وزناً، ولكن تتطلب إدارة الإعدادات يدوياً.

```terminal
# تفعيل وحدة سجلات النظام (syslog) في Filebeat
filebeat modules enable system
filebeat setup -e
systemctl restart filebeat
```

## قواعد الاكتشاف (Detection Rules)

توجد في Kibana ← Security ← Rules. تدعم المنظومة عدة محركات:

| المحرك | الاستخدام |
|--------|-----|
| **Custom Query** | البحث باستخدام KQL أو EQL؛ التنبيه عند المطابقة |
| **Threshold** | التنبيه بناءً على التجميع (مثال: > 5 محاولات دخول فاشلة في 5 دقائق) |
| **Indicator Match** | مطابقة البيانات مع فهارس استخبارات التهديدات (Threat Intel) |
| **EQL Sequence** | اكتشاف تسلسل الأحداث (Stateful event-sequence) |
| **Machine Learning** | اكتشاف الشذوذ عبر خوارزميات التعلم الآلي |
| **New Terms** | اكتشاف أنماط تظهر لأول مرة |

توفر Elastic حوالي 1000 قاعدة اكتشاف مبنية مسبقاً — يمكن تفعيلها حسب الحاجة.

```kql
event.category : process and process.name : ("powershell.exe" or "pwsh.exe") and
process.command_line : (*-enc* or *-encodedcommand* or *FromBase64String*) and
not process.parent.name : ("ConfigurationManager.exe" or "WindowsAzureGuestAgent.exe")
```

## EQL — ربط الأحداث (Event Correlation)

```eql
sequence by host.id, user.name with maxspan=5m
[process where event.action == "creation" and process.name == "powershell.exe"]
[process where event.action == "creation" and process.parent.name == "powershell.exe"
     and process.name in ("net.exe","whoami.exe","ipconfig.exe")]
```

هذا التسلسل يرصد تشغيل PowerShell متبوعاً بأدوات الاستطلاع (Recon) خلال 5 دقائق — وهو نمط كلاسيكي لمرحلة ما بعد الاختراق (Post-foothold).

## الجداول الزمنية (Timelines)

عند الضغط على أي تنبيه ← Timeline ← قم بسحب الأحداث ذات الصلة ← إضافة ملاحظات. يتم حفظها كتحقيق مستمر (Investigation).

## القضايا و SOAR (Cases & SOAR)

- نظام **Cases** مدمج لتتبع الحوادث.
- روابط اتصال (Connectors) مع ServiceNow, Jira, Slack, PagerDuty.
- مساعد Elastic الذكي (مدفوع) لصياغة ملخصات القضايا.

## ECS — مخطط Elastic المشترك (Elastic Common Schema)

تتم نمذجة كافة الحقول وفقاً لـ ECS (مثل `event.action`, `host.name`, `source.ip`). بفضل ECS، تصبح قواعد الاكتشاف قابلة للنقل عبر مصادر السجلات المختلفة — يمكنك الانتقال بين Sysmon و auditd و AWS CloudTrail بنفس الاستعلام.

## سير العمل (Workflows)

### إرسال سجلات Sysmon

```terminal
# على جهاز ويندوز
winlogbeat setup
winlogbeat start
# ملف winlogbeat.yml مهيأ مسبقاً لقناة Sysmon
```

الآن سيعمل استعلام KQL مثل: `event.code : 1 and process.name : "powershell.exe"`.

### الربط بين AWS + Okta + الأجهزة الطرفية

```kql
event.dataset : (okta.system or aws.cloudtrail or endpoint.events.process)
and user.name : "alice"
| sort @timestamp asc
```

### قاعدة مخصصة لاكتشاف تثبيت الخدمات المشبوهة

إنشاء قاعدة (Custom Query) باستخدام:

```kql
event.code : 7045 and winlog.event_data.ServiceFileName : (*\\Users\\* or *\\AppData\\* or *.bat or *.cmd or *.ps1)
```

الخطورة: مرتفعة. المخاطر: 75. التنبيهات: Slack.

## استكشاف الأخطاء وإصلاحها (Troubleshooting)

| العرض | الحل |
|---------|-----|
| `index_not_found_exception` | نمط الفهرس خاطئ؛ تحقق من Kibana ← Stack Management ← Data Views |
| قاعدة الاكتشاف لا تعمل | تحقق من الجدول الزمني ونطاق البحث (Lookback window)؛ العديد من القواعد تستخدم تأخيراً زمنياً للسماح باستيعاب البيانات |
| بطء في البحث | ذاكرة ES غير كافية؛ قم بتقسيم البيانات إلى طبقات (Hot/Warm/Cold) |
| تضارب في تخطيط الحقول (Mapping) | أعد الفهرسة (Reindex) عبر Index State Management |
| فشل انضمام الوكيل إلى Fleet | تحقق من صلاحية رمز الانضمام (Token)؛ وتأكد من جدار الحماية للمنفذ 8220 |

## منظور المدافع (Defender's Perspective)

تعتبر Elastic Security المنصة **الأكثر مرونة** بين حلول SIEM مفتوحة المصدر. نقاط القوة: مجانية للاستخدام الأساسي؛ تجربة استعلام ممتازة (KQL/EQL)؛ و ECS يجعل الاكتشاف عبر المصادر منطقياً.

تنبيه حول استهلاك الموارد: محركات الفهرسة في ES تستهلك الذاكرة العشوائية (RAM) بكثافة. بيئة تضم 200 جهاز تتطلب على الأقل 32 جيجابايت RAM للطبقة السريعة (Hot tier).

## أمن العمليات - للمدافعين (OPSEC)

- عقد ES تحتوي على كافة بياناتك الأمنية — يجب تأمينها عبر تشفير النسخ الاحتياطية (Snapshots).
- مفاتيح واجهة البرمجة (API keys) يجب أن تمنح صلاحيات `monitor` / `read` فقط للمحللين؛ وصلاحية `superuser` يجب أن تكون محدودة للغاية.
- رموز انضمام Fleet قد تسرب بيانات المصادقة؛ يجب تدويرها (Rotate) بانتظام.

## أدوات ذات صلة

| الأداة | الاختلاف |
|------|-----------|
| **Splunk** | أثقل، تجارية بالكامل، نظام تكاملات أوسع |
| **Microsoft Sentinel** | سحابية فقط، تعتمد على KQL |
| **Wazuh** | تدمج الوكيل مع المحلل؛ تركز على HIDS |
| **Graylog** | أخف في إدارة السجلات؛ أقل في منطق الاكتشاف |
| **OpenSearch** | نسخة مشتقة من Elasticsearch مع إضافات أمنية |
