import { prisma } from "@/lib/db";
import { handler, notFound, parseBody } from "@/lib/api";
import { grantSchema } from "@/lib/validators";
import { grantManual } from "@/lib/rewards";

export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const { userId, achievementId } = await parseBody(req, grantSchema);
  const student = await prisma.user.findFirst({ where: { id: userId, role: "STUDENT" } });
  if (!student) throw notFound("الطالب غير موجود");
  const achievement = await grantManual(userId, achievementId);
  if (!achievement) throw notFound("الوسام غير موجود");
  return { ok: true };
});

export const DELETE = handler({ role: "ADMIN" }, async ({ req }) => {
  const { userId, achievementId } = await parseBody(req, grantSchema);
  await prisma.userAchievement.deleteMany({ where: { userId, achievementId } });
  return { ok: true };
});
