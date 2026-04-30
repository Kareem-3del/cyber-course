# Suricata — الدليل الكامل

تُعد `Suricata` (التي تديرها مؤسسة OISF) من أحدث منظومات كشف التسلل (IDS) ومنعه (IPS) ومراقبة أمن الشبكات (NSM) مفتوحة المصدر. تعتمد المنظومة على قواعد الاكتشاف (متوافقة مع Snort)، وتتميز بميزات إضافية تشمل: تحليل مصافحة بروتوكول TLS، دعم بصمات JA3/JA3S، استخراج الملفات، دعم برمجية Lua، ومخرجات بصيغة EVE JSON المخصصة لأنظمة SIEM.

## التثبيت (Install)

```terminal
apt install suricata
brew install suricata
suricata --build-info       # تأكيد قدرات الأجهزة (AF_PACKET, NFQUEUE, eBPF)
```

## أوضاع التشغيل (Modes)

| الوضع | الآلية |
|------|-----|
| **IDS (سلبي)** | `suricata -i eth0 ...` — قراءة حركة المرور وإصدار تنبيهات |
| **IPS (مباشر)** | عبر NFQUEUE / netmap / DPDK — إسقاط الحزم الضارة (Drop) |
| **خارج الخط (Offline/pcap)** | `suricata -r capture.pcap -l output/` |

## الإعدادات — `/etc/suricata/suricata.yaml`

الكتل الرئيسية في ملف الإعدادات:

| القسم | الغرض |
|---------|---------|
| `vars: HOME_NET / EXTERNAL_NET / ...` | مجموعات الشبكات المستخدمة في القواعد |
| `default-rule-path / rule-files` | مسار تحميل قواعد الاكتشاف |
| `outputs: eve-log / fast / stats` | صيغ المخرجات وسجلات السلوك |
| `app-layer: tls / http / dns / smb` | محللات طبقة التطبيقات — تفعيل ما يلزم فقط |
| `af-packet / pcap / netmap / dpdk` | وضع التقاط البيانات (Capture mode) |
| `host-mode` / `flow` | معايير الضبط والتحسين |

```yaml
vars:
  address-groups:
    HOME_NET: "[10.0.0.0/8,192.168.0.0/16,172.16.0.0/12]"
    EXTERNAL_NET: "!$HOME_NET"

outputs:
  - eve-log:
      enabled: yes
      filename: eve.json
      types:
        - alert
        - http
        - dns
        - tls
        - flow
        - fileinfo
        - anomaly
```

## التشغيل (Running)

```terminal
sudo suricata -c /etc/suricata/suricata.yaml -i eth0 -D
sudo journalctl -u suricata -f          # الحالة
sudo tail -F /var/log/suricata/eve.json | jq 'select(.event_type=="alert")'
```

## هيكلية القواعد (Rule Syntax)

```
alert tcp any any -> $HTTP_SERVERS 80 (msg:"SQLi UNION"; flow:to_server,established;
       content:"UNION+SELECT"; nocase; sid:1000001; rev:1;
       classtype:web-application-attack; metadata:tag sqli;)
```

| الحقل | المعنى |
|-------|---------|
| `alert/drop/pass/reject` | الإجراء المتخذ |
| `tcp/udp/icmp/ip/http/...` | البروتوكول أو طبقة التطبيق |
| `src_addr src_port -> dst_addr dst_port` | اتجاه حركة المرور |
| `msg:` | وصف التنبيه |
| `flow:` | اتجاه وحالة الاتصال |
| `content:` `pcre:` `byte_test:` | مطابقة محتوى الحزمة (Payload) |
| `nocase` | عدم الحساسية لحالة الأحرف |
| `http.uri / http.header / ...` | مخازن محددة لطبقة التطبيقات (Sticky buffers) |
| `sid:` | المعرف الفريد للقاعدة |
| `rev:` | نسخة المراجعة |
| `classtype:` | تصنيف الهجوم |
| `metadata:` | وسوم إضافية اختيارية |

## إمكانيات Suricata المتقدمة

```
alert tls any any -> any any (msg:"Outdated TLS";
       tls.version:tls1_0; sid:1000003;)

alert http any any -> any any (msg:"PHP password leak";
       http.response_body; content:"$1$"; sid:1000004;)

alert ja3 any any -> any any (msg:"Cobalt Strike default";
       ja3.hash; content:"a0e9f5d64349fb13191bc781f81f42e1"; sid:1000005;)
```

## مصادر القواعد (Rule Sources)

```terminal
suricata-update enable-source et/open
suricata-update enable-source oisf/trafficid
suricata-update              # تحميل، دمج، وتوليد ملف القواعد suricata.rules
sudo suricata --test-rules   # فحص القواعد (Lint)
sudo systemctl reload suricata
```

المجموعات القياسية: **Emerging Threats Open** (مجانية)، **ET Pro** (مدفوعة وأكثر شمولاً). بالإضافة إلى **قائمة SSLBL JA3 من abuse.ch**، وتحويل قواعد **Sigma إلى Suricata**.

## نظام EVE JSON

كل حدث يتم تسجيله كسجل JSON. يمكن دفعه إلى نظام SIEM:

```terminal
filebeat configure suricata module
# أو
logstash → elasticsearch مع مرشح eve
```

أنواع الأحداث المفيدة: `alert`, `http`, `dns`, `tls`, `flow`, `fileinfo`, `anomaly`, `stats`.

## سير العمل (Workflows)

### نظام IDS على منفذ مرآة (SPAN port)

```yaml
af-packet:
  - interface: enp0s8
    cluster-id: 99
    cluster-type: cluster_flow
    threads: auto
```

```terminal
sudo suricata -c suricata.yaml -i enp0s8
```

### نظام IPS مباشر عبر NFQUEUE

```terminal
iptables -A FORWARD -j NFQUEUE --queue-num 0
sudo suricata -c suricata.yaml -q 0
```

قواعد `drop tcp ...` ستقوم الآن بإسقاط الحزم فعلياً.

### استخراج الملفات (File Extraction)

```yaml
file-store:
  version: 2
  enabled: yes
  dir: /var/lib/suricata/files
  force-magic: yes
  force-hash: [sha256]
```

عند دمجها مع الكلمة المفتاحية `filestore;` في القواعد ← يتم التقاط الملفات تلقائياً من بروتوكولات HTTP / SMB / FTP / SMTP.

## استكشاف الأخطاء وإصلاحها (Troubleshooting)

| العرض | الحل |
|---------|-----|
| فقدان كبير للحزم (Packet loss) | تعطيل ميزات NIC offloads؛ مثل `ethtool -K eth0 gro off` |
| فشل تحميل القواعد | استخدم `suricata --test-rules` للتحقق من أرقام الأسطر والخطأ البرمجي |
| لا توجد تنبيهات رغم وجود حركة مرور ضارة | خطأ في الاتجاه (`->` مقابل `<>`)؛ منفذ خاطئ؛ أو استخدام `flow:established` على اتصال غير مكتمل |
| سجل EVE JSON ضخم جداً | تعطيل أنواع الأحداث غير الضرورية في `outputs.eve-log.types` |
| فشل استخراج TLS / SNI | تأكد من تفعيل `app-layer.protocols.tls.enabled: yes` |

## منظور المدافع (Defender's Perspective)

تعتبر Suricata المعيار المرجعي لأنظمة **NIDS** في الفترة ما بين 2024–2026. يفضل دمجها مع:

- **Zeek** للحصول على سجلات بروتوكولات غنية (مكملة لـ Suricata حيث لا تعتمد Zeek على القواعد).
- توزيعة **SecurityOnion** للحصول على حزمة متكاملة (ELK + Suricata + Zeek + Wazuh).
- استخدام قواعد **JA3/JA3S** لتبصيم أطر عمل الـ C2 الخاصة بالبرمجيات الخبيثة.

## أمن العمليات (OPSEC)

- ضبط مجموعة القواعد (Rule-set tuning) أمر إلزامي؛ تفعيل ET Open بالكامل في شبكة مزدحمة سينتج ملايين التنبيهات الكاذبة (False Positives).
- وضع IPS المباشر يتطلب حذراً شديداً — قاعدة واحدة خاطئة قد تسبب انقطاع الخدمة في بيئة الإنتاج.
- للأداء العالي، استخدم AF-PACKET v3 مع DPDK وبطاقات شبكة تدعم قوائم الانتظار المتعددة (Multi-queue NIC).

## أدوات ذات صلة

| الأداة | الاختلاف |
|------|-----------|
| **Snort 3** | تابعة لشركة سيسكو، قابلة للمقارنة، لكنها أقل شيوعاً في بيئات المصدر المفتوح |
| **Zeek (Bro)** | تركز على تسجيل البروتوكولات؛ لا تعتمد على القواعد |
| **Arkime** | تخزين حزم الـ PCAP مع إمكانية البحث المفهرس |
| **Stenographer** | التقاط مستمر لحزم الـ PCAP |
| **Moloch** | الاسم القديم لأداة Arkime |
