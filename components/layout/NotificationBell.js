"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { toast } from "sonner";
import { Bell, BellOff, CheckCheck, Volume2 } from "lucide-react";
import { NotificationIcon } from "@/components/shared/NotificationIcon";
import { playChime, setSoundEnabled, soundEnabled } from "@/lib/sound";
import { api } from "@/lib/client";
import { cn, timeAgo } from "@/lib/utils";

const POLL_MS = 15000;

/**
 * Live header bell: polls /api/notifications/feed every 15s (and on tab focus), shows a badge,
 * a dropdown with the latest items, and — when something new arrives — a toast, a chime and a shake.
 */
export function NotificationBell({ initialUnread = 0, allHref }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState(null);
  const [sound, setSound] = useState(soundEnabled);
  const seen = useRef(null); // newest createdAt we already know about
  const wrap = useRef(null);
  const bell = useAnimationControls();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/feed", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const newest = data.items[0]?.createdAt ?? null;
      if (seen.current !== null && newest && newest > seen.current) {
        const fresh = data.items.filter((n) => n.createdAt > seen.current && !n.readAt);
        if (fresh.length) {
          playChime();
          bell.start({ rotate: [0, -18, 16, -12, 8, 0], transition: { duration: 0.7 } });
          const n = fresh[0];
          toast(n.title, {
            description: fresh.length > 1 ? `و${fresh.length - 1} إشعارات أخرى` : n.body ?? undefined,
            action: n.link ? { label: "فتح", onClick: () => router.push(n.link) } : undefined,
            duration: 7000,
          });
          router.refresh();
        }
      }
      if (newest && (seen.current === null || newest > seen.current)) seen.current = newest;
      if (seen.current === null) seen.current = "";
      setItems(data.items);
      setUnread(data.unread);
    } catch {}
  }, [bell, router]);

  useEffect(() => {
    // Initial fetch + polling: there is no synchronous value to derive this from during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !wrap.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  async function markAll() {
    await api("/api/notifications/read", { method: "POST", body: { all: true } }).catch(() => {});
    setUnread(0);
    setItems((list) => list?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  }

  async function openItem(n) {
    setOpen(false);
    if (!n.readAt) {
      setUnread((u) => Math.max(0, u - 1));
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      api("/api/notifications/read", { method: "POST", body: { ids: [n.id] } }).catch(() => {});
    }
    if (n.link) router.push(n.link);
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    if (next) playChime();
  }

  return (
    <div className="relative" ref={wrap}>
      <motion.button
        animate={bell}
        onClick={() => setOpen((o) => !o)}
        className={cn("relative grid size-10 place-items-center rounded-xl transition-colors", open ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg")}
        aria-label={`الإشعارات${unread ? ` (${unread} جديدة)` : ""}`}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute end-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-bg">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 top-12 z-40 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-surface shadow-pop max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:w-auto"
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <span className="font-semibold">الإشعارات</span>
              {unread > 0 && <span className="rounded-full bg-coral-soft px-2 py-0.5 text-xs font-medium text-coral">{unread} جديدة</span>}
              <div className="ms-auto flex items-center gap-1">
                <button onClick={toggleSound} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg" title={sound ? "كتم صوت الإشعارات" : "تشغيل صوت الإشعارات"}>
                  {sound ? <Volume2 className="size-4" /> : <BellOff className="size-4" />}
                </button>
                {unread > 0 && (
                  <button onClick={markAll} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-primary hover:bg-primary-soft">
                    <CheckCheck className="size-4" /> قراءة الكل
                  </button>
                )}
              </div>
            </div>
            <div className="scrollbar-thin max-h-[60vh] overflow-y-auto p-1.5">
              {items === null && <div className="skeleton m-2 h-16 rounded-xl" />}
              {items?.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">لا إشعارات بعد 🔔</p>}
              {items?.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={cn("flex w-full items-start gap-3 rounded-xl p-2.5 text-start transition hover:bg-surface-2", !n.readAt && "bg-primary-soft/40")}
                >
                  <NotificationIcon type={n.type} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium">{n.title}</div>
                    {n.body && <div className="mt-0.5 line-clamp-1 text-xs text-muted">{n.body}</div>}
                    <div className="mt-1 text-[11px] text-muted">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
            <Link href={allHref} onClick={() => setOpen(false)} className="block border-t border-line py-2.5 text-center text-sm font-medium text-primary hover:bg-surface-2">
              عرض كل الإشعارات
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
