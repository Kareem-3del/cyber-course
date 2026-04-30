# wpscan — دليل الاستخدام الكامل

تُعد أداة `wpscan` المعيار الفعلي لفحص أمان منصة WordPress. تتيح الأداة استقراء (Enumeration) الإضافات (Plugins)، القوالب (Themes)، المستخدمين، ملفات الإعدادات، والثغرات المعروفة (عبر واجهة برمجة تطبيقات WPScan vulnerability DB API). تعتبر من أكثر الأدوات موثوقية في أي عملية اختبار اختراق لخدمات الويب التي تعتمد على WordPress.

## التثبيت

```terminal
gem install wpscan
docker run -it --rm wpscanteam/wpscan -h
```

احصل على رمز API مجاني من `wpscan.com` لتفعيل البحث عن الثغرات (محدود بـ 25 طلباً يومياً في الخطة المجانية).

## المعاملات الأساسية (Core parameters)

| المعامل | الغرض |
|------|---------|
| `--url <url>` | الرابط المستهدف |
| `--api-token <key>` | تفعيل البحث عن الثغرات |
| `-e <list>` | الاستقراء (Enumerate): `vp` (الإضافات)، `vt` (القوالب)، `u` (المستخدمين)، `ap` (جميع الإضافات)، `at` (جميع القوالب)، `cb` (نسخ الاحتياطية للإعدادات)، `dbe` (تصدير قواعد البيانات) |
| `--plugins-detection mixed|passive|aggressive` | وضع اكتشاف الإضافات |
| `--themes-detection ...` | وضع اكتشاف القوالب |
| `--passwords <wordlist>` | الهجوم العنيف (Brute force) على كلمات المرور |
| `--usernames <list/file>` | قائمة المستخدمين المستهدفين |
| `--max-threads <n>` | عدد العمليات المتزامنة (الافتراضي 5) |
| `--login-uri <path>` | مسار تسجيل الدخول المخصص |
| `--proxy <url>` | استخدام وكيل مثل Burp أو Tor |
| `--cookie-string <c>` | فحص مع جلسة مصادقة (Authenticated scan) |
| `--user-agent <ua>` | تغيير الـ User Agent |
| `--random-user-agent` | تدوير الـ User Agent لكل طلب |
| `--throttle <ms>` | التأخير بين الطلبات (Inter-request delay) |
| `--request-timeout <sec>` | مهلة انتظار الشبكة |
| `--no-banner` | إخفاء شعار الأداة |
| `--format <json|cli>` | صيغة المخرجات |
| `-o <file>` | حفظ المخرجات في ملف |

## منهجيات العمل (Workflows)

### فحص قياسي

```terminal
wpscan --url https://target.com --api-token <KEY> \
  -e vp,vt,u,cb --plugins-detection aggressive \
  -o wpscan.json --format json
```

### استقراء المستخدمين فقط (سريع جداً)

```terminal
wpscan --url https://target.com -e u
# المخرجات: المعرف (ID)، اسم الدخول، والاسم اللطيف (Slug) — مفيد لهجمات رش كلمات المرور (Password spray)
```

### التحقق من إصدار الإضافات/القوالب والثغرات

```terminal
wpscan --url https://target.com -e ap,at --api-token <KEY>
```

### الهجوم العنيف على صفحة تسجيل الدخول

```terminal
wpscan --url https://target.com \
  -U admin,editor -P /usr/share/wordlists/rockyou.txt \
  --max-threads 10 --throttle 100
```

### خلف Cloudflare أو جدار حماية (WAF) — وضع متخفٍ وبطيء

```terminal
wpscan --url https://target.com \
  --random-user-agent --throttle 1500 \
  --plugins-detection passive
```

## تحليل المخرجات (Good output)

```
[+] WordPress version 6.4.2 identified (Insecure, released on 2023-12-21).
 | Found By: Rss Generator (Passive Detection)

[i] Plugin(s) Identified:
[+] elementor
 | Location: https://target.com/wp-content/plugins/elementor/
 | Latest Version: 3.21.5
 | Found By: Urls In Homepage (Passive Detection)
 |
 | [!] CVE-2024-37261 (CVSS 8.8) — Authenticated SQL Injection
 |    Fixed in: 3.20.0

[+] User Enumeration:
 | id: 1, login: admin, slug: admin
 | id: 5, login: editor1, slug: editor1
```

الأولويات المقترحة للتعامل:
1. الإضافات/القوالب التي تحتوي على ثغرات (CVEs) حرجة أو عالية الخطورة وإصدارها أقل من الإصدار المصحح.
2. المستخدمين — استخدامهم في هجمات رش كلمات المرور (Password spray).
3. نسخ الاحتياطية لملفات الإعدادات (`wp-config.php.bak`) المكتشفة عبر خيار `cb`.

## المشكلات الشائعة والحلول

| العرض | السبب المحتمل | الحل |
|---------|-------|-----|
| `0 plugins found` | الموقع يخفي مسارات الإضافات | استخدم `--plugins-detection aggressive` (يرسل حوالي 80,000 طلب للمسارات) |
| توقف الأداة | بطء الموقع أو تقييد الطلبات | استخدم `--throttle` وقلل `--max-threads` |
| `--api-token quota exceeded` | نفاد الحصة المجانية | انتظر 24 ساعة أو قم بترقية الخطة |
| خطأ 403 من الـ WAF | حماية Cloudflare أو ما شابه | استخدم `--random-user-agent --throttle`؛ أو مرر الطلبات عبر وكيل سكني (Residential proxy) |
| فشل الهجوم العنيف دائماً | تحدي تسجيل الدخول من Cloudflare | لا تستطيع wpscan تجاوز تحديات JS؛ استخدم مكتبات تجاوز Cloudflare أولاً |
| تقرير إصدار خاطئ لـ WP | الموقع يحذف الوسوم الوصفية (Meta) | تحقق يدوياً من الأدلة (`/readme.html` أو `/wp-includes/` أو مسارات ملفات JS) |

## منظور المدافع (Defender's perspective)

من السهل جداً رصد بصمة WPScan:

- قوائم طويلة من طلبات GET لملفات `readme.txt` الخاصة بالإضافات تحت مسار `/wp-content/plugins/`.
- الـ User Agent الافتراضي: `WPScan v3.x.x (https://wpscan.com/wordpress-security-scanner)`.
- هجمات تسجيل الدخول: الكثير من طلبات POST لمسار `/wp-login.php`.
- استقراء المستخدمين: طلبات مثل `/?author=1` أو عبر `/wp-json/wp/v2/users`.

التدابير الدفاعية:

- تقييد الوصول لـ `wp-json/wp/v2/users` للمدراء فقط (إضافة: `Disable REST API`).
- إعادة توجيه طلبات `?author=N` أو إرجاع خطأ 404 (إضافة: `Stop User Enumeration`).
- حظر الوصول لملفات `/readme.html` و `/license.txt` وإخفاء وسوم الإصدار.
- الحد من محاولات تسجيل الدخول (Wordfence, Limit Login Attempts, fail2ban).
- وضع قواعد WAF لحظر الـ User Agent الخاص بـ `wpscan` (يمنع 5% من المهاجمين الذين لا يغيرون الإعدادات الافتراضية).

## العمليات الأمنية (OPSEC)

- الـ User Agent الافتراضي يكشف هويتك تماماً؛ استخدم دائماً `--random-user-agent`.
- الاكتشاف الهجومي للإضافات (Aggressive) يرسل حوالي 80 ألف طلب للموقع الواحد، وهو ما سيؤدي حتماً لتنبيه الفريق الأزرق (Blue Team).
- للتخفي، اعتمد على الاكتشاف السلبي `passive` بالإضافة إلى قائمة محدودة من الإضافات المكتشفة عبر عمليات الاستطلاع (Recon) في Burp.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **wpvulndb / WPScan API** | البحث عن الثغرات بشكل مستقل |
| **wp-cli** | إدارة WordPress عبر سطر الأوامر (تطلب صلاحيات) |
| **CMSeek** | اكتشاف أنظمة إدارة المحتوى المتعددة (WP/Joomla/Drupal) |
| **droopescan** | متخصص في Drupal |
| **JoomScan** | معادل لـ WPScan ولكن لـ Joomla |
| **nuclei** | قوالب CVE عامة تتضمن الكثير من فحوصات إضافات WP |
