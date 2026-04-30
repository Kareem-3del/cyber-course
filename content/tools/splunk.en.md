# Splunk — full tutorial

`Splunk` is the long-standing enterprise SIEM. Strengths: powerful SPL, rich connector ecosystem, mature security content (Splunk ES, ESCU). Weaknesses: licensing cost, resource hunger.

## Editions

| Edition | Use |
|---------|-----|
| **Free** | Local lab only; no auth, capped at 500MB/day |
| **Splunk Enterprise** | Self-host; license per ingest GB/day |
| **Splunk Cloud** | Hosted |
| **Splunk ES** | Premium SIEM app — ship with ESCU detection content |
| **Splunk SOAR** (Phantom) | Orchestration / playbooks |

## Component model

```
[ Forwarders / HEC ]  →  [ Indexers ]  →  [ Search head(s) ]  →  [ User ]
```

| Component | Purpose |
|-----------|---------|
| **Universal Forwarder** | Lightweight log shipper |
| **Heavy Forwarder** | Forwarder that can also parse |
| **HEC** | HTTP Event Collector |
| **Indexer** | Stores data, splits into buckets, runs search workers |
| **Search head** | Dispatches and merges searches |
| **Cluster master / deployer / license master** | Various coord roles |

## SPL — Search Processing Language

```
index=sysmon EventCode=1 Image="*\\powershell.exe"
| where match(CommandLine,"FromBase64String|IEX|Invoke-Expression|-encoded")
| stats values(CommandLine) as cmds count by Computer User
| where count > 3
```

Pipeline of commands separated by `|`:

| Family | Examples |
|--------|----------|
| Filtering | `where`, `search` |
| Transforming | `eval`, `rex` |
| Aggregation | `stats`, `tstats`, `chart`, `timechart` |
| Sorting | `sort`, `head`, `tail`, `dedup` |
| Joining | `join`, `lookup`, `multisearch` |
| Time | `bucket _time span=5m`, `relative_time(now(),"-1d")` |
| Output | `outputlookup`, `collect index=summary` |
| Iteration | `mvexpand`, `streamstats`, `eventstats` |

## Common SPL patterns

### Top-N

```
index=auth_logs failed_login=true
| top src_ip limit=10
```

### Time-series

```
index=net | timechart span=5m count by status
```

### Detection — anomalous parent → child

```
index=sysmon EventCode=1
| stats values(ParentImage) as parents count by Image
| where count < 10 AND mvcount(parents) > 5
```

### Lookup-driven enrichment

```
index=auth_logs | lookup users.csv user OUTPUT department title
| stats count by department
```

## Splunk ES (premium)

- **Notable Events Framework** — every detection produces a notable; dispatcher manages investigations.
- **Risk-Based Alerting** — events tagged with risk score; alert when accumulated risk > threshold.
- **Enterprise Security Content Update (ESCU)** — Splunk's threat-research-team-curated detection library, updated weekly.
- **Asset / Identity Framework** — joins logs to known assets / users.

ESCU app: `Apps → Enterprise Security Content Update → Browse` to enable detections.

## Configuration files

| File | Purpose |
|------|---------|
| `inputs.conf` | What to read from disk / network |
| `props.conf` | Source-type definition (TIME_FORMAT, LINE_BREAKER, TRANSFORMS) |
| `transforms.conf` | Field extraction, sourcetype routing |
| `outputs.conf` | Forwarder destinations |
| `indexes.conf` | Index settings (retention, paths) |
| `savedsearches.conf` | Scheduled searches / alerts |
| `eventtypes.conf` | Named query shortcuts |
| `tags.conf` | ECS-like tagging |

```
# inputs.conf
[monitor:///var/log/nginx/access.log]
disabled = false
sourcetype = nginx:access
index = web

# props.conf
[nginx:access]
TIME_FORMAT = %d/%b/%Y:%H:%M:%S %z
SHOULD_LINEMERGE = false
TRANSFORMS-redact = redact-cookies
```

## Workflows

### Build a detection from sample event

1. Run an exploratory search; find the unique attributes.
2. Tighten with `where` clauses.
3. Verify against known-good period — false positives.
4. Save as Alert: schedule + threshold + actions (email / webhook / ServiceNow / SOAR playbook).

### Use Splunk Risk-Based Alerting

```
... | rba_score = 30 | sendnotablerisk
```

Each rule contributes to a risk score; the framework alerts only when risk crosses threshold for an entity.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| `Search not finalized due to timeout` | Crank `dispatch.timeout`, or use `tstats` (datamodel-accelerated) |
| Field extraction missing | `props.conf` not deployed; `splunk btool props list <sourcetype>` to debug |
| Indexers full | Increase license (or trim retention via `indexes.conf` `frozenTimePeriodInSecs`) |
| Detection misses | Lookback window mis-set; verify with `index=_internal sourcetype=scheduler` |
| Slow at-scale searches | Build a data model + acceleration |

## Defender perspective

Splunk's killer feature is `tstats` over accelerated data models — same query, sub-second on years of data. Pair with ESCU for instant high-quality detection content.

Cost is the constraint: GB/day × $/GB-day × 365 → seven figures fast. Tune sourcetypes and pre-filter on forwarders.

## OPSEC (defender)

- Splunk admin = god-mode over all org data; restrict.
- Field-level masking via `SEDCMD` for PII.
- HEC tokens are bearer; rotate.

## Related tools

| Tool | Difference |
|------|-----------|
| **Elastic Security** | OSS-leaning; cheaper |
| **Microsoft Sentinel** | Cloud-native; KQL |
| **Sumo Logic** | SaaS SIEM |
| **Devo** | High-performance SIEM |
| **Cribl** | Data routing / shaping in front of Splunk |
| **Sigma** | Backend-agnostic detection rules; converts to SPL via `sigmac` |
