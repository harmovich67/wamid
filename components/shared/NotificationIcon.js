import { BookOpen, ListChecks, Megaphone, MessageCircle, MessageSquareText, RefreshCw, Smile, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const NOTIFICATION_STYLES = {
  LESSON_UNLOCKED: { icon: BookOpen, cls: "bg-primary-soft text-primary" },
  LESSON_UPDATED: { icon: RefreshCw, cls: "bg-primary-soft text-primary" },
  TASK_ASSIGNED: { icon: ListChecks, cls: "bg-sky-soft text-sky" },
  FEEDBACK: { icon: MessageSquareText, cls: "bg-mint-soft text-mint" },
  ACHIEVEMENT: { icon: Trophy, cls: "bg-amber-soft text-amber" },
  ANNOUNCEMENT: { icon: Megaphone, cls: "bg-coral-soft text-coral" },
  SYSTEM: { icon: Megaphone, cls: "bg-coral-soft text-coral" },
  REPLY: { icon: MessageCircle, cls: "bg-sky-soft text-sky" },
  REACTION: { icon: Smile, cls: "bg-amber-soft text-amber" },
};

export function NotificationIcon({ type, size = "md" }) {
  const t = NOTIFICATION_STYLES[type] ?? NOTIFICATION_STYLES.SYSTEM;
  return (
    <div className={cn("grid shrink-0 place-items-center rounded-2xl", size === "sm" ? "size-9 rounded-xl" : "size-11", t.cls)}>
      <t.icon className={size === "sm" ? "size-4" : "size-5"} />
    </div>
  );
}
