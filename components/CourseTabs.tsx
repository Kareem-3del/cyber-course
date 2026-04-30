"use client";
import { Link } from "@/components/L";
import { usePathname } from "next/navigation";
import { useI18n, T } from "@/lib/i18n";

const TABS: { href: string; ar: string; en: string }[] = [
  { href: "/course",          ar: "نظرة عامة", en: "Overview" },
  { href: "/course/roadmap",  ar: "المسار العملياتي", en: "Operational Roadmap" },
  { href: "/course/lessons",  ar: "الوحدات الدراسية", en: "Curriculum Modules" },
  { href: "/course/glossary", ar: "المعجم التقني", en: "Technical Glossary" },
  { href: "/course/tools",    ar: "صندوق الأدوات", en: "Technical Toolkit" },
];

/**
 * Strip locale prefix and trailing slash for comparing pathnames.
 * `/ar/course/lessons/foo` -> `/course/lessons/foo`
 */
function stripLocale(p: string) {
  return p.replace(/^\/(ar|en)(\/|$)/, "/").replace(/\/$/, "") || "/";
}

export function CourseTabs() {
  const { lang } = useI18n();
  const path = stripLocale(usePathname() ?? "/");

  return (
    <nav className="sticky top-[72px] z-30 bg-white border-b-[3px] border-black overflow-x-auto">
      <div className="flex min-w-max max-w-[1200px] mx-auto px-4 md:px-10">
        {TABS.map((t) => {
          // /course matches exactly; deeper tabs match by prefix
          const active =
            t.href === "/course" ? path === "/course" : path === t.href || path.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-5 py-3 font-bold text-[12px] uppercase tracking-[0.14em] border-e-[3px] border-black last:border-e-0 ${
                active ? "bg-black text-white" : "hover:bg-black hover:text-white"
              }`}
            >
              {t[lang]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
