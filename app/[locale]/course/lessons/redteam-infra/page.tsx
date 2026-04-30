import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("redteam-infra", "ar");
  const en = await readMd("redteam-infra", "en");
  return <MarkdownLesson slug="redteam-infra" ar={ar} en={en} />;
}
