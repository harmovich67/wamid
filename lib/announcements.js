import "server-only";
import { prisma } from "./db";
import { notify, notifyMany } from "./notify";
import { REACTION_EMOJIS } from "./constants";

export { notify };

export async function adminIds() {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  return admins.map((a) => a.id);
}

export async function notifyAdmins(data) {
  return notifyMany(await adminIds(), data);
}

/** Creates an announcement, its recipient list and a bell notification for every recipient. */
export async function createAnnouncement({ authorId, target, userIds, title, body, link }) {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isActive: true, ...(target === "selected" ? { id: { in: userIds } } : {}) },
    select: { id: true },
  });
  const ids = students.map((s) => s.id);
  const announcement = await prisma.announcement.create({
    data: {
      authorId,
      title,
      body,
      link,
      audience: target === "selected" ? "SELECTED" : "ALL",
      recipients: { create: ids.map((userId) => ({ userId })) },
    },
  });
  await notifyMany(ids, {
    type: "ANNOUNCEMENT",
    title: `📣 ${title}`,
    body: body?.slice(0, 180) ?? null,
    link: `/announcements/${announcement.id}`,
  });
  return { announcement, count: ids.length };
}

export function summarizeReactions(reactions, userId) {
  return REACTION_EMOJIS.map((emoji) => {
    const list = reactions.filter((r) => r.emoji === emoji);
    return { emoji, count: list.length, mine: list.some((r) => r.userId === userId) };
  });
}

export async function isRecipient(announcementId, userId) {
  const r = await prisma.announcementRecipient.findUnique({ where: { announcementId_userId: { announcementId, userId } } });
  return Boolean(r);
}
