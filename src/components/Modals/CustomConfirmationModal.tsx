import React from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

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
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) => {
  useLockBodyScroll(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="mx-auto w-full max-w-sm rounded-lg border border-[#5865F2] bg-[#212A31] p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
          <p className="text-muted/80 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="text-muted rounded-md border border-[#37424D] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#2E3944] hover:text-white"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
