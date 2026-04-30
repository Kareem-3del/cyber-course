import { notFound } from "next/navigation";
import { I18nProvider } from "@/lib/i18n";
import { ProgressProvider } from "@/lib/progress";
import { LocaleHtml } from "@/components/LocaleHtml";

const VALID = ["ar", "en"] as const;
type Locale = (typeof VALID)[number];

export function generateStaticParams() {
  return VALID.map((locale) => ({ locale }));
}

/**
 * Locale-level layout: providers + <html lang/dir> sync only.
 * Chrome (header/sidebar/footer) is decided per route group:
 * - public pages use <PublicShell> in their own page
 * - course pages get <CourseShell> via app/[locale]/course/layout.tsx
 */
export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!VALID.includes(params.locale as Locale)) notFound();
  const locale = params.locale as Locale;
  return (
    <I18nProvider initialLang={locale}>
      <LocaleHtml locale={locale} />
      <ProgressProvider>{children}</ProgressProvider>
    </I18nProvider>
  );
}
