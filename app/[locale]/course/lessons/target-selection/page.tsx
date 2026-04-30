import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("target-selection", "ar");
  const en = await readMd("target-selection", "en");
  return <MarkdownLesson slug="target-selection" ar={ar} en={en} />;
}
