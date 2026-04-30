# Target Selection — Adversary Mindset

Before any exploit runs, an adversary picks **who** to hit and **why**. Understanding this is half of defense — and the entire game for offense. This lesson teaches you to think like a sponsored operator deciding where to point a multi-million-dollar exploit chain.

> [!warning] For defenders and authorized red teams
> This material is taught so blue teams can model real threats and so authorized red teams can build realistic engagements. Do not use it to plan unauthorized operations.

## What states actually look for

Government cyber units operate under a **collection plan** — a prioritized list of intelligence gaps the political leadership wants closed. Targets get picked because they answer one of these questions:

| Intelligence priority | Concrete targets |
|----------------------|------------------|
| Military capability | defense contractors, weapons R&D, simulation labs, satellite ground stations |
| Diplomatic positions | ministries of foreign affairs, embassies, UN delegations, treaty negotiators |
| Economic / trade | central banks, sovereign wealth funds, M&A law firms, energy regulators |
| Industrial espionage | semiconductor fabs, pharma trial data, EV/battery, jet engine OEMs |
| Counter-intelligence | dissidents, journalists, cleared insiders, NGOs, exile communities |
| Pre-positioning | electric grid SCADA, water utilities, undersea cables, telco core, ports |

Notice that **information** and **leverage** are the goals. Even ransomware-style noise is often a deniable cover for an underlying intelligence or pre-positioning mission.

## How a target list is built

```terminal
# Step 1 — translate intel question into seed organizations
# "What is country X's stance on Y treaty?"  →  MFA, PM office, treaty delegation
# Step 2 — enrich seeds with public records
amass intel -org "Ministry of Foreign Affairs" -active
shodan search 'ssl:"Ministry of X" country:XX'
# Step 3 — map the human edge (recruitment / phishing surface)
hunter.io domains/mfa.gov.xx
linkedin search "diplomat" "MFA" "X"
# Step 4 — score by access likelihood × intel value
```

> [!tip] Why "soft" targets are the entry point
> A cleared diplomat's spouse on a personal Gmail, a contractor's helpdesk vendor, a translator working from a hotel — these are the path of least resistance into hard targets. Modern collection plans explicitly enumerate these adjacent humans and systems.

## The targeting funnel

### 1. Strategic — chosen by leadership

Output of intel committee meetings: "we need visibility into country X's nuclear position by Q3." This becomes a **collection requirement** with a number, like NIPF priority 1.

### 2. Operational — chosen by ops planners

Translates a requirement into named entities: people, organizations, networks. Includes risk tolerance ("loud is fine" vs. "deniable only") and timeline.

### 3. Tactical — chosen by the operator at the keyboard

Picks the specific email account, the specific server, the specific exploit. Constraints: don't burn a 0-day on a low-value target, don't get caught.

## Reconnaissance you actually do

### Footprint the organization

```terminal
# Domains and parent/subsidiaries
whois target.gov.xx
crtsh target.gov.xx | grep -Eo '[a-z0-9.-]+\.target\.gov\.xx' | sort -u
amass enum -passive -d target.gov.xx -d targetcorp.com

# External-facing services
shodan search 'ssl:"target.gov.xx"'
fofa.info "domain=\"target.gov.xx\""
censys search 'services.tls.certificates.leaf_data.subject.common_name: "target.gov.xx"'

# Wayback time machine for forgotten endpoints
waybackurls target.gov.xx | grep -E '\.(php|asp|jsp|json)' | sort -u
```

### Footprint the people

```terminal
# Public corporate roster
linkedin people search "company:'Target Gov'"
# Personal email leaks tied to corp identities
hibp domain target.gov.xx
dehashed search "@target.gov.xx"
# Tooling and version disclosures from staff posts
github search "target.gov.xx" path:.env
github search 'org:targetgov "AKIA"'
```

### Build the relationship graph

Every operator keeps a dossier — names, roles, reporting lines, vendors, travel patterns, social-media tells, family ties. The richer the graph, the more pretexts a phishing operator can choose from.

| Field | Example |
|-------|---------|
| Internal helpdesk vendor | "TechCo Helpdesk" |
| Travel approver | "M. Hassan, Chief of Staff" |
| Intl. conferences attended | "Munich Security 2024, Aspen 2025" |
| Personal email pattern | `firstname.lastname@gmail.com` |
| Children's school | "International School of X" |

## Scoring the target

A simple back-of-envelope:

```
priority = (intel_value × access_probability) / (operational_risk × cost)
```

- **intel_value**: how much the requirement is worth (NIPF tier).
- **access_probability**: based on stack version data, leak count, vendor exposure.
- **operational_risk**: detection likelihood × diplomatic blowback.
- **cost**: 0-day burn, dev time, staffing.

Targets with a 1-day published exploit, a leaked employee credential, and zero EDR get prioritized over a hardened M365 tenant — even if the latter is more "interesting."

## What defenders learn from this

> [!info] Inverting the funnel
> If you're defending, you need to know **which collection requirement you fall under**. Are you defense industrial base? Energy? Pharma R&D? That tells you which APTs are tasked at you, which TTPs they use, and where to spend the next dollar of detection.

Practical actions:

- Build an **insider value list**: who has access to the crown jewels and would be a high-priority phishing target?
- Track yourself in OSINT just like the adversary will: certificates, leaks, GitHub, LinkedIn, vendor advisories.
- Tabletop with a **named adversary** (e.g., APT29, Lazarus, MuddyWater) and walk their published TTP chain through your environment.

## Mini exercise — pick a target like an operator

Given the requirement *"understand country X's stance on undersea cable security policy by Q2"*, list the top 5 organizations to target, the top 3 named individuals, and 2 plausible initial-access vectors per target. Compare your list against published APT reporting (Mandiant, Volexity, Microsoft MSTIC) for similar real-world campaigns. The overlap is striking.
