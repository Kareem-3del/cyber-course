import { MarkdownLesson } from "@/components/MarkdownLesson";
import { readMd } from "@/lib/content";

export default async function Page() {
  const ar = await readMd("linux-kernel-lpe", "ar");
  const en = await readMd("linux-kernel-lpe", "en");
  return <MarkdownLesson slug="linux-kernel-lpe" ar={ar} en={en} />;
}
