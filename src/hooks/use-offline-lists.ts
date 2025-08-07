"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { offlineSyncService, NetworkStatus } from "@/lib/offline-sync";
import { ShoppingListWithItems } from "@/types/list";
import { ShoppingItem } from "@/types/items";
import { useHydration } from "@/hooks/use-hydration";
import { SyncQueueItem } from "@/lib/indexed-db";
import { getLists } from "@/app/actions/list";

// Network status hook
export function useNetworkStatus() {
  const hydrated = useHydration();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: false, // Default to false to match server
    lastChecked: Date.now(),
  });

  useEffect(() => {
    if (!hydrated) return;

    // Set initial online status after hydration
    setNetworkStatus({
      isOnline: navigator.onLine,
      lastChecked: Date.now(),
    });

    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      unsubscribe = await offlineSyncService.addNetworkListener(
        setNetworkStatus
      );
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [hydrated]);

  return networkStatus;
}

// Offline-aware lists query
export function useOfflineListsQuery(initialData?: ShoppingListWithItems[]) {
  const { data: session, status: sessionStatus } = useSession();
  const { isOnline } = useNetworkStatus();

  return useQuery<ShoppingListWithItems[], Error>({
    queryKey: ["lists"],
    queryFn: async () => {
      if (!session?.user?.id) {
        return [];
      }
      // First, sync data from server to IndexedDB on app startup
      // if (isOnline) {
      //   try {
      //     await offlineSyncService.syncDataFromServer(session.user.id);
      //   } catch (error) {
      //     console.error("Failed to sync data from server on startup:", error);
      //   }
      // }

      // Use the same getLists function as server-side prefetch
      const result = await getLists();

      // If online, also save to IndexedDB for offline access
      if (isOnline) {
        try {
          await offlineSyncService.saveListsToIndexedDB(result);
        } catch {
          // Failed to save lists to IndexedDB
        }
      }

      return result;
    },
    initialData: initialData,
    enabled: sessionStatus === "authenticated" && !!session?.user?.id,
    staleTime: isOnline ? 30000 : Infinity, // Don't refetch when offline
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Offline-aware create list mutation
export function useOfflineCreateListMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { isOnline } = useNetworkStatus();

  return useMutation<
    ShoppingListWithItems,
    Error,
    string,
    { previousLists: ShoppingListWithItems[] }
  >({
    mutationFn: async (newListName) => {
      if (!session?.user?.id) throw new Error("Not authenticated");
      return await offlineSyncService.createList(newListName, session.user.id);
    },
    onMutate: async (newListName) => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });
      const previousLists =
        queryClient.getQueryData<ShoppingListWithItems[]>(["lists"]) || [];

      const optimisticList: ShoppingListWithItems = {
        id: `optimistic-${Date.now()}`,
        name: newListName,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: session?.user?.id || "optimistic-user",
        householdId: null,
        items: [],
        household: null,
        user: {
          id: session?.user?.id || "optimistic-user",
          name: "You",
          email: "",
          image: "",
          emailVerified: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      queryClient.setQueryData<ShoppingListWithItems[]>(
        ["lists"],
        [optimisticList, ...previousLists]
      );

      return { previousLists };
    },
    onSuccess: (newList) => {
      // Update the optimistic list with the real list data
      queryClient.setQueryData<ShoppingListWithItems[]>(
        ["lists"],
        (oldLists = []) => {
          return oldLists.map((list) =>
            list.id.startsWith("optimistic-") ? newList : list
          );
        }
      );

      toast.success(
        isOnline
          ? "List created successfully"
          : "List created offline - will sync when online"
      );
    },
    onError: (error, _, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(["lists"], context.previousLists);
      }
      toast.error(error.message || "Failed to create list");
    },
  });
}

// Offline-aware update list items mutation
export function useOfflineUpdateListItemsMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { isOnline } = useNetworkStatus();

  return useMutation<
    ShoppingListWithItems | null,
    Error,
    { listId: string; items: ShoppingItem[] }
  >({
    mutationFn: async ({ listId, items }) => {
      if (!session?.user?.id) throw new Error("Not authenticated");
      return await offlineSyncService.updateListItems(listId, items);
    },
    onMutate: async ({ listId, items }) => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });
      // Optimistically update the lists array
      queryClient.setQueryData<ShoppingListWithItems[]>(
        ["lists"],
        (oldLists = []) => {
          return oldLists.map((list) =>
            list.id === listId
              ? { ...list, items, updatedAt: new Date() }
              : list
          );
        }
      );
    },
    onSuccess: (updatedList) => {
      if (updatedList) {
        toast.success(
          isOnline
            ? "List updated successfully"
            : "List updated offline - will sync when online"
        );
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update list");
      // Invalidate queries to refetch data on error
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

// Offline-aware update list name mutation
export function useOfflineUpdateListNameMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { isOnline } = useNetworkStatus();

  return useMutation<
    ShoppingListWithItems | null,
    Error,
    { listId: string; name: string }
  >({
    mutationFn: async ({ listId, name }) => {
      if (!session?.user?.id) throw new Error("Not authenticated");

      // Use the dedicated updateListName method which handles IndexedDB and sync queue
      return await offlineSyncService.updateListName(listId, name);
    },
    onMutate: async ({ listId, name }) => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });

      // Optimistically update the lists array
      queryClient.setQueryData<ShoppingListWithItems[]>(
        ["lists"],
        (oldLists = []) => {
          return oldLists.map((list) =>
            list.id === listId ? { ...list, name, updatedAt: new Date() } : list
          );
        }
      );
    },
    onSuccess: (updatedList) => {
      if (updatedList) {
        toast.success(
          isOnline
            ? "List name updated successfully"
            : "List name updated offline - will sync when online"
        );
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update list name");
      // Invalidate queries to refetch data on error
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

// Offline-aware delete list mutation
export function useOfflineDeleteListMutation() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  return useMutation<void, Error, string>({
    mutationFn: async (listId) => {
      await offlineSyncService.deleteList(listId);
    },
    onMutate: async (listId) => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });

      // Optimistically remove from lists
      queryClient.setQueryData<ShoppingListWithItems[]>(
        ["lists"],
        (oldLists = []) => oldLists.filter((list) => list.id !== listId)
      );
    },
    onSuccess: () => {
      toast.success(
        isOnline
          ? "List deleted successfully"
          : "List deleted offline - will sync when online"
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete list");
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

// Sync status hook
export function useSyncStatus() {
  const hydrated = useHydration();
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshSyncStatus = useCallback(async () => {
    try {
      const queue = await offlineSyncService.getSyncQueue();
      setSyncQueue(queue);
      setIsSyncing(queue.length > 0);
    } catch {
      // Failed to get sync status
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    refreshSyncStatus();

    // Refresh every 5 seconds
    const interval = setInterval(refreshSyncStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshSyncStatus, hydrated]);

  return {
    syncQueue,
    isSyncing,
    pendingChanges: syncQueue.length,
    refreshSyncStatus,
  };
}

// Manual sync hook for forcing server sync
export function useManualSync() {
  const { data: session } = useSession();
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();

  const syncFromServer = useCallback(async () => {
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    if (!isOnline) {
      throw new Error("Cannot sync while offline");
    }

    try {
      const result = await offlineSyncService.forceSyncFromServer(
        session.user.id
      );

      if (result.synced) {
        // Invalidate and refetch lists after successful sync
        await queryClient.invalidateQueries({ queryKey: ["lists"] });
      }

      return result;
    } catch (error) {
      console.error("Manual sync failed:", error);
      throw error;
    }
  }, [session?.user?.id, isOnline, queryClient]);

  return {
    syncFromServer,
    canSync: isOnline && !!session?.user?.id,
  };
}

/**
 * Hook to check if IndexedDB is empty and trigger manual sync
 *
 * This hook automatically checks if IndexedDB has any data when the user is online.
 * If IndexedDB is empty, it triggers a manual sync from the server to populate
 * the local database for offline access.
 *
 * @returns {Object} Object containing sync state and status
 * @returns {boolean} returns.isChecking - Whether a sync check is currently in progress
 * @returns {boolean} returns.hasSynced - Whether the initial sync has been completed
 * @returns {Object} returns.syncStatus - Detailed sync status information
 * @returns {boolean} returns.syncStatus.isEmpty - Whether IndexedDB was empty when checked
 * @returns {number} returns.syncStatus.itemCount - Number of items in IndexedDB
 * @returns {Date|null} returns.syncStatus.lastChecked - When the last check occurred
 * @returns {string|null} returns.syncStatus.error - Any error that occurred during sync
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isChecking, hasSynced, syncStatus } = useIndexedDBSync();
 *
 *   if (isChecking) {
 *     return <div>Checking local data...</div>;
 *   }
 *
 *   if (syncStatus.error) {
 *     return <div>Sync error: {syncStatus.error}</div>;
 *   }
 *
 *   return <div>Local data: {syncStatus.itemCount} items</div>;
 * }
 * ```
 */
export function useIndexedDBSync() {
  const { data: session } = useSession();
  const { isOnline } = useNetworkStatus();
  const { syncFromServer } = useManualSync();
  const [isChecking, setIsChecking] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    isEmpty: boolean;
    itemCount: number;
    lastChecked: Date | null;
    error: string | null;
  }>({
    isEmpty: false,
    itemCount: 0,
    lastChecked: null,
    error: null,
  });

  useEffect(() => {
    const checkAndSyncIfEmpty = async () => {
      // Only run once per session and when online
      if (!session?.user?.id || !isOnline || hasSynced || isChecking) {
        return;
      }

      setIsChecking(true);
      setSyncStatus((prev) => ({ ...prev, error: null }));

      try {
        // Check if IndexedDB has any lists and compare with database
        const dbSize = await offlineSyncService.getDatabaseSize();
        const comparison =
          await offlineSyncService.compareDatabaseWithIndexedDB();

        setSyncStatus({
          isEmpty: dbSize === 0,
          itemCount: dbSize,
          lastChecked: new Date(),
          error: null,
        });

        if (dbSize === 0 || comparison.needsSync) {
          console.log(
            dbSize === 0
              ? "IndexedDB is empty, triggering manual sync..."
              : "Differences found between database and IndexedDB, triggering sync..."
          );
          await syncFromServer();
          setHasSynced(true);
          console.log("Manual sync completed successfully");
        } else {
          console.log(
            `IndexedDB has ${dbSize} items and is in sync, no sync needed`
          );
          setHasSynced(true);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Failed to check/sync IndexedDB:", error);
        setSyncStatus((prev) => ({
          ...prev,
          error: errorMessage,
          lastChecked: new Date(),
        }));
        // Don't set hasSynced to true so we can retry later
      } finally {
        setIsChecking(false);
      }
    };

    checkAndSyncIfEmpty();
  }, [session?.user?.id, isOnline, hasSynced, isChecking, syncFromServer]);

  // Reset sync state when user changes
  useEffect(() => {
    setHasSynced(false);
    setSyncStatus({
      isEmpty: false,
      itemCount: 0,
      lastChecked: null,
      error: null,
    });
  }, [session?.user?.id]);

  return {
    isChecking,
    hasSynced,
    syncStatus,
  };
}
