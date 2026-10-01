import { handler, parseBody } from "@/lib/api";
import { broadcastSchema } from "@/lib/validators";
import { createAnnouncement } from "@/lib/announcements";

export const POST = handler({ role: "ADMIN" }, async ({ req, user }) => {
  const data = await parseBody(req, broadcastSchema);
  const { announcement, count } = await createAnnouncement({ authorId: user.id, ...data });
  return { ok: true, id: announcement.id, count };
});
