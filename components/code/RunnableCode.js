"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { PencilLine, Play } from "lucide-react";
import { RunPanel } from "./RunPanel";

// The editor (and its syntax highlighter) is only needed once the student presses "edit", so it stays out of the lesson bundle.
const loadPlayground = () => import("./CodePlayground").then((m) => m.CodePlayground);
const CodePlayground = dynamic(loadPlayground, {
  ssr: false,
  loading: () => <div className="skeleton h-40 rounded-2xl" />,
});

/**
 * Wraps a lesson's read-only code block (`children`) with "run" and "edit & try" actions.
 * Running shows the output right under the block; editing swaps in a live editor.
 */
export function RunnableCode({ code, language, title, children }) {
  const [mode, setMode] = useState("read"); // read | run | edit

  if (mode === "edit") {
    return <CodePlayground code={code} language={language} title={title} minLines={Math.min(18, Math.max(6, code.split("\n").length + 1))} />;
  }

  return (
    <div className="space-y-2">
      {children}
      {mode === "run" && <RunPanel language={language} code={code} />}
      <div className="flex flex-wrap gap-2">
        {mode === "read" && (
          <button
            type="button"
            onClick={() => setMode("run")}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-mint-soft px-3 text-sm font-semibold text-mint transition hover:brightness-95"
          >
            <Play className="size-4 fill-current" /> شغّل الكود
          </button>
        )}
        <button
          type="button"
          onClick={() => setMode("edit")}
          onPointerEnter={loadPlayground}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary-soft px-3 text-sm font-semibold text-primary transition hover:brightness-95"
        >
          <PencilLine className="size-4" /> عدّل وجرّب بنفسك
        </button>
      </div>
    </div>
  );
}
