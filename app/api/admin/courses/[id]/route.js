import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { courseSchema } from "@/lib/validators";
import { deleteRulesFor } from "@/lib/admin-data";

export const PATCH = handler({ role: "ADMIN" }, async ({ req, params }) => {
  const data = await parseBody(req, courseSchema.partial());
  await prisma.course.update({ where: { id: params.id }, data });
  return { ok: true };
});

export const DELETE = handler({ role: "ADMIN" }, async ({ params }) => {
  const modules = await prisma.module.findMany({ where: { courseId: params.id }, select: { id: true, lessons: { select: { id: true } } } });
  await deleteRulesFor({
    COURSE: [params.id],
    MODULE: modules.map((m) => m.id),
    LESSON: modules.flatMap((m) => m.lessons.map((l) => l.id)),
  });
  await prisma.course.delete({ where: { id: params.id } });
  return { ok: true };
});
