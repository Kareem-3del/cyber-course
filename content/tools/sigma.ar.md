# دليل Sigma الكامل — معيار اكتشاف التهديدات في السجلات

تُعد `Sigma` صيغة عامة (Generic Signature Format) لكتابة بصمات الكشف المبنية على السجلات (Log-based Detections). الفكرة الجوهرية هي: اكتب القاعدة مرة واحدة بصيغة YAML، ثم قم بتحويلها إلى استعلامات متوافقة مع KQL / SPL / Elastic / Sentinel / Chronicle وغيرها عبر أداة التحويل `sigmac` (أو خليفتها `pySigma`). يُطلق عليها غالباً "YARA المخصصة للسجلات".

## تثبيت أدوات التحويل (Install)

```terminal
pipx install sigma-cli           # الأداة الحديثة؛ تعتمد على pySigma
sigma --help

# النسخة القديمة (Legacy):
pip install sigmatools
sigmac --help
```

تعتمد الأداة على برامج مساعدة (Plugins) لكل قاعدة بيانات (Backends):

```terminal
sigma plugin install splunk
sigma plugin install kusto       # لأنظمة Sentinel / Defender
sigma plugin install elasticsearch
sigma plugin install opensearch
sigma plugin install chronicle
sigma plugin install qradar
sigma plugin install sentinelone
```

## هيكلية القاعدة (Rule Structure)

```yaml
title: Mimikatz LSASS Dump via comsvcs.dll
id: 7af2cba1-ce0e-4d39-9d52-31e2c8b3a7e4
status: stable
description: >
    يكتشف استخدام وظيفة MiniDump في مكتبة comsvcs.dll لاستخراج بيانات lsass عبر rundll32.
references:
    - https://github.com/SwiftOnSecurity/sysmon-config
author: Florian Roth
date: 2026/04/30
tags:
    - attack.credential_access
    - attack.t1003.001
logsource:
    product: windows
    category: process_creation
detection:
    selection:
        Image|endswith: '\rundll32.exe'
        CommandLine|contains|all:
            - 'comsvcs.dll'
            - 'MiniDump'
    filter:
        ParentImage|endswith: '\Trusted-EDR.exe'
    condition: selection and not filter
falsepositives:
    - عمليات استخراج بيانات شرعية من قبل فريق الاستجابة للحوادث (نادر)
level: high
```

## تشريح المكونات (Anatomy)

| الحقل | الغرض |
|-------|---------|
| `title / id / status / description / references / author / date / tags` | البيانات الوصفية (Metadata) |
| `logsource: product / service / category` | سياق رسم خرائط الحقول (Field-mapping context) |
| `detection: <selection name>` | كتلة المطابقة المسماة |
| صيغة التعديل: `field|contains`, `field|re`, `field|base64`, `field|cidr`, `field|all` | تحويلات المطابقة (Match transformations) |
| `condition:` | العمليات المنطقية على التحديدات (`selection_a and not filter`) |
| `level:` | مستوى الخطورة: `informational`, `low`, `medium`, `high`, `critical` |
| `falsepositives:` | توثيق احتمالات التنبيهات الخاطئة |

## التحويل إلى الأنظمة المستهدفة (Compile to a backend)

```terminal
sigma convert -t splunk    rules/lsass_dump.yml
sigma convert -t kusto     rules/lsass_dump.yml
sigma convert -t es-qs     rules/lsass_dump.yml
sigma convert -t sentinel  rules/lsass_dump.yml -o output.json
sigma convert -t splunk -p sysmon -p windows-audit  rules/    # تحويل مجلد كامل
```

خيار `-p <pipeline>` يطبق أنابيب معالجة الحقول (Pipelines) لضمان توافق الأسماء (مثلاً: أسماء حقول Sysmon مقابل سجلات Windows التقليدية).

أنابيب معالجة هامة:

- `sysmon` — أسماء حقول خاصة بـ Sysmon.
- `windows-audit` — أسماء حقول سجلات أحداث Windows الأصلية.
- `microsoft_xdr` — جداول Defender XDR Advanced Hunting.
- `aurora` — تنسيق عميل Nextron Aurora.
- `crowdstrike_falcon` — أحداث Falcon Insight.

## مصادر القواعد (Rule Sources)

- **SigmaHQ/sigma** — المستودع الرسمي للمجتمع، يضم أكثر من 3000 قاعدة.
- **Florian Roth's threat-detection rules** — قواعد Sigma تجارية (Aurora / Nextron).
- **Red Canary / Splunk Threat Research / DFIR Report** — إصدارات دورية مميزة.

## سير العمل (Workflow)

### التحويل والنشر التلقائي (CI/CD)

```terminal
git clone https://github.com/SigmaHQ/sigma
cd sigma
sigma convert -t kusto -p microsoft_xdr rules/windows/process_creation -o /tmp/kql/
# ثم دفع ملفات /tmp/kql/*.kql إلى Sentinel عبر Logic Apps أو AzCLI
```

### التحقق من القواعد

```terminal
sigma check rules/        # فحص بناء الجملة (Lint) وصحة الوسوم (Tags)
sigma test rules/lsass_dump.yml --backend splunk
```

### الهجرة بين الأدوات (Cross-tool migration)
إذا كان لديك مئات القواعد في نظام SIEM قديم، قم بتحويلها إلى Sigma مرة واحدة، ثم انشرها في نظامك الجديد بسهولة.

## معالجة المشاكل (Bad Output / Fixes)

| العرض | الحل |
|---------|-----|
| `KeyError: ProcessCommandLine` بعد التحويل | خطأ في أنبوب المعالجة؛ أضف `-p sysmon` |
| الاستعلام الناتج يحتوي على الكثير من `*` | فقدان "المعدل" (Modifier)؛ استخدم `|contains` أو `|endswith` |
| المخرجات تسبب ضوضاء عالية | أضف كتلة `filter:` واستخدم `condition: selection and not filter` |
| النظام المستهدف لا يدعم ميزة معينة | جرب أنبوب معالجة بديلاً؛ بعض الأنظمة تحد من تجميع `count()` |

## منظور المدافع (Defender Perspective)

تعتبر Sigma هي **اللغة المشتركة** لتبادل عمليات الكشف في الفترة ما بين 2024–2026. القدرة على نقل القواعد بين الأدوات تعني إمكانية تغيير مزودي أنظمة SIEM دون الحاجة لإعادة كتابة مكتبة الكشف الخاصة بك.

النمط التشغيلي المقترح:
1. تأليف أو نسخ قواعد Sigma في مستودع Git خاص بفريق هندسة الكشف (Detection Engineering).
2. استخدام CI لتحويل القواعد لنظام SIEM النشط.
3. اعتماد سير عمل "Pull-request" للموافقة على التنبيهات الجديدة.
4. الربط مع **Atomic Red Team** لاختبار القواعد — كل قاعدة Sigma يجب أن يقابلها اختبار "Atomic" لتفعيلها والتأكد من فعاليتها.

## نصائح أمن العمليات (OPSEC)

- تصف قواعد Sigma عمليات الكشف بناءً على المحتوى. يمكن للمهاجمين الذين يراقبون مستودع SigmaHQ تغيير أدواتهم لتجاوز قواعد محددة؛ هي لعبة "قط وفأر" مستمرة.
- التتبع: اشترك في تحديثات SigmaHQ وقيم كل قاعدة جديدة مقابل التكتيكات والتقنيات (TTPs) الحالية في بيئتك.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **YARA** | نفس المفهوم ولكن للملفات والذاكرة |
| **Hayabusa / Chainsaw** | أدوات للبحث في سجلات EVTX تدعم قواعد Sigma |
| **uncoder.io** | واجهة ويب لتحويل قواعد Sigma إلى لغات SIEM المختلفة |
| **Kestrel** | لغة بحث عن التهديدات عالية المستوى |
| **Atomic Red Team** | اختبار القواعد عبر محاكاة هجمات واقعية |
