# Elastic Security (ELK) — full tutorial

`Elastic Security` (formerly the SIEM app of the ELK stack) builds on Elasticsearch + Kibana for log search, dashboarding, and detection rules. Combines Logstash / Beats / Fleet / Endpoint Security agent into a coherent platform. Free + paid (Platinum / Enterprise) tiers.

## Stack components

```
[ Beats / Elastic Agent / Fleet / Logstash ]  →  [ Elasticsearch ]  →  [ Kibana ]
                  │
                  └── Endpoint Security (EDR)
```

| Component | Purpose |
|-----------|---------|
| **Elasticsearch** | Storage + search engine |
| **Kibana** | UI / dashboards / detection rules |
| **Beats / Elastic Agent** | Lightweight shippers (Filebeat, Winlogbeat, Auditbeat, Packetbeat) |
| **Fleet** | Centralized agent management |
| **Endpoint Security** | EDR component (Elastic Agent integration) |
| **Logstash** | Optional ingest / transform pipeline |

## Install (single-node lab)

```terminal
# Docker compose for full stack
git clone https://github.com/elkninja/elastic-stack-docker-part-one
cd elastic-stack-docker-part-one
docker compose up -d
# Kibana on http://localhost:5601 ; ES on 9200
```

For production: install via package manager / Helm; use Fleet for agents.

## Onboarding logs

Two paths:

1. **Elastic Agent + Fleet** (recommended): single agent + integrations enabled in Fleet UI. Each integration ships parsing pipelines.
2. **Beats**: classic. Lighter, but you manage configs directly.

```terminal
# Filebeat for syslog
filebeat modules enable system
filebeat setup -e
systemctl restart filebeat
```

## Detection rules

Kibana → Security → Rules. Two engines:

| Engine | Use |
|--------|-----|
| **Custom Query** | KQL or EQL search; alert on matches |
| **Threshold** | Aggregation-based (e.g., > 5 failed logins / 5 min) |
| **Indicator Match** | Cross-reference threat-intel index |
| **EQL Sequence** | Stateful event-sequence detection |
| **Machine Learning** | Anomaly detection from ML jobs |
| **New Terms** | First-seen-of pattern |

Elastic ships ~1000 prebuilt detection rules — enable selectively.

```kql
event.category : process and process.name : ("powershell.exe" or "pwsh.exe") and
process.command_line : (*-enc* or *-encodedcommand* or *FromBase64String*) and
not process.parent.name : ("ConfigurationManager.exe" or "WindowsAzureGuestAgent.exe")
```

## EQL — event correlation

```eql
sequence by host.id, user.name with maxspan=5m
[process where event.action == "creation" and process.name == "powershell.exe"]
[process where event.action == "creation" and process.parent.name == "powershell.exe"
     and process.name in ("net.exe","whoami.exe","ipconfig.exe")]
```

Triggers when a powershell process spawns recon binaries within 5 minutes — classic post-foothold pattern.

## Timelines

Click any alert → Timeline → drag in related events → annotate. Persists as a saved investigation.

## Cases & SOAR

- Built-in **cases** for tracking incidents.
- Connectors to ServiceNow, Jira, Slack, PagerDuty.
- Elastic AI Assistant (paid) drafts case summaries.

## ECS — Elastic Common Schema

Every field is normalized to ECS (`event.action`, `host.name`, `source.ip`, `process.command_line`). Detection rules are portable across log sources thanks to ECS — pivot from Sysmon, auditd, AWS CloudTrail, Okta with the same query.

## Workflows

### Send Sysmon logs

```terminal
# Windows host
winlogbeat setup
winlogbeat start
# winlogbeat.yml has the Sysmon channel pre-configured
```

Now KQL like `event.code : 1 and process.name : "powershell.exe"` works.

### Cross-correlate AWS + Okta + endpoint

```kql
event.dataset : (okta.system or aws.cloudtrail or endpoint.events.process)
and user.name : "alice"
| sort @timestamp asc
```

### Custom rule for Suspicious Service Install

Create rule (Custom Query) on:

```kql
event.code : 7045 and winlog.event_data.ServiceFileName : (*\\Users\\* or *\\AppData\\* or *.bat or *.cmd or *.ps1)
```

Severity: high. Risk: 75. Notifications: Slack.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| `index_not_found_exception` | Wrong index pattern; check Kibana → Stack Management → Data Views |
| Detection rule not firing | Check schedule + lookback window; many rules use `now-9m` to `now-5m` to allow ingest delay |
| Slow searches | Insufficient ES heap; partition data into hot/warm/cold tiers |
| Field mapping conflicts | Reindex via Index State Management |
| Agent fails to enroll in Fleet | Check enrollment token TTL; firewall to Fleet server :8220 |

## Defender perspective

Elastic Security is the **most flexible** of the open-ish SIEMs. Strengths: free for the SIEM use case; great query UX (KQL/EQL); ECS makes cross-source detection sane; ML jobs are tunable.

Watch the Resource Hunger: ES indexers love RAM. A 200-host environment minimum is 32+ GB RAM hot tier.

## OPSEC (defender)

- ES nodes hold all your security data — secure at rest with encrypted snapshots.
- API keys with `monitor` / `read` only for analysts; `superuser` strictly limited.
- Fleet enrollment tokens leak agent → manager auth; rotate.

## Related tools

| Tool | Difference |
|------|-----------|
| **Splunk** | Heavier, paid, broader connector ecosystem |
| **Microsoft Sentinel** | Cloud-only, KQL-driven |
| **Wazuh** | Bundles agent + indexer; HIDS-centric |
| **Graylog** | Lighter log mgmt; less detection logic |
| **OpenSearch** | Elasticsearch fork with security plugin |
