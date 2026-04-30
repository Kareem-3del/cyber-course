"use client";
import { useEffect } from "react";
import type { Lang } from "@/lib/i18n";

export function LocaleHtml({ locale }: { locale: Lang }) {
  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);
  return null;
}
