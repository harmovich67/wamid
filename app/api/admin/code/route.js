import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";

const schema = z.object({
  userIds: z.array(z.string()).max(1000).optional(),
  all: z.boolean().optional(),
  enabled: z.boolean(),
});

// Turns the in-browser code editor / runner on or off for specific students (or all of them).
export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const { userIds, all, enabled } = await parseBody(req, schema);
  const where = all ? { user: { role: "STUDENT" } } : { userId: { in: userIds ?? [] } };
  const res = await prisma.studentProfile.updateMany({ where, data: { codeEnabled: enabled } });
  return { ok: true, count: res.count };
});
