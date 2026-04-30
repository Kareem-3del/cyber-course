"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="wireless">
      <L
        ar={<>
          <Section title="الموجات الراديوية — جدار شفاف">
            <Analogy>الـ Wi-Fi مثل من يقف في غرفة و يصرخ: «اسم المستخدم: kareem، الرقم السري: 1234». لو كانت الجدران تخرّب الصوت قليلاً (تشفير ضعيف) لا يكفي — أي شخص في الشارع يلتقطها بهوائي قوي. هذه طبيعة الـ wireless.</Analogy>
          </Section>

          <Section title="Wi-Fi — التطور و الهجمات">
            <h3>أجيال التشفير</h3>
            <ul>
              <li><b>WEP</b> (1999) — مكسور تماماً. اختراق في دقائق.</li>
              <li><b>WPA / TKIP</b> (2003) — مكسور.</li>
              <li><b>WPA2 / AES-CCMP</b> (2004) — قياسي. ضعيف ضد <b>KRACK</b> و الـ handshake brute.</li>
              <li><b>WPA3 / SAE</b> (2018) — يحلّ معظم مشاكل WPA2 لكن أصابته ثغرات <b>Dragonblood</b> أوائله.</li>
            </ul>
            <h3>الهجمات الكلاسيكية</h3>
            <Code lang="bash">{`# وضع المراقبة
airmon-ng start wlan0
# مسح الشبكات
airodump-ng wlan0mon
# التقاط handshake
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w cap wlan0mon
# إجبار client على إعادة الاتصال
aireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF wlan0mon
# كسر offline
hashcat -m 22000 cap.hc22000 rockyou.txt
# أو
hcxdumptool / hcxtools للـ PMKID attack (لا يحتاج client)`}</Code>
            <h3>Evil Twin / Rogue AP</h3>
            <ul>
              <li>إنشاء AP بنفس SSID + إشارة أقوى → الـ clients تتصل تلقائياً.</li>
              <li>أدوات: <b>airgeddon, wifiphisher, hostapd-mana, eaphammer</b>.</li>
              <li>هجوم <b>Karma</b>: AP يجيب على أي probe بـ «نعم أنا تلك الشبكة».</li>
            </ul>
            <h3>هجوم WPS</h3>
            <p>PIN من 8 أرقام → كسر 11000 محاولة فقط (<b>Reaver, Bully, pixiewps</b>).</p>
          </Section>

          <Section title="Enterprise Wi-Fi (802.1X / WPA-EAP)">
            <ul>
              <li><b>EAP-PEAP / EAP-TTLS</b> ← <b>EAP relay</b> ممكن لو لم يُتحقق من شهادة السيرفر.</li>
              <li><b>EAP-TLS</b> — الأقوى (شهادة على الـ client و السيرفر).</li>
              <li>أداة <b>eaphammer</b> + <b>hostapd-wpe</b> لاصطياد NTLM responses.</li>
            </ul>
            <Callout kind="good" title="الدفاع">
              <ul>
                <li>افرض <b>EAP-TLS</b> فقط، عطّل PEAP/TTLS لو أمكن.</li>
                <li>على الـ clients: ثبّت CA المؤسسة و اسم السيرفر إجبارياً (<b>strict server validation</b>).</li>
                <li>WPA3-Enterprise مع <b>192-bit security</b> للبيئات الحساسة.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Bluetooth & BLE">
            <h3>المخاطر الشائعة</h3>
            <ul>
              <li><b>BlueBorne</b> (2017) — ثغرات لا تحتاج اقتراناً.</li>
              <li><b>KNOB attack</b> — تخفيض إنتروبي مفتاح التشفير.</li>
              <li><b>BLE replay</b> على الأقفال الذكية و الـ wearables.</li>
              <li><b>Sniffing</b> غير مشفّر للبيانات الصحية و LE Audio.</li>
            </ul>
            <Code lang="tools">{`# scanning
hcitool lescan
bluetoothctl
btmgmt

# sniffing
btlejack -s            # capture
ubertooth-rx           # hardware-based
crackle                # BLE encryption cracking (legacy pairing)

# fuzzing
sweyntooth, braktooth  # BLE/BR-EDR vuln research`}</Code>
            <h3>الدفاع</h3>
            <ul>
              <li>استخدم <b>LE Secure Connections</b> فقط (لا Legacy Pairing).</li>
              <li>عطّل الـ Bluetooth عند عدم الحاجة.</li>
              <li>تحقق من passkey بشكل مرئي عند الاقتران.</li>
              <li>طبّق MDM لمنع الـ pairing مع أجهزة غير معتمدة.</li>
            </ul>
          </Section>

          <Section title="RFID / NFC">
            <ul>
              <li><b>125 kHz</b> (HID Prox, EM4100) — يُستنسخ في ثوانٍ بـ <b>Proxmark3</b>.</li>
              <li><b>13.56 MHz</b> (MIFARE Classic, DESFire, iCLASS):
                <ul>
                  <li>MIFARE Classic — مكسور بـ <b>nested attack, hardnested</b>.</li>
                  <li>DESFire EV1 — مكسور (CVE-2020-15890).</li>
                  <li>DESFire EV2/EV3 — لا يزال آمناً.</li>
                </ul>
              </li>
              <li><b>NFC mobile</b> — هجمات relay ممكنة (مدفوعات).</li>
            </ul>
            <p>أدوات: <b>Proxmark3, Flipper Zero, ChameleonMini, ACR122U</b>.</p>
          </Section>

          <Section title="SDR — الراديو المعرّف برمجياً">
            <p>يفتح كل الطيف الراديوي للتحليل و إعادة الإرسال:</p>
            <ul>
              <li><b>HackRF One, RTL-SDR, LimeSDR, BladeRF</b>.</li>
              <li>برامج: <b>GNU Radio, GQRX, SDR#, Inspectrum, Universal Radio Hacker (URH)</b>.</li>
              <li>هجمات شائعة:
                <ul>
                  <li><b>Replay</b> على ريموتات السيارات القديمة (rolling code أصعب لكن ممكن — RollJam).</li>
                  <li>اعتراض <b>GSM/LTE</b> برخصة فقط.</li>
                  <li>تحليل بروتوكولات IoT (433/868/915 MHz).</li>
                  <li>هجمات <b>GPS spoofing</b>.</li>
                </ul>
              </li>
            </ul>
            <Callout kind="warn" title="القانون">
              الإرسال الراديوي خاضع لتنظيم صارم. التشويش أو الإرسال على ترددات مرخّصة لجهة أخرى = جريمة.
              التقاط (RX) يعتبر مقبولاً قانونياً في معظم الدول، لكن التسجيل/النشر قد لا يكون.
            </Callout>
          </Section>

          <Section title="الدفاع الشامل اللاسلكي">
            <ol>
              <li><b>WIDS/WIPS</b> (Wireless Intrusion Detection): Aruba, Cisco, Fortinet — يكشفون rogue APs و evil twins.</li>
              <li>مسح دوري للترددات المحيطة (<b>RF site survey</b>).</li>
              <li>عزل الـ <b>guest Wi-Fi</b> في VLAN منفصل.</li>
              <li>عطّل <b>WPS</b> دائماً.</li>
              <li>قلّل قوة الإشارة لتغطي ما تحتاجه فقط.</li>
              <li>ثبّت <b>certificate pinning</b> على EAP-TLS.</li>
              <li>BLE/Wi-Fi MAC randomization على أجهزة الموظفين لتقليل التتبع.</li>
            </ol>
          </Section>
        </>}
        en={<>
          <Section title="Radio waves — a transparent wall">
            <Analogy>Wi-Fi is like someone in a room shouting "username: kareem, PIN: 1234". If the walls only muffle slightly (weak crypto), it's not enough — anyone in the street with a good antenna picks it up. That's the nature of wireless.</Analogy>
          </Section>

          <Section title="Wi-Fi — evolution and attacks">
            <h3>Crypto generations</h3>
            <ul>
              <li><b>WEP</b> (1999) — completely broken. Cracks in minutes.</li>
              <li><b>WPA / TKIP</b> (2003) — broken.</li>
              <li><b>WPA2 / AES-CCMP</b> (2004) — standard. Vulnerable to <b>KRACK</b> and offline handshake brute force.</li>
              <li><b>WPA3 / SAE</b> (2018) — fixes most WPA2 issues, though early implementations had <b>Dragonblood</b> flaws.</li>
            </ul>
            <h3>Classic attacks</h3>
            <Code lang="bash">{`# Monitor mode
airmon-ng start wlan0
# Network scan
airodump-ng wlan0mon
# Capture handshake
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w cap wlan0mon
# Force a client to reconnect
aireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF wlan0mon
# Offline crack
hashcat -m 22000 cap.hc22000 rockyou.txt
# Or
hcxdumptool / hcxtools for the PMKID attack (no client required)`}</Code>
            <h3>Evil Twin / Rogue AP</h3>
            <ul>
              <li>Spin up an AP with the same SSID + stronger signal → clients auto-connect.</li>
              <li>Tools: <b>airgeddon, wifiphisher, hostapd-mana, eaphammer</b>.</li>
              <li><b>Karma attack</b>: an AP that says "yes, I am that network" to any probe.</li>
            </ul>
            <h3>WPS attack</h3>
            <p>An 8-digit PIN cracks in only 11,000 tries (<b>Reaver, Bully, pixiewps</b>).</p>
          </Section>

          <Section title="Enterprise Wi-Fi (802.1X / WPA-EAP)">
            <ul>
              <li><b>EAP-PEAP / EAP-TTLS</b> ← <b>EAP relay</b> possible if the server cert isn't validated.</li>
              <li><b>EAP-TLS</b> — strongest (certs on both client and server).</li>
              <li><b>eaphammer</b> + <b>hostapd-wpe</b> harvest NTLM responses.</li>
            </ul>
            <Callout kind="good" title="Defense">
              <ul>
                <li>Force <b>EAP-TLS</b> only; disable PEAP/TTLS where possible.</li>
                <li>On clients: pin the corporate CA and server name (<b>strict server validation</b>).</li>
                <li>WPA3-Enterprise with <b>192-bit security</b> for sensitive environments.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="Bluetooth & BLE">
            <h3>Common risks</h3>
            <ul>
              <li><b>BlueBorne</b> (2017) — pairing-less vulnerabilities.</li>
              <li><b>KNOB attack</b> — downgrades the encryption-key entropy.</li>
              <li><b>BLE replay</b> on smart locks and wearables.</li>
              <li><b>Sniffing</b> unencrypted health data and LE Audio.</li>
            </ul>
            <Code lang="tools">{`# scanning
hcitool lescan
bluetoothctl
btmgmt

# sniffing
btlejack -s            # capture
ubertooth-rx           # hardware-based
crackle                # BLE encryption cracking (legacy pairing)

# fuzzing
sweyntooth, braktooth  # BLE/BR-EDR vuln research`}</Code>
            <h3>Defense</h3>
            <ul>
              <li>Enforce <b>LE Secure Connections</b> only (no Legacy Pairing).</li>
              <li>Disable Bluetooth when not needed.</li>
              <li>Verify passkeys visually during pairing.</li>
              <li>Use MDM to block pairing with unapproved devices.</li>
            </ul>
          </Section>

          <Section title="RFID / NFC">
            <ul>
              <li><b>125 kHz</b> (HID Prox, EM4100) — cloned in seconds with <b>Proxmark3</b>.</li>
              <li><b>13.56 MHz</b> (MIFARE Classic, DESFire, iCLASS):
                <ul>
                  <li>MIFARE Classic — broken (<b>nested attack, hardnested</b>).</li>
                  <li>DESFire EV1 — broken (CVE-2020-15890).</li>
                  <li>DESFire EV2/EV3 — still secure.</li>
                </ul>
              </li>
              <li><b>NFC mobile</b> — relay attacks possible (payments).</li>
            </ul>
            <p>Tools: <b>Proxmark3, Flipper Zero, ChameleonMini, ACR122U</b>.</p>
          </Section>

          <Section title="SDR — Software-Defined Radio">
            <p>Opens the entire RF spectrum for analysis and replay:</p>
            <ul>
              <li><b>HackRF One, RTL-SDR, LimeSDR, BladeRF</b>.</li>
              <li>Software: <b>GNU Radio, GQRX, SDR#, Inspectrum, Universal Radio Hacker (URH)</b>.</li>
              <li>Common attacks:
                <ul>
                  <li><b>Replay</b> against legacy car remotes (rolling code is harder but RollJam works).</li>
                  <li><b>GSM/LTE</b> intercept (licensed labs only).</li>
                  <li>Reverse-engineering IoT protocols (433/868/915 MHz).</li>
                  <li><b>GPS spoofing</b>.</li>
                </ul>
              </li>
            </ul>
            <Callout kind="warn" title="Legal">
              RF transmission is heavily regulated. Jamming or transmitting on someone else's licensed band = a crime.
              Receiving (RX) is generally lawful in most countries, but recording/publishing may not be.
            </Callout>
          </Section>

          <Section title="End-to-end wireless defense">
            <ol>
              <li><b>WIDS/WIPS</b> (Wireless Intrusion Detection): Aruba, Cisco, Fortinet — detect rogue APs and evil twins.</li>
              <li>Periodic <b>RF site surveys</b>.</li>
              <li>Isolate <b>guest Wi-Fi</b> on a separate VLAN.</li>
              <li>Always disable <b>WPS</b>.</li>
              <li>Reduce signal power to cover only the area you need.</li>
              <li>Enforce <b>certificate pinning</b> on EAP-TLS.</li>
              <li>Use BLE/Wi-Fi MAC randomization on staff devices to limit tracking.</li>
            </ol>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
