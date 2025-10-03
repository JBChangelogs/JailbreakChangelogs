import React from "react";
import { Dialog, DialogPanel } from "@headlessui/react";

interface CustomConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CustomConfirmationModal: React.FC<
  CustomConfirmationModalProps
> = ({
  open,
  onClose,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="modal-container bg-secondary-bg border-button-info w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text px-6 py-4 text-xl font-semibold">
            {title}
          </div>

          <div className="modal-content px-6 pb-4">
            <p className="text-secondary-text">{message}</p>
          </div>

          <div className="modal-footer flex justify-end gap-2 px-6 py-4">
            <button
              type="button"
              onClick={onCancel}
              className="text-secondary-text hover:text-primary-text cursor-pointer rounded border-none bg-transparent px-4 py-2 text-sm"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="bg-button-info text-form-button-text min-w-[100px] cursor-pointer rounded border-none px-4 py-2 text-sm"
            >
              {confirmText}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
