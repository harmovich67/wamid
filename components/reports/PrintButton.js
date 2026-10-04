"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="grid size-8 place-items-center rounded-full bg-surface-2 text-muted transition hover:text-fg"
      aria-label="طباعة التقرير"
      title="طباعة / حفظ PDF"
    >
      <Printer className="size-4" />
    </button>
  );
}
