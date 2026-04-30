# kube-bench — full tutorial

`kube-bench` (Aqua Security) audits a Kubernetes cluster against the CIS Kubernetes Benchmark. Runs as a Job/DaemonSet inside the cluster, reads kubelet/apiserver/controller-manager configs, and scores them.

## Install / run

### As a one-shot Job

```terminal
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
kubectl logs job/kube-bench
```

### Per-component (control plane, node, etcd, policies)

```terminal
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job-master.yaml
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job-node.yaml
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job-etcd.yaml
```

### Local binary (off-cluster)

```terminal
brew install kube-bench
kube-bench run --benchmark cis-1.9 --targets master,node,policies
```

## Flags

| Flag | Purpose |
|------|---------|
| `run` | Run audit |
| `--benchmark` | Spec to run against (`cis-1.9`, `cis-1.10`, `aks-1.7`, `eks-1.5`, `gke-1.6`, `rh-1.6`) |
| `--targets` | `master,node,etcd,policies,controlplane,managedservices` |
| `--config-dir` | Override config (default `/etc/kube-bench/cfg`) |
| `--check <id>` | Run a single check |
| `--include-test-output` | Include raw output |
| `--json` | JSON output |
| `--scored` | Only scored items |
| `--asff` | AWS Security Hub finding format |

## Distribution-specific benchmarks

`--benchmark eks-1.5` for AWS EKS managed control plane (skips checks on master, since you don't control it). Same for `aks` (Azure), `gke` (GCP), `rh` (OpenShift).

## Good output

```
[INFO] 1 Master Node Security Configuration
[INFO] 1.1 Master Node Configuration Files
[PASS] 1.1.1 Ensure that the API server pod specification file permissions are set to 644 or more restrictive
[FAIL] 1.1.7 Ensure that the etcd pod specification file ownership is set to root:root
[WARN] 1.2.6 Ensure that the --kubelet-certificate-authority argument is set as appropriate

== Summary ==
50 checks PASS  4 checks FAIL  6 checks WARN
```

`FAIL` are violations. `WARN` are manual checks (kube-bench can't auto-verify). `INFO` are descriptive only.

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| All checks fail with "file not found" | Wrong target (e.g. running master checks on a worker node); set `--targets node` |
| EKS shows `master` skipped | Expected — managed control plane |
| Want exceptions | Edit `cfg/<benchmark>/master.yaml` and set `audit_config.allowed: true` for accepted findings |
| Outdated benchmark | `kube-bench --benchmark cis-1.10` (latest) |

## Defender's perspective

Pure defender tool. Run weekly via CronJob; ship JSON to your SIEM. Key wins:

- 1.2.x — apiserver flags (audit, anonymous, authorization).
- 4.2.x — kubelet flags (anonymous, authentication, AlwaysAllow).
- 5.x — RBAC and Pod Security policies.

Pair with kubescape, trivy k8s, and Falco for runtime detection.

## Related tools

- **kubescape** — broader (NSA / MITRE / CIS); HTML reports.
- **trivy k8s** — multi-aspect (vuln + misconfig + secrets) for cluster.
- **kubeaudit** — CLI checks; complementary.
- **CIS-CAT** — official CIS scanner; commercial.
