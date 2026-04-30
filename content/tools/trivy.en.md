# trivy — full tutorial

`trivy` (Aqua Security) is the open-source vulnerability + misconfig + secret scanner for containers, filesystems, IaC, Kubernetes, and SBOMs. Lightweight Go binary, full OS-package CVE database, growing language-deps coverage.

## Install

```terminal
brew install trivy
apt install trivy
docker run aquasec/trivy image alpine:3.18
```

## Subcommands

| Cmd | Purpose |
|------|---------|
| `image` | Container image scan |
| `filesystem` / `fs` | Local directory |
| `repository` / `repo` | Git repo (clones, scans) |
| `kubernetes` / `k8s` | Live K8s cluster scan |
| `config` | IaC misconfigurations (Terraform, K8s manifests, Dockerfile, CloudFormation) |
| `sbom` | Generate / scan SBOM (CycloneDX, SPDX) |
| `aws` | AWS account misconfig scan |
| `vm` | VM image (.qcow2 / .vmdk) |
| `module` | WASM-based custom modules |
| `server` / `client` | Server mode for shared cache |

## Common flags

| Flag | Purpose |
|------|---------|
| `--severity` | Filter (`HIGH,CRITICAL`) |
| `--ignore-unfixed` | Hide bugs without a fix yet |
| `-o <file>` | Output file |
| `--format` | `table`, `json`, `sarif`, `cyclonedx`, `spdx-json`, `template` |
| `--scanners` | `vuln`, `misconfig`, `secret`, `license` (comma) |
| `--vuln-type` | `os`, `library` |
| `--skip-dirs` / `--skip-files` | Scope |
| `--ignorefile .trivyignore` | Allowlist CVEs |
| `--exit-code 1` | Non-zero on findings (CI gating) |
| `--cache-dir <path>` | Cache location |
| `--db-repository` | Mirror DB (private envs) |
| `--platform linux/amd64` | Multi-arch images |

## Workflows

### Scan a container image

```terminal
trivy image --severity HIGH,CRITICAL --ignore-unfixed nginx:1.25.3
```

### Scan a Dockerfile / k8s manifest folder

```terminal
trivy config ./terraform
trivy config --severity HIGH ./k8s-manifests
```

### Scan a live K8s cluster

```terminal
trivy k8s --report summary cluster
trivy k8s --report all cluster -o trivy-k8s.json --format json
```

### Scan a git repo for secrets + misconfigs

```terminal
trivy repo --scanners secret,misconfig https://github.com/target/repo
```

### Generate SBOM

```terminal
trivy image --format cyclonedx -o nginx-sbom.json nginx:1.25.3
trivy sbom --severity CRITICAL nginx-sbom.json
```

### CI integration

```yaml
# GitHub Actions
- uses: aquasecurity/trivy-action@master
  with:
    image-ref: ghcr.io/me/myapp:${{ github.sha }}
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
    ignore-unfixed: true
```

## Good output

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

JSON output is nestable and scriptable; SARIF feeds into GitHub Code Scanning.

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| `unable to download DB` | Network restricted — set `--db-repository` to internal mirror |
| Many "UNFIXED" findings | `--ignore-unfixed` |
| Scan slow on huge image | `--scanners vuln` only |
| False positive on internal package | `.trivyignore` with CVE id and TTL date |
| OOM on macOS Docker | Increase Docker Desktop RAM; or trivy native binary |

## Defender's perspective

Best as part of CI pipelines. Treat findings as gating: a `CRITICAL HIGH` count >0 fails build for prod images. Pair with admission controller (Kyverno, Gatekeeper) that blocks deploy of unscanned / unsigned images.

## OPSEC

- Pure defender tool. No attacker workflow risk.
- Note: `trivy repo <github-url>` clones the repo; private repos need a GH token with `repo` scope. Token leaks = supply-chain risk.

## Related tools

| Tool | Niche |
|------|-------|
| **Grype** | Anchore alternative; smaller |
| **Snyk** | Commercial, broader language coverage |
| **Clair** | OSS image scanner; no dev anymore |
| **Docker Scout** | Docker-Inc tool, registry-integrated |
| **Anchore Engine** | Self-hosted |
| **Syft** | SBOM-only generator (pairs with Grype) |
| **Checkov** | IaC-misconfig (overlaps `trivy config`) |
| **kubescape** | K8s posture (overlaps `trivy k8s`) |
