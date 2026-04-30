import { promises as fs } from "fs";
import path from "path";

const LESSONS_DIR = path.join(process.cwd(), "content", "lessons");
const TOOLS_DIR = path.join(process.cwd(), "content", "tools");

export async function readMd(slug: string, lang: "ar" | "en"): Promise<string | null> {
  try {
    return await fs.readFile(path.join(LESSONS_DIR, `${slug}.${lang}.md`), "utf8");
  } catch {
    return null;
  }
}

export async function listMdSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(LESSONS_DIR);
    return Array.from(
      new Set(files.filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.(ar|en)\.md$/, "")))
    );
  } catch {
    return [];
  }
}

export async function readToolMd(slug: string, lang: "ar" | "en"): Promise<string | null> {
  try {
    return await fs.readFile(path.join(TOOLS_DIR, `${slug}.${lang}.md`), "utf8");
  } catch {
    return null;
  }
}

export async function listToolMdSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(TOOLS_DIR);
    return Array.from(
      new Set(files.filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.(ar|en)\.md$/, "")))
    );
  } catch {
    return [];
  }
}
