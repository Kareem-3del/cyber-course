# Zeek (formerly Bro) — full tutorial

`Zeek` is the network analysis framework. Unlike Suricata's signature matching, Zeek parses every protocol and emits **structured logs** of every connection, DNS query, HTTP request, TLS handshake, file transfer, and more — with a Turing-complete event-driven scripting language for custom logic.

## Install

```terminal
apt install zeek
brew install zeek
```

Default install path `/opt/zeek/`. Add `/opt/zeek/bin` to PATH.

## Cluster mode (production)

```terminal
zeekctl deploy
zeekctl status
zeekctl diag
```

`/opt/zeek/etc/node.cfg` defines manager / proxy / worker nodes. For >10 Gbps, run AF_PACKET cluster with multiple worker threads.

## Logs (the killer feature)

Zeek writes one log per protocol/event family to `/opt/zeek/logs/current/` (then rotates). Out of the box you get:

| Log | Content |
|-----|--------|
| `conn.log` | Every flow: src/dst, ports, bytes, durations |
| `dns.log` | Every DNS query + response |
| `http.log` | Every HTTP request + response codes |
| `ssl.log` | Every TLS handshake + cert |
| `x509.log` | Decoded certs |
| `files.log` | Every file transferred (with hashes) |
| `smb_*` | SMB activity |
| `kerberos.log` | Kerberos AS-REQ / TGS-REQ |
| `dhcp.log` | DHCP transactions |
| `ssh.log` | SSH banners + auth attempts |
| `dpd.log` | Dynamic-protocol-detection results |
| `notice.log` | Generated alerts |
| `software.log` | Identified software versions |
| `weird.log` | Anomalies the parser couldn't normalize |

Logs are TSV by default; switch to JSON in `zeek-cut`:

```
@load policy/tuning/json-logs
```

## Workflow

### Quickly process a pcap

```terminal
mkdir analysis && cd analysis
zeek -r ../capture.pcap

ls
# conn.log dns.log http.log ssl.log files.log ...
zeek-cut -d ts id.orig_h id.resp_h id.resp_p service duration < conn.log | head
```

`zeek-cut` extracts named columns from the TSV (handles header/comments).

### Scripting — examples

```zeek
# scripts/check-rare-uri.zeek
event http_request(c: connection, method: string, original_URI: string,
                    unescaped_URI: string, version: string)
{
    if (|unescaped_URI| > 200)
        NOTICE([$note=HTTP::URILength,
                $msg=fmt("Long URI from %s -> %s%s",
                         c$id$orig_h, c$http$host, original_URI),
                $conn=c]);
}
```

Load via `@load scripts/check-rare-uri.zeek` in `local.zeek`.

### Notice framework — alert pipeline

```zeek
@load base/frameworks/notice/main
redef Notice::policy += {
   [$pred(n: Notice::Info) = { return n$note == HTTP::URILength; },
    $action = Notice::ACTION_EMAIL]
};
```

Email / log / drop / suppress / `add_to_intel` actions.

### Intel framework — IOC matching

```terminal
# /opt/zeek/share/zeek/policy/frameworks/intel/seen/...
# /opt/zeek/etc/intel.dat
#fields  indicator  indicator_type  meta.source ...
evil.example.com  Intel::DOMAIN  threat-feed-1
1.2.3.4           Intel::ADDR    threat-feed-1
```

Load policy:

```
@load frameworks/intel/seen
@load frameworks/intel/do_notice
redef Intel::read_files += { "/opt/zeek/etc/intel.dat" };
```

Now any flow / DNS / HTTP that matches an indicator generates a `Intel::Notice`.

## Suricata + Zeek

Both run side-by-side typically:

- **Suricata** = signature alerts, file extraction.
- **Zeek** = ground truth of "what happened" across every flow.

Combined logs into Elastic / Kibana via Filebeat → Logstash → ES, viewable in **Security Onion**.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Worker drops packets | NIC offloads (LRO/GRO) on; disable. Use AF_PACKET v3 |
| Logs missing app data | Protocol parser disabled; `print get_dpd_protos();` |
| Need to enrich with hostnames | `@load base/protocols/dns` and `dns_iter` |
| Want to reload without restart | `zeekctl deploy` |
| `weird.log` flood | Often legit malformed traffic; tune via `Weird::weird_ignore` |

## Defender perspective

Zeek is **the** "what happened" tool. When IR asks "did host X talk to Y on port Z three weeks ago?", `conn.log` answers in milliseconds with `zeek-cut`.

Best paired with:
- Suricata (signature alerts).
- ELK / OpenSearch for storage + query.
- RITA (Active Countermeasures) for anomaly analysis on top of Zeek logs.

## OPSEC (defender)

- Logs include cleartext URIs, TLS SNIs, DNS queries — secure storage; redact PII at retention boundary.
- Long-term retention requires careful sizing (TB/month at scale).
- Watch out for legacy `bro_` table names — Zeek 4+ uses `zeek_` everywhere.

## Related tools

| Tool | Difference |
|------|-----------|
| **Suricata** | Signature IDS — complementary |
| **Arkime** | PCAP indexer — search packets, not just metadata |
| **RITA** | Beacon / long-tail analytics on Zeek logs |
| **Corelight** | Commercial Zeek distribution + sensors |
| **NetWitness** | Commercial NSM platform |
