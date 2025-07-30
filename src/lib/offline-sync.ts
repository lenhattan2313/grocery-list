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
  createListWithItems,
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
  tempId?: string; // Track the temporary ID for dependency resolution
  items?: ShoppingItem[]; // Allow initial items when creating list
}

export interface UpdateListData {
  listId: string;
  name: string;
  tempId?: string; // Track if this was originally a temp ID
}

export interface UpdateListItemsData {
  listId: string;
  items: ShoppingItem[];
  tempId?: string; // Track if this was originally a temp ID
}

export interface DeleteListData {
  listId: string;
  tempId?: string; // Track if this was originally a temp ID
}

export type SyncData =
  | CreateListData
  | UpdateListData
  | UpdateListItemsData
  | DeleteListData;

// Track ID mappings for dependency resolution
interface IdMapping {
  tempId: string;
  realId: string;
  timestamp: number;
}

class OfflineSyncService {
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private initialized: boolean = false;
  private idMappings: Map<string, IdMapping> = new Map(); // tempId -> realId mapping

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

  // Helper method to get real ID from temp ID
  private getRealId(tempId: string): string | null {
    const mapping = this.idMappings.get(tempId);
    return mapping ? mapping.realId : null;
  }

  // Helper method to check if an ID is temporary
  private isTempId(id: string): boolean {
    return id.startsWith("temp_");
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

    // Add to sync queue with temp ID tracking
    await indexedDBService.addToSyncQueue("CREATE_LIST", {
      name,
      tempId,
      items: [], // Always include items field for consistency
    });
    console.log("Added CREATE_LIST to sync queue with tempId:", tempId);

    // Try to sync immediately if online (but don't wait for it)
    if (this.isOnline) {
      // Fire and forget - don't wait for sync to complete
      this.syncData().catch((error) => {
        console.warn("Background sync failed:", error);
      });
    }

    return newList;
  }

  public async createListWithItems(
    name: string,
    userId: string,
    items: ShoppingItem[]
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
      items,
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

    // Add to sync queue with temp ID tracking and initial items
    await indexedDBService.addToSyncQueue("CREATE_LIST", {
      name,
      tempId,
      items,
    });
    console.log(
      "Added CREATE_LIST with items to sync queue with tempId:",
      tempId
    );

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

    console.log("updateListItems called with listId:", listId, "items:", items);

    // Update local data immediately
    const list = await indexedDBService.getList(listId);
    console.log("list", list);
    if (!list) {
      console.warn("List not found in IndexedDB for listId:", listId);
      // Let's check what lists are available
      const allLists = await indexedDBService.getLists();
      console.log(
        "Available lists in IndexedDB:",
        allLists.map((l) => ({
          id: l.id,
          name: l.name,
          itemsCount: l.items?.length || 0,
        }))
      );
      return null;
    }

    const updatedList: ShoppingListWithItems = {
      ...list,
      items,
      updatedAt: new Date(),
    };

    await indexedDBService.saveList(updatedList);

    // Check if this is a temporary list and if there's a CREATE_LIST queue item for it
    const isTemp = this.isTempId(listId);
    if (isTemp) {
      const queue = await indexedDBService.getSyncQueue();
      const createListQueueItem = queue.find(
        (item) =>
          item.action === "CREATE_LIST" &&
          (item.data as CreateListData).tempId === listId
      );

      if (createListQueueItem) {
        // If there's a CREATE_LIST queue item, update it to include the items
        const createData = createListQueueItem.data as CreateListData;
        if (!createData.items || createData.items.length === 0) {
          console.log(
            "Updating CREATE_LIST queue item to include items for temp list:",
            listId
          );
          // Remove the old CREATE_LIST queue item
          await indexedDBService.removeFromSyncQueue(createListQueueItem.id);
          // Add new CREATE_LIST queue item with items
          await indexedDBService.addToSyncQueue("CREATE_LIST", {
            name: createData.name,
            tempId: createData.tempId,
            items,
          });
        } else {
          // If CREATE_LIST already has items, add UPDATE_LIST_ITEMS
          await indexedDBService.addToSyncQueue("UPDATE_LIST_ITEMS", {
            listId,
            items,
            tempId: listId,
          });
        }
      } else {
        // No CREATE_LIST queue item found, add UPDATE_LIST_ITEMS
        await indexedDBService.addToSyncQueue("UPDATE_LIST_ITEMS", {
          listId,
          items,
          tempId: listId,
        });
      }
    } else {
      // Not a temporary list, add UPDATE_LIST_ITEMS
      await indexedDBService.addToSyncQueue("UPDATE_LIST_ITEMS", {
        listId,
        items,
        tempId: undefined,
      });
    }

    // Try to sync immediately if online (but don't wait for it)
    if (this.isOnline) {
      // Fire and forget - don't wait for sync to complete
      this.syncData().catch((error) => {
        console.warn("Background sync failed:", error);
      });
    }

    return updatedList;
  }

  public async addItemsToListByName(
    listName: string,
    items: ShoppingItem[],
    userId: string
  ): Promise<ShoppingListWithItems | null> {
    await this.ensureInitialized();

    console.log(
      "addItemsToListByName called with listName:",
      listName,
      "items:",
      items,
      "userId:",
      userId
    );

    // Find the list by name
    const list = await indexedDBService.getListByName(listName);
    console.log("Found list by name:", list);

    if (!list) {
      console.log(
        "List not found by name, creating new list with items:",
        listName
      );
      // Create a new list with the items directly - this will result in 1 queue item
      return await this.createListWithItems(listName, userId, items);
    }

    // Check if this is a temporary list with empty items (just created)
    const isTempList = this.isTempId(list.id);
    const hasEmptyItems = !list.items || list.items.length === 0;

    if (isTempList && hasEmptyItems) {
      console.log(
        "Found temporary list with empty items, replacing with new list that has items:",
        listName
      );
      // Delete the existing temporary list
      await indexedDBService.deleteList(list.id);
      // Remove the CREATE_LIST queue item for the empty list
      const queue = await indexedDBService.getSyncQueue();
      const emptyListQueueItem = queue.find(
        (item) =>
          item.action === "CREATE_LIST" &&
          (item.data as CreateListData).tempId === list.id
      );
      if (emptyListQueueItem) {
        await indexedDBService.removeFromSyncQueue(emptyListQueueItem.id);
      }
      // Create a new list with the items
      return await this.createListWithItems(listName, userId, items);
    }

    // Merge new items with existing items
    const existingItems = list.items || [];
    const mergedItems = [...existingItems, ...items];
    console.log("Merged items:", mergedItems, "for listId:", list.id);

    // Update the list with merged items
    return await this.updateListItems(list.id, mergedItems);
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

    // Add to sync queue with temp ID tracking if it's a temp ID
    const isTemp = this.isTempId(listId);
    await indexedDBService.addToSyncQueue("UPDATE_LIST", {
      listId,
      name,
      tempId: isTemp ? listId : undefined,
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

  public async deleteList(listId: string): Promise<void> {
    await this.ensureInitialized();

    // Delete from local storage immediately
    await indexedDBService.deleteList(listId);

    // Add to sync queue with temp ID tracking if it's a temp ID
    const isTemp = this.isTempId(listId);
    await indexedDBService.addToSyncQueue("DELETE_LIST", {
      listId,
      tempId: isTemp ? listId : undefined,
    });

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
    console.log("Starting sync process...");

    try {
      const queue = await indexedDBService.getSyncQueue();
      console.log("Processing sync queue with", queue.length, "items");

      // Sort queue to ensure CREATE_LIST operations come first
      const sortedQueue = queue.sort((a, b) => {
        if (a.action === "CREATE_LIST" && b.action !== "CREATE_LIST") return -1;
        if (b.action === "CREATE_LIST" && a.action !== "CREATE_LIST") return 1;
        return a.timestamp - b.timestamp;
      });

      console.log(
        "Sorted queue:",
        sortedQueue.map((item) => ({
          action: item.action,
          tempId:
            "tempId" in item.data ? (item.data as SyncData).tempId : undefined,
        }))
      );

      for (const item of sortedQueue) {
        try {
          console.log("Processing item:", item.action, "with data:", item.data);
          await this.processSyncItem(item);
          await indexedDBService.removeFromSyncQueue(item.id);
          console.log("Successfully processed and removed item:", item.id);
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
            console.log(
              "Updated retry count for item:",
              item.id,
              "to",
              newRetryCount
            );
          }
        }
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      this.syncInProgress = false;
      console.log("Sync process completed");
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    console.log("Processing sync item:", item.action, item.data);

    switch (item.action) {
      case "CREATE_LIST":
        const createData = item.data as CreateListData;
        let newList: ShoppingListWithItems | null;

        if (createData.items && createData.items.length > 0) {
          // Use createListWithItems if items are provided
          newList = await createListWithItems(
            createData.name,
            createData.items
          );
        } else {
          // Use createList if no items are provided
          newList = await createList(createData.name);
        }

        if (newList && createData.tempId) {
          // Store the mapping from temp ID to real ID
          this.idMappings.set(createData.tempId, {
            tempId: createData.tempId,
            realId: newList.id,
            timestamp: Date.now(),
          });

          // Update the local list with the real ID
          const tempList = await indexedDBService.getList(createData.tempId);
          if (tempList) {
            const updatedList = { ...tempList, id: newList.id };
            await indexedDBService.deleteList(createData.tempId);
            await indexedDBService.saveList(updatedList);
          }

          console.log(
            "Mapped temp ID",
            createData.tempId,
            "to real ID",
            newList.id
          );
        }
        break;

      case "UPDATE_LIST":
        const updateData = item.data as UpdateListData;
        let updateListId = updateData.listId;

        // If this was a temp ID, get the real ID
        if (updateData.tempId) {
          const realId = this.getRealId(updateData.tempId);
          if (realId) {
            updateListId = realId;
          } else {
            console.warn(
              "No real ID mapping found for temp ID:",
              updateData.tempId
            );
            return; // Skip this item until the CREATE_LIST is processed
          }
        }

        await updateList(updateListId, { name: updateData.name });
        break;

      case "UPDATE_LIST_ITEMS":
        const updateItemsData = item.data as UpdateListItemsData;
        let updateItemsListId = updateItemsData.listId;

        // If this was a temp ID, get the real ID
        if (updateItemsData.tempId) {
          const realId = this.getRealId(updateItemsData.tempId);
          if (realId) {
            updateItemsListId = realId;
          } else {
            console.warn(
              "No real ID mapping found for temp ID:",
              updateItemsData.tempId
            );
            return; // Skip this item until the CREATE_LIST is processed
          }
        }

        await updateListItems(updateItemsListId, updateItemsData.items);
        break;

      case "DELETE_LIST":
        const deleteData = item.data as DeleteListData;
        let deleteListId = deleteData.listId;

        // If this was a temp ID, get the real ID
        if (deleteData.tempId) {
          const realId = this.getRealId(deleteData.tempId);
          if (realId) {
            deleteListId = realId;
          } else {
            console.warn(
              "No real ID mapping found for temp ID:",
              deleteData.tempId
            );
            return; // Skip this item until the CREATE_LIST is processed
          }
        }

        await deleteList(deleteListId);
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
    this.idMappings.clear();
  }

  public async getDatabaseSize(): Promise<number> {
    await this.ensureInitialized();
    return await indexedDBService.getDatabaseSize();
  }

  // Debug method to get current ID mappings
  public getIdMappings(): Map<string, IdMapping> {
    return new Map(this.idMappings);
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
    this.idMappings.clear();
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService();
