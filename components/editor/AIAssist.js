"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  AlignLeft,
  Bug,
  Check,
  ChevronDown,
  CornerDownLeft,
  Expand,
  Lightbulb,
  LoaderCircle,
  MessageSquareText,
  PenLine,
  Scissors,
  Sparkles,
  SpellCheck,
  Wand2,
  X,
} from "lucide-react";
import { Markdown } from "@/components/lesson/Markdown";
import { api } from "@/lib/client";
import { useMounted } from "@/components/ui/useMounted";
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
 * Universal "Improve with AI" modal for code and rich-text editors.
 * Opens in a clean, unified bottom sheet on mobile and centered modal on desktop.
 */
export function AIAssist({
  kind = "markdown",
  language = "python",
  context = "",
  getTarget,
  compact,
  dark,
  className,
}) {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const target = useRef(null);
  const actions = kind === "code" ? CODE_ACTIONS : TEXT_ACTIONS;

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!open && !suggestion) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSuggestion(null);
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, suggestion]);

  function handleOpen() {
    try {
      target.current = getTarget?.();
    } catch {
      // ignore
    }
    setOpen(true);
  }

  async function run(action, instruction = "") {
    if (!target.current) {
      try {
        target.current = getTarget?.();
      } catch {
        // ignore
      }
    }
    const currentTarget = target.current;
    if (!currentTarget) {
      toast.error("تعذر تحديد النص المطلوب");
      return;
    }

    setBusy(action);
    setOpen(false);
    const toastId = toast.loading("المساعد الذكي يفكّر ويكتب الاقتراح…");
    try {
      const res = await api("/api/admin/ai/assist", {
        method: "POST",
        body: { text: currentTarget.text, kind, action, instruction, language, context },
      });
      toast.dismiss(toastId);
      setSuggestion({
        text: res.text,
        partial: currentTarget.partial,
        apply: currentTarget.apply,
      });
      setCustom("");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "حدث خطأ أثناء معالجة الطلب");
    } finally {
      setBusy(null);
    }
  }

  function accept(mode) {
    if (suggestion?.apply) {
      suggestion.apply(suggestion.text, mode);
    } else if (target.current?.apply) {
      target.current.apply(suggestion.text, mode);
    }
    setSuggestion(null);
    toast.success(mode === "after" ? "تمت الإضافة بنجاح" : "تم التطبيق — يمكنك التراجع بـ Ctrl+Z");
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={!!busy}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-white transition disabled:opacity-70",
          "bg-[linear-gradient(120deg,#7C5CFF,#B76CFF_60%,#FFB547)] shadow-[0_6px_16px_-8px_#7C5CFF] hover:brightness-110 active:scale-95",
          className
        )}
      >
        {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        {busy ? (
          "يكتب…"
        ) : compact ? (
          "AI"
        ) : (
          <>
            <span className="hidden sm:inline">حسّن بالذكاء</span>
            <span className="sm:hidden">AI</span>
          </>
        )}
        {!busy && <ChevronDown className="size-3" />}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {/* Options Menu Modal */}
            {open && (
              <div
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
                dir="rtl"
              >
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 bg-[#0c0a18]/70 backdrop-blur-xs"
                />

                {/* Modal Card */}
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24, scale: 0.96 }}
                  transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  className="relative z-10 w-full max-w-[420px] rounded-3xl border border-line bg-surface p-4 text-fg shadow-2xl"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-line/60">
                    <div className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-fg">
                      ✨ خيارات المساعد الذكي
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="grid size-8 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg transition-colors"
                      aria-label="إغلاق"
                    >
                      <X className="size-4.5" />
                    </button>
                  </div>

                  {/* Action Items List */}
                  <div className="space-y-1 py-2 max-h-[55vh] overflow-y-auto scrollbar-thin">
                    {actions.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => run(a.id)}
                        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium hover:bg-surface-2/80 active:bg-surface-2 transition-colors text-start group"
                      >
                        <span className="text-fg/90 group-hover:text-fg">{a.label}</span>
                        <a.icon className="size-4.5 text-primary shrink-0 transition-transform group-hover:scale-110" />
                      </button>
                    ))}
                  </div>

                  {/* Custom Prompt Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (custom.trim().length >= 3) run("custom", custom.trim());
                    }}
                    className="flex items-center gap-2 border-t border-line/60 pt-3 mt-1"
                  >
                    <input
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                      placeholder={
                        kind === "code"
                          ? "اطلب: اكتب دالة تحسب المعدل…"
                          : "اطلب ما تريد: لخص، أعد الصياغة…"
                      }
                      className="h-11 min-w-0 flex-1 rounded-2xl border border-line bg-bg/85 px-4 text-sm text-fg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted/70"
                    />
                    <button
                      type="submit"
                      disabled={custom.trim().length < 3}
                      className="grid size-11 place-items-center rounded-2xl bg-primary text-white shrink-0 hover:bg-primary-hover active:scale-95 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="إرسال"
                    >
                      <CornerDownLeft className="size-5" />
                    </button>
                  </form>
                </motion.div>
              </div>
            )}

            {/* Suggestion Preview Modal */}
            {suggestion && (
              <div
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
                dir="rtl"
              >
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSuggestion(null)}
                  className="fixed inset-0 bg-[#0c0a18]/70 backdrop-blur-xs"
                />

                {/* Modal Card */}
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24, scale: 0.96 }}
                  transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  className="relative z-10 w-full max-w-2xl max-h-[85vh] rounded-3xl border border-primary/40 bg-surface text-fg shadow-2xl flex flex-col overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-line/70 bg-primary-soft/50 px-4 py-3 shrink-0">
                    <div className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                      <Sparkles className="size-4.5 text-primary" />
                      <span>اقتراح الذكاء الاصطناعي</span>
                      {suggestion.partial && (
                        <span className="text-xs font-normal text-muted">(للنص المحدد)</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSuggestion(null)}
                      className="grid size-8 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg transition-colors"
                      aria-label="إغلاق"
                    >
                      <X className="size-4.5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="scrollbar-thin max-h-[60vh] overflow-y-auto p-4 sm:p-5 flex-1">
                    {kind === "code" ? (
                      <pre
                        className="overflow-x-auto rounded-2xl bg-[#0d0b1a] p-4 font-mono text-[13px] leading-6 text-[#e7e5ff] border border-white/5"
                        dir="ltr"
                      >
                        <code
                          className="hljs"
                          dangerouslySetInnerHTML={{
                            __html: highlightCode(suggestion.text, language),
                          }}
                        />
                      </pre>
                    ) : (
                      <Markdown className="text-[0.95rem] leading-7">{suggestion.text}</Markdown>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line/60 p-3.5 shrink-0 bg-surface">
                    <button
                      type="button"
                      onClick={() => setSuggestion(null)}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg transition"
                    >
                      تجاهل
                    </button>
                    {kind !== "code" && (
                      <button
                        type="button"
                        onClick={() => accept("after")}
                        className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-surface-2 transition"
                      >
                        إدراج بعده
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => accept("replace")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover shadow-sm transition"
                    >
                      <Check className="size-4" /> استبدال
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

