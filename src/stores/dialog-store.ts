import { create } from "zustand";
import { ReactNode } from "react";

export interface DialogButton {
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export interface DialogConfig {
  id: string;
  title: string;
  content: ReactNode;
  buttons?: DialogButton[];
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  showCloseButton?: boolean;
  onClose?: () => void;
}

interface DialogState {
  dialogs: Map<string, DialogConfig>;
  activeDialog: string | null;
  isOpen: boolean;
}

interface DialogActions {
  showDialog: (config: DialogConfig) => void;
  hideDialog: (id?: string) => void;
  updateDialog: (id: string, updates: Partial<DialogConfig>) => void;
  clearAllDialogs: () => void;
  getActiveDialog: () => DialogConfig | null;
}

type DialogStore = DialogState & DialogActions;

export const useDialogStore = create<DialogStore>((set, get) => ({
  // State
  dialogs: new Map(),
  activeDialog: null,
  isOpen: false,

  // Actions
  showDialog: (config: DialogConfig) => {
    set((state) => {
      const newDialogs = new Map(state.dialogs);
      newDialogs.set(config.id, config);

      return {
        dialogs: newDialogs,
        activeDialog: config.id,
        isOpen: true,
      };
    });
  },

  hideDialog: (id?: string) => {
    const { activeDialog, dialogs } = get();
    const dialogId = id || activeDialog;

    if (!dialogId) return;

    const dialog = dialogs.get(dialogId);
    if (dialog?.onClose) {
      dialog.onClose();
    }

    set((state) => {
      const newDialogs = new Map(state.dialogs);
      newDialogs.delete(dialogId);

      return {
        dialogs: newDialogs,
        activeDialog: null,
        isOpen: false,
      };
    });
  },

  updateDialog: (id: string, updates: Partial<DialogConfig>) => {
    set((state) => {
      const newDialogs = new Map(state.dialogs);
      const existingDialog = newDialogs.get(id);

      if (existingDialog) {
        newDialogs.set(id, { ...existingDialog, ...updates });
      }

      return {
        dialogs: newDialogs,
      };
    });
  },

  clearAllDialogs: () => {
    set({
      dialogs: new Map(),
      activeDialog: null,
      isOpen: false,
    });
  },

  getActiveDialog: () => {
    const { activeDialog, dialogs } = get();
    return activeDialog ? dialogs.get(activeDialog) || null : null;
  },
}));

// Convenience functions for common dialog patterns
export const dialogService = {
  showDialog: (config: DialogConfig) =>
    useDialogStore.getState().showDialog(config),
  hideDialog: (id?: string) => useDialogStore.getState().hideDialog(id),
  updateDialog: (id: string, updates: Partial<DialogConfig>) =>
    useDialogStore.getState().updateDialog(id, updates),

  // Common dialog presets
  showConfirmDialog: (config: {
    id: string;
    title: string;
    content: ReactNode;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: DialogButton["variant"];
  }) => {
    const {
      id,
      title,
      content,
      onConfirm,
      onCancel,
      confirmText = "Confirm",
      cancelText = "Cancel",
      confirmVariant = "default",
    } = config;

    useDialogStore.getState().showDialog({
      id,
      title,
      content,
      buttons: [
        {
          label: cancelText,
          onClick: onCancel || (() => dialogService.hideDialog(id)),
          variant: "outline",
        },
        {
          label: confirmText,
          onClick: () => {
            onConfirm();
            dialogService.hideDialog(id);
          },
          variant: confirmVariant,
        },
      ],
    });
  },

  showFormDialog: (config: {
    id: string;
    title: string;
    content: ReactNode;
    buttons: DialogButton[];
    onClose?: () => void;
  }) => {
    useDialogStore.getState().showDialog({
      ...config,
      maxWidth: "md",
    });
  },
};
