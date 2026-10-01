import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { achievementSchema } from "@/lib/validators";

export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const data = await parseBody(req, achievementSchema);
  const a = await prisma.achievement.create({ data });
  return { ok: true, id: a.id };
});
