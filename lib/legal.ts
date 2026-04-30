/**
 * Legal document version registry.
 * ----------------------------------------------------------------------------
 * Single source of truth for the "Last Updated" date and version number shown
 * on the Terms of Service and Privacy Policy pages.
 *
 *  HOW TO PUBLISH AN UPDATE
 *  1. Edit the document body in `app/[locale]/legal/<slug>/page.tsx`.
 *  2. Bump the matching `version` below (semver-ish: 1.0.0 → 1.1.0 for material
 *     changes, 1.0.0 → 1.0.1 for typo / clarifying fixes).
 *  3. Set `effectiveDate` to today's ISO date (YYYY-MM-DD).
 *  4. Append a one-line entry to `changelog` summarising what changed.
 *  5. Commit. The header on each legal page will pick it up automatically.
 *
 *  Material changes (new data uses, new restrictions, new third parties)
 *  SHOULD be announced in-product (banner) for at least 14 days before the
 *  effective date. Use `noticePeriodDays` to gate that banner.
 *
 *  IMPORTANT: This file ships templates that are *starting points*, not
 *  attorney-reviewed final documents. Have local counsel review before any
 *  public launch. Anthropic, Claude, and the maintainers of this repo do not
 *  provide legal advice.
 * ----------------------------------------------------------------------------
 */

export interface LegalDoc {
  slug: "terms" | "privacy";
  version: string;
  effectiveDate: string; // YYYY-MM-DD
  noticePeriodDays: number;
  changelog: { date: string; note: { ar: string; en: string } }[];
}

export const LEGAL: Record<"terms" | "privacy", LegalDoc> = {
  terms: {
    slug: "terms",
    version: "1.0.0",
    effectiveDate: "2026-04-30",
    noticePeriodDays: 14,
    changelog: [
      {
        date: "2026-04-30",
        note: {
          ar: "النشر الأولي لشروط الاستخدام.",
          en: "Initial publication of the Terms of Service.",
        },
      },
    ],
  },
  privacy: {
    slug: "privacy",
    version: "1.0.0",
    effectiveDate: "2026-04-30",
    noticePeriodDays: 14,
    changelog: [
      {
        date: "2026-04-30",
        note: {
          ar: "النشر الأولي لسياسة الخصوصية.",
          en: "Initial publication of the Privacy Policy.",
        },
      },
    ],
  },
};

/**
 * Replace these with your real operating entity, jurisdiction, and contact
 * channels before going live. Keeping them in one place avoids hunting for
 * stale references across multiple files.
 */
export const ENTITY = {
  name: { ar: "أكاديمية العمليات السيبرانية المتقدمة", en: "Advanced Cyber Operations Academy" },
  legalName: { ar: "كريم عادل (kareem-3del)", en: "Kareem Adel (kareem-3del)" },
  // Operating as a sole maintainer for now. Replace with a registered legal
  // entity if/when the project incorporates.
  jurisdiction: { ar: "[الولاية القضائية — لتُحدَّد عند التسجيل]", en: "[Jurisdiction — to be set on incorporation]" },
  governingLaw: { ar: "[القانون الواجب التطبيق — لتُحدَّد عند التسجيل]", en: "[Governing law — to be set on incorporation]" },
  contactEmail: "kareem.adel.zayed@gmail.com",
  privacyEmail: "kareem.adel.zayed@gmail.com",
  abuseEmail: "kareem.adel.zayed@gmail.com",
  website: "https://github.com/kareem-3del",
};
