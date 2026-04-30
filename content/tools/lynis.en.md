# Lynis — full tutorial

`Lynis` (CISOfy) is a Linux / Unix / macOS / BSD security auditing tool. Single shell script (no agents needed), reads system configuration, runs hundreds of checks, and produces a hardening score + per-check recommendations.

## Install

```terminal
apt install lynis
brew install lynis
git clone https://github.com/CISOfy/lynis && cd lynis && sudo ./lynis audit system
```

Open-source community edition; commercial **Lynis Enterprise** offers central reporting + compliance frameworks.

## Modes

```terminal
lynis audit system                    # full local audit
lynis audit system --quick            # skip slow tests
lynis audit dockerfile <path>          # audit a Dockerfile
lynis audit application apache /etc/apache2/    # specific app
lynis audit system remote <host>      # via SSH
lynis show plugins
```

## Common flags

| Flag | Purpose |
|------|---------|
| `--quick / -Q` | Quick mode (skips slow tests) |
| `--cronjob` | Cron-friendly: minimal stdout, exit code reflects findings |
| `--no-colors` | CI-friendly output |
| `--no-log` | Skip writing log |
| `--profile <file>` | Use custom profile (skip / include tests) |
| `--tests <ids>` | Run only listed tests |
| `--tests-from-category <name>` | One category (`firewalls`, `ssh`, `kernel`, `auth`) |
| `--tests-from-group <name>` | `compliance`, `security`, `performance` |
| `--auditor "Name"` | Tag report metadata |
| `--report-file <path>` | Persist report |
| `--upload` | Upload to Lynis Enterprise (paid) |
| `--pentest` | Anonymous / non-privileged audit |
| `--developer` | Show internal info; useful for plugin authoring |

## What it checks (categories)

| Category | Examples |
|----------|---------|
| **Boot / kernel** | GRUB password, kernel hardening, sysctls |
| **Authentication** | PAM, SSH, sudo, password policy |
| **Filesystems** | Mount options (`nodev/noexec/nosuid`), USB |
| **Networking** | Firewall, listening services, IPv6 |
| **Services** | xinetd, systemd unit reviews |
| **Software** | Vulnerable packages |
| **Hardening / Files** | Permissions of common config files |
| **Containers** | Docker daemon, runtime |
| **Cryptography** | TLS / SSH cipher choices |
| **Logging** | rsyslog / journald |
| **Compliance** | CIS, HIPAA, ISO27001 (paid pack) |

Total: ~300 checks per run.

## Report

```
[+] Hardening index : 73 [###############     ]
[+] Tests performed : 244
[+] Plugins enabled : 1

[+] Result: WARNING
   Warnings (5):
   - SSH-7408: Consider hardening SSH configuration [authentication-1]
   - PKGS-7390: Vulnerable package found: openssl-1.1.1n
   - HRDN-7222: Compiler installed (gcc) — restrict to root
   - LOGG-2154: Auditd is not running
   - KRNL-5820: Disable IPv6 if unused
```

Each ID maps to remediation guidance: `lynis show details PKGS-7390`.

## Workflows

### Pre-deployment hardening pass

```terminal
sudo lynis audit system --auditor "ops" --report-file /var/log/lynis-report.dat
```

Then iterate: fix items, re-run, watch the hardening index climb.

### CI / golden-image gate

```terminal
sudo lynis audit system --cronjob -Q
echo $?    # exit code mirrors WARNINGs (1) / CRITs (2)
```

### Compliance mapping

`lynis audit system --tests-from-group compliance` (with appropriate plugin) → maps findings to controls (CIS Distribution Independent Linux Benchmark, etc.).

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Tests skipped without running | Run as root / sudo |
| `tcp_wrappers test failed` on modern systems | False positive; tcp_wrappers EOL |
| `Suggestion: install tcp_wrappers` | Modern systems don't need; suppress in profile |
| Slow on remote audit | SSH latency dominates; run locally where possible |
| New version doesn't recognize OS | Update lynis; many distros ship outdated versions |

## Defender perspective

Lynis is the **first thing** you run on any new Linux box. Treat the report as a checklist; fix every WARNING. Combine with:

- **OpenSCAP** for compliance-mapped scans.
- **CIS-CAT** (paid) for full benchmarks.
- **AuditPolicy** (Cracken / debops) playbooks for fixing.

## OPSEC (defender)

- Reports contain detailed system inventory — restrict.
- Don't auto-upload to Lynis Enterprise without contractual data-handling clarity.

## Related tools

| Tool | Niche |
|------|-------|
| **OpenSCAP** | DISA/CIS-style compliance scans |
| **CIS-CAT** | Official CIS scanner |
| **Bastille Linux** | Older interactive hardener |
| **debian-goodies / yum-utils** | Distro-specific package audits |
| **Inspec / Chef Compliance** | Infrastructure-as-code style audit |
