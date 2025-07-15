"use client";

import { useState } from "react";
import { useListsStore } from "@/stores/lists-store";
import { dialogService } from "@/stores/dialog-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";

interface AddListFormProps {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

function AddListForm({
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: AddListFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit(name.trim());
    setName("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="list-name">List Name</Label>
          <Input
            id="list-name"
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
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="min-w-[100px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create List
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function showAddListDialog() {
  let isSubmitting = false;

  const updateSubmittingState = (submitting: boolean) => {
    isSubmitting = submitting;
    // Update the dialog content with new submitting state
    dialogService.updateDialog("add-list", {
      content: (
        <AddListForm
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
      await useListsStore.getState().createList(name);
      dialogService.hideDialog("add-list");
    } catch (error) {
      console.error("Failed to create list:", error);
    } finally {
      updateSubmittingState(false);
    }
  };

  const handleCancel = () => {
    dialogService.hideDialog("add-list");
  };

  dialogService.showDialog({
    id: "add-list",
    title: "Create New Shopping List",
    content: (
      <AddListForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        error={useListsStore.getState().error}
      />
    ),
    maxWidth: "md",
  });
}

export function AddListButton() {
  return (
    <Button onClick={showAddListDialog} className="gap-2">
      <Plus className="h-4 w-4" />
      New List
    </Button>
  );
}
