import { handler } from "@/lib/api";
import { getStudentRows, rowsToCsv } from "@/lib/analytics";
import { dayKey } from "@/lib/utils";

// GET /api/admin/analytics/export?days=30&group=<id> — the students table as a CSV for Excel.
export const GET = handler({ role: "ADMIN" }, async ({ req }) => {
  const url = new URL(req.url);
  const days = [7, 30, 90].includes(Number(url.searchParams.get("days"))) ? Number(url.searchParams.get("days")) : 30;
  const rows = await getStudentRows({ days, groupId: url.searchParams.get("group") || null });
  return new Response(rowsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wameed-students-${dayKey()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
