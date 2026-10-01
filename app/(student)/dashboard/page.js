import Link from "next/link";
import { ArrowLeft, BookOpenCheck, CalendarClock, Flame, ListChecks, Medal, Play, Sparkles, Swords, Trophy, Zap } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getShellStats, getTasks, getTree, isPending } from "@/lib/student-data";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { FadeIn } from "@/components/ui/Motion";
import { TaskRow } from "@/components/student/TaskRow";
import { StarterQuest } from "@/components/student/StarterQuest";
import { LogoMark } from "@/components/brand/Logo";
import { cn, dayKey, daysAgo, formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "الرئيسية" };

const weekday = new Intl.DateTimeFormat("ar", { weekday: "narrow" });

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "صباح الخير";
  if (h < 18) return "مساء النور";
  return "مساء الخير";
}

export default async function DashboardPage() {
  const user = await requireStudent();
  const [tree, tasks, stats, lessonsDone, approved, badges, recent, submissionsTotal, aiConversationsCount] = await Promise.all([
    getTree(user.id),
    getTasks(user.id),
    getShellStats(user),
    prisma.lessonProgress.count({ where: { userId: user.id, completedAt: { not: null } } }),
    prisma.submission.count({ where: { studentId: user.id, status: "APPROVED" } }),
    prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: user.id, completedAt: { gte: daysAgo(7) } },
      select: { completedAt: true },
    }),
    prisma.submission.count({ where: { studentId: user.id } }),
    prisma.aIConversation.count({ where: { userId: user.id } }),
  ]);
  const activeDays = new Set(recent.map((p) => dayKey(p.completedAt)));
  if (user.student?.lastActiveDate) activeDays.add(user.student.lastActiveDate);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(6 - i);
    return { key: dayKey(d), label: weekday.format(d), active: activeDays.has(dayKey(d)), today: i === 6 };
  });

  const courses = tree.levels.flatMap((l) => l.courses.filter((c) => c.visible).map((c) => ({ ...c, level: l })));
  const next = courses.find((c) => c.nextLesson);
  const active = courses.filter((c) => c.percent < 100).slice(0, 3);
  const currentLevel = tree.levels.find((l) => l.unlocked && l.completed < l.total) ?? tree.levels.findLast((l) => l.unlocked);
  const pending = tasks.filter(isPending).slice(0, 4);
  const challenges = tasks
    .filter((t) => (t.type === "CHALLENGE" || t.type === "PROJECT") && !t.submission)
    .slice(0, 3);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-[2rem] bg-[#15102e] p-6 text-white sm:p-8">
          <div className="bg-grid absolute inset-0 opacity-[0.08]" />
          <div className="absolute -top-24 -start-16 size-72 rounded-full bg-primary/50 blur-[90px]" />
          <div className="absolute -bottom-24 end-10 size-60 rounded-full bg-amber/30 blur-[90px]" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="text-white/70">{greeting()}،</div>
              <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{firstName} 👋</h1>
              <p className="mt-2 max-w-lg text-white/70">
                {stats.streak > 0
                  ? `سلسلتك ${formatNumber(stats.streak)} ${stats.streak === 1 ? "يوم" : "أيام"} متتالية 🔥 لا تكسرها اليوم!`
                  : "كل يوم خطوة صغيرة تصنع مبرمجًا كبيرًا. ابدأ سلسلتك اليوم!"}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {next ? (
                  <Button href={`/lessons/${next.nextLesson.id}`} variant="amber" size="lg">
                    <Play className="size-5 fill-current" />
                    أكمل: {next.nextLesson.title}
                  </Button>
                ) : (
                  <Button href="/roadmap" variant="amber" size="lg">
                    <Sparkles className="size-5" /> استكشف المسار
                  </Button>
                )}
                <Button href="/tasks" size="lg" className="border border-white/15 bg-white/10 text-white shadow-none hover:bg-white/15">
                  <ListChecks className="size-5" /> مهامي
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <ProgressRing value={stats.rank.progress} size={96} stroke={9} color="var(--amber)">
                <LogoMark size={40} animated />
              </ProgressRing>
              <div>
                <div className="text-sm text-white/60">رتبتك الحالية</div>
                <div className="text-2xl font-bold">{stats.rank.current.title}</div>
                <div className="mt-1 flex items-center gap-1 text-sm text-amber">
                  <Zap className="size-4 fill-current" /> {formatNumber(stats.xp)} XP
                </div>
                <div className="mt-1 text-xs text-white/60">
                  {stats.rank.next ? `${formatNumber(stats.rank.toNext)} XP للوصول إلى ${stats.rank.next.title}` : "أعلى رتبة 🌌"}
                </div>
                <div className="mt-3 flex gap-1.5" aria-label="نشاطك خلال آخر 7 أيام">
                  {week.map((d) => (
                    <div key={d.key} className="flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full text-[11px]",
                          d.active ? "bg-amber text-[#3a2400]" : "bg-white/10 text-white/40",
                          d.today && "ring-2 ring-white/60"
                        )}
                        title={d.active ? "تعلّمت في هذا اليوم" : "لا نشاط"}
                      >
                        {d.active ? "🔥" : ""}
                      </span>
                      <span className="text-[10px] text-white/50">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={0.05} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={BookOpenCheck} label="دروس مكتملة" value={formatNumber(lessonsDone)} tone="primary" />
        <StatCard icon={ListChecks} label="مهام مقبولة" value={formatNumber(approved)} tone="mint" />
        <StatCard icon={Medal} label="أوسمة" value={formatNumber(badges.length)} tone="amber" />
        <StatCard icon={Flame} label="أفضل سلسلة" value={formatNumber(user.student?.bestStreak ?? 0)} hint="يوم متتالي" tone="coral" />
      </FadeIn>

      {/* Starter Quest */}
      <FadeIn delay={0.08}>
        <StarterQuest
          lessonsDone={lessonsDone}
          submissionsTotal={submissionsTotal}
          aiConversationsCount={aiConversationsCount}
          nextLesson={next?.nextLesson}
        />
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader
                title="أكمل التعلّم"
                subtitle={currentLevel ? `أنت الآن في: ${currentLevel.title}` : "ابدأ رحلتك"}
                action={
                  <Link href="/roadmap" className="flex items-center gap-1 text-sm font-medium text-primary">
                    المسار كاملًا <ArrowLeft className="size-4" />
                  </Link>
                }
              />
              <div className="grid gap-3 p-5">
                {active.length === 0 ? (
                  <EmptyState
                    icon={Sparkles}
                    title="لا توجد دورات مفتوحة بعد"
                    description="سيفتح لك معلّمك الدروس قريبًا. ستصلك إشعارات فور فتحها!"
                  />
                ) : (
                  active.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="group flex items-center gap-4 rounded-2xl border border-line p-4 transition-all hover:border-primary/40 hover:bg-surface-2/50"
                    >
                      <div className="grid size-14 shrink-0 place-items-center rounded-2xl text-white" style={{ background: course.color }}>
                        <Icon name={course.icon} className="size-7" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold">{course.title}</span>
                          <Badge tone="gray" className="hidden sm:inline-flex">{course.level.title}</Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <ProgressBar value={course.percent} color={course.color} size="sm" />
                          <span className="shrink-0 text-xs font-semibold text-muted">{course.percent}%</span>
                        </div>
                        {course.nextLesson && (
                          <div className="mt-1.5 truncate text-xs text-muted">التالي: {course.nextLesson.title}</div>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </FadeIn>

          <FadeIn delay={0.15}>
            <Card>
              <CardHeader
                title="مهام بانتظارك"
                subtitle={pending.length ? `${formatNumber(pending.length)} مهمة تحتاج تسليمك` : "أنجزت كل شيء!"}
                action={
                  <Link href="/tasks" className="flex items-center gap-1 text-sm font-medium text-primary">
                    الكل <ArrowLeft className="size-4" />
                  </Link>
                }
              />
              <div className="grid gap-2.5 p-5">
                {pending.length === 0 ? (
                  <EmptyState icon={ListChecks} title="لا مهام معلّقة 🎉" description="استمتع بوقتك أو راجع دروسك السابقة." />
                ) : (
                  pending.map((t) => <TaskRow key={t.id} task={t} />)
                )}
              </div>
            </Card>
          </FadeIn>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <FadeIn delay={0.12}>
            <Card className="overflow-hidden">
              <CardHeader title="تحديات قادمة" icon={<div className="grid size-10 place-items-center rounded-xl bg-amber-soft text-amber"><Swords className="size-5" /></div>} />
              <div className="space-y-2.5 p-5">
                {challenges.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted">لا تحديات حاليًا — ترقّب!</p>
                ) : (
                  challenges.map((t) => (
                    <Link key={t.id} href={`/tasks/${t.id}`} className="block rounded-2xl bg-gradient-to-l from-amber-soft to-transparent p-3.5 transition hover:from-amber/25">
                      <div className="font-semibold">{t.title}</div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="size-3.5" />
                          {t.access.state === "scheduled" ? `يفتح ${formatDate(t.access.opensAt)}` : t.deadline ? formatDate(t.deadline) : "بدون موعد"}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-primary">
                          <Zap className="size-3.5 fill-current" /> {formatNumber(t.points)}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </FadeIn>

          <FadeIn delay={0.18}>
            <Card>
              <CardHeader
                title="أوسمتك"
                icon={<div className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary"><Trophy className="size-5" /></div>}
                action={
                  <Link href="/achievements" className="text-sm font-medium text-primary">
                    الكل
                  </Link>
                }
              />
              <div className="p-5">
                {badges.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted">أكمل أول درس لتحصل على أول وسام ✨</p>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {badges.slice(0, 8).map(({ achievement: a }) => (
                      <div key={a.id} className="flex flex-col items-center gap-1.5 text-center" title={a.description}>
                        <div className="grid size-12 place-items-center rounded-2xl text-white shadow-card" style={{ background: a.color }}>
                          <Icon name={a.icon} className="size-6" />
                        </div>
                        <span className="line-clamp-1 text-[11px] text-muted">{a.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
