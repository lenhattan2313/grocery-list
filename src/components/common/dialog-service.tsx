"use client";

import { useDialogStore } from "@/stores/dialog-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const maxWidthClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  full: "sm:max-w-full",
};

export function DialogService() {
  const { isOpen, getActiveDialog, hideDialog } = useDialogStore();
  const activeDialog = getActiveDialog();

  if (!activeDialog || !isOpen) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      hideDialog();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          activeDialog.maxWidth && maxWidthClasses[activeDialog.maxWidth],
          "max-h-[80vh] overflow-hidden flex flex-col"
        )}
        showCloseButton={activeDialog.showCloseButton !== false}
      >
        <DialogHeader>
          <DialogTitle>{activeDialog.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">{activeDialog.content}</div>

        {activeDialog.buttons && activeDialog.buttons.length > 0 && (
          <DialogFooter>
            {activeDialog.buttons.map((button, index) => (
              <Button
                key={index}
                variant={button.variant || "default"}
                onClick={button.onClick}
                disabled={button.disabled}
                className={cn(button.loading && "min-w-[100px]")}
              >
                {button.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {button.label}
                  </>
                ) : (
                  <>
                    {button.icon && <span className="mr-2">{button.icon}</span>}
                    {button.label}
                  </>
                )}
              </Button>
            ))}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage in components
export function useDialog() {
  const { showDialog, hideDialog, updateDialog } = useDialogStore();

  return {
    showDialog,
    hideDialog,
    updateDialog,
  };
}
