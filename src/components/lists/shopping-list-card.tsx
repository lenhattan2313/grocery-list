"use client";

import { useOptimistic, useTransition, memo } from "react";
import {
  useDeleteListMutation,
  useUpdateNameListMutation,
} from "@/hooks/use-lists-query";
import { Prisma } from "@prisma/client";
import { MoreVertical, Trash2, Edit, Share2 } from "lucide-react";
import { ClientRelativeTime } from "@/components/common/client-relative-time";
import { useSession } from "next-auth/react";
import { useHouseholdQuery } from "@/hooks/use-household-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { ShareListDialog } from "./share-list-dialog";
import { useDialog } from "@/components/common/dialog-service";

type ShoppingListWithItems = Prisma.ShoppingListGetPayload<{
  include: { items: true };
}>;

interface ShoppingListCardProps {
  list: ShoppingListWithItems;
  onViewList: (listId: string) => void;
  isPriority?: boolean;
}
const ShoppingListCardComponent = ({
  list,
  onViewList,
}: ShoppingListCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(list.name);
  const [isDeleting, startDeleteTransition] = useTransition();
  const { showDialog } = useDialog();
  const { data: session } = useSession();
  const { household } = useHouseholdQuery();
  const [, startTransition] = useTransition();
  const [optimisticList, setOptimisticList] = useOptimistic(
    list,
    (
      state,
      {
        isCompleted,
        name,
        items,
      }: {
        isCompleted?: boolean;
        name?: string;
        items?: ShoppingListWithItems["items"];
      }
    ) => ({
      ...state,
      isCompleted: isCompleted ?? state.isCompleted,
      name: name ?? state.name,
      items: items ?? state.items,
    })
  );

  const isOwner = session?.user?.id === optimisticList.userId;

  const deleteMutation = useDeleteListMutation();
  const updateMutation = useUpdateNameListMutation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const totalItems = optimisticList.items.length;
  const completedItemsCount = optimisticList.isCompleted
    ? totalItems
    : optimisticList.items.filter((item) => item.isCompleted).length;

  const progress =
    totalItems > 0 ? (completedItemsCount / totalItems) * 100 : 0;

  const handleDelete = () => {
    startDeleteTransition(() => {
      deleteMutation.mutate(optimisticList.id);
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(optimisticList.name);
  };

  const handleSave = () => {
    if (editedName.trim() === "" || editedName === optimisticList.name) {
      handleCancel();
      return;
    }
    startTransition(() => {
      setOptimisticList({ name: editedName });
      updateMutation.mutate({
        id: optimisticList.id,
        name: editedName,
      });
    });
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    showDialog({
      id: "share-list-dialog",
      title: "Share List",
      content: <ShareListDialog listId={optimisticList.id} />,
      showCloseButton: false,
    });
  };

  if (isDeleting) {
    return null; // Optimistically remove the card
  }

  const otherMembers = household?.members.filter(
    (member) => member.userId !== session?.user?.id
  );
  const canShare =
    isOwner && household && otherMembers && otherMembers.length > 0;

  return (
    <div onClick={() => onViewList(optimisticList.id)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            {isEditing ? (
              <div className="flex w-full items-center gap-2">
                <Input
                  ref={inputRef}
                  value={editedName}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8"
                />
              </div>
            ) : (
              <CardTitle className="truncate">{optimisticList.name}</CardTitle>
            )}

            {!isEditing && isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Open menu"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <CardDescription>
            {totalItems} items &middot; Updated{" "}
            <ClientRelativeTime date={new Date(optimisticList.updatedAt)} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {completedItemsCount} / {totalItems} completed
            </span>
            {optimisticList.isCompleted ? (
              <Badge variant="secondary">Completed</Badge>
            ) : (
              <Badge variant="outline">In Progress</Badge>
            )}
          </div>
          <Progress value={progress} className="mt-2" aria-label="Progress" />
        </CardContent>
        <CardFooter className="flex justify-between">
          {isEditing ? (
            <div className="flex w-full justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                aria-label="Save"
              >
                Save
              </Button>
            </div>
          ) : (
            <div />
          )}
          {canShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareClick}
              aria-label="Share list"
              className="ml-2"
            >
              <Share2 className="mr-2 h-4 w-4" />
              <span>Share</span>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
function areEqual(
  prevProps: ShoppingListCardProps,
  nextProps: ShoppingListCardProps
) {
  return (
    prevProps.list.id === nextProps.list.id &&
    prevProps.list.name === nextProps.list.name &&
    prevProps.list.isCompleted === nextProps.list.isCompleted &&
    prevProps.list.items.length === nextProps.list.items.length &&
    prevProps.list.updatedAt === nextProps.list.updatedAt &&
    prevProps.onViewList === nextProps.onViewList
  );
}

export const ShoppingListCard = memo(ShoppingListCardComponent, areEqual);
