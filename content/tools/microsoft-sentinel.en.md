# Microsoft Sentinel — full tutorial

`Microsoft Sentinel` is the cloud-native SIEM/SOAR built on Azure Log Analytics. KQL-driven, integrates seamlessly with Defender XDR, Entra ID, M365, and a growing connector ecosystem (90+ data sources). Pay-per-GB ingest pricing.

## Setup

1. Azure portal → create a Log Analytics workspace.
2. Onboard Sentinel → connect to that workspace.
3. Sentinel → Data connectors → enable: Defender XDR, Entra ID, AAD Sign-ins, Office 365, Azure Activity, etc. — most are one-click.

## Connectors that matter

| Source | Data |
|--------|------|
| Defender XDR | endpoint events |
| Entra ID Sign-ins / Audit Logs | identity events |
| Office 365 | mail / Teams / SharePoint audit |
| Azure Activity | management plane |
| AWS CloudTrail | via S3-pull connector |
| GCP Logging | via Pub/Sub |
| Threat Intelligence (TIP / TAXII) | IOC feeds |
| Syslog / CEF | via Linux forwarder |
| Custom (Logstash / DCR / Logs Ingestion API) | anything REST-postable |

## Query language — KQL

```kql
SecurityEvent
| where TimeGenerated > ago(7d)
| where EventID == 4625 and FailureReason has "0xc000006d"
| summarize Failures = count() by Account, IpAddress, bin(TimeGenerated,1h)
| where Failures > 50
| order by Failures desc
```

KQL is the same language used by Defender Advanced Hunting, Azure Resource Graph, Application Insights — once-and-everywhere skill.

## Analytics rules

| Type | Use |
|------|-----|
| **Scheduled** | Run KQL every N min, alert on results |
| **NRT (Near Real Time)** | Tightly scoped; lower latency |
| **Microsoft Security** | Forward Defender alerts |
| **Fusion** | Built-in ML correlation across sources |
| **ML Behavioral** | Microsoft-trained UEBA |
| **Threat Intelligence** | Auto-match logs vs IOC table |
| **Anomaly** | UEBA-style standalone rules |

```kql
// Scheduled rule: suspicious OAuth consent
let priviligedScopes = dynamic([
    "Mail.ReadWrite","Files.ReadWrite.All","Directory.ReadWrite.All"]);
AuditLogs
| where OperationName =~ "Consent to application"
| extend scopes = tostring(parse_json(tostring(ModifiedProperties[1].newValue)))
| where scopes has_any (priviligedScopes)
| project TimeGenerated, InitiatedBy, scopes, TargetResources
```

Set: severity High, MITRE: Initial Access (T1566.002), grouping by `InitiatedBy`, suppress duplicates 1h.

## Workbooks

Built-in dashboards (entity insights, identity health, network discovery). Custom workbooks via the Kusto query + visualization editor.

## Incidents

Alerts auto-fold into Incidents. Each incident has:
- Entities (users, hosts, IPs).
- Alert sequence + timeline.
- Comments.
- Suggested investigation queries.
- Built-in playbook trigger.

## Playbooks (Logic Apps)

`+ Add → Playbook (Logic App)` triggered by incident creation. Common actions:
- Disable user (Entra ID action)
- Isolate device (Defender for Endpoint action)
- Block IP (Azure Firewall action)
- Send Slack message
- Open ServiceNow ticket
- Wait for analyst approval before next action

## UEBA

Sentinel learns per-user baselines; `IdentityInfo`, `BehaviorAnalytics` tables expose:
- Sign-in score (anomaly).
- Investigation Priority Score.
- Activities by entity over time.

```kql
BehaviorAnalytics
| where InvestigationPriority > 5
| order by InvestigationPriority desc
```

## Watchlists

Static / dynamic lists of entities (VIP users, dangerous IPs, terminated employees) used in detections:

```kql
SigninLogs
| where UserPrincipalName in (_GetWatchlist('VIPs'))
| where ResultType != 0
```

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Connector ingest gap | Workspace ID/key rotation; check `Heartbeat` table |
| Detection rule never fires | Check schedule and lookback; many rules use `now() - 5m` ingest delay |
| KQL `'Foo' not bound` | Field name differs across sources; query the table schema with `getschema` |
| Cost spike | Audit ingest with `Usage | summarize sum(Quantity) by Solution`; trim noisy sources |
| Long query times | Add explicit time filter; use `summarize` early; partition with `parallel` operator |

## Defender perspective

Sentinel's biggest advantage is the **tight Defender XDR integration** — endpoint, identity, mail, cloud-app data flows in pre-correlated. For Microsoft-heavy enterprises this saves months of integration work.

Watch the cost: `SecurityEvent` and `WindowsEvent` tables can balloon. Use **DCR** (Data Collection Rules) to filter at ingest, route low-value to Basic/Auxiliary tier.

## OPSEC (defender)

- Workspace access controlled via Azure RBAC; restrict `Microsoft Sentinel Reader` vs `Contributor`.
- KQL queries logged to Audit Log — analyst activity is auditable.
- For private use, link to a private endpoint VNet to avoid public ingestion endpoints.

## Related tools

| Tool | Difference |
|------|-----------|
| **Splunk** | Self-host or cloud, paid SIEM |
| **Elastic Security** | OSS-friendly |
| **Microsoft Defender XDR** | The "endpoint / identity / mail" side feeding Sentinel |
| **Azure Monitor** | Sentinel's underlying log platform |
| **Sigma** | Convert sigma to KQL via `sigmac` |
