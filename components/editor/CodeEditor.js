"use client";

import { useMemo, useRef, useState } from "react";
import { highlightCode } from "./highlight";
import { cn } from "@/lib/utils";

const PAIRS = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'", "`": "`" };
const CLOSERS = new Set(Object.values(PAIRS));
const INDENT = "    ";

/**
 * Lightweight code editor: a transparent <textarea> over a highlighted <pre>, so typing,
 * selection, undo and mobile keyboards stay native. Always LTR, with line numbers, smart
 * indentation, auto-closing brackets and Tab / Shift+Tab indenting.
 */
export function CodeEditor({ value, onChange, language = "plaintext", filename, header, placeholder = "// اكتب الكود هنا", minLines = 6, className, readOnly }) {
  const ta = useRef(null);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const lines = value.split("\n");
  const html = useMemo(() => highlightCode(value, language), [value, language]);

  function commit(next, selStart, selEnd = selStart) {
    onChange(next);
    requestAnimationFrame(() => {
      if (!ta.current) return;
      ta.current.selectionStart = selStart;
      ta.current.selectionEnd = selEnd;
      updateCursor();
    });
  }

  function updateCursor() {
    const el = ta.current;
    if (!el) return;
    const before = el.value.slice(0, el.selectionStart).split("\n");
    setCursor({ line: before.length, col: before.at(-1).length + 1 });
  }

  function onKeyDown(e) {
    const el = e.currentTarget;
    const { selectionStart: s, selectionEnd: end } = el;
    const v = el.value;
    const lineStart = v.lastIndexOf("\n", s - 1) + 1;

    if (e.key === "Tab") {
      e.preventDefault();
      if (s !== end || e.shiftKey) {
        // Indent / outdent every selected line.
        const blockEnd = v.indexOf("\n", end - 1) === -1 ? v.length : v.indexOf("\n", end - (v[end - 1] === "\n" ? 1 : 0));
        const block = v.slice(lineStart, blockEnd);
        const changed = block
          .split("\n")
          .map((l) => (e.shiftKey ? l.replace(/^( {1,4}|\t)/, "") : INDENT + l))
          .join("\n");
        commit(v.slice(0, lineStart) + changed + v.slice(blockEnd), lineStart, lineStart + changed.length);
      } else {
        commit(v.slice(0, s) + INDENT + v.slice(end), s + INDENT.length);
      }
      return;
    }

    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const line = v.slice(lineStart, s);
      let indent = line.match(/^\s*/)[0];
      const trimmed = line.trimEnd();
      if (/[:{([]$/.test(trimmed)) indent += INDENT;
      const next = v[s];
      // Between brackets: put the closer on its own line.
      if (/[{([]$/.test(trimmed) && next && CLOSERS.has(next) && next !== '"' && next !== "'") {
        const inner = `\n${indent}`;
        const outer = `\n${indent.slice(INDENT.length)}`;
        commit(v.slice(0, s) + inner + outer + v.slice(end), s + inner.length);
        return;
      }
      commit(v.slice(0, s) + "\n" + indent + v.slice(end), s + 1 + indent.length);
      return;
    }

    if (PAIRS[e.key] && !e.ctrlKey && !e.metaKey) {
      const isQuote = e.key === '"' || e.key === "'" || e.key === "`";
      if (isQuote && v[s] === e.key && s === end) {
        e.preventDefault();
        commit(v, s + 1);
        return;
      }
      if (isQuote && /\w/.test(v[s - 1] ?? "")) return; // apostrophes inside words
      e.preventDefault();
      const selected = v.slice(s, end);
      commit(v.slice(0, s) + e.key + selected + PAIRS[e.key] + v.slice(end), s + 1, s + 1 + selected.length);
      return;
    }

    if (CLOSERS.has(e.key) && v[s] === e.key && s === end) {
      e.preventDefault();
      commit(v, s + 1);
      return;
    }

    if (e.key === "Backspace" && s === end && s > 0) {
      const prev = v[s - 1];
      if (PAIRS[prev] && v[s] === PAIRS[prev]) {
        e.preventDefault();
        commit(v.slice(0, s - 1) + v.slice(s + 1), s - 1);
        return;
      }
      const before = v.slice(lineStart, s);
      if (before.length && /^ +$/.test(before) && before.length % 4 === 0) {
        e.preventDefault();
        commit(v.slice(0, s - 4) + v.slice(s), s - 4);
      }
    }
  }

  const rows = Math.max(minLines, lines.length);

  return (
    <div className={cn("rounded-2xl border border-[#2b2649] bg-[#0f0d1f] text-[#e7e5ff] shadow-card", className)} dir="ltr">
      {/* Not overflow-hidden on the outer box: the AI menu inside `header` must be able to
          escape this container's rounded corners instead of being clipped by them. */}
      <div className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-t-2xl border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="flex shrink-0 gap-1.5">
          <span className="size-2.5 rounded-full bg-coral/80" />
          <span className="size-2.5 rounded-full bg-amber/80" />
          <span className="size-2.5 rounded-full bg-mint/80" />
        </div>
        <span className="truncate font-mono text-xs text-white/50">{filename || language}</span>
        <div className="ms-auto flex flex-wrap items-center gap-1.5 overflow-visible">{header}</div>
      </div>

      <div className="scrollbar-thin relative max-h-[560px] overflow-auto">
        <div className="flex min-w-full font-mono text-[13.5px] leading-6">
          <div className="sticky left-0 z-10 select-none bg-[#0f0d1f] py-3 pe-3 ps-3 text-right text-white/25" aria-hidden="true">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className={cn(i + 1 === cursor.line && "text-white/70")}>{i + 1}</div>
            ))}
          </div>
          <div className="relative flex-1">
            <pre className="pointer-events-none m-0 min-h-full whitespace-pre py-3 pe-6 ps-1" aria-hidden="true" style={{ tabSize: 4 }}>
              <code className="hljs" dangerouslySetInnerHTML={{ __html: html + "\n" }} />
            </pre>
            {!value && <div className="pointer-events-none absolute left-1 top-3 text-white/25">{placeholder}</div>}
            <textarea
              ref={ta}
              value={value}
              readOnly={readOnly}
              onChange={(e) => {
                onChange(e.target.value);
                updateCursor();
              }}
              onKeyDown={readOnly ? undefined : onKeyDown}
              onKeyUp={updateCursor}
              onClick={updateCursor}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              wrap="off"
              rows={rows}
              className="absolute inset-0 h-full w-full resize-none overflow-hidden whitespace-pre bg-transparent py-3 pe-6 ps-1 font-mono text-[13.5px] leading-6 text-transparent caret-white outline-none selection:bg-primary/40"
              style={{ tabSize: 4 }}
              aria-label="محرر الكود"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-b-2xl border-t border-white/10 px-3 py-1.5 font-mono text-[11px] text-white/40">
        <span>
          Ln {cursor.line}, Col {cursor.col}
        </span>
        <span>
          {lines.length} lines · {language}
        </span>
      </div>
    </div>
  );
}
