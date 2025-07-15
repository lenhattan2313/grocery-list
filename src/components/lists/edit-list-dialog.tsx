"use client";

import { useState, useEffect } from "react";
import { ShoppingList, useListsStore } from "@/stores/lists-store";
import { dialogService } from "@/stores/dialog-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Loader2 } from "lucide-react";

interface EditListFormProps {
  list: ShoppingList;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

function EditListForm({
  list,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: EditListFormProps) {
  const [name, setName] = useState(list.name);

  useEffect(() => {
    setName(list.name);
  }, [list.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit(name.trim());
  };

  const handleCancel = () => {
    setName(list.name);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="edit-list-name">List Name</Label>
          <Input
            id="edit-list-name"
            placeholder="e.g., Weekly Groceries"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            disabled={isSubmitting}
            autoFocus
          />
        </div>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!name.trim() || isSubmitting || name === list.name}
          className="min-w-[100px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function showEditListDialog(list: ShoppingList) {
  let isSubmitting = false;

  const updateSubmittingState = (submitting: boolean) => {
    isSubmitting = submitting;
    // Update the dialog content with new submitting state
    dialogService.updateDialog("edit-list", {
      content: (
        <EditListForm
          list={list}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          error={useListsStore.getState().error}
        />
      ),
    });
  };

  const handleSubmit = async (name: string) => {
    updateSubmittingState(true);
    try {
      await useListsStore.getState().updateList(list.id, { name });
      dialogService.hideDialog("edit-list");
    } catch (error) {
      console.error("Failed to update list:", error);
    } finally {
      updateSubmittingState(false);
    }
  };

  const handleCancel = () => {
    dialogService.hideDialog("edit-list");
  };

  dialogService.showDialog({
    id: "edit-list",
    title: "Edit Shopping List",
    content: (
      <EditListForm
        list={list}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        error={useListsStore.getState().error}
      />
    ),
    maxWidth: "md",
  });
}

// Legacy component for backward compatibility
// This can be removed once all usages are updated
interface EditListDialogProps {
  list: ShoppingList | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditListDialog({
  list,
  open,
  onOpenChange,
}: EditListDialogProps) {
  useEffect(() => {
    if (open && list) {
      showEditListDialog(list);
      // Close the legacy dialog state
      onOpenChange(false);
    }
  }, [open, list, onOpenChange]);

  // This component no longer renders anything
  // The actual dialog is handled by the DialogService
  return null;
}
