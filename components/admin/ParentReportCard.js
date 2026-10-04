"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ExternalLink, FileText, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useMounted } from "@/components/ui/useMounted";
import { api } from "@/lib/client";
import { guardianChannels, parentMessage, timeAgo, whatsappLink } from "@/lib/utils";

/** Teacher-side controls for one student's parent report link. */
export function ParentReportCard({ studentId, studentName, guardianContact, url, lastSentAt }) {
  const router = useRouter();
  const mounted = useMounted();
  const [busy, setBusy] = useState(false);
  const { phone, email } = guardianChannels(guardianContact);
  const message = parentMessage(studentName, url);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("نُسخ الرابط");
    } catch {
      toast.error("تعذّر النسخ");
    }
  }

  async function regenerate() {
    if (!confirm("سيتوقف الرابط القديم عن العمل. متابعة؟")) return;
    setBusy(true);
    try {
      await api(`/api/admin/students/${studentId}/report-link`, { method: "POST", body: { regenerate: true } });
      toast.success("أُنشئ رابط جديد");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sky-soft text-sky">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">تقرير ولي الأمر</h3>
          <p className="text-xs leading-5 text-muted">
            صفحة متابعة خاصة (بدون تسجيل دخول) تُحدَّث تلقائيًا.
            {mounted && lastSentAt && ` آخر إرسال بالبريد ${timeAgo(lastSentAt)}.`}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {phone && (
          <Button href={whatsappLink(phone, message)} target="_blank" rel="noopener noreferrer" size="sm" className="bg-[#25D366] text-white shadow-none hover:bg-[#1fb959]">
            <MessageCircle className="size-4" /> واتساب
          </Button>
        )}
        {email && (
          <Button
            href={`mailto:${email}?subject=${encodeURIComponent(`تقرير ${studentName} — وَمِيض`)}&body=${encodeURIComponent(message)}`}
            variant="secondary"
            size="sm"
          >
            <Mail className="size-4" /> بريد
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={copy}>
          <Copy className="size-4" /> نسخ الرابط
        </Button>
        <Button href={url} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm">
          <ExternalLink className="size-4" /> فتح
        </Button>
        <Button variant="ghost" size="sm" onClick={regenerate} loading={busy} title="إلغاء الرابط القديم وإنشاء رابط جديد">
          {!busy && <RefreshCw className="size-4" />} رابط جديد
        </Button>
      </div>
      {!phone && !email && <p className="mt-3 text-xs text-muted">أضف رقم أو بريد ولي الأمر من «الإعدادات» لتظهر أزرار الإرسال المباشر.</p>}
    </div>
  );
}
