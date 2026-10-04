import Link from "next/link";
import { CalendarClock, ChevronLeft, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DIFFICULTY_TONES, SUBMISSION_STATUSES, SUBMISSION_TONES, TASK_DIFFICULTIES, TASK_TYPES } from "@/lib/constants";
import { cn, formatDate, formatNumber } from "@/lib/utils";

const TYPE_STYLES = {
  TASK: "bg-sky-soft text-sky",
  HOMEWORK: "bg-mint-soft text-mint",
  CHALLENGE: "bg-amber-soft text-amber",
  PROJECT: "bg-primary-soft text-primary",
};

export function deadlineInfo(deadline) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline) - Date.now()) / 86400000);
  if (days < 0) return { text: "انتهى الموعد", tone: "coral" };
  if (days === 0) return { text: "آخر يوم اليوم", tone: "coral" };
  if (days <= 3) return { text: `باقي ${formatNumber(days)} ${days === 1 ? "يوم" : "أيام"}`, tone: "amber" };
  return { text: formatDate(deadline), tone: "gray" };
}

export function TaskRow({ task, compact }) {
  const dl = deadlineInfo(task.deadline);
  const status = task.submission?.status;
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="group flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card active:scale-[0.99] sm:gap-3.5 sm:p-4"
    >
      <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold sm:size-11", TYPE_STYLES[task.type])}>
        {TASK_TYPES[task.type]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-fg sm:text-base">{task.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] sm:gap-1.5 sm:text-xs">
          <Badge tone={DIFFICULTY_TONES[task.difficulty]}>{TASK_DIFFICULTIES[task.difficulty]}</Badge>
          {!compact && task.course && <Badge tone="gray">{task.course.title}</Badge>}
          {status ? (
            <Badge tone={SUBMISSION_TONES[status]}>{SUBMISSION_STATUSES[status]}</Badge>
          ) : (
            dl && (
              <Badge tone={dl.tone} icon={CalendarClock}>
                {dl.text}
              </Badge>
            )
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <span className="flex items-center gap-0.5 rounded-lg bg-primary-soft/70 px-2 py-0.5 text-xs font-bold text-primary sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
          <Zap className="size-3.5 fill-current sm:size-4" />
          {formatNumber(task.points)}
        </span>
        <ChevronLeft className="size-4 text-muted transition-transform group-hover:-translate-x-1 sm:size-5" />
      </div>
    </Link>
  );
}
