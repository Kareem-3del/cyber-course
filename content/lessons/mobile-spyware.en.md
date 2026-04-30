# Mobile Spyware — State-Grade Implants

The most consequential mobile compromises of the past decade — Pegasus (NSO), Predator (Cytrox / Intellexa), Reign (QuaDream), Triangulation (unattributed) — share a small set of patterns. This lesson maps how those implants work, who they're aimed at, and what victims and defenders can actually do.

> [!info] The targets are people, not phones
> Mobile spyware is overwhelmingly used against journalists, dissidents, lawyers, activists, and political opponents. Citizen Lab and Amnesty Tech publish ongoing forensic findings; this lesson distills them.

## Vendors of record

| Vendor | Product | Origin |
|--------|---------|--------|
| NSO Group | Pegasus | Israel |
| Intellexa / Cytrox | Predator | Israel/N.Macedonia/Greece |
| QuaDream | Reign | Israel (defunct 2023) |
| Hacking Team / Memento | Galileo / Remote Control System | Italy |
| Candiru / Saito Tech | DevilsTongue | Israel |
| Variston | Heliconia | Spain |
| Kaspersky-named "Triangulation" | Operation Triangulation chain | Unknown |

These tools are sold to governments under license. Many end up against civil society despite contractual restrictions.

## How a chain is built

A "production" mobile zero-click kit pairs:

1. **Delivery vector** — iMessage, WhatsApp, push-only protocol, SMS link, ad-injection MITM.
2. **Parsing exploit** — bug in a media/render library (libwebp, ImageIO, AAC parser, NSPredicate).
3. **Sandbox escape** — bug in IPC, mach messaging, JIT, BackBoardd.
4. **Kernel LPE** — the headline bug; once root, persistence + collection.
5. **Implant + C2** — modular plugins, "cloud" config, dead-drop relays.

```
Attacker C2
    │
    ▼  zero-click iMessage
[ AppleSpec parse — libwebp / ImageIO ]
    │  parsing primitive (heap)
    ▼
[ BlastDoor sandbox escape ]
    │
    ▼
[ XNU kernel exploit — kalloc / IOMobileFrameBuffer / etc. ]
    │
    ▼
ROOT → install agent → erase delivery message → beacon
```

## Real published chains

### BLASTPASS (Pegasus, Sept 2023)

- CVE-2023-41064 — `libwebp` heap overflow in ImageIO via PassKit attachment.
- Followed by a kernel chain (separately patched).
- Zero-click; just receiving the iMessage was enough on iOS ≤ 16.6.

### FORCEDENTRY (Pegasus, Aug 2021)

- Integer overflow in CoreGraphics PDF/JBIG2 parser (`xpdf`-style logic).
- Built a complete "computer" inside JBIG2 logic gates → memory R/W primitives.
- Citizen Lab named "FORCEDENTRY"; Project Zero published full reverse.

### Operation Triangulation (iOS, disclosed 2023)

- Four-stage chain:
  - CVE-2023-41990 — TrueType `ADJUST` → kernel R/W primitive.
  - CVE-2023-32434 — kernel integer overflow.
  - CVE-2023-38606 — undocumented hardware register write to bypass MMIO PAC.
  - CVE-2023-32435 — Safari WebKit (alternate path).
- Delivered via invisible iMessage attachment; deleted itself after exploit.
- The "hardware register" bypass (#3) shocked the community: a private MMIO offset, undocumented and unprotected, that defeated kernel hardening.

### Predator (Cytrox / Intellexa, 2021–present)

- Multi-stage on Android + iOS.
- Android variant uses CVE-2023-41993 (WebKit) + CVE-2023-4762 (V8) chained with kernel LPEs.
- Delivered via SMS with link or via AitM at the carrier level (tweaks observed in Egypt, Greece, Vietnam targeting).

## Persistence and collection

Once running, implants:

- Record microphone, camera, screen.
- Pull keychain / keystore secrets, including OAuth tokens for cloud services.
- Tail every messaging app's database (Signal, WhatsApp, Telegram all live).
- Collect contacts, location, calendar, photos.
- Beacon over HTTPS to rotating domains, often fronted on legitimate CDNs.

> [!danger] Encrypted apps don't help post-implant
> Signal / Telegram / WhatsApp encrypt in transit. Once the implant is on the device, it reads the cleartext database the same way the app does. The compromise is endpoint, not protocol.

## Detection (what victims can actually do)

### Low-friction (anyone)

- **iOS Lockdown Mode** (Settings → Privacy → Lockdown Mode). Disables most parsing surfaces (PDF/JBIG2, complex web JIT, attachment auto-rendering, Wi-Fi auto-join). Documented to block several real chains. Free, just slower app behavior.
- **Restart often.** Many implants don't survive reboot; some Pegasus variants haven't persisted across reboots since iOS 15 hardenings. A daily reboot reduces dwell time.
- **Disable iMessage** if you're a high-risk target. Signal-only contact removes the largest zero-click surface.

### Forensic (researcher / IR)

- **MVT (Mobile Verification Toolkit)** — Amnesty Tech's tool. Works on iOS sysdiagnose and Android logcat dumps.

```terminal
# iOS — collect sysdiagnose first (Volume-Up + Volume-Down + Side button held briefly)
# Then transfer to Mac/Linux and run:
pip install mvt
mvt-ios decrypt-backup -p '<password>' -d backup-decrypted ~/Library/MobileSync/Backup/<UDID>
mvt-ios check-backup -o results -i indicators/pegasus.stix2 backup-decrypted

# Android
mvt-android check-adb -o results -i indicators/predator.stix2
mvt-android check-bugreport -o results bugreport.txt
```

- **iVerify / Lookout / Zimperium**: commercial mobile EDR. Useful for orgs.
- **Citizen Lab / Amnesty Tech**: will analyze pro-bono if you're a journalist / activist with credible threat.

### Network indicators

- DNS to known Pegasus / Predator / Reign infra (lists are published periodically).
- TLS JA3/JA3S fingerprints unusual for the device's typical apps.
- Beacon timing — fixed-interval HTTPS to a single host with no preceding click.

## Defender priorities — for orgs with high-risk staff

1. **Issue managed devices** with MDM-enforced Lockdown Mode for high-risk roles.
2. **iOS / Android always on latest patch** — emergency patch policies, not monthly.
3. **Restrict carrier exposure** — eSIM with a private mobile carrier or roaming-only profile blocks SMS-link delivery to unknowns.
4. **Logging endpoint** — collect sysdiagnose monthly for high-risk staff via an opt-in MDM policy; run MVT against a baseline.
5. **Threat-modeled comms** — high-risk staff use Signal-only with disappearing messages; iMessage disabled.
6. **Travel kits** — burner devices for high-risk travel; full-wipe before and after.

## What a state-grade chain costs to deploy

Public reporting and leaks indicate per-target operational cost in the **low six figures USD** (license slot + infra + analyst time), with vendor licenses for a national-level deployment in the **eight to nine figures**. This is why these tools are reserved for high-priority targets — but "high-priority" includes journalists and dissidents in many client states.

## What to do if you suspect you're targeted

> [!tip] Concrete first hour for an at-risk individual
> 1. Don't reset / reflash yet — preserve evidence.
> 2. Power-off device. Move SIM out.
> 3. Use a clean device for everything; new email, new accounts, new passwords.
> 4. Reach out to Citizen Lab (`research@citizenlab.ca`) or Access Now Helpline (`help@accessnow.org`) — they triage suspected targeting.
> 5. Capture and ship a sysdiagnose (iOS) or full bugreport (Android) for analysis.
> 6. Assume conversations from before the suspected compromise are exposed; warn contacts.
