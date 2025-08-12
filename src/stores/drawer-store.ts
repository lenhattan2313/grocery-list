import { create } from "zustand";
import { ReactNode } from "react";

/**
 * Generic Drawer Service
 *
 * This service provides a centralized way to manage drawer state across the application.
 * It follows the same pattern as the dialog service but for drawers.
 *
 * Usage Examples:
 *
 * 1. Show a drawer with custom content:
 *    drawerService.showDrawer({
 *      id: "custom-content",
 *      type: "custom",
 *      content: <MyCustomComponent />
 *    });
 *
 * 2. Show a drawer with a specific component:
 *    drawerService.showDrawer({
 *      id: "recipe-form",
 *      type: "recipe-form",
 *      content: (
 *        <RecipeFormDrawer
 *          mode="add"
 *          open={true}
 *          onOpenChange={(open) => {
 *            if (!open) drawerService.hideDrawer();
 *          }}
 *          onSubmit={handleSubmit}
 *        />
 *      )
 *    });
 *

 *
  * 3. Close a drawer:
 *    drawerService.hideDrawer("drawer-id");
 * 
 * 4. Close the active drawer:
 *    drawerService.hideDrawer();
 */

export interface DrawerConfig {
  id: string;
  type: string;
  title?: string;
  content?: ReactNode;
  props?: Record<string, unknown>;
  onClose?: () => void;
}

interface DrawerState {
  drawers: Map<string, DrawerConfig>;
  activeDrawer: string | null;
  isOpen: boolean;
}

interface DrawerActions {
  showDrawer: (config: DrawerConfig) => void;
  hideDrawer: (id?: string) => void;
  updateDrawer: (id: string, updates: Partial<DrawerConfig>) => void;
  clearAllDrawers: () => void;
  getActiveDrawer: () => DrawerConfig | null;
}

type DrawerStore = DrawerState & DrawerActions;

export const useDrawerStore = create<DrawerStore>((set, get) => ({
  // State
  drawers: new Map(),
  activeDrawer: null,
  isOpen: false,

  // Actions
  showDrawer: (config: DrawerConfig) => {
    set((state) => {
      const newDrawers = new Map(state.drawers);
      newDrawers.set(config.id, config);

      return {
        drawers: newDrawers,
        activeDrawer: config.id,
        isOpen: true,
      };
    });
  },

  hideDrawer: (id?: string) => {
    const { activeDrawer, drawers } = get();
    const drawerId = id || activeDrawer;

    if (!drawerId) return;

    const drawer = drawers.get(drawerId);
    if (drawer?.onClose) {
      drawer.onClose();
    }

    set((state) => {
      const newDrawers = new Map(state.drawers);
      newDrawers.delete(drawerId);

      return {
        drawers: newDrawers,
        activeDrawer: null,
        isOpen: false,
      };
    });
  },

  updateDrawer: (id: string, updates: Partial<DrawerConfig>) => {
    set((state) => {
      const newDrawers = new Map(state.drawers);
      const existingDrawer = newDrawers.get(id);

      if (existingDrawer) {
        newDrawers.set(id, { ...existingDrawer, ...updates });
      }

      return {
        drawers: newDrawers,
      };
    });
  },

  clearAllDrawers: () => {
    set({
      drawers: new Map(),
      activeDrawer: null,
      isOpen: false,
    });
  },

  getActiveDrawer: () => {
    const { activeDrawer, drawers } = get();
    return activeDrawer ? drawers.get(activeDrawer) || null : null;
  },
}));

// Convenience functions for common drawer patterns
export const drawerService = {
  showDrawer: (config: DrawerConfig) =>
    useDrawerStore.getState().showDrawer(config),
  hideDrawer: (id?: string) => useDrawerStore.getState().hideDrawer(id),
  updateDrawer: (id: string, updates: Partial<DrawerConfig>) =>
    useDrawerStore.getState().updateDrawer(id, updates),
};
