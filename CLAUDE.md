# CLAUDE.md — Project Rules

This is a **bilingual (AR/EN) advanced cybersecurity course** for authorized government training. Read these rules first; everything below overrides general defaults.

---

## 1. Project context

- **Stack:** Next.js 14 App Router · TypeScript · Tailwind · Lucide icons.
- **Audience:** Government red/blue teams; authorized pentesters.
- **Tone:** Professional educational. Each lesson explains *attack mechanics + defensive countermeasures*. Always pair an offensive technique with how to detect/mitigate it.
- **Legal:** All offensive content is for authorized engagements only. Every lesson must include a `Callout kind="danger"` warning when describing intrusion techniques.

---

## 2. Architecture

```
app/
├── layout.tsx          ← root <html lang=ar dir=rtl> shell ONLY
├── page.tsx            ← redirect / → /ar (cookie/Accept-Language aware)
├── globals.css
└── [locale]/           ← every real page lives here
    ├── layout.tsx      ← I18nProvider + ProgressProvider + AppShell
    ├── page.tsx        ← home
    ├── glossary/page.tsx
    ├── tools/page.tsx
    └── lessons/<slug>/page.tsx

components/
├── SiteChrome.tsx      ← AppShell, SiteHeader, SiteFooter
├── Sidebar.tsx         ← left/right collapsible nav with progress
├── LessonShell.tsx     ← <LessonShell>, <Section>, <Callout>, <Code>, <Terminal>, <Step>, <Card>, <TwoCol>, <Analogy>
├── L.tsx               ← locale-aware <Link> — USE THIS, never next/link directly
├── LanguageToggle.tsx
└── LocaleHtml.tsx      ← syncs <html lang/dir> with current locale

lib/
├── i18n.tsx            ← useI18n(), <T>, <L>, locale state
├── lessons.ts          ← LESSONS metadata array (single source of truth for nav/progress)
├── progress.tsx        ← useProgress() — localStorage completion tracking
├── glossary.ts         ← GLOSSARY terms data
└── tools.ts            ← TOOLS catalog data
```

---

## 3. Bilingual content — non-negotiable rules

Every user-facing string ships in both AR and EN. Three patterns, pick the right one:

| Use case | Component |
|---|---|
| Short inline string | `<T ar="نص" en="text" />` |
| Block of JSX (paragraph, list, whole section) | `<L ar={<>...</>} en={<>...</>} />` |
| Optional title/heading on shared components | `title="..." titleEn="..."` props |

**Lesson body pattern:** every lesson page wraps content in a single top-level `<L ar={...} en={...} />`. Never mix languages in one branch.

**Object-shaped strings** in metadata files use `{ ar: string; en: string }` — see `lib/lessons.ts`, `lib/glossary.ts`, `lib/tools.ts`.

**Code blocks (`<Code>`, `<Terminal>`)** stay LTR + monospace regardless of language. Comments inside code may be translated, but commands stay identical.

---

## 4. Locale-aware links — non-negotiable

**Never import `next/link` directly.** Use the wrapper:

```tsx
import { Link } from "@/components/L";
<Link href="/lessons/recon">...</Link>   // becomes /ar/lessons/recon or /en/...
```

The wrapper auto-prefixes the active locale. External URLs and already-prefixed paths pass through untouched.

For programmatic navigation use `useI18n().href("/path")` to build a locale-aware URL.

When comparing `usePathname()` for active states, **strip the locale first**:

```tsx
const path = (usePathname() ?? "/").replace(/^\/(ar|en)(\/|$)/, "/").replace(/\/$/, "") || "/";
```

---

## 5. Adding a new lesson — exact recipe

1. **Add metadata** to `LESSONS` in `lib/lessons.ts` (slug, number, AR+EN title/subtitle, track, level, duration, icon, tags).
2. **Create file:** `app/[locale]/lessons/<slug>/page.tsx`. Use this skeleton:

```tsx
"use client";
import { LessonShell, Section, Callout, Code, Terminal, Step, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="<slug>">
      <L
        ar={<>
          <Section title="...">
            <Analogy>...</Analogy>
            <Callout kind="danger" title="...">...</Callout>
            ...
          </Section>
        </>}
        en={<>
          <Section title="...">
            ...
          </Section>
        </>}
      />
    </LessonShell>
  );
}
```

3. **Tracks** are: `intro` | `red` | `blue` | `ops`. The sidebar groups by track automatically.
4. **Always include a defensive section** (`Callout kind="good"` titled "الدفاع / Defense") for every offensive technique.

---

## 6. Visual conventions

- **Dark theme only.** Background `#070b14`, panel `#0d1424`, accent `#22d3ee`.
- **No emoji in UI** (per user's global rule). Use Lucide icons.
- **Chips** for tags: `chip`, `chip-red` (offense), `chip-blue` (defense), `chip-amber` (ops/intel), `chip-green` (good/OSS).
- **Terminal mocks** via `<Terminal lines={[...]} />` — for output examples, not real shell sessions.
- **Code blocks** use `<Code lang="bash">{`...`}</Code>` — `lang` is just a label, no syntax highlighting.

---

## 7. Content guidelines

**Do:**
- Explain *why* a vulnerability exists, not just *how* to exploit it.
- Pair every offensive technique with detection & defense.
- Reference public tools, papers, CVEs, and well-documented techniques.
- Use real-world incident examples (SolarWinds, Stuxnet, etc.) for context.
- Include MITRE ATT&CK mappings where relevant.
- Start sections with an `<Analogy>` for non-obvious concepts.

**Don't:**
- Write working zero-days against current production products.
- Provide ready-to-run ransomware/wiper/stealer code.
- Drop bypasses for current commercial EDR/AV as turnkey tools.
- Target real assets in examples — use `target.gov`, `corp.local`, RFC 5737 IPs.
- Add explanatory comments to obvious code; keep the **why** comments only.

---

## 8. Code style

- **TypeScript strict.** Every component typed. No `any` except in narrow exits.
- **Named exports** preferred for components; default export only for Next.js pages.
- **Server vs Client:** lesson pages are `"use client"` (they use `useI18n`). Pure server components (e.g., root `page.tsx`) stay server. Don't add `"use client"` unless the component actually needs hooks.
- **Co-locate** small helpers in their own file when reused (`components/L.tsx` is the model).
- **No CSS-in-JS libs.** Tailwind classes + `globals.css` only.
- **No state libs.** React context (`I18nProvider`, `ProgressProvider`) is enough.

---

## 9. RTL / LTR considerations

- Use **logical CSS** properties: `start`/`end`, `ms-*`/`me-*`, `border-s`/`border-e`. Avoid `left`/`right` unless the position is direction-agnostic.
- Tailwind `rtl:`/`ltr:` variants have **higher specificity than `md:`** because they generate `[dir=rtl]` selectors. When a desktop variant must override, use `md:!classname` (with `!important`) — see Sidebar.
- Arrows (`<-` for previous, `->` for next) flip direction by language: `ChevronLeft` for next in AR, `ChevronRight` in EN. Pattern is in `LessonShell.tsx`.
- Wrap ENG-only text inside RTL paragraphs in `<span class="eng">…</span>` so bidi isolation is correct.

---

## 10. Adding a tool / glossary term

- **Tool:** append to `TOOLS` in `lib/tools.ts`. Required: `name`, `category`, `side` (`red`/`blue`/`both`), `oss` boolean, `os` array, AR+EN `blurb`, AR+EN `whenToUse`. Optional: `install`, `examples`, `url`. The `/tools` page picks it up automatically; no other code changes.
- **Glossary term:** append to `GLOSSARY` in `lib/glossary.ts`. Required: `term`, `category`, AR+EN `definition`. Auto-listed on `/glossary`.

---

## 11. Build & verify

```bash
npm run dev      # http://localhost:3000
npm run build    # production build — must pass cleanly
```

After non-trivial changes, **always run `npm run build`**. The build catches missing locale routes, broken imports, and TS errors that `next dev` may miss with stale chunks.

If `next dev` shows MODULE_NOT_FOUND after a refactor, **wipe `.next/`** and restart — the dev cache goes stale on file moves.

---

## 12. Things that must NOT regress

- Every lesson reachable at both `/ar/lessons/<slug>` and `/en/lessons/<slug>`.
- Sidebar visible on desktop (≥768px) in both RTL and LTR.
- Language toggle in the header swaps the URL, not just the cookie.
- Progress (localStorage) survives navigation across lessons.
- `<html lang/dir>` set correctly on first paint (root layout sets default; `LocaleHtml` syncs after).
- Build output shows every lesson generated for **both** locales (`● /[locale]/lessons/...` with two children).

---

## 13. When in doubt

- Match an existing lesson's structure (e.g., `lessons/cloud/page.tsx`) before inventing a new pattern.
- Match an existing component's style (Sidebar, LessonShell) before inventing new chrome.
- Ask before introducing a new dependency. The current set (`next`, `react`, `lucide-react`, `tailwindcss`, `react-markdown`, `remark-gfm`, `rehype-raw`) is intentional — don't pull in CSS frameworks, animation libs, or i18n libs.

---

## 14. دليل كتابة المحتوى العربي — أسلوب "الخبير المرشد" (Egyptian Tech-Mentor Style)

النصوص العربية في الدروس لازم تتبع هذا الأسلوب. الهدف: تحويل المادة من "نصوص جافة" إلى "جلسة توجيهية" مع خبير محترف.

### 14.1 الروح والنبرة
- **نبرة الخبير**: تخيل إنك Senior بتجلس مع زميل أصغر — مرشد، مش محاضر.
- **المباشرة**: ادخل في "الزتونة" فوراً. لا جمل طويلة معقدة.
- **التحدي**: استخدم أسئلة استنكارية تحفّز التفكير ("هو إحنا بنعمل كدة ليه؟").
- **الصراحة**: انقد الأخطاء الشائعة بصراحة ("ده عبث"، "ده استهتار") لتوضيح الخطورة.

### 14.2 اللغة واللهجة
- **مزيج ذكي**: عربية فصحى بسيطة (لغة التقارير) + لهجة مصرية بيضاء (لغة المهنيين).
- **الوضوح**: تجنب الكلمات المقعرة. استخدم كلمات حية: "خرم"، "سكة"، "تلمس"، "تحرق"، "عك".
- **القصص**: أمثلة حياتية وقصص (واقعية أو افتراضية) تقرّب المفاهيم.

### 14.3 المصطلحات التقنية
- **الإنجليزية هي الأصل**: أسماء الأدوات، البروتوكولات، الثغرات تبقى بالإنجليزية (`Active Directory`, `Payload`, `AitM`).
- **التعريب الوظيفي**: لا تترجم حرفياً ("الصيد الذكي") — استخدم التعبير المهني المعتمد ("التصيد الموجه — Spear-Phishing").
- **الشرح قبل التسمية**: اشرح الفكرة بالعربي، بعدين اذكر المصطلح الإنجليزي.

### 14.4 هيكل الدرس
1. **الخطاف (The Hook)**: ابدأ بتساؤل أو صدمة منطقية تجذب القارئ.
2. **الفلسفة (The Why)**: المنطق قبل الأوامر.
3. **التطبيق (The How)**: أكواد وأوامر مع تعليقات تشرح "ليه" مش بس "إزاي".
4. **المنظور الدفاعي**: اختم دائماً بنصيحة Blue Team وكيف يفكرون لمواجهة الهجوم.
5. **الخلاصة**: نصيحة أخيرة "ناشفة" تلخص أهمية الدرس.

### 14.5 قواعد ذهبية
- **بلاش placeholders**: لو محتاج صورة، ولّدها أو اشرحها بعمق.
- **مخاطبة مباشرة**: استخدم "أنت" و"إحنا" لإشعار القارئ إنه جزء من العملية.
- **Logic over Syntax**: فهم "ليه نختار الهدف ده" أهم من حفظ "إزاي نشغل الأداة".
- **تجنب الحشو**: أي جملة لا تضيف معلومة أو توضح منطق — احذفها.

> **تذكر دايماً:** أنت مش بس بتعلم هكر، أنت بتبني "عقلية" محترف.

---

### 14.6 الحركات المميزة (Signature Moves) — النبرة المطلوبة بالظبط

اللي بيفرّق بين "محتوى ترجمة منمّق" و"خبير مصري بيتكلم"، الحركات دي:

**1. شلال الأسئلة الاستنكارية المتصاعدة**
```
ولما الـ entry-level jobs هتختفي.. أول وظيفة هتبقى ايه؟
هيبقى senior على طول؟
وهنجيب seniors جداد منين؟ هنزرعهم؟
```
ثلاث أسئلة ورا بعض، كل سؤال بيكشف سخف اللي قبله. مش "سؤال واحد محترم" — مطاردة منطقية.

**2. السلسلة المنطقية المكشوفة (لو X.. يبقى Y.. وبالتالي Z)**
بدل ما تقول "ده بيؤدي لكذا"، فكّك الخطوات:
```
لو كل الشركات استغنت عن الـ entry-levels؟
هيحصل عجز.. انت قفلت السكة على أي حد يدخل المجال..
فطبيعي بعد فترة ما تلاقيش حد..
فاللي عايزه هيبقى قديم وغالي..
وبعد سنين من العبث ده، هتلاقي نفسك محتاج اللي استغنيت عنه.
```
المنطق بيتكشف خطوة خطوة، فالقارئ بيوصل للنتيجة معاك مش منك.

**3. المواجهة المباشرة في النهاية**
بعد ما تبني الحجة، اضرب بسؤال مواجهة:
```
فأنتوا بتعملوا ايه؟ ولا ناويين على ايه؟
آخرة العبث والكلام الفارغ ده ايه؟
```

**4. التواضع كأداة سلطة**
بدل ما تتكلم من فوق، اعترف إنك غلطت:
```
لو حذرتك من حاجة غلط، فده مش علشان أنا مثالي..
لا. علشان أنا عملت الغلط ده قبل كده، وشفت بنفسي إن النتيجة مش حلوة.
```
المصداقية بتيجي من إنك "كنت في مكانه"، مش من إنك "فوقه".

**5. الإيقاع المتقطّع — السطور القصيرة**
بلاش فقرات طويلة. فكّر في النص كأنه كلام منطوق:
```
انت كده كده هتغلط في شغلك.
سواء قاصد أو غصب عنك.
أهم حاجة: تتعلم وتبقى عارف إنه غلط.
```
كل سطر فكرة. السطور القصيرة بتدّي وزن.

**6. السخرية اللي بتقطع الكلام الرنان**
أي حاجة فيها hype أو تسويق فاضي، اقطعها بسخرية:
- "آخرة العبث ده ايه؟"
- "كلام فارغ ما يطلعش من عيال صغيرة"
- "ده مش شغل، ده استهتار"
- "ده مش defense، ده تمثيل defense"

**7. المفردات اللي بتنزّل الجملة من السماء للأرض**
استبدال جذري للمفردات المترجمة:

| ترجمة جامدة (تجنّبها) | البديل المهني |
|---|---|
| "أضعف حلقة" | "أرخى نقطة في المنظومة" |
| "السلطة" (Authority) | "هيبة المنصب" |
| "الاستعجال" (Urgency) | "ضغط الوقت" |
| "الإجماع" (Social Proof) | "ضغط الجماعة" |
| "الإعجاب" (Liking) | "الألفة" |
| "المعاملة بالمثل" | "رد الجميل" |
| "الالتزام" (Commitment) | "التورّط التدريجي" |
| "اعرف عدوك" | "اعرف اللي قصادك" |
| "بيقتل من جذوره" | "بيقفل السكة من أصلها" |
| "محصّن" | "متحصّن" |
| "النتيجة" (في callout) | "الخلاصة" / "اللي بيحصل فعلياً" |

**8. التحذير ببنية جملة "لو.. يبقى.."**
بدل "هذا خطر"، استخدم:
```
لو شغّلت ده على prod من غير canary؟ يبقى أنت مش engineer، أنت مقامر.
```

**9. التشبيه الشعبي بدل المرجعية الأكاديمية**
بدل ما تقول "وفقاً لـ NIST 800-53"، قول:
```
دي زي ما البواب يقفل الباب الكبير ويسيب شباك الحمام مفتوح.
الـ baseline لازم يبقى consistent، مش "حتة قافلة وحتة سايبة".
```

**10. اعتراف بالواقع المصري/العربي**
لما الموضوع له سياق محلي، صرّح:
```
في كتير من الجهات عندنا، الـ patching policy موجودة على ورق وبس..
الواقع: السيرفر شغّال من 2019 وما اتلمسش.
ما بنحلش المشكلة دي بـ tool — بنحلها بقرار إداري.
```

---

### 14.7 قبل ما تكتب — اسأل نفسك

- لو القارئ مصري Senior بيشرب قهوته، هيقرا ده ولا يقول "ده ChatGPT"؟
- في كام سؤال استنكاري؟ (لو صفر، أنت بتحاضر، مش بترشد.)
- اعتراف بغلطة شخصية / حقيقة محرجة موجود؟ (الصدق بيكسر الجدار.)
- في جملة سخرية واحدة على الأقل بتقطع الإيقاع؟
- المفردات اللي استخدمتها، حد بيقولها فعلاً في جروب الشغل؟ ولا دي ترجمة Google؟
