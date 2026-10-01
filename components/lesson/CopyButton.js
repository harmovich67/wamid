"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text, className }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className={className ?? "flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"}
      aria-label="نسخ الكود"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "تم النسخ" : "نسخ"}
    </button>
  );
}
