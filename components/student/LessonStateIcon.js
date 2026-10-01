import { Check, Clock, Lock, Play } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export function lessonStateLabel(lesson) {
  if (lesson.completed) return "مكتمل";
  switch (lesson.access.state) {
    case "open":
      return "متاح";
    case "scheduled":
      return `يفتح ${formatDate(lesson.access.opensAt)}`;
    case "expired":
      return "انتهت مدة الإتاحة";
    case "sequential":
      return "أكمل الدرس السابق أولًا";
    default:
      return "مقفل";
  }
}

export function LessonStateIcon({ lesson, size = "md", color }) {
  const box = size === "lg" ? "size-14" : "size-11";
  const icon = size === "lg" ? "size-6" : "size-5";
  if (lesson.completed) {
    return (
      <div className={cn(box, "grid shrink-0 place-items-center rounded-full bg-mint text-white shadow-[0_6px_0_0_#179b7e]")}>
        <Check className={icon} strokeWidth={3} />
      </div>
    );
  }
  if (lesson.access.open) {
    return (
      <div
        className={cn(box, "grid shrink-0 place-items-center rounded-full text-white")}
        style={{ background: color ?? "var(--primary)", boxShadow: `0 6px 0 0 color-mix(in oklab, ${color ?? "var(--primary)"} 70%, black)` }}
      >
        <Play className={cn(icon, "fill-current")} />
      </div>
    );
  }
  return (
    <div className={cn(box, "grid shrink-0 place-items-center rounded-full bg-surface-2 text-muted shadow-[0_6px_0_0_var(--line)]")}>
      {lesson.access.state === "scheduled" ? <Clock className={icon} /> : <Lock className={icon} />}
    </div>
  );
}
