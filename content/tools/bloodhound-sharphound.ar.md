# دليل BloodHound / SharpHound الشامل

يُعد BloodHound الأداة الأبرز لتحليل مسارات الهجوم في Active Directory (AD) باستخدام نظرية الرسوم البيانية (Graph Theory). وتعمل أداة SharpHound كمجمع للبيانات (Data Collector). معًا، يقومان بالكشف عن المسارات الخفية التي تمكن مستخدمًا ذا صلاحيات محدودة من الوصول إلى صلاحيات مسؤول النطاق (Domain Admin)، مما يحول عملية تصعيد الصلاحيات في AD إلى مسألة تتبع لمسارات الرسم البياني.

## البنية الهيكلية (Architecture)

```
[ أداة SharpHound على جهاز Win منضم للنطاق ]
        │ تقوم بجمع بيانات النطاق
        ▼
[ ملفات بصيغة ZIP / JSON ]
        │ يتم رفعها لواجهة BloodHound
        ▼
[ قاعدة بيانات Neo4j ]
        │ استعلامات Cypher / تحليلات جاهزة مسبقًا
        ▼
[ "أقصر مسار من مستخدم عادي إلى DA" ]
```

يوجد إصداران من المنتج:
- **BloodHound CE** — نسخة المجتمع مفتوحة المصدر (الإصدار الحالي والموصى به).
- **BloodHound Legacy** — الواجهة القديمة المستقلة (لا تزال تعمل ولكن التطوير توقف عليها).

## SharpHound — أداة جمع البيانات

### التثبيت (Install)

يمكن استخدام ملف SharpHound.exe (C#) أو مجمع البيانات بلغة Python:

```terminal
pip install bloodhound
git clone https://github.com/SpecterOps/SharpHound  # بناء الأداة باستخدام .NET 6
```

### المعاملات الرئيسية (SharpHound.exe)

| الوسم (Flag) | الغرض |
|--------------|-------|
| `-c, --CollectionMethods <list>` | تحديد البيانات المطلوب جمعها؛ الافتراضي `Default` |
| `-d, --Domain <fqdn>` | تحديد النطاق المستهدف |
| `--LdapUsername / --LdapPassword` | استخدام اعتمادات محددة (بدلاً من Kerberos الحالي) |
| `--DomainController <dc>` | تحديد موزع نطاق (DC) معين |
| `--ZipFilename <name>` | اسم ملف الـ ZIP الناتج |
| `--OutputDirectory <path>` | مسار حفظ المخرجات |
| `--RandomFilenames` | التمويه عبر أسماء ملفات عشوائية |
| `--EncryptZip` | حماية ملف الـ ZIP بكلمة مرور |
| `--Loop / --LoopDuration` | تكرار عملية الجمع (للمهمات الطويلة) |
| `--Throttle <ms>` / `--Jitter <%>` | إبطاء العمليات وتشويه التوقيت (Stealth) |
| `--ExcludeDomainControllers` | عدم استعلام الـ DCs (أكثر هدوءًا عند جمع الجلسات) |

قيم `CollectionMethods` المتاحة:

| الطريقة | البيانات التي تجمعها |
|---------|-----------------------|
| `Default` | المجموعات، الـ ACLs، خصائص الكائنات، الثقة (Trusts)، الجلسات |
| `All` | الطريقة الافتراضية + LocalAdmin, RDP, DCOM, PSRemote, GPOLocalGroup, Cert |
| `DCOnly` | البيانات من الـ DC فقط — لا يتم الاتصال بالأجهزة الأخرى |
| `Session` | بيانات الجلسات النشطة فقط |
| `LocalGroup` | مجموعات الإدارة المحلية (صاخب - يتصل بكافة الأجهزة) |
| `Cert` | قوالب وجهات إصدار شهادات AD CS (لتحليل مسارات ESC) |
| `Trusts` | علاقات الثقة بين الغابات (Forest trusts) |

### bloodhound-python (للاستخدام من جانب المهاجم على Linux)

```terminal
bloodhound-python -u alice -p 'Pass1' -d corp.local -c All -ns 10.0.0.1 --zip
```

## مسارات العمل (Workflows)

### الجمع القياسي (مستخدم عادي على جهاز منضم للنطاق)

```terminal
SharpHound.exe -c Default,LocalAdmin,RDP,DCOM,PSRemote
```

### الجمع الهادئ (DC-only)

```terminal
SharpHound.exe -c DCOnly --Throttle 1000 --Jitter 30 --RandomFilenames
```

### من جهاز Linux خارجي

```terminal
bloodhound-python -u alice@corp.local -p 'Pass1' -d corp.local \
  -c All -ns 10.0.0.1 --zip
```

### تحليل خدمات الشهادات (ESC1-15)

```terminal
SharpHound.exe -c CertServices,Default
# ثم في واجهة BloodHound، اختر الاستعلام الجاهز: "Find Certificate Authorities"
```

## العمل على واجهة BloodHound

1. تشغيل Neo4j و BloodHound CE (يُنصح باستخدام Docker):

```terminal
git clone https://github.com/SpecterOps/BloodHound && cd BloodHound
docker compose -f examples/docker-compose/docker-compose.yml up
# الواجهة على http://localhost:8080
```

2. ارفع ملف الـ ZIP الناتج من SharpHound عبر الواجهة.
3. استخدم عرض **Pathfinding**: المصدر = المستخدم المخترق، الوجهة = `Domain Admins`.
4. تشغيل التحليلات الجاهزة (Pre-canned Analytics):
   - "Find all Domain Admins"
   - "Find Shortest Paths to Domain Admins"
   - "Find AS-REP Roastable Users"
   - "Find Kerberoastable Users"
   - "Find AD CS misconfigurations"

5. استعلامات Cypher المخصصة عند الحاجة:

```cypher
// البحث عن المستخدمين القادرين على تنفيذ DCSync
MATCH (n)-[:GenericAll|GetChanges|GetChangesAll|AllExtendedRights]->(d:Domain {name:'CORP.LOCAL'})
RETURN n.name

// الأجهزة التي تملك فيها مجموعة 'Domain Users' صلاحيات مسؤول محلي
MATCH (g:Group {name:'DOMAIN USERS@CORP.LOCAL'})-[:AdminTo]->(c:Computer)
RETURN c.name
```

## تحليل النتائج

مثال لمسار ناتج:

```
ALICE@CORP.LOCAL
   ↓ عضو في (MemberOf)
HELP_DESK@CORP.LOCAL
   ↓ مسؤول عن (AdminTo)
HELPDESK-PC1.CORP.LOCAL
   ↓ يملك جلسة على (HasSession)
DOMAIN_ADMIN1@CORP.LOCAL
```

خمس خطوات للوصول لـ DA. كل سهم (Edge) يمثل تقنية هجوم موثقة (انقر يمينًا ← "Help") لعرض الأوامر اللازمة للتنفيذ.

## المشاكل الشائعة والحلول

| العرض | السبب | الحل |
|-------|-------|------|
| الرسم البياني فارغ بعد الرفع | تم اختيار نطاق خاطئ في الواجهة | الإعدادات ← قاعدة البيانات ← تبديل النطاق |
| فقدان الكثير من الجلسات | منع عمليات جمع الجلسات / عدم الوصول للأجهزة | أعد التشغيل مع `LocalAdmin,Session` وتوسيع النطاق |
| لا توجد مسارات وصول | البيئة مقسمة بشكل جيد (Segmented) | ابحث عن مسارات Shadow-credentials أو NTLM-relay |
| نفاذ ذاكرة Neo4j | استيراد بيانات AD ضخمة جدًا | ارفع قيمة neo4j heap إلى 8G أو أكثر |

## منظور المدافعين (Defender's Perspective)

أداة SharpHound "صاخبة" جدًا إذا لم يتم ضبطها:

- تولد كمًا هائلاً من استعلامات LDAP لموزع النطاق (DC).
- عند استخدام `LocalGroup / Session`: يتم الاتصال بكل جهاز عبر بروتوكول SAMR (منفذ 445)، مما يولد العديد من جلسات SMB وأحداث EventID 4624/4634.

أفكار للاكتشاف:
- مراقبة حجم استعلامات LDAP (توفرها Microsoft Defender for Identity تلقائيًا).
- رصد ملف `SharpHound.exe` عبر Sysmon EID 1.
- رصد انفجار في أحداث EID 4661 (الوصول لكائنات AD) من مستخدم واحد في وقت قصير.
- زراعة كائنات وهمية (Honey-objects): مثل مجموعة "Domain Admins" وهمية ومراقبة من يحاول استعلام أعضائها.

## أمن العمليات (OPSEC)

- استخدم `bloodhound-python` من جهازك الخاص؛ كل ما تحتاجه هو اعتمادات مستخدم في النطاق والوصول للـ DC.
- استخدم `--Throttle 2000 --Jitter 50` لتبدو الاستعلامات كأنها حركة LDAP طبيعية.
- تجنب طرق `LocalGroup/Session` في البداية؛ ابدأ بـ `DCOnly` ثم تصاعد عند الضرورة.
- لا ترفع ملفات SharpHound أبدًا إلى نسخ BloodHound سحابية مشتركة؛ لأن ذلك يكشف كامل بنية الـ AD الخاصة بالعميل.

## أدوات ذات صلة

| الأداة | التخصص |
|--------|---------|
| **AD Explorer** | مستعرض AD للقراءة فقط، هادئ جدًا |
| **PingCastle** | أداة للمدافعين لتقييم وضع أمان الـ AD |
| **ADRecon** | توليد تقارير Excel شاملة عن وضع الـ AD |
| **Adalanche** | بديل لـ BloodHound بنموذج رسم بياني مختلف |
| **Certify / certipy** | متخصصة في AD CS وتغذي بيانات BloodHound |
| **Rubeus** | لاستغلال ثغرات Kerberos المكتشفة عبر مسارات BloodHound |
