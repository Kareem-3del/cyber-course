"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="mobile-iot">
      <L
        ar={<>
          <Section title="جبهات هجوم خارج السيرفر">
            <Analogy>السيرفر هو القلعة، لكن المؤسسة الحديثة فيها أيضاً: هواتف الموظفين، الكاميرات، الطابعات، أجهزة التكييف الذكية، خطوط الإنتاج. كل واحد منها = نقطة دخول محتملة. حادثة Target الشهيرة بدأت من ثلاجة ذكية لمزود خدمة.</Analogy>
          </Section>

          <Section title="أمن Android">
            <h3>سطح الهجوم</h3>
            <ul>
              <li><b>Manifest misconfig</b> — exported activities/services بدون حماية.</li>
              <li><b>Insecure storage</b> — SharedPreferences بدون تشفير.</li>
              <li><b>Hard-coded secrets</b> داخل APK.</li>
              <li><b>Insecure WebView</b> — JavaScript bridge.</li>
              <li><b>Cleartext traffic</b> — لو لم يُمنع في networkSecurityConfig.</li>
              <li><b>SSL Pinning</b> ضعيف أو مفقود.</li>
            </ul>
            <h3>الأدوات الأساسية</h3>
            <Code lang="bash">{`apktool d app.apk            # فك التغليف
jadx-gui app.apk             # عرض Java/Kotlin
frida -U -f com.app -l hook.js   # hooking ديناميكي
objection -g com.app explore     # framework جاهز
mob-sf                       # static + dynamic كامل
drozer                       # Android attack framework`}</Code>
            <h3>تجاوز SSL Pinning</h3>
            <Code lang="frida script">{`Java.perform(function() {
  var TM = Java.use('javax.net.ssl.X509TrustManager');
  TM.checkServerTrusted.implementation = function() { return; };
  // + frida-multiple-unpinning script
});`}</Code>
          </Section>

          <Section title="أمن iOS">
            <ul>
              <li>الـ jailbreak مطلوب لمعظم الفحوصات (palera1n, Dopamine).</li>
              <li>أدوات: <b>Frida, Objection, Needle, Hopper, Ghidra</b>.</li>
              <li>Keychain misuse، Insecure Data Protection class، URL schemes hijacking.</li>
              <li>iOS أصعب اختراقاً من Android لكن الثغرات (مثل سلسلة Pegasus) تكون مدمّرة.</li>
            </ul>
            <Callout kind="info" title="MASVS / MASTG">
              معيار OWASP الموحّد لاختبار الموبايل — استخدمه كقائمة فحص شاملة.
            </Callout>
          </Section>

          <Section title="MDM و الدفاع على الموبايل">
            <ul>
              <li><b>MDM/UEM</b>: Intune, Jamf, Workspace ONE — تطبيق سياسات + remote wipe.</li>
              <li><b>App attestation</b>: Play Integrity API, App Attest.</li>
              <li>عزل البيانات (work profile / managed apps).</li>
              <li>منع الـ jailbreak/root من الوصول للتطبيقات الحساسة (RootBeer, IOSSecuritySuite).</li>
              <li>Mobile Threat Defense (Lookout, Zimperium) للكشف عن التطبيقات الخبيثة.</li>
            </ul>
          </Section>

          <Section title="IoT — Firmware Hacking">
            <h3>الحصول على الـ firmware</h3>
            <ul>
              <li>تنزيل من موقع المصنع.</li>
              <li>اعتراض تحديثات OTA (mitm).</li>
              <li>قراءة الـ flash مباشرة عبر <b>UART / JTAG / SPI</b> بمشبك chip-clip و قارئ flashrom/CH341.</li>
              <li>هجمات side-channel على الـ secure boot.</li>
            </ul>
            <h3>التحليل</h3>
            <Code lang="bash">{`binwalk -e firmware.bin             # استخراج الـ filesystem
file rootfs.squashfs                # نوع
strings binary | grep -i pass       # secrets
firmware-mod-kit, ubi_reader        # squashfs/ubifs
qemu-arm-static -L . ./bin/httpd    # تشغيل ثنائي ARM على x86
emba                                # automated firmware analysis
firmadyne / firmae                  # full emulation`}</Code>
            <h3>أكثر الثغرات شيوعاً</h3>
            <ul>
              <li>كلمات مرور default/hardcoded.</li>
              <li>Telnet/SSH backdoors.</li>
              <li>Buffer overflows في خدمات HTTP/UPnP.</li>
              <li>Command injection في الـ admin panel.</li>
              <li>تشفير ضعيف أو غائب على التحديثات.</li>
            </ul>
          </Section>

          <Section title="OT / ICS / SCADA — أنظمة التحكم الصناعي">
            <Callout kind="danger" title="حساسية قصوى">
              هذه الأنظمة تتحكم في محطات الطاقة، المياه، التصنيع. أي تجربة عشوائية قد تتسبب
              بضرر مادي أو خسائر بشرية. <b>التدريب فقط على بيئات معامل معزولة</b>.
            </Callout>
            <h3>البروتوكولات</h3>
            <TwoCol>
              <Card title="Modbus" color="amber">قديم، بدون توثيق، نص واضح. أي شخص على الشبكة يستطيع التحكم.</Card>
              <Card title="DNP3" color="amber">شائع في الكهرباء. نسخة Secure DNP3 موجودة لكن نادرة.</Card>
              <Card title="OPC-UA" color="green">حديث، يدعم التشفير و الشهادات. الأفضل أمنياً.</Card>
              <Card title="S7 / EtherNet/IP / PROFINET" color="amber">بروتوكولات مصنّعين كبار (Siemens, Allen-Bradley).</Card>
            </TwoCol>
            <h3>أمثلة على الحوادث الكبرى</h3>
            <ul>
              <li><b>Stuxnet (2010)</b> — تخريب أجهزة الطرد المركزي الإيرانية.</li>
              <li><b>Ukraine Power Grid (2015, 2016)</b> — قطع الكهرباء عن مئات الآلاف.</li>
              <li><b>Triton/Trisis (2017)</b> — استهداف نظام السلامة Triconex.</li>
              <li><b>Colonial Pipeline (2021)</b> — رغم أن الهجوم كان على IT، توقف الـ OT احترازياً.</li>
            </ul>
            <h3>الدفاع — Purdue Model</h3>
            <ol>
              <li>فصل صارم بين IT و OT (Level 3.5 = DMZ صناعي).</li>
              <li>Data diodes للتدفق أحادي الاتجاه.</li>
              <li>SIEM متخصص (Claroty, Dragos, Nozomi, Tenable.OT).</li>
              <li>Configuration management — تتبع كل تغيير على PLCs.</li>
              <li>Air-gapping للأنظمة الحرجة.</li>
              <li>تطبيق IEC 62443 و NIST SP 800-82.</li>
            </ol>
          </Section>

          <Section title="أدوات IoT/OT متخصصة">
            <ul>
              <li><b>Shodan</b> filters: <code>port:502 (Modbus)</code>, <code>port:47808 (BACnet)</code>, <code>product:siemens</code>.</li>
              <li><b>Nmap NSE</b>: modbus-discover, s7-info, bacnet-info.</li>
              <li><b>Metasploit</b> modules: scada/.</li>
              <li><b>plcscan, mbtget, isf</b> (Industrial Security Framework).</li>
              <li><b>HackRF / Flipper Zero</b> لاختبار البروتوكولات اللاسلكية (433/868/915 MHz).</li>
            </ul>
          </Section>
        </>}
        en={<>
          <Section title="Attack surface beyond the server">
            <Analogy>The server is the castle, but a modern enterprise also has: employee phones, cameras, printers, smart HVAC, production lines. Each is a possible entry point. The famous Target breach started with a smart fridge from a third-party vendor.</Analogy>
          </Section>

          <Section title="Android security">
            <h3>Attack surface</h3>
            <ul>
              <li><b>Manifest misconfig</b> — exported activities/services with no protection.</li>
              <li><b>Insecure storage</b> — unencrypted SharedPreferences.</li>
              <li><b>Hard-coded secrets</b> inside the APK.</li>
              <li><b>Insecure WebView</b> — JavaScript bridge.</li>
              <li><b>Cleartext traffic</b> if not blocked in networkSecurityConfig.</li>
              <li>Weak or missing <b>SSL pinning</b>.</li>
            </ul>
            <h3>Core tools</h3>
            <Code lang="bash">{`apktool d app.apk            # unpack
jadx-gui app.apk             # view Java/Kotlin
frida -U -f com.app -l hook.js   # dynamic hooking
objection -g com.app explore     # ready framework
mob-sf                       # full static + dynamic
drozer                       # Android attack framework`}</Code>
            <h3>Bypassing SSL pinning</h3>
            <Code lang="frida script">{`Java.perform(function() {
  var TM = Java.use('javax.net.ssl.X509TrustManager');
  TM.checkServerTrusted.implementation = function() { return; };
  // + frida-multiple-unpinning script
});`}</Code>
          </Section>

          <Section title="iOS security">
            <ul>
              <li>Jailbreak required for most testing (palera1n, Dopamine).</li>
              <li>Tools: <b>Frida, Objection, Needle, Hopper, Ghidra</b>.</li>
              <li>Keychain misuse, weak Data Protection class, URL scheme hijacking.</li>
              <li>iOS is harder to break than Android, but exploits (like the Pegasus chain) are devastating.</li>
            </ul>
            <Callout kind="info" title="OWASP MASVS / MASTG">
              The unified standard for mobile testing — use it as a comprehensive checklist.
            </Callout>
          </Section>

          <Section title="MDM and mobile defense">
            <ul>
              <li><b>MDM/UEM</b>: Intune, Jamf, Workspace ONE — policy enforcement + remote wipe.</li>
              <li><b>App attestation</b>: Play Integrity API, App Attest.</li>
              <li>Data isolation (work profile / managed apps).</li>
              <li>Block jailbroken/rooted devices from sensitive apps (RootBeer, IOSSecuritySuite).</li>
              <li>Mobile Threat Defense (Lookout, Zimperium) for malicious app detection.</li>
            </ul>
          </Section>

          <Section title="IoT — firmware hacking">
            <h3>Obtaining the firmware</h3>
            <ul>
              <li>Download from the vendor site.</li>
              <li>Intercept OTA updates (mitm).</li>
              <li>Read flash directly via <b>UART / JTAG / SPI</b> using a chip-clip and a flashrom/CH341 reader.</li>
              <li>Side-channel attacks on secure boot.</li>
            </ul>
            <h3>Analysis</h3>
            <Code lang="bash">{`binwalk -e firmware.bin             # extract filesystem
file rootfs.squashfs                # type
strings binary | grep -i pass       # secrets
firmware-mod-kit, ubi_reader        # squashfs/ubifs
qemu-arm-static -L . ./bin/httpd    # run ARM binary on x86
emba                                # automated firmware analysis
firmadyne / firmae                  # full emulation`}</Code>
            <h3>Most common vulnerabilities</h3>
            <ul>
              <li>Default / hard-coded passwords.</li>
              <li>Telnet/SSH backdoors.</li>
              <li>Buffer overflows in HTTP/UPnP services.</li>
              <li>Command injection in admin panels.</li>
              <li>Weak or missing update signing.</li>
            </ul>
          </Section>

          <Section title="OT / ICS / SCADA — industrial control systems">
            <Callout kind="danger" title="Highest sensitivity">
              These systems control power, water, and manufacturing. Any reckless test can cause physical damage or loss of life. <b>Practice only in fully isolated lab environments</b>.
            </Callout>
            <h3>Protocols</h3>
            <TwoCol>
              <Card title="Modbus" color="amber">Old, no auth, plaintext. Anyone on the network can issue commands.</Card>
              <Card title="DNP3" color="amber">Common in electric utilities. A Secure DNP3 variant exists but is rare.</Card>
              <Card title="OPC-UA" color="green">Modern, with encryption and certificates. Best from a security standpoint.</Card>
              <Card title="S7 / EtherNet/IP / PROFINET" color="amber">Major-vendor protocols (Siemens, Allen-Bradley).</Card>
            </TwoCol>
            <h3>Notable historical incidents</h3>
            <ul>
              <li><b>Stuxnet (2010)</b> — sabotaged Iranian centrifuges.</li>
              <li><b>Ukraine Power Grid (2015, 2016)</b> — knocked out power for hundreds of thousands.</li>
              <li><b>Triton/Trisis (2017)</b> — targeted Triconex safety system.</li>
              <li><b>Colonial Pipeline (2021)</b> — though IT-only, OT was halted as a precaution.</li>
            </ul>
            <h3>Defense — Purdue Model</h3>
            <ol>
              <li>Strict IT/OT segmentation (Level 3.5 = industrial DMZ).</li>
              <li>Data diodes for one-way flow.</li>
              <li>OT-specific monitoring (Claroty, Dragos, Nozomi, Tenable.OT).</li>
              <li>Configuration management — track every change on PLCs.</li>
              <li>Air-gapping for critical systems.</li>
              <li>Apply IEC 62443 and NIST SP 800-82.</li>
            </ol>
          </Section>

          <Section title="Specialized IoT/OT tools">
            <ul>
              <li><b>Shodan</b> filters: <code>port:502 (Modbus)</code>, <code>port:47808 (BACnet)</code>, <code>product:siemens</code>.</li>
              <li><b>Nmap NSE</b>: modbus-discover, s7-info, bacnet-info.</li>
              <li><b>Metasploit</b> scada/ modules.</li>
              <li><b>plcscan, mbtget, isf</b> (Industrial Security Framework).</li>
              <li><b>HackRF / Flipper Zero</b> for testing wireless protocols (433/868/915 MHz).</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
