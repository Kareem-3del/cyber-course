import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("critical-infrastructure", "ar");
  const en = await readMd("critical-infrastructure", "en");
  return <MarkdownLesson slug="critical-infrastructure" ar={ar} en={en} />;
}
