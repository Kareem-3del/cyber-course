# Zeek (Bro سابقاً) — الدليل الشامل لتحليل الشبكات

يُعد `Zeek` إطار عمل متطوراً لتحليل الشبكات. وبخلاف نظام Suricata الذي يعتمد على مطابقة التوقيعات (Signatures)، يقوم Zeek بتحليل كل بروتوكول وإصدار **سجلات مهيكلة (Structured Logs)** لكل اتصال، استعلام DNS، طلب HTTP، مصافحة TLS، نقل ملفات، وغير ذلك — مع توفير لغة برمجة نصية (Scripting Language) "تورينج-كاملة" (Turing-complete) ومدفوعة بالأحداث لإضافة منطق مخصص.

## التثبيت (Install)

```terminal
apt install zeek
brew install zeek
```

مسار التثبيت الافتراضي هو `/opt/zeek/`. تأكد من إضافة `/opt/zeek/bin` إلى متغير PATH الخاص بك.

## وضع العنقود (Cluster mode - للبيئات الإنتاجية)

```terminal
zeekctl deploy
zeekctl status
zeekctl diag
```

يتم تعريف العقد (Manager / Proxy / Worker) في ملف `/opt/zeek/etc/node.cfg`. بالنسبة للشبكات التي تزيد سرعتها عن 10 جيجابت في الثانية، يوصى بتشغيل عنقود AF_PACKET مع خيوط معالجة (Worker threads) متعددة.

## السجلات (Logs - الميزة الأبرز)

يقوم Zeek بكتابة سجل واحد لكل بروتوكول أو فئة أحداث في المسار `/opt/zeek/logs/current/`. السجلات المتاحة بشكل افتراضي تشمل:

| السجل (Log) | المحتوى |
|-----|--------|
| `conn.log` | كل تدفق بيانات: المصدر/الوجهة، المنافذ، الأحجام، والمدة الزمنية |
| `dns.log` | كل استعلام DNS مع الاستجابة الخاصة به |
| `http.log` | كل طلب HTTP مع رموز الاستجابة |
| `ssl.log` | كل مصافحة TLS مع الشهادات المستخدمة |
| `x509.log` | الشهادات الرقمية المفككة |
| `files.log` | كل ملف تم نقله (مع بصمات التجزئة Hashes) |
| `smb_*` | نشاط بروتوكول SMB |
| `kerberos.log` | طلبات Kerberos AS-REQ / TGS-REQ |
| `dhcp.log` | عمليات بروتوكول DHCP |
| `ssh.log` | لافتات SSH ومحاولات المصادقة |
| `dpd.log` | نتائج الكشف الديناميكي للبروتوكولات (Dynamic Protocol Detection) |
| `notice.log` | التنبيهات المولدة |
| `software.log` | إصدارات البرمجيات المحددة |
| `weird.log` | الشذوذات التي لم يتمكن المحلل من معالجتها بشكل قياسي |

تكون السجلات بتنسيق TSV افتراضياً؛ ويمكن التحويل إلى تنسيق JSON عبر إضافة:

```
@load policy/tuning/json-logs
```

## سير العمل (Workflow)

### تحليل سريع لملف pcap

```terminal
mkdir analysis && cd analysis
zeek -r ../capture.pcap

ls
# سيظهر: conn.log dns.log http.log ssl.log files.log ...
zeek-cut -d ts id.orig_h id.resp_h id.resp_p service duration < conn.log | head
```

تستخدم أداة `zeek-cut` لاستخراج أعمدة محددة من سجلات TSV.

### أمثلة على البرمجة النصية (Scripting)

```zeek
# scripts/check-rare-uri.zeek
event http_request(c: connection, method: string, original_URI: string,
                    unescaped_URI: string, version: string)
{
    if (|unescaped_URI| > 200)
        NOTICE([$note=HTTP::URILength,
                $msg=fmt("Long URI from %s -> %s%s",
                         c$id$orig_h, c$http$host, original_URI),
                $conn=c]);
}
```

يتم تحميل السكريبت عبر إضافة `@load scripts/check-rare-uri.zeek` في ملف `local.zeek`.

### إطار عمل التنبيهات (Notice framework)

```zeek
@load base/frameworks/notice/main
redef Notice::policy += {
   [$pred(n: Notice::Info) = { return n$note == HTTP::URILength; },
    $action = Notice::ACTION_EMAIL]
};
```

يمكن تنفيذ إجراءات مثل: البريد الإلكتروني، التسجيل، الإسقاط (Drop)، أو الإضافة إلى استخبارات التهديدات (`add_to_intel`).

### إطار عمل الاستخبارات (Intel framework) — مطابقة مؤشرات الاختراق (IOCs)

```terminal
# /opt/zeek/share/zeek/policy/frameworks/intel/seen/...
# /opt/zeek/etc/intel.dat
#fields  indicator  indicator_type  meta.source ...
evil.example.com  Intel::DOMAIN  threat-feed-1
1.2.3.4           Intel::ADDR    threat-feed-1
```

تحميل السياسة:

```
@load frameworks/intel/seen
@load frameworks/intel/do_notice
redef Intel::read_files += { "/opt/zeek/etc/intel.dat" };
```

أي تدفق بيانات أو استعلام DNS أو طلب HTTP يطابق المؤشر سيؤدي إلى توليد تنبيه من نوع `Intel::Notice`.

## التكامل بين Suricata و Zeek

غالباً ما يتم تشغيلهما جنباً إلى جنب:
- **Suricata**: لإصدار تنبيهات التواقيع (Signatures) واستخراج الملفات.
- **Zeek**: لتقديم الحقيقة الميدانية (Ground Truth) لما حدث عبر كل تدفق بيانات.

يمكن دمج سجلات كلاهما في Elastic / Kibana عبر Filebeat → Logstash → ES، وعرضها في منصة **Security Onion**.

## تشخيص الأخطاء والإصلاح (Bad output / fixes)

| العرض (Symptom) | الإصلاح (Fix) |
|---------|-----|
| سقوط حزم البيانات (Packet loss) | تحقق من ميزات NIC offloads (LRO/GRO)؛ قم بتعطيلها. استخدم AF_PACKET v3 |
| غياب بيانات التطبيقات في السجلات | محلل البروتوكول معطل؛ استخدم `print get_dpd_protos();` للتأكد |
| الرغبة في إثراء البيانات بأسماء المضيفين (Hostnames) | `@load base/protocols/dns` و `dns_iter` |
| إعادة التحميل بدون إعادة تشغيل كاملة | استخدم `zeekctl deploy` |
| فيضان في سجل `weird.log` | غالباً ما يكون بسبب حركة مرور مشوهة ولكنها مشروعة؛ قم بالضبط عبر `Weird::weird_ignore` |

## منظور المدافع (Defender perspective)

يعتبر Zeek الأداة الأهم للإجابة على سؤال "ماذا حدث؟". عندما يسأل فريق الاستجابة للحوادث (IR): "هل تواصل المضيف X مع Y عبر المنفذ Z قبل ثلاثة أسابيع؟"، يجيب سجل `conn.log` في أجزاء من الثانية باستخدام `zeek-cut`.

يفضل استخدامه مع:
- Suricata (تنبيهات التواقيع).
- ELK / OpenSearch (للتخزين والاستعلام).
- RITA (Active Countermeasures) لتحليل الشذوذات بناءً على سجلات Zeek.

## الأمن العملياتي للمدافعين (OPSEC)

- تتضمن السجلات روابط URI صريحة، أسماء TLS SNI، واستعلامات DNS — لذا يجب تأمين التخزين وحذف البيانات الحساسة (PII) عند انتهاء فترة الاستبقاء.
- يتطلب الاستبقاء طويل الأمد تخطيطاً دقيقاً لمساحات التخزين (قد تصل إلى تيرابايت شهرياً في الشبكات الكبيرة).
- انتبه من أسماء الجداول القديمة التي تبدأ بـ `bro_`؛ حيث يستخدم Zeek 4+ بادئة `zeek_` في كل مكان.

## أدوات ذات صلة

| الأداة | الفرق |
|------|-----------|
| **Suricata** | نظام كشف التسلل القائم على التواقيع — مكمل لـ Zeek |
| **Arkime** | مفهرس PCAP — للبحث في الحزم الفعلية، وليس فقط البيانات الوصفية |
| **RITA** | تحليل منارات التواصل (Beacons) والتحليلات الإحصائية على سجلات Zeek |
| **Corelight** | توزيع تجاري لـ Zeek مع حساسات متطورة |
| **NetWitness** | منصة مراقبة أمن الشبكات (NSM) تجارية |
