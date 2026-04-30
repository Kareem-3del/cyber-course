# Suricata — full tutorial

`Suricata` (OISF) is the modern open-source IDS / IPS / NSM. Rule-based detection (Snort-compatible), with extra: TLS handshake parsing, JA3/JA3S, file extraction, Lua scripts, and EVE JSON output for SIEM.

## Install

```terminal
apt install suricata
brew install suricata
suricata --build-info       # confirms HW capabilities (AF_PACKET, NFQUEUE, eBPF)
```

## Modes

| Mode | How |
|------|-----|
| **IDS (passive)** | `suricata -i eth0 ...` — read traffic, alert |
| **IPS (inline)** | NFQUEUE / netmap / DPDK — drop bad packets |
| **Offline / pcap** | `suricata -r capture.pcap -l output/` |

## Config — `/etc/suricata/suricata.yaml`

Key blocks:

| Section | Purpose |
|---------|---------|
| `vars: HOME_NET / EXTERNAL_NET / HTTP_SERVERS / DNS_SERVERS / SQL_SERVERS` | Network groups used in rules |
| `default-rule-path / rule-files` | Where to load |
| `outputs: eve-log / fast / stats / unified2` | Output formats |
| `app-layer: tls / http / dns / smb / ssh / krb5` | App-layer parsers — turn on what you need |
| `af-packet / pcap / netmap / dpdk` | Capture mode |
| `host-mode` / `flow` | Tunables |

```yaml
vars:
  address-groups:
    HOME_NET: "[10.0.0.0/8,192.168.0.0/16,172.16.0.0/12]"
    EXTERNAL_NET: "!$HOME_NET"

outputs:
  - eve-log:
      enabled: yes
      filename: eve.json
      types:
        - alert
        - http
        - dns
        - tls
        - flow
        - fileinfo
        - anomaly
```

## Running

```terminal
sudo suricata -c /etc/suricata/suricata.yaml -i eth0 -D
sudo journalctl -u suricata -f          # status
sudo tail -F /var/log/suricata/eve.json | jq 'select(.event_type=="alert")'
```

## Rule syntax

```
alert tcp any any -> $HTTP_SERVERS 80 (msg:"SQLi UNION"; flow:to_server,established;
       content:"UNION+SELECT"; nocase; sid:1000001; rev:1;
       classtype:web-application-attack; metadata:tag sqli;)
```

| Field | Meaning |
|-------|---------|
| `alert/drop/pass/reject` | Action |
| `tcp/udp/icmp/ip/http/dns/tls/...` | Protocol or app-layer |
| `src_addr src_port -> dst_addr dst_port` | Direction |
| `msg:` | Description |
| `flow:` | Direction / state |
| `content:` `pcre:` `byte_test:` | Match payload |
| `nocase` | Case-insensitive |
| `http.uri / http.header / http.cookie` | Sticky buffers |
| `sid:` | Unique ID |
| `rev:` | Revision |
| `classtype:` | Category |
| `metadata:` | Free-form tags |

## Suricata-specific richness

```
alert tls any any -> any any (msg:"Outdated TLS";
       tls.version:tls1_0; sid:1000003;)

alert http any any -> any any (msg:"PHP password leak";
       http.response_body; content:"$1$"; sid:1000004;)

alert ja3 any any -> any any (msg:"Cobalt Strike default";
       ja3.hash; content:"a0e9f5d64349fb13191bc781f81f42e1"; sid:1000005;)
```

## Rule sources

```terminal
suricata-update enable-source et/open
suricata-update enable-source oisf/trafficid
suricata-update              # downloads, merges, generates suricata.rules
sudo suricata --test-rules   # lint
sudo systemctl reload suricata
```

Standard packs: **Emerging Threats Open** (free), **ET Pro** (paid, much richer). Plus **abuse.ch SSLBL JA3 list**, **Sigma → Suricata** (some sigmas convert).

## EVE JSON

Every event is a JSON record. Pump into SIEM:

```terminal
filebeat configure suricata module
# or
logstash → elasticsearch with the eve filter
```

Useful event types: `alert`, `http`, `dns`, `tls`, `flow`, `fileinfo`, `anomaly`, `stats`.

## Workflows

### IDS on a SPAN port

```yaml
af-packet:
  - interface: enp0s8
    cluster-id: 99
    cluster-type: cluster_flow
    threads: auto
```

```terminal
sudo suricata -c suricata.yaml -i enp0s8
```

### Inline IPS via NFQUEUE

```terminal
iptables -A FORWARD -j NFQUEUE --queue-num 0
sudo suricata -c suricata.yaml -q 0
```

`drop tcp ...` rules now drop packets.

### File extraction

```yaml
file-store:
  version: 2
  enabled: yes
  dir: /var/lib/suricata/files
  force-magic: yes
  force-hash: [sha256]
```

Combined with `filestore;` keyword on rules → automatic file capture from HTTP / SMB / FTP / SMTP.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Massive packet loss in stats | NIC offloads — disable LRO/GRO/TSO; `ethtool -K eth0 gro off` |
| Rules don't load | `suricata --test-rules`; check syntax line numbers |
| No alerts on known traffic | Wrong direction (`->` vs `<>`); wrong port; `flow:established` requires session |
| EVE JSON huge | Disable rare event types in `outputs.eve-log.types` |
| TLS / SNI extraction empty | `app-layer.protocols.tls.enabled: yes` |

## Defender perspective

Suricata is the **canonical NIDS** in 2024–2026. Pair with:

- **Zeek** for protocol-rich logs (no rules; complementary).
- **SecurityOnion** distro for the full ELK + Suricata + Zeek + Wazuh stack.
- **JA3/JA3S** rules to fingerprint malware C2 frameworks.

## OPSEC (defender)

- Rule-set tuning is mandatory. Default ET Open from a busy edge → millions of false positives.
- Inline (IPS) mode requires care — a bad rule = production outage.
- For high-throughput, use AF-PACKET v3 + DPDK + multi-queue NIC.

## Related tools

| Tool | Difference |
|------|-----------|
| **Snort 3** | Cisco's, comparable, less common in OSS deployments |
| **Zeek (Bro)** | Protocol-aware logger; not rule-based |
| **Arkime** | PCAP storage + indexed search |
| **Stenographer** | Continuous PCAP capture |
| **Moloch** | Old name for Arkime |
