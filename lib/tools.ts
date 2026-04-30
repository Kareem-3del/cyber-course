export type ToolCategory =
  | "recon"
  | "scanning"
  | "web"
  | "exploitation"
  | "ad"
  | "post-ex"
  | "c2"
  | "cloud"
  | "container"
  | "wireless"
  | "mobile"
  | "forensics"
  | "malware"
  | "siem"
  | "edr"
  | "ids"
  | "hardening"
  | "ti"
  | "honeypot"
  | "binary";

export interface Tool {
  name: string;
  category: ToolCategory;
  side: "red" | "blue" | "both";
  oss: boolean;            // open source
  os: ("linux" | "win" | "mac" | "web")[];
  blurb: { ar: string; en: string };
  whenToUse: { ar: string; en: string };
  install?: string;
  examples?: string[];
  url?: string;
}

export function toolSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\/\s*/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toolBySlug(slug: string): Tool | undefined {
  return TOOLS.find((t) => toolSlug(t.name) === slug);
}

export const TOOLS: Tool[] = [
  // ───── Recon ─────
  {
    name: "subfinder",
    category: "recon", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "ماسح subdomains سريع و موثوق من ProjectDiscovery، يجمع من عشرات المصادر السلبية.",
      en: "Fast, reliable subdomain enumerator from ProjectDiscovery that aggregates dozens of passive sources.",
    },
    whenToUse: {
      ar: "أول أداة في الـ recon — تكشف subdomains بدون لمس الهدف.",
      en: "First tool in recon — surfaces subdomains without touching the target.",
    },
    install: "go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest",
    examples: [
      "subfinder -d target.gov -all -silent",
      "subfinder -dL domains.txt -o subs.txt",
    ],
    url: "https://github.com/projectdiscovery/subfinder",
  },
  {
    name: "amass",
    category: "recon", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "أداة OWASP لرسم خريطة سطح الهجوم بـ DNS، WHOIS، scraping، و تكامل مع APIs.",
      en: "OWASP attack-surface mapper combining DNS, WHOIS, scraping, and dozens of API integrations.",
    },
    whenToUse: {
      ar: "عندما تحتاج رسماً علائقياً عميقاً (ASN, CIDR, certs) لا مجرد قائمة subdomains.",
      en: "When you need deep relational mapping (ASN, CIDR, certs), not just a flat list.",
    },
    install: "snap install amass  # or go install ...",
    examples: [
      "amass enum -passive -d target.gov",
      "amass intel -org 'Target Inc'",
    ],
    url: "https://github.com/owasp-amass/amass",
  },
  {
    name: "httpx",
    category: "recon", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "متعدد الأغراض لفحص HTTP — يحدد الحي/الميت، العنوان، التقنية، الحالة، المنفذ.",
      en: "Swiss-army HTTP probe — determines alive/dead, title, tech stack, status, port.",
    },
    whenToUse: {
      ar: "بعد كل عملية subdomain enumeration للتحقّق أيها يستجيب على HTTP/S.",
      en: "After every subdomain enum to filter the ones actually answering HTTP/S.",
    },
    install: "go install github.com/projectdiscovery/httpx/cmd/httpx@latest",
    examples: ["cat subs.txt | httpx -title -tech-detect -status-code"],
    url: "https://github.com/projectdiscovery/httpx",
  },
  {
    name: "Shodan",
    category: "recon", side: "red", oss: false, os: ["web", "linux"],
    blurb: {
      ar: "محرك بحث لكل الأجهزة المتصلة بالإنترنت — يكشف أجهزة، خدمات، CVEs بالـ banner.",
      en: "Search engine for every internet-connected device — reveals hosts, services, CVEs by banner.",
    },
    whenToUse: {
      ar: "لاكتشاف أصول مكشوفة باسم المؤسسة، أو ICS/SCADA، أو خدمات منسية.",
      en: "Discover exposed assets by org name, ICS/SCADA targets, or forgotten services.",
    },
    examples: [
      'shodan search "org:Target Gov"',
      "shodan host 1.2.3.4",
    ],
    url: "https://www.shodan.io",
  },
  {
    name: "trufflehog",
    category: "recon", side: "both", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "يفحص git/file/cloud لأسرار مسرّبة (API keys, tokens) مع تحقق فوري من صلاحيتها.",
      en: "Scans git/file/cloud for leaked secrets (API keys, tokens) with built-in validity verification.",
    },
    whenToUse: {
      ar: "Red: للبحث عن مفاتيح في GitHub. Blue: لمنع التسريبات قبل الـ commit.",
      en: "Red: hunt keys on GitHub. Blue: pre-commit and continuous scanning.",
    },
    install: "brew install trufflesecurity/trufflehog/trufflehog",
    examples: ["trufflehog github --org=target --only-verified"],
    url: "https://github.com/trufflesecurity/trufflehog",
  },

  // ───── Scanning ─────
  {
    name: "nmap",
    category: "scanning", side: "both", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "الأداة الأم للـ port scanning + service detection + سكربتات NSE قوية.",
      en: "The original port scanner with service detection and a powerful NSE script engine.",
    },
    whenToUse: {
      ar: "أول ما تشغّل بعد تأكيد الـ scope. أساسي لكل اختبار اختراق.",
      en: "First thing you run after scope confirmation. Mandatory in every pentest.",
    },
    install: "apt install nmap",
    examples: [
      "nmap -sV -sC -p- target.gov",
      "nmap --script vuln target.gov",
    ],
    url: "https://nmap.org",
  },
  {
    name: "masscan",
    category: "scanning", side: "red", oss: true, os: ["linux"],
    blurb: {
      ar: "أسرع port scanner في العالم — يمسح الإنترنت في 6 دقائق نظرياً.",
      en: "The world's fastest port scanner — scans the entire internet in ~6 minutes (in theory).",
    },
    whenToUse: {
      ar: "نطاقات ضخمة جداً، استخدمه أولاً ثم mark بـ nmap للتفاصيل.",
      en: "Very large ranges; pair with nmap afterward for service details.",
    },
    install: "apt install masscan",
    examples: ["masscan 10.0.0.0/8 -p1-65535 --rate=10000"],
    url: "https://github.com/robertdavidgraham/masscan",
  },
  {
    name: "nuclei",
    category: "scanning", side: "both", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "ماسح ثغرات قوالبي — آلاف الـ templates لـ CVEs و misconfigs قابلة للتخصيص.",
      en: "Template-driven vulnerability scanner — thousands of community templates for CVEs and misconfigs.",
    },
    whenToUse: {
      ar: "بعد تحديد الخدمات الحية، لكشف ثغرات معروفة بسرعة.",
      en: "After identifying live services to detect known vulns at scale.",
    },
    install: "go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest",
    examples: [
      "nuclei -u https://target.gov",
      "nuclei -l urls.txt -severity critical,high",
    ],
    url: "https://github.com/projectdiscovery/nuclei",
  },
  {
    name: "ffuf",
    category: "scanning", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "fuzzer ويب فائق السرعة — directory brute force، parameter discovery، vhost discovery.",
      en: "Blazing-fast web fuzzer — directory brute force, parameter discovery, vhost discovery.",
    },
    whenToUse: {
      ar: "اكتشاف endpoints / params مخفية، فحص بدائل rate-limit.",
      en: "Hidden endpoint/parameter discovery, rate-limit-aware fuzzing.",
    },
    install: "go install github.com/ffuf/ffuf/v2@latest",
    examples: ["ffuf -u https://target/FUZZ -w wordlist.txt -mc 200,301,403"],
    url: "https://github.com/ffuf/ffuf",
  },

  // ───── Web ─────
  {
    name: "Burp Suite",
    category: "web", side: "red", oss: false, os: ["linux", "mac", "win"],
    blurb: {
      ar: "المعيار الصناعي لاختبار الويب — proxy + scanner + Repeater + Intruder + extensions.",
      en: "Industry-standard web testing platform — proxy + scanner + Repeater + Intruder + extensions.",
    },
    whenToUse: {
      ar: "أداتك اليومية لاختبار الويب — Pro version لها ماسح آلي قوي.",
      en: "Your daily-driver for web testing — Pro version adds a strong active scanner.",
    },
    examples: ["Configure browser proxy → 127.0.0.1:8080"],
    url: "https://portswigger.net/burp",
  },
  {
    name: "OWASP ZAP",
    category: "web", side: "both", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "بديل مفتوح المصدر لـ Burp من OWASP — يدعم automation + CI/CD.",
      en: "Open-source Burp alternative from OWASP — strong automation and CI/CD support.",
    },
    whenToUse: {
      ar: "لو الميزانية محدودة، أو لتكامل DAST في pipeline.",
      en: "Budget-constrained engagements or DAST integration in pipelines.",
    },
    install: "snap install zaproxy --classic",
    url: "https://www.zaproxy.org",
  },
  {
    name: "sqlmap",
    category: "web", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "أتمتة كاملة لاكتشاف و استغلال SQL Injection — أكثر من 10 محركات قواعد بيانات.",
      en: "Full automation for detecting and exploiting SQL Injection — supports 10+ database engines.",
    },
    whenToUse: {
      ar: "بعد اكتشاف نقطة حقن مشبوهة يدوياً، sqlmap يأخذها للنهاية.",
      en: "Once you've manually identified a suspect injection point, sqlmap takes it to the finish.",
    },
    install: "apt install sqlmap",
    examples: [
      "sqlmap -u 'https://target/p?id=1' --batch --dbs",
      "sqlmap -r req.txt --level=5 --risk=3",
    ],
    url: "https://sqlmap.org",
  },
  {
    name: "wpscan",
    category: "web", side: "red", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "ماسح متخصص في WordPress — themes/plugins، users، vulns CVEs.",
      en: "WordPress-focused scanner — themes/plugins, user enum, CVE database.",
    },
    whenToUse: {
      ar: "كل موقع يستخدم WordPress (~40% من الويب).",
      en: "Any site running WordPress (~40% of the web).",
    },
    install: "gem install wpscan",
    examples: ["wpscan --url https://target.gov --enumerate u,vp,vt"],
    url: "https://wpscan.com",
  },

  // ───── AD / Network exploitation ─────
  {
    name: "BloodHound / SharpHound",
    category: "ad", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "يرسم علاقات Active Directory كرسم بياني و يحسب أقصر طريق إلى Domain Admin.",
      en: "Graphs Active Directory relationships and computes the shortest path to Domain Admin.",
    },
    whenToUse: {
      ar: "أول ما تفعل داخل أي دومين بعد الحصول على بيانات اعتماد ضعيفة.",
      en: "First action inside any domain after getting weak credentials.",
    },
    install: "pipx install bloodhound-py",
    examples: ["bloodhound-python -d corp.local -u user -p pass -c All --zip"],
    url: "https://github.com/SpecterOps/BloodHound",
  },
  {
    name: "CrackMapExec / NetExec (nxc)",
    category: "ad", side: "red", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "سكين الجيش السويسري للـ pentesting في الشبكات — SMB/SSH/WinRM/MSSQL/LDAP في أداة واحدة.",
      en: "Swiss-army knife for network pentesting — SMB/SSH/WinRM/MSSQL/LDAP in one tool.",
    },
    whenToUse: {
      ar: "spraying، تعداد، تنفيذ أوامر، dump hashes — كل شيء يومي في AD pentest.",
      en: "Spraying, enumeration, command execution, hash dumps — everyday AD work.",
    },
    install: "pipx install netexec",
    examples: [
      "nxc smb 10.0.0.0/24 -u admin -p Pass1 --shares",
      "nxc smb target -u admin -H NTLM_HASH",
    ],
    url: "https://github.com/Pennyw0rth/NetExec",
  },
  {
    name: "Impacket",
    category: "ad", side: "red", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "مكتبة Python كاملة لبروتوكولات Windows — psexec, secretsdump, GetUserSPNs, ntlmrelayx.",
      en: "Complete Python library for Windows protocols — psexec, secretsdump, GetUserSPNs, ntlmrelayx.",
    },
    whenToUse: {
      ar: "Kerberoasting، AS-REP Roasting، DCSync، NTLM relay — كل سكربت تحتاجه موجود.",
      en: "Kerberoasting, AS-REP, DCSync, NTLM relay — every script you need is here.",
    },
    install: "pipx install impacket",
    examples: [
      "GetUserSPNs.py corp.local/user:pass -dc-ip DC -request",
      "secretsdump.py -just-dc corp.local/admin@DC",
    ],
    url: "https://github.com/fortra/impacket",
  },
  {
    name: "Mimikatz",
    category: "ad", side: "red", oss: true, os: ["win"],
    blurb: {
      ar: "أسطورة استخراج بيانات الاعتماد من ذاكرة Windows — passwords, tickets, hashes, DPAPI.",
      en: "The legendary Windows credential extractor — passwords, tickets, hashes, DPAPI.",
    },
    whenToUse: {
      ar: "بعد الحصول على SYSTEM/admin محلي على Windows لجمع بيانات الدخول.",
      en: "After local SYSTEM/admin on a Windows host to harvest credentials.",
    },
    examples: [
      "privilege::debug",
      "sekurlsa::logonpasswords",
      "lsadump::dcsync /domain:corp.local /user:krbtgt",
    ],
    url: "https://github.com/gentilkiwi/mimikatz",
  },
  {
    name: "Certipy",
    category: "ad", side: "red", oss: true, os: ["linux"],
    blurb: {
      ar: "أداة Python لاختبار ADCS — تكتشف و تستغل ESC1-ESC15 آلياً.",
      en: "Python tool for ADCS — discovers and exploits ESC1-ESC15 automatically.",
    },
    whenToUse: {
      ar: "أي بيئة Windows AD فيها CA — Certipy غالباً يجد طريقاً للـ Domain Admin.",
      en: "Any AD environment with a CA — Certipy frequently finds a path to Domain Admin.",
    },
    install: "pipx install certipy-ad",
    examples: ["certipy find -u user@corp -p Pass1 -dc-ip DC -vulnerable -stdout"],
    url: "https://github.com/ly4k/Certipy",
  },
  {
    name: "Responder",
    category: "ad", side: "red", oss: true, os: ["linux"],
    blurb: {
      ar: "يسمم LLMNR/NBT-NS/mDNS و يلتقط NTLM hashes من المستخدمين على نفس الشبكة.",
      en: "Poisons LLMNR/NBT-NS/mDNS and captures NTLM hashes from users on the same network.",
    },
    whenToUse: {
      ar: "أول ساعة على شبكة داخلية — غالباً يكفي لكسر hashes ثم Pass-the-Hash.",
      en: "First hour on an internal network — often enough to crack hashes and pass them around.",
    },
    install: "apt install responder",
    examples: ["responder -I eth0 -wrf"],
    url: "https://github.com/lgandx/Responder",
  },

  // ───── Post-Ex / C2 ─────
  {
    name: "Metasploit Framework",
    category: "exploitation", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "أكبر إطار عمل للاستغلال — آلاف modules، meterpreter payloads، automation.",
      en: "The largest exploitation framework — thousands of modules, meterpreter payloads, automation.",
    },
    whenToUse: {
      ar: "اختبار سريع لـ exploit معروف، أو توليد payloads متنوعة.",
      en: "Quick PoC for a known exploit, or generating various payloads.",
    },
    install: "apt install metasploit-framework",
    examples: ["msfconsole -q -x 'use exploit/multi/handler; set payload windows/x64/meterpreter/reverse_tcp; ...'"],
    url: "https://www.metasploit.com",
  },
  {
    name: "Cobalt Strike",
    category: "c2", side: "red", oss: false, os: ["linux", "win", "mac"],
    blurb: {
      ar: "المعيار التجاري للـ red teaming — beacons، malleable C2، lateral movement مدمج.",
      en: "Commercial gold standard for red teaming — beacons, malleable C2, integrated lateral movement.",
    },
    whenToUse: {
      ar: "engagements طويلة الأمد التي تحتاج C2 احترافي و قابل للتخصيص.",
      en: "Long-term engagements needing professional, customizable C2.",
    },
    url: "https://www.cobaltstrike.com",
  },
  {
    name: "Sliver",
    category: "c2", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "بديل مفتوح المصدر لـ Cobalt Strike — مكتوب بـ Go، يدعم mTLS/DNS/HTTP/WireGuard.",
      en: "Open-source alternative to Cobalt Strike — written in Go, supports mTLS/DNS/HTTP/WireGuard.",
    },
    whenToUse: {
      ar: "التدريب أو الـ engagements بدون ميزانية ترخيص Cobalt Strike.",
      en: "Training or engagements without a Cobalt Strike license budget.",
    },
    install: "curl https://sliver.sh/install | sudo bash",
    url: "https://github.com/BishopFox/sliver",
  },
  {
    name: "evilginx2",
    category: "exploitation", side: "red", oss: true, os: ["linux"],
    blurb: {
      ar: "Reverse proxy phishing framework — يلتقط جلسات حقيقية حتى مع MFA TOTP.",
      en: "Reverse-proxy phishing framework — captures live sessions even with TOTP MFA.",
    },
    whenToUse: {
      ar: "حملات phishing مصرّح بها لاختبار مقاومة الموظفين للـ AiTM.",
      en: "Authorized phishing campaigns testing staff resilience to AiTM.",
    },
    install: "go install github.com/kgretzky/evilginx2@latest",
    url: "https://github.com/kgretzky/evilginx2",
  },
  {
    name: "Chisel",
    category: "post-ex", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "TCP/UDP tunnel فوق HTTP/HTTPS — مفيد للـ pivoting عبر الـ proxies.",
      en: "TCP/UDP tunnel over HTTP/HTTPS — perfect for pivoting through proxies.",
    },
    whenToUse: {
      ar: "عند الحاجة لـ tunneling إلى شبكة داخلية محمية بـ firewall.",
      en: "When you need to tunnel into an internal network behind a firewall.",
    },
    install: "go install github.com/jpillora/chisel@latest",
    examples: ["chisel server -p 8080 --reverse", "chisel client A:8080 R:1080:socks"],
    url: "https://github.com/jpillora/chisel",
  },
  {
    name: "LinPEAS / WinPEAS",
    category: "post-ex", side: "red", oss: true, os: ["linux", "win"],
    blurb: {
      ar: "سكربتات أتمتة شاملة لاكتشاف مسارات privilege escalation محلياً.",
      en: "Comprehensive automation scripts to discover local privilege escalation paths.",
    },
    whenToUse: {
      ar: "بعد الحصول على shell، شغّلها فوراً لإيجاد طريق root/SYSTEM.",
      en: "Right after getting a shell, run them to find a path to root/SYSTEM.",
    },
    install: "git clone https://github.com/peass-ng/PEASS-ng",
    url: "https://github.com/peass-ng/PEASS-ng",
  },

  // ───── Cloud / Container ─────
  {
    name: "Pacu",
    category: "cloud", side: "red", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "أول إطار عمل هجومي شامل لـ AWS — تعداد، privesc، persistence، exfil.",
      en: "First comprehensive AWS offensive framework — enumeration, privesc, persistence, exfil.",
    },
    whenToUse: {
      ar: "عند الحصول على AWS keys مسرّبة، Pacu يأخذها للـ administrator-access.",
      en: "When you've got leaked AWS keys, Pacu drives them toward administrator-access.",
    },
    install: "pipx install pacu",
    url: "https://github.com/RhinoSecurityLabs/pacu",
  },
  {
    name: "CloudFox",
    category: "cloud", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "أداة استكشاف AWS/Azure للـ pentesting — تعداد سريع لكل الأصول و الصلاحيات.",
      en: "AWS/Azure recon tool for pentesting — fast inventory of every asset and permission.",
    },
    whenToUse: {
      ar: "عرض شامل لما يستطيع المهاجم رؤيته/الوصول إليه في cloud account.",
      en: "Comprehensive view of what an attacker can see/reach in the cloud account.",
    },
    install: "go install github.com/BishopFox/cloudfox@latest",
    examples: ["cloudfox aws inventory --profile pwned"],
    url: "https://github.com/BishopFox/cloudfox",
  },
  {
    name: "Prowler",
    category: "cloud", side: "blue", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "ماسح أمان لـ AWS/Azure/GCP/k8s — 300+ check ضد CIS, NIST, GDPR, ISO27001.",
      en: "Security scanner for AWS/Azure/GCP/k8s — 300+ checks against CIS, NIST, GDPR, ISO27001.",
    },
    whenToUse: {
      ar: "تدقيق دوري للـ cloud posture و تقارير امتثال.",
      en: "Continuous cloud posture audit and compliance reporting.",
    },
    install: "pipx install prowler",
    examples: ["prowler aws --profile prod"],
    url: "https://github.com/prowler-cloud/prowler",
  },
  {
    name: "ScoutSuite",
    category: "cloud", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "تدقيق متعدد المنصات (AWS/Azure/GCP/Aliyun) ينتج تقرير HTML شامل.",
      en: "Multi-cloud auditor (AWS/Azure/GCP/Aliyun) producing a comprehensive HTML report.",
    },
    whenToUse: {
      ar: "تقييم سريع للبيئة و تسليم تقرير للإدارة.",
      en: "Quick environment assessment with an executive-friendly report.",
    },
    install: "pipx install scoutsuite",
    url: "https://github.com/nccgroup/ScoutSuite",
  },
  {
    name: "trivy",
    category: "container", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "ماسح ثغرات شامل للـ images، filesystems، git repos، Kubernetes — يكشف CVEs و misconfigs و secrets.",
      en: "All-in-one scanner for images, filesystems, git repos, Kubernetes — detects CVEs, misconfigs, and secrets.",
    },
    whenToUse: {
      ar: "في كل CI pipeline قبل الـ push للـ registry.",
      en: "Inside every CI pipeline before pushing to the registry.",
    },
    install: "brew install trivy",
    examples: [
      "trivy image nginx:latest",
      "trivy fs --scanners vuln,secret,misconfig .",
    ],
    url: "https://github.com/aquasecurity/trivy",
  },
  {
    name: "kube-bench",
    category: "container", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "يفحص cluster Kubernetes ضد CIS Kubernetes Benchmark.",
      en: "Audits a Kubernetes cluster against the CIS Kubernetes Benchmark.",
    },
    whenToUse: {
      ar: "بعد كل ترقية لـ k8s و دورياً للتحقق من الصلابة.",
      en: "After every k8s upgrade and periodically to verify hardening.",
    },
    install: "kubectl apply -f kube-bench.yaml",
    url: "https://github.com/aquasecurity/kube-bench",
  },
  {
    name: "Falco",
    category: "container", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "محرك runtime detection للـ containers و k8s — يستخدم eBPF لرصد سلوك مريب.",
      en: "Runtime detection engine for containers and k8s — uses eBPF to flag suspicious behavior.",
    },
    whenToUse: {
      ar: "كشف فوري لـ container escape attempts، مناجم crypto، spawn shells.",
      en: "Instant detection of container escapes, crypto miners, unexpected shells.",
    },
    install: "helm install falco falcosecurity/falco",
    url: "https://falco.org",
  },
  {
    name: "peirates",
    category: "container", side: "red", oss: true, os: ["linux"],
    blurb: {
      ar: "إطار عمل اختراق Kubernetes — تنفيذ هجمات شاملة من داخل pod مخترق.",
      en: "Kubernetes attack framework — runs comprehensive attacks from within a compromised pod.",
    },
    whenToUse: {
      ar: "بعد اختراق أي pod، peirates يكشف مسارات escalation متاحة.",
      en: "After any pod compromise, peirates surfaces available escalation paths.",
    },
    url: "https://github.com/inguardians/peirates",
  },

  // ───── Wireless ─────
  {
    name: "aircrack-ng",
    category: "wireless", side: "red", oss: true, os: ["linux"],
    blurb: {
      ar: "حزمة كاملة لاختبار Wi-Fi — capture handshakes، crack WEP/WPA/WPA2.",
      en: "Complete Wi-Fi audit suite — handshake capture, WEP/WPA/WPA2 cracking.",
    },
    whenToUse: {
      ar: "اختبار Wi-Fi مصرّح به في موقع العميل.",
      en: "Authorized Wi-Fi test on the client's site.",
    },
    install: "apt install aircrack-ng",
    url: "https://www.aircrack-ng.org",
  },
  {
    name: "hcxdumptool / hcxtools",
    category: "wireless", side: "red", oss: true, os: ["linux"],
    blurb: {
      ar: "التقاط PMKID بدون الحاجة لـ client متصل — أسرع طريق لكسر WPA2.",
      en: "Capture PMKID without needing a connected client — fastest path to crack WPA2.",
    },
    whenToUse: {
      ar: "بدلاً من aireplay deauth، PMKID يعمل في ثوانٍ.",
      en: "Instead of aireplay deauth, PMKID works in seconds.",
    },
    install: "apt install hcxdumptool hcxtools",
    url: "https://github.com/ZerBea/hcxdumptool",
  },
  {
    name: "Bettercap",
    category: "wireless", side: "red", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "إطار عمل MITM شامل — Wi-Fi, Bluetooth, HID, Ethernet، مع UI ويب.",
      en: "Comprehensive MITM framework — Wi-Fi, Bluetooth, HID, Ethernet, with a web UI.",
    },
    whenToUse: {
      ar: "MITM احترافي بدلاً من ettercap الكلاسيكي.",
      en: "Modern MITM, replacing the classic ettercap.",
    },
    install: "apt install bettercap",
    url: "https://www.bettercap.org",
  },
  {
    name: "Flipper Zero",
    category: "wireless", side: "red", oss: false, os: ["linux", "mac", "win"],
    blurb: {
      ar: "جهاز محمول لاختبار RFID/NFC/Sub-GHz/Infrared/iButton — أداة الـ red team الميدانية.",
      en: "Portable multi-tool for RFID/NFC/Sub-GHz/Infrared/iButton — field red-team kit.",
    },
    whenToUse: {
      ar: "اختبارات الوصول الفيزيائي و IoT.",
      en: "Physical access and IoT testing.",
    },
    url: "https://flipperzero.one",
  },

  // ───── Mobile ─────
  {
    name: "Frida",
    category: "mobile", side: "both", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "Dynamic instrumentation toolkit — حقن JavaScript في تطبيقات Android/iOS/desktop runtime.",
      en: "Dynamic instrumentation toolkit — injects JavaScript into Android/iOS/desktop apps at runtime.",
    },
    whenToUse: {
      ar: "تجاوز SSL pinning، hooking للدوال، بحث في الذاكرة.",
      en: "SSL pinning bypass, function hooking, memory inspection.",
    },
    install: "pip install frida-tools",
    url: "https://frida.re",
  },
  {
    name: "Objection",
    category: "mobile", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "إطار عمل runtime mobile مبني على Frida — بدون حاجة لكتابة scripts.",
      en: "Runtime mobile exploration framework on top of Frida — no scripting required.",
    },
    whenToUse: {
      ar: "اختبار سريع لتطبيق موبايل بدون كتابة كود Frida من الصفر.",
      en: "Quick mobile app assessment without writing Frida scripts from scratch.",
    },
    install: "pipx install objection",
    examples: ["objection -g com.target.app explore"],
    url: "https://github.com/sensepost/objection",
  },
  {
    name: "MobSF",
    category: "mobile", side: "both", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "تحليل static + dynamic كامل لـ Android/iOS — تقرير ويب احترافي.",
      en: "Full static + dynamic analysis for Android/iOS — produces a polished web report.",
    },
    whenToUse: {
      ar: "تقييم سريع شامل لتطبيق موبايل قبل التعمّق اليدوي.",
      en: "Fast comprehensive assessment before manual deep-dive.",
    },
    install: "docker run -p 8000:8000 opensecurity/mobile-security-framework-mobsf",
    url: "https://github.com/MobSF/Mobile-Security-Framework-MobSF",
  },

  // ───── Forensics ─────
  {
    name: "Volatility 3",
    category: "forensics", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "إطار عمل التحليل الجنائي للذاكرة — يستخرج العمليات و الـ network و الـ malware من dump.",
      en: "Memory forensics framework — extracts processes, network, and malware artifacts from dumps.",
    },
    whenToUse: {
      ar: "أول أداة في تحليل أي حادثة بعد تأمين memory dump.",
      en: "First tool in any incident analysis after securing the memory dump.",
    },
    install: "pipx install volatility3",
    examples: [
      "vol -f mem.raw windows.pslist",
      "vol -f mem.raw windows.malfind",
    ],
    url: "https://github.com/volatilityfoundation/volatility3",
  },
  {
    name: "Autopsy / The Sleuth Kit",
    category: "forensics", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "GUI متكاملة للـ disk forensics — timeline، file recovery، keyword search.",
      en: "Full GUI for disk forensics — timeline, file recovery, keyword search.",
    },
    whenToUse: {
      ar: "تحليل أقراص مخترقة بطريقة منهجية و موثقة.",
      en: "Methodical, documented disk analysis post-incident.",
    },
    install: "apt install sleuthkit autopsy",
    url: "https://www.autopsy.com",
  },
  {
    name: "KAPE",
    category: "forensics", side: "blue", oss: false, os: ["win"],
    blurb: {
      ar: "أداة triage فائقة السرعة لـ Windows — تجمع artifacts الحرجة في دقائق.",
      en: "Lightning-fast triage tool for Windows — collects critical artifacts in minutes.",
    },
    whenToUse: {
      ar: "أول 30 دقيقة من حادثة Windows، قبل قرار العزل.",
      en: "First 30 minutes of a Windows incident, before isolation decisions.",
    },
    url: "https://www.kroll.com/en/insights/publications/cyber/kroll-artifact-parser-extractor-kape",
  },
  {
    name: "Velociraptor",
    category: "forensics", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "منصة DFIR قابلة للتوسع لجمع artifacts من آلاف الأجهزة بـ VQL queries.",
      en: "Scalable DFIR platform that collects artifacts from thousands of endpoints via VQL queries.",
    },
    whenToUse: {
      ar: "حوادث على نطاق واسع تشمل أجهزة كثيرة، أو threat hunting.",
      en: "Large-scale incidents touching many endpoints, or proactive threat hunting.",
    },
    url: "https://docs.velociraptor.app",
  },
  {
    name: "Chainsaw / Hayabusa",
    category: "forensics", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "محلل Windows Event Logs بسرعة عالية مع قواعد Sigma مدمجة.",
      en: "High-speed Windows Event Log analyzer with built-in Sigma rules.",
    },
    whenToUse: {
      ar: "بعد جمع EVTX files من جهاز مشتبه به.",
      en: "After collecting EVTX files from a suspect host.",
    },
    install: "cargo install chainsaw  # or release binary",
    url: "https://github.com/WithSecureLabs/chainsaw",
  },

  // ───── Malware analysis ─────
  {
    name: "Ghidra",
    category: "malware", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "أداة هندسة عكسية مفتوحة من NSA — disassembler + decompiler قوي مجاناً.",
      en: "Open-source reverse engineering suite from the NSA — powerful disassembler + decompiler, free.",
    },
    whenToUse: {
      ar: "تحليل عميق لأي binary مشتبه به أو لـ CTF.",
      en: "Deep analysis of any suspect binary or CTF challenges.",
    },
    install: "Download from ghidra-sre.org",
    url: "https://ghidra-sre.org",
  },
  {
    name: "IDA Pro / IDA Free",
    category: "malware", side: "blue", oss: false, os: ["linux", "mac", "win"],
    blurb: {
      ar: "المعيار التجاري للهندسة العكسية — أسرع و أنضج من Ghidra في تحليل معقد.",
      en: "Commercial RE standard — faster and more polished than Ghidra for complex analysis.",
    },
    whenToUse: {
      ar: "RE احترافي عند توفر الميزانية.",
      en: "Professional RE work when budget allows.",
    },
    url: "https://hex-rays.com/ida-pro",
  },
  {
    name: "x64dbg",
    category: "malware", side: "blue", oss: true, os: ["win"],
    blurb: {
      ar: "Debugger مفتوح المصدر للـ Windows — بديل ممتاز لـ OllyDbg الحديث.",
      en: "Open-source Windows debugger — modern OllyDbg replacement.",
    },
    whenToUse: {
      ar: "تحليل ديناميكي للـ malware أو unpacking.",
      en: "Dynamic malware analysis or unpacking.",
    },
    url: "https://x64dbg.com",
  },
  {
    name: "YARA",
    category: "malware", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "لغة لكتابة قواعد كشف بصمات malware عبر strings/bytes — مدمجة في كل scanner.",
      en: "Rule language for malware fingerprinting via strings/bytes — integrated into every scanner.",
    },
    whenToUse: {
      ar: "بعد تحليل عينة، اكتب قاعدة YARA لكشف العائلة في كل جهاز.",
      en: "After analyzing a sample, write a YARA rule to find the family across every host.",
    },
    install: "apt install yara",
    examples: ["yara rules/ /path/to/files -r"],
    url: "https://yara.readthedocs.io",
  },
  {
    name: "ANY.RUN",
    category: "malware", side: "blue", oss: false, os: ["web"],
    blurb: {
      ar: "Sandbox تفاعلي عبر المتصفح — تتفاعل مع الـ malware في VM آمن.",
      en: "Interactive browser-based sandbox — you interact with the malware inside a safe VM.",
    },
    whenToUse: {
      ar: "تحليل سريع لعينة دون إعداد معمل محلي.",
      en: "Quick sample analysis without setting up a local lab.",
    },
    url: "https://any.run",
  },
  {
    name: "FLARE-VM",
    category: "malware", side: "blue", oss: true, os: ["win"],
    blurb: {
      ar: "Windows VM جاهزة بكل أدوات malware analysis — installer واحد.",
      en: "Pre-baked Windows analysis VM with every malware tool — single installer.",
    },
    whenToUse: {
      ar: "تجهيز معمل تحليل malware بسرعة.",
      en: "Spin up a malware analysis lab in minutes.",
    },
    url: "https://github.com/mandiant/flare-vm",
  },

  // ───── Defensive — SIEM / EDR / IDS ─────
  {
    name: "Wazuh",
    category: "siem", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "منصة XDR مجانية مفتوحة المصدر — agents + SIEM + FIM + SCA + vulnerability detection.",
      en: "Free, open-source XDR platform — agents + SIEM + FIM + SCA + vulnerability detection.",
    },
    whenToUse: {
      ar: "بناء SOC بدون تكلفة Splunk — قوية بشكل مفاجئ.",
      en: "Build a SOC without Splunk pricing — surprisingly capable.",
    },
    install: "curl -sO https://packages.wazuh.com/4.7/wazuh-install.sh && sudo bash ./wazuh-install.sh -a",
    url: "https://wazuh.com",
  },
  {
    name: "Elastic Security (ELK)",
    category: "siem", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "Elastic + Kibana مع SIEM module — قواعد كشف جاهزة و تكامل مع Endpoint Security.",
      en: "Elastic + Kibana with SIEM module — pre-built detection rules and Endpoint Security integration.",
    },
    whenToUse: {
      ar: "مؤسسات لديها بالفعل Elastic stack.",
      en: "Orgs already running an Elastic stack.",
    },
    url: "https://www.elastic.co/security",
  },
  {
    name: "Splunk",
    category: "siem", side: "blue", oss: false, os: ["linux", "win"],
    blurb: {
      ar: "المعيار التجاري للـ SIEM — قوي جداً لكن مكلف.",
      en: "Commercial SIEM gold standard — extremely powerful, expensive.",
    },
    whenToUse: {
      ar: "مؤسسات كبيرة بميزانية و حاجة لقواعد كشف متطورة.",
      en: "Large orgs with budget and advanced detection needs.",
    },
    url: "https://www.splunk.com",
  },
  {
    name: "Microsoft Sentinel",
    category: "siem", side: "blue", oss: false, os: ["web"],
    blurb: {
      ar: "SIEM/SOAR سحابي على Azure — تكامل عميق مع Microsoft 365 و Defender.",
      en: "Cloud-native SIEM/SOAR on Azure — deep Microsoft 365 and Defender integration.",
    },
    whenToUse: {
      ar: "بيئات Microsoft الكبيرة.",
      en: "Large Microsoft-centric environments.",
    },
    url: "https://azure.microsoft.com/products/microsoft-sentinel",
  },
  {
    name: "Sysmon",
    category: "edr", side: "blue", oss: false, os: ["win"],
    blurb: {
      ar: "أداة Microsoft تسجل أحداث Windows عميقة (process, network, registry, image load).",
      en: "Microsoft tool logging deep Windows events (process, network, registry, image load).",
    },
    whenToUse: {
      ar: "ضرورة على كل Windows endpoint — مع config من SwiftOnSecurity أو Olaf Hartong.",
      en: "Must-have on every Windows endpoint — pair with SwiftOnSecurity or Olaf Hartong configs.",
    },
    install: "sysmon.exe -accepteula -i config.xml",
    url: "https://learn.microsoft.com/sysinternals/downloads/sysmon",
  },
  {
    name: "osquery",
    category: "edr", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "يمثّل OS كقاعدة بيانات SQL — اطرح أسئلة threat hunting بـ SELECT.",
      en: "Exposes the OS as a SQL database — ask threat-hunting questions with SELECT.",
    },
    whenToUse: {
      ar: "Threat hunting شامل عبر آلاف الأجهزة بسرعة.",
      en: "Cross-fleet threat hunting at scale.",
    },
    install: "apt install osquery",
    examples: ["SELECT * FROM listening_ports WHERE address = '0.0.0.0';"],
    url: "https://osquery.io",
  },
  {
    name: "Suricata",
    category: "ids", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "IDS/IPS عالي الأداء يدعم متعدد الـ threading + قواعد Snort + JSON output.",
      en: "High-performance IDS/IPS with multi-threading, Snort rule support, and JSON output.",
    },
    whenToUse: {
      ar: "مراقبة حركة الشبكة في وقت حقيقي على المحيط.",
      en: "Real-time network traffic monitoring at the perimeter.",
    },
    install: "apt install suricata",
    url: "https://suricata.io",
  },
  {
    name: "Zeek (Bro)",
    category: "ids", side: "blue", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "محلل بروتوكولات شبكة عميق — يولّد سجلات structured للـ HTTP/DNS/SSL/SMB/...",
      en: "Deep network protocol analyzer — produces structured logs for HTTP/DNS/SSL/SMB/...",
    },
    whenToUse: {
      ar: "Forensics و detection engineering عميقة على مستوى الـ payloads.",
      en: "Deep forensics and detection engineering at the payload level.",
    },
    install: "apt install zeek",
    url: "https://zeek.org",
  },
  {
    name: "Sigma",
    category: "ids", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "صيغة موحّدة لقواعد كشف — تترجم آلياً إلى Splunk/Elastic/Sentinel/Sumo.",
      en: "Vendor-neutral detection rule format — auto-translated to Splunk/Elastic/Sentinel/Sumo.",
    },
    whenToUse: {
      ar: "كتابة قواعد مرة واحدة و نشرها على عدة SIEMs.",
      en: "Write rules once and deploy across multiple SIEMs.",
    },
    url: "https://github.com/SigmaHQ/sigma",
  },

  // ───── TI / Honeypot ─────
  {
    name: "MISP",
    category: "ti", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "منصة threat intelligence لمشاركة IOCs/TTPs بين فرق الأمن و الـ CERTs.",
      en: "Threat intelligence platform for sharing IOCs/TTPs across security teams and CERTs.",
    },
    whenToUse: {
      ar: "بناء قاعدة معرفية و التكامل مع SIEM + EDR.",
      en: "Build a knowledge base and integrate with SIEM + EDR.",
    },
    install: "Use the MISP project's official installer or container.",
    url: "https://www.misp-project.org",
  },
  {
    name: "TheHive + Cortex",
    category: "ti", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "منصة إدارة حالات SOC — تنظيم تحقيقات و تنسيق الفريق + تحليل آلي.",
      en: "SOC case-management platform — incident orchestration, team workflow, automated analysis.",
    },
    whenToUse: {
      ar: "SOC ينتقل من spreadsheets إلى عملية منظمة.",
      en: "When a SOC moves from spreadsheets to a real workflow.",
    },
    url: "https://thehive-project.org",
  },
  {
    name: "Canarytokens",
    category: "honeypot", side: "blue", oss: true, os: ["web"],
    blurb: {
      ar: "إنشاء tokens مجانية (DNS/HTTP/AWS/Doc) — تنبهك فوراً عند استخدامها.",
      en: "Generate free tokens (DNS/HTTP/AWS/Doc) — alerts instantly when used.",
    },
    whenToUse: {
      ar: "زرع طُعم في كل أصل حساس — أداة الكشف #1 من حيث ROI.",
      en: "Plant bait in every sensitive asset — best ROI detection tool.",
    },
    url: "https://canarytokens.org",
  },
  {
    name: "T-Pot",
    category: "honeypot", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "honeypot multi-protocol جاهز — SSH, HTTP, SMB, ICS، dashboard كامل.",
      en: "Pre-baked multi-protocol honeypot — SSH, HTTP, SMB, ICS, full dashboard.",
    },
    whenToUse: {
      ar: "بحث threat intel و دراسة سلوك المهاجمين على الإنترنت.",
      en: "Threat intel research and studying real-world attacker behavior.",
    },
    install: "git clone https://github.com/telekom-security/tpotce",
    url: "https://github.com/telekom-security/tpotce",
  },

  // ───── Hardening / Compliance ─────
  {
    name: "Lynis",
    category: "hardening", side: "blue", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "ماسح تصلب لـ Linux/Unix — يفحص 200+ check و يعطي توصيات محددة.",
      en: "Linux/Unix hardening scanner — runs 200+ checks with specific remediation advice.",
    },
    whenToUse: {
      ar: "مراجعة دورية لكل سيرفر Linux.",
      en: "Periodic review of every Linux server.",
    },
    install: "apt install lynis",
    examples: ["lynis audit system"],
    url: "https://cisofy.com/lynis",
  },
  {
    name: "OpenSCAP",
    category: "hardening", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "تنفيذ SCAP/OVAL/STIG — أتمتة فحص و إصلاح وفق CIS و DISA STIGs.",
      en: "SCAP/OVAL/STIG implementation — automated scan & remediation per CIS and DISA STIGs.",
    },
    whenToUse: {
      ar: "بيئات حكومية تحتاج إثبات امتثال للـ STIGs.",
      en: "Government environments needing STIG-compliance evidence.",
    },
    install: "apt install libopenscap8",
    url: "https://www.open-scap.org",
  },
  {
    name: "OPA / Gatekeeper",
    category: "hardening", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "Policy as Code — تطبيق قواعد أمان على Kubernetes / Terraform / CI / micro-services.",
      en: "Policy as Code — enforce security rules across Kubernetes / Terraform / CI / micro-services.",
    },
    whenToUse: {
      ar: "بناء حواجز ضد الـ misconfigurations في الـ pipeline.",
      en: "Build pipeline guardrails against misconfigurations.",
    },
    url: "https://www.openpolicyagent.org",
  },
  {
    name: "HashiCorp Vault",
    category: "hardening", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "إدارة الأسرار المركزية مع dynamic secrets و leasing و audit log.",
      en: "Centralized secrets management with dynamic secrets, leasing, and full audit logging.",
    },
    whenToUse: {
      ar: "أي بيئة فيها أكثر من خدمة تحتاج credentials و keys.",
      en: "Any environment with multiple services needing credentials and keys.",
    },
    install: "brew install hashicorp/tap/vault",
    url: "https://www.vaultproject.io",
  },

  // ───── Binary / Exploit dev ─────
  {
    name: "pwntools",
    category: "binary", side: "red", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "مكتبة Python للـ CTF و تطوير exploits — التواصل مع binaries، ROP، shellcode.",
      en: "Python library for CTF and exploit development — binary I/O, ROP, shellcode.",
    },
    whenToUse: {
      ar: "كتابة كل exploit من stack overflow حتى heap exploitation.",
      en: "Writing every exploit from stack overflow to heap exploitation.",
    },
    install: "pip install pwntools",
    examples: [
      'p = process("./vuln")',
      "rop = ROP(elf)",
    ],
    url: "https://docs.pwntools.com",
  },
  {
    name: "ROPgadget / ropper",
    category: "binary", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "البحث عن ROP gadgets في binaries / libraries.",
      en: "Find ROP gadgets in binaries / libraries.",
    },
    whenToUse: {
      ar: "أثناء بناء ROP chain لتجاوز DEP/NX.",
      en: "While building a ROP chain to bypass DEP/NX.",
    },
    install: "pip install ROPgadget",
    examples: ['ROPgadget --binary ./libc.so.6 | grep "pop rdi"'],
    url: "https://github.com/JonathanSalwan/ROPgadget",
  },
  {
    name: "AFL++",
    category: "binary", side: "both", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "fuzzer ذكي بـ coverage feedback — اكتشف بـ AFL آلاف الـ CVEs.",
      en: "Smart coverage-guided fuzzer — AFL has discovered thousands of CVEs.",
    },
    whenToUse: {
      ar: "اختبار قوة أي parser أو binary يقبل user input.",
      en: "Stress-testing any parser or binary that accepts user input.",
    },
    install: "apt install afl++",
    url: "https://aflplus.plus",
  },
  {
    name: "angr",
    category: "binary", side: "both", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "إطار symbolic execution — يحلّ مسارات معقدة آلياً، مفيد في CTF و RE.",
      en: "Symbolic execution framework — solves complex paths automatically, useful in CTF and RE.",
    },
    whenToUse: {
      ar: "binary فيه check معقد لا تريد كسره يدوياً.",
      en: "Binary with a complex check you don't want to break manually.",
    },
    install: "pip install angr",
    url: "https://angr.io",
  },
];

export const TOOL_CATEGORIES: Record<ToolCategory, { ar: string; en: string }> = {
  recon:        { ar: "استطلاع",                en: "Reconnaissance" },
  scanning:     { ar: "مسح",                    en: "Scanning" },
  web:          { ar: "ويب",                    en: "Web" },
  exploitation: { ar: "استغلال",                en: "Exploitation" },
  ad:           { ar: "Active Directory",       en: "Active Directory" },
  "post-ex":    { ar: "ما بعد الاختراق",        en: "Post-Exploitation" },
  c2:           { ar: "Command & Control",      en: "Command & Control" },
  cloud:        { ar: "سحابة",                  en: "Cloud" },
  container:    { ar: "حاويات و K8s",           en: "Containers & K8s" },
  wireless:     { ar: "لاسلكي",                 en: "Wireless" },
  mobile:       { ar: "موبايل",                 en: "Mobile" },
  forensics:    { ar: "تحليل جنائي",            en: "Forensics" },
  malware:      { ar: "تحليل برمجيات خبيثة",     en: "Malware Analysis" },
  siem:         { ar: "SIEM",                   en: "SIEM" },
  edr:          { ar: "EDR / Endpoint",         en: "EDR / Endpoint" },
  ids:          { ar: "IDS / Network",          en: "IDS / Network" },
  hardening:    { ar: "تصلب و امتثال",          en: "Hardening & Compliance" },
  ti:           { ar: "Threat Intelligence",    en: "Threat Intelligence" },
  honeypot:     { ar: "Honeypot",               en: "Honeypot" },
  binary:       { ar: "Binary / Exploit Dev",   en: "Binary / Exploit Dev" },
};
