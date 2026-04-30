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
      ar: "أداة متطورة من ProjectDiscovery لاستقصاء النطاقات الفرعية (subdomains)، تعتمد على تجميع البيانات من عشرات المصادر السلبية (Passive Sources) بكفاءة عالية.",
      en: "Fast, reliable subdomain enumerator from ProjectDiscovery that aggregates dozens of passive sources.",
    },
    whenToUse: {
      ar: "تُستخدم كخطوة أولى في مرحلة الاستطلاع (Reconnaissance) للكشف عن النطاقات الفرعية دون التفاعل المباشر مع البنية التحتية للهدف.",
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
      ar: "أداة تابعة لمنظمة OWASP لرسم خريطة سطح الهجوم، تدمج بين استعلامات DNS وWHOIS وتقنيات الـ scraping مع ربط واسع عبر واجهات البرمجة APIs.",
      en: "OWASP attack-surface mapper combining DNS, WHOIS, scraping, and dozens of API integrations.",
    },
    whenToUse: {
      ar: "تُستخدم عند الحاجة إلى رسم خريطة علاقات عميقة تشمل أرقام الأنظمة المستقلة (ASN) ونطاقات CIDR والشهادات الرقمية، بدلاً من مجرد سرد النطاقات الفرعية.",
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
      ar: "أداة فحص بروتوكول HTTP متعددة الأغراض، تعمل على تحديد الحالات النشطة واستخراج عناوين الصفحات والتقنيات المستخدمة ورموز الحالة والمنافذ المفتوحة.",
      en: "Swiss-army HTTP probe — determines alive/dead, title, tech stack, status, port.",
    },
    whenToUse: {
      ar: "تُستخدم بعد عملية استقصاء النطاقات الفرعية لفلترة العناوين المستجيبة لبروتوكولات HTTP/S وتحديد طبيعة الخدمات المشغلة عليها.",
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
      ar: "محرك بحث مخصص للأجهزة المتصلة بالإنترنت، يتيح اكتشاف الخوادم والخدمات والثغرات الأمنية (CVEs) من خلال تحليل الـ banners الخاصة بالخدمات.",
      en: "Search engine for every internet-connected device — reveals hosts, services, CVEs by banner.",
    },
    whenToUse: {
      ar: "تُستخدم لاكتشاف الأصول التابعة لمؤسسة معينة، أو البحث عن أنظمة التحكم الصناعي (ICS/SCADA)، أو رصد الخدمات المنسية والغير محمية.",
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
      ar: "أداة متخصصة في مسح مستودعات الكود (Git) والملفات والخدمات السحابية للكشف عن الأسرار المسربة (API keys, tokens) مع ميزة التحقق الفوري من صلاحيتها.",
      en: "Scans git/file/cloud for leaked secrets (API keys, tokens) with built-in validity verification.",
    },
    whenToUse: {
      ar: "للفريق الأحمر: للبحث عن مفاتيح مسربة في GitHub؛ للفريق الأزرق: لمنع تسريب البيانات الحساسة قبل اعتماد الكود (Pre-commit).",
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
      ar: "الأداة المرجعية لمسح المنافذ وتحديد الخدمات، وتتضمن محرك سكربتات NSE القوي لاكتشاف الثغرات وتوصيف الأنظمة.",
      en: "The original port scanner with service detection and a powerful NSE script engine.",
    },
    whenToUse: {
      ar: "تُعد الأداة الأساسية فور تحديد نطاق العمل (Scope)، وهي ضرورية في كافة مراحل اختبار الاختراق لتحديد سطح الهجوم.",
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
      ar: "أسرع ماسح للمنافذ على مستوى العالم، قادر على مسح كامل فضاء الإنترنت في وقت قياسي باستخدام تقنيات الإرسال غير المتزامن.",
      en: "The world's fastest port scanner — scans the entire internet in ~6 minutes (in theory).",
    },
    whenToUse: {
      ar: "تُستخدم عند التعامل مع نطاقات عناوين IP ضخمة جداً، ويُفضل دمج نتائجها مع nmap للحصول على تفاصيل الخدمات.",
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
      ar: "ماسح ثغرات يعتمد على القوالب (Templates)، يوفر آلاف النماذج التي يساهم بها المجتمع لاكتشاف الثغرات البرمجية وخلل الإعدادات.",
      en: "Template-driven vulnerability scanner — thousands of community templates for CVEs and misconfigs.",
    },
    whenToUse: {
      ar: "تُستخدم بعد تحديد الخدمات النشطة لإجراء فحص آلي سريع وشامل للثغرات المعروفة (Known Vulnerabilities).",
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
      ar: "أداة اختبار عشوائي (Fuzzer) فائقة السرعة للويب، تُستخدم في اكتشاف المسارات (Directories) والمعاملات (Parameters) والنطاقات الافتراضية (vhosts).",
      en: "Blazing-fast web fuzzer — directory brute force, parameter discovery, vhost discovery.",
    },
    whenToUse: {
      ar: "لاكتشاف النقاط النهائية (Endpoints) المخفية أو المعاملات غير الموثقة، وفحص آليات تحديد معدل الاستهلاك (Rate Limiting).",
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
      ar: "المنصة القياسية لاختبار اختراق تطبيقات الويب، تدمج بين الـ Proxy التفاعلي وأدوات التكرار (Repeater) والتحليل الآلي.",
      en: "Industry-standard web testing platform — proxy + scanner + Repeater + Intruder + extensions.",
    },
    whenToUse: {
      ar: "الأداة اليومية الأساسية لاختبار الويب؛ توفر النسخة الاحترافية (Pro) ماسحاً آلياً متقدماً للثغرات المعقدة.",
      en: "Your daily-driver for web testing — Pro version adds a strong active scanner.",
    },
    examples: ["Configure browser proxy → 127.0.0.1:8080"],
    url: "https://portswigger.net/burp",
  },
  {
    name: "OWASP ZAP",
    category: "web", side: "both", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "البديل المفتوح المصدر لـ Burp Suite من منظمة OWASP، يتميز بقدرات أتمتة قوية وتكامل مع بيئات التطوير المستمر (CI/CD).",
      en: "Open-source Burp alternative from OWASP — strong automation and CI/CD support.",
    },
    whenToUse: {
      ar: "في المشاريع ذات الميزانية المحدودة، أو عند الحاجة لدمج اختبارات الأمن الديناميكية (DAST) ضمن مسارات البرمجة المؤتمتة.",
      en: "Budget-constrained engagements or DAST integration in pipelines.",
    },
    install: "snap install zaproxy --classic",
    url: "https://www.zaproxy.org",
  },
  {
    name: "sqlmap",
    category: "web", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "أداة رائدة لأتمتة اكتشاف واستغلال ثغرات حقن SQL، تدعم مجموعة واسعة من أنظمة إدارة قواعد البيانات وتقنيات الحقن.",
      en: "Full automation for detecting and exploiting SQL Injection — supports 10+ database engines.",
    },
    whenToUse: {
      ar: "بمجرد الاشتباه في وجود ثغرة حقن SQL يدوياً، تُستخدم sqlmap لتأكيد الثغرة واستخراج البيانات أو الوصول للنظام.",
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
      ar: "ماسح أمني متخصص لنظام WordPress، يقوم بفحص القوالب والإضافات، وتعداد المستخدمين، واكتشاف الثغرات المعروفة.",
      en: "WordPress-focused scanner — themes/plugins, user enum, CVE database.",
    },
    whenToUse: {
      ar: "عند فحص أي موقع يعمل بنظام إدارة المحتوى WordPress (الذي يشغل حوالي 40% من الويب).",
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
      ar: "أداة تحليل بيئة Active Directory باستخدام نظرية المخططات (Graph Theory)، ترسم مسارات الهجوم وتحدد أقصر طريق للوصول لصلاحيات Domain Admin.",
      en: "Graphs Active Directory relationships and computes the shortest path to Domain Admin.",
    },
    whenToUse: {
      ar: "تُستخدم فور الحصول على أي بيانات اعتماد (Credentials) داخل النطاق لفهم هيكلية الصلاحيات وتحديد الأهداف التالية.",
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
      ar: "أداة شاملة لاختبار اختراق الشبكات والخدمات، تتيح تنفيذ العمليات على بروتوكولات SMB وSSH وWinRM وMSSQL وLDAP من واجهة واحدة.",
      en: "Swiss-army knife for network pentesting — SMB/SSH/WinRM/MSSQL/LDAP in one tool.",
    },
    whenToUse: {
      ar: "في عمليات الـ spraying، وتعداد المستخدمين، وتنفيذ الأوامر عن بعد، واستخراج الهاشات (Hash Dump) في بيئات AD.",
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
      ar: "مجموعة مكتبات Python للتعامل مع بروتوكولات شبكات Windows، تتضمن أدوات قوية مثل psexec وsecretsdump وntlmrelayx.",
      en: "Complete Python library for Windows protocols — psexec, secretsdump, GetUserSPNs, ntlmrelayx.",
    },
    whenToUse: {
      ar: "لتنفيذ هجمات Kerberoasting وAS-REP Roasting وDCSync وNTLM relay، حيث توفر السكربتات الأساسية لهذه العمليات.",
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
      ar: "الأداة الأشهر لاستخراج بيانات الاعتماد من ذاكرة نظام Windows، قادرة على استعادة كلمات المرور الصريحة والهاشات وتذاكر Kerberos.",
      en: "The legendary Windows credential extractor — passwords, tickets, hashes, DPAPI.",
    },
    whenToUse: {
      ar: "بعد الحصول على صلاحيات مدير محلي (Local Admin) أو SYSTEM على نظام Windows لجمع بيانات الدخول المتاحة في الذاكرة.",
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
      ar: "أداة متخصصة في مراجعة ثغرات خدمات الشهادات في Active Directory (ADCS)، تكتشف وتستغل خلل الإعدادات من نوع ESC1 إلى ESC15.",
      en: "Python tool for ADCS — discovers and exploits ESC1-ESC15 automatically.",
    },
    whenToUse: {
      ar: "في أي بيئة Windows تتضمن سلطة شهادات (CA)، حيث توفر غالباً أقصر طريق للوصول لصلاحيات Domain Admin.",
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
      ar: "أداة تسميم لبروتوكولات LLMNR وNBT-NS وmDNS، تستخدم لالتقاط هاشات NTLM من المستخدمين عبر استجابات وهمية على الشبكة المحلية.",
      en: "Poisons LLMNR/NBT-NS/mDNS and captures NTLM hashes from users on the same network.",
    },
    whenToUse: {
      ar: "عند التواجد في الشبكة الداخلية؛ غالباً ما تنجح في التقاط الهاشات خلال وقت قصير لبدء هجمات كسر كلمات المرور أو Relay.",
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
      ar: "إطار العمل الأضخم لتطوير وتنفيذ الاستغلالات، يضم آلاف الثغرات الجاهزة وبرمجيات Payload المتقدمة مثل Meterpreter.",
      en: "The largest exploitation framework — thousands of modules, meterpreter payloads, automation.",
    },
    whenToUse: {
      ar: "لإثبات وجود ثغرة معروفة (PoC)، أو لتوليد Payloads مخصصة وإدارة جلسات الاختراق المتعددة.",
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
      ar: "المنصة التجارية الرائدة لعمليات الفريق الأحمر (Red Teaming)، توفر برمجيات Beacon متطورة وقدرات تخفي وتحرك جانبي احترافية.",
      en: "Commercial gold standard for red teaming — beacons, malleable C2, integrated lateral movement.",
    },
    whenToUse: {
      ar: "في المهام طويلة الأمد التي تتطلب مستوى عالٍ من الاحترافية في التحكم والسيطرة وقابلية التخصيص لتجاوز الأنظمة الدفاعية.",
      en: "Long-term engagements needing professional, customizable C2.",
    },
    url: "https://www.cobaltstrike.com",
  },
  {
    name: "Sliver",
    category: "c2", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "بديل متطور ومفتوح المصدر لـ Cobalt Strike، مكتوب بلغة Go ويدعم بروتوكولات اتصال متعددة مثل mTLS وDNS وHTTP وWireGuard.",
      en: "Open-source alternative to Cobalt Strike — written in Go, supports mTLS/DNS/HTTP/WireGuard.",
    },
    whenToUse: {
      ar: "في عمليات التدريب أو المهام الأمنية التي تتطلب إطار عمل C2 قوي دون الحاجة لتكاليف التراخيص التجارية.",
      en: "Training or engagements without a Cobalt Strike license budget.",
    },
    install: "curl https://sliver.sh/install | sudo bash",
    url: "https://github.com/BishopFox/sliver",
  },
  {
    name: "evilginx2",
    category: "exploitation", side: "red", oss: true, os: ["linux"],
    blurb: {
      ar: "إطار عمل هجمات التصيد باستخدام Reverse Proxy، قادر على تجاوز المصادقة الثنائية (MFA) عبر سرقة جلسات الاتصال (Cookies).",
      en: "Reverse-proxy phishing framework — captures live sessions even with TOTP MFA.",
    },
    whenToUse: {
      ar: "في حملات التصيد المصرح بها لتقييم مقاومة الموظفين لهجمات Adversary-in-the-Middle (AiTM).",
      en: "Authorized phishing campaigns testing staff resilience to AiTM.",
    },
    install: "go install github.com/kgretzky/evilginx2@latest",
    url: "https://github.com/kgretzky/evilginx2",
  },
  {
    name: "Chisel",
    category: "post-ex", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "أداة إنشاء أنفاق TCP/UDP مشفرة عبر بروتوكول HTTP/S، تُستخدم بفعالية للتحرك الجانبي وتجاوز جدران الحماية.",
      en: "TCP/UDP tunnel over HTTP/HTTPS — perfect for pivoting through proxies.",
    },
    whenToUse: {
      ar: "عند الحاجة لإنشاء ممر اتصال (Tunneling) للوصول إلى شبكة داخلية خلف خوادم Proxy أو جدران حماية صارمة.",
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
      ar: "سكربتات أتمتة شاملة لمرحلة ما بعد الاختراق، تقوم بمسح النظام واكتشاف كافة مسارات تصعيد الصلاحيات (Privilege Escalation) الممكنة.",
      en: "Comprehensive automation scripts to discover local privilege escalation paths.",
    },
    whenToUse: {
      ar: "تُشغل فور الحصول على وصول أولي (Shell) للنظام للبحث عن أسرع طريق للوصول لصلاحيات root أو SYSTEM.",
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
      ar: "إطار عمل هجومي شامل لبيئات AWS، يسهل عمليات الاستطلاع وتصعيد الصلاحيات وتحقيق الاستمرارية (Persistence) داخل السحابة.",
      en: "First comprehensive AWS offensive framework — enumeration, privesc, persistence, exfil.",
    },
    whenToUse: {
      ar: "عند الحصول على مفاتيح AWS مسربة، تُستخدم Pacu لتحليل الصلاحيات المتاحة وتوسيع نطاق الاختراق.",
      en: "When you've got leaked AWS keys, Pacu drives them toward administrator-access.",
    },
    install: "pipx install pacu",
    url: "https://github.com/RhinoSecurityLabs/pacu",
  },
  {
    name: "CloudFox",
    category: "cloud", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "أداة استكشاف هجومية لبيئات AWS وAzure، مصممة لمساعدة المختبرين في العثور على الأصول الحساسة والخلل في الصلاحيات بسرعة.",
      en: "AWS/Azure recon tool for pentesting — fast inventory of every asset and permission.",
    },
    whenToUse: {
      ar: "للحصول على رؤية شاملة وفورية لكافة الأصول والموارد التي يمكن للمهاجم الوصول إليها داخل الحساب السحابي.",
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
      ar: "أداة تدقيق أمني شاملة للبيئات السحابية (AWS/Azure/GCP)، تدعم أكثر من 300 فحص أمني وفقاً لمعايير CIS وNIST وISO27001.",
      en: "Security scanner for AWS/Azure/GCP/k8s — 300+ checks against CIS, NIST, GDPR, ISO27001.",
    },
    whenToUse: {
      ar: "للمراقبة المستمرة لمستوى الأمان (Security Posture) في السحابة وضمان الامتثال للمعايير الأمنية العالمية.",
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
      ar: "أداة تدقيق أمني لعدة منصات سحابية، توفر تقارير تفاعلية بصيغة HTML توضح الثغرات والمخاطر المكتشفة بوضوح.",
      en: "Multi-cloud auditor (AWS/Azure/GCP/Aliyun) producing a comprehensive HTML report.",
    },
    whenToUse: {
      ar: "لإجراء تقييم أمني سريع للبيئة السحابية وتقديم تقرير مفصل للإدارة يوضح الثغرات المكتشفة.",
      en: "Quick environment assessment with an executive-friendly report.",
    },
    install: "pipx install scoutsuite",
    url: "https://github.com/nccgroup/ScoutSuite",
  },
  {
    name: "trivy",
    category: "container", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "ماسح أمني شامل لصور الحاويات (Images) وأنظمة الملفات ومستودعات الكود، يكتشف الثغرات CVEs وخلل الإعدادات والأسرار المسربة.",
      en: "All-in-one scanner for images, filesystems, git repos, Kubernetes — detects CVEs, misconfigs, and secrets.",
    },
    whenToUse: {
      ar: "كجزء أساسي من مسار التطوير (CI/CD) لفحص الصور قبل رفعها إلى المستودعات أو تشغيلها في بيئات الإنتاج.",
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
      ar: "أداة فحص لبيئات Kubernetes تقوم بالتحقق من مدى التزام العناقيد (Clusters) بمعايير CIS Kubernetes Benchmark.",
      en: "Audits a Kubernetes cluster against the CIS Kubernetes Benchmark.",
    },
    whenToUse: {
      ar: "بعد إعداد أو ترقية أي عنقود Kubernetes للتأكد من تطبيق أفضل ممارسات التحصين والأمان.",
      en: "After every k8s upgrade and periodically to verify hardening.",
    },
    install: "kubectl apply -f kube-bench.yaml",
    url: "https://github.com/aquasecurity/kube-bench",
  },
  {
    name: "Falco",
    category: "container", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "محرك لرصد التهديدات في وقت التشغيل (Runtime Detection) للحاويات وKubernetes، يعتمد على تقنية eBPF لمراقبة نشاط النظام.",
      en: "Runtime detection engine for containers and k8s — uses eBPF to flag suspicious behavior.",
    },
    whenToUse: {
      ar: "للكشف الفوري عن محاولات الهروب من الحاويات (Container Escape)، أو تشغيل عمليات غير مصرح بها، أو السلوكيات المريبة.",
      en: "Instant detection of container escapes, crypto miners, unexpected shells.",
    },
    install: "helm install falco falcosecurity/falco",
    url: "https://falco.org",
  },
  {
    name: "peirates",
    category: "container", side: "red", oss: true, os: ["linux"],
    blurb: {
      ar: "إطار عمل لاختراق بيئات Kubernetes، يتيح تنفيذ هجمات استقصاء وتصعيد صلاحيات من داخل حاوية مخترقة.",
      en: "Kubernetes attack framework — runs comprehensive attacks from within a compromised pod.",
    },
    whenToUse: {
      ar: "بعد اختراق أي Pod في البيئة السحابية، لاستكشاف بقية العنقود والبحث عن ثغرات في الخدمات الجانبية.",
      en: "After any pod compromise, peirates surfaces available escalation paths.",
    },
    url: "https://github.com/inguardians/peirates",
  },

  // ───── Wireless ─────
  {
    name: "aircrack-ng",
    category: "wireless", side: "red", oss: true, os: ["linux"],
    blurb: {
      ar: "المجموعة الأشهر لاختبار أمان الشبكات اللاسلكية، توفر أدوات لالتقاط الحزم وكسر تشفير WEP وWPA/WPA2.",
      en: "Complete Wi-Fi audit suite — handshake capture, WEP/WPA/WPA2 cracking.",
    },
    whenToUse: {
      ar: "في اختبارات الاختراق الميدانية لتقييم قوة تشفير الشبكات اللاسلكية وسياسات الوصول الخاصة بها.",
      en: "Authorized Wi-Fi test on the client's site.",
    },
    install: "apt install aircrack-ng",
    url: "https://www.aircrack-ng.org",
  },
  {
    name: "hcxdumptool / hcxtools",
    category: "wireless", side: "red", oss: true, os: ["linux"],
    blurb: {
      ar: "أدوات متقدمة لالتقاط بيانات PMKID من نقاط الوصول دون انتظار اتصال مستخدمين، مما يسرع كسر تشفير WPA2.",
      en: "Capture PMKID without needing a connected client — fastest path to crack WPA2.",
    },
    whenToUse: {
      ar: "عند الرغبة في تنفيذ هجمات صامتة وسريعة على الشبكات اللاسلكية دون الحاجة لتنفيذ هجمات Deauthentication.",
      en: "Instead of aireplay deauth, PMKID works in seconds.",
    },
    install: "apt install hcxdumptool hcxtools",
    url: "https://github.com/ZerBea/hcxdumptool",
  },
  {
    name: "Bettercap",
    category: "wireless", side: "red", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "إطار عمل شامل لهجمات الوسيط (MITM)، يدعم الشبكات اللاسلكية والبلوتوث والشبكات السلكية مع واجهة ويب تفاعلية.",
      en: "Comprehensive MITM framework — Wi-Fi, Bluetooth, HID, Ethernet, with a web UI.",
    },
    whenToUse: {
      ar: "لإجراء تحليل متقدم لحركة المرور على الشبكة وتنفيذ هجمات الحقن والتوجيه في الوقت الحقيقي.",
      en: "Modern MITM, replacing the classic ettercap.",
    },
    install: "apt install bettercap",
    url: "https://www.bettercap.org",
  },
  {
    name: "Flipper Zero",
    category: "wireless", side: "red", oss: false, os: ["linux", "mac", "win"],
    blurb: {
      ar: "جهاز محمول متعدد الاستخدامات لاختبار اختراق الأنظمة الفيزيائية واللاسلكية (RFID, NFC, Sub-GHz, IR).",
      en: "Portable multi-tool for RFID/NFC/Sub-GHz/Infrared/iButton — field red-team kit.",
    },
    whenToUse: {
      ar: "في اختبارات الوصول المادي (Physical Access) واختبار أمان أجهزة إنترنت الأشياء (IoT).",
      en: "Physical access and IoT testing.",
    },
    url: "https://flipperzero.one",
  },

  // ───── Mobile ─────
  {
    name: "Frida",
    category: "mobile", side: "both", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "مجموعة أدوات هندسة عكسية تفاعلية، تتيح حقن سكربتات JavaScript داخل العمليات النشطة لمراقبة وتعديل سلوك التطبيقات.",
      en: "Dynamic instrumentation toolkit — injects JavaScript into Android/iOS/desktop apps at runtime.",
    },
    whenToUse: {
      ar: "لتجاوز حماية SSL Pinning، ومراقبة استدعاءات الدوال، وتحليل البيانات الحساسة في الذاكرة أثناء التشغيل.",
      en: "SSL pinning bypass, function hooking, memory inspection.",
    },
    install: "pip install frida-tools",
    url: "https://frida.re",
  },
  {
    name: "Objection",
    category: "mobile", side: "red", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "إطار عمل لاستكشاف تطبيقات الهاتف المحمول في وقت التشغيل، مبني على Frida ويسهل استخدامه دون الحاجة لكتابة كود برمجي.",
      en: "Runtime mobile exploration framework on top of Frida — no scripting required.",
    },
    whenToUse: {
      ar: "لإجراء تقييم أمني سريع لتطبيقات Android وiOS وتفتيش نظام الملفات والذاكرة بسهولة.",
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
      ar: "منصة متكاملة للتحليل الساكن والديناميكي لتطبيقات المحمول، توفر تقارير تفصيلية حول الثغرات البرمجية والخصوصية.",
      en: "Full static + dynamic analysis for Android/iOS — produces a polished web report.",
    },
    whenToUse: {
      ar: "كخطوة أولى في تحليل أي تطبيق محمول للحصول على نظرة شاملة للثغرات قبل البدء في التحليل اليدوي المعمق.",
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
      ar: "الإطار المرجعي للتحقيق الجنائي في الذاكرة (Memory Forensics)، يستخرج العمليات النشطة والاتصالات وآثار البرمجيات الخبيثة من الذاكرة العشوائية.",
      en: "Memory forensics framework — extracts processes, network, and malware artifacts from dumps.",
    },
    whenToUse: {
      ar: "أثناء التحقيق في الحوادث الأمنية لتحليل الحالة الراهنة للنظام وقت الحادثة واكتشاف الهجمات التي لا تترك أثراً على القرص.",
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
      ar: "منصة تحقيق جنائي رقمي متكاملة بواجهة رسومية، تتيح تحليل الأقراص واستعادة الملفات المحذوفة وبناء الخط الزمني للأحداث.",
      en: "Full GUI for disk forensics — timeline, file recovery, keyword search.",
    },
    whenToUse: {
      ar: "لإجراء تحقيق جنائي منهجي وموثق على وسائط التخزين بعد وقوع اختراق أو اشتباه في نشاط غير قانوني.",
      en: "Methodical, documented disk analysis post-incident.",
    },
    install: "apt install sleuthkit autopsy",
    url: "https://www.autopsy.com",
  },
  {
    name: "KAPE",
    category: "forensics", side: "blue", oss: false, os: ["win"],
    blurb: {
      ar: "أداة لجمع الأدلة الجنائية الأولية (Triage) من أنظمة Windows بسرعة فائقة، تركز على استخلاص الآثار الأكثر أهمية للتحقيق.",
      en: "Lightning-fast triage tool for Windows — collects critical artifacts in minutes.",
    },
    whenToUse: {
      ar: "في الدقائق الأولى من الاستجابة للحوادث لجمع الأدلة الحساسة من الأجهزة قبل فقدانها أو تعديلها.",
      en: "First 30 minutes of a Windows incident, before isolation decisions.",
    },
    url: "https://www.kroll.com/en/insights/publications/cyber/kroll-artifact-parser-extractor-kape",
  },
  {
    name: "Velociraptor",
    category: "forensics", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "منصة متطورة للاستجابة للحوادث والتقصي النشط (Threat Hunting)، تتيح جمع الأدلة من آلاف الأجهزة في وقت واحد باستخدام استعلامات VQL.",
      en: "Scalable DFIR platform that collects artifacts from thousands of endpoints via VQL queries.",
    },
    whenToUse: {
      ar: "في الحوادث الكبرى التي تشمل عدداً كبيراً من الأجهزة، أو عند إجراء عمليات تقصي استباقية عن التهديدات داخل المنشأة.",
      en: "Large-scale incidents touching many endpoints, or proactive threat hunting.",
    },
    url: "https://docs.velociraptor.app",
  },
  {
    name: "Chainsaw / Hayabusa",
    category: "forensics", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "أدوات تحليل سريعة لسجلات أحداث Windows (Event Logs)، تستخدم قواعد Sigma لاكتشاف الأنشطة المشبوهة والتقنيات الهجومية.",
      en: "High-speed Windows Event Log analyzer with built-in Sigma rules.",
    },
    whenToUse: {
      ar: "بعد جمع ملفات EVTX من الأجهزة المشتبه بها للحصول على ملخص سريع لكافة الأنشطة المريبة التي تمت على النظام.",
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
      ar: "إطار عمل هندسة عكسية متكامل من تطوير وكالة الأمن القومي (NSA)، يوفر أدوات تحليل وفك شيفرة برمجية (Decompiler) قوية.",
      en: "Open-source reverse engineering suite from the NSA — powerful disassembler + decompiler, free.",
    },
    whenToUse: {
      ar: "للتحليل الساكن المتعمق للبرمجيات الخبيثة وفهم منطق عمل الأكواد الثنائية المعقدة.",
      en: "Deep analysis of any suspect binary or CTF challenges.",
    },
    install: "Download from ghidra-sre.org",
    url: "https://ghidra-sre.org",
  },
  {
    name: "IDA Pro / IDA Free",
    category: "malware", side: "blue", oss: false, os: ["linux", "mac", "win"],
    blurb: {
      ar: "الأداة القياسية والأكثر دقة في عالم الهندسة العكسية، تتميز بسرعتها الفائقة في تحليل الأكواد الضخمة ودعمها الواسع للمعالجات.",
      en: "Commercial RE standard — faster and more polished than Ghidra for complex analysis.",
    },
    whenToUse: {
      ar: "في التحليلات الاحترافية عالية المستوى التي تتطلب دقة متناهية وسرعة في فهم الأكواد الثنائية المعقدة.",
      en: "Professional RE work when budget allows.",
    },
    url: "https://hex-rays.com/ida-pro",
  },
  {
    name: "x64dbg",
    category: "malware", side: "blue", oss: true, os: ["win"],
    blurb: {
      ar: "منقح برمجيات (Debugger) حديث ومفتوح المصدر لأنظمة Windows، صمم لتبسيط عملية التحليل الديناميكي وفك الحماية عن الملفات.",
      en: "Open-source Windows debugger — modern OllyDbg replacement.",
    },
    whenToUse: {
      ar: "أثناء التحليل الديناميكي للبرمجيات الخبيثة لمراقبة تنفيذ الكود وفك التشفير عن الحمولات البرمجية في الذاكرة.",
      en: "Dynamic malware analysis or unpacking.",
    },
    url: "https://x64dbg.com",
  },
  {
    name: "YARA",
    category: "malware", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "لغة توصيفية لتصنيف واكتشاف عينات البرمجيات الخبيثة، تعتمد على تحديد أنماط النصوص والبيانات الثنائية (Bytes) الفريدة.",
      en: "Rule language for malware fingerprinting via strings/bytes — integrated into every scanner.",
    },
    whenToUse: {
      ar: "بعد تحليل عينة خبيثة، تُستخدم YARA لكتابة قواعد كشف تتيح البحث عن نفس العائلة أو التهديد في بقية الشبكة.",
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
      ar: "بيئة تحليل (Sandbox) تفاعلية عبر المتصفح، تتيح للمحلل التفاعل المباشر مع البرمجية الخبيثة داخل بيئة افتراضية آمنة.",
      en: "Interactive browser-based sandbox — you interact with the malware inside a safe VM.",
    },
    whenToUse: {
      ar: "للحصول على تحليل سريع لسلوك البرمجية واتصالاتها بالشبكة دون الحاجة لإعداد مختبر تحليل محلي.",
      en: "Quick sample analysis without setting up a local lab.",
    },
    url: "https://any.run",
  },
  {
    name: "FLARE-VM",
    category: "malware", side: "blue", oss: true, os: ["win"],
    blurb: {
      ar: "توزيعة Windows مخصصة للتحليل الجنائي الرقمي وتحليل البرمجيات الخبيثة، تأتي محملة مسبقاً بكافة الأدوات اللازمة للمحللين.",
      en: "Pre-baked Windows analysis VM with every malware tool — single installer.",
    },
    whenToUse: {
      ar: "لإعداد محطة عمل متكاملة وآمنة لتحليل التهديدات في وقت قياسي وبشكل منظم.",
      en: "Spin up a malware analysis lab in minutes.",
    },
    url: "https://github.com/mandiant/flare-vm",
  },

  // ───── Defensive — SIEM / EDR / IDS ─────
  {
    name: "Wazuh",
    category: "siem", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "منصة حماية النقاط النهائية (XDR) مفتوحة المصدر، تدمج بين جمع السجلات، وكشف التسلل، ومراقبة سلامة الملفات (FIM).",
      en: "Free, open-source XDR platform — agents + SIEM + FIM + SCA + vulnerability detection.",
    },
    whenToUse: {
      ar: "لبناء مركز عمليات أمنية (SOC) متكامل وفعال بتكلفة منخفضة، مع الحفاظ على قدرات كشف واستجابة عالية.",
      en: "Build a SOC without Splunk pricing — surprisingly capable.",
    },
    install: "curl -sO https://packages.wazuh.com/4.7/wazuh-install.sh && sudo bash ./wazuh-install.sh -a",
    url: "https://wazuh.com",
  },
  {
    name: "Elastic Security (ELK)",
    category: "siem", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "حل أمني يعتمد على Elastic Stack، يوفر قدرات SIEM متقدمة مع محرك كشف يعتمد على المجتمع وقدرات Endpoint Security.",
      en: "Elastic + Kibana with SIEM module — pre-built detection rules and Endpoint Security integration.",
    },
    whenToUse: {
      ar: "في المؤسسات التي تستخدم بالفعل Elastic Stack وترغب في تحويله إلى منصة مركزية للتحليل الأمني.",
      en: "Orgs already running an Elastic stack.",
    },
    url: "https://www.elastic.co/security",
  },
  {
    name: "Splunk",
    category: "siem", side: "blue", oss: false, os: ["linux", "win"],
    blurb: {
      ar: "المنصة الرائدة عالمياً في تحليل البيانات وإدارة السجلات الأمنية (SIEM)، تتميز بقدرات بحث وتحليل بيانات ضخمة لا تضاهى.",
      en: "Commercial SIEM gold standard — extremely powerful, expensive.",
    },
    whenToUse: {
      ar: "في المؤسسات الكبرى التي تتطلب قدرات تحليلية متقدمة وقواعد كشف معقدة وتملك الميزانية اللازمة لذلك.",
      en: "Large orgs with budget and advanced detection needs.",
    },
    url: "https://www.splunk.com",
  },
  {
    name: "Microsoft Sentinel",
    category: "siem", side: "blue", oss: false, os: ["web"],
    blurb: {
      ar: "حل SIEM وSOAR سحابي أصيل من Microsoft، يوفر تكاملاً عميقاً مع بيئات Azure وMicrosoft 365 والذكاء الاصطناعي.",
      en: "Cloud-native SIEM/SOAR on Azure — deep Microsoft 365 and Defender integration.",
    },
    whenToUse: {
      ar: "عند إدارة أمن البنية التحتية التي تعتمد بشكل أساسي على خدمات Microsoft وحوسبة Azure السحابية.",
      en: "Large Microsoft-centric environments.",
    },
    url: "https://azure.microsoft.com/products/microsoft-sentinel",
  },
  {
    name: "Sysmon",
    category: "edr", side: "blue", oss: false, os: ["win"],
    blurb: {
      ar: "أداة من مجموعة Sysinternals تراقب وتسجل نشاط النظام بشكل معمق، بما في ذلك إنشاء العمليات واتصالات الشبكة وتعديلات الملفات.",
      en: "Microsoft tool logging deep Windows events (process, network, registry, image load).",
    },
    whenToUse: {
      ar: "كعنصر أساسي في مراقبة النقاط النهائية لتعزيز القدرة على كشف الهجمات المعقدة وتوفير سجلات دقيقة للتحقيق الجنائي.",
      en: "Must-have on every Windows endpoint — pair with SwiftOnSecurity or Olaf Hartong configs.",
    },
    install: "sysmon.exe -accepteula -i config.xml",
    url: "https://learn.microsoft.com/sysinternals/downloads/sysmon",
  },
  {
    name: "osquery",
    category: "edr", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "أداة تحول نظام التشغيل إلى قاعدة بيانات علائقية، مما يتيح استعلام نشاط الأجهزة والخدمات والشبكة باستخدام لغة SQL.",
      en: "Exposes the OS as a SQL database — ask threat-hunting questions with SELECT.",
    },
    whenToUse: {
      ar: "في عمليات التقصي النشط عن التهديدات (Threat Hunting) والتحقق من الامتثال عبر أعداد كبيرة من الأجهزة المتنوعة.",
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
      ar: "محرك كشف ومنع التسلل (IDS/IPS) عالي الأداء، يدعم التحليل المتعدد للحزم والتعرف التلقائي على البروتوكولات وقواعد Snort.",
      en: "High-performance IDS/IPS with multi-threading, Snort rule support, and JSON output.",
    },
    whenToUse: {
      ar: "لمراقبة حركة مرور الشبكة عند المداخل والمخارج وكشف الأنشطة المشبوهة بناءً على التواقيع والسلوك.",
      en: "Real-time network traffic monitoring at the perimeter.",
    },
    install: "apt install suricata",
    url: "https://suricata.io",
  },
  {
    name: "Zeek (Bro)",
    category: "ids", side: "blue", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "منصة تحليل أمن الشبكات توفر سجلات مفصلة ومنظمة لكافة البروتوكولات، مما يسهل عمليات التحليل الجنائي وتتبع التهديدات.",
      en: "Deep network protocol analyzer — produces structured logs for HTTP/DNS/SSL/SMB/...",
    },
    whenToUse: {
      ar: "عند الحاجة لتحليل معمق لحركة المرور على الشبكة وفهم تفاصيل التفاعلات بين الأجهزة على مستوى البروتوكولات.",
      en: "Deep forensics and detection engineering at the payload level.",
    },
    install: "apt install zeek",
    url: "https://zeek.org",
  },
  {
    name: "Sigma",
    category: "ids", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "تنسيق موحد ومحايد لكتابة قواعد الكشف الأمني، يتيح للمحللين كتابة القاعدة مرة واحدة وترجمتها لتعمل على مختلف منصات SIEM.",
      en: "Vendor-neutral detection rule format — auto-translated to Splunk/Elastic/Sentinel/Sumo.",
    },
    whenToUse: {
      ar: "لتطوير ومشاركة قواعد الكشف الأمني بشكل مستقل عن التقنيات المستخدمة، مما يضمن مرونة عالية للفريق الأمني.",
      en: "Write rules once and deploy across multiple SIEMs.",
    },
    url: "https://github.com/SigmaHQ/sigma",
  },

  // ───── TI / Honeypot ─────
  {
    name: "MISP",
    category: "ti", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "منصة مفتوحة لمشاركة المعلومات الاستخباراتية حول التهديدات، تتيح تخزين وتبادل مؤشرات الاختراق (IOCs) والمعلومات السياقية.",
      en: "Threat intelligence platform for sharing IOCs/TTPs across security teams and CERTs.",
    },
    whenToUse: {
      ar: "لتحسين قدرات الكشف الاستباقي من خلال دمج معلومات التهديدات العالمية مع الأنظمة الدفاعية المحلية.",
      en: "Build a knowledge base and integrate with SIEM + EDR.",
    },
    install: "Use the MISP project's official installer or container.",
    url: "https://www.misp-project.org",
  },
  {
    name: "TheHive + Cortex",
    category: "ti", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "منصة إدارة الحالات والتحقيق في الحوادث الأمنية، مصممة لتنسيق عمل فرق الاستجابة وأتمتة تحليل المؤشرات.",
      en: "SOC case-management platform — incident orchestration, team workflow, automated analysis.",
    },
    whenToUse: {
      ar: "عند تنظيم عمليات الاستجابة للحوادث داخل مركز العمليات الأمنية لضمان كفاءة التحقيق وسرعة اتخاذ القرار.",
      en: "When a SOC moves from spreadsheets to a real workflow.",
    },
    url: "https://thehive-project.org",
  },
  {
    name: "Canarytokens",
    category: "honeypot", side: "blue", oss: true, os: ["web"],
    blurb: {
      ar: "أداة بسيطة وفعالة لزرع 'أفخاخ' رقمية (ملفات، روابط، مفاتيح) ترسل تنبيهاً فورياً عند محاولة المهاجم الوصول إليها أو استخدامها.",
      en: "Generate free tokens (DNS/HTTP/AWS/Doc) — alerts instantly when used.",
    },
    whenToUse: {
      ar: "كوسيلة كشف منخفضة الضجيج وعالية الدقة للرصد المبكر للاختراقات داخل الأصول الحساسة.",
      en: "Plant bait in every sensitive asset — best ROI detection tool.",
    },
    url: "https://canarytokens.org",
  },
  {
    name: "T-Pot",
    category: "honeypot", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "منصة متكاملة للمصائد الأنية (Honeypots) تدعم بروتوكولات متعددة، توفر رؤية شاملة لهجمات الإنترنت عبر لوحات تحكم تفاعلية.",
      en: "Pre-baked multi-protocol honeypot — SSH, HTTP, SMB, ICS, full dashboard.",
    },
    whenToUse: {
      ar: "لجمع المعلومات الاستخباراتية حول التهديدات الحديثة ودراسة سلوك المهاجمين في بيئات معزولة ومراقبة.",
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
      ar: "أداة تدقيق أمني وتحصين لأنظمة Linux وUnix، تقوم بفحص شامل لإعدادات الأمان وتقدم توصيات عملية لتعزيز حماية النظام.",
      en: "Linux/Unix hardening scanner — runs 200+ checks with specific remediation advice.",
    },
    whenToUse: {
      ar: "بشكل دوري لضمان تطبيق أفضل الممارسات الأمنية على مستوى نظام التشغيل والخدمات المشغلة.",
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
      ar: "إطار عمل للامتثال الأمني يعتمد على معايير SCAP، يتيح فحص وإصلاح الأنظمة وفقاً لسياسات أمنية محددة مثل STIGs وCIS.",
      en: "SCAP/OVAL/STIG implementation — automated scan & remediation per CIS and DISA STIGs.",
    },
    whenToUse: {
      ar: "في البيئات التي تتطلب مستويات عالية من الامتثال للمعايير الحكومية أو العسكرية الصارمة.",
      en: "Government environments needing STIG-compliance evidence.",
    },
    install: "apt install libopenscap8",
    url: "https://www.open-scap.org",
  },
  {
    name: "OPA / Gatekeeper",
    category: "hardening", side: "blue", oss: true, os: ["linux"],
    blurb: {
      ar: "محرك سياسات موحد يتيح تطبيق 'السياسة ككود برمجية' (Policy as Code) لضمان الأمان في Kubernetes والسحابة والخدمات المصغرة.",
      en: "Policy as Code — enforce security rules across Kubernetes / Terraform / CI / micro-services.",
    },
    whenToUse: {
      ar: "لفرض قيود أمنية ومنع الإعدادات الخاطئة آلياً داخل بيئات الحاويات ومسارات التطوير.",
      en: "Build pipeline guardrails against misconfigurations.",
    },
    url: "https://www.openpolicyagent.org",
  },
  {
    name: "HashiCorp Vault",
    category: "hardening", side: "blue", oss: true, os: ["linux", "mac", "win"],
    blurb: {
      ar: "منصة مركزية لإدارة الأسرار والبيانات الحساسة، توفر ميزات التشفير، والوصول المؤقت، وسجلات التدقيق الشاملة.",
      en: "Centralized secrets management with dynamic secrets, leasing, and full audit logging.",
    },
    whenToUse: {
      ar: "لحماية كلمات المرور، ومفاتيح API، وشهادات التشفير ومنع تسريبها داخل الأكواد البرمجية أو البيئات المختلفة.",
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
      ar: "مكتبة Python رائدة لتطوير الاستغلالات البرمجية ومهام CTF، تسهل التعامل مع العمليات والشبكة وبناء حمولات الـ ROP.",
      en: "Python library for CTF and exploit development — binary I/O, ROP, shellcode.",
    },
    whenToUse: {
      ar: "عند كتابة استغلالات لثغرات الذاكرة (Memory Corruption) وأتمتة التفاعل مع البرامج الثنائية والخدمات المخترقة.",
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
      ar: "أدوات متخصصة للبحث عن مقاطع كود برمجية (Gadgets) داخل الملفات الثنائية لبناء سلاسل ROP وتجاوز حمايات الذاكرة.",
      en: "Find ROP gadgets in binaries / libraries.",
    },
    whenToUse: {
      ar: "أثناء تطوير استغلالات متقدمة تهدف لتجاوز تقنيات الحماية مثل DEP/NX وASLR.",
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
      ar: "أداة فحص عشوائي (Fuzzer) ذكية تعتمد على التغذية الراجعة لتغطية الكود، تستخدم لاكتشاف الثغرات البرمجية المعقدة في البرامج.",
      en: "Smart coverage-guided fuzzer — AFL has discovered thousands of CVEs.",
    },
    whenToUse: {
      ar: "لاختبار متانة التطبيقات التي تعالج مدخلات معقدة والبحث عن ثغرات غير مكتشفة (Zero-days).",
      en: "Stress-testing any parser or binary that accepts user input.",
    },
    install: "apt install afl++",
    url: "https://aflplus.plus",
  },
  {
    name: "angr",
    category: "binary", side: "both", oss: true, os: ["linux", "mac"],
    blurb: {
      ar: "إطار عمل للتحليل الثنائي يعتمد على التنفيذ الرمزي (Symbolic Execution)، يساعد في حل المسارات البرمجية المعقدة واكتشاف الثغرات.",
      en: "Symbolic execution framework — solves complex paths automatically, useful in CTF and RE.",
    },
    whenToUse: {
      ar: "عند مواجهة شروط منطقية معقدة داخل الكود الثنائي تتطلب تحليلاً رياضياً للوصول إلى مسارات محددة.",
      en: "Binary with a complex check you don't want to break manually.",
    },
    install: "pip install angr",
    url: "https://angr.io",
  },
];

export const TOOL_CATEGORIES: Record<ToolCategory, { ar: string; en: string }> = {
  recon:        { ar: "الاستطلاع والجمع الاستخباري",          en: "Reconnaissance" },
  scanning:     { ar: "المسح وتحديد السمات",               en: "Scanning" },
  web:          { ar: "أمن تطبيقات الويب",                  en: "Web" },
  exploitation: { ar: "الاستغلال البرمجي",                  en: "Exploitation" },
  ad:           { ar: "اختراق البنية التحتية وActive Directory", en: "Active Directory" },
  "post-ex":    { ar: "ما بعد الاستغلال",                  en: "Post-Exploitation" },
  c2:           { ar: "التحكم والسيطرة (C2)",              en: "Command & Control" },
  cloud:        { ar: "أمن الحوسبة السحابية",                en: "Cloud" },
  container:    { ar: "أمن الحاويات والأوركسترا (K8s)",       en: "Containers & K8s" },
  wireless:     { ar: "أمن الشبكات اللاسلكية",               en: "Wireless" },
  mobile:       { ar: "أمن تطبيقات الهاتف المحمول",            en: "Mobile" },
  forensics:    { ar: "التحقيق الجنائي الرقمي",               en: "Forensics" },
  malware:      { ar: "تحليل البرمجيات الخبيثة",              en: "Malware Analysis" },
  siem:         { ar: "إدارة السجلات والتحليل الأمني (SIEM)",   en: "SIEM" },
  edr:          { ar: "أمن النقاط النهائية (EDR)",            en: "EDR / Endpoint" },
  ids:          { ar: "أنظمة كشف ومنع التسلل (IDS/IPS)",      en: "IDS / Network" },
  hardening:    { ar: "تحصين الأنظمة والامتثال",              en: "Hardening & Compliance" },
  ti:           { ar: "المعلومات الاستخباراتية عن التهديدات (TI)", en: "Threat Intelligence" },
  honeypot:     { ar: "أنظمة الخداع والمصائد الأنية",           en: "Honeypot" },
  binary:       { ar: "هندسة الثغرات وتطوير الاستغلال",        en: "Binary / Exploit Dev" },
};
