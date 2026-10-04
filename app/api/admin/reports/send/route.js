import { ApiError, handler } from "@/lib/api";
import { emailConfigured } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { appOrigin, sendWeeklyReports } from "@/lib/reports";

export const maxDuration = 300;

// "Send now" button on the parent reports page.
export const POST = handler({ role: "ADMIN" }, async ({ req, user }) => {
  if (!emailConfigured()) throw new ApiError(400, "البريد غير مُعدّ بعد: أضف RESEND_API_KEY و REPORT_FROM_EMAIL");
  if (!rateLimit(`reports:${user.id}`, { limit: 3, windowMs: 60 * 60 * 1000 }).ok) throw new ApiError(429, "أُرسلت التقارير قبل قليل، حاول لاحقًا");
  return sendWeeklyReports(appOrigin(req));
});
