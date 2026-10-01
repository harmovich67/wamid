import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { taskSchema } from "@/lib/validators";
import { notifyTaskAudience } from "@/lib/access";
import { taskData } from "@/lib/admin-data";

export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const data = await parseBody(req, taskSchema);
  const task = await prisma.task.create({ data: taskData(data) });
  const notified = await notifyTaskAudience(task);
  return { ok: true, id: task.id, notified };
});
