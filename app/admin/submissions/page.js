import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SUBMISSION_STATUSES, SUBMISSION_TONES, TASK_TYPES } from "@/lib/constants";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

export const metadata = { title: "التسليمات" };

const FILTERS = [
  { value: "SUBMITTED", label: "بانتظار المراجعة" },
  { value: "NEEDS_REVISION", label: "تحتاج تعديل" },
  { value: "APPROVED", label: "مقبولة" },
  { value: "all", label: "الكل" },
];

export default async function SubmissionsPage({ searchParams }) {
  await requireAdmin();
  const { status = "SUBMITTED" } = await searchParams;
  const filter = FILTERS.some((f) => f.value === status) ? status : "SUBMITTED";
  const [items, counts] = await Promise.all([
    prisma.submission.findMany({
      where: filter === "all" ? {} : { status: filter },
      orderBy: { submittedAt: filter === "SUBMITTED" ? "asc" : "desc" },
      take: 200,
      include: {
        student: { select: { name: true, avatarColor: true } },
        task: { select: { title: true, type: true } },
      },
    }),
    prisma.submission.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countOf = (s) => (s === "all" ? counts.reduce((a, c) => a + c._count._all, 0) : counts.find((c) => c.status === s)?._count._all ?? 0);

  return (
    <div>
      <PageHeader title="التسليمات" subtitle="راجع حلول الطلاب، امنحهم الدرجات والملاحظات." />
      <div className="no-scrollbar sm:scrollbar-thin mb-5 flex gap-1 overflow-x-auto rounded-2xl bg-surface-2 p-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/submissions?status=${f.value}`}
            className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium", filter === f.value ? "bg-surface shadow-card" : "text-muted hover:text-fg")}
          >
            {f.label}
            <span className="rounded-full bg-primary-soft px-1.5 text-[11px] text-primary">{formatNumber(countOf(f.value))}</span>
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="لا تسليمات هنا" />
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
          {items.map((s) => (
            <Link key={s.id} href={`/admin/submissions/${s.id}`} className="flex items-center gap-3 p-4 hover:bg-surface-2/50">
              <Avatar name={s.student.name} color={s.student.avatarColor} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{s.task.title}</div>
                <div className="text-xs text-muted">
                  {s.student.name} · {TASK_TYPES[s.task.type]} · {timeAgo(s.submittedAt)}
                </div>
              </div>
              {s.grade != null && <span className="hidden text-sm font-semibold sm:block">{formatNumber(s.grade)}/100</span>}
              <Badge tone={SUBMISSION_TONES[s.status]}>{SUBMISSION_STATUSES[s.status]}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
