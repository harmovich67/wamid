import { AlertTriangle, Download, Info, Lightbulb, Paperclip } from "lucide-react";
import { Markdown } from "./Markdown";
import { CodeBlock } from "./CodeBlock";
import { cn, formatBytes, toEmbedUrl } from "@/lib/utils";

const CALLOUTS = {
  tip: { icon: Lightbulb, cls: "border-mint/40 bg-mint-soft", iconCls: "text-mint", title: "نصيحة" },
  info: { icon: Info, cls: "border-sky/40 bg-sky-soft", iconCls: "text-sky", title: "معلومة" },
  warning: { icon: AlertTriangle, cls: "border-amber/50 bg-amber-soft", iconCls: "text-amber", title: "انتبه" },
};

function VideoBlock({ block }) {
  const embed = toEmbedUrl(block.url);
  return (
    <figure>
      <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-black">
        {embed ? (
          <iframe
            src={embed}
            title={block.caption || "فيديو الدرس"}
            className="size-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <video src={block.url} controls className="size-full" preload="metadata" />
        )}
      </div>
      {block.caption && <figcaption className="mt-2 text-center text-sm text-muted">{block.caption}</figcaption>}
    </figure>
  );
}

export function Block({ block }) {
  switch (block.type) {
    case "text":
      return <Markdown>{block.markdown}</Markdown>;
    case "code":
      return <CodeBlock code={block.code} language={block.language} title={block.title} />;
    case "video":
      return <VideoBlock block={block} />;
    case "image":
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.caption ?? ""} loading="lazy" className="mx-auto max-h-[520px] rounded-2xl border border-line object-contain" />
          {block.caption && <figcaption className="mt-2 text-center text-sm text-muted">{block.caption}</figcaption>}
        </figure>
      );
    case "attachment":
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/60 p-4 transition hover:border-primary/40"
        >
          <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
            <Paperclip className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{block.name}</div>
            {block.size ? <div className="text-xs text-muted">{formatBytes(block.size)}</div> : null}
          </div>
          <Download className="size-5 text-muted" />
        </a>
      );
    case "callout": {
      const c = CALLOUTS[block.variant] ?? CALLOUTS.info;
      return (
        <div className={cn("flex gap-3 rounded-2xl border p-4", c.cls)}>
          <c.icon className={cn("mt-1 size-5 shrink-0", c.iconCls)} />
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-sm font-semibold">{c.title}</div>
            <Markdown className="text-[0.97rem]">{block.markdown}</Markdown>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

export function BlockRenderer({ blocks = [] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </div>
  );
}
