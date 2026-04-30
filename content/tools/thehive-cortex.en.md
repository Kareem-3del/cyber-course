# TheHive + Cortex — full tutorial

`TheHive` is the open-source case-management platform for SOC / IR teams. `Cortex` is its analyzer & responder engine — wraps 200+ analyzers (VirusTotal, Shodan, MISP, abuseipdb, …) so case work is one click. Both made by StrangeBee.

## Install

```terminal
# Docker compose — fastest
git clone https://github.com/StrangeBeeCorp/docker
cd docker/thehive
docker compose up -d
# UI: http://localhost:9000
# Cortex: http://localhost:9001
```

Production: separate Cassandra + Elasticsearch + MinIO + TheHive. See StrangeBee docs for sizing.

## Concepts

| Object | Purpose |
|--------|---------|
| **Case** | An incident; holds tasks, observables, comments |
| **Task** | Discrete activity within a case |
| **Observable** | An IOC: IP, domain, hash, file, URL, email |
| **Alert** | Pre-case event (from SIEM webhook) — triage and "promote to case" |
| **TLP / PAP** | Tagging for sharing / permitted-actions |
| **Template** | Pre-defined case + task structure (e.g., "Phishing IR") |
| **Custom field** | Per-case structured data |

## Workflow

### Receiving alerts

Common ingest paths:

- **Splunk → TheHive** alert action.
- **Sentinel Logic App** posts JSON.
- **Email parser** for `phish@yourcorp.com` mailbox.
- **MISP sync** auto-creates alerts from events.

```python
from thehive4py.api import TheHiveApi
from thehive4py.models import Alert, AlertArtifact

api = TheHiveApi("http://thehive:9000", "<APIKEY>")
alert = Alert(
    title="Suspicious sign-in",
    tlp=2,
    severity=2,
    type="O365 Sign-in Anomaly",
    source="Sentinel",
    sourceRef="incident-12345",
    description="...",
    artifacts=[AlertArtifact(dataType="ip", data="1.2.3.4")]
)
api.create_alert(alert)
```

### Triage to case

UI → click alert → **Promote to case** → select template → tasks pre-populate (e.g. for a phishing template: "Block sender", "Pull email from inbox", "Quarantine attachments", "Notify users").

### Run analyzers via Cortex

Inside a case, click an observable → **Run analyzers**. Examples:

- **VirusTotal_GetReport_3_1** — scan + verdict.
- **MISP_2_0** — search MISP for the indicator.
- **Cuckoo_Sandbox_2_0** — submit to Cuckoo.
- **AbuseIPDB_1_0** — abuse score.
- **DNSDB_2_0** — passive DNS.

Output attaches to the observable; analysts read the verdict, set the observable's tags accordingly.

### Run responders via Cortex

Responders **change the world** (block IP, isolate host, disable user). Common:

- **Cisco_Firepower_Block** — push block-rule to firewall.
- **Microsoft_Defender_For_Endpoint_Isolate** — quarantine.
- **MISP_Push_Event** — share IOC.
- **Service_Now** — open ticket.

Approval workflow: responders can require a 2nd analyst confirmation (paid feature in TheHive 5).

## Templates — repeatable IR

Define once: "Phishing", "Lost Laptop", "Suspicious Process", "Ransomware". Each pre-populates:

- Tasks (with descriptions and assignees).
- Custom fields (for SLA, business unit, severity grading).
- Auto-run analyzers on observables on ingest.

Across teams, templates enforce consistency.

## Reporting

- Per-case PDF / Markdown export.
- Custom dashboards (Grafana via TheHive's Cassandra metrics).
- KPIs: mean time to detect/respond/resolve, by team / category.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Cortex analyzer "config required" | API keys not set; Cortex → Organization → Configuration |
| Cassandra OOM | TheHive 5+ bundles CassandraDB tuning; bump heap |
| Slow search | ES index tuning; archive closed cases |
| MISP sync errors | API key TLP; verify both sides agree on sharing group |
| Webhooks fail | TLS / firewall to receiver |

## Defender perspective

TheHive + Cortex is the OSS "core" of an IR program. For SOCs:

- Standardize **every** alert into a case.
- Enforce **task hygiene** — every closed case had every task closed.
- Build templates over time; treat as code (export YAML, version-control).

Pair with: MISP (intel), Velociraptor (data), Sentinel/Splunk (telemetry), YETI (background intel).

## OPSEC (defender)

- Cases hold sensitive case data — secure with mTLS, RBAC, MFA.
- Cortex API keys for VT / Shodan etc. are organization secrets.
- For multi-tenant MSSPs, use TheHive 5's **organisations** feature so each customer is isolated.

## Related tools

| Tool | Niche |
|------|-------|
| **MISP** | The intel side; cases pivot to MISP events |
| **OpenCTI** | More intel-graph-centric than case-centric |
| **PagerDuty / OpsGenie** | Incident-management for ops, not IR |
| **DFIR-IRIS** | OSS IR case management, lighter |
| **ServiceNow SIR** | Commercial heavyweight |
| **Demisto / XSOAR** | Commercial SOAR with deeper playbooks |
