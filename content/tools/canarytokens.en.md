# Canarytokens — full tutorial

Canarytokens (Thinkst) are tripwires you place across your environment. When something / someone touches them, you get an email / webhook alert. Free public service at `canarytokens.org`; self-host the OSS edition (`thinkst/canarytokens`) for sensitive deployments.

## Token types

| Token | What it is | Trips when… |
|-------|------------|-------------|
| **DNS / Web** | URL or hostname | Anyone resolves DNS or hits the URL |
| **Adobe PDF** | PDF that beacons home on open | Someone opens the PDF |
| **MS Word / Excel / PowerPoint** | Office doc with tracking | Someone opens it (gives source IP) |
| **AWS Access Key** | Honeypot AKIA / SK pair | Anyone uses the keys (any AWS API call) |
| **Azure Login Cert** | Service-principal key | Used to auth to Azure |
| **Slow Redirect** | URL that redirects but pings home | Click |
| **Cloned Website** | JS that fires if domain != original | Phisher cloned your login page |
| **Signed EXE / DLL** | Tracked Windows binary | Run |
| **HTTP File / Folder** | Web URL representing a fake file | Visited |
| **MySQL Dump** | SQL file that triggers on import | Imported |
| **Kubeconfig** | Fake k8s config | Used to auth to the (fake) API |
| **WireGuard / SSH key** | Fake creds | Used |
| **MS SQL token** | Stored procedure | Triggered on call |
| **Custom HTTP** | URL with `Host` callback | Any GET |
| **Webhook only** | No file; just a URL | Any GET |

## Workflow

### Create a token (public service)

`canarytokens.org` → pick type → email to alert → reminder note → generate. Place the token where you want to trip:

- AWS keys: in `.env`, S3 bucket policies, README repos, abandoned IAM users.
- PDFs: in shared drives named `passwords.pdf`, `salaries.pdf`.
- Office docs: in HR folders, exec-team folders.
- DNS: as a CNAME or as a hostname referenced in a config file.
- Custom HTTP: in a config of an internal app, expecting only insiders to follow.

### Self-host (sensitive deployments)

```terminal
git clone https://github.com/thinkst/canarytokens-docker
cd canarytokens-docker
cp .frontend.env.template .frontend.env
# edit env vars
docker compose up -d
```

Issues tokens via your own domain — defender keeps full control of trip data.

### Receive alerts

Email / webhook on each trip. Body includes:

- Source IP, User-Agent.
- Geolocation (best effort).
- Domain that resolved (in DNS-style tokens).
- Process name (where token has it — e.g., AWS key trip prints which API call).

## Examples

### "Strewn breadcrumbs" pattern

Drop tokens across attractive locations:

| Location | Token type | Trip means |
|----------|------------|-----------|
| `/etc/passwords-backup/credentials.pdf` | PDF | Adversary mounting a host's filesystem |
| `~/.aws/old-creds` | AWS keys | Adversary hunting for cloud keys |
| `\\fileserver\HR\salaries-2025.xlsx` | Excel | Insider snooping |
| Password vault entry "DA — backup" with fake `runonce.exe` | Signed EXE | Adversary trying every credential |
| `git/.bash_history` with `mysql -u root -pSuperSecret` (token-MySQL) | MySQL dump | Adversary copying history |

Goal: at least one tripwire fires in any plausible attack path.

### Anti-phishing — Cloned Website token

Embed JS in your login page that posts to `canarytokens.com/...` if the page's location is not your domain. If the login page is cloned to a phishing kit, every visit pings you with the phishing URL — early warning.

```html
<script src="https://canarytokens.com/.../submit.js"></script>
```

### Bad-actor-only signal

Real users never touch the tokens. So 0 false positives. Any trip = treat as confirmed adversary action.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| AWS key trips on legit code review | Mark token as known to your dev team; trips outside the dev IP range are real |
| PDF token doesn't fire | Some viewers block external resources by default; use Word doc instead |
| Email alerts get spam-filtered | Self-host with your own domain; or set up direct webhook |
| Token traces back to alert receiver | Use a generic email address per program, not a person |

## Defender perspective

Canarytokens give **deception detection** at near-zero cost. Three programs to run:

1. **Static** — sprinkle tokens, alert on any trip.
2. **Targeted** — drop a unique token in places only specific role would touch (sysadmin, finance), so trips identify lateral movement direction.
3. **Honey-document** — when an attacker exfils, the doc trips itself when opened on attacker infra → forensic IP.

Pair with **Canary** (Thinkst's hardware deceptions appliance) for richer "I'm an open file server" / "I'm an Active Directory" deceptions at scale.

## OPSEC (defender)

- Don't accidentally include real-looking secrets that a vendor's security scanner might flag (false positives outside).
- Document in the IR runbook **which tokens exist and why** — analysts shouldn't get cold-called by a trip and have to figure out what triggered it.
- Don't store the token-list in the same place tokens are placed (otherwise if compromised, attacker reads the list).

## Related tools

| Tool | Niche |
|------|-------|
| **Canary appliance** (Thinkst) | Hardware honey-host (paid) |
| **DCEPT (HoneyAccount)** | AD honeyusers |
| **TrapX / Illusive** | Enterprise deception platforms |
| **HoneyTrap / Cowrie** | Network-service honeypots |
| **MISP Honey events** | Burn-on-detection IOCs |
