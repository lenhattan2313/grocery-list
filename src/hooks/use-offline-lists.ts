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
      console.log("useOfflineListsQuery - fetching lists", session?.user?.id);
      if (!session?.user?.id) {
        console.log("No session user ID, returning empty array");
        return [];
      }

      // Use the same getLists function as server-side prefetch
      const result = await getLists();
      console.log("getLists result:", result.length, "lists");

      // If online, also save to IndexedDB for offline access
      if (isOnline) {
        try {
          await offlineSyncService.saveListsToIndexedDB(result);
        } catch (error) {
          console.warn("Failed to save lists to IndexedDB:", error);
        }
      }

      return result;
    },
    initialData,
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
    onSuccess: () => {
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
    } catch (error) {
      console.error("Failed to get sync status:", error);
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
