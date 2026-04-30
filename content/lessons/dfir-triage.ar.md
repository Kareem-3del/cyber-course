# الاستجابة للحوادث والجنائيات الرقمية (DFIR) — بروتوكول الفرز في الساعة الأولى

يرن الهاتف؛ هناك مؤشرات على اختراق أمني. أمامك ساعة واحدة فقط لتأكيد الحادث أو نفيه، تحديد نطاقه، ووقف الضرر (Containment) دون تدمير الأدلة الرقمية. يمثل هذا الدرس "دفتر التشغيل" (Playbook) للمرحلة الحرجة: الساعة الأولى من الاستجابة.

> [!info] صراع مع عقرب الساعة
> أنت تسابق زمنين: ساعة الاحتواء (كل دقيقة تمر تمنح المهاجم فرصة للتحرك الجانبي) وساعة الأدلة (كل دقيقة تمر تزيد من احتمالية فقدان البيانات المتطايرة). هدفك هو الموازنة بينهما بذكاء.

## شجرة القرار في أول 60 دقيقة

```
0–10  دقيقة   مكالمة الفرز: تحديد النطاق، الجسامة، والأنظمة المتأثرة.
10–20 دقيقة   جمع البيانات المتطايرة (Volatile State) من الأجهزة المشتبه بها (الذاكرة، العمليات، الشبكة).
20–35 دقيقة   توسيع نطاق التحقيق عبر بيانات "التيليمتري" المركزية؛ وتحديد "المريض صفر" (Patient Zero).
35–50 دقيقة   إجراءات الاحتواء (عزل، إبطال اعتمادات، تدوير مفاتيح) دون المساس بسلامة الأدلة.
50–60 دقيقة   مرحلة التسليم: تعيين قائد القضية، توسيم الأدلة، وبدء قنوات التواصل الرسمية.
```

## تساؤلات حاسمة في الدقائق العشر الأولى

```
1. ما هي طبيعة المؤشر المكتشف؟ (تنبيه أمني، إبلاغ مستخدم، إخطار من جهة خارجية؟)
2. متى تم رصد النشاط لأول مرة؟ هل لا يزال مستمراً أم توقف؟
3. ما هي الحسابات/الأجهزة/البيانات المتورطة في الحادث؟
4. هل هناك أي تدخل فني مباشر على الأنظمة المتأثرة حالياً؟
5. هل تم كشف "جواهر التاج"؟ (بيانات الهوية، البيانات التنظيمية، الكود المصدري، الملكية الفكرية).
6. هل قام أحد بإعادة التشغيل (Reboot) أو تشغيل برنامج مكافحة الفيروسات (AV) للتنظيف؟
7. ما هو تاريخ آخر نسخة احتياطية سليمة؟
```

## الأدلة المتطايرة — الجمع قبل إعادة التشغيل

```terminal
# على نظام Linux مشتبه به (عبر SSH؛ تجنب إعادة التشغيل نهائياً)
date -u; uname -a; uptime; w
ps -auxfww > ps.txt
ss -tunap > netstat.txt
cat /proc/*/status 2>/dev/null > proc_status.txt
ls -la /proc/*/exe 2>/dev/null | grep deleted    # البحث عن ثنائيات تعمل رغم حذفها
crontab -l; cat /etc/cron*; ls -la /etc/cron.*/
ls -la /tmp /var/tmp /dev/shm
last -i; lastlog; faillog
journalctl -k --since='-24h' > kdmesg.txt
journalctl -u sshd --since='-24h' > ssh.txt
auditctl -l; ausearch -ts today
hash -p /usr/bin/sha256sum chk; chk /usr/bin/{ls,ps,netstat,ss,who,passwd,sshd}
# جمع الذاكرة (Memory Acquisition)
LiME / avml -o /mnt/evidence/$(hostname).mem
# أو عبر نسخة مباشرة من الذاكرة:
dd if=/dev/mem of=/mnt/evidence/mem.raw bs=1M
```

```terminal
# على نظام Windows مشتبه به (عبر PowerShell بصلاحيات أدمن)
Get-Date -Format o
Get-CimInstance Win32_ComputerSystem
Get-Process | Sort-Object WS -Desc | Select -First 30
Get-NetTCPConnection -State Established | Sort RemoteAddress
Get-CimInstance Win32_StartupCommand
Get-ScheduledTask | ? { $_.Author -notlike 'Microsoft*' }
Get-CimInstance -Namespace root\Subscription -ClassName __EventConsumer
gci 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run','HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce'
# البحث عن الملفات الحديثة في ProgramData (مكمن مفضل للملفات الخبيثة)
gci 'C:\ProgramData' -Recurse -File -Force | ? LastWriteTime -gt (Get-Date).AddDays(-7) | sort LastWriteTime -Desc | Select -First 50
```

> [!warning] تحذير: لا تبدأ بالتنظيف التلقائي (AV Cleanup)
> إجراءات "الحجر الصحي" (Quarantine) قد تحذف أدوات المهاجم التي تحتاجها لتحليل مؤشرات الاختراق (IOCs). اسحب العينات أولاً، خذ صورة للنظام ثانياً، ونظف في المرحلة الأخيرة.

## الاستحواذ السريع على الأدلة — KAPE / Velociraptor

```terminal
# أداة KAPE (ويندوز) — جمع الأدلة للفرز السريع خلال ~5 دقائق
kape.exe --tsource C: --tdest E:\IR\$ENV:COMPUTERNAME --target KapeTriage \
        --module !ALL --mdest E:\IR\$ENV:COMPUTERNAME\modules --mflush

# أداة Velociraptor — جمع الأدلة عبر وكلاء (Agents) على نطاق واسع
velociraptor-collector windows --output triage.zip
```

```terminal
# لنظام Linux — استخدام جامع الأدلة الموحد (UAC)
uac -p ir_triage -d. /opt/ir/uac
# يقوم بجمع ملفات الإعدادات، السجلات، تاريخ الأوامر، مفاتيح SSH، وحالة الحزم.
```

## تحليل الذاكرة باستخدام Volatility 3

```terminal
vol -f mem.raw windows.info                       # معلومات نظام التشغيل
vol -f mem.raw windows.pslist                     # قائمة العمليات (العلاقة بين الأب والابن)
vol -f mem.raw windows.psscan                     # كشف العمليات المخفية
vol -f mem.raw windows.cmdline                    # أوامر السطر البرمجي المنفذة
vol -f mem.raw windows.netscan                    # الاتصالات الشبكية وقت الالتقاط
vol -f mem.raw windows.malfind                    # البحث عن الكود المحقون (Injected Code)
vol -f mem.raw windows.svcscan                    # فحص إساءة استخدام الخدمات
vol -f mem.raw windows.hashdump                   # استخراج بصمات كلمات المرور (NT Hashes)
vol -f mem.raw windows.lsadump                    # استخراج الاعتمادات المخبأة (Secrets)

# لنظام Linux
vol -f mem.lime linux.bash                        # تاريخ أوامر bash من الذاكرة
vol -f mem.lime linux.elfs                        # البحث عن ملفات ELF الممسوحة (صيد الـ Rootkits)
```

## تحليل الجدول الزمني (Timeline Analysis)

```terminal
# أداة Plaso / log2timeline ← إنشاء الجدول الزمني الشامل (Super Timeline)
log2timeline.py --storage-file plaso.db /mnt/evidence
psort.py -o l2tcsv -w timeline.csv plaso.db "date >= '2026-04-25' AND date <= '2026-04-30'"

# نظرة سريعة أولية
python3 mactime -p -d -z UTC -y < bodyfile > timeline.txt
grep -E "(\.exe|\.dll|cron|temp|wget|curl|powershell)" timeline.txt | less
```

> [!tip] نصيحة: ركز الجدول الزمني حول "المريض صفر"
> حدد أقدم حدث ضار معروف (سجل دخول مشبوه، تنبيه EDR) وابحث في نطاق ±15 دقيقة حوله. أغلب نشاطات المهاجم تتركز في الدقائق الأولى من الحصول على موطئ قدم (Foothold).

## تحديد الضحية الأولى من "التيليمتري" المركزي

```kql
// Microsoft Defender — البحث عن أول تنفيذ لملف خبيث
DeviceFileEvents
| where SHA256 == "<known-bad-hash>"
| sort by Timestamp asc
| project Timestamp, DeviceName, ActionType, FolderPath, InitiatingProcessFileName
```

```kql
// أول اتصال بخادم القيادة والسيطرة (C2) عبر الشبكة
DeviceNetworkEvents
| where RemoteUrl has "evil-c2-domain"
| sort by Timestamp asc
| project Timestamp, DeviceName, AccountName, InitiatingProcessFileName
```

## إجراءات الاحتواء — دون إفساد الأدلة

| الإجراء | الأثر العملياتي | التكلفة الجنائية |
|--------|--------------|----------------|
| العزل الشبكي (EDR) | يوقف C2 والتحرك الجانبي | منخفضة - الوكيل يظل يعمل |
| تعطيل حساب المستخدم | يوقف استخدام الاعتمادات | متوسطة - ينهي الجلسات النشطة |
| فرض إعادة تعيين كلمة السر | يبطل رموز الوصول (Tokens) | متوسطة - تتطلب إعادة تعيين OAuth |
| تدوير المفاتيح (Cloud, NTDS) | يغلق سبل الاستمرارية | منخفضة |
| إعادة تثبيت الجهاز (Reimage) | تنظيف نهائي وشامل | مرتفعة جداً - تمسح كل الأدلة |
| فصل الكابل يدوياً | وقف فوري للاتصال | مرتفعة - تفقد الذاكرة المتطايرة |

## عثرات شائعة في DFIR (يقع فيها حتى الخبراء)

> [!danger] أخطاء قاتلة قد تدمر التحقيق
> 1. **إعادة تشغيل الجهاز المشتبه به**: لمحاولة "حل المشكلة" ← يؤدي لتدمير الذاكرة والاتصالات النشطة.
> 2. **بدء التنظيف قبل أخذ صورة للنظام**: تضيع مؤشرات الاختراق (IOCs) ولا يمكن تتبع مسار المهاجم.
> 3. **انفراد شخص واحد بكل المهام**: يؤدي للإجهاد، واحتمالية الخطأ، وكسر سلسلة حيازة الأدلة (Chain of Custody).
> 4. **إهمال التوثيق الفوري**: بعد عدة ساعات ستنسى تفاصيل حاسمة في تحليلك.
> 5. **نشر مؤشرات الاختراق علناً أثناء العملية**: قد يلاحظ الخصم ذلك ويغير أدواته، مما يفقدك القدرة على رصده.

## منهجية إدارة القضية (Case Management)

التنظيم البسيط يتفوق على الأنظمة المعقدة في وقت الأزمات:

```
incident-2026-04-30-acme/
  README.md             ← ملخص ما حدث، القائد المسؤول، الحالة الحالية
  TIMELINE.md           ← تحركات الخصم مرتبة زمنياً مع مراجع للأدلة
  ARTIFACTS/            ← الأدلة المجموعة (ملفات، ذاكرة، صور)
    host-srv01.zip
    host-srv01.mem
  IOCS/                 ← مؤشرات الاختراق (نطاقات، بصمات ملفات، IPs)
    domains.txt
    hashes.txt
  COMMS/                ← سجل التواصل مع الإدارة والقانونيين
  ANALYSIS/             ← مذكرات التحليل والنتائج الأولية
```

## دليل الأدوات السريع

| الحاجة | الأداة المقترحة |
|------|------|
| جمع أدلة ويندوز | KAPE, Velociraptor, CyLR |
| جمع أدلة لينكس | UAC, fastir, linux-explorer |
| استحواذ الذاكرة | WinPmem, avml, LiME |
| تحليل الذاكرة | Volatility 3, MemProcFS |
| تصوير الأقراص | dd, dcfldd, FTK Imager |
| بناء الجداول الزمنية | Plaso, log2timeline, Aurora-IR |
| الصيد والبحث الموسع | Velociraptor, Defender XDR, CrowdStrike |
| فحص الـ Yara | Loki, Thor-Lite |
| تحليل الملفات (Sandbox) | ANY.RUN, Hatching Triage |
