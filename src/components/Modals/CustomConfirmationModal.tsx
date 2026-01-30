import React from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Button } from "../ui/button";

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
        <DialogPanel className="modal-container border-border-primary bg-secondary-bg w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text border-border-primary border-b px-6 py-4 text-xl font-bold">
            {title}
          </div>

          <div className="modal-content px-6 py-6">
            <p className="text-secondary-text text-base leading-relaxed">
              {message}
            </p>
          </div>

          <div className="modal-footer bg-primary-bg/50 flex justify-end gap-3 px-6 py-4">
            <Button variant="secondary" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button variant="default" onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
