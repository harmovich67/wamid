import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { vapidPublicKey } from "@/lib/push";

const subscriptionSchema = z.object({
  endpoint: z.url().max(700),
  keys: z.object({ p256dh: z.string().min(1).max(255), auth: z.string().min(1).max(255) }),
});

// Public VAPID key the browser needs to subscribe (null when push isn't configured on the server).
export const GET = handler({}, async () => ({ key: vapidPublicKey() }));

export const POST = handler({}, async ({ req, user }) => {
  const { endpoint, keys } = await parseBody(req, subscriptionSchema);
  const userAgent = req.headers.get("user-agent")?.slice(0, 255) ?? null;
  // A browser belongs to whoever signed in last on it.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: user.id, userAgent },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.id, userAgent },
  });
  return { ok: true };
});

export const DELETE = handler({}, async ({ req, user }) => {
  const { endpoint } = await parseBody(req, z.object({ endpoint: z.string().max(700) }));
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  return { ok: true };
});
