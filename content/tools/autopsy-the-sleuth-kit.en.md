# Autopsy / The Sleuth Kit — full tutorial

The Sleuth Kit (TSK) is the open-source disk forensic library. Autopsy is its GUI. Together they parse FAT/NTFS/ext/HFS/APFS, recover deleted files, build timelines, hash-match against known sets, scan for keywords, run plugins for browser history, registry, email — the full disk-forensic pipeline.

## Install

```terminal
# Linux: TSK CLI
apt install sleuthkit autopsy

# Windows / macOS: full Autopsy app
https://www.autopsy.com/download/
```

## Sleuth Kit CLI tools

| Tool | Purpose |
|------|---------|
| `mmls` | Partition map |
| `fsstat` | Filesystem details |
| `fls` | File list (active + deleted) |
| `ils` | Inodes (deleted) |
| `icat` | Cat by inode |
| `mactime` | Sort fls/ils output by MAC times |
| `tsk_recover` | Bulk recover deleted files |
| `tsk_loaddb` | Load image into Autopsy DB |
| `blkls` | Unallocated block extraction |
| `srch_strings` | Strings on a partition |

## Quick disk-forensic workflow

```terminal
# Identify partitions
mmls disk.dd
# DOS Partition Table
# Slot      Start          End          Length     Description
# 02:00     0000002048     0008390655   00008388608 NTFS / exFAT (07)

# Recursive file listing for a partition starting at offset 2048
fls -r -o 2048 disk.dd > files.fls

# Generate timeline
fls -r -m C: -o 2048 disk.dd > body.txt
mactime -d -z UTC -y -b body.txt > timeline.csv

# Recover all deleted files
tsk_recover -o 2048 -a disk.dd recovered/
```

## Autopsy GUI workflow

1. **New Case** → Create case folder.
2. **Add Data Source** → choose disk image (`.dd`, `.E01`, `.AFF`), VM disk (`.vmdk`), or live host.
3. **Ingest Modules** — pick which to run (each may take minutes):
   - **File Type ID, Hash Lookup** — checks against NSRL hash sets.
   - **Embedded File Extractor** — opens archives, EXIF in JPEGs.
   - **Recent Activity** — browser history (all major), USB plug-ins, recent docs.
   - **Keyword Search** — pre-built (URLs, emails, IPs, CCs) + custom regex.
   - **Email Parser** — Outlook PST, mbox, Maildir.
   - **Encryption Detection**.
   - **PhotoRec Carver** — file carving for unallocated space.
   - **VAD / Volatility** integration.
   - **Yara** module — scan files against rules.
4. After ingest, browse:
   - **Tree** — file system view.
   - **Views** — by file type, deleted, encrypted, MIME.
   - **Results** — keyword hits, web bookmarks, email threads, USB device list.
   - **Reports** — HTML / Excel / KML (for geo data) / SQLite-backed.

## Common artifacts surfaced

| Source | What you get |
|--------|--------------|
| `$MFT` | Every file ever on NTFS, with timestamps |
| `Recycle Bin` | "Deleted" files + original path |
| `Prefetch` | Last-execution times for ~1024 binaries |
| `Amcache.hve` | Program execution history (better than Prefetch on modern Win10/11) |
| `LNK files` | Files opened (with target, drive, MAC of origin host) |
| `JumpLists` | App-specific recent items |
| `EvtxLogs` | Windows Event Log entries |
| `RegistryHives` | Run keys, USB IDs, network history, ShimCache |
| `Browser DBs` | Chrome / Firefox / Edge history, downloads, cookies |
| `Email DBs` | Outlook PST entries |

Autopsy parses these automatically via "Recent Activity" and "Email Parser".

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Image won't load (`unsupported`) | Check format; convert with `qemu-img convert` to raw `.dd` |
| Ingest very slow | Disable carver if not needed; turn off keyword search until later |
| Massive timeline | Filter by file path / time window before export |
| Encrypted file system | BitLocker → recovery key required (from AD); FileVault → unlock keychain |
| Memory-mapped files truncated | Use offline ETW / Volatility instead — Autopsy isn't a memory tool |

## Defender / IR perspective

Autopsy is the universal "disk got pulled, what happened" tool. After KAPE collects targeted artifacts, push the resulting zip into Autopsy for parsing + timeline.

For ransomware cases: encrypted files are visible in `$MFT`, original copies often in Volume Shadow Copies (vss) — TSK can mount `\\?\HarddiskVolumeShadowCopy*` for recovery.

## OPSEC (defender)

- Always work on a **forensic copy**, not the original disk. Acquire with write-blocker.
- SHA-256 hash before and after analysis to prove integrity.
- Chain-of-custody logs for legal admissibility.

## Related tools

| Tool | Niche |
|------|-------|
| **KAPE** | Targeted live triage (subset of artifacts) — feed into Autopsy |
| **Plaso / log2timeline** | Super-timeline generator across many artifact types |
| **Velociraptor** | Live-host hunting with similar artifact extraction |
| **Magnet Axiom / EnCase / FTK** | Commercial DFIR suites |
| **bulk_extractor** | Pattern carving (CCNs, emails) on raw images |
| **PhotoRec / TestDisk** | File-recovery focused |
