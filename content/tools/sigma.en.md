# Sigma — full tutorial

`Sigma` is a generic signature format for log-based detections. Write a rule once in YAML; convert it to KQL / SPL / Elastic / Sentinel / Chronicle / etc. queries via `sigmac` (or its successor `pySigma`). The "YARA for logs."

## Install converters

```terminal
pipx install sigma-cli           # modern; pySigma-based
sigma --help

# legacy:
pip install sigmatools
sigmac --help
```

Backends are pluggable:

```terminal
sigma plugin install splunk
sigma plugin install kusto       # Sentinel / Defender
sigma plugin install elasticsearch
sigma plugin install opensearch
sigma plugin install chronicle
sigma plugin install qradar
sigma plugin install sentinelone
```

## Rule structure

```yaml
title: Mimikatz LSASS Dump via comsvcs.dll
id: 7af2cba1-ce0e-4d39-9d52-31e2c8b3a7e4
status: stable
description: >
    Detects use of comsvcs.dll's MiniDump function to dump lsass via rundll32.
references:
    - https://github.com/SwiftOnSecurity/sysmon-config
author: Florian Roth
date: 2026/04/30
tags:
    - attack.credential_access
    - attack.t1003.001
logsource:
    product: windows
    category: process_creation
detection:
    selection:
        Image|endswith: '\rundll32.exe'
        CommandLine|contains|all:
            - 'comsvcs.dll'
            - 'MiniDump'
    filter:
        ParentImage|endswith: '\Trusted-EDR.exe'
    condition: selection and not filter
falsepositives:
    - Legitimate forensic dump by IR team (rare)
level: high
```

## Anatomy

| Field | Purpose |
|-------|---------|
| `title / id / status / description / references / author / date / tags` | Metadata |
| `logsource: product / service / category` | Field-mapping context |
| `detection: <selection name>` | Named match block |
| Modifier syntax: `field|contains`, `field|endswith`, `field|re`, `field|base64`, `field|wide`, `field|cidr`, `field|all` | Match transformations |
| `condition:` | Boolean over selections (`selection_a and not filter`, `1 of selection_*`, `count() by user > 5`) |
| `level:` | `informational`, `low`, `medium`, `high`, `critical` |
| `falsepositives:` | Documentation |

## Compile to a backend

```terminal
sigma convert -t splunk    rules/lsass_dump.yml
sigma convert -t kusto     rules/lsass_dump.yml
sigma convert -t es-qs     rules/lsass_dump.yml
sigma convert -t sentinel  rules/lsass_dump.yml -o output.json
sigma convert -t splunk -p sysmon -p windows-audit  rules/    # full directory
```

`-p <pipeline>` applies field-mapping pipelines (e.g., for Sysmon channel name, Defender table mapping).

Pipelines worth knowing:

- `sysmon` — Sysmon-specific field names.
- `windows-audit` — native Windows event field names.
- `microsoft_xdr` — Defender XDR Advanced Hunting tables.
- `aurora` — Nextron Aurora agent format.
- `crowdstrike_falcon` — Falcon Insight events.

## Rule sources

- **SigmaHQ/sigma** — official community repo, ~3,000 rules.
- **Florian Roth's threat-detection rules** (commercial Aurora / Nextron Sigma rules).
- **Red Canary / Splunk Threat Research / DFIR Report** — periodic releases.

## Workflow

### Convert + deploy in CI

```terminal
git clone https://github.com/SigmaHQ/sigma
cd sigma
sigma convert -t kusto -p microsoft_xdr rules/windows/process_creation -o /tmp/kql/
# Then iterate /tmp/kql/*.kql onto Sentinel via Logic Apps or AzCLI
```

### Validate rules

```terminal
sigma check rules/        # lint syntax + tag spelling
sigma test rules/lsass_dump.yml --backend splunk
```

### Cross-tool migration

Wrote 200 rules in your old SIEM? Translate them once to Sigma, deploy to your new SIEM via the relevant backend.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| `KeyError: ProcessCommandLine` after backend convert | Wrong pipeline; add `-p sysmon` |
| Generated query has `*` everywhere | Modifier missing; use `|contains` or `|endswith` |
| Output too noisy | Add `filter:` block + `condition: selection and not filter` |
| Backend doesn't support a feature | Try alternative pipeline; some backends limit `count()` aggregation |

## Defender perspective

Sigma is the **lingua franca** of detection sharing in 2024–2026. Cross-tool portability means you can rotate SIEM vendors without rewriting your detection library.

Operational pattern:

1. Author / fork sigma rules in a Git repo per detection-engineering team.
2. CI converts to your live SIEM(s).
3. Pull-request workflow for new detections.
4. Pair with **Atomic Red Team** for testing — every sigma rule should have a corresponding atomic that triggers it.

## OPSEC (operator-side)

- Sigma rules describe detections by content. Adversaries reading SigmaHQ can change tooling to evade specific rules — constant cat-and-mouse.
- Tracking: subscribe to SigmaHQ commit feed and assess each new rule against your current TTPs.

## Related tools

| Tool | Niche |
|------|-------|
| **YARA** | Same idea but for files / memory |
| **Hayabusa / Chainsaw** | Sigma-aware EVTX hunters |
| **uncoder.io** | Web UI for sigma → SIEM-language conversion |
| **Kestrel Threat Hunting Language** | Higher-level hunt language |
| **Atomic Red Team** | Test rules with realistic attack atoms |
