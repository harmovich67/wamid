import { prisma } from "@/lib/db";
import { handler, notFound, parseBody } from "@/lib/api";
import { taskAssignSchema } from "@/lib/validators";

// Sets exactly which students have an explicit ALLOW rule for this task.
// New assignees are notified lazily ("مهمة جديدة لك") the next time they open the app.
export const PUT = handler({ role: "ADMIN" }, async ({ req, params }) => {
  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) throw notFound("المهمة غير موجودة");
  const { userIds } = await parseBody(req, taskAssignSchema);
  const students = await prisma.user.findMany({ where: { id: { in: userIds }, role: "STUDENT" }, select: { id: true } });
  const keep = new Set(students.map((s) => s.id));

  await prisma.$transaction(async (tx) => {
    await tx.accessRule.deleteMany({
      where: { resourceType: "TASK", resourceId: params.id, effect: "ALLOW", userId: { notIn: [...keep] } },
    });
    for (const userId of keep) {
      await tx.accessRule.upsert({
        where: { userId_resourceType_resourceId: { userId, resourceType: "TASK", resourceId: params.id } },
        update: { effect: "ALLOW" },
        create: { userId, resourceType: "TASK", resourceId: params.id, effect: "ALLOW" },
      });
    }
  });
  return { ok: true, assigned: keep.size };
});
