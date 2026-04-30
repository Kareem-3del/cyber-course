# Velociraptor — full tutorial

`Velociraptor` is the open-source DFIR / hunting platform from Rapid7 / Velocidex. Single Go binary acts as both **server** (web UI, queue) and **client** (deployable agent). Hunt across thousands of endpoints with VQL queries, collect KAPE-style artifacts on demand, and run live forensic flows.

## Install

```terminal
curl -L https://github.com/Velocidex/velociraptor/releases/latest/download/velociraptor-linux-amd64 -o vr
chmod +x vr

# Server config + initial admin
./vr config generate -i  # interactive
./vr --config server.config.yaml frontend
```

## Architecture

```
[ Velociraptor agents on endpoints ]   ↔   [ frontend / server ]   ↔   [ admin GUI / API ]
```

Agents are tiny ~10 MB, work offline (queue), use mTLS to the frontend. Server is single binary too.

## Deploying agents

```terminal
# Pack a per-org client config + binary into MSI
./vr --config server.config.yaml package --msi /tmp/vr-client.msi
# Push via GPO / Intune / SCCM

# Or per-platform:
./vr --config client.config.yaml client
# (Linux/macOS: install as service)
```

## VQL — Velociraptor Query Language

VQL is a SQL-flavored query language scoped to DFIR data sources. Every artifact is a VQL query.

```vql
SELECT Name, Pid, Ppid, CommandLine
FROM pslist()
WHERE Name =~ "powershell|cmd|wscript"
  AND CommandLine =~ "(http|FromBase64String|IEX)"
```

```vql
LET parents = SELECT Name, Pid FROM pslist() WHERE Name =~ "explorer.exe"
SELECT * FROM pslist()
WHERE Ppid IN parents.Pid AND Name =~ "(powershell|wmic|cscript)"
```

```vql
-- Scan files for a Yara rule
SELECT * FROM Artifact.Generic.Detection.Yara.Process(YaraRule="rule m { strings: $a = \"AAA\" condition: $a }")
```

## Built-in artifacts (~250)

| Artifact | What it does |
|----------|--------------|
| `Generic.Forensic.Timeline` | Plaso-style timeline |
| `Windows.Sys.Programs` | Installed programs (registry + Amcache) |
| `Windows.Forensics.Prefetch` | Prefetch parsing |
| `Windows.EventLogs.Suspicious` | EVTX with sigma matches |
| `Windows.KapeFiles.Targets` | Run any KAPE target list |
| `Windows.System.Pslist` | Live ps |
| `Windows.NTFS.MFT` | Live MFT parse |
| `Linux.Sys.SUID` | All SUIDs on disk |
| `Linux.Network.NetstatEnriched` | Live ss + /proc enrichment |
| `Generic.Detection.Yara.Glob` | Yara across globbed files |
| `MacOS.System.Packages` | Installed pkgs |
| `Server.Utils.CreateOfflineCollector` | Self-extracting offline collector |

## Workflow

### Hunt — fleet-wide query

GUI → Hunt Manager → **New Hunt** → pick artifact (`Windows.System.Pslist`) → set scope (label / OS / hostname regex) → Submit.

Within minutes, results appear in a queryable table for every endpoint that came online.

### Live triage on one endpoint

GUI → Clients → search hostname → Collected → New Collection → pick artifacts → run.

Results download as CSV / JSON or zipped in a single archive.

### Offline collector

For a host that can't be onboarded:

GUI → Server Artifacts → `Server.Utils.CreateOfflineCollector` → choose what to collect → download `vr-collector.exe`. Run on victim. Output: `Collection-<host>-<time>.zip`. Drop into VR server → analyze.

### Custom artifact

```yaml
name: Custom.Windows.SuspiciousChildOfWord
description: Flag any process spawned by Word/Excel that's not Office
type: CLIENT
parameters: []

sources:
  - query: |
      SELECT * FROM watch_evtx(filename='''C:\\Windows\\System32\\winevt\\Logs\\Microsoft-Windows-Sysmon%4Operational.evtx''')
      WHERE EventID = 1
        AND ParentImage =~ "(WINWORD|EXCEL|POWERPNT)\\.exe$"
        AND Image !=~ "(splwow64|MicrosoftEdgeUpdate)"
```

Save as YAML → upload via GUI → run.

## Notebooks

The **Notebooks** tab is a Jupyter-like environment over VQL. Save investigative analyses, share with team. Markdown + VQL cells.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Agent not connecting | Firewall on port 8000 blocked; verify cert / SAN of frontend |
| Hunt finishes 0% | All clients labeled differently — check label scope |
| OOM during big collections | Increase server memory; split hunts |
| MSI deploys but service not running | Wrong config (rare) — re-package, ensure SYSTEM perms on file |
| VQL returns garbage | Wrong artifact for OS — use `OS:Windows`/`Linux` scoping |

## Defender / IR perspective

Velociraptor is **the** open-source equivalent of an EDR for IR. Use cases:

- Continuous monitoring with custom artifacts firing as scheduled hunts.
- Acute-IR fleet sweep ("which hosts have file with hash X?").
- Evidence collection — `Server.Forensics.SQLiteHunter` triggers on SQLite anomalies.

## OPSEC (defender)

- Server config holds CA private key — protect.
- Self-signed PKI distinct per deployment; rotate on operator turnover.
- Audit log every hunt, every download — for legal + insider abuse.

## Related tools

| Tool | Niche |
|------|-------|
| **Osquery** | Live SQL on endpoints, no DFIR depth |
| **GRR Rapid Response** | Older Google offering, similar idea |
| **Limacharlie** | Commercial, similar fleet model |
| **CrowdStrike Real Time Response** | Commercial EDR's RTR shell |
| **KAPE** | Single-host targeted collector |
| **Yara on fleet** | Velociraptor wraps yara as artifact |
