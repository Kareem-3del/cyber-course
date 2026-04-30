import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("state-actor-tradecraft", "ar");
  const en = await readMd("state-actor-tradecraft", "en");
  return <MarkdownLesson slug="state-actor-tradecraft" ar={ar} en={en} />;
}
