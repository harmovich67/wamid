"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { api } from "@/lib/client";
import { cn, formatNumber } from "@/lib/utils";

export function ReviewForm({ id, initial, points, reviewed, aiAvailable }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const earned = form.status === "APPROVED" ? Math.round((points * (Number(form.grade) || 0)) / 100) : 0;

  async function draft() {
    setDrafting(true);
    try {
      const res = await api(`/api/admin/submissions/${id}/ai-feedback`, { method: "POST" });
      setForm((f) => ({ ...f, feedback: res.feedback, grade: res.grade ?? f.grade }));
      toast.success("تمت صياغة مسودة — راجعها قبل الإرسال");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDrafting(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/admin/submissions/${id}/review`, {
        method: "POST",
        body: { status: form.status, grade: form.grade === "" ? null : Number(form.grade), feedback: form.feedback },
      });
      toast.success("تم إرسال التقييم للطالب");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 self-start rounded-3xl border border-line bg-surface p-5 shadow-card lg:sticky lg:top-20">
      <h2 className="font-semibold">التقييم</h2>
      {reviewed && <p className="text-xs text-muted">{reviewed}</p>}
      <div className="grid grid-cols-2 gap-2">
        {[
          ["APPROVED", "قبول", CheckCircle2, "border-mint bg-mint-soft text-mint"],
          ["NEEDS_REVISION", "يحتاج تعديل", RotateCcw, "border-amber bg-amber-soft text-amber"],
        ].map(([v, label, Ico, cls]) => (
          <button key={v} type="button" onClick={() => setForm({ ...form, status: v })} className={cn("flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-sm font-medium transition", form.status === v ? cls : "border-line text-muted")}>
            <Ico className="size-4" /> {label}
          </button>
        ))}
      </div>
      <Field label="الدرجة (من 100)">
        <Input type="number" min={0} max={100} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
      </Field>
      <Field as="div" label="ملاحظاتك للطالب">
        <RichTextEditor
          ai
          minHeight={180}
          value={form.feedback}
          onChange={(feedback) => setForm((f) => ({ ...f, feedback }))}
          placeholder="ما أحسن فيه، ما يحتاج تحسينًا، وخطوته التالية…"
        />
      </Field>
      {aiAvailable && (
        <Button type="button" variant="soft" size="sm" onClick={draft} loading={drafting} className="w-full">
          {!drafting && <Sparkles className="size-4" />} صياغة مسودة بالذكاء الاصطناعي
        </Button>
      )}
      <div className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
        <span className="text-muted">سيحصل على</span>
        <span className="flex items-center gap-1 font-bold text-primary"><Zap className="size-4 fill-current" /> {formatNumber(earned)} XP</span>
      </div>
      <Button type="submit" className="w-full" loading={saving}>إرسال التقييم</Button>
    </form>
  );
}
