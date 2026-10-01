import { cn } from "@/lib/utils";

export function ProgressBar({ value = 0, color, className, size = "md" }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-2",
        size === "sm" ? "h-1.5" : size === "lg" ? "h-3.5" : "h-2.5",
        className
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${v}%`, background: color ?? "linear-gradient(90deg, var(--primary), #b76cff)" }}
      />
    </div>
  );
}

export function ProgressRing({ value = 0, size = 64, stroke = 7, color = "var(--primary)", children, className }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-semibold">{children ?? `${v}%`}</div>
    </div>
  );
}
