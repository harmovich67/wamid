import { cn } from "@/lib/utils";

const TONES = {
  primary: "bg-primary-soft text-primary",
  amber: "bg-amber-soft text-amber",
  mint: "bg-mint-soft text-mint",
  coral: "bg-coral-soft text-coral",
  sky: "bg-sky-soft text-sky",
};

export function StatCard({ icon: IconCmp, label, value, hint, tone = "primary", className }) {
  return (
    <div className={cn("flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-card sm:p-5", className)}>
      <div className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", TONES[tone])}>
        {IconCmp && <IconCmp className="size-6" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm text-muted">{label}</div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {hint && <div className="truncate text-xs text-muted">{hint}</div>}
      </div>
    </div>
  );
}
