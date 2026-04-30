# ffuf — full tutorial

`ffuf` (Fuzz Faster U Fool) is a fast HTTP fuzzer in Go. It substitutes a wordlist into any place in a request — URL, header, body, parameter — and filters/matches responses. Used for directory busting, parameter discovery, virtual-host enumeration, and authentication brute-force.

## Install

```terminal
go install github.com/ffuf/ffuf/v2@latest
brew install ffuf
```

## The substitution model

You mark substitution points with `FUZZ`. You can have multiple, named: `W1`, `W2`, etc. Wordlists are mapped via `-w wordlist:KEYWORD`.

```terminal
# One-place fuzz (URL path)
ffuf -u https://target.com/FUZZ -w wordlist.txt

# Two-place fuzz (user + password)
ffuf -u https://target.com/login \
  -X POST -d 'user=W1&pass=W2' \
  -w users.txt:W1 -w pwds.txt:W2 \
  -mode clusterbomb
```

## Core parameters

### Inputs

| Flag | Purpose |
|------|---------|
| `-u <url>` | URL with `FUZZ` placeholder |
| `-w <file>:<KEYWORD>` | Wordlist with optional keyword |
| `-X <method>` | HTTP method |
| `-d <body>` | Request body |
| `-H <header>` | Add header (`-H "Cookie: x=y"`) |
| `-b <cookie>` | Cookie shorthand |
| `-mode <m>` | `clusterbomb` (default), `pitchfork`, `sniper` |
| `-request <file>` | Use a saved raw request (e.g. from Burp) |
| `-request-proto <proto>` | `http` or `https` for the saved request |

### Filtering / matching

| Flag | Match | Filter (drop) |
|------|-------|---------------|
| `-mc <codes>` | Status codes | `-fc` |
| `-ml <int>` | Lines | `-fl` |
| `-mw <int>` | Words | `-fw` |
| `-ms <int>` | Size (bytes) | `-fs` |
| `-mr <regex>` | Regex on response | `-fr` |
| `-mt <int>` | Response time (ms) | — |
| `-ac` | Auto-calibrate (detect baseline noise and filter it) | — |
| `-acc <list>` | Auto-calibrate with custom seed values | — |

`-ac` is the killer feature. ffuf sends a few invented paths (e.g., `randomstuff123`) up front, learns the wildcard 200 response signature, and silently filters everything matching it.

### Speed

| Flag | Purpose |
|------|---------|
| `-t <int>` | Threads (default 40) |
| `-rate <int>` | Requests per second cap |
| `-p <delay>` | Random delay between requests (`-p 0.1-2.0`) |
| `-timeout <int>` | Per-req timeout |
| `-maxtime <int>` | Total runtime cap |
| `-maxtime-job <int>` | Per-job cap |
| `-recursion` | Recurse into discovered dirs |
| `-recursion-depth <n>` | Max depth |
| `-recursion-strategy default|greedy` | Aggressiveness |

### Output

| Flag | Purpose |
|------|---------|
| `-o <file>` | Output |
| `-of <fmt>` | `json`, `csv`, `html`, `md`, `ejson` |
| `-or` | Skip writing if no findings |
| `-s` | Silent (only matched results) |
| `-v` | Verbose |
| `-c` | Force color |

## Workflows

### Directory busting

```terminal
ffuf -u https://target.com/FUZZ \
  -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -mc 200,204,301,302,307,401,403 -ac -recursion -recursion-depth 2 \
  -o dirs.json -of json
```

### Find common files (`.env`, `.git/config`)

```terminal
ffuf -u https://target.com/FUZZ \
  -w /usr/share/seclists/Discovery/Web-Content/raft-large-files.txt \
  -mc 200 -ac -t 50
```

### Virtual host enumeration

```terminal
ffuf -u https://target.com/ -H "Host: FUZZ.target.com" \
  -w subs.txt -fs 4242 -ac
# fs filters the default-host response size
```

### GET parameter discovery

```terminal
ffuf -u "https://target.com/api?FUZZ=test" \
  -w params.txt -fs <baseline-size> -ac -mc all
```

### Login brute (lab only)

```terminal
ffuf -u https://target.com/login \
  -X POST -d 'username=admin&password=FUZZ' \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -w rockyou.txt -fr "Invalid credentials" -t 20 -p 0.05-0.2
```

### Cluster-bomb (every combo) vs pitchfork (parallel rows)

```terminal
# clusterbomb — default; users × passwords cartesian product
ffuf -mode clusterbomb -w u.txt:W1 -w p.txt:W2 ...

# pitchfork — line N of W1 paired with line N of W2; for cred-stuffed pairs
ffuf -mode pitchfork -w pairs_users.txt:W1 -w pairs_passes.txt:W2 ...
```

### Resume an interrupted scan

```terminal
ffuf ... -ic -input-cmd 'cat wordlist.txt'      # raw stdin source
ffuf ... -resume                                 # works with -o JSON state file
```

## Good output

```
                /'___\  /'___\           /'___\
        ╱   ╱  /\ \__/ /\ \__/  __  __  /\ \__/
       /'___\  \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\
      /\ \__/   \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/
      \ \____\   \ \_\   \ \_\  \ \____/  \ \_\
       \/____/    \/_/    \/_/   \/___/    \/_/
       v2.1.0 ──────────────────

[Status: 200, Size: 4242, Words: 312, Lines: 88]
admin               [Status: 401, Size: 89, Words: 4, Lines: 5]
backup-old          [Status: 200, Size: 0,    Words: 1, Lines: 1]
.env                [Status: 200, Size: 1024, Words: 33, Lines: 12]
```

The `.env` 200 with non-zero size is gold. Always investigate `403`s — sometimes auth-bypassable; always investigate `401`s — confirms an auth-protected resource exists.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Every word is a "200 hit" | Wildcard / SPA returning 200 for everything | Add `-ac` (auto-calibration) and re-run |
| Tool is slow | Server slow or you're polite (`-p`) | Tune `-rate` and `-t`; run from a closer egress |
| Server starts blocking | WAF/rate-limit | `-rate 30 -p 0.05-0.3`; rotate IPs (residential proxy) |
| 502/503 across results | You DoS'ed the host | Drop threads to 5–10; back off |
| Real bug missed | Wrong matcher | Combine: `-mc all -fc 404 -fr 'Not Found'` |
| Recursion explodes | `-recursion` without depth cap | `-recursion-depth 2` |

## Defender's perspective

In access logs you'll see:

- One IP, hundreds-thousands of requests per second.
- Sequential requests to randomized paths.
- User-Agent: `Fuzz Faster U Fool v2.x.y` by default.

Detection / mitigation:

- WAF rule on the default UA.
- Rate-limit per IP at the edge.
- Honeytoken paths: `/.aws/credentials`, `/.git/config` — any access is malicious.

## OPSEC notes

- Override UA: `-H "User-Agent: Mozilla/5.0 ..."`.
- Use `-rate` to stay under WAF thresholds.
- For credential brute: the target's account-lockout policy can lock real users — use `-mode pitchfork` with known-leaked pairs instead of `clusterbomb`.

## Related tools

| Tool | Use |
|------|-----|
| `gobuster` / `dirsearch` / `feroxbuster` | Other dirbusters; different defaults |
| `Burp Intruder` | GUI, more deliberate, slower |
| `wfuzz` | Predecessor to ffuf, slower |
| `arjun` | HTTP parameter discovery (smarter heuristics) |
| `kiterunner` | API-aware path discovery (Swagger-derived wordlists) |
