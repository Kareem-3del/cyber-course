# HashiCorp Vault — full tutorial

`Vault` is the secrets-management server. Stores credentials, certs, encryption keys; brokers dynamic secrets (per-request DB creds, AWS STS, SSH OTP); encrypts data on the fly via Transit. Replaces "secrets in env vars" with policy-controlled, audited access.

## Install / boot

```terminal
brew install vault
vault server -dev      # in-memory, instant test mode

# Production
vault server -config=/etc/vault.d/vault.hcl
vault operator init
vault operator unseal <key1>
vault operator unseal <key2>
vault operator unseal <key3>
```

Production server: HA cluster with Raft / Consul backend, audit logging, MFA, sealed by Shamir secret-sharing.

## Auth methods

| Method | Use |
|--------|-----|
| `token` | Default; root token + child tokens |
| `userpass` | Username/password |
| `ldap` | LDAP/AD |
| `oidc` | OAuth/OIDC IdP |
| `kubernetes` | Pods auth via SA tokens |
| `approle` | App identity (RoleID + SecretID) |
| `aws` | EC2 / IAM principal |
| `azure` | Managed identities |
| `gcp` | Service-account |
| `cert` | Client cert |
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

## Secret engines

| Engine | What |
|--------|------|
| `kv` (v2) | Plain key-value |
| `database` | Dynamic per-request creds for Postgres / MySQL / Mongo / etc. |
| `aws` | STS access-keys with attached IAM policy |
| `azure` | Service principals on demand |
| `gcp` | Service-account keys / OAuth tokens |
| `pki` | Issue X.509 certs |
| `ssh` | OTP / signed CA SSH credentials |
| `transit` | "Encryption-as-a-service" (encrypt/decrypt via API) |
| `totp` | Time-based one-time passwords |
| `kubernetes` | Issue ephemeral service-account tokens |
| `transform` | Format-preserving encryption / tokenization |

```terminal
vault secrets enable -path=secret kv-v2
vault kv put secret/myapp/db username=alice password=Pass1
vault kv get secret/myapp/db
```

## Policies — Sentinel / HCL

Vault policies are HCL with paths + capabilities:

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

## Dynamic database creds

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
# username=v-app-myapp-A8s..., password=...   (lasts 1h, then auto-revoked)
```

App requests creds at startup; Vault leases them; lease expires → cred destroyed in Postgres.

## Transit — encryption as a service

```terminal
vault secrets enable transit
vault write -f transit/keys/myapp
vault write transit/encrypt/myapp plaintext=$(echo "secret-data" | base64)
# returns ciphertext: vault:v1:abc...

vault write transit/decrypt/myapp ciphertext=vault:v1:abc...
# returns base64 plaintext
```

App never holds the key; cipher rotation handled by Vault.

## PKI — issue certs

```terminal
vault secrets enable pki
vault write pki/root/generate/internal common_name=corp.local ttl=87600h
vault write pki/roles/myapp \
   allowed_domains=corp.local allow_subdomains=true \
   max_ttl=720h

vault write pki/issue/myapp common_name=svc.corp.local ttl=240h
# returns cert + private key + CA chain
```

## Workflow — Kubernetes secret injection

1. Cluster: install Vault + auth/kubernetes.
2. Create role binding pod's SA to a Vault policy.
3. Pod annotations:

```yaml
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "myapp"
        vault.hashicorp.com/agent-inject-secret-db: "database/creds/myapp"
```

Vault Agent sidecar injects creds at `/vault/secrets/db`. Pod just `cat /vault/secrets/db`.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| `permission denied` on otherwise-valid path | Token lacks policy attaching path; `vault token lookup` |
| Sealed at startup | Provide unseal keys; auto-unseal via cloud KMS in production |
| `lease expired` errors | App not renewing leases; use Vault Agent / library |
| Audit log missing | Enable audit device: `vault audit enable file file_path=/var/log/vault/audit.log` |
| KV v1 vs v2 confusion | Default new mounts use v2 (versioned); paths differ (`secret/data/x` vs `secret/x`) |

## Defender perspective

Vault is the **right place** for everything secret. Pair with:

- **Audit logging** to SIEM — all access is queryable.
- **Sentinel policies** (paid) for advanced policy logic.
- **Auto-rotation** for static secrets that can't be made dynamic.

## OPSEC

- Root token is only for setup; revoke after.
- Unseal keys (Shamir 5-of-3) split across operators.
- Auto-unseal via cloud KMS for HA but introduces dependency on cloud trust.
- Disable sealed instances from accepting unauthenticated requests.
- Encrypt audit logs at rest; redact PII in audit policy.

## Related tools

| Tool | Niche |
|------|-------|
| **AWS Secrets Manager** | AWS-native; no transit |
| **GCP Secret Manager** | GCP-native |
| **Azure Key Vault** | Azure-native |
| **Doppler** | SaaS secrets manager |
| **1Password Connect** | App-level secrets via 1Password vault |
| **Bitwarden Secrets Manager** | OSS alternative |
| **ExternalSecrets Operator** | K8s glue between cloud secret stores and K8s Secrets |
