"use client";

import { createContext, useContext, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

export type Lang = "ar" | "en";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (s: { ar: string; en: string }) => string;
  dir: "rtl" | "ltr";
  /** Build a locale-prefixed URL for a path like "/lessons/recon" or "/glossary" */
  href: (path: string) => string;
}

const I18nContext = createContext<Ctx | null>(null);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

function stripLocale(pathname: string): string {
  if (pathname === "/ar" || pathname === "/en") return "/";
  if (pathname.startsWith("/ar/")) return pathname.slice(3);
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname || "/";
}

export function I18nProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/";

  // The URL is the single source of truth. `initialLang` is only a hint for
  // the very first server render, so we don't depend on a useEffect sync
  // that can lag a frame behind navigation.
  const lang: Lang =
    pathname === "/en" || pathname.startsWith("/en/")
      ? "en"
      : pathname === "/ar" || pathname.startsWith("/ar/")
      ? "ar"
      : (initialLang ?? "ar");

  // Keep <html lang/dir> + cookie + localStorage aligned whenever the URL
  // changes (handles deep links, back/forward, and the toggle below).
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
      try { localStorage.setItem("lang", lang); } catch {}
    }
  }, [lang]);

  const setLang = useCallback(
    (l: Lang) => {
      if (l === lang) return;
      // Persist preference immediately so the redirect at "/" honors it next
      // time the user visits the bare root.
      document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
      try { localStorage.setItem("lang", l); } catch {}
      const rest = stripLocale(pathname);
      const next = rest === "/" ? `/${l}` : `/${l}${rest}`;
      // Hard navigation: guarantees the [locale] dynamic segment, the <html
      // lang/dir>, the loaded font subset, and any server-rendered metadata
      // all flip together. Soft `router.push` was occasionally a no-op when
      // the only changing segment was the locale.
      if (typeof window !== "undefined") {
        window.location.assign(next);
      } else {
        router.push(next);
      }
    },
    [pathname, router, lang]
  );

  const t = useCallback((s: { ar: string; en: string }) => s[lang], [lang]);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const href = useCallback(
    (path: string) => {
      if (!path) return `/${lang}`;
      // Already has a locale prefix
      if (path.startsWith("/ar") || path.startsWith("/en")) return path;
      // External / hash / query starting at root: keep as is
      if (!path.startsWith("/")) return path;
      if (path === "/") return `/${lang}`;
      return `/${lang}${path}`;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir, href }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}

export function T({ ar, en }: { ar: string; en: string }) {
  const { lang } = useI18n();
  return <>{lang === "ar" ? ar : en}</>;
}

export function L({ ar, en }: { ar: React.ReactNode; en: React.ReactNode }) {
  const { lang } = useI18n();
  return <>{lang === "ar" ? ar : en}</>;
}
