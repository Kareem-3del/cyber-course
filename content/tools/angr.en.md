# angr — full tutorial

`angr` is the Python binary-analysis platform from UCSB. Combines a static loader, a CFG (control-flow graph) builder, a multi-arch CPU emulator (`SimEngine`), and a symbolic execution engine. Used for automated vulnerability discovery, CTF auto-solvers, deobfuscation, and reverse-engineering aid.

## Install

```terminal
pip install angr
```

Optional but recommended:

```terminal
pip install angr-management   # GUI
pip install angrop             # ROP chain builder
```

## Concepts

| Term | Meaning |
|------|--------|
| **Project** | A loaded binary + libs |
| **Block** | A basic block of instructions |
| **State** | A snapshot of CPU + memory + constraints |
| **Simulation Manager** | Manages an exploration of states |
| **Stash** | Named collection of states (`active`, `deadended`, `found`, `avoid`) |
| **Symbolic value** | A bit-vector with constraints (BVS) |
| **Constraint Solver** | Z3 |

## Hello world — find an input that reaches a function

```python
import angr, claripy

proj = angr.Project('./vuln', auto_load_libs=False)

# Symbolic stdin
input_len = 32
sym_in = claripy.BVS('in', 8 * input_len)

state = proj.factory.entry_state(stdin=sym_in,
        add_options={angr.options.SYMBOL_FILL_UNCONSTRAINED_MEMORY,
                     angr.options.SYMBOL_FILL_UNCONSTRAINED_REGISTERS})
sm = proj.factory.simulation_manager(state)

target = proj.loader.find_symbol('win').rebased_addr
avoid  = [proj.loader.find_symbol('die').rebased_addr]

sm.explore(find=target, avoid=avoid)
if sm.found:
    s = sm.found[0]
    print('Input:', s.posix.dumps(0))
```

`Project.factory.entry_state` builds a state at `_start`. `simulation_manager.explore(find=, avoid=)` runs symbolic execution until reaching `find` or hitting an `avoid`.

## Useful state options

```python
opts = {
    angr.options.LAZY_SOLVES,
    angr.options.SYMBOL_FILL_UNCONSTRAINED_MEMORY,
    angr.options.SYMBOL_FILL_UNCONSTRAINED_REGISTERS,
    angr.options.UNICORN,         # JIT via Unicorn engine
    angr.options.STRICT_PAGE_ACCESS,
}
state = proj.factory.entry_state(add_options=opts)
```

`UNICORN` mode uses Unicorn engine for concrete chunks → much faster. Must drop into pure-symbolic mode at branches.

## Hooks — replace functions

```python
@proj.hook(0x4012a0, length=5)         # at this address, skip 5 bytes
def my_strlen(state):
    state.regs.rax = 32

# Or replace by symbol
class strcmp_hook(angr.SimProcedure):
    def run(self, a, b):
        return claripy.BVS('strcmp_ret', 32)

proj.hook_symbol('strcmp', strcmp_hook())
```

`SimProcedure`s replace library calls with concrete or symbolic semantics.

## Common patterns

### Crackme — find input that prints "Win!"

```python
proj = angr.Project('./crackme')
state = proj.factory.entry_state()
sm = proj.factory.simulation_manager(state)
sm.explore(find=lambda s: b'Win!' in s.posix.dumps(1))
print(sm.found[0].posix.dumps(0))
```

### Constrain stdin to printable ASCII

```python
for ch in chunks(sym_in, 8):
    state.solver.add(ch >= 0x20)
    state.solver.add(ch <= 0x7e)
```

### CFG construction

```python
cfg = proj.analyses.CFGFast()
cfg = proj.analyses.CFGEmulated()        # more accurate, slower

for fn in cfg.kb.functions.values():
    print(hex(fn.addr), fn.name)
```

### VEX IR inspection

```python
block = proj.factory.block(0x4012a0)
block.pp()           # disasm
block.vex.pp()       # VEX IR
```

## angrop — ROP chain via symbolic exec

```python
import angrop
proj = angr.Project('./vuln')
rop = proj.analyses.ROP()
rop.find_gadgets()
chain = rop.execve(b'/bin/sh\x00')
chain.payload_str()
```

Slower than ropper for huge libcs, but figures out non-trivial chains.

## Performance tips

- Limit input size (each symbolic byte = exponential branching).
- Use **unicorn engine** (`add_options=...UNICORN`) for fast concrete sections.
- Use **veritesting** (`new_state(veritesting=True)`) for path merging.
- Use **DSE (dynamic-symbolic)** by combining angr with Frida traces.
- Avoid full library loading (`auto_load_libs=False`) unless needed.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Path explosion (millions of states) | Add constraints early; bound input size; use veritesting |
| Solver timeout | Set `state.solver.timeout = 10000` (ms); simplify expressions |
| Hooks not triggering | Wrong PIE base; rebase address with `loader.main_object.mapped_base` |
| Memory error in run | `STRICT_PAGE_ACCESS` rejects symbolic-pointer reads; remove or hook |
| Wrong arch detected | `Project(..., main_opts={'backend': 'elf', 'arch': 'amd64'})` |

## Defender perspective

angr is RE / vuln-research. Defenders use it to:

- Validate that a patched function eliminates the vulnerable path.
- Auto-generate test cases that hit hard-to-reach branches.
- Verify obfuscated firmware behavior.

## OPSEC

- Symbolic execution can be slow / memory-hungry — run in dedicated boxes; risk of hangs.
- Project files contain memory snapshots → treat sensitive binaries with care.

## Related tools

| Tool | Niche |
|------|-------|
| **Triton** | Symbolic + concolic, lighter |
| **manticore** | Trail of Bits' alternative |
| **KLEE** | LLVM-bytecode-level symbolic exec |
| **S2E** | Whole-system symbolic exec |
| **Jakstab / BAP** | IR-based binary analysis platforms |
| **angr-management** | GUI front-end |
