import React from 'react';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

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

export const CustomConfirmationModal: React.FC<CustomConfirmationModalProps> = ({
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="mx-auto w-full max-w-sm rounded-lg bg-[#212A31] p-6 shadow-xl border border-[#5865F2]">
          <h2 className="text-white text-xl font-semibold mb-4">{title}</h2>
          <p className="text-muted/80 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="rounded-md border border-[#37424D] px-4 py-2 text-sm font-medium text-muted hover:bg-[#2E3944] hover:text-white transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4] transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 