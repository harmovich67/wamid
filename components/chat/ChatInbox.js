"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { toast } from "sonner";
import { Lock, LockOpen, MessagesSquare, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useMounted } from "@/components/ui/useMounted";
import { api } from "@/lib/client";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

const POLL_MS = 8000;
const FILTERS = [
  { id: "all", label: "الكل" },
  { id: "unread", label: "غير مقروءة" },
  { id: "open", label: "المفتوحة" },
];

/** Asks the inbox list to reload now (after toggling access, sending…). */
export function refreshInbox() {
  window.dispatchEvent(new Event("wameed:inbox-refresh"));
}

/**
 * Two-pane chat inbox for the teacher. On phones only one pane shows at a time:
 * the list on /admin/chats, the conversation on /admin/chats/[id].
 */
export function ChatInbox({ initialThreads, children }) {
  const selected = useSelectedLayoutSegment();
  const mounted = useMounted();
  const [threads, setThreads] = useState(initialThreads);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [bulk, setBulk] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chats", { cache: "no-store" });
      if (res.ok) setThreads((await res.json()).threads);
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    window.addEventListener("wameed:inbox-refresh", load);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(timer);
      window.removeEventListener("wameed:inbox-refresh", load);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  // Opening a conversation reads it: clear its badge right away instead of waiting for the next poll.
  const shown = useMemo(() => threads.map((t) => (t.id === selected ? { ...t, unread: 0 } : t)), [threads, selected]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return shown.filter((t) => {
      if (filter === "unread" && !t.unread) return false;
      if (filter === "open" && !t.chatEnabled) return false;
      return !term || t.name.toLowerCase().includes(term) || t.username.includes(term);
    });
  }, [shown, q, filter]);

  const openCount = threads.filter((t) => t.chatEnabled).length;
  const unreadTotal = shown.reduce((sum, t) => sum + t.unread, 0);

  async function setAll(enabled) {
    setBusy(enabled ? "open" : "close");
    try {
      const res = await api("/api/admin/chats", { method: "POST", body: { all: true, enabled } });
      toast.success(enabled ? `فُتحت المراسلة لكل الطلاب (${formatNumber(res.count)})` : "أُغلقت المراسلة لكل الطلاب");
      setThreads((list) => list.map((t) => ({ ...t, chatEnabled: enabled })));
      setBulk(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid h-[max(26rem,calc(100dvh-13.25rem))] gap-4 sm:h-[max(28rem,calc(100dvh-14.75rem))] lg:h-[max(32rem,calc(100dvh-10.75rem))] grid-cols-[minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className={cn("flex min-h-0 flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-card", selected && "max-lg:hidden")}>
        <div className="border-b border-line p-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">رسائل الطلاب</h1>
            {unreadTotal > 0 && <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-bold text-white">{unreadTotal}</span>}
            <button
              onClick={() => setBulk(true)}
              className="ms-auto flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary-soft"
            >
              <LockOpen className="size-3.5" /> الصلاحيات
            </button>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            المراسلة مفتوحة لـ <b className="text-fg">{formatNumber(openCount)}</b> من {formatNumber(threads.length)} طالب
          </p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن طالب"
              className="h-10 w-full rounded-xl border border-line bg-bg ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="mt-2.5 flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  filter === f.id ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-fg"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
          {filtered.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">لا توجد محادثات مطابقة.</p>}
          {filtered.map((t) => (
            <Link
              key={t.id}
              href={`/admin/chats/${t.id}`}
              className={cn(
                "flex items-center gap-3 rounded-2xl p-2.5 transition",
                selected === t.id ? "bg-primary-soft" : "hover:bg-surface-2",
                !t.isActive && "opacity-60"
              )}
            >
              <div className="relative">
                <Avatar name={t.name} color={t.avatarColor} avatar={t.avatar} size={44} />
                {!t.chatEnabled && (
                  <span className="absolute -bottom-0.5 -end-0.5 grid size-5 place-items-center rounded-full border-2 border-surface bg-surface-2 text-muted" title="المراسلة مغلقة">
                    <Lock className="size-2.5" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("truncate text-sm", t.unread ? "font-bold" : "font-medium")}>{t.name}</span>
                  {t.last && <span className="ms-auto shrink-0 text-[11px] text-muted">{mounted ? timeAgo(t.last.createdAt) : ""}</span>}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className={cn("truncate text-xs", t.unread ? "font-medium text-fg" : "text-muted")} dir="auto">
                    {t.last ? `${t.last.fromStudent ? "" : "أنت: "}${t.last.text}` : t.chatEnabled ? "لا رسائل بعد" : "المراسلة مغلقة"}
                  </span>
                  {t.unread > 0 && (
                    <span className="ms-auto grid min-w-5 shrink-0 place-items-center rounded-full bg-coral px-1.5 text-[11px] font-bold leading-5 text-white">{t.unread}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </aside>

      <section className={cn("min-h-0 min-w-0", !selected && "max-lg:hidden")}>
        {children}
      </section>

      <Modal
        open={bulk}
        onClose={() => setBulk(false)}
        title="صلاحية المراسلة"
        description="أنت من يقرر من يستطيع مراسلتك. يمكنك أيضًا فتحها أو إغلاقها لكل طالب من داخل محادثته."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="soft" loading={busy === "open"} disabled={Boolean(busy)} onClick={() => setAll(true)}>
            <LockOpen className="size-4" /> فتح المراسلة للجميع
          </Button>
          <Button variant="secondary" loading={busy === "close"} disabled={Boolean(busy)} onClick={() => setAll(false)}>
            <Lock className="size-4" /> إغلاق المراسلة للجميع
          </Button>
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-surface-2 p-3 text-xs leading-6 text-muted">
          <MessagesSquare className="mt-0.5 size-4 shrink-0 text-primary" />
          عند فتح المراسلة يصل الطالب إشعار فوري. الطالب المغلقة محادثته يرى الرسائل السابقة فقط ولا يستطيع الإرسال.
        </p>
      </Modal>
    </div>
  );
}
