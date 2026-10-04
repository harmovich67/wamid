import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { groupSchema } from "@/lib/validators";
import { findGroup } from "@/lib/groups";

export const PATCH = handler({ role: "ADMIN" }, async ({ req, params }) => {
  await findGroup(params.id);
  const { memberIds, ...data } = await parseBody(req, groupSchema.partial());
  await prisma.studyGroup.update({ where: { id: params.id }, data });
  return { ok: true };
});

// Deleting a class removes its members' inherited access (their personal rules stay).
export const DELETE = handler({ role: "ADMIN" }, async ({ params }) => {
  await findGroup(params.id);
  // Explicit cleanup so nothing is left behind even on databases without foreign-key cascades.
  await prisma.$transaction([
    prisma.studyGroupMember.deleteMany({ where: { groupId: params.id } }),
    prisma.studyGroupRule.deleteMany({ where: { groupId: params.id } }),
    prisma.studyGroup.delete({ where: { id: params.id } }),
  ]);
  return { ok: true };
});
