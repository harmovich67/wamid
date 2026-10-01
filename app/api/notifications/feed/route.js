import { prisma } from "@/lib/db";
import { handler } from "@/lib/api";
import { announceUnlocks } from "@/lib/access";

// Polled by the header bell (every ~15s and when the tab regains focus).
export const GET = handler({}, async ({ user }) => {
  if (user.role === "STUDENT") await announceUnlocks(user.id);
  const [unread, items] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, type: true, title: true, body: true, link: true, readAt: true, createdAt: true },
    }),
  ]);
  return Response.json({ unread, items }, { headers: { "Cache-Control": "no-store" } });
});
