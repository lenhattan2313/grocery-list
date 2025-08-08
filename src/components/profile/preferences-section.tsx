"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Bell, BellOff } from "lucide-react";
import { useThemeEnhanced } from "@/hooks/use-theme";
import { useListReminders } from "@/hooks/use-list-reminders";
import { toast } from "sonner";

export function PreferencesSection() {
  const { theme, setTheme } = useThemeEnhanced();
  const {
    hasPermission,
    isSubscribed,
    requestPermission,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
  } = useListReminders();

  const handlePushNotificationToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        if (!hasPermission) {
          const granted = await requestPermission();
          if (!granted) {
            toast.error("Notification permission is required");
            return;
          }
        }

        await subscribeToPushNotifications();
        toast.success("Push notifications enabled");
      } else {
        await unsubscribeFromPushNotifications();
        toast.success("Push notifications disabled");
      }
    } catch (error) {
      console.error("Failed to toggle push notifications:", error);
      toast.error("Failed to update push notification settings");
    }
  };

  return (
    <Card className="p-4 gap-0">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Preferences
      </h3>
      <div className="space-y-4">
        {/* Theme Preference */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Choose your preferred appearance
            </p>
          </div>
          <ThemeSwitch value={theme} onValueChange={setTheme} />
        </div>

        {/* Push Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Push Notifications
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receive notifications for list updates and reminders
              </p>
            </div>
            <Switch
              checked={isSubscribed === true}
              onCheckedChange={handlePushNotificationToggle}
              disabled={hasPermission === false}
            />
          </div>

          {/* Notification Status */}
          {hasPermission === false && (
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-300">
              Notifications are blocked. Please enable them in your browser
              settings.
            </div>
          )}

          {isSubscribed === true && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Bell className="h-3 w-3" />
              Active
            </div>
          )}

          {isSubscribed === false && hasPermission === true && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <BellOff className="h-3 w-3" />
              Not subscribed
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
