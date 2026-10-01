"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  AlignLeft, Bug, Check, ChevronDown, CornerDownLeft, Expand, Lightbulb, LoaderCircle, MessageSquareText, PenLine, Scissors, Sparkles, SpellCheck, Wand2, X,
} from "lucide-react";
import { Markdown } from "@/components/lesson/Markdown";
import { api } from "@/lib/client";
import { highlightCode } from "./highlight";
import { cn } from "@/lib/utils";

const TEXT_ACTIONS = [
  { id: "improve", label: "حسّن الصياغة", icon: Wand2 },
  { id: "simplify", label: "بسّط للصغار", icon: Lightbulb },
  { id: "expand", label: "وسّع الشرح + مثال", icon: Expand },
  { id: "analogy", label: "أضف تشبيهًا", icon: MessageSquareText },
  { id: "shorten", label: "اختصر", icon: Scissors },
  { id: "fix", label: "صحّح الإملاء", icon: SpellCheck },
  { id: "continue", label: "أكمل الكتابة", icon: PenLine },
];

const CODE_ACTIONS = [
  { id: "fix", label: "صحّح الأخطاء", icon: Bug },
  { id: "comment", label: "أضف تعليقات عربية", icon: MessageSquareText },
  { id: "improve", label: "حسّن الكود", icon: Wand2 },
  { id: "simplify", label: "بسّط للمبتدئين", icon: AlignLeft },
];

/**
 * "Improve with AI" menu for an editor. getTarget() returns { text, apply(newText, mode) } —
 * the selected text when there is a selection, otherwise the whole value.
 * The suggestion is previewed first; the teacher accepts, inserts after, or discards it.
 */
export function AIAssist({ kind = "markdown", language = "python", context = "", getTarget, compact, dark }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const target = useRef(null);
  const wrap = useRef(null);
  const actions = kind === "code" ? CODE_ACTIONS : TEXT_ACTIONS;
  // Code blocks force dir="ltr" on their root (CodeEditor) while still pinning this button to the
  // panel's true right edge, right up against the app's fixed sidebar. With dir="rtl" set below,
  // `end-0` resolves to left:0 and grows the menu rightward — off the panel and under the sidebar.
  // `start-0` resolves to right:0 there instead, growing it leftward into the roomy panel body.
  const anchor = kind === "code" ? "start-0" : "end-0";

  useEffect(() => {
    if (!open) return;
    const close = (e) => !wrap.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  async function run(action, instruction = "") {
    target.current = getTarget();
    setBusy(action);
    setOpen(false);
    try {
      const res = await api("/api/admin/ai/assist", {
        method: "POST",
        body: { text: target.current.text, kind, action, instruction, language, context },
      });
      setSuggestion({ text: res.text, partial: target.current.partial });
      setCustom("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  function accept(mode) {
    target.current.apply(suggestion.text, mode);
    setSuggestion(null);
    toast.success(mode === "after" ? "تمت الإضافة" : "تم التطبيق — يمكنك التراجع بـ Ctrl+Z أو زر التراجع");
  }

  return (
    <div className="relative overflow-visible" ref={wrap}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={!!busy}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-white transition disabled:opacity-70",
          "bg-[linear-gradient(120deg,#7C5CFF,#B76CFF_60%,#FFB547)] shadow-[0_6px_16px_-8px_#7C5CFF] hover:brightness-110"
        )}
      >
        {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        {busy ? "يكتب…" : compact ? "AI" : "حسّن بالذكاء"}
        {!busy && <ChevronDown className="size-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            dir="rtl"
            className={cn("absolute top-9 z-40 w-[min(16rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-1.5 text-fg shadow-pop", anchor)}
          >
            <div className="px-2.5 pb-1 pt-1.5 text-[11px] text-muted">يعمل على النص المحدد، أو على الكتلة كلها</div>
            {actions.map((a) => (
              <button key={a.id} type="button" onClick={() => run(a.id)} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm hover:bg-surface-2">
                <a.icon className="size-4 text-primary" /> {a.label}
              </button>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (custom.trim().length >= 3) run("custom", custom.trim());
              }}
              className="mt-1 flex items-center gap-1 border-t border-line p-1.5 pt-2.5"
            >
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={kind === "code" ? "اطلب: اكتب دالة تحسب المعدل…" : "اطلب ما تريد…"}
                className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-bg px-2.5 text-sm outline-none focus:border-primary"
              />
              <button type="submit" className="grid size-9 place-items-center rounded-lg bg-primary text-white" aria-label="إرسال">
                <CornerDownLeft className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            dir="rtl"
            className={cn(
              "absolute top-9 z-40 w-[min(640px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-primary/40 bg-surface text-fg shadow-pop",
              anchor,
              dark && "top-9"
            )}
          >
            <div className="flex items-center gap-2 border-b border-line bg-primary-soft/60 px-3 py-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" /> اقتراح الذكاء الاصطناعي
              {suggestion.partial && <span className="text-xs font-normal text-muted">(للنص المحدد)</span>}
              <button type="button" onClick={() => setSuggestion(null)} className="ms-auto text-muted hover:text-fg" aria-label="إغلاق">
                <X className="size-4" />
              </button>
            </div>
            <div className="scrollbar-thin max-h-80 overflow-y-auto p-4">
              {kind === "code" ? (
                <pre className="overflow-x-auto rounded-xl bg-[#0f0d1f] p-3 font-mono text-[13px] leading-6 text-[#e7e5ff]" dir="ltr">
                  <code className="hljs" dangerouslySetInnerHTML={{ __html: highlightCode(suggestion.text, language) }} />
                </pre>
              ) : (
                <Markdown className="text-[0.95rem]">{suggestion.text}</Markdown>
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-line p-2.5">
              <button type="button" onClick={() => accept("replace")} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600">
                <Check className="size-4" /> استبدال
              </button>
              {kind !== "code" && (
                <button type="button" onClick={() => accept("after")} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-surface-2">
                  إدراج بعده
                </button>
              )}
              <button type="button" onClick={() => setSuggestion(null)} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-2">
                تجاهل
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
