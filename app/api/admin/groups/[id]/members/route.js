import { handler, parseBody } from "@/lib/api";
import { groupMembersSchema } from "@/lib/validators";
import { setGroupMembers } from "@/lib/groups";

export const PUT = handler({ role: "ADMIN" }, async ({ req, params }) => {
  const { userIds } = await parseBody(req, groupMembersSchema);
  return { ok: true, ...(await setGroupMembers(params.id, userIds)) };
});
