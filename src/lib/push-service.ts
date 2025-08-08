import webpush from "web-push";
import { config } from "@/config";
import { prisma } from "@/lib/db";

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  config.push.vapidSubject,
  config.push.vapidPublicKey!,
  config.push.vapidPrivateKey!
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class PushService {
  /**
   * Send push notification to a specific user
   */
  static async sendToUser(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<void> {
    try {
      // Get all subscriptions for the user
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
      });

      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return;
      }

      // Send to all user's subscriptions
      const promises = subscriptions.map((subscription) =>
        this.sendToSubscription(subscription, payload)
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error("Failed to send push notification to user:", error);
    }
  }

  /**
   * Send push notification to a specific subscription
   */
  static async sendToSubscription(
    subscription: {
      endpoint: string;
      p256dh: string;
      auth: string;
    },
    payload: PushNotificationPayload
  ): Promise<void> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    } catch (error) {
      console.error("Failed to send push notification:", error);

      // If subscription is invalid, remove it
      if (error instanceof Error && error.message.includes("410")) {
        await this.removeInvalidSubscription(subscription.endpoint);
      }
    }
  }

  /**
   * Remove invalid subscription from database
   */
  private static async removeInvalidSubscription(
    endpoint: string
  ): Promise<void> {
    try {
      await prisma.pushSubscription.delete({
        where: { endpoint },
      });
      console.log(`Removed invalid subscription: ${endpoint}`);
    } catch (error) {
      console.error("Failed to remove invalid subscription:", error);
    }
  }

  /**
   * Send shopping reminder notification
   */
  static async sendShoppingReminder(
    userId: string,
    listName: string,
    message?: string,
    listId?: string
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title: "Shopping Reminder",
      body: message || `Don't forget to shop for "${listName}"`,
      icon: "/icon512_rounded.png",
      badge: "/icon512_rounded.png",
      tag: "shopping-reminder",
      data: {
        listId,
        type: "shopping-reminder",
      },
      actions: [
        {
          action: "view",
          title: "View List",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
    };

    await this.sendToUser(userId, payload);
  }

  /**
   * Send test notification
   */
  static async sendTestNotification(userId: string): Promise<void> {
    const payload: PushNotificationPayload = {
      title: "Test Notification",
      body: "This is a test push notification from your grocery app!",
      icon: "/icon512_rounded.png",
      badge: "/icon512_rounded.png",
      tag: "test-notification",
      data: {
        type: "test",
      },
    };

    await this.sendToUser(userId, payload);
  }
}
