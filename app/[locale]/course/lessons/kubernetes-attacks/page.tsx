import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("kubernetes-attacks", "ar");
  const en = await readMd("kubernetes-attacks", "en");
  return <MarkdownLesson slug="kubernetes-attacks" ar={ar} en={en} />;
}
