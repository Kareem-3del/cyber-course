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
    title:    { ar: "عقلية المهاجم وسلسلة الهجوم السيبراني", en: "Hacker Mindset & Cyber Kill Chain" },
    subtitle: { ar: "عقلية المخترق، سلسلة الهجوم، وإطار MITRE ATT&CK", en: "Hacker Mindset, Cyber Kill Chain & MITRE ATT&CK" },
    track: "intro", level: LV.basic, duration: "45m", icon: BookOpen,
    tags: ["Kill Chain", "ATT&CK", "Lab Setup"],
  },
  {
    slug: "lab-setup", number: 2,
    title:    { ar: "بناء مختبر منزلي للأمن السيبراني", en: "Building a Home Cybersecurity Lab" },
    subtitle: { ar: "VirtualBox، Kali، Windows AD، شبكة معزولة", en: "VirtualBox, Kali, Windows AD, isolated network" },
    track: "intro", level: LV.basic, duration: "45m", icon: Container,
    tags: ["VirtualBox", "Kali", "Lab", "Beginner"],
  },
  {
    slug: "linux-fundamentals", number: 3,
    title:    { ar: "أساسيات Linux لمختصي الأمن", en: "Linux Fundamentals for Security" },
    subtitle: { ar: "نظام الملفات، الصلاحيات، العمليات، أوامر يومية", en: "Filesystem, permissions, processes, daily commands" },
    track: "intro", level: LV.basic, duration: "60m", icon: TerminalIcon,
    tags: ["Linux", "Bash", "Permissions", "Beginner"],
  },
  {
    slug: "windows-fundamentals", number: 4,
    title:    { ar: "أساسيات Windows لمختصي الأمن", en: "Windows Fundamentals for Security" },
    subtitle: { ar: "Registry، PowerShell، الخدمات، Active Directory المبدئي", en: "Registry, PowerShell, services, intro to Active Directory" },
    track: "intro", level: LV.basic, duration: "60m", icon: Monitor,
    tags: ["Windows", "PowerShell", "Registry", "AD", "Beginner"],
  },
  {
    slug: "networking-basics", number: 5,
    title:    { ar: "أساسيات الشبكات للأمن السيبراني", en: "Networking Basics for Cybersecurity" },
    subtitle: { ar: "TCP/IP، OSI، البروتوكولات، تدفق الحزم", en: "TCP/IP, OSI, common protocols, packet flow" },
    track: "intro", level: LV.basic, duration: "55m", icon: Network,
    tags: ["TCP/IP", "OSI", "DNS", "HTTP", "Beginner"],
  },

  /* ============== TIER II — CORE OPERATIONS ============== */
  {
    slug: "recon", number: 6,
    title:    { ar: "الاستطلاع وجمع المعلومات الاستخباراتية", en: "Reconnaissance & Information Gathering" },
    subtitle: { ar: "الاستطلاع النشط والسلبي / OSINT", en: "Passive & Active Reconnaissance / OSINT" },
    track: "red", level: LV.adv, duration: "60m", icon: Search,
    tags: ["OSINT", "Subdomains", "DNS", "Shodan"],
  },
  {
    slug: "osint-fundamentals", number: 7,
    title:    { ar: "الاستخبارات من المصادر المفتوحة (OSINT)", en: "OSINT Fundamentals — Open-Source Intelligence" },
    subtitle: { ar: "البحث، التحقق، الإسناد، وأدوات المحقق الفيدرالي", en: "Discovery, verification, attribution, and the federal investigator's toolkit" },
    track: "ops", level: LV.adv, duration: "90m", icon: Globe,
    tags: ["OSINT", "Recon", "Investigation", "Maltego", "Sock Puppets"],
  },
  {
    slug: "scanning", number: 8,
    title:    { ar: "المسح وتحديد السمات والتعداد", en: "Scanning, Fingerprinting & Enumeration" },
    subtitle: { ar: "عمليات الفحص وتحديد هوية الخدمات", en: "Scanning, Fingerprinting & Enumeration" },
    track: "red", level: LV.adv, duration: "55m", icon: Radar,
    tags: ["nmap", "nuclei", "ffuf", "Banner Grabbing"],
  },
  {
    slug: "burp-mastery", number: 9,
    title:    { ar: "إتقان Burp Suite — ممارسات المحترفين", en: "Burp Suite Mastery — How Pros Actually Use It" },
    subtitle: { ar: "Proxy, Repeater, Intruder, Collaborator, BCheck", en: "Proxy, Repeater, Intruder, Collaborator, BCheck, Extensions" },
    track: "red", level: LV.adv, duration: "120m", icon: Microscope,
    tags: ["Burp", "Proxy", "Intruder", "Collaborator", "BCheck"],
  },
  {
    slug: "toolkit", number: 10,
    title:    { ar: "صندوق الأدوات الشامل", en: "Complete Toolkit" },
    subtitle: { ar: "أهم الأدوات المستخدمة في الفرق الحمراء والزرقاء", en: "Complete Red & Blue Team Toolkit" },
    track: "ops", level: LV.adv, duration: "30m", icon: Wrench,
    tags: ["Kali", "Burp", "Wazuh", "ELK"],
  },
  {
    slug: "exploit-handbook", number: 11,
    title:    { ar: "دليل الاستغلال السريع", en: "Quick Exploit Handbook" },
    subtitle: { ar: "مرجع سريع لأهم أكواد وأوامر الاستغلال", en: "Markdown-driven cheatsheet" },
    track: "ops", level: LV.adv, duration: "40m", icon: FileText,
    tags: ["Cheatsheet", "Markdown", "Reference"],
  },
  {
    slug: "cve-hunting", number: 12,
    title:    { ar: "التقصي في قواعد بيانات الثغرات (CVE)", en: "Hunting & Searching CVE Databases" },
    subtitle: { ar: "منهجية البحث في NVD و MITRE و KEV لتحديد الثغرات الهامة", en: "NVD, MITRE, KEV, OSV, GHSA, EPSS — finding what's new and what matters" },
    track: "ops", level: LV.adv, duration: "60m", icon: Database,
    tags: ["CVE", "NVD", "KEV", "EPSS", "OSV", "GHSA"],
  },
  {
    slug: "social-engineering", number: 13,
    title:    { ar: "الهندسة الاجتماعية وتقنيات التصيّد", en: "Social Engineering & Phishing" },
    subtitle: { ar: "التصيد الاحتيالي، انتحال الشخصية، والتلاعب البشري", en: "Phishing, Vishing, Pretexting & The Human Layer" },
    track: "red", level: LV.adv, duration: "70m", icon: Fish,
    tags: ["Phishing", "OSINT", "Pretext", "BEC"],
  },
  {
    slug: "crypto", number: 14,
    title:    { ar: "علم التشفير والبنية التحتية للمفاتيح العامة (PKI)", en: "Cryptography & PKI" },
    subtitle: { ar: "التشفير المتماثل وغير المتماثل، ثغرات TLS و JWT", en: "Symmetric, Asymmetric, TLS, JWT pitfalls" },
    track: "blue", level: LV.adv, duration: "60m", icon: Lock,
    tags: ["AES", "RSA", "TLS", "PKI", "JWT"],
  },
  {
    slug: "wireless", number: 15,
    title:    { ar: "أمن الشبكات اللاسلكية", en: "Wireless Security" },
    subtitle: { ar: "أمن الواي فاي، البلوتوث، وتقنيات RFID/NFC", en: "Wi-Fi, Bluetooth, RFID/NFC, Radio" },
    track: "red", level: LV.adv, duration: "65m", icon: Wifi,
    tags: ["WPA3", "Bluetooth", "RFID", "SDR"],
  },
  {
    slug: "password-cracking", number: 16,
    title:    { ar: "كسر كلمات المرور والاعتمادات", en: "Password Cracking & Credential Attacks" },
    subtitle: { ar: "Hashcat، John، wordlists، rules، masks، GPU rigs", en: "Hashcat, John the Ripper, wordlists, rules, masks, GPU rigs" },
    track: "red", level: LV.adv, duration: "75m", icon: KeyRound,
    tags: ["Hashcat", "John", "Cracking", "Credentials", "GPU"],
  },
  {
    slug: "soc-analyst-day1", number: 17,
    title:    { ar: "محلل مركز عمليات الأمن — يوم العمل الأول", en: "SOC Analyst — Day-1 Playbook" },
    subtitle: { ar: "دورة المناوبة، فرز التنبيهات، الحالات، والتسليم", en: "Shift workflow, alert triage, ticketing, escalation, handoff" },
    track: "blue", level: LV.basic, duration: "75m", icon: Headphones,
    tags: ["SOC", "Triage", "SIEM", "Tier 1", "Handoff"],
  },
  {
    slug: "hardening", number: 18,
    title:    { ar: "تحصين الأنظمة والدفاع المتعمق", en: "System Hardening & Defense in Depth" },
    subtitle: { ar: "استراتيجيات تحصين الأنظمة والشبكات المؤسسية", en: "System Hardening & Defense in Depth" },
    track: "blue", level: LV.adv, duration: "70m", icon: Shield,
    tags: ["CIS", "WAF", "Zero Trust", "Patching"],
  },
  {
    slug: "compliance", number: 19,
    title:    { ar: "نمذجة التهديدات والامتثال للمعايير", en: "Threat Modeling & Compliance" },
    subtitle: { ar: "منهجيات STRIDE والامتثال لمعايير NIST و ISO 27001", en: "STRIDE, NIST CSF, ISO 27001, GDPR, PCI" },
    track: "blue", level: LV.adv, duration: "55m", icon: ClipboardCheck,
    tags: ["STRIDE", "NIST", "ISO27001", "GDPR"],
  },
  {
    slug: "email-phishing-analysis", number: 20,
    title:    { ar: "تحليل الترويسات والتصيد الاحتيالي", en: "Email Header & Phishing Analysis" },
    subtitle: { ar: "SPF/DKIM/DMARC، تحليل المرفقات، استخراج المؤشرات", en: "SPF/DKIM/DMARC, attachment analysis, IOC extraction, BEC investigation" },
    track: "blue", level: LV.adv, duration: "70m", icon: Mail,
    tags: ["Email", "Phishing", "DMARC", "BEC", "Headers"],
  },
  {
    slug: "evidence-chain-of-custody", number: 21,
    title:    { ar: "إدارة الأدلة الرقمية وسلسلة الحفظ", en: "Digital Evidence & Chain of Custody" },
    subtitle: { ar: "التوثيق، التشفير، الـ hashing، الـ write-blockers، التسليم", en: "Imaging, hashing, write-blockers, documentation, courtroom-ready evidence" },
    track: "blue", level: LV.adv, duration: "65m", icon: Scale,
    tags: ["Forensics", "Custody", "Imaging", "Federal", "Court"],
  },
  {
    slug: "threat-intel-fundamentals", number: 22,
    title:    { ar: "أساسيات الاستخبارات السيبرانية وتحليل المؤشرات", en: "Threat Intelligence Fundamentals & IOC Pivoting" },
    subtitle: { ar: "STIX/TAXII، MISP، Diamond Model، Pyramid of Pain", en: "STIX/TAXII, MISP, Diamond Model, Pyramid of Pain, IOC pivoting" },
    track: "ops", level: LV.adv, duration: "75m", icon: Globe,
    tags: ["CTI", "STIX", "MISP", "IOC", "Diamond"],
  },
  {
    slug: "cyber-law-authorities", number: 23,
    title:    { ar: "القوانين والصلاحيات السيبرانية الفيدرالية الأمريكية", en: "US Federal Cyber Authorities & Law" },
    subtitle: { ar: "CFAA، ECPA، Title III، FISA، EO 12333، حدود التحقيق", en: "CFAA, ECPA, Title III, FISA, EO 12333, investigative boundaries" },
    track: "ops", level: LV.adv, duration: "60m", icon: Gavel,
    tags: ["CFAA", "ECPA", "FISA", "Title III", "Federal"],
  },
  {
    slug: "pentest-reporting", number: 24,
    title:    { ar: "كتابة تقارير اختبار الاختراق", en: "Pentest Reporting — Federal-Grade Documentation" },
    subtitle: { ar: "الملخص التنفيذي، تصنيف المخاطر، CVSS، إثبات الاستغلال، خطة المعالجة", en: "Executive summary, risk rating, CVSS, proof-of-exploit, remediation roadmap" },
    track: "ops", level: LV.adv, duration: "70m", icon: FileText,
    tags: ["Reporting", "CVSS", "Pentest", "Documentation", "Federal"],
  },

  /* ============== TIER III — ADVANCED OPERATIONS ============== */
  /* Web & Frameworks */
  {
    slug: "web-attacks", number: 25,
    title:    { ar: "الثغرات الجوهرية في تطبيقات الويب", en: "Core Web Vulnerabilities" },
    subtitle: { ar: "أهم 10 ثغرات بحسب تصنيف OWASP", en: "OWASP Top 10 — SQLi, XSS, SSRF, IDOR, Auth" },
    track: "red", level: LV.expert, duration: "120m", icon: Bug,
    tags: ["SQLi", "XSS", "SSRF", "IDOR", "JWT"],
  },
  {
    slug: "api-security", number: 26,
    title:    { ar: "أمن واجهات البرمجة (APIs)", en: "API Security" },
    subtitle: { ar: "أهم 10 ثغرات في الـ APIs بحسب OWASP", en: "OWASP API Top 10 — BOLA, Auth, Rate Limits" },
    track: "red", level: LV.expert, duration: "70m", icon: Webhook,
    tags: ["BOLA", "OAuth", "GraphQL", "REST"],
  },
  {
    slug: "advanced-web", number: 27,
    title:    { ar: "الويب المتقدم — تهريب الطلبات وعدم التزامن", en: "Advanced Web — Smuggling, Desync, Prototype Pollution" },
    subtitle: { ar: "HTTP Request Smuggling و HTTP/2 Desync", en: "Request Smuggling, HTTP/2 Desync, Deserialization Chains" },
    track: "red", level: LV.expert, duration: "120m", icon: Workflow,
    tags: ["Smuggling", "Desync", "Deserialization", "PP"],
  },
  {
    slug: "nodejs-express-security", number: 28,
    title:    { ar: "أمن Node.js و Express — استغلال متقدم", en: "Node.js & Express Security — Advanced Exploitation" },
    subtitle: { ar: "Prototype pollution, SSRF, deserialization, RCE في الـ middleware", en: "Prototype pollution, SSRF, deserialization, middleware RCE" },
    track: "red", level: LV.expert, duration: "110m", icon: Code2,
    tags: ["Node.js", "Express", "Prototype Pollution", "SSRF", "RCE"],
  },
  {
    slug: "nestjs-security", number: 29,
    title:    { ar: "أمن NestJS — Guards و Pipes و GraphQL", en: "NestJS Security — Guards, Pipes & GraphQL" },
    subtitle: { ar: "تجاوز Guards، ValidationPipe، DI poisoning، GraphQL في Nest", en: "Guards bypass, ValidationPipe pitfalls, DI poisoning, GraphQL in Nest" },
    track: "red", level: LV.expert, duration: "85m", icon: Layers,
    tags: ["NestJS", "Guards", "Pipes", "GraphQL", "DI"],
  },
  {
    slug: "react-security", number: 30,
    title:    { ar: "أمن React — XSS و Hydration و الـ Refs", en: "React Security — XSS, Hydration & Ref Escapes" },
    subtitle: { ar: "dangerouslySetInnerHTML، JSX injection، URL handlers، XS-Leaks", en: "dangerouslySetInnerHTML, JSX injection, URL handlers, XS-Leaks, supply chain" },
    track: "red", level: LV.expert, duration: "90m", icon: Atom,
    tags: ["React", "XSS", "Hydration", "DOM", "CSP"],
  },
  {
    slug: "nextjs-security", number: 31,
    title:    { ar: "أمن Next.js — Middleware و Server Actions و RSC", en: "Next.js Security — Middleware, Server Actions & RSC" },
    subtitle: { ar: "CVE-2025-29927 middleware bypass، Server Actions abuse، ISR poisoning، RSC leaks", en: "CVE-2025-29927 middleware bypass, Server Actions abuse, ISR poisoning, RSC data leaks" },
    track: "red", level: LV.expert, duration: "100m", icon: Triangle,
    tags: ["Next.js", "Middleware", "Server Actions", "RSC", "CVE-2025-29927"],
  },
  {
    slug: "angular-security", number: 32,
    title:    { ar: "أمن Angular — Sanitizer و Template Injection", en: "Angular Security — Sanitizer & Template Injection" },
    subtitle: { ar: "Trusted Types، DomSanitizer bypasses، AOT vs JIT، SSR leaks", en: "Trusted Types, DomSanitizer bypasses, AOT vs JIT, SSR leaks" },
    track: "red", level: LV.expert, duration: "80m", icon: Component,
    tags: ["Angular", "Sanitizer", "Template", "Trusted Types", "SSR"],
  },
  /* Network */
  {
    slug: "network-attacks", number: 33,
    title:    { ar: "هجمات بروتوكولات الشبكة المتقدمة", en: "Advanced Network Protocol Attacks" },
    subtitle: { ar: "اختطاف BGP، إعادة توجيه DNS، وهجمات MITM", en: "BGP Hijacking, DNS Rebinding, NTP, ARP" },
    track: "red", level: LV.expert, duration: "85m", icon: Network,
    tags: ["BGP", "DNS", "ARP", "MITM"],
  },
  {
    slug: "wifi-deep", number: 34,
    title:    { ar: "تحليل معمق لأمن الواي فاي وكسر الحماية", en: "Wi-Fi Deep Dive — Types, Cracking & What Still Holds" },
    subtitle: { ar: "تجاوز حمايات WPA2/WPA3 والشبكات المؤسسية", en: "WEP/WPA/WPA2/WPA3/Enterprise/OWE — attacks, limits, workarounds" },
    track: "red", level: LV.expert, duration: "100m", icon: Wifi,
    tags: ["Wi-Fi", "WPA3", "PMKID", "Evil Twin", "EAP"],
  },
  /* Active Directory */
  {
    slug: "advanced-ad", number: 35,
    title:    { ar: "هجمات Active Directory المتقدمة", en: "Advanced Active Directory Attacks" },
    subtitle: { ar: "هجمات متقدمة: ADCS، التفويض المقيد، وتتابع NTLM", en: "Advanced AD — ADCS, Delegation, NTLM Relay" },
    track: "red", level: LV.expert, duration: "100m", icon: KeyRound,
    tags: ["ADCS", "Delegation", "NTLM Relay", "Shadow Creds"],
  },
  {
    slug: "adcs-attacks", number: 36,
    title:    { ar: "هجمات خدمات الشهادات (AD CS)", en: "AD CS Attacks — ESC1 to ESC15" },
    subtitle: { ar: "مسارات استغلال خدمات شهادات النطاق", en: "Certificate Services exploitation paths" },
    track: "red", level: LV.expert, duration: "85m", icon: KeyRound,
    tags: ["AD CS", "ESC1", "Certipy", "Forest"],
  },
  {
    slug: "bloodhound-mastery", number: 37,
    title:    { ar: "إتقان BloodHound — تحليل مسارات هجوم AD", en: "BloodHound Mastery — AD Enumeration & Path Finding" },
    subtitle: { ar: "استخدام Cypher للبحث عن ثغرات التحكم في النطاق", en: "SharpHound / AzureHound, Cypher queries, attack paths" },
    track: "red", level: LV.expert, duration: "100m", icon: Network,
    tags: ["BloodHound", "AD", "Cypher", "SharpHound", "Azure"],
  },
  {
    slug: "mfa-saml-oauth-attacks", number: 38,
    title:    { ar: "هجمات MFA و SAML و OAuth", en: "MFA, SAML & OAuth Attacks" },
    subtitle: { ar: "MFA fatigue، Evilginx، token theft، Golden SAML، consent phishing", en: "MFA fatigue, Evilginx, token theft, Golden SAML, consent phishing" },
    track: "red", level: LV.expert, duration: "85m", icon: Lock,
    tags: ["MFA", "SAML", "OAuth", "Evilginx", "Token Theft"],
  },
  /* Cloud */
  {
    slug: "cloud", number: 39,
    title:    { ar: "هجمات الحوسبة السحابية (AWS / Azure / GCP)", en: "Cloud Attacks (AWS / Azure / GCP)" },
    subtitle: { ar: "سطح الهجوم السحابي — الهوية والتخزين والحاويات", en: "Cloud Attack Surface — IAM, S3, IMDS, Containers" },
    track: "red", level: LV.expert, duration: "100m", icon: Cloud,
    tags: ["AWS", "IAM", "S3", "IMDSv1", "Kubernetes"],
  },
  {
    slug: "aws-attack-chains", number: 40,
    title:    { ar: "سلاسل هجوم AWS الواقعية", en: "Practical AWS Attack Chains" },
    subtitle: { ar: "استغلال ثغرات IAM و S3 و Lambda و SSM", en: "IAM enum, Pacu, S3, IMDS, Lambda, SSM" },
    track: "red", level: LV.expert, duration: "100m", icon: Cloudy,
    tags: ["AWS", "IAM", "Pacu", "Lambda", "SSM"],
  },
  {
    slug: "azure-attacks", number: 41,
    title:    { ar: "هجمات Azure — الاشتراكات والهويات المدارة", en: "Azure Attacks — Subscriptions & Managed Identities" },
    subtitle: { ar: "استغلال Azure RBAC و Managed Identity و Key Vault", en: "Azure RBAC abuse, Managed Identity theft, Storage, Key Vault, Runbooks" },
    track: "red", level: LV.expert, duration: "95m", icon: CloudLightning,
    tags: ["Azure", "RBAC", "MI", "Key Vault", "Runbook"],
  },
  {
    slug: "m365-entra-attacks", number: 42,
    title:    { ar: "هجمات Microsoft 365 و Entra ID", en: "Microsoft 365 & Entra ID Attacks" },
    subtitle: { ar: "سرقة الرموز (Tokens)، وتجاوز سياسات النفاذ المشروط", en: "Token theft, Conditional Access bypass, OAuth abuse" },
    track: "red", level: LV.expert, duration: "85m", icon: ScrollText,
    tags: ["M365", "Entra", "OAuth", "Tokens"],
  },
  /* Endpoints, privesc, lateral, full chains */
  {
    slug: "server-attacks", number: 43,
    title:    { ar: "استغلال الخوادم وتصعيد الصلاحيات", en: "Server Exploitation & Privilege Escalation" },
    subtitle: { ar: "طرق استغلال السيرفرات وتصعيد صلاحيات المستخدم", en: "Server Exploitation & Privilege Escalation" },
    track: "red", level: LV.expert, duration: "90m", icon: Server,
    tags: ["RCE", "SSH", "LinPEAS", "GTFOBins"],
  },
  {
    slug: "linux-privesc", number: 44,
    title:    { ar: "تصعيد الصلاحيات على Linux", en: "Linux Privilege Escalation" },
    subtitle: { ar: "SUID، sudo abuses، capabilities، PATH hijack، LinPEAS", en: "SUID, sudo abuses, capabilities, PATH hijack, kernel checks, LinPEAS" },
    track: "red", level: LV.adv, duration: "85m", icon: TerminalIcon,
    tags: ["Linux", "PrivEsc", "SUID", "Sudo", "LinPEAS"],
  },
  {
    slug: "windows-privesc", number: 45,
    title:    { ar: "تصعيد الصلاحيات على Windows", en: "Windows Privilege Escalation" },
    subtitle: { ar: "Token impersonation، service abuse، UAC bypass، DLL hijack، WinPEAS", en: "Token impersonation, service abuse, UAC bypass, DLL hijack, WinPEAS" },
    track: "red", level: LV.adv, duration: "90m", icon: Monitor,
    tags: ["Windows", "PrivEsc", "Tokens", "UAC", "DLL Hijack", "WinPEAS"],
  },
  {
    slug: "post-exploitation", number: 46,
    title:    { ar: "ما بعد الاستغلال والتحرك الجانبي", en: "Post-Exploitation & Lateral Movement" },
    subtitle: { ar: "الاستمرارية، التحرك الجانبي، وسحب البيانات", en: "Post-Exploitation, Persistence & Lateral Movement" },
    track: "red", level: LV.expert, duration: "75m", icon: Ghost,
    tags: ["Persistence", "Pivoting", "C2", "Exfiltration"],
  },
  {
    slug: "lateral-movement", number: 47,
    title:    { ar: "الحركة الجانبية بين المضيفين", en: "Lateral Movement — Pivoting the Network" },
    subtitle: { ar: "Pass-the-Hash، PsExec، WMI، WinRM، SOCKS proxies، Chisel", en: "PtH, PtT, PsExec, WMI, WinRM, SOCKS proxies, Chisel, Ligolo-ng" },
    track: "red", level: LV.expert, duration: "95m", icon: Workflow,
    tags: ["Lateral Movement", "PsExec", "WMI", "PtH", "Pivoting"],
  },
  {
    slug: "evasion", number: 48,
    title:    { ar: "التملص الدفاعي وتمويه الحمولات البرمجية", en: "Defense Evasion & Payload Obfuscation" },
    subtitle: { ar: "تجاوز EDR/AV، وتخطي حماية AMSI/ETW", en: "AV/EDR Evasion, AMSI/ETW Bypass, Obfuscation" },
    track: "red", level: LV.expert, duration: "90m", icon: Flame,
    tags: ["AMSI", "ETW", "Syscalls", "Packers"],
  },
  {
    slug: "initial-access", number: 49,
    title:    { ar: "النفاذ الأولي — نقطة الارتكاز الأولى", en: "Initial Access — First Foothold" },
    subtitle: { ar: "التصيد، الخدمات المكشوفة، وهجمات الهوية", en: "Spear-phishing, exposed services, identity attacks" },
    track: "red", level: LV.expert, duration: "90m", icon: DoorOpen,
    tags: ["Phishing", "Exposed", "Spraying", "ITW"],
  },
  {
    slug: "opsec-offensive", number: 50,
    title:    { ar: "الأمن العملياتي للمهاجم — التخفّي والتمويه", en: "Offensive OPSEC — Avoiding Attribution" },
    subtitle: { ar: "تأمين البنية التحتية وتجنب الملاحقة الجنائية", en: "Infrastructure hygiene, false flags, anti-forensics" },
    track: "red", level: LV.expert, duration: "60m", icon: EyeOff,
    tags: ["OPSEC", "Anti-forensics", "Anonymity"],
  },
  {
    slug: "target-selection", number: 51,
    title:    { ar: "اختيار الأهداف — عقلية المهاجم", en: "Target Selection — Adversary Mindset" },
    subtitle: { ar: "منهجية اختيار الأهداف وتحديد الأولويات", en: "Threat modeling from the attacker's seat" },
    track: "red", level: LV.expert, duration: "55m", icon: Target,
    tags: ["Targeting", "OSINT", "Prioritization"],
  },
  {
    slug: "full-attack-scenario", number: 52,
    title:    { ar: "محاكاة سيناريو هجوم شامل واستجابة دفاعية", en: "Full Attack Scenario — From Recon to Backdoor and the Blue-Team Counter" },
    subtitle: { ar: "سلسلة هجوم كاملة من الاستطلاع إلى التثبيت ثم الرد الدفاعي", en: "Red kill chain against target.gov then Blue detection, response & active defense" },
    track: "red", level: LV.adv, duration: "150m", icon: Workflow,
    tags: ["Kill Chain", "End-to-End", "Backdoor", "Blue Team", "Active Defense"],
  },
  /* IoT & physical */
  {
    slug: "mobile-iot", number: 53,
    title:    { ar: "أمن الهواتف المحمولة وإنترنت الأشياء والأنظمة الصناعية", en: "Mobile, IoT & OT Security" },
    subtitle: { ar: "أمن أندرويد و iOS، الأنظمة المدمجة، وبروتوكولات ICS", en: "Android/iOS, Firmware, ICS/SCADA" },
    track: "red", level: LV.expert, duration: "85m", icon: Smartphone,
    tags: ["Android", "iOS", "Firmware", "ICS"],
  },
  {
    slug: "usb-network-implants", number: 54,
    title:    { ar: "هجمات USB والاختراق الجانبي للشبكات", en: "USB-Borne Malware & Lateral Network Compromise" },
    subtitle: { ar: "BadUSB، عبور الفجوات الهوائية، MITM، والوصول إلى الأجهزة بعد الاتصال", en: "BadUSB, air-gap jumps, MITM, and accessing devices once on the network" },
    track: "red", level: LV.expert, duration: "100m", icon: HardDrive,
    tags: ["BadUSB", "Stuxnet", "Air-Gap", "MITM", "Lateral"],
  },
  {
    slug: "usb-attack-lab", number: 55,
    title:    { ar: "بناء هجمات USB في المختبر — أمثلة عملية", en: "Building USB Attacks in the Lab — Hands-On Examples" },
    subtitle: { ar: "كتابة DuckyScript، Pi Pico كـ BadUSB، والدفاع المضاد", en: "Writing DuckyScript, Pi Pico as BadUSB, and matching defenses" },
    track: "red", level: LV.expert, duration: "90m", icon: Cpu,
    tags: ["DuckyScript", "Pi Pico", "CircuitPython", "USBGuard", "GPO"],
  },
  /* Advanced Blue Team */
  {
    slug: "detection", number: 56,
    title:    { ar: "الكشف والمراقبة الأمنية (SIEM / EDR)", en: "Detection & Monitoring (SIEM / EDR)" },
    subtitle: { ar: "هندسة الكشف، السجلات، وأنظمة التنبيه", en: "Detection Engineering, Logs, SIEM & Honeypots" },
    track: "blue", level: LV.expert, duration: "85m", icon: Eye,
    tags: ["SIEM", "Sigma", "Suricata", "Honeypots"],
  },
  {
    slug: "siem-detection-engineering", number: 57,
    title:    { ar: "هندسة الكشف وSIEM — Sigma و KQL و Splunk", en: "SIEM & Detection Engineering — Sigma, KQL, Splunk SPL" },
    subtitle: { ar: "كتابة قواعد الكشف، تخفيض الإيجابيات الكاذبة، تغطية ATT&CK", en: "Writing detections, reducing false positives, ATT&CK coverage" },
    track: "blue", level: LV.expert, duration: "110m", icon: Telescope,
    tags: ["SIEM", "Sigma", "KQL", "Splunk", "Detection"],
  },
  {
    slug: "threat-hunting", number: 58,
    title:    { ar: "التقصي النشط — استعلامات عملية", en: "Threat Hunting — Practical Queries" },
    subtitle: { ar: "استعلامات KQL و SPL وقواعد Sigma القائمة على الفرضيات", en: "KQL, SPL, Sigma rules with hypotheses" },
    track: "blue", level: LV.expert, duration: "90m", icon: Telescope,
    tags: ["KQL", "Splunk", "Sigma", "Hunting"],
  },
  {
    slug: "incident-response", number: 59,
    title:    { ar: "الاستجابة للحوادث السيبرانية", en: "Incident Response" },
    subtitle: { ar: "خطط الاستجابة والتحقيق الجنائي الرقمي", en: "Incident Response Playbook & Forensics" },
    track: "blue", level: LV.expert, duration: "80m", icon: Siren,
    tags: ["IR", "Forensics", "Memory", "Volatility"],
  },
  {
    slug: "dfir-triage", number: 60,
    title:    { ar: "التحقيق الجنائي الرقمي — فرز حوادث الساعة الأولى", en: "DFIR — First-Hour Triage" },
    subtitle: { ar: "استخدام KAPE و Velociraptor وتحليل الخط الزمني", en: "KAPE, Velociraptor, Volatility, timeline analysis" },
    track: "blue", level: LV.expert, duration: "90m", icon: HardDrive,
    tags: ["DFIR", "KAPE", "Velociraptor", "Volatility"],
  },
  {
    slug: "malware-analysis", number: 61,
    title:    { ar: "تحليل البرمجيات الخبيثة والهندسة العكسية", en: "Malware Analysis & Reverse Engineering" },
    subtitle: { ar: "التحليل الساكن والديناميكي، بيئات الفحص، والهندسة العكسية", en: "Static & Dynamic Analysis, Sandboxing, RE" },
    track: "blue", level: LV.expert, duration: "90m", icon: Microscope,
    tags: ["IDA", "Ghidra", "Sandbox", "YARA"],
  },
  {
    slug: "windows-forensics", number: 62,
    title:    { ar: "التحقيق الجنائي في ويندوز — تحليل السجلات والآثار", en: "Windows Forensics — Sysmon, Event Logs, Registry" },
    subtitle: { ar: "تحليل MFT و ShimCache و Prefetch وسجلات الأحداث", en: "Sysmon configs, 4624/4688/7045, MFT, ShimCache, Amcache, Prefetch" },
    track: "blue", level: LV.expert, duration: "90m", icon: Monitor,
    tags: ["Windows", "Sysmon", "MFT", "Registry", "Prefetch"],
  },
  {
    slug: "network-forensics", number: 63,
    title:    { ar: "التحقيق الجنائي في الشبكة — تحليل حزم البيانات", en: "Network Forensics — PCAP & Flow Analysis" },
    subtitle: { ar: "Wireshark, Zeek, Suricata, NetFlow, تحليل الجلسات", en: "Wireshark, Zeek, Suricata, NetFlow, session reconstruction" },
    track: "blue", level: LV.expert, duration: "90m", icon: Activity,
    tags: ["PCAP", "Wireshark", "Zeek", "Suricata", "NetFlow"],
  },
  {
    slug: "memory-forensics", number: 64,
    title:    { ar: "تحليل الذاكرة الجنائي مع Volatility", en: "Memory Forensics with Volatility" },
    subtitle: { ar: "التقاط الذاكرة، plugins، اكتشاف rootkits، تحليل process injection", en: "Memory capture, Vol3 plugins, rootkit hunting, injection analysis" },
    track: "blue", level: LV.expert, duration: "100m", icon: HardDrive,
    tags: ["Forensics", "Volatility", "Memory", "Rootkit", "DFIR"],
  },

  /* ============== TIER IV — EXPERT / TRADECRAFT ============== */
  /* Vuln research & exploit dev */
  {
    slug: "web-redteam-deep", number: 65,
    title:    { ar: "الويب من منظور الفريق الأحمر — استغلال متعمّق", en: "Web from a Red Team Lens — Deep Exploitation" },
    subtitle: { ar: "سلاسل الاستغلال المتقدمة، وتجاوز جدران الحماية (WAF)", en: "Advanced web exploitation chains, blind techniques, WAF bypass" },
    track: "red", level: LV.expert, duration: "180m", icon: Bug,
    tags: ["SSRF", "Smuggling", "Deserialization", "OAuth", "WAF Bypass", "Race"],
  },
  {
    slug: "web-vuln-research", number: 66,
    title:    { ar: "أبحاث ثغرات الويب وعمليات الإقامة الطويلة", en: "Web Vulnerability Research & Long-Haul Tradecraft" },
    subtitle: { ar: "اكتشاف ثغرات جديدة، تحليل المتغيرات، وعمليات منخفضة وبطيئة", en: "Discovering 0-days, variant analysis, low-and-slow operations" },
    track: "red", level: LV.expert, duration: "120m", icon: Telescope,
    tags: ["0-day", "Variant Analysis", "Patch Diffing", "Fuzzing", "Long-Haul"],
  },
  {
    slug: "binary-exploitation", number: 67,
    title:    { ar: "استغلال ثغرات الذاكرة والملفات التنفيذية", en: "Memory Corruption & Binary Exploitation" },
    subtitle: { ar: "ثغرات التدفق، الـ ROP، وتجاوز حمايات ASLR/DEP", en: "Stack/Heap Overflows, ROP, ASLR/DEP Bypass" },
    track: "red", level: LV.expert, duration: "150m", icon: Cpu,
    tags: ["BoF", "ROP", "Heap", "ASLR"],
  },
  {
    slug: "linux-kernel-lpe", number: 68,
    title:    { ar: "تصعيد الصلاحيات عبر نواة (Kernel) لينكس", en: "Linux Kernel Privilege Escalation" },
    subtitle: { ar: "دراسة ثغرات DirtyPipe و nftables و OverlayFS", en: "Recent kernel CVEs with exec — DirtyPipe, nftables, OverlayFS" },
    track: "red", level: LV.expert, duration: "80m", icon: CpuIcon,
    tags: ["Kernel", "LPE", "DirtyPipe", "eBPF"],
  },
  {
    slug: "zero-days", number: 69,
    title:    { ar: "ثغرات اليوم الصفر (Zero-Day) الحديثة", en: "Recent Zero-Days (2023–2026)" },
    subtitle: { ar: "ثغرات لم يسبق الكشف عنها وكيف تم استغلالها واقعياً", en: "ITW Zero-Days — How They Worked & Practical PoCs" },
    track: "ops", level: LV.expert, duration: "140m", icon: Flame,
    tags: ["0-day", "ITW", "KEV", "PoC", "2026"],
  },
  /* Modern infra */
  {
    slug: "kubernetes-attacks", number: 70,
    title:    { ar: "سلاسل هجوم Kubernetes المتكاملة", en: "Kubernetes Attack Chains" },
    subtitle: { ar: "إساءة استخدام RBAC، الهروب من الـ Pods، واختراق etcd", en: "RBAC abuse, pod escapes, etcd, supply chain" },
    track: "red", level: LV.expert, duration: "75m", icon: Boxes,
    tags: ["k8s", "RBAC", "Pod Escape", "etcd"],
  },
  {
    slug: "container-escapes", number: 71,
    title:    { ar: "الهروب من الحاويات وأنظمة المحاكاة الافتراضية", en: "Container & Hypervisor Escapes" },
    subtitle: { ar: "اختراق Docker، الهروب من Kubernetes، ومن الأنظمة الوهمية", en: "Docker Breakouts, Kubernetes Escapes, VM Escapes" },
    track: "red", level: LV.expert, duration: "90m", icon: Container,
    tags: ["Docker", "K8s", "runc", "Hypervisor"],
  },
  {
    slug: "cicd-attacks", number: 72,
    title:    { ar: "هجمات خطوط الإنتاج (CI/CD Pipelines)", en: "CI/CD Pipeline Attacks" },
    subtitle: { ar: "اختراق GitHub Actions و Jenkins وسرقة الأسرار", en: "GitHub Actions, GitLab CI, Jenkins — secrets, runners, artifacts" },
    track: "red", level: LV.expert, duration: "85m", icon: GitMerge,
    tags: ["CI/CD", "GitHub Actions", "Jenkins", "OIDC", "SLSA"],
  },
  {
    slug: "redteam-infra", number: 73,
    title:    { ar: "بناء البنية التحتية للفرق الحمراء", en: "Building Red Team Infrastructure" },
    subtitle: { ar: "خوادم C2، الموجهات، واستضافة الحمولات الخبيثة", en: "C2 servers, redirectors, payload hosting, DNS" },
    track: "red", level: LV.expert, duration: "80m", icon: CloudCog,
    tags: ["C2", "Redirector", "Cobalt", "Sliver"],
  },
  {
    slug: "supply-chain-deep", number: 74,
    title:    { ar: "تحليل معمق لهجمات سلسلة التوريد", en: "Advanced Supply Chain Attacks" },
    subtitle: { ar: "دراسة حالات SolarWinds و XZ وثغرات المكتبات", en: "SolarWinds, XZ, npm/PyPI, build systems" },
    track: "red", level: LV.expert, duration: "65m", icon: GitBranch,
    tags: ["Supply Chain", "SolarWinds", "XZ", "Dependencies"],
  },
  /* Advanced adversary */
  {
    slug: "dns-covert-channels", number: 75,
    title:    { ar: "القنوات السرية ونفق بيانات DNS", en: "Covert Channels & DNS Tunneling" },
    subtitle: { ar: "تسريب البيانات عبر DNS واستخدام بروتوكولات ICMP/HTTPS", en: "DNS exfil, ICMP/HTTPS tunneling, DGAs, fast flux, detection" },
    track: "red", level: LV.expert, duration: "70m", icon: Radio,
    tags: ["DNS", "Tunneling", "Exfil", "DGA", "Iodine"],
  },
  {
    slug: "ai-llm-security", number: 76,
    title:    { ar: "أمن الذكاء الاصطناعي والنماذج اللغوية (LLMs)", en: "AI / LLM Security" },
    subtitle: { ar: "حقن الأوامر (Prompt Injection) وتسميم نماذج الـ RAG", en: "Prompt injection, RAG poisoning, agentic abuse" },
    track: "red", level: LV.expert, duration: "75m", icon: Brain,
    tags: ["LLM", "Prompt Injection", "RAG", "Agents"],
  },
  {
    slug: "ransomware-supply-chain", number: 77,
    title:    { ar: "برمجيات الفدية وهجمات سلسلة التوريد", en: "Ransomware & Supply Chain Attacks" },
    subtitle: { ar: "تشريح هجمات الفدية وسلاسل التوريد — منظور دفاعي", en: "Ransomware Anatomy & Supply Chain — defensive awareness" },
    track: "red", level: LV.expert, duration: "80m", icon: Skull,
    tags: ["Ransomware", "Supply Chain", "Wipers", "MSP"],
  },
  {
    slug: "university-attack-chain", number: 78,
    title:    { ar: "سلسلة هجوم كاملة من A إلى Z — جامعة وأجهزة IoT", en: "Full A-to-Z Attack Chain — University & IoT Devices" },
    subtitle: { ar: "من الاستطلاع إلى السيطرة الكاملة، مع كاميرات وطابعات وقارئات بطاقات", en: "Recon to total takeover, pivoting through cameras, printers, badge readers" },
    track: "red", level: LV.expert, duration: "150m", icon: Building2,
    tags: ["Kill Chain", "University", "IoT", "Cameras", "Printers", "Pivot"],
  },
  /* ICS / Critical infra */
  {
    slug: "ics-scada-protocols", number: 79,
    title:    { ar: "بروتوكولات ICS / SCADA — Modbus, DNP3, IEC-104", en: "ICS / SCADA Protocols — Modbus, DNP3, IEC-104" },
    subtitle: { ar: "تحليل بروتوكولات التحكم الصناعي، فحصها واستغلالها بأمان", en: "Industrial control protocol internals, safe scanning, lab exploitation" },
    track: "ops", level: LV.expert, duration: "95m", icon: Factory,
    tags: ["ICS", "SCADA", "Modbus", "DNP3", "OT"],
  },
  {
    slug: "critical-infrastructure", number: 80,
    title:    { ar: "البنية التحتية الحرجة — أولويات الأمن القومي", en: "Critical Infrastructure — Government Priorities" },
    subtitle: { ar: "تأمين أنظمة الطاقة والمياه والاتصالات والمالية", en: "ICS/SCADA, energy, water, telecom, finance" },
    track: "ops", level: LV.expert, duration: "70m", icon: Factory,
    tags: ["ICS", "SCADA", "Energy", "OT"],
  },
  /* Nation-state & intelligence */
  {
    slug: "state-actor-tradecraft", number: 81,
    title:    { ar: "تكتيكات المهاجمين المدعومين من الدول", en: "Nation-State Tradecraft" },
    subtitle: { ar: "أساليب عمل مجموعات الـ APT والبنية التحتية", en: "APT TTPs, infrastructure, OPSEC" },
    track: "ops", level: LV.expert, duration: "75m", icon: Building2,
    tags: ["APT", "TTPs", "OPSEC", "Tradecraft"],
  },
  {
    slug: "attribution", number: 82,
    title:    { ar: "إسناد الهجمات والاستخبارات المضادة", en: "Attacker Attribution & Counter-Intel" },
    subtitle: { ar: "تحديد هوية المهاجم، استخبارات التهديدات، والتمويه", en: "Attacker Attribution, Threat Intel & Counter-OSINT" },
    track: "ops", level: LV.expert, duration: "90m", icon: Crosshair,
    tags: ["TTPs", "IOC", "Honeytokens", "Attribution"],
  },
  {
    slug: "mobile-spyware", number: 83,
    title:    { ar: "برمجيات التجسس الحكومية على الهواتف", en: "Mobile Spyware — State-Grade Implants" },
    subtitle: { ar: "تحليل Pegasus و Predator وطرق الكشف عنها", en: "Pegasus, Predator, Reign — chains and detection" },
    track: "ops", level: LV.expert, duration: "70m", icon: SmartphoneIcon,
    tags: ["Pegasus", "Predator", "iOS", "Android"],
  },
  /* Knowledge bases & programs */
  {
    slug: "cve-catalog", number: 84,
    title:    { ar: "دليل أهم 100 ثغرة CVE حديثة", en: "Top 100 Recent CVEs Catalog" },
    subtitle: { ar: "شرح معمق لأخطر الثغرات الحديثة وكيفية استغلالها", en: "Explicit CVEs — How They Work & How to Exploit" },
    track: "ops", level: LV.expert, duration: "180m", icon: ShieldAlert,
    tags: ["CVE", "Exploits", "PoC", "KEV"],
  },
  {
    slug: "purple-team", number: 85,
    title:    { ar: "الفريق الأرجواني — محاكاة الخصم وقياس الفعالية", en: "Purple Team — Adversary Emulation & Measurement" },
    subtitle: { ar: "استخدام Atomic Red Team و CALDERA لتطوير الدفاع", en: "Atomic Red Team, CALDERA, ATT&CK Navigator, detection coverage" },
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
