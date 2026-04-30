"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="detection">
      <L
        ar={<>
          <Section title="ماذا نراقب و لماذا؟">
            <Analogy>الكاميرات في المتجر مفيدة فقط لو يشاهدها أحد. كذلك السجلات (logs): مفيدة فقط لو وصلت إلى نظام مركزي يحلّلها و ينبّه عند الحوادث.</Analogy>
          </Section>
          <Section title="هندسة الكشف — Detection Engineering">
            <p>هرم Bianco للأدلة (Pyramid of Pain) — كلما صعدنا، كلما آذينا المهاجم أكثر:</p>
            <ol>
              <li>Hash values — سهل للمهاجم تغييرها.</li>
              <li>IP addresses — يبدلها بسهولة.</li>
              <li>Domain names — أصعب قليلاً.</li>
              <li>Network/Host artifacts.</li>
              <li>Tools.</li>
              <li><b>TTPs</b> — أصعب شيء على المهاجم تغييره. هنا نُركّز.</li>
            </ol>
          </Section>
          <Section title="مصادر السجلات الأساسية">
            <TwoCol>
              <Card title="على Linux">auditd، /var/log/auth.log، syslog، journald، eBPF (Falco / Tracee).</Card>
              <Card title="على Windows">Security Event Log، Sysmon (الأهم)، PowerShell ScriptBlock Logging، AMSI.</Card>
              <Card title="الشبكة">Zeek / Suricata / Snort، NetFlow، DNS query logs، TLS/JA3 fingerprints.</Card>
              <Card title="السحابة">CloudTrail (AWS), Activity Log (Azure), Audit Logs (GCP)، VPC Flow Logs، GuardDuty.</Card>
            </TwoCol>
          </Section>
          <Section title="SIEM — مركز التحليل">
            <p>الـ SIEM يجمع كل السجلات في مكان واحد، يطبّق قواعد، و يرفع تنبيهات.</p>
            <ul>
              <li><b>المجاني/مفتوح</b>: Wazuh, ELK + Elastic Security, OpenSearch, Graylog, Security Onion.</li>
              <li><b>التجاري</b>: Splunk, Microsoft Sentinel, Chronicle, QRadar, Sumo Logic.</li>
            </ul>
            <h3>قواعد كشف بصيغة Sigma (موحّدة)</h3>
            <Code lang="Sigma — Linux SSH brute force">{`title: SSH Multiple Failed Logins
logsource: { product: linux, service: auth }
detection:
  fail:
    process_name: 'sshd'
    msg|contains: 'Failed password'
  timeframe: 5m
  condition: fail | count() by src_ip > 10
level: high
tags: [attack.credential_access, attack.t1110]`}</Code>
            <Code lang="Sigma — Suspicious AWS API">{`title: AWS Access Key Created for Another User
logsource: { product: aws, service: cloudtrail }
detection:
  sel:
    eventName: 'CreateAccessKey'
    requestParameters.userName|cidr|not: '{{ caller_user }}'
  condition: sel
level: critical`}</Code>
          </Section>
          <Section title="EDR / XDR على نقاط النهاية">
            <ul>
              <li>CrowdStrike Falcon, SentinelOne, Microsoft Defender for Endpoint, Wazuh agent + Sysmon.</li>
              <li>يكشف: process injection, mimikatz, suspicious child processes (winword → powershell).</li>
              <li>قاعدة الذهب: <b>كل تنبيه يجب أن يحوّل إلى playbook آلي عبر SOAR</b>.</li>
            </ul>
          </Section>
          <Section title="IDS / NDR على الشبكة">
            <Code lang="Suricata rule — Log4Shell exploit">{`alert http any any -> $HOME_NET any (msg:"Log4Shell JNDI in HTTP header"; \\
  flow:to_server,established; content:"jndi:"; nocase; http_header; \\
  classtype:web-application-attack; sid:9000010; rev:1;)`}</Code>
            <Code lang="Zeek — DNS exfil heuristic">{`event dns_request(c, msg, query, qtype, qclass) {
  if (|query| > 60 && /[a-f0-9]{40,}/ in query)
    NOTICE([$note=DNS::Long_Encoded_Query, $msg=fmt("possible DNS exfil: %s", query)]);
}`}</Code>
          </Section>
          <Section title="Honeypots و Honeytokens — أفخاخ تكشف المهاجم">
            <Analogy>ضع محفظة فارغة ظاهرة في الواجهة. أي لص يلمسها ينكشف. هذه فلسفة الـ honeytokens: ملفات/مفاتيح مزيفة، إن استُخدمت أعطت تنبيهاً فورياً.</Analogy>
            <ul>
              <li>Canarytokens.org — مجاني، يولّد DNS / HTTP / DOC / AWS tokens.</li>
              <li>سيرفر SSH وهمي بـ cowrie — يسجّل كل أمر يجرّبه المهاجم.</li>
              <li>حساب AD اسمه svc_admin — أي محاولة دخول = إنذار.</li>
              <li>ملف passwords.xlsx مزيف على file share.</li>
            </ul>
          </Section>
          <Section title="UEBA — تحليل سلوك المستخدم">
            <p>الـ UEBA يبني خط أساس لكل مستخدم. لو دخل admin عادةً من القاهرة الساعة 9 صباحاً، و فجأة ظهر من فيتنام الساعة 3 فجراً يحمّل 50 ميغا من SharePoint = إنذار حتى لو كانت كلمة المرور صحيحة.</p>
          </Section>
          <Section title="Threat Hunting — الصيد الاستباقي">
            <p>لا تنتظر التنبيه. ابحث عن آثار قد تكون فاتت الكشف الآلي:</p>
            <ul>
              <li><b>فرضية</b>: «لو دخل مهاجم بـ phishing، سيستخدم PowerShell encoded commands».</li>
              <li><b>استعلام</b> في الـ SIEM عن powershell.exe -enc * آخر 30 يوماً.</li>
              <li>حلّل النتائج، وثّق الـ false positives، و حوّل النتائج لقواعد Sigma دائمة.</li>
            </ul>
            <Callout kind="good" title="إطار MITRE D3FEND">خريطة كل تقنية هجوم تقابلها تقنية دفاع. مفيد لتغطية الفجوات.</Callout>
          </Section>
        </>}
        en={<>
          <Section title="What do we monitor, and why?">
            <Analogy>CCTV cameras in a store are useful only if someone watches them. Logs are the same: useful only when shipped to a central system that analyzes them and alerts on incidents.</Analogy>
          </Section>
          <Section title="Detection engineering">
            <p>Bianco's Pyramid of Pain — the higher we go, the more we hurt the attacker:</p>
            <ol>
              <li>Hash values — trivial for the attacker to change.</li>
              <li>IP addresses — easy to swap.</li>
              <li>Domain names — slightly harder.</li>
              <li>Network/Host artifacts.</li>
              <li>Tools.</li>
              <li><b>TTPs</b> — the hardest thing to change. This is where we focus.</li>
            </ol>
          </Section>
          <Section title="Core log sources">
            <TwoCol>
              <Card title="On Linux">auditd, /var/log/auth.log, syslog, journald, eBPF (Falco / Tracee).</Card>
              <Card title="On Windows">Security Event Log, Sysmon (most important), PowerShell ScriptBlock Logging, AMSI.</Card>
              <Card title="Network">Zeek / Suricata / Snort, NetFlow, DNS query logs, TLS/JA3 fingerprints.</Card>
              <Card title="Cloud">CloudTrail (AWS), Activity Log (Azure), Audit Logs (GCP), VPC Flow Logs, GuardDuty.</Card>
            </TwoCol>
          </Section>
          <Section title="SIEM — the analysis hub">
            <p>The SIEM aggregates all logs in one place, applies rules, and raises alerts.</p>
            <ul>
              <li><b>Free / open source</b>: Wazuh, ELK + Elastic Security, OpenSearch, Graylog, Security Onion.</li>
              <li><b>Commercial</b>: Splunk, Microsoft Sentinel, Chronicle, QRadar, Sumo Logic.</li>
            </ul>
            <h3>Detection rules in Sigma (a unified format)</h3>
            <Code lang="Sigma — Linux SSH brute force">{`title: SSH Multiple Failed Logins
logsource: { product: linux, service: auth }
detection:
  fail:
    process_name: 'sshd'
    msg|contains: 'Failed password'
  timeframe: 5m
  condition: fail | count() by src_ip > 10
level: high
tags: [attack.credential_access, attack.t1110]`}</Code>
            <Code lang="Sigma — Suspicious AWS API">{`title: AWS Access Key Created for Another User
logsource: { product: aws, service: cloudtrail }
detection:
  sel:
    eventName: 'CreateAccessKey'
    requestParameters.userName|cidr|not: '{{ caller_user }}'
  condition: sel
level: critical`}</Code>
          </Section>
          <Section title="EDR / XDR on endpoints">
            <ul>
              <li>CrowdStrike Falcon, SentinelOne, Microsoft Defender for Endpoint, Wazuh agent + Sysmon.</li>
              <li>Detects: process injection, mimikatz, suspicious child processes (winword → powershell).</li>
              <li>Golden rule: <b>every alert should map to an automated SOAR playbook</b>.</li>
            </ul>
          </Section>
          <Section title="IDS / NDR on the network">
            <Code lang="Suricata rule — Log4Shell exploit">{`alert http any any -> $HOME_NET any (msg:"Log4Shell JNDI in HTTP header"; \\
  flow:to_server,established; content:"jndi:"; nocase; http_header; \\
  classtype:web-application-attack; sid:9000010; rev:1;)`}</Code>
            <Code lang="Zeek — DNS exfil heuristic">{`event dns_request(c, msg, query, qtype, qclass) {
  if (|query| > 60 && /[a-f0-9]{40,}/ in query)
    NOTICE([$note=DNS::Long_Encoded_Query, $msg=fmt("possible DNS exfil: %s", query)]);
}`}</Code>
          </Section>
          <Section title="Honeypots and honeytokens — traps that out the attacker">
            <Analogy>Place an empty wallet visibly on the counter. Any thief who touches it reveals themselves. That's the honeytoken philosophy: fake files/keys that, when used, fire an immediate alert.</Analogy>
            <ul>
              <li>Canarytokens.org — free, generates DNS / HTTP / DOC / AWS tokens.</li>
              <li>Fake SSH server via cowrie — logs every command an attacker tries.</li>
              <li>An AD account named svc_admin — any login attempt = alert.</li>
              <li>A fake passwords.xlsx file on a file share.</li>
            </ul>
          </Section>
          <Section title="UEBA — User and Entity Behavior Analytics">
            <p>UEBA builds a baseline per user. If admin normally logs in from Cairo at 9am, and suddenly appears from Vietnam at 3am downloading 50MB from SharePoint = alert, even if the password is correct.</p>
          </Section>
          <Section title="Threat hunting — proactive search">
            <p>Don't wait for alerts. Hunt for traces that automated detection might miss:</p>
            <ul>
              <li><b>Hypothesis</b>: "If an attacker landed via phishing, they likely used PowerShell encoded commands."</li>
              <li><b>Query</b> the SIEM for powershell.exe -enc * in the last 30 days.</li>
              <li>Analyze, document false positives, and convert findings into permanent Sigma rules.</li>
            </ul>
            <Callout kind="good" title="MITRE D3FEND">Maps every attack technique to a defensive technique. Useful for finding coverage gaps.</Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
