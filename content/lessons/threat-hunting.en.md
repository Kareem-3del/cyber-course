# Threat Hunting — Practical Queries

Detection rules wait for a known pattern. Hunting starts from a **hypothesis** and searches for evidence in your existing telemetry. This lesson gives concrete KQL (Microsoft Sentinel / Defender), Splunk SPL, and Sigma rules — each tied to a hypothesis you can run today.

> [!info] How a hunt cycle works
> Hypothesis → data sources → query → triage → either close or productize as a detection rule. Every closed hunt either finds something, or upgrades your detection coverage.

## Hunt 1 — LOLBAS abuse

**Hypothesis:** A non-Office process is invoking `mshta.exe`, `rundll32`, or `regsvr32` with a URL or `javascript:` argument — strong sign of phishing or LOLBAS staging.

```kql
DeviceProcessEvents
| where FileName in~ ("mshta.exe","rundll32.exe","regsvr32.exe","installutil.exe")
| where ProcessCommandLine has_any ("http://","https://","javascript:","scrobj")
| where InitiatingProcessFileName !in~ ("explorer.exe","WINWORD.EXE","EXCEL.EXE")
| project Timestamp, DeviceName, AccountName, FileName,
          ProcessCommandLine, InitiatingProcessFileName
```

```spl
index=sysmon EventCode=1 (Image="*\\mshta.exe" OR Image="*\\rundll32.exe" OR Image="*\\regsvr32.exe")
| where match(CommandLine,"http(s)?://|javascript:|scrobj")
| where ParentImage!="*\\WINWORD.EXE" AND ParentImage!="*\\EXCEL.EXE"
| stats values(CommandLine) as cmds count by Computer, User, Image, ParentImage
```

## Hunt 2 — Stealthy persistence — scheduled tasks created via WMI

**Hypothesis:** Adversary creating tasks via `wmic process call create schtasks.exe /create` to evade direct schtasks logging.

```kql
DeviceProcessEvents
| where FileName =~ "schtasks.exe" and ProcessCommandLine has "/create"
| where InitiatingProcessFileName in~ ("wmic.exe","mshta.exe","powershell.exe","wmiprvse.exe")
| project Timestamp, DeviceName, AccountName, ProcessCommandLine,
          InitiatingProcessCommandLine, InitiatingProcessFileName
```

## Hunt 3 — Suspicious lsass access

**Hypothesis:** Anything outside known EDR/AV reading the LSASS process is credential theft.

```kql
DeviceProcessEvents
| where Timestamp > ago(7d)
| where FileName =~ "rundll32.exe" and ProcessCommandLine has_all ("comsvcs.dll","MiniDump")
| project Timestamp, DeviceName, AccountName, ProcessCommandLine
```

```sigma
title: LSASS Memory Dump via comsvcs.dll
logsource: { product: windows, category: process_creation }
detection:
  selection:
    Image|endswith: '\rundll32.exe'
    CommandLine|contains|all:
      - 'comsvcs.dll'
      - 'MiniDump'
  condition: selection
level: high
```

## Hunt 4 — Anomalous Kerberos TGT

**Hypothesis:** Golden tickets often have a 10-year lifetime by default — way out of policy. Kerberoast TGS requests with weak encryption.

```kql
SecurityEvent
| where EventID == 4769  // TGS issued
| where TicketEncryptionType in ("0x17","0x18")  // RC4 — sign of Kerberoast
| where ServiceName !endswith "$"  // exclude machine accounts
| summarize Count=count() by TargetUserName, ServiceName, Computer
| where Count > 5
```

```kql
// Suspicious TGT lifetime (golden ticket indicator)
SecurityEvent
| where EventID == 4624 and LogonType == 3
| where AuthenticationPackageName == "Kerberos"
| extend TGTLife = todatetime(TicketLifetime)
| where TGTLife > 24h  // policy is usually 10h
```

## Hunt 5 — Cloud — anomalous OAuth grant

**Hypothesis:** New enterprise app gained `Mail.ReadWrite` or `Files.ReadWrite.All` from a single user consent — classic OAuth phish.

```kql
AuditLogs
| where OperationName == "Consent to application"
| extend AppName = tostring(TargetResources[0].displayName)
| extend ScopeAdded = tostring(parse_json(tostring(ModifiedProperties[0].newValue))[0].ConsentType)
| extend Scopes = tostring(parse_json(tostring(ModifiedProperties[1].newValue)))
| where Scopes has_any ("Mail.ReadWrite","Files.ReadWrite.All","User.Read.All",
                       "Directory.ReadWrite.All","offline_access")
| project TimeGenerated, InitiatedBy, AppName, Scopes
```

## Hunt 6 — Internet-exposed ports change

**Hypothesis:** Adversary opened a new port (4444, 8080, custom) on a server post-compromise for C2 or pivoting.

```spl
index=netflow_baseline earliest=-30d@d latest=-1d@d
| stats values(dest_port) as baseline_ports by src_ip
| join src_ip [
    search index=netflow earliest=-1d
    | stats values(dest_port) as today_ports by src_ip
  ]
| eval new_ports=mvfilter(NOT(today_ports IN(baseline_ports)))
| where mvcount(new_ports)>0
```

## Hunt 7 — Web shell drop indicators

**Hypothesis:** A file with web-server-executable extension was created in a webroot by the web-server process — almost always a webshell.

```kql
DeviceFileEvents
| where Timestamp > ago(7d)
| where FileName matches regex @"(?i)\.(asp|aspx|ashx|jsp|jspx|php)$"
| where FolderPath has_any ("\\inetpub\\","\\xampp\\htdocs\\","\\tomcat\\","\\jboss\\","\\wwwroot\\")
| where InitiatingProcessFileName in~ ("w3wp.exe","httpd.exe","tomcat.exe","java.exe","php-cgi.exe","nginx.exe")
| project Timestamp, DeviceName, FolderPath, FileName, InitiatingProcessFileName
```

## Hunt 8 — DNS tunneling

**Hypothesis:** A host queries an unusually high number of unique subdomains under one parent in a short window.

```spl
index=dns
| eval parent=mvindex(split(query,"."), -2) . "." . mvindex(split(query,"."), -1)
| stats dc(query) as unique_subs values(query) as samples by src_ip parent
| where unique_subs > 200
| sort -unique_subs
```

## Hunt 9 — Domain trust + admin enumeration burst

**Hypothesis:** Just-after-foothold reconnaissance: `nltest /domain_trusts /all_trusts`, `net group "Domain Admins" /domain`, `quser`. All in 60s.

```kql
let recon_cmds = dynamic(["nltest","net group","net user","quser","whoami /all","systeminfo","ipconfig /all"]);
DeviceProcessEvents
| where Timestamp > ago(7d)
| where ProcessCommandLine has_any (recon_cmds)
| summarize Cmds=make_set(ProcessCommandLine), Count=dcount(FileName)
            by DeviceName, AccountName, bin(Timestamp,5m)
| where Count >= 5  // ≥ 5 different recon commands within 5 minutes
```

## Hunt 10 — Service creation for lateral movement

**Hypothesis:** PsExec / SMBExec / WMIExec drop a randomly-named service binary in `ADMIN$`.

```kql
DeviceFileEvents
| where Timestamp > ago(7d)
| where FolderPath has "C:\\Windows\\" and FileName endswith ".exe"
| where FileName matches regex @"^[A-Z]{4,8}\.exe$"  // Impacket pattern
| where InitiatingProcessFileName in~ ("services.exe","System")
| project Timestamp, DeviceName, FolderPath, FileName, SHA256
```

## Hunt 11 — Unusual SAML / token activity

**Hypothesis:** Token replay from an unusual IP, or unusual sign-in frequency for a service principal that normally sits idle.

```kql
SigninLogs
| where ResultType == "0"
| summarize Locations=dcount(Location), IPs=dcount(IPAddress), 
            Apps=make_set(AppDisplayName)
            by UserPrincipalName, bin(TimeGenerated,1h)
| where Locations > 2 or IPs > 5
```

## Hunting cadence

| Cadence | Activity |
|---------|----------|
| Daily (auto) | All hunts above as scheduled queries with thresholds |
| Weekly | Manual review of any "interesting but not alert-worthy" matches |
| Monthly | One **new** hypothesis driven by recent threat intel; productize it |
| Quarterly | Review last quarter's hunts; retire ones that never fire after tuning |

> [!tip] Hunt → detection
> A hunt is a one-time effort; a detection is a permanent asset. Every hunt that surfaces something real should become a Sigma / scheduled query within a sprint. Otherwise your hunt program just generates Slack threads.

## Telemetry checklist (without these, half the hunts above don't run)

- Sysmon (process create, file create, network, image load, named pipe).
- DNS query logs.
- Windows Security log: 4624, 4625, 4648, 4672, 4688, 4769, 4776.
- Microsoft Defender for Endpoint / equivalent EDR.
- Entra ID Sign-in Logs + Audit Logs.
- Cloud control plane logs (CloudTrail, Activity Logs, Audit Logs).
- Web server logs centralized.
- Kubernetes audit log.
