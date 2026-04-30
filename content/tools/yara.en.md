# YARA — full tutorial

`YARA` is the standard pattern-matching language for malware analysts. Rules describe what a sample looks like (strings, opcode sequences, headers); the YARA engine matches them against files, processes, or memory dumps.

## Install

```terminal
apt install yara
brew install yara
pip install yara-python    # Python bindings
```

## Rule syntax — minimum viable

```yara
rule example {
    meta:
        description = "Catches a specific payload"
        author      = "you"
        date        = "2026-04-30"
        hash        = "5e5a04..."
    strings:
        $a = "evilpattern"
        $b = { 6A 40 68 00 30 00 00 6A ?? 8B }    // hex with wildcard
        $c = /https:\/\/evil\d+\.example\.com/   // regex
    condition:
        any of them
}
```

## Condition operators

| Op | Meaning |
|----|---------|
| `$a` | True if string `$a` matched |
| `any of them` / `all of them` | Logical |
| `2 of ($a, $b, $c)` | At least N matches |
| `for any i in (0..pe.number_of_sections)` | Loops |
| `filesize` | Size in bytes |
| `entrypoint` | EP virtual address (if PE) |
| `uint16(0)` | Byte at offset |
| `pe.imports("kernel32.dll", "VirtualAlloc")` | PE-module function (with `import "pe"`) |
| `math.entropy(0, filesize)` | Math module — entropy |
| `hash.sha256(0, filesize)` | Hash module |

## Modules

```yara
import "pe"
import "elf"
import "math"
import "hash"
import "magic"
import "cuckoo"          // dynamic-analysis output
import "vt"              // VirusTotal-rule extension
```

```yara
import "pe"
rule packed_pe {
    condition:
        pe.is_pe and
        for any i in (0..pe.number_of_sections - 1):
            (math.entropy(pe.sections[i].raw_data_offset, pe.sections[i].raw_data_size) > 7.5)
}
```

## CLI usage

```terminal
yara rule.yar suspect.exe
yara -r rules/ /path/to/scan      # recursive scan dir
yara -p 8 rule.yar samples/       # 8 threads
yara -m rule.yar f                # also print rule meta
yara -s rule.yar f                # print strings that matched + offsets
yara -i CVE-2024- rule.yar f      # filter rule names by substring
yara -t high rule.yar f           # only rules tagged 'high'
yara -d 'filesize=1024' rule.yar f  # define external var
yara -P 12345 rule.yar             # scan a process by PID
```

## Workflows

### Hunt across a fleet (with Velociraptor)

```vql
SELECT * FROM Artifact.Generic.Detection.Yara.Glob(YaraRule="rule x { strings: $a = \"AAA\" condition: $a }",
                                                    Glob="C:\\Users\\*\\AppData\\**\\*.exe")
```

### Author a rule for a specific malware family

```yara
rule emotet_v25 {
    meta:
        family = "Emotet"
        version = "v2.5"
        author = "you"
        sample_hash = "5e5a04..."
    strings:
        $cfg1 = { 81 ?? ?? ?? 00 00 8B C8 81 ?? ?? ?? 00 00 03 C1 }
        $url  = "/wp-includes/" wide ascii
        $reg  = "Software\\Microsoft\\Windows\\CurrentVersion\\Run\\OneDriveUpdater" wide
    condition:
        uint16(0) == 0x5A4D and 2 of them and filesize < 5MB
}
```

### Rule auto-generation

```terminal
# yarGen — extracts pattern strings + scores them
python3 yarGen.py -m samples/ -o autorule.yar --score-rule
```

`yarGen` produces a "good" first draft; manually trim noisy strings (boilerplate, MSVC stubs).

### Yara on memory

```terminal
# Volatility 3
vol -f mem.raw yarascan.yarascan --yara-rules /opt/rules/

# YARA directly against process
yara -P 1234 rule.yar
```

## Good output

```
emotet_v25 suspect.bin
[meta:family="Emotet"]
0x10a4:$url: /wp-includes/
0x12d8:$cfg1: 81 04 06 00 00 8B C8 81 04 06 00 00 03 C1
```

The `-s` flag plus offsets lets you verify each match in a hex viewer.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| `0 matches` on a known sample | Strings encoded (`wide`, `xor` modifier); add `wide ascii xor`-modifiers |
| Massive false-positive rate | Strings too generic; add structural conditions (`pe.imports`, entropy) |
| Tool errors `wrong section` | Module import missing — `import "pe"` etc. |
| Slow on huge corpus | `-p N` threads; use yara-x (newer engine) for 5–10× speed |

## yara-x — successor

```terminal
brew install yara-x
yr scan rules.yar samples/
```

5–10× faster, better error messages, modern grammar (mostly compatible). Adoption growing in 2025–2026.

## Defender / IR perspective

YARA is the **lingua franca** of malware IOC sharing:

- **MalwareBazaar / VirusTotal** — both accept YARA rules and trigger on uploads.
- **MISP** — rules attach to threat events.
- **CrowdStrike / SentinelOne / Defender** — accept custom rules.
- **Loki** / **Thor-Lite** (Nextron) — host-based YARA scanners.

Tuning is everything; a rule that fires once a year on a real APT artifact is gold; one that fires constantly on the corp software is noise.

## OPSEC / authoring tips

- Scope by file size (`filesize > 50KB and filesize < 4MB`) to avoid scanning every text file.
- Use `pe.entry_point` checks to skip docs / images.
- For shared rules, attach `tlp:white|green|amber|red` in meta to indicate sharing scope.
- Keep test corpus of "should match" + "should not match" — re-run on every rule edit.

## Related tools

| Tool | Niche |
|------|-------|
| **yara-x** | Modern reimplementation |
| **ClamAV** | AV with YARA support |
| **Yara Hunter** | GUI authoring |
| **capa** | Mandiant's capability rules (different syntax) |
| **Sigma** | Log-side equivalent |
| **MISP** | Threat-intel platform that hosts rules |
