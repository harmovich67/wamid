"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bot, ClipboardCheck, ExternalLink, LayoutDashboard, ListChecks, Map, Megaphone, Menu, Sparkles, Trophy, Users, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";

// Each item carries its own accent so the sidebar reads at a glance (the icon tile takes the color).
const GROUPS = [
  {
    label: null,
    items: [{ href: "/admin", label: "نظرة عامة", icon: LayoutDashboard, exact: true, color: "#7C5CFF" }],
  },
  {
    label: "الطلاب",
    items: [
      { href: "/admin/students", label: "الطلاب والصلاحيات", icon: Users, color: "#38BDF8" },
      { href: "/admin/submissions", label: "التسليمات", icon: ClipboardCheck, badge: "pending", color: "#FF6B81" },
    ],
  },
  {
    label: "المحتوى",
    items: [
      { href: "/admin/curriculum", label: "المسار والدورات", icon: Map, match: ["/admin/curriculum", "/admin/courses", "/admin/lessons"], color: "#22C5A0" },
      { href: "/admin/tasks", label: "المهام والتحديات", icon: ListChecks, color: "#FFB547" },
      { href: "/admin/achievements", label: "الإنجازات", icon: Trophy, color: "#F472B6" },
    ],
  },
  {
    label: "الأدوات",
    items: [
      { href: "/admin/ai", label: "المساعد الذكي", icon: Bot, color: "#A78BFA" },
      { href: "/admin/notifications", label: "الإعلانات", icon: Megaphone, color: "#FB923C" },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.items);

function isActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return (item.match ?? [item.href]).some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function Nav({ pathname, counts, onNavigate, layoutId }) {
  return (
    <nav className="space-y-6">
      {GROUPS.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <div className="mb-2 flex items-center gap-2 px-3 text-[11px] font-semibold tracking-wide text-muted">
              {group.label}
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line" />
            </div>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              const count = item.badge ? counts[item.badge] : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-2 py-1.5 text-[13.5px] font-medium transition-colors",
                    active ? "text-white" : "text-muted hover:text-fg"
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId={layoutId}
                      className="absolute inset-0 rounded-2xl bg-[linear-gradient(120deg,#8B6CFF,#5B3DF5)] shadow-[0_10px_28px_-12px_#7C5CFF]"
                      transition={{ type: "spring", damping: 30, stiffness: 380 }}
                    />
                  ) : (
                    <span className="absolute inset-0 rounded-2xl bg-surface-2 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                  <span
                    className={cn(
                      "relative grid size-8 shrink-0 place-items-center rounded-xl transition-all duration-200",
                      active ? "bg-white/20 text-white" : "group-hover:scale-105"
                    )}
                    style={active ? undefined : { color: item.color, background: `color-mix(in oklab, ${item.color} 14%, transparent)` }}
                  >
                    <item.icon className="size-[17px]" />
                  </span>
                  <span className="relative">{item.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "relative ms-auto grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold",
                        active ? "bg-white text-primary" : "bg-coral text-white"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarContent({ pathname, counts, user, onNavigate, onClose, layoutId }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)]" />
      <div className="relative flex items-center justify-between px-2">
        <Link href="/admin" onClick={onNavigate}>
          <Logo size={36} />
        </Link>
        {onClose ? (
          <button onClick={onClose} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-2" aria-label="إغلاق">
            <X className="size-5" />
          </button>
        ) : (
          <span className="rounded-full border border-primary/30 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">لوحة المعلّم</span>
        )}
      </div>

      <div className="scrollbar-thin relative -mx-1 mt-7 flex-1 overflow-y-auto px-1 pb-2">
        <Nav pathname={pathname} counts={counts} onNavigate={onNavigate} layoutId={layoutId} />

        <Link href="/admin/curriculum" onClick={onNavigate} className="group relative mt-6 block overflow-hidden rounded-2xl bg-[#15102e] p-4 text-white">
          <div className="absolute -end-6 -top-10 size-28 rounded-full bg-primary/50 blur-2xl transition-transform duration-500 group-hover:scale-125" />
          <div className="absolute -bottom-12 start-0 size-24 rounded-full bg-amber/30 blur-2xl" />
          <div className="relative">
            <span className="grid size-8 place-items-center rounded-lg bg-white/15">
              <Sparkles className="size-4 text-amber" />
            </span>
            <div className="mt-3 text-sm font-bold">استوديو المحتوى الذكي</div>
            <p className="mt-1 text-[11px] leading-5 text-white/65">اكتب موضوعًا ودع Gemini يبني الدرس والاختبار والمهام وخطة الدورة.</p>
          </div>
        </Link>
      </div>

      <div className="relative mt-3 rounded-2xl bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_45%,transparent),color-mix(in_oklab,var(--amber)_40%,transparent))] p-px">
        <div className="flex items-center gap-2.5 rounded-[15px] bg-surface p-3">
          <div className="relative">
            <Avatar name={user.name} color={user.avatarColor} avatar={user.avatar} size={36} />
            <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-surface bg-mint" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="text-[11px] text-muted">مدير المنصة</div>
          </div>
          <Link href="/" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg" title="عرض الموقع" aria-label="عرض الموقع">
            <ExternalLink className="size-4" />
          </Link>
        </div>
      </div>
    </>
  );
}

export function AdminShell({ user, counts, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = ALL.find((i) => isActive(pathname, i));

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col overflow-hidden border-e border-line bg-surface px-3 py-5 lg:flex">
        <SidebarContent pathname={pathname} counts={counts} user={user} layoutId="admin-nav" />
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 start-0 z-50 flex w-72 flex-col overflow-hidden bg-surface px-3 py-5 shadow-pop lg:hidden"
            >
              <SidebarContent pathname={pathname} counts={counts} user={user} onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} layoutId="admin-nav-mobile" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl lg:ms-64">
        <div className="flex h-15 items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-2 lg:hidden" aria-label="القائمة">
            <Menu className="size-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden text-muted sm:inline">لوحة المعلّم</span>
            {current && (
              <>
                <span className="hidden text-line sm:inline">/</span>
                <span className="flex items-center gap-1.5 truncate font-medium">
                  <current.icon className="size-4" style={{ color: current.color }} /> {current.label}
                </span>
              </>
            )}
          </div>
          <div className="ms-auto flex items-center gap-1.5">
            {counts.pending > 0 && (
              <Link href="/admin/submissions" className="hidden items-center gap-1.5 rounded-full bg-coral-soft px-3 py-1.5 text-xs font-medium text-coral sm:flex">
                <ClipboardCheck className="size-3.5" /> {counts.pending} للمراجعة
              </Link>
            )}
            <NotificationBell initialUnread={counts.unread} allHref="/admin/inbox" />
            <ThemeToggle />
            <UserMenu user={user} subtitle="معلّم · مدير المنصة" />
          </div>
        </div>
      </header>

      <main className="lg:ms-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
