# trivy — الدليل الكامل

تُعد أداة `trivy` (من تطوير Aqua Security) الأداة مفتوحة المصدر الأبرز لفحص الثغرات الأمنية، الأخطاء الإعدادية (Misconfigurations)، وتسريب الأسرار (Secrets) في الحاويات (Containers)، أنظمة الملفات، البنية التحتية ككود (IaC)، مجموعات Kubernetes، وقوائم المكونات البرمجية (SBOMs). تتميز بكونها ملفاً ثنائياً خفيفاً بلغة Go، وتعتمد على قاعدة بيانات شاملة لثغرات أنظمة التشغيل (CVEs)، مع دعم متزايد للمكتبات البرمجية.

## التثبيت (Install)

```terminal
brew install trivy
apt install trivy
docker run aquasec/trivy image alpine:3.18
```

## الأوامر الفرعية (Subcommands)

| الأمر | الغرض |
|------|---------|
| `image` | فحص صور الحاويات (Container image scan) |
| `filesystem` / `fs` | فحص المجلدات المحلية |
| `repository` / `repo` | فحص مستودعات Git (استنساخ وفحص) |
| `kubernetes` / `k8s` | فحص حي لمجموعات K8s |
| `config` | فحص أخطاء IaC (Terraform, Dockerfile, CloudFormation, K8s) |
| `sbom` | توليد أو فحص قوائم SBOM (بصيغ CycloneDX, SPDX) |
| `aws` | فحص الأخطاء الإعدادية في حسابات AWS |
| `vm` | فحص صور الأجهزة الافتراضية (.qcow2 / .vmdk) |
| `module` | وحدات مخصصة مبنية على WASM |
| `server` / `client` | وضع الخادم/العميل لمشاركة الذاكرة المخبئية (Cache) |

## الخيارات الشائعة (Common Flags)

| الخيار | الغرض |
|------|---------|
| `--severity` | تصفية النتائج حسب الخطورة (`HIGH,CRITICAL`) |
| `--ignore-unfixed` | إخفاء الثغرات التي لم يتوفر لها إصلاح بعد |
| `-o <file>` | تحديد ملف المخرجات |
| `--format` | الصيغة (`table`, `json`, `sarif`, `cyclonedx`, `spdx-json`) |
| `--scanners` | تحديد أنواع الفحص (`vuln`, `misconfig`, `secret`, `license`) |
| `--vuln-type` | نوع الثغرة (`os`, `library`) |
| `--skip-dirs` / `--skip-files` | استثناء مجلدات أو ملفات محددة |
| `--ignorefile .trivyignore` | القائمة البيضاء للثغرات المقبولة |
| `--exit-code 1` | إنهاء العملية برمز خطأ عند وجود نتائج (مفيد لأتمتة CI) |
| `--cache-dir <path>` | مسار الذاكرة المخبئية |
| `--db-repository` | مرآة لقاعدة البيانات (للبيئات المعزولة) |
| `--platform linux/amd64` | فحص صور لمنصات معمارية مختلفة |

## سير العمل (Workflows)

### فحص صورة حاوية (Container Image)

```terminal
trivy image --severity HIGH,CRITICAL --ignore-unfixed nginx:1.25.3
```

### فحص مجلد يحتوي على إعدادات IaC

```terminal
trivy config ./terraform
trivy config --severity HIGH ./k8s-manifests
```

### فحص مجموعة Kubernetes حية

```terminal
trivy k8s --report summary cluster
trivy k8s --report all cluster -o trivy-k8s.json --format json
```

### فحص مستودع Git بحثاً عن الأسرار والأخطاء

```terminal
trivy repo --scanners secret,misconfig https://github.com/target/repo
```

### توليد وفحص SBOM

```terminal
trivy image --format cyclonedx -o nginx-sbom.json nginx:1.25.3
trivy sbom --severity CRITICAL nginx-sbom.json
```

### التكامل مع خطوط الأتمتة (CI Integration)

```yaml
# مثال لـ GitHub Actions
- uses: aquasecurity/trivy-action@master
  with:
    image-ref: ghcr.io/me/myapp:${{ github.sha }}
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
    ignore-unfixed: true
```

## تحليل النتائج (Output)

```
nginx:1.25.3 (debian 12.2)
==========================
Total: 12 (HIGH: 9, CRITICAL: 3)

┌─────────────┬────────────────┬──────────┬───────────────────┬────────┐
│ Library     │ Vulnerability  │ Severity │ Installed Version │ Fixed  │
├─────────────┼────────────────┼──────────┼───────────────────┼────────┤
│ libxml2     │ CVE-2024-25062 │ HIGH     │ 2.9.14+dfsg-1.3   │ 2.9.15 │
│ openssl     │ CVE-2024-0727  │ CRITICAL │ 3.0.11-1~deb12u1  │ 3.0.13 │
└─────────────┴────────────────┴──────────┴───────────────────┴────────┘
```

تعتبر مخرجات JSON مثالية للأتمتة والبرمجة، بينما تغذي صيغة SARIF نظام GitHub Code Scanning مباشرة.

## استكشاف الأخطاء وإصلاحها (Troubleshooting)

| العرض | الحل |
|---------|-----|
| `unable to download DB` | قيود في الشبكة — استخدم `--db-repository` للإشارة لمرآة داخلية |
| وجود الكثير من النتائج غير القابلة للإصلاح | استخدم خيار `--ignore-unfixed` |
| بطء الفحص في الصور الضخمة | اقتصر على فحص الثغرات فقط عبر `--scanners vuln` |
| نتائج إيجابية خاطئة (False Positive) | استخدم ملف `.trivyignore` مع تحديد معرف الثغرة وتاريخ الصلاحية |
| استهلاك مفرط للذاكرة على نظام macOS | ارفع ذاكرة Docker Desktop أو استخدم النسخة الأصلية (Native binary) |

## منظور المدافع (Defender's Perspective)

تعتبر Trivy الأداة الأنسب للتكامل ضمن خطوط بناء البرمجيات (CI pipelines). يجب معاملة النتائج كبوابة أمنية (Gating)؛ حيث يؤدي وجود ثغرات `CRITICAL` أو `HIGH` إلى فشل بناء الصور الموجهة لبيئات الإنتاج. يفضل دمجها مع أدوات تحكم الدخول (Admission Controllers) مثل Kyverno أو Gatekeeper لمنع نشر الصور غير المفحوصة أو غير الموقعة.

## أمن العمليات (OPSEC)

- أداة دفاعية بحتة، ولا تشكل خطراً على سير عمل المهاجمين.
- ملاحظة: استخدام `trivy repo <github-url>` يستلزم استنساخ المستودع؛ المستودعات الخاصة تتطلب توقيع (GitHub Token) بصلاحية `repo`. أي تسريب لهذا التوقيع يمثل خطراً على سلاسل التوريد (Supply-chain risk).

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **Grype** | بديل من تطوير Anchore، يتميز بصغر الحجم |
| **Snyk** | تجارية، توفر تغطية أوسع للغات البرمجية |
| **Clair** | ماسح لصور الحاويات، توقف تطويره مؤخراً |
| **Docker Scout** | أداة مدمجة في Docker، تركز على سجلات الحاويات |
| **Anchore Engine** | منصة فحص ذاتية الاستضافة |
| **Syft** | مولد SBOM حصري (يعمل بتناغم مع Grype) |
| **Checkov** | فحص IaC (تتداخل مع `trivy config`) |
| **kubescape** | تقييم وضع K8s (تتداخل مع `trivy k8s`) |
