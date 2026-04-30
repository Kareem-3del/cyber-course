import { CourseShell } from "@/components/SiteChrome";

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return <CourseShell>{children}</CourseShell>;
}
