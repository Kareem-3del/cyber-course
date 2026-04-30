# OWASP ZAP — full tutorial

ZAP (Zed Attack Proxy) is the OWASP-supported, fully open-source alternative to Burp Suite. Strong CI integration, scriptable, and free at full speed. The 2024 fork "ZAProxy" is community-maintained.

## Install

```terminal
brew install --cask owasp-zap
docker run -u zap -p 8090:8090 -p 8080:8080 ghcr.io/zaproxy/zaproxy:stable zap.sh -daemon -host 0.0.0.0 -port 8080
```

Modes: GUI, daemon (API only), `zap2docker-stable` for CI.

## Modes (top-right dropdown)

| Mode | Behavior |
|------|---------|
| Safe | Pure passive — no scanner, no fuzzing |
| Protected | Passive + active only on in-scope sites |
| Standard (default) | Anything you click; **enforce scope before active scans** |
| ATTACK | Auto-attacks anything entering the proxy — only for ZAP's own labs |

Always set **Protected** or use scope filters.

## Workflow

1. Set proxy in browser: 127.0.0.1:8080.
2. Visit the site through the proxy. ZAP populates the Sites tree.
3. Right-click the site root → Include in context.
4. Right-click → Attack → Spider (find URLs).
5. Right-click → Attack → AJAX Spider (run JS-aware crawler).
6. Right-click → Attack → Active Scan with the desired policy.
7. Review Alerts tab; triage; tweak; rerun.

## Key parameters / settings

| Setting | Purpose |
|---------|---------|
| Tools → Options → Network → Connection | Upstream proxy chain |
| Tools → Options → API | Enable API + key for `zap-cli` and `python-zap` |
| Tools → Options → Active Scan | Threads, attack strength, alert threshold |
| Tools → Options → Spider | Max depth, Robot.txt, Posts |
| Tools → Options → Connection → User-Agent | Rotate UA |
| Sites tree → right-click Context → Include / Exclude regex | Scope |
| Authentication script | Login script reused across scans |
| Forced User mode | Run all requests as a specific authenticated user |

## CI integration (the killer feature)

```terminal
docker run -u zap -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://target.com -r baseline.html
docker run -u zap -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t https://target.com -r full.html
docker run -u zap -t ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py -t https://target.com/openapi.json -f openapi -r api.html
```

`zap-baseline.py` is fast and safe (passive only) — perfect for build pipelines.
`zap-full-scan.py` runs active scan; only use against test environments.
`zap-api-scan.py` understands OpenAPI/Swagger/SOAP.

## Scripting

ZAP supports scripts in JS / Python (Jython) / Groovy / Kotlin:

| Script type | When it runs |
|------------|--------------|
| Active rules | New attack module |
| Passive rules | Inspect every response |
| Authentication | Custom login flow |
| Session management | Token refresh logic |
| Targeted | One-off helper |
| HTTP Sender | Mutate every outgoing request |

Example targeted script (JS):

```javascript
function sendingRequest(msg, initiator, helper) {
  msg.getRequestHeader().setHeader("X-Tenant", "evil-tenant");
}
```

## Good output

Alerts panel groups by risk (High/Medium/Low/Info), with: name, URL, parameter, attack vector, evidence, CWE/OWASP mapping, and remediation text. HTML report at the end of CI runs is consumable directly.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Spider doesn't find anything | SPA — hash routes / JS-only | Use AJAX Spider; it drives a real Firefox |
| Active scan returns 403 everywhere | Session expired or tokens not bound | Set Authentication context + Forced User mode |
| Tons of false positive XSS | Default reflection rule too eager | Adjust Active Scan policy; raise alert threshold to "Medium" |
| Slow scans | Default 5 threads + 100% strength | Increase threads; downgrade strength to Medium for first pass |
| Large memory | Sessions accumulate | Tools → Options → Database → Cleanup; or restart between scans |

## Defender's perspective

ZAP behaves much like Burp/scanner — repetitive parameter mutations, payload signatures, frequent path discoveries. Default UA: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36`. Some plugins set `OWASP ZAP` strings explicitly — easy WAF rule.

## OPSEC

- Disable ZAP's `OWASP ZAP` HTTP comments unless you want easy attribution.
- Use upstream proxy + persona-specific outbound IP for engagement.

## Related tools

- **Burp Suite Pro** — paid alternative; richer Intruder + Repeater UX.
- **Caido** — modern Rust-based proxy.
- **Nikto** — old-school CGI/conf scanner; complementary findings.
- **nuclei** — templated scans, faster for known issues.
