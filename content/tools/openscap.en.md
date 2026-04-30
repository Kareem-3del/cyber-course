# OpenSCAP — full tutorial

`OpenSCAP` is the open-source NIST-validated SCAP (Security Content Automation Protocol) scanner. Audits and remediates Linux against benchmarks: CIS, DISA STIG, PCI-DSS, NIST 800-171, FedRAMP. Reads SCAP content (XCCDF + OVAL + CPE files) and produces compliance reports + Ansible / Bash remediation playbooks.

## Install

```terminal
apt install libopenscap8 ssg-debian ssg-applications
yum install openscap-scanner scap-security-guide
brew install openscap     # macOS limited
```

The `scap-security-guide` (SSG) package ships content for major distros. Locations: `/usr/share/xml/scap/ssg/content/ssg-<distro>-ds.xml`.

## Subcommands

| Cmd | Purpose |
|-----|---------|
| `oscap info <file>` | Inspect content (profiles, rules) |
| `oscap xccdf eval --profile xccdf_org.ssgproject.content_profile_<id>` | Run a benchmark |
| `oscap xccdf generate fix` | Generate remediation script (bash / ansible) |
| `oscap oval eval` | Run pure OVAL definition file |
| `oscap-ssh <user@host> ...` | Remote audit |
| `oscap-vm` | Audit a VM image (offline) |
| `oscap-docker image <ref>` | Container image scan |

## Profiles bundled with SSG

Each distro's `ssg-<distro>-ds.xml` ships several profiles:

```terminal
oscap info /usr/share/xml/scap/ssg/content/ssg-rhel9-ds.xml
# Profiles:
#   xccdf_org.ssgproject.content_profile_cis_server_l1
#   xccdf_org.ssgproject.content_profile_cis_server_l2
#   xccdf_org.ssgproject.content_profile_stig
#   xccdf_org.ssgproject.content_profile_pci-dss
#   xccdf_org.ssgproject.content_profile_anssi_bp28_high
```

## Workflow

### 1. Audit a host

```terminal
oscap xccdf eval \
  --profile xccdf_org.ssgproject.content_profile_cis_server_l1 \
  --results scan-results.xml \
  --report scan-report.html \
  --oval-results \
  /usr/share/xml/scap/ssg/content/ssg-rhel9-ds.xml
firefox scan-report.html
```

The HTML shows pass/fail per rule, severity, references, and "Show fix" snippet.

### 2. Generate remediation

```terminal
oscap xccdf generate fix \
  --profile xccdf_org.ssgproject.content_profile_cis_server_l1 \
  --output cis-fix.sh \
  scan-results.xml

# or as Ansible playbook
oscap xccdf generate fix --fix-type ansible \
  --profile xccdf_...l1 --output cis-fix.yml scan-results.xml
```

### 3. Apply, re-scan, iterate

Apply fixes (after review!) → re-run audit → watch failed-rule count drop → submit final report.

### 4. Container / VM image

```terminal
oscap-docker image registry/myimage:latest \
  oval eval /usr/share/xml/scap/ssg/content/ssg-rhel9-oval.xml
```

```terminal
oscap-vm image my-image.qcow2 \
  xccdf eval --profile cis_server_l1 ssg-rhel9-ds.xml
```

## Output formats

| Format | Use |
|--------|-----|
| `--report report.html` | Human-readable |
| `--results results.xml` | XCCDF results (machine) |
| `--results-arf results-arf.xml` | Asset Reporting Format (cross-tool) |
| `--stig-viewer` | STIG Viewer JSON |
| `--cpe`/`--datastream` | Verify content packaging |

## Bad output / fixes

| Symptom | Fix |
|---------|-----|
| Many `notapplicable` rules | Wrong profile for OS (e.g., RHEL 9 profile on Ubuntu) |
| Remediation breaks system | **Always** test fixes on a non-prod host first; some rules disable services like `chronyd` if you've already custom-configured |
| `oscap-ssh` very slow | Latency; consider running scan on host directly and copying back |
| Custom checks needed | Author your own OVAL XML or contribute to SSG |
| Old SSG | `apt update` and re-run; SSG releases monthly with current content |

## Tailoring (custom profile)

```terminal
oscap xccdf generate guide --profile <id> ssg-rhel9-ds.xml > guide.html

# Generate a tailoring file (override severity / disable specific rules)
scap-workbench   # GUI tool to tailor profiles
# Or hand-write a tailoring XML
oscap xccdf eval --tailoring-file tailor.xml --profile my-tailored-profile ssg-rhel9-ds.xml
```

## Defender perspective

OpenSCAP is the canonical RHEL-style compliance scanner. Pair with:

- **Lynis** for broader hardening signals.
- **OpenSCAP-Anaconda Addon** to apply STIG profiles at install time.
- **Foreman / Satellite** to dashboard scan results across a fleet.

## OPSEC (defender)

- Scan output reveals system configuration weaknesses; encrypt at rest.
- Remediation scripts can break running services — review every change before applying.
- Pinned content versions in CI ensure reproducible scans.

## Related tools

| Tool | Niche |
|------|-------|
| **CIS-CAT** | Official CIS scanner; cross-platform |
| **Lynis** | Broader hardening / not SCAP-formal |
| **InSpec / Chef Compliance** | IaC-style checks |
| **Tenable Nessus** | Commercial vuln + compliance |
| **Wazuh SCA** | Built-in lightweight SCA in Wazuh |
