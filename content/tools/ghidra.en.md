# Ghidra — full tutorial

`Ghidra` is the NSA-released open-source software-reverse-engineering platform. Disassembler + decompiler for x86/x64/ARM/MIPS/RISC-V/PowerPC/SPARC/M68K/Z80 + dozens more, with a Java-based GUI. Free alternative to IDA Pro.

## Install

```terminal
# Java 17+ required
java --version
wget https://github.com/NationalSecurityAgency/ghidra/releases/latest/download/ghidra_*_PUBLIC_*.zip
unzip ghidra_*.zip
./ghidraRun
```

Or `brew install ghidra` (macOS).

## First run

1. **File → New Project** → Non-Shared (single-user).
2. Drag binary into project window → import → use defaults (auto-detect format).
3. Double-click → opens CodeBrowser.
4. Auto-analysis prompt → click Analyze (uses defaults).

## CodeBrowser layout

| Panel | Purpose |
|-------|---------|
| Listing | Disassembly view |
| Decompiler | C-like reconstruction (right side) |
| Functions | Tree of functions |
| Symbol Tree | Imports / exports / labels |
| Defined Strings | All extracted strings |
| Bookmarks | User markers |
| Bytes | Hex view |
| Memory Map | Sections + permissions |
| Comments | C-style annotations |

## Essential keyboard shortcuts

| Key | Action |
|-----|--------|
| `G` | Go to address / symbol |
| `L` | Rename label / variable |
| `;` | Add comment at address |
| `T` | Set data type |
| `F` | Force decompiler refresh |
| `H` | Find references |
| `Ctrl+Shift+G` | Go to address (extended) |
| `Ctrl+Shift+E` | Export selection |
| `Ctrl+B` | Bookmark |
| `Ctrl+M` | Memory map |
| `Ctrl+Alt+S` | Symbol references |
| `Ctrl+Shift+F` | Function call graph |
| `Ctrl+E` | Edit function (signature) |
| `S` | Set struct member |

## Workflow on a malware sample

1. Identify imports → look for `WinHttp*`, `CreateRemoteThread`, `VirtualAllocEx`, `WriteProcessMemory` — RAT primitives.
2. Strings → drag interesting (`http://`, `Mozilla/5.0`, file paths) to comments.
3. Find `main` / `WinMain` / `DllMain` — work outward.
4. Rename functions as their behavior becomes clear (`L` to rename).
5. Apply struct types where you see consistent offsets.
6. Use **Decompiler** view as your map; the listing is for verification.

## Useful built-in scripts (Window → Script Manager)

| Script | Purpose |
|--------|---------|
| `ImportSymbolsScript.java` | Bulk-load symbols from a CSV |
| `FindSymbolsScript.java` | Search for known patterns |
| `FunctionGraph` | Visual call graph |
| `ExportToDocumentation` | Markdown / HTML export |

You can write Java or Python (Jython / Ghidrathon) scripts: `Window → Script Manager → New Script`.

```python
# Example: dump all functions over 100 instructions to a file
fm = currentProgram.getFunctionManager()
with open("/tmp/fns.txt", "w") as f:
    for fn in fm.getFunctions(True):
        if fn.getBody().getNumAddresses() > 100:
            f.write(f"{fn.getName()}\t{fn.getEntryPoint()}\n")
```

## Useful extensions

- **Ghidrathon** — Python 3 in Ghidra (instead of Jython).
- **GhidraEmu** — emulate functions.
- **GhidraPAL / pcode-tools** — work with Ghidra's IR.
- **ret-sync** — sync Ghidra cursor with debugger (x64dbg, gdb).
- **BinaryNinja-Ghidra-bridge** — interop.

## Server / shared mode

```terminal
./ghidraSvr install
./ghidraSvr start
```

Multi-user shared project — collab on the same binary, lock per-function.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Decompiler shows nothing | Wrong calling convention / function not detected — `D` to define function start |
| Hex view shows `??` | Section not loaded — Memory Map → add segment |
| Auto-analysis stuck | Too many indirect calls — disable specific analyzers; re-run |
| Project corrupted | Restore from `~/ghidra_*_USER/_temp` snapshots |
| Slow on large binary | Increase JVM heap (`-Xmx8G` in `support/launch.properties`) |
| Imports unresolved | Apply data type archive: `Window → Data Type Manager → Apply Function Data Types` |

## Defender / RE perspective

Ghidra is the **defender's** weapon. Once an unknown binary surfaces (from KAPE, EDR quarantine, MalwareBazaar), open it and:

1. Walk `main` to behavior.
2. Identify C2 strings, hardcoded keys.
3. Write Yara rules for unique opcode sequences (`Defined Strings → Find Patterns`).
4. Document IOCs for sharing.

## Related tools

| Tool | Niche |
|------|-------|
| **IDA Pro** | Commercial; better decompiler in many cases; debugger integration |
| **Binary Ninja** | Newer, scriptable, shorter learning curve |
| **radare2 / Cutter** | OSS terminal/GUI; lighter |
| **objdump / Capstone** | CLI single-purpose |
| **Hopper** | macOS native |
| **Hex-Rays microcode** | Inside IDA — same niche as Ghidra decompiler |
