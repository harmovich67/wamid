import { z } from "zod";
import { handler, parseBody } from "@/lib/api";
import { getChatThreads, setChatAccess } from "@/lib/chat";

const accessSchema = z.object({
  userIds: z.array(z.string()).max(1000).optional(),
  all: z.boolean().optional(),
  enabled: z.boolean(),
});

// Teacher inbox: all students with their last message and unread count (polled by the list).
export const GET = handler({ role: "ADMIN" }, async () => {
  return Response.json({ threads: await getChatThreads() }, { headers: { "Cache-Control": "no-store" } });
});

// Opens/closes the chat for specific students or for everyone.
export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const body = await parseBody(req, accessSchema);
  const count = await setChatAccess(body);
  return { ok: true, count };
});
