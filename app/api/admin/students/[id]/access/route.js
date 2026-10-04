import { prisma } from "@/lib/db";
import { handler, notFound, parseBody } from "@/lib/api";
import { accessRulesSchema } from "@/lib/validators";
import { replaceRules } from "@/lib/admin-data";

// Replaces the student's personal rule set (class rules are edited on the class page).
export const PUT = handler({ role: "ADMIN" }, async ({ req, params }) => {
  const student = await prisma.user.findFirst({ where: { id: params.id, role: "STUDENT" } });
  if (!student) throw notFound("الطالب غير موجود");
  const { rules } = await parseBody(req, accessRulesSchema);
  const count = await replaceRules("accessRule", { userId: params.id }, rules);
  return { ok: true, count };
});
