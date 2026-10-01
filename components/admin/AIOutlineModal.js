"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { AIButton, AIWorking, AudienceSelect } from "./AIKit";
import { api } from "@/lib/client";

const STEPS = ["يحلل موضوع الدورة…", "يقسّمها إلى وحدات متدرجة…", "يرتّب الدروس من الأسهل للأصعب…", "يكتب ملخص كل درس…"];

/** Generates a course outline, lets the teacher prune/rename it, then adds it as draft lessons. */
export function AIOutlineModal({ open, onClose, course }) {
  const router = useRouter();
  const [form, setForm] = useState({
    topic: [course.title, course.description].filter(Boolean).join(" — "),
    audience: "teens",
    modules: 3,
    lessonsPerModule: 4,
    notes: "",
  });
  const [outline, setOutline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await api("/api/admin/ai/generate/outline", { method: "POST", body: { ...form, courseId: course.id } });
      setOutline(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    setSaving(true);
    try {
      const res = await api(`/api/admin/courses/${course.id}/outline`, { method: "POST", body: { modules: outline.modules } });
      if (!course.description && outline.description) {
        await api(`/api/admin/courses/${course.id}`, { method: "PATCH", body: { description: outline.description } }).catch(() => {});
      }
      toast.success(`أُضيفت ${res.modules} وحدات و${res.lessons} دروس كمسودات. افتح أي درس واضغط "إنشاء بالذكاء الاصطناعي" لكتابة محتواه.`, { duration: 8000 });
      onClose();
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const editModule = (mi, patch) => setOutline((o) => ({ ...o, modules: o.modules.map((m, i) => (i === mi ? { ...m, ...patch } : m)) }));
  const lessonCount = outline?.modules.reduce((s, m) => s + m.lessons.length, 0) ?? 0;

  return (
    <Modal
      open={open}
      onClose={loading || saving ? () => {} : onClose}
      size="lg"
      title="خطة الدورة بالذكاء الاصطناعي"
      description={outline ? "راجع الخطة: عدّل العناوين أو احذف ما لا تريده، ثم أضفها للدورة." : "صِف الدورة وسيقترح Gemini وحدات ودروسًا متدرجة."}
      footer={
        loading ? null : outline ? (
          <>
            <Button variant="ghost" onClick={() => setOutline(null)}>
              <RotateCcw className="size-4" /> إعادة التوليد
            </Button>
            <Button onClick={apply} loading={saving} disabled={!lessonCount}>
              إضافة {lessonCount} درسًا للدورة
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>إلغاء</Button>
            <AIButton onClick={generate} disabled={form.topic.trim().length < 3}>اقترح الخطة</AIButton>
          </>
        )
      }
    >
      {loading ? (
        <AIWorking steps={STEPS} />
      ) : outline ? (
        <div className="space-y-4">
          {outline.description && <p className="rounded-2xl bg-surface-2/60 p-3 text-sm text-muted">{outline.description}</p>}
          {outline.modules.map((m, mi) => (
            <div key={mi} className="rounded-2xl border border-line">
              <div className="flex items-center gap-2 border-b border-line p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-xs font-bold text-primary">{mi + 1}</span>
                <Input className="h-9 font-semibold" value={m.title} onChange={(e) => editModule(mi, { title: e.target.value })} />
                <button type="button" onClick={() => setOutline((o) => ({ ...o, modules: o.modules.filter((_, i) => i !== mi) }))} className="text-muted hover:text-coral" aria-label="حذف الوحدة">
                  <X className="size-4" />
                </button>
              </div>
              <ol className="space-y-1 p-2">
                {m.lessons.map((l, li) => (
                  <li key={li} className="flex items-start gap-2 rounded-xl p-2 hover:bg-surface-2/60">
                    <span className="mt-2 w-5 shrink-0 text-center text-xs text-muted">{li + 1}</span>
                    <div className="min-w-0 flex-1">
                      <input
                        value={l.title}
                        onChange={(e) => editModule(mi, { lessons: m.lessons.map((x, i) => (i === li ? { ...x, title: e.target.value } : x)) })}
                        className="w-full rounded-lg bg-transparent px-1 py-1 text-sm font-medium outline-none focus:bg-surface-2"
                      />
                      <p className="px-1 text-xs text-muted">{l.summary}</p>
                    </div>
                    <button type="button" onClick={() => editModule(mi, { lessons: m.lessons.filter((_, i) => i !== li) })} className="mt-1.5 text-muted hover:text-coral" aria-label="حذف الدرس">
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="عن ماذا الدورة؟">
            <Textarea rows={2} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="عمر الطلاب">
              <AudienceSelect value={form.audience} onChange={(audience) => setForm({ ...form, audience })} />
            </Field>
            <Field label="عدد الوحدات">
              <Input type="number" min={1} max={8} value={form.modules} onChange={(e) => setForm({ ...form, modules: Number(e.target.value) })} />
            </Field>
            <Field label="دروس لكل وحدة">
              <Input type="number" min={1} max={8} value={form.lessonsPerModule} onChange={(e) => setForm({ ...form, lessonsPerModule: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="ملاحظات (اختياري)">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="مثلًا: اختمها بمشروع لعبة صغيرة" />
          </Field>
        </div>
      )}
    </Modal>
  );
}
