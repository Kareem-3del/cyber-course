# Prowler — full tutorial

`Prowler` is the open-source cloud security audit / compliance scanner. 500+ checks for AWS, Azure, GCP, M365, Kubernetes — mapped to CIS, NIST, ISO27001, PCI-DSS, FedRAMP, MITRE ATT&CK.

## Install

```terminal
pipx install prowler
brew install prowler
docker run -ti toniblyx/prowler:latest aws
```

## Provider commands

```terminal
prowler aws ...
prowler azure ...
prowler gcp ...
prowler kubernetes ...
prowler m365 ...
```

## Common flags

| Flag | Purpose |
|------|---------|
| `-p / --profile` | AWS profile |
| `-r / --region` | Specific regions |
| `-c / --checks` | Run only listed checks |
| `-C / --checks-folder` | Use custom check directory |
| `--checks-list` | Show all available checks |
| `--severity` | `critical`, `high`, `medium`, `low`, `informational` |
| `-f / --output-formats` | `csv`, `json`, `json-asff`, `html` (multi-OK) |
| `-o / --output-directory` | Output path |
| `--compliance` | `cis_3.0_aws`, `nist_csf_1.1`, `pci_3.2.1`, etc. |
| `--slack` | Post results to Slack webhook |
| `-q / --quiet` | Only failures |
| `-S / --send-sh-only-fails` | Push only fails to Security Hub |
| `--list-categories` / `--list-services` | Discovery |

## Workflows

### Quick first audit

```terminal
prowler aws --severity critical high -q -f html
firefox output/prowler-output-*.html
```

### Compliance-mapped report

```terminal
prowler aws --compliance cis_3.0_aws --output-formats html json
```

### Multi-account via Organizations

```terminal
prowler aws --organizations-role OrganizationAccountAccessRole \
  --compliance cis_3.0_aws -f csv html
```

### Push to Security Hub

```terminal
prowler aws --security-hub
```

### Custom check pack

```terminal
prowler aws -C ./our-checks/ --checks our_check_1,our_check_2
```

## Good output

Console table:

```
PASS   ACCOUNT      REGION       CHECK_ID                                    SEVERITY
PASS   123456789    us-east-1    iam_no_root_access_key                      CRITICAL
FAIL   123456789    us-east-1    s3_bucket_default_encryption                MEDIUM
FAIL   123456789    eu-west-1    cloudtrail_logs_s3_bucket_is_not_publicly  CRITICAL
…
══════════════════════════════════════════════════════════════
Total findings: 247  PASS: 198  FAIL: 49
```

HTML report has filters by severity, service, status, and links to remediation.

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| Many `WARN: required permission missing` | Attach `SecurityAudit` + `ViewOnlyAccess` to the auditing principal |
| Tool slow on huge accounts | Use `-c` to scope to interesting categories; `-r` few regions |
| Findings count drops after upgrade | New check IDs renamed; map old → new in your tracking |
| False positives | Allow-list with `--allowlist-file allowlist.yaml` |

## Defender's perspective

Prowler runs **read-only** API calls. Same telemetry pattern as CloudFox: many `Describe*` / `Get*` / `List*` calls from one principal. Treat as expected for a known auditor IAM role.

## OPSEC

- Defender / blue tool — designed to be **transparent**. No OPSEC concern from a security-program perspective.
- Use a dedicated `prowler-audit` IAM role with `SecurityAudit` policy, not a personal user.

## Related tools

- **CloudFox** — engagement-style recon.
- **ScoutSuite** — alternative auditor with similar scope.
- **AWS Trusted Advisor / Security Hub** — Amazon-native.
- **Steampipe** — SQL-on-cloud, ad-hoc audits.
- **kubescape** — Kubernetes-specific audits.
