import type { Metadata } from "next";
import { CourseShell } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Lessons",
  description: "Browse 70 cybersecurity lessons across foundations, red team, blue team, and threat intelligence — searchable and filterable by track and level.",
};

export default function LessonsLayout({ children }: { children: React.ReactNode }) {
  return <CourseShell>{children}</CourseShell>;
}
