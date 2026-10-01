import { CalendarClock, CheckCircle2, Hourglass, ListChecks, PenLine, RotateCcw } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { getTasks } from "@/lib/student-data";
import { PageHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/Motion";
import { TaskRow } from "@/components/student/TaskRow";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "مهامي" };

const GROUPS = [
  { key: "revision", title: "تحتاج تعديل", icon: RotateCcw, tone: "text-amber" },
  { key: "todo", title: "بانتظار التسليم", icon: PenLine, tone: "text-primary" },
  { key: "review", title: "قيد المراجعة", icon: Hourglass, tone: "text-sky" },
  { key: "upcoming", title: "قادمة قريبًا", icon: CalendarClock, tone: "text-muted" },
  { key: "done", title: "مكتملة", icon: CheckCircle2, tone: "text-mint" },
];

function groupOf(task) {
  const s = task.submission?.status;
  if (s === "APPROVED") return "done";
  if (s === "NEEDS_REVISION") return "revision";
  if (s === "SUBMITTED") return "review";
  if (!task.access.open) return "upcoming";
  return "todo";
}

export default async function TasksPage() {
  const user = await requireStudent();
  const tasks = await getTasks(user.id);
  const grouped = Object.groupBy(tasks, groupOf);

  return (
    <div>
      <PageHeader title="مهامي" subtitle="الواجبات والتحديات والمشاريع التي كلّفك بها معلّمك." />
      {tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="لا توجد مهام بعد" description="عندما يكلّفك معلّمك بمهمة ستظهر هنا مع إشعار." />
      ) : (
        <div className="space-y-8">
          {GROUPS.filter((g) => grouped[g.key]?.length).map((g, i) => (
            <FadeIn key={g.key} delay={i * 0.05}>
              <section>
                <h2 className="mb-3 flex items-center gap-2 font-semibold">
                  <g.icon className={`size-5 ${g.tone}`} />
                  {g.title}
                  <span className="rounded-full bg-surface-2 px-2 text-xs text-muted">{formatNumber(grouped[g.key].length)}</span>
                </h2>
                <div className="grid gap-2.5 lg:grid-cols-2">
                  {grouped[g.key].map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </div>
              </section>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
