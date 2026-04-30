# nuclei — full tutorial

`nuclei` is a templated vulnerability scanner. Each template is a YAML file describing a request to send and a matcher for the response. The community templates repo (~9,000 templates) covers CVEs, exposures, misconfigurations, default credentials, technologies — updated weekly.

## Install

```terminal
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
nuclei -update                 # binary
nuclei -update-templates       # templates
```

The first run downloads templates to `~/.local/nuclei-templates/`.

## Inputs

| Flag | Purpose |
|------|---------|
| `-u <url>` | Single target |
| `-l <file>` | List of targets (URLs or hosts) |
| stdin | Pipe from `httpx` |
| `-target <url>` | Same as `-u` |

## Template selection

| Flag | Purpose |
|------|---------|
| `-t <path>` | Template / directory / glob |
| `-w <workflow>` | Run a workflow (a chain of templates) |
| `-tags <list>` | Filter templates by tag (`cve`, `oast`, `rce`, `wp`) |
| `-severity <list>` | `info,low,medium,high,critical` |
| `-id <list>` | Run specific template IDs |
| `-author <list>` | Filter by author |
| `-include-tags / -exclude-tags` | Allow / deny lists |
| `-include-severity / -exclude-severity` | Same for severity |
| `-tt <type>` | Template type (`http`, `dns`, `tcp`, `file`, `headless`, `code`, `javascript`) |
| `-ait` / `-as` | AI-tag, AI-severity (newer) |
| `-nt` | New templates only (since last update) |
| `-validate` | Lint templates without running |

## Network and rate

| Flag | Purpose |
|------|---------|
| `-c <int>` | Concurrent templates |
| `-bs <int>` | Hosts per template ("bulk size") |
| `-rl <int>` | Global request rate limit |
| `-timeout <sec>` | Per-request timeout |
| `-retries <n>` | Retries |
| `-headless-bulk-size <int>` | Headless concurrency |
| `-show-browser` | See headless browser (debug) |
| `-proxy <url>` | Proxy through Burp etc. |
| `-H <header>` | Custom header (auth, UA) |

## Output

| Flag | Purpose |
|------|---------|
| `-o <file>` | Plain output |
| `-jsonl <file>` | JSONL (one finding per line) |
| `-store-resp` | Save matched responses (great for triage) |
| `-store-resp-dir <path>` | Where |
| `-silent` | Print only findings |
| `-no-color` | Strip ANSI |
| `-v` / `-vv` | Verbose / very verbose |
| `-stats` | Live stats line |
| `-stream` | Don't buffer — write findings as they appear |

## Out-of-band (OAST)

| Flag | Purpose |
|------|---------|
| `-iserver <url>` | Self-hosted Interactsh server |
| `-itoken <token>` | Auth for it |
| `-no-interactsh` | Disable OAST |

OAST templates fire blind RCE / SSRF / log4shell payloads and watch a callback server for hits — essential for finding non-reflective bugs.

## Workflows

### Quick CVE pass

```terminal
nuclei -u https://target.gov \
  -severity critical,high -tags cve,exposure -silent -o findings.txt
```

### Engagement-quality scan from list

```terminal
cat live.txt | nuclei -severity medium,high,critical \
  -tags cve,exposure,misconfig,default-login \
  -c 50 -rl 150 -bs 25 \
  -store-resp -store-resp-dir resp/ \
  -jsonl -o results.jsonl
```

### Specific CVE hunt across the world

```terminal
nuclei -t cves/2024/CVE-2024-3400.yaml -l vpn-targets.txt -severity critical
```

### Run new templates only (after `-update-templates`)

```terminal
nuclei -nt -l live.txt -o new-findings.txt
```

### Use Burp Collaborator instead of Interactsh

```terminal
nuclei -l live.txt -tags oast -iserver https://abc.oastify.com -itoken <T>
```

### Custom template authoring

```yaml
# example custom template — exposed-prom.yaml
id: exposed-prometheus

info:
  name: Prometheus exposed
  author: you
  severity: medium
  tags: misconfig,prometheus

http:
  - method: GET
    path:
      - "{{BaseURL}}/metrics"
    matchers-condition: and
    matchers:
      - type: status
        status: [200]
      - type: word
        words: ["# HELP go_gc_"]
        part: body
```

```terminal
nuclei -t exposed-prom.yaml -l urls.txt
```

## Good output

```
[CVE-2024-3400] [http] [critical] https://vpn.target.gov [PAN-OS GlobalProtect command injection]
[exposed-panel-grafana] [http] [info] https://staging.target.gov:3000
[default-login-jenkins] [http] [high] https://ci.target.gov [admin:admin]
```

JSON form contains: template id, severity, matched-at, request, response, extracted values. Pipe to `jq`:

```terminal
jq -r 'select(.info.severity=="critical") | "\(.info.name)\t\(.host)\t\(.matched_at)"' results.jsonl
```

## Bad output / common errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| Many `info` findings drowning real bugs | No severity filter | `-severity medium,high,critical` |
| 0 findings on a known-vuln target | Wrong template id, or response signature changed | `-debug` to see request/response; consider `-id <specific>` |
| `OAST: failed to obtain interactsh server` | Network egress blocks `oast.fun` / `interactsh.com` | Self-host (`interactsh-server`); use `-iserver` |
| `error: rate limited` from target | `-rl` too high | Drop to 30–50; respect WAFs |
| Tool spends 10 min on one host | Headless template loading stuck | `-exclude-templates technologies/headless/` for first pass |
| Memory blow-up | Large response bodies stored | Avoid `-store-resp` on full-internet scans |

## Defender's perspective

Nuclei is detectable. Telemetry shows:

- User-Agent: `Nuclei - Open-source project (github.com/projectdiscovery/nuclei)` (default).
- Template-named URI patterns (e.g. `/.git/config`, `/server-status`, `/.env`).
- OAST callbacks to `*.oast.fun` / `*.interactsh.com` / `*.oastify.com`.

Detection ideas:

- WAF rule: block default UA.
- DNS rule: alert on outbound to `oast.fun / interactsh.com / oastify.com` from prod hosts.
- Honeytoken templates: a fake `/admin/.env` — any hit is a scanner.

## OPSEC notes

- Default UA is a beacon. Override: `-H "User-Agent: Mozilla/5.0 ..."`.
- Self-host Interactsh on a domain you control to avoid public OAST DNS that defenders monitor.
- Throttle in production scope; nuclei can DoS small services with `-c 50 -bs 25`.
- Templates may include destructive payloads if `-tags intrusive` — read before running.

## Related tools

| Tool | Niche |
|------|-------|
| `nikto` | Older web scanner; complementary CGI / config checks |
| `wapiti` | Active web vuln scanner (different signatures) |
| `wpscan` | WordPress-specific |
| `Burp Suite` | Manual deep-dive after nuclei flags |
| `katana` + `nuclei` | Crawl then scan |
| `subzy` | Subdomain takeover specifically |
