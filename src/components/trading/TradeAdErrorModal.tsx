"use client";

import React from "react";
import { Dialog, DialogPanel } from "@headlessui/react";

interface TradeAdErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: string[];
}

export const TradeAdErrorModal: React.FC<TradeAdErrorModalProps> = ({
  isOpen,
  onClose,
  errors,
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="modal-container border-button-info bg-secondary-bg w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text px-6 py-4 text-xl font-semibold">
            Trade Ad Validation Errors
          </div>

          <div className="modal-content p-6">
            <div className="space-y-3">
              {errors.map((error, index) => (
                <div key={index} className="text-primary-text text-sm">
                  {error}
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer flex justify-end gap-2 px-6 py-4">
            <button
              onClick={onClose}
              className="border-border-card bg-button-info text-primary-text hover:bg-button-info-hover rounded-lg border px-4 py-2 text-sm font-medium focus:outline-none"
            >
              Close
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
