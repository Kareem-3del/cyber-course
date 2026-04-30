"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="ics-scada-protocols">
      <L
        ar={<>
          <Section title="عالم لا يشبه IT — لماذا ICS مختلف؟">
            <Analogy>
              IT يعمل بمنطق "secure first, fast second". OT (Operational Technology) عكس ذلك تماماً: محطة كهرباء
              تتحمل ثوانٍ من التأخر، وثانية واحدة من توقف الإنذار قد تعني انفجار. هندسة OT بُنيت على أن "متى" أهم من
              "ما"، والكثير من بروتوكولاتها لا تحتوي authentication أصلاً لأن التواصل بين PLC و sensor كان
              يفترض أن يتم في شبكة معزولة.
            </Analogy>
            <p>
              الواقع اليوم: تلك الشبكات لم تعد معزولة. Stuxnet، Industroyer، Pipedream، CHIRP — كل حملة كبرى ضد
              بنية تحتية حرجة استغلت بروتوكولات صُممت بلا حماية. هذا الدرس يغطي Modbus، DNP3، IEC-104 — الأكثر
              انتشاراً في الكهرباء، الماء، النقل.
            </p>
          </Section>

          <Section title="معمارية ICS — Purdue Model">
            <Code lang="text">{`Level 5 — Internet / cloud
Level 4 — Enterprise IT (ERP, email)
Level 3.5 — DMZ (jump servers, historians)
─── الحدود الكلاسيكية ───
Level 3 — Operations management (SCADA HMIs)
Level 2 — Process supervisory (HMI, alarms)
Level 1 — Basic control (PLC, RTU, IED)
Level 0 — Physical (sensors, actuators, valves)`}</Code>
            <p>
              Modbus / DNP3 / IEC-104 تعمل في Level 1-2. هدف المهاجم: عبور Level 3.5 (المخترق غالباً عبر phishing على
              IT) إلى Level 1 لإصدار أوامر فعلية للعتاد.
            </p>
          </Section>

          <Section title="Modbus — البروتوكول الأكثر انتشاراً">
            <Step n={1} title="ما هو؟">
              Modbus TCP (port 502) من 1979. يعمل على master-slave: master يطلب، slave يرد. لا authentication،
              لا encryption. ASCII واضح.
            </Step>
            <Step n={2} title="بنية الـ frame">
              <Code lang="text">{`Modbus TCP Frame:
+--------+--------+--------+--------+--------+--------+
| Trans  | Proto  | Length | UnitID | FCode  | Data   |
| 2 byte | 2 byte | 2 byte | 1 byte | 1 byte | n byte |
+--------+--------+--------+--------+--------+--------+

Function Codes:
01 = Read Coils          (digital outputs)
02 = Read Discrete Input (digital inputs)
03 = Read Holding Reg    (analog values)
04 = Read Input Reg
05 = Write Single Coil   ← XX خطر: قلب valve
06 = Write Single Reg    ← XX خطر: تغيير setpoint
15 = Write Multiple Coils
16 = Write Multiple Regs`}</Code>
            </Step>
            <Step n={3} title="الفحص بأمان">
              <Code lang="bash">{`# READ ONLY على lab IP — لا تنفذ هذا على شبكة حية أبداً
# nmap NSE
nmap -p 502 --script modbus-discover 192.168.50.10

# python pymodbus
python3 -c "
from pymodbus.client import ModbusTcpClient
c = ModbusTcpClient('192.168.50.10', port=502)
c.connect()
r = c.read_holding_registers(0, 10, slave=1)
print(r.registers)"`}</Code>
            </Step>
          </Section>

          <Section title="DNP3 — أكثر تطوراً، نفس المشاكل">
            <p>
              DNP3 يدعم unsolicited reporting (PLC يرسل alert تلقائياً)، event timestamps، و reliable delivery.
              لكن النسخة الأساسية بدون مصادقة. <span className="eng">DNP3-SA</span> (Secure Authentication) أُضيفت
              في 2007، لكن انتشارها بطيء.
            </p>
            <Code lang="text">{`DNP3 على TCP port 20000

Application Layer Function Codes:
0x01 = Read           — قراءة data points
0x02 = Write          — تحديث قيم
0x05 = Direct Operate — تنفيذ control فوري ←  خطر
0x06 = Direct Op No Ack
0x0D = Cold Restart   — إعادة تشغيل PLC ← خطر`}</Code>
            <Card title="Stuxnet لمساً" color="amber">
              Stuxnet (2010) لم يستخدم DNP3 لكنه يعمل بنفس الفلسفة: حقن أوامر إلى PLC مع إخفاء التغييرات عن HMI.
              المهاجم كان يحاكي قراءات طبيعية بينما رفع تردد centrifuges فعلياً.
            </Card>
          </Section>

          <Section title="IEC-104 — معيار الكهرباء الأوروبي">
            <p>
              IEC 60870-5-104 هو الـ standard المهيمن في شبكات الكهرباء الأوروبية والآسيوية. Industroyer (2016
              هجوم Ukraine) و Industroyer2 (2022) كلاهما استهدفه.
            </p>
            <Code lang="text">{`IEC-104 على TCP port 2404

ASDU Type IDs المثيرة للقلق:
M_SP_NA_1 (1)   — Single point information
C_SC_NA_1 (45)  — Single command   ← يقلب breakers
C_DC_NA_1 (46)  — Double command   ← يفتح/يغلق switches
C_RC_NA_1 (47)  — Regulating step
C_SE_NA_1 (48)  — Setpoint command ← يغير threshold relays`}</Code>
          </Section>

          <Section title="هجوم نمطي على ICS — ما يبدو عليه">
            <Step n={1} title="Initial Access (Level 4)">
              Spear phishing على مهندس IT في الشركة، أو exploitation لـ VPN قديم. لا أحد يهاجم PLC مباشرة من الإنترنت.
            </Step>
            <Step n={2} title="Pivoting إلى DMZ (Level 3.5)">
              غالباً عبر historian server، jump host، أو laptop مهندس صيانة بصلاحيات مزدوجة.
            </Step>
            <Step n={3} title="Discovery (Level 2-3)">
              <Code lang="bash">{`# أدوات مثل GRASSMARLIN، ICSpector، Bandolier
nmap -p 502,20000,2404,44818,47808 10.10.10.0/24 --script default
# CIP/EtherNet/IP = 44818
# BACnet = 47808 (HVAC, building automation)`}</Code>
            </Step>
            <Step n={4} title="Lateral Movement to OT">
              عبر engineering workstation التي تعمل بـ Studio 5000، Step7، TIA Portal — تطبيقات تحمل cleartext
              credentials للـ PLCs.
            </Step>
            <Step n={5} title="Effect (Impact على Level 0-1)">
              إصدار write commands. Triton/Trisis (2017) استهدف Schneider Triconex SIS — جعل المحطة عمياء عن
              ظروف خطر بينما تستمر العملية.
            </Step>
          </Section>

          <Callout kind="danger" title="تحذير صارم">
            الفحص الفعّال (active scanning) على شبكة OT حية قد يتسبب في انفجار، تعطل خط إنتاج، أو خسائر بمليارات.
            كل العمل الـ ICS الحقيقي يبدأ بـ <strong>passive monitoring</strong> فقط (port mirror، Zeek، Claroty).
            أي فحص فعّال يحتاج maintenance window مع مهندس OT حاضر. فيدرالياً، اختبار ICS غير مصرّح به قد يقع
            تحت قانون <span className="eng">PIPDA</span> أو CIRCIA reporting.
          </Callout>

          <Callout kind="good" title="الدفاع — الفروقات المهمة">
            <ul>
              <li><strong>Network segmentation</strong>: data diodes (one-way) بين IT و OT، ليس firewalls فقط</li>
              <li><strong>Passive monitoring</strong>: Claroty، Nozomi، Dragos — لا يولد packets جديدة</li>
              <li><strong>Asset inventory</strong>: لا يمكن حماية ما لا تعرف وجوده — كثير من ICS shops لا يعرفون عدد PLCs لديهم</li>
              <li><strong>Engineering workstations</strong>: تعامل معها كـ Tier 0، لا يمكن استخدامها للبريد أو الويب</li>
              <li><strong>Backup configurations</strong> للـ PLCs offline — قد تكون فقدت حياة عند هجوم wiper</li>
              <li>Adopt المعيار <span className="eng">IEC 62443</span> + NIST SP 800-82</li>
            </ul>
          </Callout>

          <Section title="مصادر">
            <ul>
              <li>Robert M. Lee — SANS ICS courses (ICS410, ICS515)</li>
              <li>Dragos — Threat Intelligence Reports</li>
              <li>CISA — ICS Advisories Database</li>
              <li>MITRE ATT&CK for ICS — مصفوفة منفصلة عن enterprise</li>
              <li>Andrew Ginter — books on OT security architecture</li>
            </ul>
          </Section>
        </>}

        en={<>
          <Section title="A different world — why ICS is not IT">
            <Analogy>
              IT runs on "secure first, fast second." OT (Operational Technology) is the opposite: a power plant can
              tolerate seconds of latency, but one second of an alarm being delayed could mean an explosion. OT
              engineering was built on "when" mattering more than "what," and many of its protocols have no
              authentication at all because PLC-sensor traffic was assumed to live on an air-gapped network.
            </Analogy>
            <p>
              Reality today: those networks are no longer air-gapped. Stuxnet, Industroyer, Pipedream, CHIRP — every
              major campaign against critical infrastructure exploited protocols designed without protection. This
              lesson covers Modbus, DNP3, and IEC-104, the most common in power, water, and transport.
            </p>
          </Section>

          <Section title="ICS architecture — Purdue Model">
            <Code lang="text">{`Level 5 — Internet / cloud
Level 4 — Enterprise IT (ERP, email)
Level 3.5 — DMZ (jump servers, historians)
─── classical boundary ───
Level 3 — Operations management (SCADA HMIs)
Level 2 — Process supervisory (HMI, alarms)
Level 1 — Basic control (PLC, RTU, IED)
Level 0 — Physical (sensors, actuators, valves)`}</Code>
            <p>
              Modbus / DNP3 / IEC-104 live at Level 1-2. The attacker's goal: cross Level 3.5 (usually phished from
              IT) into Level 1 to issue real commands to the hardware.
            </p>
          </Section>

          <Section title="Modbus — the most widespread protocol">
            <Step n={1} title="What is it?">
              Modbus TCP (port 502) from 1979. Master-slave: master requests, slave answers. No auth, no encryption.
              ASCII in the clear.
            </Step>
            <Step n={2} title="Frame layout">
              <Code lang="text">{`Modbus TCP Frame:
+--------+--------+--------+--------+--------+--------+
| Trans  | Proto  | Length | UnitID | FCode  | Data   |
| 2 byte | 2 byte | 2 byte | 1 byte | 1 byte | n byte |
+--------+--------+--------+--------+--------+--------+

Function Codes:
01 = Read Coils          (digital outputs)
02 = Read Discrete Input (digital inputs)
03 = Read Holding Reg    (analog values)
04 = Read Input Reg
05 = Write Single Coil   ← XX dangerous: flip a valve
06 = Write Single Reg    ← XX dangerous: change a setpoint
15 = Write Multiple Coils
16 = Write Multiple Regs`}</Code>
            </Step>
            <Step n={3} title="Safe scanning">
              <Code lang="bash">{`# READ ONLY on a lab IP — never run this on a live network
# nmap NSE
nmap -p 502 --script modbus-discover 192.168.50.10

# python pymodbus
python3 -c "
from pymodbus.client import ModbusTcpClient
c = ModbusTcpClient('192.168.50.10', port=502)
c.connect()
r = c.read_holding_registers(0, 10, slave=1)
print(r.registers)"`}</Code>
            </Step>
          </Section>

          <Section title="DNP3 — more capable, same problems">
            <p>
              DNP3 supports unsolicited reporting (PLC volunteers an alert), event timestamps, and reliable delivery.
              The base spec is unauthenticated. <span className="eng">DNP3-SA</span> (Secure Authentication) was
              added in 2007, but adoption is slow.
            </p>
            <Code lang="text">{`DNP3 over TCP port 20000

Application-layer function codes:
0x01 = Read           — read data points
0x02 = Write          — update values
0x05 = Direct Operate — execute control immediately ← dangerous
0x06 = Direct Op No Ack
0x0D = Cold Restart   — reboot the PLC ← dangerous`}</Code>
            <Card title="Stuxnet aside" color="amber">
              Stuxnet (2010) didn't use DNP3 but matched the philosophy: inject commands into PLCs while masking
              changes from the HMI. The malware faked normal readings while it actually overspeeded centrifuges.
            </Card>
          </Section>

          <Section title="IEC-104 — the European power standard">
            <p>
              IEC 60870-5-104 dominates European and Asian power grids. Industroyer (2016 attack on Ukraine) and
              Industroyer2 (2022) both targeted it.
            </p>
            <Code lang="text">{`IEC-104 over TCP port 2404

Concerning ASDU Type IDs:
M_SP_NA_1 (1)   — Single point information
C_SC_NA_1 (45)  — Single command   ← flips breakers
C_DC_NA_1 (46)  — Double command   ← opens/closes switches
C_RC_NA_1 (47)  — Regulating step
C_SE_NA_1 (48)  — Setpoint command ← changes relay thresholds`}</Code>
          </Section>

          <Section title="What an ICS attack actually looks like">
            <Step n={1} title="Initial Access (Level 4)">
              Spear phishing an IT engineer, or exploitation of a legacy VPN. Nobody attacks a PLC straight from the
              internet.
            </Step>
            <Step n={2} title="Pivot to DMZ (Level 3.5)">
              Usually via a historian server, jump host, or maintenance engineer's laptop with dual privileges.
            </Step>
            <Step n={3} title="Discovery (Level 2-3)">
              <Code lang="bash">{`# Tools like GRASSMARLIN, ICSpector, Bandolier
nmap -p 502,20000,2404,44818,47808 10.10.10.0/24 --script default
# CIP/EtherNet/IP = 44818
# BACnet = 47808 (HVAC, building automation)`}</Code>
            </Step>
            <Step n={4} title="Lateral Movement to OT">
              Through an engineering workstation running Studio 5000, Step7, TIA Portal — applications that store
              cleartext credentials for the PLCs.
            </Step>
            <Step n={5} title="Effect (Impact on Level 0-1)">
              Issue write commands. Triton/Trisis (2017) targeted Schneider Triconex SIS — blinded the plant to
              dangerous conditions while the process kept running.
            </Step>
          </Section>

          <Callout kind="danger" titleEn="Strict warning">
            Active scanning on a live OT network can cause an explosion, halt a production line, or trigger billions
            in losses. Real ICS work begins with <strong>passive monitoring</strong> only (port mirror, Zeek,
            Claroty). Any active scan needs a maintenance window with an OT engineer present. In US federal context,
            unauthorized ICS testing can fall under <span className="eng">PIPDA</span> or CIRCIA reporting.
          </Callout>

          <Callout kind="good" titleEn="Defense — what matters here">
            <ul>
              <li><strong>Network segmentation</strong>: data diodes (one-way) between IT and OT, not just firewalls</li>
              <li><strong>Passive monitoring</strong>: Claroty, Nozomi, Dragos — never inject new packets</li>
              <li><strong>Asset inventory</strong>: you can't protect what you don't know exists — many ICS shops don't know how many PLCs they run</li>
              <li><strong>Engineering workstations</strong>: treat as Tier 0, no email, no web</li>
              <li><strong>Backup PLC configurations</strong> offline — would be lifesaving in a wiper attack</li>
              <li>Adopt <span className="eng">IEC 62443</span> + NIST SP 800-82</li>
            </ul>
          </Callout>

          <Section title="References">
            <ul>
              <li>Robert M. Lee — SANS ICS courses (ICS410, ICS515)</li>
              <li>Dragos — Threat Intelligence Reports</li>
              <li>CISA — ICS Advisories Database</li>
              <li>MITRE ATT&CK for ICS — separate matrix from enterprise</li>
              <li>Andrew Ginter — books on OT security architecture</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
