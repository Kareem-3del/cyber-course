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
