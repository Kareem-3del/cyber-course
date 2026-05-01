"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="crypto">
      <L
        ar={<>
          <Section title="ليه لازم تفهم التشفير حتى لو مش هتطبّقه بإيدك؟">
            <Analogy>
              بُص.
              التشفير زي القفل.
              مش لازم تصنّعه بنفسك..
              بس لو ما تعرفش الفرق بين قفل ورق وقفل فولاذ — هتحط قفل هزيل وتقول "أنا مأمّن".
              الحقيقة المُرّة: 99% من اختراقات التشفير مش كسر للخوارزمية. سوء استخدام منك إنت.
              الخوارزمية صح. إنت اللي بتستعملها غلط.
            </Analogy>
            <Callout kind="info" title="واقعة Adobe 2013">
              153 مليون باسورد اتسرّبت. الـ Adobe كانت بتستخدم 3DES في ECB mode + بدون salting حقيقي. اللي بيحصل فعلياً: نفس الباسورد بياخد نفس الـ ciphertext لكل user. فيه واحد عمل crossword puzzle من الـ password hints وحلّها كلها. الخوارزمية ما اتكسرتش — Adobe بنفسها بنت "زتونة" تشفير.
            </Callout>
          </Section>

          <Section title="الأنواع الأساسية">
            <TwoCol>
              <Card title="Symmetric — تماثلي" color="blue">
                مفتاح واحد بيشفّر وبيفكّ. سريع جداً. مثال: <b>AES-GCM, ChaCha20-Poly1305</b>.
                المشكلة الكلاسيكية: إزاي تشارك المفتاح ده مع الطرف التاني بأمان؟
              </Card>
              <Card title="Asymmetric — غير تماثلي" color="blue">
                مفتاحين: عام وخاص. أبطأ بكتير، لكنه بيحل مشكلة المشاركة. مثال: <b>RSA, ECDSA, Ed25519, Curve25519</b>.
              </Card>
              <Card title="Hash" color="green">
                دالة في اتجاه واحد. مفيش رجوع. مثال: <b>SHA-256, BLAKE2, BLAKE3</b>.
                <i>ده مش تشفير</i> — ده للسلامة والتحقق بس.
              </Card>
              <Card title="MAC / HMAC" color="green">
                Hash مع مفتاح — بيضمن السلامة والمصدر مع بعض. مثال: <b>HMAC-SHA256</b>.
              </Card>
            </TwoCol>
          </Section>

          <Section title="تستخدم إيه في 2026؟">
            <ul>
              <li><b>تشفير بيانات</b>: AES-256-GCM أو ChaCha20-Poly1305 (مع AEAD دائماً، لا CBC وحده).</li>
              <li><b>تبادل مفاتيح</b>: ECDH على Curve25519 (X25519).</li>
              <li><b>توقيع</b>: Ed25519 (أسرع و أأمن من RSA).</li>
              <li><b>كلمات مرور</b>: Argon2id (الأفضل) أو bcrypt — <b>أبداً MD5/SHA-1/SHA-256 وحدها</b>.</li>
              <li><b>هاش عام</b>: SHA-256 / BLAKE3.</li>
              <li><b>RNG</b>: <code>/dev/urandom</code>, <code>getrandom()</code>, <code>crypto.randomBytes</code> — <i>أبداً Math.random()</i>.</li>
            </ul>
            <Callout kind="warn" title="ما تقربش من دول">
              MD5, SHA-1, RC4, DES/3DES, ECB mode, CBC من غير MAC، RSA بـ PKCS#1 v1.5 padding، والـ hardcoded IVs. أي حد بيستخدم حاجة من دول في 2026 = إما ما يعرفش، أو ما يهمّوش.
            </Callout>
          </Section>

          <Section title="TLS — كيف يعمل بسرعة">
            <ol>
              <li><b>Client Hello</b>: قائمة cipher suites مدعومة.</li>
              <li><b>Server Hello</b>: يختار cipher + يرسل الشهادة.</li>
              <li><b>Certificate verification</b>: العميل يتحقق من سلسلة الشهادات حتى CA موثوق.</li>
              <li><b>Key exchange (ECDHE)</b>: يولّد مفتاح جلسة فريد.</li>
              <li><b>Finished</b>: التحقق من سلامة المصافحة.</li>
              <li>تبادل البيانات بـ AES-GCM أو ChaCha20-Poly1305.</li>
            </ol>
            <Callout kind="info" title="TLS 1.3 يحذف">
              MD5, SHA-1, RC4, DES, RSA key transport, CBC modes, compression، و كل ما لا يدعم AEAD.
              <b>افرض TLS 1.2 كحد أدنى، 1.3 مفضّل</b>.
            </Callout>
          </Section>

          <Section title="PKI — البنية التحتية للمفاتيح">
            <ul>
              <li><b>CA</b> — سلطة الإصدار. الجذر <i>offline</i> دائماً. الإصدار الفعلي عبر <b>Intermediate CAs</b>.</li>
              <li><b>CRL / OCSP / OCSP Stapling</b> — للإلغاء.</li>
              <li><b>Certificate Transparency (CT)</b> — كل شهادة تُسجّل في سجل عام (crt.sh).</li>
              <li><b>HSTS preload</b> — يجبر المتصفح على HTTPS.</li>
              <li><b>HPKP</b> — اتشال خلاص لأنه كان بيوقّع المواقع في رجلها، استبدله بـ <b>Expect-CT</b>.</li>
            </ul>
            <h3>إدارة الشهادات داخلياً</h3>
            <ul>
              <li><b>step-ca, HashiCorp Vault PKI</b> — للـ CA الداخلي.</li>
              <li><b>cert-manager</b> على Kubernetes.</li>
              <li><b>Let's Encrypt + ACME</b> للشهادات العامة.</li>
              <li>تدوير قصير المدى (90 يوم أو أقل) أفضل من شهادات سنوية.</li>
            </ul>
          </Section>

          <Section title="مزالق شائعة في التطبيق">
            <h3>JWT — الأخطاء الكلاسيكية</h3>
            <ul>
              <li>قبول <code>alg: none</code>.</li>
              <li>السر ضعيف يُكسر بـ hashcat.</li>
              <li>عدم التحقق من <code>aud, iss, exp</code>.</li>
              <li>تخزين JWT في localStorage بدلاً من HttpOnly cookie.</li>
              <li>عدم تدوير المفاتيح.</li>
              <li><b>Algorithm confusion</b> RS256 → HS256 (المفتاح العام كسر).</li>
            </ul>
            <h3>Password Hashing</h3>
            <Code lang="Argon2id parameters (2026)">{`# OWASP recommended
m=19456 KiB (19 MB)
t=2 iterations
p=1 thread
salt=128 bits random per password`}</Code>
            <h3>Encryption-at-Rest</h3>
            <ul>
              <li>تشفير على مستوى التطبيق + تشفير على مستوى التخزين (defense in depth).</li>
              <li>المفتاح في HSM / KMS، ليس في الكود.</li>
              <li>Envelope encryption — KEK يشفّر DEKs.</li>
            </ul>
          </Section>

          <Section title="Post-Quantum Cryptography">
            <p>
              الحواسيب الكمومية ستكسر RSA و ECC في النهاية. NIST اختار خوارزميات ما بعد الكم في 2024:
            </p>
            <ul>
              <li><b>ML-KEM (Kyber)</b> — لتبادل المفاتيح.</li>
              <li><b>ML-DSA (Dilithium)</b> — للتوقيع.</li>
              <li><b>SLH-DSA (SPHINCS+)</b> — توقيع مبني على hash.</li>
            </ul>
            <Callout kind="warn" title="Harvest now, decrypt later">
              المهاجمين دلوقتي بيجمعوا البيانات المشفّرة وبيستنّوا.

              - طب يا حضرتك ده هيحصل امتى يعني؟ ٢٠٤٠؟ ٢٠٥٠؟

              يا نجم، انت متأكد إن الداتا اللي عندك دلوقتي مش هتفضل حساسة بعد 10 سنين؟ ملفات استخباراتية؟ هويات مصادر؟ لو الإجابة "هتفضل" — يبقى الخصم بياخدها النهارده ويفك تشفيرها بكرة. ابدأ تنقل دلوقتي. اوعى تستنى.
            </Callout>
          </Section>

          <Section title="القواعد الناشفة">
            <ol>
              <li><b>متخترعش تشفيرك بنفسك</b> — استخدم مكتبات متشهد لها (libsodium, Tink, BoringSSL). أي حد بيقولك «أنا عملت تشفير خاص بيا» = خد بالك، ده لعب.</li>
              <li>استخدم <b>AEAD</b> دايماً (بيدمج التشفير + السلامة في عملية واحدة).</li>
              <li><b>Constant-time comparison</b> للمفاتيح والتوكنز (متجاهلش timing attacks).</li>
              <li>متعيدش استخدام nonce/IV مع نفس المفتاح. ده الخطأ اللي بيقتل الكل.</li>
              <li>دوّر المفاتيح بانتظام، وخطّط للتدوير قبل ما تحتاجه فعلاً.</li>
              <li>وثّق Threat Model للتشفير قبل ما تصمّم — مش بعد ما تتحرق.</li>
            </ol>
          </Section>

          <Section title="غلطات الـ junior — اللي بتفجّر الإنتاج">
            <Callout kind="warn" title="لو فات عليك ده، يبقى مش بتراقب">
              <ul>
                <li>بيستخدم <code>Math.random()</code> لتوليد session tokens. الـ token متوقّع. الـ account takeover في 5 دقائق.</li>
                <li>الـ JWT secret = "secret123". hashcat بيكسره في ثواني.</li>
                <li>بيشفّر بـ AES-CBC من غير MAC. Padding oracle attack بيفك كل الـ ciphertext.</li>
                <li>بيخزّن المفتاح جنب الداتا في نفس الـ DB. اختراق واحد = كل حاجة بايظة.</li>
                <li>الـ TLS cert منتهي من 6 شهور والـ alerting مقفول "علشان كان بيدوّش".</li>
              </ul>
              <p>الخلاصة: لو الـ developer مش فاهم AEAD ولا nonce reuse — مش هيعرف يأمّن أي حاجة. التدريب أرخص من الـ breach.</p>
            </Callout>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>التشفير مش سحر. هو رياضيات + انضباط في الاستخدام.</p>
            <p>اللي بيخترع crypto = بيلعب. اللي بيستخدم libsodium ويقرا الـ docs = شغل جاد.</p>
            <p>اكتبها على ظهر إيدك: <b>Don't roll your own crypto. Ever.</b></p>
            <p>اختار صفك.</p>
          </Section>
        </>}
        en={<>
          <Section title="Why understand crypto even if you don't implement it?">
            <Analogy>Crypto is like a lock: you don't need to forge it yourself, but if you can't tell paper from steel, you'll put a weak one on your door. Most crypto breaches aren't algorithm breaks — they're misuse.</Analogy>
          </Section>

          <Section title="The fundamentals">
            <TwoCol>
              <Card title="Symmetric" color="blue">
                One shared key for encryption and decryption. Very fast. Examples: <b>AES-GCM, ChaCha20-Poly1305</b>. The problem: how do you exchange the key safely?
              </Card>
              <Card title="Asymmetric" color="blue">
                Two keys: public and private. Much slower but solves key distribution. Examples: <b>RSA, ECDSA, Ed25519, Curve25519</b>.
              </Card>
              <Card title="Hash" color="green">
                One-way function. Not reversible. Examples: <b>SHA-256, BLAKE2, BLAKE3</b>. <i>Not encryption</i> — used for integrity.
              </Card>
              <Card title="MAC / HMAC" color="green">
                Keyed hash — guarantees integrity AND origin. Example: <b>HMAC-SHA256</b>.
              </Card>
            </TwoCol>
          </Section>

          <Section title="What to use in 2026">
            <ul>
              <li><b>Data encryption</b>: AES-256-GCM or ChaCha20-Poly1305 (always AEAD, never CBC alone).</li>
              <li><b>Key exchange</b>: ECDH on Curve25519 (X25519).</li>
              <li><b>Signatures</b>: Ed25519 (faster and safer than RSA).</li>
              <li><b>Passwords</b>: Argon2id (best) or bcrypt — <b>never MD5/SHA-1/SHA-256 alone</b>.</li>
              <li><b>General hashing</b>: SHA-256 / BLAKE3.</li>
              <li><b>RNG</b>: <code>/dev/urandom</code>, <code>getrandom()</code>, <code>crypto.randomBytes</code> — <i>never Math.random()</i>.</li>
            </ul>
            <Callout kind="warn" title="Avoid">
              MD5, SHA-1, RC4, DES/3DES, ECB mode, CBC without a MAC, RSA with PKCS#1 v1.5 padding, hardcoded IVs.
            </Callout>
          </Section>

          <Section title="TLS — how it works in brief">
            <ol>
              <li><b>Client Hello</b>: list of supported cipher suites.</li>
              <li><b>Server Hello</b>: picks a cipher + sends its certificate.</li>
              <li><b>Certificate verification</b>: client validates the chain up to a trusted CA.</li>
              <li><b>Key exchange (ECDHE)</b>: derives a unique session key.</li>
              <li><b>Finished</b>: handshake integrity check.</li>
              <li>Exchange data with AES-GCM or ChaCha20-Poly1305.</li>
            </ol>
            <Callout kind="info" title="TLS 1.3 removes">
              MD5, SHA-1, RC4, DES, RSA key transport, CBC modes, compression, and anything non-AEAD.
              <b> Enforce TLS 1.2 minimum, prefer 1.3</b>.
            </Callout>
          </Section>

          <Section title="PKI — Public Key Infrastructure">
            <ul>
              <li><b>CA</b> — issuing authority. Root is always <i>offline</i>. Real issuance from <b>intermediate CAs</b>.</li>
              <li><b>CRL / OCSP / OCSP Stapling</b> — revocation.</li>
              <li><b>Certificate Transparency (CT)</b> — every cert recorded in a public log (crt.sh).</li>
              <li><b>HSTS preload</b> — forces HTTPS in browsers.</li>
              <li><b>HPKP</b> — deprecated due to risk; replaced by <b>Expect-CT</b>.</li>
            </ul>
            <h3>Internal certificate management</h3>
            <ul>
              <li><b>step-ca, HashiCorp Vault PKI</b> — internal CA.</li>
              <li><b>cert-manager</b> on Kubernetes.</li>
              <li><b>Let's Encrypt + ACME</b> for public certs.</li>
              <li>Short-lived rotation (90 days or less) beats year-long certs.</li>
            </ul>
          </Section>

          <Section title="Common implementation pitfalls">
            <h3>JWT — the classic mistakes</h3>
            <ul>
              <li>Accepting <code>alg: none</code>.</li>
              <li>Weak secret crackable by hashcat.</li>
              <li>Not validating <code>aud, iss, exp</code>.</li>
              <li>Storing JWTs in localStorage instead of HttpOnly cookies.</li>
              <li>No key rotation.</li>
              <li><b>Algorithm confusion</b> RS256 → HS256 (public key as secret).</li>
            </ul>
            <h3>Password hashing</h3>
            <Code lang="Argon2id parameters (2026)">{`# OWASP recommended
m=19456 KiB (19 MB)
t=2 iterations
p=1 thread
salt=128 bits random per password`}</Code>
            <h3>Encryption at rest</h3>
            <ul>
              <li>Application-level + storage-level encryption (defense in depth).</li>
              <li>Key in HSM / KMS, not in code.</li>
              <li>Envelope encryption — KEK encrypts DEKs.</li>
            </ul>
          </Section>

          <Section title="Post-Quantum Cryptography">
            <p>Quantum computers will eventually break RSA and ECC. NIST selected post-quantum algorithms in 2024:</p>
            <ul>
              <li><b>ML-KEM (Kyber)</b> — key exchange.</li>
              <li><b>ML-DSA (Dilithium)</b> — signatures.</li>
              <li><b>SLH-DSA (SPHINCS+)</b> — hash-based signatures.</li>
            </ul>
            <Callout kind="warn" title="Harvest now, decrypt later">
              Adversaries today are stockpiling encrypted data and waiting. Start the migration now for any data that must stay secret 10 years from now.
            </Callout>
          </Section>

          <Section title="Golden rules">
            <ol>
              <li><b>Don't roll your own crypto</b> — use vetted libraries (libsodium, Tink, BoringSSL).</li>
              <li>Always use <b>AEAD</b> (combines encryption + integrity).</li>
              <li><b>Constant-time comparison</b> for secrets and tokens (avoid timing attacks).</li>
              <li>Never reuse a nonce/IV with the same key.</li>
              <li>Rotate keys regularly, and plan rotation before you need it.</li>
              <li>Document a crypto threat model before designing.</li>
            </ol>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
