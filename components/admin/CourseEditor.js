"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowRight, ArrowUp, Check, CircleHelp, Pencil, Plus, Trash2, Users, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { ColorPicker, IconPicker } from "./Pickers";
import { AIButton } from "./AIKit";
import { AIOutlineModal } from "./AIOutlineModal";
import { api } from "@/lib/client";
import { COURSE_DIFFICULTIES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

function ModuleCard({ mod, index, count, onMove, courseId }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(mod.title);
  const [newLesson, setNewLesson] = useState("");
  const [busy, setBusy] = useState(false);

  async function rename() {
    try {
      await api(`/api/admin/modules/${mod.id}`, { method: "PATCH", body: { title } });
      setEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove() {
    if (!window.confirm(`حذف الوحدة "${mod.title}" وكل دروسها؟`)) return;
    try {
      await api(`/api/admin/modules/${mod.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function addLesson(e) {
    e.preventDefault();
    if (!newLesson.trim()) return;
    setBusy(true);
    try {
      const res = await api("/api/admin/lessons", { method: "POST", body: { moduleId: mod.id, title: newLesson } });
      router.push(`/admin/lessons/${res.id}`);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  async function moveLesson(i, dir) {
    const ids = mod.lessons.map((l) => l.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await api("/api/admin/reorder", { method: "POST", body: { kind: "lesson", ids } }).catch((err) => toast.error(err.message));
    router.refresh();
  }

  async function removeLesson(lesson) {
    if (!window.confirm(`حذف الدرس "${lesson.title}"؟`)) return;
    try {
      await api(`/api/admin/lessons/${lesson.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <section className="rounded-3xl border border-line bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-line p-4">
        <span className="grid size-8 place-items-center rounded-lg bg-surface-2 text-sm font-bold text-muted">{formatNumber(index + 1)}</span>
        {editing ? (
          <div className="flex flex-1 gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9" autoFocus />
            <Button size="icon-sm" onClick={rename} aria-label="حفظ"><Check className="size-4" /></Button>
            <Button size="icon-sm" variant="ghost" onClick={() => { setEditing(false); setTitle(mod.title); }} aria-label="إلغاء"><X className="size-4" /></Button>
          </div>
        ) : (
          <h3 className="flex-1 font-semibold">{mod.title}</h3>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label="أعلى"><ArrowUp className="size-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => onMove(index, 1)} disabled={index === count - 1} aria-label="أسفل"><ArrowDown className="size-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label="إعادة تسمية"><Pencil className="size-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={remove} aria-label="حذف"><Trash2 className="size-4 text-coral" /></Button>
      </div>
      <div className="divide-y divide-line">
        {mod.lessons.map((lesson, i) => (
          <div key={lesson.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex flex-col">
              <button onClick={() => moveLesson(i, -1)} disabled={i === 0} className="text-muted hover:text-fg disabled:opacity-30" aria-label="أعلى"><ArrowUp className="size-3.5" /></button>
              <button onClick={() => moveLesson(i, 1)} disabled={i === mod.lessons.length - 1} className="text-muted hover:text-fg disabled:opacity-30" aria-label="أسفل"><ArrowDown className="size-3.5" /></button>
            </div>
            <Link href={`/admin/lessons/${lesson.id}`} className="min-w-0 flex-1">
              <div className="truncate font-medium hover:text-primary">{lesson.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                {lesson.isPublished ? <Badge tone="mint">منشور</Badge> : <Badge tone="amber">مسودة</Badge>}
                <span className="flex items-center gap-0.5"><Zap className="size-3" /> {formatNumber(lesson.xpReward)}</span>
                {lesson.quiz > 0 && <span className="flex items-center gap-0.5"><CircleHelp className="size-3" /> {formatNumber(lesson.quiz)} أسئلة</span>}
                <span className="flex items-center gap-0.5"><Users className="size-3" /> {formatNumber(lesson.completions)} أكملوه</span>
              </div>
            </Link>
            <Button href={`/admin/lessons/${lesson.id}`} variant="secondary" size="xs"><Pencil className="size-3.5" /> تحرير</Button>
            <Button variant="ghost" size="icon-sm" onClick={() => removeLesson(lesson)} aria-label="حذف"><Trash2 className="size-4 text-coral" /></Button>
          </div>
        ))}
        <form onSubmit={addLesson} className="flex gap-2 p-3">
          <Input className="h-10" placeholder="عنوان درس جديد…" value={newLesson} onChange={(e) => setNewLesson(e.target.value)} />
          <Button type="submit" size="sm" className="h-10" loading={busy} disabled={!newLesson.trim()}>
            <Plus className="size-4" /> درس
          </Button>
        </form>
      </div>
    </section>
  );
}

export function CourseEditor({ course, modules, levels }) {
  const router = useRouter();
  const [form, setForm] = useState(course);
  const [saving, setSaving] = useState(false);
  const [newModule, setNewModule] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);

  async function save(e) {
    e?.preventDefault();
    setSaving(true);
    try {
      const { id, ...body } = form;
      await api(`/api/admin/courses/${course.id}`, { method: "PATCH", body });
      toast.success("تم حفظ الدورة");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addModule(e) {
    e.preventDefault();
    try {
      await api("/api/admin/modules", { method: "POST", body: { courseId: course.id, title: newModule } });
      setNewModule("");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function moveModule(i, dir) {
    const ids = modules.map((m) => m.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await api("/api/admin/reorder", { method: "POST", body: { kind: "module", ids } }).catch((err) => toast.error(err.message));
    router.refresh();
  }

  async function removeCourse() {
    try {
      await api(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      toast.success("تم حذف الدورة");
      router.replace("/admin/curriculum");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/curriculum" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowRight className="size-4" /> المسار والدورات
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <div className="grid size-14 place-items-center rounded-2xl text-white" style={{ background: form.color }}>
          <Icon name={form.icon} className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <div className="mt-1 flex gap-2">
            {course.isPublished ? <Badge tone="mint">منشورة</Badge> : <Badge tone="amber">مسودة — لا يراها الطلاب</Badge>}
          </div>
        </div>
        <AIButton onClick={() => setOutlineOpen(true)}>اقترح خطة الدورة</AIButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {modules.map((m, i) => (
            <ModuleCard key={m.id} mod={m} index={i} count={modules.length} onMove={moveModule} courseId={course.id} />
          ))}
          <form onSubmit={addModule} className="flex gap-2 rounded-3xl border border-dashed border-line p-3">
            <Input placeholder="عنوان وحدة جديدة…" value={newModule} onChange={(e) => setNewModule(e.target.value)} />
            <Button type="submit" variant="soft" disabled={!newModule.trim()}>
              <Plus className="size-4" /> وحدة
            </Button>
          </form>
        </div>

        <form onSubmit={save} className="space-y-4 self-start rounded-3xl border border-line bg-surface p-5 shadow-card lg:sticky lg:top-20">
          <h2 className="font-semibold">إعدادات الدورة</h2>
          <Field label="العنوان">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="الوصف">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="المستوى">
              <Select value={form.levelId} onChange={(e) => setForm({ ...form, levelId: e.target.value })}>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="الصعوبة">
              <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                {Object.entries(COURSE_DIFFICULTIES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="اللون">
            <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
          </Field>
          <Field label="الأيقونة">
            <IconPicker value={form.icon} color={form.color} onChange={(icon) => setForm({ ...form, icon })} />
          </Field>
          <Switch checked={form.sequential} onChange={(v) => setForm({ ...form, sequential: v })} label="تعلّم متسلسل" description="لا يُفتح الدرس التالي إلا بعد إكمال السابق" />
          <Switch checked={form.isPublished} onChange={(v) => setForm({ ...form, isPublished: v })} label="منشورة" description="تظهر للطلاب الذين لديهم صلاحية" />
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button type="submit" loading={saving}>حفظ</Button>
            <Button type="button" variant="ghost" className="text-coral" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" /> حذف الدورة
            </Button>
          </div>
        </form>
      </div>

      {outlineOpen && <AIOutlineModal open onClose={() => setOutlineOpen(false)} course={course} />}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        size="sm"
        title="حذف الدورة؟"
        description="سيتم حذف كل الوحدات والدروس وتقدّم الطلاب فيها."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>إلغاء</Button>
            <Button variant="danger" onClick={removeCourse}>حذف نهائي</Button>
          </>
        }
      >
        <p className="text-sm">{course.title}</p>
      </Modal>
    </div>
  );
}
