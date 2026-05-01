"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="detection">
      <L
        ar={<>
          <Section title="بنراقب ليه أصلاً؟ ومين بيتفرّج؟">
            <Analogy>الكاميرات في المحل مفيدة لو في حد قاعد قدّامها. لو مفيش حد، يبقى دي مش كاميرات، دي ديكور. الـ logs نفس الكلام بالظبط — تتكدّس على قرص لحد ما القرص يمتلي، ومحدش يبصّ. لازم توصل لـ SIEM، وفي حد بيقرا، وفي rules بتشتغل، وفي playbooks بتتنفذ. غير كده، انت بتدفع فلوس على licenses عشان تحس إنك آمن.</Analogy>

            <p>- بس يا حضرتك إحنا عندنا SIEM وعندنا EDR وعندنا كل حاجة!</p>

            <p>تمام يا نجم. طب لو الـ adversary دخل ومحدش حسّ، يبقى انت بتراقب فعلاً؟ ولا انت بتتفرّج على dashboard لأنه شكله حلو؟</p>
          </Section>
          <Section title="هندسة الكشف — Detection Engineering">
            <p>هرم Bianco (Pyramid of Pain) — كل ما طلعنا فوق، كل ما وجعنا الـ adversary أكتر:</p>
            <ol>
              <li>Hash values — بيتغيّروا بضغطة زرار. مفيش وجع.</li>
              <li>IP addresses — VPS جديد بـ 5 دولار. سهل.</li>
              <li>Domain names — محتاج registrar وسمعة. بيوجع شوية.</li>
              <li>Network/Host artifacts — بيوجع.</li>
              <li>Tools — لو منعت Cobalt Strike beacon signature، الـ adversary لازم يكتب tool جديد.</li>
              <li><b>TTPs</b> — أصعب حاجة يغيّرها. السلوك نفسه. هنا الكشف بيوجع. هنا بنركّز.</li>
            </ol>
            <p>الـ junior بيكتب IoCs. الـ senior بيكتب behavioral rules.</p>
          </Section>
          <Section title="مصادر الـ logs اللي مفيش غنى عنها">
            <TwoCol>
              <Card title="على Linux">auditd, /var/log/auth.log, syslog, journald, eBPF (Falco / Tracee).</Card>
              <Card title="على Windows">Security Event Log, Sysmon (الأهم على الإطلاق), PowerShell ScriptBlock Logging, AMSI.</Card>
              <Card title="الشبكة">Zeek / Suricata / Snort, NetFlow, DNS query logs, TLS/JA3 fingerprints.</Card>
              <Card title="السحابة">CloudTrail (AWS), Activity Log (Azure), Audit Logs (GCP), VPC Flow Logs, GuardDuty.</Card>
            </TwoCol>
            <Callout kind="warn" title="غلطات الـ junior">
              بيشغّل Sysmon بـ default config. الـ default config بتسيب 70% من الأحداث المهمة. استخدم config بتاع SwiftOnSecurity أو Olaf Hartong — مكتوب من ناس بتشتغل في الـ field فعلاً.
            </Callout>
          </Section>
          <Section title="SIEM — مركز التحليل">
            <p>الـ SIEM بيجمع كل الـ logs، بيطبّق rules، وبيرفع alerts. ده الكلام النظري. الواقع إن 60% من الـ SIEM deployments عندنا في المنطقة بتشتغل بـ default rules ومحدش بيـ tune-هم. اللي بيحصل فعلياً: alert fatigue، الـ analyst بيقفل كل حاجة بـ "false positive"، والـ adversary بيعدّي.</p>
            <ul>
              <li><b>مجاني/open source</b>: Wazuh, ELK + Elastic Security, OpenSearch, Graylog, Security Onion.</li>
              <li><b>تجاري</b>: Splunk, Microsoft Sentinel, Chronicle, QRadar, Sumo Logic.</li>
            </ul>
            <h3>قواعد كشف بـ Sigma (الـ format الموحّد)</h3>
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
              <li>بيكشف: process injection, mimikatz, suspicious child processes (winword -&gt; powershell).</li>
              <li>القاعدة الذهبية: <b>كل alert لازم يكون عنده SOAR playbook بيشتغل عليه automatically</b>. لو الـ analyst هو اللي بيـ triage يدوي كل حاجة، انت بتشتري وقت الـ adversary.</li>
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
          <Section title="Honeypots و Honeytokens — فخاخ بتفضح اللي بيلمس">
            <Analogy>حطّ محفظة فاضية ظاهرة على الكونتر. أي لص بيلمسها بيكشف نفسه. ده الـ honeytoken بالظبط: ملف، مفتاح، حساب — مفيش حد شرعي محتاج يلمسهم. لو حد لمسهم، يبقى ده انت يا حبيبي.</Analogy>
            <ul>
              <li>Canarytokens.org — مجاني، بيولّد DNS / HTTP / DOC / AWS tokens في دقيقة.</li>
              <li>SSH server وهمي بـ cowrie — بيسجّل كل command الـ adversary بيجرّبه. بتعرف الـ TTPs بتاعته قبل ما يدخل عندك أصلاً.</li>
              <li>حساب AD اسمه svc_backup أو domain_admin_old — أي logon attempt = alert فوري. الـ adversary بيدوّر على الأسماء دي بالظبط.</li>
              <li>ملف passwords.xlsx مزيّف على file share — مع canary token جواه. اللي يفتحه، انت شوفته.</li>
            </ul>
            <Callout kind="info" title="ليه الـ honeytokens رخيصة وقوية؟">
              ما عندهاش false positives تقريباً. مفيش حد شرعي بيلمسها. كل alert منها = شغل حقيقي. مفيش tool تاني بيدّيك signal-to-noise بالحلاوة دي.
            </Callout>
          </Section>
          <Section title="UEBA — تحليل سلوك المستخدم">
            <p>الـ UEBA بيبني baseline لكل user. الـ admin اللي بيدخل عادةً من القاهرة الساعة 9 الصبح، فجأة ظاهر من فيتنام الساعة 3 الفجر بيحمّل 50MB من SharePoint؟ alert. حتى لو الـ password صح. حتى لو MFA عدّى. السلوك ده مش هو.</p>
            <p>ده الفرق بين identity-based detection و password-based detection. الـ password ممكن يتسرق. السلوك أصعب يتقلّد.</p>
          </Section>
          <Section title="Threat Hunting — اطلع دوّر بدل ما تستنّى">
            <p>ما تستنّاش الـ alert. افترض إن في حد جوّه دلوقتي، ودوّر:</p>
            <ul>
              <li><b>الفرضية</b>: "لو الـ adversary دخل بـ phishing، أكيد هيستخدم PowerShell encoded commands".</li>
              <li><b>الـ query</b> في SIEM عن powershell.exe -enc * آخر 30 يوم.</li>
              <li>حلّل النتايج، وثّق الـ false positives، حوّل اللي بيظهر مرتين لـ Sigma rule دائم.</li>
            </ul>
            <Callout kind="good" title="MITRE D3FEND">
              كل technique هجومية مقابلها technique دفاعية. ابصّ على الـ matrix وشوف انت مغطّي ايه ومش مغطّي ايه. الفجوات اللي هتلاقيها هي اللي الـ adversary هيدخل منها.
            </Callout>
          </Section>
          <Section title="الخلاصة الناشفة">
            <p>الـ detection مش tools. الـ tools موجودة عند الكل. الفرق:</p>
            <ol>
              <li>data نضيفة (Sysmon config صح، EDR على كل device، DNS logs بتتجمع).</li>
              <li>rules مكتوبة على TTPs مش على hashes.</li>
              <li>tuning أسبوعي عشان تقلّل الـ noise.</li>
              <li>SOAR بيـ enrich كل alert automatically — IP reputation, user context, host context.</li>
              <li>hunting أسبوعي بفرضية جديدة.</li>
            </ol>
            <p>غير كده، انت ما بتراقبش. انت بتدفع licenses بس.</p>
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
