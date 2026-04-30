import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("threat-hunting", "ar");
  const en = await readMd("threat-hunting", "en");
  return <MarkdownLesson slug="threat-hunting" ar={ar} en={en} />;
}
