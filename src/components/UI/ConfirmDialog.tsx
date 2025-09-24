import React from "react";
import { Dialog } from "@headlessui/react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-500 hover:bg-red-600",
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="modal-container bg-secondary-bg border-button-info w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text px-6 py-4 text-xl font-semibold">
            {title}
          </div>

          <div className="modal-content p-6">
            <p className="text-secondary-text mb-6">{message}</p>
          </div>

          <div className="modal-footer flex justify-end gap-2 px-6 py-4">
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-primary-text cursor-pointer rounded border-none bg-transparent px-4 py-2 text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors ${confirmButtonClass}`}
            >
              {confirmText}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
