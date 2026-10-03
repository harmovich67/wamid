"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  Bot,
  ClipboardCheck,
  ExternalLink,
  Layers,
  LayoutDashboard,
  ListChecks,
  Map,
  Megaphone,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";

// Desktop sidebar groups
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

// Mobile primary bottom bar items
const MOBILE_MAIN_TABS = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, exact: true, color: "#7C5CFF" },
  { href: "/admin/students", label: "الطلاب", icon: Users, color: "#38BDF8" },
  { href: "/admin/submissions", label: "التسليمات", icon: ClipboardCheck, badge: "pending", color: "#FF6B81" },
  { href: "/admin/curriculum", label: "المسار", icon: Map, match: ["/admin/curriculum", "/admin/courses", "/admin/lessons"], color: "#22C5A0" },
];

// Additional tools in mobile "More" sheet
const MORE_ROUTES = [
  { href: "/admin/tasks", label: "المهام والتحديات", desc: "واجبات وتحديات برمجية للمستويات", icon: ListChecks, color: "#FFB547" },
  { href: "/admin/achievements", label: "الإنجازات والأوسمة", desc: "أوسمة ونقاط تميّز للطلاب", icon: Trophy, color: "#F472B6" },
  { href: "/admin/ai", label: "المساعد الذكي (AI)", desc: "إعدادات وتخصيص نموذج Gemini", icon: Bot, color: "#A78BFA" },
  { href: "/admin/notifications", label: "الإعلانات والبرودكاست", desc: "إرسال إعلانات لجميع الطلاب", icon: Megaphone, color: "#FB923C" },
  { href: "/admin/inbox", label: "صندوق الإشعارات", desc: "جميع التنبيهات والإشعارات", icon: Bell, color: "#38BDF8", badge: "unread" },
];

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

function DesktopSidebarContent({ pathname, counts, user, layoutId }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)]" />
      <div className="relative flex items-center justify-between px-2">
        <Link href="/admin">
          <Logo size={36} />
        </Link>
        <span className="rounded-full border border-primary/30 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">لوحة المعلّم</span>
      </div>

      <div className="scrollbar-thin relative -mx-1 mt-7 flex-1 overflow-y-auto px-1 pb-2">
        <Nav pathname={pathname} counts={counts} layoutId={layoutId} />

        <Link href="/admin/curriculum" className="group relative mt-6 block overflow-hidden rounded-2xl bg-[#15102e] p-4 text-white">
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
  const [moreOpen, setMoreOpen] = useState(false);
  const current = ALL.find((i) => isActive(pathname, i));
  const isMoreActive = MORE_ROUTES.some((item) => isActive(pathname, item));

  // Lock body scroll when mobile sheet is open to prevent double scroll
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col overflow-hidden border-e border-line bg-surface px-3 py-5 lg:flex">
        <DesktopSidebarContent pathname={pathname} counts={counts} user={user} layoutId="admin-nav" />
      </aside>

      {/* Mobile "More" Bottom Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="absolute inset-0 bg-[#0c0a18]/60 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="قائمة الخيارات الإضافية"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[32px] border-t border-line bg-surface shadow-2xl"
            >
              {/* Drag indicator */}
              <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-line" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <Logo size={32} subtitle={false} />
                  <span className="rounded-full border border-primary/30 bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                    لوحة المعلّم
                  </span>
                </div>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg"
                  aria-label="إغلاق"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Sheet Body with smooth mobile scroll */}
              <div className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] space-y-4">
                {/* User card inside sheet */}
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/60 p-3.5">
                  <div className="relative">
                    <Avatar name={user.name} color={user.avatarColor} avatar={user.avatar} size={42} />
                    <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-surface bg-mint" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{user.name}</div>
                    <div className="text-xs text-muted">مدير المنصة · @{user.username}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ThemeToggle className="size-9 rounded-xl" />
                    <Link
                      href="/"
                      onClick={() => setMoreOpen(false)}
                      className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-muted hover:bg-surface-2 hover:text-fg"
                      title="عرض الموقع العام"
                      aria-label="عرض الموقع العام"
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                  </div>
                </div>

                {/* Additional sections list */}
                <div>
                  <div className="mb-2.5 px-1 text-xs font-bold text-muted">الأدوات والمحتوى الإضافي</div>
                  <div className="space-y-2">
                    {MORE_ROUTES.map((item) => {
                      const active = isActive(pathname, item);
                      const count = item.badge ? counts[item.badge] : 0;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-3.5 transition active:scale-[0.98]",
                            active
                              ? "border-primary/50 bg-primary-soft text-primary font-semibold shadow-xs"
                              : "border-line bg-surface hover:bg-surface-2/70 text-fg"
                          )}
                        >
                          <span
                            className="grid size-10 shrink-0 place-items-center rounded-xl"
                            style={{
                              color: item.color,
                              background: `color-mix(in oklab, ${item.color} 15%, transparent)`,
                            }}
                          >
                            <item.icon className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold">{item.label}</div>
                            <div className="truncate text-xs text-muted">{item.desc}</div>
                          </div>
                          {count > 0 && (
                            <span className="grid min-w-5 place-items-center rounded-full bg-coral px-1.5 text-xs font-bold text-white">
                              {count}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* AI Creator Banner */}
                <Link
                  href="/admin/curriculum"
                  onClick={() => setMoreOpen(false)}
                  className="group relative block overflow-hidden rounded-2xl bg-[#15102e] p-4 text-white shadow-card"
                >
                  <div className="absolute -end-6 -top-10 size-28 rounded-full bg-primary/50 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                  <div className="absolute -bottom-12 start-0 size-24 rounded-full bg-amber/30 blur-2xl" />
                  <div className="relative flex items-center gap-3.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
                      <Sparkles className="size-5 text-amber" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold">استوديو المحتوى الذكي</div>
                      <p className="mt-0.5 text-xs text-white/70">
                        اكتب موضوعًا ودع Gemini يبني الدرس والاختبار والمهام تلقائيًا.
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-xl lg:ms-64">
        <div className="flex h-15 items-center justify-between gap-3 px-4 sm:px-6">
          {/* Mobile view brand + current active page */}
          <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
            <Link href="/admin" className="shrink-0">
              <Logo size={32} subtitle={false} />
            </Link>
            {current && (
              <span className="flex min-w-0 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold shadow-xs">
                <current.icon className="size-3.5 shrink-0" style={{ color: current.color }} />
                <span className="truncate max-w-[130px]">{current.label}</span>
              </span>
            )}
          </div>

          {/* Desktop breadcrumb */}
          <div className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
            <span className="text-muted">لوحة المعلّم</span>
            {current && (
              <>
                <span className="text-line">/</span>
                <span className="flex items-center gap-1.5 truncate font-medium">
                  <current.icon className="size-4" style={{ color: current.color }} /> {current.label}
                </span>
              </>
            )}
          </div>

          {/* Actions & User menu */}
          <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
            {counts.pending > 0 && (
              <Link
                href="/admin/submissions"
                className="flex items-center gap-1 rounded-full bg-coral-soft px-2.5 py-1 text-xs font-semibold text-coral transition hover:bg-coral hover:text-white"
              >
                <ClipboardCheck className="size-3.5" />
                <span className="hidden sm:inline">{counts.pending} للمراجعة</span>
                <span className="sm:hidden font-bold">{counts.pending}</span>
              </Link>
            )}
            <NotificationBell initialUnread={counts.unread} allHref="/admin/inbox" />
            <ThemeToggle className="hidden sm:grid" />
            <UserMenu user={user} subtitle="معلّم · مدير المنصة" />
          </div>
        </div>
      </header>

      {/* Main page content with generous mobile bottom padding for uninhibited scroll */}
      <main className="min-w-0 flex-1 pb-28 lg:ms-64 lg:pb-12">
        <div className="mx-auto max-w-7xl min-w-0 px-4 py-5 sm:px-6 sm:py-8">{children}</div>
      </main>

      {/* Mobile App Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1">
          {MOBILE_MAIN_TABS.map((item) => {
            const active = isActive(pathname, item);
            const count = item.badge ? counts[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition-transform active:scale-95"
              >
                {active && (
                  <motion.span
                    layoutId="admin-mobile-tab"
                    className="absolute top-0 h-1 w-10 rounded-b-full bg-primary"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  />
                )}
                <span
                  className={cn(
                    "relative grid size-9 place-items-center rounded-2xl transition-colors",
                    active ? "bg-primary-soft text-primary font-bold" : "text-muted hover:text-fg"
                  )}
                >
                  <item.icon className="size-5" style={active ? { color: item.color } : undefined} />
                  {count > 0 && (
                    <span className="absolute -end-1 -top-1 grid min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold leading-4 text-white shadow-sm">
                      {count}
                    </span>
                  )}
                </span>
                <span className={cn("text-[11px] leading-tight font-medium", active ? "font-bold text-primary" : "text-muted")}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* 5th Tab: "المزيد" opens bottom sheet */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="relative flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition-transform active:scale-95"
            aria-label="المزيد من الأدوات"
          >
            {isMoreActive && (
              <motion.span
                layoutId="admin-mobile-tab"
                className="absolute top-0 h-1 w-10 rounded-b-full bg-primary"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
              />
            )}
            <span
              className={cn(
                "relative grid size-9 place-items-center rounded-2xl transition-colors",
                isMoreActive || moreOpen ? "bg-primary-soft text-primary font-bold" : "text-muted hover:text-fg"
              )}
            >
              <Layers className="size-5" />
              {counts.unread > 0 && (
                <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-coral ring-2 ring-surface" />
              )}
            </span>
            <span className={cn("text-[11px] leading-tight font-medium", isMoreActive || moreOpen ? "font-bold text-primary" : "text-muted")}>
              المزيد
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

