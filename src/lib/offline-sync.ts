import {
  indexedDBService,
  SyncQueueItem,
  UserData,
  SyncAction,
} from "./indexed-db";
import { ShoppingListWithItems } from "@/types/list";
import { ShoppingItem } from "@/types/items";
import {
  NetworkStatus,
  CreateListData,
  UpdateListData,
  UpdateListItemsData,
  DeleteListData,
  SyncData,
  IdMapping,
  SyncMetrics,
  SyncConfig,
} from "@/types/offline";
import {
  getLists,
  createList,
  createListWithItems,
  updateList,
  deleteList,
  updateListItems,
} from "@/app/actions/list";

class OfflineSyncService {
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private initialized: boolean = false;
  private idMappings: Map<string, IdMapping> = new Map();
  private pendingSyncs: Set<string> = new Set();
  private syncMetrics: SyncMetrics = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageSyncTime: 0,
    lastSyncTime: 0,
  };
  private config: SyncConfig = {
    syncInterval: 30000,
    maxRetries: 3,
    batchSize: 10,
    maxQueueSize: 1000,
  };

  constructor() {
    // Lazy initialization to avoid SSR issues
  }

  private async init(): Promise<void> {
    if (this.initialized) return;

    if (typeof window === "undefined") {
      return;
    }

    await indexedDBService.init();
    this.isOnline = navigator.onLine;

    // Use arrow functions to maintain proper binding
    window.addEventListener("online", () => this.handleOnline());
    window.addEventListener("offline", () => this.handleOffline());

    this.startSyncInterval();

    if (this.isOnline) {
      this.syncData();
    }

    this.initialized = true;
  }

  // New method to sync data from database to IndexedDB on app startup
  public async syncDataFromServer(userId: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.isOnline) {
      console.log("Offline - skipping server sync");
      return;
    }

    try {
      console.log("Syncing data from server to IndexedDB...");
      const serverLists = await getLists();
      await indexedDBService.saveLists(serverLists);
      await this.updateUserData(userId, true);
      console.log(
        `Synced ${serverLists.length} lists from server to IndexedDB`
      );
    } catch (error) {
      console.error("Failed to sync data from server:", error);
      // Don't throw - fall back to IndexedDB data
    }
  }

  // New method to compare database and IndexedDB data
  public async compareDatabaseWithIndexedDB(): Promise<{
    needsSync: boolean;
    differences: {
      serverCount: number;
      indexedDBCount: number;
      missingInIndexedDB: string[];
      extraInIndexedDB: string[];
      differentContent: string[];
    };
  }> {
    await this.ensureInitialized();

    try {
      // Get data from both sources
      const serverLists = await getLists();
      const indexedDBLists = await indexedDBService.getLists();

      const serverIds = new Set(serverLists.map((list) => list.id));
      const indexedDBIds = new Set(indexedDBLists.map((list) => list.id));

      // Find differences
      const missingInIndexedDB = serverLists
        .filter((list) => !indexedDBIds.has(list.id))
        .map((list) => list.id);

      const extraInIndexedDB = indexedDBLists
        .filter((list) => !serverIds.has(list.id))
        .map((list) => list.id);

      // Check for content differences in common lists
      const differentContent: string[] = [];
      for (const serverList of serverLists) {
        const indexedDBList = indexedDBLists.find(
          (list) => list.id === serverList.id
        );
        if (indexedDBList) {
          // Compare key fields that indicate changes
          if (
            serverList.name !== indexedDBList.name ||
            serverList.isCompleted !== indexedDBList.isCompleted ||
            serverList.updatedAt.getTime() !==
              indexedDBList.updatedAt.getTime() ||
            serverList.items.length !== indexedDBList.items.length ||
            JSON.stringify(
              serverList.items.map((item) => ({
                id: item.id,
                name: item.name,
                isCompleted: item.isCompleted,
              }))
            ) !==
              JSON.stringify(
                indexedDBList.items.map((item) => ({
                  id: item.id,
                  name: item.name,
                  isCompleted: item.isCompleted,
                }))
              )
          ) {
            differentContent.push(serverList.id);
          }
        }
      }

      const needsSync =
        missingInIndexedDB.length > 0 ||
        extraInIndexedDB.length > 0 ||
        differentContent.length > 0;

      return {
        needsSync,
        differences: {
          serverCount: serverLists.length,
          indexedDBCount: indexedDBLists.length,
          missingInIndexedDB,
          extraInIndexedDB,
          differentContent,
        },
      };
    } catch (error) {
      console.error("Failed to compare database with IndexedDB:", error);
      // If comparison fails, assume sync is needed
      return {
        needsSync: true,
        differences: {
          serverCount: 0,
          indexedDBCount: 0,
          missingInIndexedDB: [],
          extraInIndexedDB: [],
          differentContent: [],
        },
      };
    }
  }

  public async forceSyncFromServer(userId: string): Promise<{
    synced: boolean;
    reason: string;
    differences?: {
      serverCount: number;
      indexedDBCount: number;
      missingInIndexedDB: string[];
      extraInIndexedDB: string[];
      differentContent: string[];
    };
  }> {
    await this.ensureInitialized();

    try {
      console.log("Checking if sync is needed...");

      // Compare database with IndexedDB
      const comparison = await this.compareDatabaseWithIndexedDB();

      if (!comparison.needsSync) {
        console.log("No sync needed - database and IndexedDB are in sync");
        return {
          synced: false,
          reason: "No differences found between database and IndexedDB",
          differences: comparison.differences,
        };
      }

      console.log(
        "Differences found, syncing data from server to IndexedDB..."
      );
      console.log("Differences:", comparison.differences);

      const serverLists = await getLists();
      await indexedDBService.saveLists(serverLists);
      await this.updateUserData(userId, true);

      console.log(
        `Force synced ${serverLists.length} lists from server to IndexedDB`
      );

      return {
        synced: true,
        reason: "Successfully synced due to differences",
        differences: comparison.differences,
      };
    } catch (error) {
      console.error("Failed to force sync data from server:", error);
      throw error; // Re-throw for manual sync scenarios
    }
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

    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch {
        // Silently handle listener errors to prevent service disruption
      }
    });
  }

  private startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncData();
      }
    }, this.config.syncInterval);
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

    return () => {
      this.listeners.delete(listener);
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  // Optimized data fetching with caching
  public async fetchLists(userId: string): Promise<ShoppingListWithItems[]> {
    await this.ensureInitialized();

    try {
      if (this.isOnline) {
        const serverLists = await getLists();
        await indexedDBService.saveLists(serverLists);
        await this.updateUserData(userId, true);
        return serverLists;
      } else {
        return await indexedDBService.getLists();
      }
    } catch {
      return await indexedDBService.getLists();
    }
  }

  public async saveListsToIndexedDB(
    lists: ShoppingListWithItems[]
  ): Promise<void> {
    await this.ensureInitialized();
    await indexedDBService.saveLists(lists);
  }

  private getRealId(tempId: string): string | null {
    const mapping = this.idMappings.get(tempId);
    return mapping ? mapping.realId : null;
  }

  private isTempId(id: string): boolean {
    return id.startsWith("temp_");
  }

  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createUserObject(userId: string) {
    return {
      id: userId,
      name: "You",
      email: "",
      image: "",
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createBaseList(
    name: string,
    userId: string,
    tempId: string,
    items: ShoppingItem[] = []
  ): ShoppingListWithItems {
    return {
      id: tempId,
      name,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      householdId: null,
      hasReminder: false,
      reminderTime: null,
      reminderMessage: null,
      reminderSent: false,
      items,
      household: null,
      user: this.createUserObject(userId),
    };
  }

  public async createList(
    name: string,
    userId: string
  ): Promise<ShoppingListWithItems> {
    await this.ensureInitialized();

    const tempId = this.generateTempId();
    const newList = this.createBaseList(name, userId, tempId);

    await indexedDBService.saveList(newList);
    await this.addToSyncQueueOptimized("CREATE_LIST", {
      name,
      tempId,
      items: [],
    });

    return newList;
  }

  public async updateListItems(
    listId: string,
    items: ShoppingItem[]
  ): Promise<ShoppingListWithItems | null> {
    await this.ensureInitialized();

    const list = await indexedDBService.getList(listId);
    if (!list) return null;

    const updatedList: ShoppingListWithItems = {
      ...list,
      items,
      updatedAt: new Date(),
    };

    await indexedDBService.saveList(updatedList);

    const isTemp = this.isTempId(listId);
    if (isTemp) {
      await this.handleTempListUpdate(listId, items);
    } else {
      await this.addToSyncQueueOptimized("UPDATE_LIST_ITEMS", {
        listId,
        items,
      });
    }

    return updatedList;
  }

  private async handleTempListUpdate(
    listId: string,
    items: ShoppingItem[]
  ): Promise<void> {
    const queue = await indexedDBService.getSyncQueue();
    const createListQueueItem = queue.find(
      (item) =>
        item.action === "CREATE_LIST" &&
        (item.data as CreateListData).tempId === listId
    );

    if (createListQueueItem) {
      const createData = createListQueueItem.data as CreateListData;
      if (!createData.items || createData.items.length === 0) {
        await indexedDBService.removeFromSyncQueue(createListQueueItem.id);
        await this.addToSyncQueueOptimized("CREATE_LIST", {
          name: createData.name,
          tempId: createData.tempId,
          items,
        });
      } else {
        await this.addToSyncQueueOptimized("UPDATE_LIST_ITEMS", {
          listId,
          items,
          tempId: listId,
        });
      }
    } else {
      await this.addToSyncQueueOptimized("UPDATE_LIST_ITEMS", {
        listId,
        items,
        tempId: listId,
      });
    }
  }

  public async updateListName(
    listId: string,
    name: string
  ): Promise<ShoppingListWithItems | null> {
    await this.ensureInitialized();

    const list = await indexedDBService.getList(listId);
    if (!list) return null;

    const updatedList: ShoppingListWithItems = {
      ...list,
      name,
      updatedAt: new Date(),
    };

    await indexedDBService.saveList(updatedList);

    const isTemp = this.isTempId(listId);
    console.log(`Updating list name:`, listId, name, isTemp);
    await this.addToSyncQueueOptimized("UPDATE_LIST", {
      listId,
      name,
      tempId: isTemp ? listId : undefined,
    });

    return updatedList;
  }

  public async deleteList(listId: string): Promise<void> {
    await this.ensureInitialized();

    await indexedDBService.deleteList(listId);

    const isTemp = this.isTempId(listId);
    await this.addToSyncQueueOptimized("DELETE_LIST", {
      listId,
      tempId: isTemp ? listId : undefined,
    });
  }

  private async addToSyncQueueOptimized(
    action: SyncAction,
    data: SyncData
  ): Promise<void> {
    await this.ensureInitialized();
    await indexedDBService.addToSyncQueue(action, data);

    if (this.isOnline && !this.pendingSyncs.has(action)) {
      this.pendingSyncs.add(action);
      this.syncData().finally(() => {
        this.pendingSyncs.delete(action);
      });
    }
  }

  private async updateUserData(
    userId: string,
    isOnline: boolean
  ): Promise<void> {
    await Promise.all([
      indexedDBService.updateOnlineStatus(userId, isOnline),
      indexedDBService.saveUserData({
        userId,
        isOnline,
        lastSyncTimestamp: Date.now(),
      }),
    ]);
  }

  private async syncData(): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      const queue = await indexedDBService.getSyncQueue();
      if (queue.length === 0) return;

      const sortedQueue = this.sortSyncQueue(queue);
      await this.processSyncQueueBatch(sortedQueue);

      this.updateSyncMetrics(true, Date.now() - startTime);
    } catch {
      this.updateSyncMetrics(false, Date.now() - startTime);
    } finally {
      this.syncInProgress = false;
    }
  }

  private sortSyncQueue(queue: SyncQueueItem[]): SyncQueueItem[] {
    return queue.sort((a, b) => {
      if (a.action === "CREATE_LIST" && b.action !== "CREATE_LIST") return -1;
      if (b.action === "CREATE_LIST" && a.action !== "CREATE_LIST") return 1;
      return a.timestamp - b.timestamp;
    });
  }

  private async processSyncQueueBatch(queue: SyncQueueItem[]): Promise<void> {
    const batches = this.createBatches(queue, this.config.batchSize);

    for (const batch of batches) {
      await Promise.allSettled(
        batch.map((item) => this.processSyncItemWithRetry(item))
      );
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processSyncItemWithRetry(item: SyncQueueItem): Promise<void> {
    try {
      await this.processSyncItem(item);
      await indexedDBService.removeFromSyncQueue(item.id);
    } catch {
      const newRetryCount = item.retryCount + 1;

      if (newRetryCount >= this.config.maxRetries) {
        await indexedDBService.removeFromSyncQueue(item.id);
      } else {
        await indexedDBService.updateSyncQueueItem(item.id, {
          retryCount: newRetryCount,
        });
      }
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    switch (item.action) {
      case "CREATE_LIST":
        await this.processCreateList(item.data as CreateListData);
        break;
      case "UPDATE_LIST":
        await this.processUpdateList(item.data as UpdateListData);
        break;
      case "UPDATE_LIST_ITEMS":
        await this.processUpdateListItems(item.data as UpdateListItemsData);
        break;
      case "DELETE_LIST":
        await this.processDeleteList(item.data as DeleteListData);
        break;
    }
  }

  private async processCreateList(data: CreateListData): Promise<void> {
    const newList =
      data.items && data.items.length > 0
        ? await createListWithItems(data.name, data.items)
        : await createList(data.name);

    if (newList && data.tempId) {
      this.idMappings.set(data.tempId, {
        tempId: data.tempId,
        realId: newList.id,
        timestamp: Date.now(),
      });

      await this.updateLocalListId(data.tempId, newList.id);
    }
  }

  private async updateLocalListId(
    tempId: string,
    realId: string
  ): Promise<void> {
    const tempList = await indexedDBService.getList(tempId);
    if (tempList) {
      const updatedList = { ...tempList, id: realId };
      await indexedDBService.deleteList(tempId);
      await indexedDBService.saveList(updatedList);
    }
  }

  private async processUpdateList(data: UpdateListData): Promise<void> {
    console.log(`Processing update list:`, data);
    const listId = data.tempId
      ? this.getRealId(data.tempId) || data.listId
      : data.listId;
    await updateList(listId, { name: data.name });
  }

  private async processUpdateListItems(
    data: UpdateListItemsData
  ): Promise<void> {
    const listId = data.tempId
      ? this.getRealId(data.tempId) || data.listId
      : data.listId;
    await updateListItems(listId, data.items);
  }

  private async processDeleteList(data: DeleteListData): Promise<void> {
    const listId = data.tempId
      ? this.getRealId(data.tempId) || data.listId
      : data.listId;
    await deleteList(listId);
  }

  private updateSyncMetrics(success: boolean, duration: number): void {
    this.syncMetrics.totalSyncs++;
    this.syncMetrics.lastSyncTime = Date.now();

    if (success) {
      this.syncMetrics.successfulSyncs++;
    } else {
      this.syncMetrics.failedSyncs++;
    }

    // Update average sync time
    const totalTime =
      this.syncMetrics.averageSyncTime * (this.syncMetrics.totalSyncs - 1) +
      duration;
    this.syncMetrics.averageSyncTime = totalTime / this.syncMetrics.totalSyncs;
  }

  // Public API methods
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
    this.pendingSyncs.clear();
  }

  public async getDatabaseSize(): Promise<number> {
    await this.ensureInitialized();
    return await indexedDBService.getDatabaseSize();
  }

  public getSyncMetrics(): SyncMetrics {
    return { ...this.syncMetrics };
  }

  public getIdMappings(): Map<string, IdMapping> {
    return new Map(this.idMappings);
  }

  public updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.syncInterval && this.syncInterval) {
      clearInterval(this.syncInterval);
      this.startSyncInterval();
    }
  }

  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("online", () => this.handleOnline());
      window.removeEventListener("offline", () => this.handleOffline());
    }

    this.listeners.clear();
    this.initialized = false;
    this.idMappings.clear();
    this.pendingSyncs.clear();
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService();

// Re-export types for backward compatibility
export type {
  NetworkStatus,
  CreateListData,
  UpdateListData,
  UpdateListItemsData,
  DeleteListData,
  SyncData,
  IdMapping,
  SyncMetrics,
  SyncConfig,
} from "@/types/offline";
