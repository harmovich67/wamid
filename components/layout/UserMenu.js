"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { LogOut, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/client";

export function UserMenu({ user, subtitle, profileHref }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-0.5 transition hover:ring-4 hover:ring-primary/15" aria-label="قائمة الحساب">
        <Avatar name={user.name} color={user.avatarColor} avatar={user.avatar} size={38} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute end-0 top-12 z-40 w-60 rounded-2xl border border-line bg-surface p-2 shadow-pop"
          >
            <div className="flex items-center gap-3 p-2">
              <Avatar name={user.name} color={user.avatarColor} avatar={user.avatar} size={40} />
              <div className="min-w-0">
                <div className="truncate font-semibold">{user.name}</div>
                <div className="truncate text-xs text-muted">{subtitle}</div>
              </div>
            </div>
            <div className="my-1 h-px bg-line" />
            {profileHref && (
              <Link href={profileHref} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-2">
                <UserRound className="size-4 text-muted" /> الملف الشخصي
              </Link>
            )}
            <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-coral hover:bg-coral-soft">
              <LogOut className="size-4" /> تسجيل الخروج
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
