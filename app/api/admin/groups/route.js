import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { groupSchema } from "@/lib/validators";
import { listGroups, setGroupMembers } from "@/lib/groups";

export const GET = handler({ role: "ADMIN" }, async () => ({ groups: await listGroups() }));

export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const { memberIds, ...data } = await parseBody(req, groupSchema);
  const group = await prisma.studyGroup.create({ data });
  if (memberIds?.length) await setGroupMembers(group.id, memberIds);
  return { ok: true, id: group.id };
});
