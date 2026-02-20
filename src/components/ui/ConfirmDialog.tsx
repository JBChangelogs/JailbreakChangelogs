import React from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Button } from "@/components/ui/button";

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
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "destructive",
  confirmDisabled = false,
  closeOnConfirm = true,
  children,
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="modal-container border-button-info bg-secondary-bg w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
          <div className="modal-header border-border-card text-primary-text border-b px-6 py-4 text-xl font-semibold">
            {title}
          </div>

          <div className="modal-content p-6">
            {children ? (
              children
            ) : (
              <p className="text-secondary-text">{message}</p>
            )}
          </div>

          <div className="modal-footer flex justify-end gap-2 px-6 py-4">
            <Button variant="ghost" onClick={onClose} size="sm">
              {cancelText}
            </Button>
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
