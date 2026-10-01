"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Bold, Code, Columns2, Eye, Heading2, Heading3, Italic, Link2, List, ListOrdered, PenLine, Quote, SquareCode, Undo2 } from "lucide-react";
import { Markdown } from "@/components/lesson/Markdown";
import { AIAssist } from "./AIAssist";
import { detectLanguage, looksLikeCode } from "./highlight";
import { cn } from "@/lib/utils";

const TOOLS = [
  { id: "bold", icon: Bold, title: "غامق (Ctrl+B)" },
  { id: "italic", icon: Italic, title: "مائل (Ctrl+I)" },
  { id: "h2", icon: Heading2, title: "عنوان" },
  { id: "h3", icon: Heading3, title: "عنوان فرعي" },
  { id: "ul", icon: List, title: "قائمة" },
  { id: "ol", icon: ListOrdered, title: "قائمة مرقّمة" },
  { id: "quote", icon: Quote, title: "اقتباس" },
  { id: "code", icon: Code, title: "كود داخل السطر" },
  { id: "block", icon: SquareCode, title: "كتلة كود" },
  { id: "link", icon: Link2, title: "رابط (Ctrl+K)" },
];

/**
 * Markdown writing editor:
 * - every line takes its own direction (Arabic → RTL, English/code → LTR) via unicode-bidi: plaintext;
 * - toolbar + shortcuts (Ctrl+B / Ctrl+I / Ctrl+K);
 * - pasted code is wrapped in a fenced block with its detected language automatically;
 * - write / split / preview modes (preview renders code blocks with highlighting);
 * - optional AI assistant (teacher only) that works on the selection or the whole text.
 */
export function SmartTextEditor({ value, onChange, placeholder, minRows = 6, ai = false, aiContext = "", defaultMode = "write", className }) {
  const ta = useRef(null);
  const [mode, setMode] = useState(defaultMode);
  const [history, setHistory] = useState([]);

  function set(next, selStart, selEnd = selStart, remember = false) {
    if (remember) setHistory((h) => [...h.slice(-19), value]);
    onChange(next);
    if (selStart != null)
      requestAnimationFrame(() => {
        ta.current?.focus();
        ta.current?.setSelectionRange(selStart, selEnd);
      });
  }

  function wrap(before, after = before, fallback = "") {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.slice(s, e) || fallback;
    set(value.slice(0, s) + before + sel + after + value.slice(e), s + before.length, s + before.length + sel.length);
  }

  function linePrefix(prefix) {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const start = value.lastIndexOf("\n", s - 1) + 1;
    const block = value.slice(start, e);
    const lines = block.split("\n").map((l, i) => (typeof prefix === "function" ? prefix(i) : prefix) + l.replace(/^(#{1,3} |> |- |\d+\. )/, ""));
    const out = lines.join("\n");
    set(value.slice(0, start) + out + value.slice(e), start, start + out.length);
  }

  function insertCodeBlock() {
    const el = ta.current;
    const s = el?.selectionStart ?? value.length;
    const e = el?.selectionEnd ?? value.length;
    const sel = value.slice(s, e);
    const lang = sel ? detectLanguage(sel) : "python";
    const pre = s > 0 && value[s - 1] !== "\n" ? "\n" : "";
    const snippet = `${pre}\`\`\`${lang}\n${sel || ""}\n\`\`\`\n`;
    set(value.slice(0, s) + snippet + value.slice(e), s + pre.length + lang.length + 4, s + pre.length + lang.length + 4 + sel.length);
  }

  function onPaste(e) {
    const text = e.clipboardData.getData("text/plain");
    const el = e.currentTarget;
    const before = value.slice(0, el.selectionStart);
    const insideFence = (before.match(/```/g) ?? []).length % 2 === 1;
    if (!insideFence && looksLikeCode(text)) {
      e.preventDefault();
      const lang = detectLanguage(text);
      const pre = before && !before.endsWith("\n") ? "\n" : "";
      const block = `${pre}\`\`\`${lang}\n${text.replace(/\n+$/, "")}\n\`\`\`\n`;
      const s = el.selectionStart;
      set(value.slice(0, s) + block + value.slice(el.selectionEnd), s + block.length, s + block.length, true);
      toast.info(`تعرّفنا على كود ${lang} ووضعناه في كتلة كود ✨`);
    }
  }

  function onKeyDown(e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === "b") (e.preventDefault(), wrap("**", "**", "نص غامق"));
    if (k === "i") (e.preventDefault(), wrap("*", "*", "نص مائل"));
    if (k === "k") (e.preventDefault(), wrap("[", "](https://)", "رابط"));
  }

  function getTarget() {
    const el = ta.current;
    const s = el?.selectionStart ?? 0;
    const e = el?.selectionEnd ?? 0;
    const partial = el && s !== e;
    return {
      text: partial ? value.slice(s, e) : value,
      partial,
      apply: (text, how) => {
        if (how === "after") {
          const at = partial ? e : value.length;
          const joined = value.slice(0, at) + "\n\n" + text + value.slice(at);
          set(joined, at + 2 + text.length, undefined, true);
        } else if (partial) {
          set(value.slice(0, s) + text + value.slice(e), s, s + text.length, true);
        } else {
          set(text, text.length, undefined, true);
        }
      },
    };
  }

  function runTool(id) {
    if (mode === "preview") setMode("write");
    switch (id) {
      case "bold": return wrap("**", "**", "نص غامق");
      case "italic": return wrap("*", "*", "نص مائل");
      case "h2": return linePrefix("## ");
      case "h3": return linePrefix("### ");
      case "ul": return linePrefix("- ");
      case "ol": return linePrefix((i) => `${i + 1}. `);
      case "quote": return linePrefix("> ");
      case "code": return wrap("`", "`", "code");
      case "block": return insertCodeBlock();
      case "link": return wrap("[", "](https://)", "رابط");
    }
  }

  const textarea = (
    <textarea
      ref={ta}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onPaste={onPaste}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={Math.max(minRows, value.split("\n").length + 1)}
      dir="auto"
      className="block w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-8 text-fg outline-none placeholder:text-muted/60 [unicode-bidi:plaintext]"
      style={{ textAlign: "start" }}
    />
  );

  return (
    <div className={cn("rounded-2xl border border-line bg-surface transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-2 py-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.title}
            aria-label={t.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runTool(t.id)}
            className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
          >
            <t.icon className="size-4" />
          </button>
        ))}
        {history.length > 0 && (
          <button
            type="button"
            title="تراجع عن آخر تعديل تلقائي"
            onClick={() => {
              onChange(history.at(-1));
              setHistory((h) => h.slice(0, -1));
            }}
            className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
          >
            <Undo2 className="size-4" />
          </button>
        )}
        <div className="ms-auto flex items-center gap-1.5">
          <div className="flex rounded-lg bg-surface-2 p-0.5">
            {[
              ["write", PenLine, "كتابة"],
              ["split", Columns2, "جنبًا لجنب"],
              ["preview", Eye, "معاينة"],
            ].map(([m, Ico, label]) => (
              <button
                key={m}
                type="button"
                title={label}
                onClick={() => setMode(m)}
                className={cn("grid h-7 w-8 place-items-center rounded-md transition", mode === m ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-fg", m === "split" && "hidden md:grid")}
              >
                <Ico className="size-3.5" />
              </button>
            ))}
          </div>
          {ai && <AIAssist kind="markdown" context={aiContext} getTarget={getTarget} />}
        </div>
      </div>

      {mode === "write" && textarea}
      {mode === "preview" && (
        <div className="min-h-32 px-5 py-4">{value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-muted">لا شيء للمعاينة بعد.</p>}</div>
      )}
      {mode === "split" && (
        <div className="grid md:grid-cols-2">
          <div className="border-line md:border-e">{textarea}</div>
          <div className="scrollbar-thin max-h-[640px] overflow-y-auto bg-surface-2/30 px-5 py-4">
            {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-muted">المعاينة تظهر هنا أثناء الكتابة.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
