"use client";

import { useState, useMemo } from "react";
import { ShoppingItem, useListsStore } from "@/stores/lists-store";
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
import { cn } from "@/lib/utils";

// Helper function to get badge colors for circular progress indicator
function getProgressBadgeColors(percentage: number) {
  if (percentage === 100) {
    return "bg-green-100 text-green-800 border-green-300";
  } else if (percentage > 0 && percentage < 100) {
    return "bg-orange-100 text-orange-800 border-orange-300";
  } else {
    return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

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
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemQuantity, setEditItemQuantity] = useState("1");
  const [editItemUnit, setEditItemUnit] = useState("pcs");
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lists, addItem, updateItem, deleteItem } = useListsStore();

  // Get the fresh list data from the store
  const list = useMemo(() => {
    if (!listId) return null;
    return lists.find((l) => l.id === listId) || null;
  }, [lists, listId]);

  // Calculate progress directly from list items for real-time updates
  const progress = useMemo(() => {
    if (!list || list.items.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = list.items.filter((item) => item.isCompleted).length;
    const total = list.items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }, [list]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !listId) return;

    const itemData = {
      name: newItemName.trim(),
      quantity: parseInt(newItemQuantity) || 1,
      unit: newItemUnit,
      isCompleted: false,
    };

    setIsAddingItem(true);
    setError(null);

    try {
      await addItem(listId, itemData);
      // Clear form only on success
      setNewItemName("");
      setNewItemQuantity("1");
      setNewItemUnit("pcs");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add item");
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleToggleItem = async (item: ShoppingItem) => {
    setError(null);
    try {
      await updateItem(item.id, { isCompleted: !item.isCompleted });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update item"
      );
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setError(null);
    setDeletingItems((prev) => new Set(prev).add(itemId));

    try {
      await deleteItem(itemId);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete item"
      );
    } finally {
      setDeletingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemQuantity(item.quantity.toString());
    setEditItemUnit(item.unit);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItemName.trim() || !editingItemId) return;

    const updatedData = {
      name: editItemName.trim(),
      quantity: parseInt(editItemQuantity) || 1,
      unit: editItemUnit,
    };

    setIsUpdatingItem(true);
    setError(null);

    try {
      await updateItem(editingItemId, updatedData);
      setEditingItemId(null);
      setEditItemName("");
      setEditItemQuantity("1");
      setEditItemUnit("pcs");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update item"
      );
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemName("");
    setEditItemQuantity("1");
    setEditItemUnit("pcs");
  };

  const clearError = () => setError(null);

  if (!list) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[calc(100vh-4rem)]">
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
                  getProgressBadgeColors(progress.percentage)
                )}
              >
                {progress.percentage}%
              </div>
            )}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-4">
          {/* Custom CSS for strikethrough */}
          <style jsx>{`
            .custom-strikethrough {
              position: relative;
            }
            .custom-strikethrough::before {
              content: "";
              position: absolute;
              top: 55%;
              left: 0;
              right: 0;
              height: 1.5px;
              background-color: #6b7280;
              transform: translateY(-50%);
              z-index: 1;
            }
          `}</style>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-800 text-sm flex-1">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-6 w-6 p-0 text-red-600"
              >
                ×
              </Button>
            </div>
          )}

          {/* Add Item Form */}
          <form
            onSubmit={handleAddItem}
            className="border rounded-lg p-4 bg-gray-50"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Add New Item</Label>
                <Button
                  type="submit"
                  disabled={!newItemName.trim() || isAddingItem}
                  className="shrink-0"
                  size="sm"
                >
                  {isAddingItem ? (
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
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    disabled={isAddingItem}
                    className="bg-white"
                  />
                </div>
                <div className="w-16">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    disabled={isAddingItem}
                    className="bg-white"
                  />
                </div>
                <div className="w-20">
                  <Select
                    value={newItemUnit}
                    onValueChange={setNewItemUnit}
                    disabled={isAddingItem}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">pcs</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="pack">pack</SelectItem>
                      <SelectItem value="box">box</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </form>

          {/* Items List */}
          <div className="space-y-2">
            {list.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No items in this list yet.</p>
                <p className="text-sm">Add your first item above!</p>
              </div>
            ) : (
              list.items.map((item) => {
                const isDeleting = deletingItems.has(item.id);
                const isEditing = editingItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg border bg-white transition-all",
                      item.isCompleted && !isEditing && "bg-gray-50 opacity-75",
                      isDeleting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isEditing ? (
                      // Edit Form
                      <form onSubmit={handleSaveEdit} className="p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Edit Item
                          </Label>
                          <div className="flex gap-1">
                            <Button
                              type="submit"
                              size="sm"
                              disabled={!editItemName.trim() || isUpdatingItem}
                              className="h-8 w-8 p-0"
                            >
                              {isUpdatingItem ? (
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
                              disabled={isUpdatingItem}
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
                              value={editItemName}
                              onChange={(e) => setEditItemName(e.target.value)}
                              disabled={isUpdatingItem}
                              className="h-8"
                            />
                          </div>
                          <div className="w-16">
                            <Input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={editItemQuantity}
                              onChange={(e) =>
                                setEditItemQuantity(e.target.value)
                              }
                              disabled={isUpdatingItem}
                              className="h-8"
                            />
                          </div>
                          <div className="w-20">
                            <Select
                              value={editItemUnit}
                              onValueChange={setEditItemUnit}
                              disabled={isUpdatingItem}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pcs">pcs</SelectItem>
                                <SelectItem value="g">g</SelectItem>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="L">L</SelectItem>
                                <SelectItem value="ml">ml</SelectItem>
                                <SelectItem value="pack">pack</SelectItem>
                                <SelectItem value="box">box</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </form>
                    ) : (
                      // Normal Item View
                      <div
                        className={cn(
                          "flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                        )}
                        onClick={() => !isDeleting && handleToggleItem(item)}
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
                            disabled={isDeleting}
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
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
      </DrawerContent>
    </Drawer>
  );
}
