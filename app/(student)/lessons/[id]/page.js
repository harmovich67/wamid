import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bot, Clock, Lock, Zap } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getShellStats, getTasks, getTree } from "@/lib/student-data";
import { BlockRenderer } from "@/components/lesson/BlockRenderer";
import { LessonQuiz } from "@/components/lesson/LessonQuiz";
import { CompleteLesson } from "@/components/lesson/CompleteLesson";
import { LiveLessonSync } from "@/components/student/LiveLessonSync";
import { LessonStateIcon, lessonStateLabel } from "@/components/student/LessonStateIcon";
import { TaskRow } from "@/components/student/TaskRow";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { cn, formatNumber, parseJSON } from "@/lib/utils";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { id }, select: { title: true } });
  return { title: lesson?.title ?? "درس" };
}

export default async function LessonPage({ params }) {
  const { id } = await params;
  const user = await requireStudent();
  const [tree, tasks, stats] = await Promise.all([getTree(user.id), getTasks(user.id), getShellStats(user)]);
  const entry = tree.lessonIndex.get(id);
  if (!entry) notFound();

  const courseNode = tree.levels.flatMap((l) => l.courses).find((c) => c.id === entry.course.id);
  const flat = courseNode.modules.flatMap((m) => m.lessons);
  const index = flat.findIndex((l) => l.id === id);
  const node = flat[index];

  if (!node.access.open) {
    return (
      <EmptyState
        icon={Lock}
        title="هذا الدرس مقفل"
        description={lessonStateLabel(node)}
        action={<Button href={`/courses/${courseNode.id}`} variant="secondary">العودة للدورة</Button>}
      />
    );
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { quiz: { orderBy: { order: "asc" } } },
  });
  const blocks = parseJSON(lesson.blocks, []);
  // Never send correct answers to the browser before grading.
  const questions = lesson.quiz.map((q) => ({ id: q.id, question: q.question, options: parseJSON(q.options, []) }));
  const progress = node.progress;
  const homework = tasks.filter((t) => t.lessonId === id);
  const next = flat.slice(index + 1).find((l) => l.access.open);
  const needsQuiz = questions.length > 0 && progress?.quizTotal == null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <LiveLessonSync lessonId={id} updatedAt={lesson.updatedAt.toISOString()} />
      <article className="min-w-0 space-y-6">
        <div>
          <Link href={`/courses/${courseNode.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
            <ArrowRight className="size-4" /> {courseNode.title}
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar value={((index + 1) / flat.length) * 100} color={courseNode.color} size="sm" />
            <span className="shrink-0 text-xs text-muted">
              {formatNumber(index + 1)} / {formatNumber(flat.length)}
            </span>
          </div>
        </div>

        <header className="rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-8">
          <div className="text-sm font-medium" style={{ color: courseNode.color }}>{entry.module.title}</div>
          <h1 className="mt-1 text-2xl font-bold leading-snug sm:text-3xl">{lesson.title}</h1>
          {lesson.summary && <p className="mt-2 text-muted">{lesson.summary}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge icon={Clock}>{formatNumber(lesson.durationMin)} دقيقة</Badge>
            <Badge tone="primary" icon={Zap}>{formatNumber(lesson.xpReward)} XP</Badge>
            {node.completed && <Badge tone="mint">مكتمل ✓</Badge>}
          </div>
        </header>

        <div className="rounded-[2rem] border border-line bg-surface p-5 shadow-card sm:p-8">
          {blocks.length ? <BlockRenderer blocks={blocks} /> : <p className="text-muted">محتوى هذا الدرس قيد الإعداد.</p>}
        </div>

        {questions.length > 0 && <LessonQuiz lessonId={id} questions={questions} previous={progress} />}

        {homework.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold">واجبات الدرس</h2>
            {homework.map((t) => (
              <TaskRow key={t.id} task={t} compact />
            ))}
          </section>
        )}

        <CompleteLesson lessonId={id} completed={node.completed} needsQuiz={needsQuiz} nextLessonId={next?.id ?? null} courseId={courseNode.id} />
      </article>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        {stats.aiAvailable && (
          <Link
            href={`/assistant?lesson=${id}`}
            className="group flex items-center gap-3 rounded-3xl bg-gradient-to-br from-primary to-[#4F32E6] p-4 text-white shadow-pop transition hover:-translate-y-0.5"
          >
            <div className="grid size-11 place-items-center rounded-2xl bg-white/15">
              <Bot className="size-6" />
            </div>
            <div>
              <div className="font-semibold">اسأل ومضة AI</div>
              <div className="text-sm text-white/75">عن أي شيء في هذا الدرس</div>
            </div>
          </Link>
        )}
        <div className="rounded-3xl border border-line bg-surface p-4 shadow-card">
          <div className="mb-3 px-1 text-sm font-semibold">محتوى الدورة</div>
          <div className="scrollbar-thin max-h-[60vh] space-y-4 overflow-y-auto">
            {courseNode.modules.map((m) => (
              <div key={m.id}>
                <div className="mb-1 px-1 text-xs font-medium text-muted">{m.title}</div>
                {m.lessons.map((l) => {
                  const current = l.id === id;
                  const row = (
                    <>
                      <div className="scale-75">
                        <LessonStateIcon lesson={l} color={courseNode.color} />
                      </div>
                      <span className={cn("line-clamp-2 text-sm", !l.access.open && "text-muted")}>{l.title}</span>
                    </>
                  );
                  return l.access.open ? (
                    <Link key={l.id} href={`/lessons/${l.id}`} className={cn("flex items-center gap-1 rounded-xl p-1 transition", current ? "bg-primary-soft" : "hover:bg-surface-2")}>
                      {row}
                    </Link>
                  ) : (
                    <div key={l.id} className="flex items-center gap-1 p-1">{row}</div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
