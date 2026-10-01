import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary:
    "bg-primary text-white shadow-[0_8px_20px_-8px_var(--primary)] hover:bg-primary-600 active:translate-y-px",
  secondary: "bg-surface text-fg border border-line hover:bg-surface-2 active:translate-y-px",
  soft: "bg-primary-soft text-primary hover:brightness-95 active:translate-y-px",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "bg-coral text-white hover:brightness-95 active:translate-y-px",
  amber: "bg-amber text-[#3a2400] shadow-[0_8px_20px_-8px_var(--amber)] hover:brightness-105 active:translate-y-px",
  mint: "bg-mint text-white shadow-[0_8px_20px_-8px_var(--mint)] hover:brightness-105 active:translate-y-px",
};

const SIZES = {
  xs: "h-8 px-2.5 text-xs gap-1.5 rounded-lg",
  sm: "h-9 px-3 text-sm gap-1.5 rounded-xl",
  md: "h-11 px-4 text-sm gap-2 rounded-xl",
  lg: "h-13 px-6 text-base gap-2 rounded-2xl",
  icon: "h-10 w-10 rounded-xl",
  "icon-sm": "h-8 w-8 rounded-lg",
};

export function buttonClass({ variant = "primary", size = "md", className } = {}) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center font-medium whitespace-nowrap transition-all duration-150 disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className
  );
}

export function Button({ href, variant, size, className, loading, children, disabled, ...props }) {
  const cls = buttonClass({ variant, size, className });
  if (href) {
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} disabled={disabled || loading} {...props}>
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
