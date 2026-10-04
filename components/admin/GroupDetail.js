"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, ChartColumn, FileText, Megaphone, Save, Search, Settings, ShieldCheck, Trash2, Users, UsersRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { AccessEditor } from "./AccessEditor";
import { ColorPicker } from "./GroupsManager";
import { api } from "@/lib/client";
import { cn, formatNumber } from "@/lib/utils";

function MembersTab({ group, students }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set(group.memberIds));
  const [q, setQ] = useState("");
  const [onlyMembers, setOnlyMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = selected.size !== group.memberIds.length || group.memberIds.some((id) => !selected.has(id));

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return students.filter((s) => (!onlyMembers || selected.has(s.id)) && (!t || s.name.toLowerCase().includes(t) || s.username.includes(t)));
  }, [students, q, onlyMembers, selected]);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function save() {
    setSaving(true);
    try {
      const res = await api(`/api/admin/groups/${group.id}/members`, { method: "PUT", body: { userIds: [...selected] } });
      toast.success(`تم الحفظ: ${formatNumber(res.total)} طالب في الفصل${res.added ? ` (أُضيف ${formatNumber(res.added)} ووصلهم إشعار)` : ""}`);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input className="ps-10" placeholder="ابحث عن طالب" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant={onlyMembers ? "soft" : "ghost"} size="sm" onClick={() => setOnlyMembers((v) => !v)}>
            <Users className="size-4" /> الأعضاء فقط ({formatNumber(selected.size)})
          </Button>
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>
            <Save className="size-4" /> حفظ
          </Button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s) => {
          const on = selected.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={cn("flex items-center gap-3 rounded-2xl border p-3 text-start transition", on ? "border-primary/40 bg-primary-soft/50" : "border-line bg-surface hover:bg-surface-2")}
            >
              <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border-2 text-[11px] text-white transition", on ? "border-primary bg-primary" : "border-line")}>{on && "✓"}</span>
              <Avatar name={s.name} color={s.avatarColor} avatar={s.avatar} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{s.name}</span>
                <span className="block truncate text-xs text-muted">{s.otherGroups.length ? s.otherGroups.join("، ") : `@${s.username}`}</span>
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted">لا يوجد طلاب مطابقون.</p>}
      </div>
    </div>
  );
}

function SettingsTab({ group }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: group.name, description: group.description ?? "", color: group.color });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/admin/groups/${group.id}`, { method: "PATCH", body: form });
      toast.success("تم الحفظ");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api(`/api/admin/groups/${group.id}`, { method: "DELETE" });
      toast.success("تم حذف الفصل");
      router.replace("/admin/groups");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={save} className="space-y-4 rounded-3xl border border-line bg-surface p-5 lg:col-span-2">
        <Field label="اسم الفصل" required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} />
        </Field>
        <Field label="الوصف">
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field as="div" label="اللون">
          <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
        </Field>
        <Button type="submit" loading={saving}>
          حفظ التغييرات
        </Button>
      </form>
      <div className="self-start rounded-3xl border border-coral/30 bg-coral-soft/40 p-5">
        <div className="font-semibold text-coral">حذف الفصل</div>
        <p className="mt-1 text-sm text-muted">يفقد الطلاب ما كانوا يرثونه من صلاحيات الفصل. صلاحياتهم الخاصة وتقدّمهم لا يتأثران.</p>
        <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirm(true)}>
          <Trash2 className="size-4" /> حذف الفصل
        </Button>
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        size="sm"
        title="حذف الفصل؟"
        description={`سيُحذف «${group.name}» وقواعد صلاحياته.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={remove}>
              حذف نهائي
            </Button>
          </>
        }
      />
    </div>
  );
}

export function GroupDetail({ group, students, levels, tasks, rules }) {
  const [tab, setTab] = useState("members");
  const memberCount = group.memberIds.length;

  return (
    <div className="space-y-6">
      <Link href="/admin/groups" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowRight className="size-4" /> الفصول
      </Link>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl border border-line bg-surface p-5 shadow-card">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-white" style={{ background: group.color }}>
          <UsersRound className="size-7" />
        </span>
        <div className="min-w-0 flex-1 basis-48">
          <h1 className="text-xl font-bold sm:text-2xl">{group.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {formatNumber(memberCount)} طالب · {formatNumber(rules.length)} قاعدة صلاحية
            {group.description && ` · ${group.description}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href={`/admin/notifications?group=${group.id}`} variant="soft" size="sm">
            <Megaphone className="size-4" /> إعلان للفصل
          </Button>
          <Button href={`/admin/analytics?group=${group.id}`} variant="secondary" size="sm">
            <ChartColumn className="size-4" /> التحليلات
          </Button>
          <Button href={`/admin/reports?group=${group.id}`} variant="secondary" size="sm">
            <FileText className="size-4" /> تقارير الأهل
          </Button>
        </div>
      </div>

      <Tabs
        layoutId="group-tabs"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "members", label: "الطلاب", icon: Users, count: memberCount || null },
          { value: "access", label: "صلاحيات الفصل", icon: ShieldCheck, count: rules.length || null },
          { value: "settings", label: "الإعدادات", icon: Settings },
        ]}
      />

      {tab === "members" && <MembersTab group={group} students={students} />}
      {tab === "access" && <AccessEditor saveUrl={`/api/admin/groups/${group.id}/access`} audience="group" levels={levels} tasks={tasks} initialRules={rules} />}
      {tab === "settings" && <SettingsTab group={group} />}
    </div>
  );
}
