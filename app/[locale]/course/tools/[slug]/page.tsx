import { notFound } from "next/navigation";
import { TOOLS, toolBySlug, toolSlug, TOOL_CATEGORIES } from "@/lib/tools";
import { readToolMd } from "@/lib/content";
import { ToolTutorial } from "@/components/ToolTutorial";

export async function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: toolSlug(t.name) }));
}

export default async function Page({ params }: { params: { slug: string; locale: string } }) {
  const tool = toolBySlug(params.slug);
  if (!tool) notFound();
  const ar = await readToolMd(params.slug, "ar");
  const en = await readToolMd(params.slug, "en");
  return <ToolTutorial tool={tool} ar={ar} en={en} />;
}
