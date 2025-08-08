"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PushNotificationService } from "@/lib/push-notification-service";

export function useListReminders() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  const requestPermission = useCallback(async () => {
    const granted = await PushNotificationService.requestPermission();
    setHasPermission(granted);
    return granted;
  }, []);

  const subscribeToPushNotifications = useCallback(async () => {
    const subscription =
      await PushNotificationService.subscribeToPushNotifications();
    setIsSubscribed(!!subscription);
    return subscription;
  }, []);

  const unsubscribeFromPushNotifications = useCallback(async () => {
    const success =
      await PushNotificationService.unsubscribeFromPushNotifications();
    if (success) {
      setIsSubscribed(false);
    }
    return success;
  }, []);

  const sendTestNotification = useCallback(async () => {
    await PushNotificationService.sendTestNotification();
  }, []);

  // Check permission and subscription status on mount
  useEffect(() => {
    if ("Notification" in window) {
      setHasPermission(Notification.permission === "granted");
    }

    // Check if already subscribed to push notifications
    const checkSubscription = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          // Add timeout to prevent hanging
          const registrationPromise = navigator.serviceWorker.ready;
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Service worker registration timeout")),
              10000
            )
          );

          const registration = (await Promise.race([
            registrationPromise,
            timeoutPromise,
          ])) as ServiceWorkerRegistration;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error("Failed to check push subscription:", error);
        }
      }
    };

    checkSubscription();
  }, []);

  return {
    hasPermission,
    isSubscribed,
    requestPermission,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    sendTestNotification,
  };
}

// Mutation hook for reminder operations with proper cache invalidation
export function useReminderMutation() {
  const queryClient = useQueryClient();

  const setReminderMutation = useMutation({
    mutationFn: async ({
      listId,
      reminderTime,
      reminderMessage,
    }: {
      listId: string;
      reminderTime: Date;
      reminderMessage?: string;
    }) => {
      const response = await fetch(`/api/lists/${listId}/reminder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reminderTime: reminderTime.toISOString(),
          reminderMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to set reminder");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the lists query to refetch with updated reminder data
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
    onError: (error) => {
      console.error("Failed to set reminder:", error);
    },
  });

  const removeReminderMutation = useMutation({
    mutationFn: async ({ listId }: { listId: string }) => {
      const response = await fetch(`/api/lists/${listId}/reminder`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove reminder");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the lists query to refetch with updated reminder data
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
    onError: (error) => {
      console.error("Failed to remove reminder:", error);
    },
  });

  return {
    setReminderMutation,
    removeReminderMutation,
  };
}
