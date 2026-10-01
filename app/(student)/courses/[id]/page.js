import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Clock, Lock, Timer, Zap } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { getTasks, getTree } from "@/lib/student-data";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/Motion";
import { LessonStateIcon, lessonStateLabel } from "@/components/student/LessonStateIcon";
import { TaskRow } from "@/components/student/TaskRow";
import { COURSE_DIFFICULTIES, DIFFICULTY_TONES } from "@/lib/constants";
import { cn, formatNumber } from "@/lib/utils";

export default async function CoursePage({ params }) {
  const { id } = await params;
  const user = await requireStudent();
  const [tree, tasks] = await Promise.all([getTree(user.id), getTasks(user.id)]);

  let course = null;
  let level = null;
  for (const l of tree.levels) {
    const c = l.courses.find((c) => c.id === id);
    if (c) {
      course = c;
      level = l;
      break;
    }
  }
  if (!course) notFound();

  if (!course.visible) {
    return (
      <EmptyState
        icon={Lock}
        title="هذه الدورة مقفلة حاليًا"
        description="سيفتحها معلّمك عندما يحين وقتها. تابع الإشعارات!"
        action={<Button href="/roadmap" variant="secondary">العودة للمسار</Button>}
      />
    );
  }

  const courseTasks = tasks.filter((t) => t.courseId === course.id || course.modules.some((m) => m.lessons.some((l) => l.id === t.lessonId)));
  const totalXp = course.modules.reduce((s, m) => s + m.lessons.reduce((a, l) => a + l.xpReward, 0), 0);
  const totalMin = course.modules.reduce((s, m) => s + m.lessons.reduce((a, l) => a + l.durationMin, 0), 0);

  return (
    <div className="space-y-6">
      <Link href="/roadmap" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowRight className="size-4" /> المسار
      </Link>

      <FadeIn>
        <section className="relative overflow-hidden rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-8">
          <div className="absolute -top-20 -end-20 size-64 rounded-full opacity-20 blur-3xl" style={{ background: course.color }} />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="grid size-20 shrink-0 place-items-center rounded-3xl text-white shadow-pop" style={{ background: course.color }}>
              <Icon name={course.icon} className="size-10" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium" style={{ color: level.color }}>{level.title}</div>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{course.title}</h1>
              {course.description && <p className="mt-2 max-w-2xl text-muted">{course.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone={DIFFICULTY_TONES[course.difficulty]}>{COURSE_DIFFICULTIES[course.difficulty]}</Badge>
                <Badge icon={BookOpen}>{formatNumber(course.total)} درس</Badge>
                <Badge icon={Timer}>{formatNumber(totalMin)} دقيقة</Badge>
                <Badge tone="primary" icon={Zap}>{formatNumber(totalXp)} XP</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ProgressRing value={course.percent} size={88} stroke={8} color={course.color} />
              {course.nextLesson && (
                <Button href={`/lessons/${course.nextLesson.id}`} size="lg" className="hidden md:inline-flex">
                  {course.completed ? "أكمل" : "ابدأ"}
                </Button>
              )}
            </div>
          </div>
          {course.nextLesson && (
            <Button href={`/lessons/${course.nextLesson.id}`} size="lg" className="relative mt-5 w-full md:hidden">
              {course.completed ? "أكمل التعلّم" : "ابدأ الدورة"}
            </Button>
          )}
        </section>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {course.modules.map((mod, mi) => (
            <FadeIn key={mod.id} delay={0.05 * mi}>
              <section className="rounded-3xl border border-line bg-surface p-5 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold">
                    <span className="text-muted">الوحدة {formatNumber(mi + 1)} · </span>
                    {mod.title}
                  </h2>
                  <span className="text-xs text-muted">
                    {formatNumber(mod.lessons.filter((l) => l.completed).length)}/{formatNumber(mod.lessons.length)}
                  </span>
                </div>
                <ol className="relative space-y-1">
                  {mod.lessons.map((lesson, li) => {
                    const canOpen = lesson.access.open;
                    const row = (
                      <>
                        <LessonStateIcon lesson={lesson} color={course.color} />
                        <div className="min-w-0 flex-1">
                          <div className={cn("truncate font-medium", !canOpen && "text-muted")}>{lesson.title}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                            <span>{lessonStateLabel(lesson)}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5"><Clock className="size-3" /> {formatNumber(lesson.durationMin)} د</span>
                            <span className="flex items-center gap-0.5 text-primary"><Zap className="size-3 fill-current" /> {formatNumber(lesson.xpReward)}</span>
                          </div>
                        </div>
                      </>
                    );
                    return (
                      <li key={lesson.id} className="relative">
                        {li < mod.lessons.length - 1 && (
                          <span className="absolute start-[21px] top-12 h-[calc(100%-36px)] w-0.5 bg-line" aria-hidden="true" />
                        )}
                        {canOpen ? (
                          <Link href={`/lessons/${lesson.id}`} className="relative flex items-center gap-4 rounded-2xl p-2 pb-4 transition-colors hover:bg-surface-2">
                            {row}
                          </Link>
                        ) : (
                          <div className="relative flex items-center gap-4 p-2 pb-4">{row}</div>
                        )}
                      </li>
                    );
                  })}
                  {mod.lessons.length === 0 && <li className="text-sm text-muted">لا دروس بعد.</li>}
                </ol>
              </section>
            </FadeIn>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">مهام الدورة</h2>
          {courseTasks.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line p-5 text-sm text-muted">لا توجد مهام لهذه الدورة حاليًا.</p>
          ) : (
            courseTasks.map((t) => <TaskRow key={t.id} task={t} compact />)
          )}
        </div>
      </div>
    </div>
  );
}
