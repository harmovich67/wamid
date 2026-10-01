"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function Tabs({ tabs, value, onChange, className, layoutId = "tabs" }) {
  return (
    <div className={cn("scrollbar-thin flex gap-1 overflow-x-auto rounded-2xl bg-surface-2 p-1", className)} role="tablist">
      {tabs.map((tab) => {
        const active = tab.value === value;
        const IconCmp = tab.icon;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
              active ? "text-fg" : "text-muted hover:text-fg"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-surface shadow-card"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {IconCmp && <IconCmp className="size-4" />}
              {tab.label}
              {tab.count != null && (
                <span className="rounded-full bg-primary-soft px-1.5 text-[11px] text-primary">{tab.count}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
