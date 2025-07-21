"use client";

import { ShoppingCart } from "lucide-react";
import { ShoppingItem as ShoppingItemType } from "@/types";
import { ShoppingListItem } from "./shopping-list-item";
import { z } from "zod";
import { itemSchema } from "@/schema/item-schema";

interface ShoppingListProps {
  items: ShoppingItemType[];
  editingItemId: string | null;
  isSubmittingEdit: boolean;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onEditItem: (item: ShoppingItemType) => void;
  onSaveEdit: (data: z.infer<typeof itemSchema>) => void;
  onCancelEdit: () => void;
}

export function ShoppingList({
  items,
  editingItemId,
  isSubmittingEdit,
  onToggleItem,
  onDeleteItem,
  onEditItem,
  onSaveEdit,
  onCancelEdit,
}: ShoppingListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No items in this list yet.</p>
        <p className="text-sm">Add your first item above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <ShoppingListItem
          key={item.id}
          item={item}
          isEditing={editingItemId === item.id}
          isSubmittingEdit={isSubmittingEdit}
          onToggleItem={onToggleItem}
          onDeleteItem={onDeleteItem}
          onEditItem={onEditItem}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
        />
      ))}
    </div>
  );
}
