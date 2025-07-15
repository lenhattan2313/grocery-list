"use client";

import { useState } from "react";
import { dialogService } from "@/stores/dialog-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

/**
 * Example component demonstrating various dialog service usage patterns
 */
export function DialogExamples() {
  const [isProcessing, setIsProcessing] = useState(false);

  // Example 1: Simple confirmation dialog
  const showSimpleConfirmation = () => {
    dialogService.showConfirmDialog({
      id: "simple-confirm",
      title: "Confirm Action",
      content: "Are you sure you want to proceed?",
      onConfirm: () => {
        console.log("User confirmed!");
      },
    });
  };

  // Example 2: Destructive confirmation dialog
  const showDestructiveConfirmation = () => {
    dialogService.showConfirmDialog({
      id: "destructive-confirm",
      title: "Delete Item",
      content: (
        <div className="space-y-2">
          <p>This action cannot be undone.</p>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this item?
          </p>
        </div>
      ),
      onConfirm: () => {
        console.log("Item deleted!");
      },
      confirmText: "Delete",
      confirmVariant: "destructive",
      cancelText: "Cancel",
    });
  };

  // Example 3: Form dialog with custom buttons
  const showFormDialog = () => {
    let formData = { name: "", email: "" };

    const handleSubmit = async () => {
      setIsProcessing(true);

      // Update dialog to show loading state
      dialogService.updateDialog("form-dialog", {
        buttons: [
          {
            label: "Cancel",
            onClick: () => dialogService.hideDialog("form-dialog"),
            variant: "outline",
            disabled: true,
          },
          {
            label: "Saving...",
            onClick: () => {},
            loading: true,
            disabled: true,
          },
        ],
      });

      // Simulate API call
      setTimeout(() => {
        setIsProcessing(false);
        dialogService.hideDialog("form-dialog");
        console.log("Form submitted:", formData);
      }, 2000);
    };

    const handleCancel = () => {
      dialogService.hideDialog("form-dialog");
    };

    dialogService.showDialog({
      id: "form-dialog",
      title: "User Information",
      content: (
        <FormContent
          onDataChange={(data) => {
            formData = data;
          }}
        />
      ),
      buttons: [
        {
          label: "Cancel",
          onClick: handleCancel,
          variant: "outline",
        },
        {
          label: "Save",
          onClick: handleSubmit,
          icon: <CheckCircle className="h-4 w-4" />,
        },
      ],
      maxWidth: "md",
    });
  };

  // Example 4: Complex dialog with multiple actions
  const showComplexDialog = () => {
    dialogService.showDialog({
      id: "complex-dialog",
      title: "Project Settings",
      content: (
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-3">
              These actions are irreversible and will permanently affect your
              project.
            </p>
            <div className="space-y-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  dialogService.hideDialog("complex-dialog");
                  showDestructiveConfirmation();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Export Options</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("Exporting as JSON...");
                }}
              >
                Export as JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("Exporting as CSV...");
                }}
              >
                Export as CSV
              </Button>
            </div>
          </div>
        </div>
      ),
      buttons: [
        {
          label: "Close",
          onClick: () => dialogService.hideDialog("complex-dialog"),
          variant: "outline",
        },
      ],
      maxWidth: "lg",
    });
  };

  // Example 5: Info dialog (no buttons)
  const showInfoDialog = () => {
    dialogService.showDialog({
      id: "info-dialog",
      title: "Information",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <span className="font-medium">System Update</span>
          </div>
          <p className="text-sm text-gray-600">
            The system will be updated tonight at 2:00 AM. Expected downtime is
            30 minutes.
          </p>
        </div>
      ),
      maxWidth: "md",
    });
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Dialog Service Examples</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button onClick={showSimpleConfirmation} variant="outline">
          Simple Confirmation
        </Button>

        <Button onClick={showDestructiveConfirmation} variant="destructive">
          Destructive Confirmation
        </Button>

        <Button onClick={showFormDialog} variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Form Dialog
        </Button>

        <Button onClick={showComplexDialog} variant="secondary">
          <Edit className="h-4 w-4 mr-2" />
          Complex Dialog
        </Button>

        <Button onClick={showInfoDialog} variant="outline">
          <AlertCircle className="h-4 w-4 mr-2" />
          Info Dialog
        </Button>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Benefits:</h3>
        <ul className="text-sm space-y-1">
          <li>• No need for useState to manage dialog state</li>
          <li>• Consistent dialog styling across the app</li>
          <li>• Easy to show dialogs from anywhere in the app</li>
          <li>• Built-in loading states and button variants</li>
          <li>• Centralized dialog management</li>
        </ul>
      </div>
    </div>
  );
}

// Helper component for form dialog example
function FormContent({ onDataChange }: { onDataChange: (data: any) => void }) {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataChange(newData);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter your name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
      </div>
    </div>
  );
}
