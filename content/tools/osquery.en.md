# osquery — full tutorial

`osquery` exposes the operating system as a relational SQL database. Query running processes, kernel modules, network sockets, scheduled tasks, browser plugins, USB devices — all via standard SELECT statements. Great for fleet-wide audits and as part of a custom EDR.

## Install

```terminal
brew install osquery
apt install osquery
choco install osquery
```

Three modes:
- `osqueryi` — interactive REPL (no daemon required).
- `osqueryd` — long-running daemon, scheduled queries.
- `osqueryctl` — service wrapper.

## Tables — the data model

osquery exposes hundreds of tables. List them:

```terminal
osqueryi
osquery> .tables
osquery> .schema processes
osquery> SELECT name, version FROM osquery_info;
```

| Table | What |
|-------|------|
| `processes` | Live processes |
| `process_open_sockets` | Process ↔ socket map |
| `process_open_files` | Process ↔ open file |
| `users / groups / logged_in_users` | Identity |
| `etc_hosts / etc_passwd / shell_history` | Linux-specific |
| `routes / interface_addresses / arp_cache` | Network |
| `listening_ports` | Open listeners |
| `kernel_modules` | Linux |
| `usb_devices` | All OS |
| `chrome_extensions / firefox_addons / safari_extensions` | Browser plugins |
| `crontab / launchd / systemd_units / scheduled_tasks` | Persistence |
| `file` (with `WHERE path = ...`) | File metadata |
| `hash` (with `WHERE path = ...`) | File hashing |
| `mounts / disk_encryption / iptables / dns_resolvers` | System config |
| `certificates` | OS cert store |
| `windows_security_products` | AV / EDR detection |
| `windows_optional_features` | Telnet client / IIS / etc. |

## Common queries

```sql
-- Persistence: scheduled tasks created in last 7 days
SELECT name, action, last_run_time, hidden, enabled
FROM scheduled_tasks
WHERE last_modified_time > (strftime('%s','now') - 86400*7);

-- Suspicious listening ports
SELECT pid, name, port, address
FROM listening_ports lp JOIN processes p USING(pid)
WHERE port NOT IN (22, 80, 443, 53);

-- Loaded kernel modules without signature (Linux rootkit hunt)
SELECT * FROM kernel_modules WHERE state != 'live';

-- Browser extension review
SELECT name, version, identifier, install_time, path
FROM chrome_extensions WHERE persistent = 1;

-- Suspicious binaries running from Temp (Windows)
SELECT p.pid, p.name, p.path, p.cmdline, p.start_time, h.sha256
FROM processes p
JOIN hash h ON p.path = h.path
WHERE p.path LIKE 'C:\\Users\\%AppData\\Local\\Temp\\%';
```

## Scheduled queries (osqueryd)

`/etc/osquery/osquery.conf`:

```json
{
  "schedule": {
    "running_processes": {
      "query": "SELECT pid, name, path, cmdline FROM processes;",
      "interval": 600,
      "removed": false
    },
    "listening_ports": {
      "query": "SELECT * FROM listening_ports;",
      "interval": 300
    },
    "etc_hosts_changes": {
      "query": "SELECT * FROM etc_hosts;",
      "interval": 60,
      "removed": true
    }
  },
  "options": {
    "logger_plugin": "filesystem",
    "logger_path": "/var/log/osquery/"
  }
}
```

`removed: false` = only emit current snapshot diffs. The "differential" results stream — perfect for SIEM ingest.

## Fleet — central management

osquery itself has no central console. Common managers:

| Tool | Notes |
|------|-------|
| **Fleet** (FleetDM) | Full UI, queries-on-demand, distributed |
| **Kolide K2** | Endpoint telemetry + user-side |
| **Doorman** | Older OSS manager |
| **Custom TLS API** | Self-host `tls` plugin endpoint |

```terminal
docker run -p 1337:1337 fleetdm/fleet
# Add hosts via UI → it gives you osquery enroll secret
```

## Workflows

### Live hunt across fleet

In Fleet UI: New Query → paste SQL → run live → results from each host stream back.

### Differential snapshots → SIEM

Configure `osqueryd` to emit JSON to filesystem; Filebeat ships to ES; Kibana dashboards.

### Detection — first execution of a binary

```sql
SELECT path, sha256
FROM file
JOIN hash USING(path)
WHERE path = '/tmp/.evil'
```

Pair with FleetDM's "first seen" tag → alert on truly new files.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Query takes forever | Some tables (`file`, `hash`) globally scan; always add `WHERE path = ...` |
| Permission errors | Run as root / admin |
| Tables missing on macOS | SIP-restricted — install `osquery.pkg` from official; grant Full Disk Access |
| Daemon high CPU | Schedule intervals too aggressive; tune |
| Rules outputs differential noise | Diff mode is sensitive; switch to snapshot mode for stable tables |

## Defender perspective

osquery is the **build-your-own-EDR** building block. Use cases:

- Compliance: continuous CIS-style audits.
- Hunting: cross-fleet "find anything matching X".
- IR: real-time queries during an incident.

Pair with Sysmon (Windows) for process create + DLL load detail osquery alone doesn't cover.

## OPSEC (defender)

- osquery enroll secret = trust anchor; rotate.
- Queries are visible to anyone with access to the manager — design for need-to-know.

## Related tools

| Tool | Niche |
|------|-------|
| **Velociraptor** | Similar live-fleet querying, more DFIR-rich |
| **GRR Rapid Response** | Older Google offering |
| **EDR-X / Wazuh** | Bundled SIEM/agent stacks |
| **Auditbeat** | Lightweight Linux equivalent for some tables |
