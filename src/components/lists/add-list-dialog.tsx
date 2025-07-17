"use client";

import { useState } from "react";
import { useCreateListMutation } from "@/hooks/use-lists-query";
import { dialogService } from "@/stores/dialog-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";

interface AddListFormProps {
  onSubmit: (name: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function AddListForm({ onSubmit, onCancel, isSubmitting }: AddListFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
    setName("");
  };

  const handleCancel = () => {
    onCancel();
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
        <Button type="submit" disabled={!name.trim() || isSubmitting}>
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

function AddListDialogWrapper() {
  const mutation = useCreateListMutation();

  const handleSubmit = (name: string) => {
    mutation.mutate(name, {
      onSuccess: () => {
        dialogService.hideDialog("add-list");
      },
    });
  };

  const handleCancel = () => {
    dialogService.hideDialog("add-list");
  };

  return (
    <AddListForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={mutation.isPending}
    />
  );
}

export function showAddListDialog() {
  dialogService.showDialog({
    id: "add-list",
    title: "Create a New Shopping List",
    content: <AddListDialogWrapper />,
    maxWidth: "md",
  });
}
