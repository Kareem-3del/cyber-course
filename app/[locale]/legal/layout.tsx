import type { Metadata } from "next";
import { PublicShell } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Legal",
  description: "Terms of Service, Privacy Policy, and other legal documents governing use of the Cyber Operations Academy.",
  robots: { index: true, follow: true },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
