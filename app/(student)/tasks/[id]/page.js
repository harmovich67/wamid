import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bot, CalendarClock, Clock, Lock, MessageSquareText, Paperclip, Zap } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { getShellStats, getTasks } from "@/lib/student-data";
import { Markdown } from "@/components/lesson/Markdown";
import { CodeBlock } from "@/components/lesson/CodeBlock";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { deadlineInfo } from "@/components/student/TaskRow";
import { SubmissionForm } from "@/components/student/SubmissionForm";
import { DIFFICULTY_TONES, SUBMISSION_STATUSES, SUBMISSION_TONES, TASK_DIFFICULTIES, TASK_TYPES } from "@/lib/constants";
import { formatBytes, formatDate, formatDateTime, formatNumber, parseJSON } from "@/lib/utils";

export default async function TaskPage({ params }) {
  const { id } = await params;
  const user = await requireStudent();
  const [tasks, stats] = await Promise.all([getTasks(user.id), getShellStats(user)]);
  const task = tasks.find((t) => t.id === id);
  if (!task) notFound();

  if (!task.access.open && !task.submission) {
    return (
      <EmptyState
        icon={Lock}
        title="هذه المهمة لم تُفتح بعد"
        description={task.access.opensAt ? `تفتح في ${formatDateTime(task.access.opensAt)}` : "سيفتحها معلّمك قريبًا."}
        action={<Button href="/tasks" variant="secondary">كل المهام</Button>}
      />
    );
  }

  const skills = parseJSON(task.skills, []);
  const attachments = parseJSON(task.attachments, []);
  const sub = task.submission;
  const dl = deadlineInfo(task.deadline);
  const canSubmit = task.access.open && sub?.status !== "APPROVED";

  return (
    <div className="space-y-6">
      <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowRight className="size-4" /> مهامي
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <header className="rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap gap-2">
              <Badge tone="primary">{TASK_TYPES[task.type]}</Badge>
              <Badge tone={DIFFICULTY_TONES[task.difficulty]}>{TASK_DIFFICULTIES[task.difficulty]}</Badge>
              {sub && <Badge tone={SUBMISSION_TONES[sub.status]}>{SUBMISSION_STATUSES[sub.status]}</Badge>}
            </div>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{task.title}</h1>
            {(task.course || task.lesson) && (
              <p className="mt-1 text-sm text-muted">
                {task.course?.title}
                {task.lesson && ` · ${task.lesson.title}`}
              </p>
            )}
          </header>

          <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-8">
            <Markdown>{task.description}</Markdown>
            {attachments.length > 0 && (
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {attachments.map((f) => (
                  <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-line p-3 hover:border-primary/40">
                    <Paperclip className="size-5 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
                    {f.size ? <span className="text-xs text-muted">{formatBytes(f.size)}</span> : null}
                  </a>
                ))}
              </div>
            )}
          </section>

          {sub?.feedback && (
            <section className="rounded-[2rem] border border-primary/30 bg-primary-soft/60 p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-semibold">
                  <MessageSquareText className="size-5 text-primary" /> ملاحظات المعلّم
                </h2>
                {sub.grade != null && <span className="rounded-full bg-surface px-3 py-1 text-sm font-bold text-primary">{formatNumber(sub.grade)}/100</span>}
              </div>
              <Markdown>{sub.feedback}</Markdown>
              {sub.pointsAwarded > 0 && (
                <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary">
                  <Zap className="size-4 fill-current" /> حصلت على {formatNumber(sub.pointsAwarded)} XP
                </div>
              )}
            </section>
          )}

          {canSubmit ? (
            <SubmissionForm
              taskId={task.id}
              initial={sub ? { content: sub.content ?? "", code: sub.code ?? "", links: parseJSON(sub.links, []), files: parseJSON(sub.files, []) } : null}
              status={sub?.status}
            />
          ) : sub ? (
            <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-card">
              <h2 className="font-semibold">تسليمك</h2>
              <p className="mt-1 text-sm text-muted">سُلّم في {formatDateTime(sub.submittedAt)}</p>
              {sub.content && <Markdown className="mt-4">{sub.content}</Markdown>}
              {sub.code && (
                <div className="mt-4"><CodeBlock code={sub.code} title="solution" /></div>
              )}
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-3xl border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">المكافأة</span>
              <span className="flex items-center gap-1 font-bold text-primary"><Zap className="size-4 fill-current" /> {formatNumber(task.points)} XP</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">الموعد النهائي</span>
              {dl ? <Badge tone={dl.tone} icon={CalendarClock}>{task.deadline ? formatDateTime(task.deadline) : dl.text}</Badge> : <span>مفتوح</span>}
            </div>
            {sub && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">آخر تسليم</span>
                <span className="flex items-center gap-1"><Clock className="size-3.5" /> {formatDate(sub.submittedAt)}</span>
              </div>
            )}
            {skills.length > 0 && (
              <div>
                <div className="mb-2 text-sm text-muted">المهارات المطلوبة</div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <Badge key={s} tone="sky">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          {stats.aiAvailable && (
            <Link href={`/assistant?task=${task.id}&mode=hint`} className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-primary to-[#4F32E6] p-4 text-white shadow-pop transition hover:-translate-y-0.5">
              <div className="grid size-11 place-items-center rounded-2xl bg-white/15"><Bot className="size-6" /></div>
              <div>
                <div className="font-semibold">عالق؟ اطلب تلميحًا</div>
                <div className="text-sm text-white/75">ومضة AI يساعدك بدون حل جاهز</div>
              </div>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
