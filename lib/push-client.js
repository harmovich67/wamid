// Browser notifications: service worker registration, Web Push subscription and local fallbacks.
import { api } from "./client";

const MODE_KEY = "wameed-push"; // "server" once this browser is subscribed to Web Push

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window;
}

export function permission() {
  return pushSupported() ? Notification.permission : "unsupported";
}

/** True when the server will deliver pushes itself, so in-tab fallback notifications are not needed. */
export function serverPushActive() {
  try {
    return localStorage.getItem(MODE_KEY) === "server";
  } catch {
    return false;
  }
}

function setMode(value) {
  try {
    if (value) localStorage.setItem(MODE_KEY, value);
    else localStorage.removeItem(MODE_KEY);
  } catch {}
}

export async function registerServiceWorker() {
  if (!pushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

function keyToBytes(base64) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/**
 * Makes sure this browser is subscribed (when permission is already granted). Safe to call on every
 * page load: it re-sends the subscription so it always points at the signed-in user.
 */
export async function syncPush() {
  if (permission() !== "granted") return false;
  const reg = await registerServiceWorker();
  if (!reg || !("PushManager" in window)) return false;
  await navigator.serviceWorker.ready;
  const { key } = await api("/api/push").catch(() => ({ key: null }));
  if (!key) {
    setMode(null);
    return false;
  }
  let sub = await reg.pushManager.getSubscription();
  try {
    sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(key) });
  } catch {
    // The server key changed since this browser subscribed: start over with the new key.
    await sub?.unsubscribe().catch(() => {});
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(key) });
  }
  await api("/api/push", { method: "POST", body: sub.toJSON() });
  setMode("server");
  return true;
}

/** Asks for permission (must be called from a click) and subscribes. Returns the final permission. */
export async function enablePush() {
  if (!pushSupported()) return "unsupported";
  const result = await Notification.requestPermission();
  if (result === "granted") {
    await syncPush().catch(() => setMode(null));
    showLocalNotification({ title: "تم تفعيل إشعارات وَمِيض 🎉", body: "ستصلك التنبيهات المهمة هنا مباشرة.", tag: "welcome" });
  }
  return result;
}

/** Unsubscribes this browser (used by the toggle and on sign-out so the next user doesn't get alerts). */
export async function disablePush() {
  setMode(null);
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
  const sub = await reg?.pushManager?.getSubscription().catch(() => null);
  if (!sub) return;
  await api("/api/push", { method: "DELETE", body: { endpoint: sub.endpoint } }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

/** System notification from the open tab (fallback when server push is not configured). */
export async function showLocalNotification({ title, body, link, tag }) {
  if (permission() !== "granted") return;
  try {
    const reg = (await navigator.serviceWorker.getRegistration()) ?? (await registerServiceWorker());
    await reg?.showNotification(title, {
      body: body ?? "",
      tag: tag ?? undefined,
      icon: "/icons/192",
      badge: "/icons/192",
      lang: "ar",
      dir: "rtl",
      data: { link: link ?? "/" },
    });
  } catch {}
}
