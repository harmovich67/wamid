import "server-only";

// Transactional email through Resend's HTTP API (no SDK needed). Optional: without RESEND_API_KEY
// and REPORT_FROM_EMAIL the weekly parent emails are simply skipped.

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.REPORT_FROM_EMAIL);
}

export async function sendEmail({ to, subject, html, text }) {
  if (!emailConfigured()) return { ok: false, error: "not-configured" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.REPORT_FROM_EMAIL, to: [to], subject, html, text }),
  });
  if (!res.ok) {
    const error = await res.text().catch(() => res.statusText);
    console.error("[email]", res.status, error);
    return { ok: false, error };
  }
  return { ok: true };
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Short weekly summary email; the full report lives behind the link. */
export function parentReportEmail(report, url) {
  const p = report.period;
  const stat = (label, value) =>
    `<td style="padding:12px;text-align:center;background:#f6f5fb;border-radius:12px"><div style="font-size:22px;font-weight:700;color:#4F32E6">${esc(value)}</div><div style="font-size:12px;color:#6b6585">${esc(label)}</div></td>`;
  const html = `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f6f5fb;font-family:Tahoma,Arial,sans-serif">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:20px;padding:28px;color:#1a1530">
  <div style="font-size:13px;color:#7C5CFF;font-weight:700">أكاديمية وَمِيض للبرمجة</div>
  <h1 style="font-size:20px;margin:6px 0 4px">التقرير الأسبوعي: ${esc(report.student.name)}</h1>
  <p style="margin:0 0 18px;color:#6b6585;font-size:14px">ملخص آخر ${esc(report.days)} أيام</p>
  <table role="presentation" width="100%" cellspacing="8" style="border-collapse:separate"><tr>
    ${stat("درس مكتمل", p.lessons.length)}${stat("أيام نشاط", p.activeDays)}${stat("مهمة سُلّمت", p.submissions.length)}
  </tr><tr>
    ${stat("نقاط الخبرة", report.xp)}${stat("أيام متتالية", report.streak)}${stat("نتيجة الاختبارات", p.quizPercent != null ? `${p.quizPercent}%` : "—")}
  </tr></table>
  ${report.overdue ? `<p style="background:#fff1f3;color:#c0304a;border-radius:12px;padding:10px 14px;font-size:14px">⚠️ لديه ${esc(report.overdue)} مهمة متأخرة عن موعدها.</p>` : ""}
  <p style="text-align:center;margin:24px 0 8px"><a href="${esc(url)}" style="background:#7C5CFF;color:#fff;text-decoration:none;padding:12px 26px;border-radius:12px;font-weight:700;display:inline-block">عرض التقرير الكامل</a></p>
  <p style="font-size:12px;color:#9a95b0;text-align:center;margin:16px 0 0">هذا الرابط خاص بطالبك، فلا تشاركه مع أحد.</p>
</div></body></html>`;
  const text = `التقرير الأسبوعي: ${report.student.name}\nدروس مكتملة: ${p.lessons.length} · أيام نشاط: ${p.activeDays} · مهام: ${p.submissions.length}\nالتقرير الكامل: ${url}`;
  return { subject: `تقرير ${report.student.name} الأسبوعي — وَمِيض`, html, text };
}
