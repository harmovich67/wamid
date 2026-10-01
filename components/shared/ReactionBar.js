"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { SmilePlus } from "lucide-react";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

/** Emoji reactions under an announcement. Students toggle; the teacher only sees counts. */
export function ReactionBar({ announcementId, initial, readOnly }) {
  const [reactions, setReactions] = useState(initial);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(null);
  const used = reactions.filter((r) => r.count > 0);

  async function toggle(emoji) {
    if (readOnly || busy) return;
    setBusy(emoji);
    setPicker(false);
    // Optimistic update.
    setReactions((list) => list.map((r) => (r.emoji === emoji ? { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) } : r)));
    try {
      const res = await api(`/api/announcements/${announcementId}/react`, { method: "POST", body: { emoji } });
      setReactions(res.reactions);
    } catch (err) {
      toast.error(err.message);
      setReactions(initial);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <AnimatePresence initial={false}>
        {used.map((r) => (
          <motion.button
            key={r.emoji}
            layout
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            whileTap={readOnly ? undefined : { scale: 1.25 }}
            type="button"
            onClick={() => toggle(r.emoji)}
            disabled={readOnly}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition",
              r.mine ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface hover:bg-surface-2",
              readOnly && "cursor-default"
            )}
          >
            <span className="text-base leading-none">{r.emoji}</span>
            <span className="font-semibold tabular-nums">{r.count}</span>
          </motion.button>
        ))}
      </AnimatePresence>
      {!readOnly && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setPicker((p) => !p)}
            className="grid size-9 place-items-center rounded-full border border-dashed border-line text-muted transition hover:border-primary hover:text-primary"
            aria-label="أضف تفاعلًا"
          >
            <SmilePlus className="size-4" />
          </button>
          <AnimatePresence>
            {picker && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.9 }}
                className="absolute bottom-11 start-0 z-20 flex gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-pop"
              >
                {reactions.map((r) => (
                  <motion.button
                    key={r.emoji}
                    whileHover={{ scale: 1.3, y: -3 }}
                    type="button"
                    onClick={() => toggle(r.emoji)}
                    className={cn("grid size-9 place-items-center rounded-xl text-xl", r.mine && "bg-primary-soft")}
                  >
                    {r.emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
