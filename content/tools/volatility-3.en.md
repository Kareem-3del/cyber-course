# Volatility 3 — full tutorial

Volatility is the open-source memory forensics framework. Reads a memory image (RAM dump) and reconstructs OS state — processes, network connections, kernel modules, registry hives, malware indicators. Volatility 3 is the actively maintained Python-3 rewrite.

## Install

```terminal
pipx install volatility3
git clone https://github.com/volatilityfoundation/volatility3 && cd volatility3 && pip install -e .
```

Symbol files for Linux / macOS may need additional setup: `volatility3/symbols/`.

## Memory acquisition

| OS | Tool |
|----|------|
| Windows | `WinPmem`, `Magnet RAM Capture`, `DumpIt`, `Belkasoft Live RAM Capturer` |
| Linux | `LiME`, `avml`, `Microsoft AVML` |
| macOS | `osxpmem` |
| Hypervisor | VM snapshot (`.vmem`, `.vmsn`), Hyper-V `.vmrs` |

```terminal
# Linux example
sudo avml /tmp/host.mem
# Windows
.\winpmem-3.3.exe -o image.raw
```

## Basic invocation

```terminal
vol -f image.raw windows.info
vol -f image.raw windows.pslist
vol -f image.raw -r jsonl windows.pslist > pslist.jsonl
```

`-r` chooses renderer: `quick`, `pretty`, `csv`, `jsonl`, `json`, `none`.

## Universal flags

| Flag | Purpose |
|------|---------|
| `-f <file>` | Memory image |
| `-q` | Quiet |
| `-v` / `-vv` | Verbose |
| `-r <renderer>` | Output format |
| `-o <dir>` | Working / output dir |
| `--save-config` | Persist plugin args to a config file |
| `--write` | Write extracted artifacts to disk |
| `--cache-path` | Cache analysis between runs |

## Windows plugins (the workhorses)

| Plugin | What it does |
|--------|--------------|
| `windows.info` | OS, build, profile |
| `windows.pslist` | Running processes (parent / children) |
| `windows.psscan` | Hidden processes (linked-list traversal vs scanning) |
| `windows.pstree` | ASCII tree |
| `windows.cmdline` | Command lines |
| `windows.netscan` | Connections + listening ports |
| `windows.netstat` | Same data, different traversal |
| `windows.dlllist --pid 1234` | DLLs in a process |
| `windows.handles --pid 1234` | Open handles (files, regkeys, mutexes) |
| `windows.malfind` | Injected code (RWX private memory regions) |
| `windows.ldrmodules` | DLLs not in three loader lists → injected |
| `windows.svcscan` | Services |
| `windows.driverscan` / `windows.modules` | Kernel modules |
| `windows.callbacks` | Kernel notification callbacks (rootkits) |
| `windows.hashdump` | Local NT hashes from SAM |
| `windows.lsadump` | LSA secrets |
| `windows.cachedump` | Cached domain creds |
| `windows.registry.printkey --key '...'` | Read a registry key |
| `windows.registry.userassist` | UserAssist (run history) |
| `windows.registry.shellbags` | Shellbags (folder access history) |
| `windows.filescan` | Find files in memory |
| `windows.dumpfiles --pid 1234 --dump-dir out/` | Extract files from memory |
| `windows.memmap --pid 1234 --dump` | Dump full process memory |

## Linux plugins

| Plugin | Purpose |
|--------|---------|
| `linux.bash` | History from bash heap |
| `linux.psaux` / `linux.pslist` | Processes |
| `linux.proc.Maps` | Memory maps per process |
| `linux.elfs` | Loaded ELFs (rootkit hunt) |
| `linux.lsmod` | Kernel modules |
| `linux.tty_check` | Terminal-hooked rootkits |
| `linux.malfind` | Injected memory |
| `linux.check_syscall` / `linux.check_idt` | Hooked syscalls / interrupts |

## Mac plugins

| Plugin | Purpose |
|--------|---------|
| `mac.pslist` / `mac.pstree` | Processes |
| `mac.bash` | History |
| `mac.netstat` | Connections |
| `mac.list_files` | File handles |

## Workflows

### Triage flow

```terminal
vol -f mem.raw windows.info > info.txt
vol -f mem.raw windows.pslist > pslist.txt
vol -f mem.raw windows.pstree > pstree.txt
vol -f mem.raw windows.cmdline > cmdline.txt
vol -f mem.raw windows.netscan > netscan.txt
vol -f mem.raw windows.svcscan > svcscan.txt
vol -f mem.raw windows.malfind > malfind.txt
```

Diff `pslist` vs `psscan` — extras in psscan = hidden processes.

### Pull a suspected malware binary out

```terminal
vol -f mem.raw windows.dlllist --pid 4444 > dll-4444.txt
vol -f mem.raw windows.dumpfiles --pid 4444 --dump-dir out/
file out/file.4444.*
```

### Recover NT hashes / LSA secrets

```terminal
vol -f mem.raw windows.hashdump
vol -f mem.raw windows.lsadump
vol -f mem.raw windows.cachedump
```

Use the recovered NT hash for pass-the-hash, or crack with `hashcat -m 1000`.

### Bash history recovery (Linux)

```terminal
vol -f mem.lime linux.bash | head -200
```

Often gives a forensic operator commands the attacker ran in interactive bash, even if `~/.bash_history` was wiped.

## Bad output and fixes

| Symptom | Fix |
|---------|-----|
| `Unsatisfied requirement primary.layer_name.WindowsRegistry` | Wrong / corrupt image; verify with hash; use `windows.info` first |
| Linux: `Symbol file not found` | Build symbol with `dwarf2json` from kernel debug pkg |
| `windows.netscan` empty | Memory state captured before networking up, or paged out |
| Plugin slow on huge image | Use `--cache-path` to reuse analysis |
| Tool says "image is shifted" | Wrong page size / encrypted memory — try alternate plugin |

## Defender's perspective

Memory forensics is the **last word** on what was happening. Modern attacker tradecraft tries to evade disk artifacts → memory is the only ground truth.

Hunt patterns:

- `windows.malfind` hits in unsigned binaries → injection.
- Process with no parent in `pstree` (orphan) → suspicious unless legitimate (e.g., wininit).
- `comsvcs.dll` loaded into rundll32 with active LSASS handle → mimikatz-style.
- Connection to recently-registered domain in `netscan`.

## OPSEC

- Volatility runs on operator host. No target-side concern.
- Memory images contain **everything** secret in RAM at capture time — encrypt at rest, treat as topmost classification.

## Related tools

| Tool | Niche |
|------|-------|
| **MemProcFS** | Mount memory as a filesystem; integrates Vol3 |
| **Rekall** | Volatility fork (less active now) |
| **PowerForensics / KAPE** | Disk-side complement |
| **Bulk Extractor** | Carve patterns (CCNs, emails) from memory |
| **Yara on memory** | `yara rules.yar memory.raw` for known IOCs |
