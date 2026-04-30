# دليل استخدام angr — الدليل الكامل

تُعدّ **angr** منصة متقدمة لتحليل الملفات الثنائية (Binary Analysis) مطورة بلغة Python من قِبل جامعة UCSB. تدمج المنصة بين المحمّل الساكن (Static Loader)، وباني مخططات تدفق التحكم (CFG Builder)، ومحاكي معالج متعدد البنى (`SimEngine`) والمحرك الشهير للتنفيذ الرمزي (Symbolic Execution Engine). تُستخدم الأداة على نطاق واسع في الاكتشاف الآلي للثغرات، وحل تحديات الـ CTF بشكل مؤتمت، وفك التعمية (Deobfuscation)، والمساعدة في الهندسة العكسية.

## التثبيت (Install)

```terminal
pip install angr
```

إضافات اختيارية يُوصى بها:

```terminal
pip install angr-management   # واجهة رسومية (GUI)
pip install angrop             # باني سلاسل ROP (ROP chain builder)
```

## المفاهيم الأساسية (Concepts)

| المصطلح | المعنى |
|------|--------|
| **المشروع (Project)** | ملف ثنائي محمل مع مكتباته |
| **الكتلة (Block)** | كتلة أساسية من التعليمات البرمجية |
| **الحالة (State)** | لقطة (Snapshot) للمعالج + الذاكرة + القيود البرمجية |
| **مدير المحاكاة (Simulation Manager)** | يدير عملية استكشاف الحالات وتتبعها |
| **المخزن (Stash)** | مجموعة مسماة من الحالات (`active`, `deadended`, `found`, `avoid`) |
| **القيمة الرمزية (Symbolic value)** | متجهات بت (Bit-vector) مع قيود (BVS) |
| **حلال القيود (Constraint Solver)** | محرك Z3 |

## مثال أساسي — الوصول إلى وظيفة معينة

البحث عن مدخل (Input) يوصلنا إلى دالة محددة:

```python
import angr, claripy

proj = angr.Project('./vuln', auto_load_libs=False)

# مدخل رمزي (Symbolic stdin)
input_len = 32
sym_in = claripy.BVS('in', 8 * input_len)

state = proj.factory.entry_state(stdin=sym_in,
        add_options={angr.options.SYMBOL_FILL_UNCONSTRAINED_MEMORY,
                     angr.options.SYMBOL_FILL_UNCONSTRAINED_REGISTERS})
sm = proj.factory.simulation_manager(state)

target = proj.loader.find_symbol('win').rebased_addr
avoid  = [proj.loader.find_symbol('die').rebased_addr]

sm.explore(find=target, avoid=avoid)
if sm.found:
    s = sm.found[0]
    print('Input:', s.posix.dumps(0))
```

تقوم `Project.factory.entry_state` ببناء حالة عند نقطة البداية `_start`. بينما تقوم `simulation_manager.explore` بتشغيل التنفيذ الرمزي حتى الوصول للهدف `find` أو الاصطدام بمسار يجب تجنبه `avoid`.

## خيارات الحالة المفيدة (State options)

```python
opts = {
    angr.options.LAZY_SOLVES,
    angr.options.SYMBOL_FILL_UNCONSTRAINED_MEMORY,
    angr.options.SYMBOL_FILL_UNCONSTRAINED_REGISTERS,
    angr.options.UNICORN,         # JIT عبر محرك Unicorn
    angr.options.STRICT_PAGE_ACCESS,
}
state = proj.factory.entry_state(add_options=opts)
```

وضع **UNICORN** يستخدم محرك Unicorn لتنفيذ الأجزاء الملموسة (Concrete) مما يزيد السرعة بشكل كبير، ثم يعود لوضع التنفيذ الرمزي الخالص عند وجود تفرعات (Branches).

## الاعتراض (Hooks) — استبدال الدوال

```python
@proj.hook(0x4012a0, length=5)         # عند هذا العنوان، تجاوز 5 بايتات
def my_strlen(state):
    state.regs.rax = 32

# أو استبدال عبر اسم الرمز (Symbol)
class strcmp_hook(angr.SimProcedure):
    def run(self, a, b):
        return claripy.BVS('strcmp_ret', 32)

proj.hook_symbol('strcmp', strcmp_hook())
```

تسمح `SimProcedure` باستبدال استدعاءات المكتبات بسلوكيات ملموسة أو رمزية مخصصة.

## الأنماط الشائعة (Common patterns)

### Crackme — إيجاد مدخل يطبع كلمة "Win!"

```python
proj = angr.Project('./crackme')
state = proj.factory.entry_state()
sm = proj.factory.simulation_manager(state)
sm.explore(find=lambda s: b'Win!' in s.posix.dumps(1))
print(sm.found[0].posix.dumps(0))
```

### تقييد المدخلات لرموز ASCII القابلة للطباعة

```python
for ch in chunks(sym_in, 8):
    state.solver.add(ch >= 0x20)
    state.solver.add(ch <= 0x7e)
```

### بناء مخطط تدفق التحكم (CFG construction)

```python
cfg = proj.analyses.CFGFast()
cfg = proj.analyses.CFGEmulated()        # أدق، ولكن أبطأ

for fn in cfg.kb.functions.values():
    print(hex(fn.addr), fn.name)
```

### فحص تمثيل VEX IR

```python
block = proj.factory.block(0x4012a0)
block.pp()           # فك التجميع (Disasm)
block.vex.pp()       # تمثيل VEX IR
```

## angrop — بناء سلاسل ROP عبر التنفيذ الرمزي

```python
import angrop
proj = angr.Project('./vuln')
rop = proj.analyses.ROP()
rop.find_gadgets()
chain = rop.execve(b'/bin/sh\x00')
chain.payload_str()
```

أبطأ من أدوات مثل ropper في المكتبات الضخمة، ولكنه يتفوق في إيجاد سلاسل (Chains) غير بديهية.

## نصائح لتحسين الأداء (Performance tips)

- **تحديد حجم المدخلات**: كل بايت رمزي إضافي يعني تفرعاً أسياً (Exponential branching).
- **استخدام محرك Unicorn**: (`add_options=...UNICORN`) للأجزاء الملموسة.
- **تفعيل Veritesting**: (`new_state(veritesting=True)`) لدمج المسارات وتقليل التشعب.
- **التنفيذ الرمزي الديناميكي (DSE)**: بدمج angr مع تتبعات أداة Frida.
- **تجنب تحميل المكتبات غير الضرورية**: (`auto_load_libs=False`).

## استكشاف الأخطاء وإصلاحها (Fixes)

| العرض | الحل |
|---------|-----|
| انفجار المسارات (Path explosion) | أضف قيوداً مبكرة؛ حدد حجم المدخلات؛ استخدم veritesting |
| انتهاء وقت الحلال (Solver timeout) | اضبط المهلة `state.solver.timeout = 10000` (بالملي ثانية)؛ بسّط التعبيرات |
| التنبيهات (Hooks) لا تعمل | تأكد من قاعدة PIE؛ أعد حساب العناوين باستخدام `loader.main_object.mapped_base` |
| خطأ في الذاكرة أثناء التشغيل | خيار `STRICT_PAGE_ACCESS` يرفض قراءة المؤشرات الرمزية؛ قم بإزالته أو استخدامه بحذر |
| اكتشاف بنية خاطئة للملف | حددها يدوياً: `Project(..., main_opts={'backend': 'elf', 'arch': 'amd64'})` |

## منظور المدافع (Defender perspective)

تستخدم فرق الاستجابة والبحث عن الثغرات angr من أجل:

- التحقق من أن التحديث (Patch) قد أغلق فعلياً المسار المؤدي للثغرة.
- التوليد الآلي لحالات الاختبار (Test cases) للوصول إلى التفرعات صعبة الوصول.
- التحقق من سلوك البرمجيات المضمنة (Firmware) التي خضعت للتعمية.

## أمن العمليات (OPSEC)

- التنفيذ الرمزي يستهلك موارد الذاكرة والمعالج بشكل هائل — يفضل تشغيله في بيئات معزولة لتجنب تجمد النظام.
- ملفات المشروع قد تحتوي على لقطات لذاكرة النظام — تعامل مع الملفات الثنائية الحساسة بحذر.

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **Triton** | تنفيذ رمزي وتجميعي (Concolic)، أخف وزناً |
| **manticore** | بديل من تطوير Trail of Bits |
| **KLEE** | تنفيذ رمزي على مستوى LLVM bytecode |
| **S2E** | تنفيذ رمزي لكامل النظام (Whole-system) |
| **Jakstab / BAP** | منصات تحليل ملفات ثنائية مبنية على IR |
| **angr-management** | الواجهة الرسومية الرسمية لـ angr |
