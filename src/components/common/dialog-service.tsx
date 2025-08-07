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
import { Skeleton } from "@/components/ui/skeleton";

const maxWidthClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  full: "sm:max-w-full",
};

// Loading skeleton component for dialogs
function DialogLoadingSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2 mx-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex justify-end space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function DialogService() {
  const { isOpen, getActiveDialog, hideDialog } = useDialogStore();
  const activeDialog = getActiveDialog();

  if (!activeDialog || !isOpen) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      hideDialog();
    }
  };

  // Get the appropriate max-width class, defaulting to md for better initial sizing
  const maxWidthClass = activeDialog.maxWidth
    ? maxWidthClasses[activeDialog.maxWidth]
    : "sm:max-w-md";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          maxWidthClass,
          "max-h-[80vh] overflow-hidden flex flex-col min-w-[320px] w-full"
        )}
        showCloseButton={activeDialog.showCloseButton !== false}
      >
        <DialogHeader>
          <DialogTitle>{activeDialog.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {activeDialog.content}
        </div>

        {activeDialog.buttons && activeDialog.buttons.length > 0 && (
          <DialogFooter>
            {activeDialog.buttons.map((button, index) => (
              <Button
                key={index}
                variant={button.variant || "default"}
                onClick={button.onClick}
                disabled={button.disabled}
                className={cn(button.loading && "min-w-[100px]")}
                aria-label={button.label}
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

// Export the loading skeleton for use in dynamic imports
export { DialogLoadingSkeleton };
