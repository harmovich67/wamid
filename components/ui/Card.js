import { cn } from "@/lib/utils";

export function Card({ className, children, interactive, ...props }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-line bg-surface shadow-card",
        interactive && "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-pop",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 p-5 pb-0", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, eyebrow }) {
  return (
    <div className="mb-4 flex flex-col gap-2.5 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-medium text-primary sm:text-sm">{eyebrow}</div>}
        <h1 className="text-xl font-bold tracking-tight text-fg sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-xs text-muted leading-relaxed sm:mt-1.5 sm:text-sm">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
