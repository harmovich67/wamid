import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, Paperclip } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Markdown } from "@/components/lesson/Markdown";
import { CodeBlock } from "@/components/lesson/CodeBlock";
import { ReviewForm } from "@/components/admin/ReviewForm";
import { getAISettings, resolveApiKey } from "@/lib/ai";
import { SUBMISSION_STATUSES, SUBMISSION_TONES, TASK_TYPES } from "@/lib/constants";
import { formatBytes, formatDateTime, formatNumber, parseJSON } from "@/lib/utils";

export const metadata = { title: "مراجعة تسليم" };

export default async function SubmissionReviewPage({ params }) {
  const { id } = await params;
  await requireAdmin();
  const [s, settings] = await Promise.all([
    prisma.submission.findUnique({
      where: { id },
      include: {
        task: true,
        student: { select: { id: true, name: true, username: true, avatarColor: true } },
        reviewer: { select: { name: true } },
      },
    }),
    getAISettings(),
  ]);
  if (!s) notFound();
  const links = parseJSON(s.links, []);
  const files = parseJSON(s.files, []);

  return (
    <div className="space-y-6">
      <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowRight className="size-4" /> التسليمات
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-surface p-5 shadow-card">
            <Avatar name={s.student.name} color={s.student.avatarColor} size={48} />
            <div className="min-w-0 flex-1">
              <Link href={`/admin/students/${s.student.id}`} className="font-semibold hover:text-primary">{s.student.name}</Link>
              <div className="text-sm text-muted">سلّم في {formatDateTime(s.submittedAt)}</div>
            </div>
            <Badge tone={SUBMISSION_TONES[s.status]}>{SUBMISSION_STATUSES[s.status]}</Badge>
          </div>

          <details className="rounded-3xl border border-line bg-surface p-5 shadow-card">
            <summary className="cursor-pointer font-semibold">
              {TASK_TYPES[s.task.type]}: {s.task.title} <span className="text-sm font-normal text-muted">({formatNumber(s.task.points)} XP)</span>
            </summary>
            <Markdown className="mt-4">{s.task.description}</Markdown>
          </details>

          {s.content && (
            <section className="rounded-3xl border border-line bg-surface p-5 shadow-card">
              <h2 className="mb-3 font-semibold">شرح الطالب</h2>
              <Markdown>{s.content}</Markdown>
            </section>
          )}
          {s.code && (
            <section className="space-y-3">
              <h2 className="font-semibold">الكود</h2>
              <CodeBlock code={s.code} language="auto" title="submission" />
            </section>
          )}
          {(links.length > 0 || files.length > 0) && (
            <section className="space-y-2 rounded-3xl border border-line bg-surface p-5 shadow-card">
              <h2 className="mb-2 font-semibold">روابط وملفات</h2>
              {links.map((l) => (
                <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm text-primary" dir="ltr">
                  <ExternalLink className="size-4" /> <span className="truncate">{l}</span>
                </a>
              ))}
              {files.map((f) => (
                <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
                  <Paperclip className="size-4 text-primary" /> <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-muted">{formatBytes(f.size)}</span>
                </a>
              ))}
            </section>
          )}
        </div>

        <ReviewForm
          id={s.id}
          initial={{ status: s.status === "SUBMITTED" ? "APPROVED" : s.status, grade: s.grade ?? 100, feedback: s.feedback ?? "" }}
          points={s.task.points}
          reviewed={s.reviewedAt ? `راجعه ${s.reviewer?.name ?? ""} ${formatDateTime(s.reviewedAt)}` : null}
          aiAvailable={settings.enabled && Boolean(resolveApiKey(settings))}
        />
      </div>
    </div>
  );
}
