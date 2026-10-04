"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Copy, ExternalLink, Mail, MailCheck, MessageCircle, Search, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useMounted } from "@/components/ui/useMounted";
import { api } from "@/lib/client";
import { cn, formatNumber, guardianChannels, parentMessage, timeAgo, whatsappLink } from "@/lib/utils";

export function ReportsManager({ students, groups, groupId, email }) {
  const router = useRouter();
  const mounted = useMounted();
  const [q, setQ] = useState("");
  const [sending, setSending] = useState(false);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return students
      .filter((s) => !t || s.name.toLowerCase().includes(t) || s.username.includes(t))
      .map((s) => ({ ...s, ...guardianChannels(s.guardianContact) }));
  }, [students, q]);
  const reachable = rows.filter((r) => r.phone || r.email).length;
  const emailable = rows.filter((r) => r.email).length;

  async function sendAll() {
    setSending(true);
    try {
      const res = await api("/api/admin/reports/send", { method: "POST" });
      toast.success(`أُرسل ${formatNumber(res.sent)} تقرير بالبريد${res.failed ? ` · فشل ${formatNumber(res.failed)}` : ""}`);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  async function copy(url) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("نُسخ الرابط");
    } catch {
      toast.error("تعذّر النسخ");
    }
  }

  return (
    <div>
      <PageHeader
        title="تقارير أولياء الأمور"
        subtitle="لكل طالب صفحة متابعة خاصة يفتحها ولي الأمر بدون حساب: الدروس، والمهام والدرجات، وملاحظاتك، والتزامه اليومي. أرسلها بضغطة على واتساب."
      />

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className={cn("flex items-start gap-3 rounded-3xl border p-4", email.configured ? "border-mint/30 bg-mint-soft/40" : "border-line bg-surface")}>
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", email.configured ? "bg-mint text-white" : "bg-surface-2 text-muted")}>
            {email.configured ? <MailCheck className="size-5" /> : <Mail className="size-5" />}
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold">{email.configured ? "التقرير الأسبوعي بالبريد مفعّل" : "التقرير الأسبوعي بالبريد غير مُعدّ"}</div>
            <p className="mt-0.5 text-xs leading-5 text-muted">
              {email.configured
                ? `يُرسل تلقائيًا كل جمعة لأولياء الأمور الذين لديهم بريد (${formatNumber(emailable)} هنا)${email.cron ? "" : " — أضف CRON_SECRET في Vercel لتفعيل الإرسال التلقائي"}.`
                : "أضف RESEND_API_KEY و REPORT_FROM_EMAIL و CRON_SECRET في إعدادات Vercel ليُرسل التقرير تلقائيًا كل أسبوع. حتى ذلك الحين استخدم واتساب أو نسخ الرابط."}
            </p>
          </div>
          {email.configured && (
            <Button size="sm" variant="secondary" onClick={sendAll} loading={sending} disabled={!emailable} className="shrink-0">
              {!sending && <Send className="size-4 -scale-x-100" />} أرسل الآن
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 rounded-3xl border border-line bg-surface px-4 py-3 text-sm">
          <CalendarClock className="size-5 shrink-0 text-primary" />
          <span>
            <b>{formatNumber(reachable)}</b> من {formatNumber(rows.length)} لديهم وسيلة تواصل
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input className="ps-10" placeholder="ابحث عن طالب" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {groups.length > 0 && (
          <div className="scrollbar-thin flex gap-1.5 overflow-x-auto pb-1">
            <Link href="/admin/reports" className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium", !groupId ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-fg")}>
              كل الطلاب
            </Link>
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/admin/reports?group=${g.id}`}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium", groupId === g.id ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-fg")}
              >
                <span className="size-2 rounded-full" style={{ background: g.color }} /> {g.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        {rows.length === 0 && <p className="p-8 text-center text-sm text-muted">لا يوجد طلاب.</p>}
        {rows.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3.5 sm:p-4">
            <Link href={`/admin/students/${s.id}`} className="flex min-w-0 flex-1 basis-56 items-center gap-3">
              <Avatar name={s.name} color={s.avatarColor} avatar={s.avatar} size={40} />
              <span className="min-w-0">
                <span className="block truncate font-medium hover:text-primary">{s.name}</span>
                <span className="block truncate text-xs text-muted" dir="auto">
                  {s.guardianContact || "لا توجد وسيلة تواصل لولي الأمر"}
                  {mounted && s.lastReportSentAt && ` · أُرسل ${timeAgo(s.lastReportSentAt)}`}
                </span>
              </span>
            </Link>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              {s.phone && (
                <a
                  href={whatsappLink(s.phone, parentMessage(s.name, s.url))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-sm font-medium text-white hover:bg-[#1fb959]"
                >
                  <MessageCircle className="size-4" /> واتساب
                </a>
              )}
              {s.email && (
                <a
                  href={`mailto:${s.email}?subject=${encodeURIComponent(`تقرير ${s.name} — وَمِيض`)}&body=${encodeURIComponent(parentMessage(s.name, s.url))}`}
                  className="grid size-9 place-items-center rounded-xl border border-line text-muted hover:bg-surface-2 hover:text-fg"
                  title="إرسال بالبريد"
                  aria-label="إرسال بالبريد"
                >
                  <Mail className="size-4" />
                </a>
              )}
              <button onClick={() => copy(s.url)} className="grid size-9 place-items-center rounded-xl border border-line text-muted hover:bg-surface-2 hover:text-fg" title="نسخ الرابط" aria-label="نسخ الرابط">
                <Copy className="size-4" />
              </button>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-xl border border-line text-muted hover:bg-surface-2 hover:text-fg" title="معاينة التقرير" aria-label="معاينة التقرير">
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
