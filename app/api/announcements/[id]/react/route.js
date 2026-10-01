import { z } from "zod";
import { prisma } from "@/lib/db";
import { forbidden, handler, notFound, parseBody } from "@/lib/api";
import { isRecipient, notifyAdmins, summarizeReactions } from "@/lib/announcements";
import { REACTION_EMOJIS } from "@/lib/constants";

const schema = z.object({ emoji: z.enum(REACTION_EMOJIS) });

// Toggles one emoji reaction by the current student and tells the teacher.
export const POST = handler({ role: "STUDENT" }, async ({ req, user, params }) => {
  const { emoji } = await parseBody(req, schema);
  const announcement = await prisma.announcement.findUnique({ where: { id: params.id }, select: { id: true, title: true } });
  if (!announcement) throw notFound("الإعلان غير موجود");
  if (!(await isRecipient(params.id, user.id))) throw forbidden();

  const key = { announcementId_userId_emoji: { announcementId: params.id, userId: user.id, emoji } };
  const existing = await prisma.announcementReaction.findUnique({ where: key });
  if (existing) {
    await prisma.announcementReaction.delete({ where: key });
  } else {
    await prisma.announcementReaction.create({ data: { announcementId: params.id, userId: user.id, emoji } });
    await notifyAdmins({
      type: "REACTION",
      title: `${user.name} تفاعل ${emoji} مع: ${announcement.title}`,
      link: `/admin/notifications/${params.id}`,
    });
  }
  const reactions = await prisma.announcementReaction.findMany({ where: { announcementId: params.id }, select: { emoji: true, userId: true } });
  return { reactions: summarizeReactions(reactions, user.id) };
});
