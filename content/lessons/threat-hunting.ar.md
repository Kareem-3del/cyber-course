# Threat Hunting: ليه تستنّى الـ alert يضرب لما الـ adversary نايم جنبك من 6 شهور؟

طب لو الـ APT الجوّاك دلوقتي ما عملش alert واحد، هتعرف منين إنه موجود؟
هتفضل قاعد قدّام الـ dashboard مستنّي اللون الأحمر؟
ولا هتقوم تدوّر بنفسك؟

الـ dwell time المتوسط في 2024 كان 10 أيام للضربات اللي اتلاقطت بـ alerts، و 50+ يوم للي اتلاقطت بـ hunting. والباقي اللي ما اتلاقاش؟ ما حدش يعرف. ربنا أعلم.

ده الفرق بين detection و hunting:

- **Detection:** انت كاتب rule. الـ rule بتشتغل لما حاجة معروفة تحصل. ممتاز للـ knowns.
- **Hunting:** انت مفترض إن في حد جوّه. وبتدوّر عليه. حتى لو محدش ضرب alert.

الـ hunter مش بيدوّر عشوائي. بيبدأ بـ **فرضية**: "لو أنا الـ attacker، ودخلت الشبكة دي، أكيد محتاج persistence. طب فين أسهل مكان؟ Scheduled Tasks. تعالوا نشوف مين عمل tasks جديدة آخر 7 أيام."

> [!info] الـ hunting cycle
> فرضية -> data -> query -> findings -> لو لقيت حاجة، اعمل alert منها. لو ما لقيتش، فرضية تانية. مفيش "قعدة" بدون فرضية.

## 1. صيد الـ LOLBAS — الـ adversary بيستخدم أدواتك

**الفرضية:** الـ attacker مش غبي يرفع `evil.exe`. هيستخدم binaries موقّعة من Microsoft أصلاً — `mshta`, `rundll32`, `regsvr32`, `mshta` — عشان يعدّي من الـ AV.

السؤال البديهي: ليه موظف في المالية يشغّل `mshta.exe` وبتتكلم مع IP في الفلبين؟

```kql
// ليه؟ عشان نلاقي LOLBAS بيتكلموا net، اللي ده مش طبيعي للـ binaries دي
DeviceProcessEvents
| where FileName in~ ("mshta.exe","rundll32.exe","regsvr32.exe")
| where ProcessCommandLine has_any ("http://","https://","javascript:")
| where InitiatingProcessFileName !in~ ("explorer.exe")
```

## 2. Persistence من غير ما حد يحس — WMI + schtasks

**الفرضية:** الـ adversary عايز يفضل بعد الـ reboot. بدل ما يستخدم Run keys اللي EDR بيشمّها من بعيد، هيعمل Scheduled Task من خلال WMI عشان يخفي الـ parent.

لو لقيت `wmic.exe` parent لـ `schtasks.exe /create`، اقعد قدّام الشاشة ساعة. ده مش admin بيعمل maintenance.

```kql
// ليه؟ عشان الـ legit admins بيعملوا tasks من PowerShell أو الـ GUI
// مش من wmic. الـ pattern ده تقريباً 100% adversary tradecraft
DeviceProcessEvents
| where FileName =~ "schtasks.exe" and ProcessCommandLine has "/create"
| where InitiatingProcessFileName =~ "wmic.exe"
```

## 3. LSASS access — أم الـ techniques

**الفرضية:** أي حد عايز lateral movement محتاج credentials. الـ credentials في LSASS process. أي حد بيلمس LSASS من غير ما يكون Defender أو الـ EDR — مشبوه لحد إثبات العكس.

mimikatz ده الـ classic. لكن الـ smart adversary بيستخدم `rundll32 comsvcs.dll MiniDump` — موقّع من Microsoft، LOLBAS، بيعمل dump للـ LSASS من غير ما يحمّل DLL غريب.

```kql
// ليه؟ comsvcs.dll + MiniDump = signature معروف لسرقة creds
DeviceProcessEvents
| where FileName =~ "rundll32.exe" and ProcessCommandLine has_all ("comsvcs.dll","MiniDump")
```

> [!warning] غلطات الـ junior
> - بيعمل query ويلاقي 50 result، يقفلها ويقول "false positives". لا. كل واحد فيهم لازم تتأكد منه. هي دي الشغلانة.
> - ما بيـ pivot-ش. لقى process مشبوه؟ شوف الـ network connections بتاعته. شوف الـ files اللي touched. شوف الـ user اللي ran. الـ hunt بيتفرّع، مش بيخلص في query واحدة.
> - بيعتمد على قاعدة الـ MDR. لا. الـ MDR شغّال على alerts. الـ hunt شغلك انت.

## 4. OAuth phishing — السكة الجديدة في الـ cloud

**الفرضية:** الـ adversary اللي شاطر مش بيتعب نفسه يخترق device. بيعمل multi-tenant app في Azure، بيبعت link للموظف، الموظف بيوافق على الصلاحيات، خلاص — الـ app عنده Mail.ReadWrite لحد ما حد يلاحظ.

في 2022 كذا حملة من Storm-0558 و Midnight Blizzard اشتغلت بالـ pattern ده.

```kql
// ليه؟ الـ consent grants من غير admin review = أكبر hole في M365
AuditLogs
| where OperationName == "Consent to application"
| where Scopes has_any ("Mail.ReadWrite","Files.ReadWrite.All","User.ReadWrite.All")
| where ConsentType == "User"
```

الحل الإداري قبل التقني: اقفل user consent. خلّيها admin-approved بس. 5 دقايق في Entra portal.

## 5. DNS tunneling — الهروب الصامت

**الفرضية:** الـ firewall قافل كل حاجة. بس DNS مفتوح (لازم يكون مفتوح). الـ adversary هيخبّي الـ exfil في DNS queries.

العلامة: device واحد بيبعت آلاف الـ unique subdomains لنفس الـ parent domain في ساعة. ده مش browsing. ده tunnel.

```spl
index=dns
| stats dc(query) as unique_subs by src_ip parent
| where unique_subs > 200
```

أدوات معروفة: dnscat2, iodine, Cobalt Strike DNS beacon. الـ entropy بتاع الـ subdomain عالي جداً. هتلاحظها لو بتبصّ.

## انت بتعمل ايه فعلاً؟

الهدف مش تملا الـ dashboard بـ queries.
الهدف تبني عضلة.

- الـ hunt = تمرين لدماغك ولـ data بتاعتك.
- لو لقيت حاجة، حوّلها فوراً لـ **detection rule دائمة**. ما تكتشفش نفس الحاجة مرتين.
- لو ما لقيتش حاجة، documented الـ hypothesis والـ query — الـ negative result بردو نتيجة.

كل أسبوع اسأل نفسك: ايه الفرضية الجديدة اللي هاطاردها الأسبوع ده؟
لو مفيش فرضية، انت مش بتصطاد. انت بتـ wait.
الـ adversary مش بيستنى.

## الخلاصة الناشفة

Hunting محتاج 3 حاجات بس:
1. **Telemetry نضيفة:** EDR + Sysmon + DNS logs + identity logs. لو ما عندكش data، الـ queries كلام فاضي.
2. **Hypothesis-driven mindset:** ابدأ بـ TTP من ATT&CK، اسأل "إزاي ده هيبان عندي؟"، اعمل الـ query.
3. **Iteration:** كل hunt بيكشف data gap أو detection gap. سدّه. اللي وراه بيكون أصعب.

الـ alerting بيلاقطلك المعروف. الـ hunting بيلاقطلك اللي ما حدش لسه عمله rule.
ومحدش هيعمل rule لـ technique لسه ما اتشافتش.
يبقى لازم انت اللي تشوفها الأول.
