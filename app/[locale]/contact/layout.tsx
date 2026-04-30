import type { Metadata } from "next";
import { PublicShell } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Kareem Adel — the maintainer of the Cyber Operations Academy. Email, GitHub, vulnerability disclosure, and collaboration channels.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
