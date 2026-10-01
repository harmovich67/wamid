import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { reorderSchema } from "@/lib/validators";

// Persists a new order: ids[] in their new sequence.
export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const { kind, ids } = await parseBody(req, reorderSchema);
  await prisma.$transaction(ids.map((id, order) => prisma[kind].update({ where: { id }, data: { order } })));
  return { ok: true };
});
