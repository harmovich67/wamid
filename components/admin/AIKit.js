"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Select } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

export const AUDIENCE_OPTIONS = [
  { value: "kids", label: "10 – 13 سنة" },
  { value: "teens", label: "14 – 17 سنة" },
  { value: "adults", label: "18 – 25 سنة" },
];

/** Gradient "generate with AI" button. */
export function AIButton({ children, loading, className, size = "md", ...props }) {
  return (
    <button
      type="button"
      disabled={loading || props.disabled}
      className={cn(
        "group relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl font-medium text-white transition active:translate-y-px disabled:opacity-60",
        "bg-[linear-gradient(120deg,#7C5CFF,#B76CFF_55%,#FFB547)] shadow-[0_8px_24px_-10px_#7C5CFF]",
        size === "sm" ? "h-9 px-3 text-sm" : "h-11 px-4 text-sm",
        className
      )}
      {...props}
    >
      <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
      {loading ? <LoaderCircle className="relative size-4 animate-spin" /> : <Sparkles className="relative size-4" />}
      <span className="relative">{children}</span>
    </button>
  );
}

export function AudienceSelect({ value, onChange }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      {AUDIENCE_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </Select>
  );
}

/** Friendly progress state while Gemini writes (generation takes ~5–30s). */
export function AIWorking({ steps }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 2600);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <motion.div animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2.2 }}>
        <LogoMark size={64} animated />
      </motion.div>
      <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 font-medium">
        {steps[i]}
      </motion.p>
      <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full bg-[linear-gradient(90deg,#7C5CFF,#FFB547)]"
          initial={{ width: "8%" }}
          animate={{ width: "92%" }}
          transition={{ duration: steps.length * 2.6 + 6, ease: "easeOut" }}
        />
      </div>
      <p className="mt-3 text-xs text-muted">يستغرق عادة من 10 إلى 30 ثانية</p>
    </div>
  );
}
