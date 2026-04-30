"use client";
import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className="px-4 py-2 border-[3px] border-black bg-white text-black font-bold text-[12px] tracking-[0.12em] uppercase hover:bg-black hover:text-white transition-colors"
      aria-label="Toggle language"
    >
      <span className="eng">{lang === "ar" ? "EN" : "AR"}</span>
    </button>
  );
}
