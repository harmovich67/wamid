import "server-only";
import { prisma } from "./db";
import { queuePush } from "./push";

export async function notify(userId, { type = "SYSTEM", title, body = null, link = null }) {
  const n = await prisma.notification.create({ data: { userId, type, title, body, link } });
  queuePush([userId], { title, body, link, tag: n.id });
  return n;
}

export async function notifyMany(userIds, data) {
  if (!userIds.length) return { count: 0 };
  const { type = "SYSTEM", title, body = null, link = null } = data;
  const res = await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, title, body, link })),
  });
  queuePush(userIds, { title, body, link, tag: `${type}:${link ?? title}` });
  return res;
}

/**
 * One rolling notification per conversation: while the previous one is still unread it is updated
 * (and bumped to the top) instead of stacking a new bell item for every chat message.
 */
export async function notifyConversation(userIds, { title, body = null, link, tag }) {
  if (!userIds.length) return;
  const now = new Date();
  await Promise.all(
    userIds.map(async (userId) => {
      const open = await prisma.notification.findFirst({
        where: { userId, type: "MESSAGE", link, readAt: null },
        select: { id: true },
      });
      if (open) {
        await prisma.notification.update({ where: { id: open.id }, data: { title, body, createdAt: now } });
      } else {
        await prisma.notification.create({ data: { userId, type: "MESSAGE", title, body, link } });
      }
    })
  );
  queuePush(userIds, { title, body, link, tag });
}
