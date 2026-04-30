# subfinder — full tutorial

`subfinder` is a passive subdomain enumerator from ProjectDiscovery. It queries 30+ public sources (CT logs, search engines, threat-intel APIs) and prints a deduplicated list of subdomains. No packets touch the target.

## Install

```terminal
go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
# Or via package manager:
brew install subfinder
apt install subfinder
```

API keys for premium sources go in `~/.config/subfinder/provider-config.yaml`. Without them you still get useful output from ~15 free sources.

## Parameter reference

| Flag | Purpose | When to use it |
|------|---------|---------------|
| `-d <domain>` | Single target domain | Always, unless using `-dL` |
| `-dL <file>` | List of domains | Mass scope, e.g. all client-owned roots |
| `-all` | Use every available source (slower) | Final-quality pass |
| `-sources <list>` | Restrict to named sources (`crtsh,bufferover,...`) | Speed / reproducibility |
| `-recursive` | Re-enumerate found subdomains | Deep targets with many tiers |
| `-silent` | Print only results, no banner | Pipelines |
| `-o <file>` | Write to file | Always for engagements; keep evidence |
| `-oJ` | JSON output | Feed into automation |
| `-t <int>` | Concurrency (default 10) | Lower if rate-limited; higher if you have keys |
| `-timeout <sec>` | Per-source timeout | Slow networks |
| `-rl <int>` | Global rate limit (req/sec) | Avoid burning API quotas |
| `-config <file>` | Override config path | Per-engagement isolation |
| `-pc <file>` | Provider-config path (API keys) | Same |
| `-v` | Verbose — see which source each result came from | Debugging |
| `-nW` | No wildcards | Hide DNS-wildcard hits |

## Common workflows

### Single-target quick pass

```terminal
subfinder -d target.gov -silent | tee subs.txt
# 247 subdomains in ~12s without API keys
```

### Engagement-quality pass

```terminal
subfinder -d target.gov -all -recursive -o subs.txt
# Use this once per scope. 30+ sources, may take 1–5 min.
```

### Pipe into downstream tools

```terminal
subfinder -d target.gov -silent \
  | httpx -silent -title -tech-detect -status-code \
  | tee live.txt
```

## Good output

```
api.target.gov
admin.target.gov
mail.target.gov
staging.target.gov
old-portal.target.gov
vpn.target.gov
```

A clean list, one subdomain per line, sorted, deduplicated. With `-v` you also see which source produced each. Volumes typical:

- Small startup: 10–30 subdomains.
- Mid-size enterprise: 200–800.
- Large gov/Fortune-500 with broad scope: 2,000–20,000.

## Bad / problematic output and how to fix

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Empty output | Domain has no public footprint, or all sources rate-limited you anonymously | Add API keys; try `-all` |
| Hundreds of `*.target.gov.` results that all resolve to one IP | DNS wildcard | Add `-nW`, then validate with `dnsx` |
| `error: failed to load provider config` | Missing or malformed `provider-config.yaml` | Generate a default with `subfinder -ls` then edit |
| Same source repeats / very slow | Rate-limit hit on a single provider | Drop it via `-exclude-sources <name>` |
| Tool runs forever | One slow source stalled | Lower `-timeout` (default 30s) |

## Defender's perspective

Subfinder runs entirely against third-party infrastructure (CT logs, Shodan, Censys, etc.), so it generates **zero traffic to your servers**. You won't see a single log line. Defenders should monitor what subfinder *sees*:

- Subscribe to your own CT-log feed (`crt.sh`) and alert on new certs you didn't issue.
- Periodically run subfinder against your own apex domains; the diff between runs is your shadow IT.

## OPSEC notes

- Always passive — safe to run from your real IP.
- API keys in `provider-config.yaml` should be **per-persona** for serious engagements; keys leak attribution if they're tied to a billing identity.
- Tool will not enumerate anything behind authentication or internal-only DNS — that's `dnsx`/`amass`'s job.

## Related tools to chain

| Stage | Tool | Why |
|-------|------|-----|
| After subfinder | `dnsx` | Resolve, catch wildcard, get A/AAAA/CNAME |
| After resolve | `httpx` | Find which subdomains have an HTTP service |
| Web stack | `nuclei` | Run CVE/exposure templates on live URLs |
| Mass discover | `amass enum -passive` | Wider passive sourcing, slower |
| Active brute | `puredns / shuffledns` | Brute-force against `xxx.target.gov` wordlist |
