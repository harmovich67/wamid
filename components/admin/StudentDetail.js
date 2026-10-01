"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, BookOpenCheck, ClipboardCheck, Flame, GraduationCap, KeyRound, LayoutDashboard, Medal, Settings, ShieldCheck, Trash2, Wand2, Zap } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/Progress";
import { StatCard } from "@/components/ui/StatCard";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { AccessEditor } from "./AccessEditor";
import { api } from "@/lib/client";
import { SUBMISSION_STATUSES, SUBMISSION_TONES, TASK_TYPES } from "@/lib/constants";
import { formatDate, formatNumber, generatePassword, timeAgo } from "@/lib/utils";

function SettingsTab({ student }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: student.name,
    username: student.username,
    email: student.email,
    birthYear: student.birthYear,
    guardianContact: student.guardianContact,
    notes: student.notes,
    aiEnabled: student.aiEnabled,
    isActive: student.isActive,
    password: "",
    avatarColor: student.avatarColor,
    avatar: student.avatar,
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/admin/students/${student.id}`, { method: "PATCH", body: form });
      toast.success(form.password ? `تم الحفظ. كلمة المرور الجديدة: ${form.password}` : "تم الحفظ", { duration: form.password ? 15000 : 4000 });
      setForm((f) => ({ ...f, password: "" }));
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api(`/api/admin/students/${student.id}`, { method: "DELETE" });
      toast.success("تم حذف الطالب");
      router.replace("/admin/students");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-3">
      <div className="grid gap-4 rounded-3xl border border-line bg-surface p-6 sm:grid-cols-2 lg:col-span-2">
        <Field label="الاسم" required className="sm:col-span-2">
          <Input value={form.name} onChange={set("name")} required />
        </Field>
        <Field label="الصورة الرمزية" className="sm:col-span-2">
          <AvatarPicker
            color={form.avatarColor}
            avatar={form.avatar}
            onChange={({ avatarColor, avatar }) => setForm({ ...form, avatarColor, avatar })}
          />
        </Field>
        <Field label="اسم المستخدم">
          <Input dir="ltr" value={form.username} onChange={set("username")} />
        </Field>
        <Field label="البريد الإلكتروني">
          <Input dir="ltr" type="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="سنة الميلاد">
          <Input type="number" value={form.birthYear} onChange={set("birthYear")} />
        </Field>
        <Field label="تواصل ولي الأمر">
          <Input value={form.guardianContact} onChange={set("guardianContact")} />
        </Field>
        <Field label="ملاحظات المعلّم" className="sm:col-span-2">
          <Textarea rows={3} value={form.notes} onChange={set("notes")} />
        </Field>
        <Field label="إعادة تعيين كلمة المرور" hint="اتركه فارغًا لعدم التغيير" className="sm:col-span-2">
          <div className="flex gap-2">
            <Input dir="ltr" value={form.password} onChange={set("password")} placeholder="كلمة مرور جديدة" minLength={6} />
            <Button type="button" variant="secondary" onClick={() => setForm({ ...form, password: generatePassword(8) })}>
              <Wand2 className="size-4" /> توليد
            </Button>
          </div>
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving}>حفظ التغييرات</Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-4 rounded-3xl border border-line bg-surface p-6">
          <Switch checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="الحساب نشط" description="الحساب الموقوف لا يستطيع الدخول" />
          <Switch checked={form.aiEnabled} onChange={(v) => setForm({ ...form, aiEnabled: v })} label="المساعد الذكي" description="السماح باستخدام ومضة AI" />
        </div>
        <div className="rounded-3xl border border-coral/30 bg-coral-soft/40 p-6">
          <div className="font-semibold text-coral">منطقة الخطر</div>
          <p className="mt-1 text-sm text-muted">حذف الطالب يحذف تقدّمه وتسليماته نهائيًا.</p>
          <Button type="button" variant="danger" size="sm" className="mt-3" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" /> حذف الطالب
          </Button>
        </div>
      </div>
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        size="sm"
        title="حذف الطالب؟"
        description="لا يمكن التراجع عن هذا الإجراء."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>إلغاء</Button>
            <Button variant="danger" onClick={remove}>حذف نهائي</Button>
          </>
        }
      >
        <p className="text-sm">سيتم حذف حساب <b>{student.name}</b> وكل بياناته.</p>
      </Modal>
    </form>
  );
}

function AchievementsTab({ studentId, achievements, owned }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  async function toggle(a, has) {
    setBusy(a.id);
    try {
      await api("/api/admin/achievements/grant", { method: has ? "DELETE" : "POST", body: { userId: studentId, achievementId: a.id } });
      toast.success(has ? "تم سحب الوسام" : "تم منح الوسام 🏅");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {achievements.map((a) => {
        const has = owned.includes(a.id);
        return (
          <div key={a.id} className="flex flex-col items-center rounded-3xl border border-line bg-surface p-4 text-center">
            <div className="grid size-12 place-items-center rounded-2xl text-white" style={{ background: has ? a.color : "var(--line)" }}>
              <Icon name={a.icon} className="size-6" />
            </div>
            <div className="mt-2 text-sm font-medium">{a.title}</div>
            <Button size="xs" variant={has ? "ghost" : "soft"} className="mt-3" loading={busy === a.id} onClick={() => toggle(a, has)}>
              {has ? "سحب" : "منح"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export function StudentDetail({ student, stats, courses, levels, tasks, rules, submissions, achievements, owned }) {
  const [tab, setTab] = useState("overview");

  return (
    <div className="space-y-6">
      <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowRight className="size-4" /> الطلاب
      </Link>

      <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 shadow-card sm:flex-row sm:items-center">
        <Avatar name={student.name} color={student.avatarColor} avatar={student.avatar} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <Badge tone="primary">{student.rank}</Badge>
            {!student.isActive && <Badge tone="coral">موقوف</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span dir="ltr">@{student.username}</span>
            <span>انضم {formatDate(student.createdAt)}</span>
            <span>آخر دخول: {student.lastLoginAt ? timeAgo(student.lastLoginAt) : "لم يدخل بعد"}</span>
          </div>
        </div>
      </div>

      <Tabs
        layoutId="student-detail-tabs"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "نظرة عامة", icon: LayoutDashboard },
          { value: "access", label: "الصلاحيات", icon: ShieldCheck, count: rules.length || null },
          { value: "submissions", label: "التسليمات", icon: ClipboardCheck, count: submissions.length || null },
          { value: "achievements", label: "الأوسمة", icon: Medal },
          { value: "settings", label: "الإعدادات", icon: Settings },
        ]}
      />

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Zap} label="نقاط الخبرة" value={formatNumber(stats.xp)} />
            <StatCard icon={BookOpenCheck} label="دروس مكتملة" value={formatNumber(stats.lessonsCompleted)} tone="mint" />
            <StatCard icon={ClipboardCheck} label="مهام مقبولة" value={formatNumber(stats.tasksApproved)} tone="sky" />
            <StatCard icon={Flame} label="السلسلة الحالية" value={formatNumber(student.streak)} hint={`الأفضل: ${formatNumber(stats.streak)}`} tone="amber" />
          </div>
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="mb-4 font-semibold">التقدّم في الدورات</h2>
            {courses.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-muted">
                <KeyRound className="size-8" />
                لم يُفتح أي محتوى لهذا الطالب بعد.
                <Button size="sm" onClick={() => setTab("access")}>افتح محتوى</Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {courses.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-surface-2/60 p-3">
                    <div className="grid size-11 place-items-center rounded-xl text-white" style={{ background: c.color }}>
                      <Icon name={c.icon} className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{c.title}</span>
                        <span className="text-xs text-muted">{formatNumber(c.completed)}/{formatNumber(c.total)}</span>
                      </div>
                      <ProgressBar value={c.percent} color={c.color} size="sm" className="mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "access" && <AccessEditor studentId={student.id} levels={levels} tasks={tasks} initialRules={rules} />}

      {tab === "submissions" && (
        <div className="overflow-hidden rounded-3xl border border-line bg-surface">
          {submissions.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">لا تسليمات بعد.</p>
          ) : (
            <div className="divide-y divide-line">
              {submissions.map((s) => (
                <Link key={s.id} href={`/admin/submissions/${s.id}`} className="flex items-center gap-3 p-4 hover:bg-surface-2/50">
                  <GraduationCap className="size-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{s.task.title}</div>
                    <div className="text-xs text-muted">{TASK_TYPES[s.task.type]} · {timeAgo(s.submittedAt)}</div>
                  </div>
                  {s.grade != null && <span className="text-sm font-semibold">{formatNumber(s.grade)}/100</span>}
                  <Badge tone={SUBMISSION_TONES[s.status]}>{SUBMISSION_STATUSES[s.status]}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "achievements" && <AchievementsTab studentId={student.id} achievements={achievements} owned={owned} />}

      {tab === "settings" && <SettingsTab student={student} />}
    </div>
  );
}
