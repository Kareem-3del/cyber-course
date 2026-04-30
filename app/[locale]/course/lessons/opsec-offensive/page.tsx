import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("opsec-offensive", "ar");
  const en = await readMd("opsec-offensive", "en");
  return <MarkdownLesson slug="opsec-offensive" ar={ar} en={en} />;
}
