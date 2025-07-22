"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Save } from "lucide-react";

import {
  useListQuery,
  useUpdateListItemsMutation,
} from "@/hooks/use-lists-query";
import { ShoppingItem } from "@/types";
import { AddItemForm } from "./list-details/add-item-form";
import { CreateItemSchema } from "@/schema/item-schema";
import { ListDrawerHeader } from "./list-details/list-drawer-header";
import { ShoppingList } from "./list-details/shopping-list";
import { SmartSuggestions } from "./list-details/smart-suggestions";

interface ListDetailsDrawerProps {
  listId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListDetailsDrawer({
  listId,
  open,
  onOpenChange,
}: ListDetailsDrawerProps) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const {
    formState: { isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(CreateItemSchema),
  });

  const { data: list, isLoading, error, isSuccess } = useListQuery(listId);
  const updateListItemsMutation = useUpdateListItemsMutation();

  const originalItems = useMemo(() => list?.items ?? [], [list]);
  const hasChanges = useMemo(
    () => JSON.stringify(originalItems) !== JSON.stringify(items),
    [originalItems, items]
  );

  const existingItems = useMemo(
    () => items.map((item) => item.name.toLowerCase()),
    [items]
  );

  useEffect(() => {
    if (isSuccess && list) {
      setItems(JSON.parse(JSON.stringify(list.items)));
    }
  }, [isSuccess, list]);

  const progress = useMemo(() => {
    if (items.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = items.filter((item) => item.isCompleted).length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }, [items]);

  const handleAddItem = (data: z.infer<typeof CreateItemSchema>) => {
    if (!listId) return;

    const newItem: ShoppingItem = {
      id: `temp-${Date.now()}`,
      listId,
      ...data,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: "",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleAddItemFromSuggestion = (itemName: string) => {
    if (!listId) return;

    const newItem: ShoppingItem = {
      id: `temp-${Date.now()}`,
      listId,
      name: itemName,
      quantity: 1,
      unit: "pcs",
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: "",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleToggleItem = (itemId: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    reset({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    });
  };

  const handleSaveEdit = (data: z.infer<typeof CreateItemSchema>) => {
    if (!editingItemId) return;

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === editingItemId
          ? { ...item, ...data, updatedAt: new Date() }
          : item
      )
    );
    setEditingItemId(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const handleSaveChanges = async () => {
    if (!listId) return;
    const itemsToUpdate = items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      isCompleted: item.isCompleted,
      notes: item.notes ?? null,
      listId: item.listId,
    }));
    await updateListItemsMutation.mutateAsync({
      listId,
      items: itemsToUpdate,
    });
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </DrawerContent>
      </Drawer>
    );
  }
  if (error) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="mt-2 text-red-600">Error: {error.message}</p>
        </DrawerContent>
      </Drawer>
    );
  }

  if (!list) return null;

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (
          !isOpen &&
          hasChanges &&
          !confirm("You have unsaved changes. Are you sure you want to close?")
        ) {
          return;
        }
        onOpenChange(isOpen);
      }}
    >
      <DrawerContent className="h-[calc(100vh-4rem)] flex flex-col">
        <ListDrawerHeader listName={list.name} progress={progress} />

        <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-24">
          <AddItemForm
            onAddItem={handleAddItem}
            isAdding={isSubmitting}
            listId={listId as string}
          />

          <SmartSuggestions
            onAddItem={handleAddItemFromSuggestion}
            existingItems={existingItems}
          />

          <ShoppingList
            items={items}
            editingItemId={editingItemId}
            isSubmittingEdit={isSubmitting}
            onToggleItem={handleToggleItem}
            onDeleteItem={handleDeleteItem}
            onEditItem={handleEditItem}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
          />
        </div>
        {hasChanges && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSaveChanges}
              disabled={updateListItemsMutation.isPending}
              aria-label="Save Changes"
            >
              {updateListItemsMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
