# KAPE — full tutorial

KAPE (Kroll Artifact Parser and Extractor) is the de-facto Windows triage collector. Two phases: **targets** (collect artifacts off disk fast) and **modules** (parse them into human-readable formats). Free for non-commercial use; very popular in IR.

## Install

Download from `https://www.kroll.com/en/services/cyber-risk/incident-response-litigation-support/kroll-artifact-parser-extractor-kape` (form-gated). Get the latest **target / module** definition pack: `https://github.com/EricZimmerman/KapeFiles`.

```
kape\
  kape.exe
  Targets\
    Compound\KapeTriage.tkape
    Live Response\
    OS\
    ...
  Modules\
    EZTools\
    Live Response\
    Microsoft\
    ...
  KapeFiles\           <- the github repo cloned here
```

## Concept

| Phase | Operation |
|-------|-----------|
| **Targets** | Robocopy-driven collection of files matching globs (`%user%\AppData\Roaming\Microsoft\Windows\Recent\*.lnk` etc.) |
| **Modules** | Run external EXEs against collected files to produce parsed CSVs / HTMLs |

You can run targets only, modules only, or chain target → module in one command.

## Common command lines

### Standard live triage (run from external USB / share)

```cmd
kape.exe ^
  --tsource C: ^
  --tdest E:\IR\%COMPUTERNAME% ^
  --target KapeTriage ^
  --module !ALL ^
  --mdest E:\IR\%COMPUTERNAME%\modules ^
  --mflush
```

| Flag | Purpose |
|------|---------|
| `--tsource <drive>` | Where to collect from |
| `--tdest <path>` | Where to write collected files |
| `--target <name>` | Which target list (KapeTriage = the gold-standard preset) |
| `--module <name>` | Which module list (`!ALL` = each available) |
| `--mdest` | Module output dir |
| `--mflush` | Wipe module output dir before running |
| `--zip <name>` | Bundle output into one zip |
| `--debug / --trace` | Verbose |
| `--vhdx` / `--vhd` | Write as virtual disk (mountable later) |
| `--scs` | Skip volume shadow copies (faster, less complete) |

### Just collect, no parsing

```cmd
kape.exe --tsource C: --tdest E:\IR\C --target KapeTriage --vhdx out
```

### Just parse a previously-collected source

```cmd
kape.exe --msource E:\IR\C --mdest E:\IR\C\modules --module !ALL --mflush
```

## Useful target groupings

| Target | What it grabs |
|--------|---------------|
| `KapeTriage` | The 80% — `$MFT`, registry, event logs, prefetch, jumplists, browsers, RecycleBin, ShimCache |
| `Antivirus` | Defender / SEP / McAfee / etc. logs |
| `RegistryHives` / `EventLogs` | Specific subsets |
| `Browsers` | Chrome / Firefox / Edge / IE history & cache |
| `RemoteAccessLogs` | TeamViewer / AnyDesk / VNC logs |
| `WebServers` | IIS / Apache logs |
| `EmergencyTriage` | Bare-minimum subset for very large disks |
| `Edge` / `Chrome` / `Firefox` | Single-browser focus |
| `OneDrive` / `Teams` | Cloud-app caches |

## Modules to know

| Module | Output |
|--------|--------|
| `EZTools/MFTECmd` | Parsed `$MFT` CSV |
| `EZTools/PECmd` | Parsed Prefetch |
| `EZTools/RECmd_BatchExamples` | Registry parsing batch |
| `EZTools/JLECmd` | JumpLists |
| `EZTools/LECmd` | LNK files |
| `EZTools/AmcacheParser` | Amcache.hve |
| `EZTools/SBECmd` | Shellbags |
| `EZTools/AppCompatCacheParser` | ShimCache |
| `Hayabusa` | EVTX hunting via Sigma → CSV/HTML |
| `Chainsaw` | Same niche; alternative |
| `Loki` | Yara on collected files |

## Workflows

### IR engineer arrives at desk

1. USB stick with KAPE + KapeFiles.
2. `kape.exe --tsource C: --tdest \\fileshare\IR\$HOSTNAME --target KapeTriage --module !EZParser --mflush --zip $HOSTNAME`.
3. ~5 min later, a zipped triage package + parsed CSVs sits on the share.
4. Pull into Splunk / Timeline Explorer / Excel.

### At fleet scale

KAPE itself is single-host; fleet collection: chain it via Velociraptor's `KAPE.targets.WindowsTriage` artifact → fan-out to thousands.

```vql
SELECT * FROM Artifact.Windows.KapeFiles.Targets(TargetList='KapeTriage')
```

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| `Could not find target file...` | Wrong target name (`!` prefix means group, no `!` is single) |
| Modules don't run | Some require external binaries placed under `bin/` (e.g., MFTECmd) |
| Volume Shadow Copy errors | Run as SYSTEM, not just admin; `--scs` to skip |
| Output huge | Use `EmergencyTriage` and add modules selectively |
| Want JSON | KAPE writes EZ tools default CSV; convert post-hoc with `csv-to-json`/Splunk lookup |

## Defender / IR perspective

KAPE is the **first step** in modern IR. Run it within minutes of an alert; ship to a SIEM/lake. The standard followup:

1. KAPE → triage zip.
2. Push triage zip to Autopsy / Plaso for super-timeline.
3. Run Hayabusa / Chainsaw on EVTX (already collected) for sigma-rule hits.
4. Cross-reference with central EDR telemetry.

## OPSEC

- KAPE on victim host writes to `--tdest` — large file copies trip many EDRs as anomalous I/O. Run from SYSTEM, prefer external USB destination over network share if EDR is sensitive.
- Targeted (`--target ChromeFiles` etc.) collection vs full triage tradeoffs noise vs speed.

## Related tools

| Tool | Niche |
|------|-------|
| **Velociraptor** | Fleet-scale triage / hunt |
| **CyLR** | Lighter cross-platform triage |
| **Magnet RESPONSE** | GUI alternative |
| **Plaso / log2timeline** | Super-timeline from KAPE output |
| **Hayabusa / Chainsaw** | EVTX hunting on KAPE'd logs |
| **Eric Zimmerman tools** | The parsers KAPE invokes — usable standalone |
