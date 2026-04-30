# kube-bench — الدليل الكامل

تُعد أداة `kube-bench` (من تطوير Aqua Security) الأداة المعيارية لفحص واختبار أمن مجموعات Kubernetes وفقاً لمعايير CIS (Center for Internet Security). يتم تشغيلها عادة كـ Job أو DaemonSet داخل المجموعة، حيث تقوم بقراءة إعدادات الـ kubelet والـ apiserver والـ controller-manager لتقييم مدى الالتزام بالمعايير الأمنية.

## التثبيت والتشغيل (Install / Run)

### التشغيل كـ Job لمرة واحدة

```terminal
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
kubectl logs job/kube-bench
```

### التشغيل حسب المكون (Control plane, node, etcd, policies)

```terminal
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job-master.yaml
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job-node.yaml
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job-etcd.yaml
```

### التشغيل محلياً (خارج المجموعة)

```terminal
brew install kube-bench
kube-bench run --benchmark cis-1.9 --targets master,node,policies
```

## الخيارات الرئيسية (Flags)

| الخيار | الغرض |
|------|---------|
| `run` | بدء عملية الفحص |
| `--benchmark` | المعيار المراد الفحص بناءً عليه (`cis-1.9`, `eks-1.5`, `gke-1.6`, إلخ) |
| `--targets` | المكونات المستهدفة (`master,node,etcd,policies,controlplane`) |
| `--config-dir` | تغيير مسار الإعدادات (الافتراضي `/etc/kube-bench/cfg`) |
| `--check <id>` | تشغيل اختبار محدد برقم المعرف |
| `--include-test-output` | تضمين المخرجات الخام للاختبار |
| `--json` | إخراج النتائج بصيغة JSON |
| `--scored` | عرض البنود التي تدخل في التقييم الرقمي فقط |
| `--asff` | صيغة AWS Security Hub (ASFF) |

## المعايير المخصصة للمنصات السحابية

يجب استخدام `--benchmark eks-1.5` عند العمل على بيئة AWS EKS، حيث يتم تخطي فحوصات الـ master نظراً لأنها تدار بواسطة AWS. وينطبق الأمر نفسه على `aks` (Azure) و `gke` (GCP) و `rh` (OpenShift).

## تحليل المخرجات (Output)

```
[INFO] 1 Master Node Security Configuration
[INFO] 1.1 Master Node Configuration Files
[PASS] 1.1.1 Ensure that the API server pod specification file permissions are set to 644 or more restrictive
[FAIL] 1.1.7 Ensure that the etcd pod specification file ownership is set to root:root
[WARN] 1.2.6 Ensure that the --kubelet-certificate-authority argument is set as appropriate

== Summary ==
50 checks PASS  4 checks FAIL  6 checks WARN
```

- `FAIL`: خرق للمعايير الأمنية يتطلب تدخلاً.
- `WARN`: اختبارات تتطلب مراجعة يدوية (لا يمكن لـ kube-bench التحقق منها تلقائياً).
- `INFO`: معلومات وصفية فقط.

## استكشاف الأخطاء وإصلاحها (Troubleshooting)

| العرض | الحل |
|---------|-----|
| فشل جميع الاختبارات برسالة "file not found" | استهداف خاطئ للمكون (مثل تشغيل فحوصات master على node)؛ تأكد من ضبط `--targets node` |
| تجاهل الـ `master` في بيئات EKS | سلوك متوقع؛ لأن الـ control plane تدار بواسطة المزود السحابي |
| الرغبة في استثناء بعض البنود | قم بتعديل ملف الإعدادات `cfg/<benchmark>/master.yaml` واضبط `audit_config.allowed: true` للنتائج المقبولة |
| استخدام معيار قديم | حدث الأداة أو استخدم `--benchmark cis-1.10` (أحدث إصدار) |

## منظور المدافع (Defender's Perspective)

تعتبر هذه الأداة ركيزة أساسية للمدافعين. يوصى بتشغيلها أسبوعياً عبر CronJob وإرسال مخرجات الـ JSON إلى نظام الـ SIEM الخاص بالمؤسسة. التركيز الأساسي يجب أن ينصب على:

- القسم 1.2.x: خيارات الـ apiserver (التدقيق، الوصول المجهول، الصلاحيات).
- القسم 4.2.x: خيارات الـ kubelet (المصادقة، الصلاحيات).
- القسم 5.x: سياسات الـ RBAC والـ Pod Security.

يفضل دمجها مع أدوات أخرى مثل kubescape و trivy k8s و Falco لضمان تغطية أمنية شاملة أثناء التشغيل.

## أدوات ذات صلة

- **kubescape** — أوسع نطاقاً (تغطي NSA / MITRE / CIS) وتوفر تقارير HTML.
- **trivy k8s** — فحص شامل للثغرات، الأخطاء الإعدادية، والأسرار (Secrets) داخل المجموعة.
- **kubeaudit** — أداة سطر أوامر للفحص الأمني، مكملة لـ kube-bench.
- **CIS-CAT** — الماسح الرسمي من منظمة CIS (أداة تجارية).
