import React from "react";
import { TradeItem } from "@/types/trading";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showClose
        className="bg-secondary-bg max-w-sm rounded-lg p-0 backdrop-blur-none"
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text text-left text-xl font-bold">
            Clear Calculator?
          </DialogTitle>
          <DialogDescription className="text-secondary-text mt-1 text-left text-sm">
            Choose what to clear. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6">
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
              className="border-button-success! text-button-success! bg-button-success/10! hover:bg-button-success/20! active:bg-button-success/20!"
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
              className="border-button-danger! text-button-danger! bg-button-danger/10! hover:bg-button-danger/20! active:bg-button-danger/20!"
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

          <DialogFooter className="mt-4 gap-2 px-0 pt-2 pb-0">
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
