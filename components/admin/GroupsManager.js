"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus, ShieldCheck, Users, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/client";
import { cn, formatNumber } from "@/lib/utils";

export const GROUP_COLORS = ["#7C5CFF", "#22C5A0", "#FFB547", "#FF6B81", "#38BDF8", "#F472B6", "#A78BFA", "#FB923C"];

export function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {GROUP_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn("size-8 rounded-full transition", value === c ? "ring-2 ring-offset-2 ring-offset-surface" : "hover:scale-110")}
          style={{ background: c, "--tw-ring-color": c }}
          aria-label={c}
        />
      ))}
    </div>
  );
}

function NewGroupModal({ open, onClose }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", color: GROUP_COLORS[0] });
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { id } = await api("/api/admin/groups", { method: "POST", body: form });
      toast.success("تم إنشاء الفصل — أضف طلابه الآن");
      router.push(`/admin/groups/${id}`);
    } catch (err) {
      toast.error(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="فصل جديد" description="مجموعة طلاب تتشارك الصلاحيات والإعلانات والتقارير.">
      <form onSubmit={save} className="space-y-4">
        <Field label="اسم الفصل" required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثل: فصل السبت — المبتدئين" required maxLength={80} autoFocus />
        </Field>
        <Field label="وصف (اختياري)">
          <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="موعد الحصة، العمر، المستوى…" />
        </Field>
        <Field as="div" label="اللون">
          <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={saving} disabled={!form.name.trim()}>
            إنشاء الفصل
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function GroupsManager({ groups, students }) {
  const [creating, setCreating] = useState(false);
  const byId = new Map(students.map((s) => [s.id, s]));
  const unassigned = students.filter((s) => !groups.some((g) => g.memberIds.includes(s.id))).length;

  return (
    <div>
      <PageHeader
        title="الفصول"
        subtitle="قسّم طلابك إلى فصول: افتح المحتوى للفصل كله دفعة واحدة، وأرسل إعلانًا لفصل بعينه، وتابع تقاريره وتحليلاته."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> فصل جديد
          </Button>
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="لا فصول بعد"
          description="أنشئ أول فصل (مثل «فصل السبت») وأضف طلابه، ثم افتح لهم الدورة مرة واحدة بدل كل طالب على حدة."
          action={<Button onClick={() => setCreating(true)}>فصل جديد</Button>}
        />
      ) : (
        <>
          {unassigned > 0 && (
            <p className="mb-4 rounded-2xl bg-amber-soft px-4 py-2.5 text-sm text-[#8a5300] dark:text-amber">
              {formatNumber(unassigned)} طالب ليسوا في أي فصل بعد.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => {
              const members = g.memberIds.map((id) => byId.get(id)).filter(Boolean);
              return (
                <Link
                  key={g.id}
                  href={`/admin/groups/${g.id}`}
                  className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: g.color }} />
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: g.color }}>
                      <UsersRound className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold group-hover:text-primary">{g.name}</h2>
                      {g.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{g.description}</p>}
                    </div>
                    <ArrowLeft className="mt-1 size-4 shrink-0 text-muted transition group-hover:-translate-x-1" />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex -space-x-2 space-x-reverse">
                      {members.slice(0, 5).map((m) => (
                        <Avatar key={m.id} name={m.name} color={m.avatarColor} avatar={m.avatar} size={30} className="ring-2 ring-surface" />
                      ))}
                      {members.length > 5 && (
                        <span className="grid size-[30px] place-items-center rounded-full bg-surface-2 text-[11px] font-semibold ring-2 ring-surface">+{members.length - 5}</span>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" /> {formatNumber(members.length)}
                      </span>
                      <span className="flex items-center gap-1" title="قواعد الصلاحيات">
                        <ShieldCheck className="size-3.5" /> {formatNumber(g.rules)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
      {creating && <NewGroupModal open onClose={() => setCreating(false)} />}
    </div>
  );
}
