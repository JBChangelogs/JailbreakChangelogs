import React from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  confirmDisabled?: boolean;
  closeOnConfirm?: boolean;
  zIndexClassName?: string;
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmVariant = "destructive",
  confirmDisabled = false,
  closeOnConfirm = true,
  zIndexClassName = "z-50",
  children,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className={`relative ${zIndexClassName}`}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="border-border-card bg-secondary-bg hover:border-border-focus relative w-full max-w-md rounded-lg border shadow-xl">
          <div className="border-border-card flex items-center justify-between border-b p-4">
            <h2 className="text-primary-text text-xl font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg focus-visible:ring-ring inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <Icon icon="heroicons:x-mark" className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {children ? (
              children
            ) : (
              <p className="text-secondary-text">{message}</p>
            )}
          </div>

          <div className="border-border-card flex justify-end gap-2 border-t p-4">
            <Button
              onClick={() => {
                if (confirmDisabled) return;
                onConfirm();
                if (closeOnConfirm) onClose();
              }}
              variant={confirmVariant}
              size="sm"
              disabled={confirmDisabled}
            >
              {confirmText}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
