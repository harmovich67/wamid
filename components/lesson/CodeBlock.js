import hljs from "highlight.js/lib/common";
import { CopyButton } from "./CopyButton";

const ALIASES = { html: "xml", cpp: "cpp", plaintext: "plaintext" };

function highlight(code, language) {
  const lang = ALIASES[language] ?? language;
  try {
    if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
  } catch {}
  return hljs.highlightAuto(code).value;
}

export function CodeBlock({ code = "", language = "auto", title }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-[#2b2649] bg-[#0f0d1f]" dir="ltr">
      <figcaption className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-coral/80" />
            <span className="size-2.5 rounded-full bg-amber/80" />
            <span className="size-2.5 rounded-full bg-mint/80" />
          </div>
          <span className="font-mono text-xs text-white/60">{title || language}</span>
        </div>
        <CopyButton text={code} />
      </figcaption>
      <pre className="scrollbar-thin overflow-x-auto p-4 font-mono text-[13.5px] leading-7 text-[#e7e5ff]">
        <code className="hljs" dangerouslySetInnerHTML={{ __html: highlight(code, language) }} />
      </pre>
    </figure>
  );
}
