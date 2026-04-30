# ANY.RUN — full tutorial

`ANY.RUN` is a cloud interactive malware sandbox. You upload (or paste a URL into) a sample, watch a live VM execute it, click around as if a real user, and inspect the resulting indicators in real time. Free tier with public submissions; paid for private and enterprise.

## Get started

`https://any.run/` → register → submit a file or URL.

> [!warning] Public vs private
> Free submissions are **public** — searchable by anyone, including the malware author. For corporate samples, use a paid plan with private submissions or run a self-hosted sandbox (Cuckoo, Joe Sandbox).

## Per-task configuration

| Setting | Purpose |
|---------|---------|
| OS | Windows 7 / 10 / 11 / Linux Ubuntu |
| Bitness | x64 / x86 |
| Locale | Country / language; some malware checks |
| Network | INet, FakeNet, MITM (SSL strip) |
| Connection type | Residential, Tor, no-internet |
| Pre-execution wait | Sleep N seconds before running |
| Restart count | For multi-stage payloads |
| Command-line args | If sample is an EXE that takes args |
| MITM HTTPS | Decrypt TLS traffic on-the-fly |
| Privileged execution | Run as admin |
| MSC support | Open `.msc` file via mmc |

Tweak Windows version + locale to evade environmental checks (some malware refuses to run on Russian / CIS locales).

## The interactive VM

Lands you on a near-real desktop. Click through prompts the same way a user would. Drag files. Open browsers. Watch behavior unfold.

## Side panel — live IOCs

| Tab | Content |
|-----|--------|
| Process tree | Live spawning + DLL loads |
| Network | DNS / HTTP(S) / TCP / UDP, with MITM contents |
| Files modified | Created / modified / deleted |
| Registry changes | New keys / values |
| Threats | MITRE ATT&CK techniques + Suricata + tags |
| Process events | Sysmon-equivalent |

## Reports

- Public PDF / HTML.
- IOC export: STIX 2, MISP, OpenIOC, plain JSON.
- PCAP download.
- Memory snapshots (paid).
- TI Lookup integration: pivot from any IOC to other public submissions.

## Workflows

### Triage an unknown attachment

1. Submit the doc/EXE.
2. Choose a Windows version that matches victim profile.
3. Run for 60–120s.
4. Inspect Process tree → identify spawned children.
5. Inspect Network → spot C2 domains.
6. Tag with malware family from MITRE / threat tags.

### Pivot via TI Lookup (paid)

Every IP / domain / hash links to other public submissions where it appeared. Click an IP → see all malware samples that contacted it → identify campaign clusters.

### Generate Suricata rules

ANY.RUN auto-tags suspicious traffic with Suricata rule IDs. Export → drop into your Suricata `/etc/suricata/rules/threats.rules`.

### Memory dump for offline analysis

Paid plans expose process memory dumps. Pull a specific PID's memory → analyze with Volatility offline.

## Bad output / fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Sample doesn't run | Anti-VM check passed | Switch OS variant; enable "private" residential network; rerun |
| C2 domain unresolved | DNS sinkholed | Switch to "no-internet" → just behavioral; or paid "Real network" |
| HTTPS opaque | MITM not enabled | Toggle MITM on for re-run |
| File hangs forever | Sample sleeps > VM time | Manually fast-forward Windows time via task scheduler hack, or use longer plan run |

## Defender / IR perspective

ANY.RUN replaces "build a sandbox" effort. Daily IR uses:

- "What does this attachment do?" — answered in 60s.
- "What is this domain associated with?" — TI lookup.
- "Is anyone else hit by the same?" — public-feed pivots.

For high-stakes samples, **never** use the public free tier — use private submissions or self-hosted Cuckoo / Joe Sandbox.

## OPSEC

- Public submission burns the lure: attackers can detect their domain in ANY.RUN's public history within hours.
- For active engagement involving an attacker's payload, **private** plan only.
- IP / fingerprint of ANY.RUN sandbox VMs is published — sophisticated samples evade. Don't rely on a single sandbox.

## Related tools

| Tool | Niche |
|------|-------|
| **Joe Sandbox** | Commercial; deeper Windows coverage |
| **Hatching Triage** | Cloud sandbox, free tier (public) |
| **VMRay** | High-end commercial |
| **Hybrid Analysis (Falcon Sandbox)** | Free public sandbox |
| **Cuckoo Sandbox / CAPE** | Self-hosted, FOSS |
| **MalwareBazaar** | Sample sharing, not a sandbox |
| **VirusTotal** | Multi-AV scanning + behavior summary |
