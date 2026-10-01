import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Hero } from "@/components/landing/Hero";
import { RobotStory } from "@/components/landing/RobotStory";
import { ComputerFlow } from "@/components/landing/ComputerFlow";
import { CodeTyping } from "@/components/landing/CodeTyping";
import { Journey } from "@/components/landing/Journey";
import { AIShowcase } from "@/components/landing/AIShowcase";
import { StatsCta } from "@/components/landing/StatsCta";

export default async function Home() {
  const [user, levels, lessons, tasks] = await Promise.all([
    getCurrentUser(),
    prisma.level.findMany({
      orderBy: { order: "asc" },
      select: { id: true, title: true, subtitle: true, color: true, icon: true, courses: { where: { isPublished: true }, orderBy: { order: "asc" }, select: { title: true } } },
    }),
    prisma.lesson.count({ where: { isPublished: true } }),
    prisma.task.count({ where: { isPublished: true } }),
  ]);
  const appHref = user ? (user.role === "ADMIN" ? "/admin" : "/dashboard") : "/login";
  const courses = levels.reduce((s, l) => s + l.courses.length, 0);

  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo size={36} />
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#story" className="hover:text-fg">ما هي البرمجة؟</a>
            <a href="#journey" className="hover:text-fg">المسار</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button href={appHref} size="sm">{user ? "لوحتي" : "تسجيل الدخول"}</Button>
          </div>
        </div>
      </header>

      <Hero appHref={appHref} loggedIn={Boolean(user)} />
      <RobotStory />
      <ComputerFlow />
      <CodeTyping />
      <Journey levels={levels.map((l) => ({ ...l, courses: l.courses.map((c) => c.title) }))} />
      <AIShowcase />
      <StatsCta
        appHref={appHref}
        loggedIn={Boolean(user)}
        stats={[
          { label: "مستويات في المسار", value: levels.length, color: "#FFB547" },
          { label: "دورة تعليمية", value: courses, color: "#7C5CFF" },
          { label: "درس تفاعلي", value: lessons, color: "#38BDF8" },
          { label: "مهمة وتحدٍّ ومشروع", value: tasks, color: "#22C5A0" },
        ]}
      />

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted sm:flex-row sm:px-6">
          <Logo size={28} subtitle={false} />
          <span>وَمِيض · شرارة المعرفة التي تصنع المبرمجين</span>
        </div>
      </footer>
    </div>
  );
}
