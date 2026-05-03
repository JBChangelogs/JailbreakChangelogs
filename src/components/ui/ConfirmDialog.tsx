import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  confirmDisabled?: boolean;
  closeOnConfirm?: boolean;
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmVariant = "destructive",
  confirmDisabled = false,
  closeOnConfirm = true,
  children,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showClose
        className="bg-secondary-bg max-w-md rounded-lg p-0 backdrop-blur-none"
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text text-left text-xl font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6">
          {children ? (
            children
          ) : (
            <p className="text-secondary-text text-sm">{message}</p>
          )}

          <DialogFooter className="mt-4 gap-2 px-0 pt-2 pb-0">
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (confirmDisabled) return;
                onConfirm();
                if (closeOnConfirm) onClose();
              }}
              variant={confirmVariant}
              size="sm"
              disabled={confirmDisabled}
            >
              {confirmText}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
