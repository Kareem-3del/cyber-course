# wpscan — full tutorial

`wpscan` is the WordPress security scanner. It enumerates plugins, themes, users, configuration files, and known vulnerabilities (via the WPScan vulnerability DB API). One of the most reliable point tools in any web engagement that touches WordPress.

## Install

```terminal
gem install wpscan
docker run -it --rm wpscanteam/wpscan -h
```

Get a free API token from `wpscan.com` → enables vulnerability lookups (rate-limited to 25 req/day on free tier).

## Core parameters

| Flag | Purpose |
|------|---------|
| `--url <url>` | Target |
| `--api-token <key>` | Enables vuln lookups |
| `-e <list>` | Enumerate: `vp` (plugins), `vt` (themes), `u` (users), `ap` (all plugins), `at` (all themes), `cb` (config backups), `dbe` (db exports) |
| `--plugins-detection mixed|passive|aggressive` | Detection mode |
| `--themes-detection ...` | Same |
| `--passwords <wordlist>` | Brute force passwords |
| `--usernames <list/file>` | Users to attack |
| `--max-threads <n>` | Brute concurrency (default 5) |
| `--login-uri <path>` | Custom login URL |
| `--proxy <url>` | Burp / Tor |
| `--cookie-string <c>` | Authenticated scan |
| `--user-agent <ua>` | Override UA |
| `--random-user-agent` | Per-request UA rotation |
| `--throttle <ms>` | Inter-request delay |
| `--request-timeout <sec>` | Network timeout |
| `--no-banner` | Suppress logo |
| `--format <json|cli>` | Output format |
| `-o <file>` | Output to file |

## Workflows

### Standard scan

```terminal
wpscan --url https://target.com --api-token <KEY> \
  -e vp,vt,u,cb --plugins-detection aggressive \
  -o wpscan.json --format json
```

### User enumeration only (very fast)

```terminal
wpscan --url https://target.com -e u
# Output: id, login, slug — useful for password spray
```

### Plugin/theme version + vuln check

```terminal
wpscan --url https://target.com -e ap,at --api-token <KEY>
```

### Brute against the WP login

```terminal
wpscan --url https://target.com \
  -U admin,editor -P /usr/share/wordlists/rockyou.txt \
  --max-threads 10 --throttle 100
```

### Behind Cloudflare / WAF — slow and stealthy

```terminal
wpscan --url https://target.com \
  --random-user-agent --throttle 1500 \
  --plugins-detection passive
```

## Good output

```
[+] WordPress version 6.4.2 identified (Insecure, released on 2023-12-21).
 | Found By: Rss Generator (Passive Detection)

[i] Plugin(s) Identified:
[+] elementor
 | Location: https://target.com/wp-content/plugins/elementor/
 | Latest Version: 3.21.5
 | Found By: Urls In Homepage (Passive Detection)
 |
 | [!] CVE-2024-37261 (CVSS 8.8) — Authenticated SQL Injection
 |    Fixed in: 3.20.0

[+] User Enumeration:
 | id: 1, login: admin, slug: admin
 | id: 5, login: editor1, slug: editor1
```

What to act on first:
1. Plugins/themes with critical/high CVEs and version < fix.
2. Users — feed into password spray.
3. Config backups (`wp-config.php.bak`) found via `cb`.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `0 plugins found` | Site obfuscates plugin paths | `--plugins-detection aggressive` (sends ~80,000 path requests) |
| Tool stalls | Slow site or rate-limited | `--throttle`, lower `--max-threads` |
| `--api-token quota exceeded` | Free quota burned | Wait 24h or upgrade plan |
| 403 from WAF | Cloudflare et al. | `--random-user-agent --throttle`; route through residential proxy |
| Brute always fails | Cloudflare login challenge | wpscan can't bypass JS challenges; use Cloudflare-bypass libs first |
| Wrong WP version reported | Site stripped meta + hides feeds | Check manually for tells (`/readme.html`, `/wp-includes/`, JS file paths) |

## Defender's perspective

WPScan's signature is hard to miss:

- Long lists of GET requests to `/wp-content/plugins/<plugin>/readme.txt` (or similar).
- UA: `WPScan v3.x.x (https://wpscan.com/wordpress-security-scanner)` by default.
- Login brute: many POSTs to `/wp-login.php`.
- User enum: `/?author=1`, `/?author=2`, ... or `/wp-json/wp/v2/users`.

Defenses:

- `wp-json/wp/v2/users` should be locked to admins (plugin: `Disable REST API`).
- `?author=N` should redirect or 404; `Stop User Enumeration` plugin.
- Block `/readme.html`, `/license.txt`, version meta.
- Login brute: limit attempts (Wordfence, Limit Login Attempts, fail2ban).
- WAF rule blocking `wpscan` UA blocks the 5% of attackers who don't change it.

## OPSEC

- Default UA = banner. `--random-user-agent`.
- Aggressive plugin detection sends ~80k requests to one site — guaranteed to alert any blue team.
- For stealth, run `passive` detection plus a limited list of plugins from a Burp recon.

## Related tools

| Tool | Niche |
|------|-------|
| **wpvulndb / WPScan API** | Standalone vuln lookups |
| **wp-cli** | Authenticated WP admin from CLI |
| **CMSeek** | Multi-CMS detection (WP/Joomla/Drupal) |
| **droopescan** | Drupal-focused |
| **JoomScan** | Joomla equivalent |
| **nuclei** | Generic CVE templates including many WP plugin checks |
