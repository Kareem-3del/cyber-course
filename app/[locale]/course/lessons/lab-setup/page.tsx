"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="lab-setup">
      <L
        ar={<>
          <Section title="ليه لازم تبني المعمل قبل أي حاجة تانية؟">
            <p>تخيل السيناريو ده. أنت قاعد بجهازك الشخصي، عايز تتعلم AD attacks. فتحت Kali، شغّلت <span className="eng">nmap -sS</span> على شبكة بيتك "علشان تجرّب". بعد ساعتين، الـ ISP بعتلك إيميل: "نشاط مشبوه على الـ line بتاعك". أو أسوأ: أنت قاعد على wifi الشغل، الـ SOC شافك، خرجت من الشغل ومعاك خطاب إنذار.</p>
            <p>ليه حصل ده؟ علشان ما عندكش معمل.</p>
            <p>المعمل = شوية VMs معزولة. ما بتلمسش الإنترنت، ما بتلمسش شبكة بيتك، ولا بتلمس أي حاجة بتاعة حد تاني. لو حاجة انفجرت جوّه، تنفجر هناك وتقف. snapshot، ارجع، كمّل.</p>
            <p>كل درس في الكورس ده بيفترض إن المعمل ده موجود. مفيش "أنا هجرب بسرعة على الـ router بتاع البيت". لا.</p>
            <Callout kind="danger" title="اوعى تنسى السطر ده — مفيش استثناء">
              ما تنفّذش أي تقنية من الدروس على شبكة بيتك، ولا الشركة، ولا حتى wifi الكافيه. كل حاجة جوّه الـ VMs المعزولة. ولو عندك شك لحظة واحدة "هل ده عادي؟" — يبقى مش عادي.
            </Callout>
            <Callout kind="danger" title="حصلت فعلاً">
              زميل ليّا كان في فترة التعلم، شغّل <span className="eng">responder</span> على لابتوب الشغل في الـ break room "علشان يشوف هيطلع إيه". طلعت hashes للـ DC. الـ SOC قفل اللابتوب في 4 دقايق. اتحوّل لـ HR. فقد شغله.
              <br /><br />
              التقنية مكنتش غلط. المكان كان غلط. <b>المعمل بيحميك من نفسك قبل ما يحميك من القانون.</b>
            </Callout>
          </Section>

          <Section title="القصة كاملة — ابني المعمل في 30 دقيقة">
            <p>هنمشي مع بعض دلوقتي خطوة بخطوة. الهدف: بعد نص ساعة يكون عندك Kali + Windows + Ubuntu، كلهم على شبكة معزولة، وكل واحد فيهم عليه snapshot نضيف ترجع له لما تخرّب حاجة (وهتخرّب).</p>
            <ul>
              <li><b>الجهاز المضيف:</b> 16GB RAM (الحد الأدنى 8GB، بس هتعاني)، 200GB قرص فاضي، CPU بيدعم virtualization. روح <span className="eng">BIOS</span> وفعّل <span className="eng">VT-x/AMD-V</span> — لو مش مفعّلة، الـ VMs هتزحف.</li>
              <li><b>الـ Hypervisor:</b> VirtualBox مجاني وكفاية للبداية. VMware Workstation أسرع شوية بس مدفوع. ما تبدأش بـ Hyper-V لو ما تعرفوش — بيتعارض مع VirtualBox على نفس الجهاز.</li>
              <li><b>الـ ISOs اللي محتاجها:</b> Kali Linux (image جاهزة من kali.org)، Windows 10/11 trial من Microsoft، Ubuntu 22.04 Server، و — لو هتلعب AD — Windows Server 2022 evaluation.</li>
              <li><b>الإنترنت:</b> محتاجه مرة واحدة بس — تنزّل الصور وخلاص. بعدها افصل الـ VMs.</li>
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
            <Step n={2} title="إنشاء شبكة معزولة — أهم خطوة في الدنيا">
              <p>بُص. لو عملت كل حاجة صح وفشلت في الخطوة دي، أنت لسه على شبكة بيتك. الـ VMs لازم يتكلموا مع بعض، بس ما يوصلوش للإنترنت ولا للراوتر بتاعك.</p>
              <p>VirtualBox عنده 4 أنواع networking لازم تعرف الفرق بينهم:</p>
              <ul>
                <li><b>NAT:</b> الـ VM بيوصل للإنترنت من خلال الجهاز. آمن نسبياً، بس مش هينفع لو عايز VMs يكلموا بعض.</li>
                <li><b>Bridged:</b> الـ VM بياخد IP من الراوتر بتاعك مباشرة. <b>كأنه جهاز تاني في بيتك.</b> أي scan بتعمله بيظهر للـ ISP. <span style={{color: '#ff6b6b'}}>ابعد عنه.</span></li>
                <li><b>Host-only:</b> شبكة معزولة تماماً بين الـ VMs والجهاز المضيف بس. مفيش إنترنت. <b>ده اللي عايزينه.</b></li>
                <li><b>Internal:</b> VMs بيكلموا بعض بس، الجهاز المضيف نفسه مش شايفهم. للسيناريوهات الأكثر عزلاً.</li>
              </ul>
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
                <li>حمّل image جاهزة من <span className="eng">kali.org/get-kali</span> — اختار "Virtual Machines" → VirtualBox. ما تنزّلش الـ ISO وتثبت من الأول، ضيعة وقت.</li>
                <li><b>RAM:</b> 4GB كافية. لو هتشغّل Burp Suite + Bloodhound مع بعض، خليها 6GB.</li>
                <li><b>CPUs:</b> 2 cores. أكتر من كده مش هيفرق إلا في الـ wordlist cracking.</li>
                <li><b>Disk:</b> 40GB dynamic. الصورة الأساسية 15GB، الباقي للـ tools اللي هتنزّلها.</li>
                <li><b>Network:</b> Host-only Adapter = vboxnet0. مش NAT. مش Bridged.</li>
                <li>كلمة سر افتراضية: <span className="eng">kali / kali</span>. غيّرها أول حاجة.</li>
                <li><b>Snapshot:</b> بعد ما تخلّص setup وتعمل update — اسم الـ snapshot: <span className="eng">kali-clean-base</span>.</li>
              </ul>
            </Step>
            <Step n={4} title="VM 2 — Windows 10 (الضحية)">
              <ul>
                <li>نزّل الـ ISO من <span className="eng">microsoft.com/software-download/windows10</span>. trial 90 يوم — كفاية لكورس كامل.</li>
                <li><b>RAM:</b> 4GB. أقل من كده Windows هيخنق.</li>
                <li><b>CPUs:</b> 2. <b>Disk:</b> 60GB dynamic.</li>
                <li><b>Network:</b> Host-only = vboxnet0.</li>
                <li>وقت التثبيت: اعمل local user، <b>ما تدخلش بحساب Microsoft</b>. ليه؟ علشان لو الـ VM اتصلت بالإنترنت بالغلط، Microsoft هيشوف نشاط غريب على الحساب.</li>
                <li><b>Snapshot لازم بعد التثبيت مباشرة</b> — قبل ما تعمل أي update، قبل ما تحط أي tool. اسمه: <span className="eng">win10-clean-baseline</span>. ده اللي هترجعله بعد كل تجربة.</li>
                <li>Snapshot تاني بعد ما تثبّت .NET + Sysmon (لو هتدرس detection): <span className="eng">win10-monitored</span>.</li>
              </ul>
            </Step>
            <Callout kind="warn" title="استراتيجية الـ snapshots — حاجة محدش بيقولهالك">
              مفيش snapshot واحد بيكفي. خد 3 على الأقل لكل VM:
              <ol>
                <li><b>baseline:</b> بعد التثبيت ع طول، نضيفة تماماً.</li>
                <li><b>configured:</b> بعد ما حطّيت tools + updates.</li>
                <li><b>pre-attack:</b> قبل أي تجربة كبيرة. لو خرّبت الـ registry، ترجع للنقطة دي مش للـ baseline.</li>
              </ol>
              الـ snapshots بتاكل disk، بس disk أرخص من إنك تعيد التثبيت من الأول.
            </Callout>
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

          <Section title="الأخطاء اللي بيقع فيها كل المبتدئين">
            <Callout kind="danger" title="الغلطة رقم 1: شغّلت Kali على Bridged">
              فيه ناس بتفتح VirtualBox وتختار Bridged "علشان الإنترنت يشتغل". الـ VM دلوقتي على شبكة بيتك زي أي جهاز تاني. لما تشغّل <span className="eng">nmap</span> على <span className="eng">192.168.1.0/24</span>، أنت بتمسح بيتك فعلاً. لو في wifi الشغل؟ الـ SOC شافك. لو في كافيه؟ ممكن تتحاسب على نشاط ضد شبكة بتاع حد تاني.
              <br /><br />
              <b>الحل:</b> Host-only Adapter دايماً. لو محتاج إنترنت في الـ VM (مرحلياً للتنزيل)، ضيف adapter تاني NAT مؤقت، وبعد التنزيل اقفله.
            </Callout>
            <Callout kind="warn" title="الغلطة رقم 2: نسخ ملفات شخصية للـ VM">
              "هخليها VM للشغل العادي + الـ pentest". لا. ماينفعش. الـ VM بتاع المعمل بيتعرّض لـ malware اختياري. أي ملف شخصي جواه = ملف ممكن يتسرق أو يتشفّر. خلّيها نضيفة، ابعد عنها بحياتك الشخصية.
            </Callout>
            <Callout kind="warn" title="الغلطة رقم 3: ما تعملش snapshot قبل التجربة">
              "هجرّب بسرعة وأرجّع". بعد ساعتين، الـ Windows بايظ، الـ services مكسورة، ومش فاكر إنت غيّرت إيه. هتعيد تثبيت من الأول. ساعة ضايعة.
              <br /><br />
              <b>القاعدة:</b> قبل أي amplifier، أي exploit، أي إعداد جديد — snapshot. اسمه واضح. التاريخ في الاسم. كده.
            </Callout>
          </Section>

          <Section title="عادات لازم تمشي عليها في المعمل">
            <ol>
              <li><b>Snapshot قبل أي تجربة.</b> اسم واضح وفيه التاريخ: <span className="eng">win10-2024-05-pre-mimikatz</span>. مش هتندم. وعد.</li>
              <li><b>وثّق اللي عملته</b> في ملف نصي جوّه كل VM. <span className="eng">~/notes.md</span> أو <span className="eng">C:\notes.txt</span>. النسيان عدو التعلم — هترجع بعد شهرين تسأل نفسك "أنا عملت ده إزاي؟"</li>
              <li><b>ما تخليش الـ VM على Bridged adapter</b> أبداً. لو محتاج إنترنت لحظياً، شغّل NAT، نزّل، اقفل، رجّع Host-only.</li>
              <li><b>اعزل البيانات.</b> ما تنسخش ملفاتك الشخصية جوّه أي VM. لو محتاج تنقل ملف، Shared Folder مؤقت، وبعدين شيله.</li>
              <li><b>قفل الـ VMs</b> لما ما تكونش بتستخدمها. كل VM شغّالة = 4GB RAM + CPU بياكل بطارية على الفاضي.</li>
              <li><b>راجع الـ network adapter قبل ما تشغّل أي VM</b> — خلي عندك tab مفتوح فيه تذكّر "Host-only فقط".</li>
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
            <p>بعد ما تخلّص الدرس ده، روح:</p>
            <ul>
              <li><b>linux-fundamentals</b> — علشان تفهم Kali و Ubuntu أصلاً.</li>
              <li><b>windows-fundamentals</b> — Windows من زاوية الأمن، مش زاوية الـ end user.</li>
              <li><b>networking-basics</b> — قبل أي recon. مفيش غنى عنه.</li>
            </ul>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>اكتبها على الحيطة اللي في وش السرير، عايزك تصطبح عليها كل يوم:</p>
            <ul>
              <li>المعمل = شبكة Host-only + 3 VMs على الأقل + snapshots لكل واحدة.</li>
              <li>Bridged مش option. خلاص.</li>
              <li>اوعى تجرّب من غير snapshot. اسمه فيه تاريخ وسبب.</li>
              <li>اوعى تخلط حياتك الشخصية بالمعمل.</li>
              <li>أي تقنية في الكورس ده، مكانها جوّه المعمل. بره المعمل = جريمة. بقوانين البشر، مش بس أخلاقياً.</li>
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
