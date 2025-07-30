"use client";

import { useNetworkStatus, useSyncStatus } from "@/hooks/use-offline-lists";
import { useHydration } from "@/hooks/use-hydration";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NetworkStatus() {
  const hydrated = useHydration();
  const { isOnline } = useNetworkStatus();
  const { pendingChanges, isSyncing } = useSyncStatus();

  // Don't render anything until hydrated to prevent hydration mismatch
  if (!hydrated) {
    return null;
  }

  if (isOnline && pendingChanges === 0) {
    return null; // Don't show anything when online and synced
  }

  return (
    <div className="fixed bottom-20 left-4 z-50">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Online</span>
            {pendingChanges > 0 && (
              <>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center gap-1">
                  {isSyncing && (
                    <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {pendingChanges} pending
                  </Badge>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Offline</span>
            {pendingChanges > 0 && (
              <>
                <div className="w-px h-4 bg-gray-300" />
                <Badge variant="secondary" className="text-xs">
                  {pendingChanges} queued
                </Badge>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function NetworkStatusInline() {
  const hydrated = useHydration();
  const { isOnline } = useNetworkStatus();
  const { pendingChanges } = useSyncStatus();

  // Don't render anything until hydrated to prevent hydration mismatch
  if (!hydrated) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-600" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-600" />
      )}
      <span
        className={cn(
          "text-sm font-medium",
          isOnline ? "text-green-700" : "text-red-700"
        )}
      >
        {isOnline ? "Online" : "Offline"}
      </span>
      {pendingChanges > 0 && (
        <Badge variant="secondary" className="text-xs">
          {pendingChanges}
        </Badge>
      )}
    </div>
  );
}
