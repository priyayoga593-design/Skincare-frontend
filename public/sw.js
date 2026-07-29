self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const title = data.title || "360° Skincare";
    const options = {
      body: data.body || "It's time for your skincare routine!",
      icon: data.icon || "/favicon.ico",
      badge: data.badge || "/favicon.ico",
      data: data.data || {},
      actions: [
        { action: "snooze_10", title: "Snooze 10m" },
        { action: "snooze_30", title: "Snooze 30m" },
        { action: "complete", title: "Mark Completed" }
      ],
      tag: data.tag || "skincare-reminder", // Prevents duplicates with the same tag
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error("Error parsing push data:", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;

  event.waitUntil(
    (async () => {
      // Send a message to the open client windows to handle the action (e.g. updating history)
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      
      const payload = {
        type: "NOTIFICATION_ACTION",
        action: action || "click",
        reminderId: data?.reminderId,
        timestamp: new Date().toISOString()
      };

      for (const client of allClients) {
        client.postMessage(payload);
      }

      // If they clicked a general part of the notification (not an action button), open the app
      if (!action) {
        if (allClients.length > 0) {
          allClients[0].focus();
        } else {
          self.clients.openWindow("/");
        }
      }
    })()
  );
});

// Since we are mocking the backend, we might simulate push events
// by having the client post messages to the SW with delays, but SW 
// setTimeouts die when SW goes idle. A true mock background service 
// without a server requires the Alarm API or Periodic Sync (which are restricted).
// We will primarily rely on the foreground timer + local notifications, 
// and set up the SW to handle actual pushes when they connect a backend.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});
