# Falco — full tutorial

`Falco` is the cloud-native runtime security engine. eBPF-based (or kernel module) syscall + Kubernetes-audit consumer. Ships with rules that detect classic container escapes, suspicious shell-in-pod, kubectl abuse, etc.

## Install

```terminal
# Helm — most common
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco --namespace falco --create-namespace \
  --set tty=true --set falco.json_output=true \
  --set driver.kind=modern_ebpf
```

```terminal
# Standalone Linux
curl -sLO https://download.falco.org/packages/bin/$(uname -m)/falco-latest-$(uname -m).tar.gz
sudo tar -xvf falco-*.tar.gz -C /usr/local --strip-components=1
sudo falco
```

## Components

- **Driver**: eBPF (`modern_ebpf`), legacy eBPF (`ebpf`), or kernel module (`kmod`). Modern eBPF preferred.
- **Falco process**: reads syscalls + K8s audit log, evaluates rules, emits alerts.
- **Falcosidekick**: forwards alerts to Slack / Teams / SIEM / functions.
- **Falco Talon**: response engine — reacts to alerts (kill pod, label, isolate).

## Rule syntax (YAML)

```yaml
- rule: Terminal shell in container
  desc: A shell was spawned in a container with an attached terminal.
  condition: >
    spawned_process and container
    and shell_procs and proc.tty != 0
    and container_entrypoint
  output: >
    A shell was spawned in a container with an attached terminal
    (user=%user.name container=%container.id image=%container.image.repository)
  priority: NOTICE
  tags: [container, shell, mitre_execution]
```

Macros (`shell_procs`, `container`, `spawned_process`) compose; full grammar in Falco docs.

## Common alert categories (default ruleset)

| Rule | What it catches |
|------|-----------------|
| `Terminal shell in container` | Shell exec inside running container |
| `Write below etc` | `/etc/...` write outside expected processes |
| `Read sensitive file untrusted` | `/etc/shadow` / private keys |
| `Run shell untrusted` | sh from web/db process |
| `System Procs Network Activity` | `ssh`, `mount`, etc. talking on net |
| `Launch Privileged Container` | privileged: true pod create |
| `Container Drift Detected (open+create)` | New file written/exec'd inside running container |
| `Outbound Connection to C2 Servers` | matches CTI feed |
| `Unexpected K8s Service Account Token Access` | reading SA token from non-pod paths |

## CLI

| Command | Purpose |
|---------|---------|
| `falco -c /etc/falco/falco.yaml` | Run with config |
| `falco --rules-file <yaml>` | Add rules |
| `falco --validate <rules.yaml>` | Lint a ruleset |
| `falco --print-version` | — |
| `falcoctl artifact install <ref>` | Pull an Artifact (rule pack / plugin) from registry |
| `falcoctl artifact follow` | Auto-update from feed |

## Output / integration

```yaml
# falco.yaml
http_output:
  enabled: true
  url: http://falcosidekick:2801/

json_output: true
priority: notice  # min severity to emit
```

Falcosidekick can fan-out to Slack, OpsGenie, Loki, Splunk, AWS Security Hub, GCP Pub/Sub, OpenSearch, Kafka, etc.

## Workflows

### Detect kubectl exec into a pod

Default rule `Terminal shell in container` triggers. Forward to Slack:

```terminal
helm upgrade falco falcosecurity/falco \
  --set falcosidekick.enabled=true \
  --set falcosidekick.config.slack.webhookurl=https://hooks.slack.com/...
```

### Kubernetes audit log integration

```yaml
plugins:
  - name: k8saudit
    library_path: libk8saudit.so
    init_config:
      maxEventBytes: 1048576
    open_params: '"http://0.0.0.0:9765/k8s-audit"'

load_plugins: [k8saudit]
```

Then point apiserver to webhook → Falco gets every audit event → triggers k8saudit rule pack.

### Auto-respond with Falco Talon

```yaml
- name: KillPodOnRule
  match:
    rules:
      - "Terminal shell in container"
  actions:
    - action: kubernetes:kill-pod
      parameters:
        grace_period_seconds: 0
```

Within seconds of the rule firing, the pod is killed.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Floods of "Terminal shell in container" from valid debug | Tune rule with namespace exception or operator label |
| Too few alerts | Verify driver loaded: `falco --print-version` and `dmesg | grep falco` |
| eBPF fails on old kernel | Drop to `kmod` driver |
| Rules out of date | `falcoctl artifact install falco-rules:0.21.0 -o /etc/falco/`; `falco --validate` |

## Tuning

Falco's signal-to-noise depends on tuning. Standard pattern:

1. Run default rules for a week.
2. Bucket alerts by `rule + container.image`.
3. For each high-volume rule from a known-good app, add an exception (`exceptions:` list within the rule).
4. Iterate until the alert volume is mostly real.

## Related tools

| Tool | Niche |
|------|-------|
| **Tetragon** (Cilium) | Same niche, eBPF, different rules engine |
| **Tracee** (Aqua) | eBPF-based, more forensics-style |
| **kube-bench** | Static config audit |
| **Sysmon for Linux** | Windows-style event log |
| **AuditBeat** | Audit log shipper without rules engine |
