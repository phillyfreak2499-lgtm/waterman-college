self.addEventListener("push", (event) => {
  let data = { title: "Waterman College", body: "", href: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    try {
      data.body = event.data ? event.data.text() : "";
    } catch {
      /* ignore */
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Waterman College", {
      body: data.body || "You have a note from the office.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { href: data.href || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => "focus" in client);
      if (existing) {
        existing.navigate?.(href);
        return existing.focus();
      }
      return self.clients.openWindow(href);
    }),
  );
});
