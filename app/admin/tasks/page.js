import Link from "next/link";
import { CalendarClock, ListChecks, Plus, Zap } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DIFFICULTY_TONES, TASK_DIFFICULTIES, TASK_TYPES } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "المهام" };

export default async function AdminTasksPage() {
  await requireAdmin();
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { title: true } },
      lesson: { select: { title: true } },
      submissions: { select: { status: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="المهام والتحديات"
        subtitle="واجبات، تحديات، ومشاريع حقيقية. اربطها بدرس أو دورة، أو عيّنها لطلاب محددين."
        action={
          <Button href="/admin/tasks/new">
            <Plus className="size-4" /> مهمة جديدة
          </Button>
        }
      />
      {tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="لا مهام بعد" action={<Button href="/admin/tasks/new">أنشئ أول مهمة</Button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((t) => {
            const pending = t.submissions.filter((s) => s.status === "SUBMITTED").length;
            const approved = t.submissions.filter((s) => s.status === "APPROVED").length;
            return (
              <Link key={t.id} href={`/admin/tasks/${t.id}`} className="flex flex-col rounded-3xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40">
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="primary">{TASK_TYPES[t.type]}</Badge>
                  <Badge tone={DIFFICULTY_TONES[t.difficulty]}>{TASK_DIFFICULTIES[t.difficulty]}</Badge>
                  {!t.isPublished && <Badge tone="amber">مسودة</Badge>}
                </div>
                <h3 className="mt-3 font-semibold">{t.title}</h3>
                <p className="mt-1 truncate text-sm text-muted">
                  {t.lesson ? `درس: ${t.lesson.title}` : t.course ? `دورة: ${t.course.title}` : "تعيين مباشر للطلاب"}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><CalendarClock className="size-3.5" /> {t.deadline ? formatDate(t.deadline) : "بدون موعد"}</span>
                  <span className="flex items-center gap-1 text-primary"><Zap className="size-3.5" /> {formatNumber(t.points)}</span>
                </div>
                <div className="mt-3 flex gap-2 text-xs">
                  <span className="rounded-full bg-sky-soft px-2 py-0.5 text-sky">{formatNumber(pending)} للمراجعة</span>
                  <span className="rounded-full bg-mint-soft px-2 py-0.5 text-mint">{formatNumber(approved)} مقبول</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
