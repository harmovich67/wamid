"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { AIButton, AIWorking, AudienceSelect } from "./AIKit";
import { api } from "@/lib/client";
import { CODE_LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DEPTHS = [
  { value: "short", label: "قصير", hint: "5-8 دقائق" },
  { value: "standard", label: "متوسط", hint: "10-15 دقيقة" },
  { value: "deep", label: "معمّق", hint: "20-30 دقيقة" },
];

const STEPS = ["يفهم الموضوع ويخطط للدرس…", "يكتب الشرح والتشبيهات…", "يجهّز أمثلة الكود…", "يضيف النصائح والأخطاء الشائعة…", "يكتب أسئلة الاختبار…", "يراجع كل شيء…"];

/** Lets the teacher describe a lesson and have Gemini fill the editor (nothing is saved yet). */
export function AILessonModal({ open, onClose, lesson, hasContent, onApply }) {
  const [form, setForm] = useState({
    topic: [lesson.title, lesson.summary].filter(Boolean).join(" — "),
    audience: "teens",
    depth: "standard",
    language: "python",
    quizCount: 3,
    notes: "",
    replace: true,
    useTitle: false,
  });
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const { replace, useTitle, ...body } = form;
      const res = await api("/api/admin/ai/generate/lesson", { method: "POST", body: { ...body, lessonId: lesson.id } });
      onApply(res, { replace: replace || !hasContent, useTitle });
      toast.success("تم إنشاء الدرس ✨ راجعه ثم اضغط حفظ");
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="lg"
      title="إنشاء الدرس بالذكاء الاصطناعي"
      description="صِف الموضوع، وسيكتب Gemini الشرح والأمثلة والاختبار داخل المحرر لتراجعه قبل الحفظ."
      footer={
        !loading && (
          <>
            <Button variant="ghost" onClick={onClose}>إلغاء</Button>
            <AIButton onClick={generate} disabled={form.topic.trim().length < 3}>إنشاء الدرس</AIButton>
          </>
        )
      }
    >
      {loading ? (
        <AIWorking steps={STEPS} />
      ) : (
        <div className="space-y-4">
          <Field label="موضوع الدرس" hint="كلما كان أوضح كانت النتيجة أفضل — مثال: الحلقة for في بايثون مع range">
            <Textarea rows={2} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="عمر الطلاب">
              <AudienceSelect value={form.audience} onChange={(audience) => setForm({ ...form, audience })} />
            </Field>
            <Field label="لغة الأمثلة">
              <Select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                {CODE_LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l === "plaintext" ? "بدون كود" : l}</option>
                ))}
              </Select>
            </Field>
            <Field label="أسئلة الاختبار">
              <Input type="number" min={0} max={8} value={form.quizCount} onChange={(e) => setForm({ ...form, quizCount: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="طول الدرس">
            <div className="grid grid-cols-3 gap-2">
              {DEPTHS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setForm({ ...form, depth: d.value })}
                  className={cn("rounded-xl border-2 p-2.5 text-center transition", form.depth === d.value ? "border-primary bg-primary-soft" : "border-line hover:bg-surface-2")}
                >
                  <div className="text-sm font-semibold">{d.label}</div>
                  <div className="text-xs text-muted">{d.hint}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="ملاحظات إضافية (اختياري)">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="مثلًا: استخدم أمثلة من كرة القدم، ركّز على الأخطاء الشائعة" />
          </Field>
          <div className="space-y-3 rounded-2xl bg-surface-2/60 p-4">
            {hasContent && (
              <Switch checked={form.replace} onChange={(v) => setForm({ ...form, replace: v })} label="استبدال المحتوى الحالي" description="عند الإيقاف يُضاف المحتوى الجديد بعد الموجود" />
            )}
            <Switch checked={form.useTitle} onChange={(v) => setForm({ ...form, useTitle: v })} label="استخدام العنوان المقترح" description="يستبدل عنوان الدرس بعنوان يقترحه الذكاء الاصطناعي" />
          </div>
        </div>
      )}
    </Modal>
  );
}
