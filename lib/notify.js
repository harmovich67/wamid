import "server-only";
import { prisma } from "./db";

export async function notify(userId, { type = "SYSTEM", title, body = null, link = null }) {
  return prisma.notification.create({ data: { userId, type, title, body, link } });
}

export async function notifyMany(userIds, data) {
  if (!userIds.length) return { count: 0 };
  const { type = "SYSTEM", title, body = null, link = null } = data;
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, title, body, link })),
  });
}
