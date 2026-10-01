"use client";

import { Check } from "lucide-react";
import { ICONS, ICON_NAMES } from "@/components/ui/Icon";
import { PALETTE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PALETTE.map((c) => (
        <button
          type="button"
          key={c}
          onClick={() => onChange(c)}
          className={cn("grid size-8 place-items-center rounded-full text-white transition", value?.toLowerCase() === c.toLowerCase() && "ring-4 ring-primary/25")}
          style={{ background: c }}
          aria-label={c}
        >
          {value?.toLowerCase() === c.toLowerCase() && <Check className="size-4" />}
        </button>
      ))}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="size-8 cursor-pointer rounded-full border border-line bg-transparent" aria-label="لون مخصص" />
    </div>
  );
}

export function IconPicker({ value, onChange, color = "var(--primary)" }) {
  return (
    <div className="scrollbar-thin grid max-h-40 grid-cols-8 gap-1.5 overflow-y-auto rounded-2xl border border-line p-2 sm:grid-cols-10">
      {ICON_NAMES.map((name) => {
        const Cmp = ICONS[name];
        const active = value === name;
        return (
          <button
            type="button"
            key={name}
            title={name}
            onClick={() => onChange(name)}
            className={cn("grid aspect-square place-items-center rounded-xl transition", active ? "text-white" : "text-muted hover:bg-surface-2 hover:text-fg")}
            style={active ? { background: color } : undefined}
          >
            <Cmp className="size-5" />
          </button>
        );
      })}
    </div>
  );
}
