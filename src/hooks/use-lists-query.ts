"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getLists,
  createList,
  updateList,
  deleteList,
  getList,
  updateListItems,
} from "@/app/actions/list";
import { ShoppingListWithItems } from "@/types/list";
import { ShoppingItem } from "@/types/items";

export function useListsQuery(initialData?: ShoppingListWithItems[]) {
  return useQuery<ShoppingListWithItems[], Error>({
    queryKey: ["lists"],
    queryFn: () => getLists(),
    initialData,
  });
}

export function useCreateListMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ShoppingListWithItems | null,
    Error,
    string,
    { previousLists: ShoppingListWithItems[] }
  >({
    mutationFn: createList,
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
        userId: "optimistic-user", // Placeholder, will be replaced by server response
        householdId: null,
        items: [],
        household: null,
        user: {
          id: "optimistic-user",
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
      toast.success("List created successfully");
    },
    onError: (error, _, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(["lists"], context.previousLists);
      }
      toast.error(error.message || "Failed to create list, reverting.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

export function useUpdateListMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        name?: string;
        isCompleted?: boolean;
        householdId?: string | null;
      };
    }) => updateList(id, updates),
    onSuccess: (updatedList) => {
      queryClient.setQueryData(
        ["lists"],
        (oldData: ShoppingListWithItems[] | undefined) => {
          if (!oldData) return [];
          return oldData.map((list) =>
            list.id === updatedList.id ? updatedList : list
          );
        }
      );
      toast.success(`List "${updatedList.name}" updated successfully!`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateNameListMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ShoppingListWithItems,
    Error,
    { id: string; name: string },
    {
      previousLists: ShoppingListWithItems[] | undefined;
      previousList: ShoppingListWithItems | undefined;
    }
  >({
    mutationFn: ({ id, name }) => updateList(id, { name }),
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });
      await queryClient.cancelQueries({ queryKey: ["list", id] });

      const previousLists = queryClient.getQueryData<ShoppingListWithItems[]>([
        "lists",
      ]);
      const previousList = queryClient.getQueryData<ShoppingListWithItems>([
        "list",
        id,
      ]);

      if (previousLists) {
        queryClient.setQueryData<ShoppingListWithItems[]>(
          ["lists"],
          previousLists.map((list) =>
            list.id === id ? { ...list, name } : list
          )
        );
      }

      if (previousList) {
        queryClient.setQueryData<ShoppingListWithItems>(["list", id], {
          ...previousList,
          name,
        });
      }

      return { previousLists, previousList };
    },
    onSuccess: (updatedList) => {
      toast.success(`List renamed to "${updatedList.name}"`);
    },
    onError: (err, variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(["lists"], context.previousLists);
      }
      if (context?.previousList) {
        queryClient.setQueryData(["list", variables.id], context.previousList);
      }
      toast.error(err.message || "Failed to update list name.");
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["lists"] });
        queryClient.invalidateQueries({ queryKey: ["list", data.id] });
      }
    },
  });
}

export function useDeleteListMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    void | null,
    Error,
    string,
    { previousLists: ShoppingListWithItems[] }
  >({
    mutationFn: deleteList,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });
      const previousLists =
        queryClient.getQueryData<ShoppingListWithItems[]>(["lists"]) || [];

      queryClient.setQueryData<ShoppingListWithItems[]>(["lists"], (old) =>
        (old || []).filter((list) => list.id !== deletedId)
      );

      return { previousLists };
    },
    onSuccess: () => {
      toast.success("List deleted successfully");
    },
    onError: (error, _, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(["lists"], context.previousLists);
      }
      toast.error(error.message || "Failed to delete list, reverting.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

export function useListQuery(listId: string | null) {
  return useQuery<ShoppingListWithItems | null, Error>({
    queryKey: ["list", listId],
    queryFn: () => (listId ? getList(listId) : null),
    enabled: !!listId,
  });
}

export function useUpdateListItemsMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ShoppingListWithItems | null,
    Error,
    {
      listId: string;
      items: Omit<ShoppingItem, "id" | "createdAt" | "updatedAt">[];
    },
    { previousList: ShoppingListWithItems | undefined }
  >({
    mutationFn: ({ listId, items }) => updateListItems(listId, items),
    onMutate: async ({ listId, items }) => {
      await queryClient.cancelQueries({ queryKey: ["list", listId] });

      const previousList = queryClient.getQueryData<ShoppingListWithItems>([
        "list",
        listId,
      ]);

      if (previousList) {
        const optimisticList: ShoppingListWithItems = {
          ...previousList,
          items: items.map((item, index) => ({
            ...item,
            id: `optimistic-item-${Date.now()}-${index}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            notes: item.notes ?? null,
          })),
        };
        queryClient.setQueryData(["list", listId], optimisticList);
      }

      return { previousList };
    },
    onSuccess: (data, { listId }) => {
      queryClient.setQueryData(["list", listId], data);
      toast.success("List saved successfully!");
    },
    onError: (err, { listId }, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(["list", listId], context.previousList);
      }
      toast.error(err.message || "Failed to save list. Please try again.");
    },
    onSettled: (data, error, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ["list", listId] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}
