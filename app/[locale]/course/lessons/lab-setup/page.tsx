"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="lab-setup">
      <L
        ar={<>
          <Section title="ليه لازم تبني المعمل قبل أي حاجة تانية؟">
            <p>كل تقنية في الكورس ده بتفترض إن عندك مكان <b>قانوني وآمن</b> تجرّب فيه. المعمل البيتي = VMs معزولة. ما تلمسش الإنترنت، ما تلمسش شبكة بيتك، ومحدش بيتأذى لو حاجة انفجرت جوّه.</p>
            <Callout kind="danger" title="القاعدة الذهبية — مفيش استثناء">
              ما تنفّذش أي تقنية من الدروس على شبكة بيتك ولا الشركة ولا أي نظام مش بتاعك. كل حاجة جوّه الـ VMs المعزولة بس. ولو في شك، اعتبره ممنوع.
            </Callout>
          </Section>

          <Section title="المتطلبات الأساسية">
            <ul>
              <li><b>حاسوب مضيف</b>: 16GB RAM (الحد الأدنى 8GB)، 200GB قرص فارغ، CPU يدعم virtualization (VT-x/AMD-V).</li>
              <li><b>VirtualBox</b> (مجاني) أو <b>VMware Workstation Player</b>.</li>
              <li>صور ISO: Kali Linux، Windows 10/11 trial، Ubuntu 22.04 Server، Windows Server 2022 evaluation.</li>
              <li>اتصال إنترنت لتحميل الصور أول مرة فقط.</li>
            </ul>
          </Section>

          <Section title="بناء البيئة — خطوة بخطوة">
            <Step n={1} title="تثبيت VirtualBox">
              <Terminal lines={[
                { p: "# على Ubuntu/Debian:" },
                { p: "sudo apt update && sudo apt install virtualbox virtualbox-ext-pack" },
                { p: "# على Windows: حمّل من virtualbox.org و شغّل installer" },
                { p: "# على macOS: brew install --cask virtualbox" },
              ]} />
            </Step>
            <Step n={2} title="إنشاء شبكة معزولة">
              <p>هذه أهم خطوة. الـ VMs ستتكلم مع بعضها لكن لن تصل للإنترنت أو شبكة بيتك.</p>
              <Terminal lines={[
                { p: "# في VirtualBox: File → Host Network Manager → Create" },
                { p: "# أعطها اسم vboxnet0 و subnet 10.10.10.0/24" },
                { p: "# DHCP: enable" },
                { p: "" },
                { p: "# أو من سطر الأوامر:" },
                { p: "VBoxManage hostonlyif create" },
                { p: "VBoxManage hostonlyif ipconfig vboxnet0 --ip 10.10.10.1 --netmask 255.255.255.0" },
              ]} />
            </Step>
            <Step n={3} title="VM 1 — Kali Linux (المهاجم)">
              <ul>
                <li>حمّل صورة Kali من <span className="eng">kali.org/get-kali</span> (VirtualBox image جاهزة).</li>
                <li>RAM: 4GB، CPUs: 2، Disk: 40GB.</li>
                <li>Network: <b>Host-only Adapter</b> = vboxnet0.</li>
                <li>كلمة سر افتراضية: <span className="eng">kali / kali</span>.</li>
              </ul>
            </Step>
            <Step n={4} title="VM 2 — Windows 10 (الضحية)">
              <ul>
                <li>حمّل ISO من <span className="eng">microsoft.com/software-download/windows10</span>.</li>
                <li>RAM: 4GB، CPUs: 2، Disk: 60GB.</li>
                <li>Network: Host-only adapter = vboxnet0.</li>
                <li>أنشئ مستخدم محلي عادي (لا تدخل بحساب Microsoft).</li>
                <li><b>Snapshot</b> فور الانتهاء من التثبيت — هذا ما ترجع إليه بعد كل تجربة.</li>
              </ul>
            </Step>
            <Step n={5} title="VM 3 — Ubuntu Server (هدف Linux)">
              <p>صورة Ubuntu 22.04 Server. ثبّت Apache + MySQL + PHP لتدريب SQLi و LFI.</p>
              <Code lang="bash">{`sudo apt update
sudo apt install -y apache2 mysql-server php libapache2-mod-php php-mysql
sudo systemctl enable --now apache2 mysql`}</Code>
            </Step>
            <Step n={6} title="مختبر AD اختياري — للتدريب المتقدم">
              <p>Windows Server 2022 evaluation + ترقيته إلى Domain Controller. الأسهل: مشروع <span className="eng">GOAD (Game Of Active Directory)</span> على GitHub — يبني بيئة AD متعددة الـ DCs بـ vulnerabilities متعمدة بـ command واحد.</p>
              <Terminal lines={[
                { p: "git clone https://github.com/Orange-Cyberdefense/GOAD" },
                { p: "cd GOAD && ./goad.sh -t install -l GOAD-Light -p virtualbox" },
              ]} />
            </Step>
          </Section>

          <Section title="عادات لازم تمشي عليها في المعمل">
            <ol>
              <li><b>Snapshot قبل أي تجربة.</b> اسم واضح: <span className="eng">clean-win10-baseline</span>. مش هتندم.</li>
              <li><b>وثّق اللي عملته</b> في ملف نصي جوّه كل VM. النسيان عدو التعلم.</li>
              <li><b>ما تخليش الـ VM على Bridged adapter</b> إلا لو فاهم بتعمل إيه — ده بيحطها على شبكة بيتك مباشرة.</li>
              <li><b>اعزل البيانات</b>: ما تنسخش ملفاتك الشخصية جوّه أي VM.</li>
              <li><b>قفل الـ VMs</b> لما ما تكونش بتستخدمها — بتاكل RAM على الفاضي.</li>
            </ol>
          </Section>

          <Section title="مختبرات جاهزة بديلة (إن لم تشأ بناء)">
            <TwoCol>
              <Card title="HackTheBox" color="amber">منصة آلات اختراق متدرجة. الأشهر للتدرب الفعلي.</Card>
              <Card title="TryHackMe" color="green">للمبتدئين — مسارات مرتبة، شروحات مدمجة.</Card>
              <Card title="VulnHub" color="green">صور VM مجانية تحمّلها وتختبرها محلياً.</Card>
              <Card title="PortSwigger Web Academy" color="amber">للويب فقط — مجاني، ممتاز.</Card>
            </TwoCol>
          </Section>

          <Section title="الخطوة التالية">
            <p>بعد إكمال هذا الدرس، انتقل إلى:</p>
            <ul>
              <li><b>linux-fundamentals</b> — لتفهم Kali و Ubuntu.</li>
              <li><b>windows-fundamentals</b> — لتفهم Windows من زاوية الأمن.</li>
              <li><b>networking-basics</b> — قبل أي recon.</li>
            </ul>
          </Section>
        </>}
        en={<>
          <Section title="Why a lab comes before everything">
            <p>Every technique in this course assumes you have a <b>legal, safe place</b> to practice. A home lab = isolated VMs. They don&apos;t touch the internet, your home network, or anyone else — so nothing breaks if something explodes.</p>
            <Callout kind="danger" title="The golden rule">
              Never run any technique from these lessons on your home, work, or any system you don&apos;t own. Everything stays inside isolated VMs.
            </Callout>
          </Section>

          <Section title="Requirements">
            <ul>
              <li><b>Host machine:</b> 16 GB RAM (8 GB minimum), 200 GB free disk, CPU with VT-x/AMD-V virtualization.</li>
              <li><b>VirtualBox</b> (free) or <b>VMware Workstation Player</b>.</li>
              <li>ISOs: Kali Linux, Windows 10/11 trial, Ubuntu 22.04 Server, Windows Server 2022 evaluation.</li>
              <li>Internet only for the initial download.</li>
            </ul>
          </Section>

          <Section title="Building the lab — step by step">
            <Step n={1} title="Install VirtualBox">
              <Terminal lines={[
                { p: "# Ubuntu/Debian:" },
                { p: "sudo apt update && sudo apt install virtualbox virtualbox-ext-pack" },
                { p: "# Windows: download from virtualbox.org and run the installer" },
                { p: "# macOS: brew install --cask virtualbox" },
              ]} />
            </Step>
            <Step n={2} title="Create an isolated network">
              <p>The most important step. The VMs will talk to each other but never reach the internet or your home LAN.</p>
              <Terminal lines={[
                { p: "# In VirtualBox: File → Host Network Manager → Create" },
                { p: "# Name it vboxnet0 with subnet 10.10.10.0/24, DHCP enabled" },
                { p: "" },
                { p: "# Or from CLI:" },
                { p: "VBoxManage hostonlyif create" },
                { p: "VBoxManage hostonlyif ipconfig vboxnet0 --ip 10.10.10.1 --netmask 255.255.255.0" },
              ]} />
            </Step>
            <Step n={3} title="VM 1 — Kali Linux (the attacker)">
              <ul>
                <li>Download from <span className="eng">kali.org/get-kali</span> (pre-built VirtualBox image).</li>
                <li>RAM: 4 GB, CPUs: 2, Disk: 40 GB.</li>
                <li>Network: <b>Host-only Adapter</b> = vboxnet0.</li>
                <li>Default credentials: <span className="eng">kali / kali</span>.</li>
              </ul>
            </Step>
            <Step n={4} title="VM 2 — Windows 10 (the victim)">
              <ul>
                <li>Get the ISO from <span className="eng">microsoft.com/software-download/windows10</span>.</li>
                <li>RAM: 4 GB, CPUs: 2, Disk: 60 GB.</li>
                <li>Network: host-only adapter = vboxnet0.</li>
                <li>Create a local user (don&apos;t sign in with a Microsoft account).</li>
                <li><b>Snapshot</b> immediately after install — this is your roll-back point.</li>
              </ul>
            </Step>
            <Step n={5} title="VM 3 — Ubuntu Server (Linux target)">
              <p>Ubuntu 22.04 Server. Install Apache + MySQL + PHP for SQLi and LFI practice.</p>
              <Code lang="bash">{`sudo apt update
sudo apt install -y apache2 mysql-server php libapache2-mod-php php-mysql
sudo systemctl enable --now apache2 mysql`}</Code>
            </Step>
            <Step n={6} title="Optional AD lab — for advanced training">
              <p>Windows Server 2022 evaluation promoted to a Domain Controller. The easiest path: <span className="eng">GOAD (Game Of Active Directory)</span> on GitHub — builds a multi-DC vulnerable AD environment with one command.</p>
              <Terminal lines={[
                { p: "git clone https://github.com/Orange-Cyberdefense/GOAD" },
                { p: "cd GOAD && ./goad.sh -t install -l GOAD-Light -p virtualbox" },
              ]} />
            </Step>
          </Section>

          <Section title="Core lab habits">
            <ol>
              <li><b>Snapshot before every experiment.</b> Use clear names: <span className="eng">clean-win10-baseline</span>.</li>
              <li><b>Document what you did</b> in a notes file inside each VM. Forgetting kills learning.</li>
              <li><b>Never set a VM to Bridged</b> unless you know what you&apos;re doing — that puts it on your home LAN.</li>
              <li><b>Isolate data:</b> never copy personal files into a VM.</li>
              <li><b>Power off</b> idle VMs (they consume RAM).</li>
            </ol>
          </Section>

          <Section title="Ready-made alternatives (if you don&apos;t want to build)">
            <TwoCol>
              <Card title="HackTheBox" color="amber">Tiered hacking machines. The most popular real-practice platform.</Card>
              <Card title="TryHackMe" color="green">Beginner-friendly — guided rooms with built-in walkthroughs.</Card>
              <Card title="VulnHub" color="green">Free VM images you download and run locally.</Card>
              <Card title="PortSwigger Web Academy" color="amber">Web-only — free and excellent.</Card>
            </TwoCol>
          </Section>

          <Section title="Next">
            <p>After this lesson, move to:</p>
            <ul>
              <li><b>linux-fundamentals</b> — to actually use Kali and Ubuntu.</li>
              <li><b>windows-fundamentals</b> — Windows from a security angle.</li>
              <li><b>networking-basics</b> — before any recon.</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
