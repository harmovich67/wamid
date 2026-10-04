import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, notFound, parseBody } from "@/lib/api";
import { appOrigin, ensureReportToken, reportPath } from "@/lib/reports";

// Returns the student's parent-report link; `regenerate` revokes the old one.
export const POST = handler({ role: "ADMIN" }, async ({ req, params }) => {
  const { regenerate } = await parseBody(req, z.object({ regenerate: z.boolean().optional() }));
  const student = await prisma.user.findFirst({ where: { id: params.id, role: "STUDENT" }, select: { id: true } });
  if (!student) throw notFound("الطالب غير موجود");
  const token = await ensureReportToken(student.id, { regenerate });
  return { url: `${appOrigin(req)}${reportPath(token)}` };
});
