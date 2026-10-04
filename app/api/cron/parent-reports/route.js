import { appOrigin, sendWeeklyReports } from "@/lib/reports";

export const maxDuration = 300;

// Weekly parent emails, triggered by Vercel Cron (see vercel.json). Vercel sends
// "Authorization: Bearer $CRON_SECRET"; without CRON_SECRET the endpoint stays closed.
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await sendWeeklyReports(appOrigin(req));
  return Response.json(result);
}
