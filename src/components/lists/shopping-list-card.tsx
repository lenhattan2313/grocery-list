"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getProgressColors } from "@/lib/utils";
import { dialogService } from "@/stores/dialog-store";
import { ShoppingList, useListsStore } from "@/stores/lists-store";
import { Edit, MoreVertical, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";

interface ShoppingListCardProps {
  list: ShoppingList;
  onEditList?: (list: ShoppingList) => void;
  onViewList?: (list: ShoppingList) => void;
}

export function ShoppingListCard({
  list,
  onEditList,
  onViewList,
}: ShoppingListCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteList, getListProgress } = useListsStore();

  const progress = getListProgress(list.id);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteList(list.id);
    } catch (error) {
      console.error("Failed to delete list:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const showDeleteConfirmation = () => {
    dialogService.showConfirmDialog({
      id: "delete-list",
      title: "Delete Shopping List",
      content: (
        <div className="space-y-2">
          <p>
            Are you sure you want to delete &quot;<strong>{list.name}</strong>
            &quot;?
          </p>
          <p className="text-sm text-gray-600">
            This action cannot be undone. All items in this list will be
            permanently removed.
          </p>
        </div>
      ),
      onConfirm: handleDelete,
      confirmText: "Delete",
      confirmVariant: "destructive",
      cancelText: "Cancel",
    });
  };

  const handleCardClick = () => {
    if (onViewList) {
      onViewList(list);
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        list.isCompleted && "p-0"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className={cn("pb-3", list.isCompleted && "p-3 pl-6")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-gray-500" />
            <CardTitle
              className={cn(
                "text-lg",
                list.isCompleted && "line-through text-gray-500"
              )}
            >
              {list.name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {list.isCompleted && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                Completed
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditList?.(list);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit List
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    showDeleteConfirmation();
                  }}
                  className="flex items-center gap-2 text-red-600"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete List"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      {!list.isCompleted && (
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {progress.completed} of {progress.total} items completed
              </span>
              <span
                className={cn(
                  "font-medium",
                  getProgressColors(progress.percentage).textColor
                )}
              >
                {Math.round(progress.percentage)}%
              </span>
            </div>

            {list.items.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No items yet. Click to add some!
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-400">
                Created{" "}
                {new Date(list.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
