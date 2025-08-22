"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

import { useOfflineUpdateListItemsMutation } from "@/hooks/use-offline-lists";
import { ShoppingItem, ShoppingList as ShoppingListType } from "@/types";
import { AddItemForm } from "./list-details/add-item-form";
import { CreateItemSchema } from "@/schema/item-schema";
import { ListDrawerHeader } from "./list-details/list-drawer-header";
import { ShoppingList } from "./list-details/shopping-list";
import { SmartSuggestions } from "./list-details/smart-suggestions";
import { useSession } from "next-auth/react";
import { drawerService } from "@/stores/drawer-store";
import { createDownloadableFile, sanitizeFilename } from "@/lib/file-download";

interface ListDetailsDrawerProps {
  list: ShoppingListType;
}

// Export the component for dynamic imports
export function ListDetailsDrawer({ list }: ListDetailsDrawerProps) {
  const { data: session } = useSession();
  const [items, setItems] = useState<ShoppingItem[]>(
    JSON.parse(JSON.stringify(list.items))
  );

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const { reset } = useForm({
    resolver: zodResolver(CreateItemSchema),
  });

  const updateListItemsMutation = useOfflineUpdateListItemsMutation();

  const existingItems = useMemo(
    () => items.map((item) => item.name.toLowerCase()),
    [items]
  );

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
    if (!list?.id) return;

    const newItem: ShoppingItem = {
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      listId: list.id,
      ...data,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: "",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleAddItemFromSuggestion = (itemName: string) => {
    if (!list?.id) return;

    const newItem: ShoppingItem = {
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      listId: list.id,
      name: itemName,
      quantity: 1,
      unit: "piece",
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: "",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleToggleItem = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
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

    setItems((prev) =>
      prev.map((item) =>
        item.id === editingItemId
          ? { ...item, ...data, updatedAt: new Date() }
          : item
      )
    );
    setEditingItemId(null);
    reset();
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    reset();
  };

  const handleSaveChanges = async () => {
    if (!list?.id) return;
    const itemsToUpdate = items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      isCompleted: item.isCompleted,
      notes: item.notes ?? null,
      listId: item.listId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
    await updateListItemsMutation.mutateAsync({
      listId: list.id,
      items: itemsToUpdate,
    });
    drawerService.hideDrawer();
  };

  const handleExportList = () => {
    if (items.length === 0) return;

    const exportContent = items
      .map((item, index) => {
        const status = item.isCompleted ? "[✓]" : "[ ]";
        const quantity =
          item.quantity > 1 ? `${item.quantity} ${item.unit}` : item.unit;
        const notes = item.notes ? ` - ${item.notes}` : "";
        return `${index + 1}. ${status} ${item.name} (${quantity})${notes}`;
      })
      .join("\n");

    const header = `Shopping List: ${
      list.name
    }\nGenerated on: ${new Date().toLocaleDateString()}\n\n`;
    const fullContent = header + exportContent;

    const filename = `${sanitizeFilename(list.name)}_shopping_list.txt`;
    createDownloadableFile(fullContent, filename, "text/plain;charset=utf-8");
  };

  const handleCopyList = async () => {
    if (items.length === 0) return;

    setIsCopying(true);
    const copyContent = items
      .map((item, index) => {
        const status = item.isCompleted ? "[✓]" : "[ ]";
        const quantity =
          item.quantity > 1 ? `${item.quantity} ${item.unit}` : item.unit;
        const notes = item.notes ? ` - ${item.notes}` : "";
        return `${index + 1}. ${status} ${item.name} (${quantity})${notes}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(copyContent);
      // You could add a toast notification here if you have a toast system
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = copyContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      // Reset the copying state after a short delay to show success
      setTimeout(() => setIsCopying(false), 1000);
    }
  };

  const isOwner = session?.user?.id === list.userId;
  const hasItems = items.length > 0;

  return (
    <div className="h-full flex flex-col">
      <ListDrawerHeader
        listName={list.name}
        progress={progress}
        onExport={handleExportList}
        onCopy={handleCopyList}
        hasItems={hasItems}
        isCopying={isCopying}
      />

      <div className="flex-1 flex flex-col space-y-4 px-4 pb-10 min-h-0">
        {isOwner && (
          <>
            <AddItemForm onAddItem={handleAddItem} listId={list.id} />
            <SmartSuggestions
              onAddItem={handleAddItemFromSuggestion}
              existingItems={existingItems}
            />
          </>
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <ShoppingList
            items={items}
            editingItemId={editingItemId}
            onToggleItem={handleToggleItem}
            onDeleteItem={handleDeleteItem}
            onEditItem={handleEditItem}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            isOwner={isOwner}
          />
        </div>
      </div>

      <div className="sticky bottom-0 p-4 bg-white/80 backdrop-blur-sm border-t dark:bg-transparent">
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
    </div>
  );
}
