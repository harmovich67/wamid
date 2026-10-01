import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { levelSchema } from "@/lib/validators";
import { deleteRulesFor } from "@/lib/admin-data";

export const PATCH = handler({ role: "ADMIN" }, async ({ req, params }) => {
  const data = await parseBody(req, levelSchema.partial());
  await prisma.level.update({ where: { id: params.id }, data });
  return { ok: true };
});

export const DELETE = handler({ role: "ADMIN" }, async ({ params }) => {
  const courses = await prisma.course.findMany({
    where: { levelId: params.id },
    select: { id: true, modules: { select: { id: true, lessons: { select: { id: true } } } } },
  });
  const modules = courses.flatMap((c) => c.modules);
  await deleteRulesFor({
    LEVEL: [params.id],
    COURSE: courses.map((c) => c.id),
    MODULE: modules.map((m) => m.id),
    LESSON: modules.flatMap((m) => m.lessons.map((l) => l.id)),
  });
  await prisma.level.delete({ where: { id: params.id } });
  return { ok: true };
});
