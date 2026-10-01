import Link from "next/link";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { getTree } from "@/lib/student-data";
import { PageHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { FadeIn } from "@/components/ui/Motion";
import { COURSE_DIFFICULTIES, DIFFICULTY_TONES } from "@/lib/constants";
import { cn, formatDate, formatNumber, percent } from "@/lib/utils";

export const metadata = { title: "مسار التعلّم" };

export default async function RoadmapPage() {
  const user = await requireStudent();
  const { levels } = await getTree(user.id);

  return (
    <div>
      <PageHeader
        eyebrow="خريطة الرحلة"
        title="مسار التعلّم"
        subtitle="من أساسيات التفكير البرمجي حتى بناء مشاريع احترافية. كل مستوى يفتح لك عالمًا جديدًا."
      />

      <ol className="relative space-y-8">
        <div className="absolute inset-y-6 start-6 w-1 rounded-full bg-gradient-to-b from-primary via-amber to-mint opacity-30 sm:start-7" aria-hidden="true" />
        {levels.map((level, i) => {
          const pct = percent(level.completed, level.total);
          return (
            <FadeIn as="li" key={level.id} delay={i * 0.06} className="relative ps-16 sm:ps-20">
              <div
                className={cn(
                  "absolute start-0 top-0 grid size-13 place-items-center rounded-2xl text-lg font-bold text-white shadow-card sm:size-15",
                  !level.unlocked && "grayscale opacity-60"
                )}
                style={{ background: `linear-gradient(135deg, ${level.color}, color-mix(in oklab, ${level.color} 60%, #1a1233))` }}
              >
                <Icon name={level.icon} className="size-6 sm:size-7" />
              </div>

              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-medium" style={{ color: level.color }}>
                    المستوى {formatNumber(i + 1)}
                  </div>
                  <h2 className="text-xl font-bold sm:text-2xl">{level.title}</h2>
                  {level.subtitle && <p className="mt-0.5 text-sm text-muted">{level.subtitle}</p>}
                </div>
                {level.unlocked ? (
                  <div className="flex w-full items-center gap-3 sm:w-56">
                    <ProgressBar value={pct} color={level.color} size="sm" />
                    <span className="text-xs font-semibold text-muted">{pct}%</span>
                  </div>
                ) : (
                  <Badge icon={Lock}>لم يُفتح بعد</Badge>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {level.courses.map((course) => {
                  const clickable = course.visible;
                  const content = (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="grid size-12 place-items-center rounded-2xl text-white"
                          style={{ background: clickable ? course.color : "var(--line)" }}
                        >
                          <Icon name={course.icon} className="size-6" />
                        </div>
                        {course.percent === 100 ? (
                          <CheckCircle2 className="size-6 text-mint" />
                        ) : course.state === "scheduled" ? (
                          <Badge tone="sky" icon={Clock}>{formatDate(course.scheduledAt)}</Badge>
                        ) : !clickable ? (
                          <Lock className="size-5 text-muted" />
                        ) : null}
                      </div>
                      <h3 className="mt-3 font-semibold">{course.title}</h3>
                      {course.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{course.description}</p>}
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <Badge tone={DIFFICULTY_TONES[course.difficulty]}>{COURSE_DIFFICULTIES[course.difficulty]}</Badge>
                        <span className="text-xs text-muted">
                          {formatNumber(course.completed)}/{formatNumber(course.total)} درس
                        </span>
                      </div>
                      {clickable && <ProgressBar value={course.percent} color={course.color} size="sm" className="mt-3" />}
                    </>
                  );
                  return clickable ? (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="rounded-3xl border border-line bg-surface p-5 shadow-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-pop"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={course.id} className="rounded-3xl border border-dashed border-line bg-surface/50 p-5 opacity-70" aria-disabled="true">
                      {content}
                    </div>
                  );
                })}
                {level.courses.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-line p-5 text-sm text-muted">دورات هذا المستوى قيد الإعداد…</div>
                )}
              </div>
            </FadeIn>
          );
        })}
      </ol>
    </div>
  );
}
