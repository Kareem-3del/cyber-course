# Pacu — full tutorial

`Pacu` is the AWS exploitation framework. Like Metasploit but for AWS — modules for IAM enumeration, privilege escalation, persistence, lateral movement, exfiltration. Maintained by Rhino Security Labs.

## Install

```terminal
pipx install pacu
pacu
```

Or run via Docker: `docker run --rm -it rhinosecuritylabs/pacu`.

## Sessions / keys

```
Pacu > set_keys
> Key alias: target-prod
> Access key ID: AKIA...
> Secret access key: ...
> Session token (optional): 
```

Sessions persist between launches. List with `list_sessions`, switch with `swap_session <id>`.

## Modules — what's in the box

| Module | Purpose |
|--------|---------|
| `iam__enum_permissions` | What can my key do? |
| `iam__enum_users_roles_policies_groups` | Inventory of identities |
| `iam__privesc_scan` | Try ~30 documented privesc paths |
| `iam__backdoor_users_keys` | Add an access key to existing users |
| `iam__backdoor_users_password` | Reset login profile |
| `iam__backdoor_assume_role` | Add yourself to AssumeRole policies |
| `s3__bucket_finder` | Discover & test buckets |
| `s3__download_bucket` | Sync bucket contents locally |
| `ec2__enum` | EC2 instances, AMIs, snapshots, ENIs |
| `ec2__startup_shell_script` | Replace UserData (post-stop), gain code on next boot |
| `ec2__download_userdata` | Pull current UserData (often holds creds) |
| `lambda__download` | Download Lambda function code (often has secrets) |
| `lambda__backdoor_new_role` | Create lambda as backdoor |
| `cloudtrail__download_event_history` | Snapshot logs you might disable later |
| `cloudtrail__csv_injection` | Inject CSV-formula payloads in events |
| `detection__disruption` | Disable GuardDuty / CloudTrail / Config (loud!) |
| `disable_security_services` | Same |
| `vpc__enum` | VPC, security groups |
| `cognito__enum` | Cognito user pools (frequent leak vector) |

`list modules` shows all 50+. `search <keyword>` finds matching ones.

## Workflow

### 1. Enumerate

```
Pacu > run iam__enum_permissions
Pacu > run iam__enum_users_roles_policies_groups
```

Stores results in session DB; explore with `data IAM`, `data EC2`, etc.

### 2. Privesc scan

```
Pacu > run iam__privesc_scan
```

Output: list of privesc paths your principal can execute. **Confirm** before running:

```
Pacu > run iam__privesc_scan --offline   # plan only
Pacu > run iam__privesc_scan             # actually attempt
```

### 3. Service-specific exploitation

```
Pacu > run s3__bucket_finder
Pacu > run ec2__download_userdata
Pacu > run lambda__download
Pacu > run cognito__enum
```

### 4. Persistence

```
Pacu > run iam__backdoor_users_keys --usernames admin1,admin2
```

Adds an access key (you control) to those users. Survives password rotation.

### 5. Cover (loud — only with explicit authorization)

```
Pacu > run detection__disruption
```

Disables GuardDuty, stops CloudTrail. Generates `StopLogging` API calls — visible to anyone watching the management account.

## Good output

```
running module iam__privesc_scan...
[+] Confirmed Permissions: iam:CreatePolicyVersion, iam:SetDefaultPolicyVersion
[+] Privilege Escalation Vector: CreateNewPolicyVersion → ATTACK PATH
[+] Updating attached policy 'AdminLite' with admin permissions...
[+] You are now effective administrator. Re-run iam__enum_permissions to verify.
```

## Bad output and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `AccessDenied: not authorized to perform sts:GetCallerIdentity` | Bad creds | Re-set keys; check region |
| Module fails on a single region | Missing `set_regions` | `set_regions us-east-1 us-west-2 ...` |
| `iam__privesc_scan` slow | Tries every path serially | Use `--offline` first to plan |
| Persistent failure on backdoor | CloudFormation drift detection | Pause CFN drift checks for window |

## Defender's perspective

Pacu generates a **massive amount of CloudTrail noise**:

- `iam__enum_permissions` simulates `IAMSimulatePrincipalPolicy` calls — flag pattern.
- `*PolicyVersion` events are rare in healthy accounts → treat as critical.
- Many APIs in seconds from one user → spray.
- `StopLogging` / `DeleteTrail` / `DeleteFlowLogs` / `UpdateGuardDutyDetector(Enable=false)` → ALARM.

Detection (CloudWatch / Athena queries provided in the AWS attack-chains lesson):

```sql
SELECT eventName, COUNT(*) FROM cloudtrail
WHERE userIdentity.arn = 'arn:aws:iam::123:user/dev-bot'
  AND eventTime > now() - interval '1' hour
GROUP BY eventName HAVING COUNT(*) > 50;
```

## OPSEC

- **Tag every action** with a CloudTrail-visible session name; helps clean up post-engagement.
- Disable noisy modules in `--regions` you don't need.
- Don't run `detection__disruption` on engagements without explicit written permission to disable security tooling.

## Related tools

| Tool | Niche |
|------|-------|
| **CloudFox** | Faster passive enum, no exploitation |
| **Prowler** | Defender's posture audit |
| **ScoutSuite** | Defender's HTML report |
| **leonidas** / **stratus-red-team** | Adversary-emulation library for cloud |
| **enumerate-iam** | Lightweight IAM permission enum |
| **aws-vault** | Secure cred caching for the operator |
