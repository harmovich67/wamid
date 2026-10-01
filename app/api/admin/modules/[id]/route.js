import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { moduleSchema } from "@/lib/validators";
import { deleteRulesFor } from "@/lib/admin-data";

export const PATCH = handler({ role: "ADMIN" }, async ({ req, params }) => {
  const { title } = await parseBody(req, moduleSchema.pick({ title: true }));
  await prisma.module.update({ where: { id: params.id }, data: { title } });
  return { ok: true };
});

export const DELETE = handler({ role: "ADMIN" }, async ({ params }) => {
  const lessons = await prisma.lesson.findMany({ where: { moduleId: params.id }, select: { id: true } });
  await deleteRulesFor({ MODULE: [params.id], LESSON: lessons.map((l) => l.id) });
  await prisma.module.delete({ where: { id: params.id } });
  return { ok: true };
});
