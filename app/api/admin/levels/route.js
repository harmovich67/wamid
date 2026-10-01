import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { levelSchema } from "@/lib/validators";
import { nextOrder } from "@/lib/admin-data";

export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const data = await parseBody(req, levelSchema);
  const level = await prisma.level.create({ data: { ...data, order: data.order ?? (await nextOrder("level", {})) } });
  return { ok: true, id: level.id };
});
