# Objection — full tutorial

`objection` is a runtime mobile-app exploration toolkit built on top of Frida. It provides a friendly menu for the most common mobile pentest tasks: SSL-pinning bypass, root / jailbreak bypass, keystore inspection, file-system browsing, dynamic class hooking — without writing a single Frida script.

## Install

```terminal
pip install objection
```

Requires `frida-server` already running on the device (Android: rooted phone or emulator with frida-server pushed; iOS: jailbroken or use `objection patchapk` for non-rooted).

## Two modes

### 1. Run against a running app

```terminal
objection -g com.target.app explore
```

### 2. Patch an APK / IPA to embed Frida-gadget (no root)

```terminal
objection patchapk -s app.apk
adb install app.objection.apk
# Launch the app; objection auto-attaches via the embedded gadget.
objection -g com.target.app explore
```

## The `explore` REPL — common menu

```
android> help
android> env                                # paths and dirs
android> sslpinning disable                 # universal pinning bypass (~30 patterns)
android> root disable                       # root-detection bypass
android> ui screenshot screen.png           # take a screenshot
android> hooking list classes
android> hooking list class_methods com.target.app.MainActivity
android> hooking watch class_method com.target.app.Crypto.encrypt --dump-args --dump-return
android> heap search instances com.target.app.User
android> heap evaluate <id> 'this.email'    # invoke method on existing instance
android> heap execute  <method> <id> ...
android> keystore list                      # Android Keystore entries
android> keystore detail <alias>
android> jobs list / kill
android> file ls /data/data/com.target.app
android> file download /data/data/com.target.app/databases/local.db
android> activity list
android> service list
android> intent launch_activity com.target.app/.SomeActivity --extra k=v
```

For iOS the equivalent commands prefix with `ios`:

```
ios> sslpinning disable
ios> keychain dump
ios> keychain dump --json keychain.json
ios> nsuserdefaults get
ios> jailbreak disable
ios> bundles list_bundles
ios> hooking watch method '-[Crypto encrypt:]' --dump-args
```

## Workflows

### 0-cost MITM in 30 seconds

```terminal
adb push frida-server /data/local/tmp && adb shell "/data/local/tmp/frida-server &"
objection -g com.target.app explore
android> sslpinning disable
# Now route phone through Burp; HTTPS readable.
```

### Pull SQLite database from app sandbox

```
android> file download /data/data/com.target.app/databases/db.sqlite
sqlite3 db.sqlite '.tables'
```

### Hook every method of a class to see internal flow

```
android> hooking watch class com.target.app.Crypto --dump-args --dump-return
```

Walk the app; every call into `Crypto.*` is logged with arguments and return values.

### Bypass biometric prompt

```
ios> ui biometrics_bypass
android> hooking watch class_method androidx.biometric.BiometricPrompt$AuthenticationCallback.onAuthenticationSucceeded
```

Then craft a Frida script that calls the success callback unconditionally, or use `objection`'s built-in `biometrics-bypass` if available.

### Dump runtime keychain (iOS) / keystore (Android)

```
ios>     keychain dump --json keychain.json
android> keystore list
```

iOS keychain dump is gold — auth tokens, refresh tokens, encryption keys often live there.

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| `Frida server is not running` | adb shell into device, `/data/local/tmp/frida-server &` |
| `sslpinning disable` doesn't fix Burp | Custom pinning impl; use `hooking watch class` to find it; manually hook |
| `objection patchapk` fails | Need apksigner / zipalign / aapt2 in PATH; reinstall build tools |
| App crashes after patch | Frida-gadget embedded but app has Frida detection; rename gadget lib in patcher options |
| `keychain dump` empty | iOS app uses `kSecAttrAccessibleWhenUnlocked` and device locked → unlock and retry |

## Defender's perspective

- Mobile app should detect Frida ports / strings / threads — common detection patterns: `frida-server` socket on TCP/27042, `gum-js-loop` thread name, `frida-gadget` lib in /proc/self/maps.
- Apps that handle finance, health, government data should ship Play Integrity (Android) / DeviceCheck (iOS) with **server-side** verification — bypassing requires server-side flaws too.
- Storing sensitive material in keychain/keystore is fine *if* you check the Secure Enclave / TEE backing flag; objection can read entries that didn't.

## OPSEC

- objection patchapk re-signs the app with your debug keystore — installed app is identifiable.
- Some apps refuse to launch if installer-signature changed.
- For long engagements, use a dedicated test device matching the target's MDM profile minus the protections you need bypassed.

## Related tools

| Tool | Niche |
|------|-------|
| **Frida** | The engine objection rides on |
| **MobSF** | Static + dynamic combined report |
| **r2frida / radare2** | Binary analysis live |
| **APKLeaks** | Quick static scan for keys/URLs in APKs |
| **Drozer** | Older Android attack surface tool |
| **Reflutter** | Flutter (Dart-AOT) re-instrumentation |
