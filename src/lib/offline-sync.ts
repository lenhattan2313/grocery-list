import {
  indexedDBService,
  SyncQueueItem,
  UserData,
  SyncAction,
} from "./indexed-db";
import { ShoppingListWithItems } from "@/types/list";
import { ShoppingItem } from "@/types/items";
import {
  getLists,
  createList,
  updateList,
  deleteList,
  updateListItems,
} from "@/app/actions/list";

export interface NetworkStatus {
  isOnline: boolean;
  lastChecked: number;
}

// Define sync data types for better type safety
export interface CreateListData {
  name: string;
}

export interface UpdateListData {
  listId: string;
  name: string;
}

export interface UpdateListItemsData {
  listId: string;
  items: ShoppingItem[];
}

export interface DeleteListData {
  listId: string;
}

export type SyncData =
  | CreateListData
  | UpdateListData
  | UpdateListItemsData
  | DeleteListData;

class OfflineSyncService {
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private initialized: boolean = false;

  constructor() {
    // Don't initialize immediately to avoid SSR issues
  }

  private async init(): Promise<void> {
    if (this.initialized) return;

    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      console.warn(
        "OfflineSyncService: Not in browser environment, skipping initialization"
      );
      return;
    }

    // Initialize IndexedDB
    await indexedDBService.init();

    // Set initial online status
    this.isOnline = navigator.onLine;

    // Set up network event listeners
    window.addEventListener("online", this.handleOnline.bind(this));
    window.addEventListener("offline", this.handleOffline.bind(this));

    // Start sync interval
    this.startSyncInterval();

    // Initial sync if online
    if (this.isOnline) {
      this.syncData();
    }

    this.initialized = true;
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.notifyListeners();
    this.syncData();
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const status: NetworkStatus = {
      isOnline: this.isOnline,
      lastChecked: Date.now(),
    };

    this.listeners.forEach((listener) => listener(status));
  }

  private startSyncInterval(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncData();
      }
    }, 30000);
  }

  public async getNetworkStatus(): Promise<NetworkStatus> {
    await this.ensureInitialized();
    return {
      isOnline: this.isOnline,
      lastChecked: Date.now(),
    };
  }

  public async addNetworkListener(
    listener: (status: NetworkStatus) => void
  ): Promise<() => void> {
    await this.ensureInitialized();
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  // Data fetching with offline fallback
  public async fetchLists(userId: string): Promise<ShoppingListWithItems[]> {
    console.log("offlineSyncService.fetchLists called with userId:", userId);
    await this.ensureInitialized();

    try {
      if (this.isOnline) {
        console.log("Online - fetching from server");
        // Try to fetch from server
        const serverLists = await getLists();
        console.log("Server returned", serverLists.length, "lists");

        // Save to IndexedDB for offline access
        await indexedDBService.saveLists(serverLists);

        // Update user data
        await indexedDBService.updateOnlineStatus(userId, true);
        await indexedDBService.saveUserData({
          userId,
          isOnline: true,
          lastSyncTimestamp: Date.now(),
        });

        return serverLists;
      } else {
        console.log("Offline - fetching from IndexedDB");
        // Return cached data from IndexedDB
        const cachedLists = await indexedDBService.getLists();
        console.log("IndexedDB returned", cachedLists.length, "lists");
        return cachedLists;
      }
    } catch (error) {
      console.warn(
        "Failed to fetch lists from server, using cached data:",
        error
      );

      // Fallback to cached data
      const cachedLists = await indexedDBService.getLists();
      console.log("Fallback IndexedDB returned", cachedLists.length, "lists");
      return cachedLists;
    }
  }

  public async fetchList(
    listId: string
  ): Promise<ShoppingListWithItems | null> {
    await this.ensureInitialized();

    try {
      if (this.isOnline) {
        // Try to fetch from server
        const serverList = await getLists();
        const list = serverList.find((l) => l.id === listId);

        if (list) {
          // Save to IndexedDB
          await indexedDBService.saveList(list);
          return list;
        }
      }

      // Fallback to cached data
      return await indexedDBService.getList(listId);
    } catch (error) {
      console.warn(
        "Failed to fetch list from server, using cached data:",
        error
      );
      return await indexedDBService.getList(listId);
    }
  }

  // Save lists to IndexedDB without fetching from server
  public async saveListsToIndexedDB(
    lists: ShoppingListWithItems[]
  ): Promise<void> {
    await this.ensureInitialized();
    await indexedDBService.saveLists(lists);
  }

  // Save a single list to IndexedDB
  public async saveListToIndexedDB(list: ShoppingListWithItems): Promise<void> {
    await this.ensureInitialized();
    await indexedDBService.saveList(list);
  }

  // Offline-first operations
  public async createList(
    name: string,
    userId: string
  ): Promise<ShoppingListWithItems> {
    await this.ensureInitialized();

    const tempId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const newList: ShoppingListWithItems = {
      id: tempId,
      name,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      householdId: null,
      items: [],
      household: null,
      user: {
        id: userId,
        name: "You",
        email: "",
        image: "",
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    // Save to IndexedDB immediately
    await indexedDBService.saveList(newList);

    // Add to sync queue
    await indexedDBService.addToSyncQueue("CREATE_LIST", { name });
    console.log("Added to sync queue", this.isOnline);
    // Try to sync immediately if online (but don't wait for it)
    if (this.isOnline) {
      // Fire and forget - don't wait for sync to complete
      this.syncData().catch((error) => {
        console.warn("Background sync failed:", error);
      });
    }

    return newList;
  }

  public async updateListItems(
    listId: string,
    items: ShoppingItem[]
  ): Promise<ShoppingListWithItems | null> {
    await this.ensureInitialized();

    // Update local data immediately
    const list = await indexedDBService.getList(listId);
    if (!list) return null;

    const updatedList: ShoppingListWithItems = {
      ...list,
      items,
      updatedAt: new Date(),
    };

    await indexedDBService.saveList(updatedList);

    // Add to sync queue
    await indexedDBService.addToSyncQueue("UPDATE_LIST_ITEMS", {
      listId,
      items,
    });

    // Try to sync immediately if online (but don't wait for it)
    if (this.isOnline) {
      // Fire and forget - don't wait for sync to complete
      this.syncData().catch((error) => {
        console.warn("Background sync failed:", error);
      });
    }

    return updatedList;
  }

  public async updateListName(
    listId: string,
    name: string
  ): Promise<ShoppingListWithItems | null> {
    await this.ensureInitialized();

    // Update local data immediately
    const list = await indexedDBService.getList(listId);
    if (!list) return null;

    const updatedList: ShoppingListWithItems = {
      ...list,
      name,
      updatedAt: new Date(),
    };

    await indexedDBService.saveList(updatedList);

    // Add to sync queue
    await indexedDBService.addToSyncQueue("UPDATE_LIST", { listId, name });

    // Try to sync immediately if online (but don't wait for it)
    if (this.isOnline) {
      // Fire and forget - don't wait for sync to complete
      this.syncData().catch((error) => {
        console.warn("Background sync failed:", error);
      });
    }

    return updatedList;
  }

  public async deleteList(listId: string): Promise<void> {
    await this.ensureInitialized();

    // Delete from local storage immediately
    await indexedDBService.deleteList(listId);

    // Add to sync queue
    await indexedDBService.addToSyncQueue("DELETE_LIST", { listId });

    // Try to sync immediately if online (but don't wait for it)
    if (this.isOnline) {
      // Fire and forget - don't wait for sync to complete
      this.syncData().catch((error) => {
        console.warn("Background sync failed:", error);
      });
    }
  }

  public async addToSyncQueue(
    action: SyncAction,
    data: SyncData
  ): Promise<void> {
    await this.ensureInitialized();
    await indexedDBService.addToSyncQueue(action, data);

    // Try to sync immediately if online (but don't wait for it)
    if (this.isOnline) {
      // Fire and forget - don't wait for sync to complete
      this.syncData().catch((error) => {
        console.warn("Background sync failed:", error);
      });
    }
  }

  // Sync operations
  private async syncData(): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      const queue = await indexedDBService.getSyncQueue();

      for (const item of queue) {
        try {
          await this.processSyncItem(item);
          await indexedDBService.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error("Failed to process sync item:", item, error);

          // Increment retry count
          const newRetryCount = item.retryCount + 1;

          if (newRetryCount >= item.maxRetries) {
            // Remove from queue if max retries reached
            await indexedDBService.removeFromSyncQueue(item.id);
            console.error("Max retries reached for sync item:", item);
          } else {
            // Update retry count
            await indexedDBService.updateSyncQueueItem(item.id, {
              retryCount: newRetryCount,
            });
          }
        }
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    switch (item.action) {
      case "CREATE_LIST":
        await createList((item.data as CreateListData).name);
        break;

      case "UPDATE_LIST":
        await updateList((item.data as UpdateListData).listId, {
          name: (item.data as UpdateListData).name,
        });
        break;

      case "UPDATE_LIST_ITEMS":
        await updateListItems(
          (item.data as UpdateListItemsData).listId,
          (item.data as UpdateListItemsData).items
        );
        break;

      case "DELETE_LIST":
        await deleteList((item.data as DeleteListData).listId);
        break;

      default:
        console.warn("Unknown sync action:", item.action);
    }
  }

  // Utility methods
  public async getSyncQueue(): Promise<SyncQueueItem[]> {
    await this.ensureInitialized();
    return await indexedDBService.getSyncQueue();
  }

  public async getUserData(userId: string): Promise<UserData | null> {
    await this.ensureInitialized();
    return await indexedDBService.getUserData(userId);
  }

  public async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    await indexedDBService.clearAllData();
  }

  public async getDatabaseSize(): Promise<number> {
    await this.ensureInitialized();
    return await indexedDBService.getDatabaseSize();
  }

  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline.bind(this));
      window.removeEventListener("offline", this.handleOffline.bind(this));
    }

    this.listeners.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService();
