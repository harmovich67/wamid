// Wameed service worker: shows Web Push notifications and focuses/opens the app on click.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // The app is open and focused: the in-page bell already shows a toast, so don't double up.
      if (windows.some((c) => c.focused)) {
        windows.forEach((c) => c.postMessage({ type: "wameed:push" }));
        return;
      }
      await self.registration.showNotification(data.title || "وَمِيض", {
        body: data.body || "",
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        icon: "/icons/192",
        badge: "/icons/192",
        lang: "ar",
        dir: "rtl",
        data: { link: data.link || "/" },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.link || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const client = windows.find((c) => new URL(c.url).origin === self.location.origin);
      if (client) {
        await client.focus();
        client.postMessage({ type: "wameed:navigate", url });
        return;
      }
      await self.clients.openWindow(url);
    })()
  );
});
