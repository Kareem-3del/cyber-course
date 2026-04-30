import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("aws-attack-chains", "ar");
  const en = await readMd("aws-attack-chains", "en");
  return <MarkdownLesson slug="aws-attack-chains" ar={ar} en={en} />;
}
