import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("mobile-spyware", "ar");
  const en = await readMd("mobile-spyware", "en");
  return <MarkdownLesson slug="mobile-spyware" ar={ar} en={en} />;
}
