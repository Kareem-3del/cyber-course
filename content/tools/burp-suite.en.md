# Burp Suite — full tutorial

Burp Suite is the industry-standard web pentest platform. The free Community edition gives you the essentials (Proxy, Repeater, Decoder); Pro adds Scanner, Intruder at full speed, Collaborator, BApp Store. This guide focuses on Pro workflows.

## Install

Download from `portswigger.net/burp/releases`. License key for Pro. Embeds JRE — no separate Java needed.

## Initial setup (do this once)

1. **Project**: File → New project → Save to file (`/path/engagement.burp`).
2. **Browser**: use the embedded Chromium (Proxy → Intercept → Open Browser) or configure Firefox with FoxyProxy → 127.0.0.1:8080.
3. **CA cert**: in the proxied browser, visit `http://burp` → download `cacert.der` → import to OS / browser trust store. Without this, HTTPS traffic shows TLS errors.
4. **Scope**: Target → Scope → add `target.com` and subdomains. **Always set scope** before scanning; it prevents accidental scans of out-of-scope partners.

## The tools (left tabs)

| Tab | What it's for |
|------|--------------|
| **Dashboard** | Live scans, issues, tasks |
| **Target** | Sitemap + scope + issue panel |
| **Proxy** | Intercept HTTP(S), HTTP history, WebSockets |
| **Intruder** | Automated request manipulation (fuzzing) |
| **Repeater** | Manually replay & tweak requests |
| **Sequencer** | Token randomness analysis |
| **Decoder** | Quick encode/decode (b64, URL, hex, hash) |
| **Comparer** | Diff two responses |
| **Logger** | Searchable log of every HTTP req/res |
| **Extender / BApp Store** | Plugins (Pro mostly) |
| **Collaborator client** | OAST callback testing |

## Proxy mastery

- **Intercept**: pause requests/responses for manual edit. Most engagements keep it OFF and rely on the HTTP history tab.
- **HTTP history**: every request the browser made through Burp. Filter by host, method, status, MIME. Right-click → Send to Repeater / Intruder / Scanner.
- **Match & Replace**: rewrite headers globally (e.g., add `X-Forwarded-For`, swap UA, strip `Origin`).

## Repeater workflow

1. Find an interesting request in HTTP history.
2. Right-click → Send to Repeater (Ctrl+R).
3. Edit the request (URL, headers, params, body).
4. Click Send.
5. Inspect the response side-by-side.

Power moves:
- `Ctrl+Space` for known-header autocomplete.
- `Ctrl+R` clones the current request to a new tab.
- Pin frequently-used requests; rename tabs.

## Intruder (the fuzzer)

1. Send → Intruder.
2. Mark insertion points with `§` (auto-detected; you can add/remove).
3. Pick attack type:
   - **Sniper** — one wordlist, one position at a time.
   - **Battering ram** — same value in all positions.
   - **Pitchfork** — parallel wordlists (each position has its own list, used in lockstep).
   - **Cluster bomb** — Cartesian product (huge).
4. Payloads → load wordlist (Seclists is bundled in Burp Pro extender).
5. Settings → grep-match strings to flag in results.
6. Start.

> [!tip] Speed limit
> Community edition throttles Intruder. Pro is full-speed. For massive fuzzing, `ffuf` with the same idea is faster — keep Intruder for nuanced payloads (smart dates, encoded variants).

## Scanner (Pro only)

- **Active scan**: sends payloads to find vulns (passive logs only watch).
- **Audit**: deeper bug-hunt phase.
- **Crawl**: discover URLs first, then audit them.
- Configure scan profile under Dashboard → New scan → Scan configuration. Tune for speed vs thoroughness.

Scanner finds: SQLi, XSS (DOM + reflected + stored), SSTI, command injection, XXE, deserialization, open redirects, host header injection, prototype pollution, smuggling.

## Collaborator (OAST)

- Open Burp → Collaborator client → Copy to clipboard → use that domain (e.g. `xyz.oastify.com`) as a callback host in any payload.
- Poll for interactions; you'll see DNS, HTTP, SMTP hits with timestamps and source IPs — proves blind RCE/SSRF/log4shell.

## Useful BApps (Extender → BApp Store)

- **Logger++** — searchable cross-tool log.
- **Autorize** — IDOR / authz tester (replay every request as user B).
- **Turbo Intruder** — Python-scripted intruder, much faster.
- **JWT Editor / JWT4B** — JWT manipulation.
- **Active Scan++** — extra scanner checks.
- **Param Miner** — hidden header / param discovery.
- **Hackvertor** — payload encoding/transformation.
- **HTTP Request Smuggler** — Smuggling automated.

## Workflow on a typical web engagement

1. Set scope, browse the app like a user, let the sitemap populate.
2. Right-click site root → Scan → Crawl + Audit (Pro) — runs in background.
3. Identify high-value endpoints (auth, admin, file upload, JSON APIs).
4. Repeater each suspicious endpoint; tamper params, change verbs, drop headers.
5. Intruder for parameter / value fuzzing where Repeater hints at a bug.
6. Use Autorize to test horizontal authz (acct A → access acct B's data).
7. Use Param Miner to find hidden/cache-keyed params.
8. Use Collaborator for blind bugs.
9. Document with `Engagement tools → Generate report` (Pro): HTML/PDF with PoC requests/responses.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Requests fail TLS error in browser | Burp CA not trusted | Re-import certificate, restart browser |
| HTTP/2 issues | Some servers HTTP/2-only require new tab settings | Project options → HTTP → enable HTTP/2 |
| Memory blow-up on long engagement | History huge | Project options → Database → vacuum, or roll project |
| Scanner reports false positives | Default profile too aggressive | Use a tuned profile; verify with Repeater before reporting |
| WebSocket app shows nothing | Browser bypassed proxy for WS | Use embedded browser, or check Firefox proxy supports WS |

## Defender's perspective

Burp traffic is hard to fingerprint cleanly because it proxies your real browser. Look for:

- Repetition of identical requests with one parameter changing (Intruder/Repeater).
- Requests with payloads from common encoders: `<svg/onload`, `' OR 1=1--`, `${jndi:`, `../`, etc.
- WAF rules can pick up these payloads — but a careful operator encodes / mutates them.

## OPSEC

- Burp tunnels through your IP — pair with upstream proxy (Burp → Project options → Connections → Upstream proxy server) to route through your engagement infra.
- Don't accidentally leave intercept ON when browsing the rest of the internet.
- Save the project file regularly; corrupt projects are a real loss.

## Related tools

| Tool | Niche |
|------|-------|
| **OWASP ZAP** | Free alternative; comparable basics, weaker Intruder |
| **Caido** | Newer Rust-based, modern UI, lighter |
| **mitmproxy** | Scriptable Python proxy, terminal-first |
| **Postman** | Crafting requests, but no proxy/intercept |
| **ffuf** | Faster fuzzing alongside Intruder |
| **sqlmap** | Take SQLi findings deep |
