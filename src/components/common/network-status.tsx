"use client";

import {
  useNetworkStatus,
  useSyncStatus,
  useIndexedDBSync,
} from "@/hooks/use-offline-lists";
import { useHydration } from "@/hooks/use-hydration";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Network Status Component
 *
 * Displays network connectivity status and sync information.
 * Shows:
 * - Online/Offline status
 * - Pending sync changes count
 * - IndexedDB sync status (only on list page)
 *
 * This component automatically checks if IndexedDB is empty and shows
 * sync progress when data is being fetched from the server.
 */
export function NetworkStatus() {
  const hydrated = useHydration();
  const { isOnline } = useNetworkStatus();
  const { pendingChanges, isSyncing } = useSyncStatus();
  const { isChecking, hasSynced, syncStatus } = useIndexedDBSync();

  // Don't render anything until hydrated to prevent hydration mismatch
  if (!hydrated) {
    return null;
  }

  // Show status if offline, has pending changes, or has sync status to display
  const shouldShow =
    !isOnline ||
    pendingChanges > 0 ||
    (syncStatus.lastChecked && (isChecking || syncStatus.error || !hasSynced));

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 z-50 pb-safe">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg text-gray-800 dark:text-gray-100 dark:bg-input/30">
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

        {/* IndexedDB Sync Status */}
        {syncStatus.lastChecked && (
          <>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-1">
              {isChecking ? (
                <>
                  <Database className="h-3 w-3 text-blue-600" />
                  <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />
                  <span className="text-xs text-blue-700">Checking...</span>
                </>
              ) : syncStatus.error ? (
                <>
                  <AlertCircle className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-700">Sync Error</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-700">
                    {syncStatus.isEmpty
                      ? "Synced"
                      : `${syncStatus.itemCount} local`}
                  </span>
                </>
              )}
            </div>
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
