# تصعيد الصلاحيات في لينكس: إزاي تتحول من &quot;ضيف&quot; لـ &quot;ملك&quot; السيرفر؟

معاك Shell على سيرفر لينكس. صلاحياتك تعبانة (low-priv). تعمل إيه؟

تقعد تتفرّج؟
تشغّل linpeas وتدوس أول &quot;أخضر&quot; تلاقيه؟
تحمّل أول CVE من GitHub وتجرّبه؟

كل واحدة من دول هتورّيك أمّك.

عشان تبقى الـ &quot;ملك&quot; (root)، لازم تلاقي خرم في قلب النظام.. في الـ **Kernel**.

بس خلّيني أقولك كلمة سر: الـ Kernel ده &quot;المقدس&quot; بتاع النظام. لو حاولت تخترقه وانت مش فاهم بتعمل إيه، السيرفر هيقع منك (Kernel Panic)، الـ logs هتمتلي بصراخ، وفي الصبح هتلاقي 5 alerts على dashboard الـ blue team. هتتجاب في ثانية.

الهكر الشاطر مش اللي بيجري ورا أي أخضر يشوفه في linpeas. الشاطر اللي بيفهم السيرفر بيفكّر إزاي قبل ما يلمسه.

> [!warning] تنبيه
> تجربة ثغرات الـ Kernel في سيرفرات حقيقية &quot;مخاطرة&quot; كبيرة. السيرفر ممكن يموت منك لو الـ exploit مش مضبوط على النسخة بالظبط. جرّب في Lab الأول، وبعدين على بيئة الإنتاج.

## ليه الـ Kernel هو الباب الكبير؟

الـ Kernel بيتحكم في كل حاجة: الذاكرة، المعالج، الملفات، الشبكة. لو قدرت تضحك عليه وتخلّيه يفتكر إنك root، الموضوع انتهى.

بس مش سهل. فيه &quot;حراس&quot; (mitigations) وظيفتهم يمنعوك:

- **KASLR**: بيخبّي أماكن الـ Kernel في الذاكرة عشان ما تعرفش تضرب فين.
- **SMEP/SMAP**: بيمنعوا الـ Kernel إنه ينفّذ أو يقرا كود جاي من user عادي زيّك.
- **KPTI**: بيفصل page tables بتاعة kernel عن user — رد فعل لـ Meltdown.
- **kptr_restrict**: بيخبّي عناوين الـ kernel symbols من <code>/proc/kallsyms</code>.

عشان تعدّي الحراس دول، لازم تكون &quot;جرّاح&quot; مش &quot;جزّار&quot;.

## ثغرات &quot;الزتونة&quot; (الحديثة والمشهورة)

### 1. DirtyPipe (CVE-2022-0847)

ثغرة عبقرية وبسيطة في نفس الوقت. كانت بتسمح لك تكتب في أي ملف (حتى لو ملوش صلاحيات كتابة) عن طريق &quot;خرم&quot; في طريقة تعامل النظام مع الـ pipes.

السبب التقني: الـ kernel نسي يعمل reset لـ flag معيّن (<code>PIPE_BUF_FLAG_CAN_MERGE</code>) في scenario محدد، فأي page cache كانت بتدخل الـ pipe ممكن تتعدّل في مكانها — حتى لو الملف الأصلي read-only للـ user.

**النتيجة**: تقدر تعدّل ملف <code>/etc/passwd</code> وتحط لنفسك user root في ثواني. أو تعدّل suid binary موثوق.

### 2. nftables (CVE-2024-1086)

ثغرة شاملة وخطيرة جداً ظهرت في 2024. بتستغل غلطة في إدارة الذاكرة (Use-After-Free) في نظام الفلترة بتاع لينكس.

ليه دي زتونة؟ لأن أغلب التوزيعات مفعّلة <code>User Namespaces</code> لليوزرز العاديين، فالموضوع بقى &quot;بوفيه مفتوح&quot; لأي حد عايز يبقى root.

```terminal
# لو لقيت السيرفر عليه النسخة دي، فإنت غالباً بقيت root
# بس اتأكد الأول إن unprivileged_userns_clone مفعّلة
cat /proc/sys/kernel/unprivileged_userns_clone

# لو القيمة 1، يبقى السكة مفتوحة. لو 0، الإدارة قفلتها (مدافع شاطر).
uname -r              # ليه: لازم تعرف النسخة بالظبط قبل أي exploit
cat /etc/os-release   # ليه: التوزيعات بترقّع بسرعات مختلفة
```

### 3. PwnKit (CVE-2021-4034)

مش kernel exploit بالظبط، بس بيستحق الذكر — ثغرة في <code>pkexec</code> (suid binary موجود من 2009) بتدّيك root في خطوة واحدة. لو السيرفر متأخّر شوية في الـ patching، دي أول حاجة تجرّبها قبل ما تلعب في الـ kernel.

## &quot;العبث&quot; التقني مقابل الاحتراف

فيه ناس بتعمل إيه؟ تدخل تشغّل <code>linux-exploit-suggester</code>، تحمّل أول exploit يلاقيه على GitHub، تشغّله.. بوم! السيرفر وقع. وbye-bye للعملية كلها.

**الصح إيه؟**

```terminal
# 1. افهم النسخة بالظبط
uname -r                          # ليه: kernel الـ exploits بتفرق patch واحد
cat /etc/os-release               # ليه: Ubuntu vs RHEL بيرقّعوا في توقيتات مختلفة
dpkg -l | grep linux-image        # على Debian/Ubuntu

# 2. شوف إيه الحماية المتفعّلة
cat /proc/sys/kernel/randomize_va_space   # ASLR
cat /proc/sys/kernel/kptr_restrict        # symbol leak protection
cat /proc/sys/kernel/yama/ptrace_scope    # debugging restrictions
cat /proc/sys/kernel/unprivileged_userns_clone   # zatona key

# 3. اقرأ الكود بتاع الـ exploit وافهم هو بيعمل إيه
#    قبل ما ترفعه على السيرفر. مش مرة واحدة، عشر مرات.
```

غلطات الـ junior:

1. **بيرفع exploit ما قراهوش** — ممكن يكون فيه backdoor لمؤلف الـ exploit، أو بيبعت بيانات لـ C2 خارجي.
2. **ما بيجرّبش في lab الأول** — kernel panic على prod = توقيت سيء جداً جداً.
3. **بيعتمد على linpeas بس** — linpeas بيستخدم regex matching، بيتجاهل nuance. اقرا <code>/etc/passwd</code> بنفسك.
4. **بينسى يمسح آثاره** — bash history، tmp files، modified binaries. كل ده forensics evidence ضدّك.

## نصيحة للمدافعين: اقفلوا الأبواب

لو عايز تحمي سيرفراتك من &quot;العك&quot; ده، 4 زراير لو قفلتهم، هتصعّب المهمة على 90% من الهكرز:

1. **قفل الـ User Namespaces لليوزرز العاديين**: <code>echo 0 &gt; /proc/sys/kernel/unprivileged_userns_clone</code>. ده بيقتل فئة كاملة من الثغرات الحديثة.
2. **تعطيل الـ eBPF لليوزرز العاديين**: <code>kernel.unprivileged_bpf_disabled=1</code>. خرم كبير بيطلع منه ثغرات كل سنة.
3. **التحديث المستمر**: مفيش بديل عن الـ Security Patches. KSPP و KernelCare يساعدوا في live patching من غير reboot.
4. **kptr_restrict + dmesg_restrict**: متخلّيش معلومات الـ kernel متاحة لأي user.

والأهم: **متعتمدش على الـ kernel hardening لوحده**. زي ما البوّاب يقفل الباب الكبير ويسيب شباك الحمام مفتوح — لو الـ container مش معزول صح، الـ kernel hardening مش هيفرق.

## الخلاصة الناشفة

تصعيد الصلاحيات في لينكس &quot;شطرنج&quot;.

المهاجم بيدوّر على غلطة في المنطق. المدافع بيحاول يقفل السكك. اللي بيكسب اللي بيفهم الكود من الجوّه — مش اللي بيحفظ exploits من برّه.

لو عايز تنجح، لازم تكون نضيف في شغلك. ما تسيبش وراك أثر لـ kernel panic يفضح العملية كلها. ولو في شك، اوقف ثانيتين واسأل: &quot;هل ده هيكسر السيرفر؟&quot;. لو الإجابة &quot;ممكن&quot;، روح الـ lab.

اللي بيفرّق بين الـ professional والـ kid: التواضع. اعرف حدودك، ولو الموضوع أكبر منك، ابعت لـ team senior. مفيش عيب.
