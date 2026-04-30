# amass — full tutorial

`amass` is the OWASP attack-surface mapping tool. Beyond subdomains, it builds a relational graph: domains, ASNs, CIDRs, certs, DNS records, organization OSINT — all stored locally so you can re-query without re-fetching.

## Install

```terminal
snap install amass
# or
go install -v github.com/owasp-amass/amass/v4/...@master
brew install amass
```

Config and data live in `~/.config/amass/`. API keys go into `config.yaml`.

## The four subcommands you actually use

| Subcommand | Purpose |
|-----------|---------|
| `amass intel` | OSINT on an org/IP/ASN — find owned domains, contacts |
| `amass enum` | Subdomain discovery (passive + active) |
| `amass viz` | Visualize the graph (D3, GraphML) |
| `amass db` | Query the local graph database |

## `amass enum` — parameter reference

| Flag | Purpose |
|------|---------|
| `-d <domain>` | Target apex |
| `-df <file>` | Multiple apexes |
| `-passive` | Don't talk to the target — sources only |
| `-active` | Resolve, port-scan top ports, fetch certs |
| `-brute` | Subdomain brute-force with built-in wordlist |
| `-w <wordlist>` | Custom wordlist for brute |
| `-rf <resolvers>` | Custom DNS resolver file |
| `-trf <file>` | Trusted resolver file (used to validate findings) |
| `-config <file>` | Override config (API keys, scope) |
| `-o <file>` | Plain-text output |
| `-json <file>` | JSON output (one event per line) |
| `-dir <path>` | Override the local graph DB directory (per-engagement isolation) |
| `-min-for-recursive <n>` | Recurse on a subdomain only after `n` discoveries |
| `-timeout <min>` | Hard cap on the run |
| `-nf <file>` | Names to exclude (denylist) |
| `-ip` / `-ipv4` / `-ipv6` | Resolve and print IPs |
| `-src` | Print the data source for each name |

## Workflows

### Passive-only, engagement-safe

```terminal
amass enum -passive -d target.gov -o passive.txt
```

### Full active enumeration

```terminal
amass enum -active -brute -d target.gov \
  -rf /usr/share/amass/resolvers.txt \
  -dir /opt/engagements/target/amass \
  -o active.txt -json active.json
```

### OSINT on the parent organization

```terminal
amass intel -org "Target Inc" -active
# → finds child domains owned by the org via WHOIS / IP-reverse / cert subjects
```

```terminal
amass intel -asn 13335 -ip
# → enumerate everything in an ASN
```

### Query the graph after the fact

```terminal
amass db -dir /opt/engagements/target/amass -names      # all unique names
amass db -dir /opt/engagements/target/amass -show       # full node graph
amass db -dir /opt/engagements/target/amass -d target.gov -show
```

## Good output

```
api.target.gov          (NSEC, ALT-DNS-COM)
mail.target.gov         (CRTSH, CENSYS)
staging.target.gov      (BRUTE)
vpn.target.gov          (PASSIVE-DNS)
v2.target.gov           (RECURSIVE)
```

With `-active -ip` you also get A/AAAA. With `-src` each finding shows its source. Healthy run produces several hundred names plus a populated graph DB.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Hangs after "Loading data sources" | Network / DNS resolver dead | Try `-rf` with a known-good resolver list |
| Tool warns "no API keys for X / Y" | Missing keys (Shodan, Censys, etc.) | Add to `config.yaml`; you can run without them but coverage drops |
| Brute returns flood of garbage | DNS wildcard | Add `-nf wildcards.txt` after extracting common pattern |
| Disk fills | Default DB grows fast | Always set `-dir /per-engagement/path` and clean up |
| Slow on small targets | Tool tries 50+ sources serially | Use `subfinder` for quick passes, `amass` for engagement quality |

## Defender's perspective

Active mode generates **DNS queries to your authoritative servers**. You will see:

- Bursts of `A` queries for non-existent subdomains (brute).
- Reverse PTR lookups across your CIDR.
- Cert lookups via CT-log API (third-party, not visible to you directly).

Detection ideas:
- High NXDOMAIN rate from a single resolver pool → brute force.
- Spike in ALPN / TLS-SNI fingerprinting requests on edge services.

## OPSEC notes

- `-passive` is safe; `-active`/`-brute` is loud and gets noticed.
- Always isolate engagement state with `-dir`. Mixing engagements in the default DB leaks data across customers.
- `amass intel -org` queries third-party WHOIS proxies; some require keys, none touch the target.

## Related tools

| Tool | Difference |
|------|-----------|
| `subfinder` | Faster, passive-only, simpler output |
| `dnsx` | DNS resolution + wildcard handling, no enumeration |
| `puredns` | Built-in wildcard filtering for brute-force, very fast |
| `assetfinder` | Tiny, single-source, fast smoke-test |
| `findomain` | Similar feature scope to subfinder |
