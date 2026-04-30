# Frida — full tutorial

`Frida` is a dynamic instrumentation toolkit. Inject JavaScript into a running process — Android, iOS, Windows, macOS, Linux, QNX — to hook functions, inspect arguments, modify return values, and trace execution. The de-facto tool for mobile reverse engineering.

## Install

```terminal
pip install frida-tools
```

For Android: push the appropriate `frida-server` binary to `/data/local/tmp/` on a rooted device or an emulator, run as root.

For iOS: install Frida tweak from BigBoss repo on a jailbroken device, or use `frida-ios-dump` etc.

## Components

| Component | Purpose |
|-----------|---------|
| `frida` | REPL / one-shot CLI |
| `frida-trace` | Auto-generate hook stubs for matching functions |
| `frida-ps` | List processes |
| `frida-ls-devices` | List USB / remote devices |
| `frida-discover` | Find symbols in binary |
| `frida-server` | Daemon on target device |
| `frida-gadget` | Inject into apps without root (re-package APK) |

## Basic usage

```terminal
# List devices
frida-ls-devices

# List processes on USB Android
frida-ps -U

# Spawn an app and attach
frida -U -f com.target.app -l hook.js --no-pause

# Attach to running process
frida -U -n com.target.app -l hook.js
```

Flags:

| Flag | Purpose |
|------|---------|
| `-U` | USB device |
| `-D <id>` | Specific device |
| `-R` | Remote (frida-server reachable on network) |
| `-H <host>` | Network host |
| `-n <name>` / `-p <pid>` / `-f <package>` | Target |
| `--no-pause` | Resume immediately after spawn |
| `-l <file>` | Load JS file |
| `-e <expr>` | Inline expression |
| `-O <file>` | Save options |

## Hook script — fundamentals

```javascript
// Java-side hook (Android)
Java.perform(function () {
    var Activity = Java.use('android.app.Activity');
    Activity.onCreate.implementation = function (bundle) {
        console.log('[+] onCreate called');
        return this.onCreate(bundle);
    };

    var Cipher = Java.use('javax.crypto.Cipher');
    Cipher.doFinal.overload('[B').implementation = function (b) {
        console.log('[+] doFinal: ' + Java.use('android.util.Base64').encodeToString(b, 0));
        return this.doFinal(b);
    };
});

// Native-side hook
var addr = Module.findExportByName('libssl.so', 'SSL_write');
Interceptor.attach(addr, {
    onEnter: function (args) {
        console.log('SSL_write: ' + Memory.readUtf8String(args[1], 200));
    }
});
```

## Common Frida idioms

### Bypass SSL pinning (universal Android)

```javascript
Java.perform(function () {
    var array_list = Java.use("java.util.ArrayList");
    var ApiClient = Java.use('com.android.org.conscrypt.TrustManagerImpl');
    ApiClient.checkTrustedRecursive.implementation = function () { return array_list.$new(); };
    // (and a dozen more pin-related classes — use objection's full bypass instead)
});
```

Easier — use **objection**:

```terminal
objection -g com.target.app explore
... (objection) android sslpinning disable
```

### Dump function arguments

```terminal
frida-trace -U -i 'open' -n com.target.app
# generates handlers/__handlers__/libc.so/open.js — edit to log args
```

### Set return value

```javascript
Interceptor.attach(addr, {
    onLeave: function (retval) {
        console.log('original ret: ' + retval);
        retval.replace(0);     // force success
    }
});
```

### Read memory at runtime

```javascript
Memory.scan(Module.findBaseAddress('libfoo.so'), 0x10000, '00 11 22 ?? 44', {
    onMatch: function (address, size) {
        console.log('Found at: ' + address);
    },
    onComplete: function () {}
});
```

## frida-trace — fast hook scaffolding

```terminal
frida-trace -U -i 'CCCrypt*' com.target.app
# Hooks CCCryptAES* etc. Reload as you tweak handlers in __handlers__/
```

`-i pattern` includes by symbol; `-x pattern` excludes; `-j ClassName!methodName` for Java; `-J class` for whole class.

## Devices without root

`frida-gadget` is a `.so` you embed in the APK (re-package) so the app loads it on launch. `objection patchapk` automates:

```terminal
objection patchapk -s app.apk
adb install app.objection.apk
frida -U -n com.target.app -l hook.js
```

Caveat: re-packaged apps fail Google Play attestation, network certificate pinning that uses Play Integrity, and any SafetyNet/Play-Integrity check.

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| `Failed to spawn: unable to access process` | frida-server not running / wrong arch | adb shell + `chmod +x frida-server && ./frida-server &` (as root) |
| App crashes on attach | Anti-debug — Frida detection. Use `frida-magisk-module` (hide), or recompile gadget |
| Hooks return null / no log | Wrong overload signature — use `Java.choose` to inspect; or use frida-trace to scaffold correctly |
| iOS: `Failed to load … no such file` | Wrong frida-server arch (arm64 vs arm64e) |
| Android cert pinning still fails | Network Security Config + native pinning + custom TrustManager — use objection's `android sslpinning disable` (covers ~30 known patterns) |

## Defender's perspective

Mobile apps protect themselves with:

- **Frida detection** — looking for `gum-js-loop`, `frida-gum`, `frida-server` strings in process memory or open ports.
- **TLS pinning** — both Java + native.
- **Root / jailbreak detection** — many indicators.
- **Code obfuscation** — DexGuard, R8, LLVM-OB.
- **Play Integrity / DeviceCheck** — server-side attestation.

For attackers wanting to bypass: use `frida-magisk` (hide root + frida from app), spoof attestation, or recompile gadget renamed.

## OPSEC

- The act of running Frida is observable on the operator station, not on the target server.
- Re-packaged APKs (objection patchapk) leave watermark; signing cert is yours.
- For black-box mobile tests, work in an isolated lab device + carrier eSIM.

## Related tools

| Tool | Niche |
|------|-------|
| **objection** | Frida wrapper with a menu — covers 80% of common needs |
| **r2frida** | Radare2 + Frida bridge for binary analysis live |
| **MobSF** | Static + dynamic mobile-app scanner |
| **Xposed / LSPosed** | Android-only hooking (Magisk module) |
| **Cycript** | Older iOS instrumentation |
| **Reflutter** | Flutter app re-instrumentation |
