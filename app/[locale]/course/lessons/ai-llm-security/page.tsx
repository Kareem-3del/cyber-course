import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("ai-llm-security", "ar");
  const en = await readMd("ai-llm-security", "en");
  return <MarkdownLesson slug="ai-llm-security" ar={ar} en={en} />;
}
