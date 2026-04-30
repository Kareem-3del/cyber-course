# FLARE-VM — full tutorial

`FLARE-VM` is Mandiant's curated Windows malware-analysis distribution. A PowerShell installer that turns a fresh Windows 10/11 VM into a complete RE workstation — IDA Free, x64dbg, Ghidra, dnSpy, Process Monitor, FakeNet-NG, YARA, capa, Frida, dozens more.

## Install

1. Build a fresh Windows 10/11 VM (VMware / VirtualBox).
2. Disable Windows Defender + automatic updates.
3. Snapshot VM (clean state).
4. PowerShell as admin:

```powershell
Set-ExecutionPolicy Unrestricted -Force
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
(New-Object Net.WebClient).DownloadFile('https://raw.githubusercontent.com/mandiant/flare-vm/main/install.ps1','install.ps1')
.\install.ps1
```

Installer asks for profile selection; default profile installs ~80 packages. Reboot multiple times during install.

## Profiles

- **Default** — full RE/malware-analysis suite.
- **Basic** — minimal subset.
- **Custom** — pick specific packages from the JSON config.

## Categories of installed tools

| Category | Examples |
|----------|----------|
| Disassembly / decompilation | IDA Free, Ghidra, Cutter, dnSpyEx, jadx, dex2jar |
| Debuggers | x64dbg, x32dbg, WinDbg, OllyDbg |
| Dynamic analysis | Process Hacker, Process Monitor, Process Explorer, API Monitor, FakeNet-NG, INetSim |
| Static utilities | YARA, capa, FLOSS, PE-bear, PEStudio, BinText, CFF Explorer, ExeInfoPE |
| Forensics | Volatility 3, Plaso, KAPE |
| Networking | Wireshark, Burp Free, mitmproxy, Fiddler |
| Office / scripting | oledump, olevba, py2exe, dnlib, Python 3 |
| Hex / strings / parsers | HxD, 010 Editor (trial), strings.exe, FLOSS |
| Anti-anti-debug | ScyllaHide, TitanHide, x64dbg plugins |
| YARA tooling | yarGen, yaraify, yara-validator |
| Sample retrieval | DC3-MWCP, MalwareBazaar tooling |

## Snapshot strategy

- Snapshot 1 — clean Windows install.
- Snapshot 2 — after FLARE-VM install (your "ready" state).
- Snapshot 3 — per-sample analysis, restore to Snapshot 2 between samples.

## Networking choices

| Mode | Use |
|------|-----|
| Host-only | No internet; pair with FakeNet-NG (next) |
| FakeNet-NG running | All traffic intercepted, fake replies for DNS / HTTP / SSL |
| INetSim | Linux VM in same network simulating SMTP, DNS, HTTP, etc. |
| NAT (real internet) | **Risky** — only for confirmed-benign samples |

```
[ FLARE-VM (host-only network) ]
        ↕
[ Linux REMnux VM (INetSim, FakeDNS, mitmproxy) ]
```

REMnux complements FLARE-VM on the Linux side.

## Workflow on a sample

1. Snapshot 2 → restore.
2. Boot VM with Internet OFF.
3. Run FakeNet-NG: simulates network responses, captures all traffic.
4. Drop sample → run.
5. Watch Process Hacker for spawned processes, network calls.
6. Procmon filter `Process Name is sample.exe` → activity log.
7. Strings + PEStudio for static IOCs.
8. After 5–15 min interactive analysis → snapshot for evidence.
9. IDA / Ghidra for static deep dive.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Installer fails | `boxstarter` failed mid-install — re-run; many packages auto-skip if installed |
| Defender keeps re-enabling | Group Policy: disable real-time protection; or use Windows Sandbox feature exclusion |
| Some packages missing | Custom-profile config; install manually with `cup <pkg>` (Chocolatey) |
| Performance crawls | Allocate ≥ 8 GB RAM, ≥ 4 CPUs; disable VMware Tools auto-install of drivers that conflict |

## Defender / RE perspective

FLARE-VM is the canonical lab environment. Combined with REMnux on a Linux VM, you have a full malware lab in two snapshots.

For corporate use:
- Air-gap the analysis network from corporate.
- Restrict outbound to `update.flare-vm.com` only during install.
- Wipe samples after analysis or keep in encrypted volume per case.

## OPSEC

- A FLARE-VM machine **must not** touch your corporate identity. Use a fresh local account; never log into Microsoft / OneDrive / Office.
- Snapshot before every run; restore after — assume every sample tampers with everything.
- Sensitive samples → never upload to public services from the FLARE-VM.

## Related tools

| Tool | Niche |
|------|-------|
| **REMnux** | Linux malware-analysis distro (companion) |
| **CommandoVM** | Mandiant's pentest-focused Windows distro |
| **SIFT Workstation** | Forensics-focused Linux distro |
| **WinFE** | Forensic-bootable Windows |
| **DetectionLab** | Lab to **test** detections, not analyze samples |
