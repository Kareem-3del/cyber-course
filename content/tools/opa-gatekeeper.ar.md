# OPA / Gatekeeper — الدليل الكامل للمحترفين

يُعدّ `OPA` (Open Policy Agent) محرك سياسات عام الغرض (General-purpose policy engine). يتيح لك كتابة القواعد باستخدام لغة **Rego** التصريحية، وتقييمها مقابل أي مدخلات بصيغة JSON. أما **Gatekeeper** فهو نسخة OPA المخصصة للعمل كـ Kubernetes Admission Controller، حيث يقوم بحظر أو تعديل (Mutate) عمليات إنشاء الموارد بناءً على السياسات المحددة.

## OPA — التثبيت والاستخدام

```terminal
brew install opa
opa run --server          # يبدأ واجهة برمجة تطبيقات REST على المنفذ 8181
```

اختبار السياسة محلياً:

```terminal
echo '{"role":"admin"}' | opa eval -I -d policy.rego "data.example.allow"
opa test policy/         # تشغيل اختبارات الوحدة لـ Rego
opa fmt -w policy.rego
opa parse policy.rego
opa exec --decision allow --bundle bundle.tar.gz input.json
```

## Rego — أساسيات اللغة

```rego
package authz

default allow = false

allow {
    input.method == "GET"
    input.path == ["public", _]
}

allow {
    input.user.role == "admin"
}

deny[msg] {
    input.headers["X-Admin-Override"]
    not input.user.role == "admin"
    msg := sprintf("Override attempted by %v", [input.user.name])
}
```

المفاهيم الأساسية:

| المفهوم | المعنى |
|-----------|---------|
| `package x.y` | مساحة الاسم (Namespace) |
| `default rule = ...` | القيمة الافتراضية في حال عدم تطابق أي قاعدة |
| `rule { body }` | العطف (Conjunction) — يجب أن تتحقق جميع العبارات في الجسم |
| `rule[output] { body }` | قاعدة جزئية للمجموعات أو الكائنات |
| `not <expr>` | النفي (Negation) |
| `some x` | تعريف متغير وجودي |
| `every x in xs { ... }` | التقييم الشامل (Universal Quantification) |
| `import data.x.y` | استيراد حزمة أخرى |
| `_` | رمز عشوائي (Wildcard) |

## Gatekeeper — التثبيت على Kubernetes

```terminal
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml
```

الموارد المخصصة (Custom Resources):

| الرمز (CRD) | الغرض |
|------|---------|
| `ConstraintTemplate` | يعرّف السياسة (منطق Rego + مخطط البارامترات) |
| `Constraint` | يربط القالب بموارد Kubernetes محددة |
| `Config` | ضبط سلوك عملية القبول (Admission) |
| `Audit` results | تظهر في حالة `Constraint` (Status)، ويتم تحديثها دورياً |

### مثال — حظر وسم (tag) `latest`

```yaml
# constrainttemplate.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata: { name: k8sdisallowedtags }
spec:
  crd:
    spec:
      names: { kind: K8sDisallowedTags }
      validation:
        openAPIV3Schema:
          type: object
          properties:
            tags: { type: array, items: { type: string } }
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sdisallowedtags
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          tag := input.parameters.tags[_]
          endswith(container.image, ":" .. tag)
          msg := sprintf("image %v uses disallowed tag %v", [container.image, tag])
        }
```

```yaml
# constraint.yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sDisallowedTags
metadata: { name: deny-latest }
spec:
  match:
    kinds: [{ apiGroups: [""], kinds: [Pod] }]
  parameters: { tags: [latest] }
```

بعد تطبيق الملفين عبر `kubectl apply` → سيتم رفض أي `Pod` يستخدم الوسم `:latest` تلقائياً.

## أوضاع التشغيل (Modes)

تدعم قيود Gatekeeper خاصية `enforcementAction`:

- `deny` — حظر المورد مباشرة.
- `dryrun` — تسجيل المخالفة في السجلات فقط دون حظر.
- `warn` — إرسال تحذير للمستخدم مع السماح بإنشاء المورد.

> [!tip]
> استخدم وضع `dryrun` دائماً عند البدء في تطبيق سياسات جديدة لضمان عدم تعطل بيئة العمل.

## مكتبة السياسات الشائعة

توفر `open-policy-agent/gatekeeper-library` سياسات جاهزة تشمل:

- فرض وجود تسميات (Labels) محددة.
- حظر مساحات أسماء (Namespaces) معينة.
- منع استخدام الـ host-network / host-PID أو الامتيازات العالية (Privileged).
- السماح بالسحب من سجلات الصور (Registries) المعتمدة فقط.
- فرض إعدادات `securityContext`.
- فرض حدود الموارد (Resource limits).

## OPA خارج نطاق Kubernetes

يمكن لـ OPA أيضاً فرض السياسات في مجالات أخرى:

- **Envoy / API gateways** — كـ Sidecar للتحقق من الطلبات في الوقت الفعلي.
- **Terraform** — استخدام `conftest` أو `regula` لفحص ملفات الخطة (Plan JSON).
- **CI/CD** — التحقق من سلامة البنية التحتية قبل دمج التغييرات.
- **Microservices** — دمج قرارات Rego داخل الخدمات البرمجية.

```terminal
conftest test deployment.yaml --policy policy/
```

## سير العمل (Workflow)

### فحص ما قبل النشر في CI

```terminal
# التخطيط لـ Terraform
terraform plan -out tf.plan
terraform show -json tf.plan > plan.json
opa eval -d policies/ -i plan.json "data.terraform.deny" | jq

# الفشل في حال وجود مخالفات
test "$(opa eval -d policies/ -i plan.json -f raw 'count(data.terraform.deny)')" = "0"
```

### القبول في العنقود (Cluster Admission)

بمجرد تثبيت Gatekeeper، تتراكم القيود (Constraints) بمرور الوقت. يُنصح باستخدام `dryrun` لمدة أسبوعين قبل التحويل إلى `deny`.

## المشكلات الشائعة والحلول

| العرض | الحل |
|---------|-----|
| القيد لا يحظر أبداً | تأكد من `match.kinds`؛ راجع حالة التدقيق (Audit status) |
| لا توجد نتائج لـ `opa eval` | `data.example.allow` غير معرفة؛ تحقق من تطابق حزمة السياسة |
| بطء في عملية القبول | وجود عدد كبير من القيود أو حلقات Rego معقدة؛ استخدم `opa eval --profile` للتحليل |
| الحاجة لقوالب جاهزة | استعن بمستودع `gatekeeper-library` |

## منظور المدافع (Defender Perspective)

يُعتبر Gatekeeper بمثابة **سياج الحماية (Policy Guardrail)** لـ Kubernetes. أبرز حالات الاستخدام:

- منع الحاويات ذات الامتيازات العالية (Privileged Pods) على مستوى العنقود.
- فرض تشغيل الحاويات بمستخدم غير جذري (Non-root) ونظام ملفات للقراءة فقط.
- إلزامية استخدام `seccompProfile`.
- حصر الصور في سجلات معتمدة فقط.
- فرض تسميات أمن الـ Pod (Pod Security labels).

## العمليات الأمنية (OPSEC)

- تؤثر القيود على عمليات العنقود — لذا فإن الطرح المتدرج (Staged rollout) إلزامي.
- تظهر نتائج التدقيق (Audit) الموارد **الحالية غير الممتثلة** — وهذا مفيد جداً لعمليات التصحيح (Remediation)؛ لا تقم بالحذف التلقائي للموارد القديمة.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **Kyverno** | سياسات Kubernetes الأصلية بدون Rego (تعتمد على YAML) |
| **PSP / PodSecurityAdmission** | مدمج في Kubernetes (بديل لـ PSP الملغى) |
| **Cilium + Tetragon** | أمن الشبكات والتشغيل (Runtime) |
| **Snyk IaC** | فحص البنية التحتية كبرمجية (تجاري) |
| **Checkov / TFLint** | أدوات مخصصة لـ Terraform |
