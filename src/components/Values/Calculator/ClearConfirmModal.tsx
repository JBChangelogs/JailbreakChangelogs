import React from "react";
import { TradeItem } from "@/types/trading";
import { safeLocalStorage } from "@/utils/safeStorage";
import { Button } from "../../ui/button";

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
        <div className="modal-container border-border-card bg-secondary-bg mx-auto w-full max-w-sm rounded-lg border p-6 shadow-lg">
          <div className="modal-header text-primary-text mb-2 text-xl font-bold">
            Clear Calculator?
          </div>
          <div className="modal-content mb-6">
            <p className="text-secondary-text text-sm">
              Choose what to clear. This action cannot be undone.
            </p>
          </div>
          <div className="mb-4 flex flex-col gap-3">
            <Button
              onClick={() => {
                setOfferingItems([]);
                if (requestingItems.length === 0) {
                  safeLocalStorage.removeItem("calculatorItems");
                } else {
                  saveItemsToLocalStorage([], requestingItems);
                }
                onClose();
              }}
              variant="outline"
              className="border-button-success text-button-success hover:bg-button-success/10"
            >
              Clear Offering
            </Button>
            <Button
              onClick={() => {
                setRequestingItems([]);
                if (offeringItems.length === 0) {
                  safeLocalStorage.removeItem("calculatorItems");
                } else {
                  saveItemsToLocalStorage(offeringItems, []);
                }
                onClose();
              }}
              variant="outline"
              className="border-button-danger text-button-danger hover:bg-button-danger/10"
            >
              Clear Requesting
            </Button>
            <Button
              onClick={() => {
                handleStartNew();
              }}
              variant="destructive"
            >
              Clear Both
            </Button>
          </div>
          <div className="modal-footer flex justify-end pt-2">
            <Button variant="ghost" onClick={onClose} className="px-4">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
