# x64dbg — full tutorial

`x64dbg` is the open-source Windows debugger of choice for malware analysis. Native Win32 GUI, scriptable, with sister tool `x32dbg` for 32-bit. Plugin ecosystem (Scylla, ScyllaHide, OllyDumpEx) makes it the go-to for unpacking and behavioral debugging.

## Install

```terminal
# Portable; just unzip
https://github.com/x64dbg/x64dbg/releases
```

Run `x64dbg.exe` (64-bit) or `x32dbg.exe` (32-bit).

## Layout

| Tab | Purpose |
|-----|---------|
| **CPU** | Disassembly + registers + stack + dump |
| **Graph** | Block-flow graph |
| **Log** | Debugger output |
| **Notes** | Free-form |
| **Breakpoints** | List + manage |
| **Memory Map** | Sections + permissions |
| **Call Stack** | Current call stack |
| **SEH** | Exception handlers |
| **Source** | If symbols + source available |
| **References** | XRefs |
| **Threads** | Active threads |
| **Handles** | Open handles |

## Essential shortcuts

| Key | Action |
|-----|--------|
| `F9` | Run |
| `F8` | Step over |
| `F7` | Step into |
| `Ctrl+F9` | Run to user code (skip system DLLs) |
| `F2` | Toggle breakpoint |
| `F4` | Run to cursor |
| `Ctrl+F2` | Restart |
| `Ctrl+G` | Go to expression |
| `Ctrl+L` | Clear log |
| `;` | Comment |
| `:` | Label |
| `Tab` | Toggle disasm/source |
| `Space` | Edit instruction |
| `Ctrl+B` | Binary copy / paste |
| `Ctrl+P` | Patches manager |
| `Ctrl+Alt+S` | Trace into source |
| `Ctrl+Shift+M` | Memory map jump |

## Workflow — common tasks

### Set a breakpoint by API

```
bp WriteFile
bp CryptEncrypt
bp send
bp wininet.dll:HttpSendRequestA
```

(Alternative: Symbols tab → search → right-click → Toggle breakpoint)

### Conditional / hit-count breakpoints

```
bp address
SetBreakpointCondition <addr>, "rcx == 5"
SetHitCount <addr>, 10
```

### Memory breakpoints (write / access)

```
bphws <addr> r/w/x
bpm <addr> r/w/x  4    # 4-byte access
```

### Trace

`Trace` (TRT files) — record every instruction for replay analysis.

### Patch

Place cursor at instruction → **Space** → edit assembly → save patch → File → Patch File.

### Dump unpacked memory

After running until unpacker resolves the real PE in memory, use **Scylla** plugin: ImageBase = correct → IAT autosearch → dump → fix dump (PE reconstruction).

## Plugins

| Plugin | Purpose |
|--------|---------|
| **Scylla** | Bundled — IAT recovery + memory dump |
| **ScyllaHide** | Anti-anti-debug (hides IsDebuggerPresent, NtQueryInformationProcess, etc.) |
| **OllyDumpEx** | Alternative dumper |
| **xAnalyzer** | Adds API arguments to disasm |
| **ret-sync** | Sync x64dbg cursor with IDA / Ghidra |
| **api-set-resolver** | Resolves Windows API set DLLs |

ScyllaHide profile (`ScyllaHide.ini`) enables:

- `PEB.BeingDebugged = 0`
- `PEB.NtGlobalFlag` clean
- `NtQueryInformationProcess` (ProcessDebugPort) hidden
- `NtSetInformationThread` (HideFromDebugger) intercepted
- ... etc — defeats ~95% of off-the-shelf anti-debug.

## Workflow on a packed sample

1. Open in x64dbg → automatically breaks at TLS callbacks / EP.
2. ScyllaHide loaded with default profile.
3. Find OEP (Original Entry Point) — strategies:
   - Set `bp VirtualAlloc` / `bp VirtualProtect` — most unpackers use them.
   - Set memory write+execute breakpoints on heap regions.
   - Jump to "tail jump" — when stack RVA points back to `text` of unpacked binary.
4. At OEP → Scylla → IAT autosearch → fill imports → dump.
5. Open the dumped PE in IDA / Ghidra for static analysis.

## Scripts

x64dbg has its own script language. Example:

```
// dump RC4 key when CryptDeriveKey called
log "CryptDeriveKey hit: phKey={0;arg.get(5)}"
ret
```

Save as `.x64dbg-script` and `Plugins → Run script`.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Sample exits immediately | Anti-debug; enable ScyllaHide + use `bp NtCreateThreadEx` to break before the trick fires |
| Symbols not loaded | Set symbol path: Options → Preferences → Symbols → e.g. `srv*c:\Symbols*https://msdl.microsoft.com/download/symbols` |
| Stepping into RtlExitUserThread | Process exited — restart, set break before |
| Memory dump won't fix imports | IAT has been mangled by the protector; try alternative dump points |
| WoW64 confusion | Use the right edition: x86 sample → x32dbg, x64 → x64dbg |

## Defender / RE perspective

x64dbg is RE-side; not deployed in production.

For analysts:
- Always run inside an isolated VM with no network (or a tightly controlled fake-network sandbox like InetSim / FakeDNS).
- Snapshot the VM before running; restore after each session.
- Combine with Process Monitor / Wireshark on the host VM for behavioral capture.

## Related tools

| Tool | Difference |
|------|-----------|
| **OllyDbg** | Predecessor, x86 only, abandoned |
| **WinDbg / WinDbg Preview** | Microsoft's; better kernel debugging |
| **gdb** | Linux equivalent |
| **lldb** | Modern alternative on macOS / iOS |
| **dnSpy / dnSpyEx** | .NET-specific debugger / decompiler |
| **Frida** | Dynamic instrumentation w/o classic debugger |
