import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Search,
  Radar,
  Bug,
  Server,
  Cloud,
  Ghost,
  Shield,
  Eye,
  Siren,
  Crosshair,
  Wrench,
  KeyRound,
  Skull,
  Flame,
  Fish,
  Smartphone,
  Lock,
  Microscope,
  Wifi,
  Webhook,
  ClipboardCheck,
  Network,
  Cpu,
  Container,
  Workflow,
  ShieldAlert,
  FileText,
  Target,
  DoorOpen,
  Building2,
  EyeOff,
  Factory,
  GitBranch,
  ScrollText,
  Boxes,
  Telescope,
  CloudCog,
  Brain,
  HardDrive,
  Cpu as CpuIcon,
  Smartphone as SmartphoneIcon,
  Cloudy,
  Database,
  CloudLightning,
  GitMerge,
  Users,
  Monitor,
  Radio,
  Headphones,
  Activity,
  Mail,
  Globe,
  Gavel,
  Scale,
  Terminal as TerminalIcon,
  Map as MapIcon,
  Code2,
  Layers,
  Atom,
  Triangle,
  Component,
} from "lucide-react";

export type Track = "intro" | "red" | "blue" | "ops";
export type Lang = "ar" | "en";

export interface LessonMeta {
  slug: string;
  number: number;
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  track: Track;
  level: { ar: string; en: string };
  duration: string;
  icon: LucideIcon;
  tags: string[];
}

const LV = {
  basic:  { ar: "أساسي",  en: "Beginner" },
  adv:    { ar: "متقدم",  en: "Advanced" },
  expert: { ar: "خبير",   en: "Expert" },
};

/* ===========================================================================
   Curriculum order = pedagogical order.
   The array is grouped into 4 tiers so `nextLesson`/`prevLesson` walk a
   sensible path: Foundations → Core → Advanced → Expert. Within each tier,
   lessons are clustered by domain (web → network → AD → cloud → endpoints
   → IoT → blue forensics) so jumping next within a tier stays on-topic.
   Slugs are unchanged so every existing URL still resolves.
   =========================================================================== */
export const LESSONS: LessonMeta[] = [
  /* ============== TIER I — FOUNDATIONS ============== */
  {
    slug: "mindset", number: 1,
    title:    { ar: "Hacker Mindset — إزاي بيفكر اللي هيخترقك", en: "Hacker Mindset & Cyber Kill Chain" },
    subtitle: { ar: "Kill Chain و MITRE ATT&CK من جوّه — مش من PDF", en: "Hacker Mindset, Cyber Kill Chain & MITRE ATT&CK" },
    track: "intro", level: LV.basic, duration: "45m", icon: BookOpen,
    tags: ["Kill Chain", "ATT&CK", "Lab Setup"],
  },
  {
    slug: "lab-setup", number: 2,
    title:    { ar: "Lab Setup — ابني الـ lab في 30 دقيقة", en: "Building a Home Cybersecurity Lab" },
    subtitle: { ar: "VirtualBox + Kali + AD معزول، من غير ما تحرق نفسك", en: "VirtualBox, Kali, Windows AD, isolated network" },
    track: "intro", level: LV.basic, duration: "45m", icon: Container,
    tags: ["VirtualBox", "Kali", "Lab", "Beginner"],
  },
  {
    slug: "linux-fundamentals", number: 3,
    title:    { ar: "Linux Fundamentals — من غير ما تخاف منه", en: "Linux Fundamentals for Security" },
    subtitle: { ar: "الملفات، الصلاحيات، الـ processes — اللي بتستخدمه فعلاً كل يوم", en: "Filesystem, permissions, processes, daily commands" },
    track: "intro", level: LV.basic, duration: "60m", icon: TerminalIcon,
    tags: ["Linux", "Bash", "Permissions", "Beginner"],
  },
  {
    slug: "windows-fundamentals", number: 4,
    title:    { ar: "Windows Fundamentals — الجوّة اللي محدش بيوريهالك", en: "Windows Fundamentals for Security" },
    subtitle: { ar: "Registry و PowerShell و Services، وأول لمسة في Active Directory", en: "Registry, PowerShell, services, intro to Active Directory" },
    track: "intro", level: LV.basic, duration: "60m", icon: Monitor,
    tags: ["Windows", "PowerShell", "Registry", "AD", "Beginner"],
  },
  {
    slug: "networking-basics", number: 5,
    title:    { ar: "Networking Basics — اللي محدش شرحه لك صح", en: "Networking Basics for Cybersecurity" },
    subtitle: { ar: "TCP/IP و OSI والـ packet لما بتمشي على السلك فعلاً", en: "TCP/IP, OSI, common protocols, packet flow" },
    track: "intro", level: LV.basic, duration: "55m", icon: Network,
    tags: ["TCP/IP", "OSI", "DNS", "HTTP", "Beginner"],
  },

  /* ============== TIER II — CORE OPERATIONS ============== */
  {
    slug: "recon", number: 6,
    title:    { ar: "Recon — قبل ما تكتب أول أمر", en: "Reconnaissance & Information Gathering" },
    subtitle: { ar: "Passive و Active و OSINT — تشوف من غير ما تتشاف", en: "Passive & Active Reconnaissance / OSINT" },
    track: "red", level: LV.adv, duration: "60m", icon: Search,
    tags: ["OSINT", "Subdomains", "DNS", "Shodan"],
  },
  {
    slug: "osint-fundamentals", number: 7,
    title:    { ar: "OSINT — تشتغل محقق فيدرالي بجد", en: "OSINT Fundamentals — Open-Source Intelligence" },
    subtitle: { ar: "تلاقي، تتأكد، تسند — وأدوات الناس اللي بتشتغل بجد", en: "Discovery, verification, attribution, and the federal investigator's toolkit" },
    track: "ops", level: LV.adv, duration: "90m", icon: Globe,
    tags: ["OSINT", "Recon", "Investigation", "Maltego", "Sock Puppets"],
  },
  {
    slug: "scanning", number: 8,
    title:    { ar: "Scanning بدون ما الـ SOC يشوفك", en: "Scanning, Fingerprinting & Enumeration" },
    subtitle: { ar: "nmap و nuclei و ffuf — وإزاي تطلع الخدمة وراها إيه", en: "Scanning, Fingerprinting & Enumeration" },
    track: "red", level: LV.adv, duration: "55m", icon: Radar,
    tags: ["nmap", "nuclei", "ffuf", "Banner Grabbing"],
  },
  {
    slug: "burp-mastery", number: 9,
    title:    { ar: "Burp Suite Mastery — زي ما المحترفين بيستخدموه", en: "Burp Suite Mastery — How Pros Actually Use It" },
    subtitle: { ar: "Proxy و Repeater و Intruder و Collaborator و BCheck — شغل فعلي", en: "Proxy, Repeater, Intruder, Collaborator, BCheck, Extensions" },
    track: "red", level: LV.adv, duration: "120m", icon: Microscope,
    tags: ["Burp", "Proxy", "Intruder", "Collaborator", "BCheck"],
  },
  {
    slug: "toolkit", number: 10,
    title:    { ar: "Pentester Toolkit — العدّة كلها (Red و Blue)", en: "Pentester Toolkit — Red & Blue" },
    subtitle: { ar: "Kali و Burp و Wazuh و ELK — اللي بتشتغل بيه فعلاً", en: "Complete Red & Blue Team Toolkit" },
    track: "ops", level: LV.adv, duration: "30m", icon: Wrench,
    tags: ["Kali", "Burp", "Wazuh", "ELK"],
  },
  {
    slug: "exploit-handbook", number: 11,
    title:    { ar: "Exploit Handbook — الأوامر اللي بتنقذك", en: "Exploit Development Quick Handbook" },
    subtitle: { ar: "مرجع سريع، تفتحه وانت في نص الشغل", en: "Markdown-driven cheatsheet" },
    track: "ops", level: LV.adv, duration: "40m", icon: FileText,
    tags: ["Cheatsheet", "Markdown", "Reference"],
  },
  {
    slug: "cve-hunting", number: 12,
    title:    { ar: "CVE Hunting — اصطاد اللي يفرق فعلاً", en: "CVE Hunting — Searching the Databases" },
    subtitle: { ar: "NVD و MITRE و KEV و EPSS — تعرف الجديد وتعرف اللي مهم", en: "NVD, MITRE, KEV, OSV, GHSA, EPSS — finding what's new and what matters" },
    track: "ops", level: LV.adv, duration: "60m", icon: Database,
    tags: ["CVE", "NVD", "KEV", "EPSS", "OSV", "GHSA"],
  },
  {
    slug: "social-engineering", number: 13,
    title:    { ar: "Social Engineering — البني آدم أرخى نقطة في المنظومة", en: "Social Engineering & Phishing" },
    subtitle: { ar: "Phishing و Vishing و Pretexting — إزاي بتتعمل عليك بسهولة", en: "Phishing, Vishing, Pretexting & The Human Layer" },
    track: "red", level: LV.adv, duration: "70m", icon: Fish,
    tags: ["Phishing", "OSINT", "Pretext", "BEC"],
  },
  {
    slug: "crypto", number: 14,
    title:    { ar: "Cryptography & PKI — من غير فلسفة", en: "Cryptography & PKI" },
    subtitle: { ar: "AES و RSA و TLS و JWT — وفين الناس بتقع", en: "Symmetric, Asymmetric, TLS, JWT pitfalls" },
    track: "blue", level: LV.adv, duration: "60m", icon: Lock,
    tags: ["AES", "RSA", "TLS", "PKI", "JWT"],
  },
  {
    slug: "wireless", number: 15,
    title:    { ar: "Wireless Security — Wi-Fi و Bluetooth و RFID", en: "Wireless Security" },
    subtitle: { ar: "اللي بيتبعت في الهوا، أي حد ممكن يلتقطه", en: "Wi-Fi, Bluetooth, RFID/NFC, Radio" },
    track: "red", level: LV.adv, duration: "65m", icon: Wifi,
    tags: ["WPA3", "Bluetooth", "RFID", "SDR"],
  },
  {
    slug: "password-cracking", number: 16,
    title:    { ar: "Password Cracking — إزاي بتقع فعلاً", en: "Password Cracking & Credential Attacks" },
    subtitle: { ar: "Hashcat و John و wordlists و rules — والـ GPU بيعمل إيه", en: "Hashcat, John the Ripper, wordlists, rules, masks, GPU rigs" },
    track: "red", level: LV.adv, duration: "75m", icon: KeyRound,
    tags: ["Hashcat", "John", "Cracking", "Credentials", "GPU"],
  },
  {
    slug: "soc-analyst-day1", number: 17,
    title:    { ar: "SOC Analyst Day-1 — تتعمل إزاي أول يوم", en: "SOC Analyst — Day-1 Playbook" },
    subtitle: { ar: "الـ shift و triage و tickets و التسليم لزميلك", en: "Shift workflow, alert triage, ticketing, escalation, handoff" },
    track: "blue", level: LV.basic, duration: "75m", icon: Headphones,
    tags: ["SOC", "Triage", "SIEM", "Tier 1", "Handoff"],
  },
  {
    slug: "hardening", number: 18,
    title:    { ar: "Hardening — قبل المهاجم بيوم", en: "System Hardening & Defense in Depth" },
    subtitle: { ar: "CIS و WAF و Zero Trust و Patching — قفل الأبواب اللي قدامه", en: "System Hardening & Defense in Depth" },
    track: "blue", level: LV.adv, duration: "70m", icon: Shield,
    tags: ["CIS", "WAF", "Zero Trust", "Patching"],
  },
  {
    slug: "compliance", number: 19,
    title:    { ar: "Threat Modeling & Compliance — الورق مش بيحمي", en: "Threat Modeling & Compliance" },
    subtitle: { ar: "STRIDE و NIST و ISO 27001 و GDPR — تستخدمها إزاي بجد", en: "STRIDE, NIST CSF, ISO 27001, GDPR, PCI" },
    track: "blue", level: LV.adv, duration: "55m", icon: ClipboardCheck,
    tags: ["STRIDE", "NIST", "ISO27001", "GDPR"],
  },
  {
    slug: "email-phishing-analysis", number: 20,
    title:    { ar: "Email Header Analysis — Phishing من جوّه", en: "Email Header & Phishing Analysis" },
    subtitle: { ar: "SPF/DKIM/DMARC، المرفقات، استخراج IOCs، وحوادث BEC", en: "SPF/DKIM/DMARC, attachment analysis, IOC extraction, BEC investigation" },
    track: "blue", level: LV.adv, duration: "70m", icon: Mail,
    tags: ["Email", "Phishing", "DMARC", "BEC", "Headers"],
  },
  {
    slug: "evidence-chain-of-custody", number: 21,
    title:    { ar: "Chain of Custody — الدليل لو ضاع، خلصت", en: "Digital Evidence & Chain of Custody" },
    subtitle: { ar: "Imaging و hashing و write-blockers — دليل يقف في المحكمة", en: "Imaging, hashing, write-blockers, documentation, courtroom-ready evidence" },
    track: "blue", level: LV.adv, duration: "65m", icon: Scale,
    tags: ["Forensics", "Custody", "Imaging", "Federal", "Court"],
  },
  {
    slug: "threat-intel-fundamentals", number: 22,
    title:    { ar: "Threat Intel — تعرف اللي قصادك", en: "Threat Intelligence Fundamentals & IOC Pivoting" },
    subtitle: { ar: "STIX/TAXII و MISP و Diamond Model و Pyramid of Pain", en: "STIX/TAXII, MISP, Diamond Model, Pyramid of Pain, IOC pivoting" },
    track: "ops", level: LV.adv, duration: "75m", icon: Globe,
    tags: ["CTI", "STIX", "MISP", "IOC", "Diamond"],
  },
  {
    slug: "cyber-law-authorities", number: 23,
    title:    { ar: "Federal Cyber Law — قبل ما تكتب أمر واحد", en: "US Federal Cyber Authorities & Law" },
    subtitle: { ar: "CFAA و ECPA و Title III و FISA — حدود اللي تقدر تعمله", en: "CFAA, ECPA, Title III, FISA, EO 12333, investigative boundaries" },
    track: "ops", level: LV.adv, duration: "60m", icon: Gavel,
    tags: ["CFAA", "ECPA", "FISA", "Title III", "Federal"],
  },
  {
    slug: "pentest-reporting", number: 24,
    title:    { ar: "Pentest Reporting — التقرير اللي بيخليك تتدفع", en: "Pentest Reporting — Federal-Grade Documentation" },
    subtitle: { ar: "Executive summary و CVSS و proof-of-exploit وخطة معالجة تتنفذ", en: "Executive summary, risk rating, CVSS, proof-of-exploit, remediation roadmap" },
    track: "ops", level: LV.adv, duration: "70m", icon: FileText,
    tags: ["Reporting", "CVSS", "Pentest", "Documentation", "Federal"],
  },

  /* ============== TIER III — ADVANCED OPERATIONS ============== */
  /* Web & Frameworks */
  {
    slug: "web-attacks", number: 25,
    title:    { ar: "Core Web Vulnerabilities — OWASP من شغل فعلي", en: "Core Web Vulnerabilities" },
    subtitle: { ar: "SQLi و XSS و SSRF و IDOR و Auth — اللي بتقع فيها كل يوم", en: "OWASP Top 10 — SQLi, XSS, SSRF, IDOR, Auth" },
    track: "red", level: LV.expert, duration: "120m", icon: Bug,
    tags: ["SQLi", "XSS", "SSRF", "IDOR", "JWT"],
  },
  {
    slug: "api-security", number: 26,
    title:    { ar: "API Security — البوابة اللي محدش بيراقبها", en: "API Security" },
    subtitle: { ar: "BOLA و OAuth و GraphQL و REST — اللي بتقع فيه فعلاً", en: "OWASP API Top 10 — BOLA, Auth, Rate Limits" },
    track: "red", level: LV.expert, duration: "70m", icon: Webhook,
    tags: ["BOLA", "OAuth", "GraphQL", "REST"],
  },
  {
    slug: "advanced-web", number: 27,
    title:    { ar: "Advanced Web — Smuggling و Desync", en: "Advanced Web — Smuggling, Desync, Prototype Pollution" },
    subtitle: { ar: "Request Smuggling و HTTP/2 Desync و Deserialization chains", en: "Request Smuggling, HTTP/2 Desync, Deserialization Chains" },
    track: "red", level: LV.expert, duration: "120m", icon: Workflow,
    tags: ["Smuggling", "Desync", "Deserialization", "PP"],
  },
  {
    slug: "nodejs-express-security", number: 28,
    title:    { ar: "Node.js & Express Security — من جوّه", en: "Node.js & Express Security — Advanced Exploitation" },
    subtitle: { ar: "Prototype pollution و SSRF و deserialization و RCE في الـ middleware", en: "Prototype pollution, SSRF, deserialization, middleware RCE" },
    track: "red", level: LV.expert, duration: "110m", icon: Code2,
    tags: ["Node.js", "Express", "Prototype Pollution", "SSRF", "RCE"],
  },
  {
    slug: "nestjs-security", number: 29,
    title:    { ar: "NestJS Security — Guards بتتكسر إزاي", en: "NestJS Security — Guards, Pipes & GraphQL" },
    subtitle: { ar: "Guards bypass و ValidationPipe و DI poisoning و GraphQL في Nest", en: "Guards bypass, ValidationPipe pitfalls, DI poisoning, GraphQL in Nest" },
    track: "red", level: LV.expert, duration: "85m", icon: Layers,
    tags: ["NestJS", "Guards", "Pipes", "GraphQL", "DI"],
  },
  {
    slug: "react-security", number: 30,
    title:    { ar: "React Security — اللي اسمه dangerously فعلاً خطر", en: "React Security — XSS, Hydration & Ref Escapes" },
    subtitle: { ar: "dangerouslySetInnerHTML و JSX injection و URL handlers و XS-Leaks", en: "dangerouslySetInnerHTML, JSX injection, URL handlers, XS-Leaks, supply chain" },
    track: "red", level: LV.expert, duration: "90m", icon: Atom,
    tags: ["React", "XSS", "Hydration", "DOM", "CSP"],
  },
  {
    slug: "nextjs-security", number: 31,
    title:    { ar: "Next.js Security — CVE-2025-29927 اللي قلب الدنيا", en: "Next.js Security — Middleware, Server Actions & RSC" },
    subtitle: { ar: "Middleware bypass و Server Actions abuse و ISR poisoning و RSC leaks", en: "CVE-2025-29927 middleware bypass, Server Actions abuse, ISR poisoning, RSC data leaks" },
    track: "red", level: LV.expert, duration: "100m", icon: Triangle,
    tags: ["Next.js", "Middleware", "Server Actions", "RSC", "CVE-2025-29927"],
  },
  {
    slug: "angular-security", number: 32,
    title:    { ar: "Angular Security — Sanitizer مش حصن", en: "Angular Security — Sanitizer & Template Injection" },
    subtitle: { ar: "Trusted Types و DomSanitizer bypasses و AOT vs JIT و SSR leaks", en: "Trusted Types, DomSanitizer bypasses, AOT vs JIT, SSR leaks" },
    track: "red", level: LV.expert, duration: "80m", icon: Component,
    tags: ["Angular", "Sanitizer", "Template", "Trusted Types", "SSR"],
  },
  /* Network */
  {
    slug: "network-attacks", number: 33,
    title:    { ar: "Network Protocol Attacks — البروتوكولات لما بتغدر بيك", en: "Advanced Network Protocol Attacks" },
    subtitle: { ar: "BGP Hijacking و DNS Rebinding و NTP و ARP — وMITM", en: "BGP Hijacking, DNS Rebinding, NTP, ARP" },
    track: "red", level: LV.expert, duration: "85m", icon: Network,
    tags: ["BGP", "DNS", "ARP", "MITM"],
  },
  {
    slug: "wifi-deep", number: 34,
    title:    { ar: "Wi-Fi Deep Dive — اللي بيتكسر واللي صامد", en: "Wi-Fi Deep Dive — Types, Cracking & What Still Holds" },
    subtitle: { ar: "WEP و WPA2 و WPA3 و Enterprise — الهجمات والحدود", en: "WEP/WPA/WPA2/WPA3/Enterprise/OWE — attacks, limits, workarounds" },
    track: "red", level: LV.expert, duration: "100m", icon: Wifi,
    tags: ["Wi-Fi", "WPA3", "PMKID", "Evil Twin", "EAP"],
  },
  /* Active Directory */
  {
    slug: "advanced-ad", number: 35,
    title:    { ar: "Active Directory Attacks — من جوّه بقى", en: "Advanced Active Directory Attacks" },
    subtitle: { ar: "ADCS و Delegation و NTLM Relay و Shadow Credentials", en: "Advanced AD — ADCS, Delegation, NTLM Relay" },
    track: "red", level: LV.expert, duration: "100m", icon: KeyRound,
    tags: ["ADCS", "Delegation", "NTLM Relay", "Shadow Creds"],
  },
  {
    slug: "adcs-attacks", number: 36,
    title:    { ar: "AD CS Attacks — من ESC1 لـ ESC15", en: "AD CS Attacks — ESC1 to ESC15" },
    subtitle: { ar: "الشهادات اللي بتفتح الـ Domain على الآخر", en: "Certificate Services exploitation paths" },
    track: "red", level: LV.expert, duration: "85m", icon: KeyRound,
    tags: ["AD CS", "ESC1", "Certipy", "Forest"],
  },
  {
    slug: "bloodhound-mastery", number: 37,
    title:    { ar: "BloodHound Mastery — لو معرفتش تستخدمه يبقى مش شغّال", en: "BloodHound Mastery — AD Enumeration & Path Finding" },
    subtitle: { ar: "SharpHound و AzureHound و Cypher — مسارات للـ Domain Admin", en: "SharpHound / AzureHound, Cypher queries, attack paths" },
    track: "red", level: LV.expert, duration: "100m", icon: Network,
    tags: ["BloodHound", "AD", "Cypher", "SharpHound", "Azure"],
  },
  {
    slug: "mfa-saml-oauth-attacks", number: 38,
    title:    { ar: "MFA / SAML / OAuth Attacks — لما الحماية بتلف عليك", en: "MFA, SAML & OAuth Attacks" },
    subtitle: { ar: "MFA fatigue و Evilginx و token theft و Golden SAML", en: "MFA fatigue, Evilginx, token theft, Golden SAML, consent phishing" },
    track: "red", level: LV.expert, duration: "85m", icon: Lock,
    tags: ["MFA", "SAML", "OAuth", "Evilginx", "Token Theft"],
  },
  /* Cloud */
  {
    slug: "cloud", number: 39,
    title:    { ar: "Cloud Attacks — AWS / Azure / GCP بتقع إزاي", en: "Cloud Attacks (AWS / Azure / GCP)" },
    subtitle: { ar: "الجبهة السحابية — IAM و S3 و IMDS و Containers", en: "Cloud Attack Surface — IAM, S3, IMDS, Containers" },
    track: "red", level: LV.expert, duration: "100m", icon: Cloud,
    tags: ["AWS", "IAM", "S3", "IMDSv1", "Kubernetes"],
  },
  {
    slug: "aws-attack-chains", number: 40,
    title:    { ar: "AWS Attack Chains — سلاسل بتحصل فعلاً", en: "Practical AWS Attack Chains" },
    subtitle: { ar: "IAM enum و Pacu و S3 و IMDS و Lambda و SSM", en: "IAM enum, Pacu, S3, IMDS, Lambda, SSM" },
    track: "red", level: LV.expert, duration: "100m", icon: Cloudy,
    tags: ["AWS", "IAM", "Pacu", "Lambda", "SSM"],
  },
  {
    slug: "azure-attacks", number: 41,
    title:    { ar: "Azure Attacks — الـ Managed Identity مش لُعبة", en: "Azure Attacks — Subscriptions & Managed Identities" },
    subtitle: { ar: "RBAC abuse و MI theft و Storage و Key Vault و Runbooks", en: "Azure RBAC abuse, Managed Identity theft, Storage, Key Vault, Runbooks" },
    track: "red", level: LV.expert, duration: "95m", icon: CloudLightning,
    tags: ["Azure", "RBAC", "MI", "Key Vault", "Runbook"],
  },
  {
    slug: "m365-entra-attacks", number: 42,
    title:    { ar: "M365 & Entra Attacks — Token واحد بيقلب الدنيا", en: "Microsoft 365 & Entra ID Attacks" },
    subtitle: { ar: "Token theft و Conditional Access bypass و OAuth abuse", en: "Token theft, Conditional Access bypass, OAuth abuse" },
    track: "red", level: LV.expert, duration: "85m", icon: ScrollText,
    tags: ["M365", "Entra", "OAuth", "Tokens"],
  },
  /* Endpoints, privesc, lateral, full chains */
  {
    slug: "server-attacks", number: 43,
    title:    { ar: "Server Exploitation — السيرفر وقع والـ root في إيدك", en: "Server Exploitation & Privilege Escalation" },
    subtitle: { ar: "RCE و SSH و LinPEAS و GTFOBins — اللي بيشتغل بجد", en: "Server Exploitation & Privilege Escalation" },
    track: "red", level: LV.expert, duration: "90m", icon: Server,
    tags: ["RCE", "SSH", "LinPEAS", "GTFOBins"],
  },
  {
    slug: "linux-privesc", number: 44,
    title:    { ar: "Linux Privilege Escalation — من user لـ root", en: "Linux Privilege Escalation" },
    subtitle: { ar: "SUID و sudo abuses و capabilities و PATH hijack و LinPEAS", en: "SUID, sudo abuses, capabilities, PATH hijack, kernel checks, LinPEAS" },
    track: "red", level: LV.adv, duration: "85m", icon: TerminalIcon,
    tags: ["Linux", "PrivEsc", "SUID", "Sudo", "LinPEAS"],
  },
  {
    slug: "windows-privesc", number: 45,
    title:    { ar: "Windows Privilege Escalation — وصول SYSTEM", en: "Windows Privilege Escalation" },
    subtitle: { ar: "Token impersonation و service abuse و UAC bypass و DLL hijack", en: "Token impersonation, service abuse, UAC bypass, DLL hijack, WinPEAS" },
    track: "red", level: LV.adv, duration: "90m", icon: Monitor,
    tags: ["Windows", "PrivEsc", "Tokens", "UAC", "DLL Hijack", "WinPEAS"],
  },
  {
    slug: "post-exploitation", number: 46,
    title:    { ar: "Post-Exploitation — الشغل الحقيقي بعد ما تدخل", en: "Post-Exploitation, Persistence & Pivoting" },
    subtitle: { ar: "Persistence و Pivoting و C2 و Exfiltration", en: "Post-Exploitation, Persistence & Lateral Movement" },
    track: "red", level: LV.expert, duration: "75m", icon: Ghost,
    tags: ["Persistence", "Pivoting", "C2", "Exfiltration"],
  },
  {
    slug: "lateral-movement", number: 47,
    title:    { ar: "Lateral Movement — تتنقّل من غير ضوضا", en: "Lateral Movement — Pivoting the Network" },
    subtitle: { ar: "PtH و PsExec و WMI و WinRM و SOCKS و Chisel و Ligolo-ng", en: "PtH, PtT, PsExec, WMI, WinRM, SOCKS proxies, Chisel, Ligolo-ng" },
    track: "red", level: LV.expert, duration: "95m", icon: Workflow,
    tags: ["Lateral Movement", "PsExec", "WMI", "PtH", "Pivoting"],
  },
  {
    slug: "evasion", number: 48,
    title:    { ar: "Defense Evasion — EDR Bypass اللي محدش بيقولك", en: "Defense Evasion & Payload Obfuscation" },
    subtitle: { ar: "AMSI و ETW و Syscalls و Packers — تعدي من غير ما تحس بيك", en: "AV/EDR Evasion, AMSI/ETW Bypass, Obfuscation" },
    track: "red", level: LV.expert, duration: "90m", icon: Flame,
    tags: ["AMSI", "ETW", "Syscalls", "Packers"],
  },
  {
    slug: "initial-access", number: 49,
    title:    { ar: "Initial Access — أول قدم جوّه الشبكة", en: "Initial Access — First Foothold" },
    subtitle: { ar: "Spear-phishing و خدمات مكشوفة و هجمات الهوية", en: "Spear-phishing, exposed services, identity attacks" },
    track: "red", level: LV.expert, duration: "90m", icon: DoorOpen,
    tags: ["Phishing", "Exposed", "Spraying", "ITW"],
  },
  {
    slug: "opsec-offensive", number: 50,
    title:    { ar: "Offensive OPSEC — تخش وتطلع من غير أثر", en: "Offensive OPSEC — Avoiding Attribution" },
    subtitle: { ar: "بنية تحتية نضيفة، false flags، وأنتي-فورنزكس", en: "Infrastructure hygiene, false flags, anti-forensics" },
    track: "red", level: LV.expert, duration: "60m", icon: EyeOff,
    tags: ["OPSEC", "Anti-forensics", "Anonymity"],
  },
  {
    slug: "target-selection", number: 51,
    title:    { ar: "Target Selection — تختار الهدف منين أصلاً", en: "Target Selection — Adversary Mindset" },
    subtitle: { ar: "Threat modeling من قعدة المهاجم نفسه", en: "Threat modeling from the attacker's seat" },
    track: "red", level: LV.expert, duration: "55m", icon: Target,
    tags: ["Targeting", "OSINT", "Prioritization"],
  },
  {
    slug: "full-attack-scenario", number: 52,
    title:    { ar: "Full Attack Scenario — من الـ Recon لحد الـ Backdoor", en: "Full Attack Scenario — From Recon to Backdoor and the Blue-Team Counter" },
    subtitle: { ar: "Red كاملة على target.gov، وبعدها Blue ترد عليها", en: "Red kill chain against target.gov then Blue detection, response & active defense" },
    track: "red", level: LV.adv, duration: "150m", icon: Workflow,
    tags: ["Kill Chain", "End-to-End", "Backdoor", "Blue Team", "Active Defense"],
  },
  /* IoT & physical */
  {
    slug: "mobile-iot", number: 53,
    title:    { ar: "Mobile / IoT / OT Security — جبهات منسية", en: "Mobile, IoT & OT Security" },
    subtitle: { ar: "Android و iOS و Firmware و ICS/SCADA", en: "Android/iOS, Firmware, ICS/SCADA" },
    track: "red", level: LV.expert, duration: "85m", icon: Smartphone,
    tags: ["Android", "iOS", "Firmware", "ICS"],
  },
  {
    slug: "usb-network-implants", number: 54,
    title:    { ar: "USB Attacks — السلاح اللي بيتحط في الجيب", en: "USB-Borne Malware & Lateral Network Compromise" },
    subtitle: { ar: "BadUSB و air-gap jumps و MITM — Stuxnet علّمنا الدرس", en: "BadUSB, air-gap jumps, MITM, and accessing devices once on the network" },
    track: "red", level: LV.expert, duration: "100m", icon: HardDrive,
    tags: ["BadUSB", "Stuxnet", "Air-Gap", "MITM", "Lateral"],
  },
  {
    slug: "usb-attack-lab", number: 55,
    title:    { ar: "USB Attack Lab — اعمل BadUSB بإيدك", en: "Building USB Attacks in the Lab — Hands-On Examples" },
    subtitle: { ar: "DuckyScript و Pi Pico — والدفاع اللي بيقفل عليه", en: "Writing DuckyScript, Pi Pico as BadUSB, and matching defenses" },
    track: "red", level: LV.expert, duration: "90m", icon: Cpu,
    tags: ["DuckyScript", "Pi Pico", "CircuitPython", "USBGuard", "GPO"],
  },
  /* Advanced Blue Team */
  {
    slug: "detection", number: 56,
    title:    { ar: "Detection & Monitoring — تشوف ولا بتتفرّج", en: "Detection & Monitoring (SIEM / EDR)" },
    subtitle: { ar: "Detection Engineering و Sigma و Suricata و Honeypots", en: "Detection Engineering, Logs, SIEM & Honeypots" },
    track: "blue", level: LV.expert, duration: "85m", icon: Eye,
    tags: ["SIEM", "Sigma", "Suricata", "Honeypots"],
  },
  {
    slug: "siem-detection-engineering", number: 57,
    title:    { ar: "Detection Engineering — تكتب Detection بتشتغل فعلاً", en: "SIEM & Detection Engineering — Sigma, KQL, Splunk SPL" },
    subtitle: { ar: "Sigma و KQL و Splunk — تقلّل false positives وتغطّي ATT&CK", en: "Writing detections, reducing false positives, ATT&CK coverage" },
    track: "blue", level: LV.expert, duration: "110m", icon: Telescope,
    tags: ["SIEM", "Sigma", "KQL", "Splunk", "Detection"],
  },
  {
    slug: "threat-hunting", number: 58,
    title:    { ar: "Threat Hunting — مش مستني التنبيه", en: "Threat Hunting — Practical Queries" },
    subtitle: { ar: "KQL و SPL و Sigma — تطلع تدوّر بفرضية", en: "KQL, SPL, Sigma rules with hypotheses" },
    track: "blue", level: LV.expert, duration: "90m", icon: Telescope,
    tags: ["KQL", "Splunk", "Sigma", "Hunting"],
  },
  {
    slug: "incident-response", number: 59,
    title:    { ar: "Incident Response — الحادثة وقعت، بتعمل إيه", en: "Incident Response" },
    subtitle: { ar: "Playbook و Forensics — قرارات تحت الضغط", en: "Incident Response Playbook & Forensics" },
    track: "blue", level: LV.expert, duration: "80m", icon: Siren,
    tags: ["IR", "Forensics", "Memory", "Volatility"],
  },
  {
    slug: "dfir-triage", number: 60,
    title:    { ar: "DFIR Triage — أول ساعة بتقرر كل حاجة", en: "DFIR — First-Hour Triage" },
    subtitle: { ar: "KAPE و Velociraptor و Volatility و Timeline analysis", en: "KAPE, Velociraptor, Volatility, timeline analysis" },
    track: "blue", level: LV.expert, duration: "90m", icon: HardDrive,
    tags: ["DFIR", "KAPE", "Velociraptor", "Volatility"],
  },
  {
    slug: "malware-analysis", number: 61,
    title:    { ar: "Malware Analysis & RE — تفك الـ binary", en: "Malware Analysis & Reverse Engineering" },
    subtitle: { ar: "Static و Dynamic و Sandboxing و Reverse Engineering", en: "Static & Dynamic Analysis, Sandboxing, RE" },
    track: "blue", level: LV.expert, duration: "90m", icon: Microscope,
    tags: ["IDA", "Ghidra", "Sandbox", "YARA"],
  },
  {
    slug: "windows-forensics", number: 62,
    title:    { ar: "Windows Forensics — الآثار اللي بتفضح المهاجم", en: "Windows Forensics — Sysmon, Event Logs, Registry" },
    subtitle: { ar: "Sysmon و 4624/4688/7045 و MFT و ShimCache و Prefetch", en: "Sysmon configs, 4624/4688/7045, MFT, ShimCache, Amcache, Prefetch" },
    track: "blue", level: LV.expert, duration: "90m", icon: Monitor,
    tags: ["Windows", "Sysmon", "MFT", "Registry", "Prefetch"],
  },
  {
    slug: "network-forensics", number: 63,
    title:    { ar: "Network Forensics — PCAP بيحكي اللي حصل", en: "Network Forensics — PCAP & Flow Analysis" },
    subtitle: { ar: "Wireshark و Zeek و Suricata و NetFlow — تركّب الجلسة تاني", en: "Wireshark, Zeek, Suricata, NetFlow, session reconstruction" },
    track: "blue", level: LV.expert, duration: "90m", icon: Activity,
    tags: ["PCAP", "Wireshark", "Zeek", "Suricata", "NetFlow"],
  },
  {
    slug: "memory-forensics", number: 64,
    title:    { ar: "Memory Forensics — Volatility بيفضح كل حاجة", en: "Memory Forensics with Volatility" },
    subtitle: { ar: "Memory capture و Vol3 plugins و rootkit hunting و injection", en: "Memory capture, Vol3 plugins, rootkit hunting, injection analysis" },
    track: "blue", level: LV.expert, duration: "100m", icon: HardDrive,
    tags: ["Forensics", "Volatility", "Memory", "Rootkit", "DFIR"],
  },

  /* ============== TIER IV — EXPERT / TRADECRAFT ============== */
  /* Vuln research & exploit dev */
  {
    slug: "web-redteam-deep", number: 65,
    title:    { ar: "Web Red Team Deep — لما الفريق الأحمر بيشتغل بجد", en: "Web from a Red Team Lens — Deep Exploitation" },
    subtitle: { ar: "سلاسل استغلال متقدمة و blind techniques و WAF bypass", en: "Advanced web exploitation chains, blind techniques, WAF bypass" },
    track: "red", level: LV.expert, duration: "180m", icon: Bug,
    tags: ["SSRF", "Smuggling", "Deserialization", "OAuth", "WAF Bypass", "Race"],
  },
  {
    slug: "web-vuln-research", number: 66,
    title:    { ar: "Web Vulnerability Research — تصطاد 0-day بإيدك", en: "Web Vulnerability Research & Long-Haul Tradecraft" },
    subtitle: { ar: "Variant analysis و Patch diffing و Fuzzing — وعمليات بتمتد شهور", en: "Discovering 0-days, variant analysis, low-and-slow operations" },
    track: "red", level: LV.expert, duration: "120m", icon: Telescope,
    tags: ["0-day", "Variant Analysis", "Patch Diffing", "Fuzzing", "Long-Haul"],
  },
  {
    slug: "binary-exploitation", number: 67,
    title:    { ar: "Binary Exploitation — الذاكرة من جوّه", en: "Binary Exploitation & Memory Corruption" },
    subtitle: { ar: "Stack و Heap overflows و ROP — وتعدية ASLR/DEP", en: "Stack/Heap Overflows, ROP, ASLR/DEP Bypass" },
    track: "red", level: LV.expert, duration: "150m", icon: Cpu,
    tags: ["BoF", "ROP", "Heap", "ASLR"],
  },
  {
    slug: "linux-kernel-lpe", number: 68,
    title:    { ar: "Linux Kernel LPE — الـ root من تحت", en: "Linux Kernel Privilege Escalation" },
    subtitle: { ar: "DirtyPipe و nftables و OverlayFS — CVEs بتشتغل فعلاً", en: "Recent kernel CVEs with exec — DirtyPipe, nftables, OverlayFS" },
    track: "red", level: LV.expert, duration: "80m", icon: CpuIcon,
    tags: ["Kernel", "LPE", "DirtyPipe", "eBPF"],
  },
  {
    slug: "zero-days", number: 69,
    title:    { ar: "Recent Zero-Days (2023–2026) — اللي اشتغلت In-The-Wild", en: "Recent Zero-Days (2023–2026)" },
    subtitle: { ar: "اشتغلت إزاي فعلاً — وPoCs تجربها بنفسك", en: "ITW Zero-Days — How They Worked & Practical PoCs" },
    track: "ops", level: LV.expert, duration: "140m", icon: Flame,
    tags: ["0-day", "ITW", "KEV", "PoC", "2026"],
  },
  /* Modern infra */
  {
    slug: "kubernetes-attacks", number: 70,
    title:    { ar: "Kubernetes Attacks — RBAC مش حماية", en: "Kubernetes Attack Chains" },
    subtitle: { ar: "RBAC abuse و pod escapes و etcd و supply chain", en: "RBAC abuse, pod escapes, etcd, supply chain" },
    track: "red", level: LV.expert, duration: "75m", icon: Boxes,
    tags: ["k8s", "RBAC", "Pod Escape", "etcd"],
  },
  {
    slug: "container-escapes", number: 71,
    title:    { ar: "Container Escapes — تطلع من الـ Container للـ Host", en: "Container & Hypervisor Escapes" },
    subtitle: { ar: "Docker breakouts و K8s escapes و VM escapes", en: "Docker Breakouts, Kubernetes Escapes, VM Escapes" },
    track: "red", level: LV.expert, duration: "90m", icon: Container,
    tags: ["Docker", "K8s", "runc", "Hypervisor"],
  },
  {
    slug: "cicd-attacks", number: 72,
    title:    { ar: "CI/CD Attacks — الـ Pipeline اللي بيخش لـ prod", en: "CI/CD Pipeline Attacks" },
    subtitle: { ar: "GitHub Actions و GitLab CI و Jenkins — secrets و runners و artifacts", en: "GitHub Actions, GitLab CI, Jenkins — secrets, runners, artifacts" },
    track: "red", level: LV.expert, duration: "85m", icon: GitMerge,
    tags: ["CI/CD", "GitHub Actions", "Jenkins", "OIDC", "SLSA"],
  },
  {
    slug: "redteam-infra", number: 73,
    title:    { ar: "Red Team Infrastructure — C2 يصمد قدام Blue", en: "Red Team Infrastructure & C2" },
    subtitle: { ar: "C2 و Redirectors و Payload hosting و DNS", en: "C2 servers, redirectors, payload hosting, DNS" },
    track: "red", level: LV.expert, duration: "80m", icon: CloudCog,
    tags: ["C2", "Redirector", "Cobalt", "Sliver"],
  },
  {
    slug: "supply-chain-deep", number: 74,
    title:    { ar: "Supply Chain Attacks — SolarWinds و XZ من جوّه", en: "Advanced Supply Chain Attacks" },
    subtitle: { ar: "npm و PyPI و build systems — هجمات بتدخل من بعيد", en: "SolarWinds, XZ, npm/PyPI, build systems" },
    track: "red", level: LV.expert, duration: "65m", icon: GitBranch,
    tags: ["Supply Chain", "SolarWinds", "XZ", "Dependencies"],
  },
  /* Advanced adversary */
  {
    slug: "dns-covert-channels", number: 75,
    title:    { ar: "DNS Tunneling & Covert Channels — البيانات بتتسرّب وانت مش حاسس", en: "Covert Channels & DNS Tunneling" },
    subtitle: { ar: "DNS exfil و ICMP/HTTPS tunneling و DGAs و fast flux", en: "DNS exfil, ICMP/HTTPS tunneling, DGAs, fast flux, detection" },
    track: "red", level: LV.expert, duration: "70m", icon: Radio,
    tags: ["DNS", "Tunneling", "Exfil", "DGA", "Iodine"],
  },
  {
    slug: "ai-llm-security", number: 76,
    title:    { ar: "AI / LLM Security — الـ Prompt هو الباب", en: "AI / LLM Security" },
    subtitle: { ar: "Prompt injection و RAG poisoning و agentic abuse", en: "Prompt injection, RAG poisoning, agentic abuse" },
    track: "red", level: LV.expert, duration: "75m", icon: Brain,
    tags: ["LLM", "Prompt Injection", "RAG", "Agents"],
  },
  {
    slug: "ransomware-supply-chain", number: 77,
    title:    { ar: "Ransomware — تشريح الهجوم بدل ما تخاف منه", en: "Ransomware Anatomy & Defense" },
    subtitle: { ar: "إزاي بتدخل، إزاي بتنتشر، إزاي بتقفلها — منظور دفاعي", en: "Ransomware Anatomy & Supply Chain — defensive awareness" },
    track: "red", level: LV.expert, duration: "80m", icon: Skull,
    tags: ["Ransomware", "Supply Chain", "Wipers", "MSP"],
  },
  {
    slug: "university-attack-chain", number: 78,
    title:    { ar: "University Attack Chain — هجوم A-to-Z على جامعة و IoT", en: "Full A-to-Z Attack Chain — University & IoT Devices" },
    subtitle: { ar: "من Recon لسيطرة كاملة، عبر كاميرات وطابعات وقارئات بطاقات", en: "Recon to total takeover, pivoting through cameras, printers, badge readers" },
    track: "red", level: LV.expert, duration: "150m", icon: Building2,
    tags: ["Kill Chain", "University", "IoT", "Cameras", "Printers", "Pivot"],
  },
  /* ICS / Critical infra */
  {
    slug: "ics-scada-protocols", number: 79,
    title:    { ar: "ICS/SCADA — Modbus و DNP3 و IEC-104", en: "ICS / SCADA Protocols — Modbus, DNP3, IEC-104" },
    subtitle: { ar: "بروتوكولات الصناعة من جوّه — فحص واستغلال آمن في الـ Lab", en: "Industrial control protocol internals, safe scanning, lab exploitation" },
    track: "ops", level: LV.expert, duration: "95m", icon: Factory,
    tags: ["ICS", "SCADA", "Modbus", "DNP3", "OT"],
  },
  {
    slug: "critical-infrastructure", number: 80,
    title:    { ar: "Critical Infrastructure — اللي لو وقع، الدنيا تقع", en: "Critical Infrastructure — Government Priorities" },
    subtitle: { ar: "ICS/SCADA، طاقة، ميه، اتصالات، مالية", en: "ICS/SCADA, energy, water, telecom, finance" },
    track: "ops", level: LV.expert, duration: "70m", icon: Factory,
    tags: ["ICS", "SCADA", "Energy", "OT"],
  },
  /* Nation-state & intelligence */
  {
    slug: "state-actor-tradecraft", number: 81,
    title:    { ar: "Nation-State Tradecraft — لما الدول هي اللي بتهاجم", en: "Nation-State Tradecraft" },
    subtitle: { ar: "TTPs و infrastructure و OPSEC على مستوى الدول", en: "APT TTPs, infrastructure, OPSEC" },
    track: "ops", level: LV.expert, duration: "75m", icon: Building2,
    tags: ["APT", "TTPs", "OPSEC", "Tradecraft"],
  },
  {
    slug: "attribution", number: 82,
    title:    { ar: "Attribution & Counter-Intel — تعرف اللي ضربك مين", en: "Attacker Attribution & Counter-Intel" },
    subtitle: { ar: "TTPs و IOCs و Honeytokens — وCounter-OSINT", en: "Attacker Attribution, Threat Intel & Counter-OSINT" },
    track: "ops", level: LV.expert, duration: "90m", icon: Crosshair,
    tags: ["TTPs", "IOC", "Honeytokens", "Attribution"],
  },
  {
    slug: "mobile-spyware", number: 83,
    title:    { ar: "Mobile Spyware — Pegasus و Predator على مستوى الدول", en: "Mobile Spyware — State-Grade Implants" },
    subtitle: { ar: "السلاسل اللي بتشتغل بيها، وإزاي تكشفها", en: "Pegasus, Predator, Reign — chains and detection" },
    track: "ops", level: LV.expert, duration: "70m", icon: SmartphoneIcon,
    tags: ["Pegasus", "Predator", "iOS", "Android"],
  },
  /* Knowledge bases & programs */
  {
    slug: "cve-catalog", number: 84,
    title:    { ar: "Top 100 CVEs Catalog — أخطر 100 ثغرة حديثة", en: "Top 100 Recent CVEs Catalog" },
    subtitle: { ar: "بتشتغل إزاي، وبتستغلها إزاي — مش مجرد أرقام", en: "Explicit CVEs — How They Work & How to Exploit" },
    track: "ops", level: LV.expert, duration: "180m", icon: ShieldAlert,
    tags: ["CVE", "Exploits", "PoC", "KEV"],
  },
  {
    slug: "purple-team", number: 85,
    title:    { ar: "Purple Team — تقيس الحماية بجد", en: "Purple Team — Adversary Emulation & Measurement" },
    subtitle: { ar: "Atomic Red Team و CALDERA و ATT&CK Navigator — تغطية حقيقية", en: "Atomic Red Team, CALDERA, ATT&CK Navigator, detection coverage" },
    track: "ops", level: LV.expert, duration: "80m", icon: Users,
    tags: ["Purple", "Atomic", "CALDERA", "ATT&CK", "Coverage"],
  },
];

export const TRACKS: Record<Track, { label: { ar: string; en: string }; chip: string }> = {
  intro: { label: { ar: "الأساسيات",          en: "Intro" },                  chip: "chip" },
  red:   { label: { ar: "الفرق الحمراء — الهجوم", en: "Red Team — Offense" },     chip: "chip chip-red" },
  blue:  { label: { ar: "الفرق الزرقاء — الدفاع", en: "Blue Team — Defense" },    chip: "chip chip-blue" },
  ops:   { label: { ar: "العمليات والتقصي",    en: "Operations & Hunting" },   chip: "chip chip-amber" },
};

export function lessonBySlug(slug: string) {
  return LESSONS.find((l) => l.slug === slug);
}
export function nextLesson(slug: string) {
  const i = LESSONS.findIndex((l) => l.slug === slug);
  return i >= 0 && i < LESSONS.length - 1 ? LESSONS[i + 1] : null;
}
export function prevLesson(slug: string) {
  const i = LESSONS.findIndex((l) => l.slug === slug);
  return i > 0 ? LESSONS[i - 1] : null;
}
