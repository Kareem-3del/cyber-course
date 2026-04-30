# IDA Pro / IDA Free — full tutorial

`IDA` (Interactive Disassembler) by Hex-Rays is the commercial industry standard for binary reverse engineering. **IDA Free** is a no-cost, no-decompiler edition; **IDA Home / Pro** add the Hex-Rays decompiler, debugger, and broader architecture support.

## Editions

| Edition | Cost | Decompiler | Architectures |
|---------|------|------------|---------------|
| Free | $0 | No | x86 / x64 |
| Home | $365 / yr | Yes (single arch) | x86 / x64 / ARM |
| Pro | $4–10k+ | Yes (all) | every supported arch |

For most engagements where you need Hex-Rays, Pro is required.

## Loading a binary

1. Drag binary onto IDA → autodetected loader (PE, ELF, Mach-O, COFF, IntelHEX, raw, …).
2. Loader options dialog — usually click OK.
3. Auto-analysis runs ~seconds–minutes.

## Layout (default)

| Panel | Purpose |
|-------|---------|
| **IDA View-A** | Graph mode (functions as block flow) — `Space` to toggle to text |
| **Hex View** | Hex |
| **Strings** | All extracted strings |
| **Imports / Exports** | Functions imported / exported |
| **Functions** | Function list |
| **Structures / Local Types** | Type editor |
| **Output** | IDA log |
| **Pseudocode (`F5`)** | Hex-Rays decompiler |

## Essential shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Switch listing ↔ pseudocode |
| `F5` | Decompile current function |
| `N` | Rename |
| `Y` | Set type |
| `;` | Comment |
| `:` | Repeatable comment |
| `G` | Go to address |
| `H` | Toggle hex / decimal |
| `X` | Cross references to current symbol |
| `Ctrl+E` | Set entry point |
| `O` | Convert byte → offset |
| `D` | Convert byte → data |
| `C` | Convert byte → code |
| `U` | Undefine |
| `Alt+P` | Edit function |
| `Ctrl+S` | Save IDB (do this often) |
| `Ctrl+L` | Library / FLIRT signature manager |
| `Ctrl+P` | Function options |

## Pseudocode (Hex-Rays) workflow

```c
int __cdecl encrypt(char *data, int len) {
    int v3; // edx
    char v4; // dl
    // Right-click → Edit function: rename, set return type
    // Y on `len` → change type to size_t
    // `/` to add a comment to the line
    // F2 in pseudocode: set a breakpoint (with debugger)
    ...
}
```

Use **Ctrl+→ / Ctrl+←** to navigate jump history. Right-click `e:Show pseudocode for ALL` to decompile the whole binary at once into a tabbed view.

## FLIRT — library function recognition

IDA ships with **FLIRT signatures** for libc, MSVCRT, OpenSSL, common SDKs. They auto-rename library functions on load. Custom sigs:

```terminal
sigmake -nfunctions.pat libfoo.sig
# Loaded via File → Load file → IDS file
```

## SDK & scripting (Pro)

Two languages:
- **IDC** — IDA's original C-like macro language.
- **IDAPython** — Python 3 binding.

```python
# IDAPython — list every call to malloc
import idautils, idc, idaapi
malloc = idc.get_name_ea_simple("malloc")
for ref in idautils.CodeRefsTo(malloc, 0):
    print(hex(ref), idc.GetDisasm(ref))
```

## Plugins worth knowing

- **HexRaysCodeXplorer** — better navigation in pseudocode.
- **Lighthouse** — code coverage overlay (DynamoRIO / PIN traces).
- **Diaphora** — binary diffing.
- **Capa explorer** — Mandiant's capability detection rules.
- **ret-sync** — sync IDA cursor with x64dbg / gdb / windbg.
- **IDArling** — multi-user collab.

## Debugger

Pro includes a debugger. Local x64 / x86 / ARM, remote via `ida-server` (Linux) or windbg-remote.

| Action | Shortcut |
|--------|----------|
| Run | F9 |
| Step into | F7 |
| Step over | F8 |
| Run to cursor | F4 |
| Set breakpoint | F2 |
| Conditional break | Edit breakpoint dialog |

## Workflow on a malware sample

1. Drag binary, accept defaults.
2. Strings tab — note URLs, file paths, mutex names.
3. Imports — flag `CryptEncrypt`, `WriteProcessMemory`, `CreateRemoteThread`, etc.
4. Find `main`/`WinMain`/`DllMain`.
5. F5 to decompile, walk top-down.
6. Rename / type as you understand; the IDB becomes a doc.
7. Run Capa Explorer: marks each function with capability tags ("HTTP communication", "encrypt data").
8. Optionally debug under controlled conditions.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| `Function not analyzed` (red `?`) | Press `P` at function start; or `D` to declare data, then `C` |
| Pseudocode is junk | Wrong return type / calling convention; `Y` to set sig |
| FLIRT didn't kick in | No matching sig; build one or use `lumina` (Pro cloud lookup) |
| Imports show ordinals only | Apply API database from File → Load file → Type Library |
| Crashes on big binaries | Bump heap in `idausr/cfg/ida.cfg` |

## Defender / RE perspective

IDA is the gold standard for malware analysis labs. Pair with:

- **Sandbox** (Cuckoo / ANY.RUN) — dynamic.
- **Capa** — static capability detection.
- **YARA** — rule for IOCs.
- **Diaphora** — diff against benign / older versions.

## OPSEC

- IDA Pro license is per-user — purposes-of-engagement matters legally.
- Never submit malware samples to "lumina" if engagement scope forbids cloud submission.

## Related tools

| Tool | Difference |
|------|-----------|
| **Ghidra** | OSS alternative — same workflow, decompiler is comparable |
| **Binary Ninja** | Cleaner UI, scriptable, mid-priced |
| **radare2 / Cutter** | OSS, terminal-first |
| **Hopper** | macOS native |
| **angr** | Symbolic execution (programmatic) |
| **BinDiff (Zynamics)** | Binary diffing (free, Google) |
