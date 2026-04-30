# AFL++ — full tutorial

`AFL++` (American Fuzzy Lop, plus-plus fork) is the gold-standard coverage-guided fuzzer. Mutates inputs, runs the target, watches branch coverage via instrumentation, and keeps inputs that hit new branches. Has discovered hundreds of CVEs.

## Install

```terminal
# Ubuntu / Debian
git clone https://github.com/AFLplusplus/AFLplusplus
cd AFLplusplus
make distrib
sudo make install
afl-fuzz -h
```

Or `brew install afl-fuzz` (macOS, slightly older).

## Concepts

- **Instrumentation** — at each conditional branch, the target writes to a coverage bitmap.
- **Mutator** — bit-flips, byte-flips, splice from queue, dictionary-driven, deterministic / havoc.
- **Fork-server** — fork() once after target init; subsequent inputs reuse the warm process.
- **Persistent mode** — the harness loops; orders of magnitude faster than fork-server.

## Building an instrumented target

```terminal
# C / C++ binary
CC=afl-cc CXX=afl-c++ ./configure
make

# Quick & dirty
afl-cc -O2 -o vuln vuln.c

# Generate sanitizer-instrumented build
AFL_USE_ASAN=1 afl-cc -o vuln_asan vuln.c
```

`afl-cc` chooses the best instrumentation backend (LTO, GCC-plugin, classic) automatically. For prebuilt closed-source binaries, use **QEMU mode**:

```terminal
afl-fuzz -Q -i in -o out -- ./closed_binary @@
```

…or **Frida mode** for cross-arch fuzzing of binaries.

## Harness

For library fuzzing, write a minimal harness:

```c
// libfuzzer-style harness; AFL++ supports same entry point
int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    parse_input(data, size);
    return 0;
}
```

Build:

```terminal
afl-clang-fast -fsanitize=address -o harness harness.c -lyourlib
```

## Run

```terminal
mkdir corpus
echo "AAA" > corpus/seed1
afl-fuzz -i corpus -o findings -- ./vuln @@
```

`@@` is replaced with the path to the input file (or `-` for stdin).

## Status screen meaning

```
process timing                              overall results
  run time: 0 days, 0 hrs, 12 min, 4 sec    cycles done: 1
  last new path: 0 days, 0 hrs, 0 min, 23 sec    total paths: 412
  last uniq crash: 0 days, 0 hrs, 11 min, 1 sec    uniq crashes: 3
  last uniq hang: none seen yet             uniq hangs: 0

cycle progress                              map coverage
  now processing: 19 (4.61%)                  map density: 1.84% / 7.36%
                                            count coverage: 1.83 bits/tuple

stage progress                              findings in depth
  now trying: havoc                          favored paths: 102 (24.76%)
  stage execs: 36/256 (14.06%)               new edges on: 84 (20.39%)
                                            total crashes: 3 (3 unique)
```

What to watch:
- **paths** count growing → exploration alive.
- **uniq crashes** > 0 → triage.
- **stability** → for non-deterministic targets, drops indicate concurrency issues.

## Triage — what to do with crashes

`out/default/crashes/id:000000,sig:11,...` — each crash file. Replay:

```terminal
./vuln_asan crashes/id:000000,*
```

ASAN output gives the bug line. Then de-duplicate / minimize:

```terminal
afl-tmin -i crash.bin -o crash.min -- ./vuln @@
```

`afl-tmin` shrinks the input while preserving the crash signature.

## Parallelization

```terminal
afl-fuzz -i in -o sync -M master -- ./vuln @@ &
for i in {1..7}; do afl-fuzz -i in -o sync -S secondary$i -- ./vuln @@ & done
afl-whatsup sync/
afl-plot sync/master/ plot/
```

Master + N secondaries share findings via `sync/`. Use `-l 23 -L 0` for power-schedule strategies on secondaries.

## Dictionaries

```terminal
afl-fuzz -x dict.txt -i in -o out -- ./vuln @@
```

Provide format-specific tokens (`http_methods.dict`, `xml.dict`, etc.) — AFL++ will favor mutations that include them.

## Custom mutators

For non-trivial protocols / file formats, write Python / Rust mutators (`AFL_CUSTOM_MUTATOR_LIBRARY`). Examples in repo: PNG, MP4, complex binary formats.

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| `Spurious /tmp/.afl_*` errors | `sudo sysctl kernel.core_pattern=core` |
| `Pipe at the beginning of '@@'` | Use `<` / `cat` for stdin instead of `@@` |
| Coverage stuck at < 1% | Bad seeds; use `afl-cmin` to minimize, or seed from real inputs |
| Crashes are duplicates of each other | Use `afl-cmin -C` to bucket by signature |
| QEMU mode crashes | Build with `qemu-imager`; some new instructions unsupported |

## Defender perspective

AFL++ runs on **your** code (or vendor's, if scoped). Use cases:

- Pre-merge fuzzing in CI for parsers / config loaders / network protocols.
- Continuous fuzzing in OSS-Fuzz / ClusterFuzzLite.
- Triage queue → hot-fix → re-fuzz.

## Related tools

| Tool | Niche |
|------|-------|
| **libFuzzer** | LLVM in-process fuzzer (faster harness) |
| **honggfuzz** | Google alternative; multi-strategy |
| **syzkaller** | Linux kernel-specific fuzzer |
| **boofuzz** | Network-protocol fuzzer |
| **OSS-Fuzz / ClusterFuzzLite** | Hosted fuzzing for OSS projects |
| **Jazzer** | Java fuzzing |
| **Atheris** | Python fuzzing |
| **cargo-fuzz** | Rust fuzzing |
