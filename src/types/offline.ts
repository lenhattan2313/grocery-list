import { ShoppingItem } from "./items";

export interface NetworkStatus {
  isOnline: boolean;
  lastChecked: number;
}

export interface CreateListData {
  name: string;
  tempId?: string;
  items?: ShoppingItem[];
}

export interface UpdateListData {
  listId: string;
  name: string;
  tempId?: string;
}

export interface UpdateListItemsData {
  listId: string;
  items: ShoppingItem[];
  tempId?: string;
}

export interface DeleteListData {
  listId: string;
  tempId?: string;
}

export type SyncData =
  | CreateListData
  | UpdateListData
  | UpdateListItemsData
  | DeleteListData;

export interface IdMapping {
  tempId: string;
  realId: string;
  timestamp: number;
}

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncTime: number;
  lastSyncTime: number;
}

export interface SyncConfig {
  syncInterval: number;
  maxRetries: number;
  batchSize: number;
  maxQueueSize: number;
}
