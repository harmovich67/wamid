"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Bot, Flame, House, ListChecks, Route, Trophy, Zap } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { cn, formatNumber } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "الرئيسية", icon: House, color: "#7C5CFF" },
  { href: "/roadmap", label: "المسار", icon: Route, match: ["/roadmap", "/courses", "/lessons"], color: "#22C5A0" },
  { href: "/tasks", label: "المهام", icon: ListChecks, badgeKey: "tasks", color: "#FFB547" },
  { href: "/assistant", label: "ومضة AI", icon: Bot, aiOnly: true, color: "#A78BFA" },
  { href: "/achievements", label: "الإنجازات", icon: Trophy, color: "#F472B6" },
];

function isActive(pathname, item) {
  return (item.match ?? [item.href]).some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function StudentShell({ user, stats, children }) {
  const pathname = usePathname();
  const nav = NAV.filter((n) => !n.aiOnly || stats.aiAvailable);

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col overflow-hidden border-e border-line bg-surface/80 px-4 py-5 backdrop-blur-xl lg:flex">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)]" />
        <Link href="/dashboard" className="relative px-2">
          <Logo size={38} />
        </Link>
        <nav className="relative mt-8 flex flex-col gap-1.5">
          {nav.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl px-2 py-2 text-[15px] font-medium transition-colors",
                  active ? "text-white" : "text-muted hover:text-fg"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="student-nav"
                    className="absolute inset-0 rounded-2xl bg-[linear-gradient(120deg,#8B6CFF,#5B3DF5)] shadow-[0_10px_28px_-12px_#7C5CFF]"
                    transition={{ type: "spring", damping: 30, stiffness: 380 }}
                  />
                ) : (
                  <span className="absolute inset-0 rounded-2xl bg-surface-2 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
                <span
                  className={cn("relative grid size-9 place-items-center rounded-xl transition-transform", active ? "bg-white/20" : "group-hover:scale-105")}
                  style={active ? undefined : { color: item.color, background: `color-mix(in oklab, ${item.color} 14%, transparent)` }}
                >
                  <item.icon className="size-5" />
                </span>
                <span className="relative">{item.label}</span>
                {item.badgeKey && stats.pendingTasks > 0 && (
                  <span className={cn("relative ms-auto rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-white text-primary" : "bg-coral text-white")}>
                    {stats.pendingTasks}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="relative mt-auto rounded-3xl bg-gradient-to-br from-primary to-[#4F32E6] p-4 text-white">
          <div className="flex items-center justify-between text-sm">
            <span className="opacity-80">رتبتك</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{stats.rank.current.en}</span>
          </div>
          <div className="mt-1 text-2xl font-bold">{stats.rank.current.title}</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-amber" style={{ width: `${stats.rank.progress}%` }} />
          </div>
          <div className="mt-2 text-xs opacity-80">
            {stats.rank.next ? `${formatNumber(stats.rank.toNext)} XP حتى ${stats.rank.next.title}` : "وصلت للقمة! 🌌"}
          </div>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl lg:ms-64">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Link href="/dashboard" className="lg:hidden">
            <Logo size={34} subtitle={false} />
          </Link>
          <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 rounded-full bg-amber-soft px-2.5 py-1.5 text-sm font-semibold text-[#b86e00] dark:text-amber" title="أيام متتالية">
              <Flame className={cn("size-4", stats.streak > 0 && "fill-current")} />
              {formatNumber(stats.streak)}
            </div>
            <div className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1.5 text-sm font-semibold text-primary" title="نقاط الخبرة">
              <Zap className="size-4 fill-current" />
              {formatNumber(stats.xp)}
            </div>
            <NotificationBell initialUnread={stats.unread} allHref="/notifications" />
            <ThemeToggle className="hidden sm:grid" />
            <UserMenu user={user} subtitle={`@${user.username}`} profileHref="/profile" />
          </div>
        </div>
      </header>

      <main className="pb-28 lg:ms-64 lg:pb-12">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
          {nav.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link key={item.href} href={item.href} className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium">
                {active && <motion.span layoutId="student-tab" className="absolute top-0 h-1 w-10 rounded-b-full bg-primary" />}
                <span className={cn("relative grid size-9 place-items-center rounded-2xl transition-colors", active ? "bg-primary-soft text-primary" : "text-muted")}>
                  <item.icon className="size-5" />
                  {item.badgeKey && stats.pendingTasks > 0 && (
                    <span className="absolute -end-1 -top-1 grid min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] leading-4 text-white">{stats.pendingTasks}</span>
                  )}
                </span>
                <span className={active ? "text-primary" : "text-muted"}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
