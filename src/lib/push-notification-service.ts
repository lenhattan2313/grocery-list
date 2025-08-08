export class PushNotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    // Always try to request permission, even if it was previously denied
    // The browser will show the permission prompt if it hasn't been permanently blocked
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  }

  static async isVAPIDConfigured(): Promise<boolean> {
    try {
      const response = await fetch("/api/push/vapid-public-key");
      return response.ok;
    } catch (error) {
      console.error("Failed to check VAPID configuration:", error);
      return false;
    }
  }

  static async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("This browser does not support push notifications");
      return null;
    }

    try {
      console.log("Attempting to get service worker registration...");

      // Check if service worker is already registered
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(
        "Current service worker registrations:",
        registrations.length
      );

      if (registrations.length === 0) {
        console.log("No service worker registered, attempting to register...");
        await navigator.serviceWorker.register("/sw.js");
        console.log("Service worker registration initiated");
      }

      // Wait for service worker to be ready with timeout
      const registrationPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Service worker registration timeout")),
          5000
        )
      );

      const registration = (await Promise.race([
        registrationPromise,
        timeoutPromise,
      ])) as ServiceWorkerRegistration;
      console.log("Service worker ready:", registration);

      // Check if already subscribed
      const existingSubscription =
        await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log("Already subscribed to push notifications");
        return existingSubscription;
      }

      // Get VAPID public key from server
      console.log("Fetching VAPID public key...");
      const response = await fetch("/api/push/vapid-public-key");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (
          response.status === 500 &&
          errorData.error === "VAPID public key not configured"
        ) {
          console.log(
            "VAPID keys not configured - push notifications disabled"
          );
          return null;
        }
        throw new Error(
          `Failed to get VAPID public key: ${response.status} ${response.statusText}`
        );
      }

      const { publicKey } = await response.json();
      console.log("VAPID public key received");

      // Convert base64 to Uint8Array
      const vapidPublicKey = this.urlBase64ToUint8Array(publicKey);

      // Subscribe to push notifications
      console.log("Subscribing to push notifications...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      // Send subscription to server
      console.log("Sending subscription to server...");
      const subscribeResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey("p256dh")!),
            auth: this.arrayBufferToBase64(subscription.getKey("auth")!),
          },
        }),
      });

      if (!subscribeResponse.ok) {
        throw new Error("Failed to register subscription with server");
      }

      console.log("Successfully subscribed to push notifications");
      return subscription;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      return null;
    }
  }

  static async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }

    try {
      console.log("Attempting to unsubscribe from push notifications...");

      // Wait for service worker to be ready with timeout
      const registrationPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Service worker registration timeout")),
          5000
        )
      );

      const registration = (await Promise.race([
        registrationPromise,
        timeoutPromise,
      ])) as ServiceWorkerRegistration;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from server
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        console.log("Successfully unsubscribed from push notifications");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      return false;
    }
  }

  static async sendNotification(title: string, options?: NotificationOptions) {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    if (Notification.permission !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: "/icon512_rounded.png",
      badge: "/icon512_rounded.png",
      tag: "shopping-reminder",
      requireInteraction: false,
      ...options,
    };

    return new Notification(title, defaultOptions);
  }

  static async sendShoppingReminder(listName: string, message?: string) {
    const title = "Shopping Reminder";
    const body = message || `Don't forget to shop for "${listName}"`;

    return this.sendNotification(title, {
      body,
      icon: "/icon512_rounded.png",
      badge: "/icon512_rounded.png",
      tag: "shopping-reminder",
      requireInteraction: false,
      // Note: actions are not supported in all browsers
      // They will be handled by the service worker instead
    } as NotificationOptions);
  }

  static async sendTestNotification(): Promise<void> {
    try {
      const response = await fetch("/api/push/test", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to send test notification");
      }

      console.log("Test notification sent successfully");
    } catch (error) {
      console.error("Failed to send test notification:", error);
    }
  }

  // Utility functions for VAPID key conversion
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
