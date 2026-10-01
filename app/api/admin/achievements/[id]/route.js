import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { achievementSchema } from "@/lib/validators";

export const PATCH = handler({ role: "ADMIN" }, async ({ req, params }) => {
  const data = await parseBody(req, achievementSchema.partial());
  await prisma.achievement.update({ where: { id: params.id }, data });
  return { ok: true };
});

export const DELETE = handler({ role: "ADMIN" }, async ({ params }) => {
  await prisma.achievement.delete({ where: { id: params.id } });
  return { ok: true };
});
