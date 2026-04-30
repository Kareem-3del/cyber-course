"use client";
import { LessonShell, Section, Callout, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="toolkit">
      <L
        ar={<>
          <Section title="صندوق أدوات Red Team">
            <TwoCol>
              <Card title="استطلاع — Reconnaissance" color="red">
                <ul className="text-sm">
                  <li>subfinder, amass, assetfinder, findomain</li>
                  <li>httpx, naabu, dnsx, tlsx</li>
                  <li>Shodan, Censys, FOFA, ZoomEye</li>
                  <li>crt.sh, GoBuster, gau, waybackurls, katana</li>
                  <li>trufflehog, gitleaks, GitHound</li>
                </ul>
              </Card>
              <Card title="مسح — Scanning" color="red">
                <ul className="text-sm">
                  <li>nmap + NSE, masscan, rustscan</li>
                  <li>nuclei, nikto, OpenVAS, Nessus</li>
                  <li>ffuf, feroxbuster, dirsearch</li>
                  <li>whatweb, wappalyzer, retire.js</li>
                </ul>
              </Card>
              <Card title="استغلال ويب" color="red">
                <ul className="text-sm">
                  <li>Burp Suite Pro, Caido, OWASP ZAP</li>
                  <li>sqlmap, NoSQLMap, dalfox, kxss</li>
                  <li>wpscan, joomscan, droopescan</li>
                  <li>XSStrike, commix, tplmap</li>
                </ul>
              </Card>
              <Card title="استغلال شبكة و سيرفر" color="red">
                <ul className="text-sm">
                  <li>Metasploit Framework, exploit-db</li>
                  <li>CrackMapExec / NetExec, Impacket suite</li>
                  <li>responder, mitm6, ntlmrelayx</li>
                  <li>BloodHound, SharpHound, PowerView</li>
                  <li>Mimikatz, Rubeus, Certify, Certipy</li>
                </ul>
              </Card>
              <Card title="C2 و post-exploitation" color="red">
                <ul className="text-sm">
                  <li>Cobalt Strike, Sliver, Mythic, Havoc</li>
                  <li>Empire, Covenant, Brute Ratel</li>
                  <li>Chisel, ligolo-ng, sshuttle, proxychains</li>
                  <li>LinPEAS, WinPEAS, PEASS-ng, PrivescCheck</li>
                </ul>
              </Card>
              <Card title="السحابة و الحاويات" color="red">
                <ul className="text-sm">
                  <li>Pacu, CloudFox, ScoutSuite, Prowler</li>
                  <li>enumerate-iam, weirdAAL, AWSGoat, CloudGoat</li>
                  <li>peirates, kube-hunter, kubeletctl</li>
                  <li>trivy, grype, dockle</li>
                  <li>ROADtools, AADInternals, MicroBurst</li>
                </ul>
              </Card>
            </TwoCol>
          </Section>
          <Section title="صندوق أدوات Blue Team">
            <TwoCol>
              <Card title="SIEM / Log management" color="blue">
                <ul className="text-sm">
                  <li>Splunk, Microsoft Sentinel, Chronicle, QRadar</li>
                  <li>ELK / OpenSearch, Wazuh, Graylog, Security Onion</li>
                </ul>
              </Card>
              <Card title="EDR / Host" color="blue">
                <ul className="text-sm">
                  <li>CrowdStrike, SentinelOne, Defender for Endpoint</li>
                  <li>Wazuh agent + Sysmon, osquery, Velociraptor</li>
                  <li>Falco, Tracee (eBPF)</li>
                </ul>
              </Card>
              <Card title="NDR / IDS" color="blue">
                <ul className="text-sm">
                  <li>Suricata, Snort, Zeek, Arkime (Moloch)</li>
                  <li>RITA, JA3/JA4 fingerprinting</li>
                </ul>
              </Card>
              <Card title="Threat Intelligence" color="blue">
                <ul className="text-sm">
                  <li>MISP, OpenCTI, TheHive + Cortex</li>
                  <li>VirusTotal, ANY.RUN, Joe Sandbox, Hatching Triage</li>
                  <li>CISA KEV, AlienVault OTX, Abuse.ch</li>
                </ul>
              </Card>
              <Card title="Forensics / DFIR" color="blue">
                <ul className="text-sm">
                  <li>Volatility 3, Rekall, FTK Imager</li>
                  <li>Autopsy, plaso/log2timeline, KAPE, UAC</li>
                  <li>Chainsaw, Hayabusa, EVTX-ATTACK-SAMPLES</li>
                </ul>
              </Card>
              <Card title="Hardening / Audit" color="blue">
                <ul className="text-sm">
                  <li>Lynis, OpenSCAP, CIS-CAT, kube-bench</li>
                  <li>Wazuh SCA, Tenable Nessus / Qualys</li>
                  <li>Wiz, Prisma Cloud, AWS Security Hub</li>
                </ul>
              </Card>
              <Card title="Honeypots & Deception" color="blue">
                <ul className="text-sm">
                  <li>Canarytokens.org, Thinkst Canary</li>
                  <li>cowrie, dionaea, t-pot</li>
                  <li>honeyd, opencanary</li>
                </ul>
              </Card>
              <Card title="Detection Content" color="blue">
                <ul className="text-sm">
                  <li>Sigma + sigmac/uncoder, Atomic Red Team</li>
                  <li>Elastic detection-rules, Splunk security-content</li>
                  <li>MITRE D3FEND, ATT&CK Navigator</li>
                </ul>
              </Card>
            </TwoCol>
          </Section>
          <Section title="مسارات تعلّم موصى بها">
            <ul>
              <li><b>Web</b>: PortSwigger Web Academy (مجاناً) — لا يوجد أفضل منه.</li>
              <li><b>Pentest</b>: HackTheBox Academy, TryHackMe, OSCP.</li>
              <li><b>AD / Red Team</b>: CRTO, CRTP, OSEP.</li>
              <li><b>Cloud</b>: flaws.cloud, CloudGoat, AWSGoat, AzureGoat.</li>
              <li><b>Blue Team</b>: BTL1/BTL2, SOC-200, SANS GIAC (GCIA, GCFA).</li>
              <li><b>DFIR</b>: 13Cubed, DFIR.training, SANS FOR-508.</li>
            </ul>
            <Callout kind="info" title="النصيحة الأخيرة">الأمن السيبراني سباق ماراثون لا 100م. خصّص ساعة يومياً للقراءة و التطبيق العملي، و خلال سنة ستصبح من ضمن أفضل 5% في مجالك.</Callout>
          </Section>
        </>}
        en={<>
          <Section title="Red Team toolkit">
            <TwoCol>
              <Card title="Reconnaissance" color="red">
                <ul className="text-sm">
                  <li>subfinder, amass, assetfinder, findomain</li>
                  <li>httpx, naabu, dnsx, tlsx</li>
                  <li>Shodan, Censys, FOFA, ZoomEye</li>
                  <li>crt.sh, GoBuster, gau, waybackurls, katana</li>
                  <li>trufflehog, gitleaks, GitHound</li>
                </ul>
              </Card>
              <Card title="Scanning" color="red">
                <ul className="text-sm">
                  <li>nmap + NSE, masscan, rustscan</li>
                  <li>nuclei, nikto, OpenVAS, Nessus</li>
                  <li>ffuf, feroxbuster, dirsearch</li>
                  <li>whatweb, wappalyzer, retire.js</li>
                </ul>
              </Card>
              <Card title="Web exploitation" color="red">
                <ul className="text-sm">
                  <li>Burp Suite Pro, Caido, OWASP ZAP</li>
                  <li>sqlmap, NoSQLMap, dalfox, kxss</li>
                  <li>wpscan, joomscan, droopescan</li>
                  <li>XSStrike, commix, tplmap</li>
                </ul>
              </Card>
              <Card title="Network & server exploitation" color="red">
                <ul className="text-sm">
                  <li>Metasploit Framework, exploit-db</li>
                  <li>CrackMapExec / NetExec, Impacket suite</li>
                  <li>responder, mitm6, ntlmrelayx</li>
                  <li>BloodHound, SharpHound, PowerView</li>
                  <li>Mimikatz, Rubeus, Certify, Certipy</li>
                </ul>
              </Card>
              <Card title="C2 & post-exploitation" color="red">
                <ul className="text-sm">
                  <li>Cobalt Strike, Sliver, Mythic, Havoc</li>
                  <li>Empire, Covenant, Brute Ratel</li>
                  <li>Chisel, ligolo-ng, sshuttle, proxychains</li>
                  <li>LinPEAS, WinPEAS, PEASS-ng, PrivescCheck</li>
                </ul>
              </Card>
              <Card title="Cloud & containers" color="red">
                <ul className="text-sm">
                  <li>Pacu, CloudFox, ScoutSuite, Prowler</li>
                  <li>enumerate-iam, weirdAAL, AWSGoat, CloudGoat</li>
                  <li>peirates, kube-hunter, kubeletctl</li>
                  <li>trivy, grype, dockle</li>
                  <li>ROADtools, AADInternals, MicroBurst</li>
                </ul>
              </Card>
            </TwoCol>
          </Section>
          <Section title="Blue Team toolkit">
            <TwoCol>
              <Card title="SIEM / Log management" color="blue">
                <ul className="text-sm">
                  <li>Splunk, Microsoft Sentinel, Chronicle, QRadar</li>
                  <li>ELK / OpenSearch, Wazuh, Graylog, Security Onion</li>
                </ul>
              </Card>
              <Card title="EDR / Host" color="blue">
                <ul className="text-sm">
                  <li>CrowdStrike, SentinelOne, Defender for Endpoint</li>
                  <li>Wazuh agent + Sysmon, osquery, Velociraptor</li>
                  <li>Falco, Tracee (eBPF)</li>
                </ul>
              </Card>
              <Card title="NDR / IDS" color="blue">
                <ul className="text-sm">
                  <li>Suricata, Snort, Zeek, Arkime (Moloch)</li>
                  <li>RITA, JA3/JA4 fingerprinting</li>
                </ul>
              </Card>
              <Card title="Threat Intelligence" color="blue">
                <ul className="text-sm">
                  <li>MISP, OpenCTI, TheHive + Cortex</li>
                  <li>VirusTotal, ANY.RUN, Joe Sandbox, Hatching Triage</li>
                  <li>CISA KEV, AlienVault OTX, Abuse.ch</li>
                </ul>
              </Card>
              <Card title="Forensics / DFIR" color="blue">
                <ul className="text-sm">
                  <li>Volatility 3, Rekall, FTK Imager</li>
                  <li>Autopsy, plaso/log2timeline, KAPE, UAC</li>
                  <li>Chainsaw, Hayabusa, EVTX-ATTACK-SAMPLES</li>
                </ul>
              </Card>
              <Card title="Hardening / Audit" color="blue">
                <ul className="text-sm">
                  <li>Lynis, OpenSCAP, CIS-CAT, kube-bench</li>
                  <li>Wazuh SCA, Tenable Nessus / Qualys</li>
                  <li>Wiz, Prisma Cloud, AWS Security Hub</li>
                </ul>
              </Card>
              <Card title="Honeypots & Deception" color="blue">
                <ul className="text-sm">
                  <li>Canarytokens.org, Thinkst Canary</li>
                  <li>cowrie, dionaea, t-pot</li>
                  <li>honeyd, opencanary</li>
                </ul>
              </Card>
              <Card title="Detection Content" color="blue">
                <ul className="text-sm">
                  <li>Sigma + sigmac/uncoder, Atomic Red Team</li>
                  <li>Elastic detection-rules, Splunk security-content</li>
                  <li>MITRE D3FEND, ATT&CK Navigator</li>
                </ul>
              </Card>
            </TwoCol>
          </Section>
          <Section title="Recommended learning paths">
            <ul>
              <li><b>Web</b>: PortSwigger Web Academy (free) — nothing better.</li>
              <li><b>Pentest</b>: HackTheBox Academy, TryHackMe, OSCP.</li>
              <li><b>AD / Red Team</b>: CRTO, CRTP, OSEP.</li>
              <li><b>Cloud</b>: flaws.cloud, CloudGoat, AWSGoat, AzureGoat.</li>
              <li><b>Blue Team</b>: BTL1/BTL2, SOC-200, SANS GIAC (GCIA, GCFA).</li>
              <li><b>DFIR</b>: 13Cubed, DFIR.training, SANS FOR-508.</li>
            </ul>
            <Callout kind="info" title="Final advice">Cybersecurity is a marathon, not a sprint. Spend an hour daily reading and practicing — within a year you'll be in the top 5% of your peers.</Callout>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
