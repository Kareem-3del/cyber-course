# دليل Shodan الشامل

يُعد Shodan محرك البحث الأول لكل ما هو متصل بشبكة الإنترنت. يقوم بفهرسة المنافذ المفتوحة (Open Ports)، واللافتات (Banners)، والشهادات الرقمية (Certs)، واستجابات HTTP، وبروتوكولات أنظمة التحكم الصناعي (ICS)، والمزيد. يُستخدم بشكل أساسي في عمليات الاستطلاع السلبي (Passive Reconnaissance) ولرصد وتتبع الثغرات والتعرضات (Exposures) الخاصة بمنظمتك.

## التثبيت والمصادقة (Install + Auth)

```terminal
pip install shodan
shodan init <YOUR_API_KEY>
# المفتاح المجاني يعطي حوالي 100 رصيد استعلام شهريًا مع فلاتر محدودة
```

تعمل واجهة الموقع `shodan.io` بنفس المفتاح؛ وتعتبر واجهة السطر البرمجي (CLI) مجرد وسيلة تفاعل سريعة معه.

## الأوامر الفرعية (Subcommands)

| الأمر | الوظيفة |
|-------|---------|
| `shodan search <query>` | البحث في الفهرس وطباعة عناوين الـ IPs |
| `shodan host <ip>` | عرض السجل الكامل لعنوان IP معين |
| `shodan count <query>` | حساب النتائج دون استهلاك رصيد الاستعلامات التفصيلي |
| `shodan stats <query>` | إحصائيات مجمعة (أهم الدول، المنظمات، المنافذ) |
| `shodan download <file> <query>` | تحميل النتائج بشكل ضخم في ملف JSON Lines محلي |
| `shodan parse <file>` | فحص وتحليل ملف تم تحميله مسبقًا |
| `shodan alert` | مراقبة مباشرة لنتائج مطابقة لاستعلام معين |
| `shodan scan submit <ip>` | طلب مسح فوري لعنوان IP (يستهلك أرصدة) |
| `shodan radar` / `myip` | عرض الخريطة العالمية / عنوان الـ IP الخاص بك |

## بناء الاستعلامات — الفلاتر الهامة (Query Syntax)

| الفلتر | مثال | الاستخدام |
|--------|---------|-----|
| `port` | `port:443` | منفذ الخدمة |
| `country` | `country:DE` | رمز الدولة (ISO-2) |
| `org` | `org:"Acme Corp"` | اسم المنظمة المالكة للـ ASN |
| `net` | `net:1.2.3.0/24` | نطاق الـ CIDR |
| `hostname` | `hostname:.target.gov` | مطابقة لاحقة الـ DNS |
| `ssl` | `ssl:"target.gov"` | موضوع الشهادة (TLS Subject) أو SAN |
| `ssl.cert.subject.cn` | `ssl.cert.subject.cn:"vpn"` | الـ CN الخاص بالشهادة |
| `http.title` | `http.title:"index of"` | عنوان الصفحة |
| `http.html` | `http.html:"GlobalProtect"` | محتوى نص الصفحة |
| `http.favicon.hash` | `http.favicon.hash:-1234567890` | البحث عبر هاش الـ Favicon (mmh3 hash) |
| `product` | `product:"Apache httpd"` | اسم المنتج الذي تم التعرف عليه |
| `version` | `product:"Apache" version:"2.4.49"` | المنتج مع الإصدار (للبحث عن ثغرات محددة) |
| `os` | `os:"Linux 3.x"` | نظام التشغيل المكتشف |
| `vuln` | `vuln:CVE-2024-3400` | الأجهزة المصنفة كمصابة بثغرة معينة (مدفوع) |
| `tag` | `tag:vpn` | وسوم مختارة لخدمات محددة |
| `category` | `category:ics` | تصنيف عالي المستوى (مثل أنظمة التحكم الصناعي) |
| `has_screenshot:true` | | الأجهزة التي تملك لقطة شاشة للواجهة |
| `before:`/`after:` | `after:2026-01-01` | النطاق الزمني |

المعاملات: AND (افتراضي)، `OR` ، `-`/`NOT` ، و `()` للتجميع.

## مسارات العمل (Workflows)

### رسم خريطة الوجود الخارجي للهدف

```terminal
shodan search 'ssl:"target.gov"'
shodan search 'org:"Target Government" port:443'
shodan search 'hostname:.target.gov -port:53'
```

### الانتقال من لوحة تحكم واحدة إلى كافة النسخ المماثلة عالميًا

```terminal
# الحصول على هاش الـ favicon للوحة التحكم
curl -s https://known.example/favicon.ico | python3 -c "import mmh3,sys,base64,codecs;b=codecs.encode(sys.stdin.buffer.read(),'base64');print(mmh3.hash(b))"
# البحث:
shodan search 'http.favicon.hash:-1234567890'
```

### البحث عن ثغرة (CVE) حديثة عبر نطاق دولة

```terminal
shodan search 'product:"Ivanti Connect Secure" country:US' --fields ip_str,port,hostnames,version
```

### العثور على أنظمة التحكم الصناعي (ICS / OT) المكشوفة

```terminal
shodan search 'product:"Siemens, SIMATIC, S7" country:US' --limit 50
shodan count 'category:ics country:US'
```

### حفظ النتائج الضخمة

```terminal
shodan download exposure.json.gz 'org:"Target" port:443'
shodan parse --fields ip_str,port,product,version exposure.json.gz | head
```

### مراقبة حية لنطاق الـ IP الخاص بمنظمتك

```terminal
shodan alert create "Target Net" 1.2.3.0/24
shodan alert list
shodan stream --alert <id>
```

## تحليل المخرجات

تطبع واجهة الـ CLI البيانات التالية: `IP PORT ORG HOSTNAMES`. بينما تعرض واجهة الويب اللافتة (Banner)، لقطة الشاشة، وسجل التغييرات.

الهدف الأساسي من الاستخدام هو الإجابة على: أي من عناوين الـ IP الخاصة بمنظمتي تعرض الخدمة X على المنفذ Y بشكل غير متوقع؟ إذا كانت الإجابة مفاجئة، فهذا هو اكتشافك الأول.

## القيود والمحاذير (Limits & Pitfalls)

| المشكلة | الحل |
|---------|-------|
| `Search filters require an upgraded API plan` | بعض الفلاتر (`vuln`, `tag`) تتطلب اشتراكات مدفوعة |
| بيانات قديمة | Shodan يقوم بالمسح بشكل دوري؛ تاريخ `last_update` قد يكون من عدة أسابيع |
| خدمات مفقودة على منافذ غير شائعة | Shodan يمسح المنافذ الشائعة؛ المنافذ النادرة قد لا تظهر - اطلب مسحًا عبر `shodan scan` |
| لافتات (Banners) خادعة | بعض المنتجات تقوم بتزييف اللافتات؛ تحقق عبر الفحص النشط (Active Probing) |
| تكرار النتائج للأجهزة متعددة المنافذ | استخدم خيار `--fields ip_str` وقم بإزالة التكرار |

## منظور المدافعين (Defender's Perspective)

Shodan لا يقوم بالمسح من مجموعة IPs ثابتة؛ بل يستخدم زواحف (Crawlers) موزعة ومتغيرة. حظر نطاقات Shodan المعروفة قد يؤخر زاحفًا واحدًا فقط. الأفضل هو:

- الاشتراك في مراقبة المنظمة (Paid Monitoring) للحصول على تنبيهات عبر البريد عند ظهور أي تعرض جديد خلال 24 ساعة.
- إجراء فحص أسبوعي: `shodan search 'org:"YourOrg"' --fields port,hostnames,version` ومقارنة النتائج مع الأسبوع السابق.
- تتبع أي منتج يحمل اسم بائع ظهرت له ثغرة CVE حديثة؛ فهذا هو "الثمر الداني" للمهاجمين.

## ملاحظات أمن العمليات (OPSEC)

- يتم تسجيل استعلامات واجهة البرمجة (API queries) في حسابك. استخدم مفاتيح منفصلة لكل مهمة بحثية حساسة.
- المفتاح المجاني محدود السرعة ويفتقد لفلاتر هامة؛ مفتاح "الأكاديمي" غالبًا ما يكون الخيار الأفضل للترقية بأقل تكلفة.
- الأهداف لا تلاحظ استعلاماتك لـ Shodan؛ لأن Shodan يمسح العالم مسبقًا، وأنت تبحث في فهرسه فقط.

## أدوات ذات صلة

| الخدمة | الفرق |
|---------|------------|
| Censys | فهرس مماثل؛ أفضل في بصمة TLS؛ وتيرة مسح مختلفة |
| FOFA | صيني؛ ممتاز لتغطية منطقة آسيا والمحيط الهادئ |
| ZoomEye | فهرس صيني مماثل |
| BinaryEdge | فهرس غربي مماثل |
| onyphe | فرنسي؛ متخصص في الـ DNS السلبي ومؤشرات الاختراق (IoCs) |
| `nuclei` | للمتابعة النشطة بعد أن يجد Shodan الأهداف المرشحة |
