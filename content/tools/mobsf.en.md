# MobSF — full tutorial

`MobSF` (Mobile Security Framework) is the most-used static + dynamic + malware mobile-app scanner. Self-hosted web UI; upload an APK/IPA/AAB and get a polished HTML report in minutes. Great first pass before manual Frida/objection work.

## Install

```terminal
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest
# Browser → http://localhost:8000 — default user: mobsf / mobsf
```

Native install (Linux / macOS):

```terminal
git clone https://github.com/MobSF/Mobile-Security-Framework-MobSF
cd Mobile-Security-Framework-MobSF && ./setup.sh && ./run.sh 0.0.0.0:8000
```

## Static analysis (any platform)

Drag-and-drop or `POST /api/v1/upload` (with API key from settings).

Static report covers:

- App signature, certs, permissions list, exported activities/receivers/services/providers.
- Hardcoded secrets (URLs, keys), TLS certs bundled, AndroidManifest issues.
- Third-party libraries with known CVEs.
- Network Security Config / ATS (iOS) review.
- Manifest issues (debuggable=true, allowBackup=true).
- Code-quality issues (insecure crypto, weak hashes, weak random).
- MASVS / OWASP MASTG mapping.

```terminal
# CLI scan
curl -F 'file=@app.apk' http://localhost:8000/api/v1/upload \
    -H "Authorization: <API_KEY>" | jq
# returns hash → fetch report:
curl -X POST http://localhost:8000/api/v1/report_json -d "hash=<hash>" \
    -H "Authorization: <API_KEY>" > report.json
```

## Dynamic analysis (Android only)

Requires:
- **MobSF VM** image (Android 9+) running in VirtualBox / Genymotion / Android Studio AVD with Frida and root preinstalled.
- Or attach a real rooted device via ADB with frida-server running.

Dynamic dashboard offers:

- Live API monitoring (Frida-traced calls).
- TLS interception via auto-routed Burp / built-in HTTPS proxy.
- Activity / fragment exploration with one-click launcher.
- Screenshot capture.
- Memory dump.
- File-system snapshots before / after.
- "Exported activity launcher" — fuzz exported components.

For iOS dynamic, MobSF supports Corellium (cloud iOS instances) integration; jailbroken physical iOS support is limited.

## Static-only quick wins

The static report flags:

- **Insecure data storage** — SharedPreferences with sensitive keys; SQLite cleartext; backup-allowed flag.
- **Insecure communication** — `cleartextTrafficPermitted`; `HostnameVerifier` allowing all; missing pinning.
- **Insecure cryptography** — DES/MD5/SHA1; ECB; static IVs.
- **Code tampering** — debuggable, no obfuscation, missing root detection.
- **Auth flaws** — biometric not bound to keystore key; tokens in cleartext.
- **API endpoints** — every URL hardcoded → quick OSINT pivot.

## Workflows

### Routine triage

1. Upload APK.
2. Static report → review "Findings" tab.
3. Dump strings tab → grep for `aws_access_key`, `BEGIN PRIVATE KEY`, `firebase`.
4. URL/email/IP tabs → feed into your recon notes.
5. Run dynamic via the VM → traffic capture.

### CI integration

```terminal
# nightly CI scan; fail the pipeline on high-severity findings
curl -F 'file=@build/app.apk' http://mobsf/api/v1/upload -H "Authorization: $KEY"
HASH=$(...)
curl http://mobsf/api/v1/scan?hash=$HASH -H "Authorization: $KEY"
curl http://mobsf/api/v1/report_pdf?hash=$HASH -H "Authorization: $KEY" -o report.pdf
```

Plus PDF / SARIF outputs for issue trackers.

## Good output

Top of static report:

```
App Score: 35 / 100
Trackers : 4 (ad networks)
Permissions: 45 (8 dangerous)
Hardcoded Secrets: 2
URLs found: 78
```

Drill-down panels show line-numbered code excerpts with severity color.

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| Upload fails | File too large; bump `MAX_REQUEST_SIZE` in settings |
| Dynamic VM stuck | Wrong AVD architecture; use the official MobSF VM |
| Many false-positive secrets | Tune `MOBSF_API_PATTERNS_REGEX` |
| Report missing parts | Static analysis can fail on heavily obfuscated DEX (R8/DexGuard); reverse with `jadx` first to inspect manually |
| Report says "JADX failed" | Resource limit; bump JADX memory in settings |

## Defender's perspective

Use MobSF as a release-gate:

- Block release if "App Score < 70".
- Block release if any "Critical" severity finding.
- Track score over time per app; regressions are an indicator.

## OPSEC

- MobSF stores uploaded apps in its DB → secure your instance behind auth + HTTPS.
- Don't deploy a public MobSF — it has had RCE CVEs (e.g., CVE-2022-2856).
- Reports often contain code excerpts with proprietary IP — handle as confidential.

## Related tools

| Tool | Niche |
|------|-------|
| **APKLeaks** | Fast hardcoded-key extractor (CLI) |
| **objection / Frida** | Manual dynamic — deeper than MobSF dynamic |
| **AppSweep** (Guardsquare) | Commercial; deeper R8/DexGuard analysis |
| **Mariana Trench** | Meta's static taint analyzer |
| **reFlutter** | Flutter-specific |
| **iSecurity Suite** | iOS-focused commercial |
