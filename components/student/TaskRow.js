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
      className="group flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card active:scale-[0.99] sm:gap-3.5 sm:p-3.5"
    >
      <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-[11px] font-bold sm:size-10 sm:text-xs", TYPE_STYLES[task.type])}>
        {TASK_TYPES[task.type]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-sm font-semibold text-fg sm:text-[15px]">{task.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          <Badge tone={DIFFICULTY_TONES[task.difficulty]}>{TASK_DIFFICULTIES[task.difficulty]}</Badge>
          {!compact && task.course && <Badge tone="gray">{task.course.title}</Badge>}
          <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-soft px-1.5 py-0.5 text-[11px] font-bold text-[#b86e00] dark:text-amber">
            <Zap className="size-3 fill-current" />
            {formatNumber(task.points)} XP
          </span>
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
      <div className="flex shrink-0 items-center justify-center ps-1">
        <ChevronLeft className="size-4.5 text-muted/60 transition-transform group-hover:-translate-x-1 group-hover:text-primary sm:size-5" />
      </div>
    </Link>
  );
}
