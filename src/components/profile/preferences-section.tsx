"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { useThemeEnhanced } from "@/hooks/use-theme";

export function PreferencesSection() {
  const { theme, setTheme } = useThemeEnhanced();

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
            checked={false}
            onCheckedChange={() => {
              // Do nothing - placeholder for future implementation
            }}
            disabled
          />
        </div>
      </div>
    </Card>
  );
}
