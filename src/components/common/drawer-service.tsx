"use client";

import { useDrawerStore } from "@/stores/drawer-store";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

export function DrawerService() {
  const { isOpen, getActiveDrawer, hideDrawer } = useDrawerStore();
  const activeDrawer = getActiveDrawer();

  if (!activeDrawer || !isOpen) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      hideDrawer();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent>{activeDrawer.content}</DrawerContent>
    </Drawer>
  );
}

// Hook for easier usage in components
export function useDrawer() {
  const { showDrawer, hideDrawer, updateDrawer } = useDrawerStore();

  return {
    showDrawer,
    hideDrawer,
    updateDrawer,
  };
}
