"use client";

import { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/Spinner";
import TurnstileWidget from "../Turnstile/TurnstileWidget";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";

interface ScanInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  isScanning: boolean;
  bypassTurnstile?: boolean;
}

export default function ScanInventoryModal({
  isOpen,
  onClose,
  onSuccess,
  isScanning,
  bypassTurnstile = false,
}: ScanInventoryModalProps) {
  const hasBypassedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasBypassedRef.current = false;
      return;
    }

    if (bypassTurnstile && !isScanning && !hasBypassedRef.current) {
      hasBypassedRef.current = true;
      onSuccess("");
    }
  }, [isOpen, bypassTurnstile, isScanning, onSuccess]);

  const handleTurnstileSuccess = (token: string) => {
    // Automatically proceed with scan when token is obtained
    onSuccess(token);
  };

  const handleTurnstileError = () => {
    // Error handled by Turnstile widget
  };

  const handleTurnstileExpire = () => {
    // Token expired, user will need to retry
  };

  if (bypassTurnstile) return null;

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-secondary-bg max-w-md rounded-lg p-0 backdrop-blur-none"
        showClose
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text text-xl font-semibold">
            Verify You&apos;re Human
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6">
          {!siteKey ? (
            <div className="space-y-4">
              <p className="text-secondary-text">
                Turnstile is not configured. Please contact support.
              </p>
            </div>
          ) : (
            <>
              <p className="text-secondary-text mb-6 text-sm">
                Complete the security check below to request an on-demand
                inventory scan.
              </p>

              <div className="mb-6 flex justify-center">
                <TurnstileWidget
                  siteKey={siteKey}
                  onSuccess={handleTurnstileSuccess}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpire}
                  action="inventory_scan"
                  theme="auto"
                  size="normal"
                />
              </div>

              {isScanning && (
                <div className="text-secondary-text mb-4 flex items-center justify-center gap-2 text-sm">
                  <Spinner className="h-4 w-4" />
                  <span>Initiating scan...</span>
                </div>
              )}
            </>
          )}

          <DialogFooter className="mt-4 gap-2 pt-2">
            <DialogClose asChild>
              <Button
                disabled={isScanning}
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
