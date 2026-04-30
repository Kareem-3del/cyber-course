# دليل أداة Nuclei الشامل

تُعد أداة `nuclei` ماسحاً ضوئياً للثغرات الأمنية يعتمد على القوالب (Templates). يمثل كل قالب ملف YAML يصف طلباً (Request) يتم إرساله إلى الهدف مع محددات (Matchers) للتحقق من الاستجابة. يحتوي مستودع القوالب الخاص بالمجتمع على أكثر من 9,000 قالب تغطي الثغرات المعروفة (CVEs)، والبيانات المكشوفة، والأخطاء في الإعدادات، وبيانات الاعتماد الافتراضية، ويتم تحديثه بشكل أسبوعي.

## التثبيت (Install)

```terminal
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
nuclei -update                 # تحديث ملف الأداة البرمجي
nuclei -update-templates       # تحديث مستودع القوالب
```

عند التشغيل الأول، سيتم تحميل القوالب إلى المسار `~/.local/nuclei-templates/`.

## المدخلات (Inputs)

| الخيار | الغرض |
|------|---------|
| `-u <url>` | استهداف رابط واحد |
| `-l <file>` | قائمة أهداف (روابط أو عناوين مضيفين) |
| stdin | استقبال مخرجات من أدوات أخرى مثل `httpx` عبر الأنابيب |
| `-target <url>` | نفس وظيفة خيار `-u` |

## اختيار القوالب (Template selection)

| الخيار | الغرض |
|------|---------|
| `-t <path>` | تحديد قالب معين، مجلد، أو نمط (Glob) |
| `-w <workflow>` | تشغيل تدفق عمل (سلسلة قوالب مترابطة) |
| `-tags <list>` | تصفية القوالب حسب الوسوم (مثل `cve`, `rce`, `wp`) |
| `-severity <list>` | التصفية حسب الخطورة (`low`, `medium`, `high`, `critical`) |
| `-id <list>` | تشغيل قوالب محددة بمعرفاتها |
| `-include-tags / -exclude-tags` | القوائم المسموحة والمرفوضة للوسوم |
| `-tt <type>` | نوع القالب (`http`, `dns`, `tcp`, `headless`, `code`) |
| `-nt` | تشغيل القوالب الجديدة فقط (منذ آخر تحديث) |
| `-validate` | التحقق من صحة القوالب برمجياً دون تشغيلها |

## إعدادات الشبكة ومعدل الطلبات (Network and rate)

| الخيار | الغرض |
|------|---------|
| `-c <int>` | عدد القوالب التي تعمل في وقت واحد (Concurrency) |
| `-bs <int>` | عدد الأهداف لكل قالب في المرة الواحدة (Bulk size) |
| `-rl <int>` | الحد الأقصى لمعدل الطلبات في الثانية (Rate limit) |
| `-timeout <sec>` | وقت انتهاء الطلب الواحد |
| `-retries <n>` | عدد محاولات إعادة الطلب |
| `-proxy <url>` | توجيه حركة المرور عبر وكيل (مثل Burp Suite) |
| `-H <header>` | إضافة ترويسة مخصصة (للمصادقة أو تغيير User-Agent) |

## المخرجات (Output)

| الخيار | الغرض |
|------|---------|
| `-o <file>` | حفظ النتائج في ملف نصي |
| `-jsonl <file>` | حفظ النتائج بصيغة JSONL (كل اكتشاف في سطر) |
| `-store-resp` | حفظ الاستجابات المطابقة (مفيد جداً لمرحلة التحقق التكتيكي) |
| `-silent` | طباعة الاكتشافات فقط في الواجهة |
| `-v / -vv` | تفعيل المخرجات التفصيلية |
| `-stats` | عرض إحصائيات مباشرة أثناء الفحص |
| `-stream` | كتابة النتائج فور ظهورها دون انتظار التخزين المؤقت |

## التقنيات الخارجية (OAST)

تستخدم قوالب OAST لاختبار ثغرات مثل Blind RCE و SSRF و Log4Shell عبر إرسال حمولات برمجية تراقب خوادم خارجية (Callback servers). هذا الأمر ضروري لاكتشاف الثغرات التي لا تظهر استجابة مباشرة (Non-reflective bugs).

| الخيار | الغرض |
|------|---------|
| `-iserver <url>` | استخدام خادم Interactsh خاص بك |
| `-itoken <token>` | رمز المصادقة للخادم الخاص |
| `-no-interactsh` | تعطيل ميزات OAST |

## سيناريوهات التشغيل (Workflows)

### فحص سريع للثغرات المعروفة (CVEs)

```terminal
nuclei -u https://target.gov \
  -severity critical,high -tags cve,exposure -silent -o findings.txt
```

### فحص جودة العمليات القتالية من قائمة أهداف

```terminal
cat live.txt | nuclei -severity medium,high,critical \
  -tags cve,exposure,misconfig,default-login \
  -c 50 -rl 150 -bs 25 \
  -store-resp -store-resp-dir resp/ \
  -jsonl -o results.jsonl
```

### البحث عن CVE محدد في نطاق واسع

```terminal
nuclei -t cves/2024/CVE-2024-3400.yaml -l vpn-targets.txt -severity critical
```

### استخدام Burp Collaborator بدلاً من Interactsh

```terminal
nuclei -l live.txt -tags oast -iserver https://abc.oastify.com -itoken <T>
```

### بناء قالب مخصص (Custom template)

```yaml
id: exposed-prometheus

info:
  name: Prometheus exposed
  author: you
  severity: medium
  tags: misconfig,prometheus

http:
  - method: GET
    path:
      - "{{BaseURL}}/metrics"
    matchers-condition: and
    matchers:
      - type: status
        status: [200]
      - type: word
        words: ["# HELP go_gc_"]
        part: body
```

## تحليل النتائج (Good output)

تظهر النتائج بشكل منظم يتضمن معرف القالب، نوع البروتوكول، مستوى الخطورة، الرابط المتأثر، ووصف الثغرة.

```
[CVE-2024-3400] [http] [critical] https://vpn.target.gov [PAN-OS GlobalProtect command injection]
[exposed-panel-grafana] [http] [info] https://staging.target.gov:3000
[default-login-jenkins] [http] [high] https://ci.target.gov [admin:admin]
```

## استكشاف الأخطاء وإصلاحها

| العرض | السبب المحتمل | الحل المقترح |
|---------|-------|-----|
| كثرة نتائج `info` التي تخفي الثغرات الحقيقية | غياب فلتر الخطورة | استخدم `-severity medium,high,critical`. |
| عدم ظهور نتائج على هدف مؤكد الإصابة | بصمة الاستجابة تغيرت أو المعرف خاطئ | استخدم `-debug` لرؤية الطلب والاستجابة؛ جرب `-id` لقالب محدد. |
| فشل الاتصال بخادم Interactsh | حظر الشبكة لنطاقات `oast.fun` | استضف خادمك الخاص (`interactsh-server`) واستخدم `-iserver`. |
| تلقي خطأ `rate limited` من الهدف | معدل الطلبات مرتفع جداً | خفض قيمة `-rl` إلى 30-50؛ واحترم أنظمة WAF. |

## منظور المدافع (Defender's perspective)

يمكن رصد نشاط Nuclei بسهولة عبر البصمات التالية:
- **User-Agent:** القيمة الافتراضية تشير بوضوح للأداة.
- **أنماط الروابط:** طلب ملفات حساسة مثل `/.git/config` أو `/.env`.
- **اتصالات OAST:** محاولات اتصال بنطاقات مثل `*.oast.fun` أو `*.oastify.com`.

**توصيات الكشف:**
- قواعد WAF: حظر الـ User-Agent الافتراضي.
- قواعد DNS: التنبيه عند محاولة اتصال خارجي بنطاقات OAST المعروفة.
- استخدام "قوالب العسل" (Honeytokens): وضع ملفات وهمية مثل `/admin/.env`؛ أي محاولة وصول إليها تعتبر نشاطاً مسحياً.

## اعتبارات العمليات الأمنية (OPSEC)

- الـ User-Agent الافتراضي هو منارة كشف (Beacon). قم بتغييره دائماً باستخدام `-H`.
- استضف خادم Interactsh على نطاق خاص بك لتجنب مراقبة المدافعين لنطاقات OAST العامة.
- قد تتضمن بعض القوالب حمولات مدمرة إذا حملت وسم `intrusive`؛ اقرأ القالب قبل التشغيل في بيئة إنتاجية.

## أدوات ذات صلة

- **nikto:** لفحوصات إعدادات الويب التقليدية.
- **wapiti:** ماسح نشط لثغرات الويب ببصمات مختلفة.
- **wpscan:** متخصص في منصة WordPress.
- **katana + nuclei:** الزحف الشامل (Crawl) ثم الفحص.
- **subzy:** متخصص في ثغرات الاستيلاء على النطاقات الفرعية (Subdomain takeover).
