import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { moduleSchema } from "@/lib/validators";
import { nextOrder } from "@/lib/admin-data";

export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const data = await parseBody(req, moduleSchema);
  const mod = await prisma.module.create({ data: { ...data, order: data.order ?? (await nextOrder("module", { courseId: data.courseId })) } });
  return { ok: true, id: mod.id };
});
