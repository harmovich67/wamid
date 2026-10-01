import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { lessonCreateSchema } from "@/lib/validators";
import { nextOrder } from "@/lib/admin-data";

export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const data = await parseBody(req, lessonCreateSchema);
  const lesson = await prisma.lesson.create({
    data: { ...data, isPublished: false, order: await nextOrder("lesson", { moduleId: data.moduleId }) },
  });
  return { ok: true, id: lesson.id };
});
