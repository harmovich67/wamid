import { handler, parseBody } from "@/lib/api";
import { accessRulesSchema } from "@/lib/validators";
import { replaceRules } from "@/lib/admin-data";
import { findGroup } from "@/lib/groups";

// Replaces the class rule set. Members are notified the next time one of them opens the app.
export const PUT = handler({ role: "ADMIN" }, async ({ req, params }) => {
  await findGroup(params.id);
  const { rules } = await parseBody(req, accessRulesSchema);
  const count = await replaceRules("studyGroupRule", { groupId: params.id }, rules);
  return { ok: true, count };
});
