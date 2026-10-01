"use client";

import { CodeEditor } from "./CodeEditor";
import { AIAssist } from "./AIAssist";
import { CODE_LANGUAGES } from "@/lib/constants";

/** Code editor with language + file-name controls in its title bar and optional AI actions. */
export function CodeField({ code, language, title, onChange, ai = false, aiContext = "", showTitle = true, minLines = 6, placeholder }) {
  return (
    <CodeEditor
      value={code}
      onChange={(v) => onChange({ code: v })}
      language={language}
      minLines={minLines}
      placeholder={placeholder}
      filename={showTitle ? undefined : language}
      header={
        <>
          {showTitle && (
            <input
              value={title ?? ""}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="main.py"
              className="h-7 w-28 rounded-md border border-white/10 bg-white/5 px-2 font-mono text-xs text-white/80 outline-none placeholder:text-white/25 focus:border-primary"
              aria-label="اسم الملف"
            />
          )}
          <select
            value={language}
            onChange={(e) => onChange({ language: e.target.value })}
            className="h-7 rounded-md border border-white/10 bg-[#1c1838] px-1.5 font-mono text-xs text-white/80 outline-none focus:border-primary"
            aria-label="لغة البرمجة"
          >
            {CODE_LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {ai && (
            <AIAssist
              kind="code"
              compact
              dark
              language={language}
              context={aiContext}
              getTarget={() => ({ text: code, partial: false, apply: (text) => onChange({ code: text }) })}
            />
          )}
        </>
      }
    />
  );
}
