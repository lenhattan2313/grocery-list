"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import {
  Check,
  Edit,
  Trash2,
  ShoppingCart,
  Loader2,
  AlertCircle,
  Save,
  X,
} from "lucide-react";
import { cn, getProgressColors } from "@/lib/utils";
import {
  useListQuery,
  useUpdateListItemsMutation,
} from "@/hooks/use-lists-query";
import { ShoppingItem } from "@/types";
import { UNIT_OPTIONS } from "@/constants/unit";
const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit: z.string(),
});

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
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    control: controlAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd, isSubmitting: isSubmittingAdd },
  } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "pcs",
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    control: controlEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
  } = useForm({
    resolver: zodResolver(itemSchema),
  });

  const { data: list, isLoading, error, isSuccess } = useListQuery(listId);
  const updateListItemsMutation = useUpdateListItemsMutation();

  const originalItems = useMemo(() => list?.items ?? [], [list]);
  const hasChanges = useMemo(
    () => JSON.stringify(originalItems) !== JSON.stringify(items),
    [originalItems, items]
  );

  useEffect(() => {
    if (isSuccess && list) {
      // Deep copy to avoid direct mutation of cache
      setItems(JSON.parse(JSON.stringify(list.items)));
    }
  }, [isSuccess, list]);

  // Calculate progress directly from list items for real-time updates
  const progress = useMemo(() => {
    if (items.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = items.filter((item) => item.isCompleted).length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }, [items]);

  const handleAddItem = (data: z.infer<typeof itemSchema>) => {
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
    resetAdd();
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
    resetEdit({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    });
  };

  const handleSaveEdit = (data: z.infer<typeof itemSchema>) => {
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
      notes: item.notes,
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
  const isAdding = isSubmittingAdd;
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
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {list.name}
            </div>
            {progress.total > 0 && (
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2",
                  getProgressColors(progress.percentage).progressColor
                )}
              >
                {progress.percentage}%
              </div>
            )}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-24">
          {/* Add Item Form */}
          <form
            onSubmit={handleSubmitAdd(handleAddItem)}
            className="border rounded-lg p-4 bg-gray-50"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Add New Item</Label>
                <Button
                  type="submit"
                  disabled={isAdding}
                  className="shrink-0"
                  size="sm"
                >
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Item name"
                    {...registerAdd("name")}
                    disabled={isAdding}
                    className="bg-white"
                  />
                  {errorsAdd.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {errorsAdd.name.message}
                    </p>
                  )}
                </div>
                <div className="w-16">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    {...registerAdd("quantity")}
                    disabled={isAdding}
                    className="bg-white"
                  />
                  {errorsAdd.quantity && (
                    <p className="text-xs text-red-500 mt-1">
                      {errorsAdd.quantity.message}
                    </p>
                  )}
                </div>
                <div className="w-20">
                  <Controller
                    name="unit"
                    control={controlAdd}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isAdding}
                      >
                        <SelectTrigger className="bg-white">
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
            </div>
          </form>

          {/* Items List */}
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No items in this list yet.</p>
                <p className="text-sm">Add your first item above!</p>
              </div>
            ) : (
              items.map((item) => {
                const isEditing = editingItemId === item.id;
                const isLoading = isSubmittingEdit;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg border bg-white transition-all",
                      item.isCompleted && !isEditing && "bg-gray-50 opacity-75"
                    )}
                  >
                    {isEditing ? (
                      // Edit Form
                      <form
                        onSubmit={handleSubmitEdit(handleSaveEdit)}
                        className="p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Edit Item
                          </Label>
                          <div className="flex gap-1">
                            <Button
                              type="submit"
                              size="sm"
                              disabled={isLoading}
                              className="h-8 w-8 p-0"
                            >
                              {isSubmittingEdit ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={isLoading}
                              className="h-8 w-8 p-0"
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
                              disabled={isLoading}
                              className="h-8"
                            />
                            {errorsEdit.name && (
                              <p className="text-xs text-red-500 mt-1">
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
                              disabled={isLoading}
                              className="h-8"
                            />
                            {errorsEdit.quantity && (
                              <p className="text-xs text-red-500 mt-1">
                                {errorsEdit.quantity.message}
                              </p>
                            )}
                          </div>
                          <div className="w-20">
                            <Controller
                              name="unit"
                              control={controlEdit}
                              render={({ field }) => (
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  disabled={isSubmittingEdit}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {UNIT_OPTIONS.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
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
                      // Normal Item View
                      <div
                        className={cn(
                          "flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                        )}
                        onClick={() => handleToggleItem(item.id)}
                      >
                        <div className="flex-shrink-0">
                          <Check
                            className={cn(
                              "h-4 w-4 transition-colors",
                              item.isCompleted
                                ? "text-green-600"
                                : "text-gray-400"
                            )}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              "flex items-center gap-4 transition-all",
                              item.isCompleted &&
                                "text-gray-500 custom-strikethrough"
                            )}
                          >
                            <div className="font-medium">{item.name}</div>
                            <span className="text-sm text-gray-500 flex-shrink-0">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditItem(item);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        {hasChanges && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSaveChanges}
              disabled={updateListItemsMutation.isPending}
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
