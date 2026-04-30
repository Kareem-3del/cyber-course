# nmap — full tutorial

`nmap` is the canonical port scanner and network mapper. With its scripting engine (NSE) it also fingerprints services, identifies CVEs, and runs targeted exploits. Mastering nmap is non-negotiable for both red and blue.

## Install

```terminal
apt install nmap
brew install nmap
choco install nmap          # Windows
```

## The scan-type flags (mutually exclusive in most cases)

| Flag | Type | Notes |
|------|------|-------|
| `-sS` | TCP SYN scan | Default for root, fast, half-open |
| `-sT` | TCP connect | When you can't raw-socket (no root) |
| `-sU` | UDP scan | Slow; small port lists only |
| `-sN` / `-sF` / `-sX` | Null / FIN / Xmas | OS-fingerprinting tricks |
| `-sA` | ACK | Firewall rule discovery (filtered vs unfiltered) |
| `-sW` | Window | Variant of ACK |
| `-sM` | Maimon | RFC-bug-based stealth |
| `-sY` / `-sZ` | SCTP INIT/COOKIE | Telecom |
| `-sO` | IP protocol scan | What protocols (TCP/UDP/ICMP/ESP) the host speaks |
| `-sL` | List scan | Resolve only — no probes |
| `-sP` / `-sn` | Ping / no-port | Host discovery only |

## Port specification

| Flag | Meaning |
|------|--------|
| `-p 22` | One port |
| `-p 22,80,443` | Multiple |
| `-p 1-65535` / `-p-` | Full range (slow, most thorough) |
| `-p T:80,U:53` | Mix protocols |
| `--top-ports 1000` | Top-1000 most common (default if `-p` omitted) |
| `-F` | Top-100 fast |
| `-r` | Sequential (don't randomize) |

## Speed / timing

| Flag | Speed | When |
|------|------|------|
| `-T0` | Paranoid | IDS evasion, days per host |
| `-T1` | Sneaky | Stealth |
| `-T2` | Polite | Don't strain link |
| `-T3` | Normal (default) | LAN / friendly |
| `-T4` | Aggressive | Most engagements |
| `-T5` | Insane | Lab / CTF |

Custom: `--min-rate 5000`, `--max-retries 2`, `--host-timeout 5m`.

## Service / OS detection

| Flag | Purpose |
|------|---------|
| `-sV` | Probe service banners → product/version |
| `--version-intensity 0..9` | More probes = more accuracy = more time |
| `-O` | OS fingerprint (needs root + open and closed port) |
| `-A` | `-sV -O --traceroute -sC` shortcut |

## Scripting (NSE)

| Flag | Purpose |
|------|---------|
| `-sC` | Default safe scripts |
| `--script <name>` | Specific script(s); accepts globs |
| `--script-args` | Pass args to scripts |
| `--script-help <name>` | Read script help |

Useful categories: `default`, `safe`, `discovery`, `auth`, `vuln`, `exploit`, `intrusive`, `dos`, `brute`.

```terminal
nmap --script vuln target.com
nmap --script "smb-vuln-* and safe" -p 445 10.0.0.0/24
nmap --script http-title,http-headers,http-enum -p 80,443 target.com
nmap --script ssl-enum-ciphers -p 443 target.com           # cert + cipher posture
nmap --script smb-enum-shares,smb-enum-users -p 445 10.0.0.5
nmap --script vuln,exploit -p 445 --script-args=unsafe=1 10.0.0.5  # CTF
```

## Output

| Flag | Format |
|------|--------|
| `-oN` | Normal text |
| `-oG` | Grepable (one line per host) |
| `-oX` | XML (parsed by other tools) |
| `-oA <basename>` | All three at once |
| `--reason` | Show why a port was classified |
| `--open` | Show only open ports |
| `--packet-trace` | Per-packet log (debug only) |

## Stealth / firewall flags

| Flag | What it does |
|------|--------------|
| `-Pn` | Skip host discovery (assume up). Use against firewalls that drop ICMP |
| `-n` | No DNS reverse lookup |
| `-D <decoys>` | Decoy IPs in the source field |
| `-S <ip>` | Spoof source IP (only works if return path reachable) |
| `-e <iface>` | Specify interface |
| `-g <port>` / `--source-port` | Source port (53 / 88 sometimes bypasses ACLs) |
| `--data-length 50` | Pad packets |
| `--badsum` | Bad TCP checksum (filter detection) |
| `-f` / `--mtu` | Fragmentation |
| `--proxies <list>` | HTTP/SOCKS proxy chain (TCP-only scans) |
| `--ttl <n>` | Custom TTL |
| `--randomize-hosts` | Shuffle host order |
| `--spoof-mac <addr>` | MAC spoof (LAN only) |

## Workflows

### Standard external recon

```terminal
sudo nmap -sS -sV -sC -O -T4 -p- --min-rate 2000 -oA full target.com
```

Parses to: `full.nmap`, `full.gnmap`, `full.xml`. Ship the XML to `nmap-formatter`, `searchsploit -nmap`, or `nuclei -l`.

### Internal /24 sweep

```terminal
sudo nmap -sn 10.0.0.0/24 -oG live-hosts.gnmap
sudo nmap -sS -sV --top-ports 500 -iL <(grep '^Host:.*Up' live-hosts.gnmap | awk '{print $2}') -oA sweep
```

### Vuln pivot

```terminal
nmap -p 80,443 --script http-shellshock,http-vuln-cve2017-5638 target.com
```

### UDP — the slow but informative one

```terminal
sudo nmap -sU --top-ports 50 -T4 --max-retries 1 target.com
```

### IDS evasion

```terminal
sudo nmap -sS -p 80,443,3389 -T2 -f --data-length 24 -D RND:10 -g 53 --randomize-hosts target-list.txt
```

## Good output

```
PORT     STATE SERVICE  VERSION
22/tcp   open  ssh      OpenSSH 8.9p1 Ubuntu 3 (Ubuntu Linux; protocol 2.0)
80/tcp   open  http     nginx 1.21.6
443/tcp  open  ssl/http nginx 1.21.6
3389/tcp open  ms-wbt-server Microsoft Terminal Services
| ssl-cert: Subject: commonName=target.com
|_Issuer: commonName=R3/organizationName=Let's Encrypt/countryName=US
```

`open` = service responded. `closed` = host responded with RST. `filtered` = no response (firewall). `open|filtered` = ambiguous (UDP usually).

## Bad / confusing output and how to fix

| Symptom | Cause | Fix |
|---------|-------|-----|
| All ports `filtered` | Firewall dropping or wrong target | `-Pn`; double-check IP; try `-sA` to differentiate ACL behavior |
| `Host seems down` | ICMP dropped | `-Pn` |
| Service detected as `tcpwrapped` | Service fingerprinted but won't talk | Re-probe with `--version-intensity 9`, or it really is `tcpwrapped` (xinetd) |
| `Service Info: OS: Linux` only | Banner gave nothing useful | Add `-A` or specific NSE scripts |
| Massive scan very slow | UDP, full port range, low timing | Drop UDP, use `--min-rate`, `-T4` |
| Misleading version (e.g. nginx detected as Apache) | Banner spoofing / WAF | Cross-check with `httpx -tech-detect`, `whatweb` |
| `Failed to resolve` | DNS resolver dead | `--dns-servers 1.1.1.1` |

## Defender's perspective

Defenders see: bursts of SYNs from one IP across many ports, ICMP probes, service fingerprint TCP options. Detection ideas:

- **IDS rules** for nmap fingerprinting (Suricata SIDs covering Xmas / Null / window-scan patterns).
- **Port-scan threshold** in firewalls (drop after N ports/sec from same source).
- **Honeypot ports** (Canary, T-Pot) — any connection is suspicious.

Sysmon / EDR will see the binary launch on the operator's host but not on the target.

## OPSEC notes

- Default nmap is loud. `-T4 -sS` from a single IP is recognized in 5 seconds by any modern IDS.
- For real engagements, **split the scan**: one host running discovery, another doing service detection, another doing scripts.
- Tor proxychains do *not* support raw-socket scans (`-sS`). Use `-sT` if proxying.

## Related tools

| Tool | Use |
|------|-----|
| `masscan` | 100×–1000× faster, no service detection |
| `naabu` | Go alternative, faster + nice output |
| `rustscan` | Fast TCP scanner that pipes into nmap |
| `nuclei` | Vulnerability templates after open ports identified |
| `nmap-formatter` | Convert XML to nice HTML / md / json |
| `vulscan` / `vulners` (NSE) | Map versions to CVEs |
