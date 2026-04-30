import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("supply-chain-deep", "ar");
  const en = await readMd("supply-chain-deep", "en");
  return <MarkdownLesson slug="supply-chain-deep" ar={ar} en={en} />;
}
