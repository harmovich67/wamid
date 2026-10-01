"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, Megaphone, MessageCircle, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/Progress";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { api } from "@/lib/client";
import { cn, formatNumber, percent, timeAgo } from "@/lib/utils";

export function BroadcastForm({ students, recent }) {
  const router = useRouter();
  const [form, setForm] = useState({ target: "all", userIds: [], title: "", body: "", link: "" });
  const [sending, setSending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function send(e) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api("/api/admin/notifications", { method: "POST", body: form });
      toast.success(`وصل الإعلان إلى ${formatNumber(res.count)} طالب 📣 — سيظهر في جرس الإشعارات عندهم خلال ثوانٍ`);
      setForm({ ...form, title: "", body: "", link: "" });
      setFormKey((k) => k + 1);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="الإعلانات"
        subtitle="أرسل إعلانًا لكل الطلاب أو لطلاب محددين. يصلهم فورًا في جرس الإشعارات مع صوت تنبيه، ويمكنهم التفاعل بالإيموجي والرد عليك."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <form onSubmit={send} className="space-y-4 self-start rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6">
          <div className="grid grid-cols-2 gap-2">
            {[
              ["all", "كل الطلاب"],
              ["selected", "طلاب محددون"],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm({ ...form, target: v })}
                className={cn("rounded-xl border-2 py-2.5 text-sm font-medium transition", form.target === v ? "border-primary bg-primary-soft text-primary" : "border-line text-muted")}
              >
                {l}
                {v === "all" && <span className="ms-1 text-xs opacity-70">({formatNumber(students.length)})</span>}
              </button>
            ))}
          </div>
          {form.target === "selected" && (
            <div className="scrollbar-thin grid max-h-52 gap-1 overflow-y-auto rounded-2xl border border-line p-2 sm:grid-cols-2">
              {students.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 hover:bg-surface-2">
                  <input
                    type="checkbox"
                    checked={form.userIds.includes(s.id)}
                    onChange={(e) => setForm({ ...form, userIds: e.target.checked ? [...form.userIds, s.id] : form.userIds.filter((x) => x !== s.id) })}
                    className="size-4 accent-[var(--primary)]"
                  />
                  <Avatar name={s.name} color={s.avatarColor} size={26} />
                  <span className="truncate text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          )}
          <Field label="العنوان" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={160} placeholder="🎉 تحدي نهاية الأسبوع بدأ!" />
          </Field>
          <Field as="div" label="نص الإعلان">
            <RichTextEditor key={formKey} ai minHeight={140} value={form.body} onChange={(body) => setForm((f) => ({ ...f, body }))} placeholder="اكتب تفاصيل الإعلان…" />
          </Field>
          <Field label="رابط داخلي (اختياري)" hint="زر يظهر في الإعلان — مثل /tasks أو /roadmap">
            <Input dir="ltr" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/tasks" />
          </Field>
          <Button type="submit" size="lg" loading={sending} disabled={!form.title.trim() || (form.target === "selected" && !form.userIds.length)}>
            {!sending && <Send className="size-4 -scale-x-100" />} إرسال الإعلان
          </Button>
        </form>

        <div className="space-y-3 self-start">
          <h3 className="flex items-center gap-2 font-semibold">
            <Megaphone className="size-5 text-coral" /> الإعلانات المرسلة
          </h3>
          {recent.length === 0 && <p className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">لم ترسل إعلانات بعد.</p>}
          {recent.map((a) => (
            <Link key={a.id} href={`/admin/notifications/${a.id}`} className="group block rounded-3xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold group-hover:text-primary">{a.title}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {timeAgo(a.at)} · {a.audience === "ALL" ? "كل الطلاب" : "طلاب محددون"}
                  </div>
                </div>
                <ArrowLeft className="mt-1 size-4 text-muted transition group-hover:-translate-x-1" />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                <Eye className="size-3.5" /> قرأه {formatNumber(a.read)} من {formatNumber(a.count)}
                <ProgressBar value={percent(a.read, a.count)} size="sm" className="flex-1" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {a.reactions.map((r) => (
                  <span key={r.emoji} className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                    {r.emoji} <b>{r.count}</b>
                  </span>
                ))}
                {a.threads > 0 && (
                  <span className="ms-auto flex items-center gap-1 rounded-full bg-sky-soft px-2 py-0.5 text-xs font-medium text-sky">
                    <MessageCircle className="size-3.5" /> {formatNumber(a.threads)} محادثة
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
