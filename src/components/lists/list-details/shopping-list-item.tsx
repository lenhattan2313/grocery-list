"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Edit, Trash2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShoppingItem } from "@/types";
import { UNIT_OPTIONS } from "@/constants/unit";
import { CreateItemSchema } from "@/schema/item-schema";

interface ShoppingListItemProps {
  item: ShoppingItem;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onEditItem: (item: ShoppingItem) => void;
  onSaveEdit: (data: z.infer<typeof CreateItemSchema>) => void;
  onCancelEdit: () => void;
  isEditing: boolean;
  isOwner: boolean;
}

export function ShoppingListItem({
  item,
  onToggleItem,
  onDeleteItem,
  onEditItem,
  onSaveEdit,
  onCancelEdit,
  isEditing,
  isOwner,
}: ShoppingListItemProps) {
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    control: controlEdit,
    formState: { errors: errorsEdit },
  } = useForm({
    resolver: zodResolver(CreateItemSchema),
    defaultValues: {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    },
  });
  return (
    <div
      className={cn(
        "rounded-lg border bg-white transition-all dark:border-gray-600 dark:bg-transparent",
        item.isCompleted && !isEditing && "bg-gray-50 opacity-75"
      )}
    >
      {isEditing ? (
        <form onSubmit={handleSubmitEdit(onSaveEdit)} className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-800 dark:text-gray-100">
              Edit Item
            </Label>
            <div className="flex gap-1">
              <Button
                type="submit"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Save Edit"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancelEdit}
                className="h-8 w-8 p-0 text-gray-800 dark:text-gray-100"
                aria-label="Cancel Edit"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Item name"
                {...registerEdit("name")}
                className="h-8"
              />
              {errorsEdit.name && (
                <p className="text-xs text-destructive mt-1">
                  {errorsEdit.name.message}
                </p>
              )}
            </div>
            <div className="w-16">
              <Input
                type="number"
                min="1"
                placeholder="Qty"
                {...registerEdit("quantity")}
                className="h-8"
              />
              {errorsEdit.quantity && (
                <p className="text-xs text-destructive mt-1">
                  {errorsEdit.quantity.message}
                </p>
              )}
            </div>
            <div className="w-20">
              <Controller
                name="unit"
                control={controlEdit}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </form>
      ) : (
        <div
          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
          onClick={() => {
            if (isOwner) {
              onToggleItem(item.id);
            }
          }}
        >
          <div className="flex-shrink-0">
            <Check
              className={cn(
                "h-4 w-4 transition-colors",
                item.isCompleted ? "text-green-600" : "text-gray-400"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "flex items-center gap-4 transition-all text-gray-800 dark:text-gray-100",
                item.isCompleted && "text-gray-500 custom-strikethrough"
              )}
            >
              <div className="font-medium">{item.name}</div>
              <span className="text-sm text-gray-500 flex-shrink-0 dark:text-gray-100">
                {item.quantity} {item.unit}
              </span>
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditItem(item);
                }}
                className="h-8 w-8 p-0 text-gray-800 dark:text-gray-100"
                aria-label="Edit Item"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                aria-label="Delete Item"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
