# Shodan — full tutorial

Shodan is a search engine for everything connected to the Internet. It indexes open ports, banners, certs, HTTP responses, ICS protocols, and more. Use it for passive reconnaissance and for hunting your own exposure.

## Install + auth

```terminal
pip install shodan
shodan init <YOUR_API_KEY>
# free key gives ~100 query credits/mo and limited filters
```

Web UI at `shodan.io` works with the same key; the CLI is just a thin wrapper.

## Subcommands

| Cmd | What it does |
|------|-------------|
| `shodan search <query>` | Search index, prints IPs |
| `shodan host <ip>` | Full record for one IP |
| `shodan count <query>` | Count without consuming detailed credits |
| `shodan stats <query>` | Aggregations (top countries, orgs, ports) |
| `shodan download <file> <query>` | Bulk dump to local JSON Lines |
| `shodan parse <file>` | Inspect a downloaded file |
| `shodan alert` | Stream live results matching a query |
| `shodan scan submit <ip>` | Pay credits to scan an IP on-demand |
| `shodan radar` / `myip` | Live globe / your egress IP |

## Query syntax — the filters that matter

| Filter | Example | Use |
|--------|---------|-----|
| `port` | `port:443` | Service port |
| `country` | `country:DE` | ISO-2 country code |
| `org` | `org:"Acme Corp"` | ASN owner string |
| `net` | `net:1.2.3.0/24` | CIDR range |
| `hostname` | `hostname:.target.gov` | DNS suffix match |
| `ssl` | `ssl:"target.gov"` | TLS subject / SAN |
| `ssl.cert.subject.cn` | `ssl.cert.subject.cn:"vpn"` | Cert CN |
| `http.title` | `http.title:"index of"` | Page title |
| `http.html` | `http.html:"GlobalProtect"` | Body content |
| `http.favicon.hash` | `http.favicon.hash:-1234567890` | mmh3 hash pivot |
| `product` | `product:"Apache httpd"` | Identified product string |
| `version` | `product:"Apache" version:"2.4.49"` | Product+version (CVE pivot) |
| `os` | `os:"Linux 3.x"` | Identified OS |
| `vuln` | `vuln:CVE-2024-3400` | Pre-tagged vulnerable hosts (paid) |
| `tag` | `tag:vpn` | Curated tags |
| `category` | `category:ics` | High-level filter |
| `has_screenshot:true` | | Hosts with web screenshots |
| `before:`/`after:` | `after:2026-01-01` | Time-range |

Operators: AND (default), `OR`, `-`/`NOT`, `()` for grouping.

## Workflows

### Map a target's external footprint

```terminal
shodan search 'ssl:"target.gov"'
shodan search 'org:"Target Government" port:443'
shodan search 'hostname:.target.gov -port:53'
```

### Pivot from one panel to all instances worldwide

```terminal
# Get favicon hash of an admin panel
curl -s https://known.example/favicon.ico | python3 -c "import mmh3,sys,base64,codecs;b=codecs.encode(sys.stdin.buffer.read(),'base64');print(mmh3.hash(b))"
# Search:
shodan search 'http.favicon.hash:-1234567890'
```

### Hunt an emerging CVE across a country

```terminal
shodan search 'product:"Ivanti Connect Secure" country:US' --fields ip_str,port,hostnames,version
```

### Find ICS / OT exposures (educational only)

```terminal
shodan search 'product:"Siemens, SIMATIC, S7" country:US' --limit 50
shodan count 'category:ics country:US'
```

### Save bulk results

```terminal
shodan download exposure.json.gz 'org:"Target" port:443'
shodan parse --fields ip_str,port,product,version exposure.json.gz | head
```

### Live alerting on your own IP space

```terminal
shodan alert create "Target Net" 1.2.3.0/24
shodan alert list
shodan stream --alert <id>
```

## Good output

The CLI prints `IP PORT ORG HOSTNAMES`. The web UI shows banner, screenshot, history.

A useful run answers: which of my organisation's IPs is unexpectedly exposing service X on port Y? If the answer surprises you, that's a finding.

## Limits & pitfalls

| Issue | Fix |
|-------|-----|
| `Search filters require an upgraded API plan` | Some filters (`vuln`, `tag`, `country` cap) need paid plans |
| Stale data | Shodan re-scans on a rolling cycle; `last_update` per record can be weeks old |
| Missed services on weird ports | Shodan scans common ports + a long tail; obscure ports may be missing — submit `shodan scan` |
| Banners that lie | Some products spoof banners; cross-check with active probes |
| Counts include duplicates from multi-port hosts | Use `--fields ip_str` and deduplicate |

## Defender's perspective

Shodan does **not** scan from a fixed IP set — it uses many crawlers and rotates. Some defenders block Shodan-known ranges (lists like `shodan-scanners.txt`) but this only delays one crawler family. Better:

- Subscribe to your **own** Shodan org monitoring (paid feature) → get email alerts for new exposures within 24h.
- Run weekly `shodan search 'org:"YourOrg"' --fields port,hostnames,version` and diff against last week.
- Pivot anything with a vendor name that has a recent CVE; that's adversary low-hanging fruit.

## OPSEC notes

- API queries are logged to your account. Use a dedicated key per persona for sensitive research.
- The free key is rate-limited and lacks several filters; an "academic" key is often the cheapest upgrade.
- Targets do not see Shodan API queries (Shodan scans the world; you query the index).

## Related tools

| Service | Difference |
|---------|------------|
| Censys | Similar index; better TLS fingerprinting; different crawl cadence |
| FOFA | Chinese; great for Asia-Pacific coverage |
| ZoomEye | Similar; Chinese index |
| BinaryEdge | Similar Western index |
| onyphe | French; specializes in passive DNS + IoCs |
| `nuclei` | Active follow-up after Shodan finds candidate hosts |
