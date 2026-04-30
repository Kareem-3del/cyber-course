# HashiCorp Vault — الدليل الكامل

يُعد `Vault` خادماً مركزياً لإدارة الأسرار (Secrets Management). يقوم بتخزين بيانات الاعتماد (Credentials)، الشهادات الرقمية (Certificates)، ومفاتيح التشفير (Encryption Keys)؛ كما يعمل كوسيط للأسرار الديناميكية (Dynamic Secrets) مثل بيانات دخول قاعدة البيانات لكل طلب، و AWS STS، و SSH OTP. يوفر `Transit` تشفيراً للبيانات بشكل فوري. يهدف Vault إلى استبدال ممارسة "تخزين الأسرار في متغيرات البيئة" (Secrets in env vars) بنظام وصول خاضع للسياسات (Policy-controlled) ومدقق بالكامل (Audited).

## التثبيت والتشغيل (Install / Boot)

```terminal
brew install vault
vault server -dev      # وضع الاختبار الفوري في الذاكرة

# الإنتاج (Production)
vault server -config=/etc/vault.d/vault.hcl
vault operator init
vault operator unseal <key1>
vault operator unseal <key2>
vault operator unseal <key3>
```

خادم الإنتاج: يتكون عادةً من عنقود (Cluster) عالي التوفر (HA) مع واجهة خلفية (Backend) تعتمد على Raft أو Consul، مع تفعيل سجلات التدقيق (Audit logging)، والمصادقة متعددة العوامل (MFA)، ويتم فك قفل الخادم (Unseal) عبر نظام مشاركة الأسرار الخاص بـ Shamir (Shamir secret-sharing).

## طرق المصادقة (Auth Methods)

| الطريقة | الاستخدام |
|--------|-----|
| `token` | الافتراضية؛ رمز الجذر (Root token) + الرموز التابعة |
| `userpass` | اسم المستخدم وكلمة المرور |
| `ldap` | LDAP / Active Directory |
| `oidc` | مزود الهوية (IdP) عبر OAuth/OIDC |
| `kubernetes` | مصادقة الـ Pods عبر رموز حساب الخدمة (SA tokens) |
| `approle` | هوية التطبيقات (RoleID + SecretID) |
| `aws` | كيانات EC2 / IAM |
| `azure` | الهويات المدارة (Managed identities) |
| `gcp` | حساب الخدمة (Service-account) |
| `cert` | شهادة العميل (Client cert) |
| `tls-cert` | mTLS |
| `tokenless OIDC for CI` | GitHub Actions OIDC |

```terminal
vault auth enable kubernetes
vault write auth/kubernetes/config kubernetes_host="https://kubernetes.default.svc"
vault write auth/kubernetes/role/myapp \
    bound_service_account_names=myapp \
    bound_service_account_namespaces=default \
    policies=myapp-policy \
    ttl=1h
```

## محركات الأسرار (Secret Engines)

| المحرك | الوظيفة |
|--------|------|
| `kv` (v2) | مفتاح-قيمة بسيط (Key-Value) |
| `database` | بيانات اعتماد ديناميكية لقواعد البيانات (Postgres / MySQL / Mongo / إلخ) |
| `aws` | مفاتيح وصول STS مع سياسة IAM مرفقة |
| `azure` | كيانات الخدمة (Service principals) عند الطلب |
| `gcp` | مفاتيح حسابات الخدمة / رموز OAuth |
| `pki` | إصدار شهادات X.509 |
| `ssh` | بيانات SSH (OTP / Signed CA) |
| `transit` | "التشفير كخدمة" (Encryption-as-a-service) عبر API |
| `totp` | كلمات مرور لمرة واحدة تعتمد على الوقت |
| `kubernetes` | إصدار رموز حساب خدمة مؤقتة |
| `transform` | التشفير مع الحفاظ على التنسيق (Format-preserving encryption) |

```terminal
vault secrets enable -path=secret kv-v2
vault kv put secret/myapp/db username=alice password=Pass1
vault kv get secret/myapp/db
```

## السياسات — Sentinel / HCL (Policies)

سياسات Vault تُكتب بلغة HCL وتتضمن المسارات (Paths) والصلاحيات (Capabilities):

```hcl
path "secret/data/myapp/*" {
  capabilities = ["read", "list"]
}

path "secret/data/admin/*" {
  capabilities = ["deny"]
}

path "transit/encrypt/myapp" {
  capabilities = ["update"]
}
```

```terminal
vault policy write myapp-policy myapp.hcl
vault token create -policy=myapp-policy
```

## بيانات اعتماد قاعدة البيانات الديناميكية

```terminal
vault secrets enable database
vault write database/config/postgres \
   plugin_name=postgresql-database-plugin \
   connection_url="postgresql://{{username}}:{{password}}@db:5432/postgres" \
   allowed_roles=myapp \
   username=vault_admin \
   password=...

vault write database/roles/myapp \
   db_name=postgres \
   creation_statements="CREATE ROLE \"{{name}}\" LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
   default_ttl=1h max_ttl=24h
```

```terminal
vault read database/creds/myapp
# username=v-app-myapp-A8s..., password=...   (صالحة لمدة ساعة، ثم تُلغى تلقائياً)
```

يطلب التطبيق بيانات الاعتماد عند التشغيل؛ يقوم Vault بتأجيرها (Lease)؛ وعند انتهاء مدة الإيجار، يتم تدمير البيانات في قاعدة البيانات.

## خدمة التشفير — Transit

```terminal
vault secrets enable transit
vault write -f transit/keys/myapp
vault write transit/encrypt/myapp plaintext=$(echo "secret-data" | base64)
# يعيد النص المشفر: vault:v1:abc...

vault write transit/decrypt/myapp ciphertext=vault:v1:abc...
# يعيد النص الأصلي بصيغة base64
```

لا يمتلك التطبيق المفتاح أبداً؛ ويتولى Vault عملية تدوير المفاتيح (Cipher rotation).

## البنية التحتية للمفاتيح العامة (PKI) — إصدار الشهادات

```terminal
vault secrets enable pki
vault write pki/root/generate/internal common_name=corp.local ttl=87600h
vault write pki/roles/myapp \
   allowed_domains=corp.local allow_subdomains=true \
   max_ttl=720h

vault write pki/issue/myapp common_name=svc.corp.local ttl=240h
# يعيد الشهادة + المفتاح الخاص + سلسلة مرجع التصديق (CA chain)
```

## سير العمل — حقن الأسرار في Kubernetes

1. داخل العنقود: تثبيت Vault وتفعيل `auth/kubernetes`.
2. إنشاء ربط دور (Role binding) يربط حساب خدمة الـ Pod بسياسة Vault.
3. إضافة التوصيفات (Annotations) للـ Pod:

```yaml
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "myapp"
        vault.hashicorp.com/agent-inject-secret-db: "database/creds/myapp"
```

يقوم `Vault Agent sidecar` بحقن بيانات الاعتماد في المسار `/vault/secrets/db`. يحتاج الـ Pod فقط لتنفيذ أمر `cat /vault/secrets/db`.

## تشخيص المشاكل (Bad output / Fixes)

| العرض | الحل |
|---------|-----|
| `permission denied` على مسار صحيح | الرمز (Token) يفتقد للسياسة المرتبطة بالمسار؛ استخدم `vault token lookup` |
| حالة "مغلق" (Sealed) عند التشغيل | أدخل مفاتيح فك القفل (Unseal keys)؛ استخدم التفكيك التلقائي عبر cloud KMS في الإنتاج |
| أخطاء `lease expired` | التطبيق لا يجدد عقود الإيجار؛ استخدم Vault Agent أو المكتبات البرمجية الخاصة بـ Vault |
| سجل التدقيق مفقود | قم بتفعيل جهاز التدقيق: `vault audit enable file file_path=/var/log/vault/audit.log` |
| ارتباك بين KV v1 و v2 | يتم استخدام الإصدار الثاني (v2) افتراضياً؛ المسارات تختلف (`secret/data/x` مقابل `secret/x`) |

## منظور المدافع (Defender Perspective)

يُعد Vault **المكان الصحيح** لكل ما هو سري. يفضل ربطه بـ:

- **سجلات التدقيق (Audit logging)** مع نظام SIEM — جميع عمليات الوصول قابلة للاستعلام.
- **سياسات Sentinel** (نسخة مدفوعة) لمنطق سياسات متقدم.
- **التدوير التلقائي (Auto-rotation)** للأسرار الثابتة التي لا يمكن جعلها ديناميكية.

## الأمن العملياتي (OPSEC)

- رمز الجذر (Root token) مخصص للإعداد الأولي فقط؛ يجب إلغاؤه بعد ذلك.
- مفاتيح فك القفل (Shamir 5-of-3) يجب توزيعها على عدة مسؤولين.
- فك القفل التلقائي عبر cloud KMS مفيد للتوفر العالي ولكنه يضيف تبعية على سحابة خارجية.
- تعطيل الحالات "المغلقة" (Sealed) من قبول الطلبات غير المصادق عليها.
- تشفير سجلات التدقيق وتعمية المعلومات الشخصية (PII) في سياسة التدقيق.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **AWS Secrets Manager** | مدمج مع AWS؛ لا يدعم Transit |
| **GCP Secret Manager** | مدمج مع GCP |
| **Azure Key Vault** | مدمج مع Azure |
| **Doppler** | مدير أسرار كخدمة (SaaS) |
| **1Password Connect** | أسرار التطبيقات عبر 1Password |
| **Bitwarden Secrets Manager** | بديل مفتوح المصدر |
| **ExternalSecrets Operator** | لربط مخازن الأسرار السحابية بـ Kubernetes |
