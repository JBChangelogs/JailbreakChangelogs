import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-red-500 hover:bg-red-600'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-[#212A31] rounded-lg border border-[#2E3944] w-full max-w-md mx-4 p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-muted">{title}</h3>
          <p className="text-muted">{message}</p>
          
          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-muted hover:text-white transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${confirmButtonClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 