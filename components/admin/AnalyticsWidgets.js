"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownWideNarrow } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useMounted } from "@/components/ui/useMounted";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

/** Completions per lesson, in order, for one course — the drop shows where students stop. */
export function CourseFunnel({ funnels }) {
  const [courseId, setCourseId] = useState(funnels[0]?.id ?? null);
  const course = funnels.find((f) => f.id === courseId) ?? funnels[0];
  if (!course) return <p className="text-sm text-muted">لا توجد بيانات بعد: ستظهر عندما يبدأ الطلاب الدروس.</p>;
  const max = Math.max(1, ...course.lessons.map((l) => Math.max(l.opened, l.done)));

  return (
    <div>
      <div className="scrollbar-thin mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {funnels.map((f) => (
          <button
            key={f.id}
            onClick={() => setCourseId(f.id)}
            className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition", f.id === course.id ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-fg")}
          >
            <Icon name={f.icon} className="size-3.5" /> {f.title}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {course.lessons.map((l, i) => {
          const prev = course.lessons[i - 1];
          const drop = prev && prev.done > 0 && l.done < prev.done * 0.6;
          return (
            <div key={l.id} className="flex items-center gap-3 text-sm">
              <span className="w-6 shrink-0 text-center text-xs text-muted">{formatNumber(i + 1)}</span>
              <span className="w-32 shrink-0 truncate sm:w-56" title={l.title}>
                {l.title}
              </span>
              <div className="relative h-6 min-w-0 flex-1 overflow-hidden rounded-lg bg-surface-2">
                <div className="absolute inset-y-0 start-0 rounded-lg bg-primary/25" style={{ width: `${(l.opened / max) * 100}%` }} title={`فتحه ${l.opened}`} />
                <div className="absolute inset-y-0 start-0 rounded-lg" style={{ width: `${(l.done / max) * 100}%`, background: course.color }} title={`أكمله ${l.done}`} />
              </div>
              <span className={cn("w-14 shrink-0 text-end text-xs font-semibold", drop ? "text-coral" : "text-muted")}>
                {formatNumber(l.done)}
                {drop && " ↓"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: course.color }} /> أكملوا الدرس
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary/25" /> فتحوه فقط
        </span>
        <span className="text-coral">↓ هبوط واضح عن الدرس السابق</span>
      </div>
    </div>
  );
}

const COLUMNS = [
  ["name", "الطالب"],
  ["lessonsPeriod", "دروس الفترة"],
  ["lessons", "كل الدروس"],
  ["tasksApproved", "مهام مقبولة"],
  ["avgGrade", "متوسط الدرجات"],
  ["quizPercent", "الاختبارات"],
  ["xp", "XP"],
  ["lastActive", "آخر نشاط"],
];

/** Sortable students table (sorted by most recent activity by default). */
export function StudentsTable({ rows }) {
  const mounted = useMounted();
  const [sort, setSort] = useState({ key: "lessonsPeriod", dir: -1 });

  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return (typeof x === "string" ? x.localeCompare(y, "ar") : x - y) * sort.dir;
    });
    return list;
  }, [rows, sort]);

  const pct = (v) => (v == null ? "—" : `${formatNumber(v)}%`);

  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            {COLUMNS.map(([key, label]) => (
              <th key={key} className="px-3 py-2.5 text-start font-medium">
                <button
                  onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : key === "name" ? 1 : -1 }))}
                  className={cn("flex items-center gap-1 hover:text-fg", sort.key === key && "text-fg")}
                >
                  {label}
                  {sort.key === key && <ArrowDownWideNarrow className={cn("size-3.5", sort.dir === 1 && "rotate-180")} />}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sorted.map((r) => (
            <tr key={r.id} className="hover:bg-surface-2/50">
              <td className="px-3 py-2.5">
                <Link href={`/admin/students/${r.id}`} className="flex items-center gap-2.5 hover:text-primary">
                  <Avatar name={r.name} color={r.avatarColor} avatar={r.avatar} size={30} />
                  <span className="min-w-0">
                    <span className="block max-w-44 truncate font-medium">{r.name}</span>
                    {r.groups.length > 0 && <span className="block max-w-44 truncate text-[11px] text-muted">{r.groups.join("، ")}</span>}
                  </span>
                </Link>
              </td>
              <td className="px-3 py-2.5 font-semibold">{formatNumber(r.lessonsPeriod)}</td>
              <td className="px-3 py-2.5">{formatNumber(r.lessons)}</td>
              <td className="px-3 py-2.5">{formatNumber(r.tasksApproved)}</td>
              <td className="px-3 py-2.5">{r.avgGrade == null ? "—" : `${formatNumber(r.avgGrade)}/100`}</td>
              <td className={cn("px-3 py-2.5", r.quizPercent != null && r.quizPercent < 50 && "font-semibold text-coral")}>{pct(r.quizPercent)}</td>
              <td className="px-3 py-2.5">{formatNumber(r.xp)}</td>
              <td className="px-3 py-2.5 text-xs text-muted">{mounted ? (r.lastActive ? timeAgo(r.lastActive) : "لم يبدأ") : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Students with no activity for a week or more. */
export function InactiveList({ rows }) {
  const mounted = useMounted();
  if (!rows.length) return <p className="py-4 text-center text-sm text-mint">كل الطلاب نشطون هذا الأسبوع 🎉</p>;
  return (
    <ul className="space-y-1">
      {rows.slice(0, 10).map((r) => (
        <li key={r.id}>
          <Link href={`/admin/students/${r.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface-2">
            <Avatar name={r.name} color={r.avatarColor} avatar={r.avatar} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{r.name}</span>
              <span className="block truncate text-xs text-muted">{r.groups.join("، ") || `@${r.username}`}</span>
            </span>
            <span className="shrink-0 text-xs font-medium text-coral">{mounted ? (r.lastActive ? timeAgo(r.lastActive) : "لم يبدأ بعد") : ""}</span>
          </Link>
        </li>
      ))}
      {rows.length > 10 && <li className="px-2 pt-1 text-xs text-muted">و{formatNumber(rows.length - 10)} آخرون — انظر الجدول بالأسفل.</li>}
    </ul>
  );
}
