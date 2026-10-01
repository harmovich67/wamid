"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Bug, CodeXml, Lightbulb, MessageCirclePlus, MessagesSquare, ScanSearch, Send, Sparkles, Trash2, X } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Markdown } from "@/components/lesson/Markdown";
import { api } from "@/lib/client";
import { cn, timeAgo } from "@/lib/utils";

const MODES = [
  { value: "chat", label: "سؤال", icon: Sparkles },
  { value: "explain", label: "اشرح لي", icon: Lightbulb },
  { value: "review", label: "راجع كودي", icon: ScanSearch },
  { value: "hint", label: "تلميح", icon: MessagesSquare },
  { value: "debug", label: "صحّح الخطأ", icon: Bug },
];

const STARTERS = [
  { mode: "explain", text: "ما هو المتغير (variable) ولماذا نحتاجه؟" },
  { mode: "explain", text: "اشرح لي الحلقات loops بمثال من الحياة" },
  { mode: "debug", text: "ماذا يعني الخطأ IndentationError في بايثون؟" },
  { mode: "chat", text: "كيف أتدرّب على حل المشكلات البرمجية؟" },
];

export function AssistantChat({ userName, initialConversations, context: initialContext, initialMode, configured, dailyLimit }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(initialMode);
  const [context, setContext] = useState(initialContext);
  const [streaming, setStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scroller = useRef(null);
  const textarea = useRef(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function openConversation(id) {
    setShowHistory(false);
    if (streaming) return;
    try {
      const res = await api(`/api/ai/conversations/${id}`);
      setActiveId(id);
      setMessages(res.messages);
      setContext(null);
    } catch (err) {
      toast.error(err.message);
    }
  }

  function newChat() {
    setActiveId(null);
    setMessages([]);
    setShowHistory(false);
    textarea.current?.focus();
  }

  async function removeConversation(id) {
    try {
      await api(`/api/ai/conversations/${id}`, { method: "DELETE" });
      setConversations((c) => c.filter((x) => x.id !== id));
      if (activeId === id) newChat();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function send(text = input, sendMode = mode) {
    const message = text.trim();
    if (!message || streaming) return;
    setInput("");
    setStreaming(true);
    const userMsg = { id: `u-${Date.now()}`, role: "user", content: message };
    const botId = `m-${Date.now()}`;
    setMessages((m) => [...m, userMsg, { id: botId, role: "model", content: "" }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeId,
          message,
          mode: sendMode,
          context: activeId ? null : context ? { lessonId: context.lessonId, taskId: context.taskId } : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "تعذّر إرسال الرسالة");
      }
      const convId = res.headers.get("X-Conversation-Id");
      if (convId && convId !== activeId) {
        setActiveId(convId);
        setConversations((c) => [{ id: convId, title: message.slice(0, 60), updatedAt: new Date().toISOString() }, ...c.filter((x) => x.id !== convId)]);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => m.map((x) => (x.id === botId ? { ...x, content: x.content + chunk } : x)));
      }
    } catch (err) {
      toast.error(err.message);
      setMessages((m) => m.filter((x) => x.id !== botId && x.id !== userMsg.id));
      setInput(message);
    } finally {
      setStreaming(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="-my-6 flex h-[calc(100dvh-4rem-7rem)] gap-4 sm:-my-8 lg:h-[calc(100dvh-4rem)] lg:py-6">
      {/* History sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-40 w-72 flex-col border-e border-line bg-surface p-3 lg:static lg:z-auto lg:flex lg:rounded-3xl lg:border",
          showHistory ? "flex" : "hidden"
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <button onClick={newChat} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-600">
            <MessageCirclePlus className="size-4" /> محادثة جديدة
          </button>
          <button onClick={() => setShowHistory(false)} className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-2 lg:hidden" aria-label="إغلاق">
            <X className="size-5" />
          </button>
        </div>
        <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto">
          {conversations.length === 0 && <p className="p-3 text-center text-sm text-muted">لا محادثات سابقة</p>}
          {conversations.map((c) => (
            <div key={c.id} className={cn("group flex items-center gap-1 rounded-xl", c.id === activeId ? "bg-primary-soft" : "hover:bg-surface-2")}>
              <button onClick={() => openConversation(c.id)} className="min-w-0 flex-1 px-3 py-2.5 text-start">
                <div className="truncate text-sm">{c.title}</div>
                <div className="text-[11px] text-muted">{timeAgo(c.updatedAt)}</div>
              </button>
              <button onClick={() => removeConversation(c.id)} className="me-1 hidden size-8 place-items-center rounded-lg text-muted hover:text-coral group-hover:grid" aria-label="حذف">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </aside>
      {showHistory && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setShowHistory(false)} />}

      {/* Chat */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-none border-line bg-surface sm:rounded-3xl sm:border sm:shadow-card">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <button onClick={() => setShowHistory(true)} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-2 lg:hidden" aria-label="المحادثات">
            <MessagesSquare className="size-5" />
          </button>
          <LogoMark size={36} animated={streaming} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">ومضة AI</div>
            <div className="truncate text-xs text-muted">{streaming ? "يكتب…" : "مساعدك الذكي في البرمجة"}</div>
          </div>
          {context && !activeId && (
            <span className="flex max-w-[45%] items-center gap-1 truncate rounded-full bg-primary-soft px-3 py-1 text-xs text-primary">
              <span className="truncate">{context.label}</span>
              <button onClick={() => setContext(null)} aria-label="إزالة السياق">
                <X className="size-3.5" />
              </button>
            </span>
          )}
        </header>

        <div ref={scroller} className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {!configured && (
            <div className="mb-4 rounded-2xl bg-amber-soft p-3 text-sm text-[#b86e00] dark:text-amber">المساعد لم يُضبط بعد من قبل المعلّم — قد لا تصلك إجابات.</div>
          )}
          {empty ? (
            <div className="mx-auto flex max-w-xl flex-col items-center pt-6 text-center">
              <div className="animate-float">
                <LogoMark size={72} animated />
              </div>
              <h2 className="mt-5 text-2xl font-bold">أهلًا {userName}! كيف أساعدك اليوم؟</h2>
              <p className="mt-2 text-muted">اسألني عن أي مفهوم، ألصق كودك للمراجعة، أو اطلب تلميحًا لمهمتك.</p>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => {
                      setMode(s.mode);
                      send(s.text, s.mode);
                    }}
                    className="rounded-2xl border border-line p-3.5 text-start text-sm transition hover:border-primary/40 hover:bg-surface-2"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
              {dailyLimit > 0 && <p className="mt-4 text-xs text-muted">لديك حتى {dailyLimit} رسالة يوميًا.</p>}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                    {m.role === "user" ? <Avatar name={userName} size={32} /> : <LogoMark size={32} />}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-3xl px-4 py-3",
                        m.role === "user" ? "rounded-se-md bg-primary text-white" : "rounded-ss-md bg-surface-2"
                      )}
                    >
                      {m.role === "user" ? (
                        <div className="whitespace-pre-wrap break-words text-[15px] leading-7">{m.content}</div>
                      ) : m.content ? (
                        <Markdown className="text-[15px]">{m.content}</Markdown>
                      ) : (
                        <div className="flex gap-1 py-2">
                          {[0, 1, 2].map((i) => (
                            <motion.span key={i} className="size-2 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="border-t border-line p-3 sm:p-4">
          <div className="scrollbar-thin mb-2 flex gap-1.5 overflow-x-auto">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  mode === m.value ? "border-primary bg-primary-soft text-primary" : "border-line text-muted hover:text-fg"
                )}
              >
                <m.icon className="size-3.5" /> {m.label}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2 rounded-2xl border border-line bg-bg p-2 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15"
          >
            <button
              type="button"
              title="إدراج كتلة كود"
              onClick={() => {
                setInput((v) => `${v}${v ? "\n" : ""}\`\`\`\n\n\`\`\``);
                textarea.current?.focus();
              }}
              className="grid size-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg"
            >
              <CodeXml className="size-5" />
            </button>
            <textarea
              ref={textarea}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={mode === "review" || mode === "debug" ? "ألصق الكود أو رسالة الخطأ هنا…" : "اكتب سؤالك…"}
              className="max-h-48 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] outline-none placeholder:text-muted/70 [field-sizing:content]"
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white transition hover:bg-primary-600 disabled:opacity-40"
              aria-label="إرسال"
            >
              <Send className="size-5 -scale-x-100" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
