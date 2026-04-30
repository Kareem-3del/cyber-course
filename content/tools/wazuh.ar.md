# Wazuh — الدليل الكامل لمنصة XDR / SIEM الشاملة

تُعد منصة `Wazuh` حلاً مفتوح المصدر رائداً في مجالي الاستجابة والاكتشاف الموسع (XDR) وإدارة المعلومات والأحداث الأمنية (SIEM). تجمع المنصة بين وكيل مستمد من مشروع OSSEC (HIDS)، وتحليل السجلات المركزي، ومراقبة سلامة الملفات (FIM)، واكتشاف الثغرات الأمنية، ومطابقة مؤشرات الاختراق (IoC). كما تدمج المنصة أدوات Elasticsearch و Kibana (التي تُعرف الآن باسم "Wazuh Dashboard") لتمثيل البيانات بصرياً.

## الهندسة البنائية (Architecture)

```
[ وكيل Wazuh على كل مضيف ] ← [ مدير Wazuh ] ← [ مفهرس Wazuh (نسخة مطورة من Elasticsearch) ] ← [ لوحة تحكم Wazuh ]
```

تقوم الوكلاء (Agents) بإرسال البيانات عبر بروتوكول TCP/1514 المشفر افتراضياً.

## التثبيت — عقدة واحدة (للمختبرات / الشركات الصغيرة والمتوسطة)

```terminal
curl -sO https://packages.wazuh.com/4.7/wazuh-install.sh
sudo bash wazuh-install.sh -a
```

ستظهر كلمة مرور مدير النظام (Admin) في المخرجات؛ ويمكن الوصول للوحة التحكم عبر `https://<server>` (المنفذ 443).

في البيئات الإنتاجية، يتم فصل المكونات على عدة عقد:

```terminal
sudo bash wazuh-install.sh --wazuh-server-installation
sudo bash wazuh-install.sh --wazuh-indexer-installation
sudo bash wazuh-install.sh --wazuh-dashboard-installation
```

## تثبيت الوكيل (أغلب التوزيعات)

```terminal
WAZUH_MANAGER='wazuh.example.com' apt install wazuh-agent
systemctl enable --now wazuh-agent
```

أو عبر ملف MSI في أنظمة Windows:

```cmd
msiexec.exe /i wazuh-agent-4.7.x.msi /q WAZUH_MANAGER='wazuh.example.com'
NET START WazuhSvc
```

## وحدات الوكيل (Modules in the agent)

| الوحدة | الغرض |
|--------|---------|
| `logcollector` | تتبع السجلات (syslog, eventlog, مخصص) |
| `syscheck` | مراقبة سلامة الملفات (FIM) |
| `rootcheck` | اكتشاف برمجيات الـ Rootkit |
| `sca` | تقييم الإعدادات الأمنية (وفق معايير CIS) |
| `vulnerability-detector` | مطابقة الحزم المثبتة مع قاعدة بيانات CVEs |
| `command` | تشغيل أوامر مجدولة وإرسال مخرجاتها |
| `osquery` | التكامل مع أداة osquery (اختياري) |
| `cdb-list` | قوائم الحظر بناءً على معلومات التهديدات |
| `active-response` | الاستجابة التلقائية للقواعد (حظر IP، إنهاء عملية) |
| `inventory` | أخذ لقطة شاملة للعتاد والنظام والعمليات والحزم |

## القواعد وفك التشفير (Rules / decoders)

ملفات القواعد توجد في: `/var/ossec/etc/rules/local_rules.xml` (بالإضافة للعديد من القواعد في `ruleset/rules/`).

```xml
<group name="local,syslog,sshd,">
  <rule id="100100" level="10">
    <if_sid>5712</if_sid>
    <regex>Failed password for root from</regex>
    <description>SSH root brute force from $(srcip)</description>
    <mitre><id>T1110</id></mitre>
  </rule>
</group>
```

المستويات تتراوح بين 0-15. المستوى 12 فما فوق عادة ما يرسل تنبيهات للوحة التحكم أو البريد الإلكتروني.

## الاستجابة النشطة (Active Response)

يمكن لـ Wazuh تشغيل سكربتات على المضيف عند تفعيل قاعدة معينة — أشهرها حظر الجدار الناري (`firewall-drop`) وإنهاء العمليات المشبوهة وتعطيل الحسابات.

```xml
<active-response>
  <command>firewall-drop</command>
  <location>local</location>
  <rules_id>100100</rules_id>
  <timeout>300</timeout>
</active-response>
```

## كاشف الثغرات (Vulnerability detector)

يقوم بجمع البيانات من NVD و Canonical OVAL و Red Hat OVAL و ALAS، ومطابقتها مع جرد الحزم المثبتة في كل وكيل.

```xml
<wodle name="vulnerability-detector">
  <enabled>yes</enabled>
  <interval>5m</interval>
  <ignore_time>6h</ignore_time>
  <run_on_start>yes</run_on_start>
  <provider name="nvd">
    <enabled>yes</enabled>
  </provider>
</wodle>
```

تعرض لوحة التحكم في تبويب "Vulnerabilities" قائمة ثغرات CVE لكل مضيف مع مستوى خطورتها.

## مسارات العمل (Workflows)

### مراقبة سلامة الملفات (FIM) لمجلد `/etc`

```xml
<syscheck>
  <directories check_all="yes" report_changes="yes" realtime="yes">/etc</directories>
  <directories check_all="yes" realtime="yes">/usr/bin,/usr/sbin</directories>
  <ignore>/etc/mtab</ignore>
</syscheck>
```

أي تعديل سيؤدي إلى إصدار تنبيه من المستوى 7 فما فوق.

### جلب بيانات Sysmon (Windows)

قم بتثبيت Sysmon مع إعدادات SwiftOnSecurity، ثم اطلب من الوكيل إرسال القناة:

```xml
<localfile>
  <location>Microsoft-Windows-Sysmon/Operational</location>
  <log_format>eventchannel</log_format>
</localfile>
```

قواعد Wazuh المدمجة تفهم بالفعل أحداث Sysmon مثل EID 1 / 3 / 8 / 11 / 22 وغيرها.

### استخبارات التهديدات — قائمة الحظر

```xml
<cdb-list>
  <name>etc/lists/blocked-ips</name>
  <type>list</type>
</cdb-list>
```

ثم إضافة قاعدة:

```xml
<rule id="100200" level="12">
  <if_sid>4515</if_sid>
  <field name="dstip">$(blocked-ips)</field>
  <description>Outbound to known-malicious IP</description>
</rule>
```

## المشاكل التقنية والحلول (Bad output / fixes)

| العرض (Symptom) | الحل |
|---------|-----|
| الوكيل متصل ولكن لا توجد أحداث | `selinux` أو `apparmor` يحظر `ossec`؛ راجع `/var/ossec/logs/ossec.log` |
| امتلاء قرص المفهرس (Indexer) | فعل `xpack.security.enabled=true` واضبط سياسة ILM للحذف بعد N يوم |
| مستوى القاعدة غير مناسب | قم بتعديل `local_rules.xml` لتجاوز المستوى الافتراضي |
| كاشف الثغرات لا يعطي نتائج | انتظر الفحص الأول؛ تأكد من تفعيل المزود (Provider) في `ossec.conf` |
| بطء لوحة التحكم | يحتاج المفهرس إلى ذاكرة Heap لا تقل عن 4 جيجابايت |

## منظور الدفاع (Defender perspective)

Wazuh هو الخيار الأمثل كمنصة SIEM/XDR مفتوحة المصدر للمختبرات والشركات الصغيرة والمتوسطة. في المؤسسات الكبرى، يُستخدم غالباً بجانب Splunk أو Elastic.

نقاط القوة: مراقبة FIM و SCA من جهة الوكيل تقلل حجم السجلات مقارنة بأنظمة EDR الصرفة. يعتبر أضعف من أنظمة EDR التجارية في اكتشاف السلوكيات المتقدمة، لذا يفضل دمجه مع Sysmon و Sigma لتحقيق التكافؤ.

## أمن العمليات (OPSEC للمدافع)

- عنوان IP/اسم المضيف للمدير (Manager) مكشوف لكل وكيل — يجب حماية منفذ المدير (1514) عند المحيط.
- كلمة مرور تسجيل الوكيل (Agent registration) — يجب ضبطها في البيئات الإنتاجية.
- قد تحتوي السجلات على أسرار — استخدم TLS مع المفهرس وقم بتشفير الأقراص.

## أدوات ذات صلة (Related tools)

| الأداة | التخصص |
|------|-------|
| **Elastic Security** | تكامل أعمق مع Elastic؛ تجاري |
| **Splunk** | المعيار الصناعي لأنظمة SIEM (مدفوع) |
| **OSSEC** | المشروع الأم لـ Wazuh |
| **Microsoft Sentinel** | نظام SIEM سحابي على Azure |
| **Graylog** | إدارة السجلات مع إضافات أمنية |
| **SecurityOnion** | توزيعة تدمج Suricata / Zeek / Wazuh |
