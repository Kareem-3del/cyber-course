# OPA / Gatekeeper — full tutorial

`OPA` (Open Policy Agent) is a general-purpose policy engine. Write rules in **Rego** (declarative); evaluate them against any JSON input. **Gatekeeper** is OPA repackaged as a Kubernetes admission controller — block / mutate resource creation based on policy.

## OPA — install / use

```terminal
brew install opa
opa run --server          # starts REST API on :8181
```

Test policy locally:

```terminal
echo '{"role":"admin"}' | opa eval -I -d policy.rego "data.example.allow"
opa test policy/         # run rego unit tests
opa fmt -w policy.rego
opa parse policy.rego
opa exec --decision allow --bundle bundle.tar.gz input.json
```

## Rego — language essentials

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

Key constructs:

| Construct | Meaning |
|-----------|---------|
| `package x.y` | Namespace |
| `default rule = ...` | Fallback if no other definitions match |
| `rule { body }` | Conjunction — all body statements must hold |
| `rule[output] { body }` | Partial set/object rule |
| `not <expr>` | Negation |
| `some x` | Existential intro |
| `every x in xs { ... }` | Universal |
| `import data.x.y` | Import another package |
| `_` | Wildcard |

## Gatekeeper — install on Kubernetes

```terminal
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml
```

Custom resources:

| CRD | Purpose |
|------|---------|
| `ConstraintTemplate` | Defines a policy (Rego + parameters schema) |
| `Constraint` | Binds a template to specific Kubernetes resources |
| `Config` | Tunes admission behavior |
| `Audit` results | Stored on Constraint status, polled periodically |

### Example — block latest tag

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

`kubectl apply` both → any pod with `:latest` is denied at admission.

## Modes

Gatekeeper Constraints support `enforcementAction:`

- `deny` — block.
- `dryrun` — log only.
- `warn` — return warning to user but allow.

Use `dryrun` first when rolling out new policies.

## Common policy library

`open-policy-agent/gatekeeper-library` ships:

- Required labels.
- Disallowed namespaces.
- No host-network / host-PID / privileged.
- Allowed registries only.
- Required securityContext.
- Required resource limits.
- Block Service type=LoadBalancer in some namespaces.

Apply selectively to your cluster.

## OPA outside Kubernetes

OPA also enforces policies for:

- **Envoy / API gateways** — sidecar at request time.
- **Terraform** — `conftest` or `regula` against plan JSON.
- **CI/CD** — pre-merge check on infrastructure changes.
- **Microservices** — embed Rego decision in services.

```terminal
conftest test deployment.yaml --policy policy/
```

## Workflow

### Pre-deploy CI check

```terminal
# Plan terraform
terraform plan -out tf.plan
terraform show -json tf.plan > plan.json
opa eval -d policies/ -i plan.json "data.terraform.deny" | jq

# fail if denials
test "$(opa eval -d policies/ -i plan.json -f raw 'count(data.terraform.deny)')" = "0"
```

### Cluster admission

Gatekeeper installs once; constraints accumulate over time. Use `dryrun` for 2 weeks before flipping to `deny`.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Constraint never blocks | Wrong `match.kinds`; check Audit status |
| OPA `eval` no result | `data.example.allow` undefined → policy package mismatch |
| Slow admission | Too many constraints / heavy Rego loops; profile with `opa eval --profile` |
| Library template needed | Pull from `gatekeeper-library` repo |

## Defender perspective

Gatekeeper is the **policy guardrail** for K8s. Use cases:

- Forbid privileged pods cluster-wide.
- Mandate non-root, read-only-root-fs.
- Require `seccompProfile`.
- Restrict images to approved registries.
- Require Pod Security labels.

For non-K8s: use OPA alongside any service that wants policy externalized.

## OPSEC (defender)

- Constraints affect cluster operations — staged rollouts mandatory.
- Audit results show **non-compliant existing** resources — useful for migration; don't auto-delete.

## Related tools

| Tool | Niche |
|------|-------|
| **Kyverno** | Kubernetes-native policy without Rego (YAML-based) |
| **PSP / PodSecurityAdmission** | Kubernetes built-in (deprecating PSP) |
| **Cilium Network Policies + Tetragon** | Network + runtime |
| **Snyk Infrastructure as Code** | Commercial IaC scanning |
| **Checkov / TFLint** | Terraform-specific |
