# OpenSCAP — الدليل الشامل للتدقيق والامتثال

يُعدّ `OpenSCAP` الأداة مفتوحة المصدر والمعتمدة من قِبل المعهد الوطني للمعايير والتقنية (NIST) لتطبيق بروتوكول أتمتة محتوى الأمان (SCAP). تخصص الأداة في إجراء عمليات التدقيق (Auditing) والمعالجة (Remediation) لأنظمة لينكس مقابل المعايير المرجعية العالمية مثل: CIS، DISA STIG، PCI-DSS، NIST 800-171، و FedRAMP. تقوم الأداة بقراءة محتوى SCAP (ملفات XCCDF + OVAL + CPE) وتوليد تقارير امتثال مفصلة، بالإضافة إلى كتيبات تشغيل (Playbooks) بصيغة Ansible أو نصوص Bash للتصحيح التلقائي.

## التثبيت

```terminal
apt install libopenscap8 ssg-debian ssg-applications
yum install openscap-scanner scap-security-guide
brew install openscap     # دعم محدود لنظام macOS
```

تأتي حزمة `scap-security-guide` (SSG) محملة مسبقاً بمحتوى التدقيق لمعظم التوزيعات الكبرى. المسار الافتراضي للملفات هو: `/usr/share/xml/scap/ssg/content/ssg-<distro>-ds.xml`.

## الأوامر الفرعية الأساسية

| الأمر | الغرض |
|-----|---------|
| `oscap info <file>` | فحص المحتوى (ملفات التعريف والقواعد المتاحة) |
| `oscap xccdf eval --profile xccdf_org.ssgproject.content_profile_<id>` | تشغيل فحص للامتثال مقابل معيار محدد |
| `oscap xccdf generate fix` | إنشاء نص برمجى للتصحيح (Bash أو Ansible) |
| `oscap oval eval` | تشغيل ملف تعريف OVAL خالص |
| `oscap-ssh <user@host> ...` | إجراء تدقيق عن بُعد عبر SSH |
| `oscap-vm` | تدقيق صورة جهاز افتراضي (بدون تشغيل) |
| `oscap-docker image <ref>` | فحص صور الحاويات (Container Images) |

## ملفات التعريف المرفقة مع SSG

كل ملف توزيعة (مثل `ssg-rhel9-ds.xml`) يحتوي على عدة ملفات تعريف (Profiles):

```terminal
oscap info /usr/share/xml/scap/ssg/content/ssg-rhel9-ds.xml
# الملفات المتاحة تشمل:
#   xccdf_org.ssgproject.content_profile_cis_server_l1
#   xccdf_org.ssgproject.content_profile_cis_server_l2
#   xccdf_org.ssgproject.content_profile_stig
#   xccdf_org.ssgproject.content_profile_pci-dss
```

## سير العمل العملياتي

### 1. تدقيق المضيف (Audit)

```terminal
oscap xccdf eval \
  --profile xccdf_org.ssgproject.content_profile_cis_server_l1 \
  --results scan-results.xml \
  --report scan-report.html \
  --oval-results \
  /usr/share/xml/scap/ssg/content/ssg-rhel9-ds.xml
```

يُظهر تقرير HTML حالة كل قاعدة (نجاح/فشل)، ومستوى الخطورة (Severity)، والمراجع الأمنية، مع مقتطفات برمجية للحل (Show fix).

### 2. توليد نصوص التصحيح (Remediation)

```terminal
oscap xccdf generate fix \
  --profile xccdf_org.ssgproject.content_profile_cis_server_l1 \
  --output cis-fix.sh \
  scan-results.xml

# أو ككتيب تشغيل Ansible
oscap xccdf generate fix --fix-type ansible \
  --profile xccdf_...l1 --output cis-fix.yml scan-results.xml
```

### 3. التطبيق والتكرار

يتم تطبيق الإصلاحات (بعد مراجعتها!) ← إعادة الفحص ← مراقبة انخفاض عدد القواعد الفاشلة ← تقديم التقرير النهائي للجهات المختصة.

### 4. فحص الحاويات والأجهزة الافتراضية

```terminal
oscap-docker image registry/myimage:latest \
  oval eval /usr/share/xml/scap/ssg/content/ssg-rhel9-oval.xml
```

## صيغ المخرجات

| الصيغة | الاستخدام |
|--------|-----|
| `--report report.html` | تقرير مرئي سهل القراءة للبشر |
| `--results results.xml` | نتائج بصيغة XCCDF مخصصة للمعالجة الآلية |
| `--results-arf results-arf.xml` | صيغة إعداد تقارير الأصول (للتكامل بين الأدوات) |
| `--stig-viewer` | ملف بصيغة JSON متوافق مع STIG Viewer |

## المشكلات التقنية والحلول

| العرض | الحل |
|---------|-----|
| الكثير من القواعد "غير قابلة للتطبيق" (notapplicable) | تم اختيار ملف تعريف لا يتناسب مع نظام التشغيل الحالي |
| نصوص التصحيح تسببت في تعطل النظام | **دائماً** اختبر الإصلاحات في بيئة غير إنتاجية؛ بعض القواعد قد تعطل خدمات حيوية |
| بطء شديد في `oscap-ssh` | تأخر الاستجابة في الشبكة؛ يُفضل تشغيل الفحص محلياً ونقل النتائج |
| الحاجة لفحوصات مخصصة | يمكنك كتابة ملفات OVAL XML خاصة بك أو المساهمة في مشروع SSG |

## تخصيص السياسات (Tailoring)

في الحالات التي لا تتناسب فيها المعايير العامة مع احتياجات المنشأة، يمكن استخدام التخصيص:

```terminal
# إنشاء دليل استرشادي بناءً على ملف التعريف
oscap xccdf generate guide --profile <id> ssg-rhel9-ds.xml > guide.html

# استخدام ملف تخصيص لتعديل الخطورة أو تعطيل قواعد معينة
oscap xccdf eval --tailoring-file tailor.xml --profile my-tailored-profile ssg-rhel9-ds.xml
```

> [!tip]
> استخدم أداة `scap-workbench` (واجهة رسومية) لتسهيل عملية تخصيص ملفات التعريف وتعديل القواعد دون الحاجة لتعديل ملفات XML يدوياً.

## منظور المدافع (Defender Perspective)

يُعتبر OpenSCAP المعيار الذهبي للتدقيق في الأنظمة المعتمدة على RHEL. لتعزيز فعاليته:

- ادمجه مع أداة **Lynis** للحصول على إشارات تقوية أمنية (Hardening) أوسع.
- استخدم **OpenSCAP-Anaconda Addon** لتطبيق ملفات STIG أثناء مرحلة تثبيت النظام.
- اربطه بـ **Foreman / Satellite** لمتابعة نتائج الفحص لأسطول كامل من الخوادم عبر لوحة تحكم موحدة.

## العمليات الأمنية (OPSEC)

- تكشف مخرجات الفحص عن نقاط ضعف دقيقة في تكوين النظام؛ لذا يجب تشفير هذه النتائج وحمايتها.
- قد تؤدي نصوص التصحيح إلى تعطيل الخدمات النشطة؛ المراجعة البشرية لكل تغيير قبل التطبيق أمر حيوي.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **CIS-CAT** | الماسح الرسمي لمنظمة CIS؛ يدعم منصات متعددة (تجاري) |
| **Lynis** | تقوية أمنية شاملة وغير مقتصرة على SCAP |
| **InSpec** | فحوصات الامتثال كبرمجية (Compliance as Code) |
| **Wazuh SCA** | وحدة مدمجة في Wazuh لإدارة الامتثال |
