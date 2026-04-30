# ScoutSuite — full tutorial

`ScoutSuite` (NCC Group) is a multi-cloud security auditor. Generates a polished HTML dashboard showing every misconfiguration across AWS, Azure, GCP, AliCloud, OCI. Read-only; safe to run in production.

## Install

```terminal
pipx install scoutsuite
git clone https://github.com/nccgroup/ScoutSuite && cd ScoutSuite && pip install -e .
```

## Run

```terminal
# AWS via profile
scout aws --profile target

# AWS via assumed role
scout aws --profile baseuser --assume-role arn:aws:iam::123:role/audit \
          --external-id <id>

# Azure
scout azure --cli   # uses az login
scout azure --service-principal --tenant <id> --client-id <id> --client-secret <key>

# GCP
scout gcp --service-account creds.json
```

## Useful flags

| Flag | Purpose |
|------|---------|
| `--report-dir <path>` | Output directory |
| `--report-name <name>` | Filename prefix |
| `--regions us-east-1,us-west-2` | Scope regions |
| `--services iam,ec2,s3` | Subset of services |
| `--skip-services rds` | Skip a service |
| `--no-browser` | Don't auto-open report |
| `--ruleset <file>` | Custom ruleset |
| `--exceptions <file>` | Exception file (allowlist) |
| `--list-services` | All services per provider |
| `--debug` | Verbose |
| `--max-rate <n>` | API throttle cap |
| `--update` | Force re-run, overwrite previous |

## Workflow

### Quick audit

```terminal
scout aws -p target --report-dir reports/2026-04-30
# → opens reports/2026-04-30/scoutsuite-report/aws-target.html
```

### Multi-account

Loop through profile configs from `~/.aws/config`:

```terminal
for prof in $(grep -E '^\[profile' ~/.aws/config | sed 's/\[profile \(.*\)\]/\1/'); do
  scout aws -p "$prof" --report-dir "reports/$prof" --no-browser
done
```

### Custom rules

```terminal
cp -r providers/aws/rules custom-rules/
# Edit JSON files; reference fields like ec2.regions.id.security_groups.id.rules.ingress.protocols
scout aws -p target --ruleset custom-rules/
```

## Good output

The HTML dashboard groups findings by service. Each finding shows:

- Title + severity color (Danger/Warning/Notice).
- Description + remediation.
- Affected resources (clickable to detail).
- Reference (CIS, NIST, vendor docs).

Top-of-page: total Danger / Warning / Notice counts. The summary is what executives read; the detail rows are for engineers.

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| `AccessDenied` on a service | Auditing principal needs `SecurityAudit` + `ViewOnlyAccess` |
| Report is huge / slow to render | `--services` to scope; or split per region |
| Wrong account context | Multiple profiles loaded — verify `aws sts get-caller-identity --profile target` |
| Outdated checks | `pip install -U scoutsuite` |

## Defender's perspective

Same telemetry fingerprint as Prowler / CloudFox — read-only API bursts. Tag the auditing role; alerts on non-tagged audit-style API patterns.

## OPSEC

- Reports include the account ID + resource names — sensitive output. Treat as a customer deliverable: encrypted storage, watermark, NDA-only sharing.
- Multi-tenant runs of ScoutSuite have leaked customer data when reports were uploaded to public S3 by mistake. Don't.

## Related tools

- **Prowler** — alternative auditor; CLI-friendlier; more compliance frameworks.
- **CloudFox** — engagement / red-team flavor.
- **AWS Security Hub** — Amazon-native.
- **Steampipe** — SQL-style ad-hoc auditing.
