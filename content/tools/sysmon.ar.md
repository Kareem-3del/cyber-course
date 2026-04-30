# Sysmon — الدليل الكامل

تُعد `Sysmon` (System Monitor) أداة مجانية من مجموعة Microsoft Sysinternals، تقوم بتوليد بيانات تشغيلية (Telemetry) عالية الدقة حول العمليات، والاتصالات الشبكية، وتغييرات الملفات في نظام Windows، وإرسالها إلى سجل أحداث ويندوز (Windows Event Log). عند دمجها مع ملف تكوين (Config) جيد، تصبح الأداة أقرب ما يكون إلى نظام EDR مجاني لنظام Windows.

## التثبيت (Install)

```cmd
# قم بتحميل ملف sysmon.zip من موقع Microsoft Learn
sysmon64.exe -accepteula -i config.xml
```

**ملاحظة هامة**: يجب توفير ملف تكوين عند التثبيت؛ التشغيل بالإعدادات الافتراضية لا يسجل تقريباً أي شيء ذي قيمة أمنية.

## ملفات التخزين الموصى بها (Recommended starting config)

تُعد التكوينات التي يديرها المجتمع هي الأفضل للبدء، مثل **SwiftOnSecurity** أو **Olaf Hartong's sysmon-modular**.

```cmd
sysmon64.exe -accepteula -i sysmon-config.xml  # التثبيت
sysmon64.exe -c sysmon-config.xml              # تحديث التكوين الحالي
sysmon64.exe -c                                # عرض التكوين الحالي
sysmon64.exe -u                                # إلغاء التثبيت
```

يتم ضبط الأداة عبر وسوم `<Include>` و `<Exclude>` لكل معرف حدث (Event ID).

## معرفات الأحداث (Event IDs) الهامة

| المعرف (EID) | الحدث |
|-----|-------|
| **1** | إنشاء عملية جديدة (Process Create) |
| **2** | تغيير وقت إنشاء ملف (تزييف الوقت - Timestomping) |
| **3** | اتصال شبكي (Network Connection) |
| **5** | إنهاء عملية |
| **6** | تحميل تعريف (Driver Loaded) |
| **7** | تحميل مكتبة أو ملف تنفيذي (Image Loaded - DLL) |
| **8** | إنشاء خيط معالجة عن بعد (CreateRemoteThread) |
| **10** | الوصول إلى ذاكرة عملية أخرى (ProcessAccess) |
| **11** | إنشاء ملف (FileCreate) |
| **12 / 13 / 14** | عمليات السجل (إنشاء، ضبط، تغيير اسم مفاتيح Registry) |
| **17 / 18** | إنشاء أو اتصال بالأنابيب المسماة (NamedPipe) |
| **19 / 20 / 21** | أحداث WMI (Filter / Consumer / Binding) |
| **22** | استعلام DNS |
| **23** | حذف ملف (مع إمكانية حفظ محتواه إذا تم تكوينه) |
| **25** | التلاعب بالعمليات (Process Tampering - مثل Image Hollowing) |

## تشريح ملف التكوين (Sysmon config)

```xml
<Sysmon schemaversion="4.83">
  <HashAlgorithms>md5,sha256,IMPHASH</HashAlgorithms>
  <EventFiltering>

    <ProcessCreate onmatch="exclude">
      <Image condition="is">C:\Windows\System32\svchost.exe</Image>
    </ProcessCreate>

    <NetworkConnect onmatch="include">
      <Image condition="contains">powershell.exe</Image>
      <DestinationPort condition="is">4444</DestinationPort>
    </NetworkConnect>

  </EventFiltering>
</Sysmon>
```

- `onmatch="include"`: سجل فقط ما يطابق الشرط.
- `onmatch="exclude"`: سجل كل شيء ما عدا ما يطابق الشرط.
- الشروط المتاحة: `is`, `contains`, `begins with`, `end with`, `regex`.

## توجيه السجلات (Forwarding)

تقوم Sysmon بالكتابة في المسار: `Microsoft-Windows-Sysmon/Operational`. لنقل هذه السجلات إلى نظام SIEM، يمكن استخدام:
- **Winlogbeat**: خفيف ومتوافق مع ELK Stack.
- **WEC (Windows Event Forwarder)**: الأداة الأصلية في ويندوز لنقل الأحداث.
- **Wazuh Agent**: يدعم Sysmon بشكل مباشر.

## سير العمل — مثال عملي للكشف

**الهدف**: كشف محاولة استخراج كلمات المرور عبر `comsvcs.dll` (LSASS dump).

تعديل ملف التكوين ليشمل:
```xml
<ProcessCreate onmatch="include">
  <CommandLine condition="contains">comsvcs.dll</CommandLine>
  <CommandLine condition="contains">MiniDump</CommandLine>
</ProcessCreate>
```

عند محاولة التنفيذ، سيظهر الحدث رقم 1 في السجل. قاعدة Sigma المقابلة:
```yaml
detection:
  selection:
    Image|endswith: '\rundll32.exe'
    CommandLine|contains|all:
      - 'comsvcs.dll'
      - 'MiniDump'
  condition: selection
```

## مشاكل وحلول تقنية

| العرض | الحل |
|---------|-----|
| ضجيج كبير في السجلات (Noise) | قم بتدقيق التكوين؛ استثني العمليات الموثوقة (مثل svchost أو EDR) |
| فقدان العملية الأب في الحدث 1 | كانت Sysmon متوقفة عند تشغيل العملية الأب؛ استخدم `LogonId` للربط |
| استعلامات DNS كثيرة جداً | قم بتفعيلها لعمليات محددة فقط أو عطل الحدث 22 إذا كان الـ EDR يغطيها |
| فشل تحديث التكوين صامتاً | تحقق من سجل `Operational` للحدث رقم 16 للتأكد من خلو ملف XML من الأخطاء |

## منظور المدافع (Defender perspective)

تعتبر Sysmon من **أكثر الأدوات كفاءة وأقلها تكلفة** للدفاع في بيئات ويندوز. عند دمجها مع أدوات تحليل السجلات، يمكنها تغطية حوالي 70% من تقنيات مصفوفة MITRE ATT&CK المتعلقة بالعمليات والشبكة.

المنهجية الموصى بها: النشر ← مراقبة الضجيج ← استثناء العمليات الموثوقة ← إعادة النشر. استخدام القوالب الجاهزة (مثل sysmon-modular) يجعل إدارة الآلاف من الأجهزة أمراً ممكناً.

## الأمن العملياتي (OPSEC)

- يمكن للمهاجمين محاولة إيقاف الخدمة (تتطلب صلاحيات أدمن) — يعتبر الحدث رقم 4 (توقف Sysmon) تنبيهاً عالي الخطورة.
- يحاول بعض المهاجمين التهرب باستخدام أسماء عمليات نادرة؛ لذا فإن القواعد المخصصة ترفع من صعوبة التهرب.
- يتم تخزين قواعد Sysmon في السجل (Registry)؛ أي مهاجم يملك صلاحية الكتابة هناك يمكنه تعطيل القواعد. راقب التغييرات في الحدث رقم 16.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **Sysmon for Linux** | نسخة نظام لينكس (أقل نضجاً من نسخة ويندوز) |
| **auditd** | الأداة الأصلية في لينكس لمراقبة الأحداث |
| **osquery** | استعلام عن حالة النظام عبر منصات متعددة |
| **Microsoft Defender for Endpoint** | النسخة التجارية والموسعة (الأخ الأكبر لـ Sysmon) |
| **Velociraptor** | للبحث الحي والاستجابة للحوادث |
