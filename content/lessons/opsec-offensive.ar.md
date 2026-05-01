# OPSEC الهجومي: إزاي ما تسيبش "فردة شبشب" ورا تكشف العملية كلها؟

طب لو معاك 0-day بمليون دولار، وعملت العملية نضيفة من ناحية تقنية، بس فتحت Gmail الشخصي بتاعك مرة واحدة من نفس الـ VM..
هل ينفع نقول إنك "اخترقت الهدف"؟
ولا الأصح نقول إن الهدف اخترقك انت؟

OPSEC مش بارانويا. مش paranoia.
ده النضافة الرقمية. خلاص.

اللي بيحصل في الواقع — ومش بحب أتكلم عنه كتير بصراحة — إن المحقق الشاطر مش بيدوّر على الـ malware بتاعك. بيدوّر على الغلطة البشرية. الكود ممكن يكون obfuscated جداً، الـ infrastructure ممكن تكون متشبكة كويس، بس انت لو سبت username بتاعك في PDB path واحد، خلاص. attribution خلصت.

> [!danger] قبل ما تكمّل
> الكلام ده كله authorized engagements. OPSEC في عملية مش قانونية = تأجيل لحظة القبض عليك بس. مش اختفاء. القانون الدولي وصل لأماكن ما كانش حد متخيل يوصلها.

## الـ 5 غلطات اللي بتحرق أي عملية

1. **إعادة استخدام الـ infrastructure.** نفس السيرفر، نفس الدومين، نفس الـ TLS cert في عمليتين. لو واحدة اتكشفت، التانية حرقت معاها. الـ pivoting في الـ threat intel ده بياكل عيش.
2. **الـ IP الحقيقي.** مرة واحدة. من نت البيت "بالغلط". خلاص. مفيش حاجة اسمها بالغلط.
3. **خلط الهوية.** تفتح Gmail الشخصي على VM العملية. تفتح Twitter بتاعك. تشتري حاجة من Amazon. ده مش OPSEC، ده تمثيل OPSEC.
4. **بصمات التوقيت واللغة.** comments عربي في الكود. timezone محلي في الـ build artifacts. PDB paths فيها username بتاعك. لغة الـ keyboard في الـ screenshots.
5. **الكسل في الكود.** نفس الـ mutex name. نفس مفتاح الـ XOR. نفس الـ User-Agent string. الـ malware analysts بيربطوا الحاجات دي في ثواني — عمل ده Mandiant مع APT1، وعمله CrowdStrike مع كذا group.

## الهوية: انت مش "انت" في العملية

لازم تفصل تماماً. مش "تحاول". لازم.

- **Persona مستقل لكل عملية:** إيميل جديد، رقم تليفون جديد (eSIM من بلد محايدة)، crypto wallet ما اتلمسش قبل كده.
- **المتصفح هو الفخ:** الـ browser fingerprinting بيكشفك حتى لو الـ VPN شغّال. كل extension، كل font، كل canvas hash — كله fingerprint. استخدم VM نضيفة + Mullvad Browser أو Tor Browser.

```terminal
# قاعدة ناشفة:
# الجهاز الشخصي على شبكة، والـ ops VM على شبكة تانية خالص.
# مفيش تقاطع. ولا حتى bluetooth.
```

## السلسلة: من غير ما تنقطع

```
You -> Tor entry -> VPN (دفعت بـ Monero) -> redirector -> C2 -> target
```

كل طبقة بتدّيك deniability. لو طبقة وقعت، اللي وراها لسه شغّالة. لو الـ redirector اتحرق، الـ C2 لسه نضيف.

اللي بيكسر السلسلة دي عادةً مش هجوم تقني — بيكون انت. لحظة كسل. لحظة شغّلت الـ VPN بعد ما فتحت browser. لحظة DNS leak. لحظة WebRTC leak.

## ايه اللي بيكشفك في الكود؟

بصّ المعلومة دي. المحلل لما بيـ reverse الـ malware بتاعك، بيدوّر على:

- **PDB paths:** `C:\Users\Ahmed\source\repos\dropper\Release\dropper.pdb` — انت كده عرّفت نفسك. مكسوف.
- **Strings:** أخطاء إملائية متكررة، تعابير محلية، debug messages ما اتمسحتش.
- **Crypto constants:** نفس الـ XOR key. نفس الـ RC4 seed.
- **Compilation timestamps:** بيقولوا في أي timezone اتعمل الـ build.
- **Imports order, section names, packer signatures** — كلها بصمة.

> [!warning] غلطات الـ junior
> - بيـ strip الـ symbols بـ `/PDBALTPATH:none` بس ناسي الـ rich header.
> - بيستخدم نفس الـ template للـ malware في كل عملية. أول analyst هيشوفه هيقولك "ده فلان".
> - بيختبر الـ malware على VirusTotal. VT بيشير الـ samples للـ vendors. انت كده وزّعت الـ malware بنفسك للـ blue team العالمي.

## Anti-forensics: الذكي vs العبيط

في ناس فاكرة إن مسح الـ logs = إخفاء. لا. الـ logs الممسوحة = أكبر red flag للـ DFIR analyst. الـ gap في الـ Security event log بين 02:14 و 02:47 بيبص في عينك من بعيد.

- بدل ما تمسح كل حاجة، امسح الـ events اللي تخصك بس (selective log clearing بـ EventID-specific deletion).
- **Timestomping:** خلّي الملف يبان قديم.

```bash
# نسخ الـ timestamps من ملف نظام شرعي
# ليه؟ عشان لما الـ analyst يـ sort بالـ ctime، ملفك ما يبانش "غريب"
touch -r /bin/ls /tmp/evil_file
```

بس انتبه — الـ MFT بيحتفظ بـ multiple timestamps. EnCase و FTK بيقروهم كلهم.

## للمدافع: ايه اللي بتبصّ عليه فعلاً؟

ما تدوّرش على الـ malware. دوّر على مخالفات الـ OPSEC:

- دومين متسجل من 3 أيام ومعمول له SSL cert من ساعتين؟ مشبوه.
- اتصال على port 443 بس الـ traffic مش TLS سليم (JA3 hash غريب)؟ مشبوه.
- login من ASN مش معتاد، في توقيت غريب، بـ user-agent ما حدش في الشركة بيستخدمه؟ مشبوه.
- PowerShell بيـ download من دومين عمره أسبوع؟ بلوك.

## الخلاصة الناشفة

OPSEC هو الفرق بين الـ operator اللي بيخلّص العملية ويروح ينام، واللي بيصحى على الباب بيتكسر.
الانضباط مش رفاهية.
هو الشغل نفسه.

ولو حسّيت إنك "متعب" أو "مستعجل" — ده بالظبط الوقت اللي بتغلط فيه. وقّف العملية، نام، ارجع تاني. الغلطة في OPSEC مش بترجع.
