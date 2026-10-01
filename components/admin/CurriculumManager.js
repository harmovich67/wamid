"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Map, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ColorPicker, IconPicker } from "./Pickers";
import { api } from "@/lib/client";
import { COURSE_DIFFICULTIES, DIFFICULTY_TONES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

function LevelModal({ open, onClose, level }) {
  const router = useRouter();
  const [form, setForm] = useState(level ?? { title: "", subtitle: "", description: "", color: "#7C5CFF", icon: "Sparkles" });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { title, subtitle, description, color, icon } = form;
      const body = { title, subtitle, description, color, icon };
      if (level?.id) await api(`/api/admin/levels/${level.id}`, { method: "PATCH", body });
      else await api("/api/admin/levels", { method: "POST", body });
      toast.success("تم الحفظ");
      onClose();
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={level?.id ? "تعديل المستوى" : "مستوى جديد"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button form="level-form" type="submit" loading={loading}>حفظ</Button>
        </>
      }
    >
      <form id="level-form" onSubmit={submit} className="space-y-4">
        <Field label="العنوان" required>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="أساسيات البرمجة" />
        </Field>
        <Field label="العنوان الفرعي">
          <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="كيف تفكر كمبرمج" />
        </Field>
        <Field label="الوصف">
          <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="اللون">
          <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
        </Field>
        <Field label="الأيقونة">
          <IconPicker value={form.icon} color={form.color} onChange={(icon) => setForm({ ...form, icon })} />
        </Field>
      </form>
    </Modal>
  );
}

function CourseModal({ open, onClose, levels, levelId }) {
  const router = useRouter();
  const [form, setForm] = useState({ levelId, title: "", description: "", icon: "BookOpen", color: "#7C5CFF", difficulty: "BEGINNER", sequential: true, isPublished: false });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api("/api/admin/courses", { method: "POST", body: { ...form, levelId: form.levelId || levelId } });
      toast.success("تم إنشاء الدورة");
      router.push(`/admin/courses/${res.id}`);
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="دورة جديدة"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button form="course-form" type="submit" loading={loading}>إنشاء</Button>
        </>
      }
    >
      <form id="course-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="المستوى">
            <Select value={form.levelId || levelId} onChange={(e) => setForm({ ...form, levelId: e.target.value })}>
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
        <Field label="عنوان الدورة" required>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Python للمبتدئين" />
        </Field>
        <Field label="الوصف">
          <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="اللون">
          <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
        </Field>
        <Field label="الأيقونة">
          <IconPicker value={form.icon} color={form.color} onChange={(icon) => setForm({ ...form, icon })} />
        </Field>
      </form>
    </Modal>
  );
}

export function CurriculumManager({ levels }) {
  const router = useRouter();
  const [levelModal, setLevelModal] = useState(null);
  const [courseModal, setCourseModal] = useState(null);
  const [confirm, setConfirm] = useState(null);

  async function move(kind, list, index, dir) {
    const ids = list.map((x) => x.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    try {
      await api("/api/admin/reorder", { method: "POST", body: { kind, ids } });
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function removeLevel() {
    try {
      await api(`/api/admin/levels/${confirm.id}`, { method: "DELETE" });
      toast.success("تم حذف المستوى");
      setConfirm(null);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="المسار والدورات"
        subtitle="صمّم خريطة التعلّم: مستويات متتابعة، ولكل مستوى دوراته."
        action={
          <Button onClick={() => setLevelModal({})}>
            <Plus className="size-4" /> مستوى جديد
          </Button>
        }
      />

      {levels.length === 0 ? (
        <EmptyState icon={Map} title="ابدأ ببناء المسار" description="أضف أول مستوى، مثل: أساسيات البرمجة." action={<Button onClick={() => setLevelModal({})}>مستوى جديد</Button>} />
      ) : (
        <div className="space-y-6">
          {levels.map((level, li) => (
            <section key={level.id} className="rounded-3xl border border-line bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl text-white" style={{ background: level.color }}>
                  <Icon name={level.icon} className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium" style={{ color: level.color }}>المستوى {formatNumber(li + 1)}</div>
                  <h2 className="text-lg font-bold">{level.title}</h2>
                  {level.subtitle && <p className="text-sm text-muted">{level.subtitle}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => move("level", levels, li, -1)} disabled={li === 0} aria-label="أعلى"><ArrowUp className="size-4" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => move("level", levels, li, 1)} disabled={li === levels.length - 1} aria-label="أسفل"><ArrowDown className="size-4" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setLevelModal(level)} aria-label="تعديل"><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setConfirm(level)} aria-label="حذف"><Trash2 className="size-4 text-coral" /></Button>
                  <Button variant="soft" size="sm" onClick={() => setCourseModal(level.id)}>
                    <Plus className="size-4" /> دورة
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {level.courses.map((course, ci) => (
                  <div key={course.id} className="group relative rounded-2xl border border-line p-4 transition hover:border-primary/40 hover:shadow-card">
                    <Link href={`/admin/courses/${course.id}`} className="absolute inset-0" aria-label={course.title} />
                    <div className="flex items-start gap-3">
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: course.color }}>
                        <Icon name={course.icon} className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{course.title}</div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge tone={DIFFICULTY_TONES[course.difficulty]}>{COURSE_DIFFICULTIES[course.difficulty]}</Badge>
                          {!course.isPublished && <Badge tone="amber">مسودة</Badge>}
                        </div>
                      </div>
                      <div className="relative z-10 flex flex-col transition sm:opacity-0 sm:group-hover:opacity-100">
                        <button onClick={() => move("course", level.courses, ci, -1)} className="text-muted hover:text-fg" aria-label="أعلى"><ArrowUp className="size-4" /></button>
                        <button onClick={() => move("course", level.courses, ci, 1)} className="text-muted hover:text-fg" aria-label="أسفل"><ArrowDown className="size-4" /></button>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted">
                      {formatNumber(course.modules)} وحدات · {formatNumber(course.lessons)} درس
                    </div>
                  </div>
                ))}
                {level.courses.length === 0 && (
                  <button onClick={() => setCourseModal(level.id)} className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted hover:border-primary/40 hover:text-primary">
                    + أضف أول دورة لهذا المستوى
                  </button>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {levelModal && <LevelModal open onClose={() => setLevelModal(null)} level={levelModal.id ? levelModal : null} />}
      {courseModal && <CourseModal open onClose={() => setCourseModal(null)} levels={levels} levelId={courseModal} />}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        size="sm"
        title="حذف المستوى؟"
        description="سيتم حذف كل الدورات والدروس داخله."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>إلغاء</Button>
            <Button variant="danger" onClick={removeLevel}>حذف</Button>
          </>
        }
      >
        <p className="text-sm">
          المستوى: <b>{confirm?.title}</b> — {formatNumber(confirm?.courses.length ?? 0)} دورات
        </p>
      </Modal>
    </div>
  );
}
