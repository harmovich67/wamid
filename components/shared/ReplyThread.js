"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Send, Smile } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { LogoMark } from "@/components/brand/Logo";
import { api } from "@/lib/client";
import { REACTION_EMOJIS } from "@/lib/constants";
import { cn, timeAgo } from "@/lib/utils";

const QUICK_EMOJIS = [...REACTION_EMOJIS, "😊", "💪", "👏", "🤔", "✅", "🚀"];

/**
 * Private conversation between one student and the teacher under an announcement.
 * `viewerRole` decides which side is "mine" (shown on the start side).
 */
export function ReplyThread({ announcementId, studentId, viewerRole, initial, placeholder }) {
  const router = useRouter();
  const [ownMessages, setOwnMessages] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [emojis, setEmojis] = useState(false);
  const input = useRef(null);
  const bottom = useRef(null);
  // Own optimistic sends layer on top of the server-provided list; a fresh `initial` (new thread,
  // router.refresh()) replaces it outright, no effect needed.
  const messages = ownMessages && ownMessages.base === initial ? ownMessages.list : initial;

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages.length]);

  async function send(e) {
    e?.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await api(`/api/announcements/${announcementId}/reply`, {
        method: "POST",
        body: { content, ...(viewerRole === "ADMIN" ? { studentId } : {}) },
      });
      setOwnMessages({ base: initial, list: [...messages, res.reply] });
      setText("");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  function addEmoji(emoji) {
    const el = input.current;
    const s = el?.selectionStart ?? text.length;
    setText(text.slice(0, s) + emoji + text.slice(el?.selectionEnd ?? s));
    setEmojis(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(s + emoji.length, s + emoji.length);
    });
  }

  return (
    <div>
      <div className="space-y-3">
        {messages.length === 0 && <p className="py-4 text-center text-sm text-muted">لا رسائل بعد — اكتب أول رد 👇</p>}
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.author.role === viewerRole;
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex items-end gap-2", !mine && "flex-row-reverse")}>
                {m.author.role === "ADMIN" ? <LogoMark size={30} /> : <Avatar name={m.author.name} color={m.author.avatarColor} size={30} />}
                <div className={cn("max-w-[80%] rounded-3xl px-4 py-2.5", mine ? "rounded-ee-md bg-primary text-white" : "rounded-es-md bg-surface-2")}>
                  <div className={cn("mb-0.5 text-[11px]", mine ? "text-white/70" : "text-muted")}>
                    {m.author.role === "ADMIN" ? "المعلّم" : m.author.name} · {timeAgo(m.createdAt)}
                  </div>
                  <div className="whitespace-pre-wrap break-words text-[15px] leading-7" dir="auto">{m.content}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottom} />
      </div>

      <form onSubmit={send} className="relative mt-4 flex items-end gap-2 rounded-2xl border border-line bg-bg p-2 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
        <div className="relative">
          <button type="button" onClick={() => setEmojis((v) => !v)} className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg" aria-label="إيموجي">
            <Smile className="size-5" />
          </button>
          <AnimatePresence>
            {emojis && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                className="absolute bottom-12 start-0 z-20 grid w-64 grid-cols-7 gap-1 rounded-2xl border border-line bg-surface p-2 shadow-pop"
              >
                {QUICK_EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => addEmoji(e)} className="grid size-8 place-items-center rounded-lg text-xl transition hover:scale-125 hover:bg-surface-2">
                    {e}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <textarea
          ref={input}
          rows={1}
          value={text}
          dir="auto"
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          className="max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] outline-none placeholder:text-muted/70 [field-sizing:content]"
        />
        <button type="submit" disabled={!text.trim() || sending} className="grid size-10 place-items-center rounded-xl bg-primary text-white transition hover:bg-primary-600 disabled:opacity-40" aria-label="إرسال">
          <Send className="size-5 -scale-x-100" />
        </button>
      </form>
    </div>
  );
}
