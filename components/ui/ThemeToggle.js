"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

// The initial theme is applied by an inline script in app/layout.js (no flash).
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('wameed-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export function ThemeToggle({ className }) {
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("wameed-theme", next);
    } catch {}
  }
  return (
    <button
      onClick={toggle}
      className={cn("grid size-10 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg", className)}
      aria-label="تبديل المظهر"
      title="تبديل المظهر"
    >
      <Sun className="hidden size-5 dark:block" />
      <Moon className="size-5 dark:hidden" />
    </button>
  );
}
