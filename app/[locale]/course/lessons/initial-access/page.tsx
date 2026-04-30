import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("initial-access", "ar");
  const en = await readMd("initial-access", "en");
  return <MarkdownLesson slug="initial-access" ar={ar} en={en} />;
}
