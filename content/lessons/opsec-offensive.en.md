# Offensive OPSEC — Avoiding Attribution

OPSEC isn't paranoia. It's the discipline of not leaving evidence that lets a defender either kick you out faster than you finish, or trace the operation back to a person, team, or sponsoring organization. This lesson is for **authorized red teams** who need to operate realistically, and for **defenders** who want to know which seams to look at.

> [!warning] Authorized engagements only
> Everything below assumes a written engagement scope. The same techniques used outside authorization are evidence-of-intent prosecutors love.

## The five OPSEC failures that burn operations

1. **Reusing infrastructure** across campaigns / customers.
2. **Operating from your home / office IP** even once.
3. **Personal accounts** logged into operational machines.
4. **Time-zone artifacts** in code, build paths, language settings.
5. **Sloppy code reuse** — same string, mutex, RC4 key across implants.

Each item below maps to one of these.

## Identity hygiene

```terminal
# Never let your real identity touch operational systems.
# Each operation gets a fresh persona:
# - Burner email (ProtonMail/Tutanota via Tor signup)
# - Dedicated phone (eSIM, prepaid, used only for that op)
# - Crypto wallet funded through a mixer or via DEX hops, never KYC'd
# - Browser profile per persona, sandboxed VM per persona

qubes-vm-create persona-alpha --template fedora-39
firefox --profile ~/persona-alpha/.mozilla/firefox/op
```

Also: do not check personal Gmail / X / Slack from any operational VM. Browser fingerprint correlation is published research.

## Workstation isolation

```
[ host laptop, daily use, full disk encryption ]
         │
         └─── [ Qubes / Whonix VMs per operation ]
                    │
                    └─── [ Tor → bought-VPN → tier-1 VPS → C2 ]
```

- Operational VMs never reach the internet directly.
- Snapshots before every session, restore after — stops persistence accidents from contaminating the next op.
- Different operations in different VMs; **never** combine them.

## Network egress

| Layer | Purpose | Notes |
|-------|---------|-------|
| Tor | Anonymize signup / first-touch buying | Avoid for high-bandwidth or beacon traffic |
| Paid VPN (crypto) | Hide tier-1 IP origin | Choose one with no-logs and an unfriendly jurisdiction |
| Tier-1 VPS | Persistent egress, scanning | Burned per op |
| Tier-2 redirector | Front to victim | CDN-fronted, "categorized benign" |

**Time-zone discipline:** keep VM clock and locale matched to the persona's claimed origin. If operating "from Berlin," locale `de-DE`, timezone `Europe/Berlin`. Adversaries have been attributed by `tzdata` strings in compiled binaries.

## Code & implant OPSEC

> [!tip] What gets you fingerprinted
> Reused mutex names, hardcoded encryption keys, unique typo in error message, PDB path containing your username, RTL/LTR override misuse, identical packer config, identical XOR key length.

```terminal
# Strip every artifact at build:
go build -ldflags="-s -w -buildid= -X main.buildtime=2020-01-01"
strip --strip-all binary
nm -D binary | wc -l   # should be ~0

# Reproducible builds — same source produces same binary
SOURCE_DATE_EPOCH=1577836800 go build -trimpath ...
```

For the implant itself: rotate mutex names, randomize key material per build, randomize import order, and use a fresh code-signing certificate per cluster.

## Tooling discipline

- Never log into operational infra from a browser that has personal sessions cached.
- Never `git push` to a public repo from an op VM.
- Beware DNS leaks — verify with `dnsleaktest` from inside the VM, not the host.
- Beware WebRTC IP disclosure in browsers — disable.
- Beware time skew — synchronize VM via persona-region NTP, not host.

## "Loud" vs "quiet" modes

A sponsor / engagement spec defines tolerance:

| Mode | Behavior | Detection trade |
|------|----------|----------------|
| Quiet | LOLBAS only, beacon every 6h jittered, exfil at MB/day | Low — meant to live months |
| Standard | Custom implant, daily beacon, exfil at GB | Medium |
| Loud | Drop a known framework (Cobalt Strike, Sliver) without obfuscation | High — fast goal, attribution-friendly |

Default to **quiet** unless the engagement explicitly asks otherwise. Loud ops deny defenders the chance to learn realistic blue-team patterns.

## Anti-forensics — what attackers do at the end

```terminal
# Windows event log clearing (noisy on its own, but slows IR)
wevtutil cl Security
wevtutil cl System
wevtutil cl Application

# Selective log deletion (preferred, less alarming)
# Use APIs to remove specific event records via EVTX manipulation tools
xeexs evtx-edit Security.evtx --delete-id 4624 --user op_user

# Linux
shred -uvz /var/log/auth.log
unset HISTFILE; export HISTSIZE=0
ln -sf /dev/null ~/.bash_history

# Timestomp
touch -r /bin/ls /tmp/evil   # match modify time of /bin/ls
SetMace.exe -p evil.dll -t "2018-01-15 09:31:14" -m -a -c -e
```

> [!danger] Anti-forensics is itself a signal
> A blank `Security.evtx`, a `~/.bash_history` linked to `/dev/null`, a binary with a 2018 timestamp on a 2026-installed system — these are red flags for any forensicator. State actors prefer surgical edits or running entirely in memory to avoid leaving deletion artifacts.

## False flags — the sponsor decision

Implanting attribution-confusing strings (Korean comments, Russian build paths, criminal-tool reuse) is a deliberate operation choice that is **not** the operator's call. It changes diplomatic posture if discovered. Engagements rarely authorize this; it appears in real APT work.

## Defender's OPSEC inversion

Look for the **anti-OPSEC**, not just the malware:

- Domain registered yesterday, valid LE cert, "categorized: undefined" → suspicious.
- Beacon to Cloudflare with `X-Forwarded-Host` SNI mismatch → domain fronting.
- Build artifacts with `tzdata` shifts mid-campaign → operator changed shift / shop.
- Identical mutex across two unrelated incidents → shared toolkit / shared actor.
- A binary with stripped symbols **and** a forgotten `.pdb` reference → operator forgot the strip step.

The operator's worst day is the defender's best lead. Look for slip-ups, log them, share via ISAC.
