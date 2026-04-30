# DFIR — First-Hour Triage

The phone rings. Something is wrong. You have one hour to confirm or deny the incident, scope it, and stop the bleeding without destroying evidence. This lesson is the first-hour playbook.

> [!info] Two clocks ticking
> Containment clock — every minute the adversary keeps moving. Evidence clock — every minute volatile state vanishes. Optimize both at once.

## The 60-minute decision tree

```
0–10  min   triage call: scope, severity, who's affected
10–20 min   collect volatile state on hot hosts (memory, processes, net)
20–35 min   widen scope via central telemetry; identify patient zero
35–50 min   contain (isolate, kill creds, rotate keys) WITHOUT destroying evidence
50–60 min   handoff: case lead set, evidence labeled, comms rolling
```

## What to ask in the first 10 minutes

```
1. What did you see? (alert, user report, vendor notification?)
2. When did you first see it? Has it stopped, or is it ongoing?
3. Which hosts / accounts / data are involved?
4. Is anyone touching the affected systems right now?
5. Crown jewels exposure (PII, regulated data, code, IP)?
6. Did anyone reboot, reimage, or run AV cleanup?
7. Last known-good backup time?
```

## Volatile evidence — collect before reboot

```terminal
# On Linux suspect host (run via SSH; do NOT reboot)
date -u; uname -a; uptime; w
ps -auxfww > ps.txt
ss -tunap > netstat.txt
cat /proc/*/status 2>/dev/null > proc_status.txt
ls -la /proc/*/exe 2>/dev/null | grep deleted    # deleted-but-running binaries
crontab -l; cat /etc/cron*; ls -la /etc/cron.*/
ls -la /tmp /var/tmp /dev/shm
last -i; lastlog; faillog
journalctl -k --since='-24h' > kdmesg.txt
journalctl -u sshd --since='-24h' > ssh.txt
auditctl -l; ausearch -ts today
hash -p /usr/bin/sha256sum chk; chk /usr/bin/{ls,ps,netstat,ss,who,passwd,sshd}
# Memory
LiME / avml -o /mnt/evidence/$(hostname).mem
# Or from a memory copy:
dd if=/dev/mem of=/mnt/evidence/mem.raw bs=1M
```

```terminal
# On Windows suspect host (admin PowerShell)
Get-Date -Format o
Get-CimInstance Win32_ComputerSystem
Get-Process | Sort-Object WS -Desc | Select -First 30
Get-NetTCPConnection -State Established | Sort RemoteAddress
Get-CimInstance Win32_StartupCommand
Get-ScheduledTask | ? { $_.Author -notlike 'Microsoft*' }
Get-CimInstance -Namespace root\Subscription -ClassName __EventConsumer
gci 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run','HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce'
gci 'C:\ProgramData' -Recurse -File -Force | ? LastWriteTime -gt (Get-Date).AddDays(-7) | sort LastWriteTime -Desc | Select -First 50
```

> [!warning] Don't run AV cleanup yet
> "Quarantine" deletes attacker tools you need for analysis and IOCs. Pull samples first, image second, clean last.

## Image acquisition — KAPE / Velociraptor

```terminal
# KAPE (Windows) — fast triage collection in ~5 minutes
kape.exe --tsource C: --tdest E:\IR\$ENV:COMPUTERNAME --target KapeTriage \
        --module !ALL --mdest E:\IR\$ENV:COMPUTERNAME\modules --mflush

# Velociraptor — agent-driven evidence at fleet scale
velociraptor-collector windows --output triage.zip
# or push artifacts via the server: KAPE.targets.WindowsTriage, Generic.Detection.Yara
```

```terminal
# Linux — UAC (Unix-like Artifacts Collector)
uac -p ir_triage -d. /opt/ir/uac
# Pulls /etc, /var/log, .bash_history, ~/.ssh, package state, service files,
# memory images, and live commands — packaged to one zip.

# Memory specifically
avml /mnt/evidence/$(hostname).mem
```

## Memory analysis with Volatility 3

```terminal
vol -f mem.raw windows.info                       # OS, profile
vol -f mem.raw windows.pslist                     # processes (parent/child)
vol -f mem.raw windows.psscan                     # hidden processes
vol -f mem.raw windows.cmdline                    # command lines
vol -f mem.raw windows.netscan                    # connections at capture time
vol -f mem.raw windows.malfind                    # injected code
vol -f mem.raw windows.svcscan                    # service abuse
vol -f mem.raw windows.dlllist --pid 1234         # what's loaded
vol -f mem.raw windows.handles --pid 1234 -o handles.txt
vol -f mem.raw windows.hashdump                   # local NT hashes
vol -f mem.raw windows.lsadump                    # cached creds, secrets

# Linux
vol -f mem.lime linux.bash                        # bash command history from memory
vol -f mem.lime linux.psaux
vol -f mem.lime linux.elfs                        # mapped ELFs (rootkit hunt)
vol -f mem.lime linux.lsmod
```

## Timeline analysis (the workhorse)

```terminal
# Plaso / log2timeline → super timeline
log2timeline.py --storage-file plaso.db /mnt/evidence
psort.py -o l2tcsv -w timeline.csv plaso.db "date >= '2026-04-25' AND date <= '2026-04-30'"

# Quick first-look
python3 mactime -p -d -z UTC -y < bodyfile > timeline.txt
grep -E "(\.exe|\.dll|cron|temp|wget|curl|powershell)" timeline.txt | less
```

> [!tip] Anchor timeline on patient zero
> Pick the earliest known-bad event (auth log entry, AV detection, EDR alert) and walk ±15 minutes around it. Most adversary actions cluster within minutes of the foothold.

## Identify patient zero from central telemetry

```kql
// Microsoft Defender — first execution of the IOC binary cluster
DeviceFileEvents
| where SHA256 == "<known-bad-hash>"
| sort by Timestamp asc
| project Timestamp, DeviceName, ActionType, FolderPath, InitiatingProcessFileName
```

```kql
// First IOC C2 contact across fleet
DeviceNetworkEvents
| where RemoteUrl has "evil-c2-domain"
| sort by Timestamp asc
| project Timestamp, DeviceName, AccountName, InitiatingProcessFileName
```

```kql
// First user → who clicked the phish
EmailEvents
| where SenderFromAddress has "look-alike.com"
| join (UrlClickEvents) on NetworkMessageId
| project Timestamp, AccountUpn, Url
```

## Contain — without burning evidence

| Action | Effect | Evidence cost |
|--------|--------|--------------|
| Network isolate (EDR) | Stops C2, lateral | Low — agent intact |
| Disable user account | Stops creds | Medium — kills active sessions |
| Force password reset + revoke sessions | Kills tokens | Medium — must also reset OAuth |
| Rotate keys (cloud, code-signing, NTDS-DSRM) | Closes persistence | Low |
| Reimage host | Final cleanup | HIGH — only after evidence collected |
| Pull cable | Stops C2 instantly | High — kills volatile memory state |

```terminal
# Microsoft Defender — isolate
Invoke-WDISOToggle -DeviceId <id> -Action Isolate
# Cloud creds — rotate AWS access key while keeping CloudTrail
aws iam delete-access-key --user-name <u> --access-key-id <id>
aws iam create-access-key --user-name <u>
# Entra session revoke
Revoke-MgUserSignInSession -UserId <upn>
```

## Common DFIR pitfalls (every team commits at least one)

> [!danger] Real mistakes that wreck investigations
> 1. **Rebooting the suspect host** to "see if it goes away" — destroys memory, deleted-process state, network connections.
> 2. **Cleaning up before imaging** — IOCs gone, can't pivot.
> 3. **One person handling everything** — burnout, single point of failure, evidence chain breaks.
> 4. **Not writing down what you did** — six hours later you can't reproduce the analysis.
> 5. **Sharing IOCs publicly during active operation** — adversary changes tooling, you lose visibility.

## The case-management discipline

A simple convention beats a fancy ticketing system:

```
incident-2026-04-30-acme/
  README.md             ← what happened, who's lead, current status
  TIMELINE.md           ← adversary actions sorted by time, with evidence ref
  ARTIFACTS/
    host-srv01.zip
    host-srv01.mem
    timeline.csv
    plaso.db
  IOCS/
    domains.txt
    hashes.txt
    ips.txt
  COMMS/
    exec-update-2026-04-30T10-15Z.md
    legal-counsel-2026-04-30T13-02Z.md
  ANALYSIS/
    pivot-1-c2.md
    pivot-2-cred-theft.md
```

Every artifact gets a SHA-256 in the README. Every action goes into TIMELINE.md as you do it.

## After the first hour

- **Containment confirmed → eradication** (remove webshells, kill backdoors, rotate every cred touched).
- **Eradication confirmed → recovery** (restore from known-good, validate, monitor enhanced for 30 days).
- **Recovery → lessons** (post-incident review, control gaps, detection upgrades, table-top from this very incident next quarter).

## Tooling cheat-sheet

| Need | Tool |
|------|------|
| Windows triage collector | KAPE, Velociraptor, CyLR, Magnet RESPONSE |
| Linux triage collector | UAC, fastir, linux-explorer |
| Memory acquisition | WinPmem, MAGNET RAM, avml, LiME |
| Memory analysis | Volatility 3, MemProcFS, Bulk Extractor |
| Disk imaging | dd, dcfldd, FTK Imager, ewfacquire |
| Timeline | Plaso/log2timeline, KAPE-mini, Aurora-IR |
| Hunting at fleet | Velociraptor, Defender XDR, CrowdStrike Falcon, EDR-X |
| Yara at scale | Loki, Thor-Lite, Velociraptor.Yara |
| Sandbox / detonation | Cuckoo, Joe Sandbox, ANY.RUN, Hatching Triage |
