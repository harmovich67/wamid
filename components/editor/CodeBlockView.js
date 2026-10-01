"use client";

import { useState } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { Check, Copy, Trash2 } from "lucide-react";
import { CODE_LANGUAGES } from "@/lib/constants";

/** Code block inside the rich editor: always LTR, dark, highlighted, with a language picker. */
export function CodeBlockView({ node, updateAttributes, deleteNode, editor }) {
  const [copied, setCopied] = useState(false);
  const language = node.attrs.language || "plaintext";

  return (
    <NodeViewWrapper className="wm-code my-4 overflow-hidden rounded-2xl border border-[#2b2649] bg-[#0f0d1f] not-prose" dir="ltr">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-1.5" contentEditable={false}>
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-coral/80" />
          <span className="size-2.5 rounded-full bg-amber/80" />
          <span className="size-2.5 rounded-full bg-mint/80" />
        </div>
        <select
          value={language}
          disabled={!editor.isEditable}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          className="ms-2 h-7 rounded-md border border-white/10 bg-[#1c1838] px-1.5 font-mono text-xs text-white/80 outline-none focus:border-primary"
          aria-label="لغة البرمجة"
        >
          {CODE_LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <div className="ms-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(node.textContent).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              });
            }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "تم" : "نسخ"}
          </button>
          {editor.isEditable && (
            <button type="button" onClick={deleteNode} className="grid size-7 place-items-center rounded-md text-white/40 hover:bg-white/10 hover:text-coral" aria-label="حذف كتلة الكود">
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>
      <pre className="m-0 overflow-x-auto bg-transparent p-4 font-mono text-[13.5px] leading-6 text-[#e7e5ff]" spellCheck={false}>
        <NodeViewContent as="code" className="hljs" />
      </pre>
    </NodeViewWrapper>
  );
}
