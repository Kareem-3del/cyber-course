"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="scanning">
      <L
        ar={<>
          <Section title="Recon و Scanning — مين بيلمس و مين بيتفرج؟">
            <Analogy>الـ Recon = إنت قاعد على القهوة قصاد البنك بتتفرج. الـ Scanning = إنت دخلت اللوبي و بتجرّب كل باب تشوف اللي مفتوح. لحد دلوقتي الهدف مكنش حاسس بيك — من الخطوة دي إنت بتتعامل معاه مباشرة.</Analogy>
          </Section>
          <Section title="Port Scanning بـ Nmap — تعرف الأبواب فين">
            <p>الـ port هو "الباب" بتاع الخدمة. كل خدمة بتسمع على رقم port. nmap هي أم الأدوات هنا، و اللي مش متقنها مش هيوصل لحاجة.</p>
            <h3>المراحل بالترتيب</h3>
            <Step n={1} title="مسح سريع — اللي مفتوح فين">
              <Terminal lines={[
                { p: "nmap -sS -p- --min-rate=2000 -T4 target.gov -oA quick" },
                { o: "PORT      STATE    SERVICE\n22/tcp    open     ssh\n80/tcp    open     http\n443/tcp   open     https\n3306/tcp  open     mysql\n8080/tcp  open     http-proxy" },
              ]} />
            </Step>
            <Step n={2} title="مسح عميق — على البورتات المفتوحة بس">
              <Terminal lines={[
                { p: "nmap -sV -sC -p22,80,443,3306,8080 -oA deep target.gov" },
                { o: "22/tcp   ssh   OpenSSH 7.4  (CVE-2018-15473 user enum)\n80/tcp   http  Apache 2.4.29\n3306/tcp mysql MySQL 5.7.20 — auth-bypass possible" },
              ]} />
            </Step>
            <Step n={3} title="NSE scripts — خلي nmap يفحص لك">
              <Code lang="bash">{`# سكربتات الكشف عن الثغرات
nmap --script vuln target.gov

# سكربتات HTTP المفيدة
nmap -p80,443 --script "http-enum,http-title,http-headers" target.gov

# اختبار SSL/TLS
nmap -p443 --script ssl-enum-ciphers,ssl-cert target.gov`}</Code>
            </Step>
            <Callout kind="warn" title="عشان متلفتش النظر">
              <ul>
                <li>-T2 أبطأ بس أصعب في الـ detection.</li>
                <li>-f لتقطيع الحزم.</li>
                <li>--source-port 53 بيعدّي شوية firewalls.</li>
                <li>-D RND:10 بيخلط عناوين decoy مع طلبك.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="Vulnerability Scanning — فحص الثغرات">
            <TwoCol>
              <Card title="Nuclei" color="red">مفتوح المصدر، فيه آلاف الـ templates لـ CVEs معروفة. سريع و عملي.</Card>
              <Card title="Nikto / OpenVAS / Nessus" color="amber">سكانرات تقليدية بتغطي آلاف الفحوصات على الويب و البنية التحتية.</Card>
            </TwoCol>
            <Terminal lines={[
              { p: "nuclei -u https://target.gov -severity critical,high -tags cve,exposure,oast" },
              { o: "[critical] CVE-2024-3094 — XZ backdoor in OpenSSH\n[high] CVE-2023-23397 — Outlook NTLM leak\n[high] exposed .env file at /backup/.env" },
            ]} />
          </Section>
          <Section title="Directory Bruteforcing — اللي مش لينك في الموقع">
            <p>كتير من الـ endpoints الحساسة مش بتبقى ظاهرة في الـ UI. الـ bruteforcing هو اللي بيفضحها — و هنا بتلاقي الذهب.</p>
            <Terminal lines={[
              { p: "ffuf -u https://target.gov/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-large-words.txt -mc 200,301,403 -fs 0" },
              { o: "/admin              [301]\n/.git/config        [200]\n/api/v1/users       [200]\n/backup.zip         [200]\n/phpinfo.php        [200]" },
            ]} />
            <Callout kind="info" title="نصيحة">استخدم SecLists — أكبر مجموعة wordlists في المجال. اللي مش عنده SecLists بيشتغل بنص أدواته.</Callout>
          </Section>
          <Section title="تعداد الخدمات الشائعة — اللي بيفضح الشبكة">
            <h3>SMB (Windows)</h3>
            <Code lang="bash">{`enum4linux-ng -A target
crackmapexec smb target -u '' -p '' --shares
nxc smb target --users --groups`}</Code>
            <h3>SNMP</h3>
            <Code lang="bash">{`snmpwalk -v2c -c public target
onesixtyone -c community.txt target`}</Code>
            <h3>LDAP / Active Directory</h3>
            <Code lang="bash">{`ldapsearch -x -H ldap://target -b "DC=corp,DC=local"
bloodhound-python -d corp.local -u user -p pass -c All -ns target`}</Code>
          </Section>
          <Section title="الدفاع: خلي الـ Scanning يبقى وجع دماغ">
            <ul>
              <li>Deny by default في الـ firewall — متفتحش غير اللي محتاجه فعلاً.</li>
              <li>Rate limiting + SYN cookies في وش الـ SYN scan.</li>
              <li>IDS / Suricata / Snort مع قواعد ET-OPEN عشان تكشف بصمات nmap و nuclei و ffuf.</li>
              <li>Honeypots — بورتات مفتوحة بنية بتسجل كل واحد بيقرّب.</li>
              <li>Banner masking — لخبط بصمة الإصدار عشان يضيع وقته.</li>
            </ul>
            <Code lang="Suricata rule">{`alert tcp $EXTERNAL_NET any -> $HOME_NET any \\
  (msg:"NMAP NSE Script Scan"; flow:to_server; \\
  content:"|55 73 65 72 2d 41 67 65 6e 74 3a 20 4e 6d 61 70|"; \\
  sid:9000001; rev:1;)`}</Code>
          </Section>
        </>}
        en={<>
          <Section title="Recon vs scanning">
            <Analogy>Recon = sitting in the cafe across from the bank, watching. Scanning = walking into the lobby and trying every door to see which is unlocked. You're now interacting with the target directly.</Analogy>
          </Section>
          <Section title="Port scanning with Nmap">
            <p>A port is the "door" of a service. Every service listens on a port number. nmap is the foundational scanner.</p>
            <h3>Scanning phases, in order</h3>
            <Step n={1} title="Quick sweep to find open doors">
              <Terminal lines={[
                { p: "nmap -sS -p- --min-rate=2000 -T4 target.gov -oA quick" },
                { o: "PORT      STATE    SERVICE\n22/tcp    open     ssh\n80/tcp    open     http\n443/tcp   open     https\n3306/tcp  open     mysql\n8080/tcp  open     http-proxy" },
              ]} />
            </Step>
            <Step n={2} title="Deep scan only on the open ports">
              <Terminal lines={[
                { p: "nmap -sV -sC -p22,80,443,3306,8080 -oA deep target.gov" },
                { o: "22/tcp   ssh   OpenSSH 7.4  (CVE-2018-15473 user enum)\n80/tcp   http  Apache 2.4.29\n3306/tcp mysql MySQL 5.7.20 — auth-bypass possible" },
              ]} />
            </Step>
            <Step n={3} title="Use NSE scripts">
              <Code lang="bash">{`# Vulnerability scripts
nmap --script vuln target.gov

# Useful HTTP scripts
nmap -p80,443 --script "http-enum,http-title,http-headers" target.gov

# Test SSL/TLS
nmap -p443 --script ssl-enum-ciphers,ssl-cert target.gov`}</Code>
            </Step>
            <Callout kind="warn" title="Evading detection">
              <ul>
                <li>-T2 is slower but stealthier.</li>
                <li>-f to fragment packets.</li>
                <li>--source-port 53 to pass some firewalls.</li>
                <li>-D RND:10 to spoof decoy addresses.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="Vulnerability scanning">
            <TwoCol>
              <Card title="Nuclei" color="red">Open source, with thousands of templates for known CVEs.</Card>
              <Card title="Nikto / OpenVAS / Nessus" color="amber">Traditional scanners covering thousands of web and infrastructure checks.</Card>
            </TwoCol>
            <Terminal lines={[
              { p: "nuclei -u https://target.gov -severity critical,high -tags cve,exposure,oast" },
              { o: "[critical] CVE-2024-3094 — XZ backdoor in OpenSSH\n[high] CVE-2023-23397 — Outlook NTLM leak\n[high] exposed .env file at /backup/.env" },
            ]} />
          </Section>
          <Section title="Directory and file brute-forcing">
            <p>Many sensitive endpoints aren't linked from the UI. Brute-forcing surfaces them.</p>
            <Terminal lines={[
              { p: "ffuf -u https://target.gov/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-large-words.txt -mc 200,301,403 -fs 0" },
              { o: "/admin              [301]\n/.git/config        [200]\n/api/v1/users       [200]\n/backup.zip         [200]\n/phpinfo.php        [200]" },
            ]} />
            <Callout kind="info" title="Tip">Use SecLists — the largest collection of wordlists in cybersecurity.</Callout>
          </Section>
          <Section title="Common service enumeration">
            <h3>SMB (Windows)</h3>
            <Code lang="bash">{`enum4linux-ng -A target
crackmapexec smb target -u '' -p '' --shares
nxc smb target --users --groups`}</Code>
            <h3>SNMP</h3>
            <Code lang="bash">{`snmpwalk -v2c -c public target
onesixtyone -c community.txt target`}</Code>
            <h3>LDAP / Active Directory</h3>
            <Code lang="bash">{`ldapsearch -x -H ldap://target -b "DC=corp,DC=local"
bloodhound-python -d corp.local -u user -p pass -c All -ns target`}</Code>
          </Section>
          <Section title="Defense against scanning">
            <ul>
              <li>Deny-by-default firewall — only open what's required.</li>
              <li>Rate limiting + SYN cookies against SYN scans.</li>
              <li>IDS / Suricata / Snort with ET-OPEN rules to detect signatures of nmap, nuclei, ffuf.</li>
              <li>Honeypots — intentionally open ports that log everyone who probes.</li>
              <li>Banner masking to obscure version fingerprints.</li>
            </ul>
            <Code lang="Suricata rule">{`alert tcp $EXTERNAL_NET any -> $HOME_NET any \\
  (msg:"NMAP NSE Script Scan"; flow:to_server; \\
  content:"|55 73 65 72 2d 41 67 65 6e 74 3a 20 4e 6d 61 70|"; \\
  sid:9000001; rev:1;)`}</Code>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
