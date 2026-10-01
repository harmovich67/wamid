"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, ChevronDown, Eye, EyeOff, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Field";
import { resolveChain, ruleKey } from "@/lib/access-rules";
import { api, toISO, toLocalInput } from "@/lib/client";
import { TASK_TYPES } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";

const STATE_UI = {
  open: { label: "مفتوح", cls: "bg-mint-soft text-mint" },
  scheduled: { label: "مجدول", cls: "bg-sky-soft text-sky" },
  expired: { label: "منتهي", cls: "bg-amber-soft text-amber" },
  denied: { label: "مقفل", cls: "bg-coral-soft text-coral" },
  unassigned: { label: "غير معيّن", cls: "bg-surface-2 text-muted" },
};

function EffectToggle({ value, onChange }) {
  const opts = [
    ["INHERIT", "وراثة"],
    ["ALLOW", "سماح"],
    ["DENY", "منع"],
  ];
  return (
    <div className="flex shrink-0 rounded-xl bg-surface-2 p-0.5 text-xs">
      {opts.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "rounded-lg px-2.5 py-1 font-medium transition",
            value === v
              ? v === "ALLOW"
                ? "bg-mint text-white"
                : v === "DENY"
                  ? "bg-coral text-white"
                  : "bg-surface text-fg shadow-sm"
              : "text-muted hover:text-fg"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Row({ type, id, title, depth, rules, setRule, effective, icon, meta, expandable, expanded, onExpand, draft }) {
  const k = ruleKey(type, id);
  const rule = rules.get(k);
  const [showDates, setShowDates] = useState(Boolean(rule?.availableFrom || rule?.availableUntil));
  const st = STATE_UI[effective.state] ?? STATE_UI.unassigned;

  return (
    <div className={cn("border-b border-line last:border-0", depth === 0 && "bg-surface-2/40")}>
      <div className="flex flex-wrap items-center gap-2 py-2.5 pe-3" style={{ paddingInlineStart: 12 + depth * 22 }}>
        {expandable ? (
          <button type="button" onClick={onExpand} className="grid size-6 place-items-center text-muted" aria-label="توسيع">
            <ChevronDown className={cn("size-4 transition", !expanded && "rotate-90")} />
          </button>
        ) : (
          <span className="size-6" />
        )}
        {icon}
        <span className={cn("min-w-0 flex-1 truncate text-sm", depth === 0 && "font-semibold", draft && "text-muted")}>
          {title}
          {draft && <span className="ms-2 text-[11px] text-amber">(مسودة)</span>}
        </span>
        {meta && <span className="hidden text-[11px] text-muted sm:inline">{meta}</span>}
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", st.cls)} title={effective.via ? `عبر قاعدة ${effective.via}` : undefined}>
          {st.label}
          {!rule && effective.via && " ↵"}
        </span>
        <EffectToggle value={rule?.effect ?? "INHERIT"} onChange={(v) => setRule(type, id, v === "INHERIT" ? null : { ...(rule ?? {}), effect: v })} />
        <button
          type="button"
          disabled={rule?.effect !== "ALLOW"}
          onClick={() => setShowDates((s) => !s)}
          className={cn("grid size-8 place-items-center rounded-lg transition disabled:opacity-30", rule?.availableFrom || rule?.availableUntil ? "bg-sky-soft text-sky" : "text-muted hover:bg-surface-2")}
          title="مواعيد الإتاحة"
        >
          <CalendarClock className="size-4" />
        </button>
      </div>
      {showDates && rule?.effect === "ALLOW" && (
        <div className="flex flex-wrap items-center gap-2 pb-3 pe-3 text-xs" style={{ paddingInlineStart: 44 + depth * 22 }}>
          <label className="flex items-center gap-1.5">
            يُفتح
            <Input type="datetime-local" className="h-9 w-auto text-xs" value={toLocalInput(rule.availableFrom)} onChange={(e) => setRule(type, id, { ...rule, availableFrom: toISO(e.target.value) })} />
          </label>
          <label className="flex items-center gap-1.5">
            يُغلق
            <Input type="datetime-local" className="h-9 w-auto text-xs" value={toLocalInput(rule.availableUntil)} onChange={(e) => setRule(type, id, { ...rule, availableUntil: toISO(e.target.value) })} />
          </label>
          {effective.opensAt && <span className="text-sky">يفتح {formatDateTime(effective.opensAt)}</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Per-student permission tree. Each node can inherit, allow or deny, with optional dates.
 * The badge shows the effective result using the same resolution as the server.
 */
export function AccessEditor({ studentId, levels, tasks, initialRules }) {
  const router = useRouter();
  const toMap = (list) => new Map(list.map((r) => [ruleKey(r.resourceType, r.resourceId), r]));
  const [rules, setRules] = useState(() => toMap(initialRules));
  const [expanded, setExpanded] = useState({});
  const [saving, setSaving] = useState(false);
  const [hideDrafts, setHideDrafts] = useState(false);
  const dirty = useMemo(() => JSON.stringify([...rules.values()]) !== JSON.stringify(initialRules), [rules, initialRules]);
  const now = useMemo(() => new Date(), []);

  function setRule(type, id, rule) {
    setRules((prev) => {
      const next = new Map(prev);
      const k = ruleKey(type, id);
      if (!rule) next.delete(k);
      else next.set(k, { resourceType: type, resourceId: id, effect: rule.effect, availableFrom: rule.availableFrom ?? null, availableUntil: rule.availableUntil ?? null });
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await api(`/api/admin/students/${studentId}/access`, { method: "PUT", body: { rules: [...rules.values()] } });
      toast.success("تم حفظ الصلاحيات. سيصل الطالب إشعار بما فُتح له.");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));
  const common = { rules, setRule };
  const lessonIndex = useMemo(() => {
    const m = new Map();
    levels.forEach((l) => l.courses.forEach((c) => c.modules.forEach((mod) => mod.lessons.forEach((les) => m.set(les.id, { l, c, mod })))));
    return m;
  }, [levels]);

  function taskEffective(t) {
    const direct = resolveChain(rules, [["TASK", t.id]], now);
    if (direct.state !== "unassigned") return direct;
    if (t.lessonId && lessonIndex.has(t.lessonId)) {
      const { l, c, mod } = lessonIndex.get(t.lessonId);
      return resolveChain(rules, [["LESSON", t.lessonId], ["MODULE", mod.id], ["COURSE", c.id], ["LEVEL", l.id]], now);
    }
    if (t.courseId) {
      const level = levels.find((l) => l.courses.some((c) => c.id === t.courseId));
      return resolveChain(rules, [["COURSE", t.courseId], ["LEVEL", level?.id]], now);
    }
    return direct;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-primary-soft/60 p-4 text-sm sm:flex-row sm:items-center">
        <p className="flex-1 text-muted">
          <b className="text-fg">القاعدة الأدق تفوز:</b> درس ← وحدة ← دورة ← مستوى. مثلًا اسمح بالدورة كاملة ثم امنع درسًا بعينه. بدون أي قاعدة يبقى المحتوى مقفلًا.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setHideDrafts((h) => !h)}>
            {hideDrafts ? <Eye className="size-4" /> : <EyeOff className="size-4" />} {hideDrafts ? "إظهار المسودات" : "إخفاء المسودات"}
          </Button>
          <Button variant="ghost" size="sm" disabled={!dirty} onClick={() => setRules(toMap(initialRules))}>
            <RotateCcw className="size-4" /> تراجع
          </Button>
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>
            <Save className="size-4" /> حفظ
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-surface">
        {levels.map((level) => (
          <div key={level.id}>
            <Row
              {...common}
              type="LEVEL"
              id={level.id}
              title={level.title}
              depth={0}
              effective={resolveChain(rules, [["LEVEL", level.id]], now)}
              icon={<Icon name={level.icon} className="size-4" style={{ color: level.color }} />}
              meta={`${level.courses.length} دورات`}
              expandable
              expanded={expanded[level.id]}
              onExpand={() => toggle(level.id)}
            />
            {expanded[level.id] &&
              level.courses
                .filter((c) => !hideDrafts || c.isPublished)
                .map((course) => (
                  <div key={course.id}>
                    <Row
                      {...common}
                      type="COURSE"
                      id={course.id}
                      title={course.title}
                      depth={1}
                      draft={!course.isPublished}
                      effective={resolveChain(rules, [["COURSE", course.id], ["LEVEL", level.id]], now)}
                      icon={<Icon name={course.icon} className="size-4" style={{ color: course.color }} />}
                      expandable
                      expanded={expanded[course.id]}
                      onExpand={() => toggle(course.id)}
                    />
                    {expanded[course.id] &&
                      course.modules.map((mod) => (
                        <div key={mod.id}>
                          <Row
                            {...common}
                            type="MODULE"
                            id={mod.id}
                            title={mod.title}
                            depth={2}
                            effective={resolveChain(rules, [["MODULE", mod.id], ["COURSE", course.id], ["LEVEL", level.id]], now)}
                            expandable
                            expanded={expanded[mod.id] ?? true}
                            onExpand={() => setExpanded((e) => ({ ...e, [mod.id]: !(e[mod.id] ?? true) }))}
                          />
                          {(expanded[mod.id] ?? true) &&
                            mod.lessons
                              .filter((l) => !hideDrafts || l.isPublished)
                              .map((lesson) => (
                                <Row
                                  {...common}
                                  key={lesson.id}
                                  type="LESSON"
                                  id={lesson.id}
                                  title={lesson.title}
                                  depth={3}
                                  draft={!lesson.isPublished}
                                  effective={resolveChain(rules, [["LESSON", lesson.id], ["MODULE", mod.id], ["COURSE", course.id], ["LEVEL", level.id]], now)}
                                />
                              ))}
                        </div>
                      ))}
                  </div>
                ))}
          </div>
        ))}
      </div>

      {tasks.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="border-b border-line bg-surface-2/40 px-4 py-3 text-sm font-semibold">
            المهام <span className="font-normal text-muted">— المهام المرتبطة بدرس أو دورة ترث صلاحيتها تلقائيًا</span>
          </div>
          {tasks
            .filter((t) => !hideDrafts || t.isPublished)
            .map((t) => (
              <Row {...common} key={t.id} type="TASK" id={t.id} title={t.title} depth={0} draft={!t.isPublished} meta={TASK_TYPES[t.type]} effective={taskEffective(t)} />
            ))}
        </div>
      )}
    </div>
  );
}
