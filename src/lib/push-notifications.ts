export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Workers are not supported in this browser.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("Service Worker registered successfully:", registration.scope);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export async function scheduleLocalNotification(title: string, options: NotificationOptions) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const registration = await navigator.serviceWorker.ready;
  if (registration) {
    // We send a message to the SW to show the notification.
    // This allows the SW to handle the click actions even if the main thread is closed
    // (though if the main thread is closed, this function wouldn't be called, 
    // but this ensures the notification originates from the SW).
    registration.showNotification(title, options);
  } else {
    // Fallback
    new Notification(title, options);
  }
}
