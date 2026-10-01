import { prisma } from "@/lib/db";
import { handler, notFound, parseBody } from "@/lib/api";
import { accessRulesSchema } from "@/lib/validators";
import { ruleKey } from "@/lib/access-rules";

const sameTime = (a, b) => (a?.getTime?.() ?? null) === (b?.getTime?.() ?? null);

// Replaces the student's full rule set. Unchanged ALLOW rules keep their "already announced"
// marker; new or changed ones are announced again when the student next opens the app.
export const PUT = handler({ role: "ADMIN" }, async ({ req, params }) => {
  const student = await prisma.user.findFirst({ where: { id: params.id, role: "STUDENT" } });
  if (!student) throw notFound("الطالب غير موجود");
  const { rules } = await parseBody(req, accessRulesSchema);

  const existing = await prisma.accessRule.findMany({ where: { userId: params.id } });
  const byKey = new Map(existing.map((r) => [ruleKey(r.resourceType, r.resourceId), r]));
  const seen = new Set();

  await prisma.$transaction(async (tx) => {
    for (const rule of rules) {
      const key = ruleKey(rule.resourceType, rule.resourceId);
      if (seen.has(key)) continue;
      seen.add(key);
      const prev = byKey.get(key);
      const unchanged =
        prev && prev.effect === rule.effect && sameTime(prev.availableFrom, rule.availableFrom) && sameTime(prev.availableUntil, rule.availableUntil);
      if (unchanged) continue;
      const data = {
        effect: rule.effect,
        availableFrom: rule.availableFrom ?? null,
        availableUntil: rule.availableUntil ?? null,
        notifiedAt: null,
      };
      await tx.accessRule.upsert({
        where: { userId_resourceType_resourceId: { userId: params.id, resourceType: rule.resourceType, resourceId: rule.resourceId } },
        update: data,
        create: { ...data, userId: params.id, resourceType: rule.resourceType, resourceId: rule.resourceId },
      });
    }
    const removed = existing.filter((r) => !seen.has(ruleKey(r.resourceType, r.resourceId))).map((r) => r.id);
    if (removed.length) await tx.accessRule.deleteMany({ where: { id: { in: removed } } });
  });

  return { ok: true, count: seen.size };
});
