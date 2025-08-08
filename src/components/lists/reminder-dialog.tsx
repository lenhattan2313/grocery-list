"use client";

import { useState, useCallback } from "react";
import { Bell, Clock, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  useListReminders,
  useReminderMutation,
} from "@/hooks/use-list-reminders";
import { dialogService } from "@/stores/dialog-store";
import { PushNotificationService } from "@/lib/push-notification-service";

interface ReminderDialogProps {
  listId: string;
  listName: string;
  currentReminder?: {
    reminderTime: string;
    reminderMessage?: string;
  };
}

export function ReminderDialog({
  listId,
  listName,
  currentReminder,
}: ReminderDialogProps) {
  const [reminderTime, setReminderTime] = useState(
    currentReminder?.reminderTime
      ? format(new Date(currentReminder.reminderTime), "yyyy-MM-dd'T'HH:mm")
      : format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")
  );
  const [reminderMessage, setReminderMessage] = useState(
    currentReminder?.reminderMessage || `Don't forget to shop for "${listName}"`
  );

  const { hasPermission, requestPermission } = useListReminders();
  const { setReminderMutation, removeReminderMutation } = useReminderMutation();

  const isLoading =
    setReminderMutation.isPending || removeReminderMutation.isPending;

  const handleSetReminder = useCallback(async () => {
    if (!hasPermission) {
      // Show loading state while requesting permission
      try {
        const granted = await requestPermission();

        if (!granted) {
          // Check if permission is permanently blocked
          const currentPermission =
            "Notification" in window ? Notification.permission : "denied";

          dialogService.showDialog({
            id: "permission-error",
            title:
              currentPermission === "denied"
                ? "Notifications Blocked"
                : "Enable Notifications",
            content: (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      {currentPermission === "denied"
                        ? "Notifications are blocked"
                        : "Notifications are disabled"}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      To receive shopping reminders, please enable notifications
                      for this site.
                    </p>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
                      <p>
                        • Click the lock icon in your browser&apos;s address bar
                      </p>
                      <p>• Select &quot;Allow&quot; for notifications</p>
                      <p>• Refresh the page and try again</p>
                    </div>
                  </div>
                </div>
              </div>
            ),
            buttons: [
              {
                label: "Try Again",
                onClick: async () => {
                  dialogService.hideDialog("permission-error");
                  // Try requesting permission again
                  const retryGranted = await requestPermission();
                  if (retryGranted) {
                    // If permission is now granted, proceed with setting the reminder
                    handleSetReminder();
                  }
                },
                variant: "default",
              },
              {
                label: "Cancel",
                onClick: () => dialogService.hideDialog("permission-error"),
                variant: "outline",
              },
            ],
          });
          return;
        }
      } catch (error) {
        console.error("Failed to request permission:", error);
        return;
      }
    }

    // Register for push notifications if permission is granted
    if (hasPermission) {
      try {
        const subscription =
          await PushNotificationService.subscribeToPushNotifications();
        if (!subscription) {
          console.log(
            "Push notifications not available - continuing with local reminders only"
          );
          // Show a gentle warning that push notifications are not available
          dialogService.showDialog({
            id: "push-notification-warning",
            title: "Push Notifications Not Available",
            content: (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Push notifications not configured
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Your reminder will be saved, but you won&apos;t receive
                      push notifications. Check the ENV_SETUP.md file for
                      configuration instructions.
                    </p>
                  </div>
                </div>
              </div>
            ),
            buttons: [
              {
                label: "Continue",
                onClick: () =>
                  dialogService.hideDialog("push-notification-warning"),
                variant: "default",
              },
            ],
          });
        }
      } catch (error) {
        console.error("Failed to subscribe to push notifications:", error);
        // Continue with setting the reminder even if push subscription fails
      }
    }

    try {
      const reminderDate = new Date(reminderTime);
      await setReminderMutation.mutateAsync({
        listId,
        reminderTime: reminderDate,
        reminderMessage,
      });

      dialogService.showDialog({
        id: "reminder-success",
        title: "Reminder Set",
        content: (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Bell className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Reminder set for {format(reminderDate, "MMM d, h:mm a")}
              </p>
            </div>
          </div>
        ),
        buttons: [
          {
            label: "OK",
            onClick: () => {
              dialogService.hideDialog("reminder-success");
              dialogService.hideDialog("reminder-dialog");
            },
            variant: "default",
          },
        ],
      });
    } catch (error) {
      console.error("Failed to set reminder:", error);
      dialogService.showDialog({
        id: "reminder-error",
        title: "Error",
        content: (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800 dark:text-red-200">
                Failed to set reminder. Please try again.
              </p>
            </div>
          </div>
        ),
        buttons: [
          {
            label: "OK",
            onClick: () => dialogService.hideDialog("reminder-error"),
            variant: "default",
          },
        ],
      });
    }
  }, [
    hasPermission,
    requestPermission,
    setReminderMutation,
    listId,
    reminderTime,
    reminderMessage,
  ]);

  const handleRemoveReminder = useCallback(async () => {
    try {
      await removeReminderMutation.mutateAsync({ listId });

      dialogService.showDialog({
        id: "reminder-removed",
        title: "Reminder Removed",
        content: (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Reminder has been removed from this list.
              </p>
            </div>
          </div>
        ),
        buttons: [
          {
            label: "OK",
            onClick: () => {
              dialogService.hideDialog("reminder-removed");
              dialogService.hideDialog("reminder-dialog");
            },
            variant: "default",
          },
        ],
      });
    } catch (error) {
      console.error("Failed to remove reminder:", error);
    }
  }, [removeReminderMutation, listId]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="reminder-time" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Reminder Time
          </Label>
          <Input
            id="reminder-time"
            type="datetime-local"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="reminder-message">Reminder Message</Label>
          <Textarea
            id="reminder-message"
            value={reminderMessage}
            onChange={(e) => setReminderMessage(e.target.value)}
            placeholder="Enter a custom reminder message..."
            rows={3}
          />
        </div>

        {!hasPermission && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Notification permission is required to receive reminders.
              You&apos;ll be prompted to allow notifications when you save.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        {currentReminder && (
          <Button
            variant="destructive"
            onClick={handleRemoveReminder}
            isLoading={isLoading}
            className="gap-2"
          >
            Delete
          </Button>
        )}
        <Button
          onClick={handleSetReminder}
          isLoading={isLoading}
          className="gap-2"
        >
          {currentReminder ? "Update" : "Set"}
        </Button>
      </div>
    </div>
  );
}

// Function to show the reminder dialog using dialog service
export function showReminderDialog(
  listId: string,
  listName: string,
  currentReminder?: {
    reminderTime: string;
    reminderMessage?: string;
  }
) {
  dialogService.showDialog({
    id: "reminder-dialog",
    title: currentReminder ? "Edit Reminder" : "Set Shopping Reminder",
    content: (
      <ReminderDialog
        listId={listId}
        listName={listName}
        currentReminder={currentReminder}
      />
    ),
    maxWidth: "md",
  });
}
