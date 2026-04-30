# masscan — full tutorial

`masscan` is an asynchronous TCP/UDP port scanner that can sweep the entire IPv4 Internet in under 10 minutes from one fast box. It does **not** complete TCP handshakes — it sends SYN packets at line rate and reads RST/SYN-ACK responses from a separate code path.

## Install

```terminal
apt install masscan
brew install masscan
git clone https://github.com/robertdavidgraham/masscan && cd masscan && make
```

Run as root for raw-socket access.

## Core parameters

| Flag | Purpose |
|------|---------|
| `-p <ports>` | Ports (`80,443`, `1-65535`, `U:53`) |
| `--rate <pps>` | Packets per second — your speed knob |
| `-iL <file>` | List of CIDRs / IPs |
| `--exclude <cidr>` / `--excludefile <file>` | Skip CIDRs (use with care!) |
| `-oX/-oJ/-oG/-oL <file>` | Output XML / JSON / grepable / list |
| `--banners` | Try to grab banners after SYN-ACK |
| `--source-ip <ip>` | Spoof / set source |
| `--source-port <port>` | Set source port |
| `-e <iface>` | Choose interface |
| `--router-mac <mac>` | Override gateway MAC (rare; for VLANs) |
| `--seed <int>` | Reproducible randomization |
| `--retries <n>` | Re-send (default 1) |
| `--ping` | Send ICMP echo too |
| `--shards 1/3` | Split scan across 3 boxes — this is shard 1 |
| `--top-ports <n>` | Top-N service ports |
| `--echo` | Print resolved config and exit |
| `--readscan <file>` | Re-process a saved binary scan |

## Output formats

```terminal
# XML (matches nmap -oX schema; load in same tools)
masscan 10.0.0.0/8 -p1-65535 --rate 100000 -oX scan.xml

# Grepable
masscan -p443 0.0.0.0/0 --rate 1000000 --excludefile rfc1918.txt -oG full.gnmap
```

## Workflows

### Fast initial sweep (then nmap for detail)

```terminal
sudo masscan 10.0.0.0/16 -p1-65535 --rate 50000 -oG quick.gnmap
awk '/^Host:/{print $2}' quick.gnmap | sort -u > live-ips.txt
# Now hand off to nmap for service detection
sudo nmap -sV -sC -iL live-ips.txt -oA detail
```

### Internet-wide hunt for a specific service

```terminal
sudo masscan 0.0.0.0/0 -p3389 --rate 200000 \
  --excludefile /etc/masscan/exclude.conf \
  --banners -oJ rdp.json
```

### Two-host shard

```terminal
# Box 1
sudo masscan 0.0.0.0/0 -p443 --rate 500000 --shards 1/2 -oJ b1.json
# Box 2
sudo masscan 0.0.0.0/0 -p443 --rate 500000 --shards 2/2 -oJ b2.json
```

## The `--rate` reality check

| Bandwidth | Sustainable rate |
|-----------|-----------------|
| 100 Mbps | ~150,000 pps |
| 1 Gbps | ~1,500,000 pps |
| 10 Gbps | ~10,000,000 pps with PF_RING / DPDK |

Rates above ~1 Mpps need:

1. PF_RING ZC or netmap or DPDK driver-bypass.
2. Multi-queue NIC + IRQ pinning.
3. Source-IP rotation (single IP saturates state-tables upstream).

## Good output

```json
{ "ip": "1.2.3.4", "timestamp": "1709251234", "ports": [{"port":443,"proto":"tcp","status":"open","ttl":117}] }
```

In CSV/grepable form:

```
Host: 1.2.3.4 ()    Ports: 443/open/tcp//https
```

A successful run sustains ~`--rate` consistently with low retry rate. Watch the live status line.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Live status shows "0.00-kpps" | Firewall blocked outbound, or wrong interface | `-e <iface>`; check upstream egress |
| Massive number of `closed` ports | Misconfigured `--rate` flooding remote, all RSTs | Lower rate; this is a self-inflicted DoS |
| Tool exits with `FAIL: could not determine default interface` | No default route | `-e eth0 --router-mac AA:BB:CC:00:11:22` |
| Many duplicate hits | `--retries` too high | Drop to 1 |
| Half the world missing | Forgot `--excludefile` and your scan tripped a major upstream filter | Always exclude RFC1918 + Internet excludes |

> [!warning] You will get abuse complaints
> Internet-wide scanning generates abuse reports within minutes. Use `--exclude` lists like rapid7's `exclude-net`, identify your scanner with reverse-DNS + `--banners` saying "abuse contact: x@y.com", and run from infrastructure your provider knows about.

## Defender's perspective

Defenders see: a single IP source sending SYNs to many destination ports, no full handshake. Detection:

- Stateless detection at edge: `>50 SYN to distinct dst ports/sec from one src` → drop / null-route.
- Honeypot port telemetry: any connection to a never-used port.
- ISP-level scrubbing services already block known masscan ranges (your Internet exposure stat for "scanners blocked" is dominated by masscan).

## OPSEC notes

- Source IP is fully visible — `--source-ip` only spoofs if return path is routable (rare).
- Loud by definition. Use it for your own infrastructure or contracted internet recon. Never for unauthorized scope.
- Coordinate with your hosting provider; some terminate accounts on first abuse complaint.

## Related tools

| Tool | Difference |
|------|-----------|
| `nmap` | Service / OS / NSE — much slower |
| `zmap` | Even faster on single ports; lacks port-list flexibility |
| `naabu` | Mid-speed Go tool, easier to chain |
| `rustscan` | Wraps masscan or its own scanner; pipes into nmap |
