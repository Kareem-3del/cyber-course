# Wazuh — full tutorial

`Wazuh` is the open-source XDR / SIEM. Combines OSSEC-derived agent (HIDS), centralized log analysis, file integrity monitoring, vulnerability detection, and indicator-of-compromise matching. Bundles Elasticsearch + Kibana (now "Wazuh Dashboard") for visualization.

## Architecture

```
[ Wazuh agent on each host ] → [ Wazuh manager ] → [ Wazuh indexer (Elasticsearch fork) ] → [ Wazuh dashboard ]
```

Agents push data over encrypted TCP/1514 by default.

## Install — single-node (lab / SMB)

```terminal
curl -sO https://packages.wazuh.com/4.7/wazuh-install.sh
sudo bash wazuh-install.sh -a
```

Output prints an admin password; dashboard at `https://<server>` (port 443).

For production, separate components onto multiple nodes:

```terminal
sudo bash wazuh-install.sh --wazuh-server-installation
sudo bash wazuh-install.sh --wazuh-indexer-installation
sudo bash wazuh-install.sh --wazuh-dashboard-installation
```

## Agent install (most distros)

```terminal
WAZUH_MANAGER='wazuh.example.com' apt install wazuh-agent
systemctl enable --now wazuh-agent
```

Or via MSI on Windows:

```cmd
msiexec.exe /i wazuh-agent-4.7.x.msi /q WAZUH_MANAGER='wazuh.example.com'
NET START WazuhSvc
```

## Modules in the agent

| Module | Purpose |
|--------|---------|
| `logcollector` | Tail logs (syslog, eventlog, custom) |
| `syscheck` | File integrity monitoring (FIM) |
| `rootcheck` | Anti-rootkit checks |
| `sca` | Security Configuration Assessment (CIS-style) |
| `vulnerability-detector` | Match installed packages → CVEs |
| `command` | Run scheduled commands, ship output |
| `osquery` | Optional osquery integration |
| `cdb-list` | Threat-intel block lists |
| `active-response` | Auto-respond on rules (block IP, kill process) |
| `inventory` | Hardware/OS/process/installed-pkg snapshot |

## Rules / decoders

Rule files: `/var/ossec/etc/rules/local_rules.xml` (and many in `ruleset/rules/`).

```xml
<group name="local,syslog,sshd,">
  <rule id="100100" level="10">
    <if_sid>5712</if_sid>
    <regex>Failed password for root from</regex>
    <description>SSH root brute force from $(srcip)</description>
    <mitre><id>T1110</id></mitre>
  </rule>
</group>
```

Levels 0–15. Level 12+ usually triggers alerts to dashboard / email / webhook.

## Active Response

Wazuh can fire scripts on a host when a rule triggers — the most common are firewall block (`firewall-drop`), kill-process, disable-account.

```xml
<active-response>
  <command>firewall-drop</command>
  <location>local</location>
  <rules_id>100100</rules_id>
  <timeout>300</timeout>
</active-response>
```

## Vulnerability detector

Polls NVD + Canonical OVAL + Red Hat OVAL + ALAS feeds, correlates with each agent's installed-package inventory.

```xml
<wodle name="vulnerability-detector">
  <enabled>yes</enabled>
  <interval>5m</interval>
  <ignore_time>6h</ignore_time>
  <run_on_start>yes</run_on_start>
  <provider name="nvd">
    <enabled>yes</enabled>
  </provider>
</wodle>
```

Dashboard → Vulnerabilities tab shows per-host CVE list with severity.

## Workflows

### File integrity monitoring (FIM) on `/etc`

```xml
<syscheck>
  <directories check_all="yes" report_changes="yes" realtime="yes">/etc</directories>
  <directories check_all="yes" realtime="yes">/usr/bin,/usr/sbin</directories>
  <ignore>/etc/mtab</ignore>
</syscheck>
```

Modifications produce alerts at level 7+.

### Sysmon ingestion (Windows)

Install Sysmon with SwiftOnSecurity config; tell agent to ship the channel:

```xml
<localfile>
  <location>Microsoft-Windows-Sysmon/Operational</location>
  <log_format>eventchannel</log_format>
</localfile>
```

Wazuh's bundled rules already understand Sysmon EID 1 / 3 / 8 / 11 / 22 etc.

### Threat intel — block list

```xml
<cdb-list>
  <name>etc/lists/blocked-ips</name>
  <type>list</type>
</cdb-list>
```

Then a rule:

```xml
<rule id="100200" level="12">
  <if_sid>4515</if_sid>
  <field name="dstip">$(blocked-ips)</field>
  <description>Outbound to known-malicious IP</description>
</rule>
```

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Agent connects but no events | `selinux` / `apparmor` blocks `ossec`; check `/var/ossec/logs/ossec.log` |
| Indexer disk fills | Set `xpack.security.enabled=true`, set ILM policy to delete-after-N-days |
| Wrong rule level | Edit `local_rules.xml` to override default level |
| Vulnerability detector returns 0 | Wait for first scan; verify provider enabled in `ossec.conf` |
| Dashboard slow | Indexer needs 4+ GB heap |

## Defender perspective

Wazuh is **the** open-source SIEM/XDR for SMBs and labs. For larger enterprises, often used alongside Splunk or Elastic.

Strengths: agent-side FIM and SCA mean less log-volume than EDR-only stacks. Weaker than commercial EDRs at advanced behavior detection — pair with Sysmon + Sigma for parity.

## OPSEC (defender)

- Manager IP / hostname is exposed to every agent — protect manager port (1514) at perimeter.
- Agent registration password (default empty in lab) — set in production.
- Logs may contain secrets — TLS to indexer, encrypted disk.

## Related tools

| Tool | Niche |
|------|-------|
| **Elastic Security** | Tighter Elastic integration; commercial |
| **Splunk** | Industry-standard SIEM (paid) |
| **OSSEC** | Wazuh's parent project |
| **Microsoft Sentinel** | Cloud SIEM on Azure Log Analytics |
| **Graylog** | Log management with security extensions |
| **SecurityOnion** | Distro bundling Suricata / Zeek / Wazuh |
