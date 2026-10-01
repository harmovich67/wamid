import { cn } from "@/lib/utils";

const control =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-fg placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60";

const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239d98bf' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

// Use as="div" when the field wraps a composite control (e.g. a rich editor) — a <label>
// would forward every click inside it to the first button.
export function Field({ label, hint, error, children, className, required, as: Tag = "label" }) {
  return (
    <Tag className={cn("block", className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium">
          {label}
          {required && <span className="text-coral"> *</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-coral">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-muted">{hint}</span>
      )}
    </Tag>
  );
}

export function Input({ className, ...props }) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(control, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, style, ...props }) {
  return (
    <select
      className={cn(control, "h-11 cursor-pointer appearance-none bg-[length:16px] bg-[position:left_12px_center] bg-no-repeat ps-3.5 pe-9", className)}
      style={{ backgroundImage: chevron, ...style }}
      {...props}
    >
      {children}
    </select>
  );
}
