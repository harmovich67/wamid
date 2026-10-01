"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Paperclip, Save, Search, Trash2, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input, Select } from "@/components/ui/Field";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { FileButton } from "@/components/ui/FileButton";
import { Switch } from "@/components/ui/Switch";
import { Modal } from "@/components/ui/Modal";
import { api, toISO, toLocalInput } from "@/lib/client";
import { AIButton, AudienceSelect } from "./AIKit";
import { SUBMISSION_STATUSES, SUBMISSION_TONES, TASK_DIFFICULTIES, TASK_TYPES } from "@/lib/constants";
import { formatBytes, formatNumber, timeAgo } from "@/lib/utils";

const EMPTY = { title: "", description: "", type: "TASK", difficulty: "EASY", skills: [], attachments: [], deadline: null, points: 20, courseId: "", lessonId: "", isPublished: true };

function AITaskPanel({ form, setForm }) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("teens");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await api("/api/admin/ai/generate/task", {
        method: "POST",
        body: { topic, audience, type: form.type, difficulty: form.difficulty, courseId: form.courseId || null, lessonId: form.lessonId || null },
      });
      setForm((f) => ({ ...f, title: res.title, description: res.description, skills: res.skills, points: res.points }));
      toast.success("كتب الذكاء الاصطناعي المهمة ✨ راجعها ثم احفظ");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-[linear-gradient(135deg,var(--primary-soft),transparent_75%)] p-5">
      <div className="font-semibold">صِف المهمة ودع الذكاء الاصطناعي يكتبها ✨</div>
      <p className="mt-0.5 text-xs text-muted">يستخدم النوع والصعوبة والدورة/الدرس المختارين أدناه كسياق، ويكتب القصة والمتطلبات والمثال ومعايير التقييم — بدون الحل.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="مثال: برنامج يحسب معدل درجات الطالب باستخدام القوائم" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), topic.trim().length >= 3 && run())} />
        <div className="shrink-0 sm:w-44"><AudienceSelect value={audience} onChange={setAudience} /></div>
        <AIButton loading={loading} onClick={run} disabled={topic.trim().length < 3}>{loading ? "يكتب…" : "اكتبها"}</AIButton>
      </div>
    </div>
  );
}

function AssignPanel({ taskId, students, assigned }) {
  const router = useRouter();
  const [selected, setSelected] = useState(assigned);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const list = students.filter((s) => !q || s.name.includes(q) || s.username.includes(q.toLowerCase()));

  async function save() {
    setSaving(true);
    try {
      await api(`/api/admin/tasks/${taskId}/assign`, { method: "PUT", body: { userIds: selected } });
      toast.success("تم تحديث التعيين. سيصل الطلاب الجدد إشعار.");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-3xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold"><UserCheck className="size-5 text-primary" /> تعيين مباشر</h3>
        <span className="text-xs text-muted">{formatNumber(selected.length)} طالب</span>
      </div>
      <p className="text-xs text-muted">المهام المرتبطة بدرس أو دورة تظهر تلقائيًا لمن يملك صلاحيتها. استخدم هذا لتعيين إضافي أو لمهام مستقلة.</p>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input className="h-9 ps-9" placeholder="بحث" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="scrollbar-thin max-h-60 space-y-1 overflow-y-auto">
        {list.map((s) => (
          <label key={s.id} className="flex cursor-pointer items-center gap-2.5 rounded-xl p-1.5 hover:bg-surface-2">
            <input type="checkbox" checked={selected.includes(s.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, s.id] : selected.filter((x) => x !== s.id))} className="size-4 accent-[var(--primary)]" />
            <Avatar name={s.name} color={s.avatarColor} size={28} />
            <span className="text-sm">{s.name}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setSelected(students.map((s) => s.id))}>الكل</Button>
        <Button size="sm" variant="ghost" onClick={() => setSelected([])}>لا أحد</Button>
        <Button size="sm" className="ms-auto" onClick={save} loading={saving}>حفظ التعيين</Button>
      </div>
    </div>
  );
}

export function TaskForm({ task, levels, students = [], assigned = [], submissions = [] }) {
  const router = useRouter();
  const [form, setForm] = useState(task ?? EMPTY);
  const [skill, setSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const courses = useMemo(() => levels.flatMap((l) => l.courses.map((c) => ({ ...c, level: l.title }))), [levels]);
  const lessons = useMemo(() => courses.find((c) => c.id === form.courseId)?.modules.flatMap((m) => m.lessons) ?? [], [courses, form.courseId]);

  function addSkill(e) {
    e?.preventDefault();
    const v = skill.trim();
    if (v && !form.skills.includes(v)) setForm({ ...form, skills: [...form.skills, v] });
    setSkill("");
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, points: Number(form.points) };
      delete body.id;
      if (task?.id) {
        const res = await api(`/api/admin/tasks/${task.id}`, { method: "PATCH", body });
        toast.success(res.notified ? `تم الحفظ وإشعار ${formatNumber(res.notified)} طالب` : "تم الحفظ");
        router.refresh();
      } else {
        const res = await api("/api/admin/tasks", { method: "POST", body });
        toast.success(res.notified ? `تم إنشاء المهمة وإشعار ${formatNumber(res.notified)} طالب` : "تم إنشاء المهمة");
        router.replace(`/admin/tasks/${res.id}`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api(`/api/admin/tasks/${task.id}`, { method: "DELETE" });
      toast.success("تم حذف المهمة");
      router.replace("/admin/tasks");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/tasks" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowRight className="size-4" /> المهام
      </Link>
      <h1 className="text-2xl font-bold">{task ? "تحرير المهمة" : "مهمة جديدة"}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
        <AITaskPanel form={form} setForm={setForm} />
        <form id="task-form" onSubmit={save} className="space-y-5 rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6">
          <Field label="العنوان" required>
            <Input value={form.title} onChange={set("title")} required placeholder="ابنِ آلة حاسبة بسيطة" />
          </Field>
          <Field as="div" label="الوصف والمتطلبات" required>
            <RichTextEditor
              ai
              aiContext={form.title}
              minHeight={260}
              value={form.description}
              onChange={(description) => setForm((f) => ({ ...f, description }))}
              placeholder={"## المطلوب\n- …\n\n## معايير التقييم\n- …"}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="النوع">
              <Select value={form.type} onChange={set("type")}>
                {Object.entries(TASK_TYPES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </Field>
            <Field label="الصعوبة">
              <Select value={form.difficulty} onChange={set("difficulty")}>
                {Object.entries(TASK_DIFFICULTIES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </Field>
            <Field label="النقاط (XP)">
              <Input type="number" min={0} max={5000} value={form.points} onChange={set("points")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="مرتبطة بدورة" hint="يراها من لديه صلاحية الدورة">
              <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value, lessonId: "" })}>
                <option value="">— بدون —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.level} · {c.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="مرتبطة بدرس (واجب الدرس)">
              <Select value={form.lessonId} onChange={set("lessonId")} disabled={!form.courseId}>
                <option value="">— بدون —</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="الموعد النهائي">
            <Input type="datetime-local" value={toLocalInput(form.deadline)} onChange={(e) => setForm({ ...form, deadline: toISO(e.target.value) })} />
          </Field>
          <Field label="المهارات المطلوبة">
            <div className="flex gap-2">
              <Input value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill(e)} placeholder="مثال: الحلقات" />
              <Button type="button" variant="secondary" onClick={addSkill}>إضافة</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.skills.map((s) => (
                <span key={s} className="flex items-center gap-1 rounded-full bg-sky-soft px-2.5 py-1 text-xs text-sky">
                  {s}
                  <button type="button" onClick={() => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })} aria-label="حذف"><X className="size-3" /></button>
                </span>
              ))}
            </div>
          </Field>
          <Field label="مرفقات">
            <FileButton multiple label="رفع مرفقات" onUploaded={(f) => setForm((s) => ({ ...s, attachments: [...s.attachments, { url: f.url, name: f.name, size: f.size }] }))} />
            <div className="mt-2 space-y-1.5">
              {form.attachments.map((a, i) => (
                <div key={a.url} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
                  <Paperclip className="size-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{a.name}</span>
                  <span className="text-xs text-muted">{formatBytes(a.size)}</span>
                  <button type="button" onClick={() => setForm({ ...form, attachments: form.attachments.filter((_, j) => j !== i) })} className="text-muted hover:text-coral" aria-label="حذف"><X className="size-4" /></button>
                </div>
              ))}
            </div>
          </Field>
          <Switch checked={form.isPublished} onChange={(v) => setForm({ ...form, isPublished: v })} label="منشورة" description="المسودات لا تظهر للطلاب" />
          <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
            <Button type="submit" loading={saving}>
              <Save className="size-4" /> {task ? "حفظ" : "إنشاء المهمة"}
            </Button>
            {task && (
              <Button type="button" variant="ghost" className="text-coral" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> حذف
              </Button>
            )}
          </div>
        </form>
        </div>

        {task && (
          <div className="space-y-6">
            <AssignPanel taskId={task.id} students={students} assigned={assigned} />
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
              <h3 className="mb-3 font-semibold">التسليمات ({formatNumber(submissions.length)})</h3>
              {submissions.length === 0 ? (
                <p className="text-sm text-muted">لا تسليمات بعد.</p>
              ) : (
                <div className="space-y-1">
                  {submissions.map((s) => (
                    <Link key={s.id} href={`/admin/submissions/${s.id}`} className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-surface-2">
                      <Avatar name={s.student.name} color={s.student.avatarColor} size={30} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{s.student.name}</div>
                        <div className="text-[11px] text-muted">{timeAgo(s.submittedAt)}</div>
                      </div>
                      <Badge tone={SUBMISSION_TONES[s.status]}>{SUBMISSION_STATUSES[s.status]}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        size="sm"
        title="حذف المهمة؟"
        description="ستُحذف كل التسليمات المرتبطة بها."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>إلغاء</Button>
            <Button variant="danger" onClick={remove}>حذف</Button>
          </>
        }
      >
        <p className="text-sm">{task?.title}</p>
      </Modal>
    </div>
  );
}
