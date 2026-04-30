# Critical Infrastructure — What Governments Defend (and Hunt)

When a state cyber unit is told "pre-position for crisis," the targets aren't email servers — they're the systems whose failure causes physical impact: power, water, fuel, telecom, transport, finance. CISA's 16 sectors are the canonical list. This lesson walks through what those systems look like, how they get reached, and where defenders consistently fall short.

> [!danger] Highest-impact, highest-scrutiny domain
> ICS/OT compromise can endanger lives. All work must be in dedicated isolated labs (e.g., GRFICSv3, T-Pot OT, Conpot, ICSrange) or under written ICS pentest authorization with safety case approval.

## The 16 sectors at a glance

| Sector | Why states care |
|--------|----------------|
| Energy (electric, oil, gas) | Cascade failures, geopolitical leverage |
| Water & wastewater | Health impact, often weakest defenses |
| Communications (telco, ISP, satellite) | SIGINT pre-position, comms denial |
| Financial services | Sanctions evasion, market disruption |
| Healthcare & public health | Coercive pressure during crisis |
| Transportation (aviation, maritime, rail) | Logistics disruption |
| Food & agriculture | Strategic supply leverage |
| Government facilities | Continuity of government |
| Defense industrial base | Capability theft, sabotage |
| Nuclear | Safety + deterrent integrity |
| Chemical | Safety, environmental |
| Critical manufacturing | Supply choke points |
| Dams | Flood risk, regional power |
| Emergency services | Response degradation |
| Information technology | Underpins all others |
| Commercial facilities | Mass-impact venues |

## Why OT is different from IT

```
IT mantra: Confidentiality > Integrity > Availability
OT mantra: SAFETY > Availability > Integrity > Confidentiality
```

Patching is rare. Devices run for 20+ years. A 5-second restart can shut down a plant. EDR cannot be installed on a Siemens S7 PLC. This is why OT networks are uniquely vulnerable yet uniquely sensitive to clumsy testing.

### Network architecture (Purdue model)

```terminal
[ LEVEL 5: ENTERPRISE (INTERNET) ]
[ LEVEL 4: SITE BUSINESS OPS     ]
─────────── [ DMZ / FIREWALL ] ───────────
[ LEVEL 3: SITE OPERATIONS       ]
[ LEVEL 2: SUPERVISORY (SCADA/HMI)]
[ LEVEL 1: CONTROLLERS (PLC/RTU) ]
[ LEVEL 0: PHYSICAL PROCESS      ]
```

![Purdue Model Architecture](/images/lessons/purdue_model_en.png)

Adversary path: phish a Level-5 user → pivot through DMZ → reach engineering workstation at L2 → push logic to L1 PLCs.

## Real adversary playbooks (publicly attributed)

### Volt Typhoon (CN, against US critical infra, 2021–present)

- Initial access via Fortinet/SOHO router 1-days, KV-Botnet for redirector pool.
- Lives entirely off LOLBAS — no malware on disk.
- Targets: water utilities, energy ops, ports, telco. **Goal: pre-position for crisis**, not exfil.

### Sandworm (RU, GRU 74455)

- BlackEnergy (2015) Ukraine grid: HMI takeover via stolen VPN creds, manual breaker trip, KillDisk wipe of workstations, telephone-DoS to slow response.
- Industroyer / Industroyer2 (2016, 2022): native IEC-101/104 and IEC-61850 protocol drivers — issued breaker-open commands directly.
- AcidRain (2022): wiper against Viasat KA-SAT modems hours before Russian invasion.

### CyberAv3ngers (IR-linked, 2023+)

- Targeted Unitronics Vision PLCs at water utilities. Default password `1111`, internet-exposed port 20256.
- Defaced HMI screen, halted process briefly.

## Reconnaissance that actually works

```terminal
# Internet-exposed ICS — never should be, often is
shodan search 'product:"Siemens S7" country:"US"'
shodan search 'product:"Modbus" port:502'
shodan search 'org:"Target Util" "Rockwell"'
shodan search 'http.html:"Niagara Web Server"'      # Tridium BMS
shodan search 'http.title:"Schneider Electric"'

# Native protocol probing (read-only Modbus discovery)
nmap --script modbus-discover -p 502 10.10.10.0/24
nmap --script s7-info -p 102 10.10.10.0/24
```

> [!warning] Never write to a live PLC
> Read-only enumeration on a lab is fine. Writing function-codes (Modbus 0x05, 0x06, 0x10) to production controllers can stop equipment, vent steam, or worse. ICS pentest scope must specify which devices, which time window, and which fail-safes are pre-armed.

## Common weaknesses (every assessment finds these)

- Engineering workstations on the corporate domain, full internet access.
- Vendor remote-support tunnels (TeamViewer, ConnectWise, manufacturer dial-home) bypassing the DMZ.
- Default credentials on HMIs and RTUs.
- Unsegmented L2/L3 — once in IT you reach OT directly.
- Historian databases (PI, Wonderware) on Windows with no patches.
- Siemens TIA Portal, Rockwell FactoryTalk, GE iFix all run as SYSTEM and trust local admin = full process control.

## Defender priorities (CISA "Cross-Sector Performance Goals")

> [!tip] The four moves that reduce 80% of risk
> 1. **Inventory** — every PLC, every controller, every vendor connection. You can't defend what you don't list.
> 2. **Segment** — enforce the Purdue boundary; deny IT→OT by default; use unidirectional gateways for historian replication.
> 3. **MFA on remote access** — vendor support, engineer VPN, jump hosts. Phishing-resistant if possible.
> 4. **Backups + IR plan** — tested OT restore, manual fallback procedures, blue/red drill at least annually.

## Detection ideas

| Telemetry | Detection |
|-----------|-----------|
| Engineering workstation outbound | Any non-vendor-allowlisted destination |
| HMI logon | Non-engineering account, off-hours, multi-host in 1h |
| ICS protocol on IT VLAN | Any Modbus/S7/IEC-104 outside the OT segment |
| New scheduled task on historian | Lightweight alarm — historians rarely add tasks |
| PLC firmware/config download | Vendor-tool fingerprint outside change window |

## Tabletop scenario you should run

> Adversary obtained domain admin in corporate IT three months ago. They identified the engineering workstation via WMI queries, harvested cached creds, and pivoted through a JEA endpoint. Today, an HMI operator sees pumps cycling at non-scheduled rates.
>
> Walk this through your environment. Where does the adversary first cross the IT/OT boundary? Who detects the cycling? Who has authority to halt the process? How long before manual ops can take over? If you can't answer in minutes, your IR plan needs work.
