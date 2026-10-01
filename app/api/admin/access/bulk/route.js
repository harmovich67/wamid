import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { bulkAccessSchema } from "@/lib/validators";

// Assign / lock / clear content for many students at once.
export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const { userIds, resources, mode, availableFrom, availableUntil } = await parseBody(req, bulkAccessSchema);
  const students = await prisma.user.findMany({ where: { id: { in: userIds }, role: "STUDENT" }, select: { id: true } });

  await prisma.$transaction(async (tx) => {
    for (const { id: userId } of students) {
      for (const res of resources) {
        const where = { userId_resourceType_resourceId: { userId, resourceType: res.type, resourceId: res.id } };
        if (mode === "REMOVE") {
          await tx.accessRule.deleteMany({ where: { userId, resourceType: res.type, resourceId: res.id } });
          continue;
        }
        const data = { effect: mode, availableFrom: availableFrom ?? null, availableUntil: availableUntil ?? null, notifiedAt: null };
        await tx.accessRule.upsert({
          where,
          update: data,
          create: { ...data, userId, resourceType: res.type, resourceId: res.id },
        });
      }
    }
  });
  return { ok: true, students: students.length, resources: resources.length };
});
