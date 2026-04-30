# BloodHound / SharpHound — full tutorial

BloodHound is the Active Directory attack-graph analyzer. SharpHound is its data collector. Together they reveal which low-priv user can reach Domain Admin in how many steps — making AD privilege escalation a graph-traversal problem.

## Architecture

```
[ SharpHound on a domain-joined Win host ]
        │ collects domain data
        ▼
[ ZIP / JSON files ]
        │ uploaded to BloodHound UI
        ▼
[ Neo4j graph DB ]
        │ Cypher queries / built-in pre-canned analytics
        ▼
[ "Shortest path from low-priv to DA" ]
```

Two product flavors:
- **BloodHound CE** — open-source community edition (current, recommended).
- **BloodHound Legacy** — old standalone GUI (still works but development paused).

## SharpHound — collector

### Install

C# binary `SharpHound.exe`, or the Python collector `bloodhound-python`:

```terminal
pip install bloodhound
git clone https://github.com/SpecterOps/SharpHound  # build with .NET 6
```

### Key parameters (SharpHound.exe)

| Flag | Purpose |
|------|---------|
| `-c, --CollectionMethods <list>` | What to collect; default `Default` |
| `-d, --Domain <fqdn>` | Specific domain |
| `--LdapUsername / --LdapPassword` | Use creds (instead of current Kerberos) |
| `--DomainController <dc>` | Pin to one DC |
| `--ZipFilename <name>` | Output zip name |
| `--OutputDirectory <path>` | Where to drop output |
| `--RandomFilenames` | Obfuscation |
| `--EncryptZip` | Password-protect zip |
| `--Loop / --LoopDuration` | Repeat collection (long engagements) |
| `--Throttle <ms>` / `--Jitter <%>` | Slow / randomize |
| `--ExcludeDomainControllers` | Don't query DCs (stealthier on session collection) |

`CollectionMethods` values:

| Method | What it collects |
|--------|------------------|
| `Default` | Group, ACL, ObjectProps, Trusts, Container, Session |
| `All` | Default + LocalAdmin, RDP, DCOM, PSRemote, GPOLocalGroup, Cert |
| `DCOnly` | Group, Trusts, ACLs, ObjectProps — no per-host calls |
| `Session` | Just logged-on session data |
| `LocalGroup` | Local admin / RDP / etc. (loud — touches every host) |
| `Cert` | AD CS templates / CAs (for ESC1-15 analysis) |
| `Trusts` | Forest trusts |

### bloodhound-python (Linux operator-side)

```terminal
bloodhound-python -u alice -p 'Pass1' -d corp.local -c All -ns 10.0.0.1 --zip
```

## Workflows

### Standard collection (domain-joined, normal user)

```terminal
SharpHound.exe -c Default,LocalAdmin,RDP,DCOM,PSRemote
```

### Stealthy DC-only collection

```terminal
SharpHound.exe -c DCOnly --Throttle 1000 --Jitter 30 --RandomFilenames
```

### From Linux operator host

```terminal
bloodhound-python -u alice@corp.local -p 'Pass1' -d corp.local \
  -c All -ns 10.0.0.1 --zip
```

### AD CS analysis (ESC1-15)

```terminal
SharpHound.exe -c CertServices,Default
# Then in BloodHound, run: "Find Certificate Authorities" pre-canned query
```

## BloodHound UI workflow

1. Start neo4j and BloodHound CE (Docker compose recommended):

```terminal
git clone https://github.com/SpecterOps/BloodHound && cd BloodHound
docker compose -f examples/docker-compose/docker-compose.yml up
# UI on http://localhost:8080  (default creds shown in console on first start)
```

2. Upload SharpHound zip via the UI.
3. Use the **Pathfinding** view: source = your compromised user, destination = `Domain Admins`.
4. Run pre-canned analytics from the menu:
   - "Find all Domain Admins"
   - "Find Shortest Paths to Domain Admins"
   - "Find AS-REP Roastable Users"
   - "Find Kerberoastable Users"
   - "Find Computers where Domain Users are Local Admin"
   - "Find AD CS misconfigurations"

5. Custom Cypher when pre-cans don't cut it:

```cypher
// Users who can DCSync
MATCH (n)-[:GenericAll|GetChanges|GetChangesAll|AllExtendedRights]->(d:Domain {name:'CORP.LOCAL'})
RETURN n.name

// Computers where 'Domain Users' is local admin
MATCH (g:Group {name:'DOMAIN USERS@CORP.LOCAL'})-[:AdminTo]->(c:Computer)
RETURN c.name

// Sessions where high-priv account is logged in to a normal-user host
MATCH (u:User {admincount:true})-[:HasSession]->(c:Computer {operatingsystem:'Windows 10'})
RETURN u.name, c.name
```

## Good output

A path graph:

```
ALICE@CORP.LOCAL
   ↓ MemberOf
HELP_DESK@CORP.LOCAL
   ↓ AdminTo
HELPDESK-PC1.CORP.LOCAL
   ↓ HasSession
DOMAIN_ADMIN1@CORP.LOCAL
```

Five hops to DA. Each edge has a documented attack technique (right-click → "Help") with exact commands.

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Empty graph after upload | Wrong domain selected in UI | Settings → Database → switch domain |
| Many missing sessions | Session collection blocked / no host coverage | Re-run with `LocalAdmin,Session` and broader access |
| Pathfinding finds no route | Truly segmented / least-priv environment | Try shadow-credentials, NTLM-relay paths via `Find Computers with Unconstrained Delegation` |
| Neo4j RAM exhausted | Huge AD imported | Increase neo4j heap (`NEO4J_dbms_memory_heap_max__size=8G`) |
| Outdated graph | Old data | Re-collect; AD changes weekly |
| Collection throws "Access denied" everywhere | User has no enumeration rights to remote hosts | DCOnly is fine; LocalGroup/Session need cred to remote hosts (or at least a Domain User where SCM-share works) |

## Defender's perspective

SharpHound is loud unless tuned:

- Bursts of LDAP queries to DC.
- For LocalGroup / Session: per-host SAMR (port 445) calls = many SMB sessions, many EventID 4624/4634.
- Default writes a pseudo-random ZIP filename to `%TEMP%`.

Detection ideas:

- LDAP query-volume threshold (Microsoft Defender for Identity has this OOTB).
- Sysmon EID 1 for `SharpHound.exe` filename, common hash.
- EID 4661 (handle to AD object) burst from a single user.
- AD honey-objects: a fake "Domain Admins" sub-group with monitoring on enumeration; SharpHound enumerates everything → trips the trap.

## OPSEC

- Use `bloodhound-python` from your operator box; you only need a domain user cred and DC reachability.
- Tune `--Throttle 2000 --Jitter 50` to look like normal LDAP usage.
- Avoid LocalGroup/Session methods early; they're loud. DCOnly first, escalate only if needed.
- Never upload a SharpHound zip to a multi-tenant BloodHound instance — it leaks the customer's entire AD.

## Related tools

| Tool | Niche |
|------|-------|
| **AD Explorer (Sysinternals)** | Read-only AD viewer, very stealthy |
| **PingCastle** | Defender's complement — AD posture audit |
| **ADRecon** | Generates Excel report of AD state |
| **Adalanche** | BloodHound alternative with different graph model |
| **Certify / certipy** | Specifically AD CS — feeds BloodHound `Cert` data |
| **Rubeus** | Kerberos abuse identified by BloodHound paths |
