# T-Pot — full tutorial

`T-Pot` (Deutsche Telekom Honeypot Project) is a Docker-based all-in-one honeypot platform. Bundles ~20 honeypots (Cowrie, Dionaea, Honeytrap, Conpot, ElasticPot, MaiLoney, Glastopf, Snare, Tanner, Adbhoney, etc.) plus a full ELK stack for visualization. Deploy in an hour, get attacker telemetry in minutes.

## Install

T-Pot wants its own machine — minimum 8 GB RAM, 128 GB disk, dedicated NIC, internet-exposed.

```terminal
git clone https://github.com/telekom-security/tpotce
cd tpotce
sudo ./install.sh -t standard
# or "hive", "industrial", "tarpit", "lite"
```

After install, web UI on port 64297; honeypots listen on standard ports (22, 23, 80, 443, 21, 25, 3306, 102, 502, 5060, …).

## Profiles

| Profile | Honeypots included | Use |
|---------|--------------------|-----|
| **Standard** | Cowrie, Honeytrap, Heralding, Dionaea, ElasticPot, Snare/Tanner, Glastopf, MaiLoney, Adbhoney, Ciscoasa, Citrixhoneypot, ConPot, Heralding | General-purpose |
| **Hive** | Adds extras for full sensor mode | Distributed sensors → central hive |
| **Industrial** | Conpot, MaiLoney, Cowrie, Heralding | OT-focused |
| **Tarpit** | Slow-network honeypots | Confuse bots |
| **Lite** | Minimal subset | Low-resource hosts |

## Honeypots in the bundle

| Honeypot | Service emulated |
|----------|-----------------|
| **Cowrie** | SSH / Telnet, full shell emulation, captures uploaded files |
| **Dionaea** | SMB / FTP / TFTP / HTTP / MQTT / various; captures malware |
| **Honeytrap** | Generic catch-all |
| **Heralding** | Credential capture across many protocols |
| **Conpot** | ICS / SCADA (Modbus, S7Comm, BACnet, IPMI) |
| **MaiLoney** | SMTP / mail honeypot |
| **Glastopf / Snare / Tanner** | Web app honeypots |
| **ElasticPot** | Fake Elasticsearch |
| **Adbhoney** | Android Debug Bridge |
| **CitrixHoneypot** | NetScaler / Citrix exposure |
| **CiscoASA** | Cisco ASA login pages |
| **Dicompot** | DICOM medical imaging |
| **Ddospot** | DDoS-amplification probes |
| **HoneyPy** | Python-based extensible |
| **RedisHoneyPot** | Redis exposure |

## Web UI

`https://<tpot-ip>:64297` — Kibana with prebuilt dashboards:

- **Overview**: top attackers, top countries, attack heatmap.
- **Cowrie**: SSH usernames + passwords tried, shell commands run, uploaded files (with hashes).
- **ConPot**: ICS protocol probes.
- **Heralding**: credential pairs by service.
- **Dionaea**: malware family stats.

You also get Cyberchef, ElasticVue, Spiderfoot, NGINX-as-frontend, Suricata, Fatt (TLS fingerprints).

## Workflow

### 1. Deploy & expose

Open standard service ports in your cloud security group; restrict admin port 64297 to your IP.

### 2. First-day data

Within hours:

- ~thousands of SSH brute-force attempts (top usernames: `root`, `admin`, `pi`, `ubuntu`).
- ~hundreds of HTTP probes for `/.env`, `/.git/config`, common router paths.
- Conpot will see Modbus / S7 reads from internet-wide research scans (Shadowserver, censys, shodan, plus less-friendly).

### 3. Analyze

Kibana → Cowrie dashboard → "Top Cowrie Username/Password" — check if any of your **real** weak credentials show up; rotate.

### 4. Pull artifacts

Cowrie writes uploaded malware to `/data/cowrie/dl/`. Submit hashes to MalwareBazaar / VirusTotal; build YARA / Sigma from the strings.

### 5. Threat intel

T-Pot integrates with **Sicherheitstacho** (Telekom's TI sharing). You can opt-in to share data with the community.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Honeypots stop accepting | Disk full from logs — `docker system prune -a` and rotate |
| Kibana slow | Default ES heap small; bump in compose |
| Cowrie creds list flooded | Use the `unique pairs` viz; ignore the spam |
| Got "real" auth attempt with our employee's password | Rotate immediately; investigate |

## Defender / TI perspective

T-Pot is a **research / threat-intel** asset, not a production defense. Use cases:

- Sample harvesting for malware research.
- Trend analysis: "what's currently being scanned for".
- Calibrate your edge alerting against the same baseline traffic.
- Lure away botnet attention from real services (marginal benefit).

## OPSEC (defender)

- Honeypot leaks: ensure the host doesn't accidentally expose real services. Use a fresh, hardened, single-purpose VM.
- Never deploy on the same network as production. Honeypots are juicy targets.
- T-Pot itself has had CVEs; keep up with releases.

## Related tools

| Tool | Niche |
|------|-------|
| **HoneyPy** | Lightweight scripting |
| **Cowrie standalone** | Just SSH/Telnet |
| **Conpot standalone** | Just ICS |
| **DShield** | Sensors + community feeds |
| **Sicherheitstacho** | Telekom-curated TI feed |
| **Modern Honey Network (MHN)** | Centralized honeypot mgmt |
