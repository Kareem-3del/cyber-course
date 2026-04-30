import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Locale-detection middleware.
 *
 * Why this exists:
 *   The root <html> element is rendered by `app/layout.tsx`, which has no
 *   access to the [locale] param. Without help, every request paints with a
 *   hardcoded `lang/dir` and then a client effect flips it after hydration —
 *   that's the visible flash the user reported.
 *
 * What we do instead:
 *   On every request we look at the URL, decide the locale, and inject it
 *   into the request headers as `x-locale`. The root layout reads that
 *   header server-side and stamps the correct lang/dir on the very first
 *   paint. No flash, no flip.
 */
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const locale: "ar" | "en" =
    path === "/en" || path.startsWith("/en/") ? "en" : "ar";

  // Theme preference comes from a cookie set by the toggle. Default light.
  const themeCookie = req.cookies.get("theme")?.value;
  const theme: "light" | "dark" = themeCookie === "dark" ? "dark" : "light";

  const headers = new Headers(req.headers);
  headers.set("x-locale", locale);
  headers.set("x-theme", theme);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Skip Next internals and any file with an extension (assets, sitemap.xml,
  // robots.txt, manifest.webmanifest, fonts, images…). The matcher uses a
  // negative lookahead so the middleware adds zero overhead to those.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
