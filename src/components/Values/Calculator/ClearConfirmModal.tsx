import React from "react";
import { TradeItem } from "@/types/trading";
import { safeLocalStorage } from "@/utils/safeStorage";

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  offeringItems: TradeItem[];
  requestingItems: TradeItem[];
  setOfferingItems: React.Dispatch<React.SetStateAction<TradeItem[]>>;
  setRequestingItems: React.Dispatch<React.SetStateAction<TradeItem[]>>;
  saveItemsToLocalStorage: (
    offering: TradeItem[],
    requesting: TradeItem[],
  ) => void;
  handleStartNew: () => void;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onClose,
  offeringItems,
  requestingItems,
  setOfferingItems,
  setRequestingItems,
  saveItemsToLocalStorage,
  handleStartNew,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="modal-container border-button-info bg-secondary-bg mx-auto w-full max-w-sm rounded-lg border p-6 shadow-lg">
          <div className="modal-header text-primary-text mb-2 text-xl font-semibold">
            Clear Calculator?
          </div>
          <div className="modal-content mb-6">
            <p className="text-secondary-text">
              Choose what to clear. This action cannot be undone.
            </p>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                setOfferingItems([]);
                if (requestingItems.length === 0) {
                  safeLocalStorage.removeItem("calculatorItems");
                } else {
                  saveItemsToLocalStorage([], requestingItems);
                }
                onClose();
              }}
              className="bg-button-success/10 hover:bg-button-success/20 border-button-success text-button-success w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:cursor-pointer"
            >
              Clear Offering
            </button>
            <button
              onClick={() => {
                setRequestingItems([]);
                if (offeringItems.length === 0) {
                  safeLocalStorage.removeItem("calculatorItems");
                } else {
                  saveItemsToLocalStorage(offeringItems, []);
                }
                onClose();
              }}
              className="bg-button-danger/10 hover:bg-button-danger/20 border-button-danger text-button-danger w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:cursor-pointer"
            >
              Clear Requesting
            </button>
            <button
              onClick={() => {
                handleStartNew();
              }}
              className="bg-button-danger text-form-button-text hover:bg-button-danger-hover w-full rounded-md px-4 py-2 text-sm font-medium transition-colors hover:cursor-pointer"
            >
              Clear Both
            </button>
          </div>
          <div className="modal-footer flex justify-end">
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-primary-text cursor-pointer rounded border-none bg-transparent px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
