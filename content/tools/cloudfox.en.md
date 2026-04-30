# CloudFox — full tutorial

`CloudFox` is the cloud-engagement reconnaissance tool from Bishop Fox. Fast, read-only by default, designed for "I just got an AWS key, what can I do?" workflow. Outputs human-readable + LaTeX/HTML reports.

## Install

```terminal
brew install cloudfox
go install github.com/BishopFox/cloudfox@latest
```

Uses standard AWS / GCP / Azure credentials (env vars, profile, instance metadata).

## Top-level providers

```
cloudfox aws        ...
cloudfox azure      ...
cloudfox gcp        ...
cloudfox k8s        ...
```

## AWS commands (most-used)

| Command | Purpose |
|---------|---------|
| `all-checks` | Run every audit module and write a combined report |
| `inventory` | Identities, regions, services |
| `permissions` | What your principal can actually do (uses simulation API) |
| `instances` | EC2 with public IPs, IMDS state |
| `eks` | EKS clusters + accessibility |
| `lambda` | All functions + env vars |
| `secrets` | Secrets Manager + SSM Parameter Store |
| `route53` | DNS records (often leaks internal hosts) |
| `endpoints` | Public endpoints in API GW / ELB / etc. |
| `network-ports` | Open security-group rules with public source |
| `outbound-assumed-roles` | Roles trusted from external accounts |
| `principals` | All IAM users / roles / federation |
| `role-trusts` | Trust policies — find weak external trusts |
| `access-keys` | Active access keys + age + last-used |

```terminal
cloudfox aws all-checks --profile target -v
cloudfox aws permissions --profile target
cloudfox aws role-trusts --profile target
cloudfox aws secrets --profile target -o json | jq
```

## Key flags

| Flag | Purpose |
|------|---------|
| `--profile / -p` | AWS named profile |
| `--regions / -r` | Restrict regions |
| `--all-regions` | Default |
| `-o <fmt>` | `csv`, `json`, `markdown`, `html` |
| `-v` | Verbose |
| `--out-dir` | Output dir |
| `--no-cache` | Don't reuse cached results |

Results are saved to `cloudfox-output/aws/<account>/...` — markdown tables, CSVs, and a top-level HTML index.

## Workflow

### Triage a freshly-found AWS key

```terminal
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
cloudfox aws all-checks
```

Then read the `loot.txt` highlight + the markdown reports under `cloudfox-output/`.

### Find risky configurations

```terminal
cloudfox aws role-trusts --profile target | grep -E '(\\*|External|Anyone)'
cloudfox aws network-ports --profile target | grep '0\\.0\\.0\\.0/0'
cloudfox aws secrets --profile target | grep -i password
```

### Output to a sharable HTML report

```terminal
cloudfox aws all-checks -o html
firefox cloudfox-output/aws/<acct>/index.html
```

## Good output

```
═══════════ CloudFox AWS — instances ═══════════
ACCOUNT     REGION      INSTANCE_ID     PUBLIC_IP      PRIVATE_IP   IMDS
123456789   us-east-1   i-0a1b2...      54.10.20.30    10.0.1.5     v1+v2
123456789   us-east-1   i-0c3d4...      —              10.0.1.6     v2-only
[+] Wrote 24 instances to instances.csv
```

`v1+v2` — instance allows IMDSv1 (SSRF candidate). `v2-only` — IMDSv1 blocked.

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| `unable to resolve credentials` | Wrong profile / expired SSO; `aws configure list` |
| Slow on big accounts | Restrict with `-r us-east-1` |
| API throttling | CloudFox respects backoff; just wait or split regions |
| `permissions` returns ONLY `iam:GetUser` | Your principal lacks read access to other services — common, expected |

## Defender's perspective

CloudFox is **read-only** by default — defenders should not see destructive APIs. But:

- ListBucket / ListSecrets / GetCallerIdentity bursts from one principal in seconds.
- Iam:SimulatePrincipalPolicy calls (rare in normal workloads).
- `IAMReadOnly` patterns from a principal that historically only used a single service.

CloudWatch hunt:

```sql
SELECT userIdentity.arn, eventName, COUNT(*) cnt
FROM cloudtrail WHERE eventTime > now() - interval '1' hour
GROUP BY 1,2 HAVING COUNT(*) > 100 ORDER BY cnt DESC
```

## OPSEC

- Read-only — minimal attribution risk.
- All API calls log under your principal's name. Use a per-engagement role if possible (so cleanup can revoke just that).
- Don't run `--all-regions` if scope is one region — saves credits and noise.

## Related tools

- **Pacu** — actively exploits, modifies state.
- **Prowler** — defender's compliance scanner.
- **ScoutSuite** — defender's HTML report.
- **rotate-iam** — defender tool for rotating exposed keys.
- **aws-recon** — alternative read-only enum.
