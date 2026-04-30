# دليل Splunk الشامل

يُعد `Splunk` نظام إدارة المعلومات والأحداث الأمنية (SIEM) الأبرز في بيئات المؤسسات الكبرى. تكمن نقاط قوته في لغة معالجة البحث (SPL) القوية، والنظام البيئي الغني بالموصِّلات (Connectors)، والمحتوى الأمني الناضج مثل (Splunk ES) و (ESCU). أما أبرز تحدياته فتتمثل في تكلفة التراخيص واستهلاك الموارد العالي.

## الإصدارات (Editions)

| الإصدار | الغرض من الاستخدام |
|---------|-----|
| **المجاني (Free)** | للمختبرات المحلية فقط؛ بدون صلاحيات دخول، بحد أقصى 500 ميجابايت/يوم |
| **Enterprise** | استضافة ذاتية (Self-host)؛ الترخيص يعتمد على حجم البيانات الواردة (GB/يوم) |
| **Splunk Cloud** | خدمة سحابية مدارة بالكامل |
| **Splunk ES** | تطبيق SIEM المتقدم — يأتي مع محتوى كشف التهديدات (ESCU) |
| **Splunk SOAR** (Phantom) | أتمتة الاستجابة الأمنية (Orchestration) والـ Playbooks |

## نموذج المكونات (Component Model)

```
[ Forwarders / HEC ]  →  [ Indexers ]  →  [ Search head(s) ]  →  [ User ]
```

| المكون | الغرض |
|-----------|---------|
| **Universal Forwarder** | أداة خفيفة لإرسال السجلات (Log shipper) |
| **Heavy Forwarder** | أداة إرسال متطورة يمكنها معالجة وتحليل البيانات قبل إرسالها |
| **HEC** | جامع أحداث HTTP لاستقبال البيانات عبر الويب |
| **Indexer** | تخزين البيانات، تقسيمها إلى حاويات (Buckets)، وتشغيل عمليات البحث |
| **Search head** | إرسال طلبات البحث ودمج النتائج للمستخدم |
| **Cluster master / deployer** | أدوار التنسيق وإدارة العناقيد (Clusters) |

## لغة معالجة البحث (SPL — Search Processing Language)

```
index=sysmon EventCode=1 Image="*\\powershell.exe"
| where match(CommandLine,"FromBase64String|IEX|Invoke-Expression|-encoded")
| stats values(CommandLine) as cmds count by Computer User
| where count > 3
```

تعتمد اللغة على تسلسل الأوامر المفصولة برمز الأنبوب `|`:

| العائلة | أمثلة |
|--------|----------|
| التصفية (Filtering) | `where`, `search` |
| التحويل (Transforming) | `eval`, `rex` (تعبيرات نمطية) |
| التجميع (Aggregation) | `stats`, `tstats`, `chart` |
| الترتيب (Sorting) | `sort`, `head`, `tail`, `dedup` |
| الربط (Joining) | `join`, `lookup` |
| الوقت (Time) | `bucket _time span=5m` |
| المخرجات (Output) | `outputlookup`, `collect index=summary` |
| التكرار (Iteration) | `mvexpand`, `streamstats` |

## أنماط SPL الشائعة

### أعلى النتائج (Top-N)

```
index=auth_logs failed_login=true
| top src_ip limit=10
```

### السلاسل الزمنية (Time-series)

```
index=net | timechart span=5m count by status
```

### كشف الشذوذ — علاقة الأب بالابن (Parent → Child)

```
index=sysmon EventCode=1
| stats values(ParentImage) as parents count by Image
| where count < 10 AND mvcount(parents) > 5
```

### الإثراء باستخدام جداول البحث (Lookup-driven enrichment)

```
index=auth_logs | lookup users.csv user OUTPUT department title
| stats count by department
```

## إصدار المؤسسات الأمني (Splunk ES - Premium)

- **إطار الأحداث البارزة (Notable Events Framework)** — كل عملية كشف تولد "حدثاً بارزاً"؛ يقوم المنسق بإدارة التحقيقات من خلاله.
- **التنبيه المبني على المخاطر (Risk-Based Alerting - RBA)** — يتم وسم الأحداث بدرجات خطورة؛ ويتم إرسال التنبيه عند تجاوز مجموع المخاطر حداً معيناً.
- **تحديث محتوى أمن المؤسسات (ESCU)** — مكتبة قواعد كشف التهديدات المحدثة أسبوعياً من قبل فريق أبحاث التهديدات في Splunk.
- **إطار الأصول والهويات (Asset / Identity Framework)** — ربط السجلات بالأصول والمستخدمين المعروفين في المؤسسة.

لتمكين الكشوفات: انتقل إلى `Apps → Enterprise Security Content Update → Browse`.

## ملفات الإعداد (Configuration Files)

| الملف | الغرض |
|------|---------|
| `inputs.conf` | تحديد البيانات المراد قراءتها من القرص أو الشبكة |
| `props.conf` | تعريف نوع المصدر (تنسيق الوقت، فواصل الأسطر، التحويلات) |
| `transforms.conf` | استخراج الحقول وتوجيه أنواع المصادر |
| `outputs.conf` | تحديد وجهات إرسال البيانات (Forwarding) |
| `indexes.conf` | إعدادات الفهرس (مدة الاحتفاظ، المسارات) |
| `savedsearches.conf` | عمليات البحث المجدولة والتنبيهات |

```
# inputs.conf مثال لـ
[monitor:///var/log/nginx/access.log]
disabled = false
sourcetype = nginx:access
index = web

# props.conf مثال لـ
[nginx:access]
TIME_FORMAT = %d/%b/%Y:%H:%M:%S %z
SHOULD_LINEMERGE = false
TRANSFORMS-redact = redact-cookies
```

## سير العمل (Workflows)

### بناء قاعدة كشف من عينة حدث

1. تشغيل بحث استكشافي لتحديد الخصائص الفريدة للحدث.
2. تضييق النطاق باستخدام جمل `where`.
3. التحقق من النتائج مقابل فترة زمنية "سليمة" لتقليل الإيجابيات الكاذبة (False Positives).
4. الحفظ كـ (Alert): جدولة الوقت + تحديد العتبة (Threshold) + إجراءات الاستجابة (إيميل، Webhook، أو SOAR Playbook).

### استخدام التنبيه المبني على المخاطر (RBA)

```
... | rba_score = 30 | sendnotablerisk
```

كل قاعدة تساهم في درجة الخطورة الإجمالية للكيان (المستخدم أو الجهاز).

## المشكلات الشائعة والحلول

| العرض | الحل |
|---------|-----|
| انتهاء وقت البحث (`timeout`) | زيادة `dispatch.timeout` أو استخدام `tstats` المعتمد على نماذج البيانات المتسارعة |
| اختفاء الحقول المستخرجة | فشل توزيع `props.conf`؛ استخدم `splunk btool props list` للتصحيح |
| امتلاء الفهارس (Indexers) | زيادة الترخيص أو تقليل مدة الاحتفاظ عبر `indexes.conf` |
| فشل الكشف | نافذة البحث الزمني غير صحيحة؛ تحقق عبر `index=_internal sourcetype=scheduler` |
| بطء البحث في البيانات الضخمة | بناء نموذج بيانات (Data Model) وتفعيل التسريع (Acceleration) |

## منظور المدافع (Defender Perspective)

الميزة الأقوى في Splunk هي أوامر `tstats` فوق نماذج البيانات المتسارعة — حيث يمكن تشغيل استعلامات على بيانات تمتد لسنوات في أقل من ثانية. ادمج ذلك مع ESCU للحصول على محتوى كشف عالي الجودة فوراً.

التكلفة هي القيد الأساسي: حجم البيانات اليومي × تكلفة الجيجابايت قد تصل لأرقام خيالية. لذلك، يجب تحسين أنواع المصادر وتصفية البيانات غير الضرورية عند أدوات الإرسال (Forwarders).

## أمن العمليات (OPSEC) للمدافعين

- صلاحيات مدير Splunk تعني سيطرة كاملة على بيانات المؤسسة؛ يجب تقييدها بصرامة.
- استخدام `SEDCMD` لإخفاء معلومات الهوية الشخصية (PII) في الحقول.
- رموز HEC هي مفاتيح وصول؛ يجب تدويرها (Rotate) بانتظام.

## أدوات ذات صلة

| الأداة | الفرق الجوهري |
|------|-----------|
| **Elastic Security** | يميل للمصدر المفتوح وأقل تكلفة |
| **Microsoft Sentinel** | سحابي أصيل، يستخدم لغة KQL |
| **Sumo Logic** | نظام SIEM كخدمة سحابية (SaaS) |
| **Cribl** | توجيه وتشكيل البيانات قبل وصولها لـ Splunk |
| **Sigma** | قواعد كشف مستقلة يمكن تحويلها إلى SPL عبر `sigmac` |
