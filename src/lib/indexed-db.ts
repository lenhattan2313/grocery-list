import { openDB, IDBPDatabase } from "idb";
import { ShoppingListWithItems } from "@/types/list";
import { SyncData } from "./offline-sync";

const DB_NAME = "grocery-app-db";
const DB_VERSION = 1;

// Store names
const STORES = {
  LISTS: "lists",
  SYNC_QUEUE: "sync_queue",
  USER_DATA: "user_data",
} as const;

// Sync queue item types
export type SyncAction =
  | "CREATE_LIST"
  | "UPDATE_LIST"
  | "DELETE_LIST"
  | "UPDATE_LIST_ITEMS";

export interface SyncQueueItem {
  id: string;
  action: SyncAction;
  data: SyncData;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface UserData {
  userId: string;
  lastSyncTimestamp: number;
  isOnline: boolean;
}

class IndexedDBService {
  private db: IDBPDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Lists store
        if (!db.objectStoreNames.contains(STORES.LISTS)) {
          const listsStore = db.createObjectStore(STORES.LISTS, {
            keyPath: "id",
          });
          listsStore.createIndex("userId", "userId", { unique: false });
          listsStore.createIndex("householdId", "householdId", {
            unique: false,
          });
          listsStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: "id",
          });
          syncStore.createIndex("timestamp", "timestamp", { unique: false });
          syncStore.createIndex("action", "action", { unique: false });
        }

        // User data store
        if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
          db.createObjectStore(STORES.USER_DATA, {
            keyPath: "userId",
          });
        }
      },
    });
  }

  private async ensureDB(): Promise<IDBPDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Lists operations
  async saveLists(lists: ShoppingListWithItems[]): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction(STORES.LISTS, "readwrite");

    for (const list of lists) {
      await tx.store.put(list);
    }

    await tx.done;
  }

  async getLists(): Promise<ShoppingListWithItems[]> {
    const db = await this.ensureDB();
    const lists = await db.getAll(STORES.LISTS);
    return lists.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getList(id: string): Promise<ShoppingListWithItems | null> {
    const db = await this.ensureDB();
    return (await db.get(STORES.LISTS, id)) || null;
  }

  async getListByName(name: string): Promise<ShoppingListWithItems | null> {
    const db = await this.ensureDB();
    const lists = await db.getAll(STORES.LISTS);
    return lists.find((list) => list.name === name) || null;
  }

  async saveList(list: ShoppingListWithItems): Promise<void> {
    const db = await this.ensureDB();
    await db.put(STORES.LISTS, list);
  }

  async deleteList(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete(STORES.LISTS, id);
  }

  // Sync queue operations
  async addToSyncQueue(action: SyncAction, data: SyncData): Promise<void> {
    const db = await this.ensureDB();
    const syncItem: SyncQueueItem = {
      id: `${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    await db.put(STORES.SYNC_QUEUE, syncItem);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.ensureDB();
    const queue = await db.getAll(STORES.SYNC_QUEUE);
    return queue.sort((a, b) => a.timestamp - b.timestamp);
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete(STORES.SYNC_QUEUE, id);
  }

  async updateSyncQueueItem(
    id: string,
    updates: Partial<SyncQueueItem>
  ): Promise<void> {
    const db = await this.ensureDB();
    const item = await db.get(STORES.SYNC_QUEUE, id);
    if (item) {
      await db.put(STORES.SYNC_QUEUE, { ...item, ...updates });
    }
  }

  // User data operations
  async saveUserData(userData: UserData): Promise<void> {
    const db = await this.ensureDB();
    await db.put(STORES.USER_DATA, userData);
  }

  async getUserData(userId: string): Promise<UserData | null> {
    const db = await this.ensureDB();
    return (await db.get(STORES.USER_DATA, userId)) || null;
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const db = await this.ensureDB();
    const userData = await db.get(STORES.USER_DATA, userId);
    if (userData) {
      await db.put(STORES.USER_DATA, { ...userData, isOnline });
    } else {
      await db.put(STORES.USER_DATA, {
        userId,
        isOnline,
        lastSyncTimestamp: Date.now(),
      });
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    await db.clear(STORES.LISTS);
    await db.clear(STORES.SYNC_QUEUE);
    await db.clear(STORES.USER_DATA);
  }

  async getDatabaseSize(): Promise<number> {
    const db = await this.ensureDB();
    const lists = await db.count(STORES.LISTS);
    const syncQueue = await db.count(STORES.SYNC_QUEUE);
    return lists + syncQueue;
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
