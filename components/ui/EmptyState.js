import { cn } from "@/lib/utils";

export function EmptyState({ icon: IconCmp, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-line px-6 py-12 text-center",
        className
      )}
    >
      {IconCmp && (
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <IconCmp className="size-7" />
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
