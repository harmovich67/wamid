"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Trophy, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ColorPicker, IconPicker } from "./Pickers";
import { api } from "@/lib/client";
import { ACHIEVEMENT_CRITERIA } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

const EMPTY = { key: "", title: "", description: "", icon: "Trophy", color: "#FFB547", criteria: "LESSONS_COMPLETED", threshold: 1, xpBonus: 10 };

function AchievementModal({ item, onClose }) {
  const router = useRouter();
  const [form, setForm] = useState(item ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (k, num) => (e) => setForm({ ...form, [k]: num ? Number(e.target.value) : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { id, earned, ...body } = form;
      if (item?.id) await api(`/api/admin/achievements/${item.id}`, { method: "PATCH", body });
      else await api("/api/admin/achievements", { method: "POST", body });
      toast.success("تم الحفظ");
      onClose();
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={item?.id ? "تعديل الوسام" : "وسام جديد"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button form="ach-form" type="submit" loading={saving}>حفظ</Button>
        </>
      }
    >
      <form id="ach-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="العنوان" required>
          <Input value={form.title} onChange={set("title")} required />
        </Field>
        <Field label="المعرّف" hint="بالإنجليزية، فريد" required>
          <Input dir="ltr" value={form.key} onChange={set("key")} required placeholder="first_lesson" />
        </Field>
        <Field label="الوصف" required className="sm:col-span-2">
          <Input value={form.description} onChange={set("description")} required />
        </Field>
        <Field label="شرط الحصول عليه">
          <Select value={form.criteria} onChange={set("criteria")}>
            {Object.entries(ACHIEVEMENT_CRITERIA).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </Field>
        <Field label="الحد المطلوب">
          <Input type="number" min={1} value={form.threshold} onChange={set("threshold", true)} disabled={form.criteria === "MANUAL"} />
        </Field>
        <Field label="نقاط إضافية (XP)">
          <Input type="number" min={0} value={form.xpBonus} onChange={set("xpBonus", true)} />
        </Field>
        <Field label="اللون" className="sm:col-span-2">
          <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
        </Field>
        <Field label="الأيقونة" className="sm:col-span-2">
          <IconPicker value={form.icon} color={form.color} onChange={(icon) => setForm({ ...form, icon })} />
        </Field>
      </form>
    </Modal>
  );
}

export function AchievementsManager({ items }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);

  async function remove(a) {
    if (!window.confirm(`حذف وسام "${a.title}"؟`)) return;
    try {
      await api(`/api/admin/achievements/${a.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="الإنجازات والأوسمة"
        subtitle="أوسمة تلقائية تُمنح عند تحقيق الشرط، وأخرى يدويّة تمنحها من صفحة الطالب."
        action={<Button onClick={() => setEditing({})}><Plus className="size-4" /> وسام جديد</Button>}
      />
      {items.length === 0 ? (
        <EmptyState icon={Trophy} title="لا أوسمة بعد" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-3xl border border-line bg-surface p-4 shadow-card">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: a.color }}>
                <Icon name={a.icon} className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{a.title}</div>
                <div className="text-sm text-muted">{a.description}</div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{ACHIEVEMENT_CRITERIA[a.criteria]}{a.criteria !== "MANUAL" && `: ${formatNumber(a.threshold)}`}</span>
                  {a.xpBonus > 0 && <span className="text-primary">+{formatNumber(a.xpBonus)} XP</span>}
                  <span className="flex items-center gap-1"><Users className="size-3" /> {formatNumber(a.earned)}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <Button variant="ghost" size="icon-sm" onClick={() => setEditing(a)} aria-label="تعديل"><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => remove(a)} aria-label="حذف"><Trash2 className="size-4 text-coral" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && <AchievementModal item={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </div>
  );
}
