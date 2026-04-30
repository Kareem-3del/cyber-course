# trufflehog — full tutorial

`trufflehog` finds leaked secrets (API keys, tokens, private keys) in git repos, cloud buckets, container images, filesystems, GitHub orgs, Docker Hub, Postman, and more. Each hit is verified against the real provider when possible — fewer false positives than naive regex tools.

## Install

```terminal
go install github.com/trufflesecurity/trufflehog/v3@latest
brew install trufflehog
docker run --rm -v "$(pwd):/work" trufflesecurity/trufflehog filesystem /work
```

## Sources (each is a subcommand)

| Source | Use |
|--------|-----|
| `git` | Local repo or remote URL — scans full history |
| `github` | Org / user / single repo via API |
| `gitlab` | Same for GitLab |
| `filesystem` | Plain directory tree |
| `s3` | An S3 bucket |
| `gcs` | Google Cloud Storage |
| `docker` | Docker image layers |
| `postman` | Postman workspace |
| `huggingface` | HF org / model |
| `circleci` | CI artifacts |
| `elasticsearch` | ES index |
| `stdin` | Pipe in arbitrary content |

## Common parameters

| Flag | Purpose |
|------|---------|
| `--only-verified` | Print only hits the tool re-verified live (kills FPs) |
| `--results=verified,unknown` | Granular result-class filter |
| `--no-update` | Don't auto-update detector list |
| `--concurrency <n>` | Workers |
| `--json` | Output JSONL |
| `--fail` | Exit non-zero on any finding (CI gating) |
| `--include-paths <regex>` / `--exclude-paths <regex>` | File scoping |
| `--since-commit <sha>` | Limit to commits after a SHA (incremental) |
| `--branch <name>` | Single branch only |
| `--archive-max-size`, `--archive-max-depth` | Recurse into nested archives |

## Workflows

### Audit a repository's full history

```terminal
trufflehog git https://github.com/target/website --only-verified
```

### Sweep a whole org (requires a GitHub token with `read:org`)

```terminal
GITHUB_TOKEN=ghp_xxx trufflehog github --org=target-corp --only-verified --json | tee findings.jsonl
```

### Pre-commit gate

```terminal
trufflehog git file:///$PWD --since-commit HEAD --branch HEAD --only-verified --fail
```

### Sweep an S3 bucket of unknown ownership

```terminal
trufflehog s3 --bucket=target-backups --only-verified
```

### A container image

```terminal
trufflehog docker --image=registry.target/private/image:v1
```

## Good output

```
✗ Found verified result 🐷🔑
Detector Type: AWS
Decoder Type: PLAIN
Raw result: AKIAEXAMPLEKEY...
File: src/config/aws.js
Commit: 5ad2a01b
Email: alice@target.gov
```

The lock-icon line "verified" is the gold standard — trufflehog actually called STS / GitHub / Twilio etc. and confirmed the key is live. Treat as critical.

`unknown` results mean the format matches but the verifier wasn't run (offline detectors). Spot-check.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Floods of unverified hits | `--only-verified` not set | Add it; trim noise |
| "Detector Type: PrivateKey" everywhere | RSA blocks in test fixtures | `--exclude-paths 'tests/|fixtures/'` |
| Slow on large monorepo | Scanning archives + deep history | Limit with `--since-commit`, parallelize per-repo |
| Missed obvious key | Detector list out of date | `trufflehog --no-update=false` (default updates) |
| GitHub rate-limited | API quota burned | Use a PAT, or run smaller scope |

## Defender's perspective

A trufflehog finding tells you a secret was exposed at *some point*; doesn't tell you for how long. Treat verified hits as **already compromised** — adversaries scan public GitHub continuously.

Process when a hit is found:

1. Rotate the secret **immediately**.
2. Audit cloud / SaaS access logs back to the commit's date for use of the leaked credential.
3. Force-push history rewriting **does NOT remove** the leak (forks, CDN caches, search engines). Rotation is the only valid response.
4. Add a pre-commit / pre-receive hook with `trufflehog --fail` going forward.

## OPSEC notes

- Running against your own GitHub org is fine; running against a *target's* GitHub org without authorization is unauthorized access in some jurisdictions.
- Output may contain live credentials — write to encrypted disk, never paste into ticket comments.

## Related tools

| Tool | Niche |
|------|-------|
| `gitleaks` | Faster, regex-based, lighter on history |
| `noseyparker` | Excellent on huge monorepos / S3 |
| `secretlint` | Tunable linter for CI |
| `detect-secrets` (Yelp) | Baseline-based, designed for incremental adoption |
| `gh secret-scanning` | GitHub-native, best signal in github-hosted repos |
