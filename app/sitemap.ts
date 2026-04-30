import type { MetadataRoute } from "next";
import { LESSONS } from "@/lib/lessons";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kareem-3del.github.io";
const LOCALES = ["ar", "en"] as const;

const STATIC_PATHS = [
  { path: "", priority: 1.0, freq: "weekly" as const },
  { path: "/roadmap", priority: 0.9, freq: "monthly" as const },
  { path: "/lessons", priority: 0.9, freq: "weekly" as const },
  { path: "/glossary", priority: 0.6, freq: "monthly" as const },
  { path: "/tools", priority: 0.6, freq: "monthly" as const },
  { path: "/contact", priority: 0.5, freq: "yearly" as const },
  { path: "/legal", priority: 0.3, freq: "yearly" as const },
  { path: "/legal/terms", priority: 0.3, freq: "yearly" as const },
  { path: "/legal/privacy", priority: 0.3, freq: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const out: MetadataRoute.Sitemap = [];

  for (const { path, priority, freq } of STATIC_PATHS) {
    for (const locale of LOCALES) {
      out.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: freq,
        priority,
        alternates: {
          languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`])),
        },
      });
    }
  }

  for (const lesson of LESSONS) {
    for (const locale of LOCALES) {
      out.push({
        url: `${SITE_URL}/${locale}/lessons/${lesson.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/lessons/${lesson.slug}`])),
        },
      });
    }
  }

  return out;
}
