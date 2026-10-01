import { Lock } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { studentStats } from "@/lib/rewards";
import { rankFor } from "@/lib/gamification";
import { RANKS } from "@/lib/constants";
import { PageHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/Progress";
import { Stagger, StaggerItem } from "@/components/ui/Motion";
import { cn, formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "الإنجازات" };

const STAT_KEY = {
  LESSONS_COMPLETED: "lessonsCompleted",
  TASKS_APPROVED: "tasksApproved",
  XP_EARNED: "xp",
  STREAK_DAYS: "streak",
  COURSES_COMPLETED: "coursesCompleted",
  QUIZ_PERFECT: "perfectQuizzes",
};

export default async function AchievementsPage() {
  const user = await requireStudent();
  const [all, owned, stats] = await Promise.all([
    prisma.achievement.findMany({ orderBy: [{ criteria: "asc" }, { threshold: "asc" }] }),
    prisma.userAchievement.findMany({ where: { userId: user.id } }),
    studentStats(user.id),
  ]);
  const earned = new Map(owned.map((o) => [o.achievementId, o.earnedAt]));
  const rank = rankFor(stats.xp);

  return (
    <div className="space-y-8">
      <PageHeader title="الإنجازات" subtitle={`جمعت ${formatNumber(earned.size)} من ${formatNumber(all.length)} وسامًا. استمر!`} />

      <section className="rounded-[2rem] border border-line bg-surface p-5 shadow-card sm:p-6">
        <h2 className="mb-4 font-semibold">سُلّم الرتب</h2>
        <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-2">
          {RANKS.map((r, i) => {
            const reached = stats.xp >= r.min;
            const current = rank.index === i;
            return (
              <div
                key={r.en}
                className={cn(
                  "flex min-w-32 flex-1 flex-col items-center rounded-2xl border-2 p-4 text-center transition",
                  current ? "border-primary bg-primary-soft" : "border-line",
                  !reached && "opacity-50"
                )}
              >
                <div className="grid size-12 place-items-center rounded-full text-lg font-bold text-white" style={{ background: reached ? r.color : "var(--line)" }}>
                  {formatNumber(i + 1)}
                </div>
                <div className="mt-2 font-bold">{r.title}</div>
                <div className="text-xs text-muted">{formatNumber(r.min)} XP</div>
              </div>
            );
          })}
        </div>
      </section>

      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {all.map((a) => {
          const at = earned.get(a.id);
          const value = stats[STAT_KEY[a.criteria]] ?? 0;
          return (
            <StaggerItem key={a.id}>
              <div className={cn("flex h-full flex-col items-center rounded-3xl border border-line bg-surface p-5 text-center shadow-card", !at && "bg-surface/60")}>
                <div
                  className={cn("relative grid size-16 place-items-center rounded-2xl text-white", at ? "shadow-pop" : "grayscale")}
                  style={{ background: at ? `linear-gradient(135deg, ${a.color}, color-mix(in oklab, ${a.color} 60%, #1a1233))` : "var(--line)" }}
                >
                  <Icon name={a.icon} className="size-8" />
                  {!at && (
                    <span className="absolute -bottom-1 -end-1 grid size-6 place-items-center rounded-full bg-surface text-muted shadow">
                      <Lock className="size-3.5" />
                    </span>
                  )}
                </div>
                <div className="mt-3 font-semibold">{a.title}</div>
                <p className="mt-1 flex-1 text-xs text-muted">{a.description}</p>
                {at ? (
                  <div className="mt-3 text-xs font-medium text-mint">حصلت عليه {formatDate(at)}</div>
                ) : a.criteria !== "MANUAL" ? (
                  <div className="mt-3 w-full">
                    <ProgressBar value={(Math.min(value, a.threshold) / a.threshold) * 100} size="sm" color={a.color} />
                    <div className="mt-1 text-[11px] text-muted">
                      {formatNumber(Math.min(value, a.threshold))}/{formatNumber(a.threshold)}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-[11px] text-muted">يمنحه المعلّم</div>
                )}
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
