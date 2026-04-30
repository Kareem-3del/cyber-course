import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Archivo_Black, Work_Sans, Space_Mono, Cairo, Tajawal, Reem_Kufi } from "next/font/google";
import "./globals.css";

/* -------------------------------------------------------------------------
   Self-host Google fonts via next/font:
   - Eliminates the render-blocking <link> to fonts.googleapis.com
   - Pre-builds a single CSS file with `font-display: swap`
   - Generates `<link rel="preload">` for the woff2 files automatically
   ------------------------------------------------------------------------- */
// Primary faces — preloaded.
const archivoBlack = Archivo_Black({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-archivo-black" });
const workSans     = Work_Sans({ weight: ["400", "500", "600", "700", "800", "900"], subsets: ["latin"], display: "swap", variable: "--font-work-sans" });
const spaceMono    = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], display: "swap", variable: "--font-space-mono" });
// Arabic primary — preloaded only for the Arabic subset to keep the Latin
// pages from preloading Arabic glyphs they will never render (and vice
// versa). The browser still fetches what it needs at use-time via swap.
const cairo        = Cairo({ weight: ["400", "600", "700", "900"], subsets: ["arabic"], display: "swap", variable: "--font-cairo" });
const tajawal      = Tajawal({ weight: ["400", "500", "700", "900"], subsets: ["arabic"], display: "swap", variable: "--font-tajawal" });
// Decorative accent — fetched on demand only (no preload).
const reemKufi     = Reem_Kufi({ weight: ["700"], subsets: ["arabic"], display: "swap", variable: "--font-reem-kufi", preload: false });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kareem-3del.github.io";
const SITE_NAME_EN = "Cyber Operations Academy";
const SITE_NAME_AR = "أكاديمية العمليات السيبرانية";
const DESC_EN = "A bilingual cybersecurity curriculum from your first home lab to nation-state tradecraft. 70 lessons across foundations, red team, blue team, and threat-intel — free.";
const DESC_AR = "منهج عملياتي ثنائي اللغة من بناء أول مختبر حتى تكتيكات الدول. 70 درساً يغطون الأساسيات، الفرق الحمراء والزرقاء، والاستخبارات — مجاناً.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME_EN} — Red, Blue & Threat Intel`,
    template: `%s · ${SITE_NAME_EN}`,
  },
  description: DESC_EN,
  applicationName: SITE_NAME_EN,
  authors: [{ name: "Kareem Adel", url: "https://github.com/kareem-3del" }],
  creator: "Kareem Adel",
  publisher: "Kareem Adel",
  generator: "Next.js",
  keywords: [
    "cybersecurity course", "red team training", "blue team training",
    "OSCP study", "SANS alternative", "free cybersecurity training",
    "penetration testing", "threat hunting", "MITRE ATT&CK",
    "Active Directory attacks", "cloud security", "incident response",
    "Arabic cybersecurity", "دورة الأمن السيبراني", "اختبار الاختراق",
  ],
  category: "education",
  alternates: {
    canonical: "/",
    languages: {
      "ar": "/ar",
      "en": "/en",
      "x-default": "/ar",
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME_EN,
    title: `${SITE_NAME_EN} — Red, Blue & Threat Intel`,
    description: DESC_EN,
    url: SITE_URL,
    locale: "en_US",
    alternateLocale: ["ar_SA"],
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME_EN} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME_EN} — Red, Blue & Threat Intel`,
    description: DESC_EN,
    images: ["/logo.png"],
    creator: "@kareem3del",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { email: false, telephone: false },
  other: {
    "ar:title": SITE_NAME_AR,
    "ar:description": DESC_AR,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const fontVars = [
  archivoBlack.variable,
  workSans.variable,
  spaceMono.variable,
  cairo.variable,
  tajawal.variable,
  reemKufi.variable,
].join(" ");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Locale is injected by middleware (`middleware.ts`) into the request
  // headers. Reading it here means the very first byte of HTML carries the
  // correct lang/dir — no client-side flip, no FOUC.
  const locale = (headers().get("x-locale") as "ar" | "en" | null) ?? "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className={fontVars}>
      <body className="font-sans antialiased min-h-screen overflow-x-hidden">
        {/* JSON-LD structured data — improves Google rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              name: SITE_NAME_EN,
              alternateName: SITE_NAME_AR,
              url: SITE_URL,
              logo: `${SITE_URL}/logo.png`,
              description: DESC_EN,
              founder: {
                "@type": "Person",
                name: "Kareem Adel",
                url: "https://github.com/kareem-3del",
              },
              sameAs: ["https://github.com/kareem-3del"],
              offers: {
                "@type": "Offer",
                price: 0,
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                description: "Free access to the full curriculum",
              },
              educationalLevel: ["Beginner", "Intermediate", "Advanced", "Expert"],
              teaches: [
                "Cybersecurity", "Penetration Testing", "Threat Hunting",
                "Incident Response", "Cloud Security", "Active Directory Security",
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
