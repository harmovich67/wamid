import "server-only";
import webpush from "web-push";
import { after } from "next/server";
import { prisma } from "./db";

// Web Push (browser notifications that arrive even when the site is closed).
// Needs VAPID keys in .env — generate them with `npm run push:keys`. Without keys the platform still
// shows system notifications while a tab is open (see components/layout/NotificationBell.js).

let configured = null;

function configure() {
  if (configured !== null) return configured;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return (configured = false);
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@wameed.app", publicKey, privateKey);
    configured = true;
  } catch (err) {
    console.error("[push] invalid VAPID keys", err.message);
    configured = false;
  }
  return configured;
}

export function vapidPublicKey() {
  return configure() ? process.env.VAPID_PUBLIC_KEY : null;
}

/** Sends one payload to every registered browser of these users. Dead subscriptions are pruned. */
export async function sendPush(userIds, { title, body, link, tag }) {
  if (!configure() || !userIds.length) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
  if (!subs.length) return;
  const payload = JSON.stringify({ title, body: body ?? "", link: link ?? "/", tag: tag ?? null });
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: 60 * 60 * 24,
          urgency: "high",
        });
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        } else {
          console.error("[push]", err.statusCode ?? "", err.body ?? err.message);
        }
      }
    })
  );
}

/** Fire-and-forget push that never delays the response. */
export function queuePush(userIds, data) {
  if (!configure() || !userIds.length) return;
  const task = () => sendPush(userIds, data).catch((err) => console.error("[push]", err));
  try {
    after(task);
  } catch {
    // Outside a request scope (scripts): just run it.
    task();
  }
}
