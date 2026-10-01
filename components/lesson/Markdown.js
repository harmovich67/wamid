import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

// Raw HTML is not rendered (react-markdown default), so lesson content cannot inject scripts.
export function Markdown({ children, className }) {
  return (
    <div className={cn("prose-w", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target={href?.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer">
              {children}
            </a>
          ),
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={src} alt={alt ?? ""} loading="lazy" />,
        }}
      >
        {children ?? ""}
      </ReactMarkdown>
    </div>
  );
}
