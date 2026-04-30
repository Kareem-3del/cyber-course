"use client";
import { LessonShell, Section, Callout, Code, Analogy, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="hardening">
      <L
        ar={<>
          <Section title="مبدأ الدفاع المتعدد الطبقات — Defense in Depth">
            <Analogy>القلعة في العصور الوسطى ما كانتش بتعتمد على سور واحد. خندق، سور برّاني، سور جوّاني، برج رئيسي، وحرّاس. لو طبقة وقعت، اللي بعدها بتمسك. ده بالظبط <b>Defense in Depth</b>.</Analogy>
            <p>القاعدة هنا بسيطة: ما تحطش كل بيضك في سلة واحدة. أي طبقة هتفشل يوم ما، وانت عايز اللي بعدها تكون جاهزة.</p>
          </Section>
          <Section title="مبادئ ذهبية — احفظهم زي اسمك">
            <ol>
              <li><b>Least Privilege</b> — أقل صلاحية ممكنة لكل مستخدم وخدمة. لو الـ app محتاج يقرا بس، ما تديهوش write.</li>
              <li><b>Zero Trust</b> — ما تثقش في حد ولا في شبكة، تحقق في كل مرة. حتى الجهاز اللي جوّه الـ corporate LAN.</li>
              <li><b>Assume Breach</b> — افترض إنك متخرق دلوقتي، واشتغل على الكشف والاحتواء.</li>
              <li><b>Defense in Depth</b> — طبقات كتير ومتنوعة، مش نفس النوع مكرر.</li>
              <li><b>Secure by Default</b> — الإعداد الافتراضي يكون آمن، الناس مش بتقرا الـ docs.</li>
            </ol>
          </Section>
          <Section title="تصلب نظام Linux">
            <Code lang="hardening checklist">{`# 1) تحديث دائم
unattended-upgrades + apt-listbugs

# 2) SSH
PermitRootLogin no
PasswordAuthentication no
AllowUsers admin
MaxAuthTries 3

# 3) UFW / nftables — deny by default
ufw default deny incoming
ufw allow from 10.0.0.0/8 to any port 22

# 4) fail2ban على SSH و web
# 5) auditd لمراقبة استدعاءات النظام
# 6) AIDE لمراقبة سلامة الملفات
# 7) AppArmor / SELinux في وضع enforcing
# 8) تعطيل خدمات غير مستخدمة
# 9) blacklist usb-storage`}</Code>
            <Callout kind="info" title="معايير قابلة للقياس — ما تخترعش العجلة">
              <ul>
                <li>CIS Benchmarks — نقاط مفصّلة لكل توزيعة، حد قعد سنين يكتبها.</li>
                <li>DISA STIGs — معايير وزارة الدفاع الأمريكية، أصرم شوية.</li>
                <li>أتمتها بـ OpenSCAP / Lynis / Wazuh SCA — مفيش سبب تعمل المسح يدوي.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="تصلب الويب — Web Hardening">
            <h3>HTTP Headers ضرورية</h3>
            <Code lang="nginx">{`add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
add_header X-Content-Type-Options "nosniff";
add_header X-Frame-Options "DENY";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'sha256-...';";`}</Code>
            <h3>WAF — Web Application Firewall</h3>
            <ul>
              <li>Cloudflare WAF, AWS WAF, ModSecurity + OWASP CRS.</li>
              <li>قواعد SQLi / XSS / LFI / RCE + rate limiting.</li>
              <li>مراقبة الـ false positives أهم من إضافة المزيد من القواعد.</li>
            </ul>
          </Section>
          <Section title="تصلب قاعدة البيانات">
            <ul>
              <li>مستخدم لكل تطبيق بصلاحية محدودة. لا root أبداً.</li>
              <li>لا DB على الإنترنت — فقط داخل VPC.</li>
              <li>تشفير في الراحة (at rest) و في النقل (in transit).</li>
              <li>Audit logging + slow query log + honey tables.</li>
              <li>Backup منفصل + restore drills دورية.</li>
            </ul>
          </Section>
          <Section title="إدارة الهويات — Identity Hardening">
            <ol>
              <li>MFA إجباري لكل المستخدمين، خاصة الـ admins.</li>
              <li>SSO مركزي — يسهّل الرفع و العزل عند التغيير.</li>
              <li>PAM (Privileged Access Management) — جلسات مسجّلة كاملة.</li>
              <li>تدوير passwords/keys دورياً.</li>
              <li>كشف credential stuffing عبر مقارنة بقواعد التسريبات.</li>
            </ol>
          </Section>
          <Section title="الشبكة — Network Hardening">
            <ul>
              <li>Microsegmentation — كل خدمة في subnet خاص.</li>
              <li>Egress filtering — السيرفر لا يكلّم الإنترنت إلا لـ domains محددة.</li>
              <li>DNS filtering (Cisco Umbrella, Quad9, Pi-hole) ضد C2.</li>
              <li>VPN / SASE / ZTNA بدلاً من فتح RDP و SSH للإنترنت.</li>
              <li>802.1X + NAC داخل المؤسسة.</li>
            </ul>
          </Section>
          <Section title="إدارة الأسرار — Secrets Management">
            <ul>
              <li>HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager.</li>
              <li>أبداً في الكود أو في الـ .env الذي قد يُرفع.</li>
              <li>Pre-commit hooks: gitleaks, detect-secrets.</li>
              <li>تدوير دوري + short-lived tokens.</li>
            </ul>
          </Section>
        </>}
        en={<>
          <Section title="Defense in Depth">
            <Analogy>A medieval castle never relied on one wall. There was a moat, an outer wall, an inner wall, a keep, and guards. If one layer falls, the next holds. That's <b>Defense in Depth</b>.</Analogy>
          </Section>
          <Section title="Golden principles">
            <ol>
              <li><b>Least Privilege</b> — minimum permissions per user and service.</li>
              <li><b>Zero Trust</b> — never trust anyone or any network; always verify.</li>
              <li><b>Assume Breach</b> — design for detection and containment.</li>
              <li><b>Defense in Depth</b> — multiple, diverse layers.</li>
              <li><b>Secure by Default</b> — defaults are safe out of the box.</li>
            </ol>
          </Section>
          <Section title="Linux hardening">
            <Code lang="hardening checklist">{`# 1) Continuous patching
unattended-upgrades + apt-listbugs

# 2) SSH
PermitRootLogin no
PasswordAuthentication no
AllowUsers admin
MaxAuthTries 3

# 3) UFW / nftables — deny by default
ufw default deny incoming
ufw allow from 10.0.0.0/8 to any port 22

# 4) fail2ban for SSH and web
# 5) auditd for syscall monitoring
# 6) AIDE for file integrity
# 7) AppArmor / SELinux in enforcing mode
# 8) Disable unused services
# 9) blacklist usb-storage`}</Code>
            <Callout kind="info" title="Measurable standards">
              <ul>
                <li>CIS Benchmarks — detailed checks per distribution.</li>
                <li>DISA STIGs — US DoD baselines.</li>
                <li>Automate with OpenSCAP / Lynis / Wazuh SCA.</li>
              </ul>
            </Callout>
          </Section>
          <Section title="Web hardening">
            <h3>Required HTTP headers</h3>
            <Code lang="nginx">{`add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
add_header X-Content-Type-Options "nosniff";
add_header X-Frame-Options "DENY";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'sha256-...';";`}</Code>
            <h3>WAF — Web Application Firewall</h3>
            <ul>
              <li>Cloudflare WAF, AWS WAF, ModSecurity + OWASP CRS.</li>
              <li>SQLi / XSS / LFI / RCE rules + rate limiting.</li>
              <li>Tracking false positives matters more than adding more rules.</li>
            </ul>
          </Section>
          <Section title="Database hardening">
            <ul>
              <li>One restricted DB user per app. Never root.</li>
              <li>No DB on the public internet — VPC only.</li>
              <li>Encryption at rest and in transit.</li>
              <li>Audit logging + slow query log + honey tables.</li>
              <li>Isolated backup + periodic restore drills.</li>
            </ul>
          </Section>
          <Section title="Identity hardening">
            <ol>
              <li>MFA mandatory for everyone, especially admins.</li>
              <li>Centralized SSO — easier provisioning and offboarding.</li>
              <li>PAM (Privileged Access Management) with full session recording.</li>
              <li>Rotate passwords / keys regularly.</li>
              <li>Detect credential stuffing by checking against breach datasets.</li>
            </ol>
          </Section>
          <Section title="Network hardening">
            <ul>
              <li>Microsegmentation — each service in its own subnet.</li>
              <li>Egress filtering — servers only talk to specific external domains.</li>
              <li>DNS filtering (Cisco Umbrella, Quad9, Pi-hole) against C2.</li>
              <li>VPN / SASE / ZTNA instead of exposing RDP and SSH to the internet.</li>
              <li>802.1X + NAC on the corporate LAN.</li>
            </ul>
          </Section>
          <Section title="Secrets management">
            <ul>
              <li>HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager.</li>
              <li>Never in source code or in .env files that might be committed.</li>
              <li>Pre-commit hooks: gitleaks, detect-secrets.</li>
              <li>Regular rotation + short-lived tokens.</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
