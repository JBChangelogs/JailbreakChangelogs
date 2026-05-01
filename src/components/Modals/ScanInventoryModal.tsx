"use client";

import { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/Spinner";
import TurnstileWidget from "../Turnstile/TurnstileWidget";

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

  if (!isOpen) return null;
  if (bypassTurnstile) return null;

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-secondary-bg border-border-card w-full max-w-md rounded-lg border p-6">
          <h2 className="text-primary-text mb-4 text-xl font-semibold">
            Configuration Error
          </h2>
          <p className="text-secondary-text mb-4">
            Turnstile is not configured. Please contact support.
          </p>
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-secondary-bg border-border-card shadow-card-shadow w-full max-w-md rounded-lg border p-6">
        <h2 className="text-primary-text mb-2 text-xl font-semibold">
          Verify You&apos;re Human
        </h2>
        <p className="text-secondary-text mb-6 text-sm">
          Complete the security check below to request an on-demand inventory
          scan.
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

        <Button
          onClick={onClose}
          disabled={isScanning}
          variant="secondary"
          size="md"
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
