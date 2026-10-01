"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flame, KeyRound, Search, ShieldCheck, UserPlus, Users, Wand2, Zap } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResourcePicker } from "./ResourcePicker";
import { api, toISO } from "@/lib/client";
import { cn, formatNumber, generatePassword, timeAgo } from "@/lib/utils";

const EMPTY = { name: "", username: "", password: "", birthYear: "", email: "", guardianContact: "", notes: "", aiEnabled: true, levelIds: [], avatarColor: "#7C5CFF", avatar: null };

function CreateStudentModal({ open, onClose, levels }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY, password: generatePassword(8) });
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/api/admin/students", { method: "POST", body: form });
      setCreated({ username: form.username.toLowerCase(), password: form.password, name: form.name });
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setCreated(null);
    setForm({ ...EMPTY, password: generatePassword(8) });
    onClose();
  }

  if (created) {
    return (
      <Modal open={open} onClose={close} title="تم إنشاء الحساب 🎉" size="sm" footer={<Button onClick={close}>تم</Button>}>
        <p className="text-sm text-muted">شارك بيانات الدخول مع {created.name}. لن تظهر كلمة المرور مرة أخرى.</p>
        <div className="mt-4 space-y-2 rounded-2xl bg-surface-2 p-4 font-mono text-sm" dir="ltr">
          <div>username: <b>{created.username}</b></div>
          <div>password: <b>{created.password}</b></div>
        </div>
        <Button
          variant="secondary"
          className="mt-3 w-full"
          onClick={() => navigator.clipboard.writeText(`وَمِيض — بيانات الدخول\nusername: ${created.username}\npassword: ${created.password}`).then(() => toast.success("تم النسخ"))}
        >
          نسخ البيانات
        </Button>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="طالب جديد"
      description="أنشئ حسابًا وافتح له المستويات المناسبة مباشرة."
      footer={
        <>
          <Button variant="ghost" onClick={close}>إلغاء</Button>
          <Button form="create-student" type="submit" loading={loading}>إنشاء الحساب</Button>
        </>
      }
    >
      <form id="create-student" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم الكامل" required className="sm:col-span-2">
          <Input value={form.name} onChange={set("name")} required />
        </Field>
        <Field label="الصورة الرمزية" className="sm:col-span-2">
          <AvatarPicker
            color={form.avatarColor}
            avatar={form.avatar}
            onChange={({ avatarColor, avatar }) => setForm({ ...form, avatarColor, avatar })}
          />
        </Field>
        <Field label="اسم المستخدم" required hint="أحرف إنجليزية وأرقام">
          <Input dir="ltr" value={form.username} onChange={set("username")} required pattern="[a-zA-Z0-9_.\-]{3,30}" />
        </Field>
        <Field label="كلمة المرور" required>
          <div className="flex gap-2">
            <Input dir="ltr" value={form.password} onChange={set("password")} required minLength={6} />
            <Button type="button" variant="secondary" size="icon" className="h-11 w-11" onClick={() => setForm({ ...form, password: generatePassword(8) })} title="توليد">
              <Wand2 className="size-4" />
            </Button>
          </div>
        </Field>
        <Field label="سنة الميلاد">
          <Input type="number" min={1950} max={2030} value={form.birthYear} onChange={set("birthYear")} placeholder="2012" />
        </Field>
        <Field label="البريد الإلكتروني (اختياري)">
          <Input type="email" dir="ltr" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="تواصل ولي الأمر" className="sm:col-span-2">
          <Input value={form.guardianContact} onChange={set("guardianContact")} placeholder="رقم هاتف أو بريد" />
        </Field>
        <Field label="افتح له المستويات" className="sm:col-span-2" hint="يمكنك ضبط الصلاحيات بدقة لاحقًا من صفحة الطالب">
          <div className="flex flex-wrap gap-2">
            {levels.map((l) => {
              const on = form.levelIds.includes(l.id);
              return (
                <button
                  type="button"
                  key={l.id}
                  onClick={() => setForm({ ...form, levelIds: on ? form.levelIds.filter((x) => x !== l.id) : [...form.levelIds, l.id] })}
                  className={cn("rounded-xl border px-3 py-2 text-sm transition", on ? "border-primary bg-primary-soft text-primary" : "border-line hover:bg-surface-2")}
                >
                  {l.title}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="ملاحظات" className="sm:col-span-2">
          <Textarea rows={2} value={form.notes} onChange={set("notes")} />
        </Field>
        <Switch className="sm:col-span-2" checked={form.aiEnabled} onChange={(v) => setForm({ ...form, aiEnabled: v })} label="تفعيل المساعد الذكي" description="يمكن للطالب استخدام ومضة AI" />
      </form>
    </Modal>
  );
}

function BulkAccessModal({ open, onClose, userIds, levels, tasks }) {
  const router = useRouter();
  const [resources, setResources] = useState([]);
  const [mode, setMode] = useState("ALLOW");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const res = await api("/api/admin/access/bulk", {
        method: "POST",
        body: { userIds, resources, mode, availableFrom: toISO(from), availableUntil: toISO(until) },
      });
      toast.success(`تم التطبيق على ${formatNumber(res.students)} طالب`);
      setResources([]);
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
      size="lg"
      title="تعيين المحتوى للطلاب"
      description={`${formatNumber(userIds.length)} طالب محدد`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={submit} loading={loading} disabled={!resources.length}>تطبيق</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["ALLOW", "فتح ✓", "border-mint bg-mint-soft text-mint"],
            ["DENY", "قفل ✗", "border-coral bg-coral-soft text-coral"],
            ["REMOVE", "إزالة القاعدة", "border-primary bg-primary-soft text-primary"],
          ].map(([v, label, cls]) => (
            <button key={v} type="button" onClick={() => setMode(v)} className={cn("rounded-xl border-2 py-2.5 text-sm font-medium transition", mode === v ? cls : "border-line text-muted")}>
              {label}
            </button>
          ))}
        </div>
        {mode === "ALLOW" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="يُفتح في (اختياري)" hint="اتركه فارغًا للفتح الآن">
              <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="يُغلق في (اختياري)">
              <Input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
            </Field>
          </div>
        )}
        <Field label="اختر المحتوى">
          <ResourcePicker levels={levels} tasks={tasks} value={resources} onChange={setResources} />
        </Field>
      </div>
    </Modal>
  );
}

export function StudentsManager({ students, levels, tasks, openNew }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState([]);
  const [createOpen, setCreateOpen] = useState(openNew);
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return students.filter(
      (s) =>
        (status === "all" || (status === "active" ? s.isActive : !s.isActive)) &&
        (!term || s.name.toLowerCase().includes(term) || s.username.includes(term))
    );
  }, [students, q, status]);

  const allSelected = filtered.length > 0 && filtered.every((s) => selected.includes(s.id));

  return (
    <div>
      <PageHeader
        title="الطلاب"
        subtitle={`${formatNumber(students.length)} طالب مسجّل`}
        action={
          <>
            {selected.length > 0 && (
              <Button variant="soft" onClick={() => setBulkOpen(true)}>
                <ShieldCheck className="size-4" /> تعيين محتوى ({formatNumber(selected.length)})
              </Button>
            )}
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="size-4" /> طالب جديد
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input className="ps-10" placeholder="ابحث بالاسم أو اسم المستخدم" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select className="sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">الكل</option>
          <option value="active">نشط</option>
          <option value="inactive">موقوف</option>
        </Select>
      </div>

      {students.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد طلاب بعد" description="أنشئ أول حساب طالب وابدأ الرحلة." action={<Button onClick={() => setCreateOpen(true)}>طالب جديد</Button>} />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
          <div className="hidden grid-cols-[40px_1.6fr_1fr_1fr_1fr_1fr] items-center gap-3 border-b border-line bg-surface-2/50 px-4 py-3 text-xs font-medium text-muted md:grid">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => setSelected(e.target.checked ? filtered.map((s) => s.id) : [])}
              className="size-4 accent-[var(--primary)]"
              aria-label="تحديد الكل"
            />
            <span>الطالب</span>
            <span>الرتبة والنقاط</span>
            <span>التقدّم</span>
            <span>الصلاحيات</span>
            <span>آخر دخول</span>
          </div>
          <div className="divide-y divide-line">
            {filtered.map((s) => (
              <div key={s.id} className="grid grid-cols-[32px_1fr] items-center gap-3 px-4 py-3 transition hover:bg-surface-2/40 md:grid-cols-[40px_1.6fr_1fr_1fr_1fr_1fr]">
                <input
                  type="checkbox"
                  checked={selected.includes(s.id)}
                  onChange={(e) => setSelected(e.target.checked ? [...selected, s.id] : selected.filter((x) => x !== s.id))}
                  className="size-4 accent-[var(--primary)]"
                  aria-label={`تحديد ${s.name}`}
                />
                <Link href={`/admin/students/${s.id}`} className="flex min-w-0 items-center gap-3">
                  <Avatar name={s.name} color={s.avatarColor} avatar={s.avatar} size={40} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 truncate font-medium">
                      {s.name}
                      {!s.isActive && <Badge tone="coral">موقوف</Badge>}
                    </div>
                    <div className="truncate text-xs text-muted" dir="ltr">@{s.username}</div>
                  </div>
                </Link>
                <div className="col-start-2 flex flex-wrap items-center gap-2 text-sm md:col-start-auto">
                  <Badge tone="primary">{s.rank}</Badge>
                  <span className="flex items-center gap-0.5 text-muted"><Zap className="size-3.5" />{formatNumber(s.xp)}</span>
                  {s.streak > 0 && <span className="flex items-center gap-0.5 text-amber"><Flame className="size-3.5" />{formatNumber(s.streak)}</span>}
                </div>
                <div className="col-start-2 text-sm text-muted md:col-start-auto">{formatNumber(s.lessonsDone)} درس مكتمل</div>
                <div className="col-start-2 text-sm md:col-start-auto">
                  {s.rules ? <span className="flex items-center gap-1 text-muted"><KeyRound className="size-3.5" /> {formatNumber(s.rules)} قاعدة</span> : <Badge tone="amber">لا محتوى مفتوح</Badge>}
                </div>
                <div className="col-start-2 text-xs text-muted md:col-start-auto">{s.lastLoginAt ? timeAgo(s.lastLoginAt) : "لم يدخل بعد"}</div>
              </div>
            ))}
            {filtered.length === 0 && <p className="p-6 text-center text-sm text-muted">لا نتائج مطابقة.</p>}
          </div>
        </div>
      )}

      <CreateStudentModal open={createOpen} onClose={() => setCreateOpen(false)} levels={levels} />
      <BulkAccessModal open={bulkOpen} onClose={() => setBulkOpen(false)} userIds={selected} levels={levels} tasks={tasks} />
    </div>
  );
}
