import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("dfir-triage", "ar");
  const en = await readMd("dfir-triage", "en");
  return <MarkdownLesson slug="dfir-triage" ar={ar} en={en} />;
}
