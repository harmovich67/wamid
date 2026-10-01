import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";

const schema = z.object({ ids: z.array(z.string()).max(200).optional(), all: z.boolean().optional() });

export const POST = handler({}, async ({ req, user }) => {
  const { ids, all } = await parseBody(req, schema);
  const where = { userId: user.id, readAt: null, ...(all ? {} : { id: { in: ids ?? [] } }) };
  const res = await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
  return { ok: true, count: res.count };
});
