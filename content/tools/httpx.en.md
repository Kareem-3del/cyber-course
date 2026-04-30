# httpx — full tutorial

`httpx` (ProjectDiscovery, **not** the Python lib of the same name) is the swiss-army HTTP probe. Feed it a list of hosts/URLs and it returns enriched data per host: status, title, tech, IP, cert, ports, content length, redirects, and more.

## Install

```terminal
go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest
brew install httpx
```

> [!warning] Two different "httpx"
> The Python lib `httpx` is a `requests` replacement; ProjectDiscovery's `httpx` is a CLI tool. They share a name and PyPI typo-squatters have abused this — verify the binary path: `which httpx` should resolve to a Go binary, not `~/.local/bin/httpx`.

## Parameter reference

### Input

| Flag | Purpose |
|------|---------|
| `-l <file>` | List of targets (one per line) |
| `-u <url>` | Single URL |
| stdin | Pipe from `subfinder`, `amass`, etc. |

### Probing

| Flag | Purpose |
|------|---------|
| `-ports <list>` | Probe these ports (default 80, 443) |
| `-p <list>` | Same |
| `-x <methods>` | HTTP methods to use (`GET`, `POST`, `OPTIONS`) |
| `-follow-redirects` | Follow 3xx |
| `-follow-host-redirects` | Only follow if same hostname |
| `-max-redirects <n>` | Cap redirect depth |
| `-timeout <sec>` | Per-request timeout |
| `-retries <n>` | Retries on failure |
| `-rl <int>` | Global rate limit (req/sec) |
| `-t <int>` | Threads (default 50) |

### Output detail

| Flag | What it adds |
|------|-------------|
| `-title` | Page `<title>` |
| `-tech-detect` | Wappalyzer-style tech fingerprint |
| `-status-code` | HTTP status |
| `-content-length` | Body size |
| `-server` | `Server` header |
| `-favicon` | mmh3 hash of favicon |
| `-jarm` | JARM TLS fingerprint |
| `-ip` | Resolved IP |
| `-cname` | Show CNAME chain |
| `-asn` | ASN of the IP |
| `-cdn` | Identify CDN provider |
| `-tls-grab` | Pull cert details |
| `-method` | Show responding method |
| `-line-count` / `-word-count` | Body line/word count (deduplication) |
| `-hash <alg>` | Hash body (`md5`, `sha256`) |

### Output format

| Flag | Purpose |
|------|---------|
| `-o <file>` | Plain text |
| `-json` | One JSON line per host |
| `-csv` | CSV |
| `-silent` | No banner |
| `-no-color` | Strip ANSI |

### Filtering

| Flag | Purpose |
|------|---------|
| `-mc <codes>` | Match status codes (`200,301,403`) |
| `-fc <codes>` | Filter (drop) status codes |
| `-ml <int>` / `-fl <int>` | Match/filter line count |
| `-ms <regex>` / `-mr <regex>` | Match string / regex in body |
| `-fs <regex>` / `-fr <regex>` | Filter string / regex |
| `-mfc <chain>` | Match favicon-hash chain |
| `-cdn`/`-no-cdn` | Filter by CDN-backed |

## Workflows

### Find live web hosts after subdomain enum

```terminal
subfinder -d target.gov -silent | httpx -silent -title -tech-detect -status-code
```

### Survey ports beyond 80/443

```terminal
cat hosts.txt | httpx -silent -ports 80,81,443,3000,3001,5000,5601,7474,8080,8081,8443,8888,9000,9090,9200
```

### Pivot by favicon (find all instances of a stolen / leaked admin panel)

```terminal
# Get the favicon hash of the panel:
curl -s https://known-panel.example/favicon.ico | python3 -c "import mmh3,sys,base64;print(mmh3.hash(base64.encodebytes(sys.stdin.buffer.read())))"
# Then hunt:
shodan search "http.favicon.hash:-1234567890"
# Or against your own list:
httpx -l ips.txt -favicon -mfc 1234567890,-9876543210
```

### Dedupe similar pages

```terminal
httpx -l urls.txt -hash sha256 -silent -o hashed.txt
sort -k2 hashed.txt | awk '!seen[$2]++'
```

## Good output

```
https://api.target.gov [200] [API Gateway] [nginx/1.21] [13.59.234.10] [AS16509]
https://staging.target.gov [403] [WordPress 5.8]
https://vpn.target.gov [200] [Fortinet SSL VPN] [Fortinet]
https://old.target.gov [301] -> https://new.target.gov [200]
```

JSON form is preferred for downstream tooling — every column above becomes a field.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Many `i/o timeout` lines | Targets behind WAF blocking your IP | Lower `-rl`; route through residential proxies |
| Tech detect blank | `-tech-detect` not set, or HTML stripped | Re-run with `-tech-detect`; some SPAs reveal stack only after JS render — use `katana` |
| Same host repeated 10 times | List had duplicates | Pipe through `sort -u` first |
| Tool reports 404 for valid pages | Server hosts virtual hosts on a single IP and you sent requests by IP | Make sure list contains hostnames, not IPs |
| Status 000 | TLS handshake failed (old TLS, self-signed) | Add `-tls-grab` to see why; consider `-disable-redirects` |

## Defender's perspective

Active scan — your access logs will show:

- Bursts of HEAD/GET to `/` from one IP.
- `User-Agent: Mozilla/5.0 (compatible; httpx)` (default — easy to detect).
- TLS handshakes to ports you don't think are exposed (`-ports 8080,8443`).

Detection ideas:
- Match the `httpx` UA string; it's well known.
- Alert on enumeration patterns: rapid sequential SNI values from a single IP.

## OPSEC notes

- Default UA shouts "I'm a scanner". Use `-H "User-Agent: Mozilla/5.0 ..."` for stealth.
- Run from a clean infra IP; once flagged, downstream WAFs (Cloudflare, Akamai) propagate.
- For real engagements, pace with `-rl 50` and `-t 50` rather than the defaults.

## Related tools

| Tool | Niche |
|------|-------|
| `katana` | JS-aware crawler from same vendor |
| `gowitness` | Adds screenshots |
| `aquatone` | Older screenshot+report tool |
| `nuclei` | Vulnerability templates after `httpx` finds live hosts |
| `ffuf` | Fuzzing/dirbusting after live host identified |
