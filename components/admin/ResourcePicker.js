"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { TASK_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const key = (type, id) => `${type}:${id}`;

function Check({ checked, onChange, label, sub, depth = 0, bold }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pe-2 hover:bg-surface-2" style={{ paddingInlineStart: 8 + depth * 18 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--primary)]" />
      <span className={cn("min-w-0 flex-1 truncate text-sm", bold && "font-semibold")}>{label}</span>
      {sub && <span className="shrink-0 text-[11px] text-muted">{sub}</span>}
    </label>
  );
}

/** Multi-select of levels / courses / modules / lessons / tasks. value: [{ type, id }] */
export function ResourcePicker({ levels, tasks = [], value, onChange }) {
  const [open, setOpen] = useState({});
  const selected = new Set(value.map((r) => key(r.type, r.id)));

  function toggle(type, id, on) {
    const k = key(type, id);
    if (on && !selected.has(k)) onChange([...value, { type, id }]);
    if (!on) onChange(value.filter((r) => key(r.type, r.id) !== k));
  }

  return (
    <div className="scrollbar-thin max-h-80 overflow-y-auto rounded-2xl border border-line p-2">
      {levels.map((level) => (
        <div key={level.id}>
          <div className="flex items-center">
            <button type="button" onClick={() => setOpen((o) => ({ ...o, [level.id]: !o[level.id] }))} className="grid size-7 place-items-center text-muted" aria-label="توسيع">
              <ChevronDown className={cn("size-4 transition", !open[level.id] && "rotate-90")} />
            </button>
            <div className="flex-1">
              <Check bold checked={selected.has(key("LEVEL", level.id))} onChange={(on) => toggle("LEVEL", level.id, on)} label={level.title} sub="مستوى كامل" />
            </div>
          </div>
          {open[level.id] &&
            level.courses.map((course) => (
              <div key={course.id}>
                <div className="flex items-center ps-4">
                  <button type="button" onClick={() => setOpen((o) => ({ ...o, [course.id]: !o[course.id] }))} className="grid size-7 place-items-center text-muted" aria-label="توسيع">
                    <ChevronDown className={cn("size-4 transition", !open[course.id] && "rotate-90")} />
                  </button>
                  <Icon name={course.icon} className="size-4" style={{ color: course.color }} />
                  <div className="flex-1">
                    <Check checked={selected.has(key("COURSE", course.id))} onChange={(on) => toggle("COURSE", course.id, on)} label={course.title} sub="دورة" />
                  </div>
                </div>
                {open[course.id] &&
                  course.modules.map((mod) => (
                    <div key={mod.id}>
                      <Check depth={3} checked={selected.has(key("MODULE", mod.id))} onChange={(on) => toggle("MODULE", mod.id, on)} label={mod.title} sub="وحدة" />
                      {mod.lessons.map((lesson) => (
                        <Check key={lesson.id} depth={4} checked={selected.has(key("LESSON", lesson.id))} onChange={(on) => toggle("LESSON", lesson.id, on)} label={lesson.title} />
                      ))}
                    </div>
                  ))}
              </div>
            ))}
        </div>
      ))}
      {tasks.length > 0 && (
        <div className="mt-2 border-t border-line pt-2">
          <div className="px-2 py-1 text-xs font-semibold text-muted">المهام</div>
          {tasks.map((t) => (
            <Check key={t.id} checked={selected.has(key("TASK", t.id))} onChange={(on) => toggle("TASK", t.id, on)} label={t.title} sub={TASK_TYPES[t.type]} />
          ))}
        </div>
      )}
    </div>
  );
}
