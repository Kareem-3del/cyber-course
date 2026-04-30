# Chainsaw / Hayabusa — full tutorial

`Chainsaw` (F-Secure / WithSecure) and `Hayabusa` (Yamato Security) are Rust-fast Windows EVTX hunters. Feed them a folder of `.evtx` files plus a Sigma ruleset and they emit hits in CSV / JSON / HTML in seconds. The IR analyst's first move once event logs are in hand.

## Install

```terminal
# Chainsaw
brew install chainsaw         # or grab release
chainsaw --version

# Hayabusa
wget https://github.com/Yamato-Security/hayabusa/releases/latest/download/hayabusa-X.X.X-linux-gnu.zip
```

Both ship pre-tuned mapping configs that already understand Sysmon, native Windows logs, AMSI, PowerShell, etc.

## Chainsaw — usage

### `hunt` (Sigma rules)

```terminal
chainsaw hunt -s sigma/ -r mappings/sigma-event-logs-all.yml ./evtx-folder/ \
  --output hits.csv --csv
chainsaw hunt -s sigma/ -r mappings/... ./evtx/ --output hits.json --json
```

| Flag | Purpose |
|------|---------|
| `-s <dir>` | Sigma rules directory |
| `-r <file>` | Field mapping file |
| `--csv / --json / --jsonl` | Output format |
| `-o <file>` | Output |
| `--from / --to` | Date range filter |
| `--full` | Include matching event JSON |
| `--rule <yml>` | Specific rule |
| `--level critical,high` | Severity floor |
| `-q` | Quiet (no banner) |
| `--metadata` | Include rule metadata in output |

### `search` (regex / EID filter — fast triage)

```terminal
chainsaw search -t "Event.System.EventID: =4624" ./evtx/
chainsaw search -e 'cmd.exe' ./evtx/
```

### `analyse`

```terminal
chainsaw analyse shimcache    # Parse ShimCache from registry hive
chainsaw analyse srum         # SRUM database
```

## Hayabusa — usage

```terminal
# Pull rules
hayabusa update-rules

# Run a hunt against a folder
hayabusa csv-timeline -d ./evtx -o timeline.csv -p super-verbose
hayabusa json-timeline -d ./evtx -o timeline.json
hayabusa html-summary -d ./evtx -o summary.html

# Live (single host triage)
hayabusa logon-summary  # logon stats from Security.evtx
hayabusa metrics
hayabusa search -k 'powershell -ec' -d ./evtx
```

| Subcommand | Purpose |
|-----------|---------|
| `csv-timeline / json-timeline` | Detection runs + timeline |
| `html-summary` | Pretty exec summary |
| `logon-summary` | Auth posture |
| `metrics` | Event-volume stats |
| `search` | Quick regex search |
| `pivot-keywords` | Keyword pivot tables |
| `update-rules` | Pull latest sigma + Hayabusa-specific rules |

| Flag | Purpose |
|------|---------|
| `-d <dir>` | Source directory |
| `-l <file>` | Single file |
| `-o <file>` | Output |
| `-m <level>` | Min level (`critical`, `high`, `medium`, `low`, `informational`) |
| `--no-color` | CI mode |
| `-p <profile>` | Output profile (`minimal`, `standard`, `verbose`, `super-verbose`) |
| `-q` | Quiet |
| `-J / -L` | JSON / JSONL |

Hayabusa ships its own rule pack on top of Sigma — well-tuned for Sysmon Channel + Defender ATP + AMSI / PowerShell logs.

## Workflows

### After KAPE collected EVTX

```terminal
# KAPE put EVTX under E:\IR\HOST\C\Windows\System32\winevt\Logs
chainsaw hunt -s ~/sigma/rules/windows -r ~/chainsaw/mappings/sigma-event-logs-all.yml \
              E:/IR/HOST/C/Windows/System32/winevt/Logs --csv -o hits.csv

hayabusa csv-timeline -d E:/IR/HOST/C/Windows/System32/winevt/Logs -o timeline.csv
hayabusa html-summary -d E:/IR/HOST/C/Windows/System32/winevt/Logs -o summary.html
```

Open `summary.html` for an exec-friendly view; `hits.csv` for the technical drilldown.

### Tight scope

```terminal
chainsaw hunt -s sigma/rules/windows/process_creation \
  --rule sigma/.../proc_creation_win_susp_ntdsutil.yml ./evtx/
```

### Filtering by date during long timeframes

```terminal
chainsaw hunt --from 2026-04-25 --to 2026-04-30 ...
```

## Good output

Chainsaw CSV columns: timestamp, name, level, source, channel, event_id, computer, user, process, command_line, src_ip, dest_ip — ready to triage in Excel or Splunk.

Hayabusa HTML summary gives:

- Top detections by count.
- Detection over time chart.
- Per-rule severity breakdown.
- Notable event clusters.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| `Found 0 hits` on known compromise | Wrong mapping file (`sigma-event-logs-all.yml` vs sysmon mapping); check field names |
| Massive false positives | Use `--level high` only; tune Sigma rules |
| Tool slow on huge logs | Both are Rust-fast; if slow, disk I/O is the bottleneck |
| Different rule packs disagree | Combine — chainsaw + hayabusa give complementary coverage |

## Defender / IR perspective

These two are **first move** in any incident where you have EVTX:

1. KAPE / Velociraptor → collect.
2. Chainsaw / Hayabusa → detect.
3. Plaso → super-timeline.
4. Manual triage anchored on the highest-fidelity hits.

Hayabusa's logon-summary is a cheap way to spot post-compromise lateral movement (rare account suddenly on many hosts).

## Related

| Tool | Niche |
|------|-------|
| **EvtxECmd** (Eric Zimmerman) | EVTX → CSV converter only |
| **Sigma CLI** | Generic sigma runner across many backends |
| **Aurora** (Nextron) | Commercial real-time agent, sigma-based |
| **Sigmac** | Sigma → backend-specific query translator |
| **DeepBlueCLI** | Older PowerShell-based EVTX hunter |
