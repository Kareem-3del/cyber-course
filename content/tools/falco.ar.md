# دليل Falco الكامل — أمن العمليات في السحاب (Cloud-Native Runtime Security)

تُعد `Falco` المحرك القياسي لأمن وقت التشغيل (Runtime Security) في البيئات السحابية. تعتمد الأداة على تقنية eBPF (أو وحدة النواة "Kernel Module") لمراقبة استدعاءات النظام (Syscalls) واستهلاك سجلات تدقيق Kubernetes (K8s Audit Logs). تأتي Falco محملة مسبقاً بقواعد تكتشف هجمات الهروب من الحاويات (Container Escapes)، العمليات المشبوهة داخل الحاويات، وإساءة استخدام `kubectl`.

## التثبيت (Install)

```terminal
# باستخدام Helm — الطريقة الأكثر شيوعاً
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco --namespace falco --create-namespace \
  --set tty=true --set falco.json_output=true \
  --set driver.kind=modern_ebpf
```

```terminal
# التثبيت المستقل على Linux
curl -sLO https://download.falco.org/packages/bin/$(uname -m)/falco-latest-$(uname -m).tar.gz
sudo tar -xvf falco-*.tar.gz -C /usr/local --strip-components=1
sudo falco
```

## المكونات (Components)

- **المشغل (Driver)**: يدعم eBPF الحديث (`modern_ebpf`) أو النسخة التقليدية (`ebpf`) أو وحدة النواة (`kmod`). يفضل دائماً استخدام eBPF الحديث.
- **عملية Falco (Process)**: تقوم بقراءة استدعاءات النظام وسجلات تدقيق K8s، وتحليلها بناءً على القواعد، ثم إرسال التنبيهات.
- **Falcosidekick**: وسيط يقوم بتوجيه التنبيهات إلى Slack / Teams / SIEM أو وظائف سحابية (Functions).
- **Falco Talon**: محرك الاستجابة التلقائية — يقوم بالرد على التنبيهات (مثل قتل الحاوية المصابة، عزلها، أو وسمها).

## هيكلية القواعد - YAML (Rule Syntax)

```yaml
- rule: Terminal shell in container
  desc: تم اكتشاف تشغيل واجهة أوامر (Shell) داخل حاوية مع وجود طرفية متصلة (TTY).
  condition: >
    spawned_process and container
    and shell_procs and proc.tty != 0
    and container_entrypoint
  output: >
    تم تشغيل Shell داخل حاوية (المستخدم=%user.name المعرف=%container.id الصورة=%container.image.repository)
  priority: NOTICE
  tags: [container, shell, mitre_execution]
```

تعتمد القواعد على الماكرو (`macros`) مثل `shell_procs` لتسهيل الكتابة؛ يمكن مراجعة الدليل الرسمي للتفاصيل الدقيقة.

## فئات التنبيهات الشائعة (Default Ruleset)

| القاعدة | ما يتم رصده |
|------|-----------------|
| `Terminal shell in container` | تشغيل واجهة أوامر (Shell) داخل حاوية نشطة |
| `Write below etc` | محاولة كتابة ملفات داخل مجلد `/etc` من عمليات غير مصرح لها |
| `Read sensitive file untrusted` | محاولة قراءة ملفات حساسة مثل `/etc/shadow` أو المفاتيح الخاصة |
| `Run shell untrusted` | تشغيل واجهة أوامر من عمليات الويب أو قواعد البيانات |
| `System Procs Network Activity` | عمليات النظام (مثل `ssh`, `mount`) التي تقوم بنشاط شبكي |
| `Launch Privileged Container` | إنشاء حاوية بصلاحيات كاملة (Privileged) |
| `Container Drift Detected` | كتابة ملف جديد أو تشغيله داخل حاوية أثناء تشغيلها (تغير الحالة) |
| `Outbound Connection to C2 Servers` | الاتصال بخوادم القيادة والسيطرة بناءً على بيانات استخبارات التهديدات |
| `Unexpected K8s Token Access` | الوصول إلى رموز SA الخاصة بـ Kubernetes من مسارات غير متوقعة |

## واجهة السطر البرمجي (CLI)

| الأمر | الغرض |
|---------|---------|
| `falco -c /etc/falco/falco.yaml` | التشغيل باستخدام ملف إعدادات محدد |
| `falco --rules-file <yaml>` | إضافة قواعد إضافية للفحص |
| `falco --validate <rules.yaml>` | التحقق من صحة بناء القواعد (Linting) |
| `falco --print-version` | عرض معلومات الإصدار |
| `falcoctl artifact install <ref>` | تحميل حزم القواعد أو الإضافات من المستودع الرسمي |
| `falcoctl artifact follow` | التحديث التلقائي للقواعد من المصدر |

## المخرجات والتكامل (Output / Integration)

```yaml
# falco.yaml
http_output:
  enabled: true
  url: http://falcosidekick:2801/

json_output: true
priority: notice  # الحد الأدنى من الخطورة لإرسال التنبيه
```

يمكن لـ `Falcosidekick` توزيع التنبيهات إلى مجمعة واسعة من المنصات: Slack, OpsGenie, Loki, Splunk, AWS Security Hub, GCP Pub/Sub, OpenSearch, Kafka, وغيرها.

## سير العمل (Workflows)

### كشف استخدام `kubectl exec` للدخول إلى Pod
تعتبر قاعدة `Terminal shell in container` هي المسؤولة عن ذلك. للتوجيه إلى Slack:

```terminal
helm upgrade falco falcosecurity/falco \
  --set falcosidekick.enabled=true \
  --set falcosidekick.config.slack.webhookurl=https://hooks.slack.com/...
```

### التكامل مع سجلات تدقيق Kubernetes (K8s Audit Log)

```yaml
plugins:
  - name: k8saudit
    library_path: libk8saudit.so
    init_config:
      maxEventBytes: 1048576
    open_params: '"http://0.0.0.0:9765/k8s-audit"'

load_plugins: [k8saudit]
```

بعد ذلك، يتم توجيه الـ API Server لإرسال الأحداث إلى Webhook الخاص بـ Falco؛ مما يفعل قواعد `k8saudit` الخاصة بالأمان الإداري للـ Cluster.

### الاستجابة التلقائية باستخدام Falco Talon

```yaml
- name: KillPodOnRule
  match:
    rules:
      - "Terminal shell in container"
  actions:
    - action: kubernetes:kill-pod
      parameters:
        grace_period_seconds: 0
```
بمجرد انطلاق التنبيه، سيقوم Talon بقتل الـ Pod المصاب في غضون ثوانٍ.

## معالجة المشاكل (Bad Output / Fixes)

| العرض | الحل |
|---------|-----|
| تنبيهات مكثفة من عمليات تصحيح شرعية | قم بضبط القاعدة باستثناءات (Exceptions) بناءً على الـ Namespace أو الوسوم |
| نقص في التنبيهات | تحقق من تحميل المشغل عبر: `falco --print-version` و `dmesg | grep falco` |
| فشل eBPF على أنوية قديمة | انتقل لاستخدام مشغل وحدة النواة `kmod` |
| القواعد قديمة | استخدم `falcoctl artifact install` للتحديث، ثم `falco --validate` |

## الضبط الدقيق (Tuning)

تعتمد جودة مخرجات Falco على الضبط. النمط القياسي للضبط:
1. تشغيل القواعد الافتراضية لمدة أسبوع.
2. تصنيف التنبيهات بناءً على `القاعدة + صورة الحاوية`.
3. لكل قاعدة تطلق تنبيهات عالية من تطبيقات معروفة وشرعية، أضف استثناءً (Exception) داخل القاعدة.
4. كرر العملية حتى يصبح حجم التنبيهات حقيقياً ومفيداً (High Fidelity).

## أدوات ذات صلة

| الأداة | التخصص |
|------|-------|
| **Tetragon** | تعتمد على eBPF أيضاً، ولكن بمحرك قواعد مختلف (خاص بـ Cilium) |
| **Tracee** | مبنية على eBPF، تركز أكثر على الجوانب الجنائية (Forensics) |
| **kube-bench** | فحص إعدادات Kubernetes الثابتة مقابل معايير CIS |
| **Sysmon for Linux** | سجلات أحداث بنمط ويندوز لنظام لينكس |
| **AuditBeat** | نقل سجلات التدقيق دون محرك قواعد مدمج |
