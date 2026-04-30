import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("m365-entra-attacks", "ar");
  const en = await readMd("m365-entra-attacks", "en");
  return <MarkdownLesson slug="m365-entra-attacks" ar={ar} en={en} />;
}
