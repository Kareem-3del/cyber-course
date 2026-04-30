import type { Metadata } from "next";
import { PublicShell } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Beginner-to-expert cybersecurity learning path — 4 tiers, 70 lessons. Foundations, core operations, advanced, and expert tradecraft.",
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
