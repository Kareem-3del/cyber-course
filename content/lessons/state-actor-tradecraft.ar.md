# أساليب عمل المجموعات المتقدمة: الفرق بين الهاوي والمحترف الحقيقي

طب إيه اللي بيخلّي مجموعة هكر &quot;APT&quot; مش بس هكر شطار؟

هل هي الأدوات؟ — لأ. أدواتهم في GitHub.

هل هي الـ zero-days؟ — لأ. الـ zero-days بقت سلعة بتتشترى من Zerodium.

هل هي الفلوس؟ — لأ. كل دولة عندها budget.

اللي بيفرق فعلاً هو <b>OPSEC discipline</b>. الصبر. الانضباط. القدرة على إنك تقعد جوه شبكة <b>سنة كاملة</b> من غير ما تحرّك حاجة لازم. تشتري دومين النهاردة، تعطّله سنة قبل ما تبدأ تستخدمه. تخترق شركة، تقعد ساكن، ما تسرقش حاجة، عشان لما الأمر يجي تكون لسه جوّا.

ده الفرق بين Volt Typhoon (الصين) وبين الكيدي اللي بيشغّل Cobalt Strike على VPS متسجّل من إمبارح.

> [!info] استخبارات دفاعية
> المعلومات دي عشان تعمل &quot;Adversary Modeling&quot; ضد بنيتك. التكتيكات دي موثّقة من Mandiant و Microsoft MSTIC و CISA و CrowdStrike — مش نظريات.

## الركائز الأربعة لـ tradecraft الدول

### 1. التجزئة (Compartmentalization)

كل عملية ليها فريقها وأدواتها وبنيتها التحتية. لو عملية اتحرقت، الباقي يفضل في الظل.

APT29 عندهم teams مختلفة لـ:
- Initial access (phishing campaigns).
- Long-term persistence.
- Lateral movement specialists.
- Exfiltration teams.

كل team مش عارف اللي عند التاني. لو واحد اتمسك، ما يكشفش الباقي.

### 2. الصبر الاستراتيجي

في تقرير Mandiant عن APT1 (الصين) من 2013، متوسط dwell time كان <b>356 يوم</b>. سنة كاملة جوّا الشبكة قبل ما حد ياخد باله. APT29 (روسيا) عندهم حالات قعدوا فيها أكتر من سنتين.

ليه الصبر ده؟ لأن:
- بيتعلموا الشبكة قبل ما يتحركوا.
- بيراقبوا normal patterns عشان يقلّدوها.
- بيستنوا اللحظة الصح (انتخابات، اجتماع قمة، أزمة).

الكيدي بيدخل ويسرق في يوم. الـ APT بتدخل وتقعد سنة.

### 3. Living off the Land (LOLBAS)

ليه أرفع binary غريب يخوّف الـ EDR وأنا عندي كل اللي محتاجه جوّا Windows؟

- **mshta.exe** — ينفّذ HTML application من URL.
- **rundll32.exe** — يلوّد DLL خبيثة كأنها نظام.
- **regsvr32.exe** — squiblydoo bypass للـ AppLocker.
- **certutil.exe** — يحمّل ملفات من الإنترنت (ساعات بـ base64 decode).
- **comsvcs.dll** — يـ dump بيانات من lsass من غير mimikatz.
- **wmic** و **PowerShell** — كل حاجة.

كله binaries أصلية موقّعة من Microsoft. الـ EDR ساعات صعب يفرّق بين استخدام شرعي واستخدام خبيث.

### 4. False Flags

دي الجوهرة. المهاجم المحترف بيزرع أدلة مضلّلة عشان الـ Attribution تروح لجهة تانية:

- يكتب comments بالكود بالروسية وهو صيني.
- يستخدم timestamps من timezone موسكو وهو في بكين.
- يعيد استخدام malware معروف لمجموعة تانية (Olympic Destroyer كان بتلعب على هتفقد بأنماط من Lazarus و APT3 و Sandworm في نفس الوقت).
- يبني infrastructure على hosting providers بتاعت بلد تالتة.

الـ Attribution فخ كبير. المحققين الشطار عارفين ده، فما يكتفوش بدليل واحد.

## قصص من الواقع

### APT29 (Cozy Bear / Nobelium) — SolarWinds

2020. المجموعة دي اخترقت SolarWinds. مش بـ phishing عبيط. هما <b>اخترقوا سيرفر البناء</b> وزرعوا SUNBURST في DLL واحد. النتيجة:

- 18,000 مؤسسة نزّلت الـ backdoor.
- ركّزوا على ~100 ضحية حقيقية: وزارة الخزانة، وزارة الأمن الداخلي، Microsoft، FireEye.
- الـ backdoor كان بيتم بشكل dormant لمدة 12-14 يوم بعد التثبيت قبل ما يبدأ يعمل أي حاجة.
- بيتواصل مع C2 عبر domain يبان شرعي.
- بيعمل DGA على subdomains.

أعظم درس من SolarWinds: <b>التوقيع الرقمي مش معناه الأمان</b>. أي software signed لازم يبقى تحت behavioral monitoring.

### Volt Typhoon (الصين) — Living off the Land

2023. CISA كشفت عملية اسمها Volt Typhoon. مجموعة صينية قاعدة في بنية تحتية أمريكية حرجة. اللي يميّزهم:

- <b>مفيش malware جديد</b>. كله LOLBAS.
- إستخدام Routers ضعيفة (Cisco، NetGear) كـ proxy infrastructure.
- بيستخدمون credentials شرعية مسروقة من LSASS.
- كل تواصل عبر port 443 بيشبه HTTPS عادي.

النية المعلنة من CISA: &quot;pre-positioning for disruption during conflict&quot;. يعني قاعدين عشان لو فيه صدام عسكري على تايوان، يعطّلوا الموانئ والمياه.

### Lazarus (كوريا الشمالية) — Bangladesh Bank Heist

2016. Lazarus ضرب البنك المركزي البنغالي. السكة:
- spear-phishing لموظف.
- foothold لشهور.
- استكشفوا SWIFT system بالكامل.
- يوم الجمعة (لما البنك مقفول) بعتوا 35 طلب تحويل إجمالاً 951 مليون دولار للفلبين وسريلانكا.
- نجح منهم 81 مليون. الباقي اتعطّل بسبب error في spelling في طلب واحد (كتبوا &quot;Fandation&quot; بدل &quot;Foundation&quot;).

Lazarus بقت متخصصة في cyber heists لتمويل البرنامج النووي الكوري الشمالي. جنوا أكتر من 3 مليار دولار من crypto exchanges بس.

## OPSEC الـ APT — اللي بيفرقهم

### Infrastructure

- **Tier-3 architecture:** Operator → VPN → Tier-2 (CDN) → Tier-1 (cheap VPS) → C2 → Victim.
- **Domain aging:** يشتروا دومين بقاله 5 سنين، ويسيبوه &quot;بيتسخّن&quot; سنة قبل الاستخدام.
- **Bulletproof hosting** في دول مش متعاونة قانونياً.

### Identity

- **Golden Ticket** — تذكرة Kerberos مزوّرة بمفتاح krbtgt → سيطرة كاملة على AD مدى الحياة.
- **Federation Forgery** — في SolarWinds، APT29 سرقوا SAML signing key وبكده دخلوا أي Microsoft 365 tenant كأنهم admin شرعي.
- **Firmware implants** — في BIOS/UEFI، بيفضلوا حتى بعد فرمتة الجهاز.

### Data Exfiltration

- ما بياخدوش 50GB دفعة واحدة. هما بيشغّلوا rclone بمعدل 1-5GB في اليوم.
- Exfil في ساعات شغل الضحية (مش الفجر).
- استخدام cloud storage بتاع الضحية (OneDrive للضحية → OneDrive تاني تابع للمهاجم) — يبان شرعي.

## الحماية — الذي يعمل ضد APT

### مراقبة LOLBAS

أي استخدام غريب لـ <code>wmic</code>، <code>rundll32</code>، <code>certutil</code> = إنذار. الـ Sysmon + Sentinel + Sigma rules.

### Tier 0 isolation

Domain Admins ما بيدخلوش إلا على DCs. مفيش تسجيل دخول بحساب admin على workstation عادية. أبداً.

### Detection-as-Code

كل rule في git مع unit test. كل ما تطلع TTP جديدة في تقرير Mandiant، تكتب rule، تختبره بـ Atomic Red Team، تـ deploy.

### Threat Intelligence اللي بتقرّبه

اشترك في feeds Mandiant و CrowdStrike و MS MSTIC. كل شهر اختار APT report، حاكي الـ TTPs بتاعتهم في بيئتك (Purple Team).

## الخلاصة الناشفة

الفرق بين الكيدي والـ APT مش الذكاء، هو الـ <b>discipline</b>.

الكيدي بيستعجل. الـ APT بتصبر سنة.
الكيدي بيرفع malware. الـ APT بتشتغل LOLBAS.
الكيدي بيستخدم default Cobalt Strike. الـ APT بتعدّل الـ profile و الـ JA3 بإيدها.
الكيدي بيختفي بعد السرقة. الـ APT بتقعد لتاريخ غير معروف.

دفاعك مش لازم يبقى أقوى من الـ APT — لازم يبقى <b>أكتر صبراً</b> منهم. لو ما عندكش 24/7 monitoring، لو ما بتراجعش الـ logs بعمق، لو ما بتختبرش الـ detections بنفسك — أنت مش بتدافع. أنت بتأمّل.

والأمل مش استراتيجية.
