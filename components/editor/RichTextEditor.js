"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, ReactNodeViewRenderer, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { TableKit } from "@tiptap/extension-table";
import { common, createLowlight } from "lowlight";
import { toast } from "sonner";
import {
  Bold, ChevronDown, Code, Table as TableIcon, FileCode2, Heading1, Heading2, Heading3, Italic, Link2, List, ListOrdered, Minus, Pilcrow, Quote, Redo2, SquareCode, Strikethrough, Undo2,
} from "lucide-react";
import { AIAssist } from "./AIAssist";
import { CodeBlockView } from "./CodeBlockView";
import { AutoDir } from "./autoDir";
import { SmartTextEditor } from "./SmartTextEditor";
import { detectLanguage, looksLikeCode } from "./highlight";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);
lowlight.registerAlias({ xml: ["html"], cpp: ["c++"] });

const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
}).configure({ lowlight, defaultLanguage: "python" });

const IDLE = { block: "p", bold: false, italic: false, strike: false, code: false, link: false, bullet: false, ordered: false, quote: false, codeBlock: false, canUndo: false, canRedo: false };

const BLOCK_TYPES = [
  { id: "p", label: "نص عادي", icon: Pilcrow },
  { id: "h2", label: "عنوان كبير", icon: Heading1 },
  { id: "h3", label: "عنوان متوسط", icon: Heading2 },
  { id: "h4", label: "عنوان صغير", icon: Heading3 },
];

function ToolButton({ active, onClick, title, children, disabled }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg transition disabled:opacity-30",
        active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-fg"
      )}
    >
      {children}
    </button>
  );
}

function setLink(editor) {
  const prev = editor.getAttributes("link").href ?? "https://";
  const url = window.prompt("الرابط", prev);
  if (url === null) return;
  if (!url.trim() || url === "https://") return editor.chain().focus().extendMarkRange("link").unsetLink().run();
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) return toast.error("الرابط يجب أن يبدأ بـ https://");
  editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}

/**
 * WYSIWYG editor (TipTap) that reads and writes Markdown — what you see is how students see it:
 * real headings, bold, lists and highlighted code blocks, with no Markdown symbols while writing.
 * Each paragraph takes its own direction (dir="auto"), code blocks are always LTR.
 */
export function RichTextEditor({ value, onChange, placeholder = "ابدأ الكتابة…", ai = false, aiContext = "", minHeight = 180, className }) {
  const [source, setSource] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const lastEmitted = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false, underline: false, heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true } }),
      CodeBlock,
      Placeholder.configure({ placeholder }),
      TableKit.configure({ table: { resizable: false } }),
      Markdown,
      AutoDir,
    ],
    content: value ?? "",
    contentType: "markdown",
    editorProps: {
      attributes: { class: "wm-rich prose-w outline-none", style: `min-height:${minHeight}px` },
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const { $from } = view.state.selection;
        if ($from.parent.type.name === "codeBlock" || !looksLikeCode(text)) return false;
        event.preventDefault();
        const language = detectLanguage(text);
        const node = view.state.schema.nodes.codeBlock.create({ language }, view.state.schema.text(text.replace(/\n+$/, "")));
        view.dispatch(view.state.tr.replaceSelectionWith(node).scrollIntoView());
        toast.info(`تعرّفنا على كود ${language} ووضعناه في كتلة كود ✨`);
        return true;
      },
    },
    onUpdate({ editor: ed }) {
      const md = ed.getMarkdown();
      lastEmitted.current = md;
      onChange(md);
    },
  });

  // External changes (AI generation, reset) → reload the document.
  // setContent triggers a sync flushSync inside TipTap's React node views (CodeBlockView),
  // which React rejects if still called during this effect's commit phase — defer it.
  useEffect(() => {
    if (!editor || source) return;
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      const id = setTimeout(() => {
        editor.commands.setContent(value ?? "", { contentType: "markdown", emitUpdate: false });
      }, 0);
      return () => clearTimeout(id);
    }
  }, [value, editor, source]);

  const live = useEditorState({
    editor,
    selector: ({ editor: ed }) =>
      ed
        ? {
            block: ed.isActive("heading", { level: 2 }) ? "h2" : ed.isActive("heading", { level: 3 }) ? "h3" : ed.isActive("heading", { level: 4 }) ? "h4" : "p",
            bold: ed.isActive("bold"),
            italic: ed.isActive("italic"),
            strike: ed.isActive("strike"),
            code: ed.isActive("code"),
            link: ed.isActive("link"),
            bullet: ed.isActive("bulletList"),
            ordered: ed.isActive("orderedList"),
            quote: ed.isActive("blockquote"),
            codeBlock: ed.isActive("codeBlock"),
            canUndo: ed.can().undo(),
            canRedo: ed.can().redo(),
          }
        : null,
  });
  const state = live ?? IDLE;

  function setBlock(id) {
    const chain = editor.chain().focus();
    if (id === "p") chain.setParagraph().run();
    else chain.setHeading({ level: Number(id.slice(1)) }).run();
    setTypeOpen(false);
  }

  function getTarget() {
    const { from, to, empty } = editor.state.selection;
    const partial = !empty;
    const text = partial
      ? editor.markdown.serialize({ type: "doc", content: editor.state.doc.slice(from, to).content.toJSON() ?? [] })
      : editor.getMarkdown();
    return {
      text,
      partial,
      apply: (md, how) => {
        const chain = editor.chain().focus();
        if (how === "after") chain.insertContentAt(partial ? to : editor.state.doc.content.size, `\n\n${md}`, { contentType: "markdown" }).run();
        else if (partial) chain.insertContentAt({ from, to }, md, { contentType: "markdown" }).run();
        else chain.setContent(md, { contentType: "markdown" }).run();
        const out = editor.getMarkdown();
        lastEmitted.current = out;
        onChange(out);
      },
    };
  }

  const current = BLOCK_TYPES.find((b) => b.id === state.block) ?? BLOCK_TYPES[0];

  return (
    <div className={cn("rounded-2xl border border-line bg-surface transition focus-within:border-primary/70 focus-within:ring-4 focus-within:ring-primary/10", className)}>
      <div className="sticky top-15 z-20 flex flex-col sm:flex-row sm:items-center gap-1.5 rounded-t-2xl border-b border-line bg-surface/95 px-2 py-1.5 backdrop-blur">
        <div className="flex items-center justify-between sm:justify-start gap-1 w-full sm:w-auto">
          {!source && editor && (
            <div className="relative shrink-0">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setTypeOpen((o) => !o)}
                className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs sm:text-sm text-fg hover:bg-surface-2"
              >
                <current.icon className="size-4 text-primary" />
                <span className="truncate max-w-[85px] sm:max-w-none">{current.label}</span>
                <ChevronDown className="size-3.5 text-muted" />
              </button>
              {typeOpen && (
                <div className="absolute start-0 top-9 z-30 w-44 rounded-xl border border-line bg-surface p-1 shadow-pop">
                  {BLOCK_TYPES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setBlock(b.id)}
                      className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start hover:bg-surface-2", state.block === b.id && "text-primary")}
                    >
                      <b.icon className="size-4" />
                      <span className={cn(b.id === "h2" && "text-base font-bold", b.id === "h3" && "font-bold", b.id === "h4" && "font-semibold", b.id === "p" && "text-sm")}>{b.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="ms-auto sm:hidden flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSource((s) => !s)}
              title={source ? "العودة للمحرر المرئي" : "تحرير Markdown مباشرة"}
              className={cn("flex h-8 items-center gap-1 rounded-lg px-2 font-mono text-[11px] transition", source ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-fg")}
            >
              <FileCode2 className="size-3.5" /> MD
            </button>
            {ai && !source && editor && <AIAssist kind="markdown" compact context={aiContext} getTarget={getTarget} />}
          </div>
        </div>

        {!source && editor && (
          <>
            <span className="hidden sm:block mx-1 h-5 w-px shrink-0 bg-line" />
            <div className="scrollbar-thin flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto py-0.5">
              <ToolButton title="غامق (Ctrl+B)" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolButton>
              <ToolButton title="مائل (Ctrl+I)" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToolButton>
              <ToolButton title="يتوسطه خط" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></ToolButton>
              <ToolButton title="كود داخل السطر" active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="size-4" /></ToolButton>
              <ToolButton title="رابط" active={state.link} onClick={() => setLink(editor)}><Link2 className="size-4" /></ToolButton>
              <span className="mx-1 h-5 w-px shrink-0 bg-line" />
              <ToolButton title="قائمة نقطية" active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></ToolButton>
              <ToolButton title="قائمة مرقّمة" active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolButton>
              <ToolButton title="اقتباس" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></ToolButton>
              <ToolButton title="كتلة كود" active={state.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock({ language: "python" }).run()}><SquareCode className="size-4" /></ToolButton>
              <ToolButton title="جدول" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="size-4" /></ToolButton>
              <ToolButton title="فاصل" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></ToolButton>
              <span className="mx-1 h-5 w-px shrink-0 bg-line" />
              <ToolButton title="تراجع (Ctrl+Z)" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="size-4" /></ToolButton>
              <ToolButton title="إعادة (Ctrl+Y)" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="size-4" /></ToolButton>
            </div>
          </>
        )}

        <div className="hidden sm:flex ms-auto shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSource((s) => !s)}
            title={source ? "العودة للمحرر المرئي" : "تحرير Markdown مباشرة"}
            className={cn("flex h-8 items-center gap-1 rounded-lg px-2 font-mono text-[11px] transition", source ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-fg")}
          >
            <FileCode2 className="size-3.5" /> MD
          </button>
          {ai && !source && editor && <AIAssist kind="markdown" context={aiContext} getTarget={getTarget} />}
        </div>
      </div>

      {source ? (
        <SmartTextEditor value={value} onChange={onChange} ai={ai} aiContext={aiContext} minRows={8} className="rounded-t-none border-0 focus-within:ring-0" />
      ) : (
        <>
          {editor && (
            <BubbleMenu
              editor={editor}
              shouldShow={({ editor: ed, state: st }) => !st.selection.empty && !ed.isActive("codeBlock")}
              className="flex items-center gap-0.5 rounded-xl border border-line bg-surface p-1 shadow-pop"
            >
              <ToolButton title="غامق" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolButton>
              <ToolButton title="مائل" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToolButton>
              <ToolButton title="كود" active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="size-4" /></ToolButton>
              <ToolButton title="رابط" active={state.link} onClick={() => setLink(editor)}><Link2 className="size-4" /></ToolButton>
              <ToolButton title="عنوان" active={state.block === "h3"} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading2 className="size-4" /></ToolButton>
              {ai && (
                <>
                  <span className="mx-0.5 h-5 w-px bg-line" />
                  <AIAssist kind="markdown" compact context={aiContext} getTarget={getTarget} />
                </>
              )}
            </BubbleMenu>
          )}
          <EditorContent editor={editor} className="px-5 py-4" />
          {!editor && <div className="skeleton m-5 h-24 rounded-xl" />}
        </>
      )}
    </div>
  );
}
