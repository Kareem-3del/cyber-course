import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("adcs-attacks", "ar");
  const en = await readMd("adcs-attacks", "en");
  return <MarkdownLesson slug="adcs-attacks" ar={ar} en={en} />;
}
