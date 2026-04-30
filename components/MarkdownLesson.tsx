"use client";
import { useMemo, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { LessonShell } from "./LessonShell";
import { useI18n } from "@/lib/i18n";
import { Info, AlertTriangle, ShieldAlert, CheckCircle2, TerminalSquare, Hash } from "lucide-react";

interface Props {
  slug: string;
  ar: string | null;
  en: string | null;
}

interface Heading { id: string; text: string; level: number; }

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80) || "h";
}

const CALLOUT_RX = /^\s*\[!(info|warn|warning|danger|tip|good|note)\]\s*(.*)$/i;
const CALLOUT_MAP: Record<string, { kind: "info" | "warn" | "danger" | "good"; Icon: any }> = {
  info:    { kind: "info",   Icon: Info },
  note:    { kind: "info",   Icon: Info },
  tip:     { kind: "good",   Icon: CheckCircle2 },
  good:    { kind: "good",   Icon: CheckCircle2 },
  warn:    { kind: "warn",   Icon: AlertTriangle },
  warning: { kind: "warn",   Icon: AlertTriangle },
  danger:  { kind: "danger", Icon: ShieldAlert },
};

export function MarkdownLesson({ slug, ar, en }: Props) {
  const { lang } = useI18n();
  const md = (lang === "ar" ? ar : en) || ar || en || "";

  const headings = useMemo(() => {
    const list: Heading[] = [];
    md.split("\n").forEach((ln) => {
      const m = ln.match(/^(#{2,3})\s+(.+?)\s*$/);
      if (m) list.push({ level: m[1].length, text: m[2], id: slugify(m[2]) });
    });
    return list;
  }, [md]);

  const [active, setActive] = useState<string>("");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-100px 0px -60% 0px" }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [headings]);

  return (
    <LessonShell slug={slug}>
      <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-8">
        <article className="prose-md min-w-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h2: ({ children }) => {
                const text = String(Array.isArray(children) ? children.join("") : children);
                const id = slugify(text);
                return (
                  <h2 id={id} className="group scroll-mt-24 flex items-center gap-2">
                    <span>{children}</span>
                    <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 transition-opacity"><Hash className="w-4 h-4" strokeWidth={3} /></a>
                  </h2>
                );
              },
              h3: ({ children }) => {
                const text = String(Array.isArray(children) ? children.join("") : children);
                const id = slugify(text);
                return <h3 id={id} className="scroll-mt-24">{children}</h3>;
              },
              p: ({ children }) => <p>{children}</p>,
              ul: ({ children }) => <ul>{children}</ul>,
              ol: ({ children }) => <ol>{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              a: ({ href, children }) => (
                <a href={href} className="text-link underline underline-offset-[3px]" target="_blank" rel="noreferrer">{children}</a>
              ),
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              code: ({ inline, className, children, ...rest }: any) => {
                const lang = (className || "").replace("language-", "");
                if (inline) {
                  return <code className="eng">{children}</code>;
                }
                if (lang === "terminal") {
                  const lines = String(children).replace(/\n$/, "").split("\n");
                  return (
                    <div className="terminal my-5">
                      <div className="terminal-bar" />
                      <div className="terminal-body">
                        {lines.map((l, i) => {
                          if (l.startsWith("# ")) return <div key={i} className="out">{l}</div>;
                          if (l.startsWith("> ")) return <div key={i} className="out">{l.slice(2)}</div>;
                          return <div key={i}><span className="prompt">$</span> {l.replace(/^\$\s*/, "")}</div>;
                        })}
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="my-5">
                    {lang && (
                      <div className="text-[11px] eng uppercase tracking-[0.16em] font-bold border-[3px] border-black border-b-0 inline-block px-2 py-1 bg-black text-white">
                        <TerminalSquare className="w-3 h-3 inline -mt-0.5" /> {lang}
                      </div>
                    )}
                    <pre><code className={className} {...rest}>{children}</code></pre>
                  </div>
                );
              },
              blockquote: ({ children }: any) => {
                const arr = Array.isArray(children) ? children : [children];
                const firstP = arr.find((c: any) => c?.type === "p" || c?.props?.node?.tagName === "p");
                let raw = "";
                try {
                  const cs = firstP?.props?.children;
                  if (typeof cs === "string") raw = cs;
                  else if (Array.isArray(cs)) raw = cs.map((x: any) => (typeof x === "string" ? x : "")).join("");
                } catch {}
                const m = raw.match(CALLOUT_RX);
                if (m) {
                  const meta = CALLOUT_MAP[m[1].toLowerCase()] || CALLOUT_MAP.info;
                  const title = m[2].trim();
                  const colors: Record<string, string> = {
                    info:   "var(--rb-link)",
                    warn:   "var(--rb-warning)",
                    danger: "var(--rb-error)",
                    good:   "var(--rb-success)",
                  };
                  const c = colors[meta.kind];
                  return (
                    <div className="my-5 border-[3px] bg-white" style={{ borderColor: c }}>
                      <div
                        className="px-4 py-2 font-display text-[12px] uppercase tracking-[0.16em] border-b-[3px] flex items-center gap-2 text-white"
                        style={{ background: c, borderColor: c }}
                      >
                        <meta.Icon className="w-4 h-4" strokeWidth={3} />
                        {title || m[1].toUpperCase()}
                      </div>
                      <div className="p-4">{arr.slice(arr.indexOf(firstP) + 1)}</div>
                    </div>
                  );
                }
                return <blockquote>{children}</blockquote>;
              },
              table: ({ children }) => (
                <div className="my-5 overflow-x-auto border-[3px] border-black">
                  <table className="w-full text-sm">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-black text-white text-[11px] uppercase tracking-[0.14em]">{children}</thead>,
              th: ({ children }) => <th className="text-start px-3 py-2 font-bold border-e-[3px] border-white last:border-e-0">{children}</th>,
              td: ({ children }) => <td className="px-3 py-2 border-t-[3px] border-black">{children}</td>,
              hr: () => <hr />,
            }}
          >
            {md}
          </ReactMarkdown>
        </article>

        {headings.length > 2 && (
          <aside className="hidden lg:block">
            <div className="sticky top-[88px] border-[3px] border-black bg-white p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] mb-3 font-display">
                {lang === "ar" ? "في هذه الصفحة" : "On This Page"}
              </div>
              <ul className="space-y-0 text-[13px]">
                {headings.map((h) => (
                  <li key={h.id} style={{ paddingInlineStart: h.level === 3 ? 14 : 0 }}>
                    <a
                      href={`#${h.id}`}
                      className={`block py-1.5 truncate border-l-[3px] ps-2 -ms-px ${
                        active === h.id
                          ? "border-black bg-black text-white"
                          : "border-transparent hover:underline"
                      }`}
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </LessonShell>
  );
}
