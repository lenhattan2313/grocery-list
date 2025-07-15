import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isCompleted: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  listId: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  items: ShoppingItem[];
}

interface ListsStore {
  lists: ShoppingList[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchLists: () => Promise<void>;
  createList: (name: string) => Promise<void>;
  updateList: (
    id: string,
    updates: Partial<Pick<ShoppingList, "name" | "isCompleted">> & {
      updateItemsCompletion?: boolean;
    }
  ) => Promise<void>;
  deleteList: (id: string) => Promise<void>;

  // Item actions
  addItem: (
    listId: string,
    item: Omit<ShoppingItem, "id" | "createdAt" | "updatedAt" | "listId">
  ) => Promise<void>;
  updateItem: (
    itemId: string,
    updates: Partial<
      Pick<ShoppingItem, "name" | "quantity" | "unit" | "notes" | "isCompleted">
    >
  ) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;

  // Helper functions
  getListById: (id: string) => ShoppingList | undefined;
  getListProgress: (listId: string) => {
    completed: number;
    total: number;
    percentage: number;
  };
  clearError: () => void;
}

export const useListsStore = create<ListsStore>()(
  devtools(
    (set, get) => ({
      lists: [],
      loading: false,
      error: null,

      fetchLists: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch("/api/lists");
          if (!response.ok) {
            throw new Error("Failed to fetch lists");
          }
          const lists = await response.json();
          set({ lists, loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to fetch lists",
            loading: false,
          });
        }
      },

      createList: async (name: string) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch("/api/lists", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name }),
          });

          if (!response.ok) {
            throw new Error("Failed to create list");
          }

          const newList = await response.json();
          set((state) => ({
            lists: [newList, ...state.lists],
            loading: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to create list",
            loading: false,
          });
        }
      },

      updateList: async (
        id: string,
        updates: Partial<Pick<ShoppingList, "name" | "isCompleted">> & {
          updateItemsCompletion?: boolean;
        }
      ) => {
        // Optimistic update
        const originalLists = get().lists;
        const { updateItemsCompletion, ...listUpdates } = updates;

        set((state) => ({
          lists: state.lists.map((list) => {
            if (list.id === id) {
              const updatedList = { ...list, ...listUpdates };

              // If updateItemsCompletion is true and isCompleted is being updated,
              // also update all items to match the list's completion status
              if (
                updateItemsCompletion &&
                listUpdates.isCompleted !== undefined
              ) {
                updatedList.items = list.items.map((item) => ({
                  ...item,
                  isCompleted: listUpdates.isCompleted!,
                }));
              }

              return updatedList;
            }
            return list;
          }),
          error: null,
        }));

        try {
          const response = await fetch(`/api/lists/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error("Failed to update list");
          }

          const updatedList = await response.json();
          set((state) => ({
            lists: state.lists.map((list) =>
              list.id === id ? updatedList : list
            ),
          }));
        } catch (error) {
          // Revert optimistic update on error
          set({
            lists: originalLists,
            error:
              error instanceof Error ? error.message : "Failed to update list",
          });
          throw error;
        }
      },

      deleteList: async (id: string) => {
        // Optimistic update
        const originalLists = get().lists;
        set((state) => ({
          lists: state.lists.filter((list) => list.id !== id),
          error: null,
        }));

        try {
          const response = await fetch(`/api/lists/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete list");
          }
        } catch (error) {
          // Revert optimistic update on error
          set({
            lists: originalLists,
            error:
              error instanceof Error ? error.message : "Failed to delete list",
          });
          throw error;
        }
      },

      addItem: async (
        listId: string,
        item: Omit<ShoppingItem, "id" | "createdAt" | "updatedAt" | "listId">
      ) => {
        // Create optimistic item with temporary ID
        const tempId = `temp-${Date.now()}`;
        const optimisticItem: ShoppingItem = {
          id: tempId,
          ...item,
          listId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Optimistic update
        const originalLists = get().lists;
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? { ...list, items: [...list.items, optimisticItem] }
              : list
          ),
          error: null,
        }));

        try {
          const response = await fetch("/api/items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...item, listId }),
          });

          if (!response.ok) {
            throw new Error("Failed to add item");
          }

          const newItem = await response.json();
          // Replace optimistic item with real item
          set((state) => ({
            lists: state.lists.map((list) =>
              list.id === listId
                ? {
                    ...list,
                    items: list.items.map((i) =>
                      i.id === tempId ? newItem : i
                    ),
                  }
                : list
            ),
          }));
        } catch (error) {
          // Revert optimistic update on error
          set({
            lists: originalLists,
            error:
              error instanceof Error ? error.message : "Failed to add item",
          });
          throw error;
        }
      },

      updateItem: async (
        itemId: string,
        updates: Partial<
          Pick<
            ShoppingItem,
            "name" | "quantity" | "unit" | "notes" | "isCompleted"
          >
        >
      ) => {
        // Optimistic update
        const originalLists = get().lists;
        set((state) => ({
          lists: state.lists.map((list) => ({
            ...list,
            items: list.items.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            ),
          })),
          error: null,
        }));

        try {
          const response = await fetch(`/api/items/${itemId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error("Failed to update item");
          }

          const updatedItem = await response.json();
          set((state) => ({
            lists: state.lists.map((list) => ({
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? updatedItem : item
              ),
            })),
          }));
        } catch (error) {
          // Revert optimistic update on error
          set({
            lists: originalLists,
            error:
              error instanceof Error ? error.message : "Failed to update item",
          });
          throw error;
        }
      },

      deleteItem: async (itemId: string) => {
        // Optimistic update
        const originalLists = get().lists;
        set((state) => ({
          lists: state.lists.map((list) => ({
            ...list,
            items: list.items.filter((item) => item.id !== itemId),
          })),
          error: null,
        }));

        try {
          const response = await fetch(`/api/items/${itemId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete item");
          }
        } catch (error) {
          // Revert optimistic update on error
          set({
            lists: originalLists,
            error:
              error instanceof Error ? error.message : "Failed to delete item",
          });
          throw error;
        }
      },

      getListById: (id: string) => {
        return get().lists.find((list) => list.id === id);
      },

      getListProgress: (listId: string) => {
        const list = get().lists.find((l) => l.id === listId);
        if (!list) return { completed: 0, total: 0, percentage: 0 };

        const completed = list.items.filter((item) => item.isCompleted).length;
        const total = list.items.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;

        return { completed, total, percentage };
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "lists-store",
    }
  )
);
