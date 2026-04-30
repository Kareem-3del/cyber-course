# Sysmon — full tutorial

`Sysmon` (System Monitor) is a free Microsoft Sysinternals tool that emits high-fidelity Windows process / network / file telemetry to the Windows Event Log. Combined with a good config file, it's the closest thing to a free EDR for Windows.

## Install

```cmd
# Download sysmon.zip from https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon
sysmon64.exe -accepteula -i config.xml
```

To install: provide a config file (do not run with default config — it logs almost nothing).

## Recommended starting config

The community-maintained baseline is **SwiftOnSecurity / sysmon-config** (`https://github.com/SwiftOnSecurity/sysmon-config`) or **Olaf Hartong's sysmon-modular** (`https://github.com/olafhartong/sysmon-modular`).

```cmd
sysmon64.exe -accepteula -i sysmon-config.xml
sysmon64.exe -c sysmon-config.xml      # update existing config
sysmon64.exe -c                        # show current config
sysmon64.exe -u                        # uninstall
```

Tune via XML `<Include>` and `<Exclude>` blocks per Event ID.

## Event IDs (the ones you actually use)

| EID | Event |
|-----|-------|
| **1** | Process create |
| **2** | File creation time changed (timestomping) |
| **3** | Network connection |
| **5** | Process terminated |
| **6** | Driver loaded |
| **7** | Image loaded (DLL) |
| **8** | CreateRemoteThread |
| **9** | RawAccessRead (raw disk read) |
| **10** | ProcessAccess (memory access) |
| **11** | FileCreate |
| **12 / 13 / 14** | Registry create / set / rename |
| **15** | FileCreateStreamHash (alt data streams) |
| **16** | Sysmon config change |
| **17 / 18** | NamedPipe create / connect |
| **19 / 20 / 21** | WMI EventFilter / Consumer / Binding |
| **22** | DNS query |
| **23** | FileDelete (with file content saved if configured) |
| **24** | ClipboardChange |
| **25** | ProcessTampering (image hollow / repaging) |
| **26** | FileDeleteDetected (lighter EID 23) |
| **27** | FileBlockExecutable |
| **28** | FileBlockShredding |

## Sysmon config — anatomy

```xml
<Sysmon schemaversion="4.83">
  <HashAlgorithms>md5,sha256,IMPHASH</HashAlgorithms>
  <CheckRevocation/>
  <EventFiltering>

    <ProcessCreate onmatch="exclude">
      <Image condition="is">C:\Windows\System32\svchost.exe</Image>
    </ProcessCreate>

    <NetworkConnect onmatch="include">
      <Image condition="contains">powershell.exe</Image>
      <DestinationPort condition="is">4444</DestinationPort>
    </NetworkConnect>

    <DnsQuery onmatch="exclude">
      <Image condition="end with">\\msedge.exe</Image>
    </DnsQuery>

  </EventFiltering>
</Sysmon>
```

`onmatch="include"` = log only matching, `onmatch="exclude"` = log everything except matching. Conditions: `is`, `contains`, `begins with`, `end with`, `image`, `less than`, `more than`, `regex`.

## Forwarding

Sysmon writes to `Microsoft-Windows-Sysmon/Operational`. Ship to SIEM via:

| Method | Notes |
|--------|------|
| Winlogbeat | Light, ELK-friendly |
| WEC (Windows Event Forwarder) | Native Windows; pull from collector |
| Sysmon-DotNet → Splunk UF | Splunk-flavored |
| Wazuh agent | Built-in support |
| Microsoft Defender for Endpoint | Native consume |

## Workflow — a worked detection

**Goal**: detect `comsvcs.dll MiniDump <pid> ...` (LSASS dump).

```xml
<ProcessCreate onmatch="include">
  <CommandLine condition="contains">comsvcs.dll</CommandLine>
  <CommandLine condition="contains">MiniDump</CommandLine>
</ProcessCreate>
```

Once written, EID 1 with that command-line in `Microsoft-Windows-Sysmon/Operational`. Sigma rule:

```yaml
title: Mimikatz LSASS Dump via comsvcs.dll
logsource: { product: windows, category: process_creation }
detection:
  selection:
    Image|endswith: '\rundll32.exe'
    CommandLine|contains|all:
      - 'comsvcs.dll'
      - 'MiniDump'
  condition: selection
level: high
```

Sigma compiles to KQL / SPL / Elastic / Sentinel. End-to-end coverage from one Sysmon EID.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Logging too noisy | Tighten config; exclude trusted parents (svchost, Antimalware, EDR) |
| EID 1 missing parent process | Sysmon was offline at parent's launch; preserve PID anyway via `LogonId` correlation |
| EID 22 (DNS) too noisy | Include only specific images / queries; or disable EID 22 entirely if EDR already covers DNS |
| Driver load fails | Catch driver-block lists conflict; reinstall after driver-policy review |
| Config update silently fails | `sysmon64 -c` with XML errors silently doesn't change; check `Operational` log for EID 16 |

## Defender perspective

Sysmon is **the cheapest, highest-leverage** Windows defensive tool. Combined with WEC / Winlogbeat / Splunk / Sentinel, it covers ~70% of MITRE ATT&CK techniques visible in process / network telemetry.

Tune iteratively: deploy → observe noise → exclude trusted images → re-deploy. Sysmon-modular's XSLT-based config templates make this manageable across thousands of hosts.

## OPSEC (operator-side)

- Adversaries can disable Sysmon (admin required) — EID 4 (Sysmon stop) is a high-fidelity alert.
- Some tooling tries to evade by using rare process names that don't match common rule sets. Custom rules + Olaf's modular templates raise the bar.
- Sysmon config itself is in `HKLM\SYSTEM\CurrentControlSet\Services\SysmonDrv\Parameters\Rules` — adversaries who can write there can disable rules. Monitor for changes (EID 16).

## Related tools

| Tool | Niche |
|------|-------|
| **Sysmon for Linux** | Linux port (less mature) |
| **auditd** | Linux native equivalent |
| **osquery** | Cross-platform endpoint state |
| **Microsoft Defender for Endpoint** | Commercial EDR (Sysmon's bigger sibling) |
| **Velociraptor** | Live hunting, complementary |
| **Sysinternals Suite** | Process Monitor, Process Explorer — interactive cousins |
