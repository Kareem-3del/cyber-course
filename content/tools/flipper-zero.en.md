# Flipper Zero — full tutorial

The Flipper Zero is a portable multi-tool: 433/315/868/915 MHz sub-GHz radio, 13.56 MHz NFC, 125 kHz RFID, infrared, iButton (1-Wire), GPIO, USB HID emulation. Pocket-friendly hardware for badge cloning, IR replay, BadUSB, and short-range RF research.

> [!warning] Legal landscape
> Sub-GHz transmit on key fobs, garage doors, and similar is regulated in most jurisdictions. Stay in your country's amateur / unlicensed bands and only test devices you own or are authorized to test. Brazil, Canada, Australia, and the Netherlands have already restricted sales / certain features.

## Boot / firmware

Default firmware: **Flipper Zero Stock**. Community options:
- **Momentum** (formerly Xtreme) — most active, breaks fewer official rules.
- **RogueMaster** — full-featured, rougher edges.
- **Unleashed** — middle-ground, region-restriction removals.

Flash via qFlipper or Web Updater (Chrome).

## Apps (main menu)

| App | Use |
|-----|-----|
| **Sub-GHz** | RF replay, capture, brute-force keyfobs |
| **125 kHz RFID** | EM4100 / HID Prox cards (most office badges) |
| **NFC** | MiFare Classic / Ultralight / DESFire / NTAG |
| **Infrared** | TV / projector / AC remote learning |
| **iButton** | 1-Wire keys (Dallas) |
| **Bad USB** | Type out keystrokes / Ducky payloads |
| **U2F** | (limited; uses TOTP-style flows) |
| **GPIO** | Logic analyzer / UART / SPI |
| **Apps catalog** | flipperzero-firmware.app store |

## Common workflows

### Clone a 125 kHz badge

1. RFID → Read.
2. Hold within ~3 cm of the badge.
3. "EM4100" / "HIDProx" detected → Save as `office`.
4. Emit: RFID → Saved → `office` → Emulate, hold near the reader.

Most legacy office prox systems = clonable in seconds. Modern systems use HID iCLASS SE / Mobile Access — not bypassable with stock Flipper.

### Capture a sub-GHz remote (e.g., gate fob)

1. Sub-GHz → Read RAW (or Frequency Analyzer).
2. Press the fob near Flipper.
3. Save the capture.
4. Emit: Sub-GHz → Saved → Send.

Rolling-code remotes (most modern) won't replay — every press has a fresh code. Static-code (older garage / cheap fobs) replay perfectly.

### IR remote replay

1. Infrared → Universal Remote (TV/AC/Audio) — try common manufacturer codes.
2. If unsuccessful → Learn → point original remote at Flipper, press button.
3. Save → Replay.

### BadUSB Ducky payloads

Drop a `.txt` script (Rubber-Ducky syntax) onto SD card under `badusb/`:

```
DELAY 1000
GUI r
DELAY 500
STRING powershell -nop -w hidden -ec <BASE64>
ENTER
```

Plug Flipper to victim USB → Apps → Bad USB → run script. Acts as keyboard.

### NFC — MiFare Classic

1. NFC → Read.
2. If the card is MFC and uses default keys → Flipper auto-recovers.
3. For non-default keys → use mfkey32 brute-forcing on a downloaded `.nfc` file with the `flipper-mfkey32` PC tool.

```terminal
mfkey32v2 -> outputs key candidates → load back into Flipper
```

DESFire EV1+/EV2 + NTAG 424 DNA = not crackable from Flipper alone.

## GPIO / hardware probing

- 8 GPIO pins, 3.3 V.
- App "GPIO" → Pin Control → toggle / read.
- App "USART" → UART terminal at common baud rates.
- App "SPI Mem Manager" → flash dump from SPI flash chips.

Use case: dump router / IoT firmware via SPI when JTAG locked.

## Flipper-specific apps worth installing

- **Picopass** — extends iCLASS reading (with hardware mod).
- **Subghz Bruteforcer** — sweep static codes.
- **Mifare Fuzzer** — sector key tests.
- **MultiConverter / NFCMagic** — NFC tooling.
- **PCAP (Marauder hat)** — Wi-Fi with external ESP32 board.
- **WiFi Marauder** — same hat, deauth/probe.

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| RFID read shows nothing | Wrong frequency band (HF vs LF); badge is 13.56 MHz → use NFC app |
| Sub-GHz "raw" replay doesn't trigger receiver | Rolling code; replay won't help |
| BadUSB types weirdly | Wrong keymap (default US); set in app `Settings → Keyboard layout` |
| NFC default-key fails | Card isn't MFC, or has been re-keyed; try mfkey32v2 |
| Flipper bricked after firmware flash | Hold L-button while plugging USB → DFU → reflash via qFlipper |

## Defender's perspective

- 125 kHz prox cloning is invisible to most readers (no anti-clone telemetry).
- Modern offices: deploy HID Mobile Access, MiFare DESFire, or LEAF — block prox entirely.
- USB HID injection: GPO `Block all removable storage classes` on high-security workstations; require physical port disablement at sensitive desks.
- IR replay: physical control rooms — air-gap or replace receivers.
- Sub-GHz: rolling-code only; deprecate fixed-code remotes for sensitive systems.

## OPSEC

- Bluetooth on Flipper announces "Flipper [name]" — visible to anyone scanning. Disable in settings during an op.
- Most sub-GHz transmission patterns are legally regulated; running illegal transmissions logs you to the airwaves.
- Carry extra batteries and SD card backups — engagement device, treat with care.

## Related tools / hardware

| Tool | Niche |
|------|-------|
| **Proxmark3** | Professional RFID/NFC tool — much deeper |
| **HackRF** | SDR — full-spectrum, scripted |
| **YARDStick One** | sub-GHz Tx/Rx via Python |
| **O.MG Cable** | Apparent-USB-charger HID injection |
| **Bash Bunny / Rubber Ducky** | HID-only with payload library |
| **iCopy-X** | Specialized HID iCLASS cloner |
