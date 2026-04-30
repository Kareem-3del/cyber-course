# MISP — full tutorial

`MISP` (Malware Information Sharing Platform) is the open-source threat-intel platform. Stores indicators (IOCs), maps them to events, taxonomies, threat actors, kill-chain stages, and shares automatically with peer organizations / ISACs.

## Install

```terminal
# Quickest — Docker
git clone https://github.com/MISP/misp-docker
cd misp-docker
cp template.env .env
docker compose up -d
# UI on https://localhost
```

Bare-metal install via the `MISP/MISP` repo or distro packages — production deployments use Apache + PHP.

## Key concepts

| Object | Purpose |
|--------|---------|
| **Event** | A "case" — campaign, sample, incident |
| **Attribute** | An indicator: IP, domain, hash, URL, mutex, registry key, ... |
| **Object** | Logical group of related attributes (e.g., a "file" object holds md5+sha1+sha256+filename) |
| **Galaxy** | High-level enrichment (Threat Actor, Tool, Sector, etc.) |
| **Taxonomy** | Tag namespace (TLP, MITRE ATT&CK, NIS2, etc.) |
| **Sharing group** | Who can see this event |
| **Feed** | Auto-import of external sources (CIRCL, abuse.ch, AlienVault OTX) |
| **Sighting** | Confirmation that an indicator was seen |

## TLP — sharing tags

| Tag | Meaning |
|-----|---------|
| `tlp:white` | Public |
| `tlp:green` | Community-wide |
| `tlp:amber` | Limited org |
| `tlp:amber+strict` | Need-to-know within org |
| `tlp:red` | Personal disclosure only |

Attach to every event; restricts sharing & API export.

## API — `pymisp`

```terminal
pip install pymisp
```

```python
from pymisp import PyMISP, MISPEvent, MISPAttribute

misp = PyMISP("https://misp.example.com", "<APIKEY>", ssl=False)
ev = MISPEvent()
ev.info = "APT29 phishing wave 2026-04"
ev.distribution = 1   # community
ev.threat_level_id = 2
ev.analysis = 2

attr = MISPAttribute()
attr.type = "domain"; attr.value = "evil.example.com"
ev.add_attribute(**attr)

misp.add_event(ev)
```

Search:

```python
res = misp.search(controller="attributes", value="evil.example.com")
```

## Workflow — daily SOC use

1. **Auto-import feeds** (Settings → Feeds → enable a few high-quality OSS: abuse.ch URLhaus, CIRCL OSINT, MalwareBazaar). Run `MISP cron jobs` so feeds refresh.
2. **Block / detect downstream**: MISP exports IOC lists in many formats (Suricata rules, Sigma, Snort, OpenIOC, STIX 2.1, plain text). Hook your SIEM / firewall:
   - `https://misp/events/restSearch.json` filtered by tag → cron-pull → push into Splunk lookups.
   - `https://misp/feeds/getCsv?id=ALL` → fed to Suricata block lists.
3. **Author own events** during incident response:
   - Click `Add Event`, fill metadata, add IOCs as attributes (auto-typed).
   - Add MITRE ATT&CK galaxies for techniques.
   - Save → publish to your sharing group → peers receive the event automatically (server-to-server sync).

## Server-to-server sync

```
[ MISP A ]  ↔  [ MISP B ] (sync via REST API + sharing-group config)
```

Gold standard: ISACs (FS-ISAC, MS-ISAC, Aviation-ISAC) run a master MISP, members synch.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Feed never updates | Cron not running; `Administration → Workers` |
| Sync fails | Wrong sharing-group/distribution; firewall to peer |
| Slow UI | DB index missing; run `vacuum`/index rebuild |
| Memory blow-up | Limit `MISP_session_lifetime` and feed batch size |
| Duplicate events | Enable correlation; manually merge |

## Defender perspective

MISP unifies your IOC management. Operational use:

- IR opens an event for every incident with IOCs.
- SOC subscribes feeds → SIEM auto-blocks.
- Threat-intel team enriches events with galaxies / sightings.
- Quarterly review of low-signal indicators (deprecated / superseded).

## OPSEC (defender)

- TLP discipline matters: never publish `tlp:red` to a community-wide group.
- Auto-export to Suricata / firewall risks "publishing" your private events to anyone watching network traffic — use scoped exports.
- API keys are bearer; rotate per-integration.

## Related tools

| Tool | Niche |
|------|-------|
| **OpenCTI** | More STIX-2.1 native, graph-rich |
| **TheHive + Cortex** | Case management + analyzer suite (often paired with MISP) |
| **AlienVault OTX** | Proprietary feed; one of MISP's import sources |
| **VirusTotal Intelligence** | Commercial pivot platform |
| **Maltego** | Investigative graph tool |
| **YETI** | Threat-intel framework alternative |
