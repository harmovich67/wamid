import { cn } from "@/lib/utils";

const TONES = {
  primary: "bg-primary-soft text-primary",
  amber: "bg-amber-soft text-[#b86e00] dark:text-amber",
  mint: "bg-mint-soft text-[#0f8a6f] dark:text-mint",
  coral: "bg-coral-soft text-[#d63c56] dark:text-coral",
  sky: "bg-sky-soft text-[#0b7fb5] dark:text-sky",
  gray: "bg-surface-2 text-muted",
};

export function Badge({ tone = "gray", className, children, icon: IconCmp }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone] ?? TONES.gray,
        className
      )}
    >
      {IconCmp && <IconCmp className="size-3.5" />}
      {children}
    </span>
  );
}
