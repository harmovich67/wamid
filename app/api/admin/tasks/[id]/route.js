import { prisma } from "@/lib/db";
import { handler, notFound, parseBody } from "@/lib/api";
import { taskSchema } from "@/lib/validators";
import { notifyTaskAudience } from "@/lib/access";
import { deleteRulesFor, taskData } from "@/lib/admin-data";

export const PATCH = handler({ role: "ADMIN" }, async ({ req, params }) => {
  const before = await prisma.task.findUnique({ where: { id: params.id } });
  if (!before) throw notFound("المهمة غير موجودة");
  const data = await parseBody(req, taskSchema.partial());
  const task = await prisma.task.update({ where: { id: params.id }, data: taskData(data) });
  const becameVisible = task.isPublished && (!before.isPublished || before.lessonId !== task.lessonId || before.courseId !== task.courseId);
  const notified = becameVisible ? await notifyTaskAudience(task) : 0;
  return { ok: true, notified };
});

export const DELETE = handler({ role: "ADMIN" }, async ({ params }) => {
  await deleteRulesFor({ TASK: [params.id] });
  await prisma.task.delete({ where: { id: params.id } });
  return { ok: true };
});
