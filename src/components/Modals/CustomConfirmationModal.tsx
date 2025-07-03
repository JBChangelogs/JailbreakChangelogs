import React from 'react';

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
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-[#212A31] rounded-lg p-6 border border-[#2E3944] shadow-lg max-w-sm w-full mx-4">
        <h2 className="text-muted text-xl font-medium mb-4">{title}</h2>
        <p className="text-muted/70 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-[#2E3944] text-muted hover:bg-[#2E3944] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}; 